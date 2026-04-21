# electron/

Electron desktop shell for Panda Desk Chat.

| 文件 | 地位 | 功能 |
|------|------|------|
| `main.ts` | 核心 | Main process 入口 — 窗口管理 + app 生命周期 |
| `preload/chat.ts` | 核心 | contextBridge 注入 pandaAPI (24 IPC channels) |
| `ipc/handlers.ts` | 核心 | ipcMain.handle 注册 (W7-1: stub, W7-2: real CLI backend) |

一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。
