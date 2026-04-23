// Input: Zod schemas from ./schemas.ts
// Output: TypeScript types inferred from Zod + PandaChatAPI named interface (C-5) + UpdateStatus type
// Pos: IPC type layer — consumed by bridge.ts, chat renderer components, and main process handlers
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import type { z } from 'zod';
import type {
  chatSendSchema,
  chatStreamStartSchema,
  chatStreamDeltaSchema,
  chatStreamEndSchema,
  chatStopSchema,
  chatWindowToggleSchema,
  sessionListRequestSchema,
  sessionListResponseSchema,
  sessionCreateRequestSchema,
  sessionCreateResponseSchema,
  sessionRenameSchema,
  sessionDeleteSchema,
  sessionFocusSchema,
  sessionUpdatedSchema,
  sessionMetaSchema,
  tokenUsageSchema,
  attachmentSchema,
  toolUseStartSchema,
  toolUseEndSchema,
  toolPermRequestSchema,
  toolPermResponseSchema,
  fsSearchRequestSchema,
  fsSearchResponseSchema,
  fsListRequestSchema,
  fsListResponseSchema,
  windowPositionSchema,
  slashCommandsRequestSchema,
  slashCommandsResponseSchema,
  modelListRequestSchema,
  modelListResponseSchema,
  modelSetSchema,
  permissionModeSetSchema,
  clipboardPasteImageSchema,
} from './schemas';

// ─── Inferred payload types ─────────────────────────────────────────────────

// Shared sub-types
export type Attachment      = z.infer<typeof attachmentSchema>;
export type TokenUsage      = z.infer<typeof tokenUsageSchema>;
export type SessionMeta     = z.infer<typeof sessionMetaSchema>;

// Chat messaging (1-6)
export type ChatSendPayload         = z.infer<typeof chatSendSchema>;
export type ChatStreamStartPayload  = z.infer<typeof chatStreamStartSchema>;
export type ChatStreamDeltaPayload  = z.infer<typeof chatStreamDeltaSchema>;
export type ChatStreamEndPayload    = z.infer<typeof chatStreamEndSchema>;
export type ChatStopPayload         = z.infer<typeof chatStopSchema>;
export type ChatWindowTogglePayload = z.infer<typeof chatWindowToggleSchema>;

// Session management (7-12)
export type SessionListRequest      = z.infer<typeof sessionListRequestSchema>;
export type SessionListResponse     = z.infer<typeof sessionListResponseSchema>;
export type SessionCreateRequest    = z.infer<typeof sessionCreateRequestSchema>;
export type SessionCreateResponse   = z.infer<typeof sessionCreateResponseSchema>;
export type SessionRenamePayload    = z.infer<typeof sessionRenameSchema>;
export type SessionDeletePayload    = z.infer<typeof sessionDeleteSchema>;
export type SessionFocusPayload     = z.infer<typeof sessionFocusSchema>;
export type SessionUpdatedPayload   = z.infer<typeof sessionUpdatedSchema>;

// Tool permissions (13-16)
export type ToolUseStartPayload     = z.infer<typeof toolUseStartSchema>;
export type ToolUseEndPayload       = z.infer<typeof toolUseEndSchema>;
export type ToolPermRequestPayload  = z.infer<typeof toolPermRequestSchema>;
export type ToolPermResponsePayload = z.infer<typeof toolPermResponseSchema>;

// File system (17-18)
export type FsSearchRequest         = z.infer<typeof fsSearchRequestSchema>;
export type FsSearchResponse        = z.infer<typeof fsSearchResponseSchema>;
export type FsListRequest           = z.infer<typeof fsListRequestSchema>;
export type FsListResponse          = z.infer<typeof fsListResponseSchema>;

// Config & misc (19-24)
export type WindowPositionPayload   = z.infer<typeof windowPositionSchema>;
export type SlashCommandsRequest    = z.infer<typeof slashCommandsRequestSchema>;
export type SlashCommandsResponse   = z.infer<typeof slashCommandsResponseSchema>;
export type ModelListRequest        = z.infer<typeof modelListRequestSchema>;
export type ModelListResponse       = z.infer<typeof modelListResponseSchema>;
export type ModelSetPayload         = z.infer<typeof modelSetSchema>;
export type PermissionModePayload   = z.infer<typeof permissionModeSetSchema>;
export type ClipboardPastePayload   = z.infer<typeof clipboardPasteImageSchema>;

// Connection lifecycle (session ready + history replay)
export interface SessionReadyPayload {
  sessionId: string;
}

export interface MessageHistoryPayload {
  sessionId: string;
  role: 'assistant' | 'user' | 'system';
  type?: string;
  content?: unknown;
  message?: string;
  [key: string]: unknown;
}

// ─── Unsubscribe function type ──────────────────────────────────────────────

export type Unsubscribe = () => void;

// ─── Update status type ────────────────────────────────────────────────────

export type UpdateStatusType =
  | 'checking'
  | 'available'
  | 'up-to-date'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdateStatus {
  status: UpdateStatusType;
  version?: string;
  releaseNotes?: string | { version: string; note: string }[] | null;
  percent?: number;
  message?: string;
}

// ─── PandaChatAPI: named interface matching preload (C-5 compliant) ─────────

export interface PandaChatAPI {
  chat: {
    send(payload: ChatSendPayload): Promise<void>;
    stop(payload: ChatStopPayload): Promise<void>;
    pasteImage(payload: ClipboardPastePayload): Promise<void>;
    getClipboardImage(): Promise<string | null>;
    onStreamStart(cb: (payload: ChatStreamStartPayload) => void): Unsubscribe;
    onStreamDelta(cb: (payload: ChatStreamDeltaPayload) => void): Unsubscribe;
    onStreamEnd(cb: (payload: ChatStreamEndPayload) => void): Unsubscribe;
    onWindowToggle(cb: (payload: ChatWindowTogglePayload) => void): Unsubscribe;
  };
  session: {
    list(payload: SessionListRequest): Promise<SessionListResponse>;
    create(payload: SessionCreateRequest): Promise<SessionCreateResponse>;
    rename(payload: SessionRenamePayload): Promise<void>;
    delete(payload: SessionDeletePayload): Promise<void>;
    focus(payload: SessionFocusPayload): Promise<void>;
    onUpdated(cb: (payload: SessionUpdatedPayload) => void): Unsubscribe;
    onReady(cb: (payload: SessionReadyPayload) => void): Unsubscribe;
    onMessageHistory(cb: (payload: MessageHistoryPayload) => void): Unsubscribe;
  };
  tool: {
    respondPermission(payload: ToolPermResponsePayload): Promise<void>;
    onUseStart(cb: (payload: ToolUseStartPayload) => void): Unsubscribe;
    onUseEnd(cb: (payload: ToolUseEndPayload) => void): Unsubscribe;
    onPermissionRequest(cb: (payload: ToolPermRequestPayload) => void): Unsubscribe;
  };
  fs: {
    search(payload: FsSearchRequest): Promise<FsSearchResponse>;
    list(payload: FsListRequest): Promise<FsListResponse>;
  };
  config: {
    setWindowPosition(payload: WindowPositionPayload): Promise<void>;
    getSlashCommands(payload: SlashCommandsRequest): Promise<SlashCommandsResponse>;
    getModels(payload: ModelListRequest): Promise<ModelListResponse>;
    setModel(payload: ModelSetPayload): Promise<void>;
    setPermissionMode(payload: PermissionModePayload): Promise<void>;
  };
  notification: {
    setEnabled(enabled: boolean): Promise<void>;
    clear(): Promise<void>;
  };
  theme: {
    getSystemTheme(): Promise<'light' | 'dark'>;
    onThemeChange(callback: (isDark: boolean) => void): Unsubscribe;
  };
  update: {
    check(): Promise<void>;
    download(): Promise<void>;
    install(): Promise<void>;
    onStatus(callback: (status: UpdateStatus) => void): Unsubscribe;
  };
  window: {
    newWindow(): Promise<{ windowId: number }>;
    openSessionInWindow(sessionId: string): Promise<{ windowId: number; reused: boolean }>;
    getWindowId(): Promise<number>;
    onWindowInit(cb: (payload: WindowInitPayload) => void): Unsubscribe;
  };
}

// ─── Window init event payload ────────────────────────────────────────────

export interface WindowInitPayload {
  windowId: number;
  sessionId?: string;
}

// ─── Global augmentation for window.pandaAPI ────────────────────────────────

declare global {
  interface Window {
    pandaAPI?: PandaChatAPI;
  }
}
