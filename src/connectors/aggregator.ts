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
import {
  loadPrivacyConfigResult,
  getDataRetentionCutoffMs,
  isAppExcluded,
  isDomainExcluded,
  isPathExcluded,
  type PrivacyConfig,
} from '../assistant/privacyConfig.js'

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

/**
 * Privacy block used by aggregator (exported shape for unit tests).
 * connectors.json 的 aggregator.privacy + privacy.json 合并后的有效规则。
 */
export type AggregatorPrivacyConfig = {
  filterPatterns: string[]
  excludeChannels: string[]
  excludeSenders: string[]
  /** privacy.json excludeApps（匹配 senderName / channelName） */
  excludeApps?: string[]
  /** privacy.json excludeBrowserDomains（匹配正文/附件 URL 域名） */
  excludeBrowserDomains?: string[]
  /** privacy.json excludePaths（匹配附件路径/文件名） */
  excludePaths?: string[]
  /**
   * 保留天数（仅 connector 聚合消息）。
   * - undefined：不在 override 路径做保留期裁剪（生产路径用 privacy.json）
   * - 0：不清理
   * - >0：丢弃 timestamp 早于 cutoff 的消息
   */
  dataRetentionDays?: number
}

const FILTER_FAILURE_PLACEHOLDER = '[REDACTED_FILTER_ERROR]'

/** 从文本中提取疑似 URL / 域名（用于 isDomainExcluded）。 */
const URL_OR_DOMAIN_RE =
  /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+)(?:[/:?#][^\s]*)?/gi

/** 从文本中提取疑似文件路径。 */
const PATH_CANDIDATE_RE =
  /(?:~|\/|\b[A-Za-z]:[\\/])[^\s"'<>|]+/g

function extractDomains(text: string): string[] {
  const out: string[] = []
  URL_OR_DOMAIN_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = URL_OR_DOMAIN_RE.exec(text)) !== null) {
    if (m[1]) out.push(m[1])
  }
  return out
}

function extractPathCandidates(text: string): string[] {
  const out: string[] = []
  PATH_CANDIDATE_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = PATH_CANDIDATE_RE.exec(text)) !== null) {
    if (m[0]) out.push(m[0])
  }
  return out
}

/**
 * 将 privacy.json + connectors.json privacy 合并为有效过滤规则。
 * privacy.json 损坏 → 返回 null（调用方 fail-closed）。
 */
export function resolveEffectivePrivacyConfig(
  privacyOverride?: AggregatorPrivacyConfig | null,
): AggregatorPrivacyConfig | null | 'fail-closed' {
  // 显式 null：测试/调用方要求透传
  if (privacyOverride === null) return null

  // 显式对象：仅用 override（单元测试可控）
  if (privacyOverride !== undefined) return privacyOverride

  // 生产路径：privacy.json 严格加载 + connectors 合并
  let fileCfg: PrivacyConfig
  try {
    const result = loadPrivacyConfigResult()
    if (result.status === 'error') {
      logForDebugging(
        `[aggregator] privacy.json 加载失败 (fail-closed): ${result.error}`,
        { level: 'error' },
      )
      return 'fail-closed'
    }
    fileCfg = result.config
  } catch (e) {
    logForDebugging(
      `[aggregator] privacy.json 加载异常 (fail-closed): ${(e as Error).message}`,
      { level: 'error' },
    )
    return 'fail-closed'
  }

  let connectorsPrivacy: AggregatorPrivacyConfig | null = null
  try {
    connectorsPrivacy = getConnectorsConfig().aggregator?.privacy ?? null
  } catch (e) {
    logForDebugging(
      `[aggregator] connectors 隐私配置加载失败 (fail-closed): ${(e as Error).message}`,
      { level: 'error' },
    )
    return 'fail-closed'
  }

  return {
    filterPatterns: [
      ...(fileCfg.sensitivePatterns || []),
      ...(connectorsPrivacy?.filterPatterns || []),
    ],
    excludeChannels: [...(connectorsPrivacy?.excludeChannels || [])],
    excludeSenders: [...(connectorsPrivacy?.excludeSenders || [])],
    excludeApps: [...(fileCfg.excludeApps || [])],
    excludeBrowserDomains: [...(fileCfg.excludeBrowserDomains || [])],
    excludePaths: [...(fileCfg.excludePaths || [])],
    dataRetentionDays: fileCfg.dataRetentionDays,
  }
}

/** Build a timeline-safe stand-in without reading potentially poisoned fields. */
function safeFailedMessage(msg: IMMessage): IMMessage {
  // Read each field independently so a throwing content getter cannot
  // re-throw during object spread and leak/drop inconsistently.
  const read = <T>(fn: () => T, fallback: T): T => {
    try {
      return fn()
    } catch {
      return fallback
    }
  }
  return {
    id: read(() => msg.id, 'unknown'),
    platform: read(() => msg.platform, 'unknown' as IMMessage['platform']),
    channelId: read(() => msg.channelId, ''),
    channelName: read(() => msg.channelName, ''),
    senderId: read(() => msg.senderId, ''),
    senderName: read(() => msg.senderName, ''),
    content: FILTER_FAILURE_PLACEHOLDER,
    contentType: read(() => msg.contentType, 'text'),
    timestamp: read(() => msg.timestamp, 0),
    isRead: read(() => msg.isRead, false),
    isMentioned: read(() => msg.isMentioned, false),
  }
}

/**
 * 仅过滤 connector 聚合消息的保留期（P-004）。
 * 不触及主会话 transcript / 其他存储。
 */
export function applyDataRetentionFilter(
  messages: IMMessage[],
  dataRetentionDays?: number,
  nowMs: number = Date.now(),
): IMMessage[] {
  if (dataRetentionDays === undefined) return messages
  if (!Number.isFinite(dataRetentionDays) || dataRetentionDays <= 0) return messages
  const cutoff = nowMs - Math.floor(dataRetentionDays) * 86_400_000
  return messages.filter(m => {
    try {
      return typeof m.timestamp === 'number' && m.timestamp >= cutoff
    } catch {
      // 时间戳不可读 → 丢弃（fail-closed，避免无限保留敏感残留）
      return false
    }
  })
}

/**
 * Apply privacy blocklists / content redaction to inbound IM messages.
 *
 * Semantics (fail-closed, P-002/P-003/P-004):
 * - `privacyOverride === null` → pass-through（显式关闭，测试用）
 * - `privacyOverride === undefined` → 加载 privacy.json（损坏 fail-closed）
 *   + 合并 connectors.json privacy + dataRetentionDays
 * - Single-message evaluation error → safe placeholder（不放行原文）
 * - Batch / structural failure → 空列表
 * - Invalid regex patterns are skipped（不作为 pass-all）
 * - 仅处理 connector 消息；不碰主会话 transcript
 */
export function applyPrivacyFilter(
  messages: IMMessage[],
  privacyOverride?: AggregatorPrivacyConfig | null,
): IMMessage[] {
  const resolved = resolveEffectivePrivacyConfig(privacyOverride)
  if (resolved === 'fail-closed') return []
  if (!resolved) return messages

  const privacy = resolved

  // Compile patterns individually — bad patterns are skipped, not a free pass.
  const patterns: RegExp[] = []
  for (const p of privacy.filterPatterns || []) {
    try {
      patterns.push(new RegExp(p, 'gi'))
    } catch (e) {
      logForDebugging(
        `[aggregator] 无效隐私过滤正则 ${JSON.stringify(p)} (已跳过): ${(e as Error).message}`,
        { level: 'error' },
      )
    }
  }

  // 构造轻量 PrivacyConfig 视图，复用 privacyConfig 判定函数
  const fileView: PrivacyConfig | null =
    privacy.excludeApps || privacy.excludeBrowserDomains || privacy.excludePaths
      ? {
          excludePaths: privacy.excludePaths || [],
          excludeApps: privacy.excludeApps || [],
          excludeBrowserDomains: privacy.excludeBrowserDomains || [],
          sensitivePatterns: privacy.filterPatterns || [],
          dataRetentionDays: privacy.dataRetentionDays ?? 0,
          localLLMForSensitive: true,
        }
      : null

  try {
    const excludeChannels = new Set(privacy.excludeChannels || [])
    const excludeSenders = new Set(privacy.excludeSenders || [])
    // P-004：保留期裁剪（仅 connector 聚合路径）
    const retained = applyDataRetentionFilter(messages, privacy.dataRetentionDays)
    const result: IMMessage[] = []

    for (const msg of retained) {
      try {
        if (excludeChannels.has(msg.channelId)) continue
        if (excludeSenders.has(msg.senderId)) continue

        // P-003：excludeApps → senderName / channelName
        if (fileView) {
          if (msg.senderName && isAppExcluded(msg.senderName, fileView)) continue
          if (msg.channelName && isAppExcluded(msg.channelName, fileView)) continue

          // 域名：正文 + 附件 URL
          const domainSources: string[] = [msg.content]
          if (msg.attachments) {
            for (const a of msg.attachments) {
              if (a.url) domainSources.push(a.url)
              if (a.name) domainSources.push(a.name)
            }
          }
          let excludedByDomain = false
          for (const src of domainSources) {
            for (const d of extractDomains(src)) {
              if (isDomainExcluded(d, fileView)) {
                excludedByDomain = true
                break
              }
            }
            if (excludedByDomain) break
          }
          if (excludedByDomain) continue

          // 路径：附件 name/url + 正文中的路径片段
          let excludedByPath = false
          const pathSources: string[] = [...extractPathCandidates(msg.content)]
          if (msg.attachments) {
            for (const a of msg.attachments) {
              if (a.name) pathSources.push(a.name)
              if (a.url) pathSources.push(a.url)
            }
          }
          for (const p of pathSources) {
            if (isPathExcluded(p, fileView)) {
              excludedByPath = true
              break
            }
          }
          if (excludedByPath) continue
        }

        let content = msg.content
        for (const p of patterns) {
          // Reset lastIndex for global regex reuse safety.
          p.lastIndex = 0
          content = content.replace(p, '[REDACTED]')
        }
        result.push(content === msg.content ? msg : { ...msg, content })
      } catch (e) {
        // 单条失败 → 丢弃原文，放入安全占位（不得放行未过滤原文）
        // 注意：不能 ...msg 直接展开——content 可能是会抛错的 getter。
        logForDebugging(
          `[aggregator] 单条隐私过滤失败 id=${String((msg as { id?: string })?.id ?? '?')} (占位替换, fail-closed): ${(e as Error).message}`,
          { level: 'error' },
        )
        try {
          result.push(safeFailedMessage(msg))
        } catch {
          // 连构造占位都失败则整条丢弃
        }
      }
    }

    return result
  } catch (e) {
    // 整批失败 → 空列表，不得返回未过滤全集
    logForDebugging(
      `[aggregator] 隐私过滤整批异常 (fail-closed, 返回空列表): ${(e as Error).message}`,
      { level: 'error' },
    )
    return []
  }
}

/**
 * 启动/按需清理：清空聚合缓存中可能含过期消息的条目。
 * 仅 clearAggregatorCache，绝不触碰主会话 transcript。
 */
export function purgeExpiredConnectorAggregates(): {
  cutoffMs: number | null
  cleared: boolean
} {
  try {
    const result = loadPrivacyConfigResult()
    if (result.status === 'error') {
      // fail-closed：配置不可信时清空缓存，避免继续提供可能过期/未过滤数据
      clearAggregatorCache()
      return { cutoffMs: null, cleared: true }
    }
    const cutoffMs = getDataRetentionCutoffMs(result.config)
    // 有保留期策略时清空缓存，迫使下次聚合重新按 cutoff 过滤
    if (cutoffMs !== null) {
      clearAggregatorCache()
      return { cutoffMs, cleared: true }
    }
    return { cutoffMs: null, cleared: false }
  } catch (e) {
    logForDebugging(
      `[aggregator] purgeExpiredConnectorAggregates 异常 (fail-closed 清缓存): ${(e as Error).message}`,
      { level: 'error' },
    )
    clearAggregatorCache()
    return { cutoffMs: null, cleared: true }
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
