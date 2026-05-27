// Input: IPC handler 调用 (sendMessage/createSession/respondPermission 等), WindowManager, notificationManager
// Output: CLI 子进程管理、NDJSON 解析、事件路由到多 BrowserWindow, 系统通知 + dock badge
// Pos: electron/backend — CLI 进程生命周期管理核心
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { ChildProcess, spawn } from 'node:child_process';
import { createInterface, type Interface as ReadlineInterface } from 'node:readline';
import { EventEmitter } from 'node:events';
import { appendFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { findSessionFile, getSessionLaunchInfo } from './disk-session-scanner';
import { findOccupyingInteractiveSession } from './pid-registry';
import { resolveBunPath } from './binPath';
import { buildChildEnv, type ProviderConfig } from './provider-env-builder';
import { clearStaleLocks } from './stale-lock-cleanup';
import { verifyCliIntegrity, formatVerifyResult } from './cli-integrity';
import {
  buildStartupError,
  isPandaConversationStartupError,
  type PandaConversationStartupError,
} from './conversation-startup-error';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { app, BrowserWindow } from 'electron';
import { notificationManager } from '../notification';
import { windowManager } from '../window-manager';
import type {
  SDKMessage, SDKStreamEvent, SDKControlRequest, SDKResultMessage,
  SDKToolResultMessage, CLIInput, UserInput, ControlResponse,
  SessionState, SessionInfo, ContentBlock, CLIStreamErrorPayload,
} from './types';

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

/**
 * v2.27.0 P0-2：panda-cli spawn 之后的"启动期窗口"长度（毫秒）。
 *
 * 在此窗口内若子进程退出，cli-manager 视为"启动失败"并按 stderr 关键字
 * 二次分类成 PANDA_CLI_AUTH_REQUIRED / PANDA_CLI_SESSION_CONFLICT /
 * PANDA_CLI_START_FAILED。窗口结束后退出走既有 stream:error 'exit' 路径。
 *
 * 3000ms 来自 cc-haha 蓝本的实证经验（panda-cli 首条 NDJSON 通常 < 2s 出现）。
 */
export const STARTUP_GRACE_MS = 3000;

/**
 * v2.27.0 P0-2：早退分类的纯逻辑（无 IO / 无 timer），便于单测覆盖。
 *
 * 关键字优先级：auth → session-conflict → start-failed（兜底）。
 * 这与 cc-haha 的处理顺序一致：明确的认证缺失优先级最高，next 是端口/会话冲突，
 * 最后才是兜底 start-failed（含 exitCode 与 stderr 尾巴用于诊断）。
 */
export function classifyStartupExit(
  stderrTail: string,
  exitCode: number | null,
  sessionId: string,
): PandaConversationStartupError {
  if (
    /(not logged in|run\s+\/?login|sign in again|please log\s*in|unauthorized|401|authentication required)/i.test(
      stderrTail,
    )
  ) {
    return buildStartupError('auth-required', { stderrTail });
  }
  if (/session\s*id.*already in use|session.*occupied|session.*conflict/i.test(stderrTail)) {
    return buildStartupError('session-conflict', { sessionId });
  }
  return buildStartupError('start-failed', {
    exitCode: exitCode ?? -1,
    stderrTail,
    detail: `CLI 启动后 ${STARTUP_GRACE_MS}ms 内退出`,
  });
}

export class CLISession extends EventEmitter {
  readonly id: string;
  readonly cwd: string;
  name: string;
  state: SessionState = 'idle';
  readonly createdAt: number;
  // v2.27.1: provider env 隔离。CLISession 持有 providerConfig，start() 调用
  // buildChildEnv() 替代 { ...process.env } 展开，防止 shell 残留 provider token 污染。
  providerConfig: ProviderConfig | undefined;

  private process: ChildProcess | null = null;
  private rl: ReadlineInterface | null = null;
  private stderrBuffer: string[] = [];

  // Current assistant message ID (from message_start, used in stream events)
  private currentMessageId: string = '';

  // Tool input accumulation (for streaming tool_use via content_block_delta)
  private currentToolName: string | null = null;
  private currentToolInput: string = '';

  // Kept for legacy cleanup hooks; errors no longer auto-respawn to avoid UI spam.
  private respawnCount = 0;
  private respawnTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalStop = false;

  // Options used to start the session.
  private startOptions: { model?: string; permissionMode?: CLIPermissionMode } | undefined;
  private lastCliPath = '';
  private lastBunPath = '';
  private lastSpawnArgs: string[] = [];
  private lastLogPath = '';

  // v2.27.0 P0-2：startup-grace 状态。spawn 后 STARTUP_GRACE_MS 内若 exit，
  // 视为启动失败并按 stderr 关键字二次分类；graceOver=true 后退出走既有路径。
  private startupGraceOver = false;
  private startupGraceTimer: ReturnType<typeof setTimeout> | null = null;
  private startupStderrChunks: string[] = [];

  // Comdr 指令: 修复 spawn race condition — sendMessage 在 spawnWithDiskProbe
  //   await 完成前调用时，this.process 还是 null/stdin 不 writable，旧实现直接
  //   console.error + return 静默丢消息（用户感受："发了没响应/必须刷新"）。
  //   改为：未就绪时 push 到 pendingSends queue，spawn 完成后 flush。
  private pendingSends: Array<{ content: string; attachments?: Array<{ mediaType: string; data: string }> }> = [];

  constructor(id: string, cwd: string, name?: string, providerConfig?: ProviderConfig) {
    super();
    this.id = id;
    this.cwd = cwd;
    this.name = name || `Session ${id.slice(0, 8)}`;
    this.createdAt = Date.now();
    this.providerConfig = providerConfig;
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
    this.lastCliPath = cliPath;

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

    const bunPath = resolveBunPath();
    this.lastBunPath = bunPath;
    this.lastSpawnArgs = [...args];
    this.writeDiagnosticLog(
      `[spawn${isResume ? ':resume' : ':new'}] cwd=${this.cwd} bun=${bunPath} args=${args.join(' ')}`,
    );
    console.log(`[CLISession:${this.id}] Spawning${isResume ? ' (resume)' : ''}: bun ${args.join(' ')}`);

    // v2.27.1: Provider env 隔离。使用 buildChildEnv() 替代 { ...process.env }，
    // 清除 shell 残留的 ANTHROPIC_*/OPENAI_*/GOOGLE_*/AWS_*/VERTEX_* token，
    // 按 providerConfig 注入对应 provider env key，避免多 provider 切换时老 token
    // 污染新 provider 调用。CALLER_DIR/PWD 强制注入（Bug B 规则，v2.26.14 建立）。
    this.process = spawn(bunPath, args, {
      cwd: this.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: buildChildEnv({ cwd: this.cwd, provider: this.providerConfig, managedOAuth: true }),
    });

    // v2.27.0 P0-2：启动期窗口计时与 stderr 收集。spawn 同步返回后立刻启动，
    // 用 dedicated chunk buffer（与 stderrBuffer 解耦），exit handler 顶部分类用。
    this.startupGraceOver = false;
    this.startupStderrChunks = [];
    if (this.startupGraceTimer) clearTimeout(this.startupGraceTimer);
    this.startupGraceTimer = setTimeout(() => {
      this.startupGraceOver = true;
      this.startupGraceTimer = null;
      // chunks 可以释放以节省内存（exit 路径已不再读）
      this.startupStderrChunks = [];
    }, STARTUP_GRACE_MS);

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
        // v2.27.0 P0-2：grace 窗口内额外收集 stderr，用于早退分类（关键字匹配）。
        // 窗口结束后 startupGraceOver=true，停止累积。
        if (!this.startupGraceOver) {
          this.startupStderrChunks.push(text);
        }
        this.writeDiagnosticLog(`[stderr] ${text.trimEnd()}`);
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
      // v2.27.0 P0-2：清理 grace 计时；判定是否在窗口内退出。
      const earlyExit = !this.startupGraceOver;
      if (this.startupGraceTimer) {
        clearTimeout(this.startupGraceTimer);
        this.startupGraceTimer = null;
      }
      const earlyStderrTail = this.startupStderrChunks.join('').slice(-2048);
      this.cleanup();
      if (!this.intentionalStop) {
        if (earlyExit) {
          // P0-2：grace 窗口内退出 → 用 classifyStartupExit 纯函数二次分类。
          // 关闭 graceOver 防止 cleanup/race 重复进入。
          this.startupGraceOver = true;
          const startupErr = classifyStartupExit(earlyStderrTail, code, this.id);
          this.emitStreamError({
            reason: 'startup-early-exit',
            exitCode: code,
            signal,
            error: startupErr.message,
            stderrTail: earlyStderrTail,
            ...this.startupErrorPayload(startupErr),
          });
          this.state = 'error';
          this.emit('error', {
            sessionId: this.id,
            error: startupErr.message,
          });
          return; // 不走既有 exit 路径
        }
        const stderrTail = this.lastStderr();
        this.emitStreamError({
          reason: 'exit',
          exitCode: code,
          signal,
          error:
            `CLI process exited before completing the response (code=${code ?? 'null'} signal=${signal ?? 'null'}).` +
            (stderrTail ? `\n\nstderr:\n${stderrTail}` : ''),
          stderrTail,
        });
        this.state = 'error';
        this.emit('error', {
          sessionId: this.id,
          error: `CLI process exited (code=${code ?? 'null'} signal=${signal ?? 'null'})`,
        });
      } else {
        this.state = 'stopped';
        this.emit('exit', { sessionId: this.id, code, signal });
      }
    });

    // ── Process error (e.g. ENOENT) ──────────────────────────────────
    this.process.on('error', (err) => {
      console.error(`[CLISession:${this.id}] Process error:`, err);
      // v2.27.0 P0-2：清理 grace 计时（spawn 失败时也要释放）。
      if (this.startupGraceTimer) {
        clearTimeout(this.startupGraceTimer);
        this.startupGraceTimer = null;
      }
      this.cleanup();
      if (!this.intentionalStop) {
        // v2.27.0 P0-1 阶段 2：构造 PANDA_CLI_SPAWN_FAILED typed Error，
        // emitStreamError 注入 errorClass 让 renderer 弹精确 toast。
        const startupErr = buildStartupError('spawn-failed', {
          bunPath: this.lastBunPath,
          cliPath: this.lastCliPath,
          detail: err.message,
          cause: err,
        });
        this.emitStreamError({
          reason: 'spawn-error',
          error: startupErr.message,
          stderrTail: this.lastStderr(),
          ...this.startupErrorPayload(startupErr),
        });
        this.state = 'error';
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
    this.emitStreamError({
      reason: 'cli-error',
      error,
      stderrTail: this.lastStderr(),
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

  private writeDiagnosticLog(line: string): void {
    try {
      const logDir = app.getPath('logs');
      mkdirSync(logDir, { recursive: true });
      this.lastLogPath = path.join(logDir, 'panda-desk-chat-main.log');
      appendFileSync(
        this.lastLogPath,
        `${new Date().toISOString()} [CLISession:${this.id}] ${line}\n`,
      );
    } catch {
      /* best-effort diagnostic log */
    }
  }

  private emitStreamError(input: string | Partial<CLIStreamErrorPayload>): void {
    const payload = typeof input === 'string' ? { error: input } : input;
    const error = payload.error || this.lastStderr() || 'CLI returned an error';
    this.writeDiagnosticLog(`[stream:error] ${error}`);
    this.emit('stream:error', {
      sessionId: this.id,
      messageId: this.currentMessageId || randomUUID(),
      error,
      reason: payload.reason,
      exitCode: payload.exitCode,
      signal: payload.signal,
      cwd: this.cwd,
      cliPath: this.lastCliPath,
      bunPath: this.lastBunPath,
      args: this.lastSpawnArgs,
      stderrTail: payload.stderrTail ?? this.lastStderr(),
      isPackaged: app.isPackaged,
      resourcesPath: process.resourcesPath,
      configDir: process.env.PANDA_CONFIG_DIR || path.join(app.getPath('home'), '.pandacc'),
      logPath: this.lastLogPath,
      code: payload.code,
      occupierPid: payload.occupierPid,
      occupierCwd: payload.occupierCwd,
      // v2.27.0 P0-1 阶段 2：透传 ConversationStartupError.toJSON()，renderer
      // (chatStore) 据此读 context（detail/stderrTail/exitCode 等）渲染 toast。
      errorClass: payload.errorClass,
    } satisfies CLIStreamErrorPayload);
  }

  /**
   * v2.27.0 P0-1 阶段 2：把 ConversationStartupError 序列化为 emitStreamError 的
   * payload 增量，统一供 spawn-error / startup-early-exit / control-path 调用。
   * 旧 code 字段（'SESSION_OCCUPIED' / 'WORKDIR_NOT_FOUND' / 'WORKDIR_INVALID'）
   * 由 PANDA_* 新 code 覆盖，但 payload.code 仍是字符串字段，向后兼容旧 renderer。
   */
  private startupErrorPayload(
    err: PandaConversationStartupError,
  ): Pick<CLIStreamErrorPayload, 'code' | 'errorClass'> {
    return {
      code: err.code,
      errorClass: err.toJSON(),
    };
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
  // v2.27.1: Provider env 隔离。由 IPC 从 renderer providerStore 传入，
  // 在 createSessionWithId/ensureSession 创建 CLISession 时注入。
  private currentProviderConfig: ProviderConfig | undefined;

  // v2.27.0 P1: sidecar (panda-cli) sha256 完整性校验。每个 CLIManager 实例只
  // 校验一次（panda-cli/dist/*.js 在 packaged app 中是只读的，校验结果稳定）。
  // dev 模式（无 manifest）走 missingManifest=true 分支只 console.warn 不阻塞。
  private cliIntegrityChecked = false;
  private cliIntegrityCachePromise: Promise<void> | null = null;

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

  // v2.27.1: 由 IPC handler 在 provider 切换时调用，传入当前选中的 provider 配置。
  // CLISession.providerConfig 在下次 createSessionWithId / ensureSession 重启时生效。
  setProviderConfig(config: ProviderConfig | undefined): void {
    this.currentProviderConfig = config;
  }

  // ── CLI integrity (v2.27.0 P1) ───────────────────────────────────────

  /**
   * 校验 Resources/panda-cli/*.js 文件 sha256 与 cli-manifest.json 一致。
   * 每个 CLIManager 实例只执行一次（packaged Resources 在运行期是只读的）。
   *
   * 失败时抛 plain Error，code='CLI_INTEGRITY_FAILED'，mismatches/missingFiles
   * 作为附加字段，供 cli-manager 调用方（IPC 层）转 stream:error payload。
   *
   * 兼容性约定：本任务暂用 plain Error + code 字段，**不** 引入 ConversationStartupError
   * 体系的新 reason —— 避开与 P0-1 阶段 2 worker 的 conversation-startup-error.ts
   * 改动冲突。后续可在不破坏 callers 的前提下接入。
   */
  private async ensureCliIntegrity(): Promise<void> {
    if (this.cliIntegrityChecked) return;
    if (this.cliIntegrityCachePromise) {
      await this.cliIntegrityCachePromise;
      return;
    }
    this.cliIntegrityCachePromise = (async () => {
      const resourcesPath = process.resourcesPath;
      const result = await verifyCliIntegrity(resourcesPath);
      if (result.missingManifest) {
        // dev / older install: warn but do not block
        console.warn(
          `[CLIManager] CLI integrity skipped (manifest missing at ${resourcesPath}/panda-cli/cli-manifest.json) — assuming dev mode`,
        );
        this.cliIntegrityChecked = true;
        return;
      }
      if (!result.ok) {
        const msg = formatVerifyResult(result);
        const err = new Error(msg) as Error & {
          code?: string;
          mismatches?: string[];
          missingFiles?: string[];
          manifestVersion?: string;
        };
        err.code = 'CLI_INTEGRITY_FAILED';
        err.mismatches = result.mismatches;
        err.missingFiles = result.missingFiles;
        err.manifestVersion = result.manifestVersion;
        // 不缓存失败结果：若用户重新安装/修复 .app，下次 ensureSession 应重新校验
        throw err;
      }
      console.log(
        `[CLIManager] CLI integrity ok (version=${result.manifestVersion ?? 'unknown'}, generatedAt=${result.manifestGeneratedAt ?? 'unknown'})`,
      );
      this.cliIntegrityChecked = true;
    })();
    try {
      await this.cliIntegrityCachePromise;
    } finally {
      this.cliIntegrityCachePromise = null;
    }
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
    const session = new CLISession(id, cwd, name, this.currentProviderConfig);
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
    // v2.27.0 P1：在首次 spawn panda-cli 前对 Resources/panda-cli/*.js 做 sha256
    // 完整性校验，抓 DMG 传输错误/磁盘损坏/误改造成的 code=1 静默失败。
    // dev 模式（无 cli-manifest.json）走 missingManifest=true，只 console.warn 不阻塞。
    await this.ensureCliIntegrity();
    // v2.27.1: clearStaleLocks — 清理 panic crash 遗留的死 PID 文件，
    // 避免 findOccupyingInteractiveSession 误判 SESSION_OCCUPIED。
    // catch 错误只打 warn，不阻塞后续流程。
    await clearStaleLocks().catch((err) =>
      console.warn('[CLIManager] clearStaleLocks failed (non-blocking):', err),
    );
    let session = this.sessions.get(sessionId);
    // v2.27.0 Bug C 修复：在 spawn 子进程前检测 panda-cli PID registry，
    // 若同一 sessionId 已被终端 `panda --resume` interactive REPL 持有，
    // 抛 typed Error code=SESSION_OCCUPIED。Desk Chat 与终端 REPL 共用磁盘
    // jsonl + control 协议状态，并发会造成消息错乱/双写崩溃。
    // 仅对 in-memory session 未命中的场景检查（已 attach 的 Desk Chat 自身
    // session 不属于 panda-cli registry 范畴）。
    if (!session) {
      const occupier = findOccupyingInteractiveSession(sessionId);
      if (occupier) {
        // v2.27.0 P0-1 阶段 2：改用 ConversationStartupError 工厂统一抛
        // PANDA_CLI_SESSION_CONFLICT。占用 PID/cwd 通过 detail 字段携带（context
        // interface 不含 occupiedBy* 自定义字段，按蓝本走 detail 文案）。
        // emitStreamError 会读取 toJSON() 注入 errorClass payload，renderer
        // 据此弹中文 toast。
        throw buildStartupError('session-conflict', {
          sessionId,
          detail: `pid=${occupier.pid}, cwd=${occupier.cwd}`,
        });
      }
    }
    if (!session) {
      // v2.26.14 Bug B fix (1:1 align cc-haha conversationService.startSession):
      // Resume a historical session whose UUID still lives in renderer localStorage
      // but whose live CLI process was lost (Electron restart) must NOT fall back
      // to process.cwd() (= "/" when launched by Finder) — that breaks `panda-cli
      // --resume` because the transcript was recorded under a different project
      // path. Resolve cwd from the on-disk ~/.pandacc/projects/*/{sessionId}.jsonl
      // launch info (session-meta.workDir → entries[].cwd → desanitize projectDir)
      // before spawning. Throw a typed error when no valid workDir can be found,
      // so renderer surfaces a clear diagnostic instead of silently spawning at "/".
      let resolvedCwd = cwd;
      if (!resolvedCwd) {
        try {
          const launch = await getSessionLaunchInfo(sessionId);
          if (launch?.workDir) {
            resolvedCwd = launch.workDir;
          }
        } catch (err) {
          console.warn(
            `[CLIManager] getSessionLaunchInfo(${sessionId}) failed: ${(err as Error)?.message ?? err}`,
          );
        }
      }
      if (!resolvedCwd) {
        // v2.27.0 P0-1 阶段 2：改用 ConversationStartupError 工厂统一抛
        // PANDA_WORKDIR_NOT_FOUND（retryable=false：用户必须重新选 cwd）。
        throw buildStartupError('workdir-not-found', { sessionId });
      }
      if (!existsSync(resolvedCwd) || !statSync(resolvedCwd).isDirectory()) {
        // v2.27.0 P0-1 阶段 2：PANDA_WORKDIR_INVALID（retryable=false）。
        throw buildStartupError('workdir-invalid', { sessionId, workDir: resolvedCwd });
      }
      console.log(
        `[CLIManager] Auto-creating session for stale ID: ${sessionId} (resolved cwd=${resolvedCwd}${cwd ? '' : ' from disk jsonl'})`,
      );
      await this.createSessionWithId(sessionId, resolvedCwd, name);
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
    let session: CLISession;
    try {
      session = await this.ensureSession(sessionId);
    } catch (err) {
      this.surfaceManagerLevelError(sessionId, err);
      throw err;
    }

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
    let session: CLISession;
    try {
      session = await this.ensureSession(sessionId);
    } catch (err) {
      this.surfaceManagerLevelError(sessionId, err);
      throw err;
    }
    session.sendMessage(content, attachments);
  }

  /**
   * v2.27.0 Bug C：ensureSession 抛出的 typed Error 在子进程未启动时无 CLISession
   * 可挂载 stream:error，直接通过 windowManager 广播 STREAM_ERROR 到对应窗口，
   * renderer 的 onStreamError 即可消费 code（旧 SESSION_OCCUPIED 或新 PANDA_*）
   * 并弹中文提示。
   *
   * v2.27.0 P0-1 阶段 2：识别 PandaConversationStartupError 优先注入 errorClass
   * （chatStore 据此读 context 渲染精确文案）；旧 typed Error.code 路径保留向后兼容。
   */
  private surfaceManagerLevelError(sessionId: string, err: unknown): void {
    if (!err || typeof err !== 'object') return;
    let payload: CLIStreamErrorPayload;
    if (isPandaConversationStartupError(err)) {
      payload = {
        sessionId,
        messageId: randomUUID(),
        error: err.message,
        reason: 'cli-error',
        code: err.code,
        errorClass: err.toJSON(),
        isPackaged: app.isPackaged,
        resourcesPath: process.resourcesPath,
        configDir: process.env.PANDA_CONFIG_DIR || path.join(app.getPath('home'), '.pandacc'),
      };
    } else {
      const typed = err as Error & {
        code?: string;
        pid?: number;
        sessionCwd?: string;
      };
      payload = {
        sessionId,
        messageId: randomUUID(),
        error: typed.message ?? String(err),
        reason: 'cli-error',
        code: typed.code,
        occupierPid: typed.pid,
        occupierCwd: typed.sessionCwd,
        isPackaged: app.isPackaged,
        resourcesPath: process.resourcesPath,
        configDir: process.env.PANDA_CONFIG_DIR || path.join(app.getPath('home'), '.pandacc'),
      };
    }
    try {
      windowManager.sendToSession(sessionId, MR.STREAM_ERROR, payload);
    } catch (broadcastErr) {
      console.error('[CLIManager] failed to surface manager-level error:', broadcastErr);
    }
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
