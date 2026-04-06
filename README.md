# Panda Code — AI 终端编程助手

> **此项目的任何功能、架构更新，必须在结束后同步更新相关文档。这是我们契约的一部分。**

```
 ██████╗   █████╗  ███╗   ██╗ ██████╗   █████╗
 ██╔══██╗ ██╔══██╗ ████╗  ██║ ██╔══██╗ ██╔══██╗
 ██████╔╝ ███████║ ██╔██╗ ██║ ██║  ██║ ███████║
 ██╔═══╝  ██╔══██║ ██║╚██╗██║ ██║  ██║ ██╔══██║
 ██║      ██║  ██║ ██║ ╚████║ ██████╔╝ ██║  ██║
 ╚═╝      ╚═╝  ╚═╝ ╚═╝  ╚═══╝ ╚═════╝  ╚═╝  ╚═╝
 ██████╗  ██████╗  ██████╗  ███████╗
 ██╔════╝ ██╔═══██╗██╔══██╗ ██╔════╝
 ██║      ██║   ██║██║  ██║ █████╗
 ██║      ██║   ██║██║  ██║ ██╔══╝
 ╚██████╗ ╚██████╔╝██████╔╝ ███████╗
 ╚═════╝  ╚═════╝ ╚═════╝  ╚══════╝
```

**项目代号**：Panda Code
**版本**：v2.1.92（基线 Claude Code v2.1.92）
**技术栈**：Bun + TypeScript + React/Ink + Commander.js
**运行时**：Bun >= 1.2.0 / Node.js >= 18.0.0

---

## 安装

**第一步：配置认证（只需一次）**

GitHub Packages 需要认证。在 GitHub 生成 Personal Access Token：
[GitHub Settings → Developer settings → Personal access tokens → Generate new token](https://github.com/settings/tokens)，勾选 `read:packages`。

macOS / Linux：
```bash
echo "//npm.pkg.github.com/:_authToken=你的TOKEN" >> ~/.npmrc
echo "@lc2panda:registry=https://npm.pkg.github.com" >> ~/.npmrc
```

Windows — 编辑 `%USERPROFILE%\.npmrc` 文件（如果不存在就新建），添加两行：
```
//npm.pkg.github.com/:_authToken=你的TOKEN
@lc2panda:registry=https://npm.pkg.github.com
```

**第二步：安装**
```bash
npm install -g @lc2panda/panda-code
```

**第三步：使用**
```bash
panda
```

**更新**：`npm update -g @lc2panda/panda-code`

### 首次使用

```bash
panda auth login    # 交互式选择 Provider
panda auth status   # 查看认证状态
```

---

## 多 Provider 支持

```bash
panda auth login
# 交互式选择：Anthropic / DeepSeek / Kimi / Qwen / MiniMax / GLM / 火山引擎
```

| Provider | Base URL | 默认模型 | 控制台 |
|----------|----------|----------|--------|
| Anthropic | 原版 OAuth | claude-sonnet-4-6 | [console.anthropic.com](https://console.anthropic.com) |
| DeepSeek | api.deepseek.com/anthropic | deepseek-chat | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| Kimi Code | api.kimi.com/coding | kimi-k2.5 | [kimi.com/code](https://www.kimi.com/code) |
| Qwen | dashscope-intl.aliyuncs.com/apps/anthropic | qwen-plus | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com/) |
| MiniMax | api.minimax.io/anthropic | MiniMax-M2.5 | [platform.minimax.io](https://platform.minimax.io) |
| GLM | open.bigmodel.cn/api/anthropic | glm-4 | [open.bigmodel.cn](https://open.bigmodel.cn/) |
| Volcano | ark.cn-beijing.volces.com/api/coding | ark-code-latest | [console.volcengine.com](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey) |

---

## 命令参考

> 完整手册请查看 [CC命令使用手册.md](CC命令使用手册.md)

### 核心命令速查

| 分类 | 命令 | 说明 |
|------|------|------|
| **基础** | `/help` `/clear` `/exit` `/status` `/version` | 帮助、清空、退出、状态、版本 |
| **对话** | `/compact` `/resume` `/branch` `/rewind` `/copy` `/export` | 压缩、恢复、分支、回退、复制、导出 |
| **代码** | `/commit` `/diff` `/review` `/security-review` `/pr-comments` | 提交、差异、审查、安全审查、PR评论 |
| **模型** | `/model` `/effort` `/fast` `/advisor` `/torch` | 切换模型、推理深度、高速、顾问、推理可见 |
| **配置** | `/config` `/theme` `/color` `/vim` `/language` `/persona` | 设置、主题、颜色、Vim、语言、人格 |
| **工具** | `/permissions` `/mcp` `/hooks` `/tasks` `/plugin` | 权限、MCP、钩子、任务、插件 |
| **Agent** | `/plan` `/fork` `/agents` `/workflows` `/skills` | 计划、派生、Agent、工作流、技能 |
| **查询** | `/context` `/files` `/doctor` `/cost` `/stats` `/memory` | 上下文、文件、诊断、费用、统计、记忆 |

### 🆕 v2.1.92 私人助手命令

| 命令 | 说明 |
|------|------|
| `/dream` | 四阶段记忆整合（Orient→Gather→Consolidate→Prune），支持 cron 定时 |
| `/assistant` | 启用 KAIROS 助手模式 — 激活主动引擎 + 定时任务 |
| `/proactive` | 切换主动自主模式 — 含 dream/briefing/health 三个内置任务 |
| `/night-mode` | 夜间自主模式（22:00-06:00）— 顺序执行 + 错误隔离 |
| `/buddy` | 编程伙伴 — 可交互的熊猫伙伴 |
| `/brief` | 简报模式 — AI 只输出简洁摘要 |
| `/persona auto` | 自动人格切换 — 根据时间/情绪/活动自动调整 |

### Ant-Only 高级命令（已全部启用）

| 命令 | 说明 |
|------|------|
| `/ultraplan` | CCR 远程深度规划（10-30 分钟） |
| `/ultrareview` | 深度代码审查 + bug 验证 |
| `/force-snip` | 强制截断对话历史 |
| `/init-verifiers` | 初始化验证器脚本 |
| `/subscribe-pr` | 订阅 PR 更新通知 |
| `/heapdump` | JS 堆转储 |

### 快捷键

| 快捷键 | 功能 | 快捷键 | 功能 |
|--------|------|--------|------|
| `Shift+Tab` | 切换权限模式 | `Ctrl+D` | 退出 |
| `Meta+P` | 切换模型 | `Ctrl+T` | 任务面板 |
| `Ctrl+G` | $EDITOR 编辑 | `Ctrl+O` | 详细输出 |
| `\` + `Enter` | 换行 | `!` | Bash 模式 |
| `@` | 文件补全 | `&` | 后台运行 |

### 环境变量

| 变量 | 说明 |
|------|------|
| `PANDA_SECURITY_RESEARCH=1` | 禁用安全限制（安全研究用） |
| `PANDA_HIDE_CONTEXT_WARNING=1` | 隐藏上下文满警告 |
| `PANDA_NO_AUTO_COLLAPSE=1` | 禁止 Read/Grep 自动折叠 |
| `PANDA_SHOW_DEVBAR=1` | 非 dev 构建显示 DevBar |
| `CLAUDE_CODE_COORDINATOR_MODE=1` | 启用 Coordinator 多 Agent |
| `ENABLE_TOOL_SEARCH=true` | ToolSearch（默认已启用） |

---

## 隐私保护

所有渠道均可启用隐私增强模式（配置 `privacyEnhanced: true` 或使用 `/privacy` 命令）。非 Anthropic 渠道自动启用。

| 防护层 | 内容 | 状态 |
|--------|------|------|
| 遥测拦截 | 1104 个 logEvent 调用点全部拦截 | 自动 |
| 分析禁用 | GrowthBook / Datadog / BigQuery / 1P 事件 | 自动 |
| UA 规范化 | 精简为 `PandaCode/{version}`，不泄露设备信息 | 自动 |
| Header 清理 | 移除 x-app、session-id 等跟踪头 | 自动 |
| 独立存储 | `~/.pandacc/` 独立空间，不与原版 claude 混用 | 自动 |
| 进程指标 | BigQuery Metrics 导出拦截 | 自动 |
| OAuth | 隐私模式下不额外请求 Profile | 自动 |

查看当前隐私状态：`/privacy`

---

## 跨平台支持

| 平台 | 状态 | 说明 |
|------|------|------|
| macOS | 完整支持 | Keychain 存储、osascript 集成 |
| Windows | 完整支持 | PowerShell 自动检测、git-bash Shell、路径转换 |
| Linux | 完整支持 | 标准 POSIX 环境 |
| WSL | 完整支持 | 自动检测 WSL 环境 |

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     终 端 渲 染 层 (Ink/React)                   │
│   REPL 交互 │ 权限提示 │ 消息渲染 │ Logo │ 快捷键 │ 补全        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                     核 心 对 话 循 环                             │
│  query.ts │ QueryEngine.ts │ 会话管理 │ 压缩/恢复               │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
┌──────────────┴──────────────┐ ┌─────────────┴───────────────────┐
│      工 具 系 统 (59个)      │ │       API / Provider 层          │
│  BashTool │ AgentTool       │ │  Anthropic │ Bedrock │ Vertex   │
│  SleepTool │ MonitorTool    │ │  Foundry │ DeepSeek │ Kimi     │
│  SnipTool │ WorkflowTool   │ │  Qwen │ MiniMax │ GLM │ 火山   │
└──────────────┬──────────────┘ └─────────────┬───────────────────┘
               │                              │
┌──────────────┴──────────────────────────────┴───────────────────┐
│                    服 务 与 基 础 设 施 层                        │
│  MCP │ OAuth │ Plugins │ Hooks │ SessionMemory │ Privacy       │
│  Compact │ Skills │ LSP │ Cron │ PolicyLimits │ Persona       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  私 人 助 手 系 统 (v2.1.92 新增)                 │
│  autoDream │ KAIROS │ Proactive │ NightMode │ Mood │ Sense    │
│  Coordinator │ Buddy │ Brief │ Persona │ Memory │ Dream     │
└─────────────────────────────────────────────────────────────────┘

╔═════════════════════════════════════════════════════════════════╗
║      Feature Flag 系 统 (92 个全开 + 31 GrowthBook tengu flags)  ║
╚═════════════════════════════════════════════════════════════════╝
```

---

## 许可证

本项目基于 CCB (Claude Code Best) 逆向还原，仅供学习研究用途。
