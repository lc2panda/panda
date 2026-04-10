// Input: ConnectorConfig（tenantId + clientId + clientSecret）
// Output: Teams 消息/日历数据，统一为 IMConnector 接口
// Pos: connectors/teams/ Microsoft Teams 平台 Connector，Graph API

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
  UnreadSummary,
  PandaNotification,
  ConnectorFactory,
} from '../types.js'

const GRAPH_API = 'https://graph.microsoft.com/v1.0'
const LOGIN_URL = 'https://login.microsoftonline.com'

class TeamsConnector implements IMConnector {
  readonly platform: ConnectorPlatform = 'teams'
  readonly interfaceVersion = '1.0.0'
  readonly capabilities = new Set<ConnectorCapability>([
    'messages.read', 'messages.send', 'calendar.read', 'unread.summary',
  ])

  private _status: ConnectorStatus = 'disconnected'
  private config: ConnectorConfig | null = null
  private accessToken = ''
  private tokenExpiry = 0

  get status(): ConnectorStatus { return this._status }
  get mode(): ConnectorMode { return 'api' }

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = config
    const tenantId = (config.extra?.tenantId as string) || ''
    const clientId = config.appId || ''
    const clientSecret = config.appSecret || ''

    if (!tenantId || !clientId || !clientSecret) {
      this._status = 'auth-required'
      logForDebugging('[teams] 缺少 tenantId/clientId/clientSecret')
      return
    }

    try {
      await this.refreshToken()
      this._status = 'connected'
      logForDebugging('[teams] 已连接 (Graph API)')
    } catch (e) {
      this._status = 'error'
      logForDebugging(`[teams] 初始化失败: ${(e as Error).message}`)
    }
  }

  async healthCheck(): Promise<boolean> {
    if (this._status !== 'connected') return false
    try {
      await this.ensureToken()
      // 轻量检查
      const resp = await this.graphGet('/me')
      return resp?.id != null
    } catch { return false }
  }

  async dispose(): Promise<void> {
    this._status = 'disconnected'
    this.accessToken = ''
  }

  async getMessages(opts: MessageQuery): Promise<IMMessage[]> {
    try {
      // 获取用户的 Teams 聊天列表
      const chats = await this.graphGet('/me/chats?$top=20')
      const messages: IMMessage[] = []

      for (const chat of (chats?.value || []).slice(0, 10)) {
        try {
          let url = `/me/chats/${chat.id}/messages?$top=${Math.min(opts.limit || 20, 50)}`
          const resp = await this.graphGet(url)

          for (const msg of (resp?.value || [])) {
            const ts = new Date(msg.createdDateTime || 0).getTime()
            if (opts.since && ts < opts.since) continue
            if (opts.until && ts > opts.until) continue

            const content = msg.body?.content || ''
            if (opts.keyword && !content.includes(opts.keyword)) continue

            messages.push({
              id: msg.id || '',
              platform: 'teams',
              channelId: chat.id || '',
              channelName: chat.topic || chat.chatType || '',
              senderId: msg.from?.user?.id || '',
              senderName: msg.from?.user?.displayName || '',
              content: stripHtml(content),
              contentType: msg.body?.contentType === 'html' ? 'rich_text' : 'text',
              timestamp: ts,
              isRead: false,
              isMentioned: (msg.mentions || []).length > 0,
              raw: msg,
            })
          }
        } catch { /* 单个聊天失败不影响 */ }
      }

      return messages.slice(0, opts.limit || 100)
    } catch (e) {
      logForDebugging(`[teams] getMessages 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getCalendar(days: number): Promise<CalendarEvent[]> {
    try {
      const start = new Date().toISOString()
      const end = new Date(Date.now() + days * 86400000).toISOString()
      const url = `/me/calendarview?startDateTime=${start}&endDateTime=${end}&$top=50`
      const resp = await this.graphGet(url)

      return ((resp?.value || []) as any[]).map((evt: any) => ({
        id: evt.id || '',
        platform: 'teams' as ConnectorPlatform,
        title: evt.subject || '',
        description: stripHtml(evt.body?.content || ''),
        startTime: new Date(evt.start?.dateTime || 0).getTime(),
        endTime: new Date(evt.end?.dateTime || 0).getTime(),
        location: evt.location?.displayName || '',
        attendees: ((evt.attendees || []) as any[]).map((a: any) => a.emailAddress?.name || a.emailAddress?.address || ''),
        isAllDay: evt.isAllDay || false,
        status: mapEventStatus(evt.showAs),
        meetingLink: evt.onlineMeeting?.joinUrl || '',
        raw: evt,
      }))
    } catch (e) {
      logForDebugging(`[teams] getCalendar 失败: ${(e as Error).message}`)
      return []
    }
  }

  async sendMessage(target: string, content: string, opts?: {
    threadId?: string
    contentType?: 'text' | 'rich_text' | 'card'
  }): Promise<{ messageId: string }> {
    try {
      const body: any = {
        body: {
          contentType: opts?.contentType === 'rich_text' ? 'html' : 'text',
          content,
        },
      }

      const resp = await this.graphPost(`/me/chats/${target}/messages`, body)
      return { messageId: resp?.id || '' }
    } catch (e) {
      logForDebugging(`[teams] sendMessage 失败: ${(e as Error).message}`)
      return { messageId: '' }
    }
  }

  async getUnreadSummary(): Promise<UnreadSummary> {
    try {
      const msgs = await this.getMessages({ limit: 100 })
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
        platform: 'teams',
        totalUnread: msgs.length,
        mentionCount,
        urgentCount: 0,
        channels: [...channelMap.values()].map(ch => ({
          id: ch.id, name: ch.name, unreadCount: ch.count,
          hasMention: ch.mention, lastMessageTime: ch.lastTime,
        })),
        fetchedAt: Date.now(),
      }
    } catch {
      return emptyUnreadSummary()
    }
  }

  async sendNotification(notification: PandaNotification): Promise<void> {
    try {
      const msg = `📢 [${notification.title || 'Panda'}]\n${notification.body || ''}`
      await this.sendMessage('me', msg)
    } catch (e) {
      logForDebugging(`[teams] sendNotification failed: ${e}`)
    }
  }

  // ─── OAuth2 client_credentials ───

  private async ensureToken(): Promise<void> {
    if (Date.now() < this.tokenExpiry - 60000) return
    await this.refreshToken()
  }

  private async refreshToken(): Promise<void> {
    const tenantId = (this.config!.extra?.tenantId as string) || ''
    const clientId = this.config!.appId || ''
    const clientSecret = this.config!.appSecret || ''

    const resp = await fetch(`${LOGIN_URL}/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
      }).toString(),
    })

    const data = await resp.json() as any
    if (data.error) throw new Error(`Teams OAuth 失败: ${data.error_description || data.error}`)
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000
  }

  private async graphGet(path: string): Promise<any> {
    await this.ensureToken()
    const resp = await fetch(`${GRAPH_API}${path}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    })
    if (!resp.ok) {
      throw new Error(`Graph API ${path}: ${resp.status} ${resp.statusText}`)
    }
    return resp.json()
  }

  private async graphPost(path: string, body: any): Promise<any> {
    await this.ensureToken()
    const resp = await fetch(`${GRAPH_API}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!resp.ok) {
      throw new Error(`Graph API POST ${path}: ${resp.status} ${resp.statusText}`)
    }
    return resp.json()
  }
}

// ─── 辅助 ───

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
}

function mapEventStatus(showAs: string): 'confirmed' | 'tentative' | 'cancelled' {
  if (showAs === 'tentative') return 'tentative'
  if (showAs === 'free') return 'cancelled'
  return 'confirmed'
}

function emptyUnreadSummary(): UnreadSummary {
  return { platform: 'teams', totalUnread: 0, mentionCount: 0, urgentCount: 0, channels: [], fetchedAt: Date.now() }
}

// ─── 工厂 ───

export const teamsConnectorFactory: ConnectorFactory = {
  platform: 'teams',
  displayName: 'Microsoft Teams',
  description: 'Microsoft Teams Connector（Graph API）',
  supportedModes: ['api'],
  defaultCapabilities: ['messages.read', 'messages.send', 'calendar.read', 'unread.summary'],
  create(): IMConnector {
    return new TeamsConnector()
  },
}

export function createTeamsConnector(): IMConnector {
  return new TeamsConnector()
}
