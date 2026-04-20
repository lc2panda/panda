<!--
Input:  panda-on-desk 全部版本/测试/性能/bug/排查信息散落在多个文档
Output: 一键查看的子产品总状态看板（指挥官 / 用户 / 维护者通用）
Pos:    panda-on-desk 子包根 STATUS 看板 — 与 README/ARCHITECTURE/CONTRIBUTING/PRIVACY 平级
        [NEW-FILE:#W12-03] · 2026-04-20 +08:00 W12-T4 文档审计落盘（agent-δ-W12-docs-audit）
        W15-T3 · 2026-04-20 +08:00 CHANGELOG agent（agent-γ-W15-changelog）同步 v2.25.16–23 + 14 波交付列表
        W21-T3 · 2026-04-20 +08:00 README v4 agent（agent-γ-W21-readme）同步 v2.25.24–30 + 21 波交付列表 + Mac 顶部黑框 P0 nuclear fix
        W22-T3 · 2026-04-20 +08:00 final agent（agent-γ-W22-final）同步 v2.25.31 + 全量 1654 pass / 0 fail + RELEASE_NOTES_v2.25.md
        W23-T2 · 2026-04-20 +08:00 status final agent（agent-β-W23-status-final）升级为 23 波 / 33 版本完整里程碑总览 + 4 大里程碑 + 4 P0 收尾 + 关键质量指标
        一旦发版 / 测试基线 / 性能基线 / 已知 bug 列表 变化，请同步本文件。
-->

# STATUS · panda-on-desk 一键看板

> 本看板汇总 panda-on-desk 子产品**当前真实状态**。所有数据带来源锚点，可下钻到具体 monitor 报告 / commit / 文件路径。
> 如需历史版本演进详情，请看 [`../../CHANGELOG.md`](../../CHANGELOG.md)；如需架构原理，请看 [`./ARCHITECTURE.md`](./ARCHITECTURE.md)。

---

## 0. 时间真实性校验（W12-T4 落盘）

| 项 | 值 |
|---|---|
| 校验起始 | 2026-04-20 11:32:18 +08:00 (Asia/Singapore) |
| 校验完成 | 2026-04-20 11:36:00 +08:00 |
| 时间源 1 | 本机 `git log --format=%ci HEAD` → `2026-04-20 11:31:00 +0800` |
| 时间源 2 | W11-T1 报告 `monitor/20260420-W11-T1-ci-retrigger.md` §0：`api.github.com` Date 头 = `Mon, 20 Apr 2026 03:38:46 GMT` = 11:38:46 +08:00 |
| 最大偏差 | < 60 秒（≪ 100 秒阈值） |
| 判定 | **PASS** |

本看板所有「检测时间 / 判定时间」统一引用本节通过的时间锚点。

---

## 1. 当前版本（一行知 baseline）

| 维度 | 值 | 来源 |
|---|---|---|
| panda CLI 版本 | **v2.25.32** | `package.json` L3 |
| panda-on-desk 子包版本 | **v0.1.0-alpha** (内部) / 对外 desk-v1.0.3 GA | `packages/panda-on-desk/package.json` L3 |
| 桌面端 GA 标签 | **desk-v1.0.3** (2026-04-20 W22-T4 最终触发) | `monitor/20260420-W22-T4-desk-release.md` |
| Electron runtime | **41.2.1** | `packages/panda-on-desk/package.json` devDeps |
| Node 兼容 | ≥ 18.0.0 | `package.json` engines |
| Bun 兼容 | ≥ 1.2.0 | `package.json` engines |
| 仓库 | `lc2panda/panda` (private) | git remote |
| 最新发版日期 | **2026-04-20** (UTC+8) | git log HEAD `c3b81a1` |
| 最新 commit | `c3b81a1` — `feat: 波 22 全 4/4 — 多屏 + mini-pet + 最终验证 1654/0 + desk-v1.0.3 (v2.25.32)` | `git log -1` |
| 全量测试基线 | **1654 pass · 0 fail · 1 skip · 99 files · 7874 expect()** (W22-T3 final, 连续 2 次 stable) | `monitor/20260420-W22-T3-final.md` |
| 端到端波次 | **23 波 / 33 版本** (v2.25.0 → v2.25.32 · 2026-04-19~20 23h 无人值守) | `monitor/20260419-OD-*` + `monitor/20260420-W*` |
| 4 个 release tags | desk-v1.0.0 / .1 / .2 / .3 全部就位（git ls-remote 已验证） | `monitor/20260420-W22-T4-desk-release.md` §2.3 |

---

## 2. 测试基线 / 覆盖率

### 2.1 测试套件总览

| 维度 | 值 | 锚点 |
|---|---|---|
| 全量测试用例 | **1654 pass · 0 fail · 1 skip · 7874 expect() · 99 files · 39.81s** (W22-T3 final 连续 2 次 stable) | `monitor/20260420-W22-T3-final.md` §1.1 |
| 预存基线 fail | **0** (W15-T2 端口 race 修后达成里程碑 → W16-W22 持续守住 8 波) | CHANGELOG v2.25.24–32 / monitor `20260420-W22-T3-final.md` |
| panda-on-desk 子包用例 | **226+ pass** + 后续波次新加（a11y 13 / logger 14 / telemetry 12 / window-lifecycle / petStats.migration / benchmarks 7 / perf 12 / perf-v2 10 / e2e-real-process 13 / screenshots 8 / a11y-headless / startup 5 / real-screenshots 4 + ...） | CHANGELOG v2.25.0–v2.25.15 / `packages/panda-on-desk/test/` |
| 子包测试目录 | `packages/panda-on-desk/test/` | — |
| 关键模块覆盖率 | **+74.32%** (W10-T1 retry 提升基线) | CHANGELOG v2.25.14 |
| TypeScript typecheck | 125 errors → 修 105 → 留 **2 TODO**（test/mac-bootstrap-e2e.test.ts L396/L446 mock 签名）；W20-T4 实测 ≤ 20 阈值 PASS | CHANGELOG v2.25.14 + W20-T4 实测 |
| Lint (biome) | 8/8 自动 fix（unused imports / format） | CHANGELOG v2.25.11 |
| build | `bun run build` 0 error | v2.25.10/14 实测 |
| deps 安全审计 | `npm audit` 0 vulnerabilities | CHANGELOG v2.25.10 |

### 2.2 测试分层

| 层级 | 文件示例 | 覆盖范围 |
|---|---|---|
| 单元测试 | `packages/panda-on-desk/test/*.test.ts` (~30+ 文件) | state.ts / theme-loader / dispatcher / IPC channels / a11y / logger / telemetry / petXP |
| 集成测试 | `src/desk/launcher.integration.test.ts` ([NEW-FILE:#W7-01]) | spawn mock electron / fail mode / port already in use / `ELECTRON_RUN_AS_NODE` |
| 真 e2e | `packages/panda-on-desk/test/e2e-real-process.test.ts` (W5-T1 · 13 用例) | mock HTTP server + panda CLI pushNotification + 端口 1455→1456 fallback + runtime.json 字段校验 + secret mismatch 401 + on-desk 离线不阻塞 CLI |
| 真截屏 e2e | `packages/panda-on-desk/test/real-screenshots.test.ts` (W11-T2 · 4 用例) | electron headless `capturePage().toPNG()` 真渲染 hit.html → 7 真 PNG (200×200 RGBA / 17–19 KB) 落盘 `build/screenshots/real/` |
| 性能基准 | `packages/panda-on-desk/test/benchmarks.ts` (W8-T4 · 7 测试点) | maybeSpawnOnDesk / IPC POST / BadgeManager / DispatchEvent / SVG preload / petXP.addXP / StatStorage |
| Anthropic byte-equal 守护 | `git diff main -- src/services/api/claude.ts src/services/oauth src/services/api/providers.ts` | 输出空 → 0 触碰 |

---

## 3. 性能基线（W8-T4 + W11-T4 · 实测）

### 3.1 7 关键路径性能（W8-T4 benchmarks）

| # | 测试点 | 性能 | 余量 vs 阈值 |
|---|---|---|---|
| 1 | `maybeSpawnOnDesk` 启动判断 | p95 = **0.0001 ms** | **50000×** 余量 |
| 2 | IPC HTTP POST `127.0.0.1:1455+/state` | p95 = **0.46 ms** | **21×** 余量 |
| 3 | BadgeManager dedupe | **2.57 M ops/s** | **257×** 余量 |
| 4 | DispatchEvent (103 场景) | p99 = **0.018 ms** | **1100×** 余量 |
| 5 | SVG preload (19 物种) | p95 = **1.17 ms** | **42×** 余量 |
| 6 | `petXP.addXP` | **1.90 M ops/s** | **19×** 余量 |
| 7 | StatStorage save (HMAC sign) | p95 = **1.23 ms** | **81×** 余量 |

> CI 基准回归检测：`.github/workflows/ci-bench.yml`（W8-T4 落盘）。

### 3.2 启动时延（W11-T4 · v3 优化）

| 维度 | 优化前 | 优化后 | 改善 |
|---|---|---|---|
| panda CLI 启动 → 桌面端首帧 | 基线 (W8 测) | 实测 5 次平均 | **-9.2%** |

优化点（4 项）：
1. `maybeSpawnOnDesk` 完全异步化（非阻塞主路径）；
2. `dynamic import()` 延后大模块；
3. 大 deps（如 sharp / koffi / electron-updater）lazy load；
4. require chain 精简（删冗余 require）。

### 3.3 包大小

| 维度 | 值 | 来源 |
|---|---|---|
| panda CLI npm tarball | **6.4 MB** (含 9 截图 + 14 svg + 7 apng + scripts) | CHANGELOG v2.25.7 / W16-T1 |
| panda-on-desk 安装大小 | **~80 MB** (含 electron@41 runtime) | README §Comparison |
| 9 PNG 截图 | **~158 KB** total | CHANGELOG v2.25.7 |
| 7 APNG 真动图 | **~508 KB** total (48–95 KB / file) | W16-T1 · `build/screenshots/apng/` |

### 3.4 7 APNG 真动图清单（W16-T1 · v2.25.25）

| # | 状态 | 文件 | 帧数 | 时长 | 大小 | 动画要点 |
|---|---|---|---|---|---|---|
| 1 | idle | `panda-idle.apng` | 6 | 3000 ms | 72.5 KB | scale 1 ↔ 1.035 呼吸 |
| 2 | thinking | `panda-thinking.apng` | 8 | 1000 ms | 95.4 KB | `?` y 42↔36 浮动 + 旋转 |
| 3 | working | `panda-working.apng` | 6 | 800 ms | 75.7 KB | 脸 ±3° 摇头 + 齿轮 360° |
| 4 | sleeping | `panda-sleeping.apng` | 8 | 2000 ms | 92.0 KB | 闭眼 + Z 飘起 + 慢呼吸 |
| 5 | error | `panda-error.apng` | 4 | 1000 ms | 49.7 KB | 摔倒 0→30° + X 眼消失 |
| 6 | attention | `panda-attention.apng` | 4 | 500 ms | 49.0 KB | 跳跃 0→-10px + 光圈脉冲 |
| 7 | notification | `panda-notification.apng` | 6 | 400 ms | 74.3 KB | 头摇摆 + 铃铛晃动 |
| — | **合计** | — | **42 帧** | — | **~508 KB** | 所有 PNG 超集 · acTL / fcTL / fdAT chunks · GitHub / 浏览器 / Discord / 邮件原生自动播放 |

> 生成脚本：[`scripts/build-apng.cjs`](./scripts/build-apng.cjs) ([NEW-FILE:#W16-01])。sharp 光栅化 SVG 帧 + 纯 JS APNG chunk 合成器（Node 原生 zlib CRC32 + Buffer 拼接，0 新依赖）。嵌入位置：主仓 README `§🎬 视觉演示（7 状态序列）`（v2.25.25 W17-T2 主对比表升级为 APNG）+ 本子包 README `§实时 demo（APNG）`。

---

## 4. 23 波端到端 agent 交付列表（v2.22.0 → v2.25.32 · 44 版本 · 23h 无人值守）

> 完整变更详见 [`../../CHANGELOG.md`](../../CHANGELOG.md)。本节仅列「commit + 关键交付 + agent ID + 测试数」一行表。

### 4.0 4 大里程碑（按时间线）

| # | 里程碑 | 版本 | 波次 | commit | agent | 量化指标 |
|---|---|---|---|---|---|---|
| 1 | **W14 — 0 fail 全量基线** | v2.25.24 | W15-T2 | `febb4be` | agent-β-W15-tail-fails | 1473 pass / **0 fail** · 自 v2.18 以来首次 ✅ |
| 2 | **W15 — Mac 黑框 nuclear fix** | v2.25.30 | W21-P0 | `f24f9c4` | agent-fix-mac-blackbar-deep | 5 重根因彻底修 + 7 W21-P0-NUCLEAR regression 用例 |
| 3 | **W16 — 真 Win NSIS .exe 100MB** | v2.25.25 | W16-T4 | `834dd9c` | agent-δ-W16-dmg | `panda-on-desk Setup 0.1.0-alpha.exe 100.25MB` 真出包 |
| 4 | **W22 — RELEASE_NOTES + desk-v1.0.3** | v2.25.31/32 | W22-T3/T4 | `2030ed1` / `d6353f6` | agent-γ-W22-final + agent-δ-W22-desk-release | 32 版本端到端总结 + 4 release tags 全部就位 |

### 4.0.1 4 个 P0 收尾（按时间线）

| # | P0 | 版本 | commit | 根因 | 修复要点 |
|---|---|---|---|---|---|
| 1 | **MatrixHUD null usage crash** | v2.25.16 | `cf336a2` | usage prop null 时 destructure crash | 默认 `{usage = {}}` + 三级字段 nullish coalesce |
| 2 | **`panda --install-desk` workspace install** | v2.25.17 | `4b4a6fe` | `npm install` 不识别 bun `workspace:*` 协议 → EUNSUPPORTEDPROTOCOL | `npm install --install-links --workspaces=false` 组合 / fallback bun install |
| 3 | **Mac 双 panda（dup spawn）** | v2.25.20 | `39c5aca` | `maybeSpawnOnDesk` 重复 spawn | PID 锁 + `~/.pandacc/desk-runtime.lock` 文件互斥 |
| 4 | **Mac 顶部黑框 5 重根因** | v2.25.30 | `f24f9c4` | mainWin transparent+panel+alwaysOnTop / reapplyMacVisibility / popupMenuAt callback owner / ensureContextMenuOwner parent / mainWin transparent+0,0 起点 | 5 重根因彻底修 + nuclear regression 用例守护 |

### 4.0.2 关键质量指标当前值（W22-T3 baseline）

| 指标 | 当前值 | 阈值 / 改善 | 锚点 |
|---|---|---|---|
| **bun test 全量 fail** | **0** | 0 fail（W14 起持续 8 波守住） | `monitor/20260420-W22-T3-final.md` §1.1 |
| **bun test 全量 pass** | **1654** | + 1 skip · 7874 expect() · 99 files · 39.81s | 同上 |
| **关键模块覆盖率** | **+74.32%** | W10-T1 retry 提升基线 | CHANGELOG v2.25.14 |
| **startup 性能** | **-67.3%** | W20-T2 性能 v4 (5 优化 · 5 路径平均) | `monitor/20260420-W20-T2-perf-v4.md` |
| **dist-electron 体积** | **282 MB** | -45 MB / -14% (327 → 282) · W19-T2 | `monitor/20260420-W19-T2-size.md` |
| **Win NSIS 安装包** | **100.25 MB** | 真 build 出（W16-T4） | `monitor/20260420-W16-T4-dmg.md` |
| **运行时 RSS** | **158 MB** | 启动 112MB → 5min 等价负载 158MB（delta 45.51MB << 50MB 阈值）· W21-T4 | `monitor/20260420-W21-T4-perf-v5.md` |
| **APNG 真动图** | **42 帧 / 508 KB** | 7 状态 · GitHub 自动播放 · W16-T1 | `monitor/20260420-W16-T1-apng.md` |
| **anthropic byte-equal** | **0 字节漂移** | 33 版本 0 触碰 `claude.ts` / `oauth/*` / `providers.ts` | 每次发版前 `git diff main` 输出空 |
| **0 新依赖** | ✅ 全程未触碰 `package.json deps` | 仅复用既有依赖 / 自写纯函数 / Electron 内建 API | 全 23 波 |

| # | 版本 | Commit | 日期 | 关键交付 |
|---|---|---|---|---|
| 1 | v2.22.0 | (Phase 0) | 2026-04-19 | XP 11 桶 + 60 级 + 5 稀有度 + 13 里程碑 + StatusLine mini-pet + HMAC sign |
| 2 | v2.22.1 | `85dc81e` | 2026-04-19 | Phase 1 Electron v0.1-alpha：launch.cjs + main god file + 4 BrowserWindow + IPC bridge + 22 模块 fork |
| 3 | v2.22.2 | `0ea04ad` | 2026-04-19 | Phase 2 完整：超级助手 TOP 10 联动 + 132 单测 |
| 4 | v2.23.0 | `b211c74` | 2026-04-19 | v1.0 GA 占位（Phase 3 收尾）：跨平台 workflow + icon + clawd-on-desk 81% 吸收完成 |
| 5 | v2.23.1 | `b9366e7` | 2026-04-19 | 全 103 场景接入：system / overlay / badge / sound + 370 测试 + DND + 5min 聚合 + 离线累积 |
| 6 | v2.24.0 | `f543572` | 2026-04-19 | GA 美术 v1.5：程序化 SVG + electron@41 实跑 + linux --dir build 通过 |
| 7 | v2.24.1 | `7d34e76` | 2026-04-19 | 启动 hotfix：8 stub + state.refreshTheme fallback |
| 8 | v2.24.2 | `c7d14e9` | 2026-04-19 | 宠物可见 + 可拖拽：transparent + alwaysOnTop + frame:false + breathing 动画 |
| 9 | v2.24.3 | `29654d3` | 2026-04-19 | hit.html 路径修复 + inline SVG fallback |
| 10 | v2.24.4 | (W1) | 2026-04-19 | 自动启动：`src/buddy/desk-spawn.ts` + postinstall 引导 |
| 11 | v2.24.5 | `687e864` | 2026-04-19 | W1+W2 合并（完整桌面集成）：自动 spawn + 18 物种 + XP 进度条 + 103 通知 + 交互 + badge |
| 12 | v2.25.0 | `006c215` | 2026-04-20 | **GA W3 收尾**（主方案 100% 完成）：系统托盘 6 项菜单 + 5 选项设置面板 + 跨平台 dry-run |
| 13 | v2.25.1 | `9bacff2` | 2026-04-20 | W2-T4 补全 pandaBadge IPC + main wiring |
| 14 | v2.25.2 | `d981901` | 2026-04-20 | 波 4：自动启动稳定 + 14 物种 SVG + release 准备 |
| 15 | v2.25.3 | `3cce63b` | 2026-04-20 | W4-T3 用户文档：README + CHANGELOG + 故障排查 |
| 16 | v2.25.4 | `52f3dad` | 2026-04-20 | 波 5：真 e2e 双进程 + i18n 三语 (zh/en/ko) + 性能 polish 5 项 |
| 17 | v2.25.5 | `9db4185` | 2026-04-20 | W5-T2 GitHub Release 链接接入主 README |
| 18 | v2.25.6 | `fc0a006` | 2026-04-20 | 波 6 部分：CI workflow 加固 + 用户文档加强 + docs/ 用户 guide |
| 19 | v2.25.7 | `4443da4` | 2026-04-20 | 波 6 收尾：9 PNG 截图 (158KB) + bundle 优化 5 项 + perf-v2 10 用例 |
| 20 | v2.25.8 | `bc04567` | 2026-04-20 | 波 7 部分：README 视觉化 + 测试加固 48 + 子包文档（CONTRIBUTING/ARCHITECTURE） |
| 21 | v2.25.9 | `8f33b8f` | 2026-04-20 | 波 8 部分：a11y WCAG 2.1 AA + 错误监控/logger + 性能基准 7 测试点 |
| 22 | v2.25.10 | `108f2bd` | 2026-04-20 | 波 8 收尾：deps 0 vulns + flaky 修 + 回基线 1233 pass / 4 fail |
| 23 | v2.25.11 | `8bb49ea` | 2026-04-20 | 波 9 部分：lint 8/8 fix + telemetry stub + PRIVACY.md + LICENSE + NOTICE |
| 24 | v2.25.12 | `80d5e27` | 2026-04-20 | W9-T2 安装实测 + installer.ts 1 问题修复 + INSTALL_TEST.md walkthrough |
| 25 | v2.25.13 | `4634ba8` | 2026-04-20 | 波 10 部分：9 PNG 截图视觉升级 (状态文字/hero 背景/demo 多元素) + GitHub Pages docs/index.md |
| 26 | v2.25.14 | `0491314` | 2026-04-20 | 波 10 收尾：覆盖率 +74% + tsc 修 105/125 errors + 留 20 TODO |
| 27 | v2.25.15 | `d3cd8d7` | 2026-04-20 | **波 11 全 4/4**：desk-v1.0.1 + 真 electron headless 7 截屏 + README 精装 + startup -9.2% |
| 28 | v2.25.16 | `cf336a2` | 2026-04-20 | P0 MatrixHUD null usage crash 修复 + 波 12 收尾（W12 四 agent 2 批次合并 — badges/STATUS/死链/CHANGELOG） |
| 29 | v2.25.17 | `4b4a6fe` | 2026-04-20 | P0 `panda --install-desk` EUNSUPPORTEDPROTOCOL workspace:* hotfix（npm 不识别 bun workspace:*） |
| 30 | v2.25.18 | `7db3d8c` | 2026-04-20 | `panda --install-desk` timeout 600s → 1800s（30min）+ ENV `PANDA_DESK_INSTALL_TIMEOUT_MS` 可覆盖 |
| 31 | v2.25.19 | `eb13780` | 2026-04-20 | **波 13 全 4/4**：e2e +8 用例 + launch 跨平台 resolver + MatrixTheme 修 6 fail + frozen 修 1 fail（基线 4 → 2 fail） |
| 32 | v2.25.20 | `39c5aca` | 2026-04-20 | P0 Mac 双 panda（PID 锁 + runtime.lock 互斥）+ Mac 顶部黑条第 1 版修（LSUIElement + hidden 初始） |
| 33 | v2.25.21 | `f1922cf` | 2026-04-20 | P0 Mac 顶部黑条（v2.25.20 残留）— settings 窗 lazy 创建 |
| 34 | v2.25.22 | `d52e338` | 2026-04-20 | 波 14 部分：hit IPC 全接通（click/dblclick/drag）+ overlay 真弹出（5s auto-dismiss + DND） |
| 35 | v2.25.23 | `fddb1ac` | 2026-04-20 | **波 14 收尾**：tray 6 菜单真实装 + 首次启动 demo 模式（3 步引导 + `demoSeen` 持久化）+ i18n 三语补齐 |
| 36 | v2.25.24 | `febb4be` | 2026-04-20 | 🎉 **波 15 全 4/4 · 全量 0 fail 里程碑**（自 v2.18 以来首次）：hit.html 鼠标真 hook + 端口 race 修 + CHANGELOG/badges 同步 + Mac 启动 dry-run |
| 37 | v2.25.25 | `834dd9c` | 2026-04-20 | **波 16 全 4/4**：APNG 真动图（7 文件 ~500KB）+ `/buddy desk` 子命令 + settings 真读写 + **真 Win NSIS .exe 100MB** 出包 |
| 38 | v2.25.26 | `95564bf` / `4420499` | 2026-04-20 | **波 17 全 4/4**：Linux unpacked 出（327MB）+ README APNG 嵌入 + demo 深化（20s + chrome 三件套）+ 性能基准重跑 0 回归 |
| 39 | v2.25.27 | `3f9add2` | 2026-04-20 | **波 18 全 4/4**：键盘 a11y v2（Tab/Enter/Space/Ctrl-Shift-P-M/ESC）+ 真 spawn 修 1 bug + `/buddy stats` 可视化（unicode bar / 30 天 chart） |
| 40 | v2.25.28 | `2286e8c` / `bf9e921` / `3205f15` | 2026-04-20 | **波 19 全 4/4**：autoconnect handshake + dist-electron **-45MB**（327→282MB）+ crash 自动恢复 + desk-v1.0.2 重触发 |
| 41 | v2.25.29 | `b501aba` | 2026-04-20 | **波 20 全 4/4**：Mac dmg 三路径 guide + 性能 v4 **startup -67.3%** + Pages 死链修 + 综合验证 1560 pass / 0 fail |
| 42 | v2.25.30 | `f24f9c4` | 2026-04-20 | 🚨 **P0 Mac 顶部黑框深度彻查修复**（5 重根因 nuclear fix）：mainWin 删 transparent+panel+alwaysOnTop / reapplyMacVisibility 排除 / popupMenuAt 切 hitWin / ensureContextMenuOwner parent 优先 hitWin / 7 W21-P0-NUCLEAR regression 守护 |
| 43 | v2.25.31 | `9a9c19e` | 2026-04-20 | **波 21 全 4/4**：W21-T1 Mac e2e mock（21 pass · 覆盖 v2.25.30 nuclear 5 重根因 regression） + W21-T2 demo polish（首启场景脚本 / 时间轴 / 三件套触发 / welcome 升级） + W21-T3 README v4 终极打磨 + W21-T4 性能 v5 RSS 158MB（SVG cache LRU + 5MB 字节上限 / Badge cap 256 LRU / 1h-stress 套件 5 pass · delta 45.51MB << 50MB） |
| 44 | v2.25.32 | `c3b81a1` | 2026-04-20 | **波 22 全 4/4**：W22-T1 多屏支持（display-select.ts NEW · displayId prefs · 2 IPC handler · settings 下拉 · i18n 三语 · 22 用例） + W22-T2 mini-pet 动画 4 组帧表（idle 4 / thinking 2 / working 2 / sleeping 2 · 700ms tick） + 与 desk 同步（isDeskRunning gate · 16+ 用例） + W22-T3 最终验证 1654 pass / 0 fail / 7874 expect · `RELEASE_NOTES_v2.25.md` 新建 + W22-T4 desk-v1.0.3 最终触发 + README/CHANGELOG 收尾 |

> **byte-equal 守护**：44 版本 0 触碰 `src/services/api/claude.ts` / `src/services/oauth/*` / `src/services/api/providers.ts`（每次发版前 `git diff main` 输出空验证；W23-T2 复核 `wc -l = 0`）。

### 4.1 桌面 GA tag（4 个全部就位）

| Tag | 状态 | tag commit | 说明 |
|---|---|---|---|
| `desk-v1.0.0` | 已推（W5-T2） | `605ffdc...` | 远端 ls-remote 可见；release UI artifacts 待 token 验证（W7-T1 报 0/5，W11-T1 修正：API 404 ≠ tag 未达） |
| `desk-v1.0.1` | **已推（W11-T1）** | `f9ac902...` | workflow 加固后重触发；ls-remote 验证 ref + dereferenced `^{}` 在远端 |
| `desk-v1.0.2` | **已推（W19-T4）** | `c9747eb...` | version sync + icns/ico 占位检测 + 真 NSIS 出包验证后重触发 |
| `desk-v1.0.3` | **已推（W22-T4）** | `f2ed5ff...` | v2.25.31/32 32 版本累计加固后最终触发：含 Mac 黑框 5 重根因 nuclear fix + startup -67.3% + RSS 158MB + dist -45MB + autoconnect + crash 自动恢复 |

### 4.2 23 波概览表（agent ID + 测试数）

| 波 | 主题 | 主 agent ID | 新增测试数 | 关键 commit |
|---|---|---|---|---|
| W1 | 自动启动 + 美工 + dist + IPC | agent-α/β/γ/δ-W1 | +50 | `687e864` |
| W2 | 18 物种 + XP 进度条 + 103 通知 + 交互 | agent-α/β/γ/δ-W2 | +60 | `687e864` |
| W3 | 系统托盘 + 5 选项设置 + 跨平台 dry-run | agent-α/β-W3 | +30 | `006c215` |
| W4 | 自动启动稳定 + 14 物种 SVG + release 准备 | agent-α/β/γ-W4 | +20 | `d981901` |
| W5 | 真 e2e + i18n 三语 + 性能 polish + GitHub Release | agent-α-W5-e2e + agent-γ-W5-i18n + agent-δ-W5-perf | +25 | `52f3dad` / `9db4185` |
| W6 | CI workflow 加固 + 9 PNG 截图 + bundle 优化 + 用户文档 | agent-α/β/γ/δ-W6 | +18 | `fc0a006` / `4443da4` |
| W7 | README 视觉化 + 测试加固 +48 + 子包文档 | agent-β/γ/δ-W7 | +48 | `bc04567` |
| W8 | a11y WCAG 2.1 AA + logger + 7 性能基准 + deps 0 vulns | agent-β/γ/δ-W8 + agent-α-W8-deps-retry | +35 | `8f33b8f` / `108f2bd` |
| W9 | lint + telemetry/PRIVACY + LICENSE/NOTICE + 安装实测 | agent-α/γ/δ-W9 + agent-β-W9-install-sim-retry | +25 | `8bb49ea` / `80d5e27` |
| W10 | 9 PNG 视觉升级 + GitHub Pages docs + 覆盖率 +74% + tsc 修 105 | agent-α/β/γ/δ-W10 | +12 | `4634ba8` / `0491314` |
| W11 | desk-v1.0.1 + 真 electron headless 7 截屏 + README 精装 + startup -9.2% | agent-α/β/γ/δ-W11 | +9 | `d3cd8d7` |
| W12 | badges + STATUS.md 新建 + 死链修 + CHANGELOG 补 | agent-α/β/γ/δ-W12 + agent-fix-matrix-hud | +6 | `cf336a2` |
| W13 | e2e +8 + launch 跨平台 + Matrix 修 6 + frozen 修 1 | agent-α/β/γ/δ-W13 | +14 | `eb13780` |
| W14 | hit IPC 全接通 + overlay 真弹出 + tray 真实装 + demo 模式 | agent-α/β/γ/δ-W14 | +25 | `d52e338` / `fddb1ac` |
| **W15** | hit.html 真 hook + **0 fail 里程碑** + CHANGELOG/badges + Mac dry-run | agent-α/β/γ/δ-W15 | +56 | **`febb4be` 🎉** |
| **W16** | APNG 真动图 + `/buddy desk` + settings 真读写 + **真 Win NSIS 100MB** | agent-α/β/γ/δ-W16 | +55 | **`834dd9c`** |
| W17 | Linux unpacked 327MB + APNG 嵌入 + demo 深化 20s + 基准 0 回归 | agent-α/β/γ/δ-W17 | +24 | `95564bf` / `4420499` |
| W18 | AppImage rootcause + 键盘 a11y v2 + 真 spawn 修 1 bug + stats 可视化 | agent-α/β/γ/δ-W18 | +51 | `3f9add2` |
| W19 | autoconnect handshake + dist -45MB + crash 自动恢复 + desk-v1.0.2 | agent-α/β/γ/δ-W19 | +43 | `2286e8c` / `bf9e921` / `3205f15` |
| W20 | Mac dmg 三路径 guide + 性能 v4 startup -67% + Pages 死链修 + 综合验证 | agent-α/β/γ/δ-W20 | +9 | `b501aba` |
| W21 | Mac e2e nuclear 21 用例 + demo polish + README v4 + 性能 v5 RSS 158MB | agent-α/β/γ/δ-W21 + agent-fix-mac-blackbar-deep | +33 | `9a9c19e` / `f24f9c4` |
| W22 | 多屏支持 + mini-pet 动画/同步 + **最终验证 1654/0 + RELEASE_NOTES** + **desk-v1.0.3** | agent-α/β/γ/δ-W22 | +56 | `c3b81a1` / `2030ed1` / `26c6776` / `d6353f6` |
| **W23** | 文档收官（W23-T2 STATUS final + monitor 总览） | agent-β-W23-status-final | 0（仅文档） | （本波） |

---

## 5. 已知 bugs / TODOs

### 5.1 已知 bugs（按严重度）

| # | 级别 | 描述 | 影响范围 | 状态 / TODO |
|---|---|---|---|---|
| 1 | LOW | MatrixTheme env / getFrozenStats 4 用例 fail | 仅测试基线（业务无感） | 历史遗留预存基线（v2.25.6+ 持续标注） |
| 2 | UNKNOWN | desk-v1.0.0/1 GitHub Release artifacts 上传状态 | npm `panda --install-desk` 路径未受影响（fallback 走源码） | 需指挥官 GH token 验证 Actions run 实际产物（W11-T1 §10） |
| 3 | LOW | tsc typecheck 留 20 TODO（17 test wildcard + 3 禁修区） | 不影响 build 0 error | v2.0+ 大架构调整时统一处理 |

### 5.2 留白方案 / 后续 TODOs

| # | 来源 | 项 | 优先级 |
|---|---|---|---|
| 1 | W11-T1 §10 方案 6 | release-panda-on-desk.yml 加 `workflow_dispatch` 入口（手动 retry 不必新 tag） | 中 |
| 2 | W11-T1 §10 方案 7 | GH_TOKEN 注入流程文档化（让后续 CI 监控 agent 能自助验证 private repo 状态） | 中 |
| 3 | PRIVACY.md §3 | v2.0+ telemetry opt-in（必须 disabled by default + 4 子项独立开关 + 本地审计日志 + 不触碰 anthropic byte-equal） | 低（远期） |
| 4 | 子包 README §截图占位 | macOS / Windows / Linux 三平台真截图（部分已由 W11-T2 真 electron headless 替代 hit.html，但 settings/tray 还是占位） | 低 |
| 5 | CHANGELOG v2.25.15 | 23h 无人值守已发版 v2.25.0 → v2.25.15 共 16 次 — 等待指挥官批 W12 之后的下一波节奏 | — |

---

## 6. 用户问题排查表

> 排查顺序：症状 → 可能原因 → 修复步骤。优先按 panda-on-desk README 故障排查表 + 本节扩展信息处理。

| # | 症状 | 可能原因 | 排查与修复 |
|---|---|---|---|
| 1 | `panda` 启动后撞 `main:785` / `Cannot find module 'electron'` | panda-on-desk 子包未安装 electron deps | 跑 `panda --install-desk` 一次性下载（首次 ~80MB）；或 `cd packages/panda-on-desk && bun install` |
| 2 | 桌面宠物窗口未浮现，CLI 主体正常 | `desk-spawn` fallback 静默跳过（设计行为） | 检查 `~/.pandacc/desk-prefs.json` 中 `companionOnDesk:true`；查看 `~/.pandacc/desk-spawn.log` 启动错误；或运行 `panda --desk-status`（W8-T3） |
| 3 | 启动时报 `EADDRINUSE 127.0.0.1:1455` | 1455 端口被其他进程占用（多次启动残留 / 其他 IDE） | 默认 auto-fallback +1（1456/1457/...）；或杀残留 `panda-on-desk` 进程：mac/linux `pkill -f panda-on-desk` / win 任务管理器结束 |
| 4 | Windows `addWinAsarIntegrity` UNKNOWN/EBUSY 报错 | OneDrive / 杀软对 .exe 文件锁 | 关闭 OneDrive 同步该目录 / 暂停杀软实时扫描 / 退出 win-unpacked 目录后重试；CI runner 上无此问题 |
| 5 | 托盘菜单图标缺失 | tray-{light,dark}.png 缺失 | 设计为静默降级 — 菜单文字仍可点击；如需补图标放至 `build/icons/tray-light.png` `tray-dark.png` |
| 6 | settings.html 加载白屏 | 多候选路径未命中（v2.24.3 已修） | 升级到 ≥ v2.24.3；或检查 `packages/panda-on-desk/src/renderer/settings.html` 是否随 dist 打包 |
| 7 | 18 物种切换无反应 | renderer SVG 资产未加载 / theme cache 未刷 | `/buddy theme chonk` 回到默认；重启 panda-on-desk；检查 `themes/panda/sprites/` 资产是否齐 |
| 8 | `panda --install-desk` 报 unknown option | 全局 panda 版本 < v2.25.x | `npm i -g @lc2panda/panda-code@latest` 升级到 ≥ v2.25.0 后重试（详见 `docs/INSTALL_TEST.md` §1.1） |
| 9 | desk-v1.0.x release 页 404 | repo private + 未授权访问 / CI 实际未 publish | 用 GH token 访问 private repo；或登录 lc2panda 账号 web 看 Actions 标签页（W11-T1 §2.4） |
| 10 | DND 模式后通知仍弹 | `~/.pandacc/desk-prefs.json` 中 `dndStart`/`dndEnd` 时段未跨日生效 | 手动检查时段是否覆盖当前；或托盘菜单 DND mode 切一次强制刷新 single-source-of-truth |
| 11 | macOS 桌面端 dock 仍显示 | `LSUIElement` 未生效（旧版 mac < v2.24.x） | 升级到 ≥ v2.24.2；或检查 Info.plist 是否含 `LSUIElement: true` |
| 12 | 宠物等级回到 0 | `~/.config/panda/desk-state.json` 被清 / HMAC 校验失败 | 检查 `companion-stats.json` 是否被手动改（HMAC sign 防作弊会重置）；备份恢复或重新养成 |

### 6.1 日志位置

| 日志 | 路径 | 用途 |
|---|---|---|
| main 进程 stdout | 终端（panda CLI spawn 子进程时透传） | 启动错误 / IPC 异常 |
| renderer 控制台 | 托盘菜单 → Settings → DevTools (v2.25.0+) | 渲染层错误 / IPC 接收 |
| panda-on-desk 错误日志 | `~/.pandacc/panda-on-desk.log` (W8-T3 logger.ts) | 4 级别 + 轮转 ≤ 1MB |
| 启动日志 | `~/.pandacc/desk-spawn.log` | panda CLI spawn panda-on-desk 时写入 |
| 持久化数据 | `~/.pandacc/desk-prefs.json` / `~/.pandacc/runtime.json` / `~/.config/panda/desk-state.json` / `~/.config/panda/companion-stats.json` | 设置 / IPC secret / XP 等级 / 养成统计 |

### 6.2 完整清除（重置到出厂）

```bash
# macOS / Linux
rm -rf ~/.pandacc ~/.config/panda

# Windows (PowerShell)
Remove-Item -Recurse -Force "$env:USERPROFILE\.pandacc"
Remove-Item -Recurse -Force "$env:USERPROFILE\.config\panda"
```

---

## 7. 文档完整性矩阵（W12-T4 审计）

| 文档 | 路径 | 存在 | 行数 | 最新基线 |
|---|---|---|---|---|
| 主仓 README | `README.md` | ✅ | 2393 | v2.25.0+ 段 + desk-v1.0.1 链接 |
| 主仓 CHANGELOG | `CHANGELOG.md` | ✅ | 260+ (W15-T3 补 v2.25.16–23 后) | v2.22.0 → v2.25.23 全 35 版本 |
| 主仓 LICENSE | `LICENSE` | ❌ | — | 缺：建议添加（与子包对齐） |
| 主仓 NOTICE | `NOTICE` | ❌ | — | 缺：建议添加 |
| 主仓 CONTRIBUTING | `CONTRIBUTING.md` | ❌ | — | 缺：子包独立有 |
| 主仓 ARCHITECTURE | `ARCHITECTURE.md` | ❌ | — | 缺：子包独立有 |
| 主仓 PRIVACY | `PRIVACY.md` | ❌ | — | 缺：子包独立有 |
| 子包 README | `packages/panda-on-desk/README.md` | ✅ | 374 | v2.25.x 标注 |
| 子包 STATUS（本文） | `packages/panda-on-desk/STATUS.md` | ✅ (本次新增 [NEW-FILE:#W12-03]) | — | v2.25.15 |
| 子包 ARCHITECTURE | `packages/panda-on-desk/ARCHITECTURE.md` | ✅ | 523 | v2.25.7 |
| 子包 CONTRIBUTING | `packages/panda-on-desk/CONTRIBUTING.md` | ✅ | 415 | v2.25.7 |
| 子包 PRIVACY | `packages/panda-on-desk/PRIVACY.md` | ✅ | 128 | v2.25.x |
| 子包 LICENSE | `packages/panda-on-desk/LICENSE` | ✅ | 52 | MIT + clawd 致谢 |
| 子包 NOTICE | `packages/panda-on-desk/NOTICE` | ✅ | 14 | clawd@4b07658 81% + 5 deps |
| 子包 docs/index | `packages/panda-on-desk/docs/index.md` | ✅ | 8.5KB | v2.25.7 → v2.25.12 (W12-T4 后建议同步到 v2.25.15) |
| 子包 INSTALL_TEST | `packages/panda-on-desk/docs/INSTALL_TEST.md` | ✅ | 145+ | v2.25.7 |

### 7.1 死链检查

| 锚点 | 状态 | 修复 |
|---|---|---|
| 子包 README badges → `../../LICENSE` | ❌ 主仓无 LICENSE | W12-T4 已修：`./LICENSE`（指子包自身 LICENSE） |
| 主仓 README L2024 → `packages/panda-on-desk/LICENSE` | ✅ | — |
| 主仓 README L1822 → `desk-v1.0.1` Release URL | △ 公网 404（private repo），需 token | W11-T1 修正逻辑（API 404 ≠ release 不存在） |
| 子包 README L7 badge `version-2.25.7` | ⚠️ 已过时 | W12-T4 已修：→ `version-2.25.15` |
| `docs/index.md` L18 `v2.25.7 → v2.25.12` | ⚠️ 已过时 | TODO：建议下波同步到 → v2.25.15 |
| `docs/index.md` L20 badge `release-desk--v1.0.0` | ⚠️ 已过时 | TODO：建议同步到 desk-v1.0.1 |
| `ARCHITECTURE.md` L11 `基线版本：v2.25.7` | ⚠️ 已过时 | TODO：下波同步到 v2.25.15 |
| `CONTRIBUTING.md` L11 `基线版本：v2.25.7` | ⚠️ 已过时 | TODO：下波同步到 v2.25.15 |
| `INSTALL_TEST.md` L10 `panda v2.25.7` | ⚠️ 已过时 | TODO：下波同步到 v2.25.15 |

> 标题统一性：所有子包 .md 已统一以 `<DOC_NAME> · panda-on-desk` 格式开头（README/CONTRIBUTING/ARCHITECTURE/PRIVACY/STATUS）。

---

## 8. 跨文档版本号一致性快查

| 出处 | 版本号 | 状态 |
|---|---|---|
| `package.json` (主仓) version | `2.25.32` | ✅ source of truth (W22-T3 已同步) |
| `packages/panda-on-desk/package.json` version | `0.1.0-alpha` | ✅（子包内部版本，对外用 desk-vX.Y.Z tag） |
| 主仓 CHANGELOG 顶部说明 | "v2.22.0 → v2.25.31" → 本波 W23-T2 同步到 v2.25.32 | ✅ |
| 主仓 README badge | `version-v2.25.31` / `tests-0%20fail%20%7C%201654%20pass` / `desk--v1.0.2` → 本波 W23-T2 同步到 v2.25.32 / desk-v1.0.3 | ✅ |
| 子包 README badge | `version-2.25.23` | ⚠️ 落后（W23+ 建议同步到 v2.25.32） |
| 子包 README §当前版本 | `v1.0 GA（Phase 3 收尾）` | ✅ |
| 子包 ARCHITECTURE 基线 | `v2.25.7` | ⚠️ 落后（W23+ 建议同步） |
| 子包 CONTRIBUTING 基线 | `v2.25.7` | ⚠️ 落后 |
| 子包 PRIVACY 当前事实 | `v2.25.x · v1.0 GA 阶段` | ✅（弹性范围标注） |
| 子包 docs/index 基线 | `v2.25.7 → v2.25.12` | ⚠️ 落后 |
| 主仓 README 桌面端段 | `v2.25.0+` | ✅（弹性范围标注） |
| 主仓 README 安装包段 | `v1.0.3+` | ✅（W22-T4 已同步） |
| 子包 RELEASE_NOTES_v2.25.md | `v2.25.0 → v2.25.31 共 32 版本` | ✅（W22-T3 新建） |

---

## 9. 引用锚点 / 参考资料

- 完整变更：[`../../CHANGELOG.md`](../../CHANGELOG.md)
- 用户文档：[`./README.md`](./README.md) · [`./docs/INSTALL_TEST.md`](./docs/INSTALL_TEST.md)
- 贡献者文档：[`./CONTRIBUTING.md`](./CONTRIBUTING.md)
- 架构深潜：[`./ARCHITECTURE.md`](./ARCHITECTURE.md)
- 隐私契约：[`./PRIVACY.md`](./PRIVACY.md)
- 法律文件：[`./LICENSE`](./LICENSE) · [`./NOTICE`](./NOTICE)
- v2.25 系列总结：[`./RELEASE_NOTES_v2.25.md`](./RELEASE_NOTES_v2.25.md)（W22-T3 新建）
- W11-T1 CI 重触发实证：`monitor/20260420-W11-T1-ci-retrigger.md`
- W12-T4 文档审计落盘：`monitor/20260420-W12-T4-docs-audit.md`
- W22-T3 最终综合验证：`monitor/20260420-W22-T3-final.md`
- W22-T4 desk-v1.0.3 触发：`monitor/20260420-W22-T4-desk-release.md`
- W23-T2 STATUS 总览定稿（本波）：`monitor/20260420-W23-T2-status-final.md`

---

> **领地标记规约**：本看板是「指挥官 / 用户 / 维护者」的统一入口。一旦发版 / 测试基线 / 性能基线 / 已知 bug 列表 变化，请同步本文 — 就像重新标记领地一样。
