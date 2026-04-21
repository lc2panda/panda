// Input: IPC channel definitions (B2-architecture.md §III) — 24 channels
// Output: Channel constants + handler registration types for main process
// Pos: panda-on-desk main process IPC layer — consumed by main.ts handler registration
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

// ─── Channel constants (mirrored from panda-desk-chat/src/ipc/schemas.ts) ───
// Duplicated here intentionally: panda-on-desk is CommonJS and must not
// depend on panda-desk-chat (ESM/Vite). The single source of truth for
// schema validation lives in panda-desk-chat; these are plain strings.

export const CHAT_IPC_CHANNELS = {
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
} as const

export type ChatIpcChannel = typeof CHAT_IPC_CHANNELS[keyof typeof CHAT_IPC_CHANNELS]

// ─── Direction classification ───────────────────────────────────────────────

/** Channels where renderer invokes main and expects a response. */
export const INVOKE_CHANNELS: readonly ChatIpcChannel[] = [
  CHAT_IPC_CHANNELS.CHAT_SEND,
  CHAT_IPC_CHANNELS.CHAT_STOP,
  CHAT_IPC_CHANNELS.SESSION_LIST,
  CHAT_IPC_CHANNELS.SESSION_CREATE,
  CHAT_IPC_CHANNELS.SESSION_RENAME,
  CHAT_IPC_CHANNELS.SESSION_DELETE,
  CHAT_IPC_CHANNELS.SESSION_FOCUS,
  CHAT_IPC_CHANNELS.TOOL_PERM_RESPONSE,
  CHAT_IPC_CHANNELS.FS_SEARCH,
  CHAT_IPC_CHANNELS.FS_LIST,
  CHAT_IPC_CHANNELS.WINDOW_POSITION,
  CHAT_IPC_CHANNELS.SLASH_COMMANDS,
  CHAT_IPC_CHANNELS.MODEL_LIST,
  CHAT_IPC_CHANNELS.MODEL_SET,
  CHAT_IPC_CHANNELS.PERMISSION_MODE_SET,
  CHAT_IPC_CHANNELS.CLIPBOARD_PASTE_IMG,
]

/** Channels where main pushes events to renderer. */
export const EVENT_CHANNELS: readonly ChatIpcChannel[] = [
  CHAT_IPC_CHANNELS.CHAT_STREAM_START,
  CHAT_IPC_CHANNELS.CHAT_STREAM_DELTA,
  CHAT_IPC_CHANNELS.CHAT_STREAM_END,
  CHAT_IPC_CHANNELS.CHAT_WINDOW_TOGGLE,
  CHAT_IPC_CHANNELS.SESSION_UPDATED,
  CHAT_IPC_CHANNELS.TOOL_USE_START,
  CHAT_IPC_CHANNELS.TOOL_USE_END,
  CHAT_IPC_CHANNELS.TOOL_PERM_REQUEST,
]
