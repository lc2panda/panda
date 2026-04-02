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
**版本**：2.1.888
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

## 新增命令

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

╔═════════════════════════════════════════════════════════════════╗
║              Feature Flag 系 统 (92 个，全部启用)                ║
╚═════════════════════════════════════════════════════════════════╝
```

---

## 许可证

本项目基于 CCB (Claude Code Best) 逆向还原，仅供学习研究用途。
