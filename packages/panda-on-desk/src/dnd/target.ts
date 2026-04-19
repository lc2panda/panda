// Input:  DragTargetEvent（enable + acceptKinds）
// Output: 占位 stub — P2-T4 接入 BrowserWindow webContents drag-drop hit-test
// Pos:    panda-on-desk 拖拽接收开关；A3 §3 #6 file-organizer 等场景
//
// [NEW-FILE:#20260419-P2-03]
// 2026-04-19 +08:00 agent-α-P2-protocol · 占位 stub
// TODO: P2-T4 实装 — webContents.on('will-navigate') + dnd 接收 region 高亮

import type { DragTargetEvent } from '../bridge/types.js'

/** 当前激活的拖拽接收场景（以 scenarioId 索引），P2-T4 接入 BrowserWindow 高亮 */
const activeDragTargets = new Map<string, { kinds: string[]; enabledAt: number }>()

/**
 * 拖拽接收开关占位 — P2-T4 将替换为：
 *   - enable=true  → renderer 侧添加 dragover/drop listener，pet 周身高亮
 *   - enable=false → 移除 listener，恢复默认外观
 */
export function dispatchDragTarget(event: DragTargetEvent): void {
  if (event.enable) {
    activeDragTargets.set(event.scenarioId, {
      kinds: event.acceptKinds,
      enabledAt: Date.now(),
    })
  } else {
    activeDragTargets.delete(event.scenarioId)
  }
  // why: 联调期可观察拖拽场景激活；P2-T4 删除
  // eslint-disable-next-line no-console
  console.log(
    `[on-desk:drag-target:stub] ${event.scenarioId} enable=${event.enable} kinds=[${event.acceptKinds.join(',')}]`,
  )
}

/** 测试辅助 — 查询某场景是否激活拖拽 */
export function __isDragTargetActiveForTesting(scenarioId: string): boolean {
  return activeDragTargets.has(scenarioId)
}

/** 测试隔离 — 清空全部激活态 */
export function __resetDragTargetsForTesting(): void {
  activeDragTargets.clear()
}
