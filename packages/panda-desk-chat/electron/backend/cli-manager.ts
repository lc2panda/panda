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
import { findSessionFile } from './disk-session-scanner';
import { resolveBunPath } from './binPath';

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
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CLIPermissionMode =
  | 'acceptEdits'
  | 'bypassPermissions'
  | 'default'
  | 'dontAsk'
  | 'plan';

const CLI_PERMISSION_MODES = new Set<string>([
  'acceptEdits',
  'bypassPermissions',
  'default',
  'dontAsk',
  'plan',
]);

function isValidSessionId(sessionId: string): boolean {
  return UUID_PATTERN.test(sessionId);
}

function normalizePermissionMode(mode?: string): CLIPermissionMode | undefined {
  if (!mode) return undefined;
  if (mode === 'skip') {
    console.warn('[CLIManager] Migrating legacy permission mode "skip" to "bypassPermissions"');
    return 'bypassPermissions';
  }
  if (mode === 'auto') {
    console.warn('[CLIManager] Mapping UI-only permission mode "auto" to CLI mode "default"');
    return 'default';
  }
  if (CLI_PERMISSION_MODES.has(mode)) return mode as CLIPermissionMode;
  console.warn(`[CLIManager] Unknown permission mode "${mode}", falling back to "default"`);
  return 'default';
}

// ---------------------------------------------------------------------------
// Channel constants for M→R events (must match preload/chat.ts)
// ---------------------------------------------------------------------------

const MR = {
  STREAM_START:   'panda:chat:stream:start',
  STREAM_DELTA:   'panda:chat:stream:delta',
  STREAM_END:     'panda:chat:stream:end',
  STREAM_ERROR:   'panda:chat:stream:error',
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
  private startOptions: { model?: string; permissionMode?: CLIPermissionMode } | undefined;

  // Comdr 指令: 修复 spawn race condition — sendMessage 在 spawnWithDiskProbe
  //   await 完成前调用时，this.process 还是 null/stdin 不 writable，旧实现直接
  //   console.error + return 静默丢消息（用户感受："发了没响应/必须刷新"）。
  //   改为：未就绪时 push 到 pendingSends queue，spawn 完成后 flush。
  private pendingSends: Array<{ content: string; attachments?: Array<{ mediaType: string; data: string }> }> = [];

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

    // 3) Packaged app: CLI bundled as extraResource. Keep legacy Resources/dist
    //    as a fallback, but the release app stores the full root bundle under
    //    Resources/panda-cli/dist because cli.js dynamically imports chunks.
    const packagedCandidates = [
      path.join(process.resourcesPath, 'panda-cli/dist/cli.js'),
      path.join(process.resourcesPath, 'dist/cli.js'),
    ];
    const found = packagedCandidates.find((candidate) => existsSync(candidate));
    if (found) return found;
    console.error(
      `[CLISession] Packaged CLI not found. Searched:\n` +
      packagedCandidates.map((candidate, idx) => `  ${idx + 1}) ${candidate}`).join('\n') +
      `\nRebuild the desktop app after root CLI build: cd <project-root> && bun run build && cd packages/panda-desk-chat && bun run dist`,
    );
    return packagedCandidates[0]!;
  }

  // ── Start CLI subprocess ─────────────────────────────────────────────

  start(options?: { model?: string; permissionMode?: string }): void {
    if (this.process) {
      console.warn(`[CLISession:${this.id}] Already started, ignoring duplicate start()`);
      return;
    }

    // Persist options for respawn; reset intentional-stop flag
    const normalizedOptions = options
      ? { ...options, permissionMode: normalizePermissionMode(options.permissionMode) }
      : undefined;
    if (normalizedOptions) this.startOptions = normalizedOptions;
    this.intentionalStop = false;

    this.state = 'starting';
    const cliPath = this.resolveCLIPath();

    // Disk probe: does this sessionId already exist on disk?  If yes, use
    // --resume so the CLI picks up the prior transcript (and enable
    // --replay-user-messages so the renderer can rebuild its message list
    // from the CLI's replay events).  Otherwise start a fresh session
    // with --session-id.  findSessionFile is async; use void + a spawn
    // deferred to the next microtask so start() stays sync-compatible with
    // the existing call-sites (ensureSession, respawn).
    void this.spawnWithDiskProbe(cliPath, normalizedOptions);
  }

  private async spawnWithDiskProbe(
    cliPath: string,
    options?: { model?: string; permissionMode?: CLIPermissionMode },
  ): Promise<void> {
    let isResume = false;
    try {
      const found = await findSessionFile(this.id);
      isResume = !!found;
    } catch (err) {
      console.warn(`[CLISession:${this.id}] disk probe failed, treating as new:`, err);
    }

    // Bail if the session was stopped between start() and this microtask.
    if (this.intentionalStop || this.state !== 'starting') {
      return;
    }

    const args = [
      cliPath,
      '--print',
      '--output-format', 'stream-json',
      '--input-format', 'stream-json',
      '--include-partial-messages',
      '--verbose',
    ];

    if (isResume) {
      args.push('--resume', this.id, '--replay-user-messages');
    } else {
      args.push('--session-id', this.id);
    }

    if (options?.model) {
      args.push('--model', options.model);
    }
    if (options?.permissionMode) {
      args.push('--permission-mode', options.permissionMode);
    }

    console.log(`[CLISession:${this.id}] Spawning${isResume ? ' (resume)' : ''}: bun ${args.join(' ')}`);

    this.process = spawn(resolveBunPath(), args, {
      cwd: this.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    // Comdr 指令: spawn 完成 + stdin 已 ready → flush 所有挂起的 sendMessage 调用。
    //   stdio:'pipe' 模式下 stdin 在 spawn 同步返回时就 writable=true，但保险起见
    //   监听 once('open') 兜底。
    if (this.process.stdin?.writable) {
      this.flushPendingSends();
    } else {
      this.process.stdin?.once('open', () => this.flushPendingSends());
    }

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
        this.emitStreamError(
          `CLI process exited before completing the response (code=${code ?? 'null'} signal=${signal ?? 'null'}). ${this.lastStderr()}`,
        );
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
        this.emitStreamError(`CLI process failed to start: ${err.message}`);
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
      case 'error':
        this.handleErrorMessage(msg as { error?: string; message?: string });
        break;
      case 'keep_alive':
        // Heartbeat — no action needed
        break;
      case 'system': {
        // 系统消息 — 标记 CLI 已就绪，emit ready 事件
        this.emit('session:ready', this.id);
        // 如果消息包含内容，也传递给前端
        if ((msg as unknown as Record<string, unknown>).content || (msg as unknown as Record<string, unknown>).message) {
          this.emit('message:system', this.id, msg);
        }
        break;
      }
      case 'assistant': {
        // 助手消息回放（resume 时的历史消息）
        this.emit('message:assistant', this.id, msg);
        break;
      }
      case 'user': {
        // 用户消息回放
        this.emit('message:user', this.id, msg);
        break;
      }
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

  private handleErrorMessage(msg: { error?: string; message?: string }): void {
    const error = msg.error || msg.message || this.lastStderr() || 'CLI returned an error';
    this.state = 'error';
    this.emitStreamError(error);
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
    // Comdr 指令: spawn race 修复 — 子进程 stdin 还没就绪时 push queue，
    //   等 spawnWithDiskProbe await 完成 + flushPendingSends 时统一 write。
    if (!this.process?.stdin?.writable) {
      console.log(`[CLISession:${this.id}] stdin not ready, queueing message (queue=${this.pendingSends.length + 1})`);
      this.pendingSends.push({ content, attachments });
      return;
    }
    this.writeUserInput(content, attachments);
  }

  private writeUserInput(
    content: string,
    attachments?: Array<{ mediaType: string; data: string }>,
  ): void {
    if (!this.process?.stdin?.writable) {
      console.error(`[CLISession:${this.id}] writeUserInput: stdin gone, dropping`);
      return;
    }
    const userInput: UserInput = {
      type: 'user',
      message: {
        role: 'user',
        content: [
          { type: 'text', text: content },
          ...(attachments || []).map(a => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: a.mediaType, data: a.data },
          })),
        ],
      },
      parent_tool_use_id: null,
    };
    const line = JSON.stringify(userInput) + '\n';
    this.process.stdin.write(line);
    this.state = 'streaming';
  }

  /** 内部: spawn 完成后 flush 所有挂起的 send 调用。 */
  private flushPendingSends(): void {
    if (this.pendingSends.length === 0) return;
    const queue = this.pendingSends;
    this.pendingSends = [];
    console.log(`[CLISession:${this.id}] flushing ${queue.length} pending send(s)`);
    for (const { content, attachments } of queue) {
      this.writeUserInput(content, attachments);
    }
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

  private lastStderr(): string {
    return this.stderrBuffer.join('').trim().slice(-2000);
  }

  private emitStreamError(error: string): void {
    this.emit('stream:error', {
      sessionId: this.id,
      messageId: this.currentMessageId || randomUUID(),
      error,
    });
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
  private currentPermissionMode: CLIPermissionMode | undefined;

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
    this.currentPermissionMode = normalizePermissionMode(mode);
  }

  // ── Session lifecycle ────────────────────────────────────────────────

  async createSession(cwd: string, name?: string): Promise<SessionInfo> {
    const id = randomUUID();
    return this.createSessionWithId(id, cwd, name);
  }

  /**
   * Create a session with a specific ID.  Used internally by ensureSession()
   * to re-materialise sessions whose IDs still live in the renderer's
   * localStorage but were lost when the main process restarted.
   */
  private async createSessionWithId(id: string, cwd: string, name?: string): Promise<SessionInfo> {
    if (!isValidSessionId(id)) {
      throw new Error(
        `Invalid desktop session id "${id}". Panda Desk Chat requires a UUID session. Please open a new chat tab.`,
      );
    }
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

  /**
   * Return the existing session or transparently create a new CLI process
   * for a stale session ID that the renderer still remembers after an
   * Electron restart.
   */
  async ensureSession(sessionId: string, cwd?: string, name?: string): Promise<CLISession> {
    if (!isValidSessionId(sessionId)) {
      throw new Error(
        `Invalid desktop session id "${sessionId}". Panda Desk Chat requires a UUID session. Please open a new chat tab.`,
      );
    }
    let session = this.sessions.get(sessionId);
    if (!session) {
      console.log(`[CLIManager] Auto-creating session for stale ID: ${sessionId}`);
      await this.createSessionWithId(sessionId, cwd || process.cwd(), name);
      session = this.sessions.get(sessionId)!;
    }
    return session;
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
    const session = await this.ensureSession(sessionId);

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

  async sendMessage(sessionId: string, content: string, attachments?: Array<{ mediaType: string; data: string }>): Promise<void> {
    const session = await this.ensureSession(sessionId);
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
        notificationManager.notify('Panda Code', 'New message from assistant', undefined, session.id);
        notificationManager.incrementUnread();
      }
    });

    session.on('stream:error', (data) => {
      send(MR.STREAM_ERROR, data);
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

    session.on('session:ready', (sessionId: string) => {
      windowManager.sendToSession(sessionId, 'panda:session:ready', { sessionId });
    });

    session.on('message:assistant', (sessionId: string, msg: unknown) => {
      windowManager.sendToSession(sessionId, 'panda:message:history', { sessionId, role: 'assistant', ...(msg as Record<string, unknown>) });
    });

    session.on('message:user', (sessionId: string, msg: unknown) => {
      windowManager.sendToSession(sessionId, 'panda:message:history', { sessionId, role: 'user', ...(msg as Record<string, unknown>) });
    });

    session.on('message:system', (sessionId: string, msg: unknown) => {
      windowManager.sendToSession(sessionId, 'panda:message:history', { sessionId, role: 'system', ...(msg as Record<string, unknown>) });
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
    // schema sessionUpdatedSchema is { sessions: SessionMeta[] } — wrap to match
    windowManager.broadcast(MR.SESSION_UPDATED, { sessions: this.listSessions() });
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
