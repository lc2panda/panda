# Panda Code / 命令使用手册 (v2.1.124)

> 本手册基于 v2.1.124 实机 PTY 验证，覆盖 **69 个已验证命令** + 内部/存根命令。
>
> 最后更新: 2026-04-03 · 版本: v2.1.124 · 验证: 65 PASS / 3 BLOCKED / 1 N/A

---

## 命令状态图例

| 标记 | 含义 |
|------|------|
| ✅ | 已验证正常工作 |
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
| `/exit` | `/quit` | 退出 REPL | ✅ |

### 高频使用

| 命令 | 别名 | 一句话说明 | 状态 |
|------|------|-----------|------|
| `/plan` | | 启用计划模式（先想后做） | ✅ |
| `/effort` | | 调节推理深度 (low/medium/high/max/auto) | ✅ |
| `/copy` | | 复制最后回复到剪贴板 | ✅ |
| `/config` | `/settings` | 打开配置面板 | ✅ |
| `/resume` | `/continue` | 恢复历史对话 | ✅ |
| `/btw` | | 快速插问不打断主线 | ✅ |
| `/context` | | 可视化上下文使用情况 | ✅ |
| `/files` | | 列出当前上下文中的文件 | ✅ |

---

## 一、基础控制命令

### `/help`
- **用法**: `/help`
- **说明**: 显示交互式帮助界面，包含所有可用命令和快捷键
- **实测**: ✅ 显示 Panda Code v2.1.124 帮助信息、快捷键列表
- **技巧**: 新手首选，快速了解所有功能

### `/exit` (别名: `/quit`)
- **用法**: `/exit`
- **说明**: 退出 REPL，等同于按 `Ctrl+D`
- **实测**: ✅ 立即退出

### `/clear` (别名: `/reset`, `/new`)
- **用法**: `/clear`
- **说明**: 清除对话历史并释放上下文，相当于开始新对话
- **实测**: ✅ 清空会话，返回空提示符
- **技巧**: 对话过长导致回复质量下降时使用

### `/version`
- **用法**: `/version`
- **说明**: 显示当前版本和构建时间
- **实测**: ✅ 输出 `2.1.124 (built 2026-04-03T12:54:39.270Z)`

### `/status`
- **用法**: `/status`
- **说明**: 显示完整状态信息（版本、Session ID、工作目录、模型、认证方式、API URL）
- **实测**: ✅ 显示版本、登录方式、Anthropic base URL 等
- **技巧**: 排查问题时首先运行此命令

---

## 二、对话管理命令

### `/compact`
- **用法**: `/compact [自定义摘要指令]`
- **说明**: 压缩对话历史但保留摘要在上下文中
- **实测**: ✅ 空会话正确返回 "No messages to compact"
- **技巧**:
  - 上下文接近满时自动提醒，此时用 `/compact` 可继续长任务
  - 可传自定义指令：`/compact 重点保留架构决策和代码路径`
  - 支持非交互式模式（管道使用）

### `/copy`
- **用法**: `/copy [N]`
- **说明**: 复制最后一条回复到系统剪贴板，`/copy 3` 复制倒数第3条
- **实测**: ✅ 空会话正确提示 "No assistant message to copy"
- **技巧**: 将 AI 生成的代码片段直接粘贴到其他编辑器

### `/export`
- **用法**: `/export [filename]`
- **说明**: 导出当前对话到文件或剪贴板
- **实测**: ✅ 弹出交互选择对话框（JSON/Markdown/剪贴板）
- **技巧**: 导出为 Markdown 方便分享给团队

### `/resume` (别名: `/continue`)
- **用法**: `/resume [conversation_id 或搜索词]`
- **说明**: 从历史会话中搜索并恢复
- **实测**: ✅ 显示会话选择界面，支持搜索
- **技巧**: 可用关键词搜索历史会话，如 `/resume 修复bug`

### `/branch` (别名: `/fork` [条件性])
- **用法**: `/branch [name]`
- **说明**: 在当前对话节点创建分支，探索不同方案
- **实测**: ✅ 空会话正确返回 "Failed to branch"
- **技巧**: 在做出关键决策前分支，方便后续对比

### `/rewind` (别名: `/checkpoint`)
- **用法**: `/rewind`
- **说明**: 将代码和/或对话回退到之前的节点
- **实测**: ✅ 显示回退界面，可选择回退点
- **技巧**: AI 改错了代码？`/rewind` 立即回退到修改前

### `/tag`
- **用法**: `/tag <tag-name>`
- **说明**: 为当前会话添加/移除可搜索标签
- **实测**: ✅ 正确提示用法 "Usage: /tag \<name\>"
- **技巧**: 给重要会话打标签，方便 `/resume` 搜索

### `/rename`
- **用法**: `/rename [name]`
- **说明**: 重命名当前对话
- **实测**: ✅ 显示重命名交互提示

### `/btw`
- **用法**: `/btw <问题>`
- **说明**: 快速插问，不打断主对话上下文
- **实测**: ✅ 正确提示用法
- **技巧**: 编码过程中突然想到无关问题，用 `/btw` 避免污染主线

---

## 三、代码操作命令

### `/commit`
- **用法**: `/commit`
- **说明**: 分析 git diff，自动生成符合项目风格的 commit message 并提交
- **实测**: ✅ 正确识别并显示在命令菜单中
- **技巧**:
  - 自动遵循 Conventional Commits 风格
  - 会分析最近几次提交的风格来匹配
  - Undercover 模式下自动屏蔽内部信息

### `/commit-push-pr` (别名: `/cpp`)
- **用法**: `/commit-push-pr`
- **说明**: 一键完成 commit → push → 创建 PR 的完整流程
- **技巧**: 适合快速发布小改动

### `/diff`
- **用法**: `/diff`
- **说明**: 显示 `git diff HEAD` 和每轮对话的代码变更
- **实测**: ✅ 显示 "Uncommitted changes" 及文件列表
- **技巧**: 提交前检查 AI 修改了哪些文件

### `/review`
- **用法**: `/review [PR number]`
- **说明**: 审查 Pull Request，无 PR 编号时列出 open PRs
- **实测**: ✅ 正确识别命令
- **技巧**: `gh pr list` 找到 PR 号后 `/review 123`

### `/pr-comments` (别名: `/pr_comments`)
- **用法**: `/pr-comments [PR number]`
- **说明**: 获取 GitHub PR 的所有评论并总结
- **实测**: ✅ 正确识别命令

### `/security-review`
- **用法**: `/security-review`
- **说明**: 对待提交变更做安全审查
- **实测**: ✅ 正确识别命令
- **技巧**: 上线前必做，检查 XSS/注入/敏感信息泄露

### `/ultrareview`
- **用法**: `/ultrareview`
- **说明**: 深度审查（约 10-20 分钟），在 Web 端运行
- **条件**: 🔧 Feature-gated

---

## 四、模型与推理命令

### `/model`
- **用法**: `/model [model_name]`
- **说明**: 切换 AI 模型，支持 Claude 全系列
- **实测**: ✅ 弹出模型选择菜单
- **可选模型**:
  - `opus` — Opus 4.6（最强，复杂任务）
  - `sonnet` — Sonnet 4.6（日常推荐）
  - `haiku` — Haiku 4.5（最快，简单问答）
- **技巧**: 复杂架构设计用 Opus，日常编码用 Sonnet，快速查询用 Haiku

### `/effort`
- **用法**: `/effort [low|medium|high|max|auto]`
- **说明**: 调节模型推理深度
- **实测**: ✅ 显示 "Effort level: auto (currently high)"
- **级别说明**:
  - `low` — 快速响应，适合简单问答
  - `medium` — 平衡模式
  - `high` — 深入推理（默认）
  - `max` — 最高质量，适合复杂问题
  - `auto` — 自动判断（推荐）
- **技巧**: 格式化/重命名等简单任务用 `low`，节省 token

### `/fast`
- **用法**: `/fast [on|off]`
- **说明**: 切换高速模式（Opus 4.6 专用，按额外用量计费）
- **实测**: ✅ 显示 toggle 界面和计费说明
- **条件**: 🔒 需要 Claude.ai 订阅

### `/advisor`
- **用法**: `/advisor [model_name]`
- **说明**: 配置顾问模型（辅助主模型决策）
- **实测**: ✅ 显示 "Advisor: not set"，提示用法

### `/torch`
- **用法**: `/torch`
- **说明**: 切换 Torch 模式，增强模型推理过程可见性
- **实测**: ✅ 正常 toggle
- **条件**: 🔧 TORCH Feature Flag

---

## 五、配置设置命令

### `/config` (别名: `/settings`)
- **用法**: `/config`
- **说明**: 打开交互式配置面板
- **实测**: ✅ 显示配置面板（model/select 选项）
- **技巧**: 一站式管理所有设置

### `/theme`
- **用法**: `/theme`
- **说明**: 选择终端配色主题
- **实测**: ✅ 显示主题选择器（dark/light 等）
- **可选**: auto, dark, light, light-daltonized, dark-daltonized, light-ansi, dark-ansi

### `/color`
- **用法**: `/color <color|default>`
- **说明**: 设置本次会话提示栏颜色
- **实测**: ✅ 显示颜色选择界面
- **技巧**: 多窗口工作时用不同颜色区分

### `/vim`
- **用法**: `/vim`
- **说明**: 切换 Vim/普通编辑模式
- **实测**: ✅ 切换模式
- **技巧**: Vim 党福音，支持 hjkl 导航和命令模式

### `/keybindings`
- **用法**: `/keybindings`
- **说明**: 打开快捷键配置文件 (`~/.pandacc/keybindings.json`)
- **实测**: ✅ 显示当前键绑定配置

### `/language`
- **用法**: `/language [en|zh|...]`
- **说明**: 切换界面语言
- **实测**: ✅ 显示 English/中文 切换

### `/persona`
- **用法**: `/persona [模式]`
- **说明**: 切换人格模式
- **实测**: ✅ 显示人格选项
- **模式**:
  - `work` — 工作模式：专业简洁，高效输出
  - `companion` — 陪伴模式：更友好更耐心
  - `study` — 学习模式：详细解释
  - `creative` — 创意模式：更发散思维
  - `butler` — 管家模式：主动服务

### `/privacy`
- **用法**: `/privacy`
- **说明**: 查看隐私状态（telemetry/analytics）
- **实测**: ✅ 显示隐私设置面板

### `/privacy-settings`
- **用法**: `/privacy-settings`
- **说明**: 查看和更新隐私设置（详细版）
- **条件**: 🔒 仅消费者订阅用户可用

### `/sandbox`
- **用法**: `/sandbox`
- **说明**: 配置 Bash 命令沙盒模式
- **实测**: ✅ 显示 "sandbox disabled" 及配置入口
- **技巧**: 在不信任的代码库中启用，防止误操作

### `/statusline`
- **用法**: `/statusline`
- **说明**: 设置状态栏 UI 显示
- **实测**: ✅ 显示状态栏设置界面

---

## 六、工具与权限命令

### `/permissions` (别名: `/allowed-tools`)
- **用法**: `/permissions`
- **说明**: 管理 Allow/Ask/Deny 工具权限规则
- **实测**: ✅ 显示权限规则列表（含搜索框和已配置 Bash 规则）
- **技巧**:
  - `Allow` — 永远允许该工具
  - `Ask` — 每次询问（默认）
  - `Deny` — 永远拒绝
  - 可配置 Bash 正则：如允许 `git *` 但拒绝 `rm -rf *`

### `/mcp`
- **用法**: `/mcp [enable|disable server-name]`
- **说明**: 管理 MCP (Model Context Protocol) 服务器扩展
- **实测**: ✅ 显示 Plugins 管理 UI，已安装插件列表
- **技巧**: 管理已连接的 MCP 服务器，启用/禁用特定扩展

### `/hooks`
- **用法**: `/hooks`
- **说明**: 查看工具事件钩子配置
- **实测**: ✅ 显示 "5 hooks configured"（PreToolUse/PostToolUse 等）
- **技巧**: 可在 settings.json 中配置钩子实现自动化

### `/tasks` (别名: `/bashes`)
- **用法**: `/tasks`
- **说明**: 列出和管理后台任务
- **实测**: ✅ 显示 "No tasks currently running"
- **技巧**: 用 `&` 启动后台任务后，用 `/tasks` 管理

---

## 七、Agent 与高级功能

### `/agents`
- **用法**: `/agents`
- **说明**: 管理自定义 Agent 配置
- **实测**: ✅ 显示 Agent 管理面板
- **技巧**: 在 `.pandacc/agents/` 下创建自定义 Agent

### `/plan`
- **用法**: `/plan [open|描述]`
- **说明**: 启用计划模式或查看/创建计划
- **实测**: ✅ "Enabled plan mode"
- **技巧**:
  - `/plan` — 切换计划模式（先计划后执行）
  - `/plan open` — 打开计划编辑器
  - `Shift+Tab` — 循环切换权限模式（含 plan）
  - **强烈推荐复杂任务先用计划模式**

### `/fork`
- **用法**: `/fork <任务描述>`
- **说明**: 派生后台子 Agent 并行执行任务
- **实测**: ✅ 创建新会话（⚠️ 有非致命 JS 警告但功能正常）
- **条件**: 🔧 FORK_SUBAGENT Feature Flag

### `/workflows`
- **用法**: `/workflows`
- **说明**: 列出和管理工作流脚本
- **实测**: ✅ 显示 "No workflow scripts found" + 创建提示
- **技巧**: 在 `.pandacc/workflows/` 下创建可复用的自动化脚本

### `/skills`
- **用法**: `/skills`
- **说明**: 列出所有可用技能（内置 + 插件 + 目录）
- **实测**: ✅ 显示技能列表

### `/night-mode`
- **用法**: `/night-mode`
- **说明**: 切换夜间模式（配合 proactive 引擎）
- **实测**: ✅ 显示 "Night mode: OFF" + 时间范围配置

---

## 八、插件与扩展

### `/plugin` (别名: `/plugins`, `/marketplace`)
- **用法**: `/plugin`
- **说明**: 浏览、安装、配置插件市场
- **实测**: ✅ 显示 138 个可用插件，含 Discover/Installed/Errors 标签
- **技巧**:
  - 搜索安装：`/plugin` → Discover → 搜索
  - 热门插件：superpowers, context7, code-review
  - 安装后用 `/reload-plugins` 立即生效

### `/reload-plugins`
- **用法**: `/reload-plugins`
- **说明**: 热重载插件变更，无需重启
- **实测**: ✅ "Reloaded: 1 plugin · 0 skills · 5 agents · 0 hooks"

---

## 九、信息查询命令

### `/context`
- **用法**: `/context`
- **说明**: 以彩色网格可视化上下文使用情况
- **实测**: ✅ 启动可视化动画
- **技巧**: 上下文快满时考虑 `/compact` 或 `/clear`

### `/files`
- **用法**: `/files`
- **说明**: 列出当前上下文中的所有文件
- **实测**: ✅ 列出 MEMORY.md, CLAUDE.md 等
- **技巧**: 检查哪些文件已加载到上下文

### `/doctor`
- **用法**: `/doctor`
- **说明**: 诊断并验证安装和配置
- **实测**: ✅ 显示完整诊断（版本、路径、安装方式、搜索状态、自动更新状态）
- **技巧**: 排障首选，检查配置是否正确

### `/cost`
- **用法**: `/cost`
- **说明**: 显示当前会话总花费和持续时间
- **实测**: ✅ 正确识别命令

### `/usage`
- **用法**: `/usage`
- **说明**: 显示套餐用量限额
- **实测**: ✅ 正确识别命令

### `/stats`
- **用法**: `/stats`
- **说明**: 显示使用统计（月度热力图 + token 统计）
- **实测**: ✅ 显示 Overview/Models 标签页 + 活跃热力图

### `/insights`
- **用法**: `/insights`
- **说明**: 生成会话分析报告（调用 API）
- **实测**: ✅ 启动加载动画并开始生成

### `/memory`
- **用法**: `/memory`
- **说明**: 编辑记忆文件（auto-memory/project memory/user memory）
- **实测**: ✅ 显示 Memory 面板（auto-memory on, auto-dream off）
- **技巧**: 在 memory 中存储项目上下文，新对话自动加载

---

## 十、远程与连接命令

### `/remote-control` (别名: `/rc`)
- **用法**: `/remote-control`
- **说明**: 连接终端进行远程控制会话
- **实测**: ✅ 显示 Remote Control 界面（Disconnect/Show QR/Continue）

### `/session` (别名: `/remote`)
- **用法**: `/session`
- **说明**: 显示远程会话 URL 和二维码
- **实测**: ✅ 渲染 QR 码

### `/mobile` (别名: `/ios`, `/android`)
- **用法**: `/mobile`
- **说明**: 显示移动应用下载二维码
- **实测**: ✅ 渲染下载 QR 码

### `/remote-env`
- **用法**: `/remote-env`
- **说明**: 配置远程环境默认设置
- **条件**: 🔒 需要 Claude.ai 账户认证

### `/desktop` (别名: `/app`)
- **用法**: `/desktop`
- **说明**: 在 Claude Desktop 中继续当前会话
- **实测**: ✅ 尝试打开（需安装 Claude Desktop）

### `/chrome`
- **用法**: `/chrome`
- **说明**: Chrome 扩展设置 (Beta)
- **实测**: ✅ 显示 Chrome 扩展设置界面

---

## 十一、初始化与安装

### `/init`
- **用法**: `/init`
- **说明**: 初始化 CLAUDE.md 项目记忆文件
- **实测**: ✅ 启动 Composing 过程
- **技巧**: 新项目首先运行，AI 会分析代码库并生成项目文档

### `/terminal-setup`
- **用法**: `/terminal-setup`
- **说明**: 安装 Shift+Enter 换行键绑定
- **实测**: ✅ 显示安装提示

### `/release-notes`
- **用法**: `/release-notes`
- **说明**: 查看版本发布说明
- **实测**: ✅ 显示 v2.x 版本说明

### `/add-dir`
- **用法**: `/add-dir <path>`
- **说明**: 添加新工作目录
- **实测**: ✅ 显示添加提示

### `/stickers`
- **用法**: `/stickers`
- **说明**: 在浏览器中打开贴纸订购页面
- **实测**: ✅ "Opening sticker page in browser…"

---

## 十二、账户认证命令

> ⚠️ 以下命令与 Anthropic 原生登录相关，按指示未做验证测试

### `/login`
- **用法**: `/login`
- **说明**: 登录 Anthropic 账户
- **条件**: API Key 模式下无需使用

### `/logout`
- **用法**: `/logout`
- **说明**: 退出 Anthropic 账户登录

### `/passes`
- **用法**: `/passes`
- **说明**: 分享免费体验周给朋友，赚取额外用量

### `/extra-usage`
- **用法**: `/extra-usage`
- **说明**: 配置额外用量（超限时自动购买）
- **条件**: 🔒 需要消费者订阅 + 交互模式

### `/upgrade`
- **用法**: `/upgrade`
- **说明**: 升级到 Max 获得更高限额

---

## 十三、GitHub 集成命令

### `/install-github-app`
- **用法**: `/install-github-app`
- **说明**: 为仓库设置 Claude GitHub Actions
- **条件**: 🔒 需要 Claude.ai 或 Console 认证

### `/install-slack-app`
- **用法**: `/install-slack-app`
- **说明**: 安装 Claude Slack 应用

### `/subscribe-pr`
- **用法**: `/subscribe-pr [PR number]`
- **说明**: 订阅 PR 更新通知
- **条件**: 🔧 KAIROS_GITHUB_WEBHOOKS Feature Flag

---

## 十四、内部/调试命令

> 以下命令为 Anthropic 内部命令或调试工具，大部分为存根实现（🚫）

| 命令 | 说明 | 状态 |
|------|------|------|
| `/heapdump` | 转储 JS 堆到 ~/Desktop | 🚫 隐藏 |
| `/bridge-kick` | 注入 bridge 故障用于测试 | 🚫 内部 |
| `/force-snip` | 强制截断对话历史 | 🚫 Feature-gated |
| `/autofix-pr` | 自动修复 PR 问题 | 🚫 存根 |
| `/backfill-sessions` | 回填会话数据 | 🚫 存根 |
| `/break-cache` | 打破提示缓存 | 🚫 存根 |
| `/bughunter` | Bug 猎人 | 🚫 存根 |
| `/ctx_viz` | 高级上下文可视化 | 🚫 存根 |
| `/debug-tool-call` | 调试工具调用 | 🚫 存根 |
| `/env` | 管理环境变量 | 🚫 存根 |
| `/good-claude` | Good Claude 模式 | 🚫 存根 |
| `/issue` | 创建内部 Issue | 🚫 存根 |
| `/mock-limits` | 模拟速率限制 | 🚫 存根 |
| `/oauth-refresh` | 刷新 OAuth | 🚫 存根 |
| `/onboarding` | 重新运行引导 | 🚫 存根 |
| `/reset-limits` | 重置速率限制 | 🚫 存根 |
| `/share` | 分享对话 | 🚫 存根 |
| `/ant-trace` | Ant 追踪 | 🚫 存根 |
| `/perf-issue` | 性能问题报告 | 🚫 存根 |
| `/summary` | 生成对话摘要 | 🚫 内部 |
| `/ultraplan` | 超级计划模式 | 🚫 内部 |
| `/init-verifiers` | 初始化验证器 | 🚫 内部 |
| `/feedback` | 提交反馈 | ⚠️ 技能未注册 |

---

## 十五、Feature Flag 对照表

| Feature Flag | 控制的命令 | 说明 |
|-------------|-----------|------|
| `PROACTIVE` / `KAIROS` | `/proactive`, `/assistant` | 主动模式/助手模式 |
| `KAIROS_BRIEF` | `/brief` | 简报模式 |
| `BRIDGE_MODE` | `/remote-control`, `/rc` | 远程控制 |
| `DAEMON` + `BRIDGE_MODE` | `/rcs` | 远程控制服务器 |
| `VOICE_MODE` | `/voice` | 语音模式 |
| `HISTORY_SNIP` | `/force-snip` | 强制截断历史 |
| `WORKFLOW_SCRIPTS` | `/workflows` | 工作流脚本 |
| `ULTRAPLAN` | `/ultraplan` | 超级计划 |
| `TORCH` | `/torch` | Torch 模式 |
| `UDS_INBOX` | `/peers` | 对等会话 |
| `FORK_SUBAGENT` | `/fork` | 派生子 Agent |
| `BUDDY` | `/buddy` | 编程伙伴 |

---

## 十六、命令类型说明

| 类型 | 说明 | 执行方式 |
|------|------|----------|
| `local` | 本地执行，返回文本结果 | 立即执行，输出文本到终端 |
| `local-jsx` | 本地执行，渲染交互式 UI | 打开交互界面（可用方向键/Tab 操作） |
| `prompt` | 展开为提示词发送给模型 | 由 AI 模型处理并返回响应 |

---

## 十七、实用技巧集锦

### 快捷键速查

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

### 工作流建议

1. **新项目**: `/init` → `/plan` → 开始编码
2. **日常编码**: `/model sonnet` → 编码 → `/diff` → `/commit`
3. **复杂任务**: `/plan` → `/effort max` → `/model opus` → 执行 → `/compact`
4. **代码审查**: `/review PR号` → `/security-review`
5. **上下文管理**: `/context` 查看 → `/compact` 压缩 → `/files` 确认
6. **排障**: `/doctor` → `/status` → `/version`
7. **长会话**: 定期 `/compact` → `/tag 项目名` → 下次 `/resume 项目名`

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

---

## 十八、验证结果汇总

> 基于 v2.1.124 实机 PTY 测试（2026-04-03）

| 分类 | 测试数 | PASS | BLOCKED | N/A |
|------|--------|------|---------|-----|
| 基础控制 | 5 | 5 | 0 | 0 |
| 对话管理 | 10 | 10 | 0 | 0 |
| 代码操作 | 6 | 6 | 0 | 0 |
| 模型推理 | 5 | 5 | 0 | 0 |
| 配置设置 | 11 | 11 | 0 | 0 |
| 工具权限 | 4 | 4 | 0 | 0 |
| Agent 高级 | 6 | 6 | 0 | 0 |
| 插件扩展 | 3 | 3 | 0 | 0 |
| 信息查询 | 8 | 8 | 0 | 0 |
| 远程连接 | 6 | 4 | 1 | 0 |
| 初始化安装 | 5 | 5 | 0 | 0 |
| 账户认证 | 3 | 1 | 2 | 0 |
| 杂项 | 2 | 1 | 0 | 1 |
| **合计** | **69** | **65** | **3** | **1** |

- **BLOCKED 命令** (3): `/extra-usage` `/privacy-settings` `/remote-env` — 设计上需特定认证类型
- **N/A 命令** (1): `/feedback` — 技能未注册（非代码 bug）

---

*此文档是项目契约的一部分。一旦 Panda Code 功能更新，此文档必须同步更新。*
