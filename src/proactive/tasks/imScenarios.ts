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
      const aggregator = await safeGetAggregator()
      if (!aggregator) return

      const unread = await aggregator.getAggregatedUnread()
      if (unread.total === 0) return

      const platformSummaries: string[] = []
      for (const [platform, summary] of unread.byPlatform) {
        if (summary.totalUnread === 0) continue
        const mentionTag = summary.mentionCount > 0 ? ` (@${summary.mentionCount})` : ''
        platformSummaries.push(`${platform}: ${summary.totalUnread}${mentionTag}`)
      }

      const body = platformSummaries.join(' | ')
      pushNotification({
        type: unread.mentionTotal > 0 ? 'action' : 'info',
        title: `IM 未读 ${unread.total} 条${unread.mentionTotal > 0 ? `（@${unread.mentionTotal}）` : ''}`,
        body,
        channel: 'all',
      })

      // 写入工作记忆
      try {
        const { setWorkingMemory } = await import('../../assistant/workingMemory.js')
        setWorkingMemory('im-unread-digest', {
          totalUnread: unread.total, totalMention: unread.mentionTotal,
          platforms: platformSummaries,
          fetchedAt: Date.now(),
        })
      } catch { /* 静默 */ }

      logForDebugging(`[imScenarios] im-unread-digest: ${unread.total} 未读, ${unread.mentionTotal} @me`)
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
      const aggregator = await safeGetAggregator()
      if (!aggregator) return

      const sections: string[] = []

      // 通过 aggregator 获取时间线（去重 + 隐私过滤后的数据）
      const timeline = await aggregator.getAggregatedTimeline({ since: Date.now() - 24 * 60 * 60 * 1000, limit: 200 })
      if (timeline.messages.length > 0) {
        // 按平台分组统计
        const platformMsgCount = new Map<string, number>()
        for (const msg of timeline.messages) {
          platformMsgCount.set(msg.platform, (platformMsgCount.get(msg.platform) || 0) + 1)
        }
        for (const [platform, count] of platformMsgCount) {
          sections.push(`[${platform}] ${count} 条未读消息`)
        }
      }

      // 通过 aggregator 获取聚合日历
      try {
        const calendar = await aggregator.getAggregatedCalendar(1)
        if (calendar.events.length > 0) {
          sections.push(`[日历] ${calendar.events.length} 个今日日程`)
          if (calendar.conflicts.length > 0) {
            sections.push(`[日历] ${calendar.conflicts.length} 个时间冲突`)
          }
        }
      } catch { /* 静默 */ }

      // 通过 aggregator 获取聚合任务
      try {
        const tasks = await aggregator.getAggregatedTasks()
        const open = tasks.filter(t => t.status === 'open' || t.status === 'in_progress')
        if (open.length > 0) {
          sections.push(`[任务] ${open.length} 个待办任务`)
        }
      } catch { /* 静默 */ }

      // 通过 aggregator 获取聚合审批
      try {
        const approvals = await aggregator.getAggregatedApprovals()
        const pending = approvals.filter(a => a.status === 'pending')
        if (pending.length > 0) {
          sections.push(`[审批] ${pending.length} 个待审批`)
        }
      } catch { /* 静默 */ }

      if (sections.length > 0) {
        pushNotification({
          type: 'info',
          title: 'IM 每日简报',
          body: sections.join('\n'),
          channel: 'all',
        })
      }

      logForDebugging(`[imScenarios] im-daily-brief: ${sections.length} 条简报项`)
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
  description: '反向推送 · Reverse push (Panda → IM)',
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

// ─── IM-07: 微信消息场景 ───

const wechatMessages: SmartCronTask = {
  id: 'wechat-messages',
  description: '微信消息监控 · WeChat message monitoring',
  cron: '*/10 * * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('wechat-messages'),
  action: async () => {
    logForDebugging('[imScenarios] wechat-messages: 检查微信消息')
    try {
      const registry = await safeGetRegistry()
      if (registry) {
        const wechatConn = registry.getConnector('wechat')
        if (wechatConn && wechatConn.status === 'connected') {
          try {
            if (wechatConn.getUnreadSummary) {
              const summary = await wechatConn.getUnreadSummary()
              if (summary.totalUnread > 0) {
                const mentionTag = summary.mentionCount > 0 ? ` (@${summary.mentionCount})` : ''
                pushNotification({
                  type: summary.mentionCount > 0 ? 'action' : 'info',
                  title: `微信未读 ${summary.totalUnread} 条${mentionTag}`,
                  body: `${summary.totalUnread} 条未读消息等待处理`,
                  channel: 'all',
                })
              }
              logForDebugging(`[imScenarios] wechat-messages: ${summary.totalUnread} unread via connector`)
              return
            }
          } catch (e) {
            logForDebugging(`[imScenarios] wechat-messages: connector 读取失败: ${(e as Error).message}`)
          }
        }
      }

      // 降级：检测微信本地数据库（macOS）
      try {
        const { existsSync } = require('fs')
        const { join } = require('path')
        const { homedir } = require('os')
        const wechatBase = join(homedir(), 'Library', 'Containers', 'com.tencent.xinWeChat', 'Data')
        if (!existsSync(wechatBase)) {
          logForDebugging('[imScenarios] wechat-messages: 未检测到微信客户端数据目录')
          return
        }
        logForDebugging('[imScenarios] wechat-messages: 微信数据库加密，建议通过 wechat MCP 插件连接')
      } catch {}
    } catch (e) {
      logForDebugging(`[imScenarios] wechat-messages 失败: ${(e as Error).message}`)
    }
  },
}

// ─── IM-08: 飞书消息场景 ───

const feishuMessages: SmartCronTask = {
  id: 'feishu-messages',
  description: '飞书消息监控 · Feishu/Lark message monitoring',
  cron: '*/10 * * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('feishu-messages'),
  action: async () => {
    logForDebugging('[imScenarios] feishu-messages: 检查飞书消息')
    try {
      const registry = await safeGetRegistry()
      if (registry) {
        const feishuConn = registry.getConnector('feishu') || registry.getConnector('lark')
        if (feishuConn && feishuConn.status === 'connected') {
          try {
            if (feishuConn.getUnreadSummary) {
              const summary = await feishuConn.getUnreadSummary()
              if (summary.totalUnread > 0) {
                const mentionTag = summary.mentionCount > 0 ? ` (@${summary.mentionCount})` : ''
                pushNotification({
                  type: summary.mentionCount > 0 ? 'action' : 'info',
                  title: `飞书未读 ${summary.totalUnread} 条${mentionTag}`,
                  body: `${summary.totalUnread} 条未读消息等待处理`,
                  channel: 'all',
                })
              }
              logForDebugging(`[imScenarios] feishu-messages: ${summary.totalUnread} unread via connector`)
              return
            }
            if (feishuConn.getMessages) {
              const since = Date.now() - 2 * 60 * 60 * 1000
              const msgs = await feishuConn.getMessages({ since, unreadOnly: true, limit: 50 })
              if (msgs.length > 0) {
                pushNotification({
                  type: 'info',
                  title: `飞书 ${msgs.length} 条新消息`,
                  body: msgs.slice(0, 3).map((m: any) => `• ${m.sender || '?'}: ${(m.content || '').slice(0, 40)}`).join('\n'),
                  channel: 'all',
                })
              }
              logForDebugging(`[imScenarios] feishu-messages: ${msgs.length} messages via connector`)
              return
            }
          } catch (e) {
            logForDebugging(`[imScenarios] feishu-messages: connector 读取失败: ${(e as Error).message}`)
          }
        }
      }

      // 降级：通过飞书 Open API
      try {
        const { existsSync, readFileSync } = require('fs')
        const { join } = require('path')
        const { homedir } = require('os')
        const configPath = join(homedir(), '.pandacc', 'config', 'feishu.json')
        if (!existsSync(configPath)) {
          logForDebugging('[imScenarios] feishu-messages: feishu.json 不存在，跳过')
          return
        }
        const config = JSON.parse(readFileSync(configPath, 'utf-8'))
        if (!config.app_id || !config.app_secret) {
          logForDebugging('[imScenarios] feishu-messages: 飞书凭据不完整')
          return
        }
        const tokenResp = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_id: config.app_id, app_secret: config.app_secret }),
        })
        const tokenData = await tokenResp.json() as any
        if (tokenData.code !== 0 || !tokenData.tenant_access_token) {
          logForDebugging(`[imScenarios] feishu-messages: token 获取失败: ${tokenData.msg}`)
          return
        }
        logForDebugging('[imScenarios] feishu-messages: 已获取 token，消息拉取需要 im:message:readonly 权限')
      } catch {}
    } catch (e) {
      logForDebugging(`[imScenarios] feishu-messages 失败: ${(e as Error).message}`)
    }
  },
}

// ─── IM-09: 钉钉消息场景 ───

const dingtalkMessages: SmartCronTask = {
  id: 'dingtalk-messages',
  description: '钉钉消息监控 · DingTalk message monitoring',
  cron: '*/10 * * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('dingtalk-messages'),
  action: async () => {
    logForDebugging('[imScenarios] dingtalk-messages: 检查钉钉消息')
    try {
      const registry = await safeGetRegistry()
      if (registry) {
        const dtConn = registry.getConnector('dingtalk')
        if (dtConn && dtConn.status === 'connected') {
          try {
            if (dtConn.getUnreadSummary) {
              const summary = await dtConn.getUnreadSummary()
              if (summary.totalUnread > 0) {
                const mentionTag = summary.mentionCount > 0 ? ` (@${summary.mentionCount})` : ''
                pushNotification({
                  type: summary.mentionCount > 0 ? 'action' : 'info',
                  title: `钉钉未读 ${summary.totalUnread} 条${mentionTag}`,
                  body: `${summary.totalUnread} 条未读消息等待处理`,
                  channel: 'all',
                })
              }
              logForDebugging(`[imScenarios] dingtalk-messages: ${summary.totalUnread} unread via connector`)
              return
            }
          } catch (e) {
            logForDebugging(`[imScenarios] dingtalk-messages: connector 读取失败: ${(e as Error).message}`)
          }
        }
      }

      // 降级：通过钉钉 Open API
      try {
        const { existsSync, readFileSync } = require('fs')
        const { join } = require('path')
        const { homedir } = require('os')
        const configPath = join(homedir(), '.pandacc', 'config', 'dingtalk.json')
        if (!existsSync(configPath)) {
          logForDebugging('[imScenarios] dingtalk-messages: dingtalk.json 不存在，跳过')
          return
        }
        const config = JSON.parse(readFileSync(configPath, 'utf-8'))
        if (!config.appKey || !config.appSecret) {
          logForDebugging('[imScenarios] dingtalk-messages: 钉钉凭据不完整')
          return
        }
        const tokenResp = await fetch(`https://oapi.dingtalk.com/gettoken?appkey=${encodeURIComponent(config.appKey)}&appsecret=${encodeURIComponent(config.appSecret)}`)
        const tokenData = await tokenResp.json() as any
        if (tokenData.errcode !== 0 || !tokenData.access_token) {
          logForDebugging(`[imScenarios] dingtalk-messages: token 获取失败: ${tokenData.errmsg}`)
          return
        }
        logForDebugging('[imScenarios] dingtalk-messages: 已获取 token，消息拉取需要相应 API 权限')
      } catch {}
    } catch (e) {
      logForDebugging(`[imScenarios] dingtalk-messages 失败: ${(e as Error).message}`)
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
    wechatMessages,
    feishuMessages,
    dingtalkMessages,
  ]
}
