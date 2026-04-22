// Input: CLI stream-json NDJSON 协议消息
// Output: TypeScript 类型定义供 cli-manager 和 handlers 使用
// Pos: electron/backend — NDJSON 协议类型层
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

// === CLI stdout NDJSON 消息类型 ===

export type SDKMessageType =
  | 'assistant' | 'user' | 'result' | 'system'
  | 'tool_use' | 'tool_result' | 'stream_event'
  | 'control_request' | 'control_response' | 'keep_alive';

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

export type SDKMessage =
  | SDKAssistantMessage | SDKResultMessage | SDKStreamEvent
  | SDKControlRequest | SDKToolResultMessage | SDKSystemMessage
  | SDKMessageBase;

// === CLI stdin 输入类型 ===
export interface UserInput {
  type: 'user';
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  >;
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
