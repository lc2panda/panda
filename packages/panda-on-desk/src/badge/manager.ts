// Input:  BadgeEvent（delta / reset）
// Output: 占位 stub — P2-T4 接入状态栏角标 / Tray icon overlay
// Pos:    panda-on-desk 角标聚合器；P2-T1 阶段仅维护内存 Map，无渲染
//
// [NEW-FILE:#20260419-P2-02]
// 2026-04-19 +08:00 agent-α-P2-protocol · 占位 stub
// TODO: P2-T4 实装 — Tray.setOverlayIcon / nativeImage badge / Linux libappindicator

import type { BadgeEvent } from '../bridge/types.js'

/** 内存角标计数；P2-T4 接入 Tray 后由 manager 单例持有 */
const badgeCounts = new Map<string, number>()

/**
 * 角标分发占位 — P2-T4 将替换为：
 *   - delta → Tray.setOverlayIcon(buildBadgeIcon(count))
 *   - reset → Tray.setOverlayIcon(null)
 *   - 多 scenarioId 聚合显示总未读
 */
export function dispatchBadge(event: BadgeEvent): void {
  if (event.reset) {
    badgeCounts.set(event.scenarioId, 0)
  } else {
    const cur = badgeCounts.get(event.scenarioId) ?? 0
    badgeCounts.set(event.scenarioId, cur + (event.delta ?? 1))
  }
  // why: 联调期可观察 badge 累计；P2-T4 删除
  // eslint-disable-next-line no-console
  console.log(
    `[on-desk:badge:stub] ${event.scenarioId}=${badgeCounts.get(event.scenarioId)}`,
  )
}

/** 测试 / 诊断辅助 — 仅供 dispatcher.test.ts */
export function __getBadgeCountForTesting(scenarioId: string): number {
  return badgeCounts.get(scenarioId) ?? 0
}

/** 测试隔离 — 清空所有角标 */
export function __resetBadgeCountsForTesting(): void {
  badgeCounts.clear()
}
