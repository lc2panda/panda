// Input: 来自多个 IMConnector 的异构数据
// Output: 统一时间线视图、去重后的聚合数据、Markdown 简报
// Pos: connectors/ 聚合核心，被 imScenarios 和 REPL 调用

import type {
  IMMessage,
  CalendarEvent,
  IMTask,
  IMApproval,
  UnreadSummary,
  MessageQuery,
  ConnectorPlatform,
  AggregatedTimeline,
  AggregatedUnread,
  AggregatedCalendar,
} from './types.js'
import { getConnectorRegistry } from './registry.js'
import { getConnectorsConfig } from './config.js'
import { logForDebugging } from 'src/utils/debug.js'

// ─── LRU 缓存层（5 分钟 TTL） ───

interface CacheEntry<T> {
  data: T
  fetchedAt: number
  ttl: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const MAX_CACHE_ENTRIES = 64

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.fetchedAt > entry.ttl * 1000) {
    cache.delete(key)
    return null
  }
  // LRU reinsert：删除再 set，使最近访问的条目移到 Map 末尾
  cache.delete(key)
  cache.set(key, entry)
  return entry.data as T
}

function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  // LRU 淘汰：超过上限时删除最早条目
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = cache.keys().next().value
    if (firstKey) cache.delete(firstKey)
  }
  cache.set(key, { data, fetchedAt: Date.now(), ttl: ttlSeconds })
}

export function clearAggregatorCache(): void {
  cache.clear()
}

// ─── 去重引擎 ───

/**
 * 基于内容指纹去重：同一发送者 + 相近时间 + 相同内容前 100 字符 = 重复。
 */
function deduplicateMessages(messages: IMMessage[], windowMs: number = 5000): IMMessage[] {
  const seen = new Map<string, IMMessage>()

  for (const msg of messages) {
    const fingerprint = `${msg.platform}:${msg.senderId}:${msg.content.slice(0, 100)}`
    const existing = seen.get(fingerprint)
    if (existing && Math.abs(existing.timestamp - msg.timestamp) < windowMs) {
      continue
    }
    seen.set(fingerprint, msg)
  }

  return [...seen.values()]
}

// ─── 隐私过滤 ───

function applyPrivacyFilter(messages: IMMessage[]): IMMessage[] {
  try {
    const config = getConnectorsConfig()
    const privacy = config.aggregator?.privacy
    if (!privacy) return messages

    const patterns = privacy.filterPatterns.map(p => new RegExp(p, 'gi'))
    const excludeChannels = new Set(privacy.excludeChannels || [])
    const excludeSenders = new Set(privacy.excludeSenders || [])

    return messages
      .filter(m => !excludeChannels.has(m.channelId) && !excludeSenders.has(m.senderId))
      .map(m => ({
        ...m,
        content: patterns.reduce((c, p) => c.replace(p, '[REDACTED]'), m.content),
      }))
  } catch (e) {
    logForDebugging(`[aggregator] 隐私过滤异常: ${(e as Error).message}`)
    return messages
  }
}

// ─── 聚合方法 ───

/**
 * 统一时间线：跨平台消息按时间排序。
 */
export async function getUnifiedTimeline(since: Date, limit?: number): Promise<IMMessage[]> {
  try {
    const opts: MessageQuery = {
      since: since.getTime(),
      limit: limit || 200,
    }
    const timeline = await getAggregatedTimeline(opts)
    return timeline.messages
  } catch (e) {
    logForDebugging(`[aggregator] getUnifiedTimeline 异常: ${(e as Error).message}`)
    return []
  }
}

export async function getAggregatedTimeline(opts: MessageQuery = {}): Promise<AggregatedTimeline> {
  const cacheKey = `timeline:${JSON.stringify(opts)}`
  const cached = getCached<AggregatedTimeline>(cacheKey)
  if (cached) return cached

  const registry = getConnectorRegistry()
  const connectors = registry.getConnectedConnectors()
  const config = getConnectorsConfig()

  const defaultSince = opts.since || Date.now() - 24 * 60 * 60 * 1000
  const query: MessageQuery = { ...opts, since: defaultSince }

  const results = await Promise.allSettled(
    connectors
      .filter(c => c.capabilities.has('messages.read') && c.getMessages)
      .map(async c => {
        try {
          return await c.getMessages!(query)
        } catch (e) {
          logForDebugging(`[aggregator] ${c.platform} getMessages failed: ${(e as Error).message}`)
          return [] as IMMessage[]
        }
      })
  )

  let allMessages: IMMessage[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allMessages.push(...result.value)
    }
  }

  // 去重
  if (config.aggregator?.deduplication !== false) {
    allMessages = deduplicateMessages(allMessages, config.aggregator?.deduplicationWindowMs)
  }

  // 隐私过滤
  allMessages = applyPrivacyFilter(allMessages)

  // 按时间排序（最新在前）
  allMessages.sort((a, b) => b.timestamp - a.timestamp)

  // 裁剪
  const maxMessages = config.aggregator?.maxMessagesPerQuery || 500
  allMessages = allMessages.slice(0, maxMessages)

  const timeline: AggregatedTimeline = {
    messages: allMessages,
    totalCount: allMessages.length,
    platforms: [...new Set(allMessages.map(m => m.platform))],
    timeRange: {
      start: allMessages.length > 0 ? allMessages[allMessages.length - 1].timestamp : defaultSince,
      end: allMessages.length > 0 ? allMessages[0].timestamp : Date.now(),
    },
    fetchedAt: Date.now(),
  }

  setCache(cacheKey, timeline, config.aggregator?.cacheGlobalTtlSeconds || 60)
  return timeline
}

/**
 * 各平台未读汇总。
 */
export async function getUnifiedUnread(): Promise<Map<ConnectorPlatform, UnreadSummary>> {
  try {
    const aggregated = await getAggregatedUnread()
    return aggregated.byPlatform
  } catch (e) {
    logForDebugging(`[aggregator] getUnifiedUnread 异常: ${(e as Error).message}`)
    return new Map()
  }
}

export async function getAggregatedUnread(): Promise<AggregatedUnread> {
  const cached = getCached<AggregatedUnread>('unread-summary')
  if (cached) return cached

  const registry = getConnectorRegistry()
  const connectors = registry.getConnectedConnectors()

  const byPlatform = new Map<ConnectorPlatform, UnreadSummary>()
  let total = 0, mentionTotal = 0, urgentTotal = 0

  const results = await Promise.allSettled(
    connectors
      .filter(c => c.capabilities.has('unread.summary') && c.getUnreadSummary)
      .map(async c => {
        try {
          return await c.getUnreadSummary!()
        } catch (e) {
          logForDebugging(`[aggregator] ${c.platform} getUnreadSummary failed: ${(e as Error).message}`)
          return null
        }
      })
  )

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const summary = result.value
      byPlatform.set(summary.platform, summary)
      total += summary.totalUnread
      mentionTotal += summary.mentionCount
      urgentTotal += summary.urgentCount
    }
  }

  const aggregated: AggregatedUnread = {
    total,
    mentionTotal,
    urgentTotal,
    byPlatform,
    fetchedAt: Date.now(),
  }

  setCache('unread-summary', aggregated, 60)
  return aggregated
}

/**
 * 聚合日历（含冲突检测）。
 */
export async function getUnifiedCalendar(days: number): Promise<CalendarEvent[]> {
  try {
    const aggregated = await getAggregatedCalendar(days)
    return aggregated.events
  } catch (e) {
    logForDebugging(`[aggregator] getUnifiedCalendar 异常: ${(e as Error).message}`)
    return []
  }
}

export async function getAggregatedCalendar(days: number = 3): Promise<AggregatedCalendar> {
  const cacheKey = `calendar:${days}`
  const cached = getCached<AggregatedCalendar>(cacheKey)
  if (cached) return cached

  const registry = getConnectorRegistry()
  const connectors = registry.getConnectedConnectors()

  let allEvents: CalendarEvent[] = []

  const results = await Promise.allSettled(
    connectors
      .filter(c => c.capabilities.has('calendar.read') && c.getCalendar)
      .map(async c => {
        try {
          return await c.getCalendar!(days)
        } catch (e) {
          logForDebugging(`[aggregator] ${c.platform} getCalendar failed: ${(e as Error).message}`)
          return [] as CalendarEvent[]
        }
      })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allEvents.push(...result.value)
    }
  }

  // 按开始时间排序
  allEvents.sort((a, b) => a.startTime - b.startTime)

  // 冲突检测
  const conflicts: Array<{ a: CalendarEvent; b: CalendarEvent }> = []
  for (let i = 0; i < allEvents.length; i++) {
    for (let j = i + 1; j < allEvents.length; j++) {
      const a = allEvents[i], b = allEvents[j]
      if (a.isAllDay || b.isAllDay) continue
      if (a.status === 'cancelled' || b.status === 'cancelled') continue
      if (a.startTime < b.endTime && a.endTime > b.startTime) {
        conflicts.push({ a, b })
      }
    }
  }

  const aggregated: AggregatedCalendar = {
    events: allEvents,
    conflicts,
    fetchedAt: Date.now(),
  }

  setCache(cacheKey, aggregated, 300)
  return aggregated
}

/**
 * 聚合待办任务。
 */
export async function getAggregatedTasks(): Promise<IMTask[]> {
  const cached = getCached<IMTask[]>('tasks')
  if (cached) return cached

  const registry = getConnectorRegistry()
  const connectors = registry.getConnectedConnectors()

  let allTasks: IMTask[] = []

  const results = await Promise.allSettled(
    connectors
      .filter(c => c.capabilities.has('tasks.read') && c.getTasks)
      .map(async c => {
        try {
          return await c.getTasks!()
        } catch (e) {
          logForDebugging(`[aggregator] ${c.platform} getTasks failed: ${(e as Error).message}`)
          return [] as IMTask[]
        }
      })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allTasks.push(...result.value)
    }
  }

  // 按优先级 + 截止日期排序
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
  allTasks.sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
    if (pDiff !== 0) return pDiff
    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate
    if (a.dueDate) return -1
    return 1
  })

  setCache('tasks', allTasks, 300)
  return allTasks
}

/**
 * 聚合审批。
 */
export async function getAggregatedApprovals(): Promise<IMApproval[]> {
  const cached = getCached<IMApproval[]>('approvals')
  if (cached) return cached

  const registry = getConnectorRegistry()
  const connectors = registry.getConnectedConnectors()

  let allApprovals: IMApproval[] = []

  const results = await Promise.allSettled(
    connectors
      .filter(c => c.capabilities.has('approvals.read') && c.getApprovals)
      .map(async c => {
        try {
          return await c.getApprovals!()
        } catch (e) {
          logForDebugging(`[aggregator] ${c.platform} getApprovals failed: ${(e as Error).message}`)
          return [] as IMApproval[]
        }
      })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allApprovals.push(...result.value)
    }
  }

  // pending 在前，按创建时间降序
  allApprovals.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    return b.createdAt - a.createdAt
  })

  setCache('approvals', allApprovals, 300)
  return allApprovals
}

/**
 * 生成 Markdown 格式的多平台简报。
 */
export async function generateDigest(): Promise<string> {
  try {
    const [unread, timeline, tasks, approvals] = await Promise.allSettled([
      getAggregatedUnread(),
      getAggregatedTimeline({ limit: 20 }),
      getAggregatedTasks(),
      getAggregatedApprovals(),
    ])

    const lines: string[] = ['# IM 简报\n']

    // 未读汇总
    if (unread.status === 'fulfilled') {
      const u = unread.value
      lines.push(`## 未读消息`)
      lines.push(`- 总计 **${u.total}** 条未读，其中 **${u.mentionTotal}** 条 @我，**${u.urgentTotal}** 条加急`)
      for (const [platform, summary] of u.byPlatform) {
        lines.push(`  - ${platform}: ${summary.totalUnread} 未读${summary.mentionCount > 0 ? ` (${summary.mentionCount} @我)` : ''}`)
      }
      lines.push('')
    }

    // 最近消息
    if (timeline.status === 'fulfilled' && timeline.value.messages.length > 0) {
      lines.push(`## 最近消息（Top ${timeline.value.messages.length}）`)
      for (const msg of timeline.value.messages.slice(0, 10)) {
        const time = new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour12: false })
        const mention = msg.isMentioned ? ' **[@我]**' : ''
        lines.push(`- [${msg.platform}] ${time} **${msg.senderName}** (${msg.channelName}): ${msg.content.slice(0, 80)}${mention}`)
      }
      lines.push('')
    }

    // 待办任务
    if (tasks.status === 'fulfilled' && tasks.value.length > 0) {
      const pendingTasks = tasks.value.filter(t => t.status !== 'done' && t.status !== 'cancelled')
      if (pendingTasks.length > 0) {
        lines.push(`## 待办任务 (${pendingTasks.length})`)
        for (const task of pendingTasks.slice(0, 10)) {
          const due = task.dueDate ? ` (截止: ${new Date(task.dueDate).toLocaleDateString('zh-CN')})` : ''
          lines.push(`- [${task.platform}] [${task.priority}] ${task.title}${due}`)
        }
        lines.push('')
      }
    }

    // 待审批
    if (approvals.status === 'fulfilled') {
      const pending = approvals.value.filter(a => a.status === 'pending')
      if (pending.length > 0) {
        lines.push(`## 待审批 (${pending.length})`)
        for (const approval of pending.slice(0, 10)) {
          lines.push(`- [${approval.platform}] ${approval.title} — ${approval.initiator} (${approval.type})`)
        }
        lines.push('')
      }
    }

    if (lines.length <= 1) {
      lines.push('暂无 IM 数据（可能所有 Connector 尚未连接）。\n')
    }

    return lines.join('\n')
  } catch (e) {
    logForDebugging(`[aggregator] generateDigest 异常: ${(e as Error).message}`)
    return '# IM 简报\n\n生成简报时出错，请检查 Connector 连接状态。\n'
  }
}
