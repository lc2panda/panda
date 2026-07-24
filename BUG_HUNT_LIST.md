# Bug 猎杀清单（只发现、不修复）

> **作战代号**：Hunter Full Sweep  
> **落盘时间**：2026-07-24（会话基准，绝对日期）  
> **审查基线**：`main` @ `f98c3f321`（chore: release v2.32.3）  
> **覆盖范围**：v2.30.x ~ v2.32.3 发版变更 + MEMORY scar 复发点 + 近期功能（双源升级 / clipboard defer / advisor / MCP）  
> **约束**：本文件仅清单与建议，**禁止在本轮修复业务源码**  
> **落盘理由**：仓库根与 `docs/` 下无现成 `BUGS.md` / 专用 bug 清单；`TODO.md` 不存在。按任务推荐路径新建 `BUG_HUNT_LIST.md` 供指挥官审查。

---

## 0. 统计摘要

| 级别 | 已证实 | 可疑风险 | 小计 | 其中已修复（验收） |
|------|--------|----------|------|------------------------|
| P0   | 1      | 0        | 1    | H-001（有残余） |
| P1   | 7      | 1        | 8    | H-002/H-008、H-003、H-004、H-005、H-007（第二批 P1 全清） |
| P2   | 7      | 3        | 10   | H-009（`9b48301d6`）、H-010（`9c4220d54`）、H-011/H-012（`8ac3aeac5`）、H-013~015（`7b93a34f2`） |
| P3   | 3      | 2        | 5    | H-016（`96ae62cdd`） |
| **合计** | **18** | **6** | **24** | + P-001/P-002/P-003/P-004（隐私节）；H-009~H-015 已修复；H-016 已修复 |

> **首批修复独立验收**（2026-07-24 17:07:55 +08:00）：commits `03ddb4bb9` (H-001)、`c73ce663e` (H-005)、`37d9a1fc8` (P-001/P-002)。详见各条目「修复状态」段。  
> **第二批修复独立验收（初轮）**（2026-07-24 17:18:22 +08:00）：commits `c7accadcf` (H-004)、`09c3576e9` (H-007)、`033a7c85b` (H-002/H-008)。当时 H-003 无 commit，判定未完成。  
> **第二批 H-003 补验收**（2026-07-24 17:22:39 +08:00）：commit `db697a3b7` — fix(channel): await MCP push before marking delivered (H-003)。测试 `bun test src/assistant/channelRegistry.test.ts` → **4 pass / 0 fail / 11 expect**。工作区仅 docs 更新。

**Top 3 最危险项**（猎杀时排序；已修项划掉）

1. ~~**H-001** maxVersion 熔断被 preferTarball 绕过~~ → **已修复但有残余** (`03ddb4bb9`)  
2. ~~**H-002** MCP stdio 锁键与真实 spawn cwd 不一致~~ → **已修复** (`033a7c85b`，与 H-008 同 commit)  
3. ~~**H-003** `pushViaChannelMCP` 未等成功即 `delivered=true`~~ → **已修复** (`db697a3b7`)  

---

## 1. 未提问但更关键的问题（第一性原理）

指挥官问的是「有哪些 bug」。  
更深的问题是：

> **为什么系统里大量关键路径把失败设计成“不可观测”？**

因果机制，不是抽象口号：

1. **双路径半完成**是复发母体  
   - 升级：npm Packages vs GH Release tarball —— global 路径接了 tarball，local / `panda update` local 分支没有  
   - 飞书：API 实现了 `sendNotification`，默认工厂却走 MCP，MCP 类根本没实现  
   - MCP cwd：锁按 “effective cwd（含 plugin root）” 串行，真实 spawn 却永远 `getOriginalCwd()`  
   → 每次都是「主路径修好、副路径/默认路径仍是旧语义」

2. **静默失败抹掉反馈回路**  
   - `delivered = true` 先于 await  
   - `.catch(() => {})` / 仅 debug log  
   - 可选方法缺失时 `typeof === 'function'` 直接 skip  
   → 用户与监控都看不到「没发出去」，猎杀只能靠读代码，线上永远报「偶发丢消息」

3. **因此真正该先问的不是「下一个修哪个 bug」**  
   而是：**先建立「失败必须可见」的契约（返回值语义 + 日志 + 指标），再修具体缺陷；否则 H-003/H-004 类问题会以新名字再长出来。**

---

## 2. 已证实 Bug（按严重级别）

### P0

#### H-001｜maxVersion 熔断被 GH tarball 安装绕过
- **级别**：P0  
- **状态**：已证实（静态因果闭合） → **已修复但有残余**  
- **修复 commit**：`03ddb4bb9` — fix(update): honor maxVersion for tarball path (H-001)  
- **验收时间**：2026-07-24 17:07:55 +08:00  
- **验收结论**：
  - `resolveInstallTarget` 为 cap 后唯一决策源；cap 时 `preferTarball=false` 且 `tarballUrl=undefined`
  - `installGlobalPackage` 经 `isTarballAllowedForInstall` 二次拒超 cap tarball，并把 npm 安装版本钳到 `<= maxVersion`
  - `AutoUpdater.tsx` / `cli/update.ts` 均改走 `target.*`，不再直接用未 cap 的 `latestInfo.tarballUrl`
  - 测试：`bun test src/utils/autoUpdater.maxVersion.test.ts` → **14 pass / 0 fail**
- **残余**：
  - cap 后即使 GH 上存在 **精确 maxVersion** 的 tarball 也不会选用（一律剥 tarball → 走 npm@max），Packages 滞后时可能装失败（与 H-006 相关，非绕过）
  - 未对 `installGlobalPackage` 做集成 mock 测；装后版本断言仍见 S-006
- **位置**（历史描述保留）：  
  - `src/components/AutoUpdater.tsx` ~L75–L88（cap `latestVersion`）  
  - `src/components/AutoUpdater.tsx` ~L117–L138（`preferTarball` 仍用 `latestInfo`）  
  - `src/utils/autoUpdater.ts` `installGlobalPackage` ~L785–L798（`preferTarball` 时直接 `npm install -g <tarball>`，**不校验** `specificVersion`）  
  - 同逻辑：`src/cli/update.ts` ~L306–L343  
- **因果机制**：  
  1. `getLatestVersionInfo` 在 GH 版本更高时返回 `source: 'github-release'` + 高版本 `tarballUrl`  
  2. AutoUpdater 用 `getMaxVersion()` 把展示/比较用的 `latestVersion` 压到 max  
  3. 但 `preferTarball` 仍按 **未压 cap 的** `latestInfo.source` 判定为 true，`tarballUrl` 仍指向 **高于 maxVersion 的资产**  
  4. `installGlobalPackage` 在 `preferTarball` 时忽略 `specificVersion`，直接装 tarball  
  → **服务端 kill-switch 失效**，可装上被禁止的版本  
- **触发条件**：`installMethod/npm-global` + GH 版本 > maxVersion > currentVersion + tarball 可用  
- **复现路径（静态）**：读上述三处调用链即可闭合；无需运行即可证明语义错误  
- **建议修复方向**（不实施）：  
  - cap 后若 `latestVersion !== latestInfo.version`，必须清空 `preferTarball`/`tarballUrl`，或只允许与 cap 版本精确匹配的 asset；  
  - tarball 安装后读出安装版本，`gt(installed, maxVersion)` 则回滚/报失败  

---

### P1

#### H-002｜MCP stdio 串行锁 cwd ≠ 真实 spawn cwd（EEXIST scar 复发）
- **级别**：P1  
- **状态**：已证实 → **已修复**  
- **修复 commit**：`033a7c85b` — fix(mcp): align stdio spawn cwd with startup lock (H-002, H-008)  
- **验收时间**：2026-07-24 17:18:22 +08:00  
- **验收结论**：
  - `getEffectiveLocalMcpCwd` 统一 effective cwd：`config.cwd` → `CLAUDE_PLUGIN_ROOT` → `getOriginalCwd()`，并 `resolve` 为绝对路径
  - Stdio 分支 `spawnCwd = getEffectiveLocalMcpCwd(...) ?? getOriginalCwd()`，`StdioClientTransport({ cwd: spawnCwd })` 与锁键同源
  - 测试：`bun test src/services/mcp/__tests__/stdio-env-inject.test.ts` → **15 pass / 0 fail**（含源码守卫：spawnCwd 绑定）
  - 未引入 `resolveWindowsCommand`（scar 约束遵守）
- **残余（非阻断）**：集成级「真实双 stdio 并行 EEXIST」未在本验收跑真实子进程；依赖单元 + 源码守卫
- **位置**（历史描述保留）：  
  - `src/services/mcp/client.ts` `getEffectiveLocalMcpCwd` ~L499–L520  
  - `connectToServer` Stdio 分支 ~L1258–L1271  
- **因果机制**（历史）：锁键与 spawn cwd 分裂 → 并行 spawn 同真实 cwd → EEXIST  
- **建议**（已落地）：spawn cwd === lock key effective cwd  

#### H-003｜channelRegistry：异步 MCP 推送未完成即标记已投递
- **级别**：P1  
- **状态**：已证实 → **已修复**  
- **修复 commit**：`db697a3b79f26c535fcc1de59522a4fa863c82f7` — fix(channel): await MCP push before marking delivered (H-003)  
- **验收时间**：2026-07-24 17:22:39 +08:00  
- **验收结论**（独立重验，禁止无证据通过）：
  - `pushViaChannelMCP` 现为 `async`：`await server.client.callTool(...)` 后才可能 `delivered = true`（`src/assistant/channelRegistry.ts` ~L256–L267）
  - `delivered=true` 仅在 callTool **无 throw 且非 isError**；reject / `isError:true` / 无 channel → `delivered=false` 并写入 `_pendingMessages`
  - 失败路径：`catch` 内 `logForDebugging(...)`（含 error message），**非空 catch**；外层兜底同样 log + buffer（~L271–L299）
  - `_flushPending` 失败回写 `failed` 到 pending 队首（~L378–L386），pending 可保留重试
  - 调用方：`builtinTasks` `await` 并检查 `!delivered` 打 log；`sense` 侧 `void ...catch(log)` 不阻塞推送管道，但不再依赖「发起即成功」语义
  - 测试：`bun test src/assistant/channelRegistry.test.ts` → **4 pass / 0 fail / 11 expect**（成功 / reject / isError / 无 channel）
- **残余（非阻断）**：`sense.ts` `_pushToChannels` 仍 fire-and-forget 调用（不 await 返回值），属推送管道不阻塞设计；核心假成功语义已消除
- **位置**：`src/assistant/channelRegistry.ts` `pushViaChannelMCP` ~L222–L303；测试 `src/assistant/channelRegistry.test.ts`  
- **因果机制**（历史）：  
  1. `client.callTool(...)` **不 await**  
  2. 立即 `delivered = true`  
  3. 调用方认为成功 → 不入 pending / 清缓冲  
  4. 实际失败只打 debug 日志，**不会重新入队**  
- **触发**：MCP 未连上、工具名不存在、网络/权限失败  
- **影响**（历史）：微信/渠道通知「已发送」假象 + 永久丢失  
- **建议**（已落地）：await callTool；仅成功时 delivered=true；失败保留 pending  

#### H-004｜飞书默认 MCP Connector 无 sendNotification（空壳路径）
- **级别**：P1  
- **状态**：已证实 → **已修复（有残余）**  
- **修复 commit**：`c7accadcf` — fix(feishu): implement sendNotification on MCP connector (H-004)  
- **验收时间**：2026-07-24 17:18:22 +08:00  
- **验收结论**：
  - `FeishuMCPConnector.sendNotification` 已实现：读 `extra.chatId`，`await callTool('feishu_send_message', ...)`
  - 测试：`bun test src/connectors/feishu/sendNotification.test.ts` → **8 pass / 0 fail / 20 expect**
- **残余（非阻断）**：catch 仍吞错仅 `logForDebugging`，调用方无法从 Promise reject 感知失败；无 chatId 时静默 return  
- **位置**（历史描述保留）：  
  - `src/connectors/feishu/index.ts` `FeishuMCPConnector.sendNotification` ~L169–L190  
  - 调用方：`src/assistant/sense.ts` `typeof conn.sendNotification === 'function'`  
- **因果机制**（历史）：默认 MCP connector 无方法 → sense 静默 skip  
- **建议**（主路径已落地）：MCP 模式映射 `feishu_send_message`  

#### H-005｜release-cli 对 `v*`（含 beta）一律 `--latest`
- **级别**：P1  
- **状态**：已证实 → **已修复**  
- **修复 commit**：`c73ce663e` — fix(ci): only mark stable tags as GitHub latest (H-005)  
- **验收时间**：2026-07-24 17:07:55 +08:00  
- **验收结论**：
  - `IS_STABLE` 仅 `^v[0-9]+\.[0-9]+\.[0-9]+$`；create/edit 两条路径：稳定才 `--latest`，非稳定仅 `--prerelease`，**无** prerelease+`--latest` 组合
  - 补发路径对非稳定 `gh release edit --prerelease`，不传 `--latest`
  - 静态 workflow 核对通过；本项无对应单元测试（YAML）
- **残余（非阻断）**：历史若已被标为 GitHub Latest 的 beta Release **不会**被本 workflow 自动纠正；手动应急发版须 `CONFIRM_MANUAL_RELEASE=1`（S-005 门禁已落地）  
- **位置**（历史描述保留）：`.github/workflows/release-cli.yml`  
  - trigger：`tags: ['v*']` ~L8–L10  
  - `gh release create ... --latest` ~L82–L88  
- **因果机制**：  
  - 历史存在 `v2.32.0-beta.7` 等预发 tag  
  - 推送 beta tag 会跑完整 Release + Packages，并标记 **GitHub Latest**  
  - 在线升级 GH 源 / install 脚本可能把 beta 当稳定最新  
- **触发**：`git push origin vX.Y.Z-beta.N`  
- **建议**：稳定 tag 过滤（`v[0-9]+.[0-9]+.[0-9]+$`）；prerelease 用 `--prerelease` 且不要 `--latest`  

#### H-006｜双源升级：local / `npm-local` 路径完全不走 tarball
- **级别**：P1  
- **状态**：已证实 → **已修复**  
- **修复 commit**：`b7eedfd88` — fix(update): dual-source tarball for local install path (H-006)  
- **位置**：  
  - `src/components/AutoUpdater.tsx` ~L127–L131：`installOrUpdateClaudePackage(channel, latestVersion)`  
  - `src/cli/update.ts` ~L373–L377：local 分支同样只调 `installOrUpdateClaudePackage`  
  - `src/utils/localInstaller.ts` `installOrUpdateClaudePackage` ~L97+：仅 npm 语义  
- **因果机制**：`getLatestVersionInfo` 可能判定 GH 更新，但 local 安装仍打 Packages；Packages 滞后时 **失败或装旧**，与 dual-source 产品承诺不一致  
- **触发**：用户为 npm-local 安装 + Packages 落后于 GH Release  
- **建议**：local 安装复用 tarball 选项，或 GH 领先时明确降级提示而非静默失败  
- **修复说明**：local / npm-local 升级路径对齐 dual-source，优先可用 tarball 

#### H-007｜inferRiskLevel 前缀只读匹配导致复合命令低估风险
- **级别**：P1（审计完整性；非权限闸门，但污染审计与后续策略）  
- **状态**：已证实 → **已修复**  
- **修复 commit**：`09c3576e9` — fix(audit): stop under-classifying compound bash risk (H-007)  
- **验收时间**：2026-07-24 17:18:22 +08:00  
- **验收结论**：
  - 拆段 `splitBashSegments`（`;` `&&` `||` `|` 换行）+ 段级最高风险；destructive 优先；`tee`/写重定向抬升 high-write；不确定 fail-safe high-write
  - 测试：`bun test src/utils/auditLog.test.ts` → **18 pass / 0 fail / 51 expect**
- **残余（非阻断）**：启发式拆段，嵌套引号/子 shell 边界未全覆盖；属审计启发式固有限制  
- **位置**：`src/utils/auditLog.ts` `inferRiskLevel` / `classifyBashCommand` ~L114–L214  
- **因果机制**（历史）：前缀只读短路 → 复合命令 under-classify  
- **建议**（已落地）：拆段 + 最高风险 + destructive 优先  

#### H-008｜Stdio MCP 忽略用户配置的 `cwd`（功能错误 + 放大 H-002）
- **级别**：P1（与 H-002 同源，单独成条因影响面是「配置无效」）  
- **状态**：已证实 → **已修复**（同 H-002 commit `033a7c85b`）  
- **验收时间**：2026-07-24 17:18:22 +08:00  
- **验收结论**：spawn `cwd` 使用 `getEffectiveLocalMcpCwd`，用户 `config.cwd` / plugin root 生效；测试同 H-002（15 pass）  
- **位置**：`src/services/mcp/client.ts` ~L1258–L1271 vs ~L499–L520  
- **因果机制**（历史）：配置 cwd 只参与锁键不参与 spawn  
- **建议**（已落地）：effective cwd 贯通 lock + spawn  

---

### P2

#### H-009｜sense / 渠道路径空 catch 吞掉通知错误（scar 模式）
- **级别**：P2  
- **状态**：**已修复** · commit `9b48301d6` · 验收 2026-07-24  
- **位置**：  
  - `src/assistant/sense.ts` ~L233、~L249、~L265：`.catch(() => {})`  
  - `src/assistant/channelRegistry.ts` 多处失败仅 `logForDebugging`  
- **因果**（历史）：失败无用户可见信号、无指标、无重试钩子 → scar `silent-catch-empty` 复发形态  
- **修复**：通知失败改为可观测（log + 非空 catch），不再静默吞错  
- **建议**（历史）：至少 `logForDebugging`/`logError` + 可选用户 toast；禁止空 body catch  

#### H-010｜channelRegistry 冷启动只加载 Map 中「第一个」用户 token
- **级别**：P2  
- **状态**：已证实 → **已修复**  
- **修复 commit**：`9c4220d542f5be2e7e6b11922afc00de8bbc20a5` — fix(channel): restore all persisted user tokens on cold start (H-010)  
- **验收时间**：2026-07-24  
- **验收结论**：
  - `_contexts` 改为 `Map<channel, Map<user_id, ChannelReplyContext>>`；磁盘冷启动 `_loadPersistedContext` 恢复**全部** entry（不再 `entries[0]`）
  - `getChannelContext(channel, userId?)` 按用户精确取；`pushViaChannelMCP` 对 live 用户 fan-out；`_flushPending` 仍只投 last-active（inbound 用户）
  - 失败路径保留 H-009 风格 `logForDebugging`；delivered 语义与 H-003 兼容（任一用户 callTool 成功即 channel 送达）
  - 测试：`bun test src/assistant/channelRegistry.test.ts` → **7 pass / 0 fail**（含多用户内存/磁盘恢复 + fan-out）
- **位置**（历史）：`src/assistant/channelRegistry.ts` `_loadPersistedContext` 旧 `entries[0]`  
- **因果**（历史）：多用户/多会话持久化时，非首个 entry 的 pending 可能投到错误 user 或无法投递  

#### H-011｜GH 非 stable 通道仍打 `/releases/latest`（拿不到预发）
- **级别**：P2  
- **状态**：已证实 → **已修复**  
- **修复 commit**：`8ac3aeac5` — fix(update): align GH release channel + harden tarball pick (H-011, H-012)  
- **验收时间**：2026-07-24  
- **验收结论**：
  - `getLatestVersionFromGitHub` 双通道统一走 `/releases?per_page=30`，经 `selectGitHubReleaseForChannel` 选 release
  - stable：跳过 draft / GH prerelease / semver pre（即使 `prerelease=false` 的 beta tag）
  - latest：取首个 non-draft（含 beta/prerelease），**不再**请求 `/releases/latest`
  - 与 H-001 maxVersion 熔断、H-006 dual-source 兼容：`tarballSha256` 与 tarball 一并在 cap 时剥离
  - 测试：`bun test src/utils/autoUpdater.maxVersion.test.ts src/utils/localInstaller.dualSource.test.ts` → **31 pass / 0 fail**
- **位置**（历史）：`src/utils/autoUpdater.ts` 旧 `channel !== 'stable'` 分支打 `/releases/latest`  
- **因果**（历史）：GitHub `/releases/latest` = 最新非 prerelease；beta/latest 通道与 npm dist-tag 不对齐  

#### H-012｜tarball 资产选择过宽 + 无完整性校验
- **级别**：P2  
- **状态**：已证实 → **已修复**  
- **修复 commit**：`8ac3aeac5` — 与 H-011 同 commit  
- **验收时间**：2026-07-24  
- **验收结论**：
  - `pickTarballAsset` 返回 `PickedTarballAsset`；精确名 `lc2panda-panda-code-${version}.tgz` 优先
  - fallback 收紧为包名 marker + version pin；**禁止**任意 `.tgz` 静默接受
  - `downloadReleaseTarball`：`MAX_TARBALL_BYTES=20MB` 硬顶、content-type 拒 HTML/JSON、stream 累计字节上限、可选 `expectedSha256` 校验
  - digest 解析：`sha256:<hex>` / bare hex；sidecar 仅读 API digest 字段
  - global + local 安装路径透传 `tarballSha256`（`update.ts` / `AutoUpdater.tsx` / `localInstaller.ts`）
  - 测试：同上 **31 pass / 0 fail**（含 H-012 pick/integrity 用例）
- **位置**（历史）：`pickTarballAsset` 任意 `.tgz` fallback；`downloadReleaseTarball` 无 checksum  
- **因果**（历史）：错包或供应链风险  

#### H-013｜advisor 配置命令启发式误伤分析问题
- **级别**：P2  
- **状态**：已修复  
- **修复 commit**：`7b93a34f2` — fix(advisor): tighten config heuristic and model source (H-013, H-014, H-015)  
- **位置**：`src/skills/utils/advisorHelper.ts` `isAdvisorConfigIntent`；`src/skills/bundled/advisor.ts` `isConfigCommand`  
- **因果**：`startsWith('sonnet'|'opus'|...)` 使「sonnet vs opus 怎么选」类问题走配置分支而非决策分析  
- **修复**：整词 model token + 显式 subcommand；分析标记（vs/怎么/如何/比较 等）强制决策分析  
- **验证**：`bun test src/skills/utils/advisorHelper.test.ts`（H-013 用例全过）

#### H-014｜advisorHelper 默认 `canUseTool: () => true`
- **级别**：P2（潜伏；当前技能主路径未调用 helper）  
- **状态**：已修复  
- **修复 commit**：`7b93a34f2` — 与 H-013/H-015 同 commit  
- **位置**：`src/skills/utils/advisorHelper.ts` `denyAllCanUseTool` / `callAdvisorForSkill`  
- **因果**：未来调用方若漏传 canUseTool，顾问侧工具自动放行  
- **修复**：默认 fail-closed `denyAllCanUseTool`；优先级 options.canUseTool > toolUseContext.canUseTool > deny  
- **验证**：`bun test src/skills/utils/advisorHelper.test.ts`（H-014 用例全过）

#### H-015｜advisorModel 双数据源不一致
- **级别**：P2  
- **状态**：已修复  
- **修复 commit**：`7b93a34f2` — 与 H-013/H-014 同 commit  
- **位置**：  
  - 统一入口：`resolveAdvisorModel`（`advisorHelper.ts`）  
  - 技能 / helper 均经此解析  
  - 设置 schema：`src/utils/settings/types.ts` ~L809  
- **因果**：用户经 `/advisor sonnet` 写入的 appState 与 helper 读取的 globalConfig.settings 可能分叉 → `isAdvisorAvailableForSkill` 误判  
- **修复**：单一解析链 override → appState.advisorModel → `getInitialAdvisorSetting()`（settings）；废弃 `getGlobalConfig().settings`  
- **验证**：`bun test src/skills/utils/advisorHelper.test.ts`（H-015 用例全过）  

---

### P3

#### H-016｜resolveWindowsCommand 死代码残留（scar  enticement）
- **级别**：P3  
- **状态**：已证实 → **已修复**  
- **修复 commit**：`96ae62cdd` — chore(mcp): remove resolveWindowsCommand dead code (H-016)  
- **验收时间**：2026-07-24  
- **验收结论**：
  - 删除 `export function resolveWindowsCommand` 及仅为其服务的 `basename`/`extname` import
  - 生产 spawn 路径保持 `finalCommand = CLAUDE_CODE_SHELL_PREFIX || stdioRef.command`，注释明确禁止重接
  - 源码守卫：`client.test.ts` + `stdio-env-inject.test.ts` 断言不得再定义/调用 `resolveWindowsCommand`
  - 测试：`bun test src/services/mcp/client.test.ts src/services/mcp/__tests__/stdio-env-inject.test.ts` → **19 pass / 0 fail**
- **位置**（历史）：`src/services/mcp/client.ts` 曾 ~L543+ export；`client.test.ts` deprecated skip 块已清  
- **因果**（历史）：函数仍 export；若后续「优化」重新接入会再次破坏 cross-spawn（scar: windows-command-optimization-breaks-cross-spawn）  
- **建议**（已落地）：优先删除 + 源码守卫锁死  

#### H-017｜isTermius 启发式过宽
- **级别**：P3  
- **状态**：已证实  
- **位置**：`src/ink/terminal.ts` ~L164–L178  
- **因果**：`SSH_CLIENT/SSH_TTY` + `TERM=xterm*` 即标 Termius → 所有 xterm SSH 客户端被误标；当前 `shouldUseDegradedColors` 已不单靠它，误标影响面收窄  
- **建议**：收紧为 Termius 专有环境变量/版本探测  

#### H-018｜package-manager AutoUpdater 仍走旧 GCS/npm 通道
- **级别**：P3  
- **状态**：已证实  
- **位置**：`src/utils/autoUpdater.ts` ~L140–L170 注释与实现  
- **因果**：另一套更新 UI/路径未接 dual-source，行为与新 `getLatestVersionInfo` 分裂  
- **建议**：统一入口或明确废弃  

---

## 3. 可疑风险（S 系列；深度审查见 §9）

> **深度审查时间**：2026-07-24（会话基准） · 只读静态闭合 · 详见「§9 S 系列深度审查」  
> **编号说明**：本节 S-001～S-006 为正式可疑项 ID。§8.3 隐私矩阵误复用 S- 前缀（S-001～S-024 语义不同），**以本节与 §9 为准**。

| ID | 原级 | 重评级 | 判定 | 摘要（审查后） | 证据缺口 / 残余 |
|----|------|--------|------|----------------|-----------------|
| S-001 | P1 | **P3** | **已充分缓解** | 路径粘贴首 chunk 即 begin；超时在清 pastePending 前同步武装；chat:submit/onSubmit 均查 inFlight | 残余：无扩展名的分片路径在中间 chunk 未 arm（超时仍同步 arm）；缺终端 E2E |
| S-002 | P2 | **P3** | **主伤已缓解** | portable 扫描**不再**按 boundary 截断 buffer；畸形 JSON→null 不会误截断 | 损坏 fixture 回归测（加固） |
| S-003 | P2 | **P3** | **主伤已缓解** | walk + relink + 回归测覆盖；relink 失败仅 warn、链可能仍断 | 破坏性 fixture：无 attachment 的 dangling |
| S-004 | P3 | **P3** | **仍可疑 · 需实机** | 单测覆盖 env 启发式；Win11+Termius 9.x 真彩/256 未验 | 实机截图/COLORTERM |
| S-005 | P3 | **已修** | **门禁已落地** | 手动脚本须 `CONFIRM_MANUAL_RELEASE=1` + `[MISSING]` 警告；README-DEV 唯一入口 CI | 仍可有意应急绕过（设计如此） |
| S-006 | P2 | **P2** | **仍可疑（H-001/012 未覆盖装后）** | 装前 URL/cap/integrity 已闸；`installFromTarball` 仅 exit code，无装后版本断言 | 装后 `npm list -g` / package.json 读版本 |

**说明**：scar「compact-boundary / preservedSegment」主路径在 7014efb4e 后有 stitch + relink，**本轮未发现新的已证实 P0 resume 丢上下文**；S-002/S-003 降为 P3 回归面。

---

## 4. 按模块索引

| 模块 | Bug ID |
|------|--------|
| 在线升级 dual-source | H-001, H-006, H-011, H-012, H-018, S-006 |
| MCP stdio | H-002, H-008, H-016 |
| 渠道/通知 | H-003, H-004, H-009, H-010 |
| 发版 CI | H-005, S-005 |
| 审计/Bash 风险 | H-007 |
| Advisor | H-013, H-014, H-015 |
| 终端/粘贴 | H-017, S-001, S-004 |
| Resume/compact | S-002, S-003 |

---

## 5. 建议修复优先级（供审查，不实施）

1. ~~**立即**：H-001（熔断）+ H-005（发版 latest）~~ → 首批已修  
2. ~~H-002/H-008（MCP cwd）~~ / ~~H-003（delivered 语义）~~ / ~~H-004（飞书通知）~~ / ~~H-007（审计）~~ → 第二批全清  
3. **随后**：H-006 双源 local 对齐、H-009 去空 catch  
4. **顺带**：Advisor 三连、死代码清理；H-004 残余（失败可观测性）  
5. **S 系列（§9）**：优先 **S-006** 装后版本断言；~~S-001 提前 begin~~ 已修；~~S-005 流程门禁~~ 已修；S-002/003/004 不急  

每项修复验收建议：**失败必须可观测**（测试断言 + 非空错误日志 + 不误标成功）。

---

## 6. 本轮明确不做

- 不改业务源码  
- 不 git commit  
- 不把可疑项写成已证实  

---

## 7. 关键文件绝对路径（审查入口）

- `/Users/panda/Downloads/cc-panda/BUG_HUNT_LIST.md`（本清单）  
- `/Users/panda/Downloads/cc-panda/src/components/AutoUpdater.tsx`  
- `/Users/panda/Downloads/cc-panda/src/utils/autoUpdater.ts`  
- `/Users/panda/Downloads/cc-panda/src/cli/update.ts`  
- `/Users/panda/Downloads/cc-panda/src/services/mcp/client.ts`  
- `/Users/panda/Downloads/cc-panda/src/assistant/channelRegistry.ts`  
- `/Users/panda/Downloads/cc-panda/src/assistant/sense.ts`  
- `/Users/panda/Downloads/cc-panda/src/connectors/feishu/index.ts`  
- `/Users/panda/Downloads/cc-panda/src/utils/auditLog.ts`  
- `/Users/panda/Downloads/cc-panda/.github/workflows/release-cli.yml`  
- `/Users/panda/Downloads/cc-panda/src/skills/bundled/advisor.ts`  
- `/Users/panda/Downloads/cc-panda/src/skills/utils/advisorHelper.ts`  
- `/Users/panda/Downloads/cc-panda/src/hooks/usePasteHandler.ts`  
- `/Users/panda/Downloads/cc-panda/src/components/PromptInput/PromptInput.tsx`  
- `/Users/panda/Downloads/cc-panda/src/utils/sessionStorage.ts`  
- `/Users/panda/Downloads/cc-panda/src/utils/sessionStoragePortable.ts`  

---

## 8. 隐私约束与影响评估（只读基线，2026-07-24）

> 来源：README §6 + 代码锚点只读研究。**禁止削弱**本节承诺。修复 agent 触碰标注「高危触及」条目前必须先过本节红线。

### 8.1 用户可见隐私承诺（摘要）

| 承诺 | 用户能力 | 默认态 |
|------|---------|--------|
| 非必要网络默认关闭 | `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` 启动注入 | 开 |
| 遥测/分析默认禁用 | `isAnalyticsDisabled()` / Datadog 硬 return / BigQuery 硬 SUCCESS | 关发送 |
| API metadata 脱敏 | `getAPIMetadata()` 固定 device_id/session_id、空 account_uuid | 恒开 |
| UA 伪装 | `getClaudeCodeUserAgent()` → `claude-code/<upstream>` | 恒开 |
| 会话 ID 进程内随机 | `PRIVACY_SESSION_ID = randomUUID()` 进 header | 恒开（官方 API 路径） |
| 隐私等级 | `PANDA_PRIVACY_LEVEL`：open/essential-traffic/local-only | 默认 essential-traffic |
| 隐私增强开关 | `/privacy` → `config.privacyEnhanced`；第三方 BASE_URL 强制 true | 可切换 |
| 本地隐私配置 | `~/.pandacc/config/privacy.json`（路径/App/域名/敏感词/保留天数） | 有默认文件 |
| 连接器密钥 | `keychain:` 前缀走系统密钥链 | 推荐 |
| 权限闸门 | permission modes + sandbox + tool 审批 | 默认 Manual |
| 数据本地 | 会话/记忆/connectors 聚合在本机；对话正文仅在用户触发的模型 API 调用中外传 | — |

### 8.2 关键代码锚点

| 能力 | 路径 |
|------|------|
| 启动默认关非必要流量 | `/Users/panda/Downloads/cc-panda/src/entrypoints/cli.tsx` L28-29 |
| 隐私等级 | `/Users/panda/Downloads/cc-panda/src/utils/privacyLevel.ts` |
| 隐私增强模式 | `/Users/panda/Downloads/cc-panda/src/utils/privacyMode.ts` |
| `/privacy` 命令 | `/Users/panda/Downloads/cc-panda/src/commands/privacy.ts` |
| 遥测总开关 | `/Users/panda/Downloads/cc-panda/src/services/analytics/config.ts` |
| logEvent 守卫 | `/Users/panda/Downloads/cc-panda/src/services/analytics/index.ts` (`_privacyGuard`) |
| Datadog 硬禁用 | `/Users/panda/Downloads/cc-panda/src/services/analytics/datadog.ts` L168 |
| BigQuery 硬禁用 | `/Users/panda/Downloads/cc-panda/src/utils/telemetry/bigqueryExporter.ts` L92 |
| GrowthBook 尊重 essential-only | `/Users/panda/Downloads/cc-panda/src/services/analytics/growthbook.ts` `isGrowthBookEnabled` |
| 1P event logger | `/Users/panda/Downloads/cc-panda/src/services/analytics/firstPartyEventLogger.ts` |
| API metadata 脱敏 | `/Users/panda/Downloads/cc-panda/src/services/api/claude.ts` `getAPIMetadata` |
| API client headers/会话 ID | `/Users/panda/Downloads/cc-panda/src/services/api/client.ts` |
| UA | `/Users/panda/Downloads/cc-panda/src/utils/userAgent.ts` + `src/utils/http.ts` |
| 助手隐私配置 | `/Users/panda/Downloads/cc-panda/src/assistant/privacyConfig.ts` |
| 默认 privacy.json | `/Users/panda/Downloads/cc-panda/src/proactive/platform.ts` DEFAULT_CONFIG_FILES |
| 连接器隐私过滤 | `/Users/panda/Downloads/cc-panda/src/connectors/aggregator.ts` `applyPrivacyFilter` |
| keychain 解析 | `/Users/panda/Downloads/cc-panda/src/connectors/config.ts` `resolveSecret` |
| 密钥 redact | `/Users/panda/Downloads/cc-panda/src/services/teamMemorySync/secretScanner.ts` |
| webhook 消毒 | `/Users/panda/Downloads/cc-panda/src/bridge/webhookSanitizer.ts` |
| 权限决策 | `/Users/panda/Downloads/cc-panda/src/utils/permissions/permissions.ts` |
| Bash 安全 | `/Users/panda/Downloads/cc-panda/src/tools/BashTool/bashSecurity.ts` |
| 沙箱适配 | `/Users/panda/Downloads/cc-panda/src/utils/sandbox/sandbox-adapter.ts` |
| 文档 | README §6；`packages/panda-on-desk/PRIVACY.md` |

### 8.3 现有 H/S 项「修复隐私影响」

| ID | 主题 | 隐私/安全影响 | 理由 |
|----|------|---------------|------|
| H-001 | AutoUpdater 熔断 | 需谨慎 | 更新通道；勿绕过完整性/源校验 |
| H-002 | MCP 配置 cwd | 需谨慎 | MCP 启动 cwd 影响隔离与密钥文件解析 |
| H-003 | channelRegistry delivered | 安全 | 本地通知状态机 |
| H-004 | 飞书 sendNotification | 需谨慎 | 出站消息通道；勿放宽鉴权/外传字段 |
| H-005 | release latest 指针 | 需谨慎 | 供应链；错误版本可削弱安全默认 |
| H-006 | dual-source 本地对齐 | 需谨慎 | 更新源选择；勿引入未校验二进制 |
| H-007 | auditLog 空 catch | 需谨慎 | 审计静默失败削弱可追溯性 |
| H-008 | MCP EEXIST | 需谨慎 | 与 H-002 同属 MCP 隔离 |
| H-009 | 空 catch 模式 | 需谨慎 | 若落在遥测/鉴权路径会静默失效防护 |
| H-010 | Advisor 文档 | 安全 | 文档 |
| H-011 | Advisor helper | 安全 | 本地技能逻辑 |
| H-012 | Advisor 死代码 | 安全 | 清理 |
| H-013 | clipboard 粘贴竞态 | 安全 | 本地输入时序 |
| H-014 | 粘贴超时 | 安全 | 本地输入 |
| H-015 | sessionStorage 压缩 | 安全 | 本地会话 |
| H-016 | sessionStorage 边界 | 安全 | 本地会话 |
| H-017 | compact 元数据 | 安全 | 本地会话语义 |
| H-018 | 死代码注释 | 安全 | 无运行时 |
| H-019 | sense 死字段 | 安全 | 本地 |
| H-020 | feishu 死字段 | 安全 | 本地 |
| H-021 | MCP 死参数 | 需谨慎 | 与 MCP API 面相邻 |
| H-022 | sessionStoragePortable | 安全 | 本地 |
| H-023 | 文档漂移 | 安全 | 文档 |
| H-024 | 注释过时 | 安全 | 注释 |
| S-001 | AutoUpdater 错误路径 | 需谨慎 | 同 H-001 |
| S-002 | MCP 错误吞没 | 需谨慎 | 失败不可见可导致错误信任 |
| S-003 | channelRegistry 空 catch | 安全 | 本地 |
| S-004 | 飞书错误吞没 | 需谨慎 | 出站通道错误处理 |
| S-005 | release 一致性 | 需谨慎 | 供应链 |
| S-006 | dual-source 竞态 | 需谨慎 | 更新源 |
| S-007 | auditLog 失败 | 需谨慎 | 审计 |
| S-008 | MCP 并发 | 需谨慎 | 隔离 |
| S-009 | 空 catch 家族 | 需谨慎 | 可能掩盖安全失败 |
| S-010 | Advisor 超时 | 安全 | 本地 |
| S-011 | Advisor 错误信息 | 安全 | 本地 |
| S-012 | Advisor 死代码 | 安全 | 清理 |
| S-013 | 粘贴状态机 | 安全 | 本地 |
| S-014 | 粘贴超时 | 安全 | 本地 |
| S-015 | sessionStorage 压缩 | 安全 | 本地 |
| S-016 | sessionStorage 边界 | 安全 | 本地 |
| S-017 | compact 语义 | 安全 | 本地 |
| S-018 | 死代码 | 安全 | — |
| S-019 | sense 字段 | 安全 | — |
| S-020 | feishu 字段 | 安全 | — |
| S-021 | MCP 参数 | 需谨慎 | MCP 面 |
| S-022 | portable 边界 | 安全 | 本地 |
| S-023 | 文档 | 安全 | — |
| S-024 | 注释 | 安全 | — |

**高危触及（现有 24 项内）**：无直接「改隐私开关/遥测/redact」条目；最邻近高危为 **H-002/H-008/S-002/S-008（MCP）**、**H-004/S-004（出站连接器）**、**H-001/H-005/S-001/S-005（更新供应链）**、**H-007/S-007（审计）**。若后续修复扩展到 `claude.ts` / `toolExecution` / `permissionSetup` / `api/logging`，升为 **高危触及**。

### 8.4 新发现隐私/安全候选（P-xxx）

| ID | 严重度 | 位置 | 现象 | 隐私影响 | 修复状态 |
|----|--------|------|------|----------|----------|
| P-001 | **高** | `src/bridge/webhookSanitizer.ts` | `sanitizeInboundWebhookContent` 为恒等 stub（原样返回） | 入站 webhook 消毒失效；注入/密钥内容无剥离 | **已修复但有残余** · commit `37d9a1fc8` · 验收 2026-07-24 17:07:55 +08:00 · 已实现 redactSecrets+HTML/PII；catch 返回 `[REDACTED_SANITIZER_ERROR]` 不回吐原文；测试 5 项通过但 **未覆盖** sanitizer 内部抛错 fail-closed 路径 |
| P-002 | **高** | `src/connectors/aggregator.ts` `applyPrivacyFilter` | catch 后 **fail-open** 返回未过滤消息 | 隐私过滤异常时敏感消息照常进入时间线 | **已修复** · commit `37d9a1fc8` · 验收 2026-07-24 17:07:55 +08:00 · 单条占位 / 整批 `[]` / 配置加载失败 `[]`；`bun test ...aggregator.privacy.test.ts` 含 fail-closed 断言通过 |
| P-003 | **中高** | `src/assistant/privacyConfig.ts` vs 调用方 | `isPathExcluded`/`containsSensitiveContent`/`isDomainExcluded`/`excludeApps` **仅 memdir 部分使用**；connectors 不读 privacy.json 的路径/域名/App 排除 | 文档承诺的本地隐私配置对连接器通道基本不生效 | **已修复** · 见 P-003/P-004 commit · 验收 2026-07-24 · `applyPrivacyFilter` 生产路径 `loadPrivacyConfigResult` fail-closed；合并 path/domain/app/sensitive/excludeChannels；兼容别名 `containsSensitiveContent`；`bun test src/connectors/aggregator.privacy.test.ts` 18 pass |
| P-004 | **中** | `privacy.json` `dataRetentionDays` | 字段有默认值与类型，**无强制清理实现** | 保留策略形同虚设，本地敏感数据可无限期残留 | **已修复** · 见 P-003/P-004 commit · 验收 2026-07-24 · `applyDataRetentionFilter` + 聚合路径 cutoff；`purgeExpiredConnectorAggregates` 启动清缓存；**不**触碰主会话 transcript |
| P-005 | **中** | README §6 vs `getAPIMetadata` | 文档写「隐私增强时」才固定 ID；代码 **始终** 固定 device_id/session_id；`cc4all@gmail.com` **源码中未找到** | 文档/实现漂移，验收易误判 |
| P-006 | **中** | `src/services/analytics/index.ts` `_privacyGuard` | 仅拦第三方 `ANTHROPIC_BASE_URL` host，**不**直接检查 `isAnalyticsDisabled`/`privacyEnhanced`（依赖 sink 侧） | 守卫分层不完整；若 sink 误挂可漏拦 |
| P-007 | **中** | `src/services/api/client.ts` routing env 覆写 | 运行时改写 `process.env` API key/baseURL（H-001 类并发风险延伸） | 竞态下可能串密钥/串端点 |
| P-008 | **低中** | `privacyMode` 触发条件 | `isPrivacyEnhancedMode` 仅 third-party BASE_URL 或 config 开关；官方 API + 默认 essential-traffic **不等于** privacyEnhanced 全套 | 用户以为「默认隐私」= 增强模式，实际子集 |

### 8.5 修复硬约束（红线）

1. **不得**移除或默认关闭 `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` 启动注入（`cli.tsx`）。  
2. **不得**让 `isAnalyticsDisabled()` 在默认路径返回 false；不得删除 Datadog/BigQuery 硬禁用 early-return。  
3. **不得**恢复真实 `device_id`/`account_uuid`/`session_id` 进 `getAPIMetadata()`。  
4. **不得**将 User-Agent 改回可识别的第三方品牌串；保持 `claude-code/<upstream>`。  
5. **不得**把隐私过滤从 fail-closed 改成更宽的 fail-open；修 P-002 时应 fail-closed 或安全降级。  
6. **不得**在明文配置中新增默认密钥；连接器密钥继续 `keychain:` / 系统密钥链优先。  
7. **不得**绕过 permission mode / sandbox / tool 审批实现「方便修复」。  
8. **不得**为修 bug 新增未文档化的网络 egress（GrowthBook/1P events/更新源以外的隐式上报）。  
9. **不得**削弱 `resolveSecret` 的 key 字符集校验或改回未转义 shell 拼接。  
10. 触及 API client / MCP / connectors / permissions / analytics 的修复：**必须**说明是否改变外传字段、鉴权头、会话 ID、遥测开关；PR/commit 描述用中文写清影响与回滚。  
11. 修 webhook/连接器入站：**先**恢复真实 sanitizer，禁止继续依赖恒等 stub。  
12. 文档与代码不一致时：以**更严**的代码行为为准更新文档，禁止为对齐文档而放宽实现。  

---

## 9. S 系列深度审查（2026-07-24 · 只读 · 禁止业务源码改动）

> **审查基线**：`main` 工作区（含第四批修复未提交变更不影响 S 路径）  
> **方法**：定位路径/行号 → 因果链 → 静态闭合（升级 H / 降级误报缓解 / 仍可疑）→ 重评级 → 成本收益  
> **对照已修 H**：H-001/H-012 仅装前闸门，**不**闭合 S-006 装后断言；H-005 部分缓解 S-005；compact scar 修复闭合 S-002/S-003 主伤。

### 9.1 总表

| ID | 原级 | 重评级 | 判定 | 一句话 |
|----|------|--------|------|--------|
| S-001 | P1 | **P3** | 已充分缓解 | 路径粘贴首 chunk / 超时同步 arm + clipboard 立即 arm + onSubmit inFlight；纯函数单测覆盖谓词 |
| S-002 | P2 | **P3** | 主伤已缓解 | `boundaryStartOffset` 恒 0、boundary 命中**从不截断**；畸形 JSON→null 不截断；原「skip 丢历史」scar 已死 |
| S-003 | P2 | **P3** | 主伤已缓解 | `walkChainBeforeParse` 保留 boundary 前字节 + `relinkDanglingMainchainParents` + 回归测；relink 失败仅 warn |
| S-004 | P3 | **P3** | 仍可疑 · 需实机 | `shouldUseDegradedColors`/`isTermius` 有单测；Win11+Termius 9.x 实机未验 |
| S-005 | P3 | **已修** | 门禁已落地 | 默认拒绝手动脚本；`CONFIRM_MANUAL_RELEASE=1` 应急 + 列出缺失步骤；CI 唯一推荐 |
| S-006 | P2 | **P2** | 仍可疑 | `installFromTarball` 成功=exit 0；H-001/H-012 只挡装前错误版本 URL，不验装后落地版本 |

### 9.2 逐条因果与闭合

#### S-001｜粘贴 100ms / 图片粘贴 defer 竞态

| 字段 | 内容 |
|------|------|
| **路径** | `/Users/panda/Downloads/cc-panda/src/hooks/usePasteHandler.ts`（`PASTE_COMPLETION_TIMEOUT_MS=100`、`pastePendingRef`、`pasteChunksRef`、`imagePasteSessionArmedRef`、`chunkLooksLikeImagePathPaste` / `extractImagePathsFromPasteChunks`）；`/Users/panda/Downloads/cc-panda/src/components/PromptInput/PromptInput.tsx`（`imagePasteInFlightRef` defer submit；`beginImagePaste`/`endImagePaste`）；`/Users/panda/Downloads/cc-panda/src/components/BaseTextInput.tsx`（`isPasting && key.return`）；单测 `src/hooks/usePasteHandler.imageGuard.test.ts` |
| **触发** | 用户粘贴图片（空 bracketed paste 走剪贴板，或粘贴 `/path/to/img.png`）后在异步读图完成前按 Enter / 触发 `chat:submit` |
| **错误行为（历史）** | 同 stdin chunk 内 paste+Enter：React 状态未提交 → Enter 走 `onInput` → 提交旧输入、丢粘贴图；路径粘贴 100ms 聚合窗内 `imagePasteInFlightRef===0`，`chat:submit` 可旁路 |
| **当前机制** | ① **同步** `pastePendingRef`：pending 期间输入一律当 paste chunk；② 空粘贴 **立即** `checkClipboardForImage` → `onImagePasteBegin`；③ **路径粘贴首 chunk 含 image path 时立即** `onImagePasteBegin`（`imagePasteSessionArmedRef` 防双 begin）；④ 100ms 超时用 `pasteChunksRef` **在清 pastePending 之前**同步 arm；⑤ `onSubmit`（Enter + `chat:submit` 唯一入口）查 `imagePasteInFlightRef` 并 defer replay；⑥ `BaseTextInput` `isPasting` 挡 `key.return` |
| **闭合判定** | **已充分缓解（2026-07-24）**：原「等 100ms 才 begin」与「先清 pending 再进 setState 才 begin」两处窗口已关。`chat:submit` 与 Enter 均经 `onSubmit` inFlight 检查。**残余**：① 分片路径在中间 chunk 尚无扩展名时首 chunk 不 early-arm，但超时仍同步 arm；② 无终端 E2E 证伪同帧 stdin。不升级 H。 |
| **重评级** | P1→P2（审查）→**P3 已充分缓解**（加固后） |
| **成本/收益** | 成本 1（已落地）/ 收益 3 |
| **修复** | `fix(paste): arm image paste guard earlier (S-001)` — 见 git log；单测 `usePasteHandler.imageGuard.test.ts` |
| **升级为 H 的条件** | 终端集成仍复现：粘贴 PNG 后 <50ms 连按 Enter，query 缺 image block |

#### S-002｜compact-boundary / hasPreservedSegment 扫描

| 字段 | 内容 |
|------|------|
| **路径** | `/Users/panda/Downloads/cc-panda/src/utils/sessionStoragePortable.ts` L493–L511（`parseBoundaryLine`）、L590–L605（扫描命中逻辑）、L553–L559（`boundaryStartOffset` 初始化） |
| **触发** | 大 session JSONL 含 `compact_boundary`；或行内偶然含 `"type":"system"` + `"subtype":"compact_boundary"` 子串 |
| **历史错误** | scar：确认 boundary 后清空 buffer → 丢 pre-compact 历史（见 `memory/scars/compact-boundary-preserved-segment-missing.md`） |
| **当前机制** | `parseBoundaryLine`：先子串预筛，再 `jsonParse`；失败 **catch→null**（不当 boundary）。命中后无论 `hasPreservedSegment` true/false **只设 flag，不 `out.len=0`**。全文件检索 **`boundaryStartOffset` 无赋值点**（恒为 0）→ **不存在截断路径**。`hasPreservedSegment` 仅影响调用方是否跑 `walkChainBeforeParse`（`sessionStorage.ts` ~L3484） |
| **闭合判定** | 原「误 skip / 截断丢历史」**已缓解**。残余：① 性能上大文件始终全量读入（非正确性）；② 无损坏 JSON fixture 单测；③ `Boolean(preservedSegment)` 对 `[]` 为 true（空段会跳过 walk——通常可接受）。**不升级 H**（无错误行为证据）。**判定：主伤已缓解（P3 回归面）** |
| **重评级** | P2→**P3** |
| **成本/收益** | 成本 2（加 malformed fixture）/ 收益 2 → 优先级 **低** |
| **与 H 对照** | 非 H-xxx 编号项；对应 scar 修复，非本清单 H-001 系列 |

#### S-003｜walkChainBeforeParse + relinkDanglingMainchainParents

| 字段 | 内容 |
|------|------|
| **路径** | `/Users/panda/Downloads/cc-panda/src/utils/sessionStorage.ts` L2141–L2190（`relinkDanglingMainchainParents`）、L3460–L3495（`hasPreservedSegment` 门控）、L3546–L3640+（`walkChainBeforeParse`）、L3740–L3795（build + relink + attribution skip）；测试 `/Users/panda/Downloads/cc-panda/src/utils/sessionStorage.resumeChain.test.ts` |
| **触发** | resume 旧格式无 `preservedSegment` 的 compact 会话；或 write 中断致 parent 悬空 |
| **历史错误** | walk 在 boundary 截断且未带前缀 → 头悬空 → 显示/序列化丢链 |
| **当前机制** | ① 无 `preservedSegment` 才 walk；② walk **保留** boundary 前已写入字节，仅停止继续向前；③ 建链后 `relinkDanglingMainchainParents` 把悬空头接到最近 `compact_boundary` + `agent_transcripts_removed` 的 `prefix`；④ 测试覆盖「无 preservedSegment 不丢 prefix」与「有 preservedSegment 跳过 walk」 |
| **闭合判定** | 主路径 **已缓解**。残余：relink **找不到** prefix attachment 时只 `logForDebugging` warn，返回 0——极端损坏日志仍可能断链（正确降级，非静默当成功）。**不升级 H**。**判定：主伤已缓解（P3）** |
| **重评级** | P2→**P3** |
| **成本/收益** | 成本 2 / 收益 2 → 优先级 **低**（可选：relink 失败用户可见提示） |

#### S-004｜Windows Termius 实机 256 色

| 字段 | 内容 |
|------|------|
| **路径** | `/Users/panda/Downloads/cc-panda/src/ink/terminal.ts` L164–L178（`isTermius`）、L180–L220（`shouldUseDegradedColors`）；单测 `/Users/panda/Downloads/cc-panda/src/ink/__tests__/terminal.test.ts` |
| **触发** | Win11 + Termius 9.x SSH 会话；`COLORTERM=truecolor` 或 `TERM=xterm-256color` |
| **错误行为（潜在）** | truecolor 帧在 Termius 花屏/闪烁；或启发式过宽（H-017）误降级其他 SSH 客户端 |
| **当前机制** | 单测覆盖 env 组合；`PANDA_FORCE_ANSI256` 强制降级；`COLORTERM=truecolor` 时 **不**降级（设计选择） |
| **闭合判定** | **需实机**——静态无法证伪真彩兼容。关联 H-017（启发式过宽）已证实 P3。**判定：仍可疑 · 需实机** |
| **重评级** | 维持 **P3** |
| **成本/收益** | 成本 4（实机矩阵）/ 收益 2 → 优先级 **低**（有用户报告再升） |

#### S-005｜手动发版绕 CI

| 字段 | 内容 |
|------|------|
| **路径** | `/Users/panda/Downloads/cc-panda/.github/workflows/release-cli.yml`（tag `v*` → build → GH Release + Packages + npm）；`/Users/panda/Downloads/cc-panda/scripts/publish-final.sh`、`scripts/release-cli-tarball.sh`；scar `memory/scars/manual-release-missing-publish.md`；H-005 `c73ce663e`（stable 才标 latest） |
| **触发** | 人类本地 `npm publish` / 只打 tag 不走完整 workflow / 跑旧 shell 脚本漏步骤 |
| **错误行为** | 用户装到旧 npm 或缺 tarball；与 scar 一致 |
| **当前机制** | CI 为唯一推荐齐套路径；手动两脚本默认 `exit 1`，须 `CONFIRM_MANUAL_RELEASE=1`，并打印相对 CI 的 `[MISSING]` 步骤；`README-DEV.md` 发布流程指向 `release-cli.yml` |
| **闭合判定** | **已修（门禁级）**：禁止静默旁路；应急仍可 `CONFIRM_MANUAL_RELEASE=1`。不废止脚本、不改 workflow 行为。**不升级 H**（非运行时缺陷）。**判定：已修 / 流程门禁** |
| **重评级** | **P3 → 已修** |
| **成本/收益** | 成本 1–2 / 收益 3 → 已落地 |
| **修复** | `chore(release): discourage manual publish bypass (S-005)` — `14b0bfcb2` |

#### S-006｜tarball 装后未断言版本

| 字段 | 内容 |
|------|------|
| **路径** | `/Users/panda/Downloads/cc-panda/src/utils/autoUpdater.ts` L1225–L1338（`installFromTarball`：`npm install -g <file.tgz>`，**成功条件=`exit code===0`**，L1306/L1337 `return 'success'`）；装前闸：`resolveInstallTarget` / `isTarballAllowedForInstall` / `versionFromTarballUrl`（H-001、H-012 测试在 `autoUpdater.maxVersion.test.ts`） |
| **触发** | tarball 文件名/URL 版本与包内 `package.json` version 不一致；或 npm 装到意外 prefix/旧缓存仍 exit 0；或安装被 npm 生命周期脚本「成功」但 CLI 入口仍旧 |
| **错误行为** | UI/日志报升级成功，实际 `claude -v` 仍旧或跳到错误版本 |
| **与 H-001/H-012 关系** | **装前**：maxVersion cap 会 strip tarball；`isTarballAllowedForInstall` 拒超 cap URL；asset 名/integrity 收紧。**装后：无** `npm list -g` / 读安装树 version / 与 `specificVersion` 比对。**H-001/H-012 不能闭合 S-006** |
| **闭合判定** | **仍可疑**，证据充分到「缺少断言」级，但未拿到「错误版本曾被标 success」的生产复现 → **不升级 H**（升级条件见下）。维持 P2 |
| **重评级** | 维持 **P2** |
| **成本/收益** | 成本 2 / 收益 4 → 建议优先级 **高（S 系列内 Top）** |
| **升级为 H 的条件** | 构造 tgz：文件名 `…-2.32.3.tgz` 内 `version: 9.9.9`（或反之），`installFromTarball` 返回 success 且无校验失败；或 CI 集成断言 `npm list -g --depth=0` |

### 9.3 与已修 H 的交叉

| S 项 | 相关 H / scar | 是否已部分缓解 | 说明 |
|------|---------------|----------------|------|
| S-001 | （无 H 编号；`usePasteHandler.imageGuard.test.ts` + `useTextInput.race.test.ts` 邻域） | **是（充分缓解）** | 提前 arm + 超时同步 arm；race test 管 coalesced Enter 文本；imageGuard 管 early-arm 谓词 |
| S-002 | scar compact-boundary | **是（主伤）** | 截断路径已消除 |
| S-003 | scar + `sessionStorage.resumeChain.test.ts` | **是（主伤）** | walk+relink+测试 |
| S-004 | H-017 启发式过宽 | 部分 | H-017 是误标面；S-004 是实机显示面 |
| S-005 | H-005 + scar manual-release | **是（CI + 脚本门禁）** | `CONFIRM_MANUAL_RELEASE=1` + 强警告；默认不可静默旁路 |
| S-006 | H-001、H-012 | **装前是 / 装后否** | 熔断与 asset 闸 ≠ 装后版本断言 |

### 9.4 修复成本×收益（1–5）与建议动手

| ID | 成本 | 收益 | 建议 |
|----|------|------|------|
| S-006 | 2 | 4 | **建议动手 #1**：`installFromTarball` success 前读全局包 version / `npm list -g --json` 比对 `specificVersion` |
| S-001 | 1 | 3 | **已修**：首 chunk early-arm + 超时同步 arm；`usePasteHandler.imageGuard.test.ts`；残余仅分片无扩展名中间态 + 无 E2E |
| S-005 | 1–2 | 3 | **已修**：`CONFIRM_MANUAL_RELEASE=1` 门禁 + `[MISSING]` 清单 + README-DEV 唯一入口指向 `release-cli.yml` |
| S-002 | 2 | 2 | 不急；加 malformed boundary fixture 即可 |
| S-003 | 2 | 2 | 不急；relink 0 条时用户提示可选 |
| S-004 | 4 | 2 | 等实机/用户报告 |

### 9.5 编号卫生

- **正式 S 项**：仅 **S-001～S-006**（§3 + 本节）。  
- **§8.3** 表中 S-001～S-024 为隐私影响矩阵行号复用，**与正式 S 语义冲突**（例如 8.3 的 S-001=maxVersion 实为 H-001）。后续改文档时应改前缀为 `PS-` 或 `M-`，避免猎杀 ID 碰撞。

### 9.6 本轮执行边界（复核）

- 2026-07-24 深度审查：未把任一 S 强行升为已证实 H  
- 2026-07-24 S-001 加固：`fix(paste): arm image paste guard earlier (S-001)` — 源码 + 单测 + 本清单回写  
- S-002/003/004/006 本轮未改业务源码  
