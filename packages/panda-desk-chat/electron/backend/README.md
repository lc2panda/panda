# electron/backend

CLI 后端连接层：CLIManager 管理 CLI 子进程生命周期，NDJSON 协议解析。

| 文件 | 地位 | 功能 |
|------|------|------|
| `types.ts` | 核心 | NDJSON 协议类型定义（SDK 消息 + CLI 输入 + Session 状态） |
| `cli-manager.ts` | 核心 | CLISession 子进程管理 + CLIManager 多会话编排 |

*一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。*
