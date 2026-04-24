// Input: ipcMain handle registrations + CLI backend manager (W7-2), WindowManager, notificationManager, appUpdater, cronScheduler
// Output: IPC request handlers (CLI backend + window manager + scheduled tasks) — connected to CLIManager + WindowManager + nativeTheme + notifications + updater + CronScheduler
// Pos: Main process IPC layer — routes renderer requests to backend services
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { ipcMain, BrowserWindow, clipboard, nativeImage, nativeTheme } from 'electron';
import { readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { cliManager } from '../backend/cli-manager';
import {
  listAllSessions as diskListAllSessions,
  getSessionDetail as diskGetSessionDetail,
} from '../backend/disk-session-scanner';
import { cronScheduler, type CreateTaskInput, type ScheduledTask } from '../backend/cron-scheduler';
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
  SESSION_LIST_ALL:    'panda:session:list-all',
  SESSION_GET_HISTORY: 'panda:session:get-history',
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
  // Scheduled tasks
  SCHEDULE_LIST:        'panda:schedule:list',
  SCHEDULE_CREATE:      'panda:schedule:create',
  SCHEDULE_UPDATE:      'panda:schedule:update',
  SCHEDULE_DELETE:      'panda:schedule:delete',
  SCHEDULE_RUN_NOW:     'panda:schedule:run-now',
  SCHEDULE_TOGGLE:      'panda:schedule:toggle',
  SCHEDULE_VALIDATE:    'panda:schedule:validate-cron',
  SCHEDULE_UPDATED:     'panda:schedule:update', // M→R push on tasks change
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

  // ── Disk-based session discovery (read ~/.pandacc/projects/**/*.jsonl) ──
  // These handlers serve the "history" sidebar: the on-disk transcripts
  // produced by past CLI sessions, independent of any running CLI process.
  // Reference: monitor/tmp/cc-haha-0.1.5/src/server/services/sessionService.ts

  ipcMain.handle(CH.SESSION_LIST_ALL, async () => {
    try {
      return await diskListAllSessions();
    } catch (err) {
      console.error('[IPC] SESSION_LIST_ALL failed:', err);
      return [];
    }
  });

  ipcMain.handle(CH.SESSION_GET_HISTORY, async (_event, payload: { sessionId: string }) => {
    try {
      if (!payload?.sessionId || typeof payload.sessionId !== 'string') {
        return null;
      }
      return await diskGetSessionDetail(payload.sessionId);
    } catch (err) {
      console.error('[IPC] SESSION_GET_HISTORY failed:', err);
      return null;
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

  // ── Scheduled tasks ────────────────────────────────────────────────
  registerScheduleHandlers();

  console.log('[IPC] Registered invoke handlers (CLI backend + window manager + schedule connected)');
}

// ---------------------------------------------------------------------------
// Schedule-specific handlers + scheduler bootstrap
// ---------------------------------------------------------------------------

let scheduleInitialized = false;

function registerScheduleHandlers(): void {
  if (scheduleInitialized) return;
  scheduleInitialized = true;

  // Wire scheduler events → broadcast to all renderers
  cronScheduler.on('tasks:updated', (tasks: ScheduledTask[]) => {
    windowManager.broadcast(CH.SCHEDULE_UPDATED, { tasks });
  });

  // Register the executor: a fired task creates (or reuses) a session and
  // injects the prompt as a user message.  Failures bubble up as log errors.
  cronScheduler.setExecutor(async (task) => {
    try {
      const sessionInfo = await cliManager.createSession(
        task.cwd || process.cwd(),
        `[schedule] ${task.name}`,
      );
      await cliManager.sendMessage(sessionInfo.id, task.prompt);
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[schedule] Task "${task.name}" failed:`, msg);
      return { ok: false, error: msg };
    }
  });

  // Initialize from disk (~/.pandacc/scheduled_tasks.json)
  void cronScheduler.init().catch((err) => {
    console.error('[schedule] init failed:', err);
  });

  ipcMain.handle(CH.SCHEDULE_LIST, async () => {
    return cronScheduler.list();
  });

  ipcMain.handle(
    CH.SCHEDULE_CREATE,
    async (_event, payload: CreateTaskInput) => {
      if (!payload || typeof payload.name !== 'string' || typeof payload.cron !== 'string' || typeof payload.prompt !== 'string') {
        throw new Error('schedule:create requires { name, cron, prompt }');
      }
      return cronScheduler.create(payload);
    },
  );

  ipcMain.handle(
    CH.SCHEDULE_UPDATE,
    async (
      _event,
      payload: { id: string; updates: Partial<Pick<ScheduledTask, 'name' | 'description' | 'cron' | 'prompt' | 'cwd' | 'status'>> },
    ) => {
      if (!payload?.id || !payload.updates) {
        throw new Error('schedule:update requires { id, updates }');
      }
      return cronScheduler.update(payload.id, payload.updates);
    },
  );

  ipcMain.handle(CH.SCHEDULE_DELETE, async (_event, payload: { id: string }) => {
    if (!payload?.id) throw new Error('schedule:delete requires { id }');
    return cronScheduler.remove(payload.id);
  });

  ipcMain.handle(CH.SCHEDULE_RUN_NOW, async (_event, payload: { id: string }) => {
    if (!payload?.id) throw new Error('schedule:run-now requires { id }');
    return cronScheduler.runNow(payload.id);
  });

  ipcMain.handle(CH.SCHEDULE_TOGGLE, async (_event, payload: { id: string }) => {
    if (!payload?.id) throw new Error('schedule:toggle requires { id }');
    return cronScheduler.toggle(payload.id);
  });

  ipcMain.handle(CH.SCHEDULE_VALIDATE, async (_event, payload: { cron: string }) => {
    if (!payload?.cron || typeof payload.cron !== 'string') return { valid: false };
    const { isValidCron, nextCronRunMs } = await import('../backend/cron-scheduler');
    const valid = isValidCron(payload.cron);
    const nextMs = valid ? nextCronRunMs(payload.cron, Date.now()) : null;
    return {
      valid,
      nextRunAt: nextMs ? new Date(nextMs).toISOString() : null,
    };
  });
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
