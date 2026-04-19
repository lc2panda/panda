# panda-on-desk

> Input：panda CLI 状态信号（PetState / token / cmd-count） · 用户桌面交互
> Output：透明 overlay 浮窗 + 宠物养成可视化 + 通知聚合（Electron 41 GUI）
> Pos：panda monorepo 子包 — 与 panda CLI（根目录）解耦，独立打包分发；与 panda CLI 的关系是「感知端 ↔ 信号源」，不替代 CLI

> **当前版本：v1.0 GA（Phase 3 收尾）** · 100% 吸收 [clawd-on-desk](https://github.com/rullerzhou-afk/clawd-on-desk) 81% (MIT 引用) 后改造 fork

## 安装方式（v1.0 GA）

### 方式 1：GitHub Release 下载（推荐普通用户）

panda-on-desk 通过 `desk-vX.Y.Z` tag 触发 [`.github/workflows/release-panda-on-desk.yml`](../../.github/workflows/release-panda-on-desk.yml) 自动跨平台打包并发布到 GitHub Release。

- **下载入口**：<https://github.com/lc2panda/panda/releases?q=desk-v> *(v1.0 GA 后激活)*
- **macOS**：`panda-on-desk-X.Y.Z-mac.dmg`（Intel + Apple Silicon 通用 / 双击安装）
- **Windows**：`panda-on-desk-X.Y.Z-Setup.exe`（NSIS x64 / 双击安装 → 跟随向导）
- **Linux**：
  - `panda-on-desk-X.Y.Z.AppImage`（通用 / `chmod +x panda-on-desk-*.AppImage && ./panda-on-desk-*.AppImage`）
  - `panda-on-desk-X.Y.Z.deb`（Debian/Ubuntu / `sudo dpkg -i panda-on-desk-*.deb`）

### 方式 2：源码运行（开发者）

```bash
# 仓库根目录
cd packages/panda-on-desk
bun install                # 安装 electron@41 + electron-builder@25 + electron-updater@6.8 子包 deps
bun start                  # === node launch.cjs（spawn electron GUI 模式 / 防 ELECTRON_RUN_AS_NODE 继承）
```

## 启动方式

| 入口 | 命令 | 说明 |
|------|------|------|
| 双击安装包 | — | macOS Launchpad / Windows 开始菜单 / Linux Activities |
| 命令行（开发） | `cd packages/panda-on-desk && bun start` | 等价于 `node launch.cjs` |
| 命令行（已安装包） | `panda-on-desk` | macOS/Linux 全局 PATH 注入；Windows 走 Start Menu shortcut |
| panda CLI 联动 | `/buddy show` | panda CLI 检测到 panda-on-desk 进程后自动桥接 |

**首次启动行为**：
1. 创建 `~/.config/panda/desk-state.json`（持久化经验值 / 物种 / 等级）
2. 监听 `127.0.0.1:1455` (auto-fallback +1 至首个空闲端口) 接收 panda CLI 信号
3. 4 个 BrowserWindow 注册（hit / bubble / settings / update-bubble），mac 走 LSUIElement 隐藏 dock

## 与 panda CLI 的关系（HTTP local + runtime.json）

```
┌────────────────────────────────┐                                      ┌────────────────────────────────┐
│   panda CLI（@lc2panda/panda-code）│  HTTP 1455+ / SSE / runtime.json   │  panda-on-desk（本子包）         │
│   - Ink TUI（终端主体验）       │  ──────────────────────────────────► │  - Electron 41 GUI overlay     │
│   - PetState 12 态状态机        │     PetState / token / cmd-count /   │  - 4 BrowserWindow 浮窗         │
│   - 103 主动场景 + StatusLine   │      主动场景 trigger / 通知 payload   │  - 通知聚合 + 权限气泡          │
│   - mini-pet 1×5 字符           │  ◄──────────────────────────────────  │  - 宠物养成可视化（18 物种）    │
└────────────────────────────────┘     用户操作 / 设置 / 解锁 ack         └────────────────────────────────┘
       信号源（authoritative）                                                   感知端（reactive）
```

- **解耦原则**：panda CLI 不依赖 panda-on-desk 即可独立运行（`bun panda` 仍是 TUI 主体验）；panda-on-desk 是可选 GUI 增强
- **共享数据层**：经验值 / 物种 / 等级通过 panda CLI 端共享文件（`~/.config/panda/desk-state.json`）跨进程持久化
- **byte-equal 守护**：panda-on-desk 不动 panda CLI 的 `src/services/api/claude.ts` `oauth/*` `providers.ts`（anthropic 协议层零修改）
- **HTTP 通信契约**：见 [`src/desk/bridge.ts`](../../src/desk/bridge.ts)（panda CLI 侧）和 `packages/panda-on-desk/src/bridge/server.ts`（GUI 侧）

## 9 子模块清单

| # | 模块 | 路径 | 职责 |
|---|------|------|------|
| 1 | **main** | `src/main.ts` | Electron 主进程 god file — 4 BrowserWindow + 单实例锁 + 生命周期 |
| 2 | **preload** | `src/preload/` | preload 桥（contextBridge 暴露 IPC API 到 renderer） |
| 3 | **renderer** | `src/renderer/` | UI 层 — hit / bubble / settings / update-bubble 4 窗口 HTML+CSS |
| 4 | **bridge** | `src/bridge/` | IPC 桥 — main↔renderer 双向 + panda CLI 信号 HTTP/SSE 订阅 |
| 5 | **state** | `src/state.ts` | PetState 12 态状态机 + 转移规则 + 持久化 |
| 6 | **theme** | `src/theme-loader.ts` `src/theme-renderer.ts` `themes/` | 主题装载+渲染（panda + template 双主题，18 物种 ASCII sprite） |
| 7 | **platform** | `src/platform/` | 跨平台关键代码（mac LSUIElement / win koffi user32 FFI / linux X11） |
| 8 | **i18n** | `src/i18n.ts` | 中英双语 i18n |
| 9 | **updater** | `src/updater.ts` | electron-updater 自动更新（GitHub release feedURL → `lc2panda/panda`） |

## 文件清单（v1.0 GA）

| 路径 | 职责 |
|------|------|
| `launch.cjs` | 跨平台启动入口（spawn electron GUI 模式 — 防 ELECTRON_RUN_AS_NODE 继承） |
| `package.json` | 子包 manifest（@lc2panda/panda-on-desk · electron 41 + builder 25） |
| `tsconfig.json` | TS 编译配置（noEmit · strict:false · path alias @panda/buddy + @panda/desk） |
| `electron-builder.yml` | 跨平台打包配置（mac dmg/zip × x64+arm64 / win NSIS x64 / linux AppImage+deb） |
| `build/entitlements.mac.plist` | macOS hardened runtime entitlements |
| `build/icons/` | 图标资产（panda.svg / panda.png / panda.icns / panda.ico）— **v1.0 占位 · v1.5 美术替换** |
| `src/main.ts` | Electron 主进程 god file（4 BrowserWindow + 单实例锁 + 生命周期） |
| `src/preload/` | preload 桥（contextBridge 暴露 IPC API 到 renderer） |
| `src/renderer/` | renderer UI（hit / bubble / settings / update-bubble 4 窗口） |
| `src/bridge/` | IPC 桥（main ↔ renderer 双向通信 + panda CLI 信号订阅） |
| `src/state.ts` | PetState 12 态状态机 + 转移规则 + 持久化 |
| `src/theme-loader.ts` / `theme-renderer.ts` | 主题装载 + 渲染（panda + template 双主题） |
| `src/platform/` | 跨平台关键代码（mac LSUIElement / win koffi user32 FFI / linux X11） |
| `src/i18n.ts` | 中英双语 i18n |
| `src/updater.ts` | electron-updater 自动更新（GitHub release 通道） |
| `themes/panda/` | panda 默认主题（18 物种 ASCII sprite → SVG 待补） |
| `themes/template/` | 主题模板（开发者参考） |
| `test/` | 单元测试（platform / smoke / theme-panda） |

## 开发与测试命令

```bash
cd packages/panda-on-desk

# TS 编译验证
bunx tsc --noEmit -p tsconfig.json

# 单元测试
bun test                       # === bun test packages/panda-on-desk/test/

# 跨平台打包（v1.0 GA 起可用 — 需先安装 electron@41 子包 deps）
bunx electron-builder --mac    # macOS dmg/zip × x64+arm64
bunx electron-builder --win    # Windows NSIS x64
bunx electron-builder --linux  # Linux AppImage + deb x64
```

## 上游致谢

panda-on-desk 基于 [clawd-on-desk](https://github.com/rullerzhou-afk/clawd-on-desk) (MIT) 81% 吸收 + 改造 fork。详见 `monitor/20260419-clawd-on-desk-调研报告.md` 与 `monitor/20260419-on-desk-A1-架构设计.md`。

---

> **领地标记规约**：一旦本目录结构发生变化（新增/删除子目录、重要文件），请务必更新本 README — 就像重新标记领地一样。
