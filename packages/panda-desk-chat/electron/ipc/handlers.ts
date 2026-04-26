// Input: ipcMain handle registrations + CLI backend manager (W7-2), WindowManager, notificationManager, appUpdater, cronScheduler
// Output: IPC request handlers (CLI backend + window manager + scheduled tasks + pandacc scanner) — connected to CLIManager + WindowManager + nativeTheme + notifications + updater + CronScheduler + pandacc-scanner
// Pos: Main process IPC layer — routes renderer requests to backend services
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { ipcMain, BrowserWindow, clipboard, nativeImage, nativeTheme } from 'electron';
import { readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { spawn as childSpawn } from 'node:child_process';
import { cliManager } from '../backend/cli-manager';
import {
  listAllSessions as diskListAllSessions,
  getSessionDetail as diskGetSessionDetail,
  getSessionLaunchInfo as diskGetSessionLaunchInfo,
} from '../backend/disk-session-scanner';
import {
  scanLearningPlans as scanLearningPlansBackend,
  scanFlashcards as scanFlashcardsBackend,
  readPlan as readLearningPlan,
  readFlashcards as readLearningFlashcards,
} from '../backend/learning-scanner';
// Comdr 指令: Agent Teams — panda CLI ~/.pandacc/teams 落盘数据扫描
import {
  listTeams as scanTeams,
  getTeamDetail as readTeamDetail,
  isAgentTeamsEnabled as readAgentTeamsEnabled,
} from '../backend/team-scanner';
// Comdr 指令 cc-haha 路线 A: 工具调用调试器 — audit.jsonl 反向读
import {
  listRecentAudit as scanRecentAudit,
  filterAudit as scanFilteredAudit,
  getAuditStats as scanAuditStats,
  type AuditFilter,
} from '../backend/audit-scanner';
// Comdr 指令 cc-haha 路线 A: PdPatternsScars / PdMemoryBank — memdir 反向读
import {
  listMemdirProjects as scanMemdirProjects,
  listLayerEntries as scanMemdirLayer,
  readMemdirFile as readMemdirFileBackend,
  type MemdirLayer,
} from '../backend/memdir-scanner';
// Comdr 指令 cc-haha 路线 A: PdConnectors — connectors.json 真实数据
import {
  getConnectorsConfig as readConnectorsConfig,
  toggleConnector as writeConnectorToggle,
  type ConnectorPlatform,
} from '../backend/connectors-scanner';
// Comdr 指令 cc-haha 路线 A: PdSessionControls — fork/branch/resume slash 注入
import {
  dispatchSessionControl,
  type SessionControlAction,
} from '../backend/session-controls';
import { cronScheduler, type CreateTaskInput, type ScheduledTask } from '../backend/cron-scheduler';
// Comdr 指令: IM Wechat — IM Adapter 启停管理（feishu/telegram/wechat）
import { adapterManager, type AdapterPlatform } from '../backend/adapter-manager';
// Comdr 指令: 超级助手 Wechat DB — 微信本地 db 解密链路
import {
  getWechatDbStatus,
  setWechatConfig,
  setWechatProactive,
  triggerWechatDecrypt,
  type WechatConfigPatch,
  type WechatProactivePatch,
} from '../backend/wechat-db-manager';
// Comdr 指令: ~/.pandacc 实际配置目录扫描器（Skills/Agents/Plugins/Env/ComputerUse）
// Comdr 指令: ComputerUse 完整实现 - cc-haha 对标 — 加 4 个 ComputerUse handler
import {
  listSkills as scanSkills,
  listAgents as scanAgents,
  listPlugins as scanPlugins,
  getPandaEnv as readPandaEnv,
  setPandaEnvKey as writePandaEnvKey,
  getComputerUseStatusEx as scanComputerUse,
  listInstalledApps as scanInstalledApps,
  getAuthorizedApps as readAuthorizedApps,
  setAuthorizedApps as writeAuthorizedApps,
  openSystemPrivacySettings as openSysPrivacy,
  type AuthorizedApp,
  type ComputerUseGrantFlags,
} from '../backend/pandacc-scanner';
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
  // 遗留 IPC 修复 #1: cc-haha sessionsApi.getGitInfo 对齐
  SESSION_GIT_INFO:    'panda:session:git-info',
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
  // Comdr 指令: 6 个 pandacc Settings sub-tab IPC channels
  PANDA_SKILLS_LIST:        'panda:skills:list',
  PANDA_AGENTS_LIST:        'panda:agents:list',
  PANDA_PLUGINS_LIST:       'panda:plugins:list',
  PANDA_ENV_GET:            'panda:env:get',
  PANDA_ENV_SET:            'panda:env:set',
  PANDA_COMPUTER_USE_STATUS:           'panda:computer-use:status',
  // Comdr 指令: ComputerUse 完整实现 - cc-haha 对标 (4 个新 channel)
  PANDA_COMPUTER_USE_INSTALLED_APPS:   'panda:computer-use:installed-apps',
  PANDA_COMPUTER_USE_AUTHORIZED_APPS:  'panda:computer-use:authorized-apps',
  PANDA_COMPUTER_USE_SET_AUTHORIZED:   'panda:computer-use:set-authorized-apps',
  PANDA_COMPUTER_USE_OPEN_SETTINGS:    'panda:computer-use:open-settings',
  // Comdr 指令: IM Wechat / 任务 B — IM Adapter 启停 (3 个 channel)
  ADAPTER_START:        'panda:adapter:start',
  ADAPTER_STOP:         'panda:adapter:stop',
  ADAPTER_STATUS:       'panda:adapter:status',
  // Comdr 指令: 超级助手 Wechat DB / 任务 C — 微信本地 db 解密 (4 个 channel)
  WECHAT_STATUS:        'panda:wechat:status',
  WECHAT_SET_CONFIG:    'panda:wechat:set-config',
  WECHAT_SET_PROACTIVE: 'panda:wechat:set-proactive',
  WECHAT_DECRYPT:       'panda:wechat:decrypt',
  // Comdr 指令: 学习助手 — panda CLI /learn 落盘数据扫描 (4 个 channel)
  LEARNING_LIST_PLANS:        'panda:learning:list-plans',
  LEARNING_LIST_FLASHCARDS:   'panda:learning:list-flashcards',
  LEARNING_READ_PLAN:         'panda:learning:read-plan',
  LEARNING_READ_FLASHCARDS:   'panda:learning:read-flashcards',
  // Comdr 指令: Agent Teams — panda CLI ~/.pandacc/teams 落盘数据扫描 (3 个 channel)
  TEAMS_LIST:           'panda:teams:list',
  TEAMS_DETAIL:         'panda:teams:detail',
  TEAMS_ENABLED_STATUS: 'panda:teams:enabled-status',
  // Comdr 指令 cc-haha 路线 A: 工具调用调试器 — audit.jsonl 反向读 (3 个 channel)
  AUDIT_LIST_RECENT:    'panda:audit:list-recent',
  AUDIT_FILTER:         'panda:audit:filter',
  AUDIT_STATS:          'panda:audit:stats',
  // Comdr 指令 cc-haha 路线 A: memdir 反向读 (3 个 channel)
  MEMDIR_LIST_PROJECTS: 'panda:memdir:list-projects',
  MEMDIR_LIST_LAYER:    'panda:memdir:list-layer',
  MEMDIR_READ_FILE:     'panda:memdir:read-file',
  // Comdr 指令 cc-haha 路线 A: connectors.json 真实数据 (2 个 channel)
  CONNECTORS_CONFIG:    'panda:connectors:config',
  CONNECTORS_TOGGLE:    'panda:connectors:toggle',
  // Comdr 指令 cc-haha 路线 A: 会话控制 fork/branch/resume slash 注入 (1 个 channel)
  SESSION_CONTROL:      'panda:session:control',
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

// Source of truth: panda CLI src/utils/model/configs.ts ALL_MODEL_CONFIGS
//   每个 entry 的 id 对齐 firstParty 字段。panda CLI 增删模型时同步更新此列表
//   （CLI 的 configs.ts 依赖 model.js/providers.js 类型系统，vite-plugin-electron
//   直接 import 会拖入 CLI 全套类型，故 1:1 抄常量值更轻量）。
const AVAILABLE_MODELS = [
  // Opus 家族（旗舰，倒序排列）
  { id: 'claude-opus-4-7',            name: 'Claude Opus 4.7',   provider: 'anthropic' },
  { id: 'claude-opus-4-6',            name: 'Claude Opus 4.6',   provider: 'anthropic' },
  { id: 'claude-opus-4-5-20251101',   name: 'Claude Opus 4.5',   provider: 'anthropic' },
  { id: 'claude-opus-4-1-20250805',   name: 'Claude Opus 4.1',   provider: 'anthropic' },
  { id: 'claude-opus-4-20250514',     name: 'Claude Opus 4',     provider: 'anthropic' },
  // Sonnet 家族
  { id: 'claude-sonnet-4-6',          name: 'Claude Sonnet 4.6', provider: 'anthropic' },
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'anthropic' },
  { id: 'claude-sonnet-4-20250514',   name: 'Claude Sonnet 4',   provider: 'anthropic' },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude Sonnet 3.7', provider: 'anthropic' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude Sonnet 3.5', provider: 'anthropic' },
  // Haiku 家族
  { id: 'claude-haiku-4-5-20251001',  name: 'Claude Haiku 4.5',  provider: 'anthropic' },
  { id: 'claude-3-5-haiku-20241022',  name: 'Claude Haiku 3.5',  provider: 'anthropic' },
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

  // 遗留 IPC 修复 #1: git-info — cc-haha sessions.ts L208-267 1:1 对齐
  // 输入: { sessionId } 或 { cwd } 任一；输出 { branch, repoName, workDir, changedFiles }
  // sessionId 优先级:
  //   1. cliManager 内 live session 的 cwd
  //   2. disk session 的 workDir（从 .pandacc 历史 jsonl 解析）
  //   3. 显式传入的 cwd
  ipcMain.handle(
    CH.SESSION_GIT_INFO,
    async (_event, payload: { sessionId?: string; cwd?: string }) => {
      const fallback: GitInfoResult = { branch: null, repoName: null, workDir: '', changedFiles: 0 };
      try {
        const workDir = await resolveWorkDir(payload?.sessionId, payload?.cwd);
        if (!workDir) return fallback;
        return await readGitInfo(workDir);
      } catch (err) {
        console.error('[IPC] SESSION_GIT_INFO failed:', err);
        return fallback;
      }
    },
  );

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

  // ── Comdr 指令: pandacc 真实数据扫描 ──────────────────────────────
  // 6 个 channel：~/.pandacc/{skills,agents,plugins,settings.json,computer-use}
  ipcMain.handle(CH.PANDA_SKILLS_LIST, async () => {
    try {
      return await scanSkills();
    } catch (err) {
      console.error('[IPC] PANDA_SKILLS_LIST failed:', err);
      return [];
    }
  });

  ipcMain.handle(CH.PANDA_AGENTS_LIST, async () => {
    try {
      return await scanAgents();
    } catch (err) {
      console.error('[IPC] PANDA_AGENTS_LIST failed:', err);
      return [];
    }
  });

  ipcMain.handle(CH.PANDA_PLUGINS_LIST, async () => {
    try {
      return await scanPlugins();
    } catch (err) {
      console.error('[IPC] PANDA_PLUGINS_LIST failed:', err);
      return [];
    }
  });

  ipcMain.handle(CH.PANDA_ENV_GET, async () => {
    try {
      return await readPandaEnv();
    } catch (err) {
      console.error('[IPC] PANDA_ENV_GET failed:', err);
      return {};
    }
  });

  ipcMain.handle(
    CH.PANDA_ENV_SET,
    async (_event, payload: { key: string; value: string | null }) => {
      if (!payload || typeof payload.key !== 'string') {
        throw new Error('panda:env:set requires { key, value }');
      }
      try {
        await writePandaEnvKey(payload.key, payload.value);
        return { ok: true };
      } catch (err) {
        console.error('[IPC] PANDA_ENV_SET failed:', err);
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  );

  ipcMain.handle(CH.PANDA_COMPUTER_USE_STATUS, async () => {
    try {
      return await scanComputerUse();
    } catch (err) {
      console.error('[IPC] PANDA_COMPUTER_USE_STATUS failed:', err);
      // Comdr 指令: ComputerUse 完整实现 - cc-haha 对标 — 失败 fallback 与新 schema 对齐
      return {
        platform: process.platform,
        supported: false,
        grantsExist: false,
        grantsPath: '',
        grantedApps: [] as AuthorizedApp[],
        permissions: { accessibility: null, screenRecording: null },
      };
    }
  });

  // Comdr 指令: ComputerUse 完整实现 - cc-haha 对标 — 4 个新 handler
  ipcMain.handle(CH.PANDA_COMPUTER_USE_INSTALLED_APPS, async () => {
    try {
      return await scanInstalledApps();
    } catch (err) {
      console.error('[IPC] PANDA_COMPUTER_USE_INSTALLED_APPS failed:', err);
      return [];
    }
  });

  ipcMain.handle(CH.PANDA_COMPUTER_USE_AUTHORIZED_APPS, async () => {
    try {
      return await readAuthorizedApps();
    } catch (err) {
      console.error('[IPC] PANDA_COMPUTER_USE_AUTHORIZED_APPS failed:', err);
      return {
        authorizedApps: [] as AuthorizedApp[],
        grantFlags: { clipboardRead: true, clipboardWrite: true, systemKeyCombos: true } as ComputerUseGrantFlags,
      };
    }
  });

  ipcMain.handle(
    CH.PANDA_COMPUTER_USE_SET_AUTHORIZED,
    async (_event, payload: { authorizedApps?: AuthorizedApp[]; grantFlags?: Partial<ComputerUseGrantFlags> }) => {
      if (!payload || !Array.isArray(payload.authorizedApps)) {
        return { ok: false, error: 'panda:computer-use:set-authorized-apps requires { authorizedApps: AuthorizedApp[] }' };
      }
      try {
        await writeAuthorizedApps({
          authorizedApps: payload.authorizedApps,
          grantFlags: payload.grantFlags,
        });
        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[IPC] PANDA_COMPUTER_USE_SET_AUTHORIZED failed:', msg);
        return { ok: false, error: msg };
      }
    },
  );

  ipcMain.handle(
    CH.PANDA_COMPUTER_USE_OPEN_SETTINGS,
    async (_event, payload: { pane: 'accessibility' | 'screen-recording' }) => {
      if (!payload?.pane) {
        return { ok: false, error: 'pane is required (accessibility | screen-recording)' };
      }
      try {
        await openSysPrivacy(payload.pane);
        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[IPC] PANDA_COMPUTER_USE_OPEN_SETTINGS failed:', msg);
        return { ok: false, error: msg };
      }
    },
  );

  // ── Comdr 指令: IM Wechat / 任务 B — Adapter 启停 ─────────────────
  ipcMain.handle(CH.ADAPTER_START, async (_event, payload: { platform: AdapterPlatform }) => {
    if (!payload?.platform) {
      return { ok: false, error: 'platform is required', errorCode: 'INVALID_PLATFORM' as const };
    }
    return adapterManager.start(payload.platform);
  });

  ipcMain.handle(CH.ADAPTER_STOP, async (_event, payload: { platform: AdapterPlatform }) => {
    if (!payload?.platform) {
      return { ok: false, error: 'platform is required' };
    }
    return adapterManager.stop(payload.platform);
  });

  ipcMain.handle(CH.ADAPTER_STATUS, async (_event, payload: { platform: AdapterPlatform }) => {
    if (!payload?.platform) {
      throw new Error('panda:adapter:status requires { platform }');
    }
    return adapterManager.status(payload.platform);
  });

  // ── Comdr 指令: 超级助手 Wechat DB / 任务 C — 微信本地 db 解密 ────
  ipcMain.handle(CH.WECHAT_STATUS, async () => {
    try {
      return await getWechatDbStatus();
    } catch (err) {
      console.error('[IPC] WECHAT_STATUS failed:', err);
      throw err;
    }
  });

  ipcMain.handle(CH.WECHAT_SET_CONFIG, async (_event, payload: WechatConfigPatch) => {
    if (!payload || typeof payload !== 'object') {
      return { ok: false, error: 'panda:wechat:set-config requires patch object' };
    }
    return setWechatConfig(payload);
  });

  ipcMain.handle(CH.WECHAT_SET_PROACTIVE, async (_event, payload: WechatProactivePatch) => {
    if (!payload || typeof payload !== 'object') {
      return { ok: false, error: 'panda:wechat:set-proactive requires patch object' };
    }
    return setWechatProactive(payload);
  });

  ipcMain.handle(CH.WECHAT_DECRYPT, async () => {
    return triggerWechatDecrypt();
  });

  // ── Comdr 指令: 学习助手 — panda CLI /learn 落盘数据扫描 ─────────────
  // 数据来源 (panda CLI bundled skill src/skills/bundled/learn.ts)：
  //   /learn plan <topic> → <project_cwd>/working/learning-plans/<slug>.md
  //   /learn from <file>  → <project_cwd>/working/flashcards/<topic>.json
  //   复习日志             → <project_cwd>/working/flashcards/.review-log.json
  ipcMain.handle(CH.LEARNING_LIST_PLANS, async () => {
    try {
      return await scanLearningPlansBackend();
    } catch (err) {
      console.error('[IPC] LEARNING_LIST_PLANS failed:', err);
      return [];
    }
  });

  ipcMain.handle(CH.LEARNING_LIST_FLASHCARDS, async () => {
    try {
      return await scanFlashcardsBackend();
    } catch (err) {
      console.error('[IPC] LEARNING_LIST_FLASHCARDS failed:', err);
      return [];
    }
  });

  ipcMain.handle(
    CH.LEARNING_READ_PLAN,
    async (_event, payload: { projectSlug: string; slug: string }) => {
      if (!payload || typeof payload.projectSlug !== 'string' || typeof payload.slug !== 'string') {
        return null;
      }
      try {
        return await readLearningPlan(payload.projectSlug, payload.slug);
      } catch (err) {
        console.error('[IPC] LEARNING_READ_PLAN failed:', err);
        return null;
      }
    },
  );

  ipcMain.handle(
    CH.LEARNING_READ_FLASHCARDS,
    async (_event, payload: { projectSlug: string; topic: string }) => {
      if (!payload || typeof payload.projectSlug !== 'string' || typeof payload.topic !== 'string') {
        return null;
      }
      try {
        return await readLearningFlashcards(payload.projectSlug, payload.topic);
      } catch (err) {
        console.error('[IPC] LEARNING_READ_FLASHCARDS failed:', err);
        return null;
      }
    },
  );

  // ── Comdr 指令: Agent Teams — panda CLI ~/.pandacc/teams 落盘数据扫描 ─────
  // 数据来源 (panda CLI src/utils/swarm/teamHelpers.ts + utils/teammateMailbox.ts)：
  //   团队根目录   → ~/.pandacc/teams/<name>/
  //   邮箱目录     → ~/.pandacc/teams/<name>/inboxes/
  //   Agent inbox  → ~/.pandacc/teams/<name>/inboxes/<agent>.json
  //   启用开关     → ~/.pandacc/settings.json env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
  ipcMain.handle(CH.TEAMS_LIST, async () => {
    try {
      return await scanTeams();
    } catch (err) {
      console.error('[IPC] TEAMS_LIST failed:', err);
      return [];
    }
  });

  ipcMain.handle(CH.TEAMS_DETAIL, async (_event, payload: { name: string }) => {
    if (!payload || typeof payload.name !== 'string') return null;
    try {
      return await readTeamDetail(payload.name);
    } catch (err) {
      console.error('[IPC] TEAMS_DETAIL failed:', err);
      return null;
    }
  });

  ipcMain.handle(CH.TEAMS_ENABLED_STATUS, async () => {
    try {
      return await readAgentTeamsEnabled();
    } catch (err) {
      console.error('[IPC] TEAMS_ENABLED_STATUS failed:', err);
      return false;
    }
  });

  // ── Comdr 指令 cc-haha 路线 A: 工具调用调试器 — audit.jsonl 反向读 ──────
  // 数据来源: panda CLI src/utils/auditLog.ts → ~/.pandacc/audit.jsonl
  // 字段: timestamp / session_id / tool_name / args_hash / risk_level
  //       permission_decision / outcome / duration_ms? / error_brief?
  ipcMain.handle(CH.AUDIT_LIST_RECENT, async (_event, payload: { limit?: number } | undefined) => {
    try {
      return await scanRecentAudit(payload?.limit);
    } catch (err) {
      console.error('[IPC] AUDIT_LIST_RECENT failed:', err);
      return [];
    }
  });

  ipcMain.handle(CH.AUDIT_FILTER, async (_event, payload: AuditFilter | undefined) => {
    try {
      return await scanFilteredAudit(payload ?? {});
    } catch (err) {
      console.error('[IPC] AUDIT_FILTER failed:', err);
      return [];
    }
  });

  ipcMain.handle(CH.AUDIT_STATS, async () => {
    try {
      return await scanAuditStats();
    } catch (err) {
      console.error('[IPC] AUDIT_STATS failed:', err);
      return {
        total: 0,
        today: 0,
        errorRate: 0,
        topTools: [],
        lastTimestamp: null,
        exists: false,
      };
    }
  });

  // ── Comdr 指令 cc-haha 路线 A: memdir 反向读 ──────────────────────────
  // 数据来源: panda CLI src/memdir/paths.ts getAutoMemPath()
  //   ~/.pandacc/projects/<sanitize-cwd>/memory/{patterns,scars,episodes,
  //     semantic,procedural,working,dreams}/
  ipcMain.handle(CH.MEMDIR_LIST_PROJECTS, async () => {
    try {
      return await scanMemdirProjects();
    } catch (err) {
      console.error('[IPC] MEMDIR_LIST_PROJECTS failed:', err);
      return [];
    }
  });

  ipcMain.handle(
    CH.MEMDIR_LIST_LAYER,
    async (_event, payload: { projectSlug: string; layer: MemdirLayer }) => {
      if (!payload || typeof payload.projectSlug !== 'string' || typeof payload.layer !== 'string') {
        return [];
      }
      try {
        return await scanMemdirLayer(payload.projectSlug, payload.layer);
      } catch (err) {
        console.error('[IPC] MEMDIR_LIST_LAYER failed:', err);
        return [];
      }
    },
  );

  ipcMain.handle(CH.MEMDIR_READ_FILE, async (_event, payload: { path: string }) => {
    if (!payload || typeof payload.path !== 'string') return null;
    try {
      return await readMemdirFileBackend(payload.path);
    } catch (err) {
      console.error('[IPC] MEMDIR_READ_FILE failed:', err);
      return null;
    }
  });

  // ── Comdr 指令 cc-haha 路线 A: connectors.json 真实数据 ──────────────────
  // 数据来源: panda CLI src/connectors/config.ts → ~/.pandacc/config/connectors.json
  // 6 platform: feishu / dingtalk / slack / telegram / wechat / teams
  ipcMain.handle(CH.CONNECTORS_CONFIG, async () => {
    try {
      return await readConnectorsConfig();
    } catch (err) {
      console.error('[IPC] CONNECTORS_CONFIG failed:', err);
      return {
        configExists: false,
        configPath: '',
        entries: [],
      };
    }
  });

  ipcMain.handle(
    CH.CONNECTORS_TOGGLE,
    async (_event, payload: { platform: ConnectorPlatform; enabled: boolean }) => {
      if (!payload || typeof payload.platform !== 'string' || typeof payload.enabled !== 'boolean') {
        return { ok: false, error: 'invalid payload' };
      }
      try {
        return await writeConnectorToggle(payload.platform, payload.enabled);
      } catch (err) {
        console.error('[IPC] CONNECTORS_TOGGLE failed:', err);
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  );

  // ── Comdr 指令 cc-haha 路线 A: 会话控制 fork/branch/resume slash 注入 ────
  ipcMain.handle(
    CH.SESSION_CONTROL,
    async (_event, payload: { sessionId: string; action: SessionControlAction; args?: string }) => {
      if (
        !payload ||
        typeof payload.sessionId !== 'string' ||
        typeof payload.action !== 'string'
      ) {
        return { ok: false, command: '', error: 'invalid payload' };
      }
      try {
        return await dispatchSessionControl(payload.sessionId, payload.action, payload.args);
      } catch (err) {
        console.error('[IPC] SESSION_CONTROL failed:', err);
        return {
          ok: false,
          command: '',
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  );

  console.log('[IPC] Registered invoke handlers (CLI backend + window manager + schedule + pandacc + adapter + wechat-db + learning + teams + audit + memdir + connectors + session-control connected)');
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

// ---------------------------------------------------------------------------
// 遗留 IPC 修复 #1: git-info helpers
// cc-haha desktop server/api/sessions.ts L208-267 — 1:1 行为对齐：
//   - 优先 sessionId (live cli-manager session 的 cwd)
//   - 回退 sessionId 在磁盘上的 jsonl 历史 workDir
//   - 最后回退显式传入 cwd
// 命令一律走 child_process.spawn（Electron 主进程，无 Bun.spawn）。
// ---------------------------------------------------------------------------

interface GitInfoResult {
  branch: string | null;
  repoName: string | null;
  workDir: string;
  changedFiles: number;
}

async function resolveWorkDir(sessionId?: string, fallbackCwd?: string): Promise<string | null> {
  if (sessionId && typeof sessionId === 'string') {
    // Live session 优先（cli-manager 内 SessionInfo.cwd）
    try {
      const live = cliManager.listSessions().find((s) => s.id === sessionId);
      if (live?.cwd) return live.cwd;
    } catch { /* 忽略 — 进入下一回退 */ }

    // Disk session 历史 workDir
    try {
      const launch = await diskGetSessionLaunchInfo(sessionId);
      if (launch?.workDir) return launch.workDir;
    } catch { /* 忽略 — 进入下一回退 */ }
  }
  if (fallbackCwd && typeof fallbackCwd === 'string' && fallbackCwd.trim()) {
    return fallbackCwd;
  }
  return null;
}

function spawnGit(args: string[], cwd: string, timeoutMs = 1500): Promise<string> {
  return new Promise((resolve) => {
    let stdout = '';
    let settled = false;
    const finalize = (value: string) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    try {
      const proc = childSpawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'ignore'] });
      const timer = setTimeout(() => {
        try { proc.kill('SIGKILL'); } catch { /* noop */ }
        finalize('');
      }, timeoutMs);
      proc.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8'); });
      proc.on('error', () => {
        clearTimeout(timer);
        finalize('');
      });
      proc.on('close', () => {
        clearTimeout(timer);
        finalize(stdout);
      });
    } catch {
      finalize('');
    }
  });
}

async function readGitInfo(workDir: string): Promise<GitInfoResult> {
  // Branch
  const branchRaw = (await spawnGit(['rev-parse', '--abbrev-ref', 'HEAD'], workDir)).trim();
  const branch = branchRaw && branchRaw !== 'HEAD' ? branchRaw : null;

  // Repo name — 优先 origin remote URL；否则 workDir 末段
  let repoName: string | null = null;
  const remoteRaw = (await spawnGit(['remote', 'get-url', 'origin'], workDir)).trim();
  if (remoteRaw) {
    // 匹配 git@github.com:user/repo(.git) 或 https://...repo(.git)
    const m = remoteRaw.match(/[/:]([^/:]+\/[^/:]+?)(?:\.git)?$/) || remoteRaw.match(/\/([^/]+?)(?:\.git)?$/);
    if (m && m[1]) {
      // cc-haha 行为：第一个正则命中 user/repo，第二个命中 repo（兜底）
      repoName = m[1];
    }
  }
  if (!repoName) {
    const parts = workDir.split('/').filter(Boolean);
    repoName = parts.length > 0 ? parts[parts.length - 1]! : null;
  }

  // Changed files (porcelain)
  const statusRaw = await spawnGit(['status', '--porcelain'], workDir);
  const changedFiles = statusRaw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length;

  // 当 branch / 任意 git 调用全部失败 → 视为非 git 仓库
  if (branch === null && remoteRaw === '' && statusRaw === '') {
    return { branch: null, repoName: null, workDir, changedFiles: 0 };
  }

  return { branch, repoName, workDir, changedFiles };
}
