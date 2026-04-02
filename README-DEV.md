# Panda Code — 开发者文档

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
  A bamboo-eating panda. My code? 100% organic AI-grown
```

---

## 目录

- [项目概述](#项目概述)
- [本地开发环境搭建](#本地开发环境搭建)
- [构建系统详解](#构建系统详解)
- [项目架构](#项目架构)
- [Feature Flag 系统](#feature-flag-系统)
- [Provider 系统](#provider-系统)
- [隐私保护机制](#隐私保护机制)
- [私人助理系统](#私人助理系统)
- [ant-only 功能解锁](#ant-only-功能解锁)
- [国际化 (i18n)](#国际化-i18n)
- [npm 发布](#npm-发布)
- [目录结构](#目录结构)
- [已知问题和 TODO](#已知问题和-todo)
- [审计报告索引](#审计报告索引)

---

## 项目概述

| 属性 | 值 |
|------|-----|
| **项目代号** | Panda Code |
| **当前版本** | 2.1.95 |
| **基线** | CCB (Claude Code Best) fork，基于 Anthropic Claude Code CLI v2.1.88 逆向还原 |
| **包名** | `@lc2panda/panda-code` |
| **技术栈** | Bun + TypeScript + React/Ink + Commander.js |
| **运行时** | Bun >= 1.2.0 |
| **仓库** | https://github.com/lc2panda/panda-code |

### 核心改造

Panda Code 在 CCB 的逆向还原基础上，进行了以下深度改造：

1. **92 Feature Flags 全开** -- 所有 Anthropic 内部 feature flag 全部启用，包括 KAIROS 自主模式、BRIDGE 远程控制、DAEMON 守护进程、BUDDY 配对编程等
2. **93 处 ant-only 解锁** -- 通过 build.ts 的 `"external" -> "ant"` 替换，解锁所有仅限 Anthropic 内部员工使用的功能分支
3. **7 Provider 接入** -- 支持 Anthropic Direct、AWS Bedrock、Google Vertex、Azure Foundry、DeepSeek、Kimi、OpenRouter 等第三方 Provider
4. **隐私零泄露** -- `isPrivacyEnhancedMode()` 机制覆盖全部 10 个遥测通道，对标 cc-gateway 的数据规范化方案
5. **私人助理系统** -- 7 个子系统（身份/感知/记忆/主动/技能/夜间/协作），从"编程助手"升级为"全能私人助理"
6. **品牌全局替换** -- 所有用户可见字符串使用 "Panda Code"，像素风格熊猫 Logo
7. **命令中文化** -- 92 个文件的命令描述采用双语格式 "English . 中文"

### 逆向推导内容

| 类别 | 数量 | 示例 |
|------|------|------|
| 缺失工具 | 14 个 | SleepTool, MonitorTool, SnipTool, WebBrowserTool, TungstenTool 等 |
| 缺失命令 | 11 个 | proactive, assistant, bridge, buddy, torch 等 |
| 缺失 Skills | 3 个 | dream, hunter, runSkillGenerator |
| YOLO 分类器 | 3 个 .txt | 从 v2.1.88 bundle 完整提取 auto-mode 系统提示 |
| Claude API 文档 | 26 个 .md | 技能级 API 文档 |
| 内部包 | 9 个 | color-diff-napi, audio-capture-napi, @ant/computer-use-mcp 等 |

---

## 本地开发环境搭建

### 前置条件

- **Bun** >= 1.2.0 （`curl -fsSL https://bun.sh/install | bash`）
- **Git**
- macOS / Linux（Windows 未测试）

### 快速开始

```bash
# 1. 克隆代码
git clone https://github.com/lc2panda/panda-code.git
cd panda-code

# 2. 安装依赖
bun install

# 3. 构建（输出到 dist/，约 529 个 JS 文件）
bun run build

# 4. 运行
bun dist/cli.js

# 5. 注册全局命令（可选）
bun link
# 之后可以直接运行: panda
```

### 开发模式

```bash
# Dev 模式：构建 + 运行
bun run dev

# Pipe 模式（非交互）
echo "say hello" | bun dist/cli.js -p
```

### 第三方 Provider 配置

在 `~/.pandacc.json` 中配置（cli.tsx 启动时自动加载）：

```json
{
  "thirdPartyProvider": {
    "baseURL": "https://api.deepseek.com/v1",
    "apiKey": "sk-xxxx",
    "model": "deepseek-chat"
  }
}
```

加载链路：`cli.tsx` 启动 -> 读取 `~/.pandacc.json` -> 设置 `ANTHROPIC_BASE_URL` / `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_MODEL` 环境变量 -> `providers.ts` 的 `isThirdPartyProvider()` 检测到非 Anthropic 域名 -> 自动启用隐私增强模式。

---

## 构建系统详解

构建脚本位于 `/build.ts`，完整流程分 4 步：

### Step 1: BunPlugin featureFlagPlugin

自定义 Bun 构建插件，处理所有 `.tsx?` 文件（排除 `node_modules`）：

**功能 A: feature() 内联替换**

```
import { feature } from 'bun:bundle'    -- 整行删除
feature('KAIROS')                        -- 替换为 true（如果在 ENABLED_FLAGS 中）
feature('UDS_INBOX')                     -- 替换为 false（不在 ENABLED_FLAGS 中）
```

正则：`/feature\(\s*['"]([^'"]+)['"]\s*,?\s*\)/g`

**功能 B: "external" -> "ant" 替换**

```
("external" as string)    -- 替换为 ("ant" as string)
```

这一行使得所有 `process.env.USER_TYPE === 'ant'` 的条件分支对 Panda Code 用户生效，解锁 93 处 ant-only 功能。

正则：`/\("external"\s+as\s+string\)/g`

### Step 2: Bun.build() 带 code splitting

```typescript
await Bun.build({
    entrypoints: ["src/entrypoints/cli.tsx"],
    outdir: "dist",
    target: "bun",
    splitting: true,
    plugins: [featureFlagPlugin],
})
```

- `splitting: true` -- 开启代码分割，输出约 529 个 JS 文件
- `target: "bun"` -- 使用 Bun 运行时 API（如 `import.meta.require`）

### Step 3: import.meta.require 兼容替换

Bun 的 bundler 会生成 `var __require = import.meta.require;`，这在 Node.js 环境下不可用。后处理步骤将其替换为兼容写法：

```javascript
// 替换前
var __require = import.meta.require;

// 替换后
var __require = typeof import.meta.require === "function"
    ? import.meta.require
    : (await import("module")).createRequire(import.meta.url);
```

### Step 4: Shebang 注入

如果 `dist/cli.js` 开头没有 shebang，注入 `#!/usr/bin/env node`，使 `npx` / `npm install -g` 可以直接运行。

### ENABLED_FLAGS 完整列表（92 个）

```
ABLATION_BASELINE          AGENT_MEMORY_SNAPSHOT      AGENT_TRIGGERS
AGENT_TRIGGERS_REMOTE      ALLOW_TEST_VERSIONS        ANTI_DISTILLATION_CC
AUTO_THEME                 AWAY_SUMMARY               BASH_CLASSIFIER
BG_SESSIONS                BREAK_CACHE_COMMAND         BRIDGE_MODE
BUDDY                      BUILDING_CLAUDE_APPS        BUILTIN_EXPLORE_PLAN_AGENTS
BYOC_ENVIRONMENT_RUNNER    CACHED_MICROCOMPACT         CCR_AUTO_CONNECT
CCR_MIRROR                 CCR_REMOTE_SETUP            CHICAGO_MCP
COMMIT_ATTRIBUTION         COMPACTION_REMINDERS        CONNECTOR_TEXT
CONTEXT_COLLAPSE           COORDINATOR_MODE            COWORKER_TYPE_TELEMETRY
DAEMON                     DIRECT_CONNECT              DOWNLOAD_USER_SETTINGS
DUMP_SYSTEM_PROMPT         ENHANCED_TELEMETRY_BETA     EXPERIMENTAL_SKILL_SEARCH
EXTRACT_MEMORIES           FILE_PERSISTENCE            FORK_SUBAGENT
HARD_FAIL                  HISTORY_PICKER              HISTORY_SNIP
HOOK_PROMPTS               IS_LIBC_GLIBC              IS_LIBC_MUSL
KAIROS                     KAIROS_BRIEF               KAIROS_CHANNELS
KAIROS_DREAM               KAIROS_GITHUB_WEBHOOKS     KAIROS_PUSH_NOTIFICATION
LODESTONE                  MCP_RICH_OUTPUT             MCP_SKILLS
MEMORY_SHAPE_TELEMETRY     MESSAGE_ACTIONS             MONITOR_TOOL
NATIVE_CLIENT_ATTESTATION  NATIVE_CLIPBOARD_IMAGE      NEW_INIT
OVERFLOW_TEST_TOOL         PERFETTO_TRACING            POWERSHELL_AUTO_MODE
PROACTIVE                  PROMPT_CACHE_BREAK_DETECTION QUICK_SEARCH
REACTIVE_COMPACT           REVIEW_ARTIFACT             RUN_SKILL_GENERATOR
SELF_HOSTED_RUNNER         SHOT_STATS                  SKILL_IMPROVEMENT
SKIP_DETECTION_WHEN_AUTOUPDATES_DISABLED               SLOW_OPERATION_LOGGING
SSH_REMOTE                 STREAMLINED_OUTPUT          TEAMMEM
TEMPLATES                  TERMINAL_PANEL              TOKEN_BUDGET
TORCH                      TRANSCRIPT_CLASSIFIER       TREE_SITTER_BASH
TREE_SITTER_BASH_SHADOW    ULTRAPLAN                   ULTRATHINK
UNATTENDED_RETRY           UPLOAD_USER_SETTINGS        VERIFICATION_AGENT
VOICE_MODE                 WEB_BROWSER_TOOL            WORKFLOW_SCRIPTS
```

### 被注释禁用的 Flag

| Flag | 原因 |
|------|------|
| `UDS_INBOX` | 绑定 Unix domain socket，在 pipe 模式下阻塞进程 |

### Dev 模式 vs Build 模式

| 维度 | Dev 模式 | Build 模式 |
|------|---------|-----------|
| feature() 来源 | Bun 原生 `--feature=FLAG` 参数 | BunPlugin 内联替换为 `true`/`false` |
| bun:bundle 导入 | Bun 运行时解析 | 被插件移除 |
| USER_TYPE | 取决于环境 | 强制 `"ant"`（通过 external->ant 替换） |
| 输出 | 无（直接运行源文件） | dist/ 目录，约 529 个 JS 文件 |
| 适用场景 | 本地调试 | 发布/部署 |

### 如何新增 Flag

1. 在 `build.ts` 的 `ENABLED_FLAGS` Set 中添加新 flag 名称
2. 在 `scripts/dev.sh` 中添加 `--feature=FLAG` 参数
3. 在源码中使用 `feature('NEW_FLAG')` 进行门控

---

## 项目架构

### 入口链

```
cli.tsx                          -- 真正的 entrypoint
  |
  |-- 快速路径: --version, --dump-system-prompt, --daemon-worker, --bg, etc.
  |-- .pandacc.json 加载: thirdPartyProvider 配置注入环境变量
  |
  +-> main.tsx                   -- Commander.js CLI 定义
        |-- 参数解析
        |-- 服务初始化 (auth, analytics, policy)
        |
        +-> REPL.tsx             -- 交互式 REPL 屏幕 (React/Ink)
              |-- 用户输入
              |-- 消息渲染
              |-- 工具权限提示
              |-- 快捷键处理
```

### 核心模块清单

| 模块 | 文件 | 职责 |
|------|------|------|
| **入口引导** | `src/entrypoints/cli.tsx` | MACRO polyfill、feature flag、Provider 配置、快速路径分发 |
| **CLI 定义** | `src/main.tsx` | Commander.js 命令/选项注册、服务初始化、REPL/Pipe 模式分发 |
| **初始化** | `src/entrypoints/init.ts` | 一次性初始化（遥测、配置、信任对话） |
| **查询主循环** | `src/query.ts` | 流式 API 调用、工具调用处理、对话 turn 循环 |
| **查询引擎** | `src/QueryEngine.ts` | 对话状态编排、压缩决策、归因追踪、文件历史快照 |
| **REPL 屏幕** | `src/screens/REPL.tsx` | React/Ink 交互界面、消息列表、输入框、权限弹窗 |
| **API 客户端** | `src/services/api/claude.ts` | 请求构建（system prompt, tools, betas）、SDK 流式调用、事件处理 |
| **工具注册** | `src/tools.ts` | 工具列表组装、feature flag 条件加载 |
| **工具接口** | `src/Tool.ts` | Tool 类型定义、findToolByName、toolMatchesName |
| **状态管理** | `src/state/AppState.tsx` | 中心状态 Context（消息、工具、权限、MCP） |
| **状态存储** | `src/state/store.ts` | Zustand 风格 store |
| **上下文构建** | `src/context.ts` | 系统/用户上下文组装（git 状态、日期、CLAUDE.md、记忆文件） |
| **Provider 选择** | `src/utils/model/providers.ts` | API Provider 类型判断、第三方检测 |
| **隐私模式** | `src/utils/privacyMode.ts` | isPrivacyEnhancedMode() 统一入口 |
| **国际化** | `src/utils/i18n.ts` | t() 翻译函数、getLocalizedDescription() |

### 模块间依赖关系

```
cli.tsx
  |-> main.tsx
  |     |-> REPL.tsx
  |     |     |-> QueryEngine.ts
  |     |     |     |-> query.ts
  |     |     |     |     |-> claude.ts (API 客户端)
  |     |     |     |     |-> tools.ts -> Tool.ts -> src/tools/*/
  |     |     |     |     |-> context.ts -> claudemd.ts, privacyMode.ts
  |     |     |     |
  |     |     |     |-> AppState.tsx -> store.ts
  |     |     |
  |     |     |-> components/ (Messages, PromptInput, permissions)
  |     |     |-> hooks/ (useProactive, useVirtualScroll)
  |     |
  |     |-> services/ (analytics, oauth, mcp, policyLimits)
  |     |-> assistant/ (persona, sense, memory)
  |     |-> proactive/ (engine, nightMode, tasks)
  |
  |-> providers.ts (isThirdPartyProvider)
  |-> privacyMode.ts (isPrivacyEnhancedMode)
```

---

## Feature Flag 系统

### 机制

`feature('FLAG_NAME')` 调用使用 Bun 的编译时宏系统 `bun:bundle`。

- **Dev 模式**: `scripts/dev.sh` 通过 `bun --feature=FLAG` 传递参数，Bun 运行时直接求值
- **Build 模式**: `build.ts` 的 `featureFlagPlugin` 在编译时内联替换为 `true`/`false` 字面量，配合 Bun 的 DCE (Dead Code Elimination) 移除未启用分支

### 92 个 Flag 分类

**自主 Agent 系列 (KAIROS)**

| Flag | 功能 |
|------|------|
| `KAIROS` | KAIROS 自主模式主开关 |
| `KAIROS_BRIEF` | KAIROS 简报功能 |
| `KAIROS_CHANNELS` | KAIROS 通道系统 |
| `KAIROS_DREAM` | KAIROS 梦境（记忆整理） |
| `KAIROS_GITHUB_WEBHOOKS` | KAIROS GitHub Webhooks 监听 |
| `KAIROS_PUSH_NOTIFICATION` | KAIROS 推送通知 |
| `PROACTIVE` | 主动行为引擎 |
| `COORDINATOR_MODE` | 多 Agent 编排 |
| `BUDDY` | 配对编程模式 |
| `FORK_SUBAGENT` | 子 Agent 分叉 |

**远程协作系列**

| Flag | 功能 |
|------|------|
| `BRIDGE_MODE` | 远程控制（remote-control/rc/bridge/sync） |
| `SSH_REMOTE` | SSH 远程执行 |
| `DAEMON` | 守护进程（supervisor + workers） |
| `BG_SESSIONS` | 后台会话（ps/logs/attach/kill/--bg） |
| `CCR_AUTO_CONNECT` | Cloud Code Remote 自动连接 |
| `CCR_MIRROR` | Cloud Code Remote 镜像 |
| `CCR_REMOTE_SETUP` | Cloud Code Remote 远程配置 |
| `SELF_HOSTED_RUNNER` | 自托管 Runner |
| `BYOC_ENVIRONMENT_RUNNER` | BYOC 环境 Runner |
| `DIRECT_CONNECT` | 直接连接 |

**工具与能力系列**

| Flag | 功能 |
|------|------|
| `MONITOR_TOOL` | 监控工具 |
| `WEB_BROWSER_TOOL` | 浏览器工具 |
| `OVERFLOW_TEST_TOOL` | 溢出测试工具 |
| `CHICAGO_MCP` | Computer Use MCP |
| `VOICE_MODE` | 语音模式 |
| `TORCH` | Torch 分析工具 |
| `TERMINAL_PANEL` | 终端面板 |
| `ULTRAPLAN` | Ultra 计划模式 |
| `ULTRATHINK` | Ultra 思考模式 |

**记忆与上下文系列**

| Flag | 功能 |
|------|------|
| `AGENT_MEMORY_SNAPSHOT` | Agent 记忆快照 |
| `EXTRACT_MEMORIES` | 自动提取记忆 |
| `MEMORY_SHAPE_TELEMETRY` | 记忆形态遥测 |
| `CACHED_MICROCOMPACT` | 缓存微压缩 |
| `REACTIVE_COMPACT` | 反应式压缩 |
| `COMPACTION_REMINDERS` | 压缩提醒 |
| `CONTEXT_COLLAPSE` | 上下文折叠 |
| `HISTORY_PICKER` | 历史选择器 |
| `HISTORY_SNIP` | 历史剪裁 |
| `LODESTONE` | 磁石（上下文锚点） |

**遥测与诊断系列**

| Flag | 功能 |
|------|------|
| `ENHANCED_TELEMETRY_BETA` | 增强遥测 Beta |
| `COWORKER_TYPE_TELEMETRY` | 协作者类型遥测 |
| `PERFETTO_TRACING` | Perfetto 追踪 |
| `SHOT_STATS` | 单轮统计 |
| `SLOW_OPERATION_LOGGING` | 慢操作日志 |
| `TRANSCRIPT_CLASSIFIER` | 对话记录分类器 |
| `TOKEN_BUDGET` | Token 预算管理 |

**其他**

| Flag | 功能 |
|------|------|
| `ABLATION_BASELINE` | 消融基线实验 |
| `AGENT_TRIGGERS` / `AGENT_TRIGGERS_REMOTE` | Agent 触发器 |
| `ALLOW_TEST_VERSIONS` | 允许测试版本 |
| `ANTI_DISTILLATION_CC` | 反蒸馏保护 |
| `AUTO_THEME` | 自动主题 |
| `AWAY_SUMMARY` | 离开摘要 |
| `BASH_CLASSIFIER` | Bash 命令分类器 |
| `BREAK_CACHE_COMMAND` | 缓存破坏命令 |
| `BUILDING_CLAUDE_APPS` | 构建 Claude 应用 |
| `BUILTIN_EXPLORE_PLAN_AGENTS` | 内置探索/计划 Agent |
| `COMMIT_ATTRIBUTION` | 提交归因 |
| `CONNECTOR_TEXT` | 连接器文本 |
| `DOWNLOAD_USER_SETTINGS` / `UPLOAD_USER_SETTINGS` | 用户设置同步 |
| `DUMP_SYSTEM_PROMPT` | 导出系统提示 |
| `EXPERIMENTAL_SKILL_SEARCH` | 实验性技能搜索 |
| `FILE_PERSISTENCE` | 文件持久化 |
| `HARD_FAIL` | 硬失败模式 |
| `HOOK_PROMPTS` | Hook 提示 |
| `IS_LIBC_GLIBC` / `IS_LIBC_MUSL` | libc 检测 |
| `MCP_RICH_OUTPUT` | MCP 富输出 |
| `MCP_SKILLS` | MCP 技能 |
| `MESSAGE_ACTIONS` | 消息操作 |
| `NATIVE_CLIENT_ATTESTATION` | 原生客户端认证 |
| `NATIVE_CLIPBOARD_IMAGE` | 原生剪贴板图片 |
| `NEW_INIT` | 新版初始化 |
| `POWERSHELL_AUTO_MODE` | PowerShell 自动模式 |
| `PROMPT_CACHE_BREAK_DETECTION` | Prompt 缓存中断检测 |
| `QUICK_SEARCH` | 快速搜索 |
| `REVIEW_ARTIFACT` | 审查工件 |
| `RUN_SKILL_GENERATOR` | 运行技能生成器 |
| `SKILL_IMPROVEMENT` | 技能改进 |
| `SKIP_DETECTION_WHEN_AUTOUPDATES_DISABLED` | 禁用自动更新时跳过检测 |
| `STREAMLINED_OUTPUT` | 精简输出 |
| `TEAMMEM` | 团队记忆 |
| `TEMPLATES` | 模板系统（new/list/reply） |
| `TREE_SITTER_BASH` / `TREE_SITTER_BASH_SHADOW` | Tree-sitter Bash 解析 |
| `UNATTENDED_RETRY` | 无人值守重试 |
| `VERIFICATION_AGENT` | 验证 Agent |
| `WORKFLOW_SCRIPTS` | 工作流脚本 |

---

## Provider 系统

### 概述

Panda Code 支持多种 API Provider，通过环境变量或配置文件切换。

### Provider 类型

在 `src/utils/model/providers.ts` 中定义了 4 种原生 Provider 类型：

```typescript
type APIProvider = 'firstParty' | 'bedrock' | 'vertex' | 'foundry'
```

此外，通过 `ANTHROPIC_BASE_URL` 环境变量可以接入任意第三方 Provider。

### 7 个 Provider 配置

| Provider | 环境变量 / 配置 | Base URL | 典型模型 |
|----------|----------------|----------|---------|
| **Anthropic Direct** | `ANTHROPIC_API_KEY` | `https://api.anthropic.com` | claude-sonnet-4-20250514 |
| **AWS Bedrock** | `CLAUDE_CODE_USE_BEDROCK=1` | AWS SDK 自动 | anthropic.claude-v2 |
| **Google Vertex** | `CLAUDE_CODE_USE_VERTEX=1` | GCP SDK 自动 | claude-sonnet-4@20250514 |
| **Azure Foundry** | `CLAUDE_CODE_USE_FOUNDRY=1` | Azure SDK 自动 | claude-sonnet-4 |
| **DeepSeek** | `.pandacc.json` thirdPartyProvider | `https://api.deepseek.com/v1` | deepseek-chat |
| **Kimi (Moonshot)** | `.pandacc.json` thirdPartyProvider | `https://api.moonshot.cn/v1` | moonshot-v1-128k |
| **OpenRouter** | `.pandacc.json` thirdPartyProvider | `https://openrouter.ai/api/v1` | 任意支持的模型 |

### isThirdPartyProvider() 机制

位于 `src/utils/model/providers.ts`：

```typescript
export function isThirdPartyProvider(): boolean {
    return !isFirstPartyAnthropicBaseUrl()
}

export function isFirstPartyAnthropicBaseUrl(): boolean {
    const baseUrl = process.env.ANTHROPIC_BASE_URL
    if (!baseUrl) return true  // 默认 API = Anthropic
    const host = new URL(baseUrl).host
    const allowedHosts = ['api.anthropic.com']
    if (process.env.USER_TYPE === 'ant') {
        allowedHosts.push('api-staging.anthropic.com')
    }
    return allowedHosts.includes(host)
}
```

当检测到非 Anthropic 域名时，自动：
- 启用隐私增强模式
- 跳过 Beta headers
- 禁用所有遥测通道
- 跳过 thinking/caching 等 Anthropic 专有 API 特性

### thirdPartyProvider 配置加载链路

```
cli.tsx (启动时)
  |-> 读取 ~/.pandacc.json
  |-> 解析 thirdPartyProvider 字段
  |-> 设置环境变量:
  |     ANTHROPIC_BASE_URL = thirdPartyProvider.baseURL
  |     ANTHROPIC_AUTH_TOKEN = thirdPartyProvider.apiKey
  |     ANTHROPIC_MODEL = thirdPartyProvider.model
  |
  +-> providers.ts (运行时)
        |-> isThirdPartyProvider() 检测 ANTHROPIC_BASE_URL
        |-> isPrivacyEnhancedMode() 联动隐私保护
        |-> claude.ts API 客户端适配（跳过 beta headers 等）
```

### Auth Login 流程

对于 Anthropic 原生 Provider：
1. `src/utils/auth.ts` -- `getClaudeAIOAuthTokens()` 获取 OAuth tokens
2. `src/services/oauth/` -- OAuth 流程实现（token 刷新、profile 获取）
3. Token 存储在 `~/.pandacc/` 目录下

对于第三方 Provider：
1. API Key 直接通过 `.pandacc.json` 配置
2. 无需 OAuth 流程
3. `ANTHROPIC_AUTH_TOKEN` 作为 API Key 传递

---

## 隐私保护机制

### 设计目标

在源码层面实现与 cc-gateway 同等的隐私保护效果，无需外部代理。

### isPrivacyEnhancedMode() 机制

位于 `src/utils/privacyMode.ts`：

```typescript
export function isPrivacyEnhancedMode(): boolean {
    if (isThirdPartyProvider()) return true   // 第三方 Provider 自动启用
    try {
        return getGlobalConfig().privacyEnhanced === true  // 手动启用
    } catch {
        return false
    }
}
```

启用方式：
- **自动**：使用第三方 Provider（isThirdPartyProvider() === true）
- **手动**：在 `~/.claude.json` 中设置 `"privacyEnhanced": true`
- **命令**：REPL 中使用 `/privacy` 命令切换

### 10 个遥测通道及 Guard 位置

| # | 通道 | 文件 | Guard 位置 | 保护方式 |
|---|------|------|-----------|---------|
| 1 | **logEvent()** 统一事件上报 | `src/services/analytics/index.ts` | 入口函数 | isAnalyticsDisabled() |
| 2 | **GrowthBook** 远程特征评估 | `src/services/analytics/growthbook.ts` | isGrowthBookEnabled() | 经由 isAnalyticsDisabled 拦截 |
| 3 | **Datadog** 日志上报 | `src/services/analytics/datadog.ts` | trackDatadogEvent() | isPrivacyEnhancedMode() 直接检查 |
| 4 | **BigQuery Metrics** 指标导出 | `src/utils/telemetry/bigqueryExporter.ts` | doExport() | isPrivacyEnhancedMode() 直接检查 |
| 5 | **1P Event Logging** 第一方事件 | `src/services/analytics/firstPartyEventLogger.ts` | is1PEventLoggingEnabled() | 经由 isAnalyticsDisabled 拦截 |
| 6 | **OpenTelemetry OTLP** | `src/utils/telemetry/instrumentation.ts` | 用户自配 | 尊重用户选择（不阻断） |
| 7 | **System Prompt \<env\>** 设备指纹 | `src/constants/prompts.ts` | computeEnvInfo() | 路径脱敏 + OS 版本泛化 |
| 8 | **HTTP User-Agent** | `src/utils/http.ts` | getUserAgent() | isPrivacyEnhancedMode() 时精简 |
| 9 | **自定义请求头** | `src/utils/http.ts` | 各 HTTP 出口 | x-service-name 移除 |
| 10 | **OAuth Profile 请求** | `src/services/oauth/getOauthProfile.ts` | Profile 获取 | 纯 API Key 模式可跳过 |

### 保护范围

| 场景 | 行为 |
|------|------|
| 第三方 Provider | 自动启用隐私增强：零遥测、精简 UA、脱敏 \<env\> |
| Anthropic + privacyEnhanced | 手动启用：同上 |
| Anthropic 默认 | 标准模式：保持原有遥测（与官方 Claude Code 一致） |

### cc-gateway 对标

| cc-gateway 功能 | Panda Code 实现 | 状态 |
|----------------|----------------|------|
| 遥测数据拦截 | isPrivacyEnhancedMode() 统一 guard | 已实现 |
| User-Agent 脱敏 | getUserAgent() 隐私分支 | 已实现 |
| \<env\> 块脱敏 | computeEnvInfo() 路径和 OS 版本脱敏 | 已实现 |
| OAuth Profile 阻断 | 第三方 Provider 跳过 | 已实现 |
| 磁盘事件清理 | 启动时清理 1p_failed_events.* | 已实现 |
| 网络层代理 | 不需要（源码层拦截更彻底） | N/A |

---

## 私人助理系统

Panda Code 从"编程助手"升级为"全能私人助理"，包含 7 个子系统。

### 子系统总览

| # | 子系统 | 目录 | 当前状态 |
|---|--------|------|---------|
| 1 | 身份系统 (Persona) | `src/assistant/persona.ts`, `personaDetector.ts` | 已实现（5 种内置人格 + /persona 命令） |
| 2 | 感知系统 (Sense) | `src/assistant/sense.ts`, `timeSense.ts`, `activitySense.ts`, `moodSense.ts`, `envSense.ts` | 已实现（4 通道：时间/活动/情绪/环境） |
| 3 | 记忆系统 (Memory) | `src/assistant/memoryManager.ts`, `workingMemory.ts`, `emotionalMemory.ts` | 已实现（4 层：短期/工作/长期/情感） |
| 4 | 主动行为 (Proactive) | `src/proactive/index.ts`, `taskRegistry.ts`, `conditions.ts`, `safeExecutor.ts`, `builtinTasks.ts` | 已实现（TickerEngine + TaskRegistry + 条件引擎） |
| 5 | 技能扩展 (Skills) | `src/skills/bundled/morning.ts`, `organize.ts`, `healthCheck.ts`, `remind.ts` | 已实现（/morning /organize /health-check /remind） |
| 6 | 夜间模式 (Night) | `src/proactive/nightMode.ts` | 已实现（/night-mode enable/disable/status） |
| 7 | 协作记忆 (Collab) | `src/memdir/`, `src/skills/bundled/dream.ts` | 基于现有 Auto Memory + Dream 系统 |

### 1. 身份系统

5 种内置人格：

| 人格 | 触发时段 | 风格 | 关键字触发 |
|------|---------|------|-----------|
| **work** (工作模式) | 09:00-18:00 | 专业简洁、高效严谨 | 默认 |
| **companion** (陪伴模式) | 20:00-23:59 | 温暖耐心、共情倾听 | 聊聊、心情、累了 |
| **learning** (学习模式) | 任意 | 引导启发、系统深入 | 解释、为什么、教我 |
| **assistant** (助理模式) | 任意 | 主动提醒、任务管理 | 提醒、日程、安排 |
| **creative** (创意模式) | 任意 | 发散联想、开放探索 | 用户自定义 |

切换方式：
- `/persona work` -- 手动切换
- 自动切换：PersonaManager.autoDetectPersona(senseContext) 基于时间/目录/关键字

集成点：`src/context.ts` 的 `getUserContext()` 中注入 persona.systemPromptPrefix

### 2. 感知系统

4 个感知通道：

| 通道 | 文件 | 数据来源 |
|------|------|---------|
| 时间感知 | `timeSense.ts` | Date API + Intl.DateTimeFormat |
| 活动感知 | `activitySense.ts` | 复用 `src/utils/git.ts` 的 getIsGit()/getBranch() |
| 情绪感知 | `moodSense.ts` | 对话历史分析（纯本地推断，无外部服务） |
| 环境感知 | `envSense.ts` | os.loadavg(), os.freemem(), pmset（macOS 电量） |

输出统一 SenseContext 结构，供 PersonaManager 和 ProactiveEngine 使用。

### 3. 记忆系统

4 层记忆架构：

| 层级 | 名称 | TTL | 存储位置 | 实现方式 |
|------|------|-----|---------|---------|
| L1 | 短期记忆 | 会话内 | 内存 (AppState.messages) | 已有：`src/state/AppState.tsx` |
| L2 | 工作记忆 | 项目周期 | `{project}/.claude/work/memory.jsonl` | `workingMemory.ts` |
| L3 | 长期记忆 | 永久 | `~/.claude/memories/` | 已有：`src/memdir/` + Dream |
| L4 | 情感记忆 | 永久 | `~/.claude/memories/emotional/` | `emotionalMemory.ts` |

### 4. 主动行为引擎

`src/proactive/index.ts` 从 stub 实装为真实引擎：

- **TickerEngine**: 每 60 秒 tick，检查任务注册表
- **TaskRegistry**: 管理定时/事件/条件触发任务
- **ConditionEngine**: CPU 空闲、用户空闲、时间窗口、电量等条件判断
- **SafeExecutor**: 三级安全控制（SAFE/MODERATE/DANGEROUS）+ dry-run

与 CronTool 集成：复用 `ScheduleCronTool` 的调度基础设施。

### 5. 技能扩展

| 技能 | 命令 | 功能 |
|------|------|------|
| 晨间简报 | `/morning` | 昨日摘要 + 今日待办 + 天气 + 新闻 |
| 文件整理 | `/organize [dir]` | 按类型/日期分类目录文件（默认 ~/Downloads） |
| 健康检查 | `/health-check` | 依赖漏洞 + 类型检查 + TODO/FIXME 扫描 |
| 提醒设置 | `/remind <desc>` | 自然语言时间解析 -> CronCreate |

### 6. 夜间自主模式

通过 `/night-mode enable` 一键启用，调度 4 个夜间任务：

| 时间 | 任务 | 安全级别 |
|------|------|---------|
| 22:00 | 记忆整理 (dream-consolidate) | SAFE (只写 ~/.claude/memories/) |
| 23:00 | 代码健康检查 | SAFE (只读 + 写报告) |
| 00:00 | 文件系统整理 | MODERATE (DRY-RUN，需确认) |
| 06:00 | 晨间简报 | SAFE (只写 .claude/briefings/) |

### 各模块文件路径

```
src/assistant/
  persona.ts              -- Persona 类型定义 + 内置人格
  personaDetector.ts      -- 自动人格检测
  sense.ts                -- SenseEngine + SenseContext 核心
  timeSense.ts            -- 时间感知
  activitySense.ts        -- 活动感知
  moodSense.ts            -- 情绪感知
  envSense.ts             -- 环境感知
  memoryManager.ts        -- 统一记忆管理器
  workingMemory.ts        -- L2 工作记忆
  emotionalMemory.ts      -- L4 情感记忆
  gate.ts                 -- Assistant 特性门控
  index.ts                -- 模块入口
  sessionHistory.ts       -- 会话历史管理
  sessionLoad.ts          -- 会话加载
  sessionSave.ts          -- 会话保存
  sessionDiscovery.ts     -- 会话发现
  AssistantSessionChooser.ts -- 会话选择器

src/proactive/
  index.ts                -- ProactiveEngine 主引擎
  taskRegistry.ts         -- 任务注册表
  conditions.ts           -- 条件判断引擎
  safeExecutor.ts         -- 安全执行器（dry-run + 审批）
  safetyLevel.ts          -- 安全级别定义
  builtinTasks.ts         -- 内置任务模板
  nightMode.ts            -- 夜间自主模式
  useProactive.ts         -- React hook

src/skills/bundled/
  morning.ts              -- /morning 晨间简报
  organize.ts             -- /organize 文件整理
  healthCheck.ts          -- /health-check 健康检查
  remind.ts               -- /remind 提醒设置
  dream.ts                -- /dream 记忆整理
  hunter.ts               -- /hunter Bug 猎手
  cleanup.ts              -- /cleanup 临时文件清理
```

---

## ant-only 功能解锁

### build.ts 的 "external" -> "ant" 替换

在 `build.ts` 的 `featureFlagPlugin` 中：

```typescript
code = code.replace(/\("external"\s+as\s+string\)/g, '("ant" as string)')
```

这使得源码中所有 `process.env.USER_TYPE === ("external" as string)` 的判断在构建后变为 `process.env.USER_TYPE === ("ant" as string)`，而 `BUILD_TARGET` 在 `cli.tsx` 中被设置为 `"external"`，实际运行时 USER_TYPE 会经过下游逻辑后被当作 "ant" 处理。

**影响范围**：93 处条件分支被解锁，涵盖：
- 工具可见性（TungstenTool、MonitorTool 等）
- 命令可用性（debug-tool-call、ant-trace 等）
- API 特性（staging 端点、beta headers）
- 遥测行为（ant 特有的事件上报）

### React Compiler DCE 问题

反编译的 React 组件使用了 React Compiler 运行时的 `_c()` 缓存调用：

```typescript
const $ = _c(N)
if ($[0] !== "symbol") { ... $[0] = "symbol"; $[1] = result; }
return $[1]
```

当 feature flag 被内联为 `true`/`false` 后，Bun 的 DCE 会移除未命中的分支。但如果 `_c()` 分配的槽位数 N 与实际使用的槽位不匹配（因为 DCE 移除了部分赋值），可能导致运行时越界。

**修复方式**：确保 `_c()` 的参数足够大以覆盖所有可能分支。

### 已知的 Stub

| 模块 | 文件 | 状态 |
|------|------|------|
| **TungstenTool** | `src/tools/TungstenTool/TungstenTool.ts` | 空壳 stub（`(() => {}) as unknown as Tool`） |
| **Gates** (Computer Use) | `src/utils/computerUse/gates.ts` | 完整实现但依赖 GrowthBook 远程配置 |
| **@ant/claude-for-chrome-mcp** | `packages/@ant/claude-for-chrome-mcp/` | Stub |
| **url-handler-napi** | `packages/url-handler-napi/` | Stub (null fallback) |

---

## 国际化 (i18n)

### 机制

位于 `src/utils/i18n.ts`：

```typescript
// 翻译函数
export function t(en: string, zh: string): string {
    const lang = getGlobalConfig().language
    return lang === 'zh' ? zh : en
}

// 双语 description 解析
export function getLocalizedDescription(desc: string): string {
    const lang = getLang()
    if (!desc.includes(' · ')) return desc
    const parts = desc.split(' · ')
    return lang === 'zh' ? (parts[1] ?? desc) : (parts[0] ?? desc)
}
```

### 双语 description 格式

所有命令和工具的 description 使用分隔符 ` · ` 连接英文和中文：

```typescript
description: "Run a bash command · 运行 Bash 命令"
```

`getLocalizedDescription()` 根据当前语言设置自动提取对应部分。

### 配置方式

在 `~/.claude.json` 中设置：

```json
{ "language": "zh" }
```

或使用 `/language zh` 命令在 REPL 中切换。

### 当前状态

- Phase 4 已完成：92 个文件的命令描述双语化（149 行变更）
- Phase 7 待实施：`/language zh` 全局中文模式（包括工具输出、错误信息、帮助文本的完整中文化）

---

## npm 发布

### package.json 配置

```json
{
    "name": "@lc2panda/panda-code",
    "version": "2.1.95",
    "main": "dist/cli.js",
    "bin": {
        "panda": "dist/cli.js",
        "claude-js": "dist/cli.js"
    },
    "files": ["dist"],
    "publishConfig": {
        "registry": "https://npm.pkg.github.com"
    },
    "engines": {
        "bun": ">=1.2.0"
    }
}
```

### .npmignore 内容

以下文件/目录在发布时排除（只发布 `dist/`）：

```
src/
packages/
package-v2.1.88/
monitor/
scripts/
docs/
dist-test/
*.ts
!dist/**/*.js
tsconfig.json
biome.json
bunfig.toml
knip.json
mint.json
bun.lock
.githooks/
CLAUDE.md
TODO.md
RECORD.md
SECURITY.md
pandalogo.jpeg
```

### 发布到 GitHub Packages

```bash
# 1. 确保已登录 GitHub Packages
npm login --registry=https://npm.pkg.github.com

# 2. 构建
bun run build

# 3. 发布（prepublishOnly 会自动触发 build）
npm publish
```

### 版本号规范

- 基线版本：2.1.88（对应 Anthropic Claude Code v2.1.88）
- MACRO.VERSION：2.1.90（cli.tsx 中硬编码，显示给用户）
- package.json version：2.1.95（npm 发布版本，递增更新）

---

## 目录结构

```
panda-code/
|
|-- src/                              # 源代码主目录
|   |-- entrypoints/
|   |   |-- cli.tsx                   # 真正的入口：MACRO polyfill、feature flag、Provider 配置
|   |   +-- init.ts                   # 一次性初始化（遥测、配置、信任对话）
|   |
|   |-- main.tsx                      # Commander.js CLI 定义、服务初始化
|   |-- query.ts                      # API 查询主循环（~1700 行）
|   |-- QueryEngine.ts                # 查询引擎编排器（~1300 行）
|   |-- Tool.ts                       # Tool 接口定义
|   |-- tools.ts                      # 工具注册表
|   |-- commands.ts                   # 命令注册表
|   |-- context.ts                    # 系统/用户上下文构建
|   |-- cost-tracker.ts               # Token 费用追踪
|   |
|   |-- screens/
|   |   +-- REPL.tsx                  # 交互式 REPL 屏幕 (React/Ink)
|   |
|   |-- tools/                        # 60 个工具目录
|   |   |-- AgentTool/                # 子 Agent 工具
|   |   |-- BashTool/                 # Bash 命令执行
|   |   |-- FileEditTool/             # 文件编辑
|   |   |-- FileReadTool/             # 文件读取
|   |   |-- FileWriteTool/            # 文件写入
|   |   |-- GlobTool/                 # 文件模式匹配
|   |   |-- GrepTool/                 # 内容搜索
|   |   |-- WebFetchTool/             # Web 页面抓取
|   |   |-- WebSearchTool/            # Web 搜索
|   |   |-- WebBrowserTool/           # 浏览器自动化
|   |   |-- MonitorTool/              # 系统监控
|   |   |-- SleepTool/                # 延时等待
|   |   |-- SnipTool/                 # 历史剪裁
|   |   |-- TungstenTool/             # Tungsten（stub）
|   |   |-- WorkflowTool/             # 工作流执行
|   |   |-- ScheduleCronTool/         # Cron 调度（Create/Delete/List）
|   |   |-- TaskCreateTool/           # 任务创建
|   |   |-- TaskUpdateTool/           # 任务更新
|   |   |-- TeamCreateTool/           # 团队创建
|   |   |-- NotebookEditTool/         # Jupyter Notebook 编辑
|   |   |-- MCPTool/                  # MCP 工具调用
|   |   |-- LSPTool/                  # LSP 协议交互
|   |   |-- ... (共 60 个)
|   |
|   |-- commands/                     # 117 个命令目录
|   |   |-- assistant/                # /assistant 命令
|   |   |-- bridge/                   # /bridge 远程控制
|   |   |-- buddy/                    # /buddy 配对编程
|   |   |-- clear/                    # /clear 清除
|   |   |-- compact/                  # /compact 压缩
|   |   |-- config/                   # /config 配置
|   |   |-- cost/                     # /cost 费用
|   |   |-- debug-tool-call/          # /debug-tool-call
|   |   |-- diff/                     # /diff 差异
|   |   |-- export/                   # /export 导出
|   |   |-- proactive.ts              # /proactive 主动行为
|   |   |-- review/                   # /review 代码审查
|   |   |-- skills/                   # /skills 技能管理
|   |   |-- stats/                    # /stats 统计
|   |   |-- tasks/                    # /tasks 任务管理
|   |   |-- theme/                    # /theme 主题
|   |   |-- ultraplan.tsx             # /ultraplan Ultra 计划
|   |   |-- vim/                      # /vim 模式
|   |   |-- voice/                    # /voice 语音
|   |   |-- workflows/                # /workflows 工作流
|   |   |-- ... (共 117 个)
|   |
|   |-- skills/
|   |   +-- bundled/                  # 内置技能
|   |       |-- dream.ts              # /dream 记忆整理
|   |       |-- hunter.ts             # /hunter Bug 猎手
|   |       |-- morning.ts            # /morning 晨间简报
|   |       |-- organize.ts           # /organize 文件整理
|   |       |-- healthCheck.ts        # /health-check 健康检查
|   |       |-- remind.ts             # /remind 提醒
|   |       |-- cleanup.ts            # /cleanup 清理
|   |       |-- simplify.ts           # /simplify 代码简化
|   |       |-- claude-api/           # Claude API 技能
|   |       |-- verify/               # 验证技能
|   |       +-- ... (共 28 个)
|   |
|   |-- assistant/                    # 私人助理系统
|   |   |-- persona.ts                # 身份/人格系统
|   |   |-- personaDetector.ts        # 自动人格检测
|   |   |-- sense.ts                  # 感知引擎核心
|   |   |-- timeSense.ts              # 时间感知
|   |   |-- activitySense.ts          # 活动感知
|   |   |-- moodSense.ts              # 情绪感知
|   |   |-- envSense.ts               # 环境感知
|   |   |-- memoryManager.ts          # 记忆管理器
|   |   |-- workingMemory.ts          # 工作记忆
|   |   |-- emotionalMemory.ts        # 情感记忆
|   |   +-- sessionHistory.ts         # 会话历史
|   |
|   |-- proactive/                    # 主动行为系统
|   |   |-- index.ts                  # ProactiveEngine 主引擎
|   |   |-- taskRegistry.ts           # 任务注册表
|   |   |-- conditions.ts             # 条件判断
|   |   |-- safeExecutor.ts           # 安全执行器
|   |   |-- nightMode.ts              # 夜间模式
|   |   |-- builtinTasks.ts           # 内置任务
|   |   +-- useProactive.ts           # React hook
|   |
|   |-- services/
|   |   |-- api/
|   |   |   +-- claude.ts             # Claude API 客户端（请求构建、流式调用）
|   |   |-- analytics/
|   |   |   |-- index.ts              # logEvent() 统一入口（672 种事件）
|   |   |   |-- config.ts             # isAnalyticsDisabled()
|   |   |   |-- growthbook.ts         # GrowthBook 远程特征评估
|   |   |   |-- datadog.ts            # Datadog 日志上报
|   |   |   |-- firstPartyEventLogger.ts  # 第一方事件日志
|   |   |   +-- sink.ts               # 事件队列 sink
|   |   |-- mcp/                      # MCP 协议实现（24 文件）
|   |   |-- oauth/                    # OAuth 认证
|   |   +-- policyLimits/             # 策略限制
|   |
|   |-- components/                   # React/Ink 组件
|   |   |-- App.tsx                   # 根组件
|   |   |-- Messages.tsx              # 消息列表
|   |   |-- MessageRow.tsx            # 单条消息
|   |   |-- PromptInput/              # 用户输入
|   |   |-- permissions/              # 权限审批 UI
|   |   |-- LogoV2/Clawd.tsx          # 像素熊猫 Logo
|   |   +-- agents/                   # Agent 相关组件
|   |
|   |-- state/
|   |   |-- AppState.tsx              # 中心状态 Context
|   |   +-- store.ts                  # Zustand 风格 store
|   |
|   |-- utils/
|   |   |-- model/
|   |   |   +-- providers.ts          # Provider 类型判断、第三方检测
|   |   |-- telemetry/
|   |   |   |-- bigqueryExporter.ts   # BigQuery 指标导出
|   |   |   +-- instrumentation.ts    # OpenTelemetry 初始化
|   |   |-- privacyMode.ts            # isPrivacyEnhancedMode()
|   |   |-- i18n.ts                   # 国际化
|   |   |-- config.ts                 # 全局配置
|   |   |-- claudemd.ts              # CLAUDE.md 发现和加载
|   |   |-- auth.ts                   # 认证工具
|   |   |-- http.ts                   # HTTP 工具（User-Agent 等）
|   |   |-- git.ts                    # Git 工具函数
|   |   +-- computerUse/
|   |       +-- gates.ts              # Computer Use 门控
|   |
|   |-- ink/                          # 自定义 Ink 框架（内部 fork）
|   |-- types/
|   |   |-- global.d.ts               # MACRO, BUILD_TARGET 等全局类型
|   |   |-- internal-modules.d.ts     # bun:bundle, bun:ffi 等类型声明
|   |   |-- message.ts                # 消息类型层级
|   |   +-- permissions.ts            # 权限类型
|   |
|   |-- daemon/                       # Daemon 守护进程
|   |-- bridge/                       # Bridge 远程控制
|   |-- coordinator/                  # 多 Agent 协调
|   |-- buddy/                        # 配对编程
|   |-- memdir/                       # Auto Memory 系统
|   |-- hooks/                        # React hooks
|   |-- jobs/                         # 后台任务
|   +-- vim/                          # Vim 模式
|
|-- packages/                         # 内部包（Bun workspaces）
|   |-- color-diff-napi/              # 语法高亮 diff（纯 TS）
|   |-- audio-capture-napi/           # 音频捕获（SoX/arecord）
|   |-- image-processor-napi/         # 图像处理（sharp + osascript）
|   |-- modifiers-napi/               # 修饰键检测（Bun FFI + Carbon）
|   |-- url-handler-napi/             # URL 处理（stub）
|   +-- @ant/
|       |-- computer-use-mcp/         # Computer Use MCP（类型安全 stub）
|       |-- computer-use-input/       # Computer Use 输入（macOS AppleScript/JXA）
|       |-- computer-use-swift/       # Computer Use Swift（macOS JXA/screencapture）
|       +-- claude-for-chrome-mcp/    # Chrome MCP（stub）
|
|-- dist/                             # 构建输出（~529 JS 文件）
|-- monitor/                          # 审计报告和设计文档
|-- scripts/                          # 构建/开发脚本
|-- docs/                             # 文档（Mintlify）
|
|-- build.ts                          # 构建脚本
|-- package.json                      # 包配置
|-- tsconfig.json                     # TypeScript 配置
|-- biome.json                        # Biome lint/format 配置
|-- bunfig.toml                       # Bun 配置
|-- knip.json                         # 未使用代码检测配置
|-- CLAUDE.md                         # 项目指令文件（给 AI 的上下文）
|-- TODO.md                           # 待办清单
+-- .npmignore                        # npm 发布排除列表
```

---

## 已知问题和 TODO

### 待办事项

| 项目 | 优先级 | 说明 |
|------|--------|------|
| Phase 7: `/language zh` 全局中文模式 | 中 | 工具输出、错误信息、帮助文本的完整中文化 |
| `@ant/claude-for-chrome-mcp` 完整实现 | 低 | 当前为 stub |
| TungstenTool 实现 | 低 | 当前为空壳 stub |
| UDS_INBOX 启用 | 低 | 需要解决 pipe 模式下 Unix domain socket 阻塞问题 |
| Gates (Computer Use) | 低 | 依赖 GrowthBook 远程配置，第三方 Provider 下不可用 |
| 终端实际渲染验证 | 中 | 熊猫 Logo 视觉效果 |
| 端到端交互测试 | 高 | REPL 完整对话流程测试 |

### 已知限制

- **tsc 类型错误**：反编译代码存在大量类型错误，不影响运行时，不要尝试修复所有 tsc 错误
- **React Compiler 样板代码**：组件中的 `const $ = _c(N)` 是反编译产物，保持原样
- **GrowthBook 降级**：第三方 Provider 模式下 GrowthBook 被禁用，所有 feature flag 降级为本地缓存值或代码默认值
- **Anthropic 专有 API 特性**：thinking、extended_thinking、caching 等在第三方 Provider 下可能不可用，需要 Provider 侧支持

---

## 审计报告索引

所有审计报告位于 `/monitor/` 目录：

| 文件 | 内容 |
|------|------|
| `00-summary.md` | 审计总览 |
| `01-entry-bootstrap.md` | 入口与引导审计 |
| `02-core-loop.md` | 核心循环审计 |
| `03-api-services.md` | API 服务审计 |
| `04-tool-system.md` | 工具系统审计 |
| `05-permissions-security.md` | 权限与安全审计 |
| `06-ui-state-build.md` | UI、状态、构建审计 |
| `07-diff-core-logic.md` | 差异：核心逻辑 |
| `08-diff-deps-sdk.md` | 差异：依赖和 SDK |
| `09-diff-security.md` | 差异：安全 |
| `10-func-tools.md` | 功能审计：工具 |
| `11-func-commands.md` | 功能审计：命令 |
| `12-func-api-provider.md` | 功能审计：API/Provider |
| `13-func-services-packages.md` | 功能审计：服务/包 |
| `14-func-flags-runtime.md` | 功能审计：Flags/运行时 |
| `15-func-summary.md` | 功能审计总结 |
| `design-panda-assistant.md` | 私人助理深度设计方案 |
| `VA-feature-flags.md` | VA：Feature Flags 验证 |
| `VA-final.md` | VA：最终验证（第一版） |
| `VA-final-v2.md` | VA：最终验证（第二版，24/24 通过） |
| `VA-phase123.md` | VA：Phase 1-3 验证 |
| `VA-phase123-v2.md` | VA：Phase 1-3 验证（v2） |
| `VA-source-alignment.md` | VA：源码对齐验证 |

---

## 开发规范

### 代码风格

- 默认不写注释，只在 WHY 不明显时添加
- 使用 Biome 进行 lint（`bun run lint`）
- 禁用 Biome format（避免反编译代码产生大规模 diff）

### 文件头注释

每个源文件开头应包含三行极简注释：

```typescript
// Input: (吞入什么)
// Output: (喷涌什么)
// Pos: (在系统中的位置)
```

### 提交规范

- 常规修改：描述性 commit message
- 冗余治理：`[DEDUP]` 标签
- 新建文件：`[NEW-FILE:#YYYYMMDD-XX]` 标签

### 测试

```bash
bun test           # 运行单元测试
bun run health     # 代码健康检查
bun run check:unused  # 未使用代码检测（knip）
```
