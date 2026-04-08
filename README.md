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
**版本**：v2.3.0（基线 Claude Code v2.1.92）
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

| Provider  | Base URL                                   | 默认模型              | 控制台                                                                                       |
| --------- | ------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------- |
| Anthropic | 原版 OAuth                                   | claude-sonnet-4-6 | [console.anthropic.com](https://console.anthropic.com)                                    |
| DeepSeek  | api.deepseek.com/anthropic                 | deepseek-chat     | [platform.deepseek.com](https://platform.deepseek.com/api_keys)                           |
| Kimi Code | api.kimi.com/coding                        | kimi-k2.5         | [kimi.com/code](https://www.kimi.com/code)                                                |
| Qwen      | dashscope-intl.aliyuncs.com/apps/anthropic | qwen-plus         | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com/)                     |
| MiniMax   | api.minimax.io/anthropic                   | MiniMax-M2.5      | [platform.minimax.io](https://platform.minimax.io)                                        |
| GLM       | open.bigmodel.cn/api/anthropic             | glm-4             | [open.bigmodel.cn](https://open.bigmodel.cn/)                                             |
| Volcano   | ark.cn-beijing.volces.com/api/coding       | ark-code-latest   | [console.volcengine.com](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey) |

---

## 命令参考

> 完整手册请查看 [CC命令使用手册.md](CC命令使用手册.md)

### 核心命令速查

| 分类        | 命令                                                            | 说明                   |
| --------- | ------------------------------------------------------------- | -------------------- |
| **基础**    | `/help` `/clear` `/exit` `/status` `/version`                 | 帮助、清空、退出、状态、版本       |
| **对话**    | `/compact` `/resume` `/branch` `/rewind` `/copy` `/export`    | 压缩、恢复、分支、回退、复制、导出    |
| **代码**    | `/commit` `/diff` `/review` `/security-review` `/pr-comments` | 提交、差异、审查、安全审查、PR评论   |
| **模型**    | `/model` `/effort` `/fast` `/advisor` `/torch`                | 切换模型、推理深度、高速、顾问、推理可见 |
| **配置**    | `/config` `/theme` `/color` `/vim` `/language` `/persona`     | 设置、主题、颜色、Vim、语言、人格   |
| **工具**    | `/permissions` `/mcp` `/hooks` `/tasks` `/plugin`             | 权限、MCP、钩子、任务、插件      |
| **Agent** | `/plan` `/fork` `/agents` `/workflows` `/skills`              | 计划、派生、Agent、工作流、技能   |
| **查询**    | `/context` `/files` `/doctor` `/cost` `/stats` `/memory`      | 上下文、文件、诊断、费用、统计、记忆   |

### 🆕 超级助手命令

> 超级助手 = 数字生命体。以下命令是超级助手的交互入口。

| 命令              | 说明                                                  |
| --------------- | --------------------------------------------------- |
| `/dream`        | 四阶段记忆整合（Orient→Gather→Consolidate→Prune），支持 cron 定时 |
| `/assistant`    | 启用 KAIROS 助手模式 — 激活主动引擎 + 定时任务                      |
| `/proactive`    | 切换主动自主模式 — 含 dream/briefing/health 三个内置任务           |
| `/night-mode`   | 夜间自主模式（22:00-06:00）— 顺序执行 + 错误隔离                    |
| `/buddy`        | 编程伙伴 — 可交互的熊猫伙伴                                     |
| `/brief`        | 简报模式 — AI 只输出简洁摘要                                   |
| `/persona auto` | 自动人格切换 — 根据时间/情绪/活动自动调整                             |
| `/write`        | 写作助理 — 生成大纲、编译文稿                                    |
| `/capture`      | 快速捕获 — 将想法保存到工作记忆                                   |
| `/learn`        | 学习助理 — 闪卡生成、间隔重复、学习路径规划                            |

### Ant-Only 高级命令（已全部启用）

| 命令                | 说明                   |
| ----------------- | -------------------- |
| `/ultraplan`      | CCR 远程深度规划（10-30 分钟） |
| `/ultrareview`    | 深度代码审查 + bug 验证      |
| `/force-snip`     | 强制截断对话历史             |
| `/init-verifiers` | 初始化验证器脚本             |
| `/subscribe-pr`   | 订阅 PR 更新通知           |
| `/heapdump`       | JS 堆转储               |

### 🆕 Multi-Model Agent Routing

不同 agent 使用不同模型，按能力路由：

| 命令                               | 说明                                 |
| -------------------------------- | ---------------------------------- |
| `/routing status`                | 查看路由配置和已注册模型                       |
| `/routing preset <name>`         | 切换预设（quality/cost-saving/balanced） |
| `/routing test <agent> <prompt>` | 干跑路由决策测试                           |

内建 agent 模板（`.pandacc/agents/`）：

- `architecture-reviewer` — 强推理模型（model: best-reasoning → Opus）
- `code-generator` — 编码优化（model: balanced → Sonnet）
- `triage` — 快速分类（model: fast → Haiku）

**完整功能**（26/26 任务实装）：

- 5 Phase: Capability Registry → Routing Core → Format Alignment → UX & Presets → Production Hardening
- 8 级优先级模型选择：显式 pin > 工具覆盖 > 能力要求 > 预设 > 偏好 > 别名 > 任务 > 默认
- Fallback Chain：primary 模型不可用时自动降级
- Capability 预检：Agent spawn 前验证模型能力
- 路由决策历史：`/routing status` 显示最近 5 条决策
- Format Alignment：OpenAI↔Anthropic 格式转换层（预留）

**配置示例**（`settings.json`）：

```json
{
  "enableModelRouting": true,
  "routingPresets": {
    "cost-saving": {
      "agentModelMap": { "Explore": "haiku", "Plan": "sonnet" }
    }
  }
}
```

**环境变量启用**：`PANDA_MODEL_ROUTING=1 panda`

> 详见 [CC命令使用手册.md](CC命令使用手册.md) Multi-Model Routing 章节

### 快捷键

| 快捷键           | 功能         | 快捷键      | 功能      |
| ------------- | ---------- | -------- | ------- |
| `Shift+Tab`   | 切换权限模式     | `Ctrl+D` | 退出      |
| `Meta+P`      | 切换模型       | `Ctrl+T` | 任务面板    |
| `Ctrl+G`      | $EDITOR 编辑 | `Ctrl+O` | 详细输出    |
| `\` + `Enter` | 换行         | `!`      | Bash 模式 |
| `@`           | 文件补全       | `&`      | 后台运行    |

### 环境变量

| 变量                               | 说明                                 |
| -------------------------------- | ---------------------------------- |
| `PANDA_SECURITY_RESEARCH=1`      | 禁用安全限制（安全研究用）                      |
| `PANDA_HIDE_CONTEXT_WARNING=1`   | 隐藏上下文满警告                           |
| `PANDA_NO_AUTO_COLLAPSE=1`       | 禁止 Read/Grep 自动折叠                  |
| `PANDA_SHOW_DEVBAR=1`            | 非 dev 构建显示 DevBar                  |
| `CLAUDE_CODE_COORDINATOR_MODE=1` | 启用 Coordinator 多 Agent             |
| `PANDA_MODEL_ROUTING=1`          | 启用 Multi-Model Agent Routing       |
| `ENABLE_TOOL_SEARCH=true`        | ToolSearch（默认已启用）                  |
| `DEBUG_CACHE=1`                  | 输出第三方 API Cache Token 原始数据到 stderr |
| `PANDA_DEBUG=1`                  | 输出任务分类、进化写回等调试日志                   |

---

## 🆕 治理能力

Panda Code 内置了 11 项治理能力。

### 自动生效（零配置）

| 能力                   | 触发时机                                                                                      | 用户感知                                   |
| -------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------- |
| **危险命令拦截**           | AI 执行 `rm -rf /`、`git reset --hard`、`git push --force`、`chmod -R 777`、fork bomb 等 7 种危险模式 | 自动拦截，弹出 `⚠️ Dangerous: ...` 确认提示       |
| **Completion Guard** | AI 纯文本声称"任务已完成"但无工具调用或测试证据                                                                | 自动要求补充验证证据（最多 2 次）                     |
| **Finding Closure**  | AI 声称完成但回复中含未关闭的 TODO/FIXME/HACK                                                          | 自动要求先关闭所有 findings                     |
| **Anti-Slop 审查**     | AI 回复过度 emoji（≥8种）、重复段落、或超长空洞文本                                                           | 自动要求精简，给出代码/路径                         |
| **子 Agent 上下文注入**    | 每次 Agent 工具 spawn 子 agent                                                                 | 子 agent 自动获得 CLAUDE.md 核心规范（前 2500 字符） |
| **能力优先调度**           | 未指定 `subagent_type` 的 Agent 调用                                                            | 搜索类→Explore agent，规划类→Plan agent       |
| **任务分类引擎**           | 每轮对话首条用户消息                                                                                | 后台分类（`PANDA_DEBUG=1` 可见），为后续扩展预留       |
| **进化写回**             | turnCount > 3 且有成功工具调用                                                                    | 调试日志记录工具名列表，预留经验沉淀入口                   |

### 手动使用：Patterns/Scars 经验记忆

在项目 memory 目录下创建 `.md` 文件，下次对话自动加载到上下文：

```bash
# 记录成功模式
cat > ~/.claude/projects/<项目slug>/memory/patterns/api-error-handling.md << 'EOF'
---
name: API 错误处理模式
description: 第三方 API 返回 404 时优先检查请求 body 兼容性
type: pattern
---
第三方 API 返回 404 时，优先检查请求 body 中是否包含
Anthropic 专有参数（如 metadata），而不是先怀疑认证问题。
EOF

# 记录失败教训
cat > ~/.claude/projects/<项目slug>/memory/scars/blind-debugging.md << 'EOF'
---
name: 盲目追症状的教训
description: 排查问题应先审查 git diff 而不是加调试日志
type: scar
---
遇到"之前能用现在不能用"的问题，第一步 git diff 审查近期变更。
EOF
```

### 治理能力执行流

```
用户输入 → 任务分类 → AI 响应
                        │
                        ├─ BashTool → 危险命令拦截 → ⚠️ 确认
                        ├─ AgentTool → 能力优先调度 → 自动选型
                        │              └─ 子Agent上下文注入 → CLAUDE.md
                        └─ 纯文本回复
                              ├─ Completion Guard → 无证据？→ 要求补充
                              │   └─ Finding Closure → 有TODO？→ 要求关闭
                              ├─ Anti-Slop → 废话？→ 要求精简
                              └─ 进化写回 → 日志记录
```

---

## 🆕 Cache Token 显示

支持所有主流第三方 API 的 prompt cache 命中显示：

| Provider                | Cache 字段                              | 自动/手动 |
| ----------------------- | ------------------------------------- | ----- |
| Anthropic               | `cache_read_input_tokens`             | 自动    |
| OpenAI / Mistral / 火山引擎 | `prompt_tokens_details.cached_tokens` | 自动    |
| DeepSeek                | `prompt_cache_hit_tokens`             | 自动    |
| Groq                    | `input_tokens_details.cached_tokens`  | 自动    |
| Kimi / GLM / MiniMax    | `usage.cached_tokens`                 | 自动    |
| OpenRouter              | 透传 + `cache_write_tokens`             | 自动    |

查看 cache 命中：`/stats` 命令中 `Cache: N` 字段。调试：`DEBUG_CACHE=1 panda`。

---

## 隐私保护

所有渠道均可启用隐私增强模式（配置 `privacyEnhanced: true` 或使用 `/privacy` 命令）。非 Anthropic 渠道自动启用。

| 防护层                | 内容                                                                  | 状态  |
| ------------------ | ------------------------------------------------------------------- | --- |
| 遥测拦截               | 1104 个 logEvent 调用点全部拦截                                             | 自动  |
| API Body 脱敏        | `metadata` 中 device_id/session_id/account_uuid 替换为合规格式固定值；第三方完全不发送  | 自动  |
| HTTP Header 脱敏     | X-Claude-Code-Session-Id 替换为固定 UUID；第三方不发送 x-app/session-id         | 自动  |
| Datadog 禁用         | `trackDatadogEvent` + `initializeDatadog` 完全禁用                      | 自动  |
| BigQuery 禁用        | `doExport` 完全禁用，不向 `api.anthropic.com/api/claude_code/metrics` 发送数据 | 自动  |
| 1P Event Logger 脱敏 | userId/email/org 替换为固定脱敏值（`cc4all@gmail.com`）                       | 自动  |
| GrowthBook 脱敏      | 用户属性 id/deviceID/sessionId 替换为固定值，移除 org/account/email              | 自动  |
| UA 规范化             | 精简为 `claude-code/{version}`，不泄露设备信息                                 | 自动  |
| 独立存储               | `~/.pandacc/` 独立空间，不与原版 claude 混用                                   | 自动  |
| OAuth              | 隐私模式下不额外请求 Profile                                                  | 自动  |

查看当前隐私状态：`/privacy`

---

## 跨平台支持

| 平台      | 状态   | 说明                                  |
| ------- | ---- | ----------------------------------- |
| macOS   | 完整支持 | Keychain 存储、osascript 集成            |
| Windows | 完整支持 | PowerShell 自动检测、git-bash Shell、路径转换 |
| Linux   | 完整支持 | 标准 POSIX 环境                         |
| WSL     | 完整支持 | 自动检测 WSL 环境                         |

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

## 🆕 超级助手 — 数字生命体

> "越用越了解你的贴身助理。白天人来接管，夜间 AI 自主整理所有数据资产。"
> 
> **注**：README 中"超级助手命令"章节（`/dream`, `/assistant` 等）是超级助手的交互入口，
> 原 v2.1.92 "私人助手"已整合为统一体系。

### 五层记忆系统

| 层        | 功能          | 自动维护        | 存储             |
| -------- | ----------- | ----------- | -------------- |
| **工作记忆** | 当前会话上下文     | ✅           | Context Window |
| **情景记忆** | 每日会话摘要      | ✅ DeepDream | episodes/      |
| **语义记忆** | 用户画像 + 知识图谱 | ✅ 自动进化      | semantic/      |
| **程序记忆** | 行为模式 + 工作流  | ✅ 行为学习      | procedural/    |
| **前瞻记忆** | 预测 + 建议     | ✅ 感知引擎      | working/       |

### 主动交互能力（双层架构）

超级助手的主动交互分为**主动层**（后台定时推送）和**被动层**（对话回合后检查）：

#### 主动层 — 时间驱动，后台推送

通过 `/proactive` 或 `/assistant` 激活后，后台 Smart Cron 定时扫描并推送 macOS 系统通知：

| 任务               | 频率       | 推送方式        | 说明                                      |
| ---------------- | -------- | ----------- | --------------------------------------- |
| **日历事件提醒**       | 每 30 分钟  | macOS 通知    | 扫描 macOS 日历，会议前 30/10 分钟弹窗通知，同时写入工作记忆  |
| **Git 未提交提醒**    | 每 1 小时   | macOS 通知    | 检测到未提交文件且距上次 commit > 3 小时，推送提醒          |
| **画像过期提醒**       | 每日 09:00 | macOS 通知    | 用户画像 > 14 天未更新，提醒运行 `/dream`             |
| **晨间简报**         | 每日 07:00 | 文件生成        | 自动生成日程 + Git 状态 + 待办 + 工作模式分析           |
| **DeepDream**    | 每晚 22:00 | 文件生成        | 四阶段记忆整合（收割→理解→整合→前瞻）                    |
| **记忆衰减**         | 每晚 22:30 | 静默执行        | Ebbinghaus 遗忘曲线 R=e^(-t/S)，清理低强度记忆      |
| **文件分类**         | 每 4 小时   | 静默执行        | 扫描 Downloads/Desktop，9 种文件类型分类（dry-run） |
| **代码健康**         | 每晚 23:00 | 工作记忆        | 运行构建检查，失败时写入工作记忆供下次对话可见                 |
| **工作记忆清理**       | 每日 06:00 | 静默执行        | 清理 7 天前的临时工作记忆文件                         |
| **记忆索引重建**       | 每日 03:00 | 静默执行        | FTS5 索引预热 + 完整性校验                        |
| **周报汇总**         | 每周一 08:00 | 文件生成       | 汇总本周 DeepDream 报告                        |

**使用示例**：

```bash
# 激活主动模式（会话内）
/proactive

# 或激活完整助手模式（含主动+KAIROS）
/assistant

# 夜间自主模式（22:00-06:00 定时执行所有任务）
/night-mode
```

#### 被动层 — 对话驱动，回合后检查

每轮对话结束后自动检查 5 种条件，在对话内注入建议：

- **上下文压力**：消息 > 50 条 → 建议 `/compact`
- **重复模式**：连续 3 次相似操作 → 建议创建工作流 `/skillify`
- **未提交提醒**：2 小时未 commit + 有未提交文件
- **画像过期**：`profile.md` > 7 天未更新
- **晨间简报**：7:00-9:00 有未读简报

#### 基础设施

- **用户画像自动进化**：从对话中提取语言偏好、技术栈、工作模式、沟通风格，写入 `semantic/profile.md`
- **记忆搜索**：SQLite FTS5 全文索引，支持中英文混合查询
- **隐私守护**：`~/.pandacc/config/privacy.json` 排除列表，所有连接器自动过滤

### 数据连接器

| 连接器   | 命令 / 触发方式             | 数据源                          | 隐私过滤   |
| ----- | ---------------------- | ---------------------------- | ------ |
| 浏览器历史 | `panda history digest` | Chrome SQLite（复制后读取）         | ✅ 域名排除 |
| 日历    | `panda calendar today` | macOS Calendar (AppleScript) | ✅      |
| 笔记    | `panda notes search`   | Apple Notes SQLite           | ✅      |
| 剪贴板   | 自动捕获                   | pbpaste + 敏感过滤               | ✅ 密钥过滤 |

### 非编码场景

```bash
# 写作助理（/write skill）
/write outline "AI个人助理的未来"
/write compile ~/manuscript/

# 知识管理（/capture skill + PARA 方法论）
/capture "想到一个架构思路..."

# 学习助理（/learn skill + FSRS 间隔重复）
/learn from paper.pdf
/learn review
/learn plan "学习 Rust"
```

### 感知引擎

| 维度       | 数据源                  | 输出                              |
| -------- | -------------------- | ------------------------------- |
| **时间感知** | 系统时钟                 | 工作时段识别、夜间模式切换                   |
| **Git 感知** | git status/log       | 分支状态、未提交变更、远程偏离 → 主动推送提醒       |
| **项目感知** | grep TODO/FIXME      | 待办计数趋势                          |
| **日历感知** | macOS Calendar       | 即将到来的会议 → 提前 30/10 分钟 macOS 通知 |
| **行为学习** | 会话日志                 | 活跃时段、常用工具、项目切换 → `habits.md`    |
| **情绪感知** | 消息语气分析               | 动态调整响应风格                        |

**三渠道通知**：
- `system`：macOS 通知中心弹窗（日历/Git/画像提醒）
- `inline`：对话内注入系统消息（上下文压力/重复模式）
- `statusLine`：终端状态栏标记

### 隐私铁律

```
1. 全本地采集和索引 — 数据永不离开设备（除用户主动对话）
2. 敏感数据自动过滤 — 密码/token/API key/证书 不入索引
3. privacy.json 排除列表 — 用户自定义不采集的路径/域名/应用
4. 随时可删 — panda memory forget "关于X的一切"
5. 数据可导出 — 全部 Markdown + SQLite，Git 可追踪
```

---

## 🆕 contextCollapse — 零 API 调用的上下文折叠

长对话场景下，消息膨胀逼近上下文窗口上限。contextCollapse 在 autocompact **之前**运行，通过纯本地操作增量折叠旧消息，零额外 token 消耗。

| 指标     | 传统 autocompact | contextCollapse  |
| ------ | -------------- | ---------------- |
| 触发阈值   | ~80% 上下文窗口     | **60%** 上下文窗口    |
| API 调用 | 1 次（摘要生成）      | **0 次**          |
| 信息损失   | 全量压缩，不可逆       | 按 span 折叠，可恢复    |
| 粒度     | 全部消息           | 按 4-15 条消息的 span |

### 启用方式

```bash
# 环境变量
PANDA_CONTEXT_COLLAPSE=1 panda

# 或 settings.json（feature flag CONTEXT_COLLAPSE 已启用）
```

### 工作原理

1. **每次查询前**自动检查 token 使用量
2. 超过 60% 阈值时扫描**最旧的消息**，识别可安全折叠的 span
3. 生成**本地模板化摘要**（保留工具名+参数+结果骨架），压缩比 20:1~40:1
4. 用摘要占位符替代原始消息，原始消息归档在内存中
5. API 413 时触发**紧急排水**，放宽折叠条件

### 折叠策略

**安全折叠（低风险）**：已完成的工具调用对、短对话、距当前 ≥10 轮的历史

**不折叠（高风险）**：最近 5 轮、系统消息、文件编辑操（Edit/Write）、未完成工具调用

### 查看状态

```
/context    — 显示折叠统计（collapsedSpans, stagedSpans）
```

### 与 autocompact 的关系

```
query() 执行顺序：
  ① contextCollapse.applyCollapsesIfNeeded()   ← 先折叠
  ② autocompact()                               ← 只在折叠不够时触发
  ③ API 调用
  ④ 若 413 → contextCollapse.recoverFromOverflow() → 重试
```

---

## 许可证

本项目基于 CCB (Claude Code Best) 逆向还原，仅供学习研究用途。
