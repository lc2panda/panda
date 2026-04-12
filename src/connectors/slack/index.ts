// Input: ConnectorConfig（token 或环境变量 SLACK_TOKEN）
// Output: Slack 消息/未读数据，统一为 IMConnector 接口
// Pos: connectors/slack/ Slack 平台 Connector，REST API 直连（不走 MCP）

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
  UnreadSummary,
  PandaNotification,
  ConnectorFactory,
} from '../types.js'

const SLACK_API = 'https://slack.com/api'

class SlackConnector implements IMConnector {
  readonly platform: ConnectorPlatform = 'slack'
  readonly interfaceVersion = '1.0.0'
  readonly capabilities = new Set<ConnectorCapability>([
    'messages.read', 'messages.send', 'unread.summary',
  ])

  private _status: ConnectorStatus = 'disconnected'
  private token = ''
  private rateLimitPerMinute = 60
  private lastRequestTime = 0

  get status(): ConnectorStatus { return this._status }
  get mode(): ConnectorMode { return 'api' }

  async initialize(config: ConnectorConfig): Promise<void> {
    this.token = config.token || process.env.SLACK_TOKEN || ''
    this.rateLimitPerMinute = config.rateLimitPerMinute || 60

    if (!this.token) {
      this._status = 'auth-required'
      logForDebugging('[slack] 无 token，跳过初始化')
      return
    }

    try {
      // 验证 token
      const resp = await this.slackApi('auth.test')
      if (!resp.ok) {
        this._status = 'auth-required'
        logForDebugging(`[slack] auth.test 失败: ${resp.error}`)
        return
      }
      this._status = 'connected'
      logForDebugging(`[slack] 已连接, team=${resp.team}, user=${resp.user}`)
    } catch (e) {
      this._status = 'error'
      logForDebugging(`[slack] 初始化失败: ${(e as Error).message}`)
    }
  }

  async healthCheck(): Promise<boolean> {
    if (this._status !== 'connected') return false
    try {
      const resp = await this.slackApi('auth.test')
      return resp.ok === true
    } catch { return false }
  }

  async dispose(): Promise<void> {
    this._status = 'disconnected'
    this.token = ''
  }

  async getMessages(opts: MessageQuery): Promise<IMMessage[]> {
    try {
      const messages: IMMessage[] = []

      // 获取指定频道或默认 IM 频道
      const channelIds = opts.channelIds || await this.getIMChannelIds()

      for (const channelId of channelIds.slice(0, 10)) {
        try {
          const params: Record<string, string> = {
            channel: channelId,
            limit: String(Math.min(opts.limit || 20, 100)),
          }
          if (opts.since) params.oldest = String(opts.since / 1000)
          if (opts.until) params.latest = String(opts.until / 1000)

          const resp = await this.slackApi('conversations.history', params)
          if (!resp.ok) continue

          // 获取频道信息
          let channelName = channelId
          try {
            const info = await this.slackApi('conversations.info', { channel: channelId })
            channelName = info.channel?.name || info.channel?.id || channelId
          } catch { /* 静默降级 */ }

          for (const msg of (resp.messages || [])) {
            if (msg.subtype && msg.subtype !== 'thread_broadcast') continue
            const isMentioned = opts.mentionedOnly
              ? (msg.text || '').includes('<@') // 简化 @me 检测
              : false

            if (opts.mentionedOnly && !isMentioned) continue
            if (opts.keyword && !(msg.text || '').includes(opts.keyword)) continue

            messages.push({
              id: msg.ts || '',
              platform: 'slack',
              channelId,
              channelName,
              senderId: msg.user || '',
              senderName: msg.user || '',
              content: msg.text || '',
              contentType: 'text',
              timestamp: parseFloat(msg.ts || '0') * 1000,
              isRead: false,
              isMentioned,
              threadId: msg.thread_ts,
              attachments: (msg.files || []).map((f: any) => ({
                type: 'file' as const,
                name: f.name || '',
                url: f.url_private || '',
                size: f.size || 0,
                mimeType: f.mimetype || '',
              })),
              raw: msg,
            })
          }
        } catch { /* 单频道失败不影响其他 */ }
      }

      return messages.slice(0, opts.limit || 100)
    } catch (e) {
      logForDebugging(`[slack] getMessages 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getUnreadSummary(): Promise<UnreadSummary> {
    try {
      const resp = await this.slackApi('conversations.list', {
        types: 'im,mpim',
        limit: '100',
      })
      if (!resp.ok) return emptyUnreadSummary()

      let totalUnread = 0
      let mentionCount = 0
      const channels: UnreadSummary['channels'] = []

      for (const ch of (resp.channels || [])) {
        const unread = ch.unread_count_display || ch.unread_count || 0
        if (unread === 0) continue
        totalUnread += unread
        if (ch.mention_count) mentionCount += ch.mention_count

        channels.push({
          id: ch.id || '',
          name: ch.name || ch.id || '',
          unreadCount: unread,
          hasMention: (ch.mention_count || 0) > 0,
          lastMessageTime: 0,
        })
      }

      return {
        platform: 'slack',
        totalUnread,
        mentionCount,
        urgentCount: 0,
        channels,
        fetchedAt: Date.now(),
      }
    } catch (e) {
      logForDebugging(`[slack] getUnreadSummary 失败: ${(e as Error).message}`)
      return emptyUnreadSummary()
    }
  }

  async sendMessage(target: string, content: string, opts?: {
    threadId?: string
    contentType?: 'text' | 'rich_text' | 'card'
  }): Promise<{ messageId: string }> {
    try {
      const body: Record<string, string> = {
        channel: target,
        text: content,
      }
      if (opts?.threadId) body.thread_ts = opts.threadId

      const resp = await this.slackApi('chat.postMessage', body, 'POST')
      return { messageId: resp.ts || '' }
    } catch (e) {
      logForDebugging(`[slack] sendMessage 失败: ${(e as Error).message}`)
      return { messageId: '' }
    }
  }

  async sendNotification(notification: PandaNotification): Promise<void> {
    // 无配置的通知目标 channel_id，跳过发送
    logForDebugging('[slack] sendNotification: 无配置的通知目标 channel_id，跳过发送（不应硬编码 #general）')
  }

  // ─── 内部方法 ───

  private async slackApi(method: string, params?: Record<string, string>, httpMethod: string = 'GET'): Promise<any> {
    // 简单限流
    const now = Date.now()
    const minInterval = 60000 / this.rateLimitPerMinute
    if (now - this.lastRequestTime < minInterval) {
      await new Promise(r => setTimeout(r, minInterval - (now - this.lastRequestTime)))
    }
    this.lastRequestTime = Date.now()

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
    }

    let url = `${SLACK_API}/${method}`
    let body: string | undefined

    if (httpMethod === 'POST') {
      headers['Content-Type'] = 'application/json; charset=utf-8'
      body = JSON.stringify(params || {})
    } else {
      if (params) {
        const qs = new URLSearchParams(params).toString()
        url += `?${qs}`
      }
    }

    const resp = await fetch(url, { method: httpMethod, headers, body })

    if (resp.status === 429) {
      this._status = 'rate-limited'
      const retryAfter = parseInt(resp.headers.get('Retry-After') || '30', 10)
      logForDebugging(`[slack] 被限流，${retryAfter}s 后恢复`)
      setTimeout(() => { this._status = 'connected' }, retryAfter * 1000)
      throw new Error('Slack rate limited')
    }

    return resp.json()
  }

  private async getIMChannelIds(): Promise<string[]> {
    try {
      const resp = await this.slackApi('conversations.list', {
        types: 'im,mpim,public_channel,private_channel',
        limit: '20',
      })
      return ((resp.channels || []) as any[]).map((c: any) => c.id)
    } catch { return [] }
  }
}

function emptyUnreadSummary(): UnreadSummary {
  return { platform: 'slack', totalUnread: 0, mentionCount: 0, urgentCount: 0, channels: [], fetchedAt: Date.now() }
}

// ─── 工厂 ───

export const slackConnectorFactory: ConnectorFactory = {
  platform: 'slack',
  displayName: 'Slack',
  description: 'Slack IM Connector（REST API 直连）',
  supportedModes: ['api'],
  defaultCapabilities: ['messages.read', 'messages.send', 'unread.summary'],
  create(): IMConnector {
    return new SlackConnector()
  },
}

export function createSlackConnector(): IMConnector {
  return new SlackConnector()
}
