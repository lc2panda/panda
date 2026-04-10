// Input: ConnectorConfig（botToken）
// Output: Telegram 消息数据，统一为 IMConnector 接口
// Pos: connectors/telegram/ Telegram 平台 Connector，Bot API 直连

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

const TG_API = 'https://api.telegram.org'

class TelegramConnector implements IMConnector {
  readonly platform: ConnectorPlatform = 'telegram'
  readonly interfaceVersion = '1.0.0'
  readonly capabilities = new Set<ConnectorCapability>([
    'messages.read', 'messages.send', 'unread.summary',
  ])

  private _status: ConnectorStatus = 'disconnected'
  private botToken = ''
  private lastUpdateId = 0
  private config: ConnectorConfig | null = null

  get status(): ConnectorStatus { return this._status }
  get mode(): ConnectorMode { return 'api' }

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = config
    this.botToken = config.botToken || process.env.TELEGRAM_BOT_TOKEN || ''

    if (!this.botToken) {
      this._status = 'auth-required'
      logForDebugging('[telegram] 无 botToken，跳过初始化')
      return
    }

    try {
      const resp = await this.tgApi('getMe')
      if (!resp.ok) {
        this._status = 'auth-required'
        logForDebugging(`[telegram] getMe 失败: ${resp.description}`)
        return
      }
      this._status = 'connected'
      logForDebugging(`[telegram] 已连接, bot=${resp.result?.username}`)
    } catch (e) {
      this._status = 'error'
      logForDebugging(`[telegram] 初始化失败: ${(e as Error).message}`)
    }
  }

  async healthCheck(): Promise<boolean> {
    if (this._status !== 'connected') return false
    try {
      const resp = await this.tgApi('getMe')
      return resp.ok === true
    } catch { return false }
  }

  async dispose(): Promise<void> {
    this._status = 'disconnected'
    this.botToken = ''
  }

  async getMessages(opts: MessageQuery): Promise<IMMessage[]> {
    try {
      const params: Record<string, any> = {
        limit: Math.min(opts.limit || 100, 100),
        allowed_updates: ['message'],
      }
      if (this.lastUpdateId > 0) {
        params.offset = this.lastUpdateId + 1
      }

      const resp = await this.tgApi('getUpdates', params)
      if (!resp.ok) return []

      const messages: IMMessage[] = []
      for (const update of (resp.result || [])) {
        const msg = update.message
        if (!msg) continue

        // 更新 offset
        if (update.update_id > this.lastUpdateId) {
          this.lastUpdateId = update.update_id
        }

        const ts = (msg.date || 0) * 1000
        if (opts.since && ts < opts.since) continue
        if (opts.until && ts > opts.until) continue

        const chatId = String(msg.chat?.id || '')
        if (opts.channelIds && !opts.channelIds.includes(chatId)) continue

        const content = msg.text || msg.caption || ''
        if (opts.keyword && !content.includes(opts.keyword)) continue

        messages.push({
          id: String(msg.message_id || ''),
          platform: 'telegram',
          channelId: chatId,
          channelName: msg.chat?.title || msg.chat?.username || chatId,
          senderId: String(msg.from?.id || ''),
          senderName: [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || '',
          content,
          contentType: msg.text ? 'text' : 'file',
          timestamp: ts,
          isRead: false,
          isMentioned: (msg.entities || []).some((e: any) => e.type === 'mention'),
          threadId: msg.message_thread_id ? String(msg.message_thread_id) : undefined,
          replyTo: msg.reply_to_message?.message_id ? String(msg.reply_to_message.message_id) : undefined,
          attachments: this.extractAttachments(msg),
          raw: update,
        })
      }

      return messages.slice(0, opts.limit || 100)
    } catch (e) {
      logForDebugging(`[telegram] getMessages 失败: ${(e as Error).message}`)
      return []
    }
  }

  async sendMessage(target: string, content: string, opts?: {
    threadId?: string
    contentType?: 'text' | 'rich_text' | 'card'
  }): Promise<{ messageId: string }> {
    try {
      const params: Record<string, any> = {
        chat_id: target,
        text: content,
      }
      if (opts?.threadId) params.message_thread_id = parseInt(opts.threadId, 10)
      if (opts?.contentType === 'rich_text') params.parse_mode = 'HTML'

      const resp = await this.tgApi('sendMessage', params)
      return { messageId: String(resp.result?.message_id || '') }
    } catch (e) {
      logForDebugging(`[telegram] sendMessage 失败: ${(e as Error).message}`)
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
        platform: 'telegram',
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
      const chatId = (this.config?.extra?.chatId as string) || (this.config?.extra?.adminChatId as string) || ''
      if (chatId) {
        await this.sendMessage(chatId, msg)
      } else {
        logForDebugging('[telegram] sendNotification skipped: no chatId configured')
      }
    } catch (e) {
      logForDebugging(`[telegram] sendNotification failed: ${e}`)
    }
  }

  // ─── 内部方法 ───

  private async tgApi(method: string, params?: Record<string, any>): Promise<any> {
    const url = `${TG_API}/bot${this.botToken}/${method}`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: params ? JSON.stringify(params) : undefined,
    })
    return resp.json()
  }

  private extractAttachments(msg: any): Array<{ type: 'image' | 'file' | 'video' | 'audio' | 'link'; name: string; url?: string; size?: number }> {
    const attachments: any[] = []
    if (msg.photo) {
      const largest = msg.photo[msg.photo.length - 1]
      attachments.push({ type: 'image', name: 'photo', size: largest?.file_size })
    }
    if (msg.document) {
      attachments.push({ type: 'file', name: msg.document.file_name || 'document', size: msg.document.file_size })
    }
    if (msg.video) {
      attachments.push({ type: 'video', name: msg.video.file_name || 'video', size: msg.video.file_size })
    }
    if (msg.audio || msg.voice) {
      const a = msg.audio || msg.voice
      attachments.push({ type: 'audio', name: a.file_name || 'audio', size: a.file_size })
    }
    return attachments
  }
}

function emptyUnreadSummary(): UnreadSummary {
  return { platform: 'telegram', totalUnread: 0, mentionCount: 0, urgentCount: 0, channels: [], fetchedAt: Date.now() }
}

// ─── 工厂 ───

export const telegramConnectorFactory: ConnectorFactory = {
  platform: 'telegram',
  displayName: 'Telegram',
  description: 'Telegram Bot API Connector',
  supportedModes: ['api'],
  defaultCapabilities: ['messages.read', 'messages.send', 'unread.summary'],
  create(): IMConnector {
    return new TelegramConnector()
  },
}

export function createTelegramConnector(): IMConnector {
  return new TelegramConnector()
}
