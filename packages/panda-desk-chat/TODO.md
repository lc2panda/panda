# Panda Desk Chat — UI 进度记录

> 最后更新: 2026-04-22 +08:00
> 当前阶段: W16 进行中 — E2E / Notification / Auto-update / Theme 完成, Multi-window 进行中

## 已完成 Wave

| Wave | 内容 | Commit | 状态 |
|------|------|--------|------|
| W1 | Design tokens, fonts, theme, i18n (zh/en/ja/ko) | — | ✅ |
| W2 | Pd* component rename, atoms/containers/special | — | ✅ |
| W3 | Three-column layout, TabBar dedup, PdNavItem | c322851 | ✅ |
| W4 | CommandPalette, SessionSwitcher, HeroComposer | — | ✅ |
| W5-1 | ChatPage full integration | 70e671b | ✅ |
| W5-2 | SettingsPage tabbed settings | e883abe | ✅ |
| W6-1 | ChatPage slim down (content only) | 5abaff0 | ✅ |
| W6-2 | IPC bridge 连通 stores (6文件, 164+行) | b99e82b | ✅ |
| W6-3 | DevMock 完整流程验证 (24/24 channel) | abf9d25 | ✅ |
| W7 | Electron 骨架 (main/preload/ipc/build) | d49e8ab | ✅ |
| W8-1 | chatStore 流式事件处理 — W6 已实现 | (W6) | ✅ |
| W8-2 | ChatPage 连线 (PdMessageList+Streaming+Permission) | 513a62f | ✅ |
| W8-3 | 消息渲染 (Markdown+thinking fold+streaming cursor) | (W4/W5) | ✅ |
| W9-1 | tsc 22→0 错误 (lucide类型+Props对齐+Locale安全) | cddbf51 | ✅ |
| W9-2 | DevMock 完整流式模拟 (thinking+text+tool+permission) | (W9-1) | ✅ |
| W9-3 | 错误处理 UI (StatusBar error state + ChatPage banners) | 620a645 | ✅ |
| W10-1 | Toast Store (zustand) + chatStore 错误集成 | (W10) | ✅ |
| W10-2 | PdToastContainer 接入 App.tsx | (W10) | ✅ |
| W10-3 | i18n error banner keys (en/zh/ja/ko) | 581f68b | ✅ |
| W10-4 | Toast store export + chatStore integration fix | 045876e | ✅ |
| W11-1 | CLI auto-reconnect (3 retries + exponential backoff) | b125aef | ✅ |
| W11-2 | newChat wiring (Sidebar + HeroComposer → chatStore) | cd4ba2a | ✅ |
| W11-3 | Unused component audit (6 components marked TODO) | (W11) | ✅ |
| W12-1 | Wire PdCommandPalette (Cmd+K) + PdSessionSwitcher (Cmd+P) | bc455f6 | ✅ |
| W12-2 | Wire PdDirectoryPicker + PdRoutingBanner | bc455f6 | ✅ |
| W12-3 | Toast system + i18n complete | bc455f6 | ✅ |
| W12-4 | PdRoutingBanner + PdPetCameo integrated in ChatPage | c81b4ff | ✅ |
| W13-1 | Electron App Menu (macOS standard + keyboard shortcuts) | ac9ab73 | ✅ |
| W13-2 | nativeTheme system theme follow + IPC sync | ac9ab73 | ✅ |
| W13-3 | Clipboard Image paste (already implemented in Composer) | — | ✅ |
| W14-1 | SettingsPage 拆分 5 Tab + SettingRow 共享组件 | e218758 | ✅ |
| W14-2 | 单元测试骨架 (toastStore/settingsStore/sessionStore 15 tests) | 26780ab | ✅ |
| W14-3 | 性能优化 (selector+memo+lazy 12 项) | 5a31f0f | ✅ |
| W15-1 | Electron Tray 激活 (createTray + isQuitting + hide-to-tray) | f1089c6 | ✅ |
| W15-2 | 测试覆盖 15→58 (chatStore 23 + tabStore 16) | d11c698 | ✅ |
| W16-1 | E2E Playwright (启动→聊天→设置→托盘) | fc35cc7 | ✅ |
| W16-2 | Notification System (系统通知 + Dock badge) | 0c81fa6 | ✅ |
| W16-3 | 多窗口支持 (独立窗口 + session 切换) | — | ⏳ |
| W16-4 | Auto-update (electron-updater + GitHub Releases) | 94675a0 | ✅ |
| W16-5 | Theme System (nativeTheme 跟随 + 实时切换) | bca68a9 | ✅ |
| W16-6 | Findings cleanup (stale TODOs, dynamic slash cmds, PetStrip, icon) | — | ✅ |

## W7 Electron 骨架 ✅

### W7-1: Main process + Preload ✅
- [x] electron/main.ts — BrowserWindow 创建、窗口管理、app 生命周期
- [x] electron/preload/chat.ts — contextBridge 暴露 pandaAPI (24 channel)
- [x] package.json — electron 依赖 + 启动脚本

### W7-2: IPC Handler 注册 ✅ `7278cf2`
- [x] electron/ipc/handlers.ts — main process 侧 IPC 处理器
- [x] 连接 CLI 后端（spawn panda-code CLI 进程 or import query engine）
- [x] Session 管理（创建/销毁 CLI 实例）

### W7-3: 打包配置 + 端到端集成测试 ✅ `d49e8ab`
- [x] electron-builder.yml (d49e8ab)
- [x] package.json build config (d49e8ab)
- [x] vite.config.ts ESM 兼容 + preload CJS (d49e8ab)
- [x] build:electron 产物验证 — 集成测试脚本 5 步通过
- ⏳ app icon — placeholder 待设计
- ⏳ dev:electron 冒烟测试 — 需 GUI 环境
- ⏳ E2E 24 channel 联通 — 需 GUI 环境

## W8 — Streaming Chat Flow ✅

W8 各子任务已在先前 Wave 中实现或在 513a62f 中集成完成：

### W8-1: chatStore 流式事件处理 ✅ (W6 已实现)
- [x] chatStore 中 stream event handlers（stream:start/delta/end）— W6 store 完整实现
- [x] bridge.ts 中 onStreamStart/onStreamDelta/onStreamEnd 监听 — W6-2 IPC bridge 连通

### W8-2: ChatPage 连线修复 ✅ `513a62f`
- [x] PdMessageList 接入 chatStore 消息流
- [x] PdStreamingIndicator 流式状态指示
- [x] PdPermissionDialog 权限确认对话框
- [x] tool:use:start/end 工具执行 UI 流程
- [x] permission:request → bridge.respondPermission() 用户批准/拒绝

### W8-3: 消息渲染增强 ✅ (W4/W5 已实现)
- [x] PdMarkdownRenderer — Markdown 渲染 + 代码块语法高亮
- [x] PdMessageBubble — Thinking 折叠面板
- [x] 流式打字效果（streaming cursor）

## W9 — Type Safety & Dev Experience Polish

### W9-1: 修复既有 tsc 错误 ✅ `cddbf51`
- [x] ChatPage.tsx 相关 Props 类型对齐
- [x] App.tsx onBack/routing props
- [x] lucide-react JSX 兼容性（27 图标类型覆盖）
- [x] tauri 模块声明移除/条件化
- [x] Locale 类型安全

### W9-2: DevMock 流式模拟 ✅
- [x] dev-mock.ts 中 sendMessage 触发模拟流式响应
- [x] 模拟 stream:start → 多个 stream:delta → stream:end 时序
- [x] 支持 thinking delta + text delta 混合流
- [x] 模拟 tool:use:start/end 和 permission:request 场景

### W9-3: 错误处理 + 边界 UI ✅ `620a645`
- [x] CLI 进程崩溃/断开的错误提示
- [x] 网络超时/API 错误的用户反馈
- [x] 空会话/无消息状态的 empty state

## W10 — Toast Notification System + Final Polish ✅

### W10-1: Toast Store ✅
- [x] 创建 toastStore (zustand)：add/dismiss/clearAll
- [x] ToastItem 类型：id, type (success/error/warning/info), message, duration
- [x] chatStore 错误处理改为 pushToast 而非 console.error

### W10-2: Wire PdToastContainer ✅
- [x] App.tsx: 从 toastStore 读取 toasts 传给 PdToastContainer
- [x] 替换硬编码的 toasts={[]} onDismiss={() => {}}

### W10-3: i18n 补全 ✅ `581f68b`
- [x] 新增的 error banner 文案翻译 (zh/en/ja/ko)
- [x] chat.connectionError, chat.disconnected keys

### W10-4: Toast store export fix ✅ `045876e`
- [x] toastStore 正确导出到 stores/index.ts
- [x] chatStore 错误路径集成 toastStore.pushToast

## W11 — Reliability + Component Audit ✅

### W11-1: CLI auto-reconnect ✅ `b125aef`
- [x] bridge.ts: 断线检测 + 3 次指数退避重连
- [x] chatStore: reconnect 状态管理 + UI 反馈

### W11-2: newChat wiring ✅ `cd4ba2a`
- [x] Sidebar "New Chat" 按钮连线 chatStore.newChat()
- [x] HeroComposer 空状态触发新会话

### W11-3: Unused component audit ✅
- [x] 6 组件审计: PdBuddyEventCard, PdRoutingBanner, PdPetCameo, PdDirectoryPicker, PdCommandPalette, PdSessionSwitcher
- [x] 每个组件顶部添加 `TODO(W12)` 标记
- [x] 评估结果:
  - **高价值 (W12 接入)**: PdCommandPalette (Cmd+K), PdSessionSwitcher (Cmd+P), PdDirectoryPicker (Settings)
  - **中价值 (W12 接入)**: PdRoutingBanner (model switch), PdPetCameo (empty state)
  - **低优先级**: PdBuddyEventCard (decorative milestone cards)

## W12 — Component Integration ✅

### W12-1: Wire PdCommandPalette + PdSessionSwitcher ✅ `bc455f6`
- [x] App.tsx: Cmd+K → PdCommandPalette overlay
- [x] App.tsx: Cmd+P → PdSessionSwitcher overlay
- [x] 连线 sessionStore 会话列表数据

### W12-2: Wire PdDirectoryPicker + PdRoutingBanner ✅ `bc455f6`
- [x] SettingsPage General tab: PdDirectoryPicker 选择工作目录
- [x] ChatPage: PdRoutingBanner 条件渲染 (chatStore.routingInfo)

### W12-3: Wire PdPetCameo + Polish ✅ `c81b4ff`
- [x] ChatPage empty state: PdPetCameo occasion="empty_state" 居中显示于 HeroComposer 上方
- [x] PdBuddyEventCard 保留为低优先级装饰组件，暂不接入

### W12-4: chatStore routing support ✅ `c81b4ff`
- [x] RoutingInfo 类型 + routingInfo 字段加入 PerSessionState
- [x] setRoutingInfo / dismissRouting actions
- [x] PdRoutingBanner / PdPetCameo 头部注释更新，移除 TODO(W12) 标记

## W13 — Electron Enhancement ✅

### W13-1: Native App Menu ✅ `ac9ab73`
- [x] electron/main.ts: macOS 标准菜单 (App/Edit/View/Window)
- [x] 快捷键绑定: Cmd+Q 退出, Cmd+Z/X/C/V 编辑, Cmd+R 刷新, Cmd+Shift+I DevTools
- [x] Menu.setApplicationMenu() 在 app.whenReady() 后初始化

### W13-2: nativeTheme ✅ `ac9ab73`
- [x] nativeTheme.on('updated') 监听系统主题切换
- [x] IPC channel 'native-theme:changed' → renderer 同步
- [x] preload/chat.ts 暴露 onNativeThemeChanged 回调
- [x] bridge.ts 注册 nativeTheme 监听接口
- [x] IPC handler count: 16 → 17

### W13-3: Clipboard Image ✅ (已就位)
- [x] PdHeroComposer / PdComposerInput 已支持粘贴图片 (Cmd+V)
- [x] 剪贴板 image buffer → base64 附件流程已在 W5 实现
- [x] 无需额外代码变更

## W14 — Settings Refactor & Test Skeleton & Perf ✅

### W14-1: SettingsPage 组件拆分 ✅ `e218758`
- [x] SettingsPage 拆分为 5 个 Tab 组件 (GeneralTab, AppearanceTab, ProvidersTab, ShortcutsTab, AboutTab)
- [x] SettingRow 共享布局组件
- [x] SettingsPage 217→65 行 (70% 精简)
- [x] 每个 Tab 独立文件，SettingsPage 仅做路由编排

### W14-2: 单元测试骨架 ✅ `26780ab`
- [x] vitest.config.ts 配置 (globals + path aliases)
- [x] toastStore 测试: addToast, dismissToast, clearAll, auto-dismiss, initial state (5 tests)
- [x] settingsStore 测试: defaults, setTheme, setLocale, toggleSidebar, setFontSize (5 tests)
- [x] sessionStore 测试: initial state, createSession, deleteSession, renameSession, setActive (5 tests)
- [x] 15/15 tests PASS

### W14-3: 性能优化 ✅ `5a31f0f`
- [x] 5 个 zustand selector 细粒度化 → useShallow (ChatPage, App, 3 Settings tabs)
- [x] 4 个 chat 子组件 React.memo (MessageBubble, UserBubble, ToolCallCard, ThinkingBlock)
- [x] 3 个非关键组件 React.lazy (SettingsPage, CommandPalette, SessionSwitcher)
- [x] 12 项优化覆盖 9 个文件，零新增文件

## W15 — Electron Tray + Test Coverage Expansion ✅

### W15-1: System Tray 激活 ✅ `f1089c6`
- [x] createTray() 在 setupMainWindow() 后调用（此前定义但未调用）
- [x] before-quit handler 设 isQuitting=true，支持 Cmd+Q 正常退出
- [x] Tray 右键菜单: Show/New Chat/Quit；左键点击显示窗口
- [x] 关闭按钮隐藏到托盘而非退出

### W15-2: 测试覆盖扩展 15→58 ✅ `d11c698`
- [x] chatStore 23 cases: session lifecycle, connectionState, messages, tools, permissions, routing, transcriptMode
- [x] tabStore 16 cases: add/remove/reorder/rename/pin/closeOthers/closeAll/getBySessionId
- [x] 原有 15 cases (toast+settings+session) 保持通过
- [x] 58/58 pass in 166ms

## W16 — 完成状态

> 4/5 方向已完成，多窗口支持进行中。

| # | 方向 | 描述 | 预估 | 状态 |
|---|------|------|------|------|
| 1 | E2E Playwright | Electron E2E 测试 (启动→聊天→设置→托盘) | M | ✅ fc35cc7 |
| 2 | Notification 系统 | 系统通知 (消息到达/任务完成) + Dock badge | S | ✅ 0c81fa6 |
| 3 | 多窗口支持 | New Chat 打开独立窗口 + 窗口间 session 切换 | L | ⏳ 进行中 |
| 4 | Auto-update | electron-updater + GitHub Releases 自动更新 | M | ✅ 94675a0 |
| 5 | 深色/浅色主题跟随 | nativeTheme 监听 + 实时切换 + 自定义主题 | S | ✅ bca68a9 |

### W16-6: Findings cleanup ✅
- [x] Remove stale TODO(W12) from PdBuddyEventCard, PdCommandPalette, PdSessionSwitcher
- [x] Replace hardcoded slash commands in PdComposer with IPC bridge fetch + fallback
- [x] Clean PetStrip placeholder in PdSidebar (reserved for panda-on-desk)
- [x] Add minimal SVG panda icon at public/icon.svg

## 架构备忘

- App.tsx (105行): 三栏布局 shell + 页面切换 useState<'chat'|'settings'>
- ChatPage: 纯内容区（RoutingBanner + MessageList + Composer / PetCameo + HeroComposer）
- SettingsPage: 5 标签页（General/Appearance/Providers/Shortcuts/About）
- IPC: 4 层架构 schemas→types→bridge→dev-mock，25 channel，5 组 + nativeTheme
- Stores: chatStore(大型), sessionStore(完整), uiStore(完整), tabStore, settingsStore, providerStore
- Bridge: 所有 stores 已连通 IPC bridge (W6-2)，DevMock 覆盖全部 24 channel (W6-3)
