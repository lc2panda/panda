// Input: IPC channel definitions (B2-architecture.md §III) — 26 channels
// Output: Zod schemas + channel constants for type-safe IPC validation
// Pos: IPC foundation layer — consumed by preload, main process, and chat renderer
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { z } from 'zod';

// ─── Channel name constants ────────────────────────────────────────────────────

export const IPC_CHANNELS = {
  // Chat messaging (6)
  CHAT_SEND:           'panda:chat:send',
  CHAT_STREAM_START:   'panda:chat:stream:start',
  CHAT_STREAM_DELTA:   'panda:chat:stream:delta',
  CHAT_STREAM_END:     'panda:chat:stream:end',
  CHAT_STOP:           'panda:chat:stop',
  CHAT_WINDOW_TOGGLE:  'panda:chat:window:toggle',

  // Session management (6)
  SESSION_LIST:        'panda:session:list',
  SESSION_CREATE:      'panda:session:create',
  SESSION_RENAME:      'panda:session:rename',
  SESSION_DELETE:      'panda:session:delete',
  SESSION_FOCUS:       'panda:session:focus',
  SESSION_UPDATED:     'panda:session:updated',

  // Tool permissions (4)
  TOOL_USE_START:      'panda:tool:use:start',
  TOOL_USE_END:        'panda:tool:use:end',
  TOOL_PERM_REQUEST:   'panda:tool:permission:request',
  TOOL_PERM_RESPONSE:  'panda:tool:permission:response',

  // File system (2)
  FS_SEARCH:           'panda:chat:fs:search',
  FS_LIST:             'panda:chat:fs:list',

  // Config & misc (6)
  WINDOW_POSITION:     'panda:chat:window:position',
  SLASH_COMMANDS:      'panda:chat:slash-commands',
  MODEL_LIST:          'panda:chat:model:list',
  MODEL_SET:           'panda:chat:model:set',
  PERMISSION_MODE_SET: 'panda:chat:permission-mode:set',
  CLIPBOARD_PASTE_IMG: 'panda:chat:clipboard:paste-image',

  // Window management (2)
  WINDOW_NEW:           'panda:window:new',
  WINDOW_OPEN_SESSION:  'panda:window:open-session',
} as const;

// ─── Shared sub-schemas ────────────────────────────────────────────────────────

// Bug E 修复（方案 B）：附件 schema 改为 { mediaType, data } base64 内联形态，
// 与 electron/ipc/handlers.ts CHAT_SEND handler 期望（Array<{ mediaType: string; data: string }>）
// 以及 cli-manager.sendMessage / interactive REPL 控制协议保持一致。
// 旧 { type, path } 形态已废弃 — Desk Chat 不依赖外置文件路径，全程 dataURL → base64。
//
// WO-H9：IPC 双层防御 — data 字段最大字符数对应 ~4.7MB base64 + buffer
// 4_700_000 bytes ÷ 0.75（base64 ratio）× 1 = ~6_267_000 chars；取 6_500_000 留余量。
const MAX_ATTACHMENT_DATA_CHARS = 6_500_000;
const attachmentSchema = z.object({
  mediaType: z.string(),
  data: z.string().max(MAX_ATTACHMENT_DATA_CHARS, '单张图片超过 IPC 传输大小上限（~4.7MB）'),
});

const tokenUsageSchema = z.object({
  input: z.number().int().min(0),
  output: z.number().int().min(0),
  cacheRead: z.number().int().min(0).optional(),
  cacheWrite: z.number().int().min(0).optional(),
});

const sessionMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  cwd: z.string(),
  createdAt: z.string(),
  lastActive: z.string(),
  messageCount: z.number().int().min(0),
});

const fsEntrySchema = z.object({
  path: z.string(),
  name: z.string(),
  isDir: z.boolean(),
});

const dirEntrySchema = z.object({
  name: z.string(),
  isDir: z.boolean(),
  size: z.number().min(0),
});

const slashCommandSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
});

const modelInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  maxTokens: z.number().int().positive(),
});

// ─── 1. Chat: send (renderer → main) ──────────────────────────────────────────

export const chatSendSchema = z.object({
  sessionId: z.string().min(1),
  content: z.string().min(1),
  attachments: z.array(attachmentSchema).optional(),
});

// ─── 2. Chat: stream start (main → renderer) ──────────────────────────────────

export const chatStreamStartSchema = z.object({
  sessionId: z.string(),
  messageId: z.string(),
});

// ─── 3. Chat: stream delta (main → renderer, 16ms throttled) ──────────────────

export const chatStreamDeltaSchema = z.object({
  sessionId: z.string(),
  messageId: z.string(),
  delta: z.string(),
  type: z.enum(['text', 'thinking', 'tool_input']),
});

// ─── 4. Chat: stream end (main → renderer) ────────────────────────────────────

export const chatStreamEndSchema = z.object({
  sessionId: z.string(),
  messageId: z.string(),
  finishReason: z.enum(['end_turn', 'max_tokens', 'stop_sequence', 'tool_use']),
  tokenUsage: tokenUsageSchema.optional(),
});

// ─── 5. Chat: stop (renderer → main) ──────────────────────────────────────────

export const chatStopSchema = z.object({
  sessionId: z.string().min(1),
});

// ─── 6. Chat: window toggle (tray → main → renderer) ─────────────────────────

export const chatWindowToggleSchema = z.object({});

// ─── 7. Session: list (renderer → main) ───────────────────────────────────────

export const sessionListRequestSchema = z.object({});

export const sessionListResponseSchema = z.array(sessionMetaSchema);

// ─── 8. Session: create (renderer → main) ─────────────────────────────────────

export const sessionCreateRequestSchema = z.object({
  cwd: z.string().min(1),
  name: z.string().optional(),
});

export const sessionCreateResponseSchema = z.object({
  id: z.string(),
});

// ─── 9. Session: rename (renderer → main) ─────────────────────────────────────

export const sessionRenameSchema = z.object({
  sessionId: z.string().min(1),
  name: z.string().min(1),
});

// ─── 10. Session: delete (renderer → main) ────────────────────────────────────

export const sessionDeleteSchema = z.object({
  sessionId: z.string().min(1),
});

// ─── 11. Session: focus (renderer → main) ─────────────────────────────────────

export const sessionFocusSchema = z.object({
  sessionId: z.string().min(1),
});

// ─── 12. Session: updated (main → renderer) ──────────────────────────────────

export const sessionUpdatedSchema = z.object({
  sessions: z.array(sessionMetaSchema),
});

// ─── 13. Tool: use start (main → renderer) ───────────────────────────────────

export const toolUseStartSchema = z.object({
  sessionId: z.string(),
  toolUseId: z.string(),
  toolName: z.string(),
  input: z.record(z.string(), z.unknown()),
});

// ─── 14. Tool: use end (main → renderer) ─────────────────────────────────────

export const toolUseEndSchema = z.object({
  sessionId: z.string(),
  toolUseId: z.string(),
  toolName: z.string(),
  result: z.string(),
  isError: z.boolean(),
});

// ─── 15. Tool: permission request (main → renderer) ──────────────────────────

export const toolPermRequestSchema = z.object({
  sessionId: z.string(),
  toolUseId: z.string(),
  toolName: z.string(),
  input: z.record(z.string(), z.unknown()),
  tier: z.enum(['read', 'write', 'exec']),
});

// ─── 16. Tool: permission response (renderer → main) ────────────────────────

export const toolPermResponseSchema = z.object({
  sessionId: z.string().min(1),
  toolUseId: z.string().min(1),
  decision: z.enum(['allow', 'allow_session', 'deny']),
});

// ─── 17. FS: search (renderer → main) ───────────────────────────────────────

export const fsSearchRequestSchema = z.object({
  sessionId: z.string().min(1),
  query: z.string().min(1),
  maxResults: z.number().int().positive().optional(),
});

export const fsSearchResponseSchema = z.array(fsEntrySchema);

// ─── 18. FS: list (renderer → main) ─────────────────────────────────────────

export const fsListRequestSchema = z.object({
  sessionId: z.string().min(1),
  dirPath: z.string().min(1),
});

export const fsListResponseSchema = z.array(dirEntrySchema);

// ─── 19. Window: position (renderer → main) ─────────────────────────────────

export const windowPositionSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

// ─── 20. Slash commands (renderer → main) ───────────────────────────────────

export const slashCommandsRequestSchema = z.object({});

export const slashCommandsResponseSchema = z.array(slashCommandSchema);

// ─── 21. Model: list (renderer → main) ──────────────────────────────────────

export const modelListRequestSchema = z.object({});

export const modelListResponseSchema = z.array(modelInfoSchema);

// ─── 22. Model: set (renderer → main) ──────────────────────────────────────

export const modelSetSchema = z.object({
  sessionId: z.string().min(1).optional(),
  modelId: z.string().min(1),
});

// ─── 23. Permission mode: set (renderer → main) ────────────────────────────

export const permissionModeSetSchema = z.object({
  mode: z.enum(['default', 'plan', 'auto', 'bypassPermissions']),
});

// ─── 24. Clipboard: paste image (renderer → main, max 10MB) ────────────────

const MAX_DATA_URL_LENGTH = 10 * 1024 * 1024 * 1.37; // ~10MB base64 ≈ 13.7M chars

export const clipboardPasteImageSchema = z.object({
  sessionId: z.string().min(1),
  dataUrl: z.string()
    .startsWith('data:image/')
    .max(MAX_DATA_URL_LENGTH, 'Image exceeds 10MB limit'),
});

// ─── Schema registry ────────────────────────────────────────────────────────

export const ipcSchemas = {
  // Chat messaging
  [IPC_CHANNELS.CHAT_SEND]:          { request: chatSendSchema },
  [IPC_CHANNELS.CHAT_STREAM_START]:  { event: chatStreamStartSchema },
  [IPC_CHANNELS.CHAT_STREAM_DELTA]:  { event: chatStreamDeltaSchema },
  [IPC_CHANNELS.CHAT_STREAM_END]:    { event: chatStreamEndSchema },
  [IPC_CHANNELS.CHAT_STOP]:          { request: chatStopSchema },
  [IPC_CHANNELS.CHAT_WINDOW_TOGGLE]: { event: chatWindowToggleSchema },

  // Session management
  [IPC_CHANNELS.SESSION_LIST]:    { request: sessionListRequestSchema,   response: sessionListResponseSchema },
  [IPC_CHANNELS.SESSION_CREATE]:  { request: sessionCreateRequestSchema, response: sessionCreateResponseSchema },
  [IPC_CHANNELS.SESSION_RENAME]:  { request: sessionRenameSchema },
  [IPC_CHANNELS.SESSION_DELETE]:  { request: sessionDeleteSchema },
  [IPC_CHANNELS.SESSION_FOCUS]:   { request: sessionFocusSchema },
  [IPC_CHANNELS.SESSION_UPDATED]: { event: sessionUpdatedSchema },

  // Tool permissions
  [IPC_CHANNELS.TOOL_USE_START]:    { event: toolUseStartSchema },
  [IPC_CHANNELS.TOOL_USE_END]:      { event: toolUseEndSchema },
  [IPC_CHANNELS.TOOL_PERM_REQUEST]: { event: toolPermRequestSchema },
  [IPC_CHANNELS.TOOL_PERM_RESPONSE]: { request: toolPermResponseSchema },

  // File system
  [IPC_CHANNELS.FS_SEARCH]: { request: fsSearchRequestSchema, response: fsSearchResponseSchema },
  [IPC_CHANNELS.FS_LIST]:   { request: fsListRequestSchema,   response: fsListResponseSchema },

  // Config & misc
  [IPC_CHANNELS.WINDOW_POSITION]:     { request: windowPositionSchema },
  [IPC_CHANNELS.SLASH_COMMANDS]:      { request: slashCommandsRequestSchema, response: slashCommandsResponseSchema },
  [IPC_CHANNELS.MODEL_LIST]:          { request: modelListRequestSchema,     response: modelListResponseSchema },
  [IPC_CHANNELS.MODEL_SET]:           { request: modelSetSchema },
  [IPC_CHANNELS.PERMISSION_MODE_SET]: { request: permissionModeSetSchema },
  [IPC_CHANNELS.CLIPBOARD_PASTE_IMG]: { request: clipboardPasteImageSchema },
} as const;

// ─── Re-export sub-schemas for external use ─────────────────────────────────

export { sessionMetaSchema, tokenUsageSchema, attachmentSchema };
