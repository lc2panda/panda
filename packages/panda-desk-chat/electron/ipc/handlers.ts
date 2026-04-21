// Input: ipcMain handle registrations + CLI backend manager (W7-2)
// Output: IPC request handlers for all 24 channels
// Pos: Main process IPC layer — routes renderer requests to CLI backend
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { ipcMain } from 'electron';

// ---------------------------------------------------------------------------
// IPC channel constants (must match schemas.ts IPC_CHANNELS)
// ---------------------------------------------------------------------------

const CH = {
  CHAT_SEND:           'panda:chat:send',
  CHAT_STOP:           'panda:chat:stop',
  CLIPBOARD_PASTE_IMG: 'panda:chat:clipboard:paste-image',
  SESSION_LIST:        'panda:session:list',
  SESSION_CREATE:      'panda:session:create',
  SESSION_RENAME:      'panda:session:rename',
  SESSION_DELETE:      'panda:session:delete',
  SESSION_FOCUS:       'panda:session:focus',
  TOOL_PERM_RESPONSE:  'panda:tool:permission:response',
  FS_SEARCH:           'panda:chat:fs:search',
  FS_LIST:             'panda:chat:fs:list',
  WINDOW_POSITION:     'panda:chat:window:position',
  SLASH_COMMANDS:      'panda:chat:slash-commands',
  MODEL_LIST:          'panda:chat:model:list',
  MODEL_SET:           'panda:chat:model:set',
  PERMISSION_MODE_SET: 'panda:chat:permission-mode:set',
} as const;

// ---------------------------------------------------------------------------
// Stub handler factory — logs and returns placeholder
// These will be replaced with real CLI backend integration in W7-2
// ---------------------------------------------------------------------------

function stubHandler(channel: string, defaultReturn: unknown = undefined) {
  return async (_event: Electron.IpcMainInvokeEvent, payload: unknown) => {
    console.log(`[IPC] ${channel}`, JSON.stringify(payload).slice(0, 200));
    return defaultReturn;
  };
}

// ---------------------------------------------------------------------------
// Register all IPC handlers
// ---------------------------------------------------------------------------

export function registerIpcHandlers(): void {
  // ── Chat messaging ─────────────────────────────────────────────────
  // W7-2: Replace with CLI backend spawn + streaming pipe
  ipcMain.handle(CH.CHAT_SEND, stubHandler(CH.CHAT_SEND));
  ipcMain.handle(CH.CHAT_STOP, stubHandler(CH.CHAT_STOP));
  ipcMain.handle(CH.CLIPBOARD_PASTE_IMG, stubHandler(CH.CLIPBOARD_PASTE_IMG));

  // ── Session management ─────────────────────────────────────────────
  ipcMain.handle(CH.SESSION_LIST, stubHandler(CH.SESSION_LIST, []));
  ipcMain.handle(CH.SESSION_CREATE, stubHandler(CH.SESSION_CREATE, { id: `session-${Date.now()}` }));
  ipcMain.handle(CH.SESSION_RENAME, stubHandler(CH.SESSION_RENAME));
  ipcMain.handle(CH.SESSION_DELETE, stubHandler(CH.SESSION_DELETE));
  ipcMain.handle(CH.SESSION_FOCUS, stubHandler(CH.SESSION_FOCUS));

  // ── Tool permissions ───────────────────────────────────────────────
  ipcMain.handle(CH.TOOL_PERM_RESPONSE, stubHandler(CH.TOOL_PERM_RESPONSE));

  // ── File system ────────────────────────────────────────────────────
  ipcMain.handle(CH.FS_SEARCH, stubHandler(CH.FS_SEARCH, []));
  ipcMain.handle(CH.FS_LIST, stubHandler(CH.FS_LIST, []));

  // ── Config & misc ──────────────────────────────────────────────────
  ipcMain.handle(CH.WINDOW_POSITION, stubHandler(CH.WINDOW_POSITION));
  ipcMain.handle(CH.SLASH_COMMANDS, stubHandler(CH.SLASH_COMMANDS, []));
  ipcMain.handle(CH.MODEL_LIST, stubHandler(CH.MODEL_LIST, []));
  ipcMain.handle(CH.MODEL_SET, stubHandler(CH.MODEL_SET));
  ipcMain.handle(CH.PERMISSION_MODE_SET, stubHandler(CH.PERMISSION_MODE_SET));

  console.log('[IPC] Registered 16 invoke handlers (stub mode — W7-2 will connect CLI backend)');
}

// ---------------------------------------------------------------------------
// Utility: send event from main to renderer (for M→R channels)
// Usage: sendToRenderer(win, 'panda:chat:stream:delta', { ... })
// ---------------------------------------------------------------------------

export function sendToRenderer(
  win: Electron.BrowserWindow | null,
  channel: string,
  ...args: unknown[]
): void {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args);
  }
}
