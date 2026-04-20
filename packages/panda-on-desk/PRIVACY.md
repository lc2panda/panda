<!--
Input:  panda-on-desk 子包数据流向 / 用户隐私关切
Output: 向用户透明披露「当前 0 telemetry」+ 数据本地化承诺 + 未来 opt-in 路线
Pos:    panda-on-desk 子包根 — 与 README.md / CONTRIBUTING.md / ARCHITECTURE.md 平级
        所有 telemetry 相关变更必须先回写本文档；变更前必须保持 opt-in 默认 disabled

[NEW-FILE:#W9-01]
2026-04-20 +08:00 W9-T3 telemetry 透明度文档（agent-γ-W9-telemetry）
-->

# panda-on-desk 隐私声明（Privacy Statement）

> **TL;DR — panda-on-desk 当前 0 telemetry。所有数据在你的本机处理，零上传，零外部 HTTP 调用。**

本文档面向使用 `@lc2panda/panda-on-desk` 桌面宠物（Electron GUI overlay）的最终用户，阐明本子包对你个人数据的处理方式、当前不做的事、以及未来若要扩展遥测必须遵循的契约。

---

## 1. 当前事实（v2.25.x · v1.0 GA 阶段）

### 1.1 panda-on-desk 子包当前 **0 telemetry**

- 不向任何第三方服务器发送数据；
- 不集成 Sentry / Datadog / Google Analytics / Mixpanel / 任何 APM/RUM SDK；
- 不存在任何「匿名使用统计」「崩溃自动上报」「心跳上报」「特征实验埋点」的代码路径；
- 出站网络请求**仅**用于 electron-updater 的 GitHub Release 检查（`api.github.com/repos/lc2panda/panda/releases/latest`），由 Electron 自动更新机制发起，不携带宠物状态 / 用户行为 / 设备指纹。

### 1.2 数据流向

panda-on-desk 与 panda CLI 之间走**本机环回**通信，永不出本机网卡：

```
┌─────────────────────┐        HTTP POST 127.0.0.1:1455+/state        ┌─────────────────────┐
│   panda CLI (TUI)   │ ──────────────────────────────────────────▶  │   panda-on-desk     │
│   (信号源)          │        SSE GET 127.0.0.1:1455+/events          │   (Electron GUI)    │
│                     │ ◀──────────────────────────────────────────  │                     │
└─────────────────────┘                                                 └─────────────────────┘
        │                                                                       │
        └────── 共享文件 ~/.pandacc/runtime.json (secret + port + pid) ─────────┘
        └────── 共享文件 ~/.config/panda/desk-state.json (XP / level / species) ┘
```

- **协议**：HTTP 1.1 + SSE，绑定 `127.0.0.1`（IPv4 loopback），auto-fallback `1455 → 1456 → ...` 直到首个空闲端口；
- **认证**：`runtime.json` 内 secret 双向校验，mismatch 401，防止同机其他进程伪造；
- **范围**：仅本机进程间通信（IPC over loopback），任何 NIC / 路由器 / 公网都看不到；
- **持久化**：所有用户数据落盘在用户本地家目录，详见 §2。

### 1.3 panda-on-desk **不上传**的数据清单

以下数据**全部仅在本机处理**，不会以任何形式上传到任何远程服务器：

| 数据类型 | 存储位置 | 上传？ |
|---------|---------|-------|
| PetState 12 态切换历史 | 内存 / `~/.pandacc/desk-spawn.log`（若启用） | 否 |
| token 流式输出量 / cmd-count | 仅运行时内存 | 否 |
| 18 物种切换记录 | `~/.config/panda/desk-state.json` | 否 |
| XP / level / 等级里程碑 | `~/.config/panda/desk-state.json` | 否 |
| companion-stats.json（养成数据） | `~/.config/panda/companion-stats.json`（HMAC sign 仅本地防作弊） | 否 |
| desk-prefs.json（用户设置） | `~/.pandacc/desk-prefs.json` | 否 |
| 通知文案 / 103 场景触发记录 | 内存 + 渲染层 DOM；`panda-on-desk.log`（轮转） | 否 |
| 双击 / 4击 / 长按交互事件 | IPC 通道，main↔renderer 闭环 | 否 |
| 设备指纹 / IP / OS 版本 / 硬件信息 | 不采集 | 否 |
| 崩溃 stack trace | 仅写本地 `panda-on-desk.log`（W8-T3 新增的 logger.ts） | 否 |

### 1.4 companion-stats.json 的 HMAC 签名说明

`companion-stats.json` 文件包含养成数据（XP / level / 解锁里程碑），写入时附带本地 HMAC-SHA256 签名。**该签名仅用于本机防作弊**（防止用户手动改 JSON 直接到 60 级），**不上传任何字节到外部**。HMAC 密钥从本机 `~/.pandacc/runtime.json` 派生，绑定本机进程，无任何回传。

---

## 2. 本地数据存储位置（用户可自查 / 自删）

| 路径 | 内容 | 可删除？ |
|------|------|---------|
| `~/.pandacc/runtime.json` | panda CLI ↔ panda-on-desk IPC 的 secret + port + pid | 是（重启 panda 后自动重建） |
| `~/.pandacc/desk-prefs.json` | 用户设置（DND 时段 / 物种 / 通知音量 / autoLaunch） | 是（删后回到默认值） |
| `~/.pandacc/panda-on-desk.log` | main 进程错误日志（轮转，单文件 ≤ 1MB） | 是（不影响功能） |
| `~/.pandacc/desk-spawn.log` | 启动日志（panda CLI spawn panda-on-desk 时写入） | 是 |
| `~/.config/panda/desk-state.json` | XP / level / 物种 持久化 | 是（删后从 0 级开始） |
| `~/.config/panda/companion-stats.json` | 养成统计（HMAC 签名，仅本地） | 是（删后从 0 级开始） |

完整清除：`rm -rf ~/.pandacc ~/.config/panda`（或 Windows 下手动删除上述路径）。

---

## 3. 未来 telemetry 扩展承诺（v2.0+ 路线，**目前不实装**）

panda-on-desk 团队承诺：**未来若要加入任何 telemetry / crash report / usage analytics，必须严格遵守以下契约**。

### 3.1 必须 opt-in（**绝不 opt-out**）

- 默认状态：**disabled**；
- 启用方式：用户在「设置面板 → 隐私」显式勾选「我同意发送匿名诊断数据帮助改进 panda-on-desk」；
- 禁止任何形式的「首次启动默认开启」「升级后自动开启」「沉默重置为开启」；
- 禁止任何「拒绝就不能用」的强迫式同意。

### 3.2 必须分级 + 透明清单

启用后，用户可以在设置面板中**逐项开启**以下子项（互相独立）：

- `crashReport` — 仅崩溃 stack trace，不含用户数据；
- `usageMetrics` — 匿名 PetState 切换频率（无具体内容）；
- `featureFlags` — 实验组分配信息；
- `errorLog` — main/renderer 错误日志（脱敏后）。

### 3.3 必须本地审计日志

任何对外发送的数据**必须先写一份到本机** `~/.pandacc/telemetry-audit.log`（明文 JSON Lines），用户可随时审查到底发了什么。

### 3.4 必须使用既有 stub 接入点

未来扩展只能在 `src/util/telemetry.ts`（`[NEW-FILE:#W9-02]`）中实装；该 stub 当前提供 `track()` / `captureException()` / `setUserConsent()` 接口，但**全部 no-op**。任何绕过 telemetry.ts 直接调用 fetch / `https.request` 的 PR 必须被拒绝。

### 3.5 必须 byte-equal 守护

panda-on-desk 的 telemetry 实装**绝不可触碰** panda CLI 主仓的 `src/services/api/{claude.ts, oauth/*, providers.ts}` —— anthropic 协议层零修改是本项目的最高契约。

---

## 4. 联系与举报

- 发现疑似 telemetry 行为？请在 [GitHub Issues](https://github.com/lc2panda/panda/issues) 提交 `[privacy]` 前缀工单；
- 邮箱：imladrisel@gmail.com；
- 本文档遵循 [Semantic Versioning](https://semver.org/) — 任何隐私契约变更必须在 CHANGELOG 主版本号或次版本号变更中显式声明。

---

> **领地标记规约**：一旦本子包的数据流向 / telemetry 状态发生变化（即使是新增 stub 调用点），请务必更新本 PRIVACY.md — 就像重新标记领地一样。
