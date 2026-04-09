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
// 支持 wechat-db-decrypt-macos 工具导出的 wechat_keys.json（per-db keys）
// 微信 4.x 数据库结构：xwechat_files/{用户名}_{hash}/db_storage/{子目录}/{数据库}.db

/** wechat_keys.json 格式：每个 db 独立密钥 */
interface WechatKeysMap {
  __salts__?: string[]
  [dbRelPath: string]: string | string[] | undefined  // "message/message_0.db": "hex_key"
}

class WechatLocalDBConnector implements IMConnector {
  readonly platform: ConnectorPlatform = 'wechat'
  readonly interfaceVersion = '1.0.0'
  readonly capabilities = new Set<ConnectorCapability>([
    'messages.read', 'contacts.read', 'unread.summary',
  ])

  private _status: ConnectorStatus = 'disconnected'
  private config: ConnectorConfig | null = null
  private dbStoragePath = ''     // xwechat_files/{user}/db_storage/
  private keysMap: WechatKeysMap = {}  // per-db 密钥表

  get status(): ConnectorStatus { return this._status }
  get mode(): ConnectorMode { return 'local-db' }

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = config

    if (process.platform !== 'darwin') {
      this._status = 'error'
      logForDebugging('[wechat-localdb] 仅 macOS 支持本地 DB 模式')
      return
    }

    // 加载密钥：支持 wechat_keys.json 路径 或 单一 dbKey
    try {
      const { readFileSync, existsSync, readdirSync, statSync } = require('fs')
      const { join, basename } = require('path')
      const { homedir } = require('os')

      // 密钥来源 1：wechat_keys.json 文件路径
      const keysPath = (config.extra?.keysFile as string)
        || (config.extra?.dbKey as string)  // 兼容旧配置：如果是 json 文件路径
        || ''

      if (keysPath && existsSync(keysPath) && keysPath.endsWith('.json')) {
        this.keysMap = JSON.parse(readFileSync(keysPath, 'utf-8'))
        logForDebugging(`[wechat-localdb] 从 ${keysPath} 加载了 ${Object.keys(this.keysMap).filter(k => k !== '__salts__').length} 个 db 密钥`)
      } else if (keysPath && keysPath.length === 64) {
        // 单一 hex 密钥（兼容旧格式），所有 db 用同一密钥
        logForDebugging('[wechat-localdb] 使用单一 dbKey（所有 db 共用）')
      } else {
        this._status = 'auth-required'
        logForDebugging('[wechat-localdb] 缺少密钥配置。请在 connectors.json 中设置 wechat.keysFile 指向 wechat_keys.json')
        return
      }

      // 查找 db_storage 路径
      const wechatData = join(homedir(), 'Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files')
      if (!existsSync(wechatData)) {
        this._status = 'error'
        logForDebugging('[wechat-localdb] 微信数据目录不存在: xwechat_files/')
        return
      }

      // 找到用户目录（最大的那个，排除 all_users）
      const userDirs = readdirSync(wechatData, { withFileTypes: true })
        .filter((d: any) => d.isDirectory() && d.name !== 'all_users')
        .map((d: any) => {
          const dbStorage = join(wechatData, d.name, 'db_storage')
          let size = 0
          try {
            const subs = readdirSync(dbStorage)
            for (const s of subs) {
              try { size += statSync(join(dbStorage, s)).size } catch {}
            }
          } catch {}
          return { name: d.name, path: dbStorage, size }
        })
        .sort((a: any, b: any) => b.size - a.size)

      if (userDirs.length === 0) {
        this._status = 'error'
        logForDebugging('[wechat-localdb] 未找到微信用户数据目录')
        return
      }

      this.dbStoragePath = userDirs[0].path
      if (!existsSync(this.dbStoragePath)) {
        this._status = 'error'
        logForDebugging(`[wechat-localdb] db_storage 不存在: ${this.dbStoragePath}`)
        return
      }

      // 验证：检查 message/ 目录是否有 db 文件
      const msgDir = join(this.dbStoragePath, 'message')
      if (existsSync(msgDir)) {
        const msgDbs = readdirSync(msgDir).filter((f: string) => f.endsWith('.db') && !f.endsWith('-wal') && !f.endsWith('-shm'))
        logForDebugging(`[wechat-localdb] 已连接: ${userDirs[0].name}, message/ 有 ${msgDbs.length} 个 db`)
      }

      this._status = 'connected'
    } catch (e) {
      this._status = 'error'
      logForDebugging(`[wechat-localdb] 初始化失败: ${(e as Error).message}`)
    }
  }

  /** 获取指定 db 的解密密钥 */
  private getKeyForDb(dbRelPath: string): string | null {
    // 从 keysMap 中查找（key 格式如 "message/message_0.db"）
    const key = this.keysMap[dbRelPath]
    if (typeof key === 'string') return key
    return null
  }

  async healthCheck(): Promise<boolean> {
    if (this._status !== 'connected') return false
    try {
      const { existsSync } = require('fs')
      return existsSync(this.dbStoragePath)
    } catch { return false }
  }

  async dispose(): Promise<void> {
    this._status = 'disconnected'
    this.dbStoragePath = ''
    this.keysMap = {}
  }

  async getMessages(opts: MessageQuery): Promise<IMMessage[]> {
    if (this._status !== 'connected' || !this.dbStoragePath) return []

    const results: IMMessage[] = []
    try {
      const { execSync } = require('child_process')
      const { join } = require('path')
      const { readdirSync } = require('fs')
      const since = opts.since ? Math.floor(opts.since / 1000) : Math.floor((Date.now() - 86400000) / 1000)
      const limit = opts.limit || 50

      // 遍历 message/message_N.db（微信 4.x 分片存储）
      const msgDir = join(this.dbStoragePath, 'message')
      const msgDbs = readdirSync(msgDir)
        .filter((f: string) => /^message_\d+\.db$/.test(f))
        .sort()

      for (const dbFile of msgDbs) {
        const dbRelPath = `message/${dbFile}`
        const dbKey = this.getKeyForDb(dbRelPath)
        if (!dbKey) {
          logForDebugging(`[wechat-localdb] 无密钥: ${dbRelPath}`)
          continue
        }

        const dbFullPath = join(msgDir, dbFile)
        try {
          // 使用 sqlcipher CLI 查询（密钥通过 hex key 传入，避免 SQL 注入）
          const sql = `PRAGMA key = "x'${dbKey}'"; PRAGMA cipher_compatibility = 4; SELECT rowid, type, createTime, message FROM MSG WHERE createTime > ${since} ORDER BY createTime DESC LIMIT ${limit};`

          const raw = execSync(
            `printf '%s' ${JSON.stringify(sql)} | sqlcipher ${JSON.stringify(dbFullPath)} 2>/dev/null`,
            { encoding: 'utf-8', timeout: 10000 }
          )

          for (const line of raw.split('\n').filter(Boolean)) {
            const parts = line.split('|')
            if (parts.length < 4) continue
            results.push({
              id: parts[0] || '',
              platform: 'wechat' as ConnectorPlatform,
              channelId: dbFile,
              channelName: '',
              senderId: '',
              senderName: '',
              content: parts[3] || '',
              contentType: 'text' as const,
              timestamp: parseInt(parts[2] || '0', 10) * 1000,
              isRead: true,
              isMentioned: false,
              raw: { dbFile, line },
            })
          }
        } catch {
          // sqlcipher 未安装或密钥错误，静默跳过该分片
        }

        if (results.length >= limit) break
      }
    } catch (e) {
      logForDebugging(`[wechat-localdb] getMessages 失败: ${(e as Error).message}`)
    }

    return results.slice(0, opts.limit || 50)
  }

  async getContacts(): Promise<IMContact[]> {
    if (this._status !== 'connected' || !this.dbStoragePath) return []

    try {
      const { execSync } = require('child_process')
      const { join } = require('path')
      const dbRelPath = 'contact/contact.db'
      const dbKey = this.getKeyForDb(dbRelPath)
      if (!dbKey) {
        logForDebugging('[wechat-localdb] 无 contact.db 密钥')
        return []
      }

      const dbFullPath = join(this.dbStoragePath, dbRelPath)
      const sql = `PRAGMA key = "x'${dbKey}'"; PRAGMA cipher_compatibility = 4; SELECT userName, dbContactRemark, dbContactChatRoom FROM WCContact LIMIT 200;`

      const raw = execSync(
        `printf '%s' ${JSON.stringify(sql)} | sqlcipher ${JSON.stringify(dbFullPath)} 2>/dev/null`,
        { encoding: 'utf-8', timeout: 10000 }
      )

      return raw.split('\n').filter(Boolean).map((line: string) => {
        const parts = line.split('|')
        return {
          id: parts[0] || '',
          platform: 'wechat' as ConnectorPlatform,
          name: parts[1] || parts[0] || '',
          avatar: '',
          department: parts[2] || '',
          email: '',
          phone: '',
        }
      })
    } catch (e) {
      logForDebugging(`[wechat-localdb] getContacts 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getUnreadSummary(): Promise<UnreadSummary> {
    if (this._status !== 'connected' || !this.dbStoragePath) return emptyUnreadSummary()

    try {
      const { execSync } = require('child_process')
      const { join } = require('path')
      const dbRelPath = 'session/session.db'
      const dbKey = this.getKeyForDb(dbRelPath)
      if (!dbKey) return emptyUnreadSummary()

      const dbFullPath = join(this.dbStoragePath, dbRelPath)
      const sql = `PRAGMA key = "x'${dbKey}'"; PRAGMA cipher_compatibility = 4; SELECT COUNT(*) FROM SessionAbstract WHERE unReadCount > 0;`

      const raw = execSync(
        `printf '%s' ${JSON.stringify(sql)} | sqlcipher ${JSON.stringify(dbFullPath)} 2>/dev/null`,
        { encoding: 'utf-8', timeout: 5000 }
      )

      const count = parseInt(raw.trim(), 10) || 0
      return { platform: 'wechat', totalUnread: count, mentionCount: 0, urgentCount: 0, channels: [], fetchedAt: Date.now() }
    } catch {
      return emptyUnreadSummary()
    }
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
