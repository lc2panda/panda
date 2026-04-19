// Input:  BadgeEvent（delta / reset）→ bumpBadge / resetBadge
// Output: 内存 Map<scenarioId,BadgeState> + 通过 IPC `badge:update` 通知 hit 窗刷新红圆点
// Pos:    panda-on-desk 角标聚合器；P2-T4 实装（替换 P2-T1 占位）
//         hit 窗 renderer 侧据此叠加 absolute position div + 数字徽标
//
// [NEW-FILE:#20260419-P2-02] 原 P2-T1 占位
// 2026-04-19 +08:00 agent-δ-P2-vfx · P2-T4 实装：状态持久 + 渲染通知

import type { BadgeEvent } from '../bridge/types.js'

/** 单个场景的角标状态 */
export interface BadgeState {
  count: number
  color?: string
  lastUpdated: number
}

/** 内存角标计数（按 scenarioId 索引） */
const badgeStates = new Map<string, BadgeState>()

/**
 * IPC 通道名 — main 侧 sendToHitWin('badge:update', payload) → hit renderer。
 * 抽出常量便于 dispatcher / 测试一致引用，不引入 electron 依赖。
 */
export const BADGE_UPDATE_CHANNEL = 'badge:update' as const

/** badge:update IPC 负载 — 全量快照（hit 窗 reducer 直接覆盖） */
export interface BadgeUpdatePayload {
  /** 当前所有场景角标 */
  entries: Array<{ scenarioId: string; count: number; color?: string; lastUpdated: number }>
  /** 聚合总数（hit 窗优先用此值显示总未读） */
  total: number
  /** 触发时刻 */
  ts: number
}

// ─────────────────────────────────────────────────────────────────────────────
// 渲染回调注入（main.ts 启动时注入 sendToHitWin）
// 解耦设计：badge/manager 不直接 import electron，main.ts 在 boot 时注入回调
// ─────────────────────────────────────────────────────────────────────────────

type NotifyFn = (channel: string, payload: BadgeUpdatePayload) => void

let notifyHitWin: NotifyFn | null = null

/**
 * main.ts 启动后注入 hit 窗推送回调。
 * 未注入时（如纯单测环境）也能正常累加 state，仅跳过渲染推送。
 */
export function setBadgeRendererNotifier(fn: NotifyFn | null): void {
  notifyHitWin = fn
}

function publishSnapshot(): void {
  if (!notifyHitWin) return
  const entries = Array.from(badgeStates.entries()).map(([scenarioId, st]) => ({
    scenarioId,
    count: st.count,
    color: st.color,
    lastUpdated: st.lastUpdated,
  }))
  const payload: BadgeUpdatePayload = {
    entries,
    total: getTotalCount(),
    ts: Date.now(),
  }
  try {
    notifyHitWin(BADGE_UPDATE_CHANNEL, payload)
  } catch {
    // 渲染端可能尚未 ready；吞错以保 manager 状态机健壮
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 公开 API — 供 dispatcher / 业务层调用
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 角标累加。
 * delta 默认 +1；可正可负但下限 0（负数 clamp 到 0）。
 */
export function bumpBadge(scenarioId: string, delta = 1, color?: string): BadgeState {
  const cur = badgeStates.get(scenarioId)
  const nextCount = Math.max(0, (cur?.count ?? 0) + delta)
  const next: BadgeState = {
    count: nextCount,
    color: color ?? cur?.color,
    lastUpdated: Date.now(),
  }
  badgeStates.set(scenarioId, next)
  publishSnapshot()
  return next
}

/** 角标清零 — 保留 entry 以便外部观察 lastUpdated；count=0 时 hit 窗不渲染圆点 */
export function resetBadge(scenarioId: string): void {
  const cur = badgeStates.get(scenarioId)
  badgeStates.set(scenarioId, {
    count: 0,
    color: cur?.color,
    lastUpdated: Date.now(),
  })
  publishSnapshot()
}

/** 聚合全部场景未读总数 — hit 窗顶角红圆点显示 */
export function getTotalCount(): number {
  let sum = 0
  for (const s of badgeStates.values()) sum += s.count
  return sum
}

/** 查询单个场景 state（含 0 也返回，便于 UI 决策） */
export function getBadgeState(scenarioId: string): BadgeState | undefined {
  return badgeStates.get(scenarioId)
}

/**
 * 兼容 P2-T1 入口 — bridge/server.ts dispatchEvent 仍调 dispatchBadge。
 * 保留导出以避免 byte-equal 之外的链式破坏；内部委派到 bumpBadge / resetBadge。
 */
export function dispatchBadge(event: BadgeEvent): void {
  if (event.reset) {
    resetBadge(event.scenarioId)
    return
  }
  bumpBadge(event.scenarioId, event.delta ?? 1)
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试辅助
// ─────────────────────────────────────────────────────────────────────────────

/** 测试 / 诊断辅助 — 仅供 dispatcher.test.ts / vfx.test.ts */
export function __getBadgeCountForTesting(scenarioId: string): number {
  return badgeStates.get(scenarioId)?.count ?? 0
}

/** 测试隔离 — 清空所有角标 + 解绑 notifier */
export function __resetBadgeCountsForTesting(): void {
  badgeStates.clear()
  notifyHitWin = null
}

/** 测试辅助 — 全量 snapshot */
export function __snapshotForTesting(): ReadonlyMap<string, BadgeState> {
  return new Map(badgeStates)
}
