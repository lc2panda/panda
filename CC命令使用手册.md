# Panda Code / 命令使用手册 (完整版)

> 本手册涵盖 Panda Code 中 **全部 90+** 个 `/` 命令及其详细用法。
> 
> 最后更新: 2025-04-03 · 版本: v2.1.118

---

## 命令速查表

| 分类 | 数量 | 命令 |
|------|------|------|
| 基础控制 | 5 | `/clear`, `/exit`, `/help`, `/status`, `/version` |
| 对话管理 | 9 | `/branch`, `/compact`, `/copy`, `/rename`, `/resume`, `/rewind`, `/export`, `/tag`, `/summary` |
| 代码操作 | 7 | `/commit`, `/diff`, `/pr-comments`, `/review`, `/ultrareview`, `/commit-push-pr` |
| GitHub 集成 | 3 | `/install-github-app`, `/install-slack-app`, `/autofix-pr` |
| 配置设置 | 11 | `/config`, `/theme`, `/color`, `/vim`, `/keybindings`, `/language`, `/output-style`, `/persona`, `/privacy`, `/privacy-settings`, `/sandbox-toggle` |
| 模型推理 | 5 | `/model`, `/effort`, `/fast`, `/assistant`, `/voice` |
| 远程控制 | 6 | `/bridge`, `/session`, `/mobile`, `/remote-setup`, `/remoteControlServer`, `/teleport` |
| MCP & 扩展 | 4 | `/mcp`, `/plugin`, `/reload-plugins`, `/skills` |
| Agent & 任务 | 7 | `/agents`, `/tasks`, `/plan`, `/fork`, `/buddy`, `/agents-platform`, `/workflows` |
| 信息查询 | 10 | `/cost`, `/usage`, `/files`, `/doctor`, `/insights`, `/stats`, `/memory`, `/context`, `/ctx_viz`, `/peers` |
| 账户认证 | 3 | `/login`, `/logout`, `/passes` |
| 内部工具 | 14 | `/backfill`, `/break-cache`, `/bughunter`, `/debug-tool-call`, `/force-snip`, `/good-claude`, `/heapdump`, `/init`, `/init-verifiers`, `/issue`, `/mock-limits`, `/oauth-refresh`, `/onboarding`, `/reset-limits` |
| 其他 | 5 | `/btw`, `/chrome`, `/desktop`, `/feedback`, `/upgrade`, `/thinkback`, `/thinkback-play` |

---

## 基础控制命令

### `/help`
- **描述**: 显示帮助和可用命令列表 · Show help and available commands
- **用法**: `/help`
- **类型**: `local-jsx`
- **说明**: 打开交互式帮助界面

### `/exit` (别名: `/quit`)
- **描述**: 退出 REPL · Exit the REPL
- **用法**: `/exit` 或 `/quit`
- **类型**: `local-jsx`
- **立即执行**: 是

### `/clear` (别名: `/reset`, `/new`)
- **描述**: 清除对话历史并释放上下文 · Clear conversation history and free up context
- **用法**: `/clear`
- **类型**: `local`
- **说明**: 相当于开始新对话

### `/status`
- **描述**: 显示 Panda Code 状态（版本、模型、账户、API 连通性等）· Show Panda Code status
- **用法**: `/status`
- **类型**: `local-jsx`
- **立即执行**: 是

### `/version`
- **描述**: 显示版本信息
- **用法**: `/version`
- **类型**: `local`

---

## 对话管理命令

### `/branch` (别名: `/fork` [条件性])
- **描述**: 从当前位置创建对话分支 · Create a branch of the conversation
- **用法**: `/branch [name]`
- **类型**: `local-jsx`
- **说明**: 在对话当前节点创建分支，方便探索不同方向

### `/compact`
- **描述**: 压缩对话历史并保留摘要 · Clear conversation history but keep summary
- **用法**: `/compact [optional custom summarization instructions]`
- **类型**: `local`
- **非交互式**: 支持
- **说明**: 可传入自定义指令控制摘要方式，用于减少 token 消耗

### `/copy`
- **描述**: 复制最后回复到剪贴板 · Copy Claude's last response to clipboard
- **用法**: `/copy [N]`
- **类型**: `local-jsx`
- **说明**: `/copy N` 复制倒数第 N 条回复

### `/rename`
- **描述**: 重命名当前对话 · Rename the current conversation
- **用法**: `/rename [name]`
- **类型**: `local-jsx`

### `/resume` (别名: `/continue`)
- **描述**: 恢复之前的对话 · Resume a previous conversation
- **用法**: `/resume [conversation id or search term]`
- **类型**: `local-jsx`
- **说明**: 从历史会话中搜索并恢复

### `/rewind` (别名: `/checkpoint`)
- **描述**: 将代码/对话回退到之前的节点 · Restore code/conversation to previous point
- **用法**: `/rewind`
- **类型**: `local`

### `/export`
- **描述**: 导出当前对话到文件或剪贴板 · Export conversation to file or clipboard
- **用法**: `/export [filename]`
- **类型**: `local-jsx`

### `/tag`
- **描述**: 为当前会话添加/移除搜索标签 · Toggle a searchable tag
- **用法**: `/tag <tag-name>`
- **类型**: `local-jsx`

### `/summary`
- **描述**: 生成对话摘要 · Generate conversation summary
- **用法**: `/summary`
- **类型**: `local`
- **说明**: 内部命令 (Internal Only)

---

## 代码操作命令

### `/commit`
- **描述**: 创建 git 提交 · Create a git commit
- **用法**: `/commit`
- **类型**: `prompt`
- **说明**: 
  - 分析 git 状态、diff 和最近提交
  - 自动生成符合项目风格的 commit message
  - 遵循 Git 安全协议

### `/diff`
- **描述**: 查看未提交的变更和每轮差异 · View uncommitted changes and per-turn diffs
- **用法**: `/diff`
- **类型**: `local-jsx`
- **说明**: 显示工作区改动和每次对话轮次的代码变更

### `/pr-comments` (别名: `/pr_comments`)
- **描述**: 获取 GitHub PR 的评论 · Get comments from a GitHub pull request
- **用法**: `/pr-comments [PR number]`
- **类型**: `prompt`
- **说明**: 列出 PR 评论并总结

### `/review`
- **描述**: 审查 Pull Request · Review a pull request
- **用法**: `/review [PR number]`
- **类型**: `prompt`
- **说明**: 无 PR 编号时列出 open PRs

### `/ultrareview`
- **描述**: 深度审查（约 10-20 分钟）· Deep review: finds and verifies bugs
- **用法**: `/ultrareview`
- **类型**: `local-jsx`
- **说明**: 在 Panda Code on the web 上运行深度代码分析

### `/commit-push-pr` (别名: `/cpp`)
- **描述**: 提交、推送并创建 PR · Commit, push, and create PR
- **用法**: `/commit-push-pr`
- **类型**: `prompt`
- **说明**: 一键完成提交流程

---

## GitHub 集成命令

### `/install-github-app`
- **描述**: 为仓库设置 Claude GitHub Actions · Set up Claude GitHub Actions
- **用法**: `/install-github-app`
- **类型**: `local-jsx`
- **说明**: 交互式设置 GitHub App

### `/install-slack-app`
- **描述**: 安装 Slack 应用 · Install the Claude Slack app
- **用法**: `/install-slack-app`
- **类型**: `local`

### `/autofix-pr`
- **描述**: 自动修复 PR 中的问题 · Autofix issues in a PR
- **用法**: `/autofix-pr [PR number]`
- **类型**: `prompt`
- **说明**: 内部命令 (Internal Only)

### `/subscribe-pr`
- **描述**: 订阅 PR 更新通知 · Subscribe to PR updates
- **用法**: `/subscribe-pr [PR number]`
- **类型**: `local`
- **说明**: 内部命令，KAIROS_GITHUB_WEBHOOKS flag 控制

---

## 配置设置命令

### `/config` (别名: `/settings`)
- **描述**: 打开配置面板 · Open config panel
- **用法**: `/config`
- **类型**: `local-jsx`
- **说明**: 交互式配置各项设置

### `/theme`
- **描述**: 更换主题 · Change the theme
- **用法**: `/theme`
- **类型**: `local-jsx`
- **说明**: 选择终端配色主题

### `/color`
- **描述**: 设置本次会话提示栏颜色 · Set the prompt bar color
- **用法**: `/color <color|default>`
- **类型**: `local-jsx`
- **说明**: 如 `/color blue`, `/color default`

### `/vim`
- **描述**: 切换 Vim/普通编辑模式 · Toggle Vim/Normal editing modes
- **用法**: `/vim`
- **类型**: `local`

### `/keybindings`
- **描述**: 打开或创建快捷键配置 · Open keybindings configuration
- **用法**: `/keybindings`
- **类型**: `local`

### `/language`
- **描述**: 切换界面语言 · Switch interface language
- **用法**: `/language [en|zh|...]`
- **类型**: `local`

### `/output-style`
- **描述**: 已弃用：请使用 /config 更改输出样式 · Deprecated
- **用法**: `/output-style`
- **类型**: `local-jsx`

### `/persona`
- **描述**: 切换人格模式 · Switch persona mode
- **用法**: `/persona [work|companion|study|creative|butler]`
- **类型**: `local`
- **模式说明**:
  - `work`: 工作模式，专注效率
  - `companion`: 陪伴模式，更友好
  - `study`: 学习模式，详细解释
  - `creative`: 创意模式，更发散
  - `butler`: 管家模式，主动服务

### `/privacy`
- **描述**: 管理隐私设置 · Manage privacy settings
- **用法**: `/privacy`
- **类型**: `local`

### `/privacy-settings`
- **描述**: 查看和更新隐私设置 · View and update privacy settings
- **用法**: `/privacy-settings`
- **类型**: `local-jsx`

### `/sandbox-toggle`
- **描述**: 沙盒设置 · Configure sandbox settings
- **用法**: `/sandbox-toggle exclude "command pattern"`
- **类型**: `local-jsx`

---

## 模型推理命令

### `/model`
- **描述**: 切换 AI 模型 · Set the AI model
- **用法**: `/model [model]`
- **类型**: `local-jsx`
- **说明**: 支持 Claude 系列及第三方 Provider (Bedrock/Vertex/Azure)
- **立即执行**: 是

### `/effort`
- **描述**: 设置模型推理力度 · Set effort level
- **用法**: `/effort [low|medium|high|max|auto]`
- **类型**: `local-jsx`
- **说明**: 
  - `low`: 快速响应
  - `medium`: 平衡模式（默认）
  - `high`: 深入推理
  - `max`: 最高质量
  - `auto`: 自动选择

### `/fast`
- **描述**: 切换快速模式 · Toggle fast mode
- **用法**: `/fast [on|off]`
- **类型**: `local-jsx`
- **说明**: 使用更快的模型变体 (Haiku)

### `/assistant` (KAIROS flag)
- **描述**: 切换助手模式 · Toggle assistant mode
- **用法**: `/assistant`
- **类型**: `local-jsx`
- **说明**: Kairos 功能下的助手模式

### `/voice` (VOICE_MODE flag)
- **描述**: 切换语音模式 · Toggle voice mode
- **用法**: `/voice`
- **类型**: `local`
- **说明**: 启用语音输入输出

---

## 远程控制命令

### `/bridge` (别名: `/rc`)
- **描述**: 连接终端进行远程控制会话 · Connect terminal for remote-control
- **用法**: `/bridge [name]`
- **类型**: `local-jsx`
- **说明**: 启用 Bridge 模式连接移动设备

### `/session` (别名: `/remote`)
- **描述**: 显示远程会话 URL 和二维码 · Show remote session URL and QR
- **用法**: `/session`
- **类型**: `local-jsx`
- **说明**: 远程模式 (--remote) 下可用

### `/mobile` (别名: `/ios`, `/android`)
- **描述**: 显示移动应用下载二维码 · Show QR for mobile app
- **用法**: `/mobile`
- **类型**: `local-jsx`

### `/remote-setup` (别名: `/web-setup`)
- **描述**: 设置 Web 端（需连接 GitHub）· Setup Panda Code on the web
- **用法**: `/remote-setup`
- **类型**: `local-jsx`
- **说明**: 需要连接 GitHub 账户

### `/remoteControlServer` (别名: `/rcs`)
- **描述**: 启动远程控制服务器（守护模式）· Start remote control server
- **用法**: `/remoteControlServer`
- **类型**: `local-jsx`
- **说明**: DAEMON + BRIDGE_MODE flag 控制

### `/teleport`
- **描述**: 传送到远程环境 · Teleport to remote environment
- **用法**: `/teleport [environment]`
- **类型**: `local-jsx`
- **说明**: 内部命令 (Internal Only)

### `/bridge-kick`
- **描述**: 断开远程连接 · Kick remote connection
- **用法**: `/bridge-kick`
- **类型**: `local`
- **说明**: 内部命令

---

## MCP & 扩展命令

### `/mcp`
- **描述**: 管理 MCP 服务器 · Manage MCP servers
- **用法**: `/mcp [enable|disable [server-name]]`
- **类型**: `local-jsx`
- **立即执行**: 是
- **说明**: 管理 Model Context Protocol 服务器扩展

### `/plugin` (别名: `/plugins`, `/marketplace`)
- **描述**: 管理插件 · Manage plugins
- **用法**: `/plugin [command]`
- **类型**: `local-jsx`
- **说明**: 浏览、安装、配置插件市场

### `/reload-plugins`
- **描述**: 激活待定插件变更 · Activate pending plugin changes
- **用法**: `/reload-plugins`
- **类型**: `local`
- **说明**: 热重载插件无需重启

### `/skills`
- **描述**: 列出可用技能 · List available skills
- **用法**: `/skills`
- **类型**: `local-jsx`
- **说明**: 显示所有技能来源（内置、插件、目录等）

---

## Agent & 任务命令

### `/agents`
- **描述**: 管理 Agent 配置 · Manage agent configurations
- **用法**: `/agents`
- **类型**: `local-jsx`

### `/tasks` (别名: `/bashes`)
- **描述**: 列出和管理后台任务 · List and manage background tasks
- **用法**: `/tasks`
- **类型**: `local-jsx`

### `/plan`
- **描述**: 启用计划模式或查看当前计划 · Enable plan mode or view plan
- **用法**: `/plan [open|<description>]`
- **类型**: `local-jsx`
- **说明**: 
  - `/plan` 查看当前计划
  - `/plan open` 打开计划编辑界面
  - `/plan <描述>` 创建新计划

### `/fork` (FORK_SUBAGENT flag)
- **描述**: 派生后台子 Agent 处理任务 · Fork background sub-agent
- **用法**: `/fork <task description>`
- **类型**: `prompt`
- **说明**: 在后台并行执行任务

### `/buddy` (BUDDY flag)
- **描述**: 切换编程伙伴 · Toggle coding companion buddy
- **用法**: `/buddy [show|hide|mute|unmute|info]`
- **类型**: `local-jsx`
- **说明**: 控制屏幕上的熊猫伙伴显示

### `/agents-platform` (ANT only)
- **描述**: Agents 平台管理 · Agents platform management
- **用法**: `/agents-platform`
- **类型**: `local`
- **说明**: 内部命令，仅限 Anthropic 员工

### `/workflows` (WORKFLOW_SCRIPTS flag)
- **描述**: 列出和管理工作流脚本 · List and manage workflows
- **用法**: `/workflows`
- **类型**: `local-jsx`

---

## 信息查询命令

### `/cost`
- **描述**: 显示当前会话总花费和时长 · Show session cost and duration
- **用法**: `/cost`
- **类型**: `local`
- **非交互式**: 支持

### `/usage`
- **描述**: 显示套餐用量限额 · Show plan usage limits
- **用法**: `/usage`
- **类型**: `local-jsx`

### `/files`
- **描述**: 列出当前上下文中的所有文件 · List files in context
- **用法**: `/files`
- **类型**: `local`
- **非交互式**: 支持

### `/doctor`
- **描述**: 诊断并验证安装和配置 · Diagnose installation and settings
- **用法**: `/doctor`
- **类型**: `local-jsx`
- **说明**: 检查 Panda Code 安装、依赖和配置

### `/insights`
- **描述**: 生成会话分析报告 · Generate session analysis report
- **用法**: `/insights`
- **类型**: `prompt`
- **说明**: 分析使用模式和统计信息

### `/stats`
- **描述**: 显示使用统计和活动 · Show usage statistics
- **用法**: `/stats`
- **类型**: `local-jsx`

### `/memory`
- **描述**: 编辑记忆文件 · Edit Claude memory files
- **用法**: `/memory`
- **类型**: `local-jsx`
- **说明**: 管理 `.claude/memory/` 记忆文件

### `/context`
- **描述**: 可视化上下文使用情况 · Visualize context usage
- **用法**: `/context`
- **类型**: `local-jsx`
- **说明**: 以彩色网格显示上下文使用

### `/ctx_viz`
- **描述**: 上下文可视化（高级）· Context visualization (advanced)
- **用法**: `/ctx_viz`
- **类型**: `local`
- **说明**: 内部命令

### `/peers` (UDS_INBOX flag)
- **描述**: 列出对等会话 · List connected peer sessions
- **用法**: `/peers`
- **类型**: `local-jsx`

---

## 账户认证命令

### `/login`
- **描述**: 登录或切换 Anthropic 账户 · Sign in / Switch accounts
- **用法**: `/login`
- **类型**: `local-jsx`

### `/logout`
- **描述**: 退出账户登录 · Sign out
- **用法**: `/logout`
- **类型**: `local-jsx`

### `/passes`
- **描述**: 分享免费体验周给朋友 · Share free week with friends
- **用法**: `/passes`
- **类型**: `local-jsx`

### `/extra-usage`
- **描述**: 配置额外用量 · Configure extra usage
- **用法**: `/extra-usage`
- **类型**: `local-jsx`

### `/rate-limit-options`
- **描述**: 显示速率限制选项 · Show rate limit options
- **用法**: `/rate-limit-options`
- **类型**: `local-jsx`

---

## 其他命令

### `/btw`
- **描述**: 快速插问，不打断主对话 · Quick side question
- **用法**: `/btw <question>`
- **类型**: `local-jsx`
- **说明**: 在主对话中快速提问

### `/chrome`
- **描述**: Chrome 扩展设置 (Beta) · Claude in Chrome settings
- **用法**: `/chrome`
- **类型**: `local-jsx`

### `/desktop` (别名: `/app`)
- **描述**: 在 Claude Desktop 中继续当前会话 · Continue in Claude Desktop
- **用法**: `/desktop`
- **类型**: `local-jsx`

### `/feedback` (别名: `/bug`)
- **描述**: 提交反馈 · Submit feedback
- **用法**: `/feedback [report]`
- **类型**: `local-jsx`

### `/upgrade`
- **描述**: 升级到 Max · Upgrade to Max
- **用法**: `/upgrade`
- **类型**: `local-jsx`
- **说明**: 获得更高限额和更多 Opus

### `/release-notes`
- **描述**: 查看发行说明 · View release notes
- **用法**: `/release-notes`
- **类型**: `local`

### `/thinkback`
- **描述**: 2025 年度回顾 · Your 2025 Panda Code Year in Review
- **用法**: `/thinkback`
- **类型**: `local-jsx`

### `/thinkback-play`
- **描述**: 播放 Thinkback 动画 · Play thinkback animation
- **用法**: `/thinkback-play`
- **类型**: `local`

### `/stickers`
- **描述**: 订购贴纸 · Order Panda Code stickers
- **用法**: `/stickers`
- **类型**: `local`

### `/permissions` (别名: `/allowed-tools`)
- **描述**: 管理工具权限规则 · Manage tool permission rules
- **用法**: `/permissions`
- **类型**: `local-jsx`

### `/hooks`
- **描述**: 查看工具事件的钩子配置 · View hook configurations
- **用法**: `/hooks`
- **类型**: `local-jsx`

### `/add-dir`
- **描述**: 添加新工作目录 · Add new working directory
- **用法**: `/add-dir <path>`
- **类型**: `local-jsx`

### `/env`
- **描述**: 管理环境变量 · Manage environment variables
- **用法**: `/env`
- **类型**: `local`
- **说明**: 内部命令

### `/remote-env`
- **描述**: 配置远程环境默认设置 · Configure remote environment
- **用法**: `/remote-env`
- **类型**: `local-jsx`

### `/security-review`
- **描述**: 安全审查 · Security review
- **用法**: `/security-review`
- **类型**: `prompt`
- **说明**: 内部命令

---

## 内部/调试命令 (ANT only)

以下命令仅限 Anthropic 内部使用或用于调试：

### `/backfill-sessions`
- **描述**: 回填会话数据 · Backfill session data
- **类型**: `local`
- **说明**: 内部命令

### `/break-cache`
- **描述**: 打破提示缓存 · Break prompt cache
- **类型**: `local`
- **说明**: 内部命令，强制重新生成提示

### `/bughunter`
- **描述**: Bug 猎人 · Bug hunter
- **类型**: `local`
- **说明**: 内部命令

### `/debug-tool-call`
- **描述**: 调试工具调用 · Debug tool call
- **类型**: `local`
- **说明**: 内部命令

### `/force-snip` (HISTORY_SNIP flag)
- **描述**: 强制截断历史 · Force history snip
- **类型**: `local`
- **说明**: 内部命令

### `/good-claude`
- **描述**: Good Claude 模式 · Good Claude mode
- **类型**: `prompt`
- **说明**: 内部命令

### `/heapdump`
- **描述**: 转储 JS 堆到桌面 · Dump JS heap to Desktop
- **用法**: `/heapdump`
- **类型**: `local`

### `/init`
- **描述**: 初始化 Panda Code · Initialize Panda Code
- **类型**: `local`

### `/init-verifiers`
- **描述**: 初始化验证器 · Initialize verifiers
- **类型**: `local`
- **说明**: 内部命令

### `/issue`
- **描述**: 创建 Issue · Create issue
- **类型**: `prompt`
- **说明**: 内部命令

### `/mock-limits`
- **描述**: 模拟限额 · Mock rate limits
- **类型**: `local`
- **说明**: 内部命令，测试用

### `/oauth-refresh`
- **描述**: 刷新 OAuth · Refresh OAuth
- **类型**: `local`
- **说明**: 内部命令

### `/onboarding`
- **描述**: 重新运行引导 · Rerun onboarding
- **类型**: `local-jsx`
- **说明**: 内部命令

### `/reset-limits`
- **描述**: 重置限额 · Reset rate limits
- **类型**: `local`
- **说明**: 内部命令

### `/share`
- **描述**: 分享对话 · Share conversation
- **类型**: `local-jsx`
- **说明**: 内部命令

### `/ant-trace`
- **描述**: Ant 追踪 · Ant trace
- **类型**: `local`
- **说明**: 内部命令

### `/perf-issue`
- **描述**: 性能问题 · Performance issue
- **类型**: `local`
- **说明**: 内部命令

### `/advisor`
- **描述**: 顾问模式 · Advisor mode
- **类型**: `local`
- **说明**: 显示顾问建议

### `/terminalSetup`
- **描述**: 终端设置向导 · Terminal setup wizard
- **用法**: `/terminalSetup`
- **类型**: `local-jsx`
- **说明**: 启用 Option+Enter 换行和视觉铃声

### `/ultraplan` (ULTRAPLAN flag)
- **描述**: 超级计划模式 · Ultra plan mode
- **用法**: `/ultraplan`
- **类型**: `local`
- **说明**: 内部命令

### `/torch` (TORCH flag)
- **描述**: Torch 模式 · Torch mode
- **用法**: `/torch`
- **类型**: `local`
- **说明**: 内部命令

---

## 命令类型说明

| 类型 | 说明 | 执行方式 |
|------|------|----------|
| `local` | 本地执行，返回文本结果 | 立即执行，输出文本 |
| `local-jsx` | 本地执行，渲染交互式 UI | 打开交互界面 |
| `prompt` | 展开为提示词发送给模型 | 由模型处理并响应 |

---

## 特性标志说明

部分命令由特性标志控制，仅在特定条件下可用：

| 标志 | 命令 |
|------|------|
| `PROACTIVE`/`KAIROS` | `/proactive` |
| `KAIROS_BRIEF` | `/brief` |
| `KAIROS` | `/assistant` |
| `BRIDGE_MODE` | `/bridge`, `/remoteControlServer` |
| `DAEMON` + `BRIDGE_MODE` | `/remoteControlServer` |
| `VOICE_MODE` | `/voice` |
| `HISTORY_SNIP` | `/force-snip` |
| `WORKFLOW_SCRIPTS` | `/workflows` |
| `CCR_REMOTE_SETUP` | `/remote-setup` |
| `EXPERIMENTAL_SKILL_SEARCH` | `clearSkillIndexCache` |
| `KAIROS_GITHUB_WEBHOOKS` | `/subscribe-pr` |
| `ULTRAPLAN` | `/ultraplan` |
| `TORCH` | `/torch` |
| `UDS_INBOX` | `/peers` |
| `FORK_SUBAGENT` | `/fork` |
| `BUDDY` | `/buddy` |

---

## 使用技巧

1. **Tab 补全**: 输入 `/` 后按 Tab 查看所有可用命令
2. **命令别名**: 许多命令有别名，如 `/exit` = `/quit`
3. **参数提示**: 灰色文字显示在命令后，提示可接受的参数
4. **立即执行**: 标记为 `immediate` 的命令无需等待，直接执行
5. **非交互式支持**: 部分命令支持在非交互式模式（如管道）中使用

---

*此文档是项目契约的一部分。一旦 Panda Code 功能更新，此文档必须同步更新。*
