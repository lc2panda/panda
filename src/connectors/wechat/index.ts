// Input: ConnectorConfig（企微 corpId/agentId/secret 或本地 DB dbKey）
// Output: 微信/企微消息/通讯录数据，统一为 IMConnector 接口
// Pos: connectors/wechat/ 微信平台 Connector，双模：企微 API + macOS 本地 DB

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
  IMContact,
  UnreadSummary,
  PandaNotification,
  ConnectorFactory,
} from '../types.js'

// ─── 企业微信 API 模式 ───

class WecomAPIConnector implements IMConnector {
  readonly platform: ConnectorPlatform = 'wechat'
  readonly interfaceVersion = '1.0.0'
  readonly capabilities = new Set<ConnectorCapability>([
    'messages.read', 'messages.send', 'contacts.read', 'unread.summary',
  ])

  private _status: ConnectorStatus = 'disconnected'
  private config: ConnectorConfig | null = null
  private accessToken = ''
  private tokenExpiry = 0

  get status(): ConnectorStatus { return this._status }
  get mode(): ConnectorMode { return 'api' }

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = config
    if (!config.corpId || !config.appSecret) {
      this._status = 'auth-required'
      logForDebugging('[wechat-wecom] 缺少 corpId 或 appSecret')
      return
    }
    try {
      await this.refreshToken()
      this._status = 'connected'
    } catch (e) {
      this._status = 'error'
      logForDebugging(`[wechat-wecom] 初始化失败: ${(e as Error).message}`)
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
    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${this.config!.corpId}&corpsecret=${this.config!.appSecret}`
    const resp = await fetch(url)
    const data = await resp.json() as any
    if (data.errcode !== 0) throw new Error(`企微 token 获取失败: ${data.errmsg}`)
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in || 7200) * 1000
  }

  async getMessages(opts: MessageQuery): Promise<IMMessage[]> {
    // 企微不支持拉取历史消息（需 webhook 回调），返回空
    logForDebugging('[wechat-wecom] getMessages: 企微不支持拉取历史消息')
    return []
  }

  async getContacts(): Promise<IMContact[]> {
    try {
      await this.ensureToken()
      // 获取部门成员（部门 1 = 根部门）
      const url = `https://qyapi.weixin.qq.com/cgi-bin/user/list?access_token=${this.accessToken}&department_id=1&fetch_child=1`
      const resp = await fetch(url)
      const data = await resp.json() as any
      if (data.errcode !== 0) return []
      return ((data.userlist || []) as any[]).map((u: any) => ({
        id: u.userid || '',
        platform: 'wechat' as ConnectorPlatform,
        name: u.name || '',
        email: u.email || '',
        phone: u.mobile || '',
        avatar: u.thumb_avatar || u.avatar || '',
        department: (u.department || []).join(','),
        title: u.position || '',
      }))
    } catch (e) {
      logForDebugging(`[wechat-wecom] getContacts 失败: ${(e as Error).message}`)
      return []
    }
  }

  async sendMessage(target: string, content: string): Promise<{ messageId: string }> {
    try {
      await this.ensureToken()
      const resp = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${this.accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touser: target,
          msgtype: 'text',
          agentid: this.config?.agentId || '',
          text: { content },
        }),
      })
      const data = await resp.json() as any
      return { messageId: data.msgid || '' }
    } catch (e) {
      logForDebugging(`[wechat-wecom] sendMessage 失败: ${(e as Error).message}`)
      return { messageId: '' }
    }
  }

  async getUnreadSummary(): Promise<UnreadSummary> {
    return emptyUnreadSummary()
  }

  async sendNotification(notification: PandaNotification): Promise<void> {
    logForDebugging(`[wechat-wecom] sendNotification: ${notification.title}`)
  }
}

// ─── macOS 本地数据库只读模式 ───

class WechatLocalDBConnector implements IMConnector {
  readonly platform: ConnectorPlatform = 'wechat'
  readonly interfaceVersion = '1.0.0'
  readonly capabilities = new Set<ConnectorCapability>([
    'messages.read', 'contacts.read', 'unread.summary',
  ])

  private _status: ConnectorStatus = 'disconnected'
  private config: ConnectorConfig | null = null
  private dbPath = ''
  private dbKey = ''

  get status(): ConnectorStatus { return this._status }
  get mode(): ConnectorMode { return 'local-db' }

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = config

    // 仅 macOS 支持
    if (process.platform !== 'darwin') {
      this._status = 'error'
      logForDebugging('[wechat-localdb] 仅 macOS 支持本地 DB 模式')
      return
    }

    this.dbKey = (config.extra?.dbKey as string) || ''
    if (!this.dbKey) {
      this._status = 'auth-required'
      logForDebugging('[wechat-localdb] 缺少 dbKey（微信数据库解密密钥）')
      return
    }

    // 查找微信数据库路径
    try {
      const { homedir } = require('os')
      const { readdirSync, existsSync } = require('fs')
      const { join } = require('path')
      const wechatBase = join(homedir(), 'Library', 'Containers', 'com.tencent.xinWeChat', 'Data')

      if (!existsSync(wechatBase)) {
        this._status = 'error'
        logForDebugging('[wechat-localdb] 微信数据目录不存在')
        return
      }

      // 搜索 Message 目录
      const findDB = (dir: string): string | null => {
        try {
          const entries = readdirSync(dir, { withFileTypes: true })
          for (const entry of entries) {
            const full = join(dir, entry.name)
            if (entry.isFile() && entry.name.endsWith('.db') && entry.name.includes('msg')) {
              return full
            }
            if (entry.isDirectory() && entry.name !== '.' && entry.name !== '..') {
              const found = findDB(full)
              if (found) return found
            }
          }
        } catch { /* 权限等问题，静默 */ }
        return null
      }

      const found = findDB(wechatBase)
      if (found) {
        this.dbPath = found
        this._status = 'connected'
        logForDebugging(`[wechat-localdb] 数据库路径: ${this.dbPath}`)
      } else {
        this._status = 'error'
        logForDebugging('[wechat-localdb] 未找到微信消息数据库')
      }
    } catch (e) {
      this._status = 'error'
      logForDebugging(`[wechat-localdb] 初始化失败: ${(e as Error).message}`)
    }
  }

  async healthCheck(): Promise<boolean> {
    if (this._status !== 'connected') return false
    try {
      const { existsSync } = require('fs')
      return existsSync(this.dbPath)
    } catch { return false }
  }

  async dispose(): Promise<void> {
    this._status = 'disconnected'
    this.dbPath = ''
  }

  async getMessages(opts: MessageQuery): Promise<IMMessage[]> {
    if (this._status !== 'connected' || !this.dbPath) return []

    try {
      // SQLCipher 查询需要解密密钥，使用 sqlite3 + pragma key
      const { execSync } = require('child_process')
      const since = opts.since ? Math.floor(opts.since / 1000) : Math.floor((Date.now() - 86400000) / 1000)
      const limit = opts.limit || 100

      // 尝试 sqlcipher（需用户安装 sqlcipher CLI）
      const sql = `PRAGMA key = '${this.dbKey}'; SELECT rowid, Type, Des, CreateTime, Message, MesLocalID FROM Chat_${opts.channelIds?.[0] || ''} WHERE CreateTime > ${since} ORDER BY CreateTime DESC LIMIT ${limit};`

      try {
        const raw = execSync(`echo "${sql}" | sqlcipher "${this.dbPath}" 2>/dev/null`, {
          encoding: 'utf-8',
          timeout: 10000,
        })

        return raw.split('\n').filter(Boolean).map((line: string) => {
          const parts = line.split('|')
          return {
            id: parts[5] || '',
            platform: 'wechat' as ConnectorPlatform,
            channelId: opts.channelIds?.[0] || '',
            channelName: '',
            senderId: parts[2] === '0' ? 'self' : 'other',
            senderName: '',
            content: parts[4] || '',
            contentType: 'text' as const,
            timestamp: parseInt(parts[3] || '0', 10) * 1000,
            isRead: true,
            isMentioned: false,
            raw: { line },
          }
        })
      } catch {
        logForDebugging('[wechat-localdb] sqlcipher 执行失败（可能未安装或密钥错误）')
        return []
      }
    } catch (e) {
      logForDebugging(`[wechat-localdb] getMessages 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getContacts(): Promise<IMContact[]> {
    // 本地 DB 读取通讯录需要不同的数据库文件
    logForDebugging('[wechat-localdb] getContacts: 暂未实现通讯录读取')
    return []
  }

  async getUnreadSummary(): Promise<UnreadSummary> {
    return emptyUnreadSummary()
  }

  // 本地 DB 模式不支持发送
}

// ─── 辅助 ───

function emptyUnreadSummary(): UnreadSummary {
  return { platform: 'wechat', totalUnread: 0, mentionCount: 0, urgentCount: 0, channels: [], fetchedAt: Date.now() }
}

// ─── 工厂 ───

export const wechatConnectorFactory: ConnectorFactory = {
  platform: 'wechat',
  displayName: '微信 / WeChat',
  description: '微信 Connector（企微 API + macOS 本地 DB 双模）',
  supportedModes: ['api', 'local-db'],
  defaultCapabilities: ['messages.read', 'contacts.read', 'unread.summary'],
  create(): IMConnector {
    // 默认企微模式
    return new WecomAPIConnector()
  },
}

/**
 * 根据配置创建微信 Connector。
 * mode='local-db' → macOS 本地数据库只读
 * mode='api' / 其他 → 企业微信 API
 */
export function createWechatConnector(config: ConnectorConfig): IMConnector {
  if (config.mode === 'local-db') {
    return new WechatLocalDBConnector()
  }
  return new WecomAPIConnector()
}
