// Input: Electron preload context（permission/notification bubble 窗口）
// Output: window.bubbleAPI — show/hide/decide/reportHeight 通道
// Pos: panda-on-desk bubble 窗口 preload
//
// Forked from clawd-on-desk@4b07658:src/preload-bubble.js (MIT License)
// JS → TS 直接转。

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('bubbleAPI', {
  onPermissionShow: (cb: (data: any) => void) =>
    ipcRenderer.on('permission-show', (_e, data) => cb(data)),
  decide: (behavior: string) => ipcRenderer.send('permission-decide', behavior),
  onPermissionHide: (cb: () => void) =>
    ipcRenderer.on('permission-hide', () => cb()),
  reportHeight: (h: number) => ipcRenderer.send('bubble-height', h),
})
