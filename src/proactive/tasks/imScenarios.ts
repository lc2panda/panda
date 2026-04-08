// Input: 定时触发的 IM 聚合场景检查请求
// Output: 跨平台未读汇总/日历冲突/审批催办/文档更新/反向推送的主动通知
// Pos: proactive/tasks/ IM 聚合场景层，由 builtinTasks loadScenarioModules 注册调度

import { pushNotification } from '../../assistant/sense.js'
import { isScenarioEnabled } from '../proactiveConfig.js'
import { logForDebugging } from '../../utils/debug.js'

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

// ─── 辅助：安全获取 aggregator ───

async function safeGetAggregator() {
  try {
    return await import('../../connectors/aggregator.js')
  } catch {
    return null
  }
}

async function safeGetRegistry() {
  try {
    const { getConnectorRegistry } = await import('../../connectors/registry.js')
    return getConnectorRegistry()
  } catch {
    return null
  }
}

// ─── IM-01: 跨平台未读汇总 ───

const imUnreadDigest: SmartCronTask = {
  id: 'im-unread-digest',
  description: '跨平台未读汇总 · Cross-platform unread digest',
  cron: '0 */2 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('im-unread-digest'),
  action: async () => {
    logForDebugging('[imScenarios] im-unread-digest: 开始汇总各平台未读')
    try {
      const registry = await safeGetRegistry()
      if (!registry) return

      const connectors = registry.getConnectedConnectors()
      if (connectors.length === 0) {
        logForDebugging('[imScenarios] im-unread-digest: 无已连接 Connector')
        return
      }

      let totalUnread = 0
      let totalMention = 0
      const platformSummaries: string[] = []

      for (const conn of connectors) {
        try {
          if (!conn.getUnreadSummary) continue
          const summary = await conn.getUnreadSummary()
          if (summary.totalUnread === 0) continue

          totalUnread += summary.totalUnread
          totalMention += summary.mentionCount

          const mentionTag = summary.mentionCount > 0 ? ` (@${summary.mentionCount})` : ''
          platformSummaries.push(`${conn.platform}: ${summary.totalUnread}${mentionTag}`)
        } catch (e) {
          logForDebugging(`[imScenarios] im-unread-digest: ${conn.platform} 失败: ${(e as Error).message}`)
        }
      }

      if (totalUnread === 0) return

      const body = platformSummaries.join(' | ')
      pushNotification({
        type: totalMention > 0 ? 'action' : 'info',
        title: `IM 未读 ${totalUnread} 条${totalMention > 0 ? `（@${totalMention}）` : ''}`,
        body,
        channel: 'all',
      })

      // 写入工作记忆
      try {
        const { setWorkingMemory } = await import('../../assistant/workingMemory.js')
        setWorkingMemory('im-unread-digest', {
          totalUnread, totalMention,
          platforms: platformSummaries,
          fetchedAt: Date.now(),
        })
      } catch { /* 静默 */ }

      logForDebugging(`[imScenarios] im-unread-digest: ${totalUnread} 未读, ${totalMention} @me`)
    } catch (e) {
      logForDebugging(`[imScenarios] im-unread-digest 失败: ${(e as Error).message}`)
    }
  },
}

// ─── IM-02: 每日 IM 简报 ───

const imDailyBrief: SmartCronTask = {
  id: 'im-daily-brief',
  description: '每日 IM 简报 · Daily IM briefing',
  cron: '0 8 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('im-daily-brief'),
  action: async () => {
    logForDebugging('[imScenarios] im-daily-brief: 生成每日 IM 简报')
    try {
      const registry = await safeGetRegistry()
      if (!registry) return

      const connectors = registry.getConnectedConnectors()
      if (connectors.length === 0) return

      const since = Date.now() - 24 * 60 * 60 * 1000
      const sections: string[] = []

      for (const conn of connectors) {
        try {
          const items: string[] = []

          // 未读消息
          if (conn.getMessages) {
            const msgs = await conn.getMessages({ since, unreadOnly: true, limit: 50 })
            if (msgs.length > 0) items.push(`${msgs.length} 条未读消息`)
          }

          // 日历
          if (conn.getCalendar) {
            const events = await conn.getCalendar(1)
            if (events.length > 0) items.push(`${events.length} 个今日日程`)
          }

          // 任务
          if (conn.getTasks) {
            const tasks = await conn.getTasks()
            const open = tasks.filter(t => t.status === 'open' || t.status === 'in_progress')
            if (open.length > 0) items.push(`${open.length} 个待办任务`)
          }

          // 审批
          if (conn.getApprovals) {
            const approvals = await conn.getApprovals()
            const pending = approvals.filter(a => a.status === 'pending')
            if (pending.length > 0) items.push(`${pending.length} 个待审批`)
          }

          if (items.length > 0) {
            sections.push(`[${conn.platform}] ${items.join(', ')}`)
          }
        } catch (e) {
          logForDebugging(`[imScenarios] im-daily-brief: ${conn.platform} 失败: ${(e as Error).message}`)
        }
      }

      if (sections.length > 0) {
        pushNotification({
          type: 'info',
          title: 'IM 每日简报',
          body: sections.join('\n'),
          channel: 'all',
        })
      }

      logForDebugging(`[imScenarios] im-daily-brief: ${sections.length} 个平台有数据`)
    } catch (e) {
      logForDebugging(`[imScenarios] im-daily-brief 失败: ${(e as Error).message}`)
    }
  },
}

// ─── IM-03: 跨平台日历冲突检测 ───

const imCalendarSync: SmartCronTask = {
  id: 'im-calendar-sync',
  description: '跨平台日历冲突检测 · Cross-platform calendar conflict detection',
  cron: '0 20 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('im-calendar-sync'),
  action: async () => {
    logForDebugging('[imScenarios] im-calendar-sync: 检测跨平台日历冲突')
    try {
      const registry = await safeGetRegistry()
      if (!registry) return

      const connectors = registry.getConnectedConnectors()
      const allEvents: Array<{ platform: string; event: any }> = []

      for (const conn of connectors) {
        if (!conn.getCalendar) continue
        try {
          const events = await conn.getCalendar(3) // 未来 3 天
          for (const evt of events) {
            allEvents.push({ platform: conn.platform, event: evt })
          }
        } catch { /* 静默 */ }
      }

      if (allEvents.length < 2) return

      // 检测时间重叠
      const conflicts: string[] = []
      for (let i = 0; i < allEvents.length; i++) {
        for (let j = i + 1; j < allEvents.length; j++) {
          const a = allEvents[i].event
          const b = allEvents[j].event
          // 时间重叠：a.start < b.end && b.start < a.end
          if (a.startTime < b.endTime && b.startTime < a.endTime) {
            conflicts.push(
              `[${allEvents[i].platform}] "${a.title}" vs [${allEvents[j].platform}] "${b.title}"`
            )
          }
        }
      }

      if (conflicts.length > 0) {
        pushNotification({
          type: 'warning',
          title: `日历冲突 ${conflicts.length} 个`,
          body: conflicts.slice(0, 5).join('\n'),
          channel: 'all',
        })
      }

      logForDebugging(`[imScenarios] im-calendar-sync: ${allEvents.length} 事件, ${conflicts.length} 冲突`)
    } catch (e) {
      logForDebugging(`[imScenarios] im-calendar-sync 失败: ${(e as Error).message}`)
    }
  },
}

// ─── IM-04: 待审批催办 ───

const imApprovalAlert: SmartCronTask = {
  id: 'im-approval-alert',
  description: '待审批催办 · Pending approval alert',
  cron: '*/30 * * * *',
  priority: 'critical',
  enabled: true,
  condition: () => isScenarioEnabled('im-approval-alert'),
  action: async () => {
    logForDebugging('[imScenarios] im-approval-alert: 检查待审批')
    try {
      const registry = await safeGetRegistry()
      if (!registry) return

      const connectors = registry.getConnectedConnectors()
      const pendingItems: string[] = []

      for (const conn of connectors) {
        if (!conn.getApprovals) continue
        try {
          const approvals = await conn.getApprovals()
          const pending = approvals.filter(a => a.status === 'pending')

          for (const approval of pending) {
            const age = Date.now() - approval.createdAt
            const hours = Math.floor(age / 3600000)
            if (hours >= 2) { // 超过 2 小时未处理
              pendingItems.push(`[${conn.platform}] ${approval.title} (${hours}h)`)
            }
          }
        } catch { /* 静默 */ }
      }

      if (pendingItems.length > 0) {
        pushNotification({
          type: 'action',
          title: `${pendingItems.length} 个审批待处理`,
          body: pendingItems.slice(0, 5).join('\n'),
          channel: 'all',
        })
      }

      logForDebugging(`[imScenarios] im-approval-alert: ${pendingItems.length} 个超时审批`)
    } catch (e) {
      logForDebugging(`[imScenarios] im-approval-alert 失败: ${(e as Error).message}`)
    }
  },
}

// ─── IM-05: 关注文档更新通知 ───

const imDocumentUpdate: SmartCronTask = {
  id: 'im-document-update',
  description: '关注文档更新通知 · Watched document update notification',
  cron: '0 */4 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('im-document-update'),
  action: async () => {
    logForDebugging('[imScenarios] im-document-update: 检查文档更新')
    try {
      const registry = await safeGetRegistry()
      if (!registry) return

      const connectors = registry.getConnectedConnectors()
      const recentDocs: string[] = []
      const cutoff = Date.now() - 4 * 60 * 60 * 1000 // 4 小时内

      for (const conn of connectors) {
        if (!conn.getDocuments) continue
        try {
          // 搜索最近更新的文档
          const docs = await conn.getDocuments('')
          const recent = docs.filter(d => d.lastModified > cutoff)
          for (const doc of recent.slice(0, 5)) {
            recentDocs.push(`[${conn.platform}] ${doc.title} (by ${doc.lastModifiedBy || '?'})`)
          }
        } catch { /* 静默 */ }
      }

      if (recentDocs.length > 0) {
        pushNotification({
          type: 'info',
          title: `${recentDocs.length} 个文档近期更新`,
          body: recentDocs.slice(0, 5).join('\n'),
          channel: 'all',
        })
      }

      logForDebugging(`[imScenarios] im-document-update: ${recentDocs.length} 个文档更新`)
    } catch (e) {
      logForDebugging(`[imScenarios] im-document-update 失败: ${(e as Error).message}`)
    }
  },
}

// ─── IM-06: 反向推送 ───

const imReversePush: SmartCronTask = {
  id: 'im-reverse-push',
  description: '反向推送 · Reverse push (Panda Code → IM)',
  cron: '*/5 * * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('im-reverse-push'),
  action: async () => {
    logForDebugging('[imScenarios] im-reverse-push: 检查待推送通知')
    try {
      // 读取工作记忆中的待推送队列
      let queue: Array<{ platform: string; target: string; content: string }> = []
      try {
        const { getWorkingMemory } = await import('../../assistant/workingMemory.js')
        const raw = getWorkingMemory('im-reverse-push-queue')
        if (Array.isArray(raw)) queue = raw
      } catch { /* 静默 */ }

      if (queue.length === 0) return

      const registry = await safeGetRegistry()
      if (!registry) return

      let sent = 0
      const remaining: typeof queue = []

      for (const item of queue) {
        const conn = registry.getConnector(item.platform)
        if (!conn || conn.status !== 'connected' || !conn.sendMessage) {
          remaining.push(item) // 保留未发送的
          continue
        }

        try {
          await conn.sendMessage(item.target, item.content)
          sent++
        } catch {
          remaining.push(item)
        }
      }

      // 更新队列
      try {
        const { setWorkingMemory } = await import('../../assistant/workingMemory.js')
        if (remaining.length > 0) {
          setWorkingMemory('im-reverse-push-queue', remaining)
        } else {
          setWorkingMemory('im-reverse-push-queue', null)
        }
      } catch { /* 静默 */ }

      if (sent > 0) {
        logForDebugging(`[imScenarios] im-reverse-push: 已推送 ${sent} 条, 剩余 ${remaining.length} 条`)
      }
    } catch (e) {
      logForDebugging(`[imScenarios] im-reverse-push 失败: ${(e as Error).message}`)
    }
  },
}

// ─── 导出 ───

export function getIMTasks(): SmartCronTask[] {
  return [
    imUnreadDigest,
    imDailyBrief,
    imCalendarSync,
    imApprovalAlert,
    imDocumentUpdate,
    imReversePush,
  ]
}
