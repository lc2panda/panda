// Input: 各 Connector 实现的类型约束
// Output: 统一的 IM 数据类型 + IMConnector 主接口
// Pos: connectors/ 类型基础，所有 Connector 必须实现此接口

// ─── 平台枚举 ───

export type ConnectorPlatform =
  | 'feishu'
  | 'dingtalk'
  | 'slack'
  | 'teams'
  | 'telegram'
  | 'discord'
  | 'wechat'    // 个人微信（本地 DB）
  | 'wecom'     // 企业微信（API）
  | string       // 第三方扩展平台

// ─── 能力枚举 ───

export type ConnectorCapability =
  | 'messages.read'
  | 'messages.send'
  | 'calendar.read'
  | 'calendar.write'
  | 'documents.read'
  | 'documents.write'
  | 'contacts.read'
  | 'tasks.read'
  | 'tasks.write'
  | 'approvals.read'
  | 'approvals.write'
  | 'unread.summary'
  | 'notifications.send'

// ─── 连接状态 ───

export type ConnectorStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'rate-limited'
  | 'auth-required'

// ─── 连接模式 ───

export type ConnectorMode = 'mcp' | 'api' | 'cli' | 'local-db'

// ─── 通用数据类型 ───

export interface IMAttachment {
  type: 'image' | 'file' | 'video' | 'audio' | 'link'
  name: string
  url?: string
  size?: number
  mimeType?: string
}

export interface IMMessage {
  id: string
  platform: ConnectorPlatform
  channelId: string
  channelName: string
  senderId: string
  senderName: string
  content: string
  contentType: 'text' | 'rich_text' | 'image' | 'file' | 'card' | 'system'
  timestamp: number         // Unix ms
  isRead: boolean
  isMentioned: boolean      // @我
  threadId?: string         // 回复线程
  replyTo?: string          // 回复的消息 ID
  attachments?: IMAttachment[]
  raw?: unknown             // 平台原始数据（调试用）
}

export interface CalendarEvent {
  id: string
  platform: ConnectorPlatform
  title: string
  description?: string
  startTime: number         // Unix ms
  endTime: number           // Unix ms
  location?: string
  attendees: string[]
  isAllDay: boolean
  status: 'confirmed' | 'tentative' | 'cancelled'
  meetingLink?: string      // Zoom/飞书会议链接
  raw?: unknown
}

export interface IMDocument {
  id: string
  platform: ConnectorPlatform
  title: string
  url: string
  lastModified: number      // Unix ms
  lastModifiedBy?: string
  type: 'doc' | 'sheet' | 'slide' | 'wiki' | 'mindmap' | 'other'
  snippet?: string          // 内容摘要
  raw?: unknown
}

export interface IMContact {
  id: string
  platform: ConnectorPlatform
  name: string
  email?: string
  phone?: string
  avatar?: string
  department?: string
  title?: string
  lastInteraction?: number  // Unix ms
}

export interface IMTask {
  id: string
  platform: ConnectorPlatform
  title: string
  description?: string
  assignee?: string
  dueDate?: number          // Unix ms
  status: 'open' | 'in_progress' | 'done' | 'cancelled'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  source?: string           // 来源（消息/文档/审批）
  url?: string
  raw?: unknown
}

export interface IMApproval {
  id: string
  platform: ConnectorPlatform
  title: string
  initiator: string
  currentApprover?: string
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  createdAt: number         // Unix ms
  type: string              // 审批类型（请假/报销/采购...）
  url?: string
  raw?: unknown
}

export interface UnreadSummary {
  platform: ConnectorPlatform
  totalUnread: number
  mentionCount: number      // @我
  urgentCount: number       // 加急消息
  channels: Array<{
    id: string
    name: string
    unreadCount: number
    hasMention: boolean
    lastMessageTime: number
  }>
  fetchedAt: number         // Unix ms
}

// ─── 查询参数 ───

export interface MessageQuery {
  since?: number            // Unix ms，默认 24h
  until?: number            // Unix ms，默认 now
  channelIds?: string[]     // 限定频道
  senderIds?: string[]      // 限定发送者
  mentionedOnly?: boolean   // 仅 @我
  unreadOnly?: boolean      // 仅未读
  limit?: number            // 最大条数，默认 100
  keyword?: string          // 关键词搜索
}

// ─── Connector 配置 ───

export interface ConnectorConfig {
  enabled: boolean
  mode: ConnectorMode
  permissions: ConnectorCapability[]

  // MCP 模式配置
  mcpCommand?: string       // MCP Server 启动命令
  mcpArgs?: string[]        // MCP Server 参数
  mcpEnv?: Record<string, string>  // MCP Server 环境变量

  // API 模式配置
  apiBaseUrl?: string
  appId?: string
  appSecret?: string        // 引用 Keychain key，非明文

  // 企微特有
  corpId?: string
  agentId?: string

  // Telegram 特有
  botToken?: string         // 引用 Keychain key

  // Slack 特有
  token?: string            // 引用 Keychain key

  // 通用
  rateLimitPerMinute?: number
  cacheTtlSeconds?: number

  // 扩展字段
  extra?: Record<string, unknown>
}

// ─── Panda 通知类型（与 sense.ts 对齐） ───

export interface PandaNotification {
  type: 'info' | 'warning' | 'action'
  title: string
  body: string
  channel: 'statusLine' | 'inline' | 'system' | 'all'
}

// ─── IMConnector 主接口 ───

export interface IMConnector {
  /** 平台标识 */
  readonly platform: ConnectorPlatform

  /** 当前 Connector 支持的能力集 */
  readonly capabilities: ReadonlySet<ConnectorCapability>

  /** 连接状态 */
  readonly status: ConnectorStatus

  /** 当前使用的连接模式 */
  readonly mode: ConnectorMode

  /** 接口版本号（语义化版本，用于兼容性检查） */
  readonly interfaceVersion: string  // e.g. '1.0.0'

  // ─── 生命周期 ───

  /**
   * 初始化连接。
   * - MCP 模式：启动 MCP Server 子进程并建立连接
   * - API 模式：验证 Token 有效性
   * - CLI 模式：检查 CLI 工具是否可用
   */
  initialize(config: ConnectorConfig): Promise<void>

  /**
   * 健康检查。返回 false 时 Registry 会尝试重连。
   */
  healthCheck(): Promise<boolean>

  /**
   * 销毁连接。清理 MCP 子进程、关闭 WebSocket 等。
   */
  dispose(): Promise<void>

  // ─── 数据读取（每个方法可选实现，不支持的返回空数组/null） ───

  getMessages?(opts: MessageQuery): Promise<IMMessage[]>
  getCalendar?(days: number): Promise<CalendarEvent[]>
  getDocuments?(query: string): Promise<IMDocument[]>
  getContacts?(): Promise<IMContact[]>
  getTasks?(): Promise<IMTask[]>
  getApprovals?(): Promise<IMApproval[]>
  getUnreadSummary?(): Promise<UnreadSummary>

  // ─── 数据写入（主动推送） ───

  sendMessage?(target: string, content: string, opts?: {
    threadId?: string
    contentType?: 'text' | 'rich_text' | 'card'
  }): Promise<{ messageId: string }>

  sendNotification?(notification: PandaNotification): Promise<void>
}

// ─── Connector 工厂类型（用于插件注册） ───

export interface ConnectorFactory {
  platform: ConnectorPlatform
  displayName: string
  description: string
  supportedModes: ConnectorMode[]
  defaultCapabilities: ConnectorCapability[]
  create(config?: ConnectorConfig): IMConnector
}

// ─── 聚合数据类型 ───

export interface AggregatedTimeline {
  messages: IMMessage[]
  totalCount: number
  platforms: ConnectorPlatform[]
  timeRange: { start: number; end: number }
  fetchedAt: number
}

export interface AggregatedUnread {
  total: number
  mentionTotal: number
  urgentTotal: number
  byPlatform: Map<ConnectorPlatform, UnreadSummary>
  fetchedAt: number
}

export interface AggregatedCalendar {
  events: CalendarEvent[]
  conflicts: Array<{ a: CalendarEvent; b: CalendarEvent }>
  fetchedAt: number
}
