// Input: window.pandaAPI injected by preload/chat.ts via contextBridge (named API)
//        In dev mode: DevMockRelay provides full simulated backend (chat + session + config + fs)
// Output: Type-safe IPC client for chat renderer components (+ provider snapshot + auto-update bridge + disk session access)
// Pos: IPC bridge layer — sole entry point for renderer → main communication
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import type {
  PandaChatAPI,
  Unsubscribe,
  UpdateStatus,
  ChatSendPayload,
  ChatStreamStartPayload,
  ChatStreamDeltaPayload,
  ChatStreamEndPayload,
  ChatStreamErrorPayload,
  ChatWindowTogglePayload,
  SessionListResponse,
  SessionCreateResponse,
  SessionUpdatedPayload,
  SessionReadyPayload,
  MessageHistoryPayload,
  ToolUseStartPayload,
  ToolUseEndPayload,
  ToolPermRequestPayload,
  FsSearchResponse,
  FsListResponse,
  SlashCommandsResponse,
  ModelListResponse,
  ProviderSnapshot,
  WindowInitPayload,
  DiskSessionMeta,
  SessionDetail,
  ScheduledTask,
  ScheduledTaskRunLog,
  CreateScheduledTaskInput,
  UpdateScheduledTaskInput,
  ValidateCronResult,
  ScheduledTasksUpdatedPayload,
  GitInfo,
  // Comdr 指令: pandacc Settings sub-tab IPC 类型
  PandaccSkillItem,
  PandaccAgentItem,
  PandaccPluginItem,
  PandaccComputerUseStatus,
  PandaEnvSetResult,
  // Comdr 指令: ComputerUse 完整实现 - cc-haha 对标
  ComputerUseInstalledApp,
  ComputerUseGrantsFile,
  SetAuthorizedAppsInput,
  ComputerUsePane,
  ComputerUseOpResult,
  // Comdr 指令: 学习助手 — panda CLI /learn 落盘数据
  LearningPlanMeta,
  LearningFlashcardSet,
  LearningPlanDetail,
  // Comdr 指令: Agent Teams — panda CLI ~/.pandacc/teams 落盘数据
  TeamMeta,
  TeamDetail,
  // Comdr 指令 cc-haha 路线 A: 工具调用调试器 — audit.jsonl 反向读
  AuditEntry,
  AuditFilter,
  AuditStats,
  // Comdr 指令 cc-haha 路线 A: PdMemoryBank / PdPatternsScars memdir
  MemdirLayer,
  MemdirProjectMeta,
  MemdirEntry,
  MemdirReadResult,
  // Comdr 指令 cc-haha 路线 A: PdConnectors connectors.json
  ConnectorPlatformId,
  ConnectorsConfigSnapshot,
  ConnectorToggleResult,
  // Comdr 指令 cc-haha 路线 A: PdSessionControls fork/branch/resume
  SessionControlAction,
  SessionControlResult,
} from './types';
import {
  DevMockRelay,
  type StreamStartEvent,
  type StreamDeltaEvent,
  type StreamEndEvent,
  type ToolUseStartEvent,
  type ToolUseEndEvent,
  type PermissionRequestEvent,
} from './dev-mock';

// ─── Dev mode detection ──────────────────────────────────────────────────────

const IS_DEV = !!(
  typeof window !== 'undefined' &&
  !window.pandaAPI &&
  (import.meta as unknown as Record<string, unknown>).env &&
  ((import.meta as unknown as { env: { DEV?: boolean } }).env.DEV ||
    (import.meta as unknown as { env: { MODE?: string } }).env.MODE === 'development')
);

/** Singleton DevMockRelay — only instantiated in dev mode. */
let devRelay: DevMockRelay | null = null;

function getDevRelay(): DevMockRelay {
  if (!devRelay) {
    devRelay = new DevMockRelay();
  }
  return devRelay;
}

// ─── Core API accessor ──────────────────────────────────────────────────────

/**
 * Returns the pandaAPI bridge injected by preload.
 * Throws if called outside Electron (e.g. in plain browser dev) and not in dev mode.
 */
export function getPandaAPI(): PandaChatAPI {
  if (!window.pandaAPI) {
    throw new Error('pandaAPI not available — not running in Electron');
  }
  return window.pandaAPI;
}

/**
 * Safe check: returns true if running inside Electron with pandaAPI available.
 */
export function hasPandaAPI(): boolean {
  return typeof window !== 'undefined' && window.pandaAPI != null;
}

/**
 * Returns true when running in browser dev mode (no Electron, Vite dev server).
 */
export function isDevMode(): boolean {
  return IS_DEV;
}

// ─── Chat messaging ────────────────────────────────────────────────────────

/** Send a user message (optionally with attachments). */
export async function sendMessage(
  sessionId: string,
  content: string,
  attachments?: ChatSendPayload['attachments'],
): Promise<void> {
  if (IS_DEV) {
    return getDevRelay().sendMessage(sessionId, content);
  }
  return getPandaAPI().chat.send({ sessionId, content, attachments });
}

/** Abort the current streaming response. */
export async function stopGeneration(sessionId: string): Promise<void> {
  if (IS_DEV) {
    getDevRelay().cancel();
    return;
  }
  return getPandaAPI().chat.stop({ sessionId });
}

/** Paste an image from clipboard (data URL, max 10MB). */
export async function pasteImage(
  sessionId: string,
  dataUrl: string,
): Promise<void> {
  if (IS_DEV) return getDevRelay().pasteImage(sessionId, dataUrl);
  return getPandaAPI().chat.pasteImage({ sessionId, dataUrl });
}

/** Read image from system clipboard. Returns base64 PNG or null if empty. */
export async function getClipboardImage(): Promise<string | null> {
  if (IS_DEV) return null;
  return getPandaAPI().chat.getClipboardImage();
}

/** Subscribe to stream-start events. Returns unsubscribe function. */
export function onStreamStart(
  callback: (payload: ChatStreamStartPayload) => void,
): Unsubscribe {
  if (IS_DEV) {
    const relay = getDevRelay();
    const wrapped = (e: unknown) => callback(e as ChatStreamStartPayload);
    relay.on('stream:start', wrapped);
    return () => relay.off('stream:start', wrapped);
  }
  return getPandaAPI().chat.onStreamStart(callback);
}

/** Subscribe to stream-delta events. Returns unsubscribe function. */
export function onStreamDelta(
  callback: (payload: ChatStreamDeltaPayload) => void,
): Unsubscribe {
  if (IS_DEV) {
    const relay = getDevRelay();
    const wrapped = (e: unknown) => callback(e as ChatStreamDeltaPayload);
    relay.on('stream:delta', wrapped);
    return () => relay.off('stream:delta', wrapped);
  }
  return getPandaAPI().chat.onStreamDelta(callback);
}

/** Subscribe to stream-end events. Returns unsubscribe function. */
export function onStreamEnd(
  callback: (payload: ChatStreamEndPayload) => void,
): Unsubscribe {
  if (IS_DEV) {
    const relay = getDevRelay();
    const wrapped = (e: unknown) => callback(e as ChatStreamEndPayload);
    relay.on('stream:end', wrapped);
    return () => relay.off('stream:end', wrapped);
  }
  return getPandaAPI().chat.onStreamEnd(callback);
}

/** Subscribe to stream-error events. Returns unsubscribe function. */
export function onStreamError(
  callback: (payload: ChatStreamErrorPayload) => void,
): Unsubscribe {
  if (IS_DEV) return () => {};
  return getPandaAPI().chat.onStreamError(callback);
}

/** Subscribe to window toggle events. Returns unsubscribe function. */
export function onWindowToggle(
  callback: (payload: ChatWindowTogglePayload) => void,
): Unsubscribe {
  if (IS_DEV) {
    const relay = getDevRelay();
    const wrapped = (e: unknown) => callback(e as ChatWindowTogglePayload);
    relay.on('window:toggle', wrapped);
    return () => relay.off('window:toggle', wrapped);
  }
  return getPandaAPI().chat.onWindowToggle(callback);
}

// ─── Session management ────────────────────────────────────────────────────

/** List all sessions. */
export async function listSessions(): Promise<SessionListResponse> {
  if (IS_DEV) return getDevRelay().listSessions() as unknown as SessionListResponse;
  return getPandaAPI().session.list({});
}

/** Create a new session in the given working directory. */
export async function createSession(
  cwd: string,
  name?: string,
): Promise<SessionCreateResponse> {
  if (IS_DEV) return getDevRelay().createSession(cwd, name);
  return getPandaAPI().session.create({ cwd, name });
}

/** Rename an existing session. */
export async function renameSession(
  sessionId: string,
  name: string,
): Promise<void> {
  if (IS_DEV) return getDevRelay().renameSession(sessionId, name);
  return getPandaAPI().session.rename({ sessionId, name });
}

/** Delete a session. */
export async function deleteSession(sessionId: string): Promise<void> {
  if (IS_DEV) return getDevRelay().deleteSession(sessionId);
  return getPandaAPI().session.delete({ sessionId });
}

/** Focus/switch to a session. */
export async function focusSession(sessionId: string): Promise<void> {
  if (IS_DEV) return getDevRelay().focusSession(sessionId);
  return getPandaAPI().session.focus({ sessionId });
}

/** Subscribe to session-list updates. Returns unsubscribe function. */
export function onSessionUpdated(
  callback: (payload: SessionUpdatedPayload) => void,
): Unsubscribe {
  if (IS_DEV) {
    const relay = getDevRelay();
    const wrapped = (e: unknown) => callback(e as SessionUpdatedPayload);
    relay.on('session:updated', wrapped);
    return () => relay.off('session:updated', wrapped);
  }
  return getPandaAPI().session.onUpdated(callback);
}

/** Subscribe to session-ready events. Returns unsubscribe function. */
export function onSessionReady(
  callback: (payload: SessionReadyPayload) => void,
): Unsubscribe {
  if (IS_DEV) {
    const relay = getDevRelay();
    const wrapped = (e: unknown) => callback(e as SessionReadyPayload);
    relay.on('session:ready', wrapped);
    return () => relay.off('session:ready', wrapped);
  }
  return getPandaAPI().session.onReady(callback);
}

/** Subscribe to message-history events (resume replay). Returns unsubscribe function. */
export function onMessageHistory(
  callback: (payload: MessageHistoryPayload) => void,
): Unsubscribe {
  if (IS_DEV) {
    const relay = getDevRelay();
    const wrapped = (e: unknown) => callback(e as MessageHistoryPayload);
    relay.on('message:history', wrapped);
    return () => relay.off('message:history', wrapped);
  }
  return getPandaAPI().session.onMessageHistory(callback);
}

// ─── Disk-based session access (pd:sessions:*) ──────────────────────────────

/** List all sessions persisted in .pandacc on disk. */
export async function listAllSessions(): Promise<DiskSessionMeta[]> {
  if (IS_DEV) return getDevRelay().listAllSessions?.() ?? [];
  return getPandaAPI().session.listAllSessions();
}

/** Get a specific session's detail (metadata + messages) from disk. */
export async function getSessionHistory(sessionId: string): Promise<SessionDetail | null> {
  if (IS_DEV) return getDevRelay().getSessionHistory?.(sessionId) ?? null;
  return getPandaAPI().session.getHistory(sessionId);
}

// 遗留 IPC 修复 #1: cc-haha desktop sessionsApi.getGitInfo 1:1 — 取 git branch / repoName / changedFiles。
// dev mode 无后端，返回安全空值；renderer 自行降级到仅显示 workDir。
export async function getGitInfo(sessionId: string, cwd?: string): Promise<GitInfo> {
  const empty: GitInfo = { branch: null, repoName: null, workDir: cwd ?? '', changedFiles: 0 };
  if (IS_DEV) return empty;
  try {
    return await getPandaAPI().session.getGitInfo(sessionId, cwd);
  } catch (err) {
    console.warn('[bridge] getGitInfo failed:', err);
    return empty;
  }
}

// ─── Tool permissions ──────────────────────────────────────────────────────

/** Subscribe to tool execution start events. */
export function onToolUseStart(
  callback: (payload: ToolUseStartPayload) => void,
): Unsubscribe {
  if (IS_DEV) {
    const relay = getDevRelay();
    const wrapped = (e: unknown) => callback(e as ToolUseStartPayload);
    relay.on('tool:start', wrapped);
    return () => relay.off('tool:start', wrapped);
  }
  return getPandaAPI().tool.onUseStart(callback);
}

/** Subscribe to tool execution end events. */
export function onToolUseEnd(
  callback: (payload: ToolUseEndPayload) => void,
): Unsubscribe {
  if (IS_DEV) {
    const relay = getDevRelay();
    const wrapped = (e: unknown) => callback(e as ToolUseEndPayload);
    relay.on('tool:end', wrapped);
    return () => relay.off('tool:end', wrapped);
  }
  return getPandaAPI().tool.onUseEnd(callback);
}

/** Subscribe to permission request events. */
export function onPermissionRequest(
  callback: (payload: ToolPermRequestPayload) => void,
): Unsubscribe {
  if (IS_DEV) {
    const relay = getDevRelay();
    const wrapped = (e: unknown) => callback(e as ToolPermRequestPayload);
    relay.on('permission:request', wrapped);
    return () => relay.off('permission:request', wrapped);
  }
  return getPandaAPI().tool.onPermissionRequest(callback);
}

/** Respond to a tool permission request. */
export async function respondToPermission(
  sessionId: string,
  toolUseId: string,
  decision: 'allow' | 'allow_session' | 'deny',
): Promise<void> {
  if (IS_DEV) {
    getDevRelay().respondPermission();
    return;
  }
  return getPandaAPI().tool.respondPermission({ sessionId, toolUseId, decision });
}

// ─── File system ───────────────────────────────────────────────────────────

/** Search files by query string. */
export async function searchFiles(
  sessionId: string,
  query: string,
  maxResults?: number,
): Promise<FsSearchResponse> {
  if (IS_DEV) return getDevRelay().searchFiles(query) as unknown as FsSearchResponse;
  return getPandaAPI().fs.search({ sessionId, query, maxResults });
}

/** List directory contents. */
export async function listDirectory(
  sessionId: string,
  dirPath: string,
): Promise<FsListResponse> {
  if (IS_DEV) return getDevRelay().listDirectory(dirPath) as unknown as FsListResponse;
  return getPandaAPI().fs.list({ sessionId, dirPath });
}

// ─── Config & misc ─────────────────────────────────────────────────────────

/** Report window position/size to main process. */
export async function setWindowPosition(
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<void> {
  if (IS_DEV) return getDevRelay().setWindowPosition(x, y, width, height);
  return getPandaAPI().config.setWindowPosition({ x, y, width, height });
}

/** Get available slash commands. */
export async function getSlashCommands(): Promise<SlashCommandsResponse> {
  if (IS_DEV) return getDevRelay().getSlashCommands() as unknown as SlashCommandsResponse;
  return getPandaAPI().config.getSlashCommands({});
}

/** Get available models. */
export async function getModels(): Promise<ModelListResponse> {
  if (IS_DEV) return getDevRelay().getModels() as unknown as ModelListResponse;
  return getPandaAPI().config.getModels({});
}

/** Get redacted provider/auth snapshot from panda CLI config. */
export async function getProviderSnapshot(): Promise<ProviderSnapshot | null> {
  if (IS_DEV) return null;
  return getPandaAPI().config.getProviderSnapshot();
}

/** Set the active model for a session. */
export async function setModel(
  sessionId: string,
  modelId: string,
): Promise<void> {
  if (IS_DEV) return getDevRelay().setModel(sessionId, modelId);
  return getPandaAPI().config.setModel(sessionId ? { sessionId, modelId } : { modelId });
}

/** Set the permission mode. */
export async function setPermissionMode(
  mode: 'default' | 'plan' | 'auto' | 'bypassPermissions',
): Promise<void> {
  if (IS_DEV) return getDevRelay().setPermissionMode(mode);
  return getPandaAPI().config.setPermissionMode({ mode });
}

/** Enable or disable system notifications. */
export async function setNotificationEnabled(enabled: boolean): Promise<void> {
  if (IS_DEV) return;
  return getPandaAPI().notification.setEnabled(enabled);
}

/** Clear unread notification badge. */
export async function clearNotifications(): Promise<void> {
  if (IS_DEV) return;
  return getPandaAPI().notification.clear();
}

// ─── Update ──────────────────────────────────────────────────────────────────

/** Check for application updates. */
export async function checkForUpdates(): Promise<void> {
  if (IS_DEV) return;
  return getPandaAPI().update.check();
}

/** Download the available update. */
export async function downloadUpdate(): Promise<void> {
  if (IS_DEV) return;
  return getPandaAPI().update.download();
}

/** Quit and install the downloaded update. */
export async function installUpdate(): Promise<void> {
  if (IS_DEV) return;
  return getPandaAPI().update.install();
}

/** Subscribe to update status events from main process. Returns unsubscribe fn. */
export function onUpdateStatus(callback: (status: UpdateStatus) => void): Unsubscribe {
  if (IS_DEV) return () => {};
  return getPandaAPI().update.onStatus(callback);
}

// ─── Window management ──────────────────────────────────────────────────────

/** Open a new independent window. */
export async function openNewWindow(): Promise<{ windowId: number } | void> {
  if (IS_DEV) {
    return getDevRelay().openNewWindow();
  }
  return getPandaAPI().window.newWindow();
}

/** Open a session in a new window (or focus existing window showing it). */
export async function openSessionInWindow(sessionId: string): Promise<{ windowId: number; reused: boolean } | void> {
  if (IS_DEV) {
    return getDevRelay().openSessionInWindow(sessionId);
  }
  return getPandaAPI().window.openSessionInWindow(sessionId);
}

/** Get the BrowserWindow id of the current renderer window. */
export async function getWindowId(): Promise<number> {
  if (IS_DEV) return getDevRelay().getWindowId();
  return getPandaAPI().window.getWindowId();
}

/** Subscribe to window:init events (sent after did-finish-load). */
export function onWindowInit(callback: (payload: WindowInitPayload) => void): Unsubscribe {
  if (IS_DEV) return () => {};
  return getPandaAPI().window.onWindowInit(callback);
}

// ─── Scheduled tasks (panda:schedule:*) ────────────────────────────────────

// Dev-mode in-memory store for scheduled tasks. Persisted to localStorage so
// reloading the browser preserves the state across HMR cycles.
const DEV_SCHEDULE_KEY = 'panda-dev-scheduled-tasks';
const devScheduleListeners = new Set<(p: ScheduledTasksUpdatedPayload) => void>();

function devReadTasks(): ScheduledTask[] {
  try {
    const raw = window.localStorage.getItem(DEV_SCHEDULE_KEY);
    return raw ? (JSON.parse(raw) as ScheduledTask[]) : [];
  } catch { return []; }
}
function devWriteTasks(tasks: ScheduledTask[]): void {
  try { window.localStorage.setItem(DEV_SCHEDULE_KEY, JSON.stringify(tasks)); } catch { /* noop */ }
  for (const cb of devScheduleListeners) cb({ tasks });
}
function devValidateCron(cron: string): ValidateCronResult {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) return { valid: false };
  const ok = fields.every((f) => /^(\*|\d+|\d+-\d+|\*\/\d+|\d+(,\d+)+)$/.test(f));
  if (!ok) return { valid: false };
  return { valid: true, nextRunAt: new Date(Date.now() + 60_000).toISOString() };
}

/** List all scheduled tasks persisted to ~/.pandacc/scheduled_tasks.json. */
export async function listScheduledTasks(): Promise<ScheduledTask[]> {
  if (IS_DEV) return devReadTasks();
  return getPandaAPI().schedule.list();
}

/** Create a scheduled task. Validates cron expression server-side. */
export async function createScheduledTask(input: CreateScheduledTaskInput): Promise<ScheduledTask | null> {
  if (IS_DEV) {
    const tasks = devReadTasks();
    const now = new Date().toISOString();
    const task: ScheduledTask = {
      id: `dev-${Date.now()}`,
      name: input.name,
      description: input.description ?? '',
      cron: input.cron,
      prompt: input.prompt,
      cwd: input.cwd ?? '',
      status: 'active',
      createdAt: now,
      nextRunAt: devValidateCron(input.cron).nextRunAt ?? undefined,
      runCount: 0,
      logs: [],
    };
    tasks.push(task);
    devWriteTasks(tasks);
    return task;
  }
  return getPandaAPI().schedule.create(input);
}

/** Update an existing task (partial). Returns the updated task or null if not found. */
export async function updateScheduledTask(input: UpdateScheduledTaskInput): Promise<ScheduledTask | null> {
  if (IS_DEV) {
    const tasks = devReadTasks();
    const idx = tasks.findIndex((t) => t.id === input.id);
    if (idx < 0) return null;
    tasks[idx] = { ...tasks[idx], ...input.updates };
    devWriteTasks(tasks);
    return tasks[idx];
  }
  return getPandaAPI().schedule.update(input);
}

/** Delete a task by id. Returns true if a task was removed. */
export async function deleteScheduledTask(id: string): Promise<boolean> {
  if (IS_DEV) {
    const tasks = devReadTasks();
    const next = tasks.filter((t) => t.id !== id);
    if (next.length === tasks.length) return false;
    devWriteTasks(next);
    return true;
  }
  return getPandaAPI().schedule.delete({ id });
}

/** Fire the task immediately and record the run log. */
export async function runScheduledTaskNow(id: string): Promise<ScheduledTaskRunLog | null> {
  if (IS_DEV) {
    const tasks = devReadTasks();
    const t = tasks.find((x) => x.id === id);
    if (!t) return null;
    const run: ScheduledTaskRunLog = {
      id: `run-${Date.now()}`,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      status: 'completed',
      durationMs: 0,
    };
    t.logs = [run, ...(t.logs ?? [])].slice(0, 20);
    t.lastRunAt = run.startedAt;
    t.runCount = (t.runCount ?? 0) + 1;
    devWriteTasks(tasks);
    return run;
  }
  return getPandaAPI().schedule.runNow({ id });
}

/** Flip between active and disabled state. */
export async function toggleScheduledTask(id: string): Promise<ScheduledTask | null> {
  if (IS_DEV) {
    const tasks = devReadTasks();
    const t = tasks.find((x) => x.id === id);
    if (!t) return null;
    t.status = t.status === 'active' ? 'disabled' : 'active';
    devWriteTasks(tasks);
    return t;
  }
  return getPandaAPI().schedule.toggle({ id });
}

/** Validate a cron string and return the next run timestamp. */
export async function validateCron(cron: string): Promise<ValidateCronResult> {
  if (IS_DEV) return devValidateCron(cron);
  return getPandaAPI().schedule.validateCron({ cron });
}

/** Subscribe to scheduled-tasks updates pushed from main. */
export function onScheduledTasksUpdated(
  callback: (payload: ScheduledTasksUpdatedPayload) => void,
): Unsubscribe {
  if (IS_DEV) {
    devScheduleListeners.add(callback);
    return () => { devScheduleListeners.delete(callback); };
  }
  return getPandaAPI().schedule.onUpdated(callback);
}

// ─── Comdr 指令: ~/.pandacc 真实配置目录扫描（Settings sub-tabs） ────────────

/** 列 ~/.pandacc/skills/ 下所有 skill 目录（含 SKILL.md frontmatter）。dev 返回空。 */
export async function listSkillsPandacc(): Promise<PandaccSkillItem[]> {
  if (IS_DEV) return [];
  try {
    return await getPandaAPI().pandacc.listSkills();
  } catch (err) {
    console.warn('[bridge] listSkillsPandacc failed:', err);
    return [];
  }
}

/** 列 ~/.pandacc/agents/*.md 解析 frontmatter（name/description/tools/model）。dev 返回空。 */
export async function listAgentsPandacc(): Promise<PandaccAgentItem[]> {
  if (IS_DEV) return [];
  try {
    return await getPandaAPI().pandacc.listAgents();
  } catch (err) {
    console.warn('[bridge] listAgentsPandacc failed:', err);
    return [];
  }
}

/** 读 ~/.pandacc/plugins/installed_plugins.json 解析所有已装插件实例。dev 返回空。 */
export async function listPluginsPandacc(): Promise<PandaccPluginItem[]> {
  if (IS_DEV) return [];
  try {
    return await getPandaAPI().pandacc.listPlugins();
  } catch (err) {
    console.warn('[bridge] listPluginsPandacc failed:', err);
    return [];
  }
}

/** 读 ~/.pandacc/settings.json 的 env 字段。dev 返回空 record。 */
export async function getPandaEnv(): Promise<Record<string, string>> {
  if (IS_DEV) return {};
  try {
    return await getPandaAPI().pandacc.getEnv();
  } catch (err) {
    console.warn('[bridge] getPandaEnv failed:', err);
    return {};
  }
}

/** Merge-set 单个 env key（value === null|'' 时删除）。dev 返回 ok:true 但不落盘。 */
export async function setPandaEnv(
  key: string,
  value: string | null,
): Promise<PandaEnvSetResult> {
  if (IS_DEV) return { ok: true };
  try {
    return await getPandaAPI().pandacc.setEnv(key, value);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[bridge] setPandaEnv failed:', msg);
    return { ok: false, error: msg };
  }
}

/** 检测 Computer Use 平台支持情况 + grants 文件存在状态。dev 返回 stub false。 */
// Comdr 指令: ComputerUse 完整实现 - cc-haha 对标 — 加 permissions 字段 fallback
export async function getComputerUseStatusPandacc(): Promise<PandaccComputerUseStatus> {
  const fallback: PandaccComputerUseStatus = {
    platform: typeof navigator !== 'undefined' && /mac/i.test(navigator.platform) ? 'darwin' : 'unknown',
    supported: false,
    grantsExist: false,
    grantsPath: '',
    grantedApps: [],
    permissions: { accessibility: null, screenRecording: null },
  };
  if (IS_DEV) return fallback;
  try {
    return await getPandaAPI().pandacc.getComputerUseStatus();
  } catch (err) {
    console.warn('[bridge] getComputerUseStatusPandacc failed:', err);
    return fallback;
  }
}

// ─── Comdr 指令: ComputerUse 完整实现 - cc-haha 对标 (5 个 bridge 函数) ──────

/** 列已装 macOS 应用（用 system_profiler 扫）。dev 模式返回空。 */
export async function listComputerUseInstalledApps(): Promise<ComputerUseInstalledApp[]> {
  if (IS_DEV) return [];
  try {
    return await getPandaAPI().computerUse.getInstalledApps();
  } catch (err) {
    console.warn('[bridge] listComputerUseInstalledApps failed:', err);
    return [];
  }
}

/** 读 ~/.pandacc/computer-use/grants.json（authorizedApps + grantFlags）。dev 模式返回默认空。 */
export async function getComputerUseAuthorizedApps(): Promise<ComputerUseGrantsFile> {
  const empty: ComputerUseGrantsFile = {
    authorizedApps: [],
    grantFlags: { clipboardRead: true, clipboardWrite: true, systemKeyCombos: true },
  };
  if (IS_DEV) return empty;
  try {
    return await getPandaAPI().computerUse.getAuthorizedApps();
  } catch (err) {
    console.warn('[bridge] getComputerUseAuthorizedApps failed:', err);
    return empty;
  }
}

/** 写 grants.json（首次自动 mkdir）。dev 模式返回 ok:true 但不落盘。 */
export async function setComputerUseAuthorizedApps(
  input: SetAuthorizedAppsInput,
): Promise<ComputerUseOpResult> {
  if (IS_DEV) return { ok: true };
  try {
    return await getPandaAPI().computerUse.setAuthorizedApps(input);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[bridge] setComputerUseAuthorizedApps failed:', msg);
    return { ok: false, error: msg };
  }
}

/** 跳 macOS 系统设置 — 隐私&安全性 → accessibility / screen-recording。dev 模式 no-op ok。 */
export async function openComputerUseSettings(
  pane: ComputerUsePane,
): Promise<ComputerUseOpResult> {
  if (IS_DEV) return { ok: true };
  try {
    return await getPandaAPI().computerUse.openSettings({ pane });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[bridge] openComputerUseSettings failed:', msg);
    return { ok: false, error: msg };
  }
}

// ─── Comdr 指令: 学习助手 — panda CLI /learn 落盘数据 (4 函数) ─────────────
//
// 数据来源：
//   /learn plan <topic>  →  <project_cwd>/working/learning-plans/<slug>.md
//   /learn from <file>   →  <project_cwd>/working/flashcards/<topic>.json
// 项目级 — 扫描 ~/.pandacc/projects/<slug>/ 反 sanitize 出原 cwd 后扫 working/。

/** 列所有 panda CLI 项目下的学习计划。dev 模式返回空（无落盘可读）。 */
export async function listLearningPlans(): Promise<LearningPlanMeta[]> {
  if (IS_DEV) return [];
  try {
    return await getPandaAPI().learning.listPlans();
  } catch (err) {
    console.warn('[bridge] listLearningPlans failed:', err);
    return [];
  }
}

/** 列所有 panda CLI 项目下的闪卡集（含 dueCount/learningCount/totalCount）。dev 模式返回空。 */
export async function listLearningFlashcards(): Promise<LearningFlashcardSet[]> {
  if (IS_DEV) return [];
  try {
    return await getPandaAPI().learning.listFlashcards();
  } catch (err) {
    console.warn('[bridge] listLearningFlashcards failed:', err);
    return [];
  }
}

/** 读取单个学习计划详情（markdown 全文 + 阶段 + 素材引用）。dev 模式 / 不存在均返回 null。 */
export async function readLearningPlan(
  projectSlug: string,
  slug: string,
): Promise<LearningPlanDetail | null> {
  if (IS_DEV) return null;
  try {
    return await getPandaAPI().learning.readPlan(projectSlug, slug);
  } catch (err) {
    console.warn('[bridge] readLearningPlan failed:', err);
    return null;
  }
}

/** 读取单个闪卡集（含完整 cards 数组 + 项目级 reviewLog）。dev 模式 / 不存在均返回 null。 */
export async function readLearningFlashcards(
  projectSlug: string,
  topic: string,
): Promise<LearningFlashcardSet | null> {
  if (IS_DEV) return null;
  try {
    return await getPandaAPI().learning.readFlashcards(projectSlug, topic);
  } catch (err) {
    console.warn('[bridge] readLearningFlashcards failed:', err);
    return null;
  }
}

// ─── Comdr 指令: Agent Teams — panda CLI ~/.pandacc/teams 落盘数据 (3 函数) ─
//
// 数据来源（panda CLI src/utils/swarm/teamHelpers.ts + utils/teammateMailbox.ts）：
//   团队根目录    →  ~/.pandacc/teams/<name>/
//   邮箱目录      →  ~/.pandacc/teams/<name>/inboxes/
//   Agent inbox   →  ~/.pandacc/teams/<name>/inboxes/<agent>.json
//   启用开关      →  ~/.pandacc/settings.json env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
// dev 模式无落盘可读 — 全部返回空 / null / false。

/** 列所有 panda CLI 团队。dev 模式返回空。 */
export async function listTeams(): Promise<TeamMeta[]> {
  if (IS_DEV) return [];
  try {
    return await getPandaAPI().teams.list();
  } catch (err) {
    console.warn('[bridge] listTeams failed:', err);
    return [];
  }
}

/** 读取单个团队详情（含每个 inbox 的解析后内容）。dev 模式 / 不存在均返回 null。 */
export async function getTeamDetail(name: string): Promise<TeamDetail | null> {
  if (IS_DEV) return null;
  try {
    return await getPandaAPI().teams.detail(name);
  } catch (err) {
    console.warn('[bridge] getTeamDetail failed:', err);
    return null;
  }
}

/** 读 ~/.pandacc/settings.json env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS。dev 模式返回 false。 */
export async function isAgentTeamsEnabled(): Promise<boolean> {
  if (IS_DEV) return false;
  try {
    return await getPandaAPI().teams.enabledStatus();
  } catch (err) {
    console.warn('[bridge] isAgentTeamsEnabled failed:', err);
    return false;
  }
}

// ─── Comdr 指令 cc-haha 路线 A: 工具调用调试器 — audit.jsonl 反向读 ─────────
//
// 数据来源（panda CLI src/utils/auditLog.ts → ~/.pandacc/audit.jsonl）。
// dev 模式无落盘 — 返回空 / 默认值。

export async function listRecentAudit(limit?: number): Promise<AuditEntry[]> {
  if (IS_DEV) return [];
  try {
    return await getPandaAPI().audit.listRecent(limit);
  } catch (err) {
    console.warn('[bridge] listRecentAudit failed:', err);
    return [];
  }
}

export async function filterAudit(filter: AuditFilter): Promise<AuditEntry[]> {
  if (IS_DEV) return [];
  try {
    return await getPandaAPI().audit.filter(filter);
  } catch (err) {
    console.warn('[bridge] filterAudit failed:', err);
    return [];
  }
}

export async function getAuditStats(): Promise<AuditStats> {
  if (IS_DEV) {
    return {
      total: 0,
      today: 0,
      errorRate: 0,
      topTools: [],
      lastTimestamp: null,
      exists: false,
    };
  }
  try {
    return await getPandaAPI().audit.stats();
  } catch (err) {
    console.warn('[bridge] getAuditStats failed:', err);
    return {
      total: 0,
      today: 0,
      errorRate: 0,
      topTools: [],
      lastTimestamp: null,
      exists: false,
    };
  }
}

// ─── Comdr 指令 cc-haha 路线 A: memdir 反向读 ───────────────────────────────
//
// 数据来源（panda CLI src/memdir/paths.ts getAutoMemPath()）：
//   ~/.pandacc/projects/<sanitize-cwd>/memory/{patterns,scars,episodes,
//     semantic,procedural,working,dreams}/

export async function listMemdirProjects(): Promise<MemdirProjectMeta[]> {
  if (IS_DEV) return [];
  try {
    return await getPandaAPI().memdir.listProjects();
  } catch (err) {
    console.warn('[bridge] listMemdirProjects failed:', err);
    return [];
  }
}

export async function listMemdirLayer(
  projectSlug: string,
  layer: MemdirLayer,
): Promise<MemdirEntry[]> {
  if (IS_DEV) return [];
  try {
    return await getPandaAPI().memdir.listLayer(projectSlug, layer);
  } catch (err) {
    console.warn('[bridge] listMemdirLayer failed:', err);
    return [];
  }
}

export async function readMemdirFile(filePath: string): Promise<MemdirReadResult | null> {
  if (IS_DEV) return null;
  try {
    return await getPandaAPI().memdir.readFile(filePath);
  } catch (err) {
    console.warn('[bridge] readMemdirFile failed:', err);
    return null;
  }
}

// ─── Comdr 指令 cc-haha 路线 A: connectors.json 真实数据 ────────────────────
//
// 数据来源（panda CLI src/connectors/config.ts → ~/.pandacc/config/connectors.json）：
//   6 platform: feishu / dingtalk / slack / telegram / wechat / teams

export async function getConnectorsSnapshot(): Promise<ConnectorsConfigSnapshot> {
  if (IS_DEV) {
    return {
      configExists: false,
      configPath: '',
      entries: [],
    };
  }
  try {
    return await getPandaAPI().connectors.config();
  } catch (err) {
    console.warn('[bridge] getConnectorsSnapshot failed:', err);
    return {
      configExists: false,
      configPath: '',
      entries: [],
    };
  }
}

export async function toggleConnector(
  platform: ConnectorPlatformId,
  enabled: boolean,
): Promise<ConnectorToggleResult> {
  if (IS_DEV) {
    return { ok: false, error: 'dev mode — no-op' };
  }
  try {
    return await getPandaAPI().connectors.toggle(platform, enabled);
  } catch (err) {
    console.warn('[bridge] toggleConnector failed:', err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Comdr 指令 cc-haha 路线 A: 会话控制 fork/branch/resume slash 注入 ───────

export async function dispatchSessionControl(
  sessionId: string,
  action: SessionControlAction,
  args?: string,
): Promise<SessionControlResult> {
  if (IS_DEV) {
    return { ok: false, command: '', error: 'dev mode — no-op' };
  }
  try {
    return await getPandaAPI().sessionControl.dispatch(sessionId, action, args);
  } catch (err) {
    console.warn('[bridge] dispatchSessionControl failed:', err);
    return {
      ok: false,
      command: '',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
