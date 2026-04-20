<!--
Input:  开发者贡献意图（新功能 / 新物种 / 新 PetState / 新 IPC / 跨平台 build）
Output: panda-on-desk 子包贡献流程清单（本地开发 → 资产替换 → 打包 → PR）
Pos:    panda-on-desk 子包开发者文档（与 README.md 用户视角解耦 · [NEW-FILE:#W7-04]）
        一旦贡献流程或目录结构变化，请同步本文与 packages/panda-on-desk/README.md。
-->

# CONTRIBUTING · panda-on-desk

> 适用范围：`packages/panda-on-desk/`（Electron 41 GUI 子包）
> 基线版本：v2.25.7 · 上游 fork：[clawd-on-desk](https://github.com/rullerzhou-afk/clawd-on-desk) (MIT) 81% 吸收
> 本文档面向**贡献者 / 维护者**。普通用户安装与使用请看 [`README.md`](./README.md)。
> 架构深潜与设计原理请看 [`ARCHITECTURE.md`](./ARCHITECTURE.md)。

---

## 目录

1. [本地开发流程](#1-本地开发流程)
2. [项目结构速览](#2-项目结构速览)
3. [主题资产替换路径](#3-主题资产替换路径如何用真实美术替换程序化-svg)
4. [添加新 PetState 步骤](#4-添加新-petstate-步骤)
5. [添加新物种步骤](#5-添加新物种步骤)
6. [添加新 IPC event 步骤](#6-添加新-ipc-event-步骤)
7. [跨平台 build 流程](#7-跨平台-build-流程macwinlinux)
8. [测试与验证](#8-测试与验证)
9. [PR Checklist](#9-pr-checklist)
10. [铁律 Red Lines](#10-铁律-red-lines)

---

## 1. 本地开发流程

### 1.1 环境前置

| 工具 | 最低版本 | 备注 |
|---|---|---|
| Node.js | 20.x | 与 Electron 41 一致 |
| Bun | 1.1+ | 仓库默认 runtime（脚本入口） |
| Git | 2.40+ | submodule + LFS 不需要 |
| Python | 3.10+ | 仅 macOS / Linux 编译原生模块（koffi）时偶发需要 |

### 1.2 克隆 + 安装

```bash
# 1) 克隆主仓库
git clone https://github.com/lc2panda/panda.git
cd panda

# 2) 根仓库依赖（panda CLI 主体）
bun install

# 3) 子包依赖（electron@41 + electron-builder@25 + electron-updater@6.8）
cd packages/panda-on-desk
bun install
```

> 子包 `node_modules/` 与根 `node_modules/` 互相独立。Electron 二进制（~80MB）只装一次，缓存在
> `~/.cache/electron/` 或 Windows 的 `%LOCALAPPDATA%\electron\Cache\`。

### 1.3 启动 dev 模式

```bash
cd packages/panda-on-desk
bun run start                 # === node launch.cjs（spawn electron GUI 模式）
```

`launch.cjs` 必须用 `node` 而不是 Electron 启动 —— 防止从 panda CLI 内部启动时
`ELECTRON_RUN_AS_NODE=1` 被继承，导致 Electron 退化为纯 Node runtime。

启动后预期：
- 创建 `~/.pandacc/runtime.json`（端口 + secret + pid）
- 监听 `127.0.0.1:1455`（占用则 +1 fallback 至首个空闲端口）
- 注册 4 个 BrowserWindow：`hit` / `bubble` / `settings` / `update-bubble`
- macOS：以 LSUIElement 隐藏 dock 图标，仅留菜单栏 Tray
- Windows / Linux：透明 alwaysOnTop overlay + 系统托盘菜单

### 1.4 常用调试入口

| 操作 | 入口 |
|---|---|
| 打开 renderer DevTools | 托盘菜单 → Settings → DevTools |
| 查看 main 进程日志 | 终端 stdout（`bun run start` 直接打印） |
| 持久化文件 | `~/.pandacc/desk-prefs.json` · `~/.pandacc/runtime.json` · `~/.config/panda/desk-state.json` |
| 重置所有状态 | 删除 `~/.pandacc/` 与 `~/.config/panda/desk-state.json` |
| 强制重置端口 | `pkill -f panda-on-desk`（mac/linux）/ 任务管理器结束（Windows） |

---

## 2. 项目结构速览

```
packages/panda-on-desk/
├── launch.cjs                # node 入口 spawn electron（防 ELECTRON_RUN_AS_NODE 继承）
├── package.json              # 子包 manifest（@lc2panda/panda-on-desk）
├── electron-builder.yml      # 跨平台打包配置（mac/win/linux）
├── tsconfig.json             # 子包 TS 配置（noEmit · path alias）
├── build/                    # 打包资产（icons / entitlements / screenshots）
│   ├── icons/                # panda.{icns,ico,png,svg} + tray-{light,dark}
│   ├── entitlements.mac.plist
│   └── screenshots/          # README/release 图片
├── src/
│   ├── main.ts               # god file — 4 BrowserWindow + 单实例锁 + 生命周期
│   ├── preload/              # contextBridge 沙箱（hit/bubble/settings/update-bubble 4 文件）
│   ├── renderer/             # UI 层（HTML+CSS+TS · 4 窗口）
│   ├── bridge/               # HTTP/SSE bridge（panda CLI 信号订阅）
│   │   ├── server.ts         # 主入口（端口探测 + runtime.json 落盘）
│   │   └── types.ts          # 协议契约（OnDeskEvent / RuntimeJson）
│   ├── state.ts              # PetState 12 态状态机
│   ├── theme-loader.ts       # JSON schema + SVG sanitize + 主题装载
│   ├── theme-renderer.ts     # 主题 → DOM 渲染
│   ├── tray/                 # 系统托盘菜单（W3-T1）
│   ├── badge/                # 红圆 badge（W2-T4）
│   ├── notification/         # 通知聚合（P2-T2）
│   ├── dnd/                  # 免打扰开关（P2-T5）
│   ├── platform/             # 跨平台抽象层
│   │   ├── mac-window.ts     # NSWindow Stationary collection + LSUIElement
│   │   ├── win-window.ts     # koffi user32 FFI（AllowSetForegroundWindow）
│   │   ├── linux-x11.ts      # X11 toolbar window type
│   │   └── login-item.ts     # 开机自启（OS 登录项 API）
│   ├── geometry/             # 跨平台几何（hit-box / work-area / drag-position）
│   └── updater.ts            # electron-updater（GitHub release feedURL）
├── themes/
│   ├── panda/                # panda 默认主题（18 物种 ASCII + SVG）
│   │   ├── theme.json        # schema：states + species + animations
│   │   └── sprites/          # 18 物种 × N 状态 SVG 资产
│   └── template/             # 主题模板（开发者参考）
├── test/                     # 单元 + 集成测试（21 文件 · 226 pass）
└── scripts/
    └── build-dist.cjs        # bun run build:dist 内部调用（清 dist + tsc）
```

---

## 3. 主题资产替换路径（如何用真实美术替换程序化 SVG）

> v1.0 GA 阶段，`themes/panda/sprites/` 内多为程序化生成的占位 SVG。
> 美术或贡献者可按以下流程替换为高保真资产，**不需要改任何 .ts 代码**。

### 3.1 资产规格

| 项 | 要求 |
|---|---|
| 格式 | SVG（推荐）/ PNG（≤ 256×256） |
| 视口 | `viewBox="0 0 200 200"`（与 `SIZES.M` 对齐） |
| 命名 | `<species>-<state>.svg` 或 `<species>.svg`（默认 idle） |
| 颜色 | 透明背景 · 主体 ≤ 4 色（Tray 反色友好） |
| 文件大小 | 单文件 ≤ 16KB（theme-loader sanitize 会剥 `<script>`/`<foreignObject>`） |

### 3.2 替换流程

```bash
# 1) 备份现有占位
cp -r themes/panda/sprites themes/panda/sprites.bak.$(date +%Y%m%d)

# 2) 替换单个 sprite（示例：替换 chonk 默认状态）
cp ~/Desktop/chonk-final.svg themes/panda/sprites/chonk.svg

# 3) 校验 SVG 通过 sanitize（不报错即通过）
bun test test/theme-panda.test.ts

# 4) dev 启动并切换物种验证
bun run start
# panda CLI 侧：/buddy theme chonk
```

### 3.3 主题包级别替换（整套美术）

如需贡献完整主题包（非默认 panda）：

1. 复制 `themes/template/` 为 `themes/<your-theme>/`
2. 按 `themes/template/theme.json` schema 填充 `states` / `species` / `animations`
3. 把 sprite 文件放入 `themes/<your-theme>/assets/`
4. 主题打包到独立 GitHub release（`theme-<name>.zip`），用户在 settings 面板"导入第三方主题"加载

> **重要**：第三方主题必须自带 LICENSE。clawd-on-desk 的 `themes/clawd/` 与 `themes/calico/`
> 资产受版权保护，**禁止 fork 复用**（架构设计 §1.4 已明示）。

---

## 4. 添加新 PetState 步骤

> PetState 必须在 panda CLI（根目录 `src/desk/types.ts`）与 panda-on-desk（`packages/panda-on-desk/src/state.ts`）
> **双向同步声明**。任何一侧缺失都会导致 bridge 静默丢弃事件。

### 4.1 步骤清单

```
[ ] 1. 在根目录 src/desk/types.ts 新增 PetState 字面量类型
[ ] 2. 在 packages/panda-on-desk/src/bridge/types.ts 同步 OnDeskEvent.payload.state 联合类型
[ ] 3. 在 packages/panda-on-desk/src/state.ts 的 STATE_PRIORITY 表新增优先级
[ ] 4. （可选）在 ONESHOT_STATES 加入 Set，让该状态自动回弹到 idle
[ ] 5. 在 themes/panda/sprites/ 为 18 物种各补一个 <species>-<new-state>.svg
[ ] 6. 在 themes/panda/theme.json 的 _stateBindings 注册新 state 与 sprite 映射
[ ] 7. 在 packages/panda-on-desk/test/dispatcher.test.ts 加 case
[ ] 8. 在 packages/panda-on-desk/README.md 的 12 PetState 表新增一行
```

### 4.2 优先级原则

`STATE_PRIORITY`（`src/state.ts` L73-84）：
- **8 = error**：API 异常 / 工具失败 — 最高
- **7 = notification**：主动场景推送
- **5-6 = sweeping / attention**：等待用户行为
- **3-4 = working / juggling / carrying**：长任务
- **0-2 = sleeping / idle / thinking**：常态

新 state 落点必须不与现有抢占规则冲突。如果不确定优先级，提 issue 与维护者讨论后再实装。

---

## 5. 添加新物种步骤

> 物种白名单 `PANDA_SPECIES_WHITELIST` 在三处声明：
> 1. panda CLI 根目录（影响 `/buddy theme <species>` 命令补全）
> 2. `packages/panda-on-desk/src/prefs.ts`（设置面板下拉项）
> 3. `themes/panda/theme.json` 的 `species` 字段（renderer 装载）

### 5.1 步骤清单

```
[ ] 1. 在 src/prefs.ts 的 PANDA_SPECIES_WHITELIST 数组追加新 species ID（小写英文 + 短横线）
[ ] 2. 在根目录 src/desk/types.ts 同步 SpeciesId 字面量类型
[ ] 3. 在 themes/panda/sprites/ 添加 ASCII + SVG：
       <species>.ascii        （默认 idle）
       <species>.svg          （默认 idle）
       <species>-thinking.svg （可选：state 专属）
       <species>-error.svg    （可选）
[ ] 4. 在 themes/panda/theme.json 的 species 字段加 entry
[ ] 5. 在 packages/panda-on-desk/test/theme-panda.test.ts 加 case
[ ] 6. 在 packages/panda-on-desk/test/species-switch.test.ts 加切换 case
[ ] 7. 在 packages/panda-on-desk/README.md 的 18 物种表追加一行（如 v 数 ≥ 19）
[ ] 8. 在根仓库 CHANGELOG 记录新物种与设计意图
```

### 5.2 物种命名规约

- ID：小写英文 + 短横线（`red-fox` 而非 `redFox` 或 `RED_FOX`）
- 中文名：2-3 字（设置面板下拉宽度限制）
- ASCII 形：1×5 ~ 2×7 字符（与 panda CLI mini-pet 兼容）
- SVG：viewBox `0 0 200 200` · 透明背景

---

## 6. 添加新 IPC event 步骤

> IPC 通道命名规约：`panda:<domain>:<action>`（如 `panda:state:set`、`panda:desk-prefs:save`）
> 所有跨 context 调用走 contextBridge 沙箱（`contextIsolation:true` / `nodeIntegration:false`）。

### 6.1 单向广播（main → renderer）

```
[ ] 1. 在 src/preload/<window>.ts 的 contextBridge.exposeInMainWorld 加 listener
       例：onPetStateChange: (cb) => ipcRenderer.on('panda:state:set', cb)
[ ] 2. 在 src/main.ts 用 webContents.send('panda:state:set', payload) 广播
[ ] 3. 在 src/renderer/<window>.ts 调 window.pandaAPI.onPetStateChange((evt, payload) => {...})
[ ] 4. 在 test/ 加 mock IPC 单测
```

### 6.2 双向 invoke（renderer → main → renderer）

```
[ ] 1. 在 src/preload/<window>.ts 暴露 invoke：
       savePrefs: (data) => ipcRenderer.invoke('panda:desk-prefs:save', data)
[ ] 2. 在 src/main.ts 注册 ipcMain.handle('panda:desk-prefs:save', async (_evt, data) => {...})
[ ] 3. handler 必须 try/catch + 返回 { ok: boolean, error?: string }
[ ] 4. 在 src/renderer/<window>.ts 调 await window.pandaAPI.savePrefs(data)
[ ] 5. 在 test/dispatcher.test.ts 加 case
```

### 6.3 panda CLI → bridge HTTP event

```
[ ] 1. 在 src/bridge/types.ts 的 OnDeskEvent 联合类型新增 type 字面量
[ ] 2. 在 src/bridge/server.ts 的 VALID_EVENT_TYPES Set 注册新 type
[ ] 3. 在 dispatchEvent switch case 路由到对应 sub-dispatcher
[ ] 4. 在 panda CLI 侧 src/desk/bridge.ts 加 sendEvent('<new-type>', payload) 发送点
[ ] 5. 在 test/dispatcher.test.ts 加端到端 case
```

### 6.4 安全要求

- 所有 IPC payload 必须 schema 校验（推荐 `zod`，与根仓库一致）
- HTTP bridge 必须带 `X-Panda-Secret` 头（`runtime.json` 内 secret 双向校验）
- 不许在 IPC 通道传输文件系统绝对路径之外的敏感数据（token / API key）

---

## 7. 跨平台 build 流程（mac/win/linux）

### 7.1 dry-run（仅生成 unpacked 目录，不打 installer）

```bash
cd packages/panda-on-desk

# 各平台只能在对应 OS 上跑 dry-run（mac 不能跨 build win exe，反之亦然）
bunx electron-builder --dir --mac    # → dist-electron/mac/
bunx electron-builder --dir --win    # → dist-electron/win-unpacked/
bunx electron-builder --dir --linux  # → dist-electron/linux-unpacked/
```

### 7.2 完整打包（生成 installer 制品）

```bash
# macOS：dmg + zip × x64+arm64（4 制品）
bunx electron-builder --mac

# Windows：NSIS x64 setup.exe（1 制品）
bunx electron-builder --win

# Linux：AppImage + deb × x64（2 制品）
bunx electron-builder --linux
```

### 7.3 CI 自动打包（推荐）

push tag `desk-vX.Y.Z` 自动触发 `.github/workflows/release-panda-on-desk.yml`：
- macOS / Windows / Linux runner 并行打包
- 自动上传到 GitHub Release（需 `GITHUB_TOKEN` secret）
- electron-updater 通过 `latest-mac.yml` / `latest.yml` / `latest-linux.yml` 拉取

```bash
# 触发流程
git tag desk-v1.0.1
git push origin desk-v1.0.1
```

### 7.4 常见 build 问题

| 症状 | 修复 |
|---|---|
| `Cannot find module 'electron'` | `cd packages/panda-on-desk && bun install` |
| Windows `addWinAsarIntegrity` UNKNOWN/EBUSY | 关闭 OneDrive 同步该目录 / 暂停杀软实时扫描 |
| macOS `code object is not signed` | 开发期可忽略；release 必须 codesign + notarize |
| Linux AppImage 启动 `FUSE not found` | `sudo apt install libfuse2`（Ubuntu 22.04+） |
| `koffi` 编译失败 | 安装 `python@3.10` + `build-essential`（Linux）/ Visual Studio Build Tools（Windows） |

---

## 8. 测试与验证

### 8.1 单元 + 集成测试

```bash
cd packages/panda-on-desk
bun test                          # 21 文件 · 226 pass（W3 收尾基线）
bun test test/dispatcher.test.ts  # 单文件
bun test test/e2e-real-process.test.ts  # 真 spawn electron 子进程
```

### 8.2 TypeScript 编译验证

```bash
bunx tsc --noEmit -p tsconfig.json   # 仅类型检查不产物
```

### 8.3 提交前自检

```bash
# 根仓库根目录跑（守护 byte-equal 红线）
git diff main -- src/services/api/claude.ts src/services/oauth src/services/api/providers.ts | wc -l
# 必须输出 0
```

### 8.4 手动回归点

| 场景 | 验证 |
|---|---|
| 端口冲突 | 启动两实例 → 第二个应 fallback 到 1456 |
| 单实例锁 | 双击 dock 图标第二次 → 触发 second-instance focus |
| DND 模式 | Tray → DND mode → 通知静默 |
| 物种切换 | panda CLI `/buddy theme <species>` → renderer 立即换 sprite |
| auto-update | 改 `package.json` 版本号 → 触发 update-bubble |

---

## 9. PR Checklist

提 PR 前请勾选：

```
[ ] 描述：问题背景 / 修改点 / 影响范围 / 回滚方式
[ ] 分支：从 main 拉新分支（feat/W7-* · fix/* · refactor/*）
[ ] 单元测试：bun test 全 pass（≥ 226 case）
[ ] 类型检查：bunx tsc --noEmit 无报错
[ ] byte-equal：git diff main -- src/services/api/claude.ts src/services/oauth src/services/api/providers.ts → 输出空
[ ] 三平台 dry-run：至少在本地 OS 上跑 bunx electron-builder --dir 通过
[ ] 文档更新：README / CONTRIBUTING / ARCHITECTURE 任一相关文档同步修订
[ ] 资产 LICENSE：新增 SVG / 字体 / 音效附 LICENSE 来源声明
[ ] commit message：feat: / fix: / refactor: / docs: / test: 前缀（git-workflow 规约）
[ ] 新文件：必要新建走 [NEW-FILE:#YYYYMMDD-XX] 标签 + 在根 CLAUDE.md 特例登记
```

---

## 10. 铁律 Red Lines

> 以下条款 **不可商量**。违反将直接关 PR 不审。

1. **anthropic byte-equal**：panda-on-desk 不得修改根仓库以下三处任意一字节：
   - `src/services/api/claude.ts`
   - `src/services/oauth/**`
   - `src/services/api/providers.ts`
2. **0 新依赖默认**：子包 `package.json` 不允许新增 npm 依赖；如必须，PR 描述需列出：
   替代方案 / 包大小 / 维护活跃度 / 上次更新时间 / 安全审计结论
3. **无远程通信**：bridge 只能监听 `127.0.0.1`（loopback），不许暴露任何外网端口
4. **secret 双向校验**：所有 HTTP IPC 调用必须校验 `runtime.json` 内 secret，mismatch 返回 401
5. **解耦原则**：panda CLI 不依赖 panda-on-desk 即可独立运行（`bun panda` 必须仍是 TUI 主体验）
6. **无虚假资产**：禁止程序化生成假美术冒充真实物种（v1.0 阶段允许占位但需 README 标注 "占位 · v1.5 美术替换"）
7. **跨进程持久化**：所有写盘操作必须 atomic（tmp + rename），防止 panda CLI 读到半截 JSON

---

> **领地标记规约**：一旦贡献流程发生变化（新工具链 / 新平台 / 新模块），请同步本文 —
> 就像重新标记领地一样。
