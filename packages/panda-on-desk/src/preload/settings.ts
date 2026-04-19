// Input: Electron preload context — settings BrowserWindow 加载前注入
// Output: window.pandaSettings 沙箱 API（getDeskPrefs / saveDeskPrefs / openExternal / quitApp）
// Pos: panda-on-desk W3 收尾 — settings.html 与 main 进程之间的安全 IPC 桥
//
// [NEW-FILE:#20260419-W3-02]
// 触发原因：上游 settings.html 通过 settings-renderer.js 直接走 require('electron')，
//           panda 单 provider 收紧到 contextBridge 沙箱（contextIsolation:true）。
// 证据：
//   1. Electron 41 contextBridge — https://www.electronjs.org/docs/latest/api/context-bridge
//   2. 同包 src/preload/main.ts 的 contextBridge 风格（保持一致）
// 最小化方案：单文件 ~50 行，仅暴露 4 个最小 IPC 函数；零新依赖。

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('pandaSettings', {
  /** 读取 ~/.pandacc/desk-prefs.json */
  getDeskPrefs: (): Promise<any> => ipcRenderer.invoke('panda:desk-prefs:get'),

  /** 写入 ~/.pandacc/desk-prefs.json（合并保存） */
  saveDeskPrefs: (patch: Record<string, unknown>): Promise<any> =>
    ipcRenderer.invoke('panda:desk-prefs:save', patch),

  /** 物种列表（白名单） */
  listSpecies: (): Promise<string[]> => ipcRenderer.invoke('panda:species:list'),

  /** 打开外部链接（仅 https://） */
  openExternal: (url: string): Promise<{ status: 'ok' | 'error'; message?: string }> =>
    ipcRenderer.invoke('settings:open-external', url),

  /** 应用版本 */
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('panda:app-version'),

  /** 关闭 settings 窗口 */
  closeWindow: (): void => ipcRenderer.send('panda:settings:close'),
})
