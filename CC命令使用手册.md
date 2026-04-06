# Panda Code / 命令使用手册 (v2.1.92 极限版)

> 本手册基于 v2.1.92 实机 PTY 验证，覆盖 **80+ 个命令** + Phase 1-5 全部新增能力。
>
> 最后更新: 2026-04-06 · 显示版本: v2.1.92 · 基线: Claude Code v2.1.92

---

## 命令状态图例

| 标记 | 含义 |
|------|------|
| ✅ | 已验证正常工作 |
| 🆕 | v2.1.92 新增/增强 |
| 🔒 | 需要特定认证（Claude.ai 订阅/消费者账户） |
| ⚠️ | 功能受限或有已知问题 |
| 🔧 | 需要特定环境（Feature Flag / 硬件 / 平台） |
| 🚫 | 存根/内部命令，不可用 |

---

## 速查表（按使用频率排列）

### 每日必用

| 命令 | 别名 | 一句话说明 | 状态 |
|------|------|-----------|------|
| `/help` | | 显示帮助和快捷键 | ✅ |
| `/clear` | `/reset` `/new` | 清空对话，开始新会话 | ✅ |
| `/compact` | | 压缩历史保留摘要，释放上下文 | ✅ |
| `/model` | | 切换模型（Opus/Sonnet/Haiku） | ✅ |
| `/diff` | | 查看未提交变更和每轮代码差异 | ✅ |
| `/commit` | | 智能生成 commit message 并提交 | ✅ |
| `/dream` | | 记忆整合 — 四阶段巩固 | 🆕✅ |
| `/exit` | `/quit` | 退出 REPL | ✅ |

### 高频使用

| 命令 | 别名 | 一句话说明 | 状态 |
|------|------|-----------|------|
| `/plan` | | 启用计划模式（先想后做） | ✅ |
| `/effort` | | 调节推理深度 (low/medium/high/max/auto) | ✅ |
| `/copy` | | 复制最后回复到剪贴板 | ✅ |
| `/config` | `/settings` | 打开配置面板 | ✅ |
| `/resume` | `/continue` | 恢复历史对话 | ✅ |
| `/assistant` | | 启用 KAIROS 助手 + 主动引擎 | 🆕✅ |
| `/proactive` | | 切换主动自主模式 | 🆕✅ |
| `/context` | | 可视化上下文使用情况 | ✅ |

---

## 一、基础控制命令

### `/help`
- **用法**: `/help`
- **说明**: 显示交互式帮助界面，包含所有可用命令和快捷键
- **实测**: ✅ 显示 Panda Code v2.1.92 帮助信息

### `/exit` (别名: `/quit`)
- **用法**: `/exit`
- **说明**: 退出 REPL，等同于按 `Ctrl+D`

### `/clear` (别名: `/reset`, `/new`)
- **用法**: `/clear`
- **说明**: 清除对话历史并释放上下文，相当于开始新对话
- **技巧**: 对话过长导致回复质量下降时使用

### `/version`
- **用法**: `/version`
- **说明**: 显示当前版本和构建时间
- **实测**: ✅ 输出 `2.1.92 (Panda Code)`

### `/status`
- **用法**: `/status`
- **说明**: 显示完整状态信息（版本、Session ID、工作目录、模型、认证方式、API URL）
- **技巧**: 排查问题时首先运行此命令

---

## 二、对话管理命令

### `/compact`
- **用法**: `/compact [自定义摘要指令]`
- **说明**: 压缩对话历史但保留摘要在上下文中
- **技巧**:
  - 上下文接近满时自动提醒，此时用 `/compact` 可继续长任务
  - 可传自定义指令：`/compact 重点保留架构决策和代码路径`

### `/copy`
- **用法**: `/copy [N]`
- **说明**: 复制最后一条回复到系统剪贴板，`/copy 3` 复制倒数第3条

### `/export`
- **用法**: `/export [filename]`
- **说明**: 导出当前对话到文件或剪贴板（JSON/Markdown/剪贴板）

### `/resume` (别名: `/continue`)
- **用法**: `/resume [conversation_id 或搜索词]`
- **说明**: 从历史会话中搜索并恢复
- **技巧**: 可用关键词搜索历史会话，如 `/resume 修复bug`

### `/branch` (别名: `/fork` [条件性])
- **用法**: `/branch [name]`
- **说明**: 在当前对话节点创建分支，探索不同方案

### `/rewind` (别名: `/checkpoint`)
- **用法**: `/rewind`
- **说明**: 将代码和/或对话回退到之前的节点
- **技巧**: AI 改错了代码？`/rewind` 立即回退

### `/tag`
- **用法**: `/tag <tag-name>`
- **说明**: 为当前会话添加/移除可搜索标签

### `/rename`
- **用法**: `/rename [name]`
- **说明**: 重命名当前对话

### `/btw`
- **用法**: `/btw <问题>`
- **说明**: 快速插问，不打断主对话上下文

---

## 三、代码操作命令

### `/commit`
- **用法**: `/commit`
- **说明**: 分析 git diff，自动生成符合项目风格的 commit message 并提交
- **技巧**: Undercover 模式下自动屏蔽内部信息

### `/commit-push-pr` (别名: `/cpp`)
- **用法**: `/commit-push-pr`
- **说明**: 一键完成 commit → push → 创建 PR

### `/diff`
- **用法**: `/diff`
- **说明**: 显示 `git diff HEAD` 和每轮对话的代码变更

### `/review`
- **用法**: `/review [PR number]`
- **说明**: 审查 Pull Request，无 PR 编号时列出 open PRs

### `/pr-comments` (别名: `/pr_comments`)
- **用法**: `/pr-comments [PR number]`
- **说明**: 获取 GitHub PR 的所有评论并总结

### `/security-review`
- **用法**: `/security-review`
- **说明**: 对待提交变更做安全审查
- **技巧**: 上线前必做，检查 XSS/注入/敏感信息泄露

### `/ultrareview`
- **用法**: `/ultrareview`
- **说明**: 深度审查（约 10-20 分钟），自动化 bug 查找

---

## 四、模型与推理命令

### `/model`
- **用法**: `/model [model_name]`
- **说明**: 切换 AI 模型
- **可选**: `opus`（最强）、`sonnet`（日常推荐）、`haiku`（最快）
- **技巧**: 复杂架构设计用 Opus，日常编码用 Sonnet，快速查询用 Haiku

### `/effort`
- **用法**: `/effort [low|medium|high|max|auto]`
- **说明**: 调节模型推理深度
- **技巧**: 简单任务用 `low` 节省 token

### `/fast`
- **用法**: `/fast [on|off]`
- **说明**: 切换高速模式（Opus 4.6 专用）
- **条件**: 🔒 需要 Claude.ai 订阅

### `/advisor`
- **用法**: `/advisor [model_name]`
- **说明**: 配置顾问模型（辅助主模型决策）

### `/torch`
- **用法**: `/torch`
- **说明**: Torch 模式 — 增强模型推理过程可见性

---

## 五、配置设置命令

### `/config` (别名: `/settings`)
- **用法**: `/config`
- **说明**: 打开交互式配置面板

### `/theme`
- **用法**: `/theme`
- **说明**: 选择终端配色主题

### `/color`
- **用法**: `/color <color|default>`
- **说明**: 设置本次会话提示栏颜色
- **技巧**: 多窗口工作时用不同颜色区分

### `/vim`
- **用法**: `/vim`
- **说明**: 切换 Vim/普通编辑模式

### `/keybindings`
- **用法**: `/keybindings`
- **说明**: 打开快捷键配置文件

### `/language`
- **用法**: `/language [en|zh|...]`
- **说明**: 切换界面语言

### `/persona`
- **用法**: `/persona [模式]`
- **说明**: 切换人格模式
- **模式**: `work`（专业）、`companion`（陪伴）、`study`（学习）、`creative`（创意）、`butler`（管家）
- 🆕 **Sense Pipeline 联动**: auto 模式下根据时间/mood/活动自动切换

### `/privacy`
- **用法**: `/privacy`
- **说明**: 查看隐私状态

### `/sandbox`
- **用法**: `/sandbox`
- **说明**: 配置 Bash 命令沙盒模式

### `/statusline`
- **用法**: `/statusline`
- **说明**: 设置状态栏 UI 显示

---

## 六、工具与权限命令

### `/permissions` (别名: `/allowed-tools`)
- **用法**: `/permissions`
- **说明**: 管理 Allow/Ask/Deny 工具权限规则
- **技巧**: 可配置 Bash 正则，如允许 `git *` 但拒绝 `rm -rf *`

### `/mcp`
- **用法**: `/mcp [enable|disable server-name]`
- **说明**: 管理 MCP 服务器扩展
- 🆕 MCP 工具结果上限提升至 **500K 字符**（原 100K）

### `/hooks`
- **用法**: `/hooks`
- **说明**: 查看工具事件钩子配置

### `/tasks` (别名: `/bashes`)
- **用法**: `/tasks`
- **说明**: 列出和管理后台任务

---

## 七、🆕 私人助手系统（v2.1.92 核心新增）

### `/dream` 🆕
- **用法**: `/dream`
- **说明**: 手动触发记忆整合 — 四阶段流程
- **四阶段**: Orient(盘点) → Gather(采集) → Consolidate(整合) → Prune(裁剪)
- **后台 cron**: 每天 22:00 自动执行（需启用 `/proactive` 或 `/night-mode`）
- **技巧**:
  - 手动 `/dream` 后自动重置 24h 冷却门控
  - 包含 Phase 3.5 情绪记忆扫描
  - MEMORY.md 保持 ≤200 行 / 25KB

### `/assistant` 🆕
- **用法**: `/assistant`
- **说明**: 启用 KAIROS 助手模式 — 激活主动引擎 + 定时任务
- **效果**:
  - `isAssistantMode()` 返回 true
  - 自动激活 `/proactive` 引擎
  - 启动 builtinTasks（dream/briefing/health）
- **技巧**: 长时间工作时开启，AI 会在空闲时自动整理记忆

### `/proactive` 🆕
- **用法**: `/proactive [on|off]`
- **说明**: 切换主动自主模式
- **内置任务**:
  - `dream-consolidate` — 22:00 自动记忆整合（调用 autoDream）
  - `morning-briefing` — 07:00 设置晨间简报 pending flag
  - `code-health` — 23:00 设置健康检查 pending flag
- **技巧**: 配合 `/night-mode` 实现全天候自主工作

### `/night-mode` 🆕
- **用法**: `/night-mode`
- **说明**: 夜间自主模式（22:00-06:00）
- **编排器**: 顺序执行启用任务，5 分钟节流，单任务失败不阻塞后续
- **技巧**: 适合离开电脑时让 AI 自动整理记忆和检查代码

### `/buddy`
- **用法**: `/buddy [show|hide|mute|unmute|info]`
- **说明**: 编程伙伴 — 可交互的熊猫伙伴

### `/brief`
- **用法**: `/brief [on|off]`
- **说明**: 简报模式 — AI 只输出简洁摘要

### 🆕 Mood 检测（自动）
- **无需命令** — 每条用户消息自动分析情绪
- **6 类情绪**: neutral / focused / frustrated / curious / satisfied / urgent
- **中英双语**: 支持中英文关键词匹配
- **5 分钟衰减**: 无强信号时自动回归 neutral
- **联动**: persona 自动切换 + dream 上下文注入

### 🆕 Memory 持久化（自动）
- **emotionalMemory**: 情绪事件记录，JSON 持久化，LRU 100 条
- **workingMemory**: 键值对工作记忆，JSON 持久化，LRU 50 条，TTL 24h
- **存储路径**: `~/.pandacc/assistant/emotional-memory.json` / `working-memory.json`

---

## 八、Agent 与协作

### `/agents`
- **用法**: `/agents`
- **说明**: 管理自定义 Agent 配置

### `/plan`
- **用法**: `/plan [open|描述]`
- **说明**: 启用计划模式
- **技巧**: 强烈推荐复杂任务先用计划模式

### `/fork`
- **用法**: `/fork <任务描述>`
- **说明**: 派生后台子 Agent 并行执行

### `/workflows`
- **用法**: `/workflows`
- **说明**: 列出和管理工作流脚本

### `/skills`
- **用法**: `/skills`
- **说明**: 列出所有可用技能

### 🆕 Coordinator 多 Agent 模式
- **启用**: `CLAUDE_CODE_COORDINATOR_MODE=1`
- **说明**: 多智能体协作模式，自动分配 worker agent
- **Worker**: 具有完整工具权限的通用 worker

---

## 九、插件与扩展

### `/plugin` (别名: `/plugins`, `/marketplace`)
- **用法**: `/plugin`
- **说明**: 浏览、安装、配置插件市场（138+ 插件）

### `/reload-plugins`
- **用法**: `/reload-plugins`
- **说明**: 热重载插件变更，无需重启

---

## 十、信息查询命令

### `/context`
- **用法**: `/context`
- **说明**: 以彩色网格可视化上下文使用情况

### `/files`
- **用法**: `/files`
- **说明**: 列出当前上下文中的所有文件

### `/doctor`
- **用法**: `/doctor`
- **说明**: 诊断并验证安装和配置
- **技巧**: 排障首选

### `/cost`
- **用法**: `/cost`
- **说明**: 显示当前会话总花费和持续时间

### `/usage`
- **用法**: `/usage`
- **说明**: 显示套餐用量限额

### `/stats`
- **用法**: `/stats`
- **说明**: 显示使用统计（月度热力图 + token 统计）

### `/insights`
- **用法**: `/insights`
- **说明**: 生成会话分析报告

### `/memory`
- **用法**: `/memory`
- **说明**: 编辑记忆文件（auto-memory/project memory/user memory）

---

## 十一、远程与连接命令

### `/remote-control` (别名: `/rc`)
- **用法**: `/remote-control`
- **说明**: 连接终端进行远程控制会话

### `/session` (别名: `/remote`)
- **用法**: `/session`
- **说明**: 显示远程会话 URL 和二维码

### `/mobile` (别名: `/ios`, `/android`)
- **用法**: `/mobile`
- **说明**: 显示移动应用下载二维码

### `/desktop` (别名: `/app`)
- **用法**: `/desktop`
- **说明**: 在 Claude Desktop 中继续当前会话

### `/chrome`
- **用法**: `/chrome`
- **说明**: Chrome 扩展设置 (Beta)

---

## 十二、初始化与安装

### `/init`
- **用法**: `/init`
- **说明**: 初始化 CLAUDE.md 项目记忆文件
- **技巧**: 新项目首先运行

### `/terminal-setup`
- **用法**: `/terminal-setup`
- **说明**: 安装 Shift+Enter 换行键绑定

### `/release-notes`
- **用法**: `/release-notes`
- **说明**: 查看版本发布说明

### `/add-dir`
- **用法**: `/add-dir <path>`
- **说明**: 添加新工作目录

---

## 十三、Ant-Only 高级命令

> 以下命令原为 Anthropic 内部专用，已在 Panda Code 中全部启用。

| 命令 | 说明 | 状态 |
|------|------|------|
| `/ultraplan` | 超级计划模式（CCR 远程 10-30 分钟深度规划） | ✅ |
| `/ultrareview` | 深度代码审查 + bug 验证 | ✅ |
| `/init-verifiers` | 初始化验证器脚本 | ✅ |
| `/subscribe-pr` | 订阅 PR 更新通知 | ✅ |
| `/bridge-kick` | Bridge 故障注入（调试） | ✅ |
| `/force-snip` | 强制截断对话历史 | ✅ |
| `/heapdump` | JS 堆转储到 ~/Desktop | ✅ |
| `/voice` | 语音输入输出 | 🔒 需 Claude.ai |

---

## 十四、不可用的存根命令

> 原版 Claude Code 发布时已替换为存根（源码不在 npm 包中），无法使用。

| 命令 | 原功能 | 命令 | 原功能 |
|------|--------|------|--------|
| `/backfill-sessions` | 回填会话 | `/break-cache` | 打破缓存 |
| `/bughunter` | Bug 猎人 | `/ctx_viz` | 上下文可视化 |
| `/debug-tool-call` | 调试工具 | `/env` | 环境变量 |
| `/good-claude` | Good 模式 | `/issue` | 创建 Issue |
| `/mock-limits` | 模拟限额 | `/oauth-refresh` | 刷新 OAuth |
| `/onboarding` | 引导流程 | `/reset-limits` | 重置限额 |
| `/share` | 分享对话 | `/ant-trace` | Ant 追踪 |
| `/perf-issue` | 性能报告 | `/summary` | 对话摘要 |
| `/teleport` | 远程传送 | `/autofix-pr` | 自动修 PR |
| `/agents-platform` | Agent 平台 | | |

**反向禁用**: `/feedback`（ant 内部渠道）、`/peers`（UDS_INBOX 未启用）

---

## 十五、🆕 环境变量参考

### Panda Code 专属

| 环境变量 | 默认 | 说明 |
|---------|------|------|
| `PANDA_SECURITY_RESEARCH` | 未设置 | 设为 `1` 禁用 4 项安全限制（CYBER_RISK/URL限制/谨慎操作/恶意提醒） |
| `PANDA_HIDE_CONTEXT_WARNING` | 未设置 | 设为 `1` 隐藏 "上下文快满" 警告 |
| `PANDA_NO_AUTO_COLLAPSE` | 未设置 | 设为 `1` 禁止 Read/Grep 结果自动折叠 |
| `PANDA_SHOW_DEVBAR` | 未设置 | 设为 `1` 在非 dev 构建中显示 DevBar |

### 功能控制

| 环境变量 | 默认 | 说明 |
|---------|------|------|
| `CLAUDE_CODE_COORDINATOR_MODE` | 未设置 | 设为 `1` 启用 Coordinator 多 Agent 模式 |
| `ENABLE_TOOL_SEARCH` | `true` | ToolSearch 默认启用（支持非 Anthropic Provider） |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | `1` | 禁用非必要网络流量（遥测/分析/GrowthBook） |
| `CLAUDE_INTERNAL_FC_OVERRIDES` | 自动设置 | GrowthBook Feature Flag 覆盖（31+ tengu flags） |

### API 配置

| 环境变量 | 说明 |
|---------|------|
| `ANTHROPIC_API_KEY` | API 密钥 |
| `ANTHROPIC_BASE_URL` | API 基础 URL |
| `ANTHROPIC_MODEL` | 默认模型 |
| `ANTHROPIC_SMALL_FAST_MODEL` | 快速模型 |

---

## 十六、Feature Flag 对照表

| Feature Flag | 控制的命令/功能 | 状态 |
|-------------|----------------|------|
| `PROACTIVE` / `KAIROS` | `/proactive`, `/assistant` | ✅ 已启用 |
| `KAIROS_BRIEF` | `/brief` | ✅ 已启用 |
| `KAIROS_DREAM` | `/dream` | ✅ 已启用 |
| `BRIDGE_MODE` | `/remote-control` | ✅ 已启用 |
| `VOICE_MODE` | `/voice` | ✅ 已启用 |
| `HISTORY_SNIP` | `/force-snip` | ✅ 已启用 |
| `WORKFLOW_SCRIPTS` | `/workflows` | ✅ 已启用 |
| `ULTRAPLAN` | `/ultraplan` | ✅ 已启用 |
| `TORCH` | `/torch` | ✅ 已启用 |
| `FORK_SUBAGENT` | `/fork` | ✅ 已启用 |
| `BUDDY` | `/buddy` | ✅ 已启用 |
| `COORDINATOR_MODE` | Coordinator 模式 | ✅ 已启用 |

---

## 十七、快捷键速查

| 快捷键 | 功能 |
|--------|------|
| `Shift+Tab` | 循环切换权限模式（auto → plan → acceptEdits → dontAsk） |
| `Ctrl+D` / `Esc Esc` | 退出或清空输入 |
| `Ctrl+Z` | 挂起到后台（`fg` 恢复） |
| `Ctrl+V` | 粘贴 |
| `Ctrl+T` | 切换任务面板 |
| `Meta+P` | 切换模型 |
| `Meta+O` | 切换快速模式 |
| `Ctrl+S` | 保存/暂存 prompt |
| `Ctrl+G` | 在 $EDITOR 中编辑 |
| `Ctrl+O` | 详细输出模式 |
| `\` + `Enter` | 输入换行（不发送） |
| `!` | 进入 Bash 直接模式 |
| `@` | 文件路径自动补全 |
| `&` | 后台运行（加在命令末尾） |

---

## 十八、工作流建议

| 场景 | 推荐流程 |
|------|---------|
| **新项目** | `/init` → `/plan` → 开始编码 |
| **日常编码** | `/model sonnet` → 编码 → `/diff` → `/commit` |
| **复杂任务** | `/plan` → `/effort max` → `/model opus` → 执行 → `/compact` |
| **代码审查** | `/review PR号` → `/security-review` |
| **上下文管理** | `/context` 查看 → `/compact` 压缩 → `/files` 确认 |
| **排障** | `/doctor` → `/status` → `/version` |
| **长会话** | 定期 `/compact` → `/tag 项目名` → 下次 `/resume 项目名` |
| **自主模式** | `/assistant` → `/night-mode` → 离开让 AI 自动工作 |
| **记忆整理** | `/dream` 手动整合 or `/proactive` 自动定时 |
| **多 Agent** | `CLAUDE_CODE_COORDINATOR_MODE=1` → 自动分配 worker |

### 常见问题

| 问题 | 解决方案 |
|------|---------|
| 回复质量下降 | `/compact` 释放上下文 |
| 上下文满了 | `/compact` 或 `/clear` |
| AI 改错了代码 | `/rewind` 回退 |
| 想试不同方案 | `/branch` 分支探索 |
| 需要快速回答 | `/effort low` 或 `/model haiku` |
| 插件不生效 | `/reload-plugins` |
| 配置不确定 | `/doctor` 诊断 |
| Read/Grep 结果被折叠 | `PANDA_NO_AUTO_COLLAPSE=1` |
| 安全限制阻碍研究 | `PANDA_SECURITY_RESEARCH=1` |

---

## 十九、🆕 v2.1.92 新增能力总览

| 能力 | 来源 | 说明 |
|------|------|------|
| autoDream 四阶段 + cron | Phase 4A | 后台记忆整合，22:00 自动执行 |
| KAIROS 助手模式 | Phase 1.1 | /assistant 激活完整主动引擎 |
| Mood 双语检测 | Phase 1.2 | 每条消息自动分析 6 类情绪 |
| 夜间任务链 | Phase 1.4 | 顺序执行 + 错误隔离 + 5min 节流 |
| Memory 持久化 | Phase 1.5 | 情绪/工作记忆 JSON + LRU + TTL |
| Coordinator 多 Agent | Phase 2.1 | COORDINATOR_MODE + worker agent |
| Sense Pipeline | Phase 2.4 | mood→persona→dream 全链路 |
| GrowthBook 31+ flags | Phase 2.3 | 含 1h prompt cache |
| 安全限制可配置 | Phase 3.2 | PANDA_SECURITY_RESEARCH env |
| 1h prompt cache | Phase 4B | tengu_prompt_cache_1h_config |
| ToolSearch 全 Provider | Phase 4B | ENABLE_TOOL_SEARCH=true |
| MCP 500K 结果 | Phase 5 | maxResultSizeChars 提升 |
| UX 双开关 | Phase 4B | 隐藏 context 警告 + 禁止折叠 |

---

*此文档是项目契约的一部分。一旦 Panda Code 功能更新，此文档必须同步更新。*
