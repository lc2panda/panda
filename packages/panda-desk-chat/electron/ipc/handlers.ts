// Input: ipcMain handle registrations + CLI backend manager (W7-2), WindowManager, notificationManager, appUpdater
// Output: IPC request handlers for all 24 channels — connected to CLIManager + WindowManager + nativeTheme + notifications + updater
// Pos: Main process IPC layer — routes renderer requests to CLI backend
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { ipcMain, BrowserWindow, clipboard, nativeImage, nativeTheme } from 'electron';
import { readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { cliManager } from '../backend/cli-manager';
import { notificationManager } from '../notification';
import { appUpdater } from '../updater';
import { windowManager } from '../window-manager';

// ---------------------------------------------------------------------------
// IPC channel constants (must match preload/chat.ts)
// ---------------------------------------------------------------------------

const CH = {
  CHAT_SEND:           'panda:chat:send',
  CHAT_STOP:           'panda:chat:stop',
  CLIPBOARD_PASTE_IMG: 'panda:chat:clipboard:paste-image',
  SESSION_LIST:        'panda:session:list',
  SESSION_CREATE:      'panda:session:create',
  SESSION_RENAME:      'panda:session:rename',
  SESSION_DELETE:       'panda:session:delete',
  SESSION_FOCUS:       'panda:session:focus',
  TOOL_PERM_RESPONSE:  'panda:tool:permission:response',
  FS_SEARCH:           'panda:chat:fs:search',
  FS_LIST:             'panda:chat:fs:list',
  WINDOW_POSITION:     'panda:chat:window:position',
  SLASH_COMMANDS:      'panda:chat:slash-commands',
  MODEL_LIST:          'panda:chat:model:list',
  MODEL_SET:           'panda:chat:model:set',
  PERMISSION_MODE_SET: 'panda:chat:permission-mode:set',
  // Theme
  THEME_GET_SYSTEM:    'panda:theme:get-system',
  // Notifications
  NOTIFICATION_SET_ENABLED: 'panda:notification:set-enabled',
  NOTIFICATION_CLEAR:       'panda:notification:clear',
  // Update
  UPDATE_CHECK:    'panda:update:check',
  UPDATE_DOWNLOAD: 'panda:update:download',
  UPDATE_INSTALL:  'panda:update:install',
  // Window management
  WINDOW_NEW:           'panda:window:new',
  WINDOW_OPEN_SESSION:  'panda:window:open-session',
  WINDOW_GET_ID:        'panda:window:get-id',
} as const;

// ---------------------------------------------------------------------------
// Setup: connect CLIManager to main BrowserWindow
// ---------------------------------------------------------------------------

export function setupMainWindow(win: BrowserWindow): void {
  cliManager.registerWindow(win);
}

// ---------------------------------------------------------------------------
// Built-in slash commands & model list
// ---------------------------------------------------------------------------

const BUILTIN_SLASH_COMMANDS = [
  { name: '/help',    description: 'Show available commands' },
  { name: '/clear',   description: 'Clear conversation history' },
  { name: '/compact', description: 'Compact conversation context' },
  { name: '/cost',    description: 'Show token usage and cost' },
  { name: '/doctor',  description: 'Diagnose configuration issues' },
  { name: '/init',    description: 'Initialize CLAUDE.md for project' },
  { name: '/login',   description: 'Switch authentication' },
  { name: '/memory',  description: 'Edit CLAUDE.md memory files' },
];

const AVAILABLE_MODELS = [
  { id: 'claude-sonnet-4-20250514',  name: 'Claude Sonnet 4',  provider: 'anthropic' },
  { id: 'claude-opus-4-20250514',    name: 'Claude Opus 4',    provider: 'anthropic' },
  { id: 'claude-haiku-235-20241022', name: 'Claude Haiku 3.5', provider: 'anthropic' },
];

// ---------------------------------------------------------------------------
// Register all IPC handlers
// ---------------------------------------------------------------------------

export function registerIpcHandlers(): void {
  // ── Chat messaging ─────────────────────────────────────────────────

  ipcMain.handle(CH.CHAT_SEND, async (_event, payload: { sessionId: string; content: string; attachments?: Array<{ mediaType: string; data: string }> }) => {
    try {
      await cliManager.sendMessage(payload.sessionId, payload.content, payload.attachments);
    } catch (err) {
      console.error('[IPC] CHAT_SEND failed:', err);
      throw err;
    }
  });

  ipcMain.handle(CH.CHAT_STOP, async (_event, payload: { sessionId: string }) => {
    cliManager.stopStream(payload.sessionId);
  });

  ipcMain.handle(CH.CLIPBOARD_PASTE_IMG, async (_event, _payload: unknown) => {
    const image = clipboard.readImage();
    if (image.isEmpty()) return null;
    const buffer = image.toPNG();
    return buffer.toString('base64');
  });

  // ── Session management ─────────────────────────────────────────────

  ipcMain.handle(CH.SESSION_LIST, async () => {
    return cliManager.listSessions();
  });

  ipcMain.handle(CH.SESSION_CREATE, async (_event, payload: { cwd: string; name?: string }) => {
    return await cliManager.createSession(payload.cwd, payload.name);
  });

  ipcMain.handle(CH.SESSION_RENAME, async (_event, payload: { sessionId: string; name: string }) => {
    return cliManager.renameSession(payload.sessionId, payload.name);
  });

  ipcMain.handle(CH.SESSION_DELETE, async (_event, payload: { sessionId: string }) => {
    await cliManager.deleteSession(payload.sessionId);
  });

  ipcMain.handle(CH.SESSION_FOCUS, async (_event, payload: { sessionId: string }) => {
    try {
      return await cliManager.focusSession(payload.sessionId);
    } catch (err) {
      console.error('[IPC] SESSION_FOCUS failed:', err);
      throw err;
    }
  });

  // ── Tool permissions ───────────────────────────────────────────────

  ipcMain.handle(CH.TOOL_PERM_RESPONSE, async (_event, payload: { sessionId: string; decision: 'allow' | 'allow_session' | 'deny' }) => {
    cliManager.respondPermission(payload.sessionId, payload.decision);
  });

  // ── File system ────────────────────────────────────────────────────

  ipcMain.handle(CH.FS_SEARCH, async (_event, payload: { directory: string; query: string }) => {
    try {
      const entries = await readdir(payload.directory, { withFileTypes: true });
      const query = payload.query.toLowerCase();
      const results: Array<{ name: string; path: string; isDir: boolean }> = [];

      for (const entry of entries) {
        if (entry.name.toLowerCase().includes(query)) {
          results.push({
            name: entry.name,
            path: join(payload.directory, entry.name),
            isDir: entry.isDirectory(),
          });
        }
        if (results.length >= 50) break; // Bound results
      }

      return results;
    } catch (err) {
      console.error('[IPC:FS_SEARCH] Error:', err);
      return [];
    }
  });

  ipcMain.handle(CH.FS_LIST, async (_event, payload: { directory: string }) => {
    if (!payload?.directory || typeof payload.directory !== 'string') {
      return { success: false, files: [], error: 'Invalid directory path' };
    }
    try {
      const entries = await readdir(payload.directory, { withFileTypes: true });
      const results: Array<{ name: string; path: string; isDir: boolean; size: number }> = [];

      for (const entry of entries) {
        const fullPath = join(payload.directory, entry.name);
        let size = 0;
        try {
          const s = await stat(fullPath);
          size = s.size;
        } catch { /* skip stat errors */ }

        results.push({
          name: entry.name,
          path: fullPath,
          isDir: entry.isDirectory(),
          size,
        });
      }

      return results;
    } catch (err) {
      console.error('[IPC:FS_LIST] Error:', err);
      return [];
    }
  });

  // ── Config & misc ──────────────────────────────────────────────────

  ipcMain.handle(CH.SLASH_COMMANDS, async () => {
    return BUILTIN_SLASH_COMMANDS;
  });

  ipcMain.handle(CH.MODEL_LIST, async () => {
    return AVAILABLE_MODELS;
  });

  ipcMain.handle(CH.MODEL_SET, async (_event, payload: { model: string }) => {
    cliManager.setModel(payload.model);
  });

  ipcMain.handle(CH.PERMISSION_MODE_SET, async (_event, payload: { mode: string }) => {
    cliManager.setPermissionMode(payload.mode);
  });

  ipcMain.handle(CH.WINDOW_POSITION, async (event, payload: { x: number; y: number; width: number; height: number }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.setBounds({
        x: Math.round(payload.x),
        y: Math.round(payload.y),
        width: Math.round(payload.width),
        height: Math.round(payload.height),
      });
    }
  });

  // ── Theme ─────────────────────────────────────────────────────────

  ipcMain.handle(CH.THEME_GET_SYSTEM, async () => {
    return nativeTheme.shouldUseDarkColors;
  });

  // ── Notifications ──────────────────────────────────────────────────

  ipcMain.handle(CH.NOTIFICATION_SET_ENABLED, async (_event, enabled: boolean) => {
    notificationManager.setEnabled(enabled);
  });

  ipcMain.handle(CH.NOTIFICATION_CLEAR, async () => {
    notificationManager.clearUnread();
  });

  // ── Auto-update ─────────────────────────────────────────────────────

  ipcMain.handle(CH.UPDATE_CHECK, async () => {
    await appUpdater.checkForUpdates();
  });

  ipcMain.handle(CH.UPDATE_DOWNLOAD, async () => {
    await appUpdater.downloadUpdate();
  });

  ipcMain.handle(CH.UPDATE_INSTALL, async () => {
    appUpdater.quitAndInstall();
  });

  // ── Window management ──────────────────────────────────────────────

  ipcMain.handle(CH.WINDOW_NEW, async () => {
    const win = windowManager.createWindow();
    cliManager.registerWindow(win);
    return { windowId: win.id };
  });

  ipcMain.handle(CH.WINDOW_OPEN_SESSION, async (_event, payload: { sessionId: string }) => {
    // Check if a window is already showing this session
    const existing = windowManager.getWindowForSession(payload.sessionId);
    if (existing && !existing.isDestroyed()) {
      existing.focus();
      return { windowId: existing.id, reused: true };
    }
    // Create a new window targeting this session
    const win = windowManager.createWindow({ sessionId: payload.sessionId });
    cliManager.registerWindow(win);
    return { windowId: win.id, reused: false };
  });

  ipcMain.handle(CH.WINDOW_GET_ID, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win?.id ?? -1;
  });

  console.log('[IPC] Registered 24 invoke handlers (CLI backend + window manager connected)');
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
