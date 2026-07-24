// Input: ConnectorConfig（appId/appSecret 或 MCP 配置）
// Output: 飞书消息/日历/文档/通讯录/任务/审批数据，统一为 IMConnector 接口
// Pos: connectors/feishu/ 飞书平台 Connector，MCP 优先 + REST API fallback

import { MCPBridgeConnector } from '../mcpBridge.js'
import { logForDebugging } from 'src/utils/debug.js'
import type {
  ConnectorConfig,
  ConnectorCapability,
  ConnectorPlatform,
  ConnectorMode,
  ConnectorStatus,
  IMConnector,
  IMMessage,
  MessageQuery,
  CalendarEvent,
  IMDocument,
  IMContact,
  IMTask,
  IMApproval,
  UnreadSummary,
  PandaNotification,
  ConnectorFactory,
} from '../types.js'

// ─── MCP 桥接模式 ───

class FeishuMCPConnector extends MCPBridgeConnector {
  readonly platform: ConnectorPlatform = 'feishu'
  readonly interfaceVersion = '1.0.0'

  protected getMCPCommand() {
    return { command: 'npx', args: ['@anthropic-ai/mcp', 'feishu-mcp'] }
  }

  protected toolMapping() {
    return {
      feishu_get_messages: {
        capability: 'messages.read' as ConnectorCapability,
        transform: (r: any) => r,
      },
      feishu_send_message: {
        capability: 'messages.send' as ConnectorCapability,
        transform: (r: any) => r,
      },
      feishu_get_calendar: {
        capability: 'calendar.read' as ConnectorCapability,
        transform: (r: any) => r,
      },
      feishu_search_docs: {
        capability: 'documents.read' as ConnectorCapability,
        transform: (r: any) => r,
      },
      feishu_get_contacts: {
        capability: 'contacts.read' as ConnectorCapability,
        transform: (r: any) => r,
      },
      feishu_get_tasks: {
        capability: 'tasks.read' as ConnectorCapability,
        transform: (r: any) => r,
      },
      feishu_get_approvals: {
        capability: 'approvals.read' as ConnectorCapability,
        transform: (r: any) => r,
      },
    }
  }

  async getMessages(opts: MessageQuery): Promise<IMMessage[]> {
    try {
      const raw = await this.callTool('feishu_get_messages', {
        since: opts.since,
        until: opts.until,
        channel_ids: opts.channelIds,
        mentioned_only: opts.mentionedOnly,
        unread_only: opts.unreadOnly,
        limit: opts.limit || 100,
        keyword: opts.keyword,
      })
      return normalizeMessages(raw, 'feishu')
    } catch (e) {
      logForDebugging(`[feishu] getMessages 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getCalendar(days: number): Promise<CalendarEvent[]> {
    try {
      const raw = await this.callTool('feishu_get_calendar', { days })
      return normalizeCalendar(raw, 'feishu')
    } catch (e) {
      logForDebugging(`[feishu] getCalendar 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getDocuments(query: string): Promise<IMDocument[]> {
    try {
      const raw = await this.callTool('feishu_search_docs', { query })
      return normalizeDocuments(raw, 'feishu')
    } catch (e) {
      logForDebugging(`[feishu] getDocuments 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getContacts(): Promise<IMContact[]> {
    try {
      const raw = await this.callTool('feishu_get_contacts', {})
      return normalizeContacts(raw, 'feishu')
    } catch (e) {
      logForDebugging(`[feishu] getContacts 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getTasks(): Promise<IMTask[]> {
    try {
      const raw = await this.callTool('feishu_get_tasks', {})
      return normalizeTasks(raw, 'feishu')
    } catch (e) {
      logForDebugging(`[feishu] getTasks 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getApprovals(): Promise<IMApproval[]> {
    try {
      const raw = await this.callTool('feishu_get_approvals', {})
      return normalizeApprovals(raw, 'feishu')
    } catch (e) {
      logForDebugging(`[feishu] getApprovals 失败: ${(e as Error).message}`)
      return []
    }
  }

  async sendMessage(target: string, content: string, opts?: {
    threadId?: string
    contentType?: 'text' | 'rich_text' | 'card'
  }): Promise<{ messageId: string }> {
    try {
      const result = await this.callTool('feishu_send_message', {
        target,
        content,
        thread_id: opts?.threadId,
        content_type: opts?.contentType || 'text',
      })
      return { messageId: result?.message_id || '' }
    } catch (e) {
      logForDebugging(`[feishu] sendMessage 失败: ${(e as Error).message}`)
      return { messageId: '' }
    }
  }

  async getUnreadSummary(): Promise<UnreadSummary> {
    try {
      const msgs = await this.getMessages({ unreadOnly: true, limit: 500 })
      return buildUnreadSummary(msgs, 'feishu')
    } catch (e) {
      logForDebugging(`[feishu:MCP] getUnreadSummary 失败: ${(e as Error).message}`)
      return emptyUnreadSummary('feishu')
    }
  }

  /**
   * 主动通知：经 MCP feishu_send_message 投递文本，语义对齐 API 版。
   * 默认工厂走 MCP 时 sense 依赖本方法；缺失会导致静默 skip（H-004）。
   */
  async sendNotification(notification: PandaNotification): Promise<void> {
    try {
      const chatId = (this.config?.extra?.chatId as string) || ''
      if (!chatId) {
        logForDebugging('[feishu] sendNotification 跳过: 无配置的通知目标 chat_id')
        return
      }

      const title = notification.title || 'Panda 通知'
      const body = notification.body || ''
      const content = `${title}\n\n${body}`

      // 直接 callTool，避免 sendMessage 吞错后无法观测失败
      await this.callTool('feishu_send_message', {
        target: chatId,
        content,
        content_type: 'text',
      })
    } catch (e) {
      logForDebugging(`[feishu] sendNotification 异常: ${(e as Error).message}`)
    }
  }
}

// ─── REST API fallback 模式 ───

class FeishuAPIConnector implements IMConnector {
  readonly platform: ConnectorPlatform = 'feishu'
  readonly interfaceVersion = '1.0.0'
  readonly capabilities = new Set<ConnectorCapability>([
    'messages.read', 'messages.send', 'calendar.read',
    'documents.read', 'contacts.read', 'tasks.read',
    'approvals.read', 'unread.summary',
  ])

  private _status: ConnectorStatus = 'disconnected'
  private config: ConnectorConfig | null = null
  private accessToken = ''
  private tokenExpiry = 0

  get status(): ConnectorStatus { return this._status }
  get mode(): ConnectorMode { return 'api' }

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = config
    if (!config.appId || !config.appSecret) {
      this._status = 'auth-required'
      return
    }
    try {
      await this.refreshToken()
      this._status = 'connected'
    } catch (e) {
      this._status = 'error'
      logForDebugging(`[feishu-api] 初始化失败: ${(e as Error).message}`)
    }
  }

  async healthCheck(): Promise<boolean> {
    if (this._status !== 'connected') return false
    try {
      await this.ensureToken()
      return true
    } catch { return false }
  }

  async dispose(): Promise<void> {
    this._status = 'disconnected'
    this.accessToken = ''
  }

  private async ensureToken(): Promise<void> {
    if (Date.now() < this.tokenExpiry - 60000) return
    await this.refreshToken()
  }

  private async refreshToken(): Promise<void> {
    const resp = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        app_id: this.config!.appId,
        app_secret: this.config!.appSecret,
      }),
    })
    const data = await resp.json() as any
    if (data.code !== 0) throw new Error(`飞书 token 获取失败: ${data.msg}`)
    this.accessToken = data.tenant_access_token
    this.tokenExpiry = Date.now() + (data.expire || 7200) * 1000
  }

  private async apiGet(path: string, params?: Record<string, string>): Promise<any> {
    await this.ensureToken()
    const url = new URL(`https://open.feishu.cn/open-apis${path}`)
    if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    })
    return resp.json()
  }

  private async apiPost(path: string, body: any): Promise<any> {
    await this.ensureToken()
    const resp = await fetch(`https://open.feishu.cn/open-apis${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    })
    return resp.json()
  }

  async getMessages(opts: MessageQuery): Promise<IMMessage[]> {
    try {
      // 飞书 REST: 需要先获取会话列表再获取消息
      const chats = await this.apiGet('/im/v1/chats', { page_size: '50' })
      const messages: IMMessage[] = []
      for (const chat of (chats?.data?.items || []).slice(0, 10)) {
        try {
          const history = await this.apiGet(`/im/v1/messages`, {
            container_id_type: 'chat',
            container_id: chat.chat_id,
            page_size: String(opts.limit || 20),
          })
          for (const msg of (history?.data?.items || [])) {
            const ts = parseInt(msg.create_time, 10) || Date.now()
            if (opts.since && ts < opts.since) continue
            if (opts.until && ts > opts.until) continue
            messages.push({
              id: msg.message_id || '',
              platform: 'feishu',
              channelId: chat.chat_id || '',
              channelName: chat.name || '',
              senderId: msg.sender?.id || '',
              senderName: msg.sender?.id || '',
              content: extractTextContent(msg),
              contentType: 'text',
              timestamp: ts,
              isRead: false,
              isMentioned: false,
              raw: msg,
            })
          }
        } catch { /* 单个会话失败不影响其他 */ }
      }
      return messages.slice(0, opts.limit || 100)
    } catch (e) {
      logForDebugging(`[feishu-api] getMessages 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getCalendar(days: number): Promise<CalendarEvent[]> {
    try {
      const now = Math.floor(Date.now() / 1000)
      const end = now + days * 86400
      const data = await this.apiGet('/calendar/v4/calendars/primary/events', {
        start_time: String(now),
        end_time: String(end),
      })
      return ((data?.data?.items || []) as any[]).map((evt: any) => ({
        id: evt.event_id || '',
        platform: 'feishu' as ConnectorPlatform,
        title: evt.summary || '',
        description: evt.description || '',
        startTime: (evt.start_time?.timestamp || 0) * 1000,
        endTime: (evt.end_time?.timestamp || 0) * 1000,
        location: evt.location?.name || '',
        attendees: ((evt.attendees || []) as any[]).map((a: any) => a.display_name || ''),
        isAllDay: evt.start_time?.date != null,
        status: 'confirmed' as const,
        meetingLink: evt.vchat?.meeting_url || '',
        raw: evt,
      }))
    } catch (e) {
      logForDebugging(`[feishu-api] getCalendar 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getDocuments(query: string): Promise<IMDocument[]> {
    try {
      const data = await this.apiPost('/suite/docs-api/search/object', {
        search_key: query,
        count: 20,
        offset: 0,
      })
      return ((data?.data?.docs_entities || []) as any[]).map((doc: any) => ({
        id: doc.docs_token || '',
        platform: 'feishu' as ConnectorPlatform,
        title: doc.title || '',
        url: doc.url || '',
        lastModified: (doc.edit_time || 0) * 1000,
        lastModifiedBy: doc.edit_name || '',
        type: mapDocType(doc.docs_type),
        snippet: doc.preview || '',
        raw: doc,
      }))
    } catch (e) {
      logForDebugging(`[feishu-api] getDocuments 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getContacts(): Promise<IMContact[]> {
    try {
      const data = await this.apiGet('/contact/v3/users', { page_size: '100' })
      return ((data?.data?.items || []) as any[]).map((u: any) => ({
        id: u.user_id || '',
        platform: 'feishu' as ConnectorPlatform,
        name: u.name || '',
        email: u.email || '',
        phone: u.mobile || '',
        avatar: u.avatar?.avatar_72 || '',
        department: '',
        title: '',
      }))
    } catch (e) {
      logForDebugging(`[feishu-api] getContacts 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getTasks(): Promise<IMTask[]> {
    try {
      const data = await this.apiGet('/task/v1/tasks', { page_size: '50' })
      return ((data?.data?.items || []) as any[]).map((t: any) => ({
        id: t.id || '',
        platform: 'feishu' as ConnectorPlatform,
        title: t.summary || '',
        description: t.description || '',
        assignee: '',
        dueDate: t.due ? parseInt(t.due.timestamp, 10) * 1000 : undefined,
        status: t.completed_at ? 'done' as const : 'open' as const,
        priority: 'medium' as const,
        url: t.url || '',
        raw: t,
      }))
    } catch (e) {
      logForDebugging(`[feishu-api] getTasks 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getApprovals(): Promise<IMApproval[]> {
    try {
      const data = await this.apiGet('/approval/v4/instances', {
        page_size: '50',
        status: 'PENDING',
      })
      return ((data?.data?.items || []) as any[]).map((a: any) => ({
        id: a.instance_id || '',
        platform: 'feishu' as ConnectorPlatform,
        title: a.approval_name || '',
        initiator: a.user_id || '',
        currentApprover: '',
        status: 'pending' as const,
        createdAt: (a.start_time || 0) * 1000,
        type: a.approval_code || '',
        url: '',
        raw: a,
      }))
    } catch (e) {
      logForDebugging(`[feishu-api] getApprovals 失败: ${(e as Error).message}`)
      return []
    }
  }

  async sendMessage(target: string, content: string, opts?: {
    threadId?: string
    contentType?: 'text' | 'rich_text' | 'card'
  }): Promise<{ messageId: string }> {
    try {
      const msgType = opts?.contentType || 'text'
      const body: any = {
        receive_id: target,
        msg_type: msgType,
        content: msgType === 'text'
          ? JSON.stringify({ text: content })
          : content,
      }
      const data = await this.apiPost('/im/v1/messages?receive_id_type=chat_id', body)
      return { messageId: data?.data?.message_id || '' }
    } catch (e) {
      logForDebugging(`[feishu-api] sendMessage 失败: ${(e as Error).message}`)
      return { messageId: '' }
    }
  }

  async getUnreadSummary(): Promise<UnreadSummary> {
    try {
      const msgs = await this.getMessages({ unreadOnly: true, limit: 500 })
      return buildUnreadSummary(msgs, 'feishu')
    } catch (e) {
      logForDebugging(`[feishu:API] getUnreadSummary 失败: ${(e as Error).message}`)
      return emptyUnreadSummary('feishu')
    }
  }

  async sendNotification(notification: PandaNotification): Promise<void> {
    try {
      const chatId = (this.config?.extra?.chatId as string) || ''
      if (!chatId) {
        logForDebugging('[feishu-api] sendNotification 跳过: 无配置的通知目标 chat_id')
        return
      }

      const title = notification.title || 'Panda 通知'
      const body = notification.body || ''
      const content = `${title}\n\n${body}`

      const payload = {
        receive_id: chatId,
        msg_type: 'text',
        content: JSON.stringify({ text: content }),
      }

      const data = await this.apiPost('/im/v1/messages?receive_id_type=chat_id', payload)
      if (data?.code !== 0) {
        logForDebugging(`[feishu-api] sendNotification 失败: ${data?.msg || '未知错误'}`)
      }
    } catch (e) {
      logForDebugging(`[feishu-api] sendNotification 异常: ${(e as Error).message}`)
    }
  }
}

// ─── 辅助函数 ───

function extractTextContent(msg: any): string {
  try {
    if (typeof msg.body?.content === 'string') {
      const parsed = JSON.parse(msg.body.content)
      return parsed?.text || msg.body.content
    }
    return msg.body?.content || ''
  } catch { return msg.body?.content || '' }
}

function mapDocType(t: string): 'doc' | 'sheet' | 'slide' | 'wiki' | 'mindmap' | 'other' {
  const m: Record<string, any> = { doc: 'doc', sheet: 'sheet', slide: 'slide', wiki: 'wiki', mindnote: 'mindmap' }
  return m[t] || 'other'
}

function normalizeMessages(raw: any, platform: ConnectorPlatform): IMMessage[] {
  if (!Array.isArray(raw)) return []
  return raw.map((m: any) => ({
    id: m.message_id || m.id || '',
    platform,
    channelId: m.chat_id || m.channel_id || '',
    channelName: m.chat_name || m.channel_name || '',
    senderId: m.sender?.id || m.sender_id || '',
    senderName: m.sender?.name || m.sender_name || '',
    content: m.content || m.text || '',
    contentType: 'text' as const,
    timestamp: parseInt(m.create_time || m.timestamp || '0', 10) || Date.now(),
    isRead: m.is_read ?? false,
    isMentioned: m.is_mentioned ?? false,
    raw: m,
  }))
}

function normalizeCalendar(raw: any, platform: ConnectorPlatform): CalendarEvent[] {
  if (!Array.isArray(raw)) return []
  return raw.map((e: any) => ({
    id: e.event_id || e.id || '',
    platform,
    title: e.summary || e.title || '',
    description: e.description || '',
    startTime: (e.start_time?.timestamp || e.start_time || 0) * 1000,
    endTime: (e.end_time?.timestamp || e.end_time || 0) * 1000,
    location: e.location?.name || e.location || '',
    attendees: (e.attendees || []).map((a: any) => a.display_name || a.name || ''),
    isAllDay: e.is_all_day ?? false,
    status: 'confirmed' as const,
    meetingLink: e.vchat?.meeting_url || '',
    raw: e,
  }))
}

function normalizeDocuments(raw: any, platform: ConnectorPlatform): IMDocument[] {
  if (!Array.isArray(raw)) return []
  return raw.map((d: any) => ({
    id: d.docs_token || d.id || '',
    platform,
    title: d.title || '',
    url: d.url || '',
    lastModified: (d.edit_time || 0) * 1000,
    lastModifiedBy: d.edit_name || '',
    type: mapDocType(d.docs_type || d.type || ''),
    snippet: d.preview || d.snippet || '',
    raw: d,
  }))
}

function normalizeContacts(raw: any, platform: ConnectorPlatform): IMContact[] {
  if (!Array.isArray(raw)) return []
  return raw.map((c: any) => ({
    id: c.user_id || c.id || '',
    platform,
    name: c.name || '',
    email: c.email || '',
    phone: c.mobile || c.phone || '',
    avatar: c.avatar?.avatar_72 || c.avatar || '',
    department: c.department || '',
    title: c.title || '',
  }))
}

function normalizeTasks(raw: any, platform: ConnectorPlatform): IMTask[] {
  if (!Array.isArray(raw)) return []
  return raw.map((t: any) => ({
    id: t.id || '',
    platform,
    title: t.summary || t.title || '',
    description: t.description || '',
    assignee: t.assignee || '',
    dueDate: t.due?.timestamp ? parseInt(t.due.timestamp, 10) * 1000 : undefined,
    status: t.completed_at ? 'done' as const : 'open' as const,
    priority: 'medium' as const,
    url: t.url || '',
    raw: t,
  }))
}

function normalizeApprovals(raw: any, platform: ConnectorPlatform): IMApproval[] {
  if (!Array.isArray(raw)) return []
  return raw.map((a: any) => ({
    id: a.instance_id || a.id || '',
    platform,
    title: a.approval_name || a.title || '',
    initiator: a.user_id || a.initiator || '',
    currentApprover: a.current_approver || '',
    status: 'pending' as const,
    createdAt: (a.start_time || 0) * 1000,
    type: a.approval_code || a.type || '',
    url: a.url || '',
    raw: a,
  }))
}

function buildUnreadSummary(msgs: IMMessage[], platform: ConnectorPlatform): UnreadSummary {
  const channelMap = new Map<string, { id: string; name: string; count: number; mention: boolean; lastTime: number }>()
  let mentionCount = 0
  for (const m of msgs) {
    if (m.isMentioned) mentionCount++
    const ch = channelMap.get(m.channelId) || { id: m.channelId, name: m.channelName, count: 0, mention: false, lastTime: 0 }
    ch.count++
    if (m.isMentioned) ch.mention = true
    if (m.timestamp > ch.lastTime) ch.lastTime = m.timestamp
    channelMap.set(m.channelId, ch)
  }
  return {
    platform,
    totalUnread: msgs.length,
    mentionCount,
    urgentCount: 0,
    channels: [...channelMap.values()].map(ch => ({
      id: ch.id, name: ch.name, unreadCount: ch.count,
      hasMention: ch.mention, lastMessageTime: ch.lastTime,
    })),
    fetchedAt: Date.now(),
  }
}

function emptyUnreadSummary(platform: ConnectorPlatform): UnreadSummary {
  return { platform, totalUnread: 0, mentionCount: 0, urgentCount: 0, channels: [], fetchedAt: Date.now() }
}

// ─── 工厂 ───

export const feishuConnectorFactory: ConnectorFactory = {
  platform: 'feishu',
  displayName: '飞书 / Feishu',
  description: '飞书 IM Connector（MCP 桥接 + REST API fallback）',
  supportedModes: ['mcp', 'api'],
  defaultCapabilities: [
    'messages.read', 'messages.send', 'calendar.read',
    'documents.read', 'contacts.read', 'tasks.read',
    'approvals.read', 'unread.summary',
  ],
  create(config?: ConnectorConfig): IMConnector {
    if (config?.mode === 'api') return new FeishuAPIConnector()
    if (config?.mode === 'mcp') return new FeishuMCPConnector()
    // 默认 MCP 模式
    return new FeishuMCPConnector()
  },
}

/**
 * 根据配置创建飞书 Connector 实例。
 * mode='mcp' → MCP 桥接；mode='api' → REST API 直连
 */
export function createFeishuConnector(config: ConnectorConfig): IMConnector {
  if (config.mode === 'api' || (!config.mcpCommand && config.appId)) {
    return new FeishuAPIConnector()
  }
  return new FeishuMCPConnector()
}
