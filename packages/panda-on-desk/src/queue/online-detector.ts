// Input:  electron powerMonitor 事件（lock-screen / unlock-screen / suspend / resume）
// Output: isOnline() 布尔状态 + subscribeOnlineChange(cb) 订阅；mac/win/linux 全平台
// Pos:    P2-T6 离线检测核心 — orchestrator 据此切换 dispatcher 入队 vs 直分发
//         严守 anthropic byte-equal — 仅 electron 内置 API，无 anthropic 通道引用
//
// [NEW-FILE:#20260419-P2-22]
// 2026-04-19 +08:00 agent-ζ-P2-queue · 通知队列 + 离线累积

/**
 * 离线判定语义：
 *   lock-screen / suspend → offline（用户离开屏幕，通知必须累积）
 *   unlock-screen / resume → online（恢复直发）
 *
 * 默认状态：online（首启假定用户在线）
 *
 * 注意 electron powerMonitor 必须在 app.whenReady() 之后访问，否则抛错。
 * 本模块用 lazy require + try/catch 延迟绑定，使纯单测（无 electron app）也能工作。
 */

export type OnlineState = boolean
export type OnlineChangeCallback = (online: OnlineState) => void

let online: OnlineState = true
const subscribers = new Set<OnlineChangeCallback>()
let powerMonitorBound = false

/**
 * powerMonitor 事件绑定 — 由 main 进程在 app.whenReady() 后调用一次。
 * 重复调用安全（第二次起为 no-op）。
 */
export function bindPowerMonitor(): void {
  if (powerMonitorBound) return
  powerMonitorBound = true
  // why: lazy require 避免在 bun:test 环境直接 import 'electron' 触发原生加载
  let powerMonitor: { on: (event: string, listener: () => void) => void } | undefined
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const electron = require('electron') as { powerMonitor?: typeof powerMonitor }
    powerMonitor = electron.powerMonitor
  } catch {
    // why: 测试环境 / Node 纯环境无 electron — 无声降级，保持 online=true
    return
  }
  if (!powerMonitor) return

  powerMonitor.on('lock-screen', () => setOnline(false))
  powerMonitor.on('unlock-screen', () => setOnline(true))
  powerMonitor.on('suspend', () => setOnline(false))
  powerMonitor.on('resume', () => setOnline(true))
}

/** 当前在线状态 — dispatcher 同步调用 */
export function isOnline(): boolean {
  return online
}

/**
 * 订阅在线状态变更。
 * 返回取消订阅函数；多次订阅同一 cb 仍只生效一次（Set 去重）。
 */
export function subscribeOnlineChange(cb: OnlineChangeCallback): () => void {
  subscribers.add(cb)
  return () => {
    subscribers.delete(cb)
  }
}

/**
 * 内部状态切换 — 同步广播给所有订阅者。
 * 任一订阅回调抛错不影响其他订阅者；错误被吞（保证 powerMonitor 主流程不崩）。
 */
function setOnline(next: OnlineState): void {
  if (online === next) return
  online = next
  for (const cb of subscribers) {
    try {
      cb(next)
    } catch (err) {
      // why: 订阅回调抛错不应中断后续订阅者；P2-T6 阶段 console.warn 便于联调
      // eslint-disable-next-line no-console
      console.warn('[on-desk:online-detector] subscriber threw:', err)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试 / 诊断辅助
// ─────────────────────────────────────────────────────────────────────────────

/** 测试辅助 — 直接模拟系统事件（lock-screen / suspend → false；unlock / resume → true） */
export function __simulatePowerEventForTesting(
  event: 'lock-screen' | 'unlock-screen' | 'suspend' | 'resume',
): void {
  if (event === 'lock-screen' || event === 'suspend') {
    setOnline(false)
  } else {
    setOnline(true)
  }
}

/** 测试隔离 — 重置在线态 + 清空订阅 + 解绑标记（下次 bindPowerMonitor 可重入） */
export function __resetOnlineDetectorForTesting(): void {
  online = true
  subscribers.clear()
  powerMonitorBound = false
}

/** 测试辅助 — 当前订阅者数量 */
export function __getSubscriberCountForTesting(): number {
  return subscribers.size
}
