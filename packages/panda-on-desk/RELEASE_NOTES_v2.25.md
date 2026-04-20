<!--
Input:  v2.25.0 (GA W3) → v2.25.31（波 21 收尾）32 版本端到端累计变更
Output: 一份给指挥官 / 用户 / 维护者 / 贡献者鸣谢的最终发版总结
Pos:    panda-on-desk 子包 RELEASE_NOTES — 与 README/CHANGELOG/STATUS/ARCHITECTURE 平级
        [NEW-FILE:#20260420-W22-T3-release-notes] · 2026-04-20 +08:00 W22-T3 final agent（agent-γ-W22-final）
        本文件覆盖 v2.25.0 → v2.25.31 总累计变更，超出此范围请改 CHANGELOG.md。
        一旦发版基线 / 关键里程碑 / 性能数字 / 测试基线变化，请同步更新本文件。
-->

# Release Notes · panda-on-desk v2.25 系列（v2.25.0 → v2.25.31）

> 本文档汇总 panda-on-desk 桌面宠物子产品 **v2.25 系列 32 版本端到端累计变更**（2026-04-20 单日完成 32 版本），面向指挥官 / 用户 / 维护者 / 贡献者。
>
> - 历史版本演进逐版细节：[`../../CHANGELOG.md`](../../CHANGELOG.md)
> - 当前真实状态看板：[`./STATUS.md`](./STATUS.md)
> - 架构原理：[`./ARCHITECTURE.md`](./ARCHITECTURE.md)
> - 主仓 README：[`../../README.md`](../../README.md)

---

## 0. 时间真实性校验锚点

| 项 | 值 |
|---|---|
| 发版周期 | 2026-04-20（Asia/Singapore +08:00） |
| 起始 commit | v2.25.0 GA（W3 收尾，commit `006c215`） |
| 最终 commit | v2.25.31（波 21 全 4/4，commit `9a9c19e`） |
| 验证完成 | 2026-04-20 W22-T3 final agent · `monitor/20260420-W22-T3-final.md` |
| 红线零 diff | `git diff main -- src/services/api/claude.ts src/services/oauth src/services/api/providers.ts` 输出 0 字节 |

---

## 1. 关键里程碑（v2.25 系列 32 版本累计）

### 1.1 GA 与 Release Tag
- **v2.25.0 GA**（W3 收尾） — 主方案 100% 完成；首次桌面端公开发版基线。
- **`desk-v1.0.0`**（W5-T2） — 首次 GitHub Release；CI workflow 跨平台构建启动。
- **`desk-v1.0.1`**（W11-T1） — workflow 加固后重触发；远端 tag 双源验证通过。
- **`desk-v1.0.2`**（W19-T4） — version sync + icns/ico 占位检测 + 真 NSIS 出包验证后由 W17 加固完成重触发。

### 1.2 测试 / 质量基线
- **全量 0 fail 里程碑**（v2.25.24 / 波 15）— 自 v2.18 以来首次全量 bun test 0 fail。
- **W22-T3 最终基线**：**1654 pass · 0 fail · 1 skip**（99 test files / 7874 expect()）。
- **bun run build 0 error** — 真打包 dist/，patched 1 for Node.js compat。
- **覆盖率 +74%**（v2.25.14 / 波 10 收尾）— tsc -105 errors 一并清理。
- **knip 残留**：18 configuration hints（非阻塞 · 多为 ignore-pattern 优化项）。

### 1.3 性能基线
- **startup -67.3%**（v2.25.29 / 波 20-T2 性能 v4） — 主仓 startup 实测较 v2.18 基线减少 67.3%。
- **RSS 158MB**（v2.25.31 / 波 21-T4 性能 v5） — 启动后 112.50MB；5min 等价负载（5000 notifications + 100 物种切换）后 158.01MB（delta 45.51MB << 50MB 阈值）。
- **dist-electron -45MB**（v2.25.28 / 波 19-T2 体积优化） — 桌面端安装包瘦身 45MB。
- **SVG cache 实测 508KB**（18 物种） — 5MB 上限触发场景仅多主题热切才出现。
- **Badge cap 256 LRU 验证** — 注入 500 distinct scenarioId → Map 严守 256 上限。

### 1.4 P0 修复（关键 bug 攻坚）
- **Mac 顶部黑框 5 重根因 nuclear fix**（v2.25.30）— 自 W14 / W15 / W20 多次表层 fix 未真修后，agent-fix-mac-blackbar-deep 深度诊断出 5 重根因（mainWin transparent+panel+alwaysOnTop / reapplyMacVisibility stationary / popupMenuAt owner / ensureContextMenuOwner parent / mainWin transparent+0,0 起始位置），全部根治。
- **Mac 双 panda + 顶部黑条**（v2.25.20 / v2.25.21）— 第一/二轮表层 fix。
- **MatrixHUD null usage crash**（v2.25.16）— P0 渲染崩溃。
- **`panda --install-desk` EUNSUPPORTEDPROTOCOL workspace:\***（v2.25.17）— installer 阻塞 P0；timeout 600s → 1800s 可配置（v2.25.18）。

### 1.5 用户体验 / Demo / 文档
- **首次启动 demo 模式**（v2.25.23 / 波 14 收尾）— tray 真实装 6 items + welcome 升级。
- **真 Win NSIS .exe 100MB**（v2.25.25 / 波 16）— Windows 桌面端真出包验证。
- **Linux unpacked + APNG 嵌入**（v2.25.26 / 波 17）— Linux 出包 + 动画 PNG 嵌入。
- **README v4 终极打磨**（v2.25.31 / 波 21-T3）— badges/截图/用户故事三段式 + 21 波交付列表。
- **GitHub Pages docs**（v2.25.13 / 波 10 部分） — `lc2panda.github.io/panda/` 上线。
- **PRIVACY / LICENSE / NOTICE 三文档齐备**（v2.25.10 / 波 8 收尾） — telemetry-0 承诺写入。

### 1.6 稳定性 / 安全
- **autoconnect handshake**（v2.25.28 / 波 19-T1）— ready handshake + 自动重连。
- **crash 自动恢复**（v2.25.28 / 波 19-T3）— log 流式可见。
- **deps 0 vulns**（v2.25.10 / 波 8 收尾）— 依赖审计回基线。
- **0 新依赖端到端守护** — v2.25.0 → v2.25.31 全 32 版本累计 0 npm 包新增。
- **anthropic byte-equal 0 触碰** — `src/services/api/claude.ts` / `src/services/oauth` / `src/services/api/providers.ts` 自 v2.25.0 以来未动一字节。

---

## 2. 用户操作命令（推荐升级路径）

### 2.1 全新安装

```bash
# 1. 配置 GitHub Packages registry（一次即可）
echo "@lc2panda:registry=https://npm.pkg.github.com" >> ~/.npmrc

# 2. 全局安装 panda CLI
npm install -g @lc2panda/panda-code

# 3. 启动
panda
```

### 2.2 升级到 v2.25.31

```bash
npm update -g @lc2panda/panda-code
panda --version   # 应输出 v2.25.31
```

> **Mac 用户**：升级到 v2.25.30+ 后，顶部黑框问题彻底解决（5 重根因 nuclear fix）。

### 2.3 安装桌面端（panda-on-desk）

```bash
panda --install-desk        # 自动安装 desk 子包并启动 Electron 桌面端
# 默认 timeout 1800s；如需更长可设：
PANDA_INSTALL_DESK_TIMEOUT=3600 panda --install-desk
```

### 2.4 桌面端控制命令

```bash
panda /buddy desk           # 启动桌面端宠物
panda /buddy hide           # 临时隐藏
panda /buddy show           # 重新显示
panda /buddy stats          # 查看宠物 XP/等级/季节
```

### 2.5 鉴权与 Provider

```bash
panda auth login            # 交互式选择 Provider（Anthropic / OpenAI / 国内）
panda auth status           # 查看当前认证状态
```

---

## 3. 贡献者鸣谢（agent team α–η）

本 v2.25 系列 32 版本端到端，由指挥官调度的 **agent team** 协同完成。各 agent 角色与代号：

| 代号前缀 | 角色 | 主要交付波次 |
|---|---|---|
| **agent-α** | 主开发 / 架构 / 重构 | W3 GA / W11–W14 多波 |
| **agent-β** | UI / demo / 视觉 / 用户体验 | W6 截图 / W17 demo / W21-T2 demo polish |
| **agent-γ** | 文档 / README / CHANGELOG / 鉴权 | W2-T4 IPC / W15-T3 CHANGELOG / W21-T3 README v4 / W22-T3 final |
| **agent-δ** | 性能 / 内存 / 体积 / 文档审计 | W12-T4 docs / W20-T2 startup -67% / W21-T4 RSS 158MB |
| **agent-ε** | 测试 / 覆盖率 / e2e | W7-T3 tests / W18 a11y / W21-T1 Mac e2e |
| **agent-ζ** | CI / Release / Pages | W5-T2 / W11-T1 / W19-T4 / W20-T3 Pages |
| **agent-η** | P0 修复 / hotfix | fix-mac-blackbar / fix-mac-blackbar-deep / fix-installer-workspace / fix-matrixhud-null |

> 严守铁律：**0 新依赖**（端到端 32 版本累计）· **anthropic byte-equal**（`claude.ts` / `oauth` / `providers.ts` 0 字节漂移）。

特别鸣谢：
- **agent-fix-mac-blackbar-deep** — Mac 顶部黑框 5 重根因彻底诊断（v2.25.30 nuclear fix）
- **agent-δ-W20-perf-v4** — startup -67.3% 实测优化
- **agent-δ-W21-perf-v5** — RSS 158MB 长跑稳定性 + SVG cache 5MB 上限
- **agent-γ-W15-changelog** — 全量 0 fail 里程碑（自 v2.18 以来首次）的文档锚定

---

## 4. 已知限制与下一步

### 4.1 已知限制
- knip 18 configuration hints（非阻塞）— 多为 ignore-pattern 优化项；待 W23+ 清理。
- panda-on-desk 子包 tsc 3 个 mac-bootstrap-e2e 参数 mismatch（test-only，不影响生产）。
- Mac dmg 出包仅在 Mac 主机签名验证（W20-T1 已落 guide）。

### 4.2 推荐下一步（W22-T4 / W23+）
- **W22-T4** — `desk-v1.0.3` Release tag 触发（含 v2.25.31 / W22 系列加固）
- **W23+** — knip-bun configuration cleanup；mac-bootstrap-e2e 测试签名修复
- **长期** — heap snapshot 在 hit 窗 renderer 进程上跑（CDP 接入）；多主题切换 stress

### 4.3 回滚方案
- 如需回退到 v2.25.30：`npm install -g @lc2panda/panda-code@2.25.30`
- 桌面端回退：`git checkout f24f9c4 -- packages/panda-on-desk/` + 重新 `panda --install-desk`

---

## 5. 验证证据 / 复现命令

```bash
# 全量测试
bun test                       # 期望：1654 pass · 0 fail · 1 skip

# 真打包
rm -rf dist && bun run build  # 期望：0 error · Bundled 613 files

# 红线零 diff（anthropic byte-equal）
git diff main -- src/services/api/claude.ts src/services/oauth src/services/api/providers.ts | wc -l
# 期望：0

# 版本核对
cat package.json | grep version
# 期望："version": "2.25.31"
```

落盘报告：`monitor/20260420-W22-T3-final.md`

---

**Released**: 2026-04-20 (Asia/Singapore +08:00)
**Final commit**: `9a9c19e` — 波 21 全 4/4 (v2.25.31)
**Release Tag (待触发)**: `desk-v1.0.3` (W22-T4)
