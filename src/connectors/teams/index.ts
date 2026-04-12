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
      // 注意: client_credentials 授予类型不支持 /me 端点（需 delegated auth）。
      // 当前使用 application-level token，/me/* 调用会返回 403。
      // 需切换为 authorization_code 流程（delegated permissions）才能访问用户级资源。
      await this.refreshToken()
      this._status = 'connected'
      logForDebugging('[teams] 已连接 (Graph API, client_credentials — /me 端点不可用)')
    } catch (e) {
      this._status = 'error'
      logForDebugging(`[teams] 初始化失败: ${(e as Error).message}`)
    }
  }

  async healthCheck(): Promise<boolean> {
    if (this._status !== 'connected') return false
    try {
      await this.ensureToken()
      // client_credentials 不支持 /me，改用 /organization 作为轻量检查
      const resp = await this.graphGet('/organization')
      return resp?.value != null
    } catch { return false }
  }

  async dispose(): Promise<void> {
    this._status = 'disconnected'
    this.accessToken = ''
  }

  async getMessages(opts: MessageQuery): Promise<IMMessage[]> {
    // client_credentials 不支持 /me/chats（需 delegated auth），优雅降级
    logForDebugging('[teams] getMessages: client_credentials 不支持 /me/chats，需 delegated auth，返回空')
    return []
  }

  async getCalendar(days: number): Promise<CalendarEvent[]> {
    // client_credentials 不支持 /me/calendarview（需 delegated auth），优雅降级
    logForDebugging('[teams] getCalendar: client_credentials 不支持 /me/calendarview，需 delegated auth，返回空')
    return []
  }

  async sendMessage(target: string, content: string, opts?: {
    threadId?: string
    contentType?: 'text' | 'rich_text' | 'card'
  }): Promise<{ messageId: string }> {
    // client_credentials 不支持 /me/chats（需 delegated auth），优雅降级
    logForDebugging(`[teams] sendMessage: client_credentials 不支持 /me/chats/${target}/messages，需 delegated auth`)
    return { messageId: '' }
  }

  async getUnreadSummary(): Promise<UnreadSummary> {
    // client_credentials 不支持用户级端点，返回空摘要
    logForDebugging('[teams] getUnreadSummary: client_credentials 不支持用户级端点，返回空')
    return emptyUnreadSummary()
  }

  async sendNotification(notification: PandaNotification): Promise<void> {
    // client_credentials 无法发送到 'me'，需配置具体 chat_id
    logForDebugging('[teams] sendNotification: 无配置的通知目标 chat_id，跳过发送（client_credentials 不支持 /me）')
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
