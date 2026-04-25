# electron/backend

CLI 后端连接层：CLIManager 管理 CLI 子进程生命周期，NDJSON 协议解析，磁盘会话扫描，定时任务调度。

| 文件 | 地位 | 功能 |
|------|------|------|
| `types.ts` | 核心 | NDJSON 协议类型定义（SDK 消息 + CLI 输入 + Session 状态） |
| `cli-manager.ts` | 核心 | CLISession 子进程管理 + CLIManager 多会话编排 |
| `disk-session-scanner.ts` | 核心 | 扫描 `~/.pandacc/projects/**/*.jsonl` 供历史侧边栏使用 |
| `cron-scheduler.ts` | 核心 | 5-字段 cron 解析 + setTimeout 驱动调度 + 任务持久化到 `~/.pandacc/scheduled_tasks.json` |
| `pandacc-scanner.ts` | 核心 | 扫 `~/.pandacc/{skills,agents,plugins,settings.json,computer-use}` 供 Settings sub-tab — Skills/Agents/Plugins/Env/ComputerUse 真实数据；ComputerUse 完整对标 cc-haha：macOS TCC 权限检测 + system_profiler 扫已装 App + grants.json 读写 + 跳系统设置 |
| `adapter-manager.ts` | 核心 | IM Adapter 启停 — wechat 走 `~/.pandacc/plugins/cache/lc2panda-plugins/wechat/<ver>/channels/wechat/server.ts`（spawn `bun`），feishu/telegram 暂占位（runtime 未安装）。Comdr IM Wechat 任务 B。 |
| `wechat-db-manager.ts` | 核心 | 微信本地 db 解密链路 — sqlcipher 检测 + connectors.json/proactive.json merge 写入 + decrypt 触发占位（lastDecryptAt 时间戳）。Comdr 超级助手 Wechat DB 任务 C。 |
| `learning-scanner.ts` | 核心 | 扫所有 panda CLI 项目下的 `working/learning-plans/*.md` + `working/flashcards/*.json` + `.review-log.json` 供学习助手 Tab 使用；解析 markdown H1/H2/材料链接、闪卡 due/learning 计数。Comdr 学习助手真实数据接入。 |

*一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。*
