# Changelog · panda-on-desk

> 本文档跟踪 panda-on-desk 桌面宠物子产品端到端 17 版本演进（v2.22.0 → v2.25.5）。
> panda CLI 主体的更早版本演进（v0.x → v2.21.x）见 git log 与 monitor/ 目录归档。
> 时间锚点：2026-04-19 ~ 2026-04-20 (Asia/Singapore +08:00)

---

## v2.25.5 — 2026-04-20 · W5-T2 GitHub Release 链接接入主 README
- 主仓 `README.md` 新增 `desk-v1.0.0` GitHub Release 直链段（macOS arm64/x64 dmg、Windows NSIS、Linux AppImage/deb）。
- 用户可绕过 `npm install` + `panda --install-desk` 80MB electron 下载流程，直接从 Release 页拉独立安装包。
- W5-T2 触发 `desk-v1.0.0` tag → CI workflow `release-panda-on-desk.yml` 跨平台构建启动。
- anthropic byte-equal 0 触碰；0 新依赖；`src/` 0 改动。

## v2.25.4 — 2026-04-20 · 波 5 真 e2e + i18n 三语 + 性能 polish
- W5-T1 真 e2e 双进程验证：`packages/panda-on-desk/test/e2e-real-process.test.ts` 13 用例（mock HTTP server + panda CLI pushNotification + 端口 1455→1456 fallback + runtime.json 字段校验 + secret mismatch 401 + on-desk 离线不阻塞 CLI）。
- W5-T3 i18n 三语桌面端：`packages/panda-on-desk/src/i18n.ts` 扩展 61 新词条（zh/en/ko），覆盖 7 PetState + 18 物种 + 12 解锁阶梯 + 13 milestone + 5 settings + 6 tray；hit.html / overlay / settings / tray 四处接入；`LANG` / `app.getLocale()` 自动检测 + `~/.pandacc/desk-prefs.json` 持久化；缺 key fallback en。
- W5-T4 性能优化 + 集成测试加固：5 项性能优化（hit.html SVG idle preload / bridge throttle 自适应 / dispatcher 5ms 批处理 / BadgeManager dedupe / IPC listener cleanup）；新增 `test/perf.test.ts` 12 用例。
- 测试基线：bun test 全量 fail ≤ 4（MatrixTheme env / getFrozenStats 历史遗留）；anthropic byte-equal `claude.ts` / `oauth/*` / `providers.ts` 0 触碰；0 新依赖。

## v2.25.3 — 2026-04-20 · W4-T3 用户文档完整（README + CHANGELOG + 故障排查）
- 主仓 `README.md` 新增 `## panda-on-desk 桌面宠物（v2.25.0+）` 顶级章节（快速启用 3 行命令 + 8 项桌面能力 + `panda --no-desk` 单次关闭）。
- 本 `CHANGELOG.md` 新建（v2.22.0 → v2.25.2 全 14 版本端到端演进）。
- `packages/panda-on-desk/README.md` 扩 93 行（165 → 258）：18 物种 + 12 PetState 完整对照表 + IPC 通信架构拓扑图 + 7 项故障排查。
- anthropic byte-equal 0 触碰；`src/` 0 改动；0 新依赖。

## v2.25.2 — 2026-04-20 · 波 4 自动启动稳定 + 14 物种 SVG + release 准备
- W4-T1 `panda --install-desk` 引导 + maybeSpawnOnDesk 容错；首启不阻塞 CLI 主路径。
- W4-T2 14 物种程序化 SVG 资产补齐（chonk/cat/robot/owl/dragon/...），与 18 物种白名单对齐。
- W4-T3 文档同步（本 CHANGELOG + 主仓 panda-on-desk 章节 + 子包 README 扩展）。

## v2.25.1 — 2026-04-20 · W2-T4 补全 pandaBadge IPC + main wiring
- 修 pandaBadge 双击/4击交互 IPC 缺漏 + main 进程对应 handler 注册。
- 子包 226 pass 维持，回归 4 fail 基线（MatrixTheme env / getFrozenStats 历史遗留）。

## v2.25.0 — 2026-04-20 · GA W3 收尾（主方案 100% 完成）
- W3-T1 系统托盘 6 项菜单 + 5 选项设置面板（companionOnDesk / species / dnd / volume / autoLaunch）。
- W3-T2 跨平台 dry-run（win/linux unpacked 全成 / mac schema 通过）。

## v2.24.5 — 2026-04-19 · W1+W2 合并（完整桌面集成）
- W1 自动 spawn + 美工升级 + dist 打包 + IPC 实测；W2 18 物种切换 / XP 进度条 / 103 通知 / 交互 + badge。
- panda CLI 启动自动浮现桌面宠物，单 commit 合并 8 子任务交付。

## v2.24.4 — 2026-04-19 · 自动启动（v2 §11.2 波 1）
- src/buddy/desk-spawn.ts 接入：panda 启动时尝试 spawn 已安装 panda-on-desk。
- postinstall 引导（fallback 静默跳过未安装环境，不阻塞 TUI 主体）。

## v2.24.3 — 2026-04-19 · panda-on-desk hit.html 路径修复 + inline SVG fallback
- mainWin loadFile 多候选路径定位 hit.html，规避 packaged asar / dev 目录歧义。
- inline SVG fallback 兜底，theme 缺资产时仍可显示宠物轮廓。

## v2.24.2 — 2026-04-19 · 宠物可见 + 可拖拽
- hit 窗 transparent + alwaysOnTop + frame:false 修正；macOS LSUIElement 隐藏 dock。
- 鼠标拖拽 + window.move 联动；breathing 动画 CSS keyframe 注入。

## v2.24.1 — 2026-04-19 · 启动 hotfix（8 stub + state.refreshTheme fallback）
- 修 state.ts refreshTheme 在 ctx.theme 未注入时三段 fallback 防 null 崩溃。
- 8 处 stub 补齐 main → state ctx 调用边界（hotfix #20260419-DESK-FIX）。

## v2.24.0 — 2026-04-19 · GA 美术（v1.5 程序化美术资产 + electron 实跑）
- 程序化 SVG 美术替换 v1.0 占位图标；多帧动画 + 配色 + drop-shadow。
- electron@41.2.1 子包实装；linux --dir build 完整通过。

## v2.23.1 — 2026-04-19 · 全 103 场景接入
- 主动推送 103 场景 100% 通过 panda-on-desk overlay 呈现（system / overlay / badge / sound）。
- 370 测试用例新增；DND + 5min 聚合 + 离线累积链路打通。

## v2.23.0 — 2026-04-19 · v1.0 GA 占位（Phase 3 收尾）
- 跨平台打包 workflow + icon 资产 + 文档结构占位；GitHub Release 通道激活前 schema 验证。
- 与上游 clawd-on-desk 81% 吸收完成，进入子产品独立维护期。

## v2.22.2 — 2026-04-19 · Phase 2 完整（超级助手 TOP 10 联动）
- system / overlay / badge / sound / DND / queue 6 模块就绪 + 10 主动场景接入。
- 132 单测覆盖 IPC + 通知聚合链路。

## v2.22.1 — 2026-04-19 · Phase 1 Electron v0
- launch.cjs + main god file + 4 BrowserWindow（hit/bubble/settings/update-bubble）+ IPC bridge。
- 22 模块从 clawd-on-desk fork；main.js 削皮 63.6%（去 8-agent multi-provider）。

## v2.22.0 — 2026-04-19 · Phase 0 养成系统首发
- panda 形象宠物养成系统：XP 11 桶 + 60 级 + 5 稀有度 + 13 里程碑。
- HMAC sign 防作弊 + StatusLine 1×5 字符 mini-pet 嵌入。

---

## 提交规范说明
- 完整 commit 历史：`git log --oneline` 或 `monitor/20260419-on-desk-主方案.md` §10.14 / §11.3。
- v2.25.0 GA 之前所有版本均为 panda CLI（@lc2panda/panda-code）主仓内提交，panda-on-desk 子包路径 `packages/panda-on-desk/`。
- byte-equal 守护：17 版本 0 触碰 `src/services/api/claude.ts` / `src/services/oauth/*` / `src/services/api/providers.ts`。
