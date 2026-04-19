// Input: Electron preload context（hit 透明窗口）
// Output: window.hitAPI / window.hitThemeConfig — drag/click/menu 通道
// Pos: panda-on-desk hit 窗口 preload
//
// Forked from clawd-on-desk@4b07658:src/preload-hit.js (MIT License)
// JS → TS 直接转。

import { contextBridge, ipcRenderer } from 'electron'

const hitThemeArg = process.argv.find((a: string) =>
  a.startsWith('--hit-theme-config='),
)
const hitThemeConfig = hitThemeArg
  ? JSON.parse(hitThemeArg.slice('--hit-theme-config='.length))
  : null

contextBridge.exposeInMainWorld('hitThemeConfig', hitThemeConfig)

contextBridge.exposeInMainWorld('hitAPI', {
  onThemeConfig: (cb: (cfg: any) => void) =>
    ipcRenderer.on('theme-config', (_e, cfg) => cb(cfg)),
  dragLock: (locked: boolean) => ipcRenderer.send('drag-lock', locked),
  dragMove: () => ipcRenderer.send('drag-move'),
  dragEnd: () => ipcRenderer.send('drag-end'),
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  focusTerminal: () => ipcRenderer.send('focus-terminal'),
  exitMiniMode: () => ipcRenderer.send('exit-mini-mode'),
  showSessionMenu: () => ipcRenderer.send('show-session-menu'),
  startDragReaction: () => ipcRenderer.send('start-drag-reaction'),
  endDragReaction: () => ipcRenderer.send('end-drag-reaction'),
  playClickReaction: (svg: string, duration: number) =>
    ipcRenderer.send('play-click-reaction', svg, duration),
  onStateSync: (cb: (data: any) => void) =>
    ipcRenderer.on('hit-state-sync', (_e, data) => cb(data)),
  onCancelReaction: (cb: () => void) =>
    ipcRenderer.on('hit-cancel-reaction', () => cb()),
})
