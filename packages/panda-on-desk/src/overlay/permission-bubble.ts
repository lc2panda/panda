// Input:  PermissionRequestEvent（panda CLI POST /event 推过来）/ overlay 升级路径
//         （NotificationEvent.actions 含 'permission_request' marker）
// Output: 复用 bubble-window 的 BrowserWindow，特化为 Allow / Deny 双按钮
//         按钮回调 → 通过 SSE bridge 推回 panda CLI（ReversePermissionResponse）
// Pos:    panda-on-desk 权限气泡入口；P2-T3 实装
//         全局快捷键 Ctrl+Shift+Y / Ctrl+Shift+N 在 shortcuts/global.ts 注册并最终回调到此
//
// Forked from clawd-on-desk@4b07658:src/permission.js (MIT License)
// — 仅保留按钮 / SSE 推回部分，几何 / 排版交给 bubble-window 模块。
//
// [NEW-FILE:#20260419-P2-12]
// 2026-04-19 +08:00 agent-γ-P2-overlay · P2-T3 实装

import type { PermissionRequestEvent, ReversePermissionResponse } from '../bridge/types.js'

import {
  __findOverlayEntryForTesting,
  showOverlayBubble,
  type OverlayHandle,
} from './bubble-window.js'

// ─────────────────────────────────────────────────────────────────────────────
// SSE 反向通道注入（main.ts 启动后注入 bridgeHandle.broadcast）
// 解耦设计：permission-bubble 不直接 import bridge/server.ts，避免循环
// ─────────────────────────────────────────────────────────────────────────────

type PermissionResponseSink = (msg: ReversePermissionResponse) => void

let responseSink: PermissionResponseSink | null = null

/**
 * main.ts 启动后注入 SSE broadcast。
 * 未注入时按钮回调静默成功（按钮交互仍正常，仅不向 panda CLI 推回 — 测试场景常见）。
 */
export function setPermissionResponseSink(fn: PermissionResponseSink | null): void {
  responseSink = fn
}

// ─────────────────────────────────────────────────────────────────────────────
// 内部 — 当前 pending permissions（用于全局快捷键回调拿"最新一个"）
// ─────────────────────────────────────────────────────────────────────────────

interface PendingPermission {
  overlayId: string
  requestId: string
  resolved: boolean
}

const pending: PendingPermission[] = []

function resolveLatest(decision: 'approve' | 'deny'): boolean {
  // 找最新未 resolved 的请求
  for (let i = pending.length - 1; i >= 0; i -= 1) {
    const p = pending[i]
    if (!p.resolved) {
      handleDecision(p.overlayId, p.requestId, decision)
      return true
    }
  }
  return false
}

function handleDecision(
  overlayId: string,
  requestId: string,
  decision: 'approve' | 'deny',
): void {
  const p = pending.find(x => x.overlayId === overlayId && x.requestId === requestId)
  if (!p || p.resolved) return
  p.resolved = true

  if (responseSink) {
    try {
      responseSink({
        type: 'permission-response',
        requestId,
        decision,
        ts: Date.now(),
      })
    } catch {
      // sink 异常不影响后续按钮关闭
    }
  }

  // 关闭 overlay
  const entry = __findOverlayEntryForTesting(overlayId)
  if (entry && !entry.win.isDestroyed()) {
    try {
      entry.win.close()
    } catch {
      // ignore
    }
  }

  // 移出 pending（按 overlayId）
  const idx = pending.findIndex(x => x.overlayId === overlayId)
  if (idx !== -1) pending.splice(idx, 1)
}

// ─────────────────────────────────────────────────────────────────────────────
// 公开 API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 显示权限气泡。
 * 内部走 showOverlayBubble + 把 PermissionRequestEvent 转成 NotificationEvent shape，
 * 外加 'allow' / 'deny' 两个 NotificationAction（带 shortcut 提示）。
 *
 * 返回 OverlayHandle；不可用（factory 未注入）时返回 null。
 */
export function showPermissionBubble(event: PermissionRequestEvent): OverlayHandle | null {
  const handle = showOverlayBubble({
    type: 'notification',
    kind: 'overlay',
    level: event.risk === 'critical' || event.risk === 'high' ? 'error' : 'warning',
    scenarioId: 'permission-request',
    title: `Permission: ${event.toolName}`,
    body: event.summary,
    ttlMs: event.ttlMs,
    actions: [
      { id: 'allow', label: 'Allow', primary: true, shortcut: 'Ctrl+Shift+Y' },
      { id: 'deny', label: 'Deny', shortcut: 'Ctrl+Shift+N' },
      // marker — 让 dispatcher 不要再次升级；同时让 renderer 切到双按钮模板
      { id: 'permission_request', label: '__marker__' },
    ],
    ts: event.ts,
  })

  if (!handle) return null

  pending.push({ overlayId: handle.id, requestId: event.requestId, resolved: false })

  // 监听 renderer 的按钮点击（与 bubble.html 的 `permission-decide` ipc 对齐）
  // 测试不会触发 — 测试通过 __triggerPermissionDecisionForTesting 直调 handleDecision
  handle.win.webContents.on('permission-decide', (...args: unknown[]) => {
    const behavior = args[0]
    if (behavior === 'allow') {
      handleDecision(handle.id, event.requestId, 'approve')
    } else if (behavior === 'deny' || behavior === 'deny-and-focus') {
      handleDecision(handle.id, event.requestId, 'deny')
    }
  })

  return handle
}

/** 全局快捷键 — Ctrl+Shift+Y → 批准最新 pending */
export function hotkeyAllowLatest(): boolean {
  return resolveLatest('approve')
}

/** 全局快捷键 — Ctrl+Shift+N → 拒绝最新 pending */
export function hotkeyDenyLatest(): boolean {
  return resolveLatest('deny')
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试辅助
// ─────────────────────────────────────────────────────────────────────────────

export function __triggerPermissionDecisionForTesting(
  overlayId: string,
  requestId: string,
  decision: 'approve' | 'deny',
): void {
  handleDecision(overlayId, requestId, decision)
}

export function __getPendingPermissionsForTesting(): ReadonlyArray<Readonly<PendingPermission>> {
  return pending.map(p => ({ ...p }))
}

export function __resetPermissionBubbleForTesting(): void {
  pending.length = 0
  responseSink = null
}
