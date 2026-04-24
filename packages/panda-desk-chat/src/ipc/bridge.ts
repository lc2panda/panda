// Input: window.pandaAPI injected by preload/chat.ts via contextBridge (named API)
//        In dev mode: DevMockRelay provides full simulated backend (chat + session + config + fs)
// Output: Type-safe IPC client for chat renderer components (+ auto-update bridge + disk session access)
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
  WindowInitPayload,
  DiskSessionMeta,
  SessionDetail,
  ScheduledTask,
  ScheduledTaskRunLog,
  CreateScheduledTaskInput,
  UpdateScheduledTaskInput,
  ValidateCronResult,
  ScheduledTasksUpdatedPayload,
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

/** Set the active model for a session. */
export async function setModel(
  sessionId: string,
  modelId: string,
): Promise<void> {
  if (IS_DEV) return getDevRelay().setModel(sessionId, modelId);
  return getPandaAPI().config.setModel({ sessionId, modelId });
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

/** List all scheduled tasks persisted to ~/.pandacc/scheduled_tasks.json. */
export async function listScheduledTasks(): Promise<ScheduledTask[]> {
  if (IS_DEV) return [];
  return getPandaAPI().schedule.list();
}

/** Create a scheduled task. Validates cron expression server-side. */
export async function createScheduledTask(input: CreateScheduledTaskInput): Promise<ScheduledTask | null> {
  if (IS_DEV) return null;
  return getPandaAPI().schedule.create(input);
}

/** Update an existing task (partial). Returns the updated task or null if not found. */
export async function updateScheduledTask(input: UpdateScheduledTaskInput): Promise<ScheduledTask | null> {
  if (IS_DEV) return null;
  return getPandaAPI().schedule.update(input);
}

/** Delete a task by id. Returns true if a task was removed. */
export async function deleteScheduledTask(id: string): Promise<boolean> {
  if (IS_DEV) return false;
  return getPandaAPI().schedule.delete({ id });
}

/** Fire the task immediately and record the run log. */
export async function runScheduledTaskNow(id: string): Promise<ScheduledTaskRunLog | null> {
  if (IS_DEV) return null;
  return getPandaAPI().schedule.runNow({ id });
}

/** Flip between active and disabled state. */
export async function toggleScheduledTask(id: string): Promise<ScheduledTask | null> {
  if (IS_DEV) return null;
  return getPandaAPI().schedule.toggle({ id });
}

/** Validate a cron string and return the next run timestamp. */
export async function validateCron(cron: string): Promise<ValidateCronResult> {
  if (IS_DEV) return { valid: false };
  return getPandaAPI().schedule.validateCron({ cron });
}

/** Subscribe to scheduled-tasks updates pushed from main. */
export function onScheduledTasksUpdated(
  callback: (payload: ScheduledTasksUpdatedPayload) => void,
): Unsubscribe {
  if (IS_DEV) return () => {};
  return getPandaAPI().schedule.onUpdated(callback);
}
