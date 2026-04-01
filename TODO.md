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

## 待办

- [ ] `@ant/claude-for-chrome-mcp` — Chrome MCP 完整实现
- [ ] 终端实际渲染验证 (熊猫 Logo 视觉效果)
- [ ] 端到端交互测试 (REPL 完整对话流程)
