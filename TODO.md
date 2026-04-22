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

## Agent 输出截断 Bug 修复（进行中）
> 开始时间：2026-04-22
> 根因：PANDA_AGENT_MAX_TURNS=10 覆盖代码默认值 999，限制 agent 为 10 轮

### 已完成
- [x] Fix 1: PANDA_AGENT_MAX_TURNS 10→200 (db6f5cb)
  - settings.json 运行时配置更新
  - initPandaccSettings.ts 代码默认值更新
  - 迁移逻辑：自动将旧值 '10' 升级为 '200'

### 收尾
- [x] Fix 2: max_turns_reached 优雅降级 (40f6221)
- [x] Fix 3: 验证通过 — 17 tool calls 完整输出
- [x] Fix 4: 收尾修复 — fallback 对齐 200 + catch 错误日志改进

### 完整根因链
settings.json '10' → env → runAgent.ts → query.ts 硬截断 → 无最终摘要 → 输出片段

## UI 功能实现（暂停中）
> 暂停原因：Agent 输出截断 bug 需优先修复
> 暂停时间：2026-04-22

W15 已完成：系统托盘激活 + 58 测试用例
W16 待定：需完成 Agent bug 修复后恢复
