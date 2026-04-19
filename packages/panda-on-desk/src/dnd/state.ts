// Input:  DndEvent（enabled + reason + endsAt）
// Output: 占位 stub — P2-T5 接入全局静音状态机 + 调度器
// Pos:    panda-on-desk DND 全局开关；A3 §5 Focus / 时段静音
//
// [NEW-FILE:#20260419-P2-03]
// 2026-04-19 +08:00 agent-α-P2-protocol · 占位 stub
// TODO: P2-T5 实装 — 调度器 + DND 期间 dispatcher 抑制 + endsAt 自动恢复

import type { DndEvent } from '../bridge/types.js'

interface DndState {
  enabled: boolean
  reason?: DndEvent['reason']
  endsAt?: number
  /** 最近一次状态变更时刻 */
  changedAt: number
}

let currentState: DndState = { enabled: false, changedAt: 0 }

/**
 * DND 状态分发占位 — P2-T5 将替换为：
 *   - enabled=true → notification dispatcher 改写 → 仅 critical 透传
 *   - endsAt 到期 → setTimeout 自动调 dispatchDnd({enabled:false})
 *   - reason='focus-mode' → 同时通知 renderer 切换 pet 主题
 */
export function dispatchDnd(event: DndEvent): void {
  currentState = {
    enabled: event.enabled,
    reason: event.reason,
    endsAt: event.endsAt,
    changedAt: Date.now(),
  }
  // why: 联调期观察 DND 切换；P2-T5 删除
  // eslint-disable-next-line no-console
  console.log(
    `[on-desk:dnd:stub] enabled=${event.enabled} reason=${event.reason ?? 'unspecified'} endsAt=${event.endsAt ?? 'never'}`,
  )
}

/** 当前 DND 状态查询 — P2-T2 dispatcher 抑制判断时调 */
export function isDndActive(): boolean {
  if (!currentState.enabled) return false
  if (currentState.endsAt && Date.now() >= currentState.endsAt) return false
  return true
}

/** 测试辅助 — 直接读 state */
export function __getDndStateForTesting(): Readonly<DndState> {
  return currentState
}

/** 测试隔离 */
export function __resetDndStateForTesting(): void {
  currentState = { enabled: false, changedAt: 0 }
}
