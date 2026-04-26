# electron/ipc/

IPC handler registration for Electron main process.

| 文件 | 地位 | 功能 |
|------|------|------|
| `handlers.ts` | 核心 | 所有 invoke handler 注册 (R→M channels, 含 CLI backend + window manager + schedule + pandacc + adapter + wechat-db + learning + teams + audit + memdir + connectors + session-control) + sendToRenderer utility |

一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。
