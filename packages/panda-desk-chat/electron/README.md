# electron/

Electron desktop shell for Panda Desk Chat.

| 文件 | 地位 | 功能 |
|------|------|------|
| `main.ts` | 核心 | Main process 入口 — WindowManager 多窗口管理 + app 生命周期 |
| `window-manager.ts` | 核心 | 多窗口注册表 — 创建/跟踪/路由 IPC 到多个 BrowserWindow |
| `preload/chat.ts` | 核心 | contextBridge 注入 pandaAPI (27 IPC channels) |
| `ipc/handlers.ts` | 核心 | ipcMain.handle 注册 (24 handlers: CLI backend + window mgmt) |
| `backend/cli-manager.ts` | 核心 | CLI 子进程生命周期 — 通过 WindowManager 路由事件到多窗口 |
| `updater.ts` | 核心 | 自动更新 — 通过 WindowManager.broadcast 广播状态 |
| `notification.ts` | 核心 | 系统通知 + dock badge |

一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。
