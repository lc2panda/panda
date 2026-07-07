// Input: Feature flag state, message arrays from query loop, session storage.
// Output: Context collapse orchestration — stats, collapse triggers, recovery.
// Pos: Main entry for contextCollapse service — imported by query.ts and compact/.

import { feature } from 'bun:bundle'
import type { Message } from '../../types/message.js'
import type { ToolUseContext } from '../../Tool.js'
import type { QuerySource } from '../../constants/querySource.js'
import {
  getCommittedCollapses,
  resetCollapseState,
  identifyCollapsibleSpans,
  estimateTotalTokens,
  commitCollapse,
  extractText,
} from './operations.js'
import { getContextWindowForModel } from '../../utils/context.js'
import { getRuntimeMainLoopModel } from '../../utils/model/model.js'
import { getSdkBetas } from '../../bootstrap/state.js'
import { getLastSnapshot } from './persist.js'

export { projectView } from './operations.js'
export { restoreFromEntries } from './persist.js'

export interface ContextCollapseHealth {
  totalSpawns: number
  totalErrors: number
  lastError: string | null
  emptySpawnWarningEmitted: boolean
  totalEmptySpawns: number
}

export interface ContextCollapseStats {
  collapsedSpans: number
  collapsedMessages: number
  stagedSpans: number
  health: ContextCollapseHealth
}

export interface CollapseResult {
  messages: Message[]
}

export interface DrainResult {
  committed: number
  messages: Message[]
}

// 模块状态
let enabled = false
const listeners: Set<() => void> = new Set()
const health: ContextCollapseHealth = {
  totalSpawns: 0,
  totalErrors: 0,
  lastError: null,
  emptySpawnWarningEmitted: false,
  totalEmptySpawns: 0,
}

function notifyListeners(): void {
  for (const cb of listeners) {
    try { cb() } catch {}
  }
}

export const isContextCollapseEnabled: () => boolean = () => {
  return enabled
}

export const initContextCollapse: () => void = () => {
  enabled = feature('CONTEXT_COLLAPSE') ||
    process.env.PANDA_CONTEXT_COLLAPSE === '1'
}

export const subscribe: (callback: () => void) => () => void = (callback) => {
  listeners.add(callback)
  return () => { listeners.delete(callback) }
}

export const getStats: () => ContextCollapseStats = () => {
  const collapses = getCommittedCollapses()
  const snapshot = getLastSnapshot()
  return {
    collapsedSpans: collapses.length,
    collapsedMessages: collapses.reduce((sum, c) => sum + c.archivedUuids.length, 0),
    stagedSpans: snapshot?.staged?.length ?? 0,
    health: { ...health },
  }
}

export const applyCollapsesIfNeeded: (
  messages: Message[],
  toolUseContext: ToolUseContext,
  querySource: QuerySource,
) => Promise<CollapseResult> = async (messages, _toolUseContext, querySource) => {
  if (!enabled) return { messages }

  // 防递归：compact/session_memory 等内部查询不折叠
  if (['compact', 'session_memory', 'marble_origami', 'model_validation'].includes(querySource)) {
    return { messages }
  }

  health.totalSpawns++

  // 估算当前 token — 从模型实际上下文窗口获取，避免硬编码
  const totalTokens = estimateTotalTokens(messages)
  let contextWindow: number
  try {
    const model = getRuntimeMainLoopModel({
      permissionMode: 'default',
      mainLoopModel: '',
    })
    contextWindow = getContextWindowForModel(model, getSdkBetas())
  } catch {
    contextWindow = 200_000 // fallback：无法获取模型信息时使用保守默认值
  }
  const threshold = contextWindow * 0.6 // 60%

  if (totalTokens < threshold) {
    health.totalEmptySpawns++
    if (health.totalEmptySpawns > 5 && !health.emptySpawnWarningEmitted) {
      health.emptySpawnWarningEmitted = true
    }
    return { messages }
  }

  // 识别可折叠 span
  const spans = identifyCollapsibleSpans(messages)
  if (spans.length === 0) return { messages }

  // 逐个折叠最低 risk 的 span，直到 token < 55%
  const target = contextWindow * 0.55
  let current = messages
  let currentTokens = totalTokens
  let committed = 0

  for (const span of spans) {
    if (currentTokens <= target) break
    if (committed >= 3) break // 每次最多折叠 3 个 span

    // 重新计算 span 在当前消息数组中的索引
    const startIdx = current.findIndex(m => (m.uuid as string) === span.startUuid)
    const endIdx = current.findIndex(m => (m.uuid as string) === span.endUuid)
    if (startIdx < 0 || endIdx < 0 || startIdx > endIdx) continue

    const adjustedSpan = { ...span, startIdx, endIdx }
    try {
      const result = commitCollapse(current, adjustedSpan)
      current = result.messages
      currentTokens -= span.tokenEstimate
      committed++

      // 持久化到 sessionStorage
      try {
        const sessionStorage = require('../../utils/sessionStorage.js')
        if (typeof sessionStorage.recordContextCollapseCommit === 'function') {
          sessionStorage.recordContextCollapseCommit({
            collapseId: result.collapse.collapseId,
            summaryUuid: result.collapse.summaryPlaceholder.uuid,
            summaryContent: extractText(result.collapse.summaryPlaceholder.message?.content),
            summary: span.summary,
            firstArchivedUuid: span.startUuid,
            lastArchivedUuid: span.endUuid,
          }).catch(() => {})
        }
      } catch {}
    } catch (err: any) {
      health.totalErrors++
      health.lastError = err?.message ?? String(err)
    }
  }

  if (committed > 0) notifyListeners()

  return { messages: current }
}

export const isWithheldPromptTooLong: (
  message: Message,
  isPromptTooLongMessage: (msg: Message) => boolean,
  querySource: QuerySource,
) => boolean = (message, isPromptTooLongMessage, _querySource) => {
  // 如果 contextCollapse 启用且消息是 promptTooLong 类型，
  // 可以尝试折叠后重试
  if (!enabled) return false
  return isPromptTooLongMessage(message)
}

export const recoverFromOverflow: (
  messages: Message[],
  querySource: QuerySource,
) => DrainResult = (messages, _querySource) => {
  if (!enabled) return { committed: 0, messages }

  // 放宽条件：活跃窗口从 5 缩小到 2
  const spans = identifyCollapsibleSpans(messages, 2, 2)
  let current = messages
  let committed = 0

  for (const span of spans) {
    const startIdx = current.findIndex(m => (m.uuid as string) === span.startUuid)
    const endIdx = current.findIndex(m => (m.uuid as string) === span.endUuid)
    if (startIdx < 0 || endIdx < 0) continue

    try {
      const result = commitCollapse(current, { ...span, startIdx, endIdx })
      current = result.messages
      committed++
    } catch (err: any) {
      health.totalErrors++
      health.lastError = err?.message ?? String(err)
    }
  }

  if (committed > 0) notifyListeners()

  return { committed, messages: current }
}

export const resetContextCollapse: () => void = () => {
  resetCollapseState()
  enabled = false
  health.totalSpawns = 0
  health.totalErrors = 0
  health.lastError = null
  health.emptySpawnWarningEmitted = false
  health.totalEmptySpawns = 0
  notifyListeners()
}
