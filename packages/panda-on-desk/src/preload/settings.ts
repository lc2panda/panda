// Input: Electron preload context — settings BrowserWindow 加载前注入
// Output: window.pandaSettings 沙箱 API（load / save / getDeskPrefs / saveDeskPrefs / openExternal / quitApp）
// Pos: panda-on-desk W3 收尾 — settings.html 与 main 进程之间的安全 IPC 桥
//
// [NEW-FILE:#20260419-W3-02]
// 触发原因：上游 settings.html 通过 settings-renderer.js 直接走 require('electron')，
//           panda 单 provider 收紧到 contextBridge 沙箱（contextIsolation:true）。
// 证据：
//   1. Electron 41 contextBridge — https://www.electronjs.org/docs/latest/api/context-bridge
//   2. 同包 src/preload/main.ts 的 contextBridge 风格（保持一致）
// 最小化方案：单文件 ~55 行，仅暴露最小 IPC 函数；零新依赖。
//
// W16-T3（2026-04-20 +08:00）新增 load/save 短别名：
//   · window.pandaSettings.load() → settings:load → prefs.ts loadDeskPrefs()
//   · window.pandaSettings.save(patch) → settings:save → prefs.ts saveDeskPrefs() + hitWin broadcast
//   · 保留 getDeskPrefs/saveDeskPrefs 向后兼容（settings.html 既有 binding 仍工作）

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('pandaSettings', {
  /** W16-T3 短别名：读取 desk-prefs.json（等价 getDeskPrefs） */
  load: (): Promise<any> => ipcRenderer.invoke('settings:load'),

  /** W16-T3 短别名：写入 desk-prefs.json + broadcast hitWin（等价 saveDeskPrefs） */
  save: (patch: Record<string, unknown>): Promise<any> =>
    ipcRenderer.invoke('settings:save', patch),

  /** 读取 ~/.pandacc/desk-prefs.json */
  getDeskPrefs: (): Promise<any> => ipcRenderer.invoke('panda:desk-prefs:get'),

  /** 写入 ~/.pandacc/desk-prefs.json（合并保存） */
  saveDeskPrefs: (patch: Record<string, unknown>): Promise<any> =>
    ipcRenderer.invoke('panda:desk-prefs:save', patch),

  /** 物种列表（白名单） */
  listSpecies: (): Promise<string[]> => ipcRenderer.invoke('panda:species:list'),

  /** W22-T1：所有 displays（settings.html Display 下拉填充） */
  listDisplays: (): Promise<Array<{ id: number; label: string; isPrimary: boolean }>> =>
    ipcRenderer.invoke('panda:displays:list'),

  /** 打开外部链接（仅 https://） */
  openExternal: (url: string): Promise<{ status: 'ok' | 'error'; message?: string }> =>
    ipcRenderer.invoke('settings:open-external', url),

  /** 应用版本 */
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('panda:app-version'),

  /** 关闭 settings 窗口 */
  closeWindow: (): void => ipcRenderer.send('panda:settings:close'),

  /** W5-T3：当前 UI 语言（从 main 进程查询，反映 desk-prefs.language 实时值） */
  getLang: (): Promise<string> => ipcRenderer.invoke('panda:i18n:get-lang'),

  /** W5-T3：获取三语字典（缺省返回当前 lang 词典；显式传 lang 返回指定语言词典） */
  getDict: (lang?: string): Promise<{ lang: string; dict: Record<string, string> }> =>
    ipcRenderer.invoke('panda:i18n:get-dict', lang),

  /** W5-T3：订阅 lang 变更（saveDeskPrefs language 后 main 进程广播） */
  onLangChanged: (cb: (lang: string) => void): (() => void) => {
    const handler = (_e: unknown, lang: string) => {
      try { cb(lang) } catch {}
    }
    ipcRenderer.on('panda:lang-changed', handler)
    return () => ipcRenderer.removeListener('panda:lang-changed', handler)
  },
})
