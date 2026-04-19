// Input:  NotificationEvent（来自 src/bridge/server.ts dispatchEvent 路由）
// Output: P2-T4 接入 — soundCue → playSound；overlay/system/badge/drag-target kind 落到对应子模块
//         P2-T3 接入 — kind='overlay' → showOverlayBubble；含 'permission_request' marker 升级为 showPermissionBubble
//         P2-T6 接入 — isOnline()=false（lock-screen / suspend）→ enqueue 离线累积，return
//         P2-T5 接入 — 入口 gate：shouldDeliverNotification + aggregateNotification（DND + 隐私 + 5min 聚合）
// Pos:    panda-on-desk 通知主战场入口；P2-T3/T4 已接管 overlay/badge/drag-target/sound，仅 system 仍占位
//         严守职责单一：本模块只做路由 + soundCue 兜底；不直触 electron API
//
// [NEW-FILE:#20260419-P2-01] 原 P2-T1 占位
// 2026-04-19 +08:00 agent-δ-P2-vfx · P2-T4 接入 sound + 显式委派 badge / drag-target
// 2026-04-19 +08:00 agent-γ-P2-overlay · P2-T3 接入 overlay 分支（bubble-window + permission-bubble）
// 2026-04-19 +08:00 agent-ζ-P2-queue · P2-T6 接入 isOnline() + enqueue 离线累积
// 2026-04-19 +08:00 agent-ε-P2-dnd-retry · P2-T5 入口 gate（隐私敏感场景 + 5min 聚合）
// 2026-04-19 +08:00 agent-β-P2-system-notify-retry · P2-T2 接入 system kind → showNativeNotification

import type { NotificationEvent, PermissionRequestEvent } from '../bridge/types.js'
import { bumpBadge } from '../badge/manager.js'
import { aggregateNotification } from '../dnd/aggregator.js'
import { shouldDeliverNotification } from '../dnd/privacy.js'
import { isInScheduledDnd } from '../dnd/schedule.js'
import { isInDnd } from '../dnd/state.js'
import { enableDragTarget } from '../dnd/target.js'
import { showOverlayBubble } from '../overlay/bubble-window.js'
import { showPermissionBubble } from '../overlay/permission-bubble.js'
import { isOnline } from '../queue/online-detector.js'
import { enqueue } from '../queue/queue.js'
import { playSound } from '../sound/player.js'
import { showNativeNotification } from './native/index.js'

/** 升级标记 — overlay event.actions 中含此 id 时升级为 permission 气泡 */
const PERMISSION_REQUEST_MARKER = 'permission_request'

function isPermissionUpgrade(event: NotificationEvent): boolean {
  if (!event.actions || event.actions.length === 0) return false
  return event.actions.some(a => a.id === PERMISSION_REQUEST_MARKER)
}

/**
 * 通知分发 — P2-T4 阶段：
 *   - kind='sound' 或 event 含 soundCue → 异步触发 playSound（10s cooldown）
 *   - kind='badge' → 委派 bumpBadge（badge.count 作 delta，缺省 +1）
 *   - kind='drag-target' → 启用拖拽接收（NotificationEvent 携 acceptKinds 时；否则保留 console 提示）
 *   - kind='system' / 'overlay' → 保留 console.log 兜底，等 P2-T2/T3 实装 native/overlay 后替换
 *
 * 任意 NotificationEvent 含 soundCue 字段 → 都异步播一声（与 kind 解耦），
 * 这是最常见的复合通知模式：overlay + sound 同发。
 */
export function dispatchNotification(event: NotificationEvent): void {
  // why: P2-T5 — 入口 gate：先判 DND + 隐私场景过滤；再判 5 分钟聚合窗口；
  //      两道闸位于其他 forward 路径之前，确保被抑制的通知不进队列、不发声、不弹 overlay。
  //      聚合仅在 DND（手动 / 计划）期间生效 — 非 DND 时间高频通知由业务方自控，避免抑制合法 burst。
  if (!shouldDeliverNotification(event)) return
  if (isInDnd() || isInScheduledDnd()) {
    const agg = aggregateNotification(event)
    if (agg.skip) return
  }
  // why: P2-T6 — 离线（屏幕锁 / 系统睡眠）期间通知必须累积，避免错过紧急 CI 失败 / 日历提醒；
  //      上线（unlock / resume）由 orchestrator 一次性 flush + 聚合 overlay
  if (!isOnline()) {
    enqueue(event)
    return
  }
  // why: soundCue 与 kind 解耦 — 业务可以发 overlay+sound 复合通知
  if (event.soundCue) {
    // 异步触发 — 不阻塞 dispatch；playSound 内部自带 cooldown
    queueMicrotask(() => {
      playSound(event.soundCue!)
    })
  }

  switch (event.kind) {
    case 'badge': {
      // why: badge.count 在 NotificationEvent 中表示"本次新增计数"（delta），
      //      与 BadgeEvent.delta 语义一致
      const delta = event.badge?.count ?? 1
      bumpBadge(event.scenarioId, delta, event.badge?.color)
      return
    }
    case 'drag-target': {
      // NotificationEvent 不直接带 acceptKinds（schema 上无此字段），
      // 仅按 scenarioId 启用一个 fallback kind=['file']；正式拖拽接收建议
      // 业务方走 DragTargetEvent 直发，更精确。
      enableDragTarget(event.scenarioId, ['file'])
      return
    }
    case 'sound': {
      // soundCue 已在上方处理；此 case 仅为枚举完整性
      return
    }
    case 'overlay': {
      if (isPermissionUpgrade(event)) {
        // why: NotificationEvent 通道兼容 — 业务方应优先直发 PermissionRequestEvent；
        //      此处用 marker actions 兜底升级，避免 dispatcher 多入口
        const permissionEvent: PermissionRequestEvent = {
          type: 'permission',
          requestId: event.scenarioId,
          toolName: event.title,
          summary: event.body ?? '',
          risk: event.level === 'error' ? 'high' : 'medium',
          ts: event.ts,
          ttlMs: event.ttlMs,
        }
        showPermissionBubble(permissionEvent)
        return
      }
      showOverlayBubble(event)
      return
    }
    case 'system': {
      // why: P2-T2 — system kind 走 native 通知（mac NotificationCenter / win toast / linux libnotify）；
      //      showNativeNotification 内部已 swallow 所有平台错误，dispatcher 不感知失败；
      //      Promise 丢弃返回值（dispatcher 同步签名）— 业务层依赖 overlay/badge 通道兜底
      void showNativeNotification({
        title: event.title,
        body: event.body,
        level: event.level,
        soundCue: event.soundCue,
      }).catch(() => {
        // why: 双重保险 — showNativeNotification 已 catch，但任何上游 microtask 异常不应冒泡
      })
      return
    }
    default: {
      // why: 未知 kind（type 系统未覆盖的扩展）— 保留 console 占位便于联调
      // eslint-disable-next-line no-console
      console.log(
        `[on-desk:notification] ${event.kind}/${event.level}/${event.scenarioId}: ${event.title}`,
      )
    }
  }
}
