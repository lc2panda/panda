// Input: startup-failure reason + optional context (exitCode/stderrTail/cwd/...)
// Output: typed ConversationStartupError with code + retryable + 中文 message
// Pos: packages/panda-desk-chat/electron/backend — typed error 体系（v2.27.0 P0-1 阶段 1）
//
// 参考 cc-haha monitor/tmp/cc-haha/src/server/services/conversationService.ts:54-68
// 错误分类系统。本文件为 panda 蓝本的 1:1 复刻并按以下约束本地化：
// - 命名空间：PandaConversationStartupError（避免与未来 import cc-haha 冲突）
// - 错误码前缀：PANDA_*（与 cc-haha CLI_* 区分）
// - user-facing message 全中文（renderer 显示）
// - 复用 v2.26.14 Bug B 引入的 WORKDIR_NOT_FOUND/WORKDIR_INVALID 含义，并入新枚举
// - 新增 retryable: boolean，renderer 可据此显示"重试"按钮
//
// 本文件为阶段 1：独立文件 + 单测，不接线到 cli-manager.ts。
// 阶段 2 等 Bug C/D/E 修复合入后再做 cli-manager 改造。

/**
 * 启动 CLI 子进程过程中所有可分类失败的错误码联合类型。
 */
export type ConversationStartupErrorCode =
  | 'PANDA_CLI_AUTH_REQUIRED'
  | 'PANDA_CLI_SESSION_CONFLICT'
  | 'PANDA_CLI_START_FAILED'
  | 'PANDA_CLI_SPAWN_FAILED'
  | 'PANDA_WORKDIR_NOT_FOUND'
  | 'PANDA_WORKDIR_INVALID';

/**
 * buildStartupError 接受的 reason 关键字。
 * 按 reason 自动解析 code/retryable/中文 message。
 */
export type ConversationStartupReason =
  | 'auth-required'
  | 'session-conflict'
  | 'spawn-failed'
  | 'workdir-not-found'
  | 'workdir-invalid'
  | 'start-failed';

/**
 * buildStartupError 的可选上下文。所有字段都会写入 .context 供序列化。
 */
export interface ConversationStartupErrorContext {
  sessionId?: string;
  workDir?: string;
  exitCode?: number | null;
  signal?: string | null;
  stderrTail?: string;
  cliPath?: string;
  bunPath?: string;
  detail?: string;
  cause?: unknown;
}

/**
 * 错误类构造参数。code 与 retryable 在 buildStartupError 中自动给出。
 */
export interface ConversationStartupErrorOptions {
  retryable?: boolean;
  cause?: unknown;
  context?: ConversationStartupErrorContext;
}

/**
 * 序列化 payload，cli-manager 在阶段 2 会把此结构塞进 emitStreamError 的 payload。
 */
export interface ConversationStartupErrorPayload {
  name: 'PandaConversationStartupError';
  code: ConversationStartupErrorCode;
  message: string;
  retryable: boolean;
  context?: ConversationStartupErrorContext;
}

/**
 * Panda Desk Chat CLI 子进程启动失败的分类错误。
 *
 * 与 cc-haha 蓝本对齐：code + retryable + 中文友好 message + 可序列化 toJSON。
 * 名称使用 'PandaConversationStartupError' 与 cc-haha 区分，
 * 但 instanceof Error 仍为 true。
 */
export class PandaConversationStartupError extends Error {
  public readonly code: ConversationStartupErrorCode;
  public readonly retryable: boolean;
  public readonly context?: ConversationStartupErrorContext;
  // Node.js Error.cause 自 v16.9 起原生支持，这里显式保留以保证类型可见。
  public override readonly cause?: unknown;

  constructor(
    code: ConversationStartupErrorCode,
    message: string,
    options: ConversationStartupErrorOptions = {},
  ) {
    super(message);
    this.name = 'PandaConversationStartupError';
    this.code = code;
    this.retryable = options.retryable ?? false;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
    if (options.context !== undefined) {
      this.context = options.context;
    }
    // 保证 instanceof 在跨 transpile target 场景下仍稳定。
    Object.setPrototypeOf(this, PandaConversationStartupError.prototype);
  }

  toJSON(): ConversationStartupErrorPayload {
    const payload: ConversationStartupErrorPayload = {
      name: 'PandaConversationStartupError',
      code: this.code,
      message: this.message,
      retryable: this.retryable,
    };
    if (this.context !== undefined) {
      payload.context = this.context;
    }
    return payload;
  }
}

/**
 * 类型守卫：判断未知值是否为 PandaConversationStartupError 实例。
 *
 * 在 IPC/序列化跨边界时实例可能丢失原型，使用 name + code shape 兜底。
 */
export function isPandaConversationStartupError(
  value: unknown,
): value is PandaConversationStartupError {
  if (value instanceof PandaConversationStartupError) return true;
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { name?: unknown; code?: unknown; message?: unknown };
  if (v.name !== 'PandaConversationStartupError') return false;
  if (typeof v.code !== 'string') return false;
  if (typeof v.message !== 'string') return false;
  return true;
}

/**
 * 按 reason 推导 code / retryable / 中文 message 的工厂。
 *
 * cli-manager 阶段 2 接线时只需调用本工厂，无需在调用点重复 message 文案。
 *
 * 约定：
 * - auth-required: 不可重试（需用户登录后手动重启）
 * - session-conflict: 可重试（换 sessionId 即可）
 * - spawn-failed: 可重试（系统层错误，多为 ENOENT/EACCES，修配置后重试）
 * - workdir-not-found: 不可重试（磁盘历史无法定位 cwd，需用户手动指定）
 * - workdir-invalid: 不可重试（路径存在但非目录，需用户修复）
 * - start-failed: 可重试（generic，CLI 启动后 exit non-zero）
 */
export function buildStartupError(
  reason: ConversationStartupReason,
  context: ConversationStartupErrorContext = {},
): PandaConversationStartupError {
  const ctx = context;
  const detail = ctx.detail?.trim() || ctx.stderrTail?.trim() || '';
  const detailSuffix = detail ? `：${detail}` : '';

  switch (reason) {
    case 'auth-required':
      return new PandaConversationStartupError(
        'PANDA_CLI_AUTH_REQUIRED',
        `Panda CLI 未登录，无法启动会话。请先在终端运行 \`panda /login\` 或配置有效凭证，然后重新打开此对话${detailSuffix}`,
        { retryable: false, cause: ctx.cause, context: ctx },
      );

    case 'session-conflict': {
      const sid = ctx.sessionId ? `（sessionId=${ctx.sessionId}）` : '';
      return new PandaConversationStartupError(
        'PANDA_CLI_SESSION_CONFLICT',
        `当前会话${sid}已被另一个 CLI 进程占用，请稍后重试或新建会话${detailSuffix}`,
        { retryable: true, cause: ctx.cause, context: ctx },
      );
    }

    case 'spawn-failed': {
      const sysHint = ctx.cliPath || ctx.bunPath
        ? `（bun=${ctx.bunPath ?? '?'}，cli=${ctx.cliPath ?? '?'}）`
        : '';
      return new PandaConversationStartupError(
        'PANDA_CLI_SPAWN_FAILED',
        `Panda CLI 子进程启动失败，可能是 bun 或 CLI 路径不存在/无执行权限${sysHint}${detailSuffix}`,
        { retryable: true, cause: ctx.cause, context: ctx },
      );
    }

    case 'workdir-not-found': {
      const sid = ctx.sessionId ? `（sessionId=${ctx.sessionId}）` : '';
      return new PandaConversationStartupError(
        'PANDA_WORKDIR_NOT_FOUND',
        `无法定位历史会话${sid}的工作目录，磁盘记录中未找到 cwd 信息${detailSuffix}`,
        { retryable: false, cause: ctx.cause, context: ctx },
      );
    }

    case 'workdir-invalid': {
      const wd = ctx.workDir ? `（${ctx.workDir}）` : '';
      return new PandaConversationStartupError(
        'PANDA_WORKDIR_INVALID',
        `工作目录${wd}不存在或不是有效目录，请确认项目路径${detailSuffix}`,
        { retryable: false, cause: ctx.cause, context: ctx },
      );
    }

    case 'start-failed':
    default: {
      const codeHint =
        typeof ctx.exitCode === 'number' ? `（exit=${ctx.exitCode}）` : '';
      return new PandaConversationStartupError(
        'PANDA_CLI_START_FAILED',
        `Panda CLI 启动过程中异常退出${codeHint}${detailSuffix}`,
        { retryable: true, cause: ctx.cause, context: ctx },
      );
    }
  }
}
