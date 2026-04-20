<!--
Input:  panda-on-desk 子包内部架构（进程模型 / IPC / 状态机 / 主题 / 跨平台抽象）
Output: 架构图 + 数据流 + 优先级表 + 模块边界（贡献者用作设计参考）
Pos:    panda-on-desk 子包架构深潜文档（与 README 用户视角 + CONTRIBUTING 流程视角解耦）
        [NEW-FILE:#W7-05] · 一旦架构变化（新进程 / 新 IPC 通道 / 新平台），请同步本文。
-->

# ARCHITECTURE · panda-on-desk

> 适用范围：`packages/panda-on-desk/`（Electron 41 GUI 子包）
> 基线版本：v2.25.7
> 上游设计文档：[`monitor/20260419-on-desk-A1-架构设计.md`](../../monitor/20260419-on-desk-A1-架构设计.md)
> 本文档面向**架构师 / 资深贡献者**，聚焦"为什么这样设计"。
> 用户安装请看 [`README.md`](./README.md) · 贡献流程请看 [`CONTRIBUTING.md`](./CONTRIBUTING.md)。

---

## 目录

1. [进程模型](#1-进程模型launchcjs--main--4-browserwindow)
2. [IPC bridge 完整链路](#2-ipc-bridge-完整链路)
3. [状态机优先级表](#3-状态机优先级表12-petstate)
4. [主题加载流程](#4-主题加载流程theme-loader--svg-sprites--renderer)
5. [跨平台抽象层](#5-跨平台抽象层platformmacwinlinux-windowts)
6. [关键设计决策与权衡](#6-关键设计决策与权衡)

---

## 1. 进程模型（launch.cjs → main → 4 BrowserWindow）

```
   ┌─────────────────────────────────────────────────────────────────┐
   │                        Node.js 入口层                              │
   │                                                                   │
   │   launch.cjs (node CLI)                                           │
   │   - 关键：删除 ELECTRON_RUN_AS_NODE 环境变量后 spawn               │
   │     防止从 panda CLI 内部启动时被继承导致 Electron 退化为 Node    │
   │   - Linux 注入 --no-sandbox 修复 chrome-sandbox SUID 缺失          │
   │                                                                   │
   └────────────────────────────┬──────────────────────────────────────┘
                                │ spawn(electron, ['.'])
                                ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                  Electron Main Process (单实例锁)                  │
   │                                                                   │
   │   src/main.ts (god file · 1433 行)                                │
   │   ┌───────────────────────────────────────────────────────────┐  │
   │   │ app.whenReady() →                                          │  │
   │   │   1. requestSingleInstanceLock() — 第二次启动 focus 第一个 │  │
   │   │   2. applyWindowsAppUserModelId(app, platform)             │  │
   │   │   3. 加载 prefs（~/.pandacc/desk-prefs.json）              │  │
   │   │   4. startBridgeServer({ onEvent, appVersion })            │  │
   │   │      → 监听 127.0.0.1:1455+（auto-fallback +1）            │  │
   │   │      → 落盘 ~/.pandacc/runtime.json                        │  │
   │   │   5. createPetWindow() / createHitWindow()                 │  │
   │   │   6. createSettingsWindow()  （隐藏 · 按需 show）          │  │
   │   │   7. createUpdateBubbleWindow() （隐藏 · auto-update 触发）│  │
   │   │   8. initPandaTray() — 6 项托盘菜单                        │  │
   │   │   9. registerGlobalShortcuts()                             │  │
   │   │  10. initState() — PetState 12 态状态机起跑                │  │
   │   │  11. initUpdater() — electron-updater 拉取 latest.yml      │  │
   │   └───────────────────────────────────────────────────────────┘  │
   │                                                                   │
   └────────────────────────────┬──────────────────────────────────────┘
                                │ contextBridge IPC
                ┌───────────────┼───────────────┬─────────────────┐
                ▼               ▼               ▼                 ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐
       │  hit win   │  │ bubble win │  │settings win│  │update-bubble   │
       │ (transparent) │ (popup) │  │  (modal)    │  │      win       │
       │             │  │            │  │             │  │                │
       │ src/renderer/  │ src/renderer/  │ src/renderer/  │ src/renderer/  │
       │  hit.html      │  bubble.html   │  settings.html │  update-bubble │
       │  hit.ts        │  bubble.ts     │  settings.ts   │     .ts/.html  │
       │             │  │            │  │             │  │                │
       │ alwaysOnTop │  │ frame:false│  │  modal:true │  │  hidden by     │
       │ click-thru  │  │ resizable  │  │  resizable  │  │  default       │
       │ frame:false │  │   :false   │  │   :true     │  │                │
       │ skipTaskbar │  │            │  │             │  │                │
       │ 宠物 sprite + │  │ 通知 + 权限 │  │ 5 项偏好设置 │  │ 升级提示 + 进度│
       │ 眼球追踪      │  │ 气泡弹窗    │  │             │  │                │
       └────────────┘  └────────────┘  └────────────┘  └────────────────┘

   关键约束：
   - contextIsolation: true · nodeIntegration: false
   - 所有 4 窗都走 src/preload/<window>.ts 的 contextBridge 沙箱
   - macOS LSUIElement 隐藏 dock，仅保留 Tray
   - Windows / Linux：透明 overlay + alwaysOnTop（topmost level: pop-up-menu）
```

### 1.1 4 BrowserWindow 职责

| 窗口 | 类型 | 用途 | 默认状态 | 关闭策略 |
|---|---|---|---|---|
| `hit` (pet) | 透明 alwaysOnTop | 宠物 sprite + 眼球追踪 + 拖拽 | 启动即显示 | 不可关闭（Tray Hide） |
| `bubble` | frameless popup | 通知 + 权限气泡 | 隐藏（事件触发） | auto-hide 5s |
| `settings` | resizable modal | 5 项偏好设置面板 | 隐藏 | 用户关闭按钮 |
| `update-bubble` | frameless popup | 升级提示 + 下载进度 | 隐藏 | 升级完成或用户 dismiss |

### 1.2 单实例锁 + second-instance focus

```ts
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // 第二次启动尝试 → 把第一个实例的 hit 窗 focus
    if (hitWin) {
      if (hitWin.isMinimized()) hitWin.restore()
      hitWin.focus()
    }
  })
}
```

设计理由：避免多实例同时监听 `127.0.0.1:1455` 导致端口冲突 + runtime.json 互相覆盖。

---

## 2. IPC bridge 完整链路

panda-on-desk 内有**两套 IPC 完全独立**：
- **Electron IPC**（main ↔ preload ↔ renderer）：进程内沙箱通信
- **HTTP/SSE bridge**（panda CLI ↔ panda-on-desk main）：跨进程协议通信

### 2.1 Electron IPC 拓扑

```
   ┌────────────────────┐                  ┌────────────────────┐
   │   main (electron)  │                  │  renderer (4 窗)   │
   │                    │                  │                    │
   │  ipcMain.handle()  │ ◀── invoke ───── │ window.pandaAPI    │
   │  ipcMain.on()      │ ◀── send ─────── │  .savePrefs(...)   │
   │  webContents.send  │ ──── send ─────▶ │  .onPetState(cb)   │
   │                    │                  │                    │
   └─────────┬──────────┘                  └─────────▲──────────┘
             │                                        │
             │ contextBridge.exposeInMainWorld('pandaAPI', {...})
             ▼                                        │
   ┌────────────────────────────────────────────────┘
   │   preload sandbox (src/preload/<window>.ts)
   │   - contextIsolation: true
   │   - nodeIntegration: false
   │   - sandbox: true
   │   - 仅暴露 panda:* 通道白名单
   │   - 不暴露 require / process / __dirname
   └─────────────────────────────────────────────────
```

### 2.2 panda:* 通道命名规约

| 域 (domain) | 通道示例 | 方向 | 用途 |
|---|---|---|---|
| `state` | `panda:state:set` / `panda:state:current` | main → renderer | PetState 广播 |
| `desk-prefs` | `panda:desk-prefs:get` / `panda:desk-prefs:save` | renderer ⇄ main | 5 项偏好设置 |
| `species` | `panda:species:list` | renderer → main | 18 物种白名单 |
| `app-version` | `panda:app-version` | renderer → main | 读 package.json version |
| `tray` | `panda:tray:show-hide` | tray → main → renderer | 切换宠物可见 |
| `dnd` | `panda:dnd:toggle` | tray → main → renderer | 免打扰开关 |
| `settings` | `panda:settings:open` / `panda:settings:close` | tray → main → renderer | 设置面板生命周期 |
| `badge` | `panda:badge:double-click` / `panda:badge:flail` | renderer → main → CLI | 用户互动事件 |

### 2.3 HTTP/SSE bridge 链路

```
   ┌────────────────────────┐                    ┌────────────────────────┐
   │  panda CLI (Ink TUI)   │                    │  panda-on-desk main     │
   │                        │                    │                        │
   │  src/desk/bridge.ts    │                    │  src/bridge/server.ts  │
   │                        │                    │                        │
   │  POST /event           │ ──── HTTP 1455+ ──▶│  createServer((req,res)│
   │  (pet-state / xp /     │     X-Panda-Secret │  if (url === '/event') │
   │   level-up / scene)    │     ───────────────│   → readJsonBody       │
   │                        │                    │   → isValidEvent       │
   │                        │                    │   → onEvent(body)      │
   │                        │                    │   → dispatchEvent(body)│
   │                        │ ◀── 200 ack ────── │   → jsonResponse(ack)  │
   │                        │                    │                        │
   │  GET /state (SSE)      │ ──── HTTP keep ──▶ │  if (url === '/state') │
   │                        │     -alive         │   → SseHub.add(res)    │
   │                        │ ◀── data: {...} ── │   → broadcast(msg)     │
   │                        │     \n\n           │                        │
   │                        │                    │                        │
   │  GET /health           │ ──── 探测 ──────▶  │  if (url === '/health')│
   │                        │     无需鉴权        │   → { app, version,    │
   │                        │ ◀── 200 ───────── │       pid, uptimeMs }  │
   │                        │                    │                        │
   │  ~/.pandacc/runtime.json （共享读：port + secret + pid + appVersion）│
   └────────────────────────┘                    └────────────────────────┘
```

### 2.4 端口探测与 runtime.json

```ts
// src/bridge/server.ts L103-118
async function probeAndListen(server, basePort=1455, maxAttempts=16) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const port = basePort + i
    const ok = await tryListen(server, port, '127.0.0.1')
    if (ok) return port
  }
  throw new Error('could not bind any port in 1455..1470')
}

// 监听成功后原子写入 runtime.json（tmp + rename）
writeRuntimeJson({
  version: 1, port, secret, pid, startedAt, appVersion
})
```

设计理由：
- **127.0.0.1 only**：loopback 防止外网攻击 + 跳过防火墙弹窗
- **secret 双向校验**：randomBytes(32) 每次启动重新生成，防止恶意 client 注入
- **atomic write**：tmp + rename 防止 panda CLI 读到半截 JSON
- **auto-fallback +1**：1455 占用时自动 1456 / 1457 / ... 探测 16 次

### 2.5 11 类合法 OnDeskEvent

```ts
const VALID_EVENT_TYPES = new Set([
  'pet-state',     // PetState 切换（优先级竞争）
  'xp-gained',     // 经验值增加（11 桶 + 60 级）
  'level-up',      // 升级里程碑
  'milestone',     // 解锁成就
  'permission',    // 权限气泡
  'session',       // session 聚合（多任务 → juggling）
  'scene',         // 103 场景主动推送
  'notification',  // 通知聚合（P2-T2）
  'badge',         // 红圆 badge（W2-T4）
  'drag-target',   // 拖拽目标提示（P2-T4）
  'dnd',           // 免打扰开关同步（P2-T5）
  'species',       // 物种切换（W2-T1 · /buddy theme <species>）
])
```

新增 event 类型必须按 [`CONTRIBUTING.md` §6.3](./CONTRIBUTING.md#63-panda-cli--bridge-http-event) 双向同步声明。

---

## 3. 状态机优先级表（12 PetState）

### 3.1 STATE_PRIORITY 完整表

| # | State | 优先级 | 触发条件 | 视觉 | 抢占规则 |
|---|---|---|---|---|---|
| 1 | `error` | **8** | 工具调用失败 / API 异常 | 红感叹号 + 抖动 | 抢占任意低优先级 · MIN_DISPLAY_MS 节流 |
| 2 | `notification` | **7** | 103 场景主动推送 / 解锁里程碑 | bubble + 提示音 | 抢占 ≤ 6 |
| 3 | `sweeping` | **6** | 后台清理 / 缓存刷新 / 更新检查 | 扫帚动画 | 抢占 ≤ 5 |
| 4 | `attention` | **5** | 等待用户确认 / 权限气泡 | 闪烁光圈 | 抢占 ≤ 4 |
| 5 | `carrying` | **4** | 文件传输 / 下载进行中 | 抱箱 sprite | 抢占 ≤ 3 |
| 6 | `juggling` | **4** | 多任务并行（≥ 2 session） | 抛球动画 | 抢占 ≤ 3 |
| 7 | `working` | **3** | 长任务执行中（> 5s） | 工具图标 + 进度脉冲 | 抢占 ≤ 2 |
| 8 | `thinking` | **2** | 模型推理中 / token 流式输出 | 思考气泡 | 抢占 ≤ 1 |
| 9 | `idle` | **1** | 空闲（无 active session） | 默认呼吸动画 | 抢占 0 |
| 10 | `sleeping` | **0** | 长时间无交互（DEEP_SLEEP_TIMEOUT） | 闭眼 + Z 字 | 不抢占任何 |

### 3.2 SLEEP_SEQUENCE 子状态机（不参与主优先级竞争）

| # | State | 触发 | 视觉 |
|---|---|---|---|
| 11 | `yawning` | sleeping 入睡过渡 | 张嘴打哈欠 |
| 12 | `dozing` | sleeping 浅睡 | 半闭眼摇晃 |
| 13 | `collapsing` | sleeping 倒下 | 倒地动画 |
| 14 | `waking` | 鼠标移近 sleeping 唤醒 | 睁眼伸展 |

由 `wake-poll` 调度（独立 timer），不进入 `STATE_PRIORITY` 竞争。

### 3.3 ONESHOT_STATES（自动回弹到 idle）

```ts
const ONESHOT_STATES = new Set([
  'attention',     // 用户确认后
  'error',         // 错误提示展示完
  'sweeping',      // 后台任务完成
  'notification',  // 通知展示完
  'carrying',      // 文件传输完
])
```

ONESHOT 状态展示完 `MIN_DISPLAY_MS`（默认 1500ms）后自动 transitionTo('idle')。

### 3.4 状态切换决策流程

```
   收到 'pet-state' event ──▶ targetState
                                   │
                                   ▼
                       ┌────────────────────────┐
                       │ priority(targetState)   │
                       │ vs                       │
                       │ priority(currentState)   │
                       └───────────┬─────────────┘
                                   │
                       ┌───────────┴───────────┐
                  priority 高                priority 低
                       │                       │
                       ▼                       ▼
              ┌────────────────┐      ┌────────────────┐
              │ 抢占（立即切换）│      │ 入队 pending   │
              │ stateChangedAt │      │ 等高优先级释放 │
              │  = Date.now()   │      │ MIN_DISPLAY_MS│
              └────────┬───────┘      └────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │ ONESHOT_STATES?│
              │     是          │
              ▼     否          │
      ┌──────────┐ │            │
      │ MIN_DISPLAY├──回弹 idle │
      │  _MS 后   │             │
      └──────────┘              │
                       ▼         ▼
              ┌────────────────────┐
              │ 持续展示直到下次切换│
              └────────────────────┘
```

源码：`src/state.ts` L73-84（STATE_PRIORITY）· L86-92（ONESHOT_STATES）。

---

## 4. 主题加载流程（theme-loader → SVG sprites → renderer）

```
   ┌──────────────────────────────────────────────────────────────┐
   │                  装载阶段 (Main Process)                       │
   │                                                                │
   │   themes/panda/theme.json                                     │
   │   ┌────────────────────────────────────────────────────────┐  │
   │   │ {                                                        │  │
   │   │   "name": "panda",                                       │  │
   │   │   "version": "1.0.0",                                    │  │
   │   │   "species": [ "chonk", "cat", "robot", ... ],           │  │
   │   │   "_stateBindings": {                                    │  │
   │   │     "idle":      { files: ["chonk.svg"], fallback: null},│  │
   │   │     "thinking":  { files: ["chonk-thinking.svg"], ... }, │  │
   │   │     "error":     { files: ["chonk-error.svg"], ... },    │  │
   │   │     ...                                                  │  │
   │   │   }                                                      │  │
   │   │ }                                                        │  │
   │   └────────────────────────────────────────────────────────┘  │
   │                            │                                   │
   │                            ▼                                   │
   │   src/theme-loader.ts                                         │
   │   ┌────────────────────────────────────────────────────────┐  │
   │   │ 1. JSON schema 校验（zod-like）                         │  │
   │   │ 2. 读取 sprites/<species>-<state>.svg                   │  │
   │   │ 3. SVG sanitize:                                        │  │
   │   │    - 剥 <script> / <foreignObject> / on* handlers       │  │
   │   │    - 限制 viewBox 范围 / 颜色数                          │  │
   │   │    - 文件大小 ≤ 16KB                                    │  │
   │   │ 4. 缓存到 Map<species-state, sanitizedSvg>              │  │
   │   │ 5. 抽取 hit-box（透明像素裁剪 → bbox）                  │  │
   │   └────────────────────────────────────────────────────────┘  │
   │                            │                                   │
   └────────────────────────────┼───────────────────────────────────┘
                                │ IPC: panda:theme:loaded
                                ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                 渲染阶段 (Renderer Process)                    │
   │                                                                │
   │   src/renderer/hit.ts                                         │
   │   ┌────────────────────────────────────────────────────────┐  │
   │   │ 1. 监听 panda:state:set                                 │  │
   │   │ 2. 查 stateBindings → svg 文件                          │  │
   │   │ 3. innerHTML 注入到 <div id="pet-container">            │  │
   │   │ 4. 应用 animation-cycle.ts 帧调度                       │  │
   │   │    （breathing / thinking-bounce / error-shake 曲线）   │  │
   │   │ 5. 眼球追踪：mousemove → 计算 svg 内 <eye> 位置         │  │
   │   │ 6. 应用 hit-box → 透明区域 click-through                │  │
   │   └────────────────────────────────────────────────────────┘  │
   │                                                                │
   └──────────────────────────────────────────────────────────────┘
```

### 4.1 sanitize 链路（防 XSS）

theme-loader 必须移除：
- `<script>` 标签（任何位置）
- `<foreignObject>` 标签（可嵌 HTML/JS）
- `on*` 事件属性（onclick / onload / onerror ...）
- `xlink:href` 指向 `javascript:` / `data:` URI（除 `data:image/png;base64,`）
- 外部 URL（`http://` / `https://` / `//`）

### 4.2 hit-box 计算

`src/geometry/hit-geometry.ts` 在 main 进程预计算每个 sprite 的 bbox：
1. 读 sanitized SVG
2. rasterize 到 canvas（headless）
3. 扫描透明像素 → 收敛 bbox
4. 把 bbox 传给 hit win，透明像素区域设为 `setIgnoreMouseEvents(true, { forward: true })`

---

## 5. 跨平台抽象层（platform/{mac,win,linux}-window.ts）

```
   ┌────────────────────────────────────────────────────────────────┐
   │                    src/platform/index.ts                         │
   │                  统一 facade（process.platform 分流）            │
   └────────────────────────┬───────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   ┌─────────┐         ┌─────────┐         ┌─────────┐
   │  macOS  │         │ Windows │         │  Linux  │
   └────┬────┘         └────┬────┘         └────┬────┘
        │                   │                   │
        ▼                   ▼                   ▼
   mac-window.ts        win-window.ts      linux-x11.ts
   ┌─────────────┐      ┌─────────────┐    ┌─────────────┐
   │ NSWindow    │      │ koffi user32│    │ X11 toolbar │
   │ Stationary  │      │ FFI:        │    │ window type │
   │ collection  │      │ AllowSet    │    │ (跳过任务栏)│
   │ behavior    │      │ Foreground  │    │             │
   │             │      │ Window(pid) │    │ alwaysOnTop │
   │ LSUIElement │      │             │    │ via wmctrl  │
   │ (隐藏 dock) │      │ AppUserModel│    │ fallback    │
   │             │      │ Id (任务栏  │    │             │
   │ 透明 + 点击  │      │  分组)      │    │             │
   │  穿透        │      │             │    │             │
   │             │      │ topmost lvl:│    │             │
   │ alwaysOnTop │      │ pop-up-menu │    │             │
   │ above all   │      │ (高于 shell │    │             │
   │             │      │  UI)        │    │             │
   └─────────────┘      └─────────────┘    └─────────────┘

   平台公共契约 (src/platform/index.ts)：
   - applyPlatformSpecific(win) — 4 窗注册时统一调用
   - allowSetForegroundWindow(pid) — Windows 专用，其它平台 noop
   - applyStationaryCollectionBehavior(win) — macOS 专用
```

### 5.1 macOS 关键差异

| 项 | 实现 | 文件 |
|---|---|---|
| 隐藏 dock 图标 | `LSUIElement: true` 在 `Info.plist`（electron-builder 注入） | `electron-builder.yml` |
| NSWindowCollectionBehavior | `Stationary` + `IgnoresCycle` + `MoveToActiveSpace` | `mac-window.ts` |
| Tray 图标反色 | `template image`（系统自动反色 light/dark） | `tray/index.ts` |
| Hardened runtime | entitlements + JIT + camera/mic 拒绝 | `build/entitlements.mac.plist` |

### 5.2 Windows 关键差异

| 项 | 实现 | 文件 |
|---|---|---|
| AllowSetForegroundWindow | `koffi` FFI 加载 user32.dll 调用 | `win-window.ts` |
| AppUserModelId | `app.setAppUserModelId('com.lc2panda.panda-on-desk')` | `settings-window-icon.ts` |
| Topmost level | `setAlwaysOnTop(true, 'pop-up-menu')` 高于 taskbar | `main.ts` |
| 任务栏 Tray | NSIS installer 自动注册 | `electron-builder.yml` |
| 升级签名校验 | `verifyUpdateCodeSignature: false`（v1.0 未签名） | `electron-builder.yml` |

### 5.3 Linux 关键差异

| 项 | 实现 | 文件 |
|---|---|---|
| 透明窗口 | `transparent: true` + compositor (X11) | `main.ts` |
| Window type | `linux-x11.ts` 设置 `_NET_WM_WINDOW_TYPE_TOOLBAR` | `linux-x11.ts` |
| AppImage --no-sandbox | `launch.cjs` 检测 Linux 注入 flag | `launch.cjs` |
| Tray Indicator | StatusNotifierItem (KDE/GNOME) + libappindicator (legacy) | `tray/index.ts` |
| .desktop 注册 | electron-builder deb/AppImage 自动 | `electron-builder.yml` |

### 5.4 跨平台公共能力

| 能力 | 实现 | 文件 |
|---|---|---|
| 开机自启 | `app.setLoginItemSettings({ openAtLogin: true })` | `platform/login-item.ts` |
| 多屏 work area | `screen.getAllDisplays()` + `findNearestWorkArea` | `geometry/work-area.ts` |
| 拖拽位置持久化 | atomic write `~/.pandacc/desk-prefs.json` | `prefs.ts` |
| 全局快捷键 | `globalShortcut.register()` | `shortcuts.ts` |

---

## 6. 关键设计决策与权衡

### 6.1 为什么用 HTTP loopback 而不是 Unix socket / Named Pipe？

- **跨平台一致**：Unix socket 在 Windows 上需 Named Pipe 适配层，增加 ~200 行平台代码
- **调试友好**：`curl 127.0.0.1:1455/health` 一行验证
- **无须额外协议**：HTTP 库 Node 内置，无新依赖
- **代价**：占用 1 个 TCP 端口（1455+），需防火墙弹窗（loopback 通常豁免）

### 6.2 为什么 `main.ts` 是 1433 行的 god file？

上游 clawd-on-desk `main.js` 3119 行，panda-on-desk fork 后削皮 30%（去 8-agent 多 provider 分支）剩 1433 行。
进一步拆分代价：
- 大量跨模块状态共享（4 BrowserWindow 引用 / Tray / Updater / Bridge）
- Electron app 生命周期事件强耦合（必须在同一闭包）
- TODO[P1-T9]: 架构精修阶段拆为 `app-lifecycle.ts` / `window-factory.ts` / `tray-controller.ts`

### 6.3 为什么 panda CLI 不直接 require panda-on-desk？

- **解耦原则**：panda CLI 必须能独立运行（TUI 主体验）
- **依赖大小**：electron@41 二进制 ~80MB，强制装入 CLI 用户太重
- **部署灵活**：CLI 走 npm 全局安装，GUI 走 GitHub Release dmg/exe/deb
- **桥接方式**：HTTP/SSE 而非进程内调用，进程崩溃互不影响

### 6.4 为什么用 `_safeRequire` 兜底加载？

`src/main.ts` L82-90 的 `_safeRequire` 模式让 main 进程在子模块（prefs / tray / badge）尚未 fork
完成时也能启动空窗。这是上游 `clawd-on-desk` 没有的设计 —— panda-on-desk 多阶段渐进 fork
（P1-T1 到 W3-T2）期间，单个模块缺失不应阻挡 4 BrowserWindow 启动验证。

### 6.5 为什么状态机用优先级表而不是 FSM transitions？

- **简洁**：12 态 × 12 态 = 144 transitions FSM 表 vs 单一优先级数组
- **抢占易表达**：`if (newPriority > current) preempt()` 一行
- **新 state 易扩展**：只需加 priority 数字，不需重写 transition 矩阵
- **代价**：抢占链路无法表达"路径限制"（如 sleeping 必须经过 yawning）—
  通过 SLEEP_SEQUENCE 子状态机另外解决

### 6.6 为什么 SVG sanitize 而不是直接禁用 inline SVG？

- **主题创作灵活**：第三方主题作者用 Illustrator/Figma 导出 SVG，不应强制转 PNG（失真）
- **包体积小**：18 物种 × 10 状态 × 2KB SVG = 360KB 总量，PNG 同等质量需 5MB+
- **代价**：sanitize 链需维护，新增 SVG 攻击面时需更新

---

> **领地标记规约**：一旦架构发生变化（新进程 / 新 IPC 通道 / 新平台 / 新状态），请同步本文 ——
> 就像重新标记领地一样。本文档的目的是让贡献者**理解为什么这样设计**，而不仅是"这是什么"。
