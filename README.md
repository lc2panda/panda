# Panda — Your AI, Your Data, Your Life.

> 懂你所有数据的 AI 伙伴 | 编码 · 助理 · 感知 · 生活

```
 ██████╗   █████╗  ███╗   ██╗ ██████╗   █████╗
 ██╔══██╗ ██╔══██╗ ████╗  ██║ ██╔══██╗ ██╔══██╗
 ██████╔╝ ███████║ ██╔██╗ ██║ ██║  ██║ ███████║
 ██╔═══╝  ██╔══██║ ██║╚██╗██║ ██║  ██║ ██╔══██║
 ██║      ██║  ██║ ██║ ╚████║ ██████╔╝ ██║  ██║
 ╚═╝      ╚═╝  ╚═╝ ╚═╝  ╚═══╝ ╚═════╝  ╚═╝  ╚═╝
```

| 版本 | 运行时 | 亮点 |
|------|--------|-----|
| 2.18.1 | Bun >= 1.2.0 / Node.js >= 18.0.0 | 🐼 品牌重塑 · 🎨 Matrix 磷光绿重调 · 🌐 UI 汉化 · 🪟 Windows 终端适配 |

---

## 1. 安装与配置

### 1.1 安装

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

**🎨 可选：启用 Matrix 主题**（黑客帝国风）

```bash
PANDA_THEME=matrix panda
```

启用后会看到 ~5.5 秒的字符雨启动屏（Logo 淡入 + "WAKE UP, NEO" 打字机，按 ⏎ 跳过），之后 Spinner 和输入框变绿色。消息区保持默认清爽留白，不干扰阅读。详见 [§8 /theme 命令手册](#theme)。

### 1.2 首次使用

```bash
panda auth login    # 交互式选择 Provider
panda auth status   # 查看认证状态
```

### 1.3 多 Provider 支持

```bash
panda auth login
# 交互式选择：Anthropic / DeepSeek / Kimi / Qwen / MiniMax / GLM / 火山引擎 / OpenAI
```

| Provider  | Base URL                                   | 默认模型              | 控制台                                                                                       |
| --------- | ------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------- |
| Anthropic | 原版 OAuth                                   | claude-sonnet-4-6 | [console.anthropic.com](https://console.anthropic.com)                                    |
| DeepSeek  | api.deepseek.com/anthropic                 | deepseek-chat     | [platform.deepseek.com](https://platform.deepseek.com/api_keys)                           |
| Kimi Code | api.kimi.com/coding                        | kimi-for-coding   | [kimi.com/code](https://www.kimi.com/code)                                                |
| Qwen      | dashscope-intl.aliyuncs.com/apps/anthropic | qwen3.5-plus      | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com/)                     |
| MiniMax   | api.minimax.io/anthropic                   | minimax-m2.7      | [platform.minimax.io](https://platform.minimax.io)                                        |
| GLM       | open.bigmodel.cn/api/anthropic             | glm-5.1           | [open.bigmodel.cn](https://open.bigmodel.cn/)                                             |
| Volcano   | ark.cn-beijing.volces.com/api/coding       | doubao-seed-code  | [console.volcengine.com](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey) |
| OpenAI    | api.openai.com/v1                          | gpt-4o            | [platform.openai.com](https://platform.openai.com/api-keys)                               |

<details>
<summary><strong>OpenAI / Codex — ChatGPT 订阅 OAuth 登录</strong>（v2.21.24，点击展开 OAuth 流程 / 双模式 / TLS 三路径 / 缓存 / 受限提示）</summary>

`panda auth login` 选择 OpenAI 后，浏览器打开 `auth.openai.com` 完成 PKCE OAuth：

1. **登录成功后自动拉取可用模型列表**（`GET chatgpt.com/backend-api/codex/models?client_version=0.118.0`），弹出 ↑↓ 选择器（`↑/k` 上、`↓/j` 下、`Enter` 确认、`Ctrl+C` 退出）；推荐项按 ChatGPT plan 自动高亮（标签 `← 推荐 - <plan>`）。
2. **选定模型持久化**到 `~/.pandacc.json` 的 `thirdPartyProvider.{model, availableModels, planType}`，下次启动直接用。
3. **默认走 ChatGPT backend 模式**（`mode: 'chatgpt_backend'`），消耗 ChatGPT Plus / Pro 订阅额度，**无需 API key 计费**。后端为 `chatgpt.com/backend-api/codex/responses`（流式）+ `/responses/compact`（非流式），流式/非流式分离。
4. **access_token (10 天) + refresh_token 自动轮换**，module-level Promise 锁单飞防并发。
5. **支持 ChatGPT Free / Plus / Pro / Team / Enterprise**：Free 账户自动用 mini 候选链（`gpt-5.4-mini → gpt-5-mini → gpt-4o-mini → gpt-4-turbo`），Plus/Pro 用主力链（`gpt-5.4 → gpt-5-codex → gpt-5 → gpt-5.4-mini`）。
6. **TTY 兜底**：非交互终端跳过 prompt，直接用 `pickDefaultCodexModel(planType)` 默认值。

**双模式并存**：旧的 API key 模式仍可用（`mode: 'api_key'`），手动配 `OPENAI_API_KEY` 走 `api.openai.com/v1` 路径，企业用户 / 有 API quota 用户继续按用量付费。

**会话内切换模型**：`/model <name>`（如 `/model gpt-5.4-mini`）即时生效；可用模型清单自动同步登录时拉到的 list。模型映射 `mapModelToCodex()` 直通 `gpt-5.4 / gpt-5.4-mini / gpt-5.3-codex-spark / o3 / o4-mini`，`gpt-5-codex` 默认降级为 `gpt-5.4-mini`（Free 友好；Plus/Pro 可设 `PANDA_CODEX_ALLOW_CODEX_MODEL=1` 显式解锁），其他未知模型兜底 `gpt-5.4-mini`。

**Bun BoringSSL TLS 三路径分发**（v2.21.24，HTTP 客户端解耦）：
- 路径 A：设了 `PANDA_OAUTH_CA_FILE` → `axios` + 自定义 CA `https.Agent`（Node / Bun 通吃，处理科学上网工具的 MITM 证书）。
- 路径 B：Bun runtime → subprocess `curl.exe -N -i` + 系统代理 + Schannel CA store。
- 路径 C：Node runtime → 标准 `fetch` + `undici ProxyAgent`。

**OpenAI 自身缓存**：`prompt_tokens_details.cached_tokens`（implicit cache）由 Cache Token 面板自动识别，无需额外配置。

**`gpt-5-codex` 受限提示**：仅 Plus/Pro 账户可用；Free 账户调用会触发 `not supported when using Codex with a ChatGPT account` 错误，请改用 `gpt-5.4-mini` 或升级订阅 + 设置 `PANDA_CODEX_ALLOW_CODEX_MODEL=1`。

(v2.21.16 引入 OAuth；v2.21.24 重构为 ChatGPT backend 默认 + 登录后模型选择 + Bun TLS 分发)

</details>

### 1.4 配置参考

所有配置文件位于 `~/.pandacc/config/` 目录，JSON 格式，不存在时使用默认值。

#### settings.json — 全局设置

```jsonc
// ~/.pandacc/settings.json
{
  "enableModelRouting": true,          // Multi-Model Agent Routing
  "routingPresets": {                   // 路由预设
    "cost-saving": { "agentModelMap": { "Explore": "haiku", "Plan": "sonnet" } }
  },
  "privacyEnhanced": true,             // 隐私增强模式（非 Anthropic 渠道自动启用）
  "autoMemoryEnabled": true,            // 自动记忆系统

  // 代理（v2.21.24 — 彻底根治 Bun BoringSSL + 中国大陆访问 OpenAI / Anthropic 直连问题）
  // 字符串形式：所有协议共用
  "proxy": "http://127.0.0.1:7897"

  // 或对象形式：分协议配置
  // "proxy": {
  //   "https": "http://127.0.0.1:7897",
  //   "http":  "http://127.0.0.1:7897",
  //   "noProxy": ["localhost", "127.0.0.1", "*.internal"]
  // }
}
```

**`proxy` 字段优先级链**（v2.21.24）：

```
环境变量 HTTPS_PROXY / HTTP_PROXY / NO_PROXY
    ↓ 未设置
settings.json 的 "proxy" 字段
    ↓ 未设置
Windows PAC 自动检测（系统代理脚本）
    ↓ 未命中
Windows 注册表 ProxyServer
    ↓ 未配置
直连（无代理）
```

panda 启动最早期会把 `proxy` 注入 `process.env.HTTPS_PROXY / HTTP_PROXY / NO_PROXY`，所有 HTTP 路径自动继承（Anthropic SDK / ChatGPT backend / OAuth / curl / axios / fetch 全打通）。

**临时一次性覆盖**：CLI flag `--proxy <url>`（不写入配置）。

**诊断**：`PANDA_PROXY_DEBUG=1` 打印 stderr 代理诊断日志（resolve 链路 + 实际命中源）。

<details>
<summary><code>proactive.json</code> — 主动推送配置</summary>

> ⚠️ **重要隐私说明**：下方 `enabledScenarios` 中的场景涉及读取邮件、通讯录、浏览历史、即时消息等**高度敏感的个人数据**。这些场景**默认全部关闭**，Panda 不会在未经授权的情况下读取任何个人隐私数据。用户必须**手动编辑配置文件并显式设为 `true`** 才会启用对应的数据采集。所有数据仅在用户本机处理，永不上传。

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
    // 微信全态势感知（14 场景，需配置 connectors.json 微信密钥）
    "wechat-daily-situational": false, // 每日全态势报告（22:00）
    "wechat-mention-alert": false,     // @提及实时告警（10分钟）
    "wechat-keyword-monitor": false,   // 关键词监控（15分钟）
    "wechat-unreplied-reminder": false, // 未回复提醒（3小时）
    "wechat-group-digest": false,      // 群聊摘要（12/18:00）
    "wechat-contact-insights": false,  // 联系人洞察（周五）
    "wechat-noise-filter": false,      // 噪音过滤建议（周日）
    "wechat-sentiment-pulse": false,   // 情感脉搏（21:00）
    "wechat-weekly-trend": false,      // 周度趋势（周五）
    "wechat-monthly-report": false,    // 月度深度分析（1号）
    "wechat-quarterly-review": false,  // 季度复盘（季首月）
    "wechat-yearly-digest": false,     // 年度总结（12/31）
    "wechat-relationship-health": false, // 关系健康度（周日）
    "wechat-topic-tracker": false,     // 话题追踪（6小时）
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

</details>

<details>
<summary><code>privacy.json</code> — 隐私排除规则</summary>

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

</details>

<details>
<summary><code>connectors.json</code> — IM 平台连接器</summary>

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
    "mode": "local-db",                     // local-db（推荐）| wecom（企业微信）
    "keysFile": "/path/to/wechat_keys.json", // wechat-db-decrypt-macos 导出的密钥文件
    // ── 企业微信模式（mode=wecom 时使用）──
    "corpId": "",
    "agentId": "",
    "secret": "keychain:wecom-secret"
  },
  "teams": {
    "enabled": false,
    "tenantId": "Azure AD 租户 ID",
    "clientId": "应用客户端 ID",
    "clientSecret": "keychain:teams-secret"
  }
}
```

</details>

<details>
<summary><code>dates.json</code> — 自定义纪念日</summary>

```json
// ~/.pandacc/config/dates.json
[
  { "name": "结婚纪念日", "date": "06-15" },
  { "name": "妈妈生日", "date": "09-22" }
]
```

</details>

<details>
<summary><code>habits.json</code> — 习惯打卡</summary>

```json
// ~/.pandacc/config/habits.json
[
  { "name": "运动", "frequency": "daily" },
  { "name": "阅读", "frequency": "daily", "target": "30min" }
]
```

</details>

<details>
<summary><code>wechat-keywords.json</code> — 微信关键词监控</summary>

```json
// ~/.pandacc/config/wechat-keywords.json
["合同", "截止", "紧急", "bug", "上线", "发版", "付款", "会议"]
```

</details>

<details>
<summary><code>wechat-vip.json</code> — 微信重要联系人</summary>

```json
// ~/.pandacc/config/wechat-vip.json
["老板的备注名", "客户A", "项目经理"]
```

</details>

<details>
<summary><code>wechat-topics.json</code> — 微信话题追踪</summary>

```json
// ~/.pandacc/config/wechat-topics.json
[
  { "topic": "项目上线", "keywords": ["上线", "发版", "部署", "发布"] },
  { "topic": "客户反馈", "keywords": ["客户", "反馈", "投诉", "建议"] }
]
```

</details>

<details>
<summary><strong>环境变量参考</strong> — 全量 55+ env（默认折叠，点击展开；v2.21.2 新增 <code>PANDA_FORCE_CACHE_STRATEGY</code>）</summary>

> 注：`未设置` 表示 env 不导出；`1` / `true` 生效（`isEnvTruthy` 语义）。近期版本新增项标注 version 列。

#### Panda 专属（PANDA_*）

| 变量 | 版本 | 默认 | 用途 |
|---|---|---|---|
| `PANDA_SECURITY_RESEARCH` | v2.1.x | 未设置 | 设为 `1` 禁用 4 项安全限制（CYBER_RISK/URL 限制/谨慎操作/恶意提醒） |
| `PANDA_HIDE_CONTEXT_WARNING` | v2.1.x | 未设置 | 设为 `1` 隐藏"上下文快满"警告 |
| `PANDA_NO_AUTO_COLLAPSE` | v2.1.x | 未设置 | 设为 `1` 禁止 Read/Grep 结果自动折叠 |
| `PANDA_SHOW_DEVBAR` | v2.1.x | 未设置 | 设为 `1` 在非 dev 构建中显示 DevBar |
| `PANDA_DEBUG` | v2.1.x | 未设置 | 设为 `1` 输出任务分类/进化写回/缓存等调试日志 |
| `PANDA_THEME` | v2.11.0 | 未设置 | 设为 `matrix` 启用 Matrix 黑客帝国风主题 |
| `PANDA_CONFIG_DIR` | v2.1.x | `~/.pandacc` | 覆盖配置目录路径（优先级高于 `CLAUDE_CONFIG_DIR`） |
| `PANDA_MODEL_ROUTING` | v2.16.x | 未设置 | 设为 `1` 启用 Multi-Model Agent Routing |
| `PANDA_CONTEXT_COLLAPSE` | v2.18.x | 未设置 | 设为 `1` 启用零 API 调用增量上下文折叠 |
| `PANDA_AGENT_MAX_TURNS` | v2.20.7 | `10` | Subagent 单次最大轮数（防 runaway loop） |
| `PANDA_AGENT_PER_TURN_LIMIT` | v2.20.4 | `2` | AgentTool 每轮 fork 上限（防过度 fork） |
| `PANDA_AGENT_TIMEOUT_MS` | v2.20.8 | `0`（关闭） | AgentTool 单次超时毫秒（v2.20.8 曾默认 120000；v2.20.9 改 opt-in） |
| `PANDA_FORK_TIMEOUT_MS` | v2.20.8 | `0`（关闭） | fork 子会话超时毫秒（同上，v2.20.9 改 opt-in） |
| `PANDA_CACHE_TEXT_KEEP_LAST` | v2.20.4 | `5` | Endless Mode：保留最近 N 条 tool_result 文本不压缩 |
| `PANDA_CACHE_TEXT_MIN_SIZE` | v2.20.4 | `1500` | Endless Mode：字符数低于此阈值不压缩 |
| `PANDA_FORCE_CACHE_STRATEGY` | v2.21.2 | 未设置 | 代理用户声明后端 cache 能力，取值 `explicit`/`implicit`/`none` |
| `PANDA_SKILL_LEARNING_TEST` | v2.16.x | 未设置 | 设为 `1` 启用 Skill learning 模块测试钩子（内部） |
| `PANDA_OAUTH_CA_FILE` | v2.21.24 | 未设置 | MITM 根证书路径，绕过 Bun BoringSSL 不读系统 CA store 的限制（科学上网工具自签证书场景） |
| `PANDA_PROXY_DEBUG` | v2.21.24 | 未设置 | 设为 `1` 打印 stderr 代理诊断日志（resolve 链路 + 实际命中源） |
| `PANDA_CODEX_DEFAULT_MODEL` | v2.21.24 | 未设置 | 覆盖 `pickDefaultCodexModel(planType)` 的兜底模型（OpenAI ChatGPT backend 模式） |
| `PANDA_CODEX_ALLOW_CODEX_MODEL` | v2.21.24 | 未设置 | 设为 `1` 显式解锁 `gpt-5-codex` 等受限模型（仅 ChatGPT Plus / Pro 账户实际有效） |

#### 缓存与 Provider（v2.20.11 ~ v2.21.2 Wave 3/9 多 provider 统一）

| 变量 | 版本 | 默认 | 用途 |
|---|---|---|---|
| `DISABLE_PROMPT_CACHING` | v2.1.x | 未设置 | 设为 `1` 全局禁用 prompt cache |
| `DISABLE_PROMPT_CACHING_HAIKU` | v2.1.x | 未设置 | 设为 `1` 禁用 Haiku 模型缓存 |
| `DISABLE_PROMPT_CACHING_SONNET` | v2.1.x | 未设置 | 设为 `1` 禁用 Sonnet 模型缓存 |
| `DISABLE_PROMPT_CACHING_OPUS` | v2.1.x | 未设置 | 设为 `1` 禁用 Opus 模型缓存 |
| `DISABLE_PROMPT_CACHING_1H` | v2.20.11 | 未设置 | 非直连 provider 默认启用 1h TTL；设为 `1` 降级回 5m TTL |
| `DISABLE_MOONSHOT_ANTHROPIC_ENDPOINT` | v2.20.13 | 未设置 | 设为 `1` 关闭 Kimi 自动路径重写（`/anthropic`） |
| `DISABLE_MINIMAX_ANTHROPIC_ENDPOINT` | v2.21.0 | 未设置 | 设为 `1` 关闭 Minimax 自动路径重写（`/anthropic`） |
| `DISABLE_CACHE_SCOPE_GATE` | v2.21.1 | 未设置 | 设为 `1` 回滚 `scope='global'` 的 firstParty gate（重新广播给所有 provider） |
| `DISABLE_CACHE_DEFENSIVE_FALLBACK` | v2.21.1 | 未设置 | 设为 `1` 关闭 `cache_control` 400 防御式剥离重试 |
| `DEBUG_CACHE` | v2.18.x | 未设置 | 设为 `1` 输出第三方 API cache token 原始数据到 stderr |

#### 功能控制

| 变量 | 版本 | 默认 | 用途 |
|---|---|---|---|
| `CLAUDE_CODE_COORDINATOR_MODE` | v2.15.x | 未设置 | 设为 `1` 启用 Coordinator 多 Agent 模式 |
| `ENABLE_TOOL_SEARCH` | v2.16.x | `true` | ToolSearch 默认启用（非 Anthropic provider 也开启） |
| `ENABLE_SESSION_MEMORY` | v2.20.3 | 未设置 | 设为 `1` 启用 session memory（v2.20.3 后改为 opt-in） |
| `ENABLE_SESSION_PERSISTENCE` | v2.1.x | 未设置 | 设为 `1` 启用 session 持久化 |
| `ENABLE_CLAUDE_CODE_SM_COMPACT` | v2.20.x | 未设置 | 设为 `1` 启用 session memory compact |
| `DISABLE_CLAUDE_CODE_SM_COMPACT` | v2.20.x | 未设置 | 设为 `1` 禁用 session memory compact |
| `DISABLE_COMPACT` | v2.1.x | 未设置 | 设为 `1` 禁用 compact（含命令与自动压缩） |
| `DISABLE_AUTO_COMPACT` | v2.1.x | 未设置 | 设为 `1` 仅禁用自动压缩，保留手动 `/compact` |
| `ENABLE_LSP_TOOL` | v2.1.x | 未设置 | 设为 `1` 注册 LSPTool 到工具列表 |
| `ENABLE_CLAUDEAI_MCP_SERVERS` | v2.1.x | 默认启用 | 设为 `false` 禁用 Claude.ai 官方 MCP server |
| `ENABLE_MCP_LARGE_OUTPUT_FILES` | v2.1.x | 默认启用 | 设为 `false` 关闭 MCP 大输出落盘 |
| `DISABLE_INTERLEAVED_THINKING` | v2.1.x | 未设置 | 设为 `1` 关闭 interleaved thinking beta |
| `DISABLE_TELEMETRY` | v2.1.x | 未设置 | 设为任意真值禁用遥测 |
| `DISABLE_ERROR_REPORTING` | v2.1.x | 未设置 | 设为 `1` 禁用错误上报 |
| `DISABLE_AUTOUPDATER` | v2.1.x | 未设置 | 设为 `1` 禁用自动更新 |
| `DISABLE_INSTALLATION_CHECKS` | v2.1.x | `1`（CLI 启动时自动置位） | 禁用安装检查；CLI 入口强制置 `1` |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | v2.1.x | `1` | 禁用非必要网络流量（遥测/分析/GrowthBook） |
| `CLAUDE_INTERNAL_FC_OVERRIDES` | v2.1.x | 自动设置 | GrowthBook feature flag 覆盖（31+ tengu flags） |
| `CLAUDE_DISABLE_STREAM_WATCHDOG` | v2.21.20 | 未设置 | 设为 `1` opt-out v2.21.20 默认启用的 stream watchdog（agent 静默截断兜底） |

#### 命令开关（`DISABLE_*_COMMAND`）

| 变量 | 默认 | 用途 |
|---|---|---|
| `DISABLE_LOGIN_COMMAND` | 未设置 | 设为 `1` 禁用 `/login` |
| `DISABLE_LOGOUT_COMMAND` | 未设置 | 设为 `1` 禁用 `/logout` |
| `DISABLE_DOCTOR_COMMAND` | 未设置 | 设为 `1` 禁用 `/doctor` |
| `DISABLE_UPGRADE_COMMAND` | 未设置 | 设为 `1` 禁用 `/upgrade` |
| `DISABLE_FEEDBACK_COMMAND` / `DISABLE_BUG_COMMAND` | 未设置 | 设为 `1` 禁用 `/feedback` / `/bug` |
| `DISABLE_EXTRA_USAGE_COMMAND` | 未设置 | 设为 `1` 禁用 `/extra-usage` |
| `DISABLE_INSTALL_GITHUB_APP_COMMAND` | 未设置 | 设为 `1` 禁用 `/install-github-app` |
| `DISABLE_COST_WARNINGS` | 未设置 | 设为 `1` 禁用成本警告提示 |

#### API 配置

| 变量 | 用途 |
|---|---|
| `ANTHROPIC_API_KEY` | API 密钥 |
| `ANTHROPIC_BASE_URL` | API 基础 URL（非 Anthropic 直连时由 provider 规则判定 host） |
| `ANTHROPIC_MODEL` | 默认模型 |
| `ANTHROPIC_SMALL_FAST_MODEL` | 快速模型 |
| `OPENROUTER_PREFER_PROVIDER` | OpenRouter 首选 provider 优先级 |
| `PANDA_PROVIDER` | v2.21.16 — 设为 `openai` 启用 OpenAI provider（由 `panda auth login` 自动写入，手动设置仅用于调试） |
| `OPENAI_API_KEY` | v2.21.16 — OpenAI **API key 模式**（`mode: 'api_key'`）使用，走 `api.openai.com/v1`；**ChatGPT backend 模式**（v2.21.24 默认）不需要此 env |
| `OPENAI_BASE_URL` | v2.21.16 — OpenAI 兼容端点 base URL，默认 `https://api.openai.com/v1`（自建代理 / Azure OpenAI 兼容层时覆盖；仅对 API key 模式生效） |
| `HTTPS_PROXY` | v2.21.24 — HTTPS 流量代理（标准 env，优先级最高，覆盖 settings.json `proxy` 字段） |
| `HTTP_PROXY` | v2.21.24 — HTTP 流量代理（同上） |
| `NO_PROXY` | v2.21.24 — 代理排除列表（逗号分隔，如 `localhost,127.0.0.1,*.internal`） |

#### 使用示例（缓存与 Provider）

**场景 1 — 直连 Anthropic（默认，无需配置）**

```bash
export ANTHROPIC_API_KEY=sk-ant-...
panda
# getCacheStrategy() → 'explicit'（Anthropic 直连）
# cache_control 字段正常插入，scope='global' 仅发给 firstParty
```

**场景 2 — 本地代理转 Minimax / 未知 CDN（设 `PANDA_FORCE_CACHE_STRATEGY`）**

```bash
export ANTHROPIC_BASE_URL=http://localhost:8787
export PANDA_FORCE_CACHE_STRATEGY=explicit   # 代理后端是 Anthropic 兼容
# 或
export PANDA_FORCE_CACHE_STRATEGY=implicit   # 代理后端是 DeepSeek/Qwen/GLM 类隐式缓存
# 或
export PANDA_FORCE_CACHE_STRATEGY=none       # 代理后端不支持缓存，关闭 cache_control
panda
```

**场景 3 — 回滚 scope gate（出现兼容性问题时）**

```bash
export DISABLE_CACHE_SCOPE_GATE=1           # 重新广播 scope='global' 给所有 provider
export DISABLE_CACHE_DEFENSIVE_FALLBACK=1   # 同时关闭 cache_control 400 防御重试
panda
# 适用：定位 scope 字段兼容性问题或需要与旧版字节等价
```

**场景 4 — OpenAI ChatGPT backend + 中国大陆代理 + Bun runtime**（v2.21.24）

```bash
# 方式 A：标准 env（最高优先级，覆盖一切）
export HTTPS_PROXY=http://127.0.0.1:7897
export HTTP_PROXY=http://127.0.0.1:7897
export NO_PROXY=localhost,127.0.0.1,*.internal
panda auth login            # 选 OpenAI → OAuth → ↑↓ 选模型 → 完成
panda                       # 直接对话，走 chatgpt.com/backend-api/codex/responses

# 方式 B：写入 settings.json（持久化，全用户全 panda 实例生效）
# 在 ~/.pandacc/settings.json 加：  "proxy": "http://127.0.0.1:7897"

# 方式 C：MITM 自签证书绕过（科学上网工具拦截 TLS 时）
export PANDA_OAUTH_CA_FILE=/path/to/mitmproxy-ca-cert.pem
export PANDA_PROXY_DEBUG=1   # 看 stderr 诊断
panda
```

</details>

### 1.5 OpenAI / 代理常见问题（v2.21.24）

<details>
<summary>展开 8 个常见问题（证书 / 模型受限 / 代理 / OAuth 回调 / SSE watchdog 等）</summary>

| 现象 | 原因 | 解决方案 |
|---|---|---|
| OpenAI 登录后对话报 `unknown certificate verification error` | Bun runtime 不读系统 CA store，遇到科学上网工具的 MITM 证书无法验证 | 在 `~/.pandacc/settings.json` 加 `"proxy": "http://127.0.0.1:7897"`（端口改成你工具的实际混合端口）；或导出 MITM 根证书，设 `PANDA_OAUTH_CA_FILE=<path>` |
| `/model gpt-5-codex` 报 `not supported when using Codex with a ChatGPT account` | `gpt-5-codex` 仅 ChatGPT Plus / Pro 账户可用，Free 账户被服务端拒绝 | 改用 `/model gpt-5.4-mini`（Free 可用）；或升级订阅后设 `PANDA_CODEX_ALLOW_CODEX_MODEL=1` 显式解锁 |
| `curl` 报 `Proxy CONNECT aborted` | Windows PAC 给的代理 URL 是远端标识符（如 `proxy.company.com:8080`）而非本地入口 | 手动设 `HTTPS_PROXY=http://127.0.0.1:7897`（指向本地 Clash / V2Ray / sing-box 的混合端口） |
| OAuth 回调 `localhost:1455` 永远不返回 | 浏览器走代理把 `localhost` 也代理出去了 | 设 `NO_PROXY=localhost,127.0.0.1`，或把代理工具的"绕过本地地址"打开 |
| `/model` 切换后请求被服务端 400 拒收 | 旧版 v2.21.16 的 `stream` / `store` 字段在 ChatGPT backend 不被接受 | 升级到 v2.21.24+，已修该 bug（mode-aware 字段过滤） |
| 选择器卡住、终端不响应 ↑↓ | 非 TTY 环境（CI / pipe）但 panda 仍尝试交互 prompt | v2.21.24 已加 TTY 兜底；非交互终端自动跳过 prompt 用 `pickDefaultCodexModel(planType)` 默认值 |
| `panda auth login` 后 access_token 过期就报错 | refresh_token 续期失败（网络瞬断 / 代理 race） | v2.21.24 用 module-level Promise 锁单飞 refresh，再次执行 `panda` 即可触发自动续期；持续失败则重新 `panda auth login` |
| Agent 长任务中途无任何输出后静默退出 | 上游 SSE 连接断开但 client 未察觉（v2.21.20 之前） | v2.21.20 默认启用 stream watchdog 兜底；如需 opt-out，设 `CLAUDE_DISABLE_STREAM_WATCHDOG=1` |

</details>

---

## 2. 命令速查

<details>
<summary>展开查看命令速查表</summary>

> 完整手册请查看 [第 8 章 命令使用手册](#8-命令使用手册)

### 2.1 核心命令速查表

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

### 2.2 超级助手命令

> 以下命令是智能助理的交互入口。

| 命令              | 说明                                                  |
| --------------- | --------------------------------------------------- |
| `/dream` <sub>· Skill</sub> | 四阶段记忆整合（Harvest→Understand→Consolidate→Anticipate），支持 cron 定时 |
| `/assistant`    | 启用 KAIROS 助手模式 — 激活主动引擎 + 定时任务                      |
| `/proactive`    | 切换主动自主模式 — 含 dream/briefing/health 三个内置任务           |
| `/night-mode`   | 夜间自主模式（22:00-06:00）— 顺序执行 + 错误隔离                    |
| `/buddy`        | 编程伙伴 — 可交互的虚拟宠物（随机物种）                           |
| `/brief`        | 简报模式 — AI 只输出简洁摘要                                   |
| `/persona auto` | 自动人格切换 — 根据时间/情绪/活动自动调整                             |
| `/write`        | 写作助理 — 生成大纲、编译文稿                                    |
| `/capture`      | 快速捕获 — 将想法保存到工作记忆                                   |
| `/learn`        | 学习助理 — 闪卡生成、间隔重复、学习路径规划                            |
| `/wechat`       | 微信数据查询 — 会话/聊天/搜索/联系人                                |

### 2.3 Ant-Only 高级命令（已全部启用）

| 命令                | 说明                   |
| ----------------- | -------------------- |
| `/ultraplan`      | CCR 远程深度规划（10-30 分钟） |
| `/ultrareview`    | 深度代码审查 + bug 验证      |
| `/force-snip`     | 强制截断对话历史             |
| `/init-verifiers` | 初始化验证器脚本             |
| `/subscribe-pr`   | 订阅 PR 更新通知           |
| `/heapdump`       | JS 堆转储               |

### 2.4 Multi-Model Agent Routing

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

**完整功能**（21/26 任务实装）：

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

> 详见 [第 8 章 命令使用手册](#8-命令使用手册) Multi-Model Routing 章节

### 2.5 快捷键

| 快捷键           | 功能         | 快捷键      | 功能      |
| ------------- | ---------- | -------- | ------- |
| `Shift+Tab`   | 切换权限模式     | `Ctrl+D` | 退出      |
| `Meta+P`      | 切换模型       | `Ctrl+T` | 任务面板    |
| `Ctrl+G`      | $EDITOR 编辑 | `Ctrl+O` | 详细输出    |
| `\` + `Enter` | 换行         | `!`      | Bash 模式 |
| `@`           | 文件补全       | `&`      | 后台运行    |

### 2.6 环境变量

> 完整 55+ 项表（含 v2.20.11 ~ v2.21.2 新增缓存/Provider/超时等项）见 [**1.4 配置参考 → 环境变量参考折叠块**](#14-配置参考)（已默认折叠）。常用精选：

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
| `PANDA_FORCE_CACHE_STRATEGY`     | 代理用户声明后端 cache 能力（v2.21.2）         |
| `DISABLE_CACHE_SCOPE_GATE=1`     | 回滚 firstParty scope gate（v2.21.1） |

</details>

---

## 3. 超级助手 — 智能助理

> "越用越了解你的贴身助理。白天人来接管，夜间 AI 自主整理所有数据资产。"
>

<details>
<summary>展开查看完整功能</summary>

### 3.1 五层记忆系统

| 层        | 功能          | 自动维护        | 存储             |
| -------- | ----------- | ----------- | -------------- |
| **工作记忆** | 当前会话上下文     | ✅           | Context Window |
| **情景记忆** | 每日会话摘要      | ✅ DeepDream | episodes/      |
| **语义记忆** | 用户画像 + 知识图谱 | ✅ 自动进化      | semantic/      |
| **程序记忆** | 行为模式 + 工作流  | ✅ 行为学习      | procedural/    |
| **前瞻记忆** | 预测 + 建议     | ✅ 感知引擎      | dreams/prospective/ |

### 3.2 主动交互能力（双层架构）

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

> 完整 103 场景设计见 `monitor/proactive-scenarios-design.md`，覆盖系统(8)、通信(8)、文件(9)、开发(10)、知识(6)、效率(7)、安全(7)、个人(7) 八大维度。

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

每轮对话结束后自动检查 8 种条件，在对话内注入建议：

- **上下文压力**：消息 > 50 条 → 建议 `/compact`
- **重复模式**：连续 3 次相似操作 → 建议创建工作流 `/skillify` <sub>· Skill 形态，通过 Skill tool 调用</sub>
- **未提交提醒**：2 小时未 commit + 有未提交文件
- **画像过期**：`profile.md` > 7 天未更新
- **晨间简报**：7:00-12:00 有未读简报
- **未读通知消费**：15 分钟内有 outbox 通知未显示 → 摘要提醒
- **习惯偏差关怀**：23:00-05:00 深夜活跃 / 连续工作 > 3 小时 → 关怀提醒
- **LLM 元检查器**：重复话题 / 错误累积 / 长对话未委派 → 智能建议

#### 通知渠道（跨平台）

| 渠道 | 平台 | 配置方式 |
|------|------|--------|
| **系统通知** | macOS: osascript / Windows: BurntToast / Linux: notify-send | 默认开启 |
| **对话内注入** | 全平台 | 被动层自动注入 |
| **Webhook** | 全平台（微信/Telegram/飞书 Bot 等） | 见 [1.4 配置参考 → proactive.json](#proactivejson--主动推送配置) |
| **Channel 队列** | 全平台 | `~/.pandacc/channels/outbox/notifications.jsonl` |

#### 隐私敏感场景

涉及邮件、通讯录、浏览历史、即时消息、通知中心、屏幕时间、IM 平台、微信态势感知等 **43 个**敏感场景**默认全部关闭**。
需用户在 `~/.pandacc/config/proactive.json` 中显式开启。

> 详见上方 **[1.4 配置参考 → proactive.json](#proactivejson--主动推送配置)** 的 `enabledScenarios` 字段。

#### 基础设施

- **用户画像自动进化**：从对话中提取语言偏好、技术栈、工作模式、沟通风格，写入 `semantic/profile.md`
- **记忆搜索**：SQLite FTS5 全文索引（`bun:sqlite` 原生，`unicode61` 分词器 + 中文 bigram 预处理，零外部依赖，TF-IDF fallback），支持中英文混合查询
- **隐私守护**：`~/.pandacc/config/privacy.json` 排除列表，所有连接器自动过滤
- **跨平台抽象层**：`src/proactive/platform.ts` 统一封装磁盘/内存/网络/电池/空闲时间获取
- **可配置阈值**：`~/.pandacc/config/proactive.json` 覆盖所有默认阈值

### 3.3 数据连接器

> 以下连接器既供 DeepDream / 感知引擎内部调用，也暴露为独立 CLI 子命令，随时可在终端手动触发。

| 连接器   | 触发方式                      | 数据源                          | 隐私过滤   |
| ----- | ------------------------- | ---------------------------- | ------ |
| 浏览器历史 | `panda history digest --days 7 --limit 50` <sub>· macOS Chrome only</sub> | Chrome SQLite（只读复制后查询）       | ✅ 域名排除 |
| 日历    | `panda calendar today` / `panda calendar week` <sub>· macOS only</sub> | macOS Calendar (AppleScript) | ✅      |
| 笔记    | `panda notes search <query>` / `panda notes list` <sub>· macOS only</sub> | Apple Notes SQLite           | ✅      |
| 剪贴板   | `clipboard-poll` 任务 / DeepDream 阶段 | pbpaste + 敏感过滤               | ✅ 密钥过滤 <sub>· 每 2 分钟轮询，30 分钟无操作自动停</sub> |

### 3.4 非编码场景

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

### 3.5 感知引擎

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

### 3.6 IM Connector 系统（6 平台）

v2.5 新增跨平台 IM 连接器，支持 6 个主流通讯平台：

| 平台 | 模式 | 说明 |
|------|------|------|
| 飞书 | MCP / API | 需 App ID/Secret，推荐 MCP 模式 |
| 钉钉 | MCP / API | 需 App Key/Secret，支持日历/任务/通知模块 |
| Slack | API | 需 Bot Token（`xoxb-xxx`）或 `SLACK_TOKEN` 环境变量 |
| 微信 | 企业微信 API / 本地 DB | 企微需 Corp ID；本地 DB 需 macOS + `brew install sqlcipher` + 微信 db 密钥 <sub>· experimental</sub> |
| Telegram | API | 需 @BotFather 获取的 Bot Token |
| Teams | API | 需 Azure AD Tenant ID + Client ID/Secret |

- **配置**: 编辑 `~/.pandacc/config/connectors.json`，详见 [1.4 配置参考 → connectors.json](#connectorsjson--im-平台连接器)
- **关联场景**: 配置连接器后可启用 `im-unread-digest`、`im-daily-brief`、`im-calendar-sync`、`im-approval-alert`、`im-document-update`、`im-reverse-push` 等 6 个 IM 聚合场景

### 3.7 微信全态势感知

微信用户每天面对大量群消息，超级助手提供全时间维度的态势感知：

| 时间维度 | 场景 | 频率 | 核心价值 |
|----------|------|------|---------|
| **实时** | @提及告警 | 10 分钟 | 群里被 @ 立即推送 |
| | 关键词监控 | 15 分钟 | 自定义关键词命中告警 |
| | 话题追踪 | 6 小时 | 关注话题全盘监控 |
| **日度** | 全态势报告 | 22:00 | 上帝视角：活跃排行 + 重点关注 + 降噪建议 |
| | 未回复提醒 | 3 小时 | 私聊对方等你回 > 2h |
| | 群聊摘要 | 12/18:00 | 高消息群自动摘要 |
| | 情感脉搏 | 21:00 | 正/负面情感分布 |
| **周度** | 趋势报告 | 周五 | 本周 vs 上周全维度对比 |
| | 联系人洞察 | 周五 | 谁沉默了？谁活跃了？ |
| | 关系健康度 | 周日 | VIP 断联预警 + 建议主动联系 |
| | 噪音过滤 | 周日 | 退群/屏蔽建议 |
| **月度** | 深度分析 | 1 号 | 社交圈层 + 群健康度 + 关键词趋势 |
| **季度** | 复盘 | 季首月 | 社交网络演变 + 群生命周期 |
| **年度** | 总结 | 12/31 | 年度社交大数据 + 关键词云 + 年度最佳 |

**配置文件**：`wechat-keywords.json`（监控词）、`wechat-vip.json`（VIP 联系人）、`wechat-topics.json`（关注话题）

**数据持久化**：每日统计快照 `~/.pandacc/data/wechat-stats/YYYY-MM-DD.json`，周/月/季/年报告基于快照做趋势分析。

**快速启用**（在 `~/.pandacc/config/proactive.json` 的 `enabledScenarios` 中添加）：

```json
{
  "enabledScenarios": {
    "wechat-messages": true,
    "wechat-daily-situational": true,
    "wechat-mention-alert": true,
    "wechat-keyword-monitor": true,
    "wechat-unreplied-reminder": true,
    "wechat-group-digest": true,
    "wechat-weekly-trend": true,
    "wechat-relationship-health": true
  }
}
```

> 以上为推荐的最小启用集（8 个核心场景）。全部 14 个场景可按需逐一开启，详见 [1.4 配置参考 → proactive.json](#14-配置参考)。

### 3.8 隐私铁律

```
1. 全本地采集和索引 — 数据永不离开设备（除用户主动对话）
2. 敏感数据自动过滤 — 密码/token/API key/证书 不入索引
3. privacy.json 排除列表 — 用户自定义不采集的路径/域名/应用
4. 随时可删 — `panda memory forget "关于X的一切"`（默认 dry-run，加 `--yes` 才真删）
5. 数据可导出 — 全部 Markdown + SQLite，Git 可追踪
```

</details>

---

## 4. 治理能力

Panda 内置了 11 项治理能力。

<details>
<summary>展开查看 11 项治理能力</summary>

### 4.1 自动生效（零配置）

| 能力                   | 触发时机                                                                                      | 用户感知                                   |
| -------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------- |
| **危险命令防御（双层）**      | AI 执行 `rm -rf /`、`git reset --hard`、`git push --force`、`chmod -R 777`、fork bomb 等 7 种危险模式 | **拦截层**（bashSecurity + pathValidation）：匹配危险模式后阻断执行，弹出确认提示；**警告层**（destructiveCommandWarning）：对高风险但非致命操作追加 `⚠️ Dangerous: ...` 信息性警告 |
| **Completion Guard** | AI 纯文本声称"任务已完成"但无工具调用或测试证据                                                                | 自动要求补充验证证据（最多 2 次）                     |
| **Finding Closure**  | AI 声称完成但回复中含未关闭的 TODO/FIXME/HACK                                                          | 自动要求先关闭所有 findings                     |
| **Anti-Slop 审查**     | AI 回复过度 emoji（≥8种）、重复段落、或超长空洞文本                                                           | 自动要求精简，给出代码/路径                         |
| **子 Agent 上下文注入**    | 每次 Agent 工具 spawn 子 agent                                                                 | 子 agent 自动获得 CLAUDE.md 核心规范（前 2500 字符） |
| **能力优先调度**           | 未指定 `subagent_type` 的 Agent 调用                                                            | 搜索类→Explore agent，规划类→Plan agent       |
| **任务分类引擎**           | 每轮对话首条用户消息                                                                                | 后台分类（`PANDA_DEBUG=1` 可见），为后续扩展预留       |
| **进化写回**             | turnCount > 3 且有成功工具调用                                                                    | 调试日志记录工具名列表（尚未接入经验沉淀管线，预留入口）       |

### 4.2 Patterns/Scars 经验记忆

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

### 4.3 执行流

```
用户输入 → 任务分类 → AI 响应
                        │
                        ├─ BashTool → bashSecurity 拦截 → ⚠️ 确认 → destructiveCommandWarning 警告
                        ├─ AgentTool → 能力优先调度 → 自动选型
                        │              └─ 子Agent上下文注入 → CLAUDE.md
                        └─ 纯文本回复
                              ├─ Completion Guard → 无证据？→ 要求补充
                              │   └─ Finding Closure → 有TODO？→ 要求关闭
                              ├─ Anti-Slop → 废话？→ 要求精简
                              └─ 进化写回 → 日志记录
```

</details>

---

## 5. 系统架构

<details>
<summary>展开查看架构图</summary>

### 系统架构图

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
│      工 具 系 统 (56个)      │ │       API / Provider 层          │
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
│                       智 能 助 理 系 统                          │
│  autoDream │ KAIROS │ Proactive │ NightMode │ Mood │ Sense    │
│  Coordinator │ Buddy │ Brief │ Persona │ Memory │ Dream     │
└─────────────────────────────────────────────────────────────────┘

╔═════════════════════════════════════════════════════════════════╗
║      Feature Flag 系 统 (92 个全开 + 31 GrowthBook tengu flags)  ║
╚═════════════════════════════════════════════════════════════════╝
```

### Cache Token 显示

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

### contextCollapse — 零 API 调用的上下文折叠

长对话场景下，消息膨胀逼近上下文窗口上限。contextCollapse 在 autocompact **之前**运行，通过纯本地操作增量折叠旧消息，零额外 token 消耗。

| 指标     | 传统 autocompact | contextCollapse  |
| ------ | -------------- | ---------------- |
| 触发阈值   | ~80% 上下文窗口     | **60%** 上下文窗口    |
| API 调用 | 1 次（摘要生成）      | **0 次**          |
| 信息损失   | 全量压缩，不可逆       | 按 span 折叠，可恢复    |
| 粒度     | 全部消息           | 按 4-15 条消息的 span |

**启用方式**：

```bash
# 环境变量
PANDA_CONTEXT_COLLAPSE=1 panda

# 或 settings.json（feature flag CONTEXT_COLLAPSE 已启用）
```

**工作原理**：

1. **每次查询前**自动检查 token 使用量
2. 超过 60% 阈值时扫描**最旧的消息**，识别可安全折叠的 span
3. 生成**本地模板化摘要**（保留工具名+参数+结果骨架），压缩比 20:1~40:1
4. 用摘要占位符替代原始消息，原始消息归档在内存中
5. API 413 时触发**紧急排水**，放宽折叠条件

**折叠策略**：

**安全折叠（低风险）**：已完成的工具调用对、短对话、距当前 ≥10 轮的历史

**不折叠（高风险）**：最近 5 轮、系统消息、文件编辑操（Edit/Write）、未完成工具调用

**查看状态**：

```
/context    — 显示折叠统计（collapsedSpans, stagedSpans）
```

**与 autocompact 的关系**：

```
query() 执行顺序：
  ① contextCollapse.applyCollapsesIfNeeded()   ← 先折叠
  ② autocompact()                               ← 只在折叠不够时触发
  ③ API 调用
  ④ 若 413 → contextCollapse.recoverFromOverflow() → 重试
```

### Fork 缓存与智能压缩（FIRE_AND_FORGET + smartCompact）

后台 fork（fire-and-forget）不会被后续请求读取，给它们写 cache_creation 等于白付
1.25× 写溢价。v2.21.16 在 `src/utils/forkedAgent.ts` 加了白名单 `FIRE_AND_FORGET_FORK_LABELS`，
对下列 8 类 fork 自动开启 `skipCacheWrite`：

```
session_memory · prompt_suggestion · away_summary · extract_memories
auto_dream · compact · agent_summary · session_summary
```

触发条件为白名单命中**或** `maxTurns === 1`。Anthropic 直连（firstParty）路径
byte-equal 不变，仅影响 fork 路径最后一个 cache_control marker。

**`smartCompactContent` 三层零 API 压缩**（v2.21.16）

| 层 | 机制                                                                        | 触发        |
| - | --------------------------------------------------------------------------- | --------- |
| L1 | 结构化截断：保留 head 15 行 + tail 8 行 + key lines（errors / warnings / grep 行号 / diff hunks / 函数定义 / TODO/FIXME / 文件引用），至多 30 行 key | 单条 tool_result 超 budget |
| L2 | 时间衰减：age=0 保留 100%，每+1 age 扣 15%，age≥6 兜底 20%；预算按权重 `0.3 + 0.7·(age/N)` 分配给更旧的项 | 总 context 超 `contextBudgetChars`（默认 480K 字符 ≈ 200K token 的 60%） |
| L3 | LLM summary：`sideQuery` haiku 单次调用，把老消息压成结构化摘要，保留最近 `keepRecent` 轮 | L1+L2 后仍超 70% 模型窗口 |

关键原则：**总量不超 budget 时零操作**——`truncateOldToolResults()` 先算总字符数，
没超标直接原样返回；超了才对 old tool_results 按年龄递进压缩；最近 4 条（`keepRecent`）
永远 100% 保留。

### Cache 前缀稳定化（CACHE-001 ~ CACHE-005）

v2.21.8（commit 281293a）修了 5 个导致缓存命中率长期 <5% 的前缀漂移 bug，预期
命中率提升到 60–80%：

| 编号 | 症状 | 修复位置 |
| -- | -- | -- |
| CACHE-001 | `currentDate` 每分钟变一次，`timeAwareness` 被写死在静态段导致每次 prefix 不同 | `src/context.ts` — `timeAwareness` 迁到 dynamic segment |
| CACHE-002 | secondary breakpoint 锚点随 messages 长度漂移 | `src/services/api/claude.ts` — 锚定到 `messages[0]` |
| CACHE-003 | 显式缓存 provider 遭遇 400 剥离重试后 `stripCacheControl` 残留 true，污染下一次请求 | `src/services/api/withRetry.ts` — retry 时 reset；守 Anthropic 直连 byte-equal |
| CACHE-004 | `sortDeferredToolsBlock` 每次重排产生非确定性 tool 顺序 | `src/services/api/cacheStabilize.ts` — 按 byte-identical input 命中 fingerprint 缓存 |
| CACHE-005 | `compressOldToolResultText` 越界压缩了已稳定前缀 | `src/services/api/cacheStabilize.ts` — 新增 `protectBeforeIndex` 参数守护 |

</details>

---

## 6. 隐私与安全

### 6.1 隐私保护

<details>
<summary>展开查看隐私保护详情</summary>

所有渠道均可启用隐私增强模式（配置 `privacyEnhanced: true` 或使用 `/privacy` 命令）。非 Anthropic 渠道自动启用。

| 防护层                | 内容                                                                  | 状态  |
| ------------------ | ------------------------------------------------------------------- | --- |
| 遥测拦截               | 1104 个 logEvent 调用点全部拦截                                             | 自动  |
| API Body 脱敏        | `metadata` 中 device_id/session_id/account_uuid 替换为合规格式固定值；第三方完全不发送  | 自动  |
| HTTP Header 脱敏     | X-Claude-Code-Session-Id 替换为固定 UUID；第三方不发送 x-app/session-id         | 自动  |
| Datadog 拦截         | `trackDatadogEvent` + `initializeDatadog` 默认拦截（由 `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` 控制）                      | 自动  |
| BigQuery 拦截        | `doExport` 默认拦截，不向 `api.anthropic.com/api/claude_code/metrics` 发送数据（由同一环境变量控制） | 自动  |
| 1P Event Logger 脱敏 | userId/email/org 替换为固定脱敏值（`cc4all@gmail.com`）                       | 自动  |
| GrowthBook 脱敏      | 用户属性 id/deviceID/sessionId 替换为固定值，移除 org/account/email              | 自动  |
| UA 规范化             | 精简为 `claude-code/{version}`，不泄露设备信息                                 | 自动  |
| 独立存储               | `~/.pandacc/` 独立空间，不与原版 claude 混用                                   | 自动  |
| OAuth              | 隐私模式下不额外请求 Profile                                                  | 自动  |

查看当前隐私状态：`/privacy`

</details>

### 6.2 系统授权与数据解密指南

<details>
<summary>展开查看各平台授权步骤</summary>

超级助手的部分高级感知能力需要**系统级权限授权**或**数据解密操作**。以下按平台分别说明。所有操作均为**一次性**，授权后永久生效。

#### macOS 系统授权

**1. 通知中心感知（Full Disk Access）**

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

**2. 日历/通讯录/邮件读取**

首次读取时 macOS 会弹出系统授权对话框，点击"允许"即可：

| 数据 | 触发场景 | 授权方式 |
|------|---------|---------|
| 日历 | `calendar-reminder`、会议提醒 | AppleScript 首次调用时系统弹窗授权 |
| 通讯录 | `contact-birthday` | AppleScript 首次调用时系统弹窗授权 |
| 邮件 | `email-*` 系列场景 | Mail.app SQLite 需 FDA（同上第 1 步） |
| Apple Notes | `notes-digest` | Apple Notes SQLite 需 FDA |

**3. 微信本地数据库解密（可选，高级）**

微信 4.x 的本地数据库使用 **SQLCipher 4** 加密。如需读取聊天记录、通讯录等数据，需要提取解密密钥。

> ⚠️ **风险说明**：此操作涉及从微信进程内存中提取加密密钥，属于灰色地带。仅限用户本机使用，数据不出设备。

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

**前置条件**：
- macOS arm64 + 微信 4.x
- 需要**禁用 SIP**（System Integrity Protection）：重启 → 恢复模式 → `csrutil disable`

**解密步骤**：

1. **安装依赖**：
   ```bash
   brew install llvm sqlcipher
   ```

2. **克隆解密工具**：
   ```bash
   git clone https://github.com/Thearas/wechat-db-decrypt-macos.git
   cd wechat-db-decrypt-macos
   ```

3. **提取密钥**（微信需保持登录运行）：
   ```bash
   PYTHONPATH=$(lldb -P) python3 find_key_memscan.py
   ```
   > 通过 lldb 扫描微信进程内存，输出 `wechat_keys.json`（每个 db 独立密钥）。

4. **解密数据库**：
   ```bash
   python3 decrypt_db.py
   ```

5. **导出聊天记录**（可选，验证解密成功）：
   ```bash
   # 列出所有会话
   python3 export_messages.py

   # 导出指定联系人聊天（支持模糊匹配）
   python3 export_messages.py -c "联系人名"

   # 搜索关键词
   python3 export_messages.py -s "关键词"

   # 导出最近 N 条
   python3 export_messages.py -c "联系人名" -n 50

   # 导出全部
   python3 export_messages.py --all
   ```

6. **集成到 Panda**：
   ```json
   // ~/.pandacc/config/connectors.json
   {
     "wechat": {
       "enabled": true,
       "mode": "local-db",
       "keysFile": "/绝对路径/wechat_keys.json"
     }
   }
   ```

7. **启用场景**：
   ```json
   // ~/.pandacc/config/proactive.json
   { "enabledScenarios": { "wechat-messages": true, "wechat-daily-situational": true } }
   ```

8. **使用**：
   ```
   /wechat sessions          — 最近会话
   /wechat chat 张三          — 聊天记录
   /wechat search 合同        — 跨会话搜索
   /wechat contacts 李四      — 联系人搜索
   ```

   > 微信数据已原生整合到 Panda，无需 Python/fastmcp/MCP Server。

9. **验证**：
   ```bash
   sqlcipher --version    # 确认 sqlcipher 已安装
   panda                  # 启动后使用 /wechat sessions 查看最近会话
   ```

> **⚠️ 安全提醒**：
> - 禁用 SIP 会降低系统安全性，提取密钥后建议重新启用：`csrutil enable`
> - `wechat_keys.json` 包含解密密钥，请 `chmod 600` 并勿上传到 Git
> - 所有数据仅在本机处理，不上传任何服务器

#### Windows 系统授权

**1. 通知中心感知**

Windows 通知数据库无需特殊权限，位于当前用户目录下可直接读取：

```
%LOCALAPPDATA%\Microsoft\Windows\Notifications\wpndatabase.db
```

**注意**：Windows 的通知在用户清除后**立即从数据库删除**。Panda 会每 5 分钟轮询捕获新通知并本地持久化，但无法恢复已清除的历史通知。

**2. 邮件/日历/通讯录**

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

**3. 微信本地数据库解密（Windows）**

Windows 微信数据库路径：
```
%APPDATA%\Tencent\WeChat\xwechat_files\{用户名}_{hash}\db_storage\
```

**解密步骤**：

1. **安装 sqlcipher**：
   ```powershell
   # 通过 choco 安装
   choco install sqlcipher
   # 或从 https://github.com/nicoleaucoin/sqlcipher-windows 下载预编译版
   ```

2. **安装解密工具并提取密钥**：
   ```powershell
   git clone https://github.com/ylytdeng/wechat-decrypt.git
   cd wechat-decrypt
   pip install -r requirements.txt
   python main.py
   ```
   > 需要微信保持运行。工具输出 `wechat_keys.json`（per-db 独立密钥）。

3. **配置**：同 macOS，在 `connectors.json` 中设置 `wechat.keysFile` 指向 `wechat_keys.json` 绝对路径。

#### Linux

- **通知**：通过 D-Bus 实时监听（`org.freedesktop.Notifications`），无需特殊权限
- **微信**：Linux 版微信功能有限，建议使用企业微信 API 或 Webhook 方案
- **邮件**：通过 IMAP 协议配置（写入 connectors.json）

#### IM 平台授权

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

Panda 会自动从 macOS Keychain / Windows Credential Manager / Linux Secret Service 读取。

</details>

---

## 7. 跨平台支持

| 平台      | 状态   | 说明                                  |
| ------- | ---- | ----------------------------------- |
| macOS   | 完整支持 | Keychain 存储、osascript 集成            |
| Windows | 完整支持 | PowerShell 自动检测、git-bash Shell、路径转换 |
| Linux   | 完整支持 | 标准 POSIX 环境                         |
| WSL     | 完整支持 | 自动检测 WSL 环境                         |

---

## 8. 命令使用手册

> 覆盖 **113 个命令**，含智能助理、IM 连接器、103 主动推送场景等全部能力。

<details>
<summary>展开查看完整手册（85+ 命令）</summary>

### 命令状态图例

| 标记 | 含义 |
|------|------|
| ✅ | 已验证正常工作 |
| ✅ | v2.5 新增/增强 |
| 🔒 | 需要特定认证（Claude.ai 订阅/消费者账户） |
| ⚠️ | 功能受限或有已知问题 |
| 🔧 | 需要特定环境（Feature Flag / 硬件 / 平台） |
| 🚫 | 存根/内部命令，不可用 |

### 速查表（按使用频率排列）

#### 每日必用

| 命令 | 别名 | 一句话说明 | 状态 |
|------|------|-----------|------|
| `/help` | | 显示帮助和快捷键 | ✅ |
| `/clear` | `/reset` `/new` | 清空对话，开始新会话 | ✅ |
| `/compact` | | 压缩历史保留摘要，释放上下文 | ✅ |
| `/model` | | 切换模型（Opus/Sonnet/Haiku） | ✅ |
| `/diff` | | 查看未提交变更和每轮代码差异 | ✅ |
| `/commit` | | 智能生成 commit message 并提交 | ✅ |
| `/dream` <sub>· Skill</sub> | | 记忆整合 — 四阶段巩固（Skill 形态，Skill tool 调用） | ✅ |
| `/exit` | `/quit` | 退出 REPL | ✅ |

#### 高频使用

| 命令 | 别名 | 一句话说明 | 状态 |
|------|------|-----------|------|
| `/plan` | | 启用计划模式（先想后做） | ✅ |
| `/effort` | | 调节推理深度 (low/medium/high/max/auto) | ✅ |
| `/copy` | | 复制最后回复到剪贴板 | ✅ |
| `/config` | `/settings` | 打开配置面板 | ✅ |
| `/resume` | `/continue` | 恢复历史对话 | ✅ |
| `/assistant` | | 启用 KAIROS 助手 + 主动引擎 | ✅ |
| `/proactive` | | 切换主动自主模式 | ✅ |
| `/context` | | 可视化上下文使用情况 | ✅ |

#### v2.5 新增

| 命令 | 别名 | 一句话说明 | 状态 |
|------|------|-----------|------|
| `/write` | | 写作助理 — 大纲生成/文稿编译 | ✅ |
| `/capture` | | 快速捕获想法到工作目录 | ✅ |
| `/learn` | | 学习助理 — 闪卡/复习/学习路径 | ✅ |
| `/wechat` | | 微信数据查询 — 会话/聊天/搜索/联系人 | ✅ |

### 一、基础控制命令

#### `/help`
- **用法**: `/help`
- **说明**: 显示交互式帮助界面，包含所有可用命令和快捷键
- **实测**: ✅ 显示帮助信息

#### `/exit` (别名: `/quit`)
- **用法**: `/exit`
- **说明**: 退出 REPL，等同于按 `Ctrl+D`

#### `/clear` (别名: `/reset`, `/new`)
- **用法**: `/clear`
- **说明**: 清除对话历史并释放上下文，相当于开始新对话
- **技巧**: 对话过长导致回复质量下降时使用

#### `/version`
- **用法**: `/version`
- **说明**: 显示当前版本和构建时间
- **实测**: ✅ 输出当前版本号

#### `/status`
- **用法**: `/status`
- **说明**: 显示完整状态信息（版本、Session ID、工作目录、模型、认证方式、API URL）
- **技巧**: 排查问题时首先运行此命令

### 二、对话管理命令

#### `/compact`
- **用法**: `/compact [自定义摘要指令]`
- **说明**: 压缩对话历史但保留摘要在上下文中
- **技巧**:
  - 上下文接近满时自动提醒，此时用 `/compact` 可继续长任务
  - 可传自定义指令：`/compact 重点保留架构决策和代码路径`

#### `/copy`
- **用法**: `/copy [N]`
- **说明**: 复制最后一条回复到系统剪贴板，`/copy 3` 复制倒数第3条

#### `/export`
- **用法**: `/export [filename]`
- **说明**: 导出当前对话到文件或剪贴板（JSON/Markdown/剪贴板）

#### `/resume` (别名: `/continue`)
- **用法**: `/resume [conversation_id 或搜索词]`
- **说明**: 从历史会话中搜索并恢复
- **技巧**: 可用关键词搜索历史会话，如 `/resume 修复bug`

#### `/branch` (别名: `/fork` [条件性])
- **用法**: `/branch [name]`
- **说明**: 在当前对话节点创建分支，探索不同方案

#### `/rewind` (别名: `/checkpoint`)
- **用法**: `/rewind`
- **说明**: 将代码和/或对话回退到之前的节点
- **技巧**: AI 改错了代码？`/rewind` 立即回退

#### `/tag`
- **用法**: `/tag <tag-name>`
- **说明**: 为当前会话添加/移除可搜索标签

#### `/rename`
- **用法**: `/rename [name]`
- **说明**: 重命名当前对话

#### `/btw`
- **用法**: `/btw <问题>`
- **说明**: 快速插问，不打断主对话上下文

### 三、代码操作命令

#### `/commit`
- **用法**: `/commit`
- **说明**: 分析 git diff，自动生成符合项目风格的 commit message 并提交
- **技巧**: Undercover 模式下自动屏蔽内部信息

#### `/commit-push-pr` (别名: `/cpp`)
- **用法**: `/commit-push-pr`
- **说明**: 一键完成 commit → push → 创建 PR

#### `/diff`
- **用法**: `/diff`
- **说明**: 显示 `git diff HEAD` 和每轮对话的代码变更

#### `/review`
- **用法**: `/review [PR number]`
- **说明**: 审查 Pull Request，无 PR 编号时列出 open PRs

#### `/pr-comments` (别名: `/pr_comments`)
- **用法**: `/pr-comments [PR number]`
- **说明**: 获取 GitHub PR 的所有评论并总结

#### `/security-review`
- **用法**: `/security-review`
- **说明**: 对待提交变更做安全审查
- **技巧**: 上线前必做，检查 XSS/注入/敏感信息泄露

#### `/ultrareview`
- **用法**: `/ultrareview`
- **说明**: 深度审查（约 10-20 分钟），自动化 bug 查找

### 四、模型与推理命令

#### `/model`
- **用法**: `/model [model_name]`
- **说明**: 切换 AI 模型
- **可选**: `opus`（最强）、`sonnet`（日常推荐）、`haiku`（最快）
- **技巧**: 复杂架构设计用 Opus，日常编码用 Sonnet，快速查询用 Haiku

#### `/effort`
- **用法**: `/effort [low|medium|high|max|auto]`
- **说明**: 调节模型推理深度
- **技巧**: 简单任务用 `low` 节省 token

#### `/fast`
- **用法**: `/fast [on|off]`
- **说明**: 切换高速模式（Opus 4.6 专用）
- **条件**: 🔒 需要 Claude.ai 订阅

#### `/advisor`
- **用法**: `/advisor [model_name]`
- **说明**: 配置顾问模型（辅助主模型决策）

#### `/torch`
- **用法**: `/torch`
- **说明**: Torch 模式 — 增强模型推理过程可见性

### 五、配置设置命令

#### `/config` (别名: `/settings`)
- **用法**: `/config`
- **说明**: 打开交互式配置面板

<a id="theme"></a>
#### `/theme`
- **用法**: `/theme`
- **说明**: 选择终端配色主题

##### 🎨 Matrix 主题（v2.11.3+ · 黑客帝国风）

**启用方式**（env 变量 opt-in，不影响默认主题）：

```bash
# macOS / Linux — 一次性启用
PANDA_THEME=matrix panda

# macOS / Linux — 写入 shell config 永久启用
echo 'export PANDA_THEME=matrix' >> ~/.zshrc   # zsh
echo 'export PANDA_THEME=matrix' >> ~/.bashrc  # bash

# Windows — 一次性启用
set PANDA_THEME=matrix && panda

# Windows — 永久启用（PowerShell）
[System.Environment]::SetEnvironmentVariable('PANDA_THEME', 'matrix', 'User')

# Windows — 永久启用（cmd.exe）
setx PANDA_THEME matrix
```

**视觉元素**：

| 元素 | 效果 |
|---|---|
| **启动屏**（~5.5 秒） | 上下字符雨（katakana / 数字 / 符号）+ Panda Logo 淡入 + "〔 W A K E   U P,   N E O … 〕" 打字机逐字显示 + 1.2 秒停留 |
| **Spinner** | 14 帧密集 braille `⠁⠃⠇⡇⡏⡟⡿⣿`，Matrix 经典绿 `#00ff41` |
| **输入框** | 圆角绿色边框 |
| **状态栏** | 双线绿框（需配置 `statusLine` hook 才渲染） |
| **消息区** | **保持默认清爽留白，零装饰**（对阅读零干扰） |

**跳过启动屏**：任意时刻按 `⏎` 或 `Esc` 立即进入 REPL。

**关闭主题**：

```bash
# macOS / Linux
unset PANDA_THEME          # 当前 shell
PANDA_THEME= panda          # 仅本次启动

# Windows (cmd.exe)
set PANDA_THEME= && panda

# Windows (PowerShell)
$env:PANDA_THEME = ''; panda
```

**设计哲学**：Matrix 感由三层极轻装饰提供（启动屏冲击 + 输入框常驻识别 + Spinner 动态识别），对话内容区保持与默认主题完全相同的阅读体验，实现"酷炫 ≠ 干扰阅读"的平衡。

**零回归**：默认仍是 `dark` / `light` 主题，必须显式 `PANDA_THEME=matrix` 才启用。关闭后所有 UI 字节等价默认主题。

##### 🪟 Windows 终端适配（v2.18.0+）

Panda 自动检测 Windows 终端类型并适配渲染能力：

| 终端 | True Color | Unicode | 字符雨 | 检测方式 |
|------|:---:|:---:|--------|----------|
| **Windows Terminal** | ✅ | ✅ | 完整体验（片假名+符号） | `WT_SESSION` 环境变量 |
| **VS Code 集成终端** | ✅ | ✅ | 完整体验 | `TERM_PROGRAM=vscode` |
| **Git Bash / mintty** | ✅ | ✅ | 完整体验 | `TERM_PROGRAM=mintty` 或 `MSYSTEM` |
| **conhost** (cmd.exe / 旧版 PS) | ⚠️ | ❌ | 自动降级：ASCII 字符集、15fps、低密度 | fallback |

> **推荐**：Windows 用户使用 [Windows Terminal](https://aka.ms/terminal) 以获得最佳体验。conhost 下字符雨会自动切换为 ASCII 模式避免乱码。

#### `/color`
- **用法**: `/color <color|default>`
- **说明**: 设置本次会话提示栏颜色
- **技巧**: 多窗口工作时用不同颜色区分

#### `/vim`
- **用法**: `/vim`
- **说明**: 切换 Vim/普通编辑模式

#### `/keybindings`
- **用法**: `/keybindings`
- **说明**: 打开快捷键配置文件

#### `/language`
- **用法**: `/language [en|zh|...]`
- **说明**: 切换界面语言

#### `/persona`
- **用法**: `/persona [模式]`
- **说明**: 切换人格模式
- **模式**: `work`（专业）、`companion`（陪伴）、`study`（学习）、`creative`（创意）、`butler`（管家）
- **Sense Pipeline 联动**: auto 模式下根据时间/mood/活动自动切换

#### `/privacy`
- **用法**: `/privacy`
- **说明**: 查看隐私状态

#### `/sandbox`
- **用法**: `/sandbox`
- **说明**: 配置 Bash 命令沙盒模式

#### `/statusline`
- **用法**: `/statusline`
- **说明**: 设置状态栏 UI 显示

### 六、工具与权限命令

#### `/permissions` (别名: `/allowed-tools`)
- **用法**: `/permissions`
- **说明**: 管理 Allow/Ask/Deny 工具权限规则
- **技巧**: 可配置 Bash 正则，如允许 `git *` 但拒绝 `rm -rf *`

#### `/mcp`
- **用法**: `/mcp [enable|disable server-name]`
- **说明**: 管理 MCP 服务器扩展
- MCP 工具结果上限提升至 **500K 字符**（原 100K）

#### `/hooks`
- **用法**: `/hooks`
- **说明**: 查看工具事件钩子配置

#### `/tasks` (别名: `/bashes`)
- **用法**: `/tasks`
- **说明**: 列出和管理后台任务

### 七、超级助手系统（v2.5 智能助理）

#### `/dream` <sub>· Skill 形态</sub>- **用法**: 通过 Skill tool 调用 `dream`（与 slash 命令同名）
- **说明**: 手动触发记忆整合 — 四阶段流程
- **四阶段**: Harvest(采集) → Understand(理解) → Consolidate(整合) → Anticipate(预判)
- **后台 cron**: 每天 22:00 自动执行（需启用 `/proactive` 或 `/night-mode`）
- **技巧**:
  - 手动 `/dream` 后自动重置 24h 冷却门控
  - 包含情绪记忆扫描
  - MEMORY.md 保持 ≤200 行 / 25KB

#### `/assistant`- **用法**: `/assistant`
- **说明**: 启用 KAIROS 助手模式 — 激活主动引擎 + 定时任务
- **效果**:
  - `isAssistantMode()` 返回 true
  - 自动激活 `/proactive` 引擎
  - 启动 builtinTasks（dream/briefing/health）
- **技巧**: 长时间工作时开启，AI 会在空闲时自动整理记忆

#### `/proactive`- **用法**: `/proactive [on|off]`
- **说明**: 切换主动自主模式 — v2.5 扩展为 **103 个主动推送场景**
- **核心内置任务**:
  - `dream-consolidate` — 22:00 自动记忆整合（调用 autoDream）
  - `morning-briefing` — 07:00 设置晨间简报 pending flag
  - `code-health` — 23:00 设置健康检查 pending flag
- **v2.6 场景覆盖**: 系统健康(3) + 开发者(10) + 文件管理(6) + 个人生活(3) + 效率(4) + 高级系统(5) + 扩展(8) + 知识(8) + 生活(8) = **55 个非敏感场景**（默认开启）+ **30 个敏感场景**（含 14 个微信态势感知，需 `proactive.json` 显式开启）
- **技巧**: 配合 `/night-mode` 实现全天候自主工作；敏感场景配置详见本手册"七、主动推送系统"章节

#### `/night-mode`- **用法**: `/night-mode`
- **说明**: 夜间自主模式（22:00-06:00）
- **编排器**: 顺序执行启用任务，5 分钟节流，单任务失败不阻塞后续
- **技巧**: 适合离开电脑时让 AI 自动整理记忆和检查代码

#### `/buddy`
- **用法**: `/buddy [show|hide|mute|unmute|info|state|wake|sleep|theme]`
- **说明**: 编程伙伴 — 终端中的虚拟宠物（18 物种，12 态状态机驱动 sprite 帧切换 + StatusLine 1×5 字符 mini-pet）
- **子命令**:
  - `show` / `hide` — 切换显示
  - `mute` / `unmute` — 静音不影响显示
  - `info` — 查看物种 / 名字 / 稀有度
  - `state <name>` — 手动覆盖状态 5s（name ∈ error/notification/sweeping/attention/juggling/carrying/working/thinking/waking/idle/dozing/sleeping）
  - `wake` — 强制唤醒（清 sleeping/dozing）
  - `sleep` — 强制 60s 睡眠
  - `theme <species>` — 切换物种（duck / goose / blob / cat / dragon / octopus / owl / penguin / turtle / snail / ghost / axolotl / capybara / cactus / robot / rabbit / mushroom / chonk）
  - 旧 alias 向后兼容：`theme panda` → `chonk` 圆胖治愈系；`theme redPanda` → `cat` 小型灵巧；`theme kungFuPanda` → `robot` 机械武术（v2.21.27-29 panda 系实装因画布太小退役）
- **示例**: `/buddy state working` `/buddy theme robot`

##### panda-on-desk · 桌面 GUI 增强（v1.0 GA · 子产品）

> **panda-on-desk** 是 `/buddy` 的桌面端 GUI 兄弟产品 — 基于 Electron 41 的 透明 overlay 浮窗 + 宠物养成可视化 + 通知聚合。
> panda CLI（Ink TUI）依然是主体验，panda-on-desk 是**可选增强**：CLI 不依赖 GUI 即可独立运行。

| 维度 | 说明 |
|------|------|
| 子包路径 | `packages/panda-on-desk/`（panda monorepo 子包） |
| 源码协议 | Apache-2.0（基于 [clawd-on-desk](https://github.com/rullerzhou-afk/clawd-on-desk) MIT 81% 吸收 + 改造 fork） |
| 平台 | macOS (dmg / zip · Intel + Apple Silicon) · Windows (NSIS x64) · Linux (AppImage / deb x64) |
| 与 CLI 通信 | 本地 HTTP `127.0.0.1:1455+` + SSE 订阅 `~/.config/panda/runtime.json` 信号 |
| 9 子模块 | main · preload · renderer · bridge · state · theme · platform · i18n · updater |

**安装方式**

```bash
# 方式 1：GitHub Release 下载（推荐）
# 访问 https://github.com/lc2panda/panda/releases?q=desk-v
# - macOS：下载 panda-on-desk-X.Y.Z-mac.dmg → 双击安装
# - Windows：下载 panda-on-desk-X.Y.Z-Setup.exe → 双击安装
# - Linux：下载 panda-on-desk-X.Y.Z.AppImage → chmod +x 后运行

# 方式 2：源码运行（开发者）
cd packages/panda-on-desk
bun install
bun start                        # === node launch.cjs（spawn electron GUI 模式）
```

**与 panda CLI 的关系**

```
panda CLI（authoritative）        ──HTTP/SSE─▶        panda-on-desk（reactive）
  Ink TUI + PetState 12 态状态机                          Electron GUI overlay
  103 主动场景 + StatusLine mini-pet  ◀──ack/op──        宠物可视化 + 通知聚合
```

详见子包 [packages/panda-on-desk/README.md](./packages/panda-on-desk/README.md)。

#### `/brief`
- **用法**: `/brief [on|off]`
- **说明**: 简报模式 — AI 只输出简洁摘要

#### `/write`- **用法**: `/write outline <topic>` / `/write compile <dir>`
- **说明**: 写作助理 — 生成大纲或编译 Markdown 写作项目
- **示例**:
  - `/write outline "AI个人助理的未来"` — 生成结构化大纲
  - `/write compile ~/manuscript/` — 编译目录下所有 Markdown 为统一文稿

#### `/capture`- **用法**: `/capture <text>`
- **说明**: 快速捕获想法到 `working/inbox/` 目录，自动按 PARA 方法论分类
- **示例**: `/capture "想到一个架构思路：用事件驱动替代轮询"`

#### `/learn`- **用法**: `/learn from <file>` / `/learn review` / `/learn plan <topic>`
- **说明**: 学习助理 — 从文件生成闪卡、间隔重复复习（FSRS 算法）、学习路径规划
- **示例**:
  - `/learn from paper.pdf` — 从 PDF 提取知识点生成闪卡
  - `/learn review` — 开始间隔重复复习
  - `/learn plan "学习 Rust"` — 生成学习路径

#### 主动推送系统（v2.5 新增 — 103 场景）

v2.5 将主动推送从 3 个内置任务扩展为 **103 个场景**，分为非敏感（默认开启）和敏感（默认关闭）两类。

**非敏感场景（默认开启）**

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

**敏感场景（默认关闭，需 proactive.json 开启）**

| 分类 | 场景数 | 需要的授权 |
|------|--------|-----------|
| 通知中心 | 3 | macOS 需 FDA（完全磁盘访问权限） |
| 邮件 | 4 | macOS 需 FDA / Windows Outlook |
| 通讯录 | 1 | macOS AppleScript 授权 |
| IM 聚合 | 6 | 需配置 `connectors.json` |
| 浏览器/笔记/屏幕 | 6 | 部分需 FDA |
| 微信态势感知 | 14 | 需配置 `connectors.json` 微信密钥 |

**激活方式**

```
/proactive        # 激活主动推送
/assistant        # 激活完整助手模式（含主动+KAIROS）
/night-mode       # 夜间自主模式（22:00-06:00）
```

- **技巧**: 配置文件 `~/.pandacc/config/proactive.json` 可自定义所有阈值和敏感场景开关，详见 [1.4 配置参考](#14-配置参考)。

#### IM Connector 系统（v2.5 新增 — 6 平台）

v2.5 新增跨平台 IM 连接器，支持 6 个主流通讯平台：

| 平台 | 模式 | 说明 |
|------|------|------|
| 飞书 | MCP / API | 需 App ID/Secret，推荐 MCP 模式 |
| 钉钉 | MCP / API | 需 App Key/Secret，支持日历/任务/通知模块 |
| Slack | API | 需 Bot Token（`xoxb-xxx`）或 `SLACK_TOKEN` 环境变量 |
| 微信 | 企业微信 API / 本地 DB | 企微需 Corp ID；本地 DB 需 macOS + `brew install sqlcipher` + 微信 db 密钥 <sub>· experimental</sub> |
| Telegram | API | 需 @BotFather 获取的 Bot Token |
| Teams | API | 需 Azure AD Tenant ID + Client ID/Secret |

- **配置**: 编辑 `~/.pandacc/config/connectors.json`，详见 [1.4 配置参考 → connectors.json](#connectorsjson--im-平台连接器)
- **关联场景**: 配置连接器后可启用 `im-unread-digest`、`im-daily-brief`、`im-calendar-sync`、`im-approval-alert`、`im-document-update`、`im-reverse-push` 等 6 个 IM 聚合场景

#### Mood 检测（自动）
- **无需命令** — 每条用户消息自动分析情绪
- **6 类情绪**: neutral / focused / frustrated / curious / satisfied / urgent
- **中英双语**: 支持中英文关键词匹配
- **5 分钟衰减**: 无强信号时自动回归 neutral
- **联动**: persona 自动切换 + dream 上下文注入

#### Memory 持久化（自动）
- **emotionalMemory**: 情绪事件记录，JSON 持久化，LRU 100 条
- **workingMemory**: 键值对工作记忆，JSON 持久化，LRU 50 条，TTL 24h
- **存储路径**: `~/.pandacc/assistant/emotional-memory.json` / `working-memory.json`

### 八、Agent 与协作

#### `/agents`
- **用法**: `/agents`
- **说明**: 管理自定义 Agent 配置

#### `/plan`
- **用法**: `/plan [open|描述]`
- **说明**: 启用计划模式
- **技巧**: 强烈推荐复杂任务先用计划模式

#### `/fork`
- **用法**: `/fork <任务描述>`
- **说明**: 派生后台子 Agent 并行执行

#### `/workflows`
- **用法**: `/workflows`
- **说明**: 列出和管理工作流脚本

#### `/skills`
- **用法**: `/skills`
- **说明**: 列出所有可用技能

#### Coordinator 多 Agent 模式
- **启用**: `CLAUDE_CODE_COORDINATOR_MODE=1`
- **说明**: 多智能体协作模式，自动分配 worker agent
- **Worker**: 具有完整工具权限的通用 worker

#### Multi-Model Agent Routing
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

### 九、插件与扩展

#### `/plugin` (别名: `/plugins`, `/marketplace`)
- **用法**: `/plugin`
- **说明**: 浏览、安装、配置插件市场（138+ 插件）

#### `/reload-plugins`
- **用法**: `/reload-plugins`
- **说明**: 热重载插件变更，无需重启

### 十、信息查询命令

#### `/context`
- **用法**: `/context`
- **说明**: 以彩色网格可视化上下文使用情况

#### `/files`
- **用法**: `/files`
- **说明**: 列出当前上下文中的所有文件

#### `/doctor`
- **用法**: `/doctor`
- **说明**: 诊断并验证安装和配置
- **技巧**: 排障首选

#### `/cost`
- **用法**: `/cost`
- **说明**: 显示当前会话总花费和持续时间

#### `/usage`
- **用法**: `/usage`
- **说明**: 显示套餐用量限额

#### `/stats`
- **用法**: `/stats`
- **说明**: 显示使用统计（月度热力图 + token 统计）

#### `/insights`
- **用法**: `/insights`
- **说明**: 生成会话分析报告

#### `/memory`
- **用法**: `/memory`
- **说明**: 编辑记忆文件（auto-memory/project memory/user memory）

### 十一、远程与连接命令

#### `/remote-control` (别名: `/rc`)
- **用法**: `/remote-control`
- **说明**: 连接终端进行远程控制会话

#### `/session` (别名: `/remote`)
- **用法**: `/session`
- **说明**: 显示远程会话 URL 和二维码

#### `/mobile` (别名: `/ios`, `/android`)
- **用法**: `/mobile`
- **说明**: 显示移动应用下载二维码

#### `/desktop` (别名: `/app`)
- **用法**: `/desktop`
- **说明**: 在 Claude Desktop 中继续当前会话

#### `/chrome`
- **用法**: `/chrome`
- **说明**: Chrome 扩展设置 (Beta)

### 十二、初始化与安装

#### `/init`
- **用法**: `/init`
- **说明**: 初始化 CLAUDE.md 项目记忆文件
- **技巧**: 新项目首先运行

#### `/terminal-setup`
- **用法**: `/terminal-setup`
- **说明**: 安装 Shift+Enter 换行键绑定

#### `/release-notes`
- **用法**: `/release-notes`
- **说明**: 查看版本发布说明

#### `/add-dir`
- **用法**: `/add-dir <path>`
- **说明**: 添加新工作目录

### 十三、Ant-Only 高级命令

> 以下命令原为 Anthropic 内部专用，已在 Panda 中全部启用。

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

### 十四、不可用的存根命令

> 以下命令为平台限定功能，当前环境下不可用。

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

### 十六、Feature Flag 对照表

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
| `PROACTIVE_SCENARIOS` | 主动推送 103 场景 | ✅ 已启用 |
| `NOTIFICATION_CENTER` | 系统通知中心感知 | ✅ 已启用 |

### 十七、快捷键速查

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

### 十八、工作流建议

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

#### 常见问题

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

### 十九、能力总览

| 能力 | 说明 |
|------|------|
| DeepDream 记忆整合 | 后台记忆整合，22:00 自动执行 |
| 助手模式 | `/assistant` 激活完整主动引擎 |
| 情绪检测 | 每条消息自动分析 6 类情绪 + 多维信号 |
| 夜间任务链 | 顺序执行 + 错误隔离 + 5min 节流 |
| 五层记忆 | 情景/语义/程序/前瞻/工作记忆全链路 |
| 多 Agent 协调 | Coordinator 模式 + worker agent |
| 感知管道 | mood→persona→dream 全链路 |
| `/write` 写作助理 | 大纲生成 + Markdown 文稿编译 |
| `/capture` 快速捕获 | PARA 自动分类到 Projects/Areas/Resources/Archives |
| `/learn` 学习助理 | 闪卡生成 + FSRS 间隔重复 + 学习路径 |
| 主动推送 103 场景 | 8 大维度，56 非敏感 + 43 敏感场景 |
| IM Connector 6 平台 | 飞书/钉钉/Slack/微信/Telegram/Teams |
| 通知中心感知 | macOS/Windows，3 场景 |
| 微信全态势感知 | 14 场景，实时/日/周/月/季/年 6 维度 |
| 5 路通知推送 | 桌面/Webhook/Outbox/Connector/MCP 插件 |

</details>

---

> **此项目的任何功能、架构更新，必须在结束后同步更新相关文档。这是我们契约的一部分。**

---

*Panda — Your AI, Your Data, Your Life.*

💬 社区交流: [LINUX DO](https://linux.do/)
