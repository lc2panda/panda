# panda-on-desk

> Input：panda CLI 状态信号（PetState / token / cmd-count） · 用户桌面交互
> Output：透明 overlay 浮窗 + 宠物养成可视化 + 通知聚合（Electron 41 GUI）
> Pos：panda monorepo 子包 — 与 panda CLI（根目录）解耦，独立打包分发；与 panda CLI 的关系是「感知端 ↔ 信号源」，不替代 CLI

## 文件清单（v0.1-alpha · Phase 1 完成）

| 路径 | 职责 |
|------|------|
| `launch.cjs` | 跨平台启动入口（spawn electron GUI 模式 — 防 ELECTRON_RUN_AS_NODE 继承） |
| `package.json` | 子包 manifest（@lc2panda/panda-on-desk · electron 41 + builder 25） |
| `tsconfig.json` | TS 编译配置（noEmit · strict:false · path alias @panda/buddy + @panda/desk） |
| `electron-builder.yml` | 跨平台打包配置（mac dmg/zip × x64+arm64 / win NSIS x64 / linux AppImage+deb） |
| `build/` | 打包资产目录（icon / entitlements.mac.plist 占位 — 待 v0.5 美术补） |
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

## 启动方式

```bash
# 开发模式（直接 spawn electron）
cd packages/panda-on-desk
bun install              # v0.1-alpha 暂不必（仅占位 deps，未实际安装 electron@41）
bun start                # === node launch.cjs

# TS 编译验证
bunx tsc --noEmit -p tsconfig.json

# 单元测试
bun test                 # === bun test packages/panda-on-desk/test/

# 跨平台打包（v0.1-alpha 不可用 — 需先 install electron@41 子包 deps）
bunx electron-builder --mac    # macOS dmg/zip
bunx electron-builder --win    # Windows NSIS
bunx electron-builder --linux  # Linux AppImage + deb
```

## 与 panda CLI 的关系

```
┌─────────────────────────────┐         IPC（HTTP/SSE/hook）        ┌─────────────────────────────┐
│   panda CLI（根目录）       │  ───────────────────────────────►   │  panda-on-desk（本子包）     │
│   - Ink TUI                 │   PetState / token / cmd / 主动场景  │  - Electron GUI overlay      │
│   - PetState 12 态状态机    │                                      │  - 宠物可视化 + 养成动画     │
│   - 103 主动场景            │   ◄───────────────────────────────  │  - 通知聚合 + 权限气泡       │
│   - StatusLine mini-pet     │       用户操作 / 设置 / 解锁         │                              │
└─────────────────────────────┘                                      └─────────────────────────────┘
        信号源（authoritative）                                              感知端（reactive）
```

- **解耦原则**：panda CLI 不依赖 panda-on-desk 即可独立运行（`bun panda` 仍是 TUI 主体验）；panda-on-desk 是可选 GUI 增强
- **共享数据层**：经验值 / 物种 / 等级通过 panda CLI 端共享文件（`~/.config/panda/desk-state.json`）跨进程持久化
- **byte-equal 守护**：panda-on-desk 不动 panda CLI 的 `src/services/api/claude.ts` `oauth/*` `providers.ts`（anthropic 协议层零修改）

## 上游致谢

panda-on-desk 基于 [clawd-on-desk](https://github.com/rullerzhou-afk/clawd-on-desk) (MIT) 81% 吸收 + 改造 fork。详见 `monitor/20260419-clawd-on-desk-调研报告.md` 与 `monitor/20260419-on-desk-A1-架构设计.md`。

---

> **领地标记规约**：一旦本目录结构发生变化（新增/删除子目录、重要文件），请务必更新本 README — 就像重新标记领地一样。
