// Input: IPC handler 调用 (sendMessage/createSession/respondPermission 等), WindowManager, notificationManager
// Output: CLI 子进程管理、NDJSON 解析、事件路由到多 BrowserWindow, 系统通知 + dock badge
// Pos: electron/backend — CLI 进程生命周期管理核心
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { ChildProcess, spawn } from 'node:child_process';
import { createInterface, type Interface as ReadlineInterface } from 'node:readline';
import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { app, BrowserWindow } from 'electron';
import { notificationManager } from '../notification';
import { windowManager } from '../window-manager';
import type {
  SDKMessage, SDKStreamEvent, SDKControlRequest, SDKResultMessage,
  SDKToolResultMessage, CLIInput, UserInput, ControlResponse,
  SessionState, SessionInfo, ContentBlock,
} from './types';

// ---------------------------------------------------------------------------
// Respawn configuration
// ---------------------------------------------------------------------------

const RESPAWN_MAX_RETRIES = 5;
const RESPAWN_BASE_DELAY_MS = 1000; // Exponential backoff: 1s, 2s, 4s, 8s, 16s

// ---------------------------------------------------------------------------
// Channel constants for M→R events (must match preload/chat.ts)
// ---------------------------------------------------------------------------

const MR = {
  STREAM_START:   'panda:chat:stream:start',
  STREAM_DELTA:   'panda:chat:stream:delta',
  STREAM_END:     'panda:chat:stream:end',
  SESSION_UPDATED:'panda:session:updated',
  TOOL_USE_START: 'panda:tool:use:start',
  TOOL_USE_END:   'panda:tool:use:end',
  TOOL_PERM_REQ:  'panda:tool:permission:request',
} as const;

// ---------------------------------------------------------------------------
// CLISession — single CLI subprocess lifecycle
// ---------------------------------------------------------------------------

export class CLISession extends EventEmitter {
  readonly id: string;
  readonly cwd: string;
  name: string;
  state: SessionState = 'idle';
  readonly createdAt: number;

  private process: ChildProcess | null = null;
  private rl: ReadlineInterface | null = null;
  private stderrBuffer: string[] = [];

  // Current assistant message ID (from message_start, used in stream events)
  private currentMessageId: string = '';

  // Tool input accumulation (for streaming tool_use via content_block_delta)
  private currentToolName: string | null = null;
  private currentToolInput: string = '';

  // Auto-respawn state
  private respawnCount = 0;
  private respawnTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalStop = false;

  // Options used to start the session (needed for respawn)
  private startOptions: { model?: string; permissionMode?: string } | undefined;

  constructor(id: string, cwd: string, name?: string) {
    super();
    this.id = id;
    this.cwd = cwd;
    this.name = name || `Session ${id.slice(0, 8)}`;
    this.createdAt = Date.now();
  }

  // ── Resolve CLI binary path ──────────────────────────────────────────

  private resolveCLIPath(): string {
    // 1) Explicit env override
    if (process.env.PANDA_CLI_PATH) {
      return process.env.PANDA_CLI_PATH;
    }

    // 2) Dev mode: resolve to monorepo root's dist/cli.js
    //    At runtime __dirname is dist-electron/ (compiled output).
    //    Relative path: dist-electron/ → panda-desk-chat/ → packages/ → cc-panda/
    //    So ../../../dist/cli.js reaches the root project's dist/cli.js.
    if (!app.isPackaged) {
      // Primary: relative to compiled __dirname (dist-electron/)
      const fromDirname = path.resolve(__dirname, '../../../dist/cli.js');
      if (existsSync(fromDirname)) return fromDirname;
      // Secondary: CWD might be monorepo root (e.g. launched from project root)
      const fromCwd = path.resolve(process.cwd(), 'dist/cli.js');
      if (existsSync(fromCwd)) return fromCwd;
      // Tertiary: CWD is packages/panda-desk-chat/, go up two levels
      const fromPkgCwd = path.resolve(process.cwd(), '../../dist/cli.js');
      if (existsSync(fromPkgCwd)) return fromPkgCwd;
      // Let spawn fail with a clear diagnostic path
      console.error(
        `[CLISession] CLI not found. Searched:\n` +
        `  1) ${fromDirname}\n` +
        `  2) ${fromCwd}\n` +
        `  3) ${fromPkgCwd}\n` +
        `Build the CLI first: cd <project-root> && bun run build`,
      );
      return fromDirname;
    }

    // 3) Packaged app: CLI bundled as extraResource
    return path.join(process.resourcesPath, 'dist/cli.js');
  }

  // ── Start CLI subprocess ─────────────────────────────────────────────

  start(options?: { model?: string; permissionMode?: string }): void {
    if (this.process) {
      console.warn(`[CLISession:${this.id}] Already started, ignoring duplicate start()`);
      return;
    }

    // Persist options for respawn; reset intentional-stop flag
    if (options) this.startOptions = options;
    this.intentionalStop = false;

    this.state = 'starting';
    const cliPath = this.resolveCLIPath();

    const args = [
      cliPath,
      '--print',
      '--output-format', 'stream-json',
      '--input-format', 'stream-json',
      '--verbose',
      '--session-id', this.id,
    ];

    if (options?.model) {
      args.push('--model', options.model);
    }
    if (options?.permissionMode) {
      args.push('--permission-mode', options.permissionMode);
    }

    console.log(`[CLISession:${this.id}] Spawning: bun ${args.join(' ')}`);

    this.process = spawn('bun', args, {
      cwd: this.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    // ── stdout: NDJSON line-by-line ──────────────────────────────────
    if (this.process.stdout) {
      this.rl = createInterface({ input: this.process.stdout });
      this.rl.on('line', (line: string) => this.handleLine(line));
    }

    // ── stderr: collect for diagnostics ──────────────────────────────
    if (this.process.stderr) {
      this.process.stderr.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        this.stderrBuffer.push(text);
        // Keep buffer bounded
        if (this.stderrBuffer.length > 200) {
          this.stderrBuffer.splice(0, 100);
        }
        // Log stderr for dev visibility
        console.error(`[CLISession:${this.id}:stderr] ${text.trimEnd()}`);
      });
    }

    // ── Process exit ─────────────────────────────────────────────────
    this.process.on('exit', (code, signal) => {
      console.log(`[CLISession:${this.id}] Exited: code=${code} signal=${signal}`);
      this.cleanup();
      if (!this.intentionalStop) {
        this.scheduleRespawn('exit', code, signal);
      } else {
        this.state = 'stopped';
        this.emit('exit', { sessionId: this.id, code, signal });
      }
    });

    // ── Process error (e.g. ENOENT) ──────────────────────────────────
    this.process.on('error', (err) => {
      console.error(`[CLISession:${this.id}] Process error:`, err);
      this.cleanup();
      if (!this.intentionalStop) {
        this.scheduleRespawn('error', null, null, err.message);
      } else {
        this.state = 'error';
        this.emit('error', { sessionId: this.id, error: err.message });
      }
    });

    this.state = 'idle';
  }

  // ── NDJSON line handler ──────────────────────────────────────────────

  private handleLine(line: string): void {
    if (!line.trim()) return;

    let msg: SDKMessage;
    try {
      msg = JSON.parse(line) as SDKMessage;
    } catch {
      console.warn(`[CLISession:${this.id}] Non-JSON line: ${line.slice(0, 120)}`);
      return;
    }

    switch (msg.type) {
      case 'stream_event':
        this.handleStreamEvent(msg as SDKStreamEvent);
        break;
      case 'result':
        this.handleResult(msg as SDKResultMessage);
        break;
      case 'control_request':
        this.handleControlRequest(msg as SDKControlRequest);
        break;
      case 'tool_result':
        this.handleToolResult(msg as SDKToolResultMessage);
        break;
      case 'keep_alive':
        // Heartbeat — no action needed
        break;
      default:
        console.log(`[CLISession:${this.id}] Unhandled message type: ${msg.type}`);
        break;
    }
  }

  // ── Stream event handler ─────────────────────────────────────────────

  private handleStreamEvent(msg: SDKStreamEvent): void {
    const event = msg.event;
    if (!event) return;

    switch (event.type) {
      case 'message_start':
        this.state = 'streaming';
        this.resetRespawnCount();
        this.currentMessageId = event.message?.id || randomUUID();
        this.emit('stream:start', {
          sessionId: this.id,
          messageId: this.currentMessageId,
        });
        break;

      case 'content_block_start':
        if (event.content_block?.type === 'tool_use') {
          const block = event.content_block as { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };
          this.currentToolName = block.name;
          this.currentToolInput = '';
          this.emit('tool:use:start', {
            sessionId: this.id,
            toolName: block.name,
            toolInput: block.input || {},
          });
        }
        break;

      case 'content_block_delta': {
        const delta = event.delta;
        if (!delta) break;

        switch (delta.type) {
          case 'text_delta':
            this.emit('stream:delta', {
              sessionId: this.id,
              messageId: this.currentMessageId,
              type: 'text',
              delta: delta.text,
            });
            break;
          case 'thinking_delta':
            this.emit('stream:delta', {
              sessionId: this.id,
              messageId: this.currentMessageId,
              type: 'thinking',
              delta: delta.thinking,
            });
            break;
          case 'input_json_delta':
            this.currentToolInput += delta.partial_json;
            this.emit('stream:delta', {
              sessionId: this.id,
              messageId: this.currentMessageId,
              type: 'tool_input',
              delta: delta.partial_json,
            });
            break;
        }
        break;
      }

      case 'content_block_stop':
        // If we were tracking tool input, try to parse accumulated JSON
        if (this.currentToolName && this.currentToolInput) {
          try {
            JSON.parse(this.currentToolInput);
          } catch {
            console.warn(`[CLISession:${this.id}] Failed to parse accumulated tool input JSON`);
          }
        }
        break;

      case 'message_delta':
        // Contains stop_reason — no special handling, wait for result
        break;

      case 'message_stop':
        // End of message — wait for 'result' message for final state
        break;
    }
  }

  // ── Result handler ───────────────────────────────────────────────────

  private handleResult(msg: SDKResultMessage): void {
    this.state = 'idle';
    this.emit('stream:end', {
      sessionId: this.id,
      messageId: this.currentMessageId,
      finishReason: 'end_turn',
      tokenUsage: msg.usage ? {
        input: msg.usage.input_tokens,
        output: msg.usage.output_tokens,
        cacheRead: msg.usage.cache_read_input_tokens,
        cacheWrite: msg.usage.cache_creation_input_tokens,
      } : undefined,
    });
  }

  // ── Control request handler ──────────────────────────────────────────

  private handleControlRequest(msg: SDKControlRequest): void {
    this.state = 'awaiting_permission';
    this.emit('tool:permission:request', {
      sessionId: this.id,
      toolName: msg.request.tool || 'unknown',
      toolInput: msg.request.input || {},
      tier: msg.request.tier || 'exec',
    });
  }

  // ── Tool result handler ──────────────────────────────────────────────

  private handleToolResult(msg: SDKToolResultMessage): void {
    this.emit('tool:use:end', {
      sessionId: this.id,
      toolName: this.currentToolName || 'unknown',
      output: msg.content || '',
      isError: msg.is_error || false,
    });
    this.currentToolName = null;
    this.currentToolInput = '';
  }

  // ── Send message to CLI stdin ────────────────────────────────────────

  sendMessage(content: string, attachments?: Array<{ mediaType: string; data: string }>): void {
    if (!this.process?.stdin?.writable) {
      console.error(`[CLISession:${this.id}] Cannot send: stdin not writable`);
      return;
    }

    const userInput: UserInput = {
      type: 'user',
      content: [
        { type: 'text', text: content },
        ...(attachments || []).map(a => ({
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: a.mediaType, data: a.data },
        })),
      ],
    };

    const line = JSON.stringify(userInput) + '\n';
    this.process.stdin.write(line);
    this.state = 'streaming';
  }

  // ── Respond to permission request ────────────────────────────────────

  respondPermission(decision: 'allow' | 'allow_session' | 'deny'): void {
    if (!this.process?.stdin?.writable) {
      console.error(`[CLISession:${this.id}] Cannot respond permission: stdin not writable`);
      return;
    }

    const response: ControlResponse = {
      type: 'control_response',
      permission: decision,
    };

    const line = JSON.stringify(response) + '\n';
    this.process.stdin.write(line);
    this.state = 'streaming';
  }

  // ── Stop current stream ──────────────────────────────────────────────

  stop(): void {
    if (this.process) {
      this.process.kill('SIGINT');
    }
  }

  // ── Destroy session ──────────────────────────────────────────────────

  destroy(): void {
    this.intentionalStop = true;
    this.cancelRespawn();
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.cleanup();
    this.state = 'stopped';
    this.removeAllListeners();
  }

  // ── Cleanup readline ─────────────────────────────────────────────────

  private cleanup(): void {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    // Clear process reference so respawn can call start() again
    this.process = null;
  }

  // ── Auto-respawn with exponential backoff ─────────────────────────

  private scheduleRespawn(
    reason: 'exit' | 'error',
    code: number | null,
    signal: string | null,
    errorMsg?: string,
  ): void {
    if (this.respawnCount >= RESPAWN_MAX_RETRIES) {
      console.error(
        `[CLISession:${this.id}] Respawn limit reached (${RESPAWN_MAX_RETRIES}). Giving up.`,
      );
      this.state = 'error';
      this.emit('error', {
        sessionId: this.id,
        error: `CLI process ${reason} (${errorMsg ?? `code=${code} signal=${signal}`}). Auto-reconnect failed after ${RESPAWN_MAX_RETRIES} attempts.`,
      });
      return;
    }

    const delay = RESPAWN_BASE_DELAY_MS * Math.pow(2, this.respawnCount);
    this.respawnCount++;
    this.state = 'reconnecting';

    console.log(
      `[CLISession:${this.id}] Scheduling respawn #${this.respawnCount}/${RESPAWN_MAX_RETRIES} in ${delay}ms (reason: ${reason})`,
    );

    // Notify frontend about reconnecting state
    this.emit('stateChange', {
      sessionId: this.id,
      state: 'reconnecting' as SessionState,
      respawnAttempt: this.respawnCount,
      maxRetries: RESPAWN_MAX_RETRIES,
    });

    this.respawnTimer = setTimeout(() => {
      this.respawnTimer = null;
      console.log(`[CLISession:${this.id}] Respawning now (attempt #${this.respawnCount})`);
      this.start(this.startOptions);
    }, delay);
  }

  /** Call when session is confirmed healthy (first prompt received) */
  resetRespawnCount(): void {
    if (this.respawnCount > 0) {
      console.log(
        `[CLISession:${this.id}] Session healthy — resetting respawn counter (was ${this.respawnCount})`,
      );
    }
    this.respawnCount = 0;
  }

  /** Cancel any pending respawn timer */
  cancelRespawn(): void {
    if (this.respawnTimer) {
      clearTimeout(this.respawnTimer);
      this.respawnTimer = null;
    }
  }

  // ── Serialize to SessionInfo ─────────────────────────────────────────

  toInfo(): SessionInfo {
    return {
      id: this.id,
      name: this.name,
      cwd: this.cwd,
      state: this.state,
      createdAt: this.createdAt,
    };
  }
}

// ---------------------------------------------------------------------------
// CLIManager — multi-session orchestrator
// ---------------------------------------------------------------------------

export class CLIManager {
  private sessions = new Map<string, CLISession>();

  // In-memory config (set via IPC, consumed on session start)
  private currentModel: string | undefined;
  private currentPermissionMode: string | undefined;

  // ── Window registration (for focus-based unread clearing) ────────────

  registerWindow(win: BrowserWindow): void {
    win.on('focus', () => {
      notificationManager.clearUnread();
    });
  }

  // ── Config setters ───────────────────────────────────────────────────

  setModel(model: string): void {
    this.currentModel = model;
  }

  setPermissionMode(mode: string): void {
    this.currentPermissionMode = mode;
  }

  // ── Session lifecycle ────────────────────────────────────────────────

  async createSession(cwd: string, name?: string): Promise<SessionInfo> {
    const id = randomUUID();
    const session = new CLISession(id, cwd, name);
    this.sessions.set(id, session);

    this.wireSessionEvents(session);
    session.start({
      model: this.currentModel,
      permissionMode: this.currentPermissionMode,
    });

    this.broadcastSessionList();
    return session.toInfo();
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.destroy();
      this.sessions.delete(sessionId);
      this.broadcastSessionList();
    }
  }

  renameSession(sessionId: string, name: string): SessionInfo | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.name = name;
    this.broadcastSessionList();
    return session.toInfo();
  }

  async focusSession(sessionId: string): Promise<SessionInfo | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Re-start stopped sessions
    if (session.state === 'stopped' || session.state === 'error') {
      session.start({
        model: this.currentModel,
        permissionMode: this.currentPermissionMode,
      });
      this.broadcastSessionList();
    }

    return session.toInfo();
  }

  // ── Message routing ──────────────────────────────────────────────────

  sendMessage(sessionId: string, content: string, attachments?: Array<{ mediaType: string; data: string }>): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`[CLIManager] Session not found: ${sessionId}`);
      return;
    }
    session.sendMessage(content, attachments);
  }

  stopStream(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.stop();
    }
  }

  respondPermission(sessionId: string, decision: 'allow' | 'allow_session' | 'deny'): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`[CLIManager] Session not found for permission response: ${sessionId}`);
      return;
    }
    session.respondPermission(decision);
  }

  // ── Query ────────────────────────────────────────────────────────────

  listSessions(): SessionInfo[] {
    return Array.from(this.sessions.values()).map(s => s.toInfo());
  }

  // ── Event wiring (session → BrowserWindow) ───────────────────────────

  private wireSessionEvents(session: CLISession): void {
    const send = (channel: string, data: unknown) => {
      // Route session-specific events to the window showing this session,
      // falling back to broadcast if no specific window is mapped
      windowManager.sendToSession(session.id, channel, data);
    };

    session.on('stream:start', (data) => {
      send(MR.STREAM_START, data);
    });

    session.on('stream:delta', (data) => {
      send(MR.STREAM_DELTA, data);
    });

    session.on('stream:end', (data) => {
      send(MR.STREAM_END, data);

      // Notify when assistant message completes and no window is focused
      if (!windowManager.isAnyWindowFocused()) {
        notificationManager.notify('Panda Code', 'New message from assistant');
        notificationManager.incrementUnread();
      }
    });

    session.on('tool:use:start', (data) => {
      send(MR.TOOL_USE_START, data);
    });

    session.on('tool:use:end', (data) => {
      send(MR.TOOL_USE_END, data);
    });

    session.on('tool:permission:request', (data) => {
      send(MR.TOOL_PERM_REQ, data);
    });

    session.on('exit', () => {
      this.broadcastSessionList();
    });

    session.on('error', (data) => {
      console.error(`[CLIManager] Session error:`, data);
      this.broadcastSessionList();
    });

    session.on('stateChange', () => {
      this.broadcastSessionList();
    });
  }

  // ── Broadcast session list to renderer ───────────────────────────────

  private broadcastSessionList(): void {
    windowManager.broadcast(MR.SESSION_UPDATED, this.listSessions());
  }

  // ── Cleanup all sessions (app quit) ──────────────────────────────────

  destroyAll(): void {
    for (const session of this.sessions.values()) {
      session.destroy();
    }
    this.sessions.clear();
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const cliManager = new CLIManager();
