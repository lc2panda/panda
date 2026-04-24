# electron/preload/

Electron preload scripts — contextBridge between renderer and main process.

| 文件 | 地位 | 功能 |
|------|------|------|
| `chat.ts` | 核心 | 暴露 window.pandaAPI (PandaChatAPI interface, 含 chat/session/tool/fs/config/theme/update/window/schedule 命名空间) |

一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。
