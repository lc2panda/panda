// Input: IPC handler 调用 (sendMessage/createSession/respondPermission 等)
// Output: CLI 子进程管理、NDJSON 解析、事件路由到 BrowserWindow
// Pos: electron/backend — CLI 进程生命周期管理核心
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { ChildProcess, spawn } from 'node:child_process';
import { createInterface, type Interface as ReadlineInterface } from 'node:readline';
import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { app, BrowserWindow } from 'electron';
import type {
  SDKMessage, SDKStreamEvent, SDKControlRequest, SDKResultMessage,
  SDKToolResultMessage, CLIInput, UserInput, ControlResponse,
  SessionState, SessionInfo, ContentBlock,
} from './types';

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

    // 2) Dev mode: relative to project root
    if (!app.isPackaged) {
      const devPath = path.resolve(process.cwd(), 'dist/cli.js');
      if (existsSync(devPath)) return devPath;
      // Fallback: relative to this file (electron/backend/ → ../../dist)
      const fallback = path.resolve(__dirname, '../../../../dist/cli.js');
      if (existsSync(fallback)) return fallback;
      return devPath; // let spawn fail with clear path
    }

    // 3) Packaged app
    return path.join(process.resourcesPath, 'dist/cli.js');
  }

  // ── Start CLI subprocess ─────────────────────────────────────────────

  start(options?: { model?: string; permissionMode?: string }): void {
    if (this.process) {
      console.warn(`[CLISession:${this.id}] Already started, ignoring duplicate start()`);
      return;
    }

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
      this.state = 'stopped';
      this.emit('exit', { sessionId: this.id, code, signal });
      this.cleanup();
    });

    // ── Process error (e.g. ENOENT) ──────────────────────────────────
    this.process.on('error', (err) => {
      console.error(`[CLISession:${this.id}] Process error:`, err);
      this.state = 'error';
      this.emit('error', { sessionId: this.id, error: err.message });
      this.cleanup();
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
    this.cleanup();
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.state = 'stopped';
    this.removeAllListeners();
  }

  // ── Cleanup readline ─────────────────────────────────────────────────

  private cleanup(): void {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
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
  private mainWindow: BrowserWindow | null = null;

  // In-memory config (set via IPC, consumed on session start)
  private currentModel: string | undefined;
  private currentPermissionMode: string | undefined;

  // ── Window reference ─────────────────────────────────────────────────

  setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win;
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
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send(channel, data);
      }
    };

    session.on('stream:start', (data) => {
      send(MR.STREAM_START, data);
    });

    session.on('stream:delta', (data) => {
      send(MR.STREAM_DELTA, data);
    });

    session.on('stream:end', (data) => {
      send(MR.STREAM_END, data);
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
  }

  // ── Broadcast session list to renderer ───────────────────────────────

  private broadcastSessionList(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(MR.SESSION_UPDATED, this.listSessions());
    }
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
