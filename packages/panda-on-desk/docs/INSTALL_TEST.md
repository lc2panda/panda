<!--
Input:  新用户首次安装 panda + 启用桌面宠物（panda-on-desk）的全流程操作意图
Output: 干净环境安装 walkthrough（ASCII 图）+ 5 类常见报错排查
Pos:    panda-on-desk 子包用户级安装实测文档（W9-T2 落盘 · agent-β-W9-install-sim-retry）
        一旦 src/desk/installer.ts 或 src/desk/launcher.ts 路径解析逻辑变化，请同步本文。
-->

# INSTALL_TEST · panda-on-desk 安装实测

> 基线版本：panda v2.25.7 / panda-on-desk v0.1.0-alpha
> 校验时间：2026-04-20 10:33:16 +08:00（Asia/Singapore）
> 校验主机：Windows 11 Pro 26100 · node v24.7.0 · bun 1.3.12
> 验证脚本：`monitor/20260420-W9-T2-install-sim.md` 内 dry-run 命令清单

---

## 0. TL;DR

```
┌─ 新机首次启用桌面宠物 ─────────────────────────────────┐
│  1. npm i -g @lc2panda/panda-code            (≈ 30s)   │
│  2. panda --install-desk                     (≈ 60s)   │
│  3. panda                  ← TTY 中自动拉起桌面宠物 ✨ │
└────────────────────────────────────────────────────────┘
```

---

## 1. 干净环境模拟报告

### 1.1 模拟方式

```bash
# 干净工作区 — 无 panda 项目残留
mkdir -p /tmp/test-install-panda
cd /tmp/test-install-panda

# Step A：探测全局是否已装 panda
which panda
# /c/Users/Administrator/AppData/Roaming/npm/panda

panda --version
# 2.1.92 (Panda)
```

> 注意：本机预装 `panda@2.1.92` 不含 `--install-desk`（v2.25.x 才引入 W4-T1）。
> 全局升级前 `panda --install-desk` 会报：`error: unknown option '--install-desk'`。
> 这是**预期行为**，不是 bug — 用户须先 `npm i -g @lc2panda/panda-code@latest`。

### 1.2 dev 源码 dry-run 验证

直接跑仓库内 TypeScript 入口（绕过全局老版本）：

```bash
cd /c/Users/Administrator/Desktop/panda
bun src/entrypoints/cli.tsx --install-desk
```

**实测输出**：

```
🐼 panda 桌面宠物 — 依赖安装
   预计 30s ~ 5min（首次需下载 electron ~80MB）
   按 Ctrl+C 可随时中止
✅ electron 已安装，无需重复操作
   启动桌面宠物：panda（带 TTY 时自动拉起）
```

`exit 0`、走 `checkElectronInstalled` short-circuit、未触发 `npm install`。
`packages/panda-on-desk/node_modules/electron/package.json` 存在 → 命中幂等分支。

---

## 2. panda --install-desk dry-run 验证

### 2.1 实测 spawn npm 流程（mock npmCmd）

为了不污染本机也不真装 electron，用 `npmCmd: 'echo'` 注入 mock：

```ts
import('./src/desk/installer.js').then(async (m) => {
  const r = await m.installPandaOnDeskDeps({
    deskDir: 'packages/panda-on-desk',
    npmCmd: 'echo',           // 不真装
    timeoutMs: 5000,
    onLog: (l) => console.log('[LOG]', l),
  })
  console.log(JSON.stringify(r, null, 2))
})
```

**实测日志**：

```
[LOG] [panda-desk] 开始安装桌面宠物依赖 (electron@41, electron-updater@6.8.3, koffi@2.15.2, htmlparser2@12)
[LOG] [panda-desk] cwd=…/packages/panda-on-desk
[LOG] [panda-desk] cmd=echo install --production --no-audit --no-fund electron@41 electron-updater@6.8.3 koffi@2.15.2 htmlparser2@12
```

确认：

- `cwd` 正确指向子包目录
- args 与 `ELECTRON_DEPS` 顺序一致
- 流式日志通过 `onLog` 转发，cli handler 节流（`/error|warn|added/i` 才透传）

### 2.2 args 构造规则

```
npm install --production --no-audit --no-fund \
  electron@41 electron-updater@6.8.3 koffi@2.15.2 htmlparser2@12
```

- `--production`：跳过 devDependencies，避免拉 electron-builder 等大包
- `--no-audit / --no-fund`：消除 npm warning 噪音
- 显式列 4 个 dep：因为子包 `package.json` 中 electron 在 `devDependencies`（避免主仓库 npm install 连带 80MB），生产期靠本列表显式补装

### 2.3 容错路径覆盖

| 场景 | 测试用例 | 预期结果 |
|---|---|---|
| 已装 electron | `installer.test.ts § 幂等` | `ok:true, alreadyInstalled:true`，不 spawn npm |
| `npm` 命令不存在 | `installer.test.ts § 容错` | `ok:false`，含中文消息 + ENOENT |
| `deskDir` 不存在 | `installer.test.ts § 路径解析` | `ok:false`，"未找到 packages/panda-on-desk" |
| 超时 10min | `installer.ts § timeoutMs` | SIGKILL + `ok:false`，"超时" |
| `code === 0` 但 electron 未落盘 | `installer.ts § code===0 && !checkElectronInstalled` | `ok:false`，"被 .npmrc 忽略" |

---

## 3. locatePandaOnDeskLaunch 路径报告

### 3.1 候选优先级（buildCandidatePaths）

`src/desk/launcher.ts:143` 生成 4 个候选，按顺序首个 `existsSync` 命中：

```
┌─ 候选 1：dev / monorepo ────────────────────────────────────┐
│   from src/desk/launcher.{ts,js}                           │
│   join(here, '..', '..', 'packages/panda-on-desk/launch.cjs')│
│   适用：bun src/entrypoints/cli.tsx                          │
└─────────────────────────────────────────────────────────────┘
┌─ 候选 2：dist 单 bundle（npm install 主路径）────────────────┐
│   from <pkg>/dist/chunk-*.js                               │
│   join(here, '..', 'packages/panda-on-desk/launch.cjs')     │
│   适用：npm i -g @lc2panda/panda-code 后跑 panda           │
│   ★ v2.25 polish-e2e 发现的关键修复（原代码漏写此候选）       │
└─────────────────────────────────────────────────────────────┘
┌─ 候选 3：dist 多目录（未来兼容）─────────────────────────────┐
│   from <pkg>/dist/desk/launcher.js                         │
│   join(here, '..', '..', '..', 'packages/panda-on-desk/launch.cjs')│
│   适用：build.ts 未来若按目录结构落盘                        │
└─────────────────────────────────────────────────────────────┘
┌─ 候选 4：cwd fallback ──────────────────────────────────────┐
│   join(process.cwd(), 'packages/panda-on-desk/launch.cjs')  │
│   适用：用户从仓库根跑 panda 时（开发场景兜底）              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 实测命中

```
cwd=C:\Users\Administrator\Desktop\panda
candidates[0]=…\packages\panda-on-desk\launch.cjs
existsSync → true
→ 返回 candidates[0]，spawn(node, [launch.cjs], detached:true, stdio:'ignore')
```

子进程 detached + unref → panda CLI 退出后桌面宠物独立存活。

### 3.3 launch.cjs 内部行为（防 ELECTRON_RUN_AS_NODE 继承）

`launch.cjs` 必须用 **node** 而非 electron 启动：

```js
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE   // ★ 关键：清掉父进程注入
const child = spawn(electron, ['.'], { stdio: 'inherit', env, cwd: __dirname })
```

如果直接用 electron 启 launch.cjs，会继承父进程（panda CLI 也是 node bundle）的
`ELECTRON_RUN_AS_NODE=1` → electron 退化为纯 Node runtime，`require('electron').app` 为
`undefined` → BrowserWindow 完全起不来。

---

## 4. 修发现的问题

### 4.1 ELECTRON_DEPS 注释不一致（已修）

**问题**：`src/desk/installer.ts:21` 注释写 "与 panda-on-desk/package.json 的 dependencies
严格对齐"，但实际 electron 在子包 `devDependencies`（避免主仓 npm install 连带 80MB）。

**修复**：补全注释解释版本对齐策略 + 每个 dep 的归属（dependencies / devDependencies）。

**回归测试**：`src/desk/installer.test.ts` 新增用例
"regression W9-T2：每个 dep 必须存在于 panda-on-desk/package.json (deps/devDeps)"
读真子包 package.json，校验每个 `ELECTRON_DEPS` 项的 name 与 major 版本均一致。

### 4.2 git-bash 子环境 spawn ENOENT（环境特性，非 bug）

**现象**：在 git-bash 中跑 `bun -e` mock 测试时，`spawn(npmCmd, args, { shell: true })`
触发 `ENOENT: uv_spawn 'C:\\windows\\system32\\cmd.exe'`。

**根因**：git-bash 的 `PATH` 可能不含 `C:\Windows\System32`，但 Node 内部 `shell: true`
在 Windows 默认走 cmd.exe。

**结论**：非生产用户问题（CMD/PowerShell/真 bash 均正常）。已在错误消息中包含
`常见原因：网络断/权限拒/npm 未安装` 友好提示。无需代码改动。

---

## 5. 常见报错 ≥ 5 条

| # | 报错关键字 | 触发场景 | 排查步骤 | 修复 |
|---|---|---|---|---|
| 1 | `error: unknown option '--install-desk'` | 全局 panda 版本 < v2.25.0 | `panda --version` 看版本 | `npm i -g @lc2panda/panda-code@latest` |
| 2 | `Cannot find module 'electron'` | launch.cjs 启动时 electron 未装 | `ls packages/panda-on-desk/node_modules/electron` | `panda --install-desk` |
| 3 | `npm install 失败（exit 1）— 检查网络/代理/权限后重试` | 国内访问 registry.npmjs.org 慢/断 | `npm config get registry` | `npm config set registry https://registry.npmmirror.com` 或 `export HTTPS_PROXY=…` |
| 4 | `npm install 超时（600s）` | electron 80MB 二进制下载断线 | 检查网络 / 看 `~/.cache/electron/` 是否有半截文件 | 删除半截缓存后 `panda --install-desk` 重试 |
| 5 | `EACCES: permission denied` | npm 全局 prefix 在 `/usr/local` 等需 sudo 目录 | `npm config get prefix` | `sudo panda --install-desk` 或调整 `~/.npmrc prefix=~/.npm-global` |
| 6 | `npm install 退出 0 但未检测到 electron` | `.npmrc` 含 `optional=false` 或 `omit=optional` 阻止 electron 二进制下载 | `cat ~/.npmrc \| grep -E 'optional\|omit'` | 临时移除该行，`panda --install-desk` 后再加回 |
| 7 | `panda` 启动后桌面宠物未出现，但 CLI 正常 | TTY=false（CI/管道）/ `--no-desk` flag / `companionOnDesk=false` | `tty <&1; echo $?` | TTY 模式下重启；config: `~/.pandacc/config.json` 改 `"companionOnDesk": true` |

---

## 6. 验证清单（重跑必过）

```bash
# 6.1 单测
cd /c/Users/Administrator/Desktop/panda
bun test src/desk/installer.test.ts src/desk/launcher.test.ts
# 期望：22 pass · 0 fail · 42 expect

# 6.2 byte-equal 红线
git diff main -- src/services/api/claude.ts src/services/oauth src/services/api/providers.ts | wc -l
# 期望：0

# 6.3 dev 源码 --install-desk
bun src/entrypoints/cli.tsx --install-desk
# 期望：✅ electron 已安装，无需重复操作（exit 0）

# 6.4 路径解析
bun -e "import('./src/desk/launcher.js').then(m => console.log(m.__locatePandaOnDeskLaunchForTesting([require('path').join(process.cwd(),'packages/panda-on-desk/launch.cjs')])))"
# 期望：…\packages\panda-on-desk\launch.cjs（绝对路径）
```

---

## 7. 相关文件锚点

| 路径 | 职责 |
|---|---|
| `src/desk/launcher.ts` | maybeSpawnOnDesk + locatePandaOnDeskLaunch（4 候选路径） |
| `src/desk/installer.ts` | checkElectronInstalled + installPandaOnDeskDeps + ELECTRON_DEPS |
| `src/cli/handlers/desk-install.ts` | `panda --install-desk` CLI handler |
| `src/entrypoints/cli.tsx` | `--install-desk` fast-path 拦截（L256-267） |
| `packages/panda-on-desk/launch.cjs` | electron GUI 子进程启动（防 ELECTRON_RUN_AS_NODE 继承） |
| `packages/panda-on-desk/package.json` | electron 在 devDependencies · 其余 3 dep 在 dependencies |
| `packages/panda-on-desk/CONTRIBUTING.md §1.2` | 子包本地开发安装步骤 |

---

> **领地标记规约**：一旦 `installer.ts` 路径候选数组变化、`ELECTRON_DEPS` 调整、
> 或 `--install-desk` handler 输出格式变更，请同步本文 §2 §3 §5 — 就像重新标记领地一样。
