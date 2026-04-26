// Input: Electron contextBridge + ipcRenderer APIs
// Output: window.pandaAPI — type-safe IPC client matching PandaChatAPI interface (27 channels + update + window + pandacc namespaces)
// Pos: Electron preload script — sole bridge between renderer and main process
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { contextBridge, ipcRenderer } from 'electron';

// ---------------------------------------------------------------------------
// IPC channel constants (must match schemas.ts IPC_CHANNELS)
// ---------------------------------------------------------------------------

const CH = {
  // Chat messaging
  CHAT_SEND:           'panda:chat:send',
  CHAT_STREAM_START:   'panda:chat:stream:start',
  CHAT_STREAM_DELTA:   'panda:chat:stream:delta',
  CHAT_STREAM_END:     'panda:chat:stream:end',
  CHAT_STOP:           'panda:chat:stop',
  CHAT_WINDOW_TOGGLE:  'panda:chat:window:toggle',
  // Session management
  SESSION_LIST:        'panda:session:list',
  SESSION_CREATE:      'panda:session:create',
  SESSION_RENAME:      'panda:session:rename',
  SESSION_DELETE:      'panda:session:delete',
  SESSION_FOCUS:       'panda:session:focus',
  SESSION_UPDATED:     'panda:session:updated',
  SESSION_LIST_ALL:    'panda:session:list-all',
  SESSION_GET_HISTORY: 'panda:session:get-history',
  // 遗留 IPC 修复 #1: cc-haha sessionsApi.getGitInfo 对齐
  SESSION_GIT_INFO:    'panda:session:git-info',
  // Tool permissions
  TOOL_USE_START:      'panda:tool:use:start',
  TOOL_USE_END:        'panda:tool:use:end',
  TOOL_PERM_REQUEST:   'panda:tool:permission:request',
  TOOL_PERM_RESPONSE:  'panda:tool:permission:response',
  // File system
  FS_SEARCH:           'panda:chat:fs:search',
  FS_LIST:             'panda:chat:fs:list',
  // Config & misc
  WINDOW_POSITION:     'panda:chat:window:position',
  SLASH_COMMANDS:      'panda:chat:slash-commands',
  MODEL_LIST:          'panda:chat:model:list',
  MODEL_SET:           'panda:chat:model:set',
  PERMISSION_MODE_SET: 'panda:chat:permission-mode:set',
  CLIPBOARD_PASTE_IMG: 'panda:chat:clipboard:paste-image',
  // Theme
  THEME_CHANGED:       'panda:theme:changed',
  THEME_GET_SYSTEM:    'panda:theme:get-system',
  // Notifications
  NOTIFICATION_SET_ENABLED: 'panda:notification:set-enabled',
  NOTIFICATION_CLEAR:       'panda:notification:clear',
  // Update
  UPDATE_CHECK:    'panda:update:check',
  UPDATE_DOWNLOAD: 'panda:update:download',
  UPDATE_INSTALL:  'panda:update:install',
  UPDATE_STATUS:   'panda:update:status',
  // Window management
  WINDOW_NEW:           'panda:window:new',
  WINDOW_OPEN_SESSION:  'panda:window:open-session',
  WINDOW_GET_ID:        'panda:window:get-id',
  WINDOW_INIT:          'panda:window:init',
  // Connection lifecycle
  SESSION_READY:        'panda:session:ready',
  MESSAGE_HISTORY:      'panda:message:history',
  // Scheduled tasks
  SCHEDULE_LIST:        'panda:schedule:list',
  SCHEDULE_CREATE:      'panda:schedule:create',
  SCHEDULE_UPDATE:      'panda:schedule:update',
  SCHEDULE_DELETE:      'panda:schedule:delete',
  SCHEDULE_RUN_NOW:     'panda:schedule:run-now',
  SCHEDULE_TOGGLE:      'panda:schedule:toggle',
  SCHEDULE_VALIDATE:    'panda:schedule:validate-cron',
  SCHEDULE_UPDATED:     'panda:schedule:update',
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
// Helper: create a type-safe event subscription
// ---------------------------------------------------------------------------

type Callback = (...args: unknown[]) => void;

function createSubscription(channel: string) {
  return (callback: Callback) => {
    const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      callback(...args);
    };
    ipcRenderer.on(channel, handler);
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener(channel, handler);
    };
  };
}

// ---------------------------------------------------------------------------
// Expose pandaAPI to renderer via contextBridge
// ---------------------------------------------------------------------------

contextBridge.exposeInMainWorld('pandaAPI', {
  chat: {
    send: (payload: unknown) => ipcRenderer.invoke(CH.CHAT_SEND, payload),
    stop: (payload: unknown) => ipcRenderer.invoke(CH.CHAT_STOP, payload),
    pasteImage: (payload: unknown) => ipcRenderer.invoke(CH.CLIPBOARD_PASTE_IMG, payload),
    getClipboardImage: () => ipcRenderer.invoke(CH.CLIPBOARD_PASTE_IMG),
    onStreamStart: createSubscription(CH.CHAT_STREAM_START),
    onStreamDelta: createSubscription(CH.CHAT_STREAM_DELTA),
    onStreamEnd: createSubscription(CH.CHAT_STREAM_END),
    onWindowToggle: createSubscription(CH.CHAT_WINDOW_TOGGLE),
  },
  session: {
    list: (payload: unknown) => ipcRenderer.invoke(CH.SESSION_LIST, payload),
    create: (payload: unknown) => ipcRenderer.invoke(CH.SESSION_CREATE, payload),
    rename: (payload: unknown) => ipcRenderer.invoke(CH.SESSION_RENAME, payload),
    delete: (payload: unknown) => ipcRenderer.invoke(CH.SESSION_DELETE, payload),
    focus: (payload: unknown) => ipcRenderer.invoke(CH.SESSION_FOCUS, payload),
    onUpdated: createSubscription(CH.SESSION_UPDATED),
    onReady: createSubscription(CH.SESSION_READY),
    onMessageHistory: createSubscription(CH.MESSAGE_HISTORY),
    listAllSessions: () => ipcRenderer.invoke(CH.SESSION_LIST_ALL),
    getHistory: (sessionId: string) => ipcRenderer.invoke(CH.SESSION_GET_HISTORY, { sessionId }),
    // 遗留 IPC 修复 #1: cc-haha sessionsApi.getGitInfo 对齐
    getGitInfo: (sessionId: string, cwd?: string) =>
      ipcRenderer.invoke(CH.SESSION_GIT_INFO, { sessionId, cwd }),
  },
  tool: {
    respondPermission: (payload: unknown) => ipcRenderer.invoke(CH.TOOL_PERM_RESPONSE, payload),
    onUseStart: createSubscription(CH.TOOL_USE_START),
    onUseEnd: createSubscription(CH.TOOL_USE_END),
    onPermissionRequest: createSubscription(CH.TOOL_PERM_REQUEST),
  },
  fs: {
    search: (payload: unknown) => ipcRenderer.invoke(CH.FS_SEARCH, payload),
    list: (payload: unknown) => ipcRenderer.invoke(CH.FS_LIST, payload),
  },
  config: {
    setWindowPosition: (payload: unknown) => ipcRenderer.invoke(CH.WINDOW_POSITION, payload),
    getSlashCommands: (payload: unknown) => ipcRenderer.invoke(CH.SLASH_COMMANDS, payload),
    getModels: (payload: unknown) => ipcRenderer.invoke(CH.MODEL_LIST, payload),
    setModel: (payload: unknown) => ipcRenderer.invoke(CH.MODEL_SET, payload),
    setPermissionMode: (payload: unknown) => ipcRenderer.invoke(CH.PERMISSION_MODE_SET, payload),
  },
  notification: {
    setEnabled: (enabled: boolean) => ipcRenderer.invoke(CH.NOTIFICATION_SET_ENABLED, enabled),
    clear: () => ipcRenderer.invoke(CH.NOTIFICATION_CLEAR),
  },
  theme: {
    getSystemTheme: () => ipcRenderer.invoke(CH.THEME_GET_SYSTEM),
    onThemeChange: (callback: (isDark: boolean) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, isDark: boolean) => {
        callback(isDark);
      };
      ipcRenderer.on(CH.THEME_CHANGED, handler);
      return () => {
        ipcRenderer.removeListener(CH.THEME_CHANGED, handler);
      };
    },
  },
  update: {
    check: () => ipcRenderer.invoke(CH.UPDATE_CHECK),
    download: () => ipcRenderer.invoke(CH.UPDATE_DOWNLOAD),
    install: () => ipcRenderer.invoke(CH.UPDATE_INSTALL),
    onStatus: (callback: (status: Record<string, unknown>) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, status: Record<string, unknown>) => {
        callback(status);
      };
      ipcRenderer.on(CH.UPDATE_STATUS, handler);
      return () => {
        ipcRenderer.removeListener(CH.UPDATE_STATUS, handler);
      };
    },
  },
  window: {
    newWindow: () => ipcRenderer.invoke(CH.WINDOW_NEW),
    openSessionInWindow: (sessionId: string) =>
      ipcRenderer.invoke(CH.WINDOW_OPEN_SESSION, { sessionId }),
    getWindowId: () => ipcRenderer.invoke(CH.WINDOW_GET_ID),
    onWindowInit: createSubscription(CH.WINDOW_INIT),
  },
  schedule: {
    list: () => ipcRenderer.invoke(CH.SCHEDULE_LIST),
    create: (payload: unknown) => ipcRenderer.invoke(CH.SCHEDULE_CREATE, payload),
    update: (payload: unknown) => ipcRenderer.invoke(CH.SCHEDULE_UPDATE, payload),
    delete: (payload: unknown) => ipcRenderer.invoke(CH.SCHEDULE_DELETE, payload),
    runNow: (payload: unknown) => ipcRenderer.invoke(CH.SCHEDULE_RUN_NOW, payload),
    toggle: (payload: unknown) => ipcRenderer.invoke(CH.SCHEDULE_TOGGLE, payload),
    validateCron: (payload: unknown) => ipcRenderer.invoke(CH.SCHEDULE_VALIDATE, payload),
    onUpdated: createSubscription(CH.SCHEDULE_UPDATED),
  },
  // Comdr 指令: ~/.pandacc 配置目录扫描 — Skills/Agents/Plugins/Env/ComputerUse
  pandacc: {
    listSkills:   () => ipcRenderer.invoke(CH.PANDA_SKILLS_LIST),
    listAgents:   () => ipcRenderer.invoke(CH.PANDA_AGENTS_LIST),
    listPlugins:  () => ipcRenderer.invoke(CH.PANDA_PLUGINS_LIST),
    getEnv:       () => ipcRenderer.invoke(CH.PANDA_ENV_GET),
    setEnv:       (key: string, value: string | null) =>
      ipcRenderer.invoke(CH.PANDA_ENV_SET, { key, value }),
    getComputerUseStatus: () => ipcRenderer.invoke(CH.PANDA_COMPUTER_USE_STATUS),
  },
  // Comdr 指令: ComputerUse 完整实现 - cc-haha 对标 — 独立 namespace
  computerUse: {
    getStatus:           () => ipcRenderer.invoke(CH.PANDA_COMPUTER_USE_STATUS),
    getInstalledApps:    () => ipcRenderer.invoke(CH.PANDA_COMPUTER_USE_INSTALLED_APPS),
    getAuthorizedApps:   () => ipcRenderer.invoke(CH.PANDA_COMPUTER_USE_AUTHORIZED_APPS),
    setAuthorizedApps:   (input: unknown) =>
      ipcRenderer.invoke(CH.PANDA_COMPUTER_USE_SET_AUTHORIZED, input),
    openSettings:        (input: unknown) =>
      ipcRenderer.invoke(CH.PANDA_COMPUTER_USE_OPEN_SETTINGS, input),
  },
  // Comdr 指令: IM Wechat / 任务 B — IM Adapter 启停 namespace
  adapter: {
    start:  (platform: 'feishu' | 'telegram' | 'wechat') =>
      ipcRenderer.invoke(CH.ADAPTER_START, { platform }),
    stop:   (platform: 'feishu' | 'telegram' | 'wechat') =>
      ipcRenderer.invoke(CH.ADAPTER_STOP, { platform }),
    status: (platform: 'feishu' | 'telegram' | 'wechat') =>
      ipcRenderer.invoke(CH.ADAPTER_STATUS, { platform }),
  },
  // Comdr 指令: 超级助手 Wechat DB / 任务 C — 微信本地 db 解密 namespace
  wechat: {
    getStatus:    () => ipcRenderer.invoke(CH.WECHAT_STATUS),
    setConfig:    (patch: unknown) => ipcRenderer.invoke(CH.WECHAT_SET_CONFIG, patch),
    setProactive: (patch: unknown) => ipcRenderer.invoke(CH.WECHAT_SET_PROACTIVE, patch),
    decrypt:      () => ipcRenderer.invoke(CH.WECHAT_DECRYPT),
  },
  // Comdr 指令: 学习助手 — panda CLI /learn 落盘数据扫描 namespace
  learning: {
    listPlans:       () => ipcRenderer.invoke(CH.LEARNING_LIST_PLANS),
    listFlashcards:  () => ipcRenderer.invoke(CH.LEARNING_LIST_FLASHCARDS),
    readPlan:        (projectSlug: string, slug: string) =>
      ipcRenderer.invoke(CH.LEARNING_READ_PLAN, { projectSlug, slug }),
    readFlashcards:  (projectSlug: string, topic: string) =>
      ipcRenderer.invoke(CH.LEARNING_READ_FLASHCARDS, { projectSlug, topic }),
  },
  // Comdr 指令: Agent Teams — panda CLI ~/.pandacc/teams 落盘数据扫描 namespace
  teams: {
    list:           () => ipcRenderer.invoke(CH.TEAMS_LIST),
    detail:         (name: string) => ipcRenderer.invoke(CH.TEAMS_DETAIL, { name }),
    enabledStatus:  () => ipcRenderer.invoke(CH.TEAMS_ENABLED_STATUS),
  },
  // Comdr 指令 cc-haha 路线 A: 工具调用调试器 — audit.jsonl 反向读 namespace
  audit: {
    listRecent: (limit?: number) => ipcRenderer.invoke(CH.AUDIT_LIST_RECENT, { limit }),
    filter: (filter: unknown) => ipcRenderer.invoke(CH.AUDIT_FILTER, filter),
    stats: () => ipcRenderer.invoke(CH.AUDIT_STATS),
  },
  // Comdr 指令 cc-haha 路线 A: memdir 反向读 namespace
  memdir: {
    listProjects: () => ipcRenderer.invoke(CH.MEMDIR_LIST_PROJECTS),
    listLayer: (projectSlug: string, layer: string) =>
      ipcRenderer.invoke(CH.MEMDIR_LIST_LAYER, { projectSlug, layer }),
    readFile: (path: string) => ipcRenderer.invoke(CH.MEMDIR_READ_FILE, { path }),
  },
  // Comdr 指令 cc-haha 路线 A: connectors.json 真实数据 namespace
  connectors: {
    config: () => ipcRenderer.invoke(CH.CONNECTORS_CONFIG),
    toggle: (platform: string, enabled: boolean) =>
      ipcRenderer.invoke(CH.CONNECTORS_TOGGLE, { platform, enabled }),
  },
  // Comdr 指令 cc-haha 路线 A: 会话控制 fork/branch/resume slash 注入 namespace
  sessionControl: {
    dispatch: (sessionId: string, action: 'fork' | 'branch' | 'resume', args?: string) =>
      ipcRenderer.invoke(CH.SESSION_CONTROL, { sessionId, action, args }),
  },
});
