// Input: window.pandaAPI injected by preload/chat.ts via contextBridge (named API)
// Output: Type-safe IPC client for chat renderer components
// Pos: IPC bridge layer — sole entry point for renderer → main communication
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import type {
  PandaChatAPI,
  Unsubscribe,
  ChatSendPayload,
  ChatStreamStartPayload,
  ChatStreamDeltaPayload,
  ChatStreamEndPayload,
  ChatWindowTogglePayload,
  SessionListResponse,
  SessionCreateResponse,
  SessionUpdatedPayload,
  ToolUseStartPayload,
  ToolUseEndPayload,
  ToolPermRequestPayload,
  FsSearchResponse,
  FsListResponse,
  SlashCommandsResponse,
  ModelListResponse,
} from './types';

// ─── Core API accessor ──────────────────────────────────────────────────────

/**
 * Returns the pandaAPI bridge injected by preload.
 * Throws if called outside Electron (e.g. in plain browser dev).
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

// ─── Chat messaging ────────────────────────────────────────────────────────

/** Send a user message (optionally with attachments). */
export async function sendMessage(
  sessionId: string,
  content: string,
  attachments?: ChatSendPayload['attachments'],
): Promise<void> {
  return getPandaAPI().chat.send({ sessionId, content, attachments });
}

/** Abort the current streaming response. */
export async function stopGeneration(sessionId: string): Promise<void> {
  return getPandaAPI().chat.stop({ sessionId });
}

/** Paste an image from clipboard (data URL, max 10MB). */
export async function pasteImage(
  sessionId: string,
  dataUrl: string,
): Promise<void> {
  return getPandaAPI().chat.pasteImage({ sessionId, dataUrl });
}

/** Subscribe to stream-start events. Returns unsubscribe function. */
export function onStreamStart(
  callback: (payload: ChatStreamStartPayload) => void,
): Unsubscribe {
  return getPandaAPI().chat.onStreamStart(callback);
}

/** Subscribe to stream-delta events. Returns unsubscribe function. */
export function onStreamDelta(
  callback: (payload: ChatStreamDeltaPayload) => void,
): Unsubscribe {
  return getPandaAPI().chat.onStreamDelta(callback);
}

/** Subscribe to stream-end events. Returns unsubscribe function. */
export function onStreamEnd(
  callback: (payload: ChatStreamEndPayload) => void,
): Unsubscribe {
  return getPandaAPI().chat.onStreamEnd(callback);
}

/** Subscribe to window toggle events. Returns unsubscribe function. */
export function onWindowToggle(
  callback: (payload: ChatWindowTogglePayload) => void,
): Unsubscribe {
  return getPandaAPI().chat.onWindowToggle(callback);
}

// ─── Session management ────────────────────────────────────────────────────

/** List all sessions. */
export async function listSessions(): Promise<SessionListResponse> {
  return getPandaAPI().session.list({});
}

/** Create a new session in the given working directory. */
export async function createSession(
  cwd: string,
  name?: string,
): Promise<SessionCreateResponse> {
  return getPandaAPI().session.create({ cwd, name });
}

/** Rename an existing session. */
export async function renameSession(
  sessionId: string,
  name: string,
): Promise<void> {
  return getPandaAPI().session.rename({ sessionId, name });
}

/** Delete a session. */
export async function deleteSession(sessionId: string): Promise<void> {
  return getPandaAPI().session.delete({ sessionId });
}

/** Focus/switch to a session. */
export async function focusSession(sessionId: string): Promise<void> {
  return getPandaAPI().session.focus({ sessionId });
}

/** Subscribe to session-list updates. Returns unsubscribe function. */
export function onSessionUpdated(
  callback: (payload: SessionUpdatedPayload) => void,
): Unsubscribe {
  return getPandaAPI().session.onUpdated(callback);
}

// ─── Tool permissions ──────────────────────────────────────────────────────

/** Subscribe to tool execution start events. */
export function onToolUseStart(
  callback: (payload: ToolUseStartPayload) => void,
): Unsubscribe {
  return getPandaAPI().tool.onUseStart(callback);
}

/** Subscribe to tool execution end events. */
export function onToolUseEnd(
  callback: (payload: ToolUseEndPayload) => void,
): Unsubscribe {
  return getPandaAPI().tool.onUseEnd(callback);
}

/** Subscribe to permission request events. */
export function onPermissionRequest(
  callback: (payload: ToolPermRequestPayload) => void,
): Unsubscribe {
  return getPandaAPI().tool.onPermissionRequest(callback);
}

/** Respond to a tool permission request. */
export async function respondToPermission(
  sessionId: string,
  toolUseId: string,
  decision: 'allow' | 'allow_session' | 'deny',
): Promise<void> {
  return getPandaAPI().tool.respondPermission({ sessionId, toolUseId, decision });
}

// ─── File system ───────────────────────────────────────────────────────────

/** Search files by query string. */
export async function searchFiles(
  sessionId: string,
  query: string,
  maxResults?: number,
): Promise<FsSearchResponse> {
  return getPandaAPI().fs.search({ sessionId, query, maxResults });
}

/** List directory contents. */
export async function listDirectory(
  sessionId: string,
  dirPath: string,
): Promise<FsListResponse> {
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
  return getPandaAPI().config.setWindowPosition({ x, y, width, height });
}

/** Get available slash commands. */
export async function getSlashCommands(): Promise<SlashCommandsResponse> {
  return getPandaAPI().config.getSlashCommands({});
}

/** Get available models. */
export async function getModels(): Promise<ModelListResponse> {
  return getPandaAPI().config.getModels({});
}

/** Set the active model for a session. */
export async function setModel(
  sessionId: string,
  modelId: string,
): Promise<void> {
  return getPandaAPI().config.setModel({ sessionId, modelId });
}

/** Set the permission mode. */
export async function setPermissionMode(
  mode: 'default' | 'plan' | 'auto' | 'bypassPermissions',
): Promise<void> {
  return getPandaAPI().config.setPermissionMode({ mode });
}
