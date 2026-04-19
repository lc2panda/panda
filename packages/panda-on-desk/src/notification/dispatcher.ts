// Input:  NotificationEvent（来自 src/bridge/server.ts dispatchEvent 路由）
// Output: 占位 stub — P2-T2 接入 native 通知后端（osascript / BurntToast / notify-send）
// Pos:    panda-on-desk 通知主战场入口；P2-T1 阶段仅留接口骨架，确保 dispatchEvent 不崩
//
// [NEW-FILE:#20260419-P2-01]
// 2026-04-19 +08:00 agent-α-P2-protocol · 占位 stub
// TODO: P2-T2 实装 — 三平台 native 通知 + overlay 渲染窗口

import type { NotificationEvent } from '../bridge/types.js'

/**
 * 通知分发占位 — P2-T2 将替换为：
 *   - kind='system' → osascript / BurntToast / notify-send
 *   - kind='overlay' → BrowserWindow show + 卡片堆叠
 *   - kind='sound' → Electron sound API / aplay / afplay
 *
 * P2-T1 阶段仅 console.log + 早返，保证协议层联调可见。
 */
export function dispatchNotification(event: NotificationEvent): void {
  // why: 早期阶段保留 console.log 以便联调时观察 IPC 路径；P2-T2 删除
  // eslint-disable-next-line no-console
  console.log(
    `[on-desk:notification:stub] ${event.kind}/${event.level}/${event.scenarioId}: ${event.title}`,
  )
}
