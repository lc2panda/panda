// Input: Electron preload context（render 窗口加载前注入）
// Output: window.electronAPI / window.themeConfig 沙箱 API
// Pos: panda-on-desk render 主窗口 preload — 状态/眼球/反应通道
//
// Forked from clawd-on-desk@4b07658:src/preload.js (MIT License)
// JS → TS 直接转。

import { contextBridge, ipcRenderer } from 'electron'

// Parse theme config from additionalArguments (synchronous, available on first load)
const themeArg = process.argv.find((a: string) => a.startsWith('--theme-config='))
const themeConfig = themeArg ? JSON.parse(themeArg.slice('--theme-config='.length)) : null

contextBridge.exposeInMainWorld('themeConfig', themeConfig)

contextBridge.exposeInMainWorld('electronAPI', {
  onThemeConfig: (cb: (cfg: any) => void) =>
    ipcRenderer.on('theme-config', (_e, cfg) => cb(cfg)),
  onViewportOffset: (cb: (offsetY: number) => void) =>
    ipcRenderer.on('viewport-offset', (_e, offsetY) => cb(offsetY)),
  onStateChange: (callback: (state: string, svg: string) => void) =>
    ipcRenderer.on('state-change', (_e, state, svg) => callback(state, svg)),
  onEyeMove: (callback: (dx: number, dy: number) => void) =>
    ipcRenderer.on('eye-move', (_e, dx, dy) => callback(dx, dy)),
  onWakeFromDoze: (callback: () => void) =>
    ipcRenderer.on('wake-from-doze', () => callback()),
  onDndChange: (callback: (enabled: boolean) => void) =>
    ipcRenderer.on('dnd-change', (_e, enabled) => callback(enabled)),
  onMiniModeChange: (cb: (enabled: boolean, edge: string) => void) =>
    ipcRenderer.on('mini-mode-change', (_e, enabled, edge) => cb(enabled, edge)),
  onStartDragReaction: (cb: () => void) =>
    ipcRenderer.on('start-drag-reaction', () => cb()),
  onEndDragReaction: (cb: () => void) =>
    ipcRenderer.on('end-drag-reaction', () => cb()),
  onPlayClickReaction: (cb: (svg: string, duration: number) => void) =>
    ipcRenderer.on('play-click-reaction', (_e, svg, duration) => cb(svg, duration)),
  onPlaySound: (cb: (name: string) => void) =>
    ipcRenderer.on('play-sound', (_e, name) => cb(name)),
  pauseCursorPolling: () => ipcRenderer.send('pause-cursor-polling'),
  resumeFromReaction: () => ipcRenderer.send('resume-from-reaction'),
})
