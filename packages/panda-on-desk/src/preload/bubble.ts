// Input: Electron preload context（permission/notification bubble 窗口）
// Output: window.bubbleAPI — show/hide/decide/reportHeight 通道
//         + W14-T3 overlay 通道：onOverlayShow / onOverlayHide / overlayAction
// Pos: panda-on-desk bubble 窗口 preload
//
// Forked from clawd-on-desk@4b07658:src/preload-bubble.js (MIT License)
// JS → TS 直接转。
//
// 2026-04-20 +08:00 W14-T3 agent-γ-W14-overlay · 加 overlay-show/hide/action 通道
//   why: 修复 P2-T3 + W2-T3 链路断点 — bubble-window.ts send('overlay-show')
//        但 preload 只监 permission-show，导致 Mac 用户实测 overlay 不可见。

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('bubbleAPI', {
  // ── permission bubble 通道（保持原有契约不变） ──
  onPermissionShow: (cb: (data: any) => void) =>
    ipcRenderer.on('permission-show', (_e, data) => cb(data)),
  decide: (behavior: string) => ipcRenderer.send('permission-decide', behavior),
  onPermissionHide: (cb: () => void) =>
    ipcRenderer.on('permission-hide', () => cb()),
  reportHeight: (h: number) => ipcRenderer.send('bubble-height', h),

  // ── W14-T3 overlay 通道（通用通知 — title/body/actions 渲染） ──
  // why: NotificationEvent kind=overlay 走独立模板，不与 permission 双按钮模板冲突
  onOverlayShow: (cb: (data: any) => void) =>
    ipcRenderer.on('overlay-show', (_e, data) => cb(data)),
  onOverlayHide: (cb: () => void) =>
    ipcRenderer.on('overlay-hide', () => cb()),
  overlayAction: (overlayId: string, actionId: string) =>
    ipcRenderer.send('overlay-action', { overlayId, actionId }),
})
