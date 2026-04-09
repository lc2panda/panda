// Input: 定时触发的通信/邮件场景检查请求
// Output: 邮件待办、未读、Slack、日历冲突、会议准备、未回复、生日、摘要的主动推送通知
// Pos: proactive/tasks/ 通信场景层，由 builtinTasks loadScenarioModules 注册调度

import { pushNotification } from '../../assistant/sense.js'
import { getProactiveConfig, isScenarioEnabled } from '../proactiveConfig.js'
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

// ─── B1: 邮件待办提醒 ───

const emailFlaggedReminder: SmartCronTask = {
  id: 'email-flagged-reminder',
  description: '邮件待办提醒 · Flagged email reminder',
  cron: '0 */2 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('email-flagged-reminder'),
  action: async () => {
    logForDebugging('[communicationScenarios] email-flagged-reminder: checking flagged emails')
    try {
      let flaggedCount = 0

      if (IS_MAC) {
        try {
          const { execSync } = require('child_process')
          const { readdirSync, existsSync } = require('fs')
          const { join } = require('path')
          // 找到 Mail.app Envelope Index
          const mailBase = join(HOME, 'Library', 'Mail')
          let envelopePath: string | null = null
          try {
            const versions = readdirSync(mailBase).filter((d: string) => d.startsWith('V'))
            for (const v of versions) {
              const candidate = join(mailBase, v, 'MailData', 'Envelope Index')
              if (existsSync(candidate)) { envelopePath = candidate; break }
            }
          } catch {}

          if (envelopePath) {
            const raw: string = execSync(
              `sqlite3 "${envelopePath}" "SELECT COUNT(*) FROM messages WHERE flagged = 1;" 2>/dev/null`,
              { encoding: 'utf-8', timeout: 10000 },
            )
            flaggedCount = parseInt(raw.trim(), 10) || 0
          }
        } catch {
          logForDebugging('[communicationScenarios] email-flagged-reminder: macOS Mail.app 读取失败，跳过')
          return
        }
      } else if (IS_WIN) {
        try {
          const { execSync } = require('child_process')
          const raw: string = execSync(
            `powershell -c "(New-Object -ComObject Outlook.Application).GetNamespace('MAPI').GetDefaultFolder(6).Items | Where-Object {$_.FlagStatus -eq 2} | Measure-Object | Select-Object -ExpandProperty Count"`,
            { encoding: 'utf-8', timeout: 15000 },
          )
          flaggedCount = parseInt(raw.trim(), 10) || 0
        } catch {
          logForDebugging('[communicationScenarios] email-flagged-reminder: Outlook COM 访问失败，跳过')
          return
        }
      } else {
        return // Linux 无默认邮件客户端
      }

      if (flaggedCount === 0) {
        logForDebugging('[communicationScenarios] email-flagged-reminder: 无标记邮件')
        return
      }

      pushNotification({
        type: 'info',
        title: '🚩 邮件待办',
        body: `你有 ${flaggedCount} 封标记（flagged）邮件待处理`,
        channel: 'system',
      })
      logForDebugging(`[communicationScenarios] email-flagged-reminder: ${flaggedCount} flagged`)
    } catch (e) {
      logForDebugging(`[communicationScenarios] email-flagged-reminder failed: ${(e as Error).message}`)
    }
  },
}

// ─── B2: 重要未读邮件 ───

const emailUnreadImportant: SmartCronTask = {
  id: 'email-unread-important',
  description: '重要未读邮件 · Unread important email alert',
  cron: '*/30 * * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('email-unread-important'),
  action: async () => {
    logForDebugging('[communicationScenarios] email-unread-important: checking unread')
    try {
      let unreadCount = 0

      if (IS_MAC) {
        try {
          const { execSync } = require('child_process')
          const { readdirSync, existsSync } = require('fs')
          const { join } = require('path')
          const mailBase = join(HOME, 'Library', 'Mail')
          let envelopePath: string | null = null
          try {
            const versions = readdirSync(mailBase).filter((d: string) => d.startsWith('V'))
            for (const v of versions) {
              const candidate = join(mailBase, v, 'MailData', 'Envelope Index')
              if (existsSync(candidate)) { envelopePath = candidate; break }
            }
          } catch {}

          if (envelopePath) {
            const cutoff24h = Math.floor(Date.now() / 1000) - 86400
            const raw: string = execSync(
              `sqlite3 "${envelopePath}" "SELECT COUNT(*) FROM messages WHERE read = 0 AND date_received > ${cutoff24h};" 2>/dev/null`,
              { encoding: 'utf-8', timeout: 10000 },
            )
            unreadCount = parseInt(raw.trim(), 10) || 0
          }
        } catch {
          return
        }
      } else {
        return
      }

      if (unreadCount <= 10) {
        logForDebugging(`[communicationScenarios] email-unread-important: ${unreadCount} unread (under threshold)`)
        return
      }

      pushNotification({
        type: 'warning',
        title: '📬 未读邮件堆积',
        body: `过去 24 小时有 ${unreadCount} 封未读邮件，建议尽快处理`,
        channel: 'system',
      })
      logForDebugging(`[communicationScenarios] email-unread-important: ${unreadCount} unread`)
    } catch (e) {
      logForDebugging(`[communicationScenarios] email-unread-important failed: ${(e as Error).message}`)
    }
  },
}

// ─── B4: Slack/Teams 消息（占位） ───

const slackUnread: SmartCronTask = {
  id: 'slack-unread',
  description: 'Slack 未读消息 · Slack unread messages',
  cron: '*/15 * * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('slack-unread'),
  action: async () => {
    logForDebugging('[communicationScenarios] slack-unread: checking Slack')
    try {
      // 检查 SLACK_TOKEN 环境变量或配置文件
      let token = process.env.SLACK_TOKEN || ''
      if (!token) {
        try {
          const { readFileSync } = require('fs')
          const { join } = require('path')
          const configPath = join(HOME, '.pandacc', 'config', 'slack.json')
          const config = JSON.parse(readFileSync(configPath, 'utf-8'))
          token = config.token || ''
        } catch {}
      }

      if (!token) {
        logForDebugging('[communicationScenarios] slack-unread: 无 SLACK_TOKEN，跳过')
        return
      }

      const resp = await fetch('https://slack.com/api/conversations.list?types=im,mpim&limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await resp.json() as any
      if (!data.ok) {
        logForDebugging(`[communicationScenarios] slack-unread: Slack API 错误: ${data.error}`)
        return
      }

      let unreadCount = 0
      for (const ch of (data.channels || [])) {
        if (ch.is_open && ch.unread_count_display > 0) {
          unreadCount += ch.unread_count_display
        }
      }

      if (unreadCount === 0) {
        logForDebugging('[communicationScenarios] slack-unread: 无未读')
        return
      }

      pushNotification({
        type: 'info',
        title: '💬 Slack 未读',
        body: `你有 ${unreadCount} 条未读 Slack 消息`,
        channel: 'system',
      })
      logForDebugging(`[communicationScenarios] slack-unread: ${unreadCount} unread`)
    } catch (e) {
      logForDebugging(`[communicationScenarios] slack-unread failed: ${(e as Error).message}`)
    }
  },
}

// ─── B5: 日历冲突检测增强 ───

const calendarConflictEnhanced: SmartCronTask = {
  id: 'calendar-conflict-enhanced',
  description: '日历冲突检测 · Calendar conflict detection',
  cron: '0 8,20 * * *',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('calendar-conflict-enhanced'),
  action: async () => {
    logForDebugging('[communicationScenarios] calendar-conflict-enhanced: scanning 3-day window')
    try {
      const { readCalendarEvents } = await import('../../memdir/memdir.js')
      const events = await readCalendarEvents(3)
      if (events.length < 2) {
        logForDebugging('[communicationScenarios] calendar-conflict-enhanced: 不足 2 事件，无需检测')
        return
      }

      // 按开始时间解析并分组到小时桶
      const hourBuckets: Record<string, string[]> = {}
      for (const evt of events) {
        try {
          const dt = new Date(evt.startDate)
          if (isNaN(dt.getTime())) continue
          const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:00`
          if (!hourBuckets[key]) hourBuckets[key] = []
          hourBuckets[key].push(evt.title)
        } catch {}
      }

      const conflicts: { slot: string; titles: string[] }[] = []
      for (const [slot, titles] of Object.entries(hourBuckets)) {
        if (titles.length >= 2) {
          conflicts.push({ slot, titles })
        }
      }

      if (conflicts.length === 0) {
        logForDebugging('[communicationScenarios] calendar-conflict-enhanced: 无冲突')
        return
      }

      const detail = conflicts
        .slice(0, 5)
        .map(c => `  • ${c.slot}: ${c.titles.join(' vs ')}`)
        .join('\n')

      pushNotification({
        type: 'warning',
        title: '📅 日历冲突',
        body: `未来 3 天发现 ${conflicts.length} 处时间冲突：\n${detail}`,
        channel: 'all',
      })
      logForDebugging(`[communicationScenarios] calendar-conflict-enhanced: ${conflicts.length} conflicts`)
    } catch (e) {
      logForDebugging(`[communicationScenarios] calendar-conflict-enhanced failed: ${(e as Error).message}`)
    }
  },
}

// ─── B6: 会议准备提醒 ───

const meetingPrepReminder: SmartCronTask = {
  id: 'meeting-prep-reminder',
  description: '会议准备提醒 · Meeting prep reminder',
  cron: '*/15 * * * *',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('meeting-prep-reminder'),
  action: async () => {
    logForDebugging('[communicationScenarios] meeting-prep-reminder: scanning next 1h meetings')
    try {
      const { readCalendarEvents } = await import('../../memdir/memdir.js')
      const events = await readCalendarEvents(1)
      if (events.length === 0) return

      const now = Date.now()
      const oneHourLater = now + 60 * 60 * 1000

      for (const evt of events) {
        let evtTime: number | null = null
        try {
          evtTime = new Date(evt.startDate).getTime()
        } catch {}
        if (!evtTime || isNaN(evtTime)) continue
        if (evtTime <= now || evtTime > oneHourLater) continue

        // 搜索项目中与会议标题关联的文件
        let relatedFiles: string[] = []
        try {
          const { execSync } = require('child_process')
          const keywords = evt.title
            .replace(/[^\w\u4e00-\u9fff\s]/g, '')
            .split(/\s+/)
            .filter((w: string) => w.length > 2)
            .slice(0, 3)

          if (keywords.length > 0) {
            if (IS_MAC) {
              for (const kw of keywords) {
                try {
                  const raw: string = execSync(
                    `mdfind "kMDItemDisplayName == '*${kw}*'" -maxcount 5 2>/dev/null`,
                    { encoding: 'utf-8', timeout: 5000 },
                  )
                  relatedFiles.push(...raw.trim().split('\n').filter(Boolean))
                } catch {}
              }
            } else {
              for (const kw of keywords) {
                try {
                  const raw: string = execSync(
                    `find "${HOME}" -maxdepth 3 -name "*${kw}*" -type f 2>/dev/null | head -5`,
                    { encoding: 'utf-8', timeout: 5000 },
                  )
                  relatedFiles.push(...raw.trim().split('\n').filter(Boolean))
                } catch {}
              }
            }
            // 去重
            relatedFiles = [...new Set(relatedFiles)].slice(0, 5)
          }
        } catch {}

        const minutesBefore = Math.round((evtTime - now) / 60000)
        let body = `${minutesBefore} 分钟后：${evt.title}`
        if (evt.location) body += ` @ ${evt.location}`
        if (relatedFiles.length > 0) {
          body += `\n关联文件：\n${relatedFiles.map(f => `  • ${f}`).join('\n')}`
        }

        pushNotification({
          type: 'action',
          title: '📋 会议准备',
          body,
          channel: 'all',
        })
        logForDebugging(`[communicationScenarios] meeting-prep-reminder: "${evt.title}" in ${minutesBefore}min, ${relatedFiles.length} related files`)
      }
    } catch (e) {
      logForDebugging(`[communicationScenarios] meeting-prep-reminder failed: ${(e as Error).message}`)
    }
  },
}

// ─── B7: 长期未回复邮件 ───

const emailUnreplied: SmartCronTask = {
  id: 'email-unreplied',
  description: '长期未回复邮件 · Unreplied email reminder',
  cron: '0 10 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('email-unreplied'),
  action: async () => {
    logForDebugging('[communicationScenarios] email-unreplied: checking 48h unreplied')
    try {
      if (!IS_MAC) return

      let unrepliedCount = 0
      try {
        const { execSync } = require('child_process')
        const { readdirSync, existsSync } = require('fs')
        const { join } = require('path')
        const mailBase = join(HOME, 'Library', 'Mail')
        let envelopePath: string | null = null
        try {
          const versions = readdirSync(mailBase).filter((d: string) => d.startsWith('V'))
          for (const v of versions) {
            const candidate = join(mailBase, v, 'MailData', 'Envelope Index')
            if (existsSync(candidate)) { envelopePath = candidate; break }
          }
        } catch {}

        if (envelopePath) {
          const cutoff48h = Math.floor(Date.now() / 1000) - 48 * 3600
          const raw: string = execSync(
            `sqlite3 "${envelopePath}" "SELECT COUNT(*) FROM messages WHERE read = 1 AND answered = 0 AND date_received > ${cutoff48h} AND date_received < ${cutoff48h + 24 * 3600};" 2>/dev/null`,
            { encoding: 'utf-8', timeout: 10000 },
          )
          unrepliedCount = parseInt(raw.trim(), 10) || 0
        }
      } catch {
        return
      }

      if (unrepliedCount === 0) {
        logForDebugging('[communicationScenarios] email-unreplied: 无未回复邮件')
        return
      }

      pushNotification({
        type: 'info',
        title: '📩 未回复邮件',
        body: `有 ${unrepliedCount} 封已读但超 48 小时未回复的邮件`,
        channel: 'system',
      })
      logForDebugging(`[communicationScenarios] email-unreplied: ${unrepliedCount} unreplied`)
    } catch (e) {
      logForDebugging(`[communicationScenarios] email-unreplied failed: ${(e as Error).message}`)
    }
  },
}

// ─── B8: 通讯录生日提醒 ───

const contactBirthday: SmartCronTask = {
  id: 'contact-birthday',
  description: '通讯录生日提醒 · Contact birthday reminder',
  cron: '0 8 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('contact-birthday'),
  action: async () => {
    logForDebugging('[communicationScenarios] contact-birthday: checking upcoming birthdays')
    try {
      if (!IS_MAC) {
        logForDebugging('[communicationScenarios] contact-birthday: 非 macOS，跳过')
        return
      }

      const { execSync } = require('child_process')
      // 使用 AppleScript 读取 Contacts.app 生日
      const script = `
tell application "Contacts"
  set output to ""
  set today to current date
  repeat with i from 0 to 2
    set checkDate to today + i * days
    set m to (month of checkDate as integer)
    set d to (day of checkDate)
    repeat with p in every person
      try
        set bd to birth date of p
        if bd is not missing value then
          if (month of bd as integer) = m and (day of bd) = d then
            set output to output & (name of p) & "|" & (m as text) & "/" & (d as text) & linefeed
          end if
        end if
      end try
    end repeat
  end repeat
  return output
end tell`

      let raw = ''
      try {
        raw = execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
          encoding: 'utf-8',
          timeout: 30000,
        })
      } catch {
        // AppleScript 可能因权限问题失败
        logForDebugging('[communicationScenarios] contact-birthday: AppleScript 读取失败')
        return
      }

      const birthdays = raw.trim().split('\n').filter(Boolean)
      if (birthdays.length === 0) {
        logForDebugging('[communicationScenarios] contact-birthday: 近 3 天无生日')
        return
      }

      const detail = birthdays
        .slice(0, 10)
        .map(line => {
          const [name, date] = line.split('|')
          return `  • ${name || '未知'}（${date || ''}）`
        })
        .join('\n')

      pushNotification({
        type: 'info',
        title: '🎂 生日提醒',
        body: `未来 3 天有 ${birthdays.length} 位联系人生日：\n${detail}`,
        channel: 'all',
      })
      logForDebugging(`[communicationScenarios] contact-birthday: ${birthdays.length} upcoming birthdays`)
    } catch (e) {
      logForDebugging(`[communicationScenarios] contact-birthday failed: ${(e as Error).message}`)
    }
  },
}

// ─── 邮件每日摘要 ───

const emailDailyDigest: SmartCronTask = {
  id: 'email-daily-digest',
  description: '邮件每日摘要 · Daily email digest',
  cron: '0 9 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('email-daily-digest'),
  action: async () => {
    logForDebugging('[communicationScenarios] email-daily-digest: generating digest')
    try {
      if (!IS_MAC) return

      const { execSync } = require('child_process')
      const { readdirSync, existsSync, writeFileSync } = require('fs')
      const { join } = require('path')
      const { mkdir } = require('fs/promises')

      const mailBase = join(HOME, 'Library', 'Mail')
      let envelopePath: string | null = null
      try {
        const versions = readdirSync(mailBase).filter((d: string) => d.startsWith('V'))
        for (const v of versions) {
          const candidate = join(mailBase, v, 'MailData', 'Envelope Index')
          if (existsSync(candidate)) { envelopePath = candidate; break }
        }
      } catch {}

      if (!envelopePath) {
        logForDebugging('[communicationScenarios] email-daily-digest: Envelope Index 未找到')
        return
      }

      const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000)
      let unreadCount = 0
      let flaggedCount = 0

      try {
        const unreadRaw: string = execSync(
          `sqlite3 "${envelopePath}" "SELECT COUNT(*) FROM messages WHERE read = 0 AND date_received > ${todayStart};" 2>/dev/null`,
          { encoding: 'utf-8', timeout: 10000 },
        )
        unreadCount = parseInt(unreadRaw.trim(), 10) || 0
      } catch {}

      try {
        const flaggedRaw: string = execSync(
          `sqlite3 "${envelopePath}" "SELECT COUNT(*) FROM messages WHERE flagged = 1;" 2>/dev/null`,
          { encoding: 'utf-8', timeout: 10000 },
        )
        flaggedCount = parseInt(flaggedRaw.trim(), 10) || 0
      } catch {}

      // 生成摘要到 working 目录
      try {
        const { getAutoMemPath } = await import('../../memdir/paths.js')
        const memDir = getAutoMemPath()
        const workingDir = join(memDir, 'working')
        await mkdir(workingDir, { recursive: true })
        const dateStr = new Date().toISOString().split('T')[0]
        const summary = [
          `# 邮件日报 — ${dateStr}`,
          '',
          `- 今日未读邮件: ${unreadCount}`,
          `- 标记待办邮件: ${flaggedCount}`,
          '',
          `生成时间: ${new Date().toISOString()}`,
        ].join('\n')
        writeFileSync(join(workingDir, `email_digest_${dateStr}.md`), summary, 'utf-8')
      } catch {}

      if (unreadCount > 0 || flaggedCount > 0) {
        pushNotification({
          type: 'info',
          title: '📧 邮件日报',
          body: `今日未读 ${unreadCount} 封，标记待办 ${flaggedCount} 封`,
          channel: 'system',
        })
      }

      logForDebugging(`[communicationScenarios] email-daily-digest: unread=${unreadCount} flagged=${flaggedCount}`)
    } catch (e) {
      logForDebugging(`[communicationScenarios] email-daily-digest failed: ${(e as Error).message}`)
    }
  },
}

// ─── B9: iMessage 未读消息 ───

const imessageUnread: SmartCronTask = {
  id: 'imessage-unread',
  description: 'iMessage 未读消息 · iMessage unread messages',
  cron: '*/15 * * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('imessage-unread'),
  skipIf: () => !IS_MAC,
  action: async () => {
    logForDebugging('[communicationScenarios] imessage-unread: checking unread iMessages')
    try {
      if (!IS_MAC) return

      const { existsSync } = require('fs')
      const { join } = require('path')
      const { execSync } = require('child_process')

      const chatDbPath = join(HOME, 'Library', 'Messages', 'chat.db')
      if (!existsSync(chatDbPath)) {
        logForDebugging('[communicationScenarios] imessage-unread: chat.db 不存在')
        return
      }

      // 查询未读消息数量及最近的发送者
      let unreadCount = 0
      let recentSenders: string[] = []

      try {
        const countRaw: string = execSync(
          `sqlite3 "${chatDbPath}" "SELECT COUNT(*) FROM message WHERE is_read = 0 AND is_from_me = 0 AND date > (strftime('%s','now','-24 hours') - 978307200) * 1000000000;" 2>/dev/null`,
          { encoding: 'utf-8', timeout: 10000 },
        )
        unreadCount = parseInt(countRaw.trim(), 10) || 0
      } catch {
        logForDebugging('[communicationScenarios] imessage-unread: 未读计数查询失败（可能需要全盘访问权限）')
        return
      }

      if (unreadCount === 0) {
        logForDebugging('[communicationScenarios] imessage-unread: 无未读消息')
        return
      }

      // 获取最近 5 个发送者
      try {
        const sendersRaw: string = execSync(
          `sqlite3 "${chatDbPath}" "SELECT DISTINCT h.id FROM message m JOIN handle h ON m.handle_id = h.ROWID WHERE m.is_read = 0 AND m.is_from_me = 0 AND m.date > (strftime('%s','now','-24 hours') - 978307200) * 1000000000 ORDER BY m.date DESC LIMIT 5;" 2>/dev/null`,
          { encoding: 'utf-8', timeout: 10000 },
        )
        recentSenders = sendersRaw.trim().split('\n').filter(Boolean)
      } catch {}

      let body = `你有 ${unreadCount} 条未读 iMessage 消息`
      if (recentSenders.length > 0) {
        body += `\n最近来自：${recentSenders.join(', ')}`
      }

      pushNotification({
        type: 'info',
        title: '💬 iMessage 未读',
        body,
        channel: 'system',
      })
      logForDebugging(`[communicationScenarios] imessage-unread: ${unreadCount} unread from ${recentSenders.length} senders`)
    } catch (e) {
      logForDebugging(`[communicationScenarios] imessage-unread failed: ${(e as Error).message}`)
    }
  },
}

// ─── 导出 ───

export function getCommunicationTasks(): SmartCronTask[] {
  return [
    emailFlaggedReminder,
    emailUnreadImportant,
    slackUnread,
    calendarConflictEnhanced,
    meetingPrepReminder,
    emailUnreplied,
    contactBirthday,
    emailDailyDigest,
    imessageUnread,
  ]
}
