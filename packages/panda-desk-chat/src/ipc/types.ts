// Input: Zod schemas from ./schemas.ts
// Output: TypeScript types inferred from Zod + PandaChatAPI named interface (C-5) + UpdateStatus type + DiskSessionMeta/MessageEntry/SessionDetail (pd:sessions:* IPC, cc-haha-aligned) + ScheduledTask types (panda:schedule:* IPC) + Pandacc Skills/Agents/Plugins/Env/ComputerUse types
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

// ─── Disk-based session types (pd:sessions:* IPC channels) ────────────────

export interface DiskSessionMeta {
  id: string;
  title: string;
  projectPath: string;
  messageCount: number;
  lastModified: string; // ISO date
  workDir?: string;
}

/**
 * cc-haha-aligned message entry. Each JSONL line that carries a real
 * `message.role` becomes exactly one MessageEntry; `tool_use` and
 * `tool_result` blocks are NOT folded into the assistant turn — they live
 * as independent entries with their own type so the renderer can layout
 * them as discrete cards (Anthropic transcript shape).
 *
 * Reference: cc-haha sessionService.ts L41-50.
 */
export type MessageEntryType =
  | 'user'
  | 'assistant'
  | 'system'
  | 'tool_use'
  | 'tool_result';

export interface MessageEntry {
  /** Stable id — JSONL `uuid` if present, otherwise a synthesized UUIDv4. */
  id: string;
  /** Normalized type — see entryToMessage() in disk-session-scanner. */
  type: MessageEntryType;
  /**
   * Raw message content from the JSONL line. Either a `string`
   * (legacy/short user turns) or an `Array<{type: ..., ...}>` of Anthropic
   * content blocks (`text` / `thinking` / `tool_use` / `tool_result` / `image` ...).
   *
   * The type is intentionally `unknown` — never collapse to a string at
   * the data layer; renderer-side extractors do that lossily on demand.
   */
  content: unknown;
  /** ISO timestamp from the JSONL line, or now() when missing. */
  timestamp: string;
  /** Model id for assistant turns (when present in the JSONL message). */
  model?: string;
  /** Parent JSONL uuid — used for sidechain ancestry walks. */
  parentUuid?: string;
  /**
   * Owning Agent tool_use id when this entry is part of a sub-agent
   * sidechain (resolved by walking parentUuid until we hit an Agent
   * tool_use, see resolveParentToolUseId).
   */
  parentToolUseId?: string;
  /** True when the entry belongs to a sub-agent sidechain. */
  isSidechain?: boolean;
}

export interface SessionDetail extends DiskSessionMeta {
  messages: MessageEntry[];
}

// 遗留 IPC 修复 #1: cc-haha desktop sessionsApi.getGitInfo 1:1 形态
// (cc-haha api/sessions.ts L67-L69 + server/api/sessions.ts L208-L267)
export interface GitInfo {
  branch: string | null;
  repoName: string | null;
  workDir: string;
  changedFiles: number;
}

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
    /** List all .pandacc sessions from disk (pd:sessions:list-all). */
    listAllSessions(): Promise<DiskSessionMeta[]>;
    /** Get session detail with messages (pd:sessions:get-history). */
    getHistory(sessionId: string): Promise<SessionDetail | null>;
    /** 遗留 IPC 修复 #1: cc-haha sessionsApi.getGitInfo (panda:session:git-info). */
    getGitInfo(sessionId: string, cwd?: string): Promise<GitInfo>;
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
  schedule: {
    list(): Promise<ScheduledTask[]>;
    create(payload: CreateScheduledTaskInput): Promise<ScheduledTask>;
    update(payload: UpdateScheduledTaskInput): Promise<ScheduledTask | null>;
    delete(payload: { id: string }): Promise<boolean>;
    runNow(payload: { id: string }): Promise<ScheduledTaskRunLog | null>;
    toggle(payload: { id: string }): Promise<ScheduledTask | null>;
    validateCron(payload: { cron: string }): Promise<ValidateCronResult>;
    onUpdated(cb: (payload: ScheduledTasksUpdatedPayload) => void): Unsubscribe;
  };
  // Comdr 指令: ~/.pandacc 配置目录扫描 namespace
  pandacc: {
    listSkills(): Promise<PandaccSkillItem[]>;
    listAgents(): Promise<PandaccAgentItem[]>;
    listPlugins(): Promise<PandaccPluginItem[]>;
    getEnv(): Promise<Record<string, string>>;
    setEnv(key: string, value: string | null): Promise<PandaEnvSetResult>;
    getComputerUseStatus(): Promise<PandaccComputerUseStatus>;
  };
  // Comdr 指令: ComputerUse 完整实现 - cc-haha 对标 — 独立 namespace（5 方法）
  computerUse: {
    getStatus(): Promise<PandaccComputerUseStatus>;
    getInstalledApps(): Promise<ComputerUseInstalledApp[]>;
    getAuthorizedApps(): Promise<ComputerUseGrantsFile>;
    setAuthorizedApps(input: SetAuthorizedAppsInput): Promise<ComputerUseOpResult>;
    openSettings(input: { pane: ComputerUsePane }): Promise<ComputerUseOpResult>;
  };
  // Comdr 指令: IM Wechat / 任务 B — IM Adapter 启停 namespace
  adapter: {
    start(platform: AdapterPlatform): Promise<AdapterStartResult>;
    stop(platform: AdapterPlatform): Promise<AdapterStopResult>;
    status(platform: AdapterPlatform): Promise<AdapterStatus>;
  };
  // Comdr 指令: 超级助手 Wechat DB / 任务 C — 微信本地 db 解密 namespace
  wechat: {
    getStatus(): Promise<WechatDbStatusResult>;
    setConfig(patch: WechatConfigPatch): Promise<WechatOpResult>;
    setProactive(patch: WechatProactivePatch): Promise<WechatOpResult>;
    decrypt(): Promise<WechatDecryptResult>;
  };
  // Comdr 指令: 学习助手 — panda CLI /learn 落盘数据扫描 namespace
  learning: {
    listPlans(): Promise<LearningPlanMeta[]>;
    listFlashcards(): Promise<LearningFlashcardSet[]>;
    readPlan(projectSlug: string, slug: string): Promise<LearningPlanDetail | null>;
    readFlashcards(projectSlug: string, topic: string): Promise<LearningFlashcardSet | null>;
  };
}

// ─── Window init event payload ────────────────────────────────────────────

export interface WindowInitPayload {
  windowId: number;
  sessionId?: string;
}

// ─── Scheduled tasks (panda:schedule:*) ────────────────────────────────────

export type ScheduledTaskStatus = 'active' | 'disabled';
export type ScheduledRunStatus = 'completed' | 'failed' | 'running';

export interface ScheduledTaskRunLog {
  id: string;
  status: ScheduledRunStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  error?: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  cron: string;
  prompt: string;
  cwd: string;
  status: ScheduledTaskStatus;
  createdAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
  logs: ScheduledTaskRunLog[];
}

export interface CreateScheduledTaskInput {
  name: string;
  description?: string;
  cron: string;
  prompt: string;
  cwd?: string;
}

export interface UpdateScheduledTaskInput {
  id: string;
  updates: Partial<Pick<ScheduledTask, 'name' | 'description' | 'cron' | 'prompt' | 'cwd' | 'status'>>;
}

export interface ValidateCronResult {
  valid: boolean;
  nextRunAt?: string | null;
}

export interface ScheduledTasksUpdatedPayload {
  tasks: ScheduledTask[];
}

// ─── Comdr 指令: pandacc 配置目录扫描类型 ──────────────────────────────────

export interface PandaccSkillItem {
  name: string;
  displayName?: string;
  description: string;
  path: string;
  version?: string;
  hasSkillMd: boolean;
}

export interface PandaccAgentItem {
  name: string;
  description: string;
  tools: string[];
  model?: string;
  path: string;
}

export interface PandaccPluginItem {
  id: string;
  name: string;
  marketplace: string;
  version: string;
  scope: 'user' | 'project' | 'managed' | 'builtin';
  installPath: string;
  installedAt?: string;
  lastUpdated?: string;
  enabled: boolean;
}

// Comdr 指令: ComputerUse 完整实现 - cc-haha 对标
export interface ComputerUseAuthorizedApp {
  bundleId: string;
  displayName: string;
  authorizedAt: string;
}

export interface ComputerUseInstalledApp {
  bundleId: string;
  displayName: string;
  path: string;
}

export interface ComputerUseGrantFlags {
  clipboardRead: boolean;
  clipboardWrite: boolean;
  systemKeyCombos: boolean;
}

export interface ComputerUsePermissions {
  /** macOS TCC accessibility — null when non-darwin or detection failed. */
  accessibility: boolean | null;
  /** macOS TCC screen recording — null when non-darwin or detection failed. */
  screenRecording: boolean | null;
}

export interface PandaccComputerUseStatus {
  platform: string;
  supported: boolean;
  grantsExist: boolean;
  grantsPath: string;
  /**
   * Comdr 指令: ComputerUse 完整实现 - cc-haha 对标
   * 升级为完整 AuthorizedApp 列表（含 displayName/authorizedAt），不再仅是 bundleId 字符串。
   */
  grantedApps: ComputerUseAuthorizedApp[];
  permissions: ComputerUsePermissions;
}

export interface ComputerUseGrantsFile {
  authorizedApps: ComputerUseAuthorizedApp[];
  grantFlags: ComputerUseGrantFlags;
}

export interface SetAuthorizedAppsInput {
  authorizedApps: ComputerUseAuthorizedApp[];
  grantFlags?: Partial<ComputerUseGrantFlags>;
}

export type ComputerUsePane = 'accessibility' | 'screen-recording';

export type ComputerUseOpResult = { ok: true } | { ok: false; error: string };

export type PandaEnvSetResult = { ok: true } | { ok: false; error: string };

// ─── Comdr 指令: IM Wechat / 任务 B — IM Adapter types ─────────────────────

export type AdapterPlatform = 'feishu' | 'telegram' | 'wechat';

export interface AdapterStartResult {
  ok: boolean;
  pid?: number;
  error?: string;
  errorCode?: 'ALREADY_RUNNING' | 'NOT_INSTALLED' | 'SPAWN_FAILED' | 'INVALID_PLATFORM';
}

export interface AdapterStopResult {
  ok: boolean;
  error?: string;
}

export interface AdapterStatus {
  platform: AdapterPlatform;
  running: boolean;
  pid: number | null;
  installed: boolean;
  installedPath?: string;
  startedAt?: number;
  lastError?: string;
  lastExitCode?: number | null;
}

// ─── Comdr 指令: 超级助手 Wechat DB / 任务 C — 微信 db 解密 types ──────────

export interface WechatDbStatusResult {
  sqlcipher: { installed: boolean; version: string | null; path: string | null };
  keysFile: { configured: boolean; path: string | null; exists: boolean; readable: boolean };
  decryptDir: string;
  decryptDirExists: boolean;
  connectorsFile: string;
  connectorsExists: boolean;
  wechatEnabled: boolean;
  wechatMode: string | null;
  proactiveFile: string;
  proactiveExists: boolean;
  scenarios: { wechatMessages: boolean; wechatDailySituational: boolean };
  lastDecryptAt: string | null;
}

export interface WechatConfigPatch {
  enabled?: boolean;
  mode?: string;
  keysFile?: string;
  autoDecrypt?: 'off' | 'daily' | 'weekly';
}

export interface WechatProactivePatch {
  wechatMessages?: boolean;
  wechatDailySituational?: boolean;
}

export type WechatOpResult = { ok: true } | { ok: false; error: string };

export type WechatDecryptResult =
  | { ok: true; details?: string }
  | { ok: false; error: string; details?: string };

// ─── Comdr 指令: 学习助手 — panda CLI /learn 落盘数据 types ─────────────────
//
// 数据来源（panda CLI bundled skill src/skills/bundled/learn.ts）：
//   /learn plan <topic>  →  <project_cwd>/working/learning-plans/<slug>.md
//   /learn from <file>   →  <project_cwd>/working/flashcards/<topic>.json
//   复习日志              →  <project_cwd>/working/flashcards/.review-log.json

/** 学习计划的解析阶段（H2 section）。 */
export interface LearningStage {
  title: string;
  body: string;
}

/** 学习计划引用的素材链接（markdown link 或 .pdf 路径）。 */
export interface LearningMaterialRef {
  title: string;
  source: string;
  kind: 'url' | 'pdf' | 'note';
}

/** 学习计划列表元数据（无全文，列表展示用）。 */
export interface LearningPlanMeta {
  /** `<projectSlug>:<slug>` 唯一 id。 */
  id: string;
  projectSlug: string;
  projectCwd: string;
  /** 从 markdown H1 解析；缺失时回退到文件 slug。 */
  title: string;
  /** 文件名（不含 .md）。 */
  slug: string;
  /** 摘要（前 240 字）。 */
  excerpt: string;
  /** ISO 时间戳。 */
  createdAt: string;
  updatedAt: string;
  materialCount: number;
  stageCount: number;
}

/** 学习计划详情（含全文 + 阶段 + 素材）。 */
export interface LearningPlanDetail extends LearningPlanMeta {
  /** Markdown 全文（renderer 用 PdMarkdownRenderer 渲染）。 */
  content: string;
  stages: LearningStage[];
  materials: LearningMaterialRef[];
}

/** 闪卡 JSON 单条 entry（panda CLI 输出 schema）。 */
export interface FlashcardEntry {
  id: number;
  q: string;
  a: string;
  stability?: number;
  difficulty?: number;
  /** ISO 日期 / null。 */
  lastReview?: string | null;
  /** ISO 日期 / null。 */
  nextReview?: string | null;
}

/** 复习日志条目（来自 .review-log.json）。 */
export interface ReviewLogEntry {
  at: string;
  cardId?: number;
  grade?: 0 | 1 | 2 | 3;
  topic?: string;
  [key: string]: unknown;
}

/** 闪卡集（含完整 cards + 项目级 reviewLog）。 */
export interface LearningFlashcardSet {
  /** `<projectSlug>:<topic>` 唯一 id。 */
  id: string;
  projectSlug: string;
  projectCwd: string;
  /** JSON.topic 字段（缺失时回退文件名）。 */
  topic: string;
  /** JSON.source（原始资料路径）。 */
  source: string;
  /** ISO 时间戳。 */
  created: string;
  updatedAt: string;
  totalCount: number;
  /** 今日（含之前）到期数。 */
  dueCount: number;
  /** 已复习过的卡片数（lastReview 非空）。 */
  learningCount: number;
  cards: FlashcardEntry[];
  /** 项目级复习日志（按 topic 过滤后）。 */
  reviewLog: ReviewLogEntry[];
}

// ─── Global augmentation for window.pandaAPI ────────────────────────────────

declare global {
  interface Window {
    pandaAPI?: PandaChatAPI;
  }
}
