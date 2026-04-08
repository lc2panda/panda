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

> 完整手册请查看 [命令使用手册](#panda-code--命令使用手册-v251-极限版)

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

> 详见 [命令使用手册](#panda-code--命令使用手册-v251-极限版) Multi-Model Routing 章节

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

通过 `/proactive` 或 `/assistant` 激活后，后台 Smart Cron 定时扫描并推送通知（macOS/Windows/Linux + Channel/Webhook）：

**系统健康**

| 任务             | 频率      | 说明                                |
| -------------- | ------- | --------------------------------- |
| **磁盘空间告警**     | 每 15 分钟 | 可用 < 10% 或 < 20GB → 通知 + 大文件提示   |
| **内存压力告警**     | 每 5 分钟  | 使用 > 85% → 通知 + Top 3 进程         |
| **网络连接异常**     | 每 3 分钟  | 丢包 > 30% 或延迟 > 500ms             |

**开发者**

| 任务             | 频率       | 说明                                |
| -------------- | -------- | --------------------------------- |
| **日历事件提醒**     | 每 30 分钟  | 会议前 30/10 分钟通知 + 写入工作记忆           |
| **Git 未提交**     | 每 1 小时   | > 3 小时有未提交变更                      |
| **Git 分支过期**    | 每周一     | 扫描 > 7 天无提交的本地分支                  |
| **Git 远程变更**    | 每 2 小时   | upstream 有新 commit 未 pull          |
| **依赖安全漏洞**     | 每日 06:00 | npm/pip audit 高危漏洞检测              |
| **CI/CD 失败**    | 每 15 分钟  | gh CLI 检测 GitHub Actions 失败        |

**文件与数据**

| 任务             | 频率      | 说明                                |
| -------------- | ------- | --------------------------------- |
| **下载目录堆积**     | 每 4 小时  | 文件 > 50 或 > 5GB → 通知整理建议          |
| **文件自动分类**     | 每 4 小时  | 9 种文件类型分类（dry-run 预览）             |

**个人生活**

| 任务             | 频率           | 说明                                |
| -------------- | ------------ | --------------------------------- |
| **天气变化提醒**     | 早晚各一次        | wttr.in API，温差 > 10C 或暴雨通知        |
| **节日/纪念日提醒**   | 每日 08:00     | 内置中国+国际节日，支持自定义日期配置               |
| **深夜工作关怀**     | 22-05 时每 30 分 | 检测用户仍活跃 → 推送关怀消息                  |

**自主维护**

| 任务             | 频率       | 说明                                |
| -------------- | -------- | --------------------------------- |
| **画像过期提醒**     | 每日 09:00 | 用户画像 > 14 天未更新                    |
| **晨间简报**       | 每日 07:00 | 自动生成日程 + Git 状态 + 待办 + 工作模式       |
| **DeepDream**  | 每晚 22:00 | 四阶段记忆整合                           |
| **记忆衰减**       | 每晚 22:30 | Ebbinghaus 曲线清理低强度记忆              |
| **代码健康**       | 每晚 23:00 | 构建检查 → 工作记忆                       |
| **周报汇总**       | 每周一 08:00 | 汇总本周 DeepDream 报告                |

> 完整 62 场景设计见 `monitor/proactive-scenarios-design.md`，覆盖系统(8)、通信(8)、文件(9)、开发(10)、知识(6)、效率(7)、安全(7)、个人(7) 八大维度。

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

#### 通知渠道（跨平台）

| 渠道 | 平台 | 配置方式 |
|------|------|--------|
| **系统通知** | macOS: osascript / Windows: BurntToast / Linux: notify-send | 默认开启 |
| **对话内注入** | 全平台 | 被动层自动注入 |
| **Webhook** | 全平台（微信/Telegram/飞书 Bot 等） | 见 [配置参考 → proactive.json](#proactivejson--主动推送配置) |
| **Channel 队列** | 全平台 | `~/.pandacc/channels/outbox/notifications.jsonl` |

#### ⚠️ 隐私敏感场景

涉及邮件、通讯录、浏览历史、即时消息、通知中心、屏幕时间、IM 平台等 **29 个**敏感场景**默认全部关闭**。
需用户在 `~/.pandacc/config/proactive.json` 中显式开启。

> 详见下方 **[配置参考 → proactive.json](#proactivejson--主动推送配置)** 的 `enabledScenarios` 字段。

#### 基础设施

- **用户画像自动进化**：从对话中提取语言偏好、技术栈、工作模式、沟通风格，写入 `semantic/profile.md`
- **记忆搜索**：SQLite FTS5 全文索引，支持中英文混合查询
- **隐私守护**：`~/.pandacc/config/privacy.json` 排除列表，所有连接器自动过滤
- **跨平台抽象层**：`src/proactive/platform.ts` 统一封装磁盘/内存/网络/电池/空闲时间获取
- **可配置阈值**：`~/.pandacc/config/proactive.json` 覆盖所有默认阈值

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

## 配置参考

所有配置文件位于 `~/.pandacc/config/` 目录，JSON 格式，不存在时使用默认值。

### settings.json — 全局设置

```json
// ~/.pandacc/settings.json
{
  "enableModelRouting": true,          // Multi-Model Agent Routing
  "routingPresets": {                   // 路由预设
    "cost-saving": { "agentModelMap": { "Explore": "haiku", "Plan": "sonnet" } }
  },
  "privacyEnhanced": true,             // 隐私增强模式（非 Anthropic 渠道自动启用）
  "autoMemoryEnabled": true             // 自动记忆系统
}
```

### proactive.json — 主动推送配置

```json
// ~/.pandacc/config/proactive.json
{
  // ── 通知渠道 ──
  "webhookUrl": "https://your-bot.example.com/notify",  // Webhook 推送（微信/Telegram Bot 等）

  // ── 阈值自定义（可选，不设则用默认值） ──
  "diskFreePercent": 10,        // 磁盘可用百分比告警线
  "diskFreeGB": 20,             // 磁盘可用 GB 告警线
  "memoryUsedPercent": 85,      // 内存使用百分比告警线
  "batteryLowPercent": 20,      // 低电量告警线
  "networkLatencyMs": 500,      // 网络延迟告警线 (ms)
  "networkLossPercent": 30,     // 网络丢包告警线
  "downloadsFileCount": 50,     // 下载目录文件数告警线
  "desktopFileCount": 30,       // 桌面文件数告警线
  "gitUncommittedHours": 3,     // Git 未提交告警 (小时)
  "gitBranchStaleDays": 7,     // Git 分支过期 (天)
  "noBreakMinutes": 90,         // 持续工作无休息告警 (分钟)
  "lateNightStartHour": 23,    // 深夜关怀起始时
  "lateNightEndHour": 5,       // 深夜关怀结束时
  "sshKeyMaxDays": 365,        // SSH key 轮换告警 (天)
  "sslCertWarnDays": 30,       // SSL 证书到期告警 (天)

  // ── ⚠️ 敏感场景开关（默认全部关闭，必须显式设为 true 才启用） ──
  "enabledScenarios": {
    // 邮件（读取 Mail.app/Outlook 邮件数据库，macOS 需 FDA）
    "email-flagged-reminder": false,   // 星标/待办邮件提醒
    "email-unread-important": false,   // 重要未读邮件
    "email-unreplied": false,          // 48h 未回复邮件
    "email-daily-digest": false,       // 邮件每日摘要
    // 通讯录（读取 Contacts.app，macOS AppleScript 首次弹窗授权）
    "contact-birthday": false,         // 联系人生日提醒
    // 即时消息
    "slack-unread": false,             // Slack 未读（需 SLACK_TOKEN）
    // 浏览器（读取 Chrome SQLite）
    "browser-knowledge-cards": false,  // 高频页面知识卡片
    "bookmark-cleanup": false,         // 书签整理建议
    "reading-list-overflow": false,    // 阅读列表过长
    // 笔记（读取 Apple Notes SQLite，macOS 需 FDA）
    "notes-digest": false,             // 笔记汇总
    // 屏幕时间（macOS 读取 knowledgeC.db 需 FDA）
    "screen-time-stats": false,        // 屏幕时间统计
    // 安全（读取文件内容做扫描）
    "sensitive-file-scan": false,      // 敏感文件暴露扫描
    "duplicate-file-scan": false,      // 重复文件检测
    // 财务
    "cloud-billing-alert": false,      // 云服务账单（需 AWS/GCP 凭据）
    // 系统通知中心（macOS 需 FDA，Windows 无需额外权限）
    "notification-digest": false,      // 通知日频简报
    "notification-urgent": false,      // 紧急通知实时转发
    "notification-stats": false,       // 通知统计趋势
    // IM 平台（需配置 connectors.json）
    "wechat-messages": false,          // 微信消息（企微API或本地DB解密）
    "feishu-messages": false,          // 飞书消息（需 App ID/Secret）
    "dingtalk-messages": false,        // 钉钉消息（需 App Key/Secret）
    // IM 聚合场景
    "im-unread-digest": false,         // 跨平台未读汇总
    "im-daily-brief": false,           // 每日 IM 简报
    "im-calendar-sync": false,         // 跨平台日历冲突
    "im-approval-alert": false,        // 待审批催办
    "im-document-update": false,       // 关注文档更新
    "im-reverse-push": false           // 反向推送到 IM 平台
  }
}
```

> **⚠️ 重要隐私说明**：上述 `enabledScenarios` 中的场景涉及读取邮件、通讯录、浏览历史、即时消息等**高度敏感的个人数据**。这些场景**默认全部关闭**，Panda Code 不会在未经授权的情况下读取任何个人隐私数据。用户必须**手动编辑配置文件并显式设为 `true`** 才会启用对应的数据采集。所有数据仅在用户本机处理，永不上传。

### privacy.json — 隐私排除规则

```json
// ~/.pandacc/config/privacy.json
{
  "excludePaths": ["~/.ssh/**", "~/.gnupg/**", "~/.aws/**", "**/node_modules/**"],
  "excludeApps": ["1Password", "Keychain Access"],
  "excludeBrowserDomains": ["*.bank.*", "*.gov"],
  "sensitivePatterns": ["password", "secret", "api[._-]?key", "token", "sk-"],
  "dataRetentionDays": 90
}
```

### connectors.json — IM 平台连接器

```json
// ~/.pandacc/config/connectors.json
{
  "feishu": {
    "enabled": false,
    "mode": "mcp",                          // mcp（推荐）| api
    "appId": "cli_xxx",                     // 飞书开放平台 App ID
    "appSecret": "keychain:feishu-secret",  // 建议存 Keychain
    "mcpCommand": "npx @anthropic-ai/mcp feishu-mcp"  // MCP 模式启动命令
  },
  "dingtalk": {
    "enabled": false,
    "mode": "mcp",                          // mcp（推荐）| api
    "appKey": "xxx",                        // 钉钉开放平台 App Key
    "appSecret": "keychain:dingtalk-secret",
    "mcpProfiles": "calendar,department,tasks,notice"  // 启用的 MCP 功能模块
  },
  "slack": {
    "enabled": false,
    "token": "xoxb-xxx"                     // Slack Bot Token（或设 SLACK_TOKEN 环境变量）
  },
  "telegram": {
    "enabled": false,
    "botToken": "123456:ABC-DEF..."         // @BotFather 获取的 Bot Token
  },
  "wechat": {
    "enabled": false,
    "mode": "wecom",                        // wecom（企业微信API）| local-db（本地解密）
    // ── 企业微信模式 ──
    "corpId": "ww_xxx",                     // 企业 ID
    "agentId": "1000002",                   // 应用 Agent ID
    "secret": "keychain:wecom-secret",      // 应用 Secret
    // ── 本地 DB 模式（需解密密钥，见"系统授权与数据解密指南"） ──
    "dbKey": ""                             // 32 字节 hex 解密密钥
  },
  "teams": {
    "enabled": false,
    "tenantId": "Azure AD 租户 ID",
    "clientId": "应用客户端 ID",
    "clientSecret": "keychain:teams-secret"
  }
}
```

### dates.json — 自定义纪念日

```json
// ~/.pandacc/config/dates.json
[
  { "name": "结婚纪念日", "date": "06-15" },
  { "name": "妈妈生日", "date": "09-22" }
]
```

### habits.json — 习惯打卡

```json
// ~/.pandacc/config/habits.json
[
  { "name": "运动", "frequency": "daily" },
  { "name": "阅读", "frequency": "daily", "target": "30min" }
]
```

---

## ⚠️ 系统授权与数据解密指南

超级助手的部分高级感知能力需要**系统级权限授权**或**数据解密操作**。以下按平台分别说明。所有操作均为**一次性**，授权后永久生效。

### macOS 系统授权

#### 1. 通知中心感知（Full Disk Access）

通知中心数据库受 macOS TCC 保护（macOS Sequoia 15+ / Tahoe 26+），需要授予终端 **完全磁盘访问权限**。

**授权步骤**：
```
系统设置 → 隐私与安全性 → 完全磁盘访问权限 → 点击 + → 选择你的终端应用
```

- **iTerm2**：添加 `/Applications/iTerm.app`
- **Terminal.app**：添加 `/System/Applications/Utilities/Terminal.app`
- **VS Code 终端**：添加 `/Applications/Visual Studio Code.app`
- **Ghostty**：添加 `/Applications/Ghostty.app`

授权后重启终端生效。影响的场景：`notification-digest`、`notification-urgent`、`notification-stats`。

**验证命令**：
```bash
sqlite3 ~/Library/Group\ Containers/group.com.apple.usernoted/db2/db "SELECT COUNT(*) FROM record"
# 正常返回数字 = 授权成功
# "operation not permitted" = 未授权
```

**通知数据库路径**：
| macOS 版本 | 路径 |
|-----------|------|
| Sequoia (15) ~ Tahoe (26) | `~/Library/Group Containers/group.com.apple.usernoted/db2/db` |
| High Sierra ~ Ventura (10.13~13) | `$(getconf DARWIN_USER_DIR)/com.apple.notificationcenter/db2/db` |

#### 2. 日历/通讯录/邮件读取

首次读取时 macOS 会弹出系统授权对话框，点击"允许"即可：

| 数据 | 触发场景 | 授权方式 |
|------|---------|---------|
| 日历 | `calendar-reminder`、会议提醒 | AppleScript 首次调用时系统弹窗授权 |
| 通讯录 | `contact-birthday` | AppleScript 首次调用时系统弹窗授权 |
| 邮件 | `email-*` 系列场景 | Mail.app SQLite 需 FDA（同上第 1 步） |
| Apple Notes | `notes-digest` | Apple Notes SQLite 需 FDA |

#### 3. 微信本地数据库解密（可选，高级）

微信 4.x 的本地数据库使用 **SQLCipher 4** 加密。如需读取聊天记录、通讯录等数据，需要提取解密密钥。

**⚠️ 风险说明**：此操作涉及从微信进程内存中提取加密密钥，属于灰色地带。仅限用户本机使用，数据不出设备。

**微信 4.x 数据库结构**（macOS 路径）：
```
~/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/{用户名}_{hash}/db_storage/
├── message/          # 聊天记录（message_0~9.db，分片，最大 ~800MB）
├── contact/          # 通讯录（contact.db ~20MB）
├── session/          # 会话列表（session.db ~2MB）
├── sns/              # 朋友圈（sns.db ~11MB）
├── favorite/         # 收藏（favorite.db ~3MB）
├── emoticon/         # 表情（emoticon.db ~1MB）
└── head_image/       # 头像（head_image.db ~25MB）
```

**解密步骤**：

1. **安装解密工具**（二选一）：
   ```bash
   # 方案 A：使用 wechat-db-decrypt-macos（推荐）
   git clone https://github.com/Thearas/wechat-db-decrypt-macos.git
   cd wechat-db-decrypt-macos
   pip3 install -r requirements.txt
   python3 decrypt.py
   
   # 方案 B：使用 wechat-decrypt
   git clone https://github.com/ylytdeng/wechat-decrypt.git
   cd wechat-decrypt
   pip3 install -r requirements.txt
   python3 main.py
   ```

2. **提取密钥**：工具会自动扫描微信进程内存，输出 32 字节十六进制密钥。需要微信保持运行状态。

3. **配置到 Panda Code**：
   ```json
   // ~/.pandacc/config/connectors.json
   {
     "wechat": {
       "enabled": true,
       "mode": "local-db",
       "dbKey": "提取到的32字节hex密钥",
       "dbPath": "自动检测，通常无需手动填写"
     }
   }
   ```

4. **启用场景**：
   ```json
   // ~/.pandacc/config/proactive.json
   { "enabledScenarios": { "wechat-messages": true } }
   ```

5. **验证**：
   ```bash
   panda  # 启动后在对话中询问"检查微信数据连接"
   ```

### Windows 系统授权

#### 1. 通知中心感知

Windows 通知数据库无需特殊权限，位于当前用户目录下可直接读取：

```
%LOCALAPPDATA%\Microsoft\Windows\Notifications\wpndatabase.db
```

**注意**：Windows 的通知在用户清除后**立即从数据库删除**。Panda Code 会每 5 分钟轮询捕获新通知并本地持久化，但无法恢复已清除的历史通知。

#### 2. 邮件/日历/通讯录

Windows 平台通过 **Outlook COM 接口** 或 **Microsoft Graph API** 读取：

| 方案 | 适用场景 | 配置 |
|------|---------|------|
| Outlook COM | 已安装 Outlook 桌面版 | 无需额外配置，首次调用时 Outlook 弹窗授权 |
| Graph API | Microsoft 365 / Teams | 需在 Azure AD 注册应用，配置 connectors.json |

**Graph API 配置**：
```json
// ~/.pandacc/config/connectors.json
{
  "teams": {
    "enabled": true,
    "tenantId": "Azure AD 租户 ID",
    "clientId": "应用客户端 ID",
    "clientSecret": "keychain:teams-secret"
  }
}
```

#### 3. 微信本地数据库解密（Windows）

Windows 微信数据库路径：
```
%APPDATA%\Tencent\WeChat\xwechat_files\{用户名}_{hash}\db_storage\
```

**解密步骤**（与 macOS 类似）：

1. **安装解密工具**：
   ```powershell
   git clone https://github.com/ylytdeng/wechat-decrypt.git
   cd wechat-decrypt
   pip install -r requirements.txt
   python main.py
   ```

2. **提取密钥**：工具扫描微信进程内存提取密钥。

3. **配置**：同 macOS，写入 `connectors.json` 的 `wechat.dbKey` 字段。

### Linux 说明

- **通知**：通过 D-Bus 实时监听（`org.freedesktop.Notifications`），无需特殊权限
- **微信**：Linux 版微信功能有限，建议使用企业微信 API 或 Webhook 方案
- **邮件**：通过 IMAP 协议配置（写入 connectors.json）

### IM 平台连接器授权

| 平台 | 授权方式 | 配置位置 |
|------|---------|---------|
| **飞书/Lark** | 飞书开放平台创建企业应用 → 获取 App ID/Secret | `connectors.json → feishu` |
| **钉钉** | 钉钉开放平台创建应用 → 获取 App Key/Secret | `connectors.json → dingtalk` |
| **Slack** | Slack API 创建 Bot → 获取 Bot Token | `connectors.json → slack` 或 `SLACK_TOKEN` 环境变量 |
| **Telegram** | @BotFather 创建 Bot → 获取 Bot Token | `connectors.json → telegram` |
| **企业微信** | 企业微信管理后台 → 应用管理 → 创建应用 | `connectors.json → wechat` (mode: wecom) |
| **Teams** | Azure AD → 应用注册 → 获取 Tenant/Client ID | `connectors.json → teams` |

所有 Token/Secret 建议使用系统 Keychain 存储（配置值前缀 `keychain:`）：
```json
{ "appSecret": "keychain:feishu-app-secret" }
```

Panda Code 会自动从 macOS Keychain / Windows Credential Manager / Linux Secret Service 读取。


---


> 本手册基于 v2.5.1 实机 PTY 验证，覆盖 **85+ 个命令** + Phase 1-5 全部新增能力 + v2.5 超级助手/IM Connector/主动推送 71 场景。
>
> 最后更新: 2026-04-08 · 显示版本: v2.5.1 · 基线: Claude Code v2.1.92

---

## 命令状态图例

| 标记 | 含义 |
|------|------|
| ✅ | 已验证正常工作 |
| 🆕 | v2.5.1 新增/增强 |
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

### v2.5 新增

| 命令 | 别名 | 一句话说明 | 状态 |
|------|------|-----------|------|
| `/write` | | 写作助理 — 大纲生成/文稿编译 | 🆕✅ |
| `/capture` | | 快速捕获想法到工作目录 | 🆕✅ |
| `/learn` | | 学习助理 — 闪卡/复习/学习路径 | 🆕✅ |

---

## 一、基础控制命令

### `/help`
- **用法**: `/help`
- **说明**: 显示交互式帮助界面，包含所有可用命令和快捷键
- **实测**: ✅ 显示 Panda Code v2.5.1 帮助信息

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
- **实测**: ✅ 输出 `2.5.1 (Panda Code)`

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

## 七、🆕 超级助手系统（v2.5 数字生命体）

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
- **说明**: 切换主动自主模式 — v2.5 扩展为 **71 个主动推送场景**
- **核心内置任务**:
  - `dream-consolidate` — 22:00 自动记忆整合（调用 autoDream）
  - `morning-briefing` — 07:00 设置晨间简报 pending flag
  - `code-health` — 23:00 设置健康检查 pending flag
- **v2.5 场景覆盖**: 系统健康(3) + 开发者(10) + 文件管理(6) + 个人生活(3) + 效率(4) + 高级系统(5) + 扩展(8) + 知识(8) + 生活(8) = **55 个非敏感场景**（默认开启）+ **16 个敏感场景**（需 `proactive.json` 显式开启）
- **技巧**: 配合 `/night-mode` 实现全天候自主工作；敏感场景配置详见本手册"七、主动推送系统"章节

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

### `/write` 🆕
- **用法**: `/write outline <topic>` / `/write compile <dir>`
- **说明**: 写作助理 — 生成大纲或编译 Markdown 写作项目
- **示例**:
  - `/write outline "AI个人助理的未来"` — 生成结构化大纲
  - `/write compile ~/manuscript/` — 编译目录下所有 Markdown 为统一文稿

### `/capture` 🆕
- **用法**: `/capture <text>`
- **说明**: 快速捕获想法到 `working/inbox/` 目录，自动按 PARA 方法论分类
- **示例**: `/capture "想到一个架构思路：用事件驱动替代轮询"`

### `/learn` 🆕
- **用法**: `/learn from <file>` / `/learn review` / `/learn plan <topic>`
- **说明**: 学习助理 — 从文件生成闪卡、间隔重复复习（FSRS 算法）、学习路径规划
- **示例**:
  - `/learn from paper.pdf` — 从 PDF 提取知识点生成闪卡
  - `/learn review` — 开始间隔重复复习
  - `/learn plan "学习 Rust"` — 生成学习路径

### 🆕 主动推送系统（v2.5 新增 — 71 场景）

v2.5 将主动推送从 3 个内置任务扩展为 **71 个场景**，分为非敏感（默认开启）和敏感（默认关闭）两类。

#### 非敏感场景（默认开启）

| 分类 | 场景数 | 示例 |
|------|--------|------|
| 系统健康 | 3 | 磁盘告警、内存压力、网络异常 |
| 开发者 | 10 | Git 分支过期、远程变更、CI 失败、依赖漏洞、TODO 趋势、日历提醒 |
| 文件管理 | 6 | 下载堆积、桌面过多、大文件、重复文件、截屏清理、回收站 |
| 个人生活 | 3 | 天气提醒、节日提醒、深夜关怀 |
| 效率 | 4 | 无休息提醒、周报、水分提醒、专注模式 |
| 高级系统 | 5 | 电池、CPU、僵尸进程、Docker、依赖过期 |
| 扩展 | 8 | 系统更新、包管理、云同步、习惯打卡、签名证书、API 限速 |
| 知识 | 8 | 浏览器知识卡、书签整理、闪卡复习、RSS、笔记汇总 |
| 生活 | 8 | 倒计时、备份、屏幕时间、会议占比 |

#### 敏感场景（默认关闭，需 proactive.json 开启）

| 分类 | 场景数 | 需要的授权 |
|------|--------|-----------|
| 通知中心 | 3 | macOS 需 FDA（完全磁盘访问权限） |
| 邮件 | 4 | macOS 需 FDA / Windows Outlook |
| 通讯录 | 1 | macOS AppleScript 授权 |
| IM 聚合 | 6 | 需配置 `connectors.json` |
| 浏览器/笔记/屏幕 | 6 | 部分需 FDA |

#### 激活方式

```
/proactive        # 激活主动推送
/assistant        # 激活完整助手模式（含主动+KAIROS）
/night-mode       # 夜间自主模式（22:00-06:00）
```

- **技巧**: 配置文件 `~/.pandacc/config/proactive.json` 可自定义所有阈值和敏感场景开关，详见 README 配置参考章节。

### 🆕 IM Connector 系统（v2.5 新增 — 6 平台）

v2.5 新增跨平台 IM 连接器，支持 6 个主流通讯平台：

| 平台 | 模式 | 说明 |
|------|------|------|
| 飞书 | MCP / API | 需 App ID/Secret，推荐 MCP 模式 |
| 钉钉 | MCP / API | 需 App Key/Secret，支持日历/任务/通知模块 |
| Slack | API | 需 Bot Token（`xoxb-xxx`）或 `SLACK_TOKEN` 环境变量 |
| 微信 | 企业微信 API / 本地 DB | 企微需 Corp ID；本地 DB 需 SQLCipher 解密密钥 |
| Telegram | API | 需 @BotFather 获取的 Bot Token |
| Teams | API | 需 Azure AD Tenant ID + Client ID/Secret |

- **配置**: 编辑 `~/.pandacc/config/connectors.json`，详见 README [connectors.json 章节](README.md)
- **关联场景**: 配置连接器后可启用 `im-unread-digest`、`im-daily-brief`、`im-calendar-sync`、`im-approval-alert`、`im-document-update`、`im-reverse-push` 等 6 个 IM 聚合场景

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

### 🆕 Multi-Model Agent Routing
- **启用**: `PANDA_MODEL_ROUTING=1` 或 settings.json `enableModelRouting: true`
- **说明**: 不同 agent 使用不同模型，按能力路由，版本无关
- **命令**: `/routing [status|preset <name>|test <agent> <prompt>]`
  - `/routing status` — 查看路由配置和已注册模型
  - `/routing preset quality` — 切换到质量优先预设
  - `/routing test triage "fix typo"` — 干跑路由决策测试
- **内建预设**:
  - `quality` — 全部用 Opus（最高质量）
  - `cost-saving` — 默认 Haiku（最低成本）
  - `balanced` — Sonnet 为主，架构用 Opus，分类用 Haiku
  - `multi-provider` — 分发到不同 Provider（需配置 modelRegistry）
- **Agent 模板**（`.pandacc/agents/`）:
  - `architecture-reviewer` — 强推理模型（min reasoning≥85）
  - `code-generator` — 编码速度优化
  - `triage` — 快速分类（maxTurns=3）
- **技巧**:
  - Agent .md frontmatter 支持 `modelPreferences` 和 `modelPreset`
  - 第三方模型通过 settings.json `modelRegistry` 注册
  - 自定义别名通过 `customModelAliases` 配置
  - 路由默认关闭（`enableModelRouting: false`），不影响现有行为

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
| `KAIROS_WRITE` | `/write` 写作助理 | ✅ 已启用 |
| `KAIROS_CAPTURE` | `/capture` 快速捕获 | ✅ 已启用 |
| `KAIROS_LEARN` | `/learn` 学习助理 | ✅ 已启用 |
| `IM_CONNECTOR` | IM 平台连接器（6 平台） | ✅ 已启用 |
| `PROACTIVE_SCENARIOS` | 主动推送 71 场景 | ✅ 已启用 |
| `NOTIFICATION_CENTER` | 系统通知中心感知 | ✅ 已启用 |

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

## 十九、🆕 v2.5.1 新增能力总览

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
| `/write` 写作助理 | v2.5 | 大纲生成 + Markdown 文稿编译 |
| `/capture` 快速捕获 | v2.5 | 想法捕获到 working/inbox/，PARA 自动分类 |
| `/learn` 学习助理 | v2.5 | 闪卡生成 + FSRS 间隔重复 + 学习路径 |
| 主动推送 71 场景 | v2.5 | 8 大维度，55 非敏感 + 16 敏感场景 |
| IM Connector 6 平台 | v2.5 | 飞书/钉钉/Slack/微信/Telegram/Teams |
| 系统通知中心感知 | v2.5 | macOS SQLite + Windows wpndb，3 场景 |
| IM 主动推送 6 场景 | v2.5 | 未读汇总/日报/日历同步/审批/文档/反向推送 |

---

*此文档是项目契约的一部分。一旦 Panda Code 功能更新，此文档必须同步更新。*
