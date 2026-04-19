// Input: 定时触发的生活方式场景检查请求
// Output: 倒计时、物流、备份、屏幕时间、专注模式、会议占比、云账单、证书过期的主动推送通知
// Pos: proactive/tasks/ 生活方式场景层，由 taskRegistry 注册调度

import { pushNotification } from '../../assistant/sense.js'
// P3-T4-β: panda-on-desk 联动桥接（feature('BUDDY') 内 gate；on-desk 离线静默）
import {
  pushNotification as pushDeskNotification,
  isOnDeskEnabled as isDeskOnDeskEnabled,
} from '../../desk/bridge.js'
import { getProactiveConfig, isScenarioEnabled } from '../proactiveConfig.js'
import { logForDebugging } from '../../utils/debug.js'
import { IS_MAC, IS_WIN, HOME, getUserIdleSeconds } from '../platform.js'

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

// ─── 倒计时事件 ───

const countdownEvents: SmartCronTask = {
  id: 'countdown-events',
  description: '倒计时事件提醒 · Countdown events reminder',
  cron: '0 8 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('countdown-events'),
  action: async () => {
    logForDebugging('[lifestyleScenarios] countdown-events: checking countdowns')
    try {
      const { existsSync, readFileSync } = require('fs')
      const { join } = require('path')

      const configPath = join(HOME, '.pandacc', 'config', 'countdowns.json')
      if (!existsSync(configPath)) {
        logForDebugging('[lifestyleScenarios] countdown-events: countdowns.json 不存在')
        return
      }

      const events: Array<{ name: string; date: string }> = JSON.parse(readFileSync(configPath, 'utf-8'))
      if (!Array.isArray(events) || events.length === 0) {
        logForDebugging('[lifestyleScenarios] countdown-events: 无倒计时事件')
        return
      }

      const now = new Date()
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
      const upcoming: Array<{ name: string; daysLeft: number }> = []

      for (const event of events) {
        const eventDate = new Date(event.date)
        if (isNaN(eventDate.getTime())) continue
        const diff = eventDate.getTime() - now.getTime()
        if (diff < 0) continue // 已过期
        if (diff <= sevenDaysMs) {
          upcoming.push({ name: event.name, daysLeft: Math.ceil(diff / 86400000) })
        }
      }

      if (upcoming.length === 0) {
        logForDebugging('[lifestyleScenarios] countdown-events: 无 7 天内事件')
        return
      }

      const detail = upcoming
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .map(e => `  • ${e.name}：还剩 ${e.daysLeft} 天`)
        .join('\n')

      pushNotification({
        type: 'info',
        title: '⏳ 倒计时提醒',
        body: `${upcoming.length} 个事件即将到来：\n${detail}`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 倒计时事件 overlay + gentle 音效
      try {
        if (isDeskOnDeskEnabled()) {
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'lifestyle-countdown',
            title: 'Panda · 倒计时提醒',
            body: `${upcoming.length} 个事件 7 天内到来`,
            soundCue: 'gentle',
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[lifestyleScenarios] countdown-events: ${upcoming.length} upcoming events`)
    } catch (e) {
      logForDebugging(`[lifestyleScenarios] countdown-events failed: ${(e as Error).message}`)
    }
  },
}

// ─── 包裹物流追踪（占位） ───

const packageTracking: SmartCronTask = {
  id: 'package-tracking',
  description: '包裹物流追踪 · Package tracking (placeholder)',
  cron: '0 */4 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('package-tracking'),
  action: async () => {
    logForDebugging('[lifestyleScenarios] package-tracking: checking tracking config')
    try {
      const { existsSync, readFileSync } = require('fs')
      const { join } = require('path')

      const configPath = join(HOME, '.pandacc', 'config', 'tracking.json')
      if (!existsSync(configPath)) {
        // 无配置 → 静默跳过
        logForDebugging('[lifestyleScenarios] package-tracking: tracking.json 不存在，跳过')
        return
      }

      const config = JSON.parse(readFileSync(configPath, 'utf-8'))
      const parcels: Array<{ name?: string; trackingNumber: string; carrier?: string }> =
        Array.isArray(config) ? config : config.parcels || []

      if (parcels.length === 0) {
        logForDebugging('[lifestyleScenarios] package-tracking: 无快递单号')
        return
      }

      // 占位：实际查询需配置快递 API
      const detail = parcels
        .slice(0, 5)
        .map(p => `  • ${p.name || p.trackingNumber}（${p.carrier || '未知承运商'}）：需配置快递 API 查询`)
        .join('\n')

      pushNotification({
        type: 'info',
        title: '📦 包裹物流',
        body: `${parcels.length} 个包裹待追踪：\n${detail}\n\n提示：需在 tracking.json 中配置快递 API 以获取实时状态。`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 包裹追踪 overlay + gentle
      try {
        if (isDeskOnDeskEnabled()) {
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'lifestyle-package-tracking',
            title: 'Panda · 包裹物流',
            body: `${parcels.length} 个包裹待追踪`,
            soundCue: 'gentle',
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[lifestyleScenarios] package-tracking: ${parcels.length} parcels (placeholder)`)
    } catch (e) {
      logForDebugging(`[lifestyleScenarios] package-tracking failed: ${(e as Error).message}`)
    }
  },
}

// ─── Time Machine 备份 ───

const backupStatus: SmartCronTask = {
  id: 'backup-status',
  description: '备份状态检查 · Backup status check (Time Machine / File History)',
  cron: '0 9 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('backup-status'),
  action: async () => {
    logForDebugging('[lifestyleScenarios] backup-status: checking last backup')
    try {
      const { execSync } = require('child_process')

      let lastBackupTime: Date | null = null
      let source = ''

      if (IS_MAC) {
        try {
          const raw = execSync('tmutil latestbackup 2>/dev/null', {
            encoding: 'utf-8',
            timeout: 10000,
          }).trim()
          if (raw) {
            // tmutil 返回路径如 /Volumes/Backup/Backups.backupdb/.../2026-04-01-120000
            const dateMatch = raw.match(/(\d{4}-\d{2}-\d{2}-\d{6})/)
            if (dateMatch) {
              const parts = dateMatch[1].split('-')
              // 格式: YYYY-MM-DD-HHMMSS
              const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}T${parts[3].slice(0,2)}:${parts[3].slice(2,4)}:${parts[3].slice(4,6)}`
              lastBackupTime = new Date(dateStr)
              source = 'Time Machine'
            }
          }
        } catch {
          logForDebugging('[lifestyleScenarios] backup-status: tmutil 执行失败')
        }
      } else if (IS_WIN) {
        try {
          const raw = execSync('wbadmin get versions -backupTarget:C: 2>nul', {
            encoding: 'utf-8',
            timeout: 15000,
          })
          // 解析最后一次备份时间
          const dateMatch = raw.match(/Backup time:\s*(.+)/i)
          if (dateMatch) {
            lastBackupTime = new Date(dateMatch[1].trim())
            source = 'Windows Backup'
          }
        } catch {
          // 尝试 File History
          try {
            const raw = execSync('fhmanagew.exe -status 2>nul', {
              encoding: 'utf-8',
              timeout: 10000,
            })
            if (raw.includes('Running')) {
              source = 'File History'
              // File History 运行中，视为近期有备份
              logForDebugging('[lifestyleScenarios] backup-status: File History running')
              return
            }
          } catch {}
        }
      } else {
        // Linux: 无通用备份工具检测，跳过
        logForDebugging('[lifestyleScenarios] backup-status: 非 macOS/Windows，跳过')
        return
      }

      if (!lastBackupTime || isNaN(lastBackupTime.getTime())) {
        logForDebugging('[lifestyleScenarios] backup-status: 无法获取最后备份时间')
        return
      }

      const daysSinceBackup = Math.floor((Date.now() - lastBackupTime.getTime()) / 86400000)

      if (daysSinceBackup <= 7) {
        logForDebugging(`[lifestyleScenarios] backup-status: 上次备份 ${daysSinceBackup} 天前（${source}），正常`)
        return
      }

      pushNotification({
        type: 'warning',
        title: '💾 备份提醒',
        body: `${source} 上次备份已是 ${daysSinceBackup} 天前，建议尽快执行备份以防数据丢失。`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 备份久未执行 overlay + gentle (warning 级)
      try {
        if (isDeskOnDeskEnabled()) {
          pushDeskNotification({
            kind: 'overlay',
            level: 'warning',
            scenarioId: 'lifestyle-backup-status',
            title: 'Panda · 备份提醒',
            body: `${source} 上次备份 ${daysSinceBackup} 天前`,
            soundCue: 'gentle',
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[lifestyleScenarios] backup-status: ${daysSinceBackup} days since last backup (${source})`)
    } catch (e) {
      logForDebugging(`[lifestyleScenarios] backup-status failed: ${(e as Error).message}`)
    }
  },
}

// ─── 屏幕时间统计 ───

const screenTimeStats: SmartCronTask = {
  id: 'screen-time-stats',
  description: '屏幕时间统计 · Screen time statistics',
  cron: '0 22 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('screen-time-stats'),
  action: async () => {
    logForDebugging('[lifestyleScenarios] screen-time-stats: calculating screen time')
    try {
      const { execSync } = require('child_process')

      if (IS_MAC) {
        // 尝试读取 Screen Time 数据库
        const { existsSync } = require('fs')
        const { join } = require('path')
        const knowledgeDbPath = join(HOME, 'Library', 'Application Support', 'Knowledge', 'knowledgeC.db')

        if (existsSync(knowledgeDbPath)) {
          try {
            // 查询今日屏幕使用数据
            const raw = execSync(
              `sqlite3 "${knowledgeDbPath}" "SELECT ZOBJECT.ZSTREAMNAME, SUM(ZOBJECT.ZENDDATE - ZOBJECT.ZSTARTDATE) as duration FROM ZOBJECT WHERE ZOBJECT.ZSTREAMNAME = '/app/usage' AND date(ZOBJECT.ZCREATIONDATE + 978307200, 'unixepoch', 'localtime') = date('now', 'localtime') GROUP BY ZOBJECT.ZSTREAMNAME;" 2>/dev/null`,
              { encoding: 'utf-8', timeout: 10000 },
            ).trim()

            if (raw) {
              const parts = raw.split('|')
              const totalSeconds = parseFloat(parts[1] || '0')
              const hours = Math.floor(totalSeconds / 3600)
              const mins = Math.floor((totalSeconds % 3600) / 60)

              pushNotification({
                type: 'info',
                title: '📱 今日屏幕时间',
                body: `今日屏幕使用约 ${hours} 小时 ${mins} 分钟。\n\n适当休息，保护眼睛。`,
                channel: 'system',
              })
              // why: P3-T4-β panda-on-desk 联动 — 屏幕时间统计 overlay + gentle
              try {
                if (isDeskOnDeskEnabled()) {
                  pushDeskNotification({
                    kind: 'overlay',
                    level: 'info',
                    scenarioId: 'lifestyle-screen-time',
                    title: 'Panda · 今日屏幕时间',
                    body: `${hours} 小时 ${mins} 分钟`,
                    soundCue: 'gentle',
                  })
                }
              } catch {
                // 桥接失败不阻塞 proactive 主路径
              }

              logForDebugging(`[lifestyleScenarios] screen-time-stats: ${hours}h ${mins}m from knowledgeC.db`)
              return
            }
          } catch {
            logForDebugging('[lifestyleScenarios] screen-time-stats: knowledgeC.db 查询失败，使用进程估算')
          }
        }

        // 降级：通过进程列表估算
        try {
          const psOutput = execSync('ps -eo etime,comm | head -100', {
            encoding: 'utf-8',
            timeout: 5000,
          })
          const lines = psOutput.trim().split('\n').slice(1) // 跳过 header
          let longestMinutes = 0
          for (const line of lines) {
            const timeMatch = line.trim().match(/^(?:(\d+)-)?(\d+):(\d+):(\d+)/)
            if (timeMatch) {
              const days = parseInt(timeMatch[1] || '0', 10)
              const hours = parseInt(timeMatch[2], 10)
              const mins = parseInt(timeMatch[3], 10)
              const total = days * 1440 + hours * 60 + mins
              if (total > longestMinutes) longestMinutes = total
            }
          }

          if (longestMinutes > 0) {
            const h = Math.floor(longestMinutes / 60)
            const m = longestMinutes % 60
            pushNotification({
              type: 'info',
              title: '📱 屏幕时间估算',
              body: `系统已连续运行约 ${h} 小时 ${m} 分钟（基于进程运行时间估算）。`,
              channel: 'system',
            })
            // why: P3-T4-β panda-on-desk 联动 — 屏幕时间降级估算 overlay
            try {
              if (isDeskOnDeskEnabled()) {
                pushDeskNotification({
                  kind: 'overlay',
                  level: 'info',
                  scenarioId: 'lifestyle-screen-time',
                  title: 'Panda · 屏幕时间估算',
                  body: `约 ${h} 小时 ${m} 分钟`,
                  soundCue: 'gentle',
                })
              }
            } catch {
              // 桥接失败不阻塞 proactive 主路径
            }
          }
        } catch {}
      } else {
        logForDebugging('[lifestyleScenarios] screen-time-stats: 非 macOS，暂不支持')
      }

      logForDebugging('[lifestyleScenarios] screen-time-stats: done')
    } catch (e) {
      logForDebugging(`[lifestyleScenarios] screen-time-stats failed: ${(e as Error).message}`)
    }
  },
}

// ─── 专注模式建议 ───

let focusModeNotifiedThisSession = false

const focusModeSuggest: SmartCronTask = {
  id: 'focus-mode-suggest',
  description: '专注模式建议 · Focus mode suggestion',
  cron: '*/10 * * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('focus-mode-suggest'),
  skipIf: () => focusModeNotifiedThisSession,
  action: async () => {
    logForDebugging('[lifestyleScenarios] focus-mode-suggest: checking user activity pattern')
    try {
      // 每会话最多推送 1 次
      if (focusModeNotifiedThisSession) return

      // 采样多次 idle 时间，检测频繁交互
      const samples: number[] = []
      for (let i = 0; i < 3; i++) {
        samples.push(getUserIdleSeconds())
        // 简单延迟采样（同步采样，间隔极短仅代表瞬时值）
      }

      // idle 持续 < 5 秒 → 用户极其频繁交互
      const allBusy = samples.every(s => s < 5)
      if (!allBusy) {
        logForDebugging(`[lifestyleScenarios] focus-mode-suggest: idle samples = [${samples.join(',')}]，非频繁交互`)
        return
      }

      pushNotification({
        type: 'info',
        title: '🎯 专注模式建议',
        body: '检测到你已持续高频交互超过 10 分钟，建议开启专注模式，减少干扰提升效率。',
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 专注模式建议 overlay + gentle
      try {
        if (isDeskOnDeskEnabled()) {
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'lifestyle-focus-mode-suggest',
            title: 'Panda · 专注模式建议',
            body: '高频交互已 10 分钟，建议开启专注模式',
            soundCue: 'gentle',
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      focusModeNotifiedThisSession = true
      logForDebugging('[lifestyleScenarios] focus-mode-suggest: notification sent')
    } catch (e) {
      logForDebugging(`[lifestyleScenarios] focus-mode-suggest failed: ${(e as Error).message}`)
    }
  },
}

// ─── 会议时间占比 ───

const meetingTimeRatio: SmartCronTask = {
  id: 'meeting-time-ratio',
  description: '会议时间占比统计 · Meeting time ratio analysis',
  cron: '0 18 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('meeting-time-ratio'),
  action: async () => {
    logForDebugging('[lifestyleScenarios] meeting-time-ratio: analyzing today meetings')
    try {
      const { readCalendarEvents } = await import('../../memdir/memdir.js')
      const events = await readCalendarEvents(0) // 今日事件

      if (!events || events.length === 0) {
        logForDebugging('[lifestyleScenarios] meeting-time-ratio: 今日无日历事件')
        return
      }

      // 计算会议总时长（分钟）
      let totalMeetingMinutes = 0
      const meetingKeywords = ['meeting', 'call', 'sync', 'standup', 'review', '会议', '通话', '同步', '评审']

      for (const event of events) {
        const title = ((event as any).title || (event as any).summary || '').toLowerCase()
        const isMeeting = meetingKeywords.some(kw => title.includes(kw))
        if (!isMeeting && !(event as any).isAllDay) {
          // 非全天事件也可能是会议（有参与者）
          const hasAttendees = Array.isArray((event as any).attendees) && (event as any).attendees.length > 0
          if (!hasAttendees) continue
        }
        if ((event as any).isAllDay) continue

        // 计算时长
        const start = new Date((event as any).startDate || (event as any).start)
        const end = new Date((event as any).endDate || (event as any).end)
        if (isNaN(start.getTime()) || isNaN(end.getTime())) continue
        const durationMin = (end.getTime() - start.getTime()) / 60000
        if (durationMin > 0 && durationMin < 720) { // 排除异常值
          totalMeetingMinutes += durationMin
        }
      }

      const meetingHours = totalMeetingMinutes / 60
      const workHours = 8 // 标准工作日
      const ratio = Math.round((meetingHours / workHours) * 100)

      if (meetingHours <= 4) {
        logForDebugging(`[lifestyleScenarios] meeting-time-ratio: ${meetingHours.toFixed(1)}h meetings, ratio=${ratio}%，正常`)
        return
      }

      pushNotification({
        type: 'warning',
        title: '📅 会议时间过长',
        body: `今日会议约 ${meetingHours.toFixed(1)} 小时，占工作时间 ${ratio}%。\n\n会议过多可能影响深度工作，建议合理规划。`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 会议时间过长 overlay (warning) + gentle
      try {
        if (isDeskOnDeskEnabled()) {
          pushDeskNotification({
            kind: 'overlay',
            level: 'warning',
            scenarioId: 'lifestyle-meeting-ratio',
            title: 'Panda · 会议时间过长',
            body: `今日会议 ${meetingHours.toFixed(1)} 小时（占 ${ratio}%）`,
            soundCue: 'gentle',
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[lifestyleScenarios] meeting-time-ratio: ${meetingHours.toFixed(1)}h, ${ratio}%`)
    } catch (e) {
      logForDebugging(`[lifestyleScenarios] meeting-time-ratio failed: ${(e as Error).message}`)
    }
  },
}

// ─── 云服务账单预警（占位） ───

const cloudBillingAlert: SmartCronTask = {
  id: 'cloud-billing-alert',
  description: '云服务账单预警 · Cloud billing alert (placeholder)',
  cron: '0 9 * * 1',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('cloud-billing-alert'),
  action: async () => {
    logForDebugging('[lifestyleScenarios] cloud-billing-alert: checking cloud billing config')
    try {
      const { existsSync, readFileSync } = require('fs')
      const { join } = require('path')

      const configPath = join(HOME, '.pandacc', 'config', 'cloud-billing.json')
      if (!existsSync(configPath)) {
        // 无配置 → 静默跳过
        logForDebugging('[lifestyleScenarios] cloud-billing-alert: cloud-billing.json 不存在，跳过')
        return
      }

      const config = JSON.parse(readFileSync(configPath, 'utf-8'))
      const providers: Array<{ name: string; configured: boolean }> = []

      // 检查 AWS
      if (config.aws?.accessKeyId) {
        providers.push({ name: 'AWS', configured: true })
      }
      // 检查 GCP
      if (config.gcp?.credentialsPath) {
        providers.push({ name: 'GCP', configured: true })
      }
      // 检查 Azure
      if (config.azure?.subscriptionId) {
        providers.push({ name: 'Azure', configured: true })
      }

      if (providers.length === 0) {
        logForDebugging('[lifestyleScenarios] cloud-billing-alert: 无有效的云服务凭据配置')
        return
      }

      // 占位：实际需调用各云服务 Cost Explorer API
      const detail = providers
        .map(p => `  • ${p.name}：已配置凭据，需集成 Cost Explorer API 以获取账单数据`)
        .join('\n')

      pushNotification({
        type: 'info',
        title: '☁️ 云服务账单',
        body: `检测到 ${providers.length} 个云服务配置：\n${detail}\n\n提示：完整账单查询功能待集成。`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 云账单概览 overlay + gentle
      try {
        if (isDeskOnDeskEnabled()) {
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'lifestyle-cloud-billing',
            title: 'Panda · 云服务账单',
            body: `${providers.length} 个云服务已配置凭据`,
            soundCue: 'gentle',
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[lifestyleScenarios] cloud-billing-alert: ${providers.length} providers configured (placeholder)`)
    } catch (e) {
      logForDebugging(`[lifestyleScenarios] cloud-billing-alert failed: ${(e as Error).message}`)
    }
  },
}

// ─── 签名证书过期 ───

const appleCertExpiry: SmartCronTask = {
  id: 'apple-cert-expiry',
  description: 'Apple 签名证书过期检查 · Apple codesigning certificate expiry check',
  cron: '0 9 * * 1',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('apple-cert-expiry'),
  skipIf: () => !IS_MAC,
  action: async () => {
    logForDebugging('[lifestyleScenarios] apple-cert-expiry: checking codesigning certificates')
    try {
      const { execSync } = require('child_process')

      const raw = execSync('security find-identity -v -p codesigning 2>/dev/null', {
        encoding: 'utf-8',
        timeout: 10000,
      }).trim()

      if (!raw || raw.includes('0 valid identities found')) {
        logForDebugging('[lifestyleScenarios] apple-cert-expiry: 无有效签名证书')
        return
      }

      // 解析证书 SHA-1 指纹和名称
      const certLines = raw.split('\n').filter(l => l.includes('"'))
      const expiringCerts: string[] = []
      const now = Date.now()
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

      for (const line of certLines) {
        const hashMatch = line.match(/([A-F0-9]{40})/)
        const nameMatch = line.match(/"([^"]+)"/)
        if (!hashMatch || !nameMatch) continue

        const hash = hashMatch[1]
        const name = nameMatch[1]

        // 用 openssl 检查证书过期时间
        try {
          const certPem = execSync(
            `security find-certificate -c "${name}" -p 2>/dev/null`,
            { encoding: 'utf-8', timeout: 5000 },
          )
          if (!certPem.includes('BEGIN CERTIFICATE')) continue

          const endDateStr = execSync(
            `echo "${certPem}" | openssl x509 -noout -enddate 2>/dev/null`,
            { encoding: 'utf-8', timeout: 5000 },
          ).trim()

          const dateMatch = endDateStr.match(/notAfter=(.+)/)
          if (!dateMatch) continue

          const expiryDate = new Date(dateMatch[1])
          if (isNaN(expiryDate.getTime())) continue

          const daysLeft = Math.ceil((expiryDate.getTime() - now) / 86400000)
          if (daysLeft < 30 && daysLeft >= 0) {
            expiringCerts.push(`  • ${name}：${daysLeft} 天后过期`)
          }
        } catch {}
      }

      if (expiringCerts.length === 0) {
        logForDebugging('[lifestyleScenarios] apple-cert-expiry: 所有证书在 30 天有效期内')
        return
      }

      pushNotification({
        type: 'warning',
        title: '🔐 签名证书即将过期',
        body: `${expiringCerts.length} 个代码签名证书即将过期：\n${expiringCerts.join('\n')}\n\n请及时续期，避免影响应用签名与分发。`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — Apple 签名证书过期 overlay (warning) + gentle
      try {
        if (isDeskOnDeskEnabled()) {
          pushDeskNotification({
            kind: 'overlay',
            level: 'warning',
            scenarioId: 'lifestyle-apple-cert-expiry',
            title: 'Panda · Apple 签名证书',
            body: `${expiringCerts.length} 个证书 30 天内过期`,
            soundCue: 'gentle',
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[lifestyleScenarios] apple-cert-expiry: ${expiringCerts.length} certs expiring soon`)
    } catch (e) {
      logForDebugging(`[lifestyleScenarios] apple-cert-expiry failed: ${(e as Error).message}`)
    }
  },
}

// ─── 健康趋势分析 ───

const healthTrend: SmartCronTask = {
  id: 'health-trend',
  description: '健康趋势分析 · Health trend analysis (Apple Health)',
  cron: '0 21 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('health-trend'),
  skipIf: () => !IS_MAC,
  action: async () => {
    logForDebugging('[lifestyleScenarios] health-trend: analyzing Apple Health data')
    try {
      if (!IS_MAC) return

      const { existsSync, readFileSync } = require('fs')
      const { join } = require('path')
      const { execSync } = require('child_process')

      // Apple Health 数据通过 HealthKit 导出或 shortcuts 获取
      // 方案 1: 检查用户导出的 Health 数据 (export.xml)
      const healthExportPath = join(HOME, 'Documents', 'apple_health_export', 'export.xml')
      // 方案 2: 使用 Shortcuts 命令行接口获取步数等基本指标
      let stepCount = 0
      let sleepHours = 0
      let heartRateAvg = 0
      let dataSource = ''

      // 尝试通过 shortcuts 运行预置快捷指令获取今日步数
      try {
        const raw: string = execSync(
          `shortcuts run "Get Today Steps" 2>/dev/null || echo ""`,
          { encoding: 'utf-8', timeout: 15000 },
        )
        const parsed = parseInt(raw.trim(), 10)
        if (!isNaN(parsed) && parsed > 0) {
          stepCount = parsed
          dataSource = 'Shortcuts'
        }
      } catch {}

      // 降级：从 knowledgeC.db 获取活动数据
      if (stepCount === 0) {
        try {
          const knowledgeDbPath = join(HOME, 'Library', 'Application Support', 'Knowledge', 'knowledgeC.db')
          if (existsSync(knowledgeDbPath)) {
            const raw: string = execSync(
              `sqlite3 "${knowledgeDbPath}" "SELECT ZSTREAMNAME, SUM(ZNUMBEROFSTEPS) FROM ZOBJECT WHERE ZSTREAMNAME = '/activity/steps' AND date(ZCREATIONDATE + 978307200, 'unixepoch', 'localtime') >= date('now', '-7 days', 'localtime') GROUP BY ZSTREAMNAME;" 2>/dev/null`,
              { encoding: 'utf-8', timeout: 10000 },
            )
            if (raw.trim()) {
              const parts = raw.trim().split('|')
              const weeklySteps = parseInt(parts[1] || '0', 10)
              stepCount = Math.round(weeklySteps / 7) // 日均
              dataSource = 'knowledgeC.db'
            }
          }
        } catch {}
      }

      // 降级：从 Health 导出 XML 获取最近数据
      if (stepCount === 0 && existsSync(healthExportPath)) {
        try {
          // 只读取文件末尾以获取最近记录（文件可能很大）
          const raw: string = execSync(
            `tail -200 "${healthExportPath}" | grep "StepCount" | tail -1`,
            { encoding: 'utf-8', timeout: 10000 },
          )
          const valueMatch = raw.match(/value="(\d+)"/)
          if (valueMatch) {
            stepCount = parseInt(valueMatch[1], 10)
            dataSource = 'export.xml'
          }
        } catch {}
      }

      if (stepCount === 0 && sleepHours === 0) {
        logForDebugging('[lifestyleScenarios] health-trend: 无法获取健康数据（需配置 Shortcuts 或导出 Health 数据）')
        return
      }

      const insights: string[] = []
      if (stepCount > 0) {
        insights.push(`日均步数: ${stepCount.toLocaleString()} 步`)
        if (stepCount < 5000) {
          insights.push('⚠️ 步数偏低，建议增加日常活动量')
        } else if (stepCount >= 10000) {
          insights.push('✅ 步数达标，运动量充足')
        }
      }

      if (insights.length === 0) return

      pushNotification({
        type: 'info',
        title: '❤️ 健康趋势',
        body: `${insights.join('\n')}\n\n数据来源: ${dataSource}`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 健康趋势 overlay + gentle
      try {
        if (isDeskOnDeskEnabled()) {
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'lifestyle-health-trend',
            title: 'Panda · 健康趋势',
            body: insights[0] || '今日健康数据已分析',
            soundCue: 'gentle',
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[lifestyleScenarios] health-trend: steps=${stepCount} source=${dataSource}`)
    } catch (e) {
      logForDebugging(`[lifestyleScenarios] health-trend failed: ${(e as Error).message}`)
    }
  },
}

// ─── 财务异常检测 ───

const financeAnomaly: SmartCronTask = {
  id: 'finance-anomaly',
  description: '财务异常检测 · Finance anomaly detection',
  cron: '0 20 * * *',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('finance-anomaly'),
  action: async () => {
    logForDebugging('[lifestyleScenarios] finance-anomaly: checking for anomalies')
    try {
      const { existsSync, readFileSync } = require('fs')
      const { join } = require('path')

      // 读取用户配置的财务记录路径
      const configPath = join(HOME, '.pandacc', 'config', 'finance.json')
      if (!existsSync(configPath)) {
        logForDebugging('[lifestyleScenarios] finance-anomaly: finance.json 不存在')
        return
      }

      const config = JSON.parse(readFileSync(configPath, 'utf-8'))
      const {
        csvPath,
        monthlyBudget = 10000,
        alertThresholdPercent = 80,
        largeTransactionAmount = 1000,
      } = config as {
        csvPath?: string
        monthlyBudget?: number
        alertThresholdPercent?: number
        largeTransactionAmount?: number
      }

      // 支持 CSV 交易记录文件
      if (!csvPath || !existsSync(csvPath)) {
        logForDebugging('[lifestyleScenarios] finance-anomaly: 交易记录 CSV 路径未配置或不存在')
        return
      }

      const csvContent = readFileSync(csvPath, 'utf-8')
      const lines = csvContent.trim().split('\n')
      if (lines.length < 2) return // 只有 header

      // 解析最近 30 天交易
      const now = Date.now()
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
      let monthlyTotal = 0
      const largeTransactions: Array<{ date: string; amount: number; desc: string }> = []

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        if (cols.length < 3) continue

        // 假设格式: date, description, amount (负数=支出)
        const dateStr = cols[0]
        const desc = cols[1]
        const amount = Math.abs(parseFloat(cols[2]) || 0)

        const txDate = new Date(dateStr)
        if (isNaN(txDate.getTime())) continue
        if (txDate.getTime() < thirtyDaysAgo) continue

        monthlyTotal += amount
        if (amount >= largeTransactionAmount) {
          largeTransactions.push({ date: dateStr, amount, desc })
        }
      }

      const alerts: string[] = []

      // 预算预警
      const budgetUsed = Math.round((monthlyTotal / monthlyBudget) * 100)
      if (budgetUsed >= alertThresholdPercent) {
        alerts.push(`月度支出已达预算 ${budgetUsed}%（¥${monthlyTotal.toFixed(0)} / ¥${monthlyBudget}）`)
      }

      // 大额交易
      if (largeTransactions.length > 0) {
        const details = largeTransactions
          .slice(0, 5)
          .map(t => `  • ${t.date} ¥${t.amount.toFixed(0)} ${t.desc}`)
          .join('\n')
        alerts.push(`${largeTransactions.length} 笔大额交易（≥¥${largeTransactionAmount}）：\n${details}`)
      }

      if (alerts.length === 0) {
        logForDebugging(`[lifestyleScenarios] finance-anomaly: 月度支出 ¥${monthlyTotal.toFixed(0)}，无异常`)
        return
      }

      pushNotification({
        type: 'warning',
        title: '💰 财务异常',
        body: alerts.join('\n\n'),
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 财务异常 overlay (warning) + gentle
      try {
        if (isDeskOnDeskEnabled()) {
          pushDeskNotification({
            kind: 'overlay',
            level: 'warning',
            scenarioId: 'lifestyle-finance-anomaly',
            title: 'Panda · 财务异常',
            body: `${alerts.length} 项异常 — 月支出 ¥${monthlyTotal.toFixed(0)}`,
            soundCue: 'gentle',
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[lifestyleScenarios] finance-anomaly: total=¥${monthlyTotal.toFixed(0)}, ${largeTransactions.length} large txns`)
    } catch (e) {
      logForDebugging(`[lifestyleScenarios] finance-anomaly failed: ${(e as Error).message}`)
    }
  },
}

// ─── 导出 ───

export function getLifestyleTasks(): SmartCronTask[] {
  return [
    countdownEvents,
    packageTracking,
    backupStatus,
    screenTimeStats,
    focusModeSuggest,
    meetingTimeRatio,
    cloudBillingAlert,
    appleCertExpiry,
    healthTrend,
    financeAnomaly,
  ]
}
