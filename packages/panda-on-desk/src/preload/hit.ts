// Input: Electron preload context（hit 透明窗口）
// Output: window.hitAPI / window.hitThemeConfig / window.panda — drag/click/menu 通道 + W1-T4 bridge event subscribe
// Pos: panda-on-desk hit 窗口 preload
//
// Forked from clawd-on-desk@4b07658:src/preload-hit.js (MIT License)
// JS → TS 直接转。
// 2026-04-19 +08:00 W1-T4: 新增 window.panda.onEvent —— hit.html 接收 bridge 事件（pet-state / notification 等）
// 2026-04-19 +08:00 W2-T4: 新增 window.pandaBadge.onUpdate —— 'badge:update' IPC 通道订阅（P2-T4 manager → hit 红圆 badge）

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

// W1-T4：window.panda.onEvent —— bridge IPC 事件订阅入口
// hit.html 内 inline script 调 window.panda.onEvent(handler)；handler 内调 window.__pandaSetState(state)。
// 设计：preload 不解析事件 / 不调 __pandaSetState（保持 W1-T2 UI 改动隔离），只透传事件。
contextBridge.exposeInMainWorld('panda', {
  /** 订阅 main 进程转发的 bridge 事件（OnDeskEvent union） */
  onEvent: (cb: (event: unknown) => void) => {
    const handler = (_e: unknown, event: unknown) => {
      try { cb(event) } catch (err) {
        // why: 单个 listener 抛错不应阻塞 ipc 通道
        console.warn('[panda-on-desk:hit-preload] panda.onEvent handler threw:', (err as Error)?.message)
      }
    }
    ipcRenderer.on('panda-event', handler)
    return () => ipcRenderer.removeListener('panda-event', handler)
  },
})

// W5-T3：window.pandaI18n —— hit.html 内 stats 卡片标签三语化
// 设计：preload 暴露 getLang() / getDict() / onLangChanged(cb)；
//   hit.html inline script 启动时 await getDict() → 替换 stats-card label；订阅 lang 变化重渲染。
contextBridge.exposeInMainWorld('pandaI18n', {
  getLang: (): Promise<string> => ipcRenderer.invoke('panda:i18n:get-lang'),
  getDict: (lang?: string): Promise<{ lang: string; dict: Record<string, string> }> =>
    ipcRenderer.invoke('panda:i18n:get-dict', lang),
  onLangChanged: (cb: (lang: string) => void): (() => void) => {
    const handler = (_e: unknown, lang: string) => {
      try { cb(lang) } catch (err) {
        console.warn('[panda-on-desk:hit-preload] pandaI18n.onLangChanged handler threw:', (err as Error)?.message)
      }
    }
    ipcRenderer.on('panda:lang-changed', handler)
    return () => ipcRenderer.removeListener('panda:lang-changed', handler)
  },
})

// W2-T4：window.pandaBadge.onUpdate —— P2-T4 badge/manager 推送通道
// main.ts 启动时调 setBadgeRendererNotifier((channel, payload) => sendToHitWin(channel, payload))，
// 该回调把 'badge:update' channel 转发到 hit 窗 webContents；preload 透传给 inline script，
// inline script 调 window.__pandaSetBadge(payload.total) 更新红圆。
// 设计：preload 不解析 payload / 不调 __pandaSetBadge（保持 UI 改动隔离），只透传。
contextBridge.exposeInMainWorld('pandaBadge', {
  /** 订阅 'badge:update' 全量快照（BadgeUpdatePayload） */
  onUpdate: (cb: (payload: unknown) => void) => {
    const handler = (_e: unknown, payload: unknown) => {
      try { cb(payload) } catch (err) {
        console.warn('[panda-on-desk:hit-preload] pandaBadge.onUpdate handler threw:', (err as Error)?.message)
      }
    }
    ipcRenderer.on('badge:update', handler)
    return () => ipcRenderer.removeListener('badge:update', handler)
  },
})
