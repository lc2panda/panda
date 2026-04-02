# Panda Code — AI 终端编程助手

> **此项目的任何功能、架构更新，必须在结束后同步更新相关文档。这是我们契约的一部分。**

```
  ██████╗  █████╗ ███╗   ██╗██████╗  █████╗
  ██╔══██╗██╔══██╗████╗  ██║██╔══██╗██╔══██╗
  ██████╔╝███████║██╔██╗ ██║██║  ██║███████║
  ██╔═══╝ ██╔══██║██║╚██╗██║██║  ██║██╔══██║
  ██║     ██║  ██║██║ ╚████║██████╔╝██║  ██║
  ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝
       ██████╗ ██████╗ ██████╗ ███████╗
      ██╔════╝██╔═══██╗██╔══██╗██╔════╝
      ██║     ██║   ██║██║  ██║█████╗
      ██║     ██║   ██║██║  ██║██╔══╝
      ╚██████╗╚██████╔╝██████╔╝███████╗
       ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
  A bamboo-eating panda. My code? 100% organic AI-grown 🎋
```

**项目代号**：Panda Code
**版本**：2.1.888
**基线**：Anthropic Claude Code v2.1.88 逆向还原 + 全量功能释放
**技术栈**：Bun + TypeScript + React/Ink + Commander.js
**运行时**：Bun >= 1.2.0 / Node.js >= 18.0.0

---

## 目录

- [项目概述](#项目概述)
- [核心价值](#核心价值)
- [新增能力](#新增能力)
- [系统架构](#系统架构)
- [能力清单](#能力清单)
- [多 Provider 支持](#多-provider-支持)
- [Feature Flags](#feature-flags)
- [项目目录结构](#项目目录结构)
- [快速开始](#快速开始)
- [构建说明](#构建说明)
- [隐私保护](#隐私保护)
- [内部包](#内部包)
- [跨平台支持](#跨平台支持)
- [开发规范](#开发规范)
- [审计与验证](#审计与验证)

---

## 项目概述

Panda Code 基于 CCB (Claude Code Best) 项目，是 Anthropic 官方 Claude Code CLI v2.1.88 的逆向还原版本。在 CCB 的优化还原基础上，进一步完成了：

- **全量 Feature Flags 释放**：92/92 个 flag 全部启用，包括所有 Anthropic 内部功能
- **48 个缺失模块逆向推导**：从 v2.1.88 bundle 逆向推导工具、命令、Skills、YOLO 分类器
- **YOLO Classifier Prompts**：从 v2.1.88 bundle 完整提取 auto-mode 系统提示
- **品牌定制**：Panda Code 像素熊猫 Logo + 全局品牌替换

```
  ┌─────────────────────────────────────────────────────────────┐
  │                   Panda Code 三大能力释放                    │
  ├───────────────────┬───────────────────┬─────────────────────┤
  │   全量工具        │   自主 Agent       │   远程协作          │
  │                   │                   │                     │
  │  59 个工具全部    │  KAIROS 自主模式   │  BRIDGE 远程控制    │
  │  可用，含原被禁   │  Proactive 主动    │  SSH 远程执行       │
  │  用的 14 个       │  Coordinator 编排  │  Daemon 守护进程    │
  │                   │                   │                     │
  │  SleepTool        │  Dream 记忆整理    │  后台会话 (BG)      │
  │  MonitorTool      │  Hunter Bug猎手   │  UDS Peer 通信      │
  │  SnipTool         │  Buddy 配对编程    │  Workflow 自动化    │
  │  WebBrowserTool   │  Fork 子代理       │  远程触发 (Cron)    │
  └───────────────────┴───────────────────┴─────────────────────┘
```

---

## 核心价值

```
  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │  功能完整     │   │  全面解锁     │   │  可信溯源     │
  │              │   │              │   │              │
  │ v2.1.88 完整 │   │ 92 个 flag   │   │ 每个模块有    │
  │ 能力复现     │   │ 全部启用     │   │ 推导依据      │
  │ 529 文件构建 │   │ 含 ANT-ONLY  │   │ VA 验证通过   │
  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                   ┌────────┴────────┐
                   │   品牌定制       │
                   │                 │
                   │ Panda Code 🐼   │
                   │ 像素风格 Logo    │
                   │ 全局品牌替换     │
                   └─────────────────┘
```

---

## 系统架构

Panda Code 采用**分层架构**，由入口引导、核心循环、工具系统、API 层、MCP、权限、UI 七大层级组成：

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     终 端 渲 染 层 (Ink/React)                   │
  │   REPL 交互 │ 权限提示 │ 消息渲染 │ Logo │ 快捷键 │ 补全        │
  └─────────────────────────────┬───────────────────────────────────┘
                                │ React Components + Ink
  ┌─────────────────────────────┴───────────────────────────────────┐
  │                     核 心 对 话 循 环                             │
  │                                                                 │
  │  query.ts (1700行)  │  QueryEngine.ts (1300行)  │  会话管理      │
  │  流式 API 调用       │  对话状态编排              │  压缩/恢复     │
  └──────────────┬──────────────────────────────┬───────────────────┘
                 │                              │
  ┌──────────────┴──────────────┐ ┌─────────────┴───────────────────┐
  │      工 具 系 统 (59个)      │ │       API / Provider 层          │
  │                             │ │                                 │
  │  BashTool   │ FileReadTool  │ │  Anthropic Direct (API Key)     │
  │  AgentTool  │ WebFetchTool  │ │  AWS Bedrock (凭据刷新)          │
  │  SleepTool  │ MonitorTool   │ │  Google Vertex (GCP)            │
  │  SnipTool   │ WorkflowTool  │ │  Azure Foundry (Azure AD)       │
  │  ... 全部 59 个工具         │ │                                 │
  └──────────────┬──────────────┘ └─────────────┬───────────────────┘
                 │                              │
  ┌──────────────┴──────────────────────────────┴───────────────────┐
  │                    服 务 与 基 础 设 施 层                        │
  │                                                                 │
  │  MCP (24文件)  │  OAuth  │  Plugins  │  Hooks  │  SessionMemory  │
  │  Compact       │  Skills │  LSP      │  Cron   │  PolicyLimits   │
  └─────────────────────────────────────────────────────────────────┘

  ╔═════════════════════════════════════════════════════════════════╗
  ║              Feature Flag 系 统 (92 个，全部启用)                ║
  ║                                                                 ║
  ║  Dev: bun --feature=FLAG (scripts/dev.sh)                       ║
  ║  Build: BunPlugin onLoad 内联替换 → DCE 保留                    ║
  ╚═════════════════════════════════════════════════════════════════╝
```

---

### 1. 入口与引导

```
  ┌────────────────────────┐
  │  src/entrypoints/      │
  │  cli.tsx               │
  │                        │
  │  bun:bundle feature()  │───▶ --feature=FLAG (dev)
  │  MACRO polyfill        │───▶ BunPlugin 内联 (build)
  │  BUILD_TARGET/ENV      │
  └───────────┬────────────┘
              │ 快速路径: --version / --dump-system-prompt
              │ MCP 路径: --claude-in-chrome-mcp
              │ Daemon 路径: --daemon-worker
              ▼
  ┌────────────────────────┐
  │  src/main.tsx          │
  │  (Commander.js)        │
  │                        │
  │  CLI 参数解析          │
  │  服务初始化            │
  │  REPL / Print 模式     │
  └────────────────────────┘
```

### 2. 核心对话循环

```
  用户输入
      │
      ▼
  ┌──────────────────┐
  │  QueryEngine     │──── 会话状态、压缩决策、归因追踪
  │  (编排器)        │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐     ┌──────────────────┐
  │  query()         │────▶│  Claude API      │
  │  (主循环)        │◀────│  (流式响应)      │
  │                  │     └──────────────────┘
  │  while(true):    │
  │    发送消息      │
  │    接收流式响应  │
  │    处理工具调用 ─┼──▶ tool.call() ──▶ 结果回传
  │    Token 追踪    │
  │    自动压缩检测  │
  └──────────────────┘
```

### 3. 工具系统

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                      工具注册 (tools.ts)                         │
  │                                                                 │
  │  始终可用 (20个)           条件启用 (13个)       Flag启用 (26个) │
  │  ────────────             ────────────          ──────────────  │
  │  BashTool                 GlobTool              SleepTool       │
  │  FileReadTool             GrepTool              MonitorTool     │
  │  FileEditTool             TaskCreate/Get/       SnipTool        │
  │  FileWriteTool              Update/List         WebBrowserTool  │
  │  AgentTool                EnterWorktreeTool     ListPeersTool   │
  │  WebFetchTool             ExitWorktreeTool      WorkflowTool    │
  │  WebSearchTool            TeamCreateTool        CtxInspectTool  │
  │  SendMessageTool          TeamDeleteTool        TerminalCapture │
  │  NotebookEditTool         ToolSearchTool        PushNotification│
  │  SkillTool                PowerShellTool        SubscribePRTool │
  │  ...                      LSPTool               CronCreate/Del  │
  │                                                 RemoteTrigger   │
  │                                                 ...             │
  └─────────────────────────────────────────────────────────────────┘
```

### 4. API 与 Provider

```
  ┌─────────────────────────────────────────────────────────┐
  │                 src/services/api/claude.ts               │
  │                     (3400+ 行)                          │
  │                                                         │
  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
  │  │  Anthropic   │  │  Bedrock    │  │  Vertex     │    │
  │  │  Direct      │  │  (AWS)      │  │  (GCP)      │    │
  │  │             │  │             │  │             │    │
  │  │ API Key     │  │ 凭据刷新    │  │ GCP 凭据    │    │
  │  │ OAuth       │  │ Cross-region│  │ 项目/区域   │    │
  │  └─────────────┘  └─────────────┘  └─────────────┘    │
  │                                                         │
  │  ┌─────────────┐                                       │
  │  │  Foundry     │  17 个 Beta Headers                   │
  │  │  (Azure)     │  11 个模型系列 × 4 Provider 映射       │
  │  │             │  流式 + 非流式 + Stall 检测             │
  │  │ API Key     │  OAuth 刷新 + 重试 + 529 Fallback      │
  │  │ Azure AD    │                                       │
  │  └─────────────┘                                       │
  └─────────────────────────────────────────────────────────┘
```

### 5. MCP 服务

```
  ┌─────────────────────────────────────────────┐
  │         src/services/mcp/ (24 文件)          │
  │                                             │
  │  6 种 Transport:                            │
  │    stdio │ sse │ streamable-http │          │
  │    docker │ npx │ uv-pipe                   │
  │                                             │
  │  功能: 工具调用 │ 资源读取 │ OAuth 认证      │
  │        Elicitation │ 连接管理                │
  └─────────────────────────────────────────────┘
```

### 6. 权限与安全

```
  ┌─────────────────────────────────────────────────────────────┐
  │                权限系统 (~12,500 行)                          │
  │                                                             │
  │  模式: plan │ auto │ manual │ bypassPermissions             │
  │                                                             │
  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
  │  │ YOLO 分类器    │  │ 路径验证       │  │ 规则匹配      │  │
  │  │               │  │               │  │               │  │
  │  │ auto_mode     │  │ TOCTOU 防护   │  │ allow/deny    │  │
  │  │ system prompt │  │ 符号链接检测   │  │ 正则匹配      │  │
  │  │ (从v2.1.88    │  │ Windows 特殊  │  │ 工具级粒度    │  │
  │  │  bundle提取)  │  │ 路径处理      │  │               │  │
  │  └───────────────┘  └───────────────┘  └───────────────┘  │
  └─────────────────────────────────────────────────────────────┘
```

### 7. UI 渲染层

```
  ┌─────────────────────────────────────────────────┐
  │            Ink (React 终端渲染框架)               │
  │                                                 │
  │  REPL.tsx (5000行) ── 主交互屏幕                 │
  │  LogoV2/Clawd.tsx  ── 🐼 像素熊猫 Logo           │
  │  PromptInput/      ── 用户输入 + 补全             │
  │  permissions/       ── 权限审批 UI                │
  │  Messages.tsx       ── 对话消息渲染               │
  │  keybindings/       ── 快捷键框架                 │
  └─────────────────────────────────────────────────┘
```

### 8. Feature Flag 系统

```
  源码: import { feature } from 'bun:bundle'
                    │
         ┌──────────┴──────────┐
         │                     │
    Dev 模式               Build 模式
    (scripts/dev.sh)       (build.ts BunPlugin)
         │                     │
    bun --feature=FLAG     onLoad: feature('X')
    原生运行时控制          → 正则替换为 true/false
         │                     │
    92 个 flag              ENABLED_FLAGS Set
    全部启用                保留 DCE 能力
```

---

## 能力清单

> ✅ = 已实现  ⚠️ = 条件启用  🔓 = 原被禁用，现已解锁

### 核心系统

| 能力 | 状态 | 说明 |
|------|------|------|
| REPL 交互界面（Ink 终端渲染） | ✅ | 5000+ 行，完整交互，Panda Code 品牌 |
| API 通信 — 四个 Provider | ✅ | Anthropic / Bedrock / Vertex / Foundry |
| 流式对话与工具调用循环 | ✅ | 1700+ 行，含自动压缩、token 追踪 |
| 会话引擎 | ✅ | 1300+ 行，管理对话状态与归因 |
| 权限系统（plan/auto/manual） | ✅ | 12500+ 行，含 YOLO 分类器 |
| YOLO Auto-Mode 分类器 | 🔓 | 从 v2.1.88 bundle 提取的完整 prompt |
| 后台会话 (BG_SESSIONS) | 🔓 | --bg / ps / logs / attach / kill |
| Coordinator 多 Agent 编排 | 🔓 | Worker 管理、Task Workflow |
| KAIROS 自主 Agent 模式 | 🔓 | 长期运行、Brief、Push 通知 |
| Proactive 主动模式 | 🔓 | SleepTool 定时唤醒 |
| Bridge 远程控制 | 🔓 | 外部客户端远程操控 |
| Daemon 守护进程 | 🔓 | 后台常驻、worker/supervisor |
| SSH Remote | 🔓 | `claude ssh <host>` 远程执行 |
| Voice Mode | 🔓 | 语音输入输出 |
| Workflow Scripts | 🔓 | 用户自定义自动化 |

### 工具 — 全部 59 个

| 类别 | 数量 | 工具列表 |
|------|------|----------|
| 始终可用 | 20 | Bash, FileRead/Edit/Write, Notebook, Agent, WebFetch/Search, SendMessage, Skill, PlanMode, Todo, Brief, TaskOutput/Stop, McpResource, SyntheticOutput |
| 条件启用 | 13 | Glob, Grep, TaskCRUD, Worktree, TeamCreate/Delete, ToolSearch, PowerShell, LSP, Config |
| 🔓 解锁 | 26 | Sleep, Monitor, SendUserFile, PushNotification, SubscribePR, Overflow, CtxInspect, TerminalCapture, WebBrowser, Snip, ListPeers, Workflow, CronCreate/Delete/List, RemoteTrigger, ... |

### 斜杠命令 — 全部 82 个

| 类别 | 数量 | 说明 |
|------|------|------|
| 核心命令 | 67 | /compact, /resume, /doctor, /diff, /config, /model, /export, /mcp, ... |
| 🔓 解锁命令 | 15 | /proactive, /brief, /voice, /bridge, /force-snip, /workflows, /ultraplan, /torch, /peers, /fork, /buddy, /assistant, /subscribe-pr, /web-setup, /remote-control-server |

### Bundled Skills — 全部 9 个

| Skill | 状态 | 说明 |
|-------|------|------|
| loop | ✅ | 循环执行 |
| simplify | ✅ | 代码简化 |
| update-config | ✅ | 配置管理 |
| keybindings-help | ✅ | 快捷键帮助 |
| schedule | ✅ | 远程 agent 调度 |
| claude-api | ✅ | Claude API 参考（26 个 .md 文档） |
| 🔓 dream | 🔓 | 记忆整理（KAIROS） |
| 🔓 hunter | 🔓 | Bug 猎手（REVIEW_ARTIFACT） |
| 🔓 runSkillGenerator | 🔓 | Skill 生成器 |

---

## Feature Flags

全部 92 个 flag 已启用。按功能分组：

| 分组 | Flags | 说明 |
|------|-------|------|
| 自主 Agent | KAIROS, KAIROS_BRIEF, KAIROS_CHANNELS, KAIROS_DREAM, KAIROS_GITHUB_WEBHOOKS, KAIROS_PUSH_NOTIFICATION, PROACTIVE, COORDINATOR_MODE, BUDDY, FORK_SUBAGENT | 长期运行、主动模式、多 Agent |
| 远程/分布式 | BRIDGE_MODE, DAEMON, BG_SESSIONS, SSH_REMOTE, DIRECT_CONNECT, CCR_REMOTE_SETUP, CCR_MIRROR, CCR_AUTO_CONNECT | 远程控制、后台会话、SSH |
| 增强工具 | CHICAGO_MCP, WEB_BROWSER_TOOL, VOICE_MODE, WORKFLOW_SCRIPTS, TERMINAL_PANEL, MONITOR_TOOL, CONTEXT_COLLAPSE, HISTORY_SNIP | 计算机操控、浏览器、语音 |
| 对话管理 | ULTRAPLAN, ULTRATHINK, AGENT_MEMORY_SNAPSHOT, REACTIVE_COMPACT, COMPACTION_REMINDERS, TOKEN_BUDGET | 超级计划、压缩优化 |
| 安全/分类 | TRANSCRIPT_CLASSIFIER, BASH_CLASSIFIER, POWERSHELL_AUTO_MODE, VERIFICATION_AGENT, ANTI_DISTILLATION_CC | Auto 模式、命令分类器 |
| 基础设施 | HARD_FAIL, EXTRACT_MEMORIES, FILE_PERSISTENCE, TREE_SITTER_BASH, MCP_SKILLS, AGENT_TRIGGERS, UPLOAD_USER_SETTINGS, ... | 内部增强、遥测、实验 |

---

## 项目目录结构

```
panda-code/
├── src/
│   ├── entrypoints/
│   │   ├── cli.tsx              # 入口（bun:bundle feature + MACRO polyfill）
│   │   └── sdk/                 # SDK 子模块
│   ├── main.tsx                 # Commander.js CLI 定义
│   ├── query.ts                 # 核心 API 查询循环 (1700行)
│   ├── QueryEngine.ts           # 会话编排器 (1300行)
│   ├── Tool.ts                  # 工具接口定义
│   ├── tools.ts                 # 工具注册表 (92 flag 全开)
│   ├── tools/                   # 59 个工具实现
│   │   ├── BashTool/            # Shell 执行 + 沙箱
│   │   ├── AgentTool/           # 子代理 + 内置 Agent 定义
│   │   ├── SleepTool/           # 🔓 定时睡眠
│   │   ├── SnipTool/            # 🔓 对话裁剪
│   │   ├── WorkflowTool/        # 🔓 工作流
│   │   └── ...
│   ├── commands/                # 斜杠命令 (82个)
│   │   ├── proactive.ts         # 🔓 主动模式
│   │   ├── assistant/           # 🔓 Assistant 模式
│   │   ├── bridge/              # 🔓 远程桥接
│   │   └── ...
│   ├── skills/bundled/          # 9 个内置 Skill
│   │   ├── dream.ts             # 🔓 记忆整理
│   │   ├── hunter.ts            # 🔓 Bug 猎手
│   │   └── claude-api/          # API 参考文档 (26个 .md)
│   ├── screens/REPL.tsx         # REPL 主屏幕 (5000行)
│   ├── components/LogoV2/       # 🐼 Panda Code Logo
│   ├── services/
│   │   ├── api/                 # API 客户端 (4 Provider)
│   │   ├── mcp/                 # MCP 服务 (24文件)
│   │   ├── oauth/               # OAuth 2.0 + PKCE
│   │   ├── compact/             # 对话压缩
│   │   └── ...
│   ├── utils/permissions/       # 权限系统 + YOLO 分类器
│   │   └── yolo-classifier-prompts/  # 🔓 从 v2.1.88 提取
│   ├── coordinator/             # 🔓 多 Agent 协调器
│   ├── proactive/               # 🔓 主动模式 Hook
│   └── state/                   # 状态管理 (Zustand)
├── packages/                    # Monorepo 内部包 (9个)
├── scripts/
│   └── dev.sh                   # Dev 模式启动 (92 flag)
├── build.ts                     # 构建脚本 (BunPlugin flag 内联)
├── monitor/                     # 审计材料 (20份报告)
├── package-v2.1.88/             # v2.1.88 参考 (bundle + source map 提取)
└── package.json                 # Bun workspaces monorepo
```

---

## 新增能力

基于设计方案 `design-panda-assistant.md` 实施的全部新功能：

### 多 Provider 接入（7 家）

```bash
panda auth login
# 交互式选择：Anthropic / DeepSeek / Kimi / Qwen / MiniMax / GLM / 火山引擎
# 输入 API Key 即完成，无需手动配环境变量
```

| Provider | Base URL | 默认模型 |
|----------|----------|----------|
| Anthropic | 原版 OAuth | claude-sonnet-4-6 |
| DeepSeek | api.deepseek.com/anthropic | deepseek-chat |
| Kimi | api.moonshot.ai/anthropic | kimi-k2.5 |
| Qwen | dashscope.aliyuncs.com/apps/anthropic | qwen-plus |
| MiniMax | api.minimax.io/anthropic | MiniMax-M2.5 |
| GLM | open.bigmodel.cn/api/anthropic | glm-4 |
| Volcano | ark.cn-beijing.volces.com/api/coding | ark-code-latest |

### 私人助理命令

| 命令 | 功能 |
|------|------|
| `/persona work\|companion\|study\|creative\|butler` | 切换助理人格（工作/陪伴/学习/创意/管家） |
| `/night-mode on\|off` | 夜间自主模式开关 |
| `/language en\|zh` | 切换显示语言 |
| `/privacy` | 查看隐私保护状态 |
| `/morning` | 晨间工作简报 |
| `/organize [path]` | 文件整理建议 |
| `/health-check` | 代码健康诊断 |
| `/remind <msg> <time>` | 设置提醒 |
| `/cleanup [path]` | 清理临时文件 |
| `/files` | 列出当前上下文文件 |
| `/tag` | 会话标签管理 |
| `/version` | 版本详细信息 |

### 隐私零泄露

非 Anthropic 渠道使用时，零数据离开本地：
- 1104 个遥测调用点全部拦截
- GrowthBook / Datadog / BigQuery / 1P 事件全部禁用
- User-Agent 规范化（参考 cc-gateway 标准）
- 敏感 headers（session-id 等）自动移除
- 独立存储空间 `~/.pandacc/`（不与原版 claude 混用）

### 命令中文化

所有 80+ 命令描述支持双语显示（English · 中文）。

---

## 快速开始

### 方式一：从源码安装（推荐）

```bash
# 1. 安装 Bun（必须最新版）
curl -fsSL https://bun.sh/install | bash
bun upgrade

# 2. 克隆代码
git clone <仓库地址> cc-panda
cd cc-panda

# 3. 安装依赖 + 构建 + 注册全局命令
bun install && bun run build && bun link

# 4. 任意目录使用
panda
```

### 方式二：npm 本地安装（无需发布）

```bash
# 在项目目录中
bun install && bun run build
npm install -g .

# 或打包成 .tgz 拷贝到其他机器
npm pack
# 在目标机器上
npm install -g panda-code-1.0.2.tgz
```

### 方式三：发布到 npm Registry

```bash
# 发布到 npmjs.com
npm publish

# 发布到私有源
npm publish --registry https://your-registry.example.com

# 任意机器安装
npm install -g panda-code
```

### 首次使用

```bash
# 配置 API 访问（交互式选择 Provider）
panda auth login

# 查看认证状态
panda auth status
```

### 后续更新

```bash
cd cc-panda && git pull && bun install && bun run build && bun link
```

### 运行方式

```bash
# 全局命令（推荐）
panda

# 直接运行构建产物
bun dist/cli.js
node dist/cli.js

# 验证版本（看到 888 说明就对了）
panda --version    # 2.1.888 (Panda Code)
```

### Pipe 模式

```bash
echo "say hello" | panda -p
```

构建采用 code splitting 多文件打包（`build.ts`），产物输出到 `dist/`（~528 个 JS chunk）。bun 和 node 都可以运行。

---

## 构建说明

### Dev 模式

`scripts/dev.sh` 使用 Bun 原生 `--feature=FLAG` 参数逐个启用 92 个 flag：

```bash
bun --feature=BG_SESSIONS --feature=KAIROS --feature=PROACTIVE ... run src/entrypoints/cli.tsx
```

### Build 模式

`build.ts` 使用 BunPlugin 在构建时内联替换 `feature('FLAG')` 调用：

1. `onLoad` 钩子拦截所有 .ts/.tsx 文件
2. 移除 `import { feature } from 'bun:bundle'`
3. 将 `feature('X')` 替换为 `true`（在 ENABLED_FLAGS 中）或 `false`
4. Bun 的 DCE 自动移除 `false` 分支代码
5. 后处理：替换 `import.meta.require` 为 Node.js 兼容版本

构建产物采用 code splitting，输出约 529 个 JS chunk 文件到 `dist/`。

---

## 内部包

| 包 | 状态 | 说明 |
|------|------|------|
| `color-diff-napi` | ✅ 完整 | 纯 TypeScript 实现（语法高亮 diff） |
| `audio-capture-napi` | ✅ 替代 | SoX/arecord 替代方案 |
| `image-processor-napi` | ✅ 替代 | sharp + osascript 剪贴板 |
| `modifiers-napi` | ✅ 替代 | Bun FFI + Carbon |
| `url-handler-napi` | ⚠️ stub | null fallback |
| `@ant/computer-use-mcp` | ⚠️ stub | 类型安全 stub + sentinel apps |
| `@ant/computer-use-input` | ✅ 替代 | macOS AppleScript/JXA |
| `@ant/computer-use-swift` | ✅ 替代 | macOS JXA/screencapture |
| `@ant/claude-for-chrome-mcp` | ⚠️ stub | Chrome MCP 扩展 |

---

## 隐私保护

非 Anthropic 渠道（DeepSeek/Kimi/Qwen 等）使用时，自动启用零泄露模式：

| 防护层 | 内容 | 状态 |
|--------|------|------|
| 遥测拦截 | 1104 个 logEvent 调用点全部拦截 | 自动 |
| 分析禁用 | GrowthBook / Datadog / BigQuery / 1P 事件 | 自动 |
| UA 规范化 | 精简为 `PandaCode/{version}`，不泄露设备信息 | 自动 |
| Header 清理 | 移除 x-app、session-id 等跟踪头 | 自动 |
| 独立存储 | `~/.pandacc/` 独立空间，不与原版 claude 混用 | 自动 |
| 首次迁移 | 自动从 `~/.claude/` 复制配置（不删除原目录） | 一次性 |

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

## 开发规范

- **运行时**：Bun（非 Node.js）。所有 import、构建、执行使用 Bun API
- **模块**：ESM (`"type": "module"`)，TSX with `react-jsx` transform
- **Monorepo**：Bun workspaces，内部包通过 `workspace:*` 解析
- **Feature Flags**：新增 flag 需同时更新 `build.ts` ENABLED_FLAGS
- **品牌**：所有用户可见文本使用 "Panda Code"，不使用 "Claude Code"
- **存储**：所有配置路径使用 `~/.pandacc/`，不使用 `~/.claude/`
- **React Compiler**：组件含反编译 `_c()` 记忆化模板，正常现象

---

## 审计与验证

项目经过系统性审计和 VA (Verification Agent) 对抗性验证：

| 报告 | 内容 | 判定 |
|------|------|------|
| `monitor/design-panda-assistant.md` | **深度设计方案 v2.1** | 指导文件 |
| `monitor/VA-final-v2.md` | **最终全量验证（Phase 1-6）** | **24/24 通过** |
| `monitor/15-func-summary.md` | 功能评分卡 + 实施记录 | 9.78/10 |
| `monitor/00-summary.md` | 安全审计汇总 | 参考 |

---

## 许可证

本项目基于 CCB (Claude Code Best) 逆向还原，仅供学习研究用途。Claude Code 的所有权利归 [Anthropic](https://www.anthropic.com/) 所有。
