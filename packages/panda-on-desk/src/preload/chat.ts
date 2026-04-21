// Input: Electron preload context — chat BrowserWindow 加载前注入
// Output: window.pandaAPI 命名式沙箱 API（C-5 具名方法，无通用 invoke/on）
// Pos: panda-on-desk chat 窗口 preload — contextBridge 安全桥 (C-5)
//
// 安全模型：
//   - contextIsolation: true（Electron 41 默认）
//   - 每个 IPC 通道映射为一个独立的具名函数
//   - 渲染进程只能调用此文件中显式暴露的方法，无法自由拼接通道名
//   - invoke 方法（16）: renderer → main 请求/响应
//   - on 方法（8）: main → renderer 推送事件

import { contextBridge, ipcRenderer } from 'electron'

// ─── Helper: create a typed event subscriber with auto-cleanup ──────────────

function createListener(channel: string) {
  return (callback: (...args: unknown[]) => void): (() => void) => {
    const handler = (_event: unknown, ...args: unknown[]) => callback(...args)
    ipcRenderer.on(channel, handler)
    return () => { ipcRenderer.removeListener(channel, handler) }
  }
}

// ─── Expose pandaAPI to renderer (named API — C-5 compliant) ────────────────

contextBridge.exposeInMainWorld('pandaAPI', {

  // ── Chat messaging ────────────────────────────────────────────────────────

  chat: {
    /** 1. renderer → main: 发送消息 */
    send:       (p: unknown) => ipcRenderer.invoke('panda:chat:send', p),
    /** 5. renderer → main: 中止流 */
    stop:       (p: unknown) => ipcRenderer.invoke('panda:chat:stop', p),

    /** 2. main → renderer: 流开始 */
    onStreamStart: createListener('panda:chat:stream:start'),
    /** 3. main → renderer: 流增量 */
    onStreamDelta: createListener('panda:chat:stream:delta'),
    /** 4. main → renderer: 流结束 */
    onStreamEnd:   createListener('panda:chat:stream:end'),
    /** 6. main → renderer: 窗口切换 */
    onWindowToggle: createListener('panda:chat:window:toggle'),

    /** 24. renderer → main: 粘贴图片 */
    pasteImage: (p: unknown) => ipcRenderer.invoke('panda:chat:clipboard:paste-image', p),
  },

  // ── Session management ────────────────────────────────────────────────────

  session: {
    /** 7. renderer → main: 列出 sessions */
    list:   (p: unknown) => ipcRenderer.invoke('panda:session:list', p),
    /** 8. renderer → main: 新建 session */
    create: (p: unknown) => ipcRenderer.invoke('panda:session:create', p),
    /** 9. renderer → main: 重命名 */
    rename: (p: unknown) => ipcRenderer.invoke('panda:session:rename', p),
    /** 10. renderer → main: 删除 */
    delete: (p: unknown) => ipcRenderer.invoke('panda:session:delete', p),
    /** 11. renderer → main: 聚焦 */
    focus:  (p: unknown) => ipcRenderer.invoke('panda:session:focus', p),
    /** 12. main → renderer: session 变更推送 */
    onUpdated: createListener('panda:session:updated'),
  },

  // ── Tool permissions ──────────────────────────────────────────────────────

  tool: {
    /** 16. renderer → main: 权限审批 */
    respondPermission: (p: unknown) => ipcRenderer.invoke('panda:tool:permission:response', p),

    /** 13. main → renderer: 工具开始 */
    onUseStart:        createListener('panda:tool:use:start'),
    /** 14. main → renderer: 工具完成 */
    onUseEnd:          createListener('panda:tool:use:end'),
    /** 15. main → renderer: 权限请求 */
    onPermissionRequest: createListener('panda:tool:permission:request'),
  },

  // ── File system ───────────────────────────────────────────────────────────

  fs: {
    /** 17. renderer → main: 文件搜索 */
    search: (p: unknown) => ipcRenderer.invoke('panda:chat:fs:search', p),
    /** 18. renderer → main: 目录列表 */
    list:   (p: unknown) => ipcRenderer.invoke('panda:chat:fs:list', p),
  },

  // ── Config & misc ─────────────────────────────────────────────────────────

  config: {
    /** 19. renderer → main: 窗口位置 */
    setWindowPosition: (p: unknown) => ipcRenderer.invoke('panda:chat:window:position', p),
    /** 20. renderer → main: slash 命令列表 */
    getSlashCommands:  (p: unknown) => ipcRenderer.invoke('panda:chat:slash-commands', p),
    /** 21. renderer → main: 模型列表 */
    getModels:         (p: unknown) => ipcRenderer.invoke('panda:chat:model:list', p),
    /** 22. renderer → main: 设置模型 */
    setModel:          (p: unknown) => ipcRenderer.invoke('panda:chat:model:set', p),
    /** 23. renderer → main: 设置权限模式 */
    setPermissionMode: (p: unknown) => ipcRenderer.invoke('panda:chat:permission-mode:set', p),
  },
})
