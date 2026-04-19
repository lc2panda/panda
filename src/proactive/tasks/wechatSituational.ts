// Input: 定时触发的微信态势感知检查请求（cron 调度）
// Output: 微信全态势感知报告、@提及告警、关键词监控、未回复提醒等主动推送
// Pos: proactive/tasks/ 微信态势感知层，由 taskRegistry 注册调度
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的md。
//
// 2026-04-19 22:07 +08:00 P3-T4-γ 接入 panda-on-desk · A+B+F (system+overlay+badge)
//                          全部 HIGH_PRIVACY 默认 OFF — registry.ts 标 privacy:'high'
//                          严守 byte-equal — 仅追加 desk/bridge.ts 调用

import { pushNotification } from '../../assistant/sense.js'
import { isScenarioEnabled } from '../proactiveConfig.js'
import { logForDebugging } from '../../utils/debug.js'
import { HOME } from '../platform.js'
import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'

// ─── P3-T4-γ desk bridge 接入辅助 — fire-and-forget，永不抛错 ───
// why: HIGH_PRIVACY 场景；registry.ts 标 defaultOn=false 由 dispatcher 层 gate
async function _desk(scenarioId: string, title: string, body: string, opts: {
  level?: 'info' | 'warning' | 'error' | 'success'
  badgeDelta?: number
} = {}): Promise<void> {
  try {
    const { pushNotification: deskPush, bumpBadge, isOnDeskEnabled } =
      await import('../../desk/bridge.js')
    if (!isOnDeskEnabled()) return
    const level = opts.level ?? 'info'
    deskPush({ kind: 'system', level, scenarioId, title, body })
    deskPush({ kind: 'overlay', level, scenarioId, title, body, ttlMs: 6_000 })
    bumpBadge(scenarioId, opts.badgeDelta ?? 1)
  } catch {
    // 桥接失败静默
  }
}

interface SmartCronTask {
  id: string
  description: string
  cron: string
  priority: 'critical' | 'normal' | 'low'
  enabled: boolean
  condition?: () => boolean
  skipIf?: () => boolean
  action: () => Promise<void>
}

// ─── 工具函数 ───

const TAG = '[wechatSituational]'
const DATA_DIR = join(HOME, '.pandacc', 'data', 'wechat-situational')
const STATS_DIR = join(HOME, '.pandacc', 'data', 'wechat-stats')
const CONFIG_DIR = join(HOME, '.pandacc', 'config')
const DECRYPTED_DB_DIR = join(HOME, '.pandacc', 'data', 'wechat-decrypted')

/** 每日统计快照格式 */
interface DailySnapshot {
  date: string
  totalMessages: number
  activeGroups: number
  activePrivate: number
  unread: number
  mentions: number
  hourlyDistribution: number[]
  topGroups: { name: string; count: number }[]
  topContacts: { name: string; count: number }[]
  keywords: Record<string, number>
}

/** 写入每日统计快照 */
function saveDailySnapshot(snapshot: DailySnapshot): void {
  try {
    ensureDir(STATS_DIR)
    writeFileSync(join(STATS_DIR, `${snapshot.date}.json`), JSON.stringify(snapshot, null, 2), 'utf-8')
    logForDebugging(`${TAG} saveDailySnapshot: ${snapshot.date} saved`)
  } catch (e) {
    logForDebugging(`${TAG} saveDailySnapshot failed: ${(e as Error).message}`)
  }
}

/** 读取指定日期的统计快照 */
function loadDailySnapshot(date: string): DailySnapshot | null {
  try {
    const p = join(STATS_DIR, `${date}.json`)
    if (!existsSync(p)) return null
    return JSON.parse(readFileSync(p, 'utf-8'))
  } catch {
    return null
  }
}

/** 读取指定日期范围内的所有快照 */
function loadSnapshotsInRange(startDate: string, endDate: string): DailySnapshot[] {
  const snapshots: DailySnapshot[] = []
  try {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    for (let t = start; t <= end; t += 86400000) {
      const d = new Date(t)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const snap = loadDailySnapshot(dateStr)
      if (snap) snapshots.push(snap)
    }
  } catch {}
  return snapshots
}

/** 生成 ASCII 柱状图（用于月报/季报） */
function asciiBarChart(data: { label: string; value: number }[], maxWidth = 30): string {
  if (data.length === 0) return '（无数据）'
  const maxVal = Math.max(...data.map(d => d.value), 1)
  return data.map(d => {
    const barLen = Math.round(d.value / maxVal * maxWidth)
    const bar = '█'.repeat(barLen) || '▏'
    return `${d.label.padEnd(12)} ${bar} ${d.value}`
  }).join('\n')
}

/** 计算日期字符串（偏移天数） */
function dateOffset(days: number): string {
  const d = new Date(Date.now() + days * 86400000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function ensureDir(dir: string): void {
  try { mkdirSync(dir, { recursive: true }) } catch {}
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 尝试通过 Connector Registry 获取微信 connector */
async function getWechatConnector(): Promise<any | null> {
  try {
    const { getConnectorRegistry } = await import('../../connectors/registry.js')
    const registry = getConnectorRegistry()
    const wechat = registry.getConnector('wechat')
    if (wechat?.status === 'connected') return wechat
  } catch {}
  return null
}

/** 尝试通过 bun:sqlite 直接读取解密后明文 DB */
function openDecryptedDB(dbName: string): any | null {
  try {
    const dbPath = join(DECRYPTED_DB_DIR, dbName)
    if (!existsSync(dbPath)) return null
    const Database = require('bun:sqlite').Database
    return new Database(dbPath, { readonly: true })
  } catch {
    return null
  }
}

interface WechatMessage {
  id: string
  channelId: string
  channelName: string
  senderName: string
  content: string
  timestamp: number
  isMentioned: boolean
  contentType: string
}

/** 获取指定时间范围内的消息（优先 connector，fallback 本地 DB） */
async function fetchMessages(since: number, until: number): Promise<WechatMessage[]> {
  // 方式 1：通过 Connector Registry
  const connector = await getWechatConnector()
  if (connector?.getMessages) {
    try {
      const msgs = await connector.getMessages({ since, until, limit: 10000 })
      return msgs.map((m: any) => ({
        id: m.id,
        channelId: m.channelId,
        channelName: m.channelName || m.channelId,
        senderName: m.senderName || m.senderId,
        content: m.content || '',
        timestamp: m.timestamp,
        isMentioned: m.isMentioned || false,
        contentType: m.contentType || 'text',
      }))
    } catch (e) {
      logForDebugging(`${TAG} connector getMessages failed: ${(e as Error).message}`)
    }
  }

  // 方式 2：直接读取解密后的 session + message DB
  const messages: WechatMessage[] = []
  try {
    const sessionDb = openDecryptedDB('session/session.db')
    if (!sessionDb) return messages

    // 获取会话列表
    const sessions: any[] = sessionDb.query(
      'SELECT * FROM Session WHERE nLastTime >= ? AND nLastTime <= ?'
    ).all(Math.floor(since / 1000), Math.floor(until / 1000))
    sessionDb.close()

    // 遍历分片 message DB 获取消息
    for (let i = 0; i < 20; i++) {
      const msgDb = openDecryptedDB(`message/message_${i}.db`)
      if (!msgDb) continue
      try {
        const tables: any[] = msgDb.query(
          "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Chat_%'"
        ).all()
        for (const { name } of tables) {
          try {
            const rows: any[] = msgDb.query(
              `SELECT * FROM "${name}" WHERE createTime >= ? AND createTime <= ? ORDER BY createTime ASC`
            ).all(Math.floor(since / 1000), Math.floor(until / 1000))
            for (const row of rows) {
              messages.push({
                id: String(row.localId || row.MesLocalID || ''),
                channelId: name.replace('Chat_', ''),
                channelName: name.replace('Chat_', ''),
                senderName: row.talker || row.strTalker || '',
                content: row.content || row.strContent || '',
                timestamp: (row.createTime || 0) * 1000,
                isMentioned: false,
                contentType: row.type === 1 ? 'text' : 'other',
              })
            }
          } catch {}
        }
      } finally {
        try { msgDb.close() } catch {}
      }
    }

    // 尝试从 session 补全 channelName
    const sessionMap = new Map<string, string>()
    for (const s of sessions) {
      const id = s.strUsrName || s.userName || ''
      const name = s.strNickName || s.nickName || id
      if (id) sessionMap.set(id, name)
    }
    for (const msg of messages) {
      if (sessionMap.has(msg.channelId)) {
        msg.channelName = sessionMap.get(msg.channelId)!
      }
    }
  } catch (e) {
    logForDebugging(`${TAG} local DB read failed: ${(e as Error).message}`)
  }

  return messages
}

/** 获取用户昵称（用于 @提及检测） */
function getUserNicknames(): string[] {
  const names: string[] = []
  try {
    const configPath = join(CONFIG_DIR, 'wechat-user.json')
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'))
      if (config.nicknames && Array.isArray(config.nicknames)) {
        names.push(...config.nicknames)
      }
      if (config.nickname) names.push(config.nickname)
    }
  } catch {}
  if (names.length === 0) {
    // fallback：用系统用户名
    names.push(require('os').userInfo().username)
  }
  return names
}

/** 加载用户自定义监控关键词 */
function loadKeywords(): string[] {
  try {
    const kwPath = join(CONFIG_DIR, 'wechat-keywords.json')
    if (existsSync(kwPath)) {
      const kws = JSON.parse(readFileSync(kwPath, 'utf-8'))
      if (Array.isArray(kws)) return kws
    }
  } catch {}
  return ['合同', '截止', '紧急', 'bug', '上线', '发版', '付款']
}

/** 检测消息是否为噪音（红包/表情/系统消息等） */
function isNoiseMessage(content: string, contentType: string): boolean {
  if (contentType === 'system') return true
  if (!content) return true
  // 微信红包
  if (content.includes('<type>2001</type>') || content.includes('[微信红包]')) return true
  // 拼多多/广告链接
  if (content.includes('pinduoduo') || content.includes('pdd.net') || content.includes('yangkeduo')) return true
  // 纯表情
  if (/^\[[\u4e00-\u9fa5]+\]$/.test(content.trim())) return true
  // 系统提示
  if (content.startsWith('<sysmsg') || content.includes('<revokemsg>')) return true
  return false
}

// ─── 场景 1: 每日全态势感知报告 ───

const wechatDailySituational: SmartCronTask = {
  id: 'wechat-daily-situational',
  description: '微信每日全态势感知报告 · WeChat daily situational awareness',
  cron: '0 22 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-daily-situational'),
  action: async () => {
    logForDebugging(`${TAG} wechat-daily-situational: 开始生成日报`)
    try {
      const today = todayStr()
      const dayStart = new Date(today + 'T00:00:00').getTime()
      const dayEnd = new Date(today + 'T23:59:59').getTime()
      const messages = await fetchMessages(dayStart, dayEnd)

      if (messages.length === 0) {
        logForDebugging(`${TAG} wechat-daily-situational: 今日无消息数据`)
        return
      }

      const nicknames = getUserNicknames()
      const keywords = loadKeywords()

      // 统计：按群/会话分组
      const channelMap = new Map<string, WechatMessage[]>()
      for (const msg of messages) {
        const ch = channelMap.get(msg.channelId) || []
        ch.push(msg)
        channelMap.set(msg.channelId, ch)
      }

      // 时段分布（每小时）
      const hourBuckets = new Array(24).fill(0)
      for (const msg of messages) {
        const h = new Date(msg.timestamp).getHours()
        hourBuckets[h]++
      }
      const peakHours = hourBuckets
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .filter(p => p.count > 0)

      // @提及检测
      const mentions: { channelName: string; senderName: string; content: string; time: string }[] = []
      for (const msg of messages) {
        for (const nick of nicknames) {
          if (msg.content.includes(`@${nick}`)) {
            mentions.push({
              channelName: msg.channelName,
              senderName: msg.senderName,
              content: msg.content.slice(0, 80),
              time: formatTime(msg.timestamp),
            })
            break
          }
        }
      }

      // 群聊排行
      const channelRanking = Array.from(channelMap.entries())
        .map(([id, msgs]) => {
          const name = msgs[0]?.channelName || id
          const noiseCount = msgs.filter(m => isNoiseMessage(m.content, m.contentType)).length
          // 关键词命中
          const hitKeywords = new Set<string>()
          for (const m of msgs) {
            for (const kw of keywords) {
              if (m.content.includes(kw)) hitKeywords.add(kw)
            }
          }
          // 是否有 @我
          const hasMention = msgs.some(m =>
            nicknames.some(n => m.content.includes(`@${n}`))
          )
          return {
            id, name,
            total: msgs.length,
            noiseCount,
            hitKeywords: Array.from(hitKeywords),
            hasMention,
          }
        })
        .sort((a, b) => b.total - a.total)

      // 关键词热点
      const kwCounts = new Map<string, { count: number; channels: Set<string> }>()
      for (const msg of messages) {
        for (const kw of keywords) {
          if (msg.content.includes(kw)) {
            const entry = kwCounts.get(kw) || { count: 0, channels: new Set() }
            entry.count++
            entry.channels.add(msg.channelName)
            kwCounts.set(kw, entry)
          }
        }
      }

      // 噪音统计
      const noiseMessages = messages.filter(m => isNoiseMessage(m.content, m.contentType))
      const noiseByChannel = new Map<string, number>()
      for (const m of noiseMessages) {
        noiseByChannel.set(m.channelName, (noiseByChannel.get(m.channelName) || 0) + 1)
      }

      // 情感关键词简单统计
      const positiveWords = ['感谢', '厉害', '加油', '好的', '没问题', '棒', '优秀', '赞']
      const negativeWords = ['紧急', '问题', '失败', '延期', '取消', 'bug', '故障', '崩溃']
      let positiveCount = 0
      let negativeCount = 0
      for (const msg of messages) {
        for (const w of positiveWords) { if (msg.content.includes(w)) positiveCount++ }
        for (const w of negativeWords) { if (msg.content.includes(w)) negativeCount++ }
      }

      // 活跃群 vs 私聊
      const groupChats = channelRanking.filter(c => c.id.includes('@chatroom'))
      const privateChats = channelRanking.filter(c => !c.id.includes('@chatroom'))

      // ─── 生成 Markdown 报告 ───
      const lines: string[] = []
      lines.push(`# 微信态势感知日报 — ${today}`)
      lines.push('')

      // 全局概览
      lines.push('## 📊 全局概览')
      lines.push(`- 今日总消息: ${messages.length.toLocaleString()} 条`)
      lines.push(`- 活跃群聊: ${groupChats.length} 个 | 活跃私聊: ${privateChats.length} 个`)
      lines.push(`- 未读 @提及: ${mentions.length} 次`)
      if (peakHours.length > 0) {
        const peakStr = peakHours
          .map(p => `${String(p.hour).padStart(2, '0')}:00-${String(p.hour + 1).padStart(2, '0')}:00（${p.count} 条）`)
          .join('、')
        lines.push(`- 高峰时段: ${peakStr}`)
      }
      lines.push('')

      // 重点关注
      if (mentions.length > 0) {
        lines.push('## 🔥 重点关注（@提及你的消息）')
        for (const [i, m] of mentions.slice(0, 10).entries()) {
          lines.push(`${i + 1}. 【${m.channelName}】${m.senderName}: "${m.content}" (${m.time})`)
        }
        lines.push('')
      }

      // 群聊活跃度排行
      if (channelRanking.length > 0) {
        lines.push('## 📈 群聊活跃度排行')
        lines.push('| 排名 | 群名 | 消息数 | 关键话题 | 建议 |')
        lines.push('|------|------|--------|---------|------|')
        for (const [i, ch] of channelRanking.slice(0, 15).entries()) {
          const topicStr = ch.hitKeywords.length > 0 ? ch.hitKeywords.join('、') : '—'
          let suggestion = 'ℹ️ 略读即可'
          if (ch.hasMention) suggestion = '⚠️ 有 @你 未读'
          else if (ch.hitKeywords.length > 0) suggestion = '📌 关注关键词'
          else if (ch.noiseCount / ch.total > 0.8) suggestion = '🔇 水群可忽略'
          lines.push(`| ${i + 1} | ${ch.name} | ${ch.total} | ${topicStr} | ${suggestion} |`)
        }
        lines.push('')
      }

      // 关键词热点
      const kwEntries = Array.from(kwCounts.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
      if (kwEntries.length > 0) {
        lines.push('## 🔑 关键词热点')
        for (const [kw, info] of kwEntries) {
          lines.push(`- "${kw}" 出现 ${info.count} 次（${info.channels.size} 个会话）`)
        }
        lines.push('')
      }

      // 噪音统计
      if (noiseMessages.length > 0) {
        lines.push('## 🔇 可忽略（低价值信息）')
        const noiseChannels = Array.from(noiseByChannel.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
        lines.push(`- 低价值消息总计: ${noiseMessages.length} 条（占比 ${Math.round(noiseMessages.length / messages.length * 100)}%）`)
        for (const [name, count] of noiseChannels) {
          lines.push(`  - ${name}: ${count} 条`)
        }
        lines.push('')
      }

      // 情感概览
      lines.push('## 🎭 情感概览')
      lines.push(`- 正面情感关键词: ${positiveCount} 次`)
      lines.push(`- 负面情感关键词: ${negativeCount} 次`)
      const sentiment = positiveCount > negativeCount * 2
        ? '整体氛围积极 😊'
        : negativeCount > positiveCount * 2
          ? '部分会话需关注 ⚠️'
          : '整体氛围中性 😐'
      lines.push(`- 综合判断: ${sentiment}`)
      lines.push('')

      // 建议
      lines.push('## 💡 建议')
      let sugIdx = 1
      if (mentions.length > 0) {
        lines.push(`${sugIdx++}. 优先回复：${mentions.length} 条 @提及消息`)
      }
      const kwChannels = kwEntries.filter(([, info]) => info.count >= 3)
      if (kwChannels.length > 0) {
        lines.push(`${sugIdx++}. 需要关注：关键词 "${kwChannels.map(([kw]) => kw).join('、')}" 出现频率较高`)
      }
      const noiseRatio = messages.length > 0 ? noiseMessages.length / messages.length : 0
      if (noiseRatio > 0.3) {
        lines.push(`${sugIdx++}. 噪音占比 ${Math.round(noiseRatio * 100)}%，建议清理低价值群聊`)
      }
      if (sugIdx === 1) {
        lines.push('1. 今日消息已全面扫描，无需特别关注')
      }
      lines.push('')

      const report = lines.join('\n')

      // 写入报告文件
      ensureDir(DATA_DIR)
      writeFileSync(join(DATA_DIR, `${today}.md`), report, 'utf-8')

      // 写入每日统计快照（供趋势报告使用）
      const topGroupsForSnapshot = channelRanking.slice(0, 20).map(c => ({ name: c.name, count: c.total }))
      const senderCounts = new Map<string, number>()
      for (const msg of messages) {
        senderCounts.set(msg.senderName, (senderCounts.get(msg.senderName) || 0) + 1)
      }
      const topContactsForSnapshot = Array.from(senderCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([name, count]) => ({ name, count }))
      const keywordsForSnapshot: Record<string, number> = {}
      for (const [kw, info] of kwCounts) {
        keywordsForSnapshot[kw] = info.count
      }

      saveDailySnapshot({
        date: today,
        totalMessages: messages.length,
        activeGroups: groupChats.length,
        activePrivate: privateChats.length,
        unread: mentions.length, // 以 @提及数近似未读重要消息
        mentions: mentions.length,
        hourlyDistribution: hourBuckets,
        topGroups: topGroupsForSnapshot,
        topContacts: topContactsForSnapshot,
        keywords: keywordsForSnapshot,
      })

      // 写入工作记忆
      try {
        const { setWorkingMemory } = await import('../../assistant/workingMemory.js')
        setWorkingMemory(`wechat-situational-${today}`, JSON.stringify({
          date: today,
          totalMessages: messages.length,
          activeGroups: groupChats.length,
          activePrivate: privateChats.length,
          mentions: mentions.length,
          topKeywords: kwEntries.slice(0, 5).map(([kw, info]) => `${kw}(${info.count})`),
          sentiment,
        }))
      } catch {}

      // 推送通知
      const dsTitle = '📊 微信态势感知日报'
      const dsBody = `今日 ${messages.length} 条消息，${mentions.length} 条@提及，${groupChats.length} 个活跃群。报告已生成: ${join(DATA_DIR, `${today}.md`)}`
      pushNotification({
        type: 'info',
        title: dsTitle,
        body: dsBody,
        channel: 'all',
      })
      await _desk('wechat-daily-situational', `Panda · ${dsTitle}`, dsBody)

      logForDebugging(`${TAG} wechat-daily-situational: 报告已生成，${messages.length} 条消息`)
    } catch (e) {
      logForDebugging(`${TAG} wechat-daily-situational failed: ${(e as Error).message}`)
    }
  },
}

// ─── 场景 2: @提及实时告警 ───

const wechatMentionAlert: SmartCronTask = {
  id: 'wechat-mention-alert',
  description: '微信 @提及实时告警 · WeChat mention alert',
  cron: '*/10 * * * *',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-mention-alert'),
  action: async () => {
    logForDebugging(`${TAG} wechat-mention-alert: 扫描最近 10 分钟`)
    try {
      const now = Date.now()
      const since = now - 10 * 60 * 1000
      const messages = await fetchMessages(since, now)
      const nicknames = getUserNicknames()

      const mentioned: { channelName: string; senderName: string; content: string; time: string }[] = []
      for (const msg of messages) {
        for (const nick of nicknames) {
          if (msg.content.includes(`@${nick}`)) {
            mentioned.push({
              channelName: msg.channelName,
              senderName: msg.senderName,
              content: msg.content.slice(0, 100),
              time: formatTime(msg.timestamp),
            })
            break
          }
        }
      }

      if (mentioned.length === 0) {
        logForDebugging(`${TAG} wechat-mention-alert: 无 @提及`)
        return
      }

      const detail = mentioned
        .slice(0, 5)
        .map(m => `【${m.channelName}】${m.senderName}: ${m.content}`)
        .join('\n')

      const mentionTitle = '🔔 微信有人@你'
      const mentionBody = `最近 10 分钟内有 ${mentioned.length} 条@提及：\n${detail}`
      pushNotification({
        type: 'action',
        title: mentionTitle,
        body: mentionBody,
        channel: 'all',
      })
      await _desk('wechat-mention-alert', `Panda · ${mentionTitle}`, mentionBody, {
        level: 'warning', badgeDelta: mentioned.length,
      })

      logForDebugging(`${TAG} wechat-mention-alert: ${mentioned.length} mentions found`)
    } catch (e) {
      logForDebugging(`${TAG} wechat-mention-alert failed: ${(e as Error).message}`)
    }
  },
}

// ─── 场景 3: 关键词监控 ───

const wechatKeywordMonitor: SmartCronTask = {
  id: 'wechat-keyword-monitor',
  description: '微信关键词监控 · WeChat keyword monitor',
  cron: '*/15 * * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-keyword-monitor'),
  action: async () => {
    logForDebugging(`${TAG} wechat-keyword-monitor: 扫描最近 15 分钟`)
    try {
      const now = Date.now()
      const since = now - 15 * 60 * 1000
      const messages = await fetchMessages(since, now)
      const keywords = loadKeywords()

      const hits: { keyword: string; channelName: string; senderName: string; content: string; time: string }[] = []
      for (const msg of messages) {
        for (const kw of keywords) {
          if (msg.content.includes(kw)) {
            hits.push({
              keyword: kw,
              channelName: msg.channelName,
              senderName: msg.senderName,
              content: msg.content.slice(0, 100),
              time: formatTime(msg.timestamp),
            })
          }
        }
      }

      if (hits.length === 0) {
        logForDebugging(`${TAG} wechat-keyword-monitor: 无关键词命中`)
        return
      }

      // 按关键词分组
      const byKeyword = new Map<string, typeof hits>()
      for (const h of hits) {
        const arr = byKeyword.get(h.keyword) || []
        arr.push(h)
        byKeyword.set(h.keyword, arr)
      }

      const detail = Array.from(byKeyword.entries())
        .slice(0, 5)
        .map(([kw, items]) => `「${kw}」${items.length} 次 — ${items[0].channelName}: ${items[0].content.slice(0, 50)}`)
        .join('\n')

      const kwTitle = '🔍 微信关键词告警'
      const kwBody = `最近 15 分钟内命中 ${hits.length} 次关键词：\n${detail}`
      pushNotification({
        type: 'info',
        title: kwTitle,
        body: kwBody,
        channel: 'all',
      })
      await _desk('wechat-keyword-monitor', `Panda · ${kwTitle}`, kwBody, {
        badgeDelta: hits.length,
      })

      logForDebugging(`${TAG} wechat-keyword-monitor: ${hits.length} keyword hits`)
    } catch (e) {
      logForDebugging(`${TAG} wechat-keyword-monitor failed: ${(e as Error).message}`)
    }
  },
}

// ─── 场景 4: 未回复提醒 ───

const wechatUnrepliedReminder: SmartCronTask = {
  id: 'wechat-unreplied-reminder',
  description: '微信未回复提醒 · WeChat unreplied message reminder',
  cron: '0 */3 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-unreplied-reminder'),
  action: async () => {
    logForDebugging(`${TAG} wechat-unreplied-reminder: 检查未回复私聊`)
    try {
      const now = Date.now()
      const since = now - 24 * 60 * 60 * 1000
      const messages = await fetchMessages(since, now)
      const nicknames = getUserNicknames()

      // 过滤私聊（非群聊）
      const privateMessages = messages.filter(m => !m.channelId.includes('@chatroom'))

      // 按会话分组，找最后一条消息
      const channelLastMsg = new Map<string, WechatMessage>()
      for (const msg of privateMessages) {
        const existing = channelLastMsg.get(msg.channelId)
        if (!existing || msg.timestamp > existing.timestamp) {
          channelLastMsg.set(msg.channelId, msg)
        }
      }

      // 检查：最后一条消息不是我发的，且距今 > 2 小时
      const twoHoursAgo = now - 2 * 60 * 60 * 1000
      const unreplied: { channelName: string; senderName: string; content: string; time: string }[] = []
      for (const [, lastMsg] of channelLastMsg) {
        // 判断是否是我发的消息（sender 不在我的昵称列表中 → 对方发的）
        const isFromMe = nicknames.some(n => lastMsg.senderName.includes(n))
        if (!isFromMe && lastMsg.timestamp < twoHoursAgo) {
          unreplied.push({
            channelName: lastMsg.channelName,
            senderName: lastMsg.senderName,
            content: lastMsg.content.slice(0, 60),
            time: formatTime(lastMsg.timestamp),
          })
        }
      }

      if (unreplied.length === 0) {
        logForDebugging(`${TAG} wechat-unreplied-reminder: 无未回复消息`)
        return
      }

      const detail = unreplied
        .slice(0, 10)
        .map(u => `  • ${u.channelName}（${u.senderName}）: "${u.content}" (${u.time})`)
        .join('\n')

      const urTitle = '⏰ 微信未回复提醒'
      const urBody = `有 ${unreplied.length} 个私聊超过 2 小时未回复：\n${detail}`
      pushNotification({
        type: 'warning',
        title: urTitle,
        body: urBody,
        channel: 'all',
      })
      await _desk('wechat-unreplied-reminder', `Panda · ${urTitle}`, urBody, {
        level: 'warning', badgeDelta: unreplied.length,
      })

      logForDebugging(`${TAG} wechat-unreplied-reminder: ${unreplied.length} unreplied chats`)
    } catch (e) {
      logForDebugging(`${TAG} wechat-unreplied-reminder failed: ${(e as Error).message}`)
    }
  },
}

// ─── 场景 5: 群聊摘要 ───

const wechatGroupDigest: SmartCronTask = {
  id: 'wechat-group-digest',
  description: '微信群聊摘要 · WeChat group chat digest',
  cron: '0 12,18 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-group-digest'),
  action: async () => {
    logForDebugging(`${TAG} wechat-group-digest: 生成活跃群摘要`)
    try {
      const now = Date.now()
      const since = now - 6 * 60 * 60 * 1000 // 最近 6 小时
      const messages = await fetchMessages(since, now)

      // 按群分组
      const groupMap = new Map<string, WechatMessage[]>()
      for (const msg of messages) {
        if (!msg.channelId.includes('@chatroom')) continue
        const arr = groupMap.get(msg.channelId) || []
        arr.push(msg)
        groupMap.set(msg.channelId, arr)
      }

      // 只处理消息数 > 50 的群
      const activeGroups = Array.from(groupMap.entries())
        .filter(([, msgs]) => msgs.length > 50)
        .sort((a, b) => b[1].length - a[1].length)

      if (activeGroups.length === 0) {
        logForDebugging(`${TAG} wechat-group-digest: 无活跃群（消息数 > 50）`)
        return
      }

      const keywords = loadKeywords()
      const summaries: string[] = []

      for (const [channelId, msgs] of activeGroups.slice(0, 10)) {
        const name = msgs[0]?.channelName || channelId
        // 提取频繁出现的实词（简易方式：关键词命中）
        const hitKws = new Set<string>()
        for (const m of msgs) {
          for (const kw of keywords) {
            if (m.content.includes(kw)) hitKws.add(kw)
          }
        }
        // 提取活跃发言者 top 3
        const senderCount = new Map<string, number>()
        for (const m of msgs) {
          senderCount.set(m.senderName, (senderCount.get(m.senderName) || 0) + 1)
        }
        const topSenders = Array.from(senderCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => `${name}(${count})`)

        summaries.push(`【${name}】${msgs.length} 条 | 关键词: ${hitKws.size > 0 ? Array.from(hitKws).join('、') : '无'} | 活跃: ${topSenders.join('、')}`)
      }

      // 写入工作记忆
      try {
        const { setWorkingMemory } = await import('../../assistant/workingMemory.js')
        setWorkingMemory('wechat-group-digest', summaries.join('\n'))
      } catch {}

      const gdTitle = '📝 微信群聊摘要'
      const gdBody = `${activeGroups.length} 个活跃群（消息 > 50）：\n${summaries.slice(0, 5).join('\n')}`
      pushNotification({
        type: 'info',
        title: gdTitle,
        body: gdBody,
        channel: 'all',
      })
      await _desk('wechat-group-digest', `Panda · ${gdTitle}`, gdBody)

      logForDebugging(`${TAG} wechat-group-digest: ${activeGroups.length} active groups summarized`)
    } catch (e) {
      logForDebugging(`${TAG} wechat-group-digest failed: ${(e as Error).message}`)
    }
  },
}

// ─── 场景 6: 联系人洞察 ───

const wechatContactInsights: SmartCronTask = {
  id: 'wechat-contact-insights',
  description: '微信联系人洞察 · WeChat contact insights (weekly)',
  cron: '0 21 * * 5',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-contact-insights'),
  action: async () => {
    logForDebugging(`${TAG} wechat-contact-insights: 生成周度联系人洞察`)
    try {
      const now = Date.now()
      const thisWeekStart = now - 7 * 24 * 60 * 60 * 1000
      const lastWeekStart = thisWeekStart - 7 * 24 * 60 * 60 * 1000

      const thisWeekMsgs = await fetchMessages(thisWeekStart, now)
      const lastWeekMsgs = await fetchMessages(lastWeekStart, thisWeekStart)

      // 按联系人统计消息数
      const countBySender = (msgs: WechatMessage[]): Map<string, number> => {
        const map = new Map<string, number>()
        for (const m of msgs) {
          map.set(m.senderName, (map.get(m.senderName) || 0) + 1)
        }
        return map
      }

      const thisWeekCounts = countBySender(thisWeekMsgs)
      const lastWeekCounts = countBySender(lastWeekMsgs)

      // 突然沉默的人（上周活跃，本周消失）
      const silenced: { name: string; lastWeek: number }[] = []
      for (const [name, lastCount] of lastWeekCounts) {
        if (lastCount >= 5 && (!thisWeekCounts.has(name) || thisWeekCounts.get(name)! < 2)) {
          silenced.push({ name, lastWeek: lastCount })
        }
      }
      silenced.sort((a, b) => b.lastWeek - a.lastWeek)

      // 突然活跃的人（上周不活跃，本周活跃）
      const activated: { name: string; thisWeek: number }[] = []
      for (const [name, thisCount] of thisWeekCounts) {
        if (thisCount >= 5 && (!lastWeekCounts.has(name) || lastWeekCounts.get(name)! < 2)) {
          activated.push({ name, thisWeek: thisCount })
        }
      }
      activated.sort((a, b) => b.thisWeek - a.thisWeek)

      const lines: string[] = []
      lines.push(`# 微信联系人洞察 — ${todayStr()}`)
      lines.push('')
      lines.push(`## 本周互动统计`)
      lines.push(`- 本周活跃联系人: ${thisWeekCounts.size} 人`)
      lines.push(`- 上周活跃联系人: ${lastWeekCounts.size} 人`)
      lines.push('')

      if (silenced.length > 0) {
        lines.push('## 😶 突然沉默（上周活跃，本周消失）')
        for (const s of silenced.slice(0, 10)) {
          lines.push(`- ${s.name}（上周 ${s.lastWeek} 条，本周几乎无消息）`)
        }
        lines.push('')
      }

      if (activated.length > 0) {
        lines.push('## 🔥 突然活跃（上周沉默，本周活跃）')
        for (const a of activated.slice(0, 10)) {
          lines.push(`- ${a.name}（本周 ${a.thisWeek} 条，上周几乎无消息）`)
        }
        lines.push('')
      }

      const report = lines.join('\n')
      ensureDir(DATA_DIR)
      writeFileSync(join(DATA_DIR, `contacts-${todayStr()}.md`), report, 'utf-8')

      // 写入工作记忆
      try {
        const { setWorkingMemory } = await import('../../assistant/workingMemory.js')
        setWorkingMemory('wechat-contact-insights', JSON.stringify({
          date: todayStr(),
          activeContacts: thisWeekCounts.size,
          silenced: silenced.slice(0, 5).map(s => s.name),
          activated: activated.slice(0, 5).map(a => a.name),
        }))
      } catch {}

      const ciTitle = '👤 微信联系人周报'
      const ciBody = `本周 ${thisWeekCounts.size} 人互动。${silenced.length > 0 ? `${silenced.length} 人突然沉默。` : ''}${activated.length > 0 ? `${activated.length} 人突然活跃。` : ''}`
      pushNotification({
        type: 'info',
        title: ciTitle,
        body: ciBody,
        channel: 'all',
      })
      await _desk('wechat-contact-insights', `Panda · ${ciTitle}`, ciBody)

      logForDebugging(`${TAG} wechat-contact-insights: silenced=${silenced.length} activated=${activated.length}`)
    } catch (e) {
      logForDebugging(`${TAG} wechat-contact-insights failed: ${(e as Error).message}`)
    }
  },
}

// ─── 场景 7: 噪音过滤建议 ───

const wechatNoiseFilter: SmartCronTask = {
  id: 'wechat-noise-filter',
  description: '微信噪音过滤建议 · WeChat noise filter suggestion (weekly)',
  cron: '0 22 * * 0',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-noise-filter'),
  action: async () => {
    logForDebugging(`${TAG} wechat-noise-filter: 分析本周低价值群`)
    try {
      const now = Date.now()
      const since = now - 7 * 24 * 60 * 60 * 1000
      const messages = await fetchMessages(since, now)

      // 只看群聊
      const groupMap = new Map<string, WechatMessage[]>()
      for (const msg of messages) {
        if (!msg.channelId.includes('@chatroom')) continue
        const arr = groupMap.get(msg.channelId) || []
        arr.push(msg)
        groupMap.set(msg.channelId, arr)
      }

      const noiseGroups: { name: string; total: number; noiseCount: number; ratio: number }[] = []
      for (const [, msgs] of groupMap) {
        const name = msgs[0]?.channelName || msgs[0]?.channelId || '未知'
        const noiseCount = msgs.filter(m => isNoiseMessage(m.content, m.contentType)).length
        const ratio = msgs.length > 0 ? noiseCount / msgs.length : 0
        if (ratio > 0.8 && msgs.length >= 20) {
          noiseGroups.push({ name, total: msgs.length, noiseCount, ratio })
        }
      }

      noiseGroups.sort((a, b) => b.ratio - a.ratio)

      if (noiseGroups.length === 0) {
        logForDebugging(`${TAG} wechat-noise-filter: 无高噪音群`)
        return
      }

      const detail = noiseGroups
        .slice(0, 10)
        .map(g => `  • ${g.name}（${g.total} 条，噪音占 ${Math.round(g.ratio * 100)}%）`)
        .join('\n')

      const nfTitle = '🔇 微信噪音群建议'
      const nfBody = `本周发现 ${noiseGroups.length} 个高噪音群（低价值消息 > 80%）：\n${detail}\n建议考虑屏蔽或退出。`
      pushNotification({
        type: 'info',
        title: nfTitle,
        body: nfBody,
        channel: 'all',
      })
      await _desk('wechat-noise-filter', `Panda · ${nfTitle}`, nfBody)

      logForDebugging(`${TAG} wechat-noise-filter: ${noiseGroups.length} noise groups found`)
    } catch (e) {
      logForDebugging(`${TAG} wechat-noise-filter failed: ${(e as Error).message}`)
    }
  },
}

// ─── 场景 8: 情感脉搏 ───

const wechatSentimentPulse: SmartCronTask = {
  id: 'wechat-sentiment-pulse',
  description: '微信情感脉搏 · WeChat sentiment pulse (daily)',
  cron: '0 21 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-sentiment-pulse'),
  action: async () => {
    logForDebugging(`${TAG} wechat-sentiment-pulse: 分析今日情感`)
    try {
      const today = todayStr()
      const dayStart = new Date(today + 'T00:00:00').getTime()
      const now = Date.now()
      const messages = await fetchMessages(dayStart, now)

      if (messages.length === 0) {
        logForDebugging(`${TAG} wechat-sentiment-pulse: 今日无消息`)
        return
      }

      const positiveWords = ['感谢', '厉害', '加油', '好的', '没问题', '棒', '优秀', '赞', '开心', '恭喜', '完美', '辛苦了']
      const negativeWords = ['紧急', '问题', '失败', '延期', '取消', 'bug', '故障', '崩溃', '烦', '生气', '糟糕', '差']

      let posCount = 0
      let negCount = 0
      const posChannels = new Set<string>()
      const negChannels = new Set<string>()

      for (const msg of messages) {
        let isPos = false
        let isNeg = false
        for (const w of positiveWords) {
          if (msg.content.includes(w)) { isPos = true; break }
        }
        for (const w of negativeWords) {
          if (msg.content.includes(w)) { isNeg = true; break }
        }
        if (isPos) { posCount++; posChannels.add(msg.channelName) }
        if (isNeg) { negCount++; negChannels.add(msg.channelName) }
      }

      const total = messages.length
      const posRatio = Math.round(posCount / total * 100)
      const negRatio = Math.round(negCount / total * 100)
      const neutralRatio = 100 - posRatio - negRatio

      let emoji = '😐'
      let label = '中性'
      if (posRatio > negRatio * 2) { emoji = '😊'; label = '积极' }
      else if (negRatio > posRatio * 2) { emoji = '😟'; label = '消极' }

      const body = [
        `今日 ${total} 条消息情感分布：`,
        `  ${emoji} 整体: ${label}`,
        `  ✅ 正面: ${posCount} 条（${posRatio}%）— ${posChannels.size} 个会话`,
        `  ❌ 负面: ${negCount} 条（${negRatio}%）— ${negChannels.size} 个会话`,
        `  ⚪ 中性: ${neutralRatio}%`,
      ].join('\n')

      // 写入工作记忆
      try {
        const { setWorkingMemory } = await import('../../assistant/workingMemory.js')
        setWorkingMemory('wechat-sentiment', JSON.stringify({
          date: today,
          total,
          positive: posCount,
          negative: negCount,
          label,
        }))
      } catch {}

      const spTitle = `🎭 微信情感脉搏 — ${label}`
      pushNotification({
        type: 'info',
        title: spTitle,
        body,
        channel: 'all',
      })
      await _desk('wechat-sentiment-pulse', `Panda · ${spTitle}`, body, {
        level: label === '消极' ? 'warning' : 'info',
      })

      logForDebugging(`${TAG} wechat-sentiment-pulse: pos=${posCount} neg=${negCount} total=${total}`)
    } catch (e) {
      logForDebugging(`${TAG} wechat-sentiment-pulse failed: ${(e as Error).message}`)
    }
  },
}

// ─── 场景 9: 每周趋势 ───

const wechatWeeklyTrend: SmartCronTask = {
  id: 'wechat-weekly-trend',
  description: '微信每周趋势报告 · WeChat weekly trend report',
  cron: '0 21 * * 5',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-weekly-trend'),
  action: async () => {
    logForDebugging(`${TAG} wechat-weekly-trend: 生成周趋势报告`)
    try {
      const today = todayStr()
      // 本周快照（最近 7 天）
      const thisWeekSnapshots = loadSnapshotsInRange(dateOffset(-6), today)
      // 上周快照
      const lastWeekSnapshots = loadSnapshotsInRange(dateOffset(-13), dateOffset(-7))

      if (thisWeekSnapshots.length === 0) {
        logForDebugging(`${TAG} wechat-weekly-trend: 本周无快照数据`)
        return
      }

      const thisWeekTotal = thisWeekSnapshots.reduce((s, d) => s + d.totalMessages, 0)
      const lastWeekTotal = lastWeekSnapshots.reduce((s, d) => s + d.totalMessages, 0)
      const changePercent = lastWeekTotal > 0 ? Math.round((thisWeekTotal - lastWeekTotal) / lastWeekTotal * 100) : 0
      const changeSign = changePercent >= 0 ? '+' : ''

      // 本周活跃群排名
      const groupTotals = new Map<string, number>()
      for (const snap of thisWeekSnapshots) {
        for (const g of snap.topGroups) {
          groupTotals.set(g.name, (groupTotals.get(g.name) || 0) + g.count)
        }
      }
      const topGroups = Array.from(groupTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      // 高频关键词对比
      const thisWeekKw = new Map<string, number>()
      const lastWeekKw = new Map<string, number>()
      for (const snap of thisWeekSnapshots) {
        for (const [kw, cnt] of Object.entries(snap.keywords)) {
          thisWeekKw.set(kw, (thisWeekKw.get(kw) || 0) + cnt)
        }
      }
      for (const snap of lastWeekSnapshots) {
        for (const [kw, cnt] of Object.entries(snap.keywords)) {
          lastWeekKw.set(kw, (lastWeekKw.get(kw) || 0) + cnt)
        }
      }

      // 联系人变化
      const thisWeekContacts = new Set<string>()
      const lastWeekContacts = new Set<string>()
      for (const snap of thisWeekSnapshots) {
        for (const c of snap.topContacts) thisWeekContacts.add(c.name)
      }
      for (const snap of lastWeekSnapshots) {
        for (const c of snap.topContacts) lastWeekContacts.add(c.name)
      }
      const newContacts = Array.from(thisWeekContacts).filter(c => !lastWeekContacts.has(c))

      const lines: string[] = []
      lines.push(`# 微信周趋势报告 — ${today}`)
      lines.push('')
      lines.push('## 📊 消息量趋势')
      lines.push(`- 本周总消息: ${thisWeekTotal.toLocaleString()} 条（${changeSign}${changePercent}%）`)
      lines.push(`- 上周总消息: ${lastWeekTotal.toLocaleString()} 条`)
      lines.push('')

      // 每日消息量柱状图
      lines.push('## 📈 每日消息量')
      const dailyData = thisWeekSnapshots.map(s => ({
        label: s.date.slice(5),
        value: s.totalMessages,
      }))
      lines.push('```')
      lines.push(asciiBarChart(dailyData))
      lines.push('```')
      lines.push('')

      if (topGroups.length > 0) {
        lines.push('## 🏆 本周活跃群 Top 10')
        for (const [i, [name, count]] of topGroups.entries()) {
          lines.push(`${i + 1}. ${name} — ${count} 条`)
        }
        lines.push('')
      }

      if (newContacts.length > 0) {
        lines.push(`## 🆕 新增活跃联系人（${newContacts.length} 人）`)
        lines.push(newContacts.slice(0, 10).map(n => `- ${n}`).join('\n'))
        lines.push('')
      }

      // 关键词趋势
      const kwTrend = Array.from(thisWeekKw.entries())
        .map(([kw, cnt]) => {
          const lastCnt = lastWeekKw.get(kw) || 0
          const diff = lastCnt > 0 ? Math.round((cnt - lastCnt) / lastCnt * 100) : 100
          return { kw, cnt, diff }
        })
        .sort((a, b) => b.cnt - a.cnt)
        .slice(0, 10)

      if (kwTrend.length > 0) {
        lines.push('## 🔑 关键词趋势')
        for (const k of kwTrend) {
          const arrow = k.diff > 0 ? '↑' : k.diff < 0 ? '↓' : '→'
          lines.push(`- "${k.kw}" ${k.cnt} 次 ${arrow}${Math.abs(k.diff)}%`)
        }
        lines.push('')
      }

      const report = lines.join('\n')
      ensureDir(DATA_DIR)
      writeFileSync(join(DATA_DIR, `weekly-${today}.md`), report, 'utf-8')

      const wtTitle = '📈 微信周趋势报告'
      const wtBody = `本周 ${thisWeekTotal.toLocaleString()} 条消息（${changeSign}${changePercent}%），${topGroups.length} 个活跃群`
      pushNotification({
        type: 'info',
        title: wtTitle,
        body: wtBody,
        channel: 'all',
      })
      await _desk('wechat-weekly-trend', `Panda · ${wtTitle}`, wtBody)

      logForDebugging(`${TAG} wechat-weekly-trend: report generated`)
    } catch (e) {
      logForDebugging(`${TAG} wechat-weekly-trend failed: ${(e as Error).message}`)
    }
  },
}

// ─── 场景 10: 月度报告 ───

const wechatMonthlyReport: SmartCronTask = {
  id: 'wechat-monthly-report',
  description: '微信月度深度分析 · WeChat monthly report',
  cron: '0 21 1 * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-monthly-report'),
  action: async () => {
    logForDebugging(`${TAG} wechat-monthly-report: 生成月度报告`)
    try {
      const today = todayStr()
      const snapshots = loadSnapshotsInRange(dateOffset(-30), dateOffset(-1))

      if (snapshots.length === 0) {
        logForDebugging(`${TAG} wechat-monthly-report: 无快照数据`)
        return
      }

      const totalMessages = snapshots.reduce((s, d) => s + d.totalMessages, 0)
      const avgDaily = Math.round(totalMessages / snapshots.length)
      const peakDay = snapshots.reduce((max, s) => s.totalMessages > max.totalMessages ? s : max, snapshots[0])
      const quietDay = snapshots.reduce((min, s) => s.totalMessages < min.totalMessages ? s : min, snapshots[0])

      // 消息量曲线（ASCII）
      const dailyCurve = snapshots.map(s => ({
        label: s.date.slice(5),
        value: s.totalMessages,
      }))

      // 社交圈层分析
      const contactTotals = new Map<string, number>()
      for (const snap of snapshots) {
        for (const c of snap.topContacts) {
          contactTotals.set(c.name, (contactTotals.get(c.name) || 0) + c.count)
        }
      }
      const sortedContacts = Array.from(contactTotals.entries()).sort((a, b) => b[1] - a[1])
      const coreCircle = sortedContacts.slice(0, 5)  // 核心圈
      const activeCircle = sortedContacts.slice(5, 20) // 活跃圈
      const outerCircle = sortedContacts.slice(20) // 外围圈

      // 群健康度
      const groupTotals = new Map<string, number>()
      const groupDaysActive = new Map<string, number>()
      for (const snap of snapshots) {
        for (const g of snap.topGroups) {
          groupTotals.set(g.name, (groupTotals.get(g.name) || 0) + g.count)
          groupDaysActive.set(g.name, (groupDaysActive.get(g.name) || 0) + 1)
        }
      }

      // 关键词月度趋势
      const kwTotals = new Map<string, number>()
      for (const snap of snapshots) {
        for (const [kw, cnt] of Object.entries(snap.keywords)) {
          kwTotals.set(kw, (kwTotals.get(kw) || 0) + cnt)
        }
      }
      const topKws = Array.from(kwTotals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15)

      // 时段分布汇总
      const hourlySum = new Array(24).fill(0)
      for (const snap of snapshots) {
        for (let h = 0; h < 24; h++) {
          hourlySum[h] += snap.hourlyDistribution[h] || 0
        }
      }

      const lines: string[] = []
      lines.push(`# 微信月度深度分析 — ${today}`)
      lines.push(`> 统计周期：${snapshots[0].date} ~ ${snapshots[snapshots.length - 1].date}（${snapshots.length} 天数据）`)
      lines.push('')

      lines.push('## 📊 月度概览')
      lines.push(`- 总消息: ${totalMessages.toLocaleString()} 条`)
      lines.push(`- 日均消息: ${avgDaily} 条`)
      lines.push(`- 峰值日: ${peakDay.date}（${peakDay.totalMessages} 条）`)
      lines.push(`- 最安静: ${quietDay.date}（${quietDay.totalMessages} 条）`)
      lines.push('')

      lines.push('## 📈 消息量曲线')
      lines.push('```')
      lines.push(asciiBarChart(dailyCurve))
      lines.push('```')
      lines.push('')

      lines.push('## 🕐 沟通模式（时段分布）')
      const peakHour = hourlySum.indexOf(Math.max(...hourlySum))
      lines.push(`- 最活跃时段: ${peakHour}:00-${peakHour + 1}:00（${hourlySum[peakHour]} 条）`)
      const morningSum = hourlySum.slice(6, 12).reduce((a, b) => a + b, 0)
      const afternoonSum = hourlySum.slice(12, 18).reduce((a, b) => a + b, 0)
      const eveningSum = hourlySum.slice(18, 24).reduce((a, b) => a + b, 0)
      lines.push(`- 上午(6-12): ${morningSum} 条 | 下午(12-18): ${afternoonSum} 条 | 晚上(18-24): ${eveningSum} 条`)
      lines.push('')

      lines.push('## 👥 社交圈层')
      if (coreCircle.length > 0) {
        lines.push(`### 核心圈（Top 5）`)
        for (const [name, count] of coreCircle) {
          lines.push(`- ${name}: ${count} 条`)
        }
      }
      lines.push(`- 活跃圈: ${activeCircle.length} 人`)
      lines.push(`- 外围圈: ${outerCircle.length} 人`)
      lines.push('')

      if (topKws.length > 0) {
        lines.push('## 🔑 关键词趋势')
        for (const [kw, cnt] of topKws) {
          lines.push(`- "${kw}" — ${cnt} 次`)
        }
        lines.push('')
      }

      const report = lines.join('\n')
      ensureDir(DATA_DIR)
      writeFileSync(join(DATA_DIR, `monthly-${today}.md`), report, 'utf-8')

      try {
        const { setWorkingMemory } = await import('../../assistant/workingMemory.js')
        setWorkingMemory('wechat-monthly-report', JSON.stringify({
          date: today, totalMessages, avgDaily,
          peakDay: peakDay.date, coreCircle: coreCircle.map(([n]) => n),
        }))
      } catch {}

      const mrTitle = '📅 微信月度报告'
      const mrBody = `过去 ${snapshots.length} 天共 ${totalMessages.toLocaleString()} 条消息，日均 ${avgDaily} 条`
      pushNotification({
        type: 'info',
        title: mrTitle,
        body: mrBody,
        channel: 'all',
      })
      await _desk('wechat-monthly-report', `Panda · ${mrTitle}`, mrBody)

      logForDebugging(`${TAG} wechat-monthly-report: report generated, ${snapshots.length} days`)
    } catch (e) {
      logForDebugging(`${TAG} wechat-monthly-report failed: ${(e as Error).message}`)
    }
  },
}

// ─── 场景 11: 季度复盘 ───

const wechatQuarterlyReview: SmartCronTask = {
  id: 'wechat-quarterly-review',
  description: '微信季度复盘 · WeChat quarterly review',
  cron: '0 21 1 1,4,7,10 *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-quarterly-review'),
  action: async () => {
    logForDebugging(`${TAG} wechat-quarterly-review: 生成季度复盘`)
    try {
      const today = todayStr()
      const snapshots = loadSnapshotsInRange(dateOffset(-90), dateOffset(-1))

      if (snapshots.length < 7) {
        logForDebugging(`${TAG} wechat-quarterly-review: 数据不足（${snapshots.length} 天）`)
        return
      }

      const totalMessages = snapshots.reduce((s, d) => s + d.totalMessages, 0)
      const avgDaily = Math.round(totalMessages / snapshots.length)

      // 按月分组
      const monthlyTotals = new Map<string, number>()
      for (const snap of snapshots) {
        const month = snap.date.slice(0, 7)
        monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + snap.totalMessages)
      }

      // 社交网络变化：比较前半季度 vs 后半季度
      const mid = Math.floor(snapshots.length / 2)
      const firstHalf = snapshots.slice(0, mid)
      const secondHalf = snapshots.slice(mid)

      const contactCount = (snaps: DailySnapshot[]) => {
        const set = new Set<string>()
        for (const s of snaps) for (const c of s.topContacts) set.add(c.name)
        return set
      }
      const firstContacts = contactCount(firstHalf)
      const secondContacts = contactCount(secondHalf)
      const lostContacts = Array.from(firstContacts).filter(c => !secondContacts.has(c))
      const gainedContacts = Array.from(secondContacts).filter(c => !firstContacts.has(c))

      // 群生命周期
      const groupFirstSeen = new Map<string, string>()
      const groupLastSeen = new Map<string, string>()
      for (const snap of snapshots) {
        for (const g of snap.topGroups) {
          if (!groupFirstSeen.has(g.name)) groupFirstSeen.set(g.name, snap.date)
          groupLastSeen.set(g.name, snap.date)
        }
      }

      // 高价值联系人（持续活跃）
      const contactDays = new Map<string, number>()
      for (const snap of snapshots) {
        for (const c of snap.topContacts) {
          contactDays.set(c.name, (contactDays.get(c.name) || 0) + 1)
        }
      }
      const highValueContacts = Array.from(contactDays.entries())
        .filter(([, days]) => days >= snapshots.length * 0.5)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      const lines: string[] = []
      lines.push(`# 微信季度复盘 — ${today}`)
      lines.push(`> 统计周期：${snapshots[0].date} ~ ${snapshots[snapshots.length - 1].date}（${snapshots.length} 天）`)
      lines.push('')
      lines.push('## 📊 季度概览')
      lines.push(`- 总消息: ${totalMessages.toLocaleString()} 条，日均 ${avgDaily}`)
      lines.push('')

      lines.push('## 📈 月度消息量')
      for (const [month, total] of monthlyTotals) {
        lines.push(`- ${month}: ${total.toLocaleString()} 条`)
      }
      lines.push('')

      lines.push('## 🔄 社交网络变化')
      lines.push(`- 前半季度活跃: ${firstContacts.size} 人 → 后半季度: ${secondContacts.size} 人`)
      if (gainedContacts.length > 0) {
        lines.push(`- 新增活跃: ${gainedContacts.slice(0, 10).join('、')}`)
      }
      if (lostContacts.length > 0) {
        lines.push(`- 逐渐沉默: ${lostContacts.slice(0, 10).join('、')}`)
      }
      lines.push('')

      if (highValueContacts.length > 0) {
        lines.push('## ⭐ 高价值联系人（持续互动 > 50% 天数）')
        for (const [name, days] of highValueContacts) {
          lines.push(`- ${name}（活跃 ${days}/${snapshots.length} 天）`)
        }
        lines.push('')
      }

      lines.push('## 📦 群生命周期')
      lines.push(`- 本季度活跃群: ${groupFirstSeen.size} 个`)
      const longLived = Array.from(groupFirstSeen.entries())
        .filter(([name]) => {
          const first = new Date(groupFirstSeen.get(name)!).getTime()
          const last = new Date(groupLastSeen.get(name)!).getTime()
          return (last - first) > 60 * 86400000
        })
      if (longLived.length > 0) {
        lines.push(`- 持续活跃 > 60 天: ${longLived.length} 个`)
      }
      lines.push('')

      const report = lines.join('\n')
      ensureDir(DATA_DIR)
      writeFileSync(join(DATA_DIR, `quarterly-${today}.md`), report, 'utf-8')

      const qrTitle = '📋 微信季度复盘'
      const qrBody = `过去 ${snapshots.length} 天共 ${totalMessages.toLocaleString()} 条消息，${highValueContacts.length} 个高价值联系人`
      pushNotification({
        type: 'info',
        title: qrTitle,
        body: qrBody,
        channel: 'all',
      })
      await _desk('wechat-quarterly-review', `Panda · ${qrTitle}`, qrBody)

      logForDebugging(`${TAG} wechat-quarterly-review: report generated`)
    } catch (e) {
      logForDebugging(`${TAG} wechat-quarterly-review failed: ${(e as Error).message}`)
    }
  },
}

// ─── 场景 12: 年度总结 ───

const wechatYearlyDigest: SmartCronTask = {
  id: 'wechat-yearly-digest',
  description: '微信年度总结 · WeChat yearly digest',
  cron: '0 21 31 12 *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-yearly-digest'),
  action: async () => {
    logForDebugging(`${TAG} wechat-yearly-digest: 生成年度总结`)
    try {
      const year = new Date().getFullYear()
      const snapshots = loadSnapshotsInRange(`${year}-01-01`, `${year}-12-31`)

      if (snapshots.length < 30) {
        logForDebugging(`${TAG} wechat-yearly-digest: 数据不足（${snapshots.length} 天）`)
        return
      }

      const totalMessages = snapshots.reduce((s, d) => s + d.totalMessages, 0)
      const avgDaily = Math.round(totalMessages / snapshots.length)
      const totalMentions = snapshots.reduce((s, d) => s + d.mentions, 0)

      // Top 10 群
      const groupTotals = new Map<string, number>()
      for (const snap of snapshots) {
        for (const g of snap.topGroups) {
          groupTotals.set(g.name, (groupTotals.get(g.name) || 0) + g.count)
        }
      }
      const top10Groups = Array.from(groupTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      // Top 10 联系人
      const contactTotals = new Map<string, number>()
      for (const snap of snapshots) {
        for (const c of snap.topContacts) {
          contactTotals.set(c.name, (contactTotals.get(c.name) || 0) + c.count)
        }
      }
      const top10Contacts = Array.from(contactTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      // 关键词云
      const kwTotals = new Map<string, number>()
      for (const snap of snapshots) {
        for (const [kw, cnt] of Object.entries(snap.keywords)) {
          kwTotals.set(kw, (kwTotals.get(kw) || 0) + cnt)
        }
      }
      const topKws = Array.from(kwTotals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20)

      // 月度趋势
      const monthlyTotals = new Map<string, number>()
      for (const snap of snapshots) {
        const month = snap.date.slice(0, 7)
        monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + snap.totalMessages)
      }

      // 圈层演变（按季度）
      const quarterContacts = new Map<string, Set<string>>()
      for (const snap of snapshots) {
        const month = parseInt(snap.date.slice(5, 7))
        const q = `Q${Math.ceil(month / 3)}`
        if (!quarterContacts.has(q)) quarterContacts.set(q, new Set())
        for (const c of snap.topContacts) quarterContacts.get(q)!.add(c.name)
      }

      // 峰值日
      const peakDay = snapshots.reduce((max, s) => s.totalMessages > max.totalMessages ? s : max, snapshots[0])

      const lines: string[] = []
      lines.push(`# 微信 ${year} 年度总结`)
      lines.push(`> 全年 ${snapshots.length} 天数据`)
      lines.push('')
      lines.push('## 📊 年度概览')
      lines.push(`- 全年总消息: ${totalMessages.toLocaleString()} 条`)
      lines.push(`- 日均消息: ${avgDaily} 条`)
      lines.push(`- 被@提及: ${totalMentions} 次`)
      lines.push(`- 峰值日: ${peakDay.date}（${peakDay.totalMessages} 条）`)
      lines.push('')

      lines.push('## 📈 月度消息量')
      lines.push('```')
      lines.push(asciiBarChart(
        Array.from(monthlyTotals.entries()).map(([m, v]) => ({ label: m, value: v }))
      ))
      lines.push('```')
      lines.push('')

      lines.push('## 🏆 Top 10 群聊')
      for (const [i, [name, count]] of top10Groups.entries()) {
        lines.push(`${i + 1}. ${name} — ${count.toLocaleString()} 条`)
      }
      lines.push('')

      lines.push('## 👤 Top 10 联系人')
      for (const [i, [name, count]] of top10Contacts.entries()) {
        lines.push(`${i + 1}. ${name} — ${count.toLocaleString()} 条`)
      }
      lines.push('')

      if (topKws.length > 0) {
        lines.push('## ☁️ 年度关键词云')
        lines.push(topKws.map(([kw, cnt]) => `${kw}(${cnt})`).join(' · '))
        lines.push('')
      }

      lines.push('## 🔄 社交圈层演变')
      for (const [q, contacts] of quarterContacts) {
        lines.push(`- ${q}: ${contacts.size} 人活跃`)
      }
      lines.push('')

      // 年度最佳
      lines.push('## 🎖️ 年度之最')
      if (top10Contacts.length > 0) lines.push(`- 最佳话友: ${top10Contacts[0][0]}（${top10Contacts[0][1].toLocaleString()} 条）`)
      if (top10Groups.length > 0) lines.push(`- 最热群聊: ${top10Groups[0][0]}（${top10Groups[0][1].toLocaleString()} 条）`)
      lines.push(`- 最繁忙一天: ${peakDay.date}（${peakDay.totalMessages} 条）`)
      lines.push('')

      const report = lines.join('\n')
      ensureDir(DATA_DIR)
      writeFileSync(join(DATA_DIR, `yearly-${year}.md`), report, 'utf-8')

      const ydTitle = `🎉 微信 ${year} 年度总结`
      const ydBody = `全年 ${totalMessages.toLocaleString()} 条消息，${top10Contacts.length > 0 ? `最佳话友: ${top10Contacts[0][0]}` : ''}`
      pushNotification({
        type: 'info',
        title: ydTitle,
        body: ydBody,
        channel: 'all',
      })
      await _desk('wechat-yearly-digest', `Panda · ${ydTitle}`, ydBody)

      logForDebugging(`${TAG} wechat-yearly-digest: report generated for ${year}`)
    } catch (e) {
      logForDebugging(`${TAG} wechat-yearly-digest failed: ${(e as Error).message}`)
    }
  },
}

// ─── 场景 13: VIP 联系人健康度 ───

const wechatRelationshipHealth: SmartCronTask = {
  id: 'wechat-relationship-health',
  description: '微信 VIP 联系人关系健康度 · WeChat relationship health',
  cron: '0 21 * * 0',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-relationship-health'),
  action: async () => {
    logForDebugging(`${TAG} wechat-relationship-health: 分析 VIP 联系人`)
    try {
      // 读取 VIP 配置
      let vipList: string[] = []
      try {
        const vipPath = join(CONFIG_DIR, 'wechat-vip.json')
        if (existsSync(vipPath)) {
          const config = JSON.parse(readFileSync(vipPath, 'utf-8'))
          if (Array.isArray(config)) vipList = config
          else if (config.contacts && Array.isArray(config.contacts)) vipList = config.contacts
        }
      } catch {}

      if (vipList.length === 0) {
        logForDebugging(`${TAG} wechat-relationship-health: 未配置 VIP 联系人`)
        return
      }

      const today = todayStr()
      // 最近 4 周数据
      const recentSnapshots = loadSnapshotsInRange(dateOffset(-28), today)
      const prevSnapshots = loadSnapshotsInRange(dateOffset(-56), dateOffset(-29))

      if (recentSnapshots.length === 0) {
        logForDebugging(`${TAG} wechat-relationship-health: 无快照数据`)
        return
      }

      // 统计每个 VIP 的互动频次
      const recentActivity = new Map<string, number>()
      const prevActivity = new Map<string, number>()
      for (const snap of recentSnapshots) {
        for (const c of snap.topContacts) {
          if (vipList.some(v => c.name.includes(v))) {
            recentActivity.set(c.name, (recentActivity.get(c.name) || 0) + c.count)
          }
        }
      }
      for (const snap of prevSnapshots) {
        for (const c of snap.topContacts) {
          if (vipList.some(v => c.name.includes(v))) {
            prevActivity.set(c.name, (prevActivity.get(c.name) || 0) + c.count)
          }
        }
      }

      const cooling: { name: string; recent: number; prev: number }[] = []
      const disconnected: string[] = []
      const healthy: { name: string; recent: number }[] = []

      for (const vip of vipList) {
        // 找到匹配的联系人名
        const recentMatch = Array.from(recentActivity.entries()).find(([n]) => n.includes(vip))
        const prevMatch = Array.from(prevActivity.entries()).find(([n]) => n.includes(vip))
        const recentCount = recentMatch?.[1] || 0
        const prevCount = prevMatch?.[1] || 0
        const name = recentMatch?.[0] || prevMatch?.[0] || vip

        if (recentCount === 0 && prevCount === 0) {
          disconnected.push(name)
        } else if (prevCount > 0 && recentCount < prevCount * 0.5) {
          cooling.push({ name, recent: recentCount, prev: prevCount })
        } else if (recentCount > 0) {
          healthy.push({ name, recent: recentCount })
        }
      }

      const lines: string[] = []
      lines.push(`# VIP 联系人健康度 — ${today}`)
      lines.push('')

      if (disconnected.length > 0) {
        lines.push('## 🚨 断联预警（近 4 周无互动）')
        for (const name of disconnected) {
          lines.push(`- ${name} — 建议主动联系`)
        }
        lines.push('')
      }

      if (cooling.length > 0) {
        lines.push('## ⚠️ 冷却趋势（互动量下降 > 50%）')
        for (const c of cooling) {
          lines.push(`- ${c.name}（近4周 ${c.recent} 条 ← 上4周 ${c.prev} 条，↓${Math.round((1 - c.recent / c.prev) * 100)}%）`)
        }
        lines.push('')
      }

      if (healthy.length > 0) {
        lines.push('## ✅ 健康互动')
        for (const h of healthy) {
          lines.push(`- ${h.name}（近4周 ${h.recent} 条）`)
        }
        lines.push('')
      }

      lines.push('## 💡 建议主动联系')
      const toContact = [...disconnected, ...cooling.map(c => c.name)].slice(0, 5)
      if (toContact.length > 0) {
        for (const name of toContact) {
          lines.push(`- ${name}`)
        }
      } else {
        lines.push('- 所有 VIP 联系人互动健康')
      }
      lines.push('')

      const report = lines.join('\n')
      ensureDir(DATA_DIR)
      writeFileSync(join(DATA_DIR, `relationship-${today}.md`), report, 'utf-8')

      const alertCount = disconnected.length + cooling.length
      if (alertCount > 0) {
        const rhTitle = '❤️ VIP 联系人关系预警'
        const rhBody = `${disconnected.length} 人断联、${cooling.length} 人冷却。建议主动联系: ${toContact.slice(0, 3).join('、')}`
        pushNotification({
          type: 'warning',
          title: rhTitle,
          body: rhBody,
          channel: 'all',
        })
        await _desk('wechat-relationship-health', `Panda · ${rhTitle}`, rhBody, {
          level: 'warning', badgeDelta: alertCount,
        })
      } else {
        const rhTitle = '❤️ VIP 联系人关系健康'
        const rhBody = `所有 ${vipList.length} 位 VIP 联系人互动正常`
        pushNotification({
          type: 'info',
          title: rhTitle,
          body: rhBody,
          channel: 'all',
        })
        await _desk('wechat-relationship-health', `Panda · ${rhTitle}`, rhBody)
      }

      logForDebugging(`${TAG} wechat-relationship-health: disconnected=${disconnected.length} cooling=${cooling.length}`)
    } catch (e) {
      logForDebugging(`${TAG} wechat-relationship-health failed: ${(e as Error).message}`)
    }
  },
}

// ─── 场景 14: 话题追踪器 ───

const wechatTopicTracker: SmartCronTask = {
  id: 'wechat-topic-tracker',
  description: '微信话题追踪器 · WeChat topic tracker',
  cron: '0 */6 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-topic-tracker'),
  action: async () => {
    logForDebugging(`${TAG} wechat-topic-tracker: 扫描关注话题`)
    try {
      // 读取话题配置
      let topics: { name: string; keywords: string[] }[] = []
      try {
        const topicPath = join(CONFIG_DIR, 'wechat-topics.json')
        if (existsSync(topicPath)) {
          const config = JSON.parse(readFileSync(topicPath, 'utf-8'))
          if (Array.isArray(config)) {
            topics = config
          }
        }
      } catch {}

      if (topics.length === 0) {
        logForDebugging(`${TAG} wechat-topic-tracker: 未配置关注话题`)
        return
      }

      const now = Date.now()
      const since = now - 6 * 60 * 60 * 1000
      const messages = await fetchMessages(since, now)

      if (messages.length === 0) {
        logForDebugging(`${TAG} wechat-topic-tracker: 最近 6 小时无消息`)
        return
      }

      const topicHits: { topic: string; hits: { channelName: string; senderName: string; content: string; time: string }[] }[] = []

      for (const topic of topics) {
        const hits: typeof topicHits[0]['hits'] = []
        for (const msg of messages) {
          const matched = topic.keywords.some(kw => msg.content.includes(kw))
          if (matched) {
            hits.push({
              channelName: msg.channelName,
              senderName: msg.senderName,
              content: msg.content.slice(0, 80),
              time: formatTime(msg.timestamp),
            })
          }
        }
        if (hits.length > 0) {
          topicHits.push({ topic: topic.name, hits })
        }
      }

      if (topicHits.length === 0) {
        logForDebugging(`${TAG} wechat-topic-tracker: 无话题命中`)
        return
      }

      const detail = topicHits
        .slice(0, 5)
        .map(t => `📌 ${t.topic}（${t.hits.length} 条）\n${t.hits.slice(0, 3).map(h => `  ${h.channelName} | ${h.senderName}: ${h.content}`).join('\n')}`)
        .join('\n\n')

      // 写入工作记忆
      try {
        const { setWorkingMemory } = await import('../../assistant/workingMemory.js')
        setWorkingMemory('wechat-topic-tracker', JSON.stringify(
          topicHits.map(t => ({ topic: t.topic, count: t.hits.length }))
        ))
      } catch {}

      const ttTitle = '📌 微信话题追踪'
      const ttBody = `${topicHits.length} 个关注话题有新动态：\n${detail}`
      pushNotification({
        type: 'info',
        title: ttTitle,
        body: ttBody,
        channel: 'all',
      })
      await _desk('wechat-topic-tracker', `Panda · ${ttTitle}`, ttBody, {
        badgeDelta: topicHits.length,
      })

      logForDebugging(`${TAG} wechat-topic-tracker: ${topicHits.length} topics hit`)
    } catch (e) {
      logForDebugging(`${TAG} wechat-topic-tracker failed: ${(e as Error).message}`)
    }
  },
}

// ─── 导出 ───

export function getWechatSituationalTasks(): SmartCronTask[] {
  return [
    wechatDailySituational,
    wechatMentionAlert,
    wechatKeywordMonitor,
    wechatUnrepliedReminder,
    wechatGroupDigest,
    wechatContactInsights,
    wechatNoiseFilter,
    wechatSentimentPulse,
    wechatWeeklyTrend,
    wechatMonthlyReport,
    wechatQuarterlyReview,
    wechatYearlyDigest,
    wechatRelationshipHealth,
    wechatTopicTracker,
  ]
}
