// Input:  在线状态变更回调（subscribeOnlineChange）+ 队列 flush 结果
// Output: 上线 → flush + 聚合"你不在时收到 N 条通知" overlay；离线 → 仅入队
// Pos:    P2-T6 编排层 — 把 queue.ts 与 online-detector.ts 黏合到 dispatcher
//         严守 anthropic byte-equal — 不引用 anthropic 通道
//
// [NEW-FILE:#20260419-P2-23]
// 2026-04-19 +08:00 agent-ζ-P2-queue · 通知队列 + 离线累积

import type { NotificationEvent } from '../bridge/types.js'

import { flush, getPending } from './queue.js'
import { isOnline, subscribeOnlineChange } from './online-detector.js'

/**
 * 聚合 overlay 渲染回调签名。
 * 参数：被 flush 出来的全部离线通知（按 FIFO 顺序）。
 *
 * 调用方（main.ts P2-T7+）将注入真正的 overlay BrowserWindow 渲染逻辑；
 * P2-T6 阶段提供默认 stub（console.log）便于联调。
 */
export type FlushOverlayRenderer = (events: readonly NotificationEvent[]) => void

let overlayRenderer: FlushOverlayRenderer = defaultOverlayStub

let unsubscribeOnline: (() => void) | null = null

/**
 * 默认 overlay stub — P2-T7 之前的占位。
 * 输出形如：[on-desk:queue:flush] 你不在时收到 3 条通知（含 1 个 error）
 */
function defaultOverlayStub(events: readonly NotificationEvent[]): void {
  if (events.length === 0) return
  const errors = events.filter(e => e.level === 'error').length
  const warnings = events.filter(e => e.level === 'warning').length
  const tail = errors > 0 || warnings > 0 ? `（含 ${errors} 个 error / ${warnings} 个 warning）` : ''
  // eslint-disable-next-line no-console
  console.log(`[on-desk:queue:flush] 你不在时收到 ${events.length} 条通知${tail}`)
}

/**
 * 注册自定义聚合 overlay 渲染器（main.ts 启动时调用一次）。
 * 重复注册以最后一次为准；P2-T6 阶段允许测试覆盖。
 */
export function setFlushOverlayRenderer(renderer: FlushOverlayRenderer): void {
  overlayRenderer = renderer
}

/**
 * flush 队列并触发聚合 overlay。
 * - 队列为空 → 不调用 renderer（避免空 overlay）
 * - renderer 抛错 → 吞掉，记录 console.warn（不应阻断 online 状态切换）
 */
export function flushAndShow(): readonly NotificationEvent[] {
  const events = flush()
  if (events.length === 0) return events
  try {
    overlayRenderer(events)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[on-desk:orchestrator] overlay renderer threw:', err)
  }
  return events
}

/**
 * 启动编排 — 注册 online → flushAndShow 钩子。
 * 重复调用安全（先解绑旧订阅再绑新订阅）。
 *
 * 调用时机：main.ts 在 bindPowerMonitor() 之后立即调用。
 */
export function startQueueOrchestrator(): void {
  if (unsubscribeOnline) {
    unsubscribeOnline()
    unsubscribeOnline = null
  }
  unsubscribeOnline = subscribeOnlineChange(state => {
    if (state) {
      // 上线 → 一次性把离线累积的通知全弹掉
      flushAndShow()
    }
    // 离线 → no-op；dispatcher 会因 isOnline()=false 改走 enqueue 路径
  })
}

/**
 * 停止编排 — 解绑订阅。
 * 测试隔离时使用；生产侧 app.on('before-quit') 可调。
 */
export function stopQueueOrchestrator(): void {
  if (unsubscribeOnline) {
    unsubscribeOnline()
    unsubscribeOnline = null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试 / 诊断辅助
// ─────────────────────────────────────────────────────────────────────────────

/** 测试辅助 — 当前是否已订阅 online 事件 */
export function __isOrchestratorRunningForTesting(): boolean {
  return unsubscribeOnline !== null
}

/** 测试隔离 — 清空 renderer 覆盖 + 解绑订阅 */
export function __resetOrchestratorForTesting(): void {
  overlayRenderer = defaultOverlayStub
  stopQueueOrchestrator()
}

/** 测试辅助 — 暴露内存 pending 快照（便于断言） */
export function __getPendingForTesting(): readonly NotificationEvent[] {
  return getPending()
}

/** 测试辅助 — 直接读取 isOnline 状态（避免测试耦合 detector） */
export function __isOnlineForTesting(): boolean {
  return isOnline()
}
