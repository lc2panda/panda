# TODO

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
