# TODO

## 进行中 — v2.26.10 Desk Chat 历史对话只读加载热修（2026-05-25 16:55:25 +08:00）

- [x] 真实时间核验：本机 `2026-05-25 16:55:24 +08:00`，Cloudflare `2026-05-25 16:55:25 +08:00`，Apple `2026-05-25 16:55:25 +08:00`，最大偏差约 1 秒，判定通过。
- [x] 根因定位：打开历史对话时 `ActiveSession` 挂载会调用 `connectToSession()`，继而触发 `sessionStore.setActiveSession()` / `bridge.focusSession()`，导致只读历史加载也启动 CLI；非 UUID 历史 id 会触发 CLI code=1。
- [x] 修复策略：历史对话切换只更新 active id 并读取 `~/.pandacc/projects` 历史，不再 focus/spawn CLI；仅合法 UUID 会话才允许 focus 复活；后台空 session list 不再自动 re-materialise 历史 active id。
- [x] 验证：`cd packages/panda-desk-chat && bun run build:electron` 通过；`cd packages/panda-desk-chat && bun run test src/__tests__/stores/sessionStore.test.ts src/__tests__/stores/settingsStore.test.ts` 通过 12/12。
- [x] 重新打包 Desk Chat `0.2.5`：`bun run dist` 于 `2026-05-25 17:08:00 +08:00` 通过，生成 `Panda-0.2.5-arm64.dmg`、`Panda-0.2.5-arm64-mac.zip`、两个 blockmap 与 `latest-mac.yml`；资源核验 `panda-cli/dist/cli.js` 存在，`panda-cli/dist` 共 625 个文件。
- [x] 创建 GitHub Release `v2.26.10` 并上传安装包：`latest-mac.yml`、`Panda-0.2.5-arm64.dmg`、`Panda-0.2.5-arm64-mac.zip`、两个 blockmap 已上传，Release URL `https://github.com/lc2panda/panda/releases/tag/v2.26.10`。
- [x] git push 与 npm 同步：`main` 与 tag `v2.26.10` 已推送；`@lc2panda/panda-code@2.26.10` 已发布到 GitHub Packages，`npm view` 返回 `2.26.10`。

## 已完成 — v2.26.9 Desk Chat 历史会话续聊热修（2026-05-25 16:22:20 +08:00）

- [x] 真实时间核验：本机 `2026-05-25 16:22:18 +08:00`，Cloudflare `2026-05-25 16:22:19 +08:00`，Apple `2026-05-25 16:22:20 +08:00`，最大偏差约 2 秒，判定通过。
- [x] 根因复现：非 UUID 历史 `sessionId` 传给 packaged CLI 会报 `Error: Invalid session ID. Must be a valid UUID.` 并以 code=1 退出；UUID + `--permission-mode bypassPermissions` 可真实返回 `pong`。
- [x] 修复历史续聊：Desk Chat 在非 UUID 历史会话中发送消息时自动创建新的 UUID 会话，保留当前 UI 历史消息并替换当前 tab，再把新消息发到新会话。
- [x] 修复权限模式：renderer 迁移旧 `skip/dontAsk`，IPC 将 `auto` 映射为 CLI 稳定支持的 `default`；backend 白名单兜底未知权限模式，避免非法 `--permission-mode` 触发 code=1。
- [x] 验证：`cd packages/panda-desk-chat && bun run build:electron` 通过；`cd packages/panda-desk-chat && bun run test src/__tests__/stores/settingsStore.test.ts` 通过 6/6；packaged CLI UUID + `bypassPermissions` 真实返回 `pong`。
- [x] 重新打包 Desk Chat `0.2.4`：`bun run dist` 于 `2026-05-25 16:40:00 +08:00` 通过，生成 `Panda-0.2.4-arm64.dmg`、`Panda-0.2.4-arm64-mac.zip`、两个 blockmap 与 `latest-mac.yml`；资源核验 `panda-cli/dist/cli.js` 存在，`panda-cli/dist` 共 625 个文件。
- [x] 创建 GitHub Release `v2.26.9` 并上传安装包：`latest-mac.yml`、`Panda-0.2.4-arm64.dmg`、`Panda-0.2.4-arm64-mac.zip`、两个 blockmap 已上传，Release URL `https://github.com/lc2panda/panda/releases/tag/v2.26.9`。
- [x] git push 与 npm 同步：`main` 与 tag `v2.26.9` 已推送；`@lc2panda/panda-code@2.26.9` 已发布到 GitHub Packages，`npm view` 返回 `2.26.9`。

## 已完成 — v2.26.8 Desk Chat Release 热修（2026-05-25 15:47:20 +08:00）

- [x] 真实时间核验：本机 `2026-05-25 15:47:20 +08:00`，Apple `2026-05-25 15:47:21 +08:00`，Cloudflare `2026-05-25 15:47:21 +08:00`，最大偏差约 1 秒，判定通过。
- [x] 截图报错根因定位：已安装 `/Applications/Panda.app/Contents/Resources/` 与本地打包 app 均只有 `app.asar`，缺少 `dist/cli.js`；Desk Chat packaged 后端查找 `process.resourcesPath/dist/cli.js`，导致发送消息时报 `Module not found`。
- [x] 修复策略：打包时复制根 `dist/**/*` 到 `Resources/panda-cli/dist/`，并让 `cli-manager.ts` 优先查找 `panda-cli/dist/cli.js`，保留旧 `Resources/dist/cli.js` fallback。
- [x] 模型核对：当前截图中的 `Claude Opus 4.7`、`Claude Sonnet 4.6`、`claude-haiku-4-5` 与 `src/utils/model/configs.ts` 的 firstParty 模型源对齐；UI 的 `Custom Provider` 展示来自 CLI provider snapshot，不另造模型。
- [x] README：`1.1.1 Panda Desk Chat（UI 桌面端）— 下载、安装与使用` 已简化为 GitHub Releases latest 下载入口，不再提供 UI 源码安装说明。
- [x] 重新打包 Desk Chat `0.2.3`，验证 `Resources/panda-cli/dist/cli.js` 与 chunks 存在；`bun run dist` 于 `2026-05-25 15:59:32 +08:00` 通过，生成 `Panda-0.2.3-arm64.dmg` 与 `Panda-0.2.3-arm64-mac.zip`。
- [x] 创建 GitHub Release `v2.26.8` 并上传 Desk Chat 安装包：`Panda-0.2.3-arm64.dmg`、`Panda-0.2.3-arm64-mac.zip`、两个 blockmap 与 `latest-mac.yml` 已上传。
- [x] git push 与 npm 同步：`main`、tag `v2.26.8` 已推送；`@lc2panda/panda-code@2.26.8` 已发布到 GitHub Packages。

## 已完成 — v2.26.7 Desk Chat 发布入口与桌面端修补（2026-05-25 10:35:46 +08:00）

- [x] 真实时间核验：本机 `2026-05-25 10:35:44 +08:00`，Apple `2026-05-25 10:35:45 +08:00`，Cloudflare `2026-05-25 10:35:46 +08:00`，最大偏差约 2 秒，判定通过。
- [x] git 历史/框架源码审计：确认 `panda-on-desk` 为历史桌宠线，`panda-desk-chat@0.2.2` 为当前 UI 桌面端；当前 main/panda/main 为 `98eb2b6`。
- [x] 权威资料检索：Electron drag region / IPC、npm README 发布机制、Node `process.env` 环境变量读取均已纳入证据。
- [x] README：将 `1.1.1 桌面宠物（panda-on-desk）— 两种装法` 替换为 Panda Desk Chat UI 桌面端下载、安装与使用；桌宠降级为历史归档，不再作为用户下载入口。
- [x] CLI 启动：移除 `[panda] 桌面宠物未安装。跑 \`panda --install-desk\` 启用 ✨` 提示/校验。
- [x] Desk Chat：修复输入后长期 `Thinking...` 的错误/退出/stream 兜底回写。
- [x] Desk Chat：修复 `设置 - 服务商` 为空，展示 CLI 的环境变量、`auth login`、`settings.json` 配置快照，并修复模型设置 IPC payload 错位。
- [x] Desk Chat：修复顶部空白区域不可拖动窗口，避免破坏 tab 点击/关闭/右键/重排。
- [x] 验证：单元/集成/桌面端构建或可替代验证完成后记录命令与结果。
- [x] git：完成文档与代码变更提交，保留可追溯提交信息。
- [x] 桌面端重新打包：`cd packages/panda-desk-chat && bun run dist` 于 `2026-05-25 15:35:56 +08:00` 通过，生成 macOS arm64 `Panda-0.2.2-arm64.dmg` 与 `Panda-0.2.2-arm64-mac.zip`；notarization 因未配置 `notarize` 选项被 electron-builder 跳过。
- [x] 远端同步：`git push panda main` 于 `2026-05-25 15:32:00 +08:00` 成功，`main` 推至 `panda/main`。
- [x] GitHub Packages：`npm publish --registry=https://npm.pkg.github.com` 于 `2026-05-25 15:33:00 +08:00` 成功发布 `@lc2panda/panda-code@2.26.7`；`npm view @lc2panda/panda-code@2.26.7 version --registry=https://npm.pkg.github.com` 返回 `2.26.7`。
- 验证记录（2026-05-25 14:32:38 +08:00）：`bun run build:electron` 通过；`bun run test` 失败于既有 `localStorage.getItem` 测试环境与 `tabStore` 旧断言基线；`bun test src/desk/launcher.test.ts src/desk/launcher.integration.test.ts src/desk/e2e-install-spawn.test.ts` 通过 launcher/launcher.integration，失败于 `e2e-install-spawn.test.ts:355` 的 tmpdir 路径既有断言；`rg` 确认 README 不再保留旧强安装入口或启动提示。

## 已完成 ✅

### Packages
- [x] `url-handler-napi` — URL 处理 NAPI 模块 (签名修正，保持 null fallback)
- [x] `modifiers-napi` — 修饰键检测 NAPI 模块 (Bun FFI + Carbon)
- [x] `audio-capture-napi` — 音频捕获 NAPI 模块 (SoX/arecord)
- [x] `color-diff-napi` — 颜色差异计算 NAPI 模块 (纯 TS 实现)
- [x] `image-processor-napi` — 图像处理 NAPI 模块 (sharp + osascript 剪贴板)
- [x] `@ant/computer-use-swift` — Computer Use Swift 原生模块 (macOS JXA/screencapture 实现)
- [x] `@ant/computer-use-mcp` — Computer Use MCP 服务 (类型安全 stub + sentinel apps + targetImageSize)
- [x] `@ant/computer-use-input` — Computer Use 输入模块 (macOS AppleScript/JXA 实现)

### 工程化能力
- [x] 代码格式化与校验
- [x] 冗余代码检查
- [x] git hook 的配置
- [x] 代码健康度检查
- [x] Biome lint 规则调优（适配反编译代码，关闭格式化避免大规模 diff）
- [x] 单元测试基础设施搭建 (test runner 配置)
- [x] CI/CD 流水线 (GitHub Actions)

### Feature Flags & 功能补全 (2026-04-01)
- [x] Feature flag 选择性开启机制 (dev: --feature, build: BunPlugin)
- [x] 全量 92/92 feature flags 开启
- [x] 逆向推导 14 个缺失工具 (SleepTool, MonitorTool, SnipTool, WebBrowserTool 等)
- [x] 逆向推导 11 个缺失命令 (proactive, assistant, bridge, buddy 等)
- [x] 逆向推导 3 个缺失 skills (dream, hunter, runSkillGenerator)
- [x] 从 v2.1.88 bundle 提取 YOLO classifier prompts (3 个 .txt)
- [x] 从 v2.1.88 bundle 提取 Claude API skill 文档 (26 个 .md)
- [x] 逆向推导 useProactive hook
- [x] VA 全量验证通过

### 品牌定制 (2026-04-01)
- [x] 品牌名 "Claude Code" → "Panda Code" (196 文件, ~410 处)
- [x] 像素风格熊猫 Logo (Clawd.tsx)
- [x] 签名行添加
- [x] 零 "Claude Code" 残留确认

### v2.1.120→v2.1.124 修复 (2026-04-03)
- [x] REPL 输入栏回归修复 (UndercoverAutoCallout 死锁)
- [x] 编译时 MACRO 注入 (VERSION/PACKAGE_URL)
- [x] 无条件 traffic guard (启动挂起修复)
- [x] 69 个 / 命令 PTY 验证 (65 PASS / 3 BLOCKED / 1 N/A)
- [x] CC命令使用手册.md 全面更新
- [x] wsh badge hook 修复 (Wave Terminal 环境检测)
- [x] 能力审计完成 (109 存根 + 5 CRITICAL + 12 HIGH)
- [x] OpenClaw/ClawGod 对比分析完成

## 待办 — 能力对齐方案 (审批: 2026-04-04)

> 详见: monitor/capability-alignment-plan.md
> 约束: 不得破坏当前已有能力

### Phase 1: CRITICAL 修复 ✅ (v2.1.125)
- [x] 1.1 assistant/index.ts 反存根 (isAssistantMode→真实判断)
- [x] 1.2 moodSense 自动检测 (关键词+情绪分析，中英双语)
- [x] 1.3 builtinTasks 启用 + 接入 cronTasks 引擎 (dream/briefing/health)
- [x] 1.4 夜间任务链编排器 (nightTaskOrchestrator + 5分钟节流)
- [x] 1.5 emotionalMemory + workingMemory 持久化 (JSON+LRU100+TTL24h)

### Phase 2: 能力对齐 ✅ (v2.1.125, 2.5 推迟)
- [x] 2.1 Coordinator 多智能体协作反存根
- [x] 2.2 KAIROS 持久 Agent 完善 (assistant→proactive→sense 链路)
- [x] 2.3 GrowthBook flag 全面补全 (+13 新 flag)
- [x] 2.4 sense pipeline 贯通 (mood on input + persona auto-switch + dream context)
- [ ] 2.5 contextCollapse 实装 — 推迟（高风险，需单独设计）

### Phase 3: 安全研究 ✅ (v2.1.125)
- [x] 3.1 安全边界完整映射文档 (monitor/security-boundary-map.md)
- [x] 3.2 安全限制可配置化 (PANDA_SECURITY_RESEARCH env)
- [x] 3.3 红队测试环境配置文档 (monitor/red-team-setup-guide.md)

### 其他待办
- [ ] `@ant/claude-for-chrome-mcp` — Chrome MCP 完整实现
- [ ] 终端实际渲染验证 (熊猫 Logo 视觉效果)

### 💡 产品灵感捕获
- [ ] **Samantha 式情绪理解** (2026-04-08 13:45 +08:00) — 超级助手应该像电影 *Her* 中的 Samantha 一样理解用户情绪。当前已有 moodSense 关键词+情绪分析（Phase 1.2）和 emotionalMemory 持久化（Phase 1.5），下一步可深化为：多轮情绪追踪、语境推断意图、主动关怀式回应、情绪记忆长期画像。目标：从"工具"进化为"懂你的伙伴"。

## Agent 输出截断 Bug 修复 ✅
> 完成时间：2026-04-22
> 根因：PANDA_AGENT_MAX_TURNS=10 覆盖代码默认值 200，限制 agent 为 10 轮

- [x] Fix 1: PANDA_AGENT_MAX_TURNS 10→200 (db6f5cb)
  - settings.json 运行时配置更新
  - initPandaccSettings.ts 代码默认值更新
  - 迁移逻辑：自动将旧值 '10' 升级为 '200'
- [x] Fix 2: max_turns_reached 优雅降级 (40f6221)
- [x] Fix 3: 验证通过 — 17 tool calls 完整输出
- [x] Fix 4: 收尾修复 — fallback 对齐 200 + catch 错误日志改进 (8aeb651)

根因链：settings.json '10' → env → runAgent.ts → query.ts 硬截断 → 无最终摘要 → 输出片段

## UI 功能实现（就绪）
> Agent bug 已修复，W16 进行中

W15 已完成：系统托盘激活 + 58 测试用例
W16 进行中 (4/5 完成):
- [x] W16-1: E2E Playwright (fc35cc7)
- [x] W16-2: Notification System (0c81fa6)
- [x] W16-3: 多窗口支持 (08256ec, b484392, 99d2ea0)
- [x] W16-4: Auto-update (94675a0)
- [x] W16-5: Theme System (bca68a9)
- [x] W16-6: Findings cleanup — stale TODOs, dynamic slash cmds, PetStrip, icon

## CSP 安全加固 ✅
> 完成时间：2026-04-23
- [x] 移除 CSP unsafe-eval (08256ec)
- [x] 提取 FOUC 内联脚本到 public/fouc.js
- [x] BrowserWindow 添加 sandbox: true
- [x] session 级 CSP response header 双重保障

## 多窗口完善 ✅ (W16-3)
> 完成时间：2026-04-23
- [x] G1: windowStore + renderer windowId 感知 (99d2ea0)
- [x] G3: tabStore 窗口隔离 (99d2ea0)
- [x] G4: DevMockRelay 多窗口支持 (99d2ea0)
- [x] G5: NotificationManager 智能路由 (b484392)
- [x] G6: WINDOW_POSITION sender 定位 (b484392)
- [x] G7: URL session 参数传递 (b484392)
- [x] G9: 窗口位置/尺寸持久化 (b484392)
- [x] G10: appUpdater 广播所有窗口 (b484392)

## UI Claude Desktop 对齐 (§12) ✅
> 完成时间：2026-04-23

### Wave E — P0 缺失组件
- [x] E-1: PdDiffViewer 组件 (a218919)
- [x] E-2: PdAskUserQuestion 组件 (a218919)
- [x] E-3: FileRenderer 接入 DiffViewer (a218919)
- [x] E-4: BashRenderer ANSI 增强 (a218919)
- [x] E-5: SearchRenderer 结构化 (a218919)

### Wave F — P1 视觉品质
- [x] F-1: glass-panel 毛玻璃效果 (3d32f2d)
- [x] F-2: ThinkingBlock 计时 + pulse 动画 (3d32f2d)
- [x] F-3: Composer 底栏 Model + Permission 选择器 (3d32f2d)
- [x] F-4: HeroComposer 增强 96px + pills (3d32f2d)
- [x] F-5: Tab 关闭退出动画 (3d32f2d)
- [x] F-6: prefers-reduced-motion 已有

### Wave G — P2 功能完善
- [x] G-1: Sidebar duplicate + archive (本次)
- [x] G-5: Streaming 3-dot pulse (本次)

---

## 上游 v2.1.88 → v2.1.120 迁移路线图（2026-04-26）

> 完整方案：`monitor/migration-plan-2026-04-26.md`（526 行）
> 调研依据：3 份落盘报告（version-features / features-deep-dive / panda-cli-capability-snapshot）
> Gap 分类：A=47 已覆盖｜B=26 部分｜C=19 缺失｜D=8 不做

### Top-3 P0/P1（3 天交付，Score 排序）
- [ ] **#1 `/recap` slash 收尾** Score 8.10 — P0 0.5 天
  - 路径：`src/commands/recap/index.ts` 特例新建 `[NEW-FILE:#20260426-01]` + `commands.ts` 注册
  - 复用：`src/services/awaySummary.ts` + `src/hooks/useAwaySummary.ts`（自动版已 100% 实现）
- [ ] **#6 Hooks v2 字段补齐** Score 6.95 — P1 1.5 天
  - 缺：`mcp_tool` handler 类型 + `duration_ms` PostToolUse 字段
  - 路径：`src/utils/hooks/execMcpToolHook.ts` 特例新建 `[NEW-FILE:#20260426-02]` + 5 处现有文件改造
- [ ] **#2 `/usage` 合并入口** Score 6.85 — P1 1 天
  - `/cost` `/stats` 改 thin shim 跳转 `/usage` tab，零新建文件

### B 类后续批次（19 条，按版本分组）
- [ ] B 批次①（v2.1.118）：`/fork` 写盘验证、`prUrlTemplate`、Vim Visual+jk、`config` 优先级链
- [ ] B 批次②（v2.1.110+）：`PreCompact` exit code 2 阻断、`headersHelper` MCP 元数据、自定义命名主题
- [ ] B 批次③（其它）：Auto Mode 默认开启、`/proactive` ↔ `/loop` 互通、Skill 描述上限、Bedrock/Vertex 安装向导

### C 类完全缺失（19 条，按 Score 排序，待决）
- [ ] `/tui` 全屏模式、`/focus` 专注视图、`prUrlTemplate`、`CLAUDE_CODE_HIDE_CWD`
- [ ] `managed-settings.d/` drop-in、`disableDeepLinkRegistration`、`SUBPROCESS_ENV_SCRUB`
- [ ] `--from-pr` 多平台、`blockedMarketplaces`、插件 `monitors` / `bin/` / `tag`
- [ ] `ENABLE_PROMPT_CACHING_1H` / `FORCE_PROMPT_CACHING_5M` env
- [ ] `/team-onboarding` `/powerup` `${CLAUDE_EFFORT}` 变量
- [ ] `sandbox.failIfUnavailable` 策略字段

### 关键风险（执行前必带补丁）
- ⚠️ CLAUDE.md 被忽略回归（上游 issue #53040）
- ⚠️ Forked subagents 写盘膨胀（v2.1.118 修复"指针式"）
- ⚠️ Focus mode 吞 system status lines（v2.1.110 修复）

### D 类不迁移（已知禁用）
- 企业 Console 鉴权 / Bedrock Mantle / OTEL 全家桶 / Datadog / Slacked / Perforce / 远程 settings 强刷 / channels 插件白名单

## matrix theme v3.7 Pro 后续波次（2026-04-29）

### 波次1 已完成 ✅
- [x] 4 档绿色板（OPERATOR_BRIGHT/PANDA_STD/WORKER_DIM/SYSTEM_FAINT）+ getRoleColor / getRoleDimColor helper
- [x] TurnRole 扩展 worker / system + ROLE_LABEL / ROLE_TOKEN 同步
- [x] TurnHeader 重构：`▎▶ [LABEL · ts] ━━━━ ◉ IN ▌` 6 元素 chrome
- [x] 响应式延伸线（最少 8 字符 / 上限 columns-4）
- [x] 11 单元测试 + 全套 74 测试无回归
- [x] build PASS（606 文件）

### 波次2 已完成 ✅（2026-04-29）
- [x] Message 元字段扩展 isSubAgent? + subAgentName?（侵入性最小方案，不扩展 type 联合）
- [x] Messages.tsx roleChanged 逻辑接 worker / system 分支（computeChromeKey helper 跨 type+isSubAgent 维度）
- [x] AgentTool/UI 与 TurnHeader worker role 对接，displayName 来自 prompt 摘要（首 32 字符 + …）
- [x] sub-agent 实时模式（renderToolUseProgressMessage）+ 完成模式（renderToolResultMessage）双路径 worker chrome
- [x] **Comdr 问题 #2 修复**：sub-agent UI 自带 chrome 边界，thinking/tool calls 不再「淹没」在主线时间戳间
- [x] 12 单元测试 + 全套 86 测试无回归
- [x] build PASS（606 文件）+ dist 落盘验证（chunk-97z7bbgv.js / chunk-j35q1e1c.js）
- [x] 端到端实测 [SYSTEM · 18:44:19] chrome 在 cli stdout 渲染

### 波次3 / 波次4（指挥官明确范围外）
- [ ] 屏幕骨架（screen scaffold）
- [ ] worker 三重边框
- [ ] 动效细节（呼吸 dot 改进、scanline 增强等）
- [ ] prevIsSubAgent 出栈分隔逻辑（已在 Messages.tsx 预留 void 引用）
- [ ] displayName 完整命名：扩展 Tool.renderToolUseProgressMessage 加 toolUseInput 参数从 lookups 反查 subagent_type（涉及 9 个工具适配）

### 已知限制
- TurnHeader 单元测试覆盖逻辑层（color/role/bar 宽度 + chromeKey）；React 组件渲染快照需 ink-testing-library（项目未引入），用 stdout 仿真脚本 + 静态源码 + dist bundle grep 三重链路验证已 PASS
- pipe 模式（`-p`）不渲染 TurnHeader，端到端真机验证需 TTY 交互模式
- 真实 spawn sub-agent 受上游 cache_control API 阻挡，worker chrome 验证依赖单元 + 源码 + dist + e2e SYSTEM chrome 同源链路


---

## v2.26.0 — 2026-05-15 · 上游 v2.1.120→v2.1.142 全量对标（方案 A 激进路径 100% 交付）

### 调研基线
- 上游版本：v2.1.142（2026-05-14 npm @anthropic-ai/claude-code）
- 跨度：v2.1.120→v2.1.142 共 16 个有效版本（17 天 110 条新能力）
- 战略分水岭：v2.1.139（Code with Claude 大会同日）
- 调研报告：`monitor/migration-plan-v2120-to-v2142-2026-05-15.md`

### 战术分组（4 wave 14 任务）
**Wave 1（W1-149/164/161/158）** — Hook + Spinner + Transcript 底层增强
- Spinner amber 10s+ + Auto mode 红色（v2.1.126/.141）
- Hook 6 字段：updatedToolOutput / effort.level+$CLAUDE_EFFORT / args:string[] exec / continueOnBlock / terminalSequence / 配置错误明确化（v2.1.121/.133/.139×2/.141/.142）
- Transcript ?/{/}/v 快捷键导航（v2.1.139）

**Wave 2（W2-160）** — /goal 旗舰命令（v2.1.139）
- condition store + Haiku evaluator + Stop hook 包装 + ◎ overlay + --goal CLI flag + 50turn 死循环兜底
- 26 单元测试 / 7 NEW-FILE [#20260515-01..07]

**Wave 3（W3-152）** — Agent View Tier 1（v2.1.139→.142）
- claude agents TUI dashboard + 22 键位 + roster + peek + attach/detach (exit+re-spawn)
- 22 单元测试 / 13 NEW-FILE [#20260515-AV-01..13]

**Wave 4（W4-150/151/153/154/155/156/159/162/163）** — B 档 + 中价值能力
- /resume PR URL（4 平台）+ /skills 输入过滤 + /mcp 工具数显示
- MCP alwaysLoad + stdio CLAUDE_PROJECT_DIR + Reconnect 拾取 .mcp.json
- Auto Mode hard_deny + parentSettingsBehavior + 分类器错误带 retry/compact/--debug
- /scroll-speed + /feedback 24h/7d + /web-setup 警告 + bare /color 随机
- Compaction 三件套：reactive seeding + 保留 sensitive 指令 + Rewind "Summarize up to here"
- claude plugin prune + --plugin-dir .zip + --plugin-url（9 项安全控制）
- Skill 五连：通配符前缀 + 根级 SKILL.md + /context all token + skillOverrides + subagent 三层发现
- claude project purge + EnterWorktree 本地 HEAD + worktree.baseRef
- Agent tool subagent_type 大小写不敏感 + claude plugin details + Subagent x-claude-code-agent-id

### 交付物
- commit: `90e34be` feat（80 文件 +6989/-239）+ `87dc43c` v2.26.0
- 测试: 68/68 通过（hook 20 + goal 26 + agentview 22）
- build: 623 files bundled
- npm: `@lc2panda/panda-code@2.26.0` 发布到 GitHub Packages（19.2MB / 768 files）
- push: `8df66de..87dc43c main -> main`
- 工期: 调研 1.5h + 实施 2h = 3.5h（vs 估算 45 人天）

### Tier 2/3 推迟项（Agent View 范围）
- [ ] Supervisor 守护进程（Tier 2，v2.27.x 评估）
- [ ] Worktree 自动隔离（Tier 2，v2.27.x 评估）
- [ ] inline reply in peek panel（Tier 2）
- [ ] Ctrl+G $EDITOR 编辑 dispatch prompt（Tier 2）
- [ ] Shift+Enter 携带 prompt 启动（框架已就绪 draft 始终空）
- [ ] Haiku 15s 行摘要（Tier 3，需 multi-model routing 稳定）
- [ ] PR 状态点（Tier 3，需 GitHub 集成）
- [ ] `/loop` 与 `/goal` 互补集成（Tier 4 不做）

### 风险监控
- Worker B addToolResult 延迟改变消息顺序（hook 后发，理论正确，未观察到下游依赖）
- Worker L React Compiler 缓存槽 `_c(88)` 手动调（未来 recompile 注意）
- Worker N 未给 4 个改动文件加 Input/Output/Pos 文件头（次要，二轮 polish）
- /goal --resume 后从 transcript 恢复 condition 未实现（二期）
- /goal 没加企业关闭开关（如需 disableAllHooks 联动二期补）

### 实际执行节奏
14 worker 后台并行作战，按"独立文件域"派工避免冲突，PM 单线程验收。完成顺序：A → C → D → E（旗舰）→ F → H → I → G → K → B → J → L → M → N。
