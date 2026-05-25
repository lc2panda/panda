# electron/backend

CLI 后端连接层：CLIManager 管理 CLI 子进程生命周期，NDJSON 协议解析，磁盘会话扫描，定时任务调度。

| 文件 | 地位 | 功能 |
|------|------|------|
| `types.ts` | 核心 | NDJSON 协议类型定义（SDK 消息 + CLI 输入 + Session 状态） |
| `cli-manager.ts` | 核心 | CLISession 子进程管理 + CLIManager 多会话编排 |
| `disk-session-scanner.ts` | 核心 | 扫描 `~/.pandacc/projects/**/*.jsonl` 供历史侧边栏使用 |
| `cron-scheduler.ts` | 核心 | 5-字段 cron 解析 + setTimeout 驱动调度 + 任务持久化到 `~/.pandacc/scheduled_tasks.json` |
| `pandacc-scanner.ts` | 核心 | 扫 `~/.pandacc/{skills,agents,plugins,settings.json,computer-use}` 与 `~/.pandacc.json` 供 Settings sub-tab — Skills/Agents/Plugins/Env/ProviderSnapshot/ComputerUse 真实数据；ProviderSnapshot 只返回脱敏认证状态与来源，不回传 token/API key；ComputerUse 完整对标 cc-haha：macOS TCC 权限检测 + system_profiler 扫已装 App + grants.json 读写 + 跳系统设置 |
| `adapter-manager.ts` | 核心 | IM Adapter 启停 — wechat 走 `~/.pandacc/plugins/cache/lc2panda-plugins/wechat/<ver>/channels/wechat/server.ts`（spawn `bun`），feishu/telegram 暂占位（runtime 未安装）。Comdr IM Wechat 任务 B。 |
| `wechat-db-manager.ts` | 核心 | 微信本地 db 解密链路 — sqlcipher 检测 + connectors.json/proactive.json merge 写入 + decrypt 触发占位（lastDecryptAt 时间戳）。Comdr 超级助手 Wechat DB 任务 C。 |
| `learning-scanner.ts` | 核心 | 扫所有 panda CLI 项目下的 `working/learning-plans/*.md` + `working/flashcards/*.json` + `.review-log.json` 供学习助手 Tab 使用；解析 markdown H1/H2/材料链接、闪卡 due/learning 计数。Comdr 学习助手真实数据接入。 |
| `team-scanner.ts` | 核心 | 扫 `~/.pandacc/teams/<team>/inboxes/<agent>.json` 供 PdAgentTeams 使用 — 列团队 / 读详情 + inbox 解析（兼容数组/messages/entries 三种 schema）+ 读 settings.json env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 启用状态。Comdr Agent Teams 真实数据接入。 |
| `audit-scanner.ts` | 核心 | 反向读 `~/.pandacc/audit.jsonl`（panda CLI src/utils/auditLog.ts 写入端），全量加载 + 倒序 + filter（sessionId/toolName/since）+ 统计（today/errorRate/topTools）。供 PdToolInspection 使用。Comdr cc-haha 路线 A 工具调用调试器接入。 |
| `memdir-scanner.ts` | 核心 | 扫 `~/.pandacc/projects/<slug>/memory/{patterns,scars,episodes,semantic,procedural,working,dreams}/`（panda CLI src/memdir/paths.ts getAutoMemPath()），列项目 + 列 layer 文件 + 单文件读全文（4MB 上限 + 路径白名单守卫）。供 PdPatternsScars / PdMemoryBank 使用。 |
| `connectors-scanner.ts` | 核心 | 读 `~/.pandacc/config/connectors.json`（panda CLI src/connectors/config.ts 端），返回 6 platform 状态（feishu/dingtalk/slack/telegram/wechat/teams）+ aggregator 摘要 + 切换 enabled。secret 字段全部不返回，仅做开关 + keychain 引用提示。供 PdConnectors 使用。 |
| `session-controls.ts` | 核心 | 通过 `cliManager.sendMessage` 把 panda CLI slash-command（/fork / /branch / /resume）注入活会话，供 PdSessionControls 使用。CLI 主循环负责 slash 解析（不在 IPC 层重新实现）。 |

*一旦这里的结构发生变化，请务必更新我... 就像重新标记领地一样。*
