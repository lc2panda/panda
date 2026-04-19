// Input:  NotificationEvent（dispatcher 入口已通过 privacy gate 后调用）
// Output: { skip: boolean; mergedCount?: number } —
//         5 分钟窗口内同 scenarioId 重复通知 → skip=true 并累计 mergedCount
// Pos:    panda-on-desk DND 通知聚合；A3 §5 防 spam
//         单一职责：仅合并决策；不发通知，不持久化
//
// [NEW-FILE:#20260419-P2-19]
// 2026-04-19 +08:00 P2-T5 实装（agent-ε-P2-dnd-retry）

import type { NotificationEvent } from '../bridge/types.js'

/** 聚合窗口 — 5 分钟 */
export const AGGREGATION_WINDOW_MS = 5 * 60 * 1000

interface WindowEntry {
  /** 首次进入窗口时刻 */
  firstAt: number
  /** 最近一次命中时刻（用于滑动窗口续约） */
  lastAt: number
  /** 窗口内累计命中次数（含首次） */
  count: number
}

const windows = new Map<string, WindowEntry>()

export interface AggregationResult {
  /** true → 调用方应放弃 forward */
  skip: boolean
  /** 当 skip=true 时返回当前窗口内累计次数（含本次） */
  mergedCount?: number
}

/**
 * 通知聚合 — 5 分钟窗口同 scenarioId：
 *   - 首次：建立窗口 → { skip:false }
 *   - 窗口内重复：count+=1 → { skip:true, mergedCount }
 *   - 窗口已过期：覆盖为新首次 → { skip:false }
 *
 * 误差容忍：通过传入 now 参数支持测试注入；生产默认 Date.now()。
 */
export function aggregateNotification(
  event: NotificationEvent,
  now: number = Date.now(),
): AggregationResult {
  const key = event.scenarioId
  const entry = windows.get(key)

  if (!entry) {
    windows.set(key, { firstAt: now, lastAt: now, count: 1 })
    return { skip: false }
  }

  // 窗口过期 → 重置
  if (now - entry.firstAt >= AGGREGATION_WINDOW_MS) {
    windows.set(key, { firstAt: now, lastAt: now, count: 1 })
    return { skip: false }
  }

  // 窗口内重复 → 累计 + skip
  entry.count += 1
  entry.lastAt = now
  return { skip: true, mergedCount: entry.count }
}

/** 清理已过期窗口 — 可选维护（窗口数失控时调用） */
export function pruneExpiredWindows(now: number = Date.now()): number {
  let removed = 0
  for (const [k, v] of windows) {
    if (now - v.firstAt >= AGGREGATION_WINDOW_MS) {
      windows.delete(k)
      removed += 1
    }
  }
  return removed
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试辅助
// ─────────────────────────────────────────────────────────────────────────────

export function __resetAggregatorForTesting(): void {
  windows.clear()
}

export function __getWindowForTesting(scenarioId: string): Readonly<WindowEntry> | undefined {
  const e = windows.get(scenarioId)
  return e ? { ...e } : undefined
}

export function __getWindowCountForTesting(): number {
  return windows.size
}
