# electron/backend

CLI 后端连接层：CLIManager 管理 CLI 子进程生命周期，NDJSON 协议解析，磁盘会话扫描，定时任务调度。

| 文件 | 地位 | 功能 |
|------|------|------|
| `types.ts` | 核心 | NDJSON 协议类型定义（SDK 消息 + CLI 输入 + Session 状态） |
| `cli-manager.ts` | 核心 | CLISession 子进程管理 + CLIManager 多会话编排 |
| `disk-session-scanner.ts` | 核心 | 扫描 `~/.pandacc/projects/**/*.jsonl` 供历史侧边栏使用 |
| `cron-scheduler.ts` | 核心 | 5-字段 cron 解析 + setTimeout 驱动调度 + 任务持久化到 `~/.pandacc/scheduled_tasks.json` |

*一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。*
