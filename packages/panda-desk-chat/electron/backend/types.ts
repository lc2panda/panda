// Input: CLI stream-json NDJSON 协议消息
// Output: TypeScript 类型定义供 cli-manager 和 handlers 使用
// Pos: electron/backend — NDJSON 协议类型层
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

// === CLI stdout NDJSON 消息类型 ===

export type SDKMessageType =
  | 'assistant' | 'user' | 'result' | 'system'
  | 'tool_use' | 'tool_result' | 'stream_event'
  | 'control_request' | 'control_response' | 'keep_alive' | 'error';

// Content blocks
export interface TextBlock { type: 'text'; text: string }
export interface ThinkingBlock { type: 'thinking'; thinking: string }
export interface ToolUseBlock { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
export interface ToolResultBlock { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }
export type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock;

// Anthropic raw stream events (verbose mode)
export type ContentBlockDelta =
  | { type: 'text_delta'; text: string }
  | { type: 'thinking_delta'; thinking: string }
  | { type: 'input_json_delta'; partial_json: string };

export type AnthropicStreamEvent =
  | { type: 'content_block_start'; index: number; content_block: ContentBlock }
  | { type: 'content_block_delta'; index: number; delta: ContentBlockDelta }
  | { type: 'content_block_stop'; index: number }
  | { type: 'message_start'; message: { id: string; model: string; role: string } }
  | { type: 'message_delta'; delta: { stop_reason?: string }; usage?: { output_tokens: number } }
  | { type: 'message_stop' };

// Base message
export interface SDKMessageBase { type: SDKMessageType; session_id?: string }

// Specific message types
export interface SDKAssistantMessage extends SDKMessageBase {
  type: 'assistant';
  message: { role: 'assistant'; content: ContentBlock[]; model?: string; stop_reason?: string };
}

export interface SDKResultMessage extends SDKMessageBase {
  type: 'result';
  result?: string;
  cost_usd?: number;
  duration_ms?: number;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
}

export interface SDKStreamEvent extends SDKMessageBase {
  type: 'stream_event';
  event: AnthropicStreamEvent;
}

export interface SDKControlRequest extends SDKMessageBase {
  type: 'control_request';
  request: {
    type: string;           // 'tool_permission' etc
    tool?: string;          // tool name
    input?: Record<string, unknown>;
    tier?: string;          // 'read' | 'write' | 'exec'
  };
}

export interface SDKToolResultMessage extends SDKMessageBase {
  type: 'tool_result';
  tool_use_id?: string;
  content?: string;
  is_error?: boolean;
}

export interface SDKSystemMessage extends SDKMessageBase {
  type: 'system';
  message?: string;
  subtype?: string;
}

export interface SDKErrorMessage extends SDKMessageBase {
  type: 'error';
  error?: string;
  message?: string;
}

export type SDKMessage =
  | SDKAssistantMessage | SDKResultMessage | SDKStreamEvent
  | SDKControlRequest | SDKToolResultMessage | SDKSystemMessage | SDKErrorMessage
  | SDKMessageBase;

// === CLI stdin 输入类型 (SDKUserMessage 协议) ===

/** Content block inside an API user message */
export type UserContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

/** Inner API-level user message (matches Anthropic APIUserMessage) */
export interface APIUserMessage {
  role: 'user';
  content: UserContentBlock[];
}

/**
 * SDKUserMessage — the envelope the CLI stream-json parser expects on stdin.
 *
 * CLI reads `message.message.role` (structuredIO.ts:457), so the nested
 * `message` field with `role: "user"` is mandatory.
 */
export interface UserInput {
  type: 'user';
  message: APIUserMessage;
  parent_tool_use_id: string | null;
}

export interface ControlResponse {
  type: 'control_response';
  permission: 'allow' | 'allow_session' | 'deny';
}

export type CLIInput = UserInput | ControlResponse;

// === Session 状态 ===
export type SessionState = 'idle' | 'starting' | 'streaming' | 'awaiting_permission' | 'stopped' | 'error' | 'reconnecting';

export interface SessionInfo {
  id: string;
  name: string;
  cwd: string;
  state: SessionState;
  createdAt: number;
}

export interface CLIStreamErrorPayload {
  sessionId: string;
  messageId: string;
  error: string;
  // v2.27.0 P0-2：'startup-early-exit' 表示 panda-cli 在 STARTUP_GRACE_MS 窗口内
  // 退出（认证缺失 / 端口冲突 / 启动期异常）。renderer 据此把错误归入 startup 类。
  reason?: 'exit' | 'spawn-error' | 'cli-error' | 'startup-early-exit';
  exitCode?: number | null;
  signal?: string | null;
  cwd?: string;
  cliPath?: string;
  bunPath?: string;
  args?: string[];
  stderrTail?: string;
  isPackaged?: boolean;
  resourcesPath?: string;
  configDir?: string;
  logPath?: string;
  // v2.27.0 Bug C：当 ensureSession 检测到 panda-cli PID registry 占用时附带
  // 'SESSION_OCCUPIED' 与占位 PID/cwd，renderer 据此弹中文友好提示。
  // v2.27.0 P0-1 阶段 2：cli-manager 改用 ConversationStartupError 工厂统一
  // 抛 6 个 PANDA_* code（PANDA_WORKDIR_NOT_FOUND / PANDA_WORKDIR_INVALID /
  // PANDA_CLI_SESSION_CONFLICT / PANDA_CLI_SPAWN_FAILED / PANDA_CLI_AUTH_REQUIRED /
  // PANDA_CLI_START_FAILED）。旧 code（SESSION_OCCUPIED / WORKDIR_NOT_FOUND /
  // WORKDIR_INVALID）保留作向后兼容，仅由 b7d9239 之前的旧 callers 偶发产生。
  code?:
    | 'SESSION_OCCUPIED'
    | 'WORKDIR_NOT_FOUND'
    | 'WORKDIR_INVALID'
    | 'PANDA_WORKDIR_NOT_FOUND'
    | 'PANDA_WORKDIR_INVALID'
    | 'PANDA_CLI_SESSION_CONFLICT'
    | 'PANDA_CLI_SPAWN_FAILED'
    | 'PANDA_CLI_AUTH_REQUIRED'
    | 'PANDA_CLI_START_FAILED'
    | string;
  occupierPid?: number;
  occupierCwd?: string;
  // v2.27.0 P0-1 阶段 2：ConversationStartupError.toJSON() 的结构序列化。
  // chatStore 据此读 context（如 spawn-failed.detail / start-failed.stderrTail）
  // 渲染更精确的 toast 文案。字段与 ConversationStartupErrorPayload 一致；
  // context 用 unknown 接收 narrow union 类型，chatStore 端按 code 分支安全 cast。
  errorClass?: {
    name: string;
    code: string;
    message: string;
    retryable: boolean;
    context?: unknown;
  };
}
