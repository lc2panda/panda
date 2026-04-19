// Input: TS 编译期解析
// Output: 缺失依赖（electron / bun:test）的最小 ambient 声明
// Pos: panda-on-desk 类型 shim — 等待 P1-T6 真正 bun install electron 后可移除
//
// [NEW-FILE:#20260419-P1-05]
// 仅作用于 P1 阶段 0-deps TS 编译；P1-T6 后改为引入 @types/electron 真实声明。

declare module 'electron' {
  // 仅暴露 P1 阶段引用到的最小子集；保持 any 形态以维持 1:1 fork 行为。
  export const app: any
  export const BrowserWindow: any
  export const screen: any
  export const nativeImage: any
  export const ipcMain: any
  export const ipcRenderer: any
  export const contextBridge: any
  export const Tray: any
  export const Menu: any
  export const MenuItem: any
  export const dialog: any
  export const shell: any
  export const globalShortcut: any
  export const session: any
  export const Notification: any
  export const systemPreferences: any
  export const clipboard: any
  export const powerMonitor: any
  export const powerSaveBlocker: any
  const _default: any
  export default _default
}

declare module 'electron-updater' {
  export const autoUpdater: any
  export const CancellationToken: any
  const _default: any
  export default _default
}

declare module 'bun:test' {
  type Fn = (...args: any[]) => any
  export const describe: (label: string, body: Fn) => void
  export const it: (label: string, body: Fn) => void
  export const test: (label: string, body: Fn) => void
  export const expect: any
  export const beforeAll: (body: Fn) => void
  export const beforeEach: (body: Fn) => void
  export const afterAll: (body: Fn) => void
  export const afterEach: (body: Fn) => void
}

declare module 'koffi' {
  const _default: any
  export default _default
  export const load: any
  export const types: any
}

declare module 'htmlparser2' {
  export const Parser: any
  export const DomHandler: any
  export const DomUtils: any
  export const parseDocument: any
}
