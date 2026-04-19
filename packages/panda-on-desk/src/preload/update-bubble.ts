// Input: Electron preload context（update bubble 窗口）
// Output: window.updateBubbleAPI — show/hide/choose/reportHeight 通道
// Pos: panda-on-desk update-bubble 窗口 preload
//
// Forked from clawd-on-desk@4b07658:src/preload-update-bubble.js (MIT License)
// JS → TS 直接转。

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('updateBubbleAPI', {
  onShow: (cb: (data: any) => void) =>
    ipcRenderer.on('update-bubble-show', (_e, data) => cb(data)),
  onHide: (cb: () => void) =>
    ipcRenderer.on('update-bubble-hide', () => cb()),
  choose: (actionId: string) => ipcRenderer.send('update-bubble-action', actionId),
  reportHeight: (height: number) =>
    ipcRenderer.send('update-bubble-height', height),
})
