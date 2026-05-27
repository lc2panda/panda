# TODO

## 已完成 — v2.27.6 Bug J UI 图片展示真补（2026-05-27 +08:00 闭环）

> 校时锚点：`2026-05-27 +08:00`（沿用 v2.27.2 当日锚点）。
> 发布产物：`@lc2panda/panda-code@2.27.6`（GitHub Packages）+ `@panda/desk-chat@0.3.4`（DMG/ZIP 5 件套）+ git tag `v2.27.6` + GitHub Release `https://github.com/lc2panda/panda/releases/tag/v2.27.6`。
> commit `d53c169`，三处缺口（chatStore UIAttachment + PdUserBubble gallery 渲染 + PdMessageList 透传），新增 9 个单测（净增，零新增 fail）。

- [x] chatStore.ts：新增 UIAttachment interface；UIUserMessage 增 attachments?；addUserMessage 扩三参；sendMessage normalize；messageEntryToUIMessage image blocks 解析（history replay）
- [x] PdUserBubble.tsx：import PdAttachmentGallery + UIAttachment；Props 增 attachments?；替换占位注释为真实渲染（裸 base64 → dataURL normalize）
- [x] PdMessageList.tsx：PdUserBubble 调用处透传 attachments
- [x] 版本号：root 2.27.5 → 2.27.6，desk-chat 0.3.3 → 0.3.4
- [x] 新增 9 个单测（3 文件）：433 passed / 1 failed（既有）/ 2 skipped
- [x] tsc exit 0；build:electron 0 errors；root build 624 files
- [x] DMG 5 件套打包：Panda-0.3.4-arm64.dmg（sha256 c631c1d7...）
- [x] /Applications/Panda.app 替换：CFBundleShortVersionString=0.3.4，asar sha256 a517a6bc...
- [x] git push main + v2.27.6 tag
- [x] npm publish：@lc2panda/panda-code@2.27.6 ✓
- [x] GitHub Release v2.27.6：5 资产 state=uploaded ✓

## 已完成 — v2.27.1 patch 发布（2026-05-27 17:58:15 +08:00 闭环，v2.27 大版本最终收口）

> 校时锚点：`2026-05-27 17:29:39 +08:00`（v2.27.1 发版起锚）。
> 发布产物：`@lc2panda/panda-code@2.27.1`（GitHub Packages，npm view 返回 `2.27.1`）+ `@panda/desk-chat@0.3.1`（DMG/ZIP 5 件套）+ git tag `v2.27.1` + GitHub Release `https://github.com/lc2panda/panda/releases/tag/v2.27.1`。
> 本波在 v2.27.0 基础上落地 13 个 commit：3 项 hotfix（Bug F/G/manifest）+ 10 项 cc-haha 能力吸收。详见 CLAUDE.md "议题：v2.27.1 发版执行结果"。

### Hotfix（3 项）
- [x] Bug G Agent timeout 默认值矛盾修复（10min → 0 禁用，env opt-in，commit `47592af`）
- [x] manifest build 集成 yml 端修复（commit `54f890b`，productName/appId/extraResources.to）—— **遗留**：electron-builder 实际加载 package.json `build` 字段忽略 yml，afterPack 未触发，packaged Resources/panda-cli/cli-manifest.json 仍缺失
- [x] Bug F G2+G5 终端 tab UX 修复（占位文案 + 打开系统终端按钮，commit `61a4b26`）

### cc-haha 高价值能力吸收（10 项）
- [x] Provider env 隔离 + Managed-OAuth env + clearStaleLock 自动清理（commit `a7373b3`）
- [x] sessionRewindService 会话回退 + 文件快照恢复 + titleService Haiku AI 生成 session 标题（commit `cd07858`）
- [x] mcpHostPreflight MCP 启动前置检查（which 探测 / cwd 校验，commit `356ca06`）
- [x] pandaOAuthService (`~/.pandacc.json` oauthAccount 状态读取，commit `f487b21`）
- [x] taskService CLI Task V2 后端 CRUD（commit `ff08160`）
- [x] notificationService 飞书 + Telegram webhook 直推（commit `2c7b52f`）
- [x] shouldReplacePlaceholder 占位 session 清理 + Bug F 合一（commit `36bafa8`）
- [x] computerUseApprovalService 审批通道 MVP（commit `fd0fc7b`）
- [x] Plugin/Skill/Adapter/Settings IPC 后端接通（commit `867711e`）
- [x] agentService + teamService 完整后端 CRUD（commit `0bae2a2`）

### 发版执行（全部完成）
- [x] 版本号升级：root 2.27.0 → 2.27.1, desk-chat 0.3.0 → 0.3.1
- [x] root CLI build：`Bundled 624 files`
- [x] Desk Chat 三层验证：单测 402/402、tsc exit 0、build:electron OK
- [x] DMG 5 件套打包（耗时约 10 分钟）：Panda-0.3.1-arm64.dmg/zip/blockmap×2/latest-mac.yml
- [x] sha256 收集与 app.asar 一致性校验
- [x] /Applications/Panda.app 替换为 0.3.1（asar sha256 与 release 一致 `0c1881f1...`）
- [x] git commit `7c5c99b` + tag `v2.27.1` + push main + push tag
- [x] npm publish 到 GitHub Packages（`@lc2panda/panda-code@2.27.1`，769 files，19.2 MB）
- [x] npm view 验证返回 `2.27.1`
- [x] gh release create v2.27.1：5 个资产全部 `state=uploaded`
- [x] CLAUDE.md 校时锚点 + "议题：v2.27.1 发版执行结果" 回填
- [x] TODO.md v2.27.1 标记完成

### v2.27.2 待办（manifest 集成根因修复）
- [ ] 将 `electron-builder.yml` 中的 `afterPack: scripts/afterPack.cjs` 与 `extraResources.to: panda-cli/dist` 配置合并到 `packages/panda-desk-chat/package.json` 的 `build` 字段，让 electron-builder 实际读到 afterPack hook。或者删除 package.json `build` 字段强制 electron-builder 加载 yml。修复后下次 DMG 应生成 `Resources/panda-cli/cli-manifest.json`，sha256 校验链路恢复正常。
- [ ] 验证 packaged `Resources/panda-cli/cli-manifest.json` 包含 624 个 .js 文件 sha256 + version 字段。

### v2.27 大版本闭环
- v2.27.0（2026-05-27 11:00+）→ v2.27.1（2026-05-27 17:58:15）= v2.27 周期全部能力交付完毕
- cc-haha 高价值能力全量吸收（13 项规划全部落盘）
- Bug A/B（v2.26.14 阶段）+ Bug C/D/E（v2.27.0）+ Bug F/G（v2.27.1）共 7 项 P0/P1 Bug 全部闭环
- panda 主线进入稳定阶段，无后续大版本规划

---

## 已完成 — v2.27.0 大版本发布（2026-05-27 11:00+ +08:00 闭环）

> 校时锚点：`2026-05-27 09:36:32 +08:00`（立项）/ `2026-05-27 10:58:32 +08:00`（发版打包与发布）。
> 发布产物：`@lc2panda/panda-code@2.27.0`（GitHub Packages）+ `@panda/desk-chat@0.3.0`（DMG/ZIP 5 件套）+ git tag `v2.27.0` + GitHub Release `https://github.com/lc2panda/panda/releases/tag/v2.27.0`。
> 本波交付 9 项：Bug A C3 / Bug B / Bug C / Bug D / Bug E / P0-1 ConversationStartupError / P0-2 STARTUP_GRACE_MS / P1 sha256 / P1 Mermaid。
> 详见 CLAUDE.md "证据清单 → 议题：v2.27.0 发版执行结果"。

### 已合入（v2.26.14 阶段，并入 v2.27.0）
- [x] Bug A C3：cache_control.scope global 前缀违规修复（`src/services/api/claude.ts`，tools 非 defer 时回退 org scope）
- [x] Bug B：Desk Chat 历史会话 cwd 三级回退（session-meta.workDir → entries[].cwd → desanitize projectDir）+ spawn env CALLER_DIR/PWD 注入 + typed Error 显式抛出（`cli-manager.ts` + `disk-session-scanner.ts`）

### 波次 1：调研（已完成）
- [x] Bug C 根因调研：PID registry 同 session 占用提示（C 方案 ~30-50 行，复用 `packages/panda-desk-chat/electron/backend/concurrentSessions.ts`）
- [x] Bug D 根因调研：双层叠加（PdMarkdownRenderer.tsx pre override 空 fence + chatStore.ts 多 text block 单 '\n' join）→ F1+F2 方案
- [x] Bug E 根因调研：PdComposer.tsx 序列化 @path 绕过 chatStore + ipc/schemas.ts attachmentSchema 错位 → B 方案三参签名

### 波次 2：P0 实施（已完成）
- [x] ConversationStartupError 分类错误码 + retryable 标记（commit c6adeef + de4f6a4）
- [x] STARTUP_GRACE_MS=3000 早退检测 + buildStartupError 分类（commit de4f6a4）
- [x] P0 单元测试 + 集成测试通过

### 波次 3：P1 实施（部分完成）
- [x] sidecar sha256 完整性校验（commit cde2842，~80 行；packaged-only 校验，dev 模式 missingManifest=true 走 warn 不阻塞）
- [x] Mermaid 渲染能力新增（renderer 端）
- 滚动 v2.27.x：titleService / sessionRewindService / Provider env / clearStaleLock

### 波次 4：Bug C 实施（已完成）
- [x] Bug C：PID registry 同 session 占用提示（commit b7d9239）

### 波次 5：Bug D/E 修复（已完成）
- [x] Bug D：F1+F2 方案，chatStore.ts join '\n' → '\n\n' + PdMarkdownRenderer.tsx 空 fence 抑制（commit b7d9239）
- [x] Bug E：B 方案，chatStore 三参签名 (sessionId, content, attachments?) + PdComposer 直传 + ipc/schemas.ts 修正 {mediaType, data}（commit b7d9239）

### 波次 6：三层验证 + 打包发版（已完成）
- [x] 单元测试通过
- [x] 集成测试通过
- [x] DMG 打包：`Panda-0.3.0-arm64.dmg` 182,948,366 bytes sha256 `5c8ee8095d27a5b6241b6355aa3d9eda23e42d863fdcb64800377448278a0afb`
- [x] ZIP：`Panda-0.3.0-arm64-mac.zip` 175,522,322 bytes sha256 `1a3ea85c3ea350887ce0a1e90e0a3819d2b5f4d254a50607236b099c9e804fac`
- [x] latest-mac.yml sha256 `ea22a698d09245bf1526e3302ccd1612ebbca1f48065c1a7d10ca7d2023c121e`
- [x] DMG blockmap sha256 `51a65c717008bcbc58c055923c4a9776f5140aa3a934e38f039f00664498d4a4`
- [x] ZIP blockmap sha256 `473d3324c3ac9bfcd7021640b95bac49acaef2f3aea42631b3254d9cc4579c89`
- [x] app.asar sha256 `2ccc15651420625b7efd95baef6cbeca824394d23dc531fbee50a707e7143621`（release/mac-arm64 与 /Applications/Panda.app 一致）
- [x] `/Applications/Panda.app` CFBundleShortVersionString = `0.3.0`
- [x] packaged panda-cli `--version` = `2.1.142 (Panda)`
- [x] `git push panda main` + `git push panda v2.27.0`（tag commit `f9fdb9ff199805653c6ac7c9edaa8e11d06be455`）
- [x] `npm publish` → `@lc2panda/panda-code@2.27.0` GitHub Packages 已确认（`npm view` 返回 `2.27.0`）
- [x] `gh release create v2.27.0` → 5 资产全部 uploaded，URL `https://github.com/lc2panda/panda/releases/tag/v2.27.0`
- [x] CLAUDE.md 验证证据回填

## 进行中 — v2.27.x 滚动叠加（cc-haha 高价值能力分波吸收）

> 背景：v2.27.0 已交付 9 项核心能力（Bug A-E 全闭环 + P0-1/P0-2 + P1 sha256/Mermaid）；剩余 cc-haha P1/P2/P3 能力滚动到 v2.27.x 小版本迭代，避免单次发布窗口过宽。
> 来源蓝本：`monitor/tmp/cc-haha/`（仅作为调研参考，合入时统一改 `PANDA_*` env 前缀）。

### P1 剩余（优先纳入 v2.27.1/v2.27.2）
- [ ] Provider env 隔离 + Managed-OAuth env 注入（~200 行，源自 cc-haha `providerEnvService`）
- [ ] clearStaleLock 自动重试（中等规模，启动锁清理路径）
- [ ] titleService AI 生成 session 标题（Haiku 两阶段抽取，~116 行）
- [ ] sessionRewindService 会话回退 + 文件历史快照恢复（~393 行，依赖既有 FileFreshness/snapshot）

### P2（机会主义合入 v2.27.x）
- [ ] mcpHostPreflight MCP 启动前置检查
- [ ] pandaOAuthService（重命名自 `hahaOAuthService`，桌面自管 OAuth token 存取）
- [ ] notificationService Telegram/飞书 HTTP 直推（~278 行，复用既有 channelRegistry）
- [ ] taskService（CLI Task V2）后端实现（~146 行）

### P3（视窗口决定）
- [ ] shouldReplacePlaceholder 占位 session 清理
- [ ] computerUseApprovalService + computer-use-python API
- [ ] agentService（~240 行）+ teamService（~608 行）完整后端
- [ ] Plugin/Skill/Adapter/Settings IPC 后端（30+ TODO(IPC) 标记，分模块迭代）

### Bug F：终端 tab 占位优化（G2+G5 patch）
- [ ] G2：tab 占位补丁
- [ ] G5：tab 占位补丁

### 已知小残留（v2.27.0 验证记录）
- [ ] P1 sha256 manifest：`Resources/panda-cli/cli-manifest.json` 未在 v2.27.0 packaged 产物中生成（dev 模式 missingManifest=true 路径不阻塞），需在 v2.27.1 补 `scripts/generate-cli-manifest.ts` build 集成。

## 暂缓 — v2.27.0（计划）本地 Anthropic API 代理 127.0.0.1:37295（2026-05-25 18:15:20 +08:00 立项）

> 状态：已立项，4 路侦察未启动。Comdr 决策本地代理能力推迟到 v2.28.x 单独评估，不并入 v2.27.0 大版本范围，避免发布窗口被拉长。

> 需求：`panda auth login` 环境变量登录成功后，panda 启动时拉起本地 anthropic SDK 兼容代理 http://127.0.0.1:37295；本机其他 SDK 客户端把 baseURL 指向该地址即可使用与 panda 相同的 session，转发请求时使用 panda User-Agent `claude-code/2.1.* (external, cli)`。目标：单 auth 多 CLI 复用，避免多终端登录限流。

- [x] 真实时间核验：本机 `2026-05-25 18:15:18 +08:00`，Apple `2026-05-25 18:15:19 +08:00`，Cloudflare `2026-05-25 18:15:20 +08:00`，最大偏差约 2 秒，判定通过。
- [x] 阶段 1 立项：作战手册（10 人 agent team / PM 香草跟踪 / agent 落盘后释放 / auto 推进）落地为 5 阶段任务清单。
- [ ] 阶段 1：4 路侦察并行（已派单 2026-05-25 18:15:20 +08:00）
    - [ ] 侦察 A 本地 panda auth/API 链路审计 → `monitor/recon-A-auth-pipeline.md`
    - [ ] 侦察 B Anthropic Messages API / SDK 协议联网调研 → `monitor/recon-B-anthropic-api.md`
    - [ ] 侦察 C 同类开源代理项目联网调研 → `monitor/recon-C-similar-proxies.md`
    - [ ] 侦察 D 端口/绑定/鉴权/生命周期方案设计调研 → `monitor/recon-D-security-lifecycle.md`
- [ ] 阶段 2：≥10 方案量化对比 + 选 Top-1（待 4 份侦察落盘后派 architect agent）。
- [ ] 阶段 3：实施梯队并行交付（HTTP server / auth+UA 注入 / 流式转发 / 生命周期钩子 / CLI 配置开关）。
- [ ] 阶段 4：三重验证（单元 + `@anthropic-ai/sdk` 真实集成 + SSE E2E + 鉴权/端口冲突/退出钩子）。
- [ ] 阶段 5：文档同步（README / CLAUDE.md 证据清单 / TODO.md）+ git commit + 版本号决策（v2.27.0 候选）。

## 已完成 — v2.26.11 Desk Chat 历史会话错误诊断与恢复修补（2026-05-25 17:30:41 +08:00）

- [x] 真实时间核验：本机 `2026-05-25 17:20:38 +08:00`，Cloudflare `2026-05-25 17:20:39 +08:00`，Apple `2026-05-25 17:20:39 +08:00`，最大偏差约 1 秒，判定通过。
- [x] 用户截图复核：`2026-05-25 17:20:38 +08:00` 截图仍显示历史会话中重复追加 `CLI process exited before completing the response (code=1 signal=null).`；v2.26.10 不能再记录为真实闭环。
- [x] 修复历史 tab 恢复：`tabStore.restoreTabs()` 改读 `bridge.listAllSessions()` / `~/.pandacc/projects` 磁盘历史，不再依赖 live `cliManager.listSessions()`；`setActiveTab()` 兼容内部 tab.id 并解析回 sessionId，tab 切换不触发 CLI focus。
- [x] 修复 code=1 刷屏与诊断缺失：CLI 子进程异常退出不再自动 5 次 respawn；`stream:error` payload 增加 `stderrTail`、`cwd`、`cliPath`、`bunPath`、`configDir`、`resourcesPath`、`logPath`；主进程日志写入 Electron logs 目录的 `panda-desk-chat-main.log`。
- [x] 会话控制兜底：`session-controls.ts` 对非 UUID 历史只读会话提前返回中文错误，避免绕过前端后再进入 CLI。
- [x] 验证：`cd packages/panda-desk-chat && bun run test src/__tests__/stores/tabStore.test.ts src/__tests__/stores/chatStore.test.ts src/__tests__/stores/sessionStore.test.ts` 通过 51/51；`npx tsc -b --pretty false --incremental false` 通过；`bun run build:electron` 通过。
- [x] packaged CLI 历史 UUID resume smoke：真实 `~/.pandacc/projects/-Users-panda-Downloads-cc-panda/7398afd6-82a3-4653-81a2-349f8d6ec4fe.jsonl` 可启动并进入 `system init`，但后续 API 返回 `429 rate_limit` 重试，未作为 assistant result 成功闭环。
- [x] 重新打包 Desk Chat `0.2.6`：`cd packages/panda-desk-chat && bun run dist` 于 `2026-05-25 17:43:00 +08:00` 通过，生成 `Panda-0.2.6-arm64.dmg`（145 MB）、`Panda-0.2.6-arm64-mac.zip`（139 MB）、两个 blockmap 与 `latest-mac.yml`；资源核验 `panda-cli/dist/cli.js` 存在，`panda-cli/dist` 共 625 个文件，`bun .../cli.js --version` 返回 `2.1.142 (Panda)`。
- [x] 安装版复核：Comdr 后续截图仍是旧短错误；`2026-05-25 17:47:36 +08:00` 复核发现 `/Applications/Panda.app` 仍为 `0.2.5`，已从 `Panda-0.2.6-arm64.dmg` 替换为 `0.2.6`；`app.asar` sha256 与 release app 均为 `e3344f21d1246195c2c50c30e16356bf6ac6d086c643c400c00b4ed59756503a`。
- [x] 发布 GitHub Release `v2.26.11` 并发布 `@lc2panda/panda-code@2.26.11` 到 GitHub Packages：Release URL `https://github.com/lc2panda/panda/releases/tag/v2.26.11`，资产 `latest-mac.yml`、`Panda-0.2.6-arm64.dmg`、`Panda-0.2.6-arm64-mac.zip`、两个 blockmap 均为 `uploaded`；`npm view @lc2panda/panda-code@2.26.11 version --registry=https://npm.pkg.github.com` 返回 `2.26.11`。

## 已完成 — v2.26.10 Desk Chat 历史对话只读加载热修（2026-05-25 16:55:25 +08:00）

- [x] 真实时间核验：本机 `2026-05-25 16:55:24 +08:00`，Cloudflare `2026-05-25 16:55:25 +08:00`，Apple `2026-05-25 16:55:25 +08:00`，最大偏差约 1 秒，判定通过。
- [x] 根因定位：打开历史对话时 `ActiveSession` 挂载会调用 `connectToSession()`，继而触发 `sessionStore.setActiveSession()` / `bridge.focusSession()`，导致只读历史加载也启动 CLI；非 UUID 历史 id 会触发 CLI code=1。
- [x] 修复策略：历史对话切换只更新 active id 并读取 `~/.pandacc/projects` 历史，不再 focus/spawn CLI；仅合法 UUID 会话才允许 focus 复活；后台空 session list 不再自动 re-materialise 历史 active id。
- [x] 验证：`cd packages/panda-desk-chat && bun run build:electron` 通过；`cd packages/panda-desk-chat && bun run test src/__tests__/stores/sessionStore.test.ts src/__tests__/stores/settingsStore.test.ts` 通过 12/12。
- [x] 重新打包 Desk Chat `0.2.5`：`bun run dist` 于 `2026-05-25 17:08:00 +08:00` 通过，生成 `Panda-0.2.5-arm64.dmg`、`Panda-0.2.5-arm64-mac.zip`、两个 blockmap 与 `latest-mac.yml`；资源核验 `panda-cli/dist/cli.js` 存在，`panda-cli/dist` 共 625 个文件。
- [x] 创建 GitHub Release `v2.26.10` 并上传安装包：`latest-mac.yml`、`Panda-0.2.5-arm64.dmg`、`Panda-0.2.5-arm64-mac.zip`、两个 blockmap 已上传，Release URL `https://github.com/lc2panda/panda/releases/tag/v2.26.10`。
- [x] git push 与 npm 同步：`main` 与 tag `v2.26.10` 已推送；`@lc2panda/panda-code@2.26.10` 已发布到 GitHub Packages，`npm view` 返回 `2.26.10`。
- [!] 复核修正：Comdr 于 `2026-05-25 17:20:38 +08:00` 提供截图证明 v2.26.10 用户场景仍未闭环；后续修复转入 v2.26.11。

## 已完成 — v2.26.9 Desk Chat 历史会话续聊热修（2026-05-25 16:22:20 +08:00）

- [x] 真实时间核验：本机 `2026-05-25 16:22:18 +08:00`，Cloudflare `2026-05-25 16:22:19 +08:00`，Apple `2026-05-25 16:22:20 +08:00`，最大偏差约 2 秒，判定通过。
- [x] 根因复现：非 UUID 历史 `sessionId` 传给 packaged CLI 会报 `Error: Invalid session ID. Must be a valid UUID.` 并以 code=1 退出；UUID + `--permission-mode bypassPermissions` 可真实返回 `pong`。
- [x] 修复历史续聊：Desk Chat 在非 UUID 历史会话中发送消息时自动创建新的 UUID 会话，保留当前 UI 历史消息并替换当前 tab，再把新消息发到新会话。
- [x] 修复权限模式：renderer 迁移旧 `skip/dontAsk`，IPC 将 `auto` 映射为 CLI 稳定支持的 `default`；backend 白名单兜底未知权限模式，避免非法 `--permission-mode` 触发 code=1。
- [x] 验证：`cd packages/panda-desk-chat && bun run build:electron` 通过；`cd packages/panda-desk-chat && bun run test src/__tests__/stores/settingsStore.test.ts` 通过 6/6；packaged CLI UUID + `bypassPermissions` 真实返回 `pong`。
- [x] 重新打包 Desk Chat `0.2.4`：`bun run dist` 于 `2026-05-25 16:40:00 +08:00` 通过，生成 `Panda-0.2.4-arm64.dmg`、`Panda-0.2.4-arm64-mac.zip`、两个 blockmap 与 `latest-mac.yml`；资源核验 `panda-cli/dist/cli.js` 存在，`panda-cli/dist` 共 625 个文件。
- [x] 创建 GitHub Release `v2.26.9` 并上传安装包：`latest-mac.yml`、`Panda-0.2.4-arm64.dmg`、`Panda-0.2.4-arm64-mac.zip`、两个 blockmap 已上传，Release URL `https://github.com/lc2panda/panda/releases/tag/v2.26.9`。
- [x] git push 与 npm 同步：`main` 与 tag `v2.26.9` 已推送；`@lc2panda/panda-code@2.26.9` 已发布到 GitHub Packages，`npm view` 返回 `2.26.9`。

## 已完成 — v2.26.8 Desk Chat Release 热修（2026-05-25 15:47:20 +08:00）

- [x] 真实时间核验：本机 `2026-05-25 15:47:20 +08:00`，Apple `2026-05-25 15:47:21 +08:00`，Cloudflare `2026-05-25 15:47:21 +08:00`，最大偏差约 1 秒，判定通过。
- [x] 截图报错根因定位：已安装 `/Applications/Panda.app/Contents/Resources/` 与本地打包 app 均只有 `app.asar`，缺少 `dist/cli.js`；Desk Chat packaged 后端查找 `process.resourcesPath/dist/cli.js`，导致发送消息时报 `Module not found`。
- [x] 修复策略：打包时复制根 `dist/**/*` 到 `Resources/panda-cli/dist/`，并让 `cli-manager.ts` 优先查找 `panda-cli/dist/cli.js`，保留旧 `Resources/dist/cli.js` fallback。
- [x] 模型核对：当前截图中的 `Claude Opus 4.7`、`Claude Sonnet 4.6`、`claude-haiku-4-5` 与 `src/utils/model/configs.ts` 的 firstParty 模型源对齐；UI 的 `Custom Provider` 展示来自 CLI provider snapshot，不另造模型。
- [x] README：`1.1.1 Panda Desk Chat（UI 桌面端）— 下载、安装与使用` 已简化为 GitHub Releases latest 下载入口，不再提供 UI 源码安装说明。
- [x] 重新打包 Desk Chat `0.2.3`，验证 `Resources/panda-cli/dist/cli.js` 与 chunks 存在；`bun run dist` 于 `2026-05-25 15:59:32 +08:00` 通过，生成 `Panda-0.2.3-arm64.dmg` 与 `Panda-0.2.3-arm64-mac.zip`。
- [x] 创建 GitHub Release `v2.26.8` 并上传 Desk Chat 安装包：`Panda-0.2.3-arm64.dmg`、`Panda-0.2.3-arm64-mac.zip`、两个 blockmap 与 `latest-mac.yml` 已上传。
- [x] git push 与 npm 同步：`main`、tag `v2.26.8` 已推送；`@lc2panda/panda-code@2.26.8` 已发布到 GitHub Packages。

## 已完成 — v2.26.7 Desk Chat 发布入口与桌面端修补（2026-05-25 10:35:46 +08:00）

- [x] 真实时间核验：本机 `2026-05-25 10:35:44 +08:00`，Apple `2026-05-25 10:35:45 +08:00`，Cloudflare `2026-05-25 10:35:46 +08:00`，最大偏差约 2 秒，判定通过。
- [x] git 历史/框架源码审计：确认 `panda-on-desk` 为历史桌宠线，`panda-desk-chat@0.2.2` 为当前 UI 桌面端；当前 main/panda/main 为 `98eb2b6`。
- [x] 权威资料检索：Electron drag region / IPC、npm README 发布机制、Node `process.env` 环境变量读取均已纳入证据。
- [x] README：将 `1.1.1 桌面宠物（panda-on-desk）— 两种装法` 替换为 Panda Desk Chat UI 桌面端下载、安装与使用；桌宠降级为历史归档，不再作为用户下载入口。
- [x] CLI 启动：移除 `[panda] 桌面宠物未安装。跑 \`panda --install-desk\` 启用 ✨` 提示/校验。
- [x] Desk Chat：修复输入后长期 `Thinking...` 的错误/退出/stream 兜底回写。
- [x] Desk Chat：修复 `设置 - 服务商` 为空，展示 CLI 的环境变量、`auth login`、`settings.json` 配置快照，并修复模型设置 IPC payload 错位。
- [x] Desk Chat：修复顶部空白区域不可拖动窗口，避免破坏 tab 点击/关闭/右键/重排。
- [x] 验证：单元/集成/桌面端构建或可替代验证完成后记录命令与结果。
- [x] git：完成文档与代码变更提交，保留可追溯提交信息。
- [x] 桌面端重新打包：`cd packages/panda-desk-chat && bun run dist` 于 `2026-05-25 15:35:56 +08:00` 通过，生成 macOS arm64 `Panda-0.2.2-arm64.dmg` 与 `Panda-0.2.2-arm64-mac.zip`；notarization 因未配置 `notarize` 选项被 electron-builder 跳过。
- [x] 远端同步：`git push panda main` 于 `2026-05-25 15:32:00 +08:00` 成功，`main` 推至 `panda/main`。
- [x] GitHub Packages：`npm publish --registry=https://npm.pkg.github.com` 于 `2026-05-25 15:33:00 +08:00` 成功发布 `@lc2panda/panda-code@2.26.7`；`npm view @lc2panda/panda-code@2.26.7 version --registry=https://npm.pkg.github.com` 返回 `2.26.7`。
- 验证记录（2026-05-25 14:32:38 +08:00）：`bun run build:electron` 通过；`bun run test` 失败于既有 `localStorage.getItem` 测试环境与 `tabStore` 旧断言基线；`bun test src/desk/launcher.test.ts src/desk/launcher.integration.test.ts src/desk/e2e-install-spawn.test.ts` 通过 launcher/launcher.integration，失败于 `e2e-install-spawn.test.ts:355` 的 tmpdir 路径既有断言；`rg` 确认 README 不再保留旧强安装入口或启动提示。

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

### v2.1.120→v2.1.124 修复 (2026-04-03)
- [x] REPL 输入栏回归修复 (UndercoverAutoCallout 死锁)
- [x] 编译时 MACRO 注入 (VERSION/PACKAGE_URL)
- [x] 无条件 traffic guard (启动挂起修复)
- [x] 69 个 / 命令 PTY 验证 (65 PASS / 3 BLOCKED / 1 N/A)
- [x] CC命令使用手册.md 全面更新
- [x] wsh badge hook 修复 (Wave Terminal 环境检测)
- [x] 能力审计完成 (109 存根 + 5 CRITICAL + 12 HIGH)
- [x] OpenClaw/ClawGod 对比分析完成

## 待办 — 能力对齐方案 (审批: 2026-04-04)

> 详见: monitor/capability-alignment-plan.md
> 约束: 不得破坏当前已有能力

### Phase 1: CRITICAL 修复 ✅ (v2.1.125)
- [x] 1.1 assistant/index.ts 反存根 (isAssistantMode→真实判断)
- [x] 1.2 moodSense 自动检测 (关键词+情绪分析，中英双语)
- [x] 1.3 builtinTasks 启用 + 接入 cronTasks 引擎 (dream/briefing/health)
- [x] 1.4 夜间任务链编排器 (nightTaskOrchestrator + 5分钟节流)
- [x] 1.5 emotionalMemory + workingMemory 持久化 (JSON+LRU100+TTL24h)

### Phase 2: 能力对齐 ✅ (v2.1.125, 2.5 推迟)
- [x] 2.1 Coordinator 多智能体协作反存根
- [x] 2.2 KAIROS 持久 Agent 完善 (assistant→proactive→sense 链路)
- [x] 2.3 GrowthBook flag 全面补全 (+13 新 flag)
- [x] 2.4 sense pipeline 贯通 (mood on input + persona auto-switch + dream context)
- [ ] 2.5 contextCollapse 实装 — 推迟（高风险，需单独设计）

### Phase 3: 安全研究 ✅ (v2.1.125)
- [x] 3.1 安全边界完整映射文档 (monitor/security-boundary-map.md)
- [x] 3.2 安全限制可配置化 (PANDA_SECURITY_RESEARCH env)
- [x] 3.3 红队测试环境配置文档 (monitor/red-team-setup-guide.md)

### 其他待办
- [ ] `@ant/claude-for-chrome-mcp` — Chrome MCP 完整实现
- [ ] 终端实际渲染验证 (熊猫 Logo 视觉效果)

### 💡 产品灵感捕获
- [ ] **Samantha 式情绪理解** (2026-04-08 13:45 +08:00) — 超级助手应该像电影 *Her* 中的 Samantha 一样理解用户情绪。当前已有 moodSense 关键词+情绪分析（Phase 1.2）和 emotionalMemory 持久化（Phase 1.5），下一步可深化为：多轮情绪追踪、语境推断意图、主动关怀式回应、情绪记忆长期画像。目标：从"工具"进化为"懂你的伙伴"。

## Agent 输出截断 Bug 修复 ✅
> 完成时间：2026-04-22
> 根因：PANDA_AGENT_MAX_TURNS=10 覆盖代码默认值 200，限制 agent 为 10 轮

- [x] Fix 1: PANDA_AGENT_MAX_TURNS 10→200 (db6f5cb)
  - settings.json 运行时配置更新
  - initPandaccSettings.ts 代码默认值更新
  - 迁移逻辑：自动将旧值 '10' 升级为 '200'
- [x] Fix 2: max_turns_reached 优雅降级 (40f6221)
- [x] Fix 3: 验证通过 — 17 tool calls 完整输出
- [x] Fix 4: 收尾修复 — fallback 对齐 200 + catch 错误日志改进 (8aeb651)

根因链：settings.json '10' → env → runAgent.ts → query.ts 硬截断 → 无最终摘要 → 输出片段

## UI 功能实现（就绪）
> Agent bug 已修复，W16 进行中

W15 已完成：系统托盘激活 + 58 测试用例
W16 进行中 (4/5 完成):
- [x] W16-1: E2E Playwright (fc35cc7)
- [x] W16-2: Notification System (0c81fa6)
- [x] W16-3: 多窗口支持 (08256ec, b484392, 99d2ea0)
- [x] W16-4: Auto-update (94675a0)
- [x] W16-5: Theme System (bca68a9)
- [x] W16-6: Findings cleanup — stale TODOs, dynamic slash cmds, PetStrip, icon

## CSP 安全加固 ✅
> 完成时间：2026-04-23
- [x] 移除 CSP unsafe-eval (08256ec)
- [x] 提取 FOUC 内联脚本到 public/fouc.js
- [x] BrowserWindow 添加 sandbox: true
- [x] session 级 CSP response header 双重保障

## 多窗口完善 ✅ (W16-3)
> 完成时间：2026-04-23
- [x] G1: windowStore + renderer windowId 感知 (99d2ea0)
- [x] G3: tabStore 窗口隔离 (99d2ea0)
- [x] G4: DevMockRelay 多窗口支持 (99d2ea0)
- [x] G5: NotificationManager 智能路由 (b484392)
- [x] G6: WINDOW_POSITION sender 定位 (b484392)
- [x] G7: URL session 参数传递 (b484392)
- [x] G9: 窗口位置/尺寸持久化 (b484392)
- [x] G10: appUpdater 广播所有窗口 (b484392)

## UI Claude Desktop 对齐 (§12) ✅
> 完成时间：2026-04-23

### Wave E — P0 缺失组件
- [x] E-1: PdDiffViewer 组件 (a218919)
- [x] E-2: PdAskUserQuestion 组件 (a218919)
- [x] E-3: FileRenderer 接入 DiffViewer (a218919)
- [x] E-4: BashRenderer ANSI 增强 (a218919)
- [x] E-5: SearchRenderer 结构化 (a218919)

### Wave F — P1 视觉品质
- [x] F-1: glass-panel 毛玻璃效果 (3d32f2d)
- [x] F-2: ThinkingBlock 计时 + pulse 动画 (3d32f2d)
- [x] F-3: Composer 底栏 Model + Permission 选择器 (3d32f2d)
- [x] F-4: HeroComposer 增强 96px + pills (3d32f2d)
- [x] F-5: Tab 关闭退出动画 (3d32f2d)
- [x] F-6: prefers-reduced-motion 已有

### Wave G — P2 功能完善
- [x] G-1: Sidebar duplicate + archive (本次)
- [x] G-5: Streaming 3-dot pulse (本次)

---

## 上游 v2.1.88 → v2.1.120 迁移路线图（2026-04-26）

> 完整方案：`monitor/migration-plan-2026-04-26.md`（526 行）
> 调研依据：3 份落盘报告（version-features / features-deep-dive / panda-cli-capability-snapshot）
> Gap 分类：A=47 已覆盖｜B=26 部分｜C=19 缺失｜D=8 不做

### Top-3 P0/P1（3 天交付，Score 排序）
- [ ] **#1 `/recap` slash 收尾** Score 8.10 — P0 0.5 天
  - 路径：`src/commands/recap/index.ts` 特例新建 `[NEW-FILE:#20260426-01]` + `commands.ts` 注册
  - 复用：`src/services/awaySummary.ts` + `src/hooks/useAwaySummary.ts`（自动版已 100% 实现）
- [ ] **#6 Hooks v2 字段补齐** Score 6.95 — P1 1.5 天
  - 缺：`mcp_tool` handler 类型 + `duration_ms` PostToolUse 字段
  - 路径：`src/utils/hooks/execMcpToolHook.ts` 特例新建 `[NEW-FILE:#20260426-02]` + 5 处现有文件改造
- [ ] **#2 `/usage` 合并入口** Score 6.85 — P1 1 天
  - `/cost` `/stats` 改 thin shim 跳转 `/usage` tab，零新建文件

### B 类后续批次（19 条，按版本分组）
- [ ] B 批次①（v2.1.118）：`/fork` 写盘验证、`prUrlTemplate`、Vim Visual+jk、`config` 优先级链
- [ ] B 批次②（v2.1.110+）：`PreCompact` exit code 2 阻断、`headersHelper` MCP 元数据、自定义命名主题
- [ ] B 批次③（其它）：Auto Mode 默认开启、`/proactive` ↔ `/loop` 互通、Skill 描述上限、Bedrock/Vertex 安装向导

### C 类完全缺失（19 条，按 Score 排序，待决）
- [ ] `/tui` 全屏模式、`/focus` 专注视图、`prUrlTemplate`、`CLAUDE_CODE_HIDE_CWD`
- [ ] `managed-settings.d/` drop-in、`disableDeepLinkRegistration`、`SUBPROCESS_ENV_SCRUB`
- [ ] `--from-pr` 多平台、`blockedMarketplaces`、插件 `monitors` / `bin/` / `tag`
- [ ] `ENABLE_PROMPT_CACHING_1H` / `FORCE_PROMPT_CACHING_5M` env
- [ ] `/team-onboarding` `/powerup` `${CLAUDE_EFFORT}` 变量
- [ ] `sandbox.failIfUnavailable` 策略字段

### 关键风险（执行前必带补丁）
- ⚠️ CLAUDE.md 被忽略回归（上游 issue #53040）
- ⚠️ Forked subagents 写盘膨胀（v2.1.118 修复"指针式"）
- ⚠️ Focus mode 吞 system status lines（v2.1.110 修复）

### D 类不迁移（已知禁用）
- 企业 Console 鉴权 / Bedrock Mantle / OTEL 全家桶 / Datadog / Slacked / Perforce / 远程 settings 强刷 / channels 插件白名单

## matrix theme v3.7 Pro 后续波次（2026-04-29）

### 波次1 已完成 ✅
- [x] 4 档绿色板（OPERATOR_BRIGHT/PANDA_STD/WORKER_DIM/SYSTEM_FAINT）+ getRoleColor / getRoleDimColor helper
- [x] TurnRole 扩展 worker / system + ROLE_LABEL / ROLE_TOKEN 同步
- [x] TurnHeader 重构：`▎▶ [LABEL · ts] ━━━━ ◉ IN ▌` 6 元素 chrome
- [x] 响应式延伸线（最少 8 字符 / 上限 columns-4）
- [x] 11 单元测试 + 全套 74 测试无回归
- [x] build PASS（606 文件）

### 波次2 已完成 ✅（2026-04-29）
- [x] Message 元字段扩展 isSubAgent? + subAgentName?（侵入性最小方案，不扩展 type 联合）
- [x] Messages.tsx roleChanged 逻辑接 worker / system 分支（computeChromeKey helper 跨 type+isSubAgent 维度）
- [x] AgentTool/UI 与 TurnHeader worker role 对接，displayName 来自 prompt 摘要（首 32 字符 + …）
- [x] sub-agent 实时模式（renderToolUseProgressMessage）+ 完成模式（renderToolResultMessage）双路径 worker chrome
- [x] **Comdr 问题 #2 修复**：sub-agent UI 自带 chrome 边界，thinking/tool calls 不再「淹没」在主线时间戳间
- [x] 12 单元测试 + 全套 86 测试无回归
- [x] build PASS（606 文件）+ dist 落盘验证（chunk-97z7bbgv.js / chunk-j35q1e1c.js）
- [x] 端到端实测 [SYSTEM · 18:44:19] chrome 在 cli stdout 渲染

### 波次3 / 波次4（指挥官明确范围外）
- [ ] 屏幕骨架（screen scaffold）
- [ ] worker 三重边框
- [ ] 动效细节（呼吸 dot 改进、scanline 增强等）
- [ ] prevIsSubAgent 出栈分隔逻辑（已在 Messages.tsx 预留 void 引用）
- [ ] displayName 完整命名：扩展 Tool.renderToolUseProgressMessage 加 toolUseInput 参数从 lookups 反查 subagent_type（涉及 9 个工具适配）

### 已知限制
- TurnHeader 单元测试覆盖逻辑层（color/role/bar 宽度 + chromeKey）；React 组件渲染快照需 ink-testing-library（项目未引入），用 stdout 仿真脚本 + 静态源码 + dist bundle grep 三重链路验证已 PASS
- pipe 模式（`-p`）不渲染 TurnHeader，端到端真机验证需 TTY 交互模式
- 真实 spawn sub-agent 受上游 cache_control API 阻挡，worker chrome 验证依赖单元 + 源码 + dist + e2e SYSTEM chrome 同源链路


---

## v2.26.0 — 2026-05-15 · 上游 v2.1.120→v2.1.142 全量对标（方案 A 激进路径 100% 交付）

### 调研基线
- 上游版本：v2.1.142（2026-05-14 npm @anthropic-ai/claude-code）
- 跨度：v2.1.120→v2.1.142 共 16 个有效版本（17 天 110 条新能力）
- 战略分水岭：v2.1.139（Code with Claude 大会同日）
- 调研报告：`monitor/migration-plan-v2120-to-v2142-2026-05-15.md`

### 战术分组（4 wave 14 任务）
**Wave 1（W1-149/164/161/158）** — Hook + Spinner + Transcript 底层增强
- Spinner amber 10s+ + Auto mode 红色（v2.1.126/.141）
- Hook 6 字段：updatedToolOutput / effort.level+$CLAUDE_EFFORT / args:string[] exec / continueOnBlock / terminalSequence / 配置错误明确化（v2.1.121/.133/.139×2/.141/.142）
- Transcript ?/{/}/v 快捷键导航（v2.1.139）

**Wave 2（W2-160）** — /goal 旗舰命令（v2.1.139）
- condition store + Haiku evaluator + Stop hook 包装 + ◎ overlay + --goal CLI flag + 50turn 死循环兜底
- 26 单元测试 / 7 NEW-FILE [#20260515-01..07]

**Wave 3（W3-152）** — Agent View Tier 1（v2.1.139→.142）
- claude agents TUI dashboard + 22 键位 + roster + peek + attach/detach (exit+re-spawn)
- 22 单元测试 / 13 NEW-FILE [#20260515-AV-01..13]

**Wave 4（W4-150/151/153/154/155/156/159/162/163）** — B 档 + 中价值能力
- /resume PR URL（4 平台）+ /skills 输入过滤 + /mcp 工具数显示
- MCP alwaysLoad + stdio CLAUDE_PROJECT_DIR + Reconnect 拾取 .mcp.json
- Auto Mode hard_deny + parentSettingsBehavior + 分类器错误带 retry/compact/--debug
- /scroll-speed + /feedback 24h/7d + /web-setup 警告 + bare /color 随机
- Compaction 三件套：reactive seeding + 保留 sensitive 指令 + Rewind "Summarize up to here"
- claude plugin prune + --plugin-dir .zip + --plugin-url（9 项安全控制）
- Skill 五连：通配符前缀 + 根级 SKILL.md + /context all token + skillOverrides + subagent 三层发现
- claude project purge + EnterWorktree 本地 HEAD + worktree.baseRef
- Agent tool subagent_type 大小写不敏感 + claude plugin details + Subagent x-claude-code-agent-id

### 交付物
- commit: `90e34be` feat（80 文件 +6989/-239）+ `87dc43c` v2.26.0
- 测试: 68/68 通过（hook 20 + goal 26 + agentview 22）
- build: 623 files bundled
- npm: `@lc2panda/panda-code@2.26.0` 发布到 GitHub Packages（19.2MB / 768 files）
- push: `8df66de..87dc43c main -> main`
- 工期: 调研 1.5h + 实施 2h = 3.5h（vs 估算 45 人天）

### Tier 2/3 推迟项（Agent View 范围）
- [ ] Supervisor 守护进程（Tier 2，v2.27.x 评估）
- [ ] Worktree 自动隔离（Tier 2，v2.27.x 评估）
- [ ] inline reply in peek panel（Tier 2）
- [ ] Ctrl+G $EDITOR 编辑 dispatch prompt（Tier 2）
- [ ] Shift+Enter 携带 prompt 启动（框架已就绪 draft 始终空）
- [ ] Haiku 15s 行摘要（Tier 3，需 multi-model routing 稳定）
- [ ] PR 状态点（Tier 3，需 GitHub 集成）
- [ ] `/loop` 与 `/goal` 互补集成（Tier 4 不做）

### 风险监控
- Worker B addToolResult 延迟改变消息顺序（hook 后发，理论正确，未观察到下游依赖）
- Worker L React Compiler 缓存槽 `_c(88)` 手动调（未来 recompile 注意）
- Worker N 未给 4 个改动文件加 Input/Output/Pos 文件头（次要，二轮 polish）
- /goal --resume 后从 transcript 恢复 condition 未实现（二期）
- /goal 没加企业关闭开关（如需 disableAllHooks 联动二期补）

### 实际执行节奏
14 worker 后台并行作战，按"独立文件域"派工避免冲突，PM 单线程验收。完成顺序：A → C → D → E（旗舰）→ F → H → I → G → K → B → J → L → M → N。
