// Input: 定时触发的系统通知中心扫描请求
// Output: 通知日报/紧急转发/统计趋势的主动推送
// Pos: proactive/tasks/ 通知感知场景层，由 taskRegistry 注册调度

import { pushNotification } from '../../assistant/sense.js'
import { getProactiveConfig, isScenarioEnabled } from '../proactiveConfig.js'
import { localDateStr } from '../../utils/date.js'
import { logForDebugging } from '../../utils/debug.js'
import { IS_MAC, IS_WIN, HOME } from '../platform.js'

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

interface NotificationRecord {
  app: string
  title: string
  body: string
  timestamp: number // unix ms
  uuid: string
}

/**
 * macOS: 从通知数据库读取指定时间范围内的通知。
 * 需要 Full Disk Access 权限，无权限时静默返回空数组。
 */
function readMacNotifications(sinceMs: number): NotificationRecord[] {
  if (!IS_MAC) return []
  const results: NotificationRecord[] = []
  try {
    const { join } = require('path')
    const { copyFileSync, unlinkSync, existsSync } = require('fs')
    const { execSync } = require('child_process')
    const Database = require('bun:sqlite').Database

    const dbPath = join(HOME, 'Library/Group Containers/group.com.apple.usernoted/db2/db')
    if (!existsSync(dbPath)) {
      logForDebugging('[notificationScenarios] macOS 通知数据库不存在')
      return []
    }

    // 复制到 /tmp 避免锁定
    const tmpPath = `/tmp/pandacc_notif_${Date.now()}.db`
    try {
      copyFileSync(dbPath, tmpPath)
    } catch (e) {
      logForDebugging(`[notificationScenarios] 复制通知数据库失败（可能缺少 FDA 权限）: ${(e as Error).message}`)
      return []
    }

    try {
      const db = new Database(tmpPath, { readonly: true })
      // Mac Absolute Time: seconds since 2001-01-01T00:00:00Z
      const macEpoch = Date.UTC(2001, 0, 1) / 1000
      const sinceAbsolute = (sinceMs / 1000) - macEpoch

      const rows = db.query(`
        SELECT r.data, r.delivered_date, r.rec_id, a.identifier
        FROM record r JOIN app a ON r.app_id = a.app_id
        WHERE r.delivered_date > ?
        ORDER BY r.delivered_date DESC
      `).all(sinceAbsolute) as Array<{ data: Buffer | null; delivered_date: number; rec_id: number; identifier: string }>

      for (const row of rows) {
        const app = row.identifier || 'unknown'
        const uuid = `mac-${row.rec_id}`
        const timestampMs = (row.delivered_date + macEpoch) * 1000
        let title = ''
        let body = ''

        if (row.data && Buffer.isBuffer(row.data) && row.data.length > 0) {
          // 用 plutil 将 binary plist 转 xml1（json 格式不支持 plist 某些类型）
          try {
            const xmlStr = execSync('plutil -convert xml1 -o - -', {
              input: row.data,
              encoding: 'utf-8',
              timeout: 3000,
            })
            // 从 XML 中提取 req 字典下的 titl/body
            const titlMatch = xmlStr.match(/<key>titl<\/key>\s*<string>([^<]*)<\/string>/)
            const bodyMatch = xmlStr.match(/<key>body<\/key>\s*<string>([^<]*)<\/string>/)
            title = titlMatch?.[1] || ''
            body = bodyMatch?.[1] || ''
          } catch {
            // 降级：正则提取 UTF-8 明文
            const text = row.data.toString('utf-8')
            const ctrlRange = '\x00-\x1f'
            const titleMatch = text.match(new RegExp(`titl.{0,10}?([^${ctrlRange}]{2,100})`))
            const bodyMatch = text.match(new RegExp(`body.{0,10}?([^${ctrlRange}]{2,100})`))
            if (titleMatch) title = titleMatch[1].trim()
            if (bodyMatch) body = bodyMatch[1].trim()
          }
        }

        results.push({ app, title, body, timestamp: timestampMs, uuid })
      }

      db.close()
    } finally {
      try { unlinkSync(tmpPath) } catch {}
    }
  } catch (e) {
    logForDebugging(`[notificationScenarios] macOS 通知读取失败: ${(e as Error).message}`)
  }
  return results
}

/**
 * Windows: 从通知数据库读取指定时间范围内的通知。
 */
function readWinNotifications(sinceMs: number): NotificationRecord[] {
  if (!IS_WIN) return []
  const results: NotificationRecord[] = []
  try {
    const { join } = require('path')
    const { copyFileSync, unlinkSync, existsSync } = require('fs')
    const Database = require('bun:sqlite').Database

    const localAppData = process.env.LOCALAPPDATA || ''
    if (!localAppData) return []
    const dbPath = join(localAppData, 'Microsoft/Windows/Notifications/wpndatabase.db')
    if (!existsSync(dbPath)) {
      logForDebugging('[notificationScenarios] Windows 通知数据库不存在')
      return []
    }

    const tmpPath = join(process.env.TEMP || '/tmp', `pandacc_notif_${Date.now()}.db`)
    try {
      copyFileSync(dbPath, tmpPath)
    } catch (e) {
      logForDebugging(`[notificationScenarios] 复制 Windows 通知数据库失败: ${(e as Error).message}`)
      return []
    }

    try {
      const db = new Database(tmpPath, { readonly: true })

      // Windows FILETIME: 100ns intervals since 1601-01-01
      // Convert sinceMs to FILETIME
      const FILETIME_EPOCH_OFFSET = 11644473600000 // ms between 1601 and 1970
      const sinceFileTime = (sinceMs + FILETIME_EPOCH_OFFSET) * 10000

      const rows = db.query(`
        SELECT Id, Payload, ArrivalTime, HandlerPrimaryId
        FROM Notification
        WHERE ArrivalTime > ?
        ORDER BY ArrivalTime DESC
      `).all(sinceFileTime) as Array<{ Id: number; Payload: string | null; ArrivalTime: number; HandlerPrimaryId: string }>

      for (const row of rows) {
        const app = row.HandlerPrimaryId || 'unknown'
        const uuid = `win-${row.Id}`
        const timestampMs = (row.ArrivalTime / 10000) - FILETIME_EPOCH_OFFSET
        let title = ''
        let body = ''

        if (row.Payload) {
          // Payload 是 XML，用正则提取 <text> 标签内容
          const texts: string[] = []
          const textRegex = /<text[^>]*>(.*?)<\/text>/gs
          let match: RegExpExecArray | null
          while ((match = textRegex.exec(row.Payload)) !== null) {
            if (match[1]) texts.push(match[1].trim())
          }
          title = texts[0] || ''
          body = texts.slice(1).join(' ') || ''
        }

        results.push({ app, title, body, timestamp: timestampMs, uuid })
      }

      db.close()
    } finally {
      try { unlinkSync(tmpPath) } catch {}
    }
  } catch (e) {
    logForDebugging(`[notificationScenarios] Windows 通知读取失败: ${(e as Error).message}`)
  }
  return results
}

/** 跨平台读取通知 */
function readNotifications(sinceMs: number): NotificationRecord[] {
  if (IS_MAC) return readMacNotifications(sinceMs)
  if (IS_WIN) return readWinNotifications(sinceMs)
  return []
}

/** 按 App 标识简化为可读名称 */
function friendlyAppName(identifier: string): string {
  const map: Record<string, string> = {
    'com.apple.MobileSMS': '短信',
    'com.apple.mail': '邮件',
    'com.tencent.xinWeChat': '微信',
    'com.tencent.qq': 'QQ',
    'com.apple.reminders': '提醒事项',
    'com.apple.iCal': '日历',
    'com.slack.Slack': 'Slack',
    'com.microsoft.teams2': 'Teams',
    'com.microsoft.Outlook': 'Outlook',
  }
  return map[identifier] || identifier.split('.').pop() || identifier
}

// ─── 紧急通知去重 ───

const _forwardedUUIDs = new Set<string>()

// ─── N1: 通知日频简报 ───

const notificationDigest: SmartCronTask = {
  id: 'notification-digest',
  description: '通知简报 · Notification daily digest',
  cron: '0 8 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('notification-digest'),
  action: async () => {
    logForDebugging('[notificationScenarios] notification-digest: generating daily digest')
    try {
      const since = Date.now() - 24 * 60 * 60 * 1000
      const notifications = readNotifications(since)

      if (notifications.length === 0) {
        logForDebugging('[notificationScenarios] notification-digest: 过去 24 小时无通知')
        return
      }

      // 按 App 分组
      const byApp = new Map<string, NotificationRecord[]>()
      for (const n of notifications) {
        const name = friendlyAppName(n.app)
        if (!byApp.has(name)) byApp.set(name, [])
        byApp.get(name)!.push(n)
      }

      const today = localDateStr()
      const lines: string[] = [`# 通知简报 — ${today}\n`]
      lines.push(`过去 24 小时收到 ${notifications.length} 条通知：\n`)

      // 按数量降序排列
      const sorted = [...byApp.entries()].sort((a, b) => b[1].length - a[1].length)
      for (const [appName, records] of sorted) {
        lines.push(`## ${appName} (${records.length} 条)`)
        // 显示前 5 条
        for (const r of records.slice(0, 5)) {
          const preview = r.title
            ? `${r.title}${r.body ? ': ' + r.body.slice(0, 60) : ''}`
            : r.body.slice(0, 80) || '(无文本内容)'
          lines.push(`- ${preview}`)
        }
        if (records.length > 5) {
          lines.push(`- ...及其他 ${records.length - 5} 条`)
        }
        lines.push('')
      }

      // 写入工作记忆
      const { join } = require('path')
      const { writeFileSync, mkdirSync } = require('fs')
      const workingDir = join(HOME, '.pandacc', 'memory', 'working')
      mkdirSync(workingDir, { recursive: true })
      writeFileSync(join(workingDir, `notification_digest_${today}.md`), lines.join('\n'), 'utf-8')

      pushNotification({
        type: 'info',
        title: '📋 通知简报',
        body: `过去 24 小时收到 ${notifications.length} 条通知（${sorted.length} 个应用），详见 notification_digest_${today}.md`,
        channel: 'system',
      })

      logForDebugging(`[notificationScenarios] notification-digest: ${notifications.length} notifications from ${sorted.length} apps`)
    } catch (e) {
      logForDebugging(`[notificationScenarios] notification-digest failed: ${(e as Error).message}`)
    }
  },
}

// ─── N2: 紧急通知实时转发 ───

const URGENT_KEYWORDS = /转账|到期|异常|安全|紧急|urgent|alert|critical|安全验证|验证码|security|password|密码|expired|expir/i
const URGENT_APPS = new Set([
  'com.apple.MobileSMS',
  // 银行类
  'com.icbc', 'com.ccb', 'com.boc', 'com.abc', 'com.cmb',
  'com.hsbc', 'com.citi', 'com.dbs',
  // 安全类
  'com.google.GoogleAuthenticator', 'com.microsoft.azureauthenticator',
  'com.authy', 'com.1password',
])

const notificationUrgent: SmartCronTask = {
  id: 'notification-urgent',
  description: '紧急通知转发 · Urgent notification alert',
  cron: '*/5 * * * *',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('notification-urgent'),
  action: async () => {
    logForDebugging('[notificationScenarios] notification-urgent: scanning recent notifications')
    try {
      const since = Date.now() - 5 * 60 * 1000
      const notifications = readNotifications(since)

      if (notifications.length === 0) return

      const urgent: NotificationRecord[] = []
      for (const n of notifications) {
        if (_forwardedUUIDs.has(n.uuid)) continue
        const text = `${n.title} ${n.body}`
        const isUrgentKeyword = URGENT_KEYWORDS.test(text)
        const isUrgentApp = URGENT_APPS.has(n.app)
        if (isUrgentKeyword || isUrgentApp) {
          urgent.push(n)
          _forwardedUUIDs.add(n.uuid)
        }
      }

      // 防止去重集合无限增长
      if (_forwardedUUIDs.size > 10000) {
        _forwardedUUIDs.clear()
      }

      if (urgent.length === 0) return

      const detail = urgent
        .slice(0, 5)
        .map(n => `  • [${friendlyAppName(n.app)}] ${n.title || n.body.slice(0, 50)}`)
        .join('\n')

      pushNotification({
        type: 'warning',
        title: '🚨 紧急通知',
        body: `检测到 ${urgent.length} 条紧急通知：\n${detail}`,
        channel: 'all',
      })

      // 写入工作记忆
      try {
        const { setWorkingMemory } = await import('../../assistant/workingMemory.js')
        const summary = urgent.map(n => `[${friendlyAppName(n.app)}] ${n.title}: ${n.body.slice(0, 100)}`).join('\n')
        setWorkingMemory('notification-urgent', summary)
      } catch {}

      logForDebugging(`[notificationScenarios] notification-urgent: forwarded ${urgent.length} urgent notifications`)
    } catch (e) {
      logForDebugging(`[notificationScenarios] notification-urgent failed: ${(e as Error).message}`)
    }
  },
}

// ─── N3: 通知统计趋势 ───

const notificationStats: SmartCronTask = {
  id: 'notification-stats',
  description: '通知统计 · Notification stats',
  cron: '0 22 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('notification-stats'),
  action: async () => {
    logForDebugging('[notificationScenarios] notification-stats: computing daily stats')
    try {
      const { join } = require('path')
      const { writeFileSync, readFileSync, mkdirSync, existsSync } = require('fs')

      const since = Date.now() - 24 * 60 * 60 * 1000
      const notifications = readNotifications(since)

      // 按 App 分组统计
      const appCounts = new Map<string, number>()
      for (const n of notifications) {
        const name = friendlyAppName(n.app)
        appCounts.set(name, (appCounts.get(name) || 0) + 1)
      }

      const today = localDateStr()
      const statsDir = join(HOME, '.pandacc', 'data', 'notification-stats')
      mkdirSync(statsDir, { recursive: true })

      const todayStats = {
        date: today,
        total: notifications.length,
        byApp: Object.fromEntries(appCounts),
      }

      // 保存今日统计
      writeFileSync(join(statsDir, `${today}.json`), JSON.stringify(todayStats, null, 2), 'utf-8')

      // 与昨日对比
      const yesterday = localDateStr(new Date(Date.now() - 86400000))
      const yesterdayPath = join(statsDir, `${yesterday}.json`)
      let anomalies: string[] = []

      if (existsSync(yesterdayPath)) {
        try {
          const yesterdayStats = JSON.parse(readFileSync(yesterdayPath, 'utf-8'))
          const yesterdayByApp: Record<string, number> = yesterdayStats.byApp || {}

          for (const [app, count] of appCounts) {
            const yesterdayCount = yesterdayByApp[app] || 0
            if (yesterdayCount > 0 && count > yesterdayCount * 3) {
              anomalies.push(`${app}: 今日 ${count} 条 vs 昨日 ${yesterdayCount} 条（${Math.round(count / yesterdayCount)}x）`)
            }
          }
        } catch {}
      }

      if (anomalies.length > 0) {
        pushNotification({
          type: 'warning',
          title: '📊 通知异常激增',
          body: `以下应用通知量异常增长：\n${anomalies.map(a => `  • ${a}`).join('\n')}`,
          channel: 'system',
        })
      }

      logForDebugging(`[notificationScenarios] notification-stats: total=${notifications.length}, apps=${appCounts.size}, anomalies=${anomalies.length}`)
    } catch (e) {
      logForDebugging(`[notificationScenarios] notification-stats failed: ${(e as Error).message}`)
    }
  },
}

// ─── 导出 ───

export function getNotificationTasks(): SmartCronTask[] {
  return [notificationDigest, notificationUrgent, notificationStats]
}
