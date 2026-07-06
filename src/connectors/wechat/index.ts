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
    try {
      const resp = await fetch(url)
      const data = await resp.json() as any
      if (data.errcode !== 0) throw new Error(`企微 token 获取失败: ${data.errmsg}`)
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in || 7200) * 1000
    } catch (e) {
      // 不在错误信息中暴露含凭证的 URL
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('corpid') || msg.includes('corpsecret')) {
        throw new Error('企微 token 获取失败: 网络或凭证错误')
      }
      throw e
    }
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
    const agentId = this.config?.agentId
    if (!agentId) {
      logForDebugging('[wechat-wecom] sendMessage 失败: agentId 未配置，消息无法发送')
      throw new Error('企微 agentId 未配置，无法发送消息。请在 connectors.json 中设置 wechat.agentId')
    }
    try {
      await this.ensureToken()
      const resp = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${this.accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touser: target,
          msgtype: 'text',
          agentid: agentId,
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
    try {
      const msg = `📢 [${notification.title || 'Panda'}]\n${notification.body || ''}`
      await this.sendMessage('@all', msg)
    } catch (e) {
      logForDebugging(`[wechat-wecom] sendNotification failed: ${e}`)
    }
  }
}

// ─── macOS 本地数据库只读模式 ───
// 移植自 wechat-db-decrypt-macos MCP Server 的核心逻辑
// 策略：sqlcipher 一次性解密到明文 DB → bun:sqlite 直接读取明文 DB
// 微信 4.x 数据库结构：xwechat_files/{用户名}_{hash}/db_storage/{子目录}/{数据库}.db

/** wechat_keys.json 格式：每个 db 独立密钥 */
interface WechatKeysMap {
  __salts__?: string[]
  [dbRelPath: string]: string | string[] | undefined  // "message/message_0.db": "hex_key"
}

/** 联系人缓存项 */
interface ContactCacheEntry {
  username: string
  remark: string
  nickName: string
  isGroup: boolean
}

/** 消息类型常量 */
const MSG_TYPE: Record<number, string> = {
  1: '文本', 3: '图片', 34: '语音', 42: '名片', 43: '视频',
  47: '表情', 49: '链接/文件', 10000: '系统消息', 10002: '撤回消息',
}

class WechatLocalDBConnector implements IMConnector {
  readonly platform: ConnectorPlatform = 'wechat'
  readonly interfaceVersion = '2.0.0'
  readonly capabilities = new Set<ConnectorCapability>([
    'messages.read', 'contacts.read', 'unread.summary',
  ])

  private _status: ConnectorStatus = 'disconnected'
  // TODO(W9-T1·v2.26): WechatLocalDBConnector.config 仅 initialize 写入 — 留作未来 capability 协商/重连
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: retained for planned capability negotiation and reconnect support
  private config: ConnectorConfig | null = null
  private dbStoragePath = ''                    // 源加密 DB 目录
  private decryptedDir = ''                     // 明文 DB 目录
  private keysMap: WechatKeysMap = {}           // per-db 密钥表
  private sqlcipherPath: string | null = null   // sqlcipher 可执行路径
  private lastSyncTime = 0                      // 上次自动解密时间
  private contactCache: ContactCacheEntry[] = [] // 联系人缓存
  private contactCacheLoaded = false

  get status(): ConnectorStatus { return this._status }
  get mode(): ConnectorMode { return 'local-db' }

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = config

    if (process.platform !== 'darwin') {
      this._status = 'error'
      logForDebugging('[wechat-localdb] 仅 macOS 支持本地 DB 模式')
      return
    }

    try {
      const { readFileSync, existsSync, readdirSync, statSync, mkdirSync } = require('fs')
      const { join } = require('path')
      const { homedir } = require('os')

      // 1. 加载密钥
      const keysPath = (config.extra?.keysFile as string) || ''
      if (keysPath && existsSync(keysPath) && keysPath.endsWith('.json')) {
        this.keysMap = JSON.parse(readFileSync(keysPath, 'utf-8'))
        logForDebugging(`[wechat-localdb] 从 ${keysPath} 加载了 ${Object.keys(this.keysMap).filter(k => k !== '__salts__').length} 个 db 密钥`)
      } else {
        this._status = 'auth-required'
        logForDebugging('[wechat-localdb] 缺少密钥配置。请在 connectors.json 中设置 wechat.keysFile 指向 wechat_keys.json')
        return
      }

      // 2. 查找 sqlcipher
      this.sqlcipherPath = this._findSqlcipher()
      if (!this.sqlcipherPath) {
        this._status = 'error'
        logForDebugging('[wechat-localdb] 未找到 sqlcipher，请安装: brew install sqlcipher')
        return
      }

      // 3. 查找 db_storage 路径
      const wechatData = join(homedir(), 'Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files')
      if (!existsSync(wechatData)) {
        this._status = 'error'
        logForDebugging('[wechat-localdb] 微信数据目录不存在: xwechat_files/')
        return
      }

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

      // 4. 创建解密目标目录
      this.decryptedDir = join(homedir(), '.pandacc/data/wechat-decrypted')
      mkdirSync(this.decryptedDir, { recursive: true })

      // 5. 首次全量解密
      logForDebugging(`[wechat-localdb] 开始首次解密，源: ${this.dbStoragePath}`)
      await this._autoSync(true)

      // 6. 加载联系人缓存
      this._loadContacts()

      this._status = 'connected'
      logForDebugging(`[wechat-localdb] 初始化完成，明文 DB: ${this.decryptedDir}`)
    } catch (e) {
      this._status = 'error'
      logForDebugging(`[wechat-localdb] 初始化失败: ${(e as Error).message}`)
    }
  }

  async healthCheck(): Promise<boolean> {
    if (this._status !== 'connected') return false
    try {
      const { existsSync } = require('fs')
      return existsSync(this.dbStoragePath) && existsSync(this.decryptedDir)
    } catch { return false }
  }

  async dispose(): Promise<void> {
    this._status = 'disconnected'
    this.dbStoragePath = ''
    this.decryptedDir = ''
    this.keysMap = {}
    this.contactCache = []
    this.contactCacheLoaded = false
  }

  // ─── 公开数据方法 ───

  async getMessages(opts: MessageQuery): Promise<IMMessage[]> {
    if (this._status !== 'connected') return []
    await this._autoSync()

    const results: IMMessage[] = []
    try {
      const { join } = require('path')
      const { readdirSync, existsSync } = require('fs')
      const since = opts.since ? Math.floor(opts.since / 1000) : Math.floor((Date.now() - 86400000) / 1000)
      const until = opts.until ? Math.floor(opts.until / 1000) : Math.floor(Date.now() / 1000)
      const limit = opts.limit || 50

      const msgDir = join(this.decryptedDir, 'message')
      if (!existsSync(msgDir)) return []

      const msgDbs = readdirSync(msgDir)
        .filter((f: string) => /^message_\d+\.db$/.test(f))
        .sort()

      for (const dbFile of msgDbs) {
        const dbPath = join(msgDir, dbFile)
        try {
          const db = this._openDb(dbPath)
          if (!db) continue

          // 查找所有 Msg_ 开头的表
          const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Msg_%'").all() as any[]

          for (const { name: tableName } of tables) {
            try {
              const rows = db.query(
                `SELECT local_type, create_time, message_content FROM "${tableName}" WHERE create_time > ?1 AND create_time < ?2 ORDER BY create_time DESC LIMIT ?3`
              ).all(since, until, limit - results.length) as any[]

              const username = this._tableToUsername(tableName)
              const contact = username ? this.contactCache.find(c => c.username === username) : null
              const isGroup = username ? username.includes('@chatroom') : false

              for (const row of rows) {
                const content = this._parseMessage(row.message_content || '', row.local_type, isGroup)
                results.push({
                  id: `${dbFile}:${tableName}:${row.create_time}`,
                  platform: 'wechat',
                  channelId: username || tableName,
                  channelName: contact?.remark || contact?.nickName || username || tableName,
                  senderId: '',
                  senderName: '',
                  content,
                  contentType: this._msgContentType(row.local_type),
                  timestamp: (row.create_time || 0) * 1000,
                  isRead: true,
                  isMentioned: false,
                  raw: { dbFile, tableName, local_type: row.local_type },
                })
              }
            } catch {}
          }
          db.close()
        } catch {}

        if (results.length >= limit) break
      }
    } catch (e) {
      logForDebugging(`[wechat-localdb] getMessages 失败: ${(e as Error).message}`)
    }

    results.sort((a, b) => b.timestamp - a.timestamp)
    return results.slice(0, opts.limit || 50)
  }

  async getContacts(): Promise<IMContact[]> {
    if (this._status !== 'connected') return []
    await this._autoSync()

    try {
      if (!this.contactCacheLoaded) this._loadContacts()

      return this.contactCache
        .filter(c => !c.username.startsWith('gh_') && !c.username.includes('weixin'))
        .map(c => ({
          id: c.username,
          platform: 'wechat' as ConnectorPlatform,
          name: c.remark || c.nickName || c.username,
          avatar: '',
          department: c.isGroup ? '群聊' : '',
          email: '',
          phone: '',
        }))
    } catch (e) {
      logForDebugging(`[wechat-localdb] getContacts 失败: ${(e as Error).message}`)
      return []
    }
  }

  async getUnreadSummary(): Promise<UnreadSummary> {
    if (this._status !== 'connected') return emptyUnreadSummary()
    await this._autoSync()

    try {
      const { join } = require('path')
      const { existsSync } = require('fs')
      const sessionDbPath = join(this.decryptedDir, 'session', 'session.db')
      if (!existsSync(sessionDbPath)) return emptyUnreadSummary()

      const db = this._openDb(sessionDbPath)
      if (!db) return emptyUnreadSummary()

      try {
        const rows = db.query(
          "SELECT username, unread_count, summary, last_timestamp, last_sender_display_name FROM SessionTable WHERE unread_count > 0 ORDER BY last_timestamp DESC"
        ).all() as any[]

        const channels = rows.map((r: any) => {
          const contact = this.contactCache.find(c => c.username === r.username)
          return {
            id: r.username || '',
            name: contact?.remark || contact?.nickName || r.last_sender_display_name || r.username || '',
            unreadCount: r.unread_count || 0,
            hasMention: false,
            lastMessageTime: (r.last_timestamp || 0) * 1000,
          }
        })

        const totalUnread = channels.reduce((sum: number, ch: any) => sum + ch.unreadCount, 0)

        return {
          platform: 'wechat',
          totalUnread,
          mentionCount: 0,
          urgentCount: 0,
          channels,
          fetchedAt: Date.now(),
        }
      } finally {
        try { db.close() } catch (e) {
          logForDebugging(`[wechat] getUnreadSummary: 关闭 session db 失败: ${(e as Error).message}`)
        }
      }
    } catch (e) {
      logForDebugging(`[wechat] getUnreadSummary 失败: ${(e as Error).message}`)
      return emptyUnreadSummary()
    }
  }

  /** 获取最近会话列表 */
  async getRecentSessions(limit = 20): Promise<Array<{
    username: string; displayName: string; isGroup: boolean
    unreadCount: number; lastMessage: string; lastTime: number
  }>> {
    if (this._status !== 'connected') return []
    await this._autoSync()

    try {
      const { join } = require('path')
      const { existsSync } = require('fs')
      const sessionDbPath = join(this.decryptedDir, 'session', 'session.db')
      if (!existsSync(sessionDbPath)) return []

      const db = this._openDb(sessionDbPath)
      if (!db) return []

      try {
        const rows = db.query(
          `SELECT username, unread_count, summary, last_timestamp, last_msg_type, last_sender_display_name FROM SessionTable ORDER BY last_timestamp DESC LIMIT ?1`
        ).all(limit) as any[]

        return rows.map((r: any) => {
          const contact = this.contactCache.find(c => c.username === r.username)
          const isGroup = (r.username || '').includes('@chatroom')
          return {
            username: r.username || '',
            displayName: contact?.remark || contact?.nickName || r.last_sender_display_name || r.username || '',
            isGroup,
            unreadCount: r.unread_count || 0,
            lastMessage: r.summary || '',
            lastTime: (r.last_timestamp || 0) * 1000,
          }
        })
      } finally {
        try { db.close() } catch {}
      }
    } catch (e) {
      logForDebugging(`[wechat-localdb] getRecentSessions 失败: ${(e as Error).message}`)
      return []
    }
  }

  /** 获取指定联系人/群的聊天记录（模糊匹配名称） */
  async getChatHistory(chatName: string, opts?: {
    limit?: number; startDate?: string; endDate?: string
  }): Promise<IMMessage[]> {
    if (this._status !== 'connected') return []
    await this._autoSync()

    try {
      const username = this._resolveUsername(chatName)
      if (!username) {
        logForDebugging(`[wechat-localdb] 未找到联系人: ${chatName}`)
        return []
      }

      const tableInfo = this._findMsgTable(username)
      if (!tableInfo) {
        logForDebugging(`[wechat-localdb] 未找到消息表: ${username}`)
        return []
      }

      const limit = opts?.limit || 100
      const isGroup = username.includes('@chatroom')
      const contact = this.contactCache.find(c => c.username === username)
      const displayName = contact?.remark || contact?.nickName || username

      const db = this._openDb(tableInfo.dbPath)
      if (!db) return []

      try {
        let sql = `SELECT local_type, create_time, message_content FROM "${tableInfo.tableName}"`
        const conditions: string[] = []
        const params: any[] = []

        if (opts?.startDate) {
          conditions.push('create_time >= ?')
          params.push(Math.floor(new Date(opts.startDate).getTime() / 1000))
        }
        if (opts?.endDate) {
          conditions.push('create_time <= ?')
          params.push(Math.floor(new Date(opts.endDate).getTime() / 1000))
        }

        if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ')
        sql += ` ORDER BY create_time DESC LIMIT ${limit}`

        const rows = db.query(sql).all(...params) as any[]

        return rows.map((row: any) => ({
          id: `${username}:${row.create_time}`,
          platform: 'wechat' as ConnectorPlatform,
          channelId: username,
          channelName: displayName,
          senderId: '',
          senderName: '',
          content: this._parseMessage(row.message_content || '', row.local_type, isGroup),
          contentType: this._msgContentType(row.local_type),
          timestamp: (row.create_time || 0) * 1000,
          isRead: true,
          isMentioned: false,
        }))
      } finally {
        try { db.close() } catch {}
      }
    } catch (e) {
      logForDebugging(`[wechat-localdb] getChatHistory 失败: ${(e as Error).message}`)
      return []
    }
  }

  /** 跨会话搜索消息 */
  async searchMessages(keyword: string, limit = 50): Promise<IMMessage[]> {
    if (this._status !== 'connected' || !keyword) return []
    await this._autoSync()

    const results: IMMessage[] = []
    try {
      const { join } = require('path')
      const { readdirSync, existsSync } = require('fs')

      const msgDir = join(this.decryptedDir, 'message')
      if (!existsSync(msgDir)) return []

      const msgDbs = readdirSync(msgDir)
        .filter((f: string) => /^message_\d+\.db$/.test(f))
        .sort()

      for (const dbFile of msgDbs) {
        const dbPath = join(msgDir, dbFile)
        try {
          const db = this._openDb(dbPath)
          if (!db) continue

          const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Msg_%'").all() as any[]

          for (const { name: tableName } of tables) {
            try {
              const rows = db.query(
                `SELECT local_type, create_time, message_content FROM "${tableName}" WHERE message_content LIKE ?1 AND local_type = 1 ORDER BY create_time DESC LIMIT ?2`
              ).all(`%${keyword}%`, limit - results.length) as any[]

              const username = this._tableToUsername(tableName)
              const contact = username ? this.contactCache.find(c => c.username === username) : null
              const isGroup = username ? username.includes('@chatroom') : false

              for (const row of rows) {
                results.push({
                  id: `${dbFile}:${tableName}:${row.create_time}`,
                  platform: 'wechat',
                  channelId: username || tableName,
                  channelName: contact?.remark || contact?.nickName || username || tableName,
                  senderId: '',
                  senderName: '',
                  content: this._parseMessage(row.message_content || '', row.local_type, isGroup),
                  contentType: 'text',
                  timestamp: (row.create_time || 0) * 1000,
                  isRead: true,
                  isMentioned: false,
                })
              }
            } catch {}
          }
          db.close()
        } catch {}

        if (results.length >= limit) break
      }
    } catch (e) {
      logForDebugging(`[wechat-localdb] searchMessages 失败: ${(e as Error).message}`)
    }

    results.sort((a, b) => b.timestamp - a.timestamp)
    return results.slice(0, limit)
  }

  // ─── 私有方法 ───

  /** 自动增量解密：只解密源 mtime > 明文 mtime 的 DB */
  private async _autoSync(force = false): Promise<void> {
    const now = Date.now()
    if (!force && (now - this.lastSyncTime) < 60000) return  // 60 秒冷却

    try {
      const { readdirSync, existsSync, statSync, mkdirSync } = require('fs')
      const { join, dirname } = require('path')

      let decryptCount = 0
      let skipCount = 0

      for (const [dbRelPath, keyVal] of Object.entries(this.keysMap)) {
        if (dbRelPath === '__salts__' || typeof keyVal !== 'string') continue

        const srcPath = join(this.dbStoragePath, dbRelPath)
        const dstPath = join(this.decryptedDir, dbRelPath)

        if (!existsSync(srcPath)) continue

        // 增量检测：源文件 mtime > 明文文件 mtime
        const srcMtime = statSync(srcPath).mtimeMs
        let needDecrypt = !existsSync(dstPath)
        if (!needDecrypt) {
          try {
            const dstMtime = statSync(dstPath).mtimeMs
            needDecrypt = srcMtime > dstMtime
          } catch { needDecrypt = true }
        }

        if (force) needDecrypt = true

        if (!needDecrypt) {
          skipCount++
          continue
        }

        // 确保目标目录存在
        mkdirSync(dirname(dstPath), { recursive: true })

        const ok = this._decryptOne(srcPath, dstPath, keyVal)
        if (ok) decryptCount++
      }

      this.lastSyncTime = now
      if (decryptCount > 0 || force) {
        logForDebugging(`[wechat-localdb] 解密完成: ${decryptCount} 个解密, ${skipCount} 个跳过`)
        // 解密后刷新联系人缓存
        this._loadContacts()
      }
    } catch (e) {
      logForDebugging(`[wechat-localdb] _autoSync 失败: ${(e as Error).message}`)
    }
  }

  /** 用 sqlcipher CLI 解密单个 DB 到明文 */
  private _decryptOne(src: string, dst: string, keyHex: string): boolean {
    if (!this.sqlcipherPath) return false
    if (!/^[0-9a-fA-F]+$/.test(keyHex)) throw new Error('Invalid hex key: contains non-hex characters')
    try {
      const { execSync } = require('child_process')
      const { unlinkSync, existsSync } = require('fs')

      // 先删除旧的明文 DB（sqlcipher ATTACH 要求目标不存在或为空）
      if (existsSync(dst)) {
        try { unlinkSync(dst) } catch {}
      }

      // SECURITY: Validate paths contain no SQL injection characters
      const safeDst = dst.replace(/'/g, "''")
      const sql = [
        `PRAGMA key = "x'${keyHex}'"`,
        `PRAGMA cipher_page_size = 4096`,
        `ATTACH DATABASE '${safeDst}' AS plaintext KEY ''`,
        `SELECT sqlcipher_export('plaintext')`,
        `DETACH DATABASE plaintext`,
      ].join(';\n') + ';'

      execSync(
        `printf '%s' ${JSON.stringify(sql)} | ${JSON.stringify(this.sqlcipherPath)} ${JSON.stringify(src)}`,
        { encoding: 'utf-8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }
      )

      return existsSync(dst)
    } catch (e) {
      logForDebugging(`[wechat-localdb] 解密失败 ${src}: ${(e as Error).message}`)
      // 清理可能残留的不完整明文 DB 文件
      try { const { unlinkSync } = require('fs'); unlinkSync(dst) } catch {}
      return false
    }
  }

  /** 查找 sqlcipher 可执行路径 */
  private _findSqlcipher(): string | null {
    const { existsSync } = require('fs')
    const { execSync } = require('child_process')

    // 优先 Homebrew 路径
    const brewPath = '/opt/homebrew/opt/sqlcipher/bin/sqlcipher'
    if (existsSync(brewPath)) return brewPath

    // Intel Mac Homebrew
    const brewPathIntel = '/usr/local/opt/sqlcipher/bin/sqlcipher'
    if (existsSync(brewPathIntel)) return brewPathIntel

    // PATH 搜索
    try {
      const which = execSync('which sqlcipher', { encoding: 'utf-8', timeout: 3000 }).trim()
      if (which && existsSync(which)) return which
    } catch {}

    return null
  }

  /** 加载联系人缓存（从明文 contact.db + stranger.db） */
  private _loadContacts(): void {
    try {
      const { join } = require('path')
      const { existsSync } = require('fs')

      this.contactCache = []

      // contact.db
      const contactDbPath = join(this.decryptedDir, 'contact', 'contact.db')
      if (existsSync(contactDbPath)) {
        const db = this._openDb(contactDbPath)
        if (db) {
          try {
            const rows = db.query("SELECT username, remark, nick_name FROM contact").all() as any[]
            for (const r of rows) {
              this.contactCache.push({
                username: r.username || '',
                remark: r.remark || '',
                nickName: r.nick_name || '',
                isGroup: (r.username || '').includes('@chatroom'),
              })
            }
          } catch {}
          try { db.close() } catch {}
        }
      }

      // stranger.db 也有联系人（非好友）
      const strangerDbPath = join(this.decryptedDir, 'contact', 'stranger.db')
      if (existsSync(strangerDbPath)) {
        const db = this._openDb(strangerDbPath)
        if (db) {
          try {
            const rows = db.query("SELECT username, remark, nick_name FROM stranger").all() as any[]
            for (const r of rows) {
              if (!this.contactCache.find(c => c.username === r.username)) {
                this.contactCache.push({
                  username: r.username || '',
                  remark: r.remark || '',
                  nickName: r.nick_name || '',
                  isGroup: false,
                })
              }
            }
          } catch {}
          try { db.close() } catch {}
        }
      }

      this.contactCacheLoaded = true
      logForDebugging(`[wechat-localdb] 联系人缓存已加载: ${this.contactCache.length} 人`)
    } catch (e) {
      logForDebugging(`[wechat-localdb] _loadContacts 失败: ${(e as Error).message}`)
    }
  }

  /** 模糊匹配联系人名 → username */
  private _resolveUsername(chatName: string): string | null {
    if (!chatName) return null
    if (!this.contactCacheLoaded) this._loadContacts()

    // 1. 精确匹配 username / wxid
    const exact = this.contactCache.find(c => c.username === chatName)
    if (exact) return exact.username

    // 2. 精确匹配 display name（remark 优先）
    const byName = this.contactCache.find(
      c => c.remark === chatName || c.nickName === chatName
    )
    if (byName) return byName.username

    // 3. contains 模糊匹配
    const lower = chatName.toLowerCase()
    const fuzzy = this.contactCache.find(
      c => (c.remark && c.remark.toLowerCase().includes(lower))
        || (c.nickName && c.nickName.toLowerCase().includes(lower))
        || c.username.toLowerCase().includes(lower)
    )
    if (fuzzy) return fuzzy.username

    return null
  }

  /** 找到 username 对应的消息表（遍历明文 message DB） */
  private _findMsgTable(username: string): { dbPath: string; tableName: string } | null {
    try {
      const { createHash } = require('crypto')
      const { join } = require('path')
      const { readdirSync, existsSync } = require('fs')

      const md5 = createHash('md5').update(username).digest('hex')
      const tableName = `Msg_${md5}`

      const msgDir = join(this.decryptedDir, 'message')
      if (!existsSync(msgDir)) return null

      const msgDbs = readdirSync(msgDir)
        .filter((f: string) => /^message_\d+\.db$/.test(f))
        .sort()

      for (const dbFile of msgDbs) {
        const dbPath = join(msgDir, dbFile)
        try {
          const db = this._openDb(dbPath)
          if (!db) continue

          const found = db.query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?1"
          ).get(tableName) as any

          db.close()
          if (found) return { dbPath, tableName }
        } catch {}
      }
    } catch (e) {
      logForDebugging(`[wechat-localdb] _findMsgTable 失败: ${(e as Error).message}`)
    }
    return null
  }

  /** 反查表名 → username（遍历联系人缓存做 md5 匹配） */
  private _tableToUsername(tableName: string): string | null {
    // tableName 格式: Msg_{md5(username)}
    const md5FromTable = tableName.replace('Msg_', '')
    if (md5FromTable.length !== 32) return null

    try {
      const { createHash } = require('crypto')
      for (const c of this.contactCache) {
        const hash = createHash('md5').update(c.username).digest('hex')
        if (hash === md5FromTable) return c.username
      }
    } catch {}
    return null
  }

  /** 解析消息内容：群消息提取发送者，非文本返回类型描述 */
  private _parseMessage(content: string, localType: number, isGroup: boolean): string {
    if (localType !== 1) {
      return `[${MSG_TYPE[localType] || `类型${localType}`}]`
    }

    // 群消息格式: "wxid_xxx:\n实际内容"
    if (isGroup && content.includes(':\n')) {
      const nlIdx = content.indexOf(':\n')
      const sender = content.substring(0, nlIdx)
      const body = content.substring(nlIdx + 2)
      const contact = this.contactCache.find(c => c.username === sender)
      const displaySender = contact?.remark || contact?.nickName || sender
      return `${displaySender}: ${body}`
    }

    return content
  }

  /** 消息类型 → contentType 映射 */
  private _msgContentType(localType: number): 'text' | 'rich_text' | 'image' | 'file' | 'card' | 'system' {
    switch (localType) {
      case 1: return 'text'
      case 3: return 'image'
      case 42: return 'card'
      case 49: return 'file'
      case 10000: case 10002: return 'system'
      default: return 'text'
    }
  }

  /** 打开明文 SQLite DB（bun:sqlite 优先，fallback 到 better-sqlite3） */
  private _openDb(dbPath: string): any | null {
    try {
      const { Database } = require('bun:sqlite')
      return new Database(dbPath, { readonly: true })
    } catch {}

    try {
      const Database = require('better-sqlite3')
      return new Database(dbPath, { readonly: true })
    } catch {}

    return null
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
  create(config?: ConnectorConfig): IMConnector {
    if (config?.mode === 'local-db') return new WechatLocalDBConnector()
    if (config?.mode === 'api') return new WecomAPIConnector()
    // 默认企微 API 模式
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
