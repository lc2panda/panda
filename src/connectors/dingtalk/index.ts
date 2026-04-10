// Input: ConnectorConfig（MCP 配置或 appKey/appSecret）
// Output: 钉钉消息/日历/通讯录/任务数据，统一为 IMConnector 接口
// Pos: connectors/dingtalk/ 钉钉平台 Connector，MCP 桥接模式

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
  IMContact,
  IMTask,
  UnreadSummary,
  PandaNotification,
  ConnectorFactory,
} from '../types.js'

// ─── MCP 桥接模式 ───

class DingtalkMCPConnector extends MCPBridgeConnector {
  readonly platform: ConnectorPlatform = 'dingtalk'
  readonly interfaceVersion = '1.0.0'

  protected getMCPCommand() {
    return { command: 'npx', args: ['dingtalk-mcp'] }
  }

  /**
   * 初始化时注入 ACTIVE_PROFILES 环境变量，启用日历/部门/任务/通知模块。
   */
  async initialize(config: ConnectorConfig): Promise<void> {
    const merged = { ...config }
    merged.mcpEnv = {
      ...(config.mcpEnv || {}),
      ACTIVE_PROFILES: config.mcpEnv?.ACTIVE_PROFILES || 'calendar,department,tasks,notice',
    }
    return super.initialize(merged)
  }

  protected toolMapping() {
    return {
      dingtalk_get_messages: {
        capability: 'messages.read' as ConnectorCapability,
        transform: (r: any) => r,
      },
      dingtalk_send_message: {
        capability: 'messages.send' as ConnectorCapability,
        transform: (r: any) => r,
      },
      dingtalk_get_calendar: {
        capability: 'calendar.read' as ConnectorCapability,
        transform: (r: any) => r,
      },
      dingtalk_get_contacts: {
        capability: 'contacts.read' as ConnectorCapability,
        transform: (r: any) => r,
      },
      dingtalk_get_tasks: {
        capability: 'tasks.read' as ConnectorCapability,
        transform: (r: any) => r,
      },
    }
  }

  async getMessages(opts: MessageQuery): Promise<IMMessage[]> {
    try {
      const raw = await this.callTool('dingtalk_get_messages', {
        since: opts.since,
        until: opts.until,
        channel_ids: opts.channelIds,
        mentioned_only: opts.mentionedOnly,
        unread_only: opts.unreadOnly,
        limit: opts.limit || 100,
      })
      return normalizeMessages(raw)
    } catch (e) {
      logForDebugging(`[dingtalk] getMessages 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getCalendar(days: number): Promise<CalendarEvent[]> {
    try {
      const raw = await this.callTool('dingtalk_get_calendar', { days })
      return normalizeCalendar(raw)
    } catch (e) {
      logForDebugging(`[dingtalk] getCalendar 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getContacts(): Promise<IMContact[]> {
    try {
      const raw = await this.callTool('dingtalk_get_contacts', {})
      return normalizeContacts(raw)
    } catch (e) {
      logForDebugging(`[dingtalk] getContacts 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getTasks(): Promise<IMTask[]> {
    try {
      const raw = await this.callTool('dingtalk_get_tasks', {})
      return normalizeTasks(raw)
    } catch (e) {
      logForDebugging(`[dingtalk] getTasks 失败: ${(e as Error).message}`)
      return []
    }
  }

  async sendMessage(target: string, content: string, opts?: {
    threadId?: string
    contentType?: 'text' | 'rich_text' | 'card'
  }): Promise<{ messageId: string }> {
    try {
      const result = await this.callTool('dingtalk_send_message', {
        target,
        content,
        content_type: opts?.contentType || 'text',
      })
      return { messageId: result?.message_id || '' }
    } catch (e) {
      logForDebugging(`[dingtalk] sendMessage 失败: ${(e as Error).message}`)
      return { messageId: '' }
    }
  }

  async getUnreadSummary(): Promise<UnreadSummary> {
    try {
      const msgs = await this.getMessages({ unreadOnly: true, limit: 500 })
      return buildUnreadSummary(msgs)
    } catch {
      return emptyUnreadSummary()
    }
  }

  async sendNotification(notification: PandaNotification): Promise<void> {
    try {
      const msg = `📢 [${notification.title || 'Panda'}]\n${notification.body || ''}`
      await this.sendMessage('default', msg)
    } catch (e) {
      logForDebugging(`[dingtalk] sendNotification failed: ${e}`)
    }
  }
}

// ─── REST API fallback 模式 ───

class DingtalkAPIConnector implements IMConnector {
  readonly platform: ConnectorPlatform = 'dingtalk'
  readonly interfaceVersion = '1.0.0'
  readonly capabilities = new Set<ConnectorCapability>([
    'messages.read', 'messages.send', 'calendar.read',
    'contacts.read', 'tasks.read', 'unread.summary',
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
      logForDebugging(`[dingtalk-api] 初始化失败: ${(e as Error).message}`)
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
    const resp = await fetch('https://oapi.dingtalk.com/gettoken', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    // 钉钉使用 URL params: ?appkey=xxx&appsecret=xxx
    const url = `https://oapi.dingtalk.com/gettoken?appkey=${this.config!.appId}&appsecret=${this.config!.appSecret}`
    const tokenResp = await fetch(url)
    const data = await tokenResp.json() as any
    if (data.errcode !== 0) throw new Error(`钉钉 token 获取失败: ${data.errmsg}`)
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + 7200 * 1000
  }

  private async apiGet(url: string): Promise<any> {
    await this.ensureToken()
    const sep = url.includes('?') ? '&' : '?'
    const resp = await fetch(`${url}${sep}access_token=${this.accessToken}`)
    return resp.json()
  }

  async getMessages(opts: MessageQuery): Promise<IMMessage[]> {
    // 钉钉 REST API 不直接支持拉取历史消息（需 webhook/event 订阅），返回空
    logForDebugging('[dingtalk-api] getMessages: 钉钉 REST 不支持拉取历史消息，需 webhook')
    return []
  }

  async getCalendar(days: number): Promise<CalendarEvent[]> {
    try {
      const data = await this.apiGet('https://oapi.dingtalk.com/topapi/calendar/v2/list')
      return normalizeCalendar(data?.result?.items || [])
    } catch (e) {
      logForDebugging(`[dingtalk-api] getCalendar 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getContacts(): Promise<IMContact[]> {
    try {
      const data = await this.apiGet('https://oapi.dingtalk.com/topapi/v2/user/list?dept_id=1&cursor=0&size=100')
      return normalizeContacts(data?.result?.list || [])
    } catch (e) {
      logForDebugging(`[dingtalk-api] getContacts 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getTasks(): Promise<IMTask[]> {
    try {
      const data = await this.apiGet('https://oapi.dingtalk.com/topapi/workrecord/getbyuserid')
      return normalizeTasks(data?.result?.records || [])
    } catch (e) {
      logForDebugging(`[dingtalk-api] getTasks 失败: ${(e as Error).message}`)
      return []
    }
  }

  async sendMessage(target: string, content: string): Promise<{ messageId: string }> {
    try {
      await this.ensureToken()
      const resp = await fetch(`https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2?access_token=${this.accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: this.config?.agentId || '',
          userid_list: target,
          msg: { msgtype: 'text', text: { content } },
        }),
      })
      const data = await resp.json() as any
      return { messageId: data?.task_id?.toString() || '' }
    } catch (e) {
      logForDebugging(`[dingtalk-api] sendMessage 失败: ${(e as Error).message}`)
      return { messageId: '' }
    }
  }

  async getUnreadSummary(): Promise<UnreadSummary> {
    return emptyUnreadSummary()
  }

  async sendNotification(notification: PandaNotification): Promise<void> {
    try {
      const msg = `📢 [${notification.title || 'Panda'}]\n${notification.body || ''}`
      await this.sendMessage('default', msg)
    } catch (e) {
      logForDebugging(`[dingtalk-api] sendNotification failed: ${e}`)
    }
  }
}

// ─── 数据标准化 ───

function normalizeMessages(raw: any): IMMessage[] {
  if (!Array.isArray(raw)) return []
  return raw.map((m: any) => ({
    id: m.message_id || m.id || '',
    platform: 'dingtalk' as ConnectorPlatform,
    channelId: m.conversation_id || m.channel_id || '',
    channelName: m.conversation_title || m.channel_name || '',
    senderId: m.sender_id || m.sender?.staff_id || '',
    senderName: m.sender_name || m.sender?.nick || '',
    content: m.content || m.text?.content || '',
    contentType: 'text' as const,
    timestamp: parseInt(m.create_at || m.timestamp || '0', 10) || Date.now(),
    isRead: m.is_read ?? false,
    isMentioned: m.is_at_all || m.is_mentioned || false,
    raw: m,
  }))
}

function normalizeCalendar(raw: any): CalendarEvent[] {
  if (!Array.isArray(raw)) return []
  return raw.map((e: any) => ({
    id: e.id || e.event_id || '',
    platform: 'dingtalk' as ConnectorPlatform,
    title: e.summary || e.title || '',
    description: e.description || '',
    startTime: e.start?.date_time ? new Date(e.start.date_time).getTime() : 0,
    endTime: e.end?.date_time ? new Date(e.end.date_time).getTime() : 0,
    location: e.location || '',
    attendees: (e.attendees || []).map((a: any) => a.display_name || a.userid || ''),
    isAllDay: e.is_all_day ?? false,
    status: 'confirmed' as const,
    meetingLink: '',
    raw: e,
  }))
}

function normalizeContacts(raw: any): IMContact[] {
  if (!Array.isArray(raw)) return []
  return raw.map((c: any) => ({
    id: c.userid || c.id || '',
    platform: 'dingtalk' as ConnectorPlatform,
    name: c.name || '',
    email: c.email || '',
    phone: c.mobile || '',
    avatar: c.avatar || '',
    department: (c.dept_id_list || []).join(','),
    title: c.title || '',
  }))
}

function normalizeTasks(raw: any): IMTask[] {
  if (!Array.isArray(raw)) return []
  return raw.map((t: any) => ({
    id: t.record_id || t.id || '',
    platform: 'dingtalk' as ConnectorPlatform,
    title: t.title || '',
    description: '',
    assignee: t.userid || '',
    dueDate: undefined,
    status: t.status === 1 ? 'done' as const : 'open' as const,
    priority: 'medium' as const,
    url: t.url || '',
    raw: t,
  }))
}

function buildUnreadSummary(msgs: IMMessage[]): UnreadSummary {
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
    platform: 'dingtalk',
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

function emptyUnreadSummary(): UnreadSummary {
  return { platform: 'dingtalk', totalUnread: 0, mentionCount: 0, urgentCount: 0, channels: [], fetchedAt: Date.now() }
}

// ─── 工厂 ───

export const dingtalkConnectorFactory: ConnectorFactory = {
  platform: 'dingtalk',
  displayName: '钉钉 / DingTalk',
  description: '钉钉 IM Connector（MCP 桥接 + REST API fallback）',
  supportedModes: ['mcp', 'api'],
  defaultCapabilities: [
    'messages.read', 'messages.send', 'calendar.read',
    'contacts.read', 'tasks.read', 'unread.summary',
  ],
  create(config?: ConnectorConfig): IMConnector {
    if (config?.mode === 'api') return new DingtalkAPIConnector()
    if (config?.mode === 'mcp') return new DingtalkMCPConnector()
    // 默认 MCP 模式
    return new DingtalkMCPConnector()
  },
}

export function createDingtalkConnector(config: ConnectorConfig): IMConnector {
  if (config.mode === 'api' || (!config.mcpCommand && config.appId)) {
    return new DingtalkAPIConnector()
  }
  return new DingtalkMCPConnector()
}
