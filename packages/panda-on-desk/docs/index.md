<!--
Input:  panda-on-desk 全套用户/贡献者/架构/隐私文档分散在仓库各处
Output: GitHub Pages 单页索引（jekyll 默认主页 site root）
Pos:    panda-on-desk 子包文档站根 — 仅供 GitHub Pages 渲染（Jekyll markdown）
        [NEW-FILE:#W10-04] · 2026-04-20 +08:00 W10-T4 docs 站点（agent-δ-W10-pages）
        一旦上游任一文档新增 / 改名 / 下线，请同步更新本索引内的链接与摘要。
-->

---
layout: default
title: panda-on-desk · 文档站
description: panda-on-desk 桌面宠物子产品 · 文档总入口（README · CHANGELOG · CONTRIBUTING · ARCHITECTURE · PRIVACY · FAQ）
---

# panda-on-desk · 文档站

> 你的桌面宠物 AI 伙伴 · panda CLI ↔ HTTP IPC ↔ Electron 41 GUI overlay
> 当前 GA 基线：**v2.25.7 → v2.25.12** · 适用平台：macOS / Windows / Linux

[![release](https://img.shields.io/badge/release-desk--v1.0.0-brightgreen)](https://github.com/lc2panda/panda/releases)
[![electron](https://img.shields.io/badge/electron-41.0-blue)](https://www.electronjs.org/)
[![license](https://img.shields.io/badge/license-MIT-green)](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/LICENSE)
[![telemetry](https://img.shields.io/badge/telemetry-0-brightgreen)](#5-隐私声明privacymd)

---

## 文档总览

| # | 文档 | 适用读者 | 一句话摘要 | 跳转 |
|---|------|---------|-----------|------|
| 1 | **panda 主仓 README** | 任何接触者 | panda CLI（v2.18.x+）的安装、Matrix 主题、子包指引 | [README.md](https://github.com/lc2panda/panda/blob/main/README.md) |
| 2 | **panda-on-desk README** | 普通用户 | 5 分钟上手 · 18 物种 × 12 PetState · 安装指南 · 故障排查 | [packages/panda-on-desk/README.md](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/README.md) |
| 3 | **CHANGELOG** | 全员 | v2.22.0 → v2.25.12 共 19 版本演进追踪 | [CHANGELOG.md](https://github.com/lc2panda/panda/blob/main/CHANGELOG.md) |
| 4 | **CONTRIBUTING** | 贡献者 | 本地开发 · 资产替换 · 添加 PetState/物种/IPC · PR checklist | [CONTRIBUTING.md](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/CONTRIBUTING.md) |
| 5 | **ARCHITECTURE** | 架构师 | 进程模型 · IPC 链路 · 状态机优先级 · 跨平台抽象 | [ARCHITECTURE.md](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/ARCHITECTURE.md) |
| 6 | **PRIVACY** | 隐私敏感用户 | 当前 0 telemetry · 数据本地化 · 未来 opt-in 路线契约 | [PRIVACY.md](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/PRIVACY.md) |
| 7 | **INSTALL_TEST** | QA / 新用户 | W9-T2 安装实测 walkthrough + 5+ 类常见报错排查 | [INSTALL_TEST.md](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/docs/INSTALL_TEST.md) |
| 8 | **跨平台发版手册** | 维护者 | tag 触发流程 + CI 行为 + 用户下载安装指南 | [release-panda-on-desk.md](https://github.com/lc2panda/panda/blob/main/docs/release-panda-on-desk.md) |

---

## 1. 主仓 [README](https://github.com/lc2panda/panda/blob/main/README.md)

panda CLI 主体（v2.18.1+）的安装、配置、Matrix 主题、Bun/Node 运行时要求、子包 panda-on-desk 联动入口。

- 适用读者：第一次接触 panda 项目的用户 / CLI 用户
- 入门 3 步：配置 GitHub Packages token → `npm i -g @lc2panda/panda-code` → `panda`
- 可选：`PANDA_THEME=matrix panda` 启用黑客帝国磷光绿主题

[→ 阅读全文](https://github.com/lc2panda/panda/blob/main/README.md)

---

## 2. [panda-on-desk README](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/README.md)

桌面宠物子产品的用户视角入口。

- 18 物种（panda / kungFuPanda / redPanda 等）× 12 PetState（idle / thinking / working / sleeping / error / attention / notification / ...）
- 4 BrowserWindow + tray + 60 级养成 + 11 桶 XP
- 安装方式（v1.0 GA）：macOS dmg / Windows NSIS / Linux AppImage·deb

[→ 阅读全文](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/README.md)

---

## 3. [CHANGELOG](https://github.com/lc2panda/panda/blob/main/CHANGELOG.md)

panda-on-desk 子产品 19 版本演进（v2.22.0 → v2.25.12）。

- 时间锚点：2026-04-19 ~ 2026-04-20 (Asia/Singapore +08:00)
- 主体 panda CLI 早期版本（v0.x → v2.21.x）见 git log 与 `monitor/` 目录归档

[→ 阅读全文](https://github.com/lc2panda/panda/blob/main/CHANGELOG.md)

---

## 4. [CONTRIBUTING](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/CONTRIBUTING.md)

贡献者指南。

- 本地开发流程 · 项目结构速览
- 主题资产替换路径（程序化 SVG → 真实美术）
- 添加 PetState / 物种 / IPC event 步骤
- 跨平台 build（mac / win / linux）
- PR checklist

[→ 阅读全文](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/CONTRIBUTING.md)

---

## 5. [ARCHITECTURE](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/ARCHITECTURE.md)

架构师与资深贡献者的设计深潜。

1. 进程模型（launch.cjs → main → 4 BrowserWindow）
2. IPC bridge 完整链路（HTTP POST/SSE on 127.0.0.1:1455+）
3. 状态机优先级表（12 PetState）
4. 主题加载流程（theme loader → SVG sprites → renderer）
5. 跨平台抽象层（platform/{mac,win,linux}-window.ts）
6. 关键设计决策与权衡

[→ 阅读全文](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/ARCHITECTURE.md)

---

## 6. [隐私声明 PRIVACY](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/PRIVACY.md)

> **TL;DR — panda-on-desk 当前 0 telemetry。所有数据在你的本机处理，零上传，零外部 HTTP 调用。**

- 不集成 Sentry / Datadog / GA / Mixpanel / 任何 APM/RUM SDK
- 不存在「匿名使用统计」「崩溃自动上报」「心跳上报」「特征实验埋点」代码路径
- 所有 IPC 仅走 `127.0.0.1` 本地回环（panda CLI ↔ panda-on-desk）
- 未来若新增任何 telemetry 必须 opt-in 默认 disabled，并先回写 PRIVACY.md

[→ 阅读全文](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/PRIVACY.md)

---

## 7. [INSTALL_TEST](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/docs/INSTALL_TEST.md)

W9-T2 安装实测产物。

- 新用户 walkthrough（mac / win / linux 三平台分步）
- 5+ 类常见报错排查（SmartScreen / Gatekeeper / chmod / TOKEN 失效 / 端口冲突 ...）

[→ 阅读全文](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/docs/INSTALL_TEST.md)

---

## 8. [跨平台发版手册](https://github.com/lc2panda/panda/blob/main/docs/release-panda-on-desk.md)

维护者发版手册。

- tag 触发流程 + GitHub Actions CI 行为
- mac job (`panda.icns`) + win job (`panda.ico`) + linux job 完整链路
- 用户下载安装指南

[→ 阅读全文](https://github.com/lc2panda/panda/blob/main/docs/release-panda-on-desk.md)

---

## FAQ（常见问题速查）

> 完整 FAQ 见 README + INSTALL_TEST，本节列出 Top 6。

**Q1: 装好后 panda-on-desk 不出现？**
A: 先确认 panda CLI 已运行（`panda` 启动后 IPC server 才会监听 127.0.0.1:1455+）。

**Q2: macOS 提示「无法验证开发者」？**
A: 系统设置 → 隐私与安全 → 仍然打开（Gatekeeper 兼容）。详见 INSTALL_TEST.md §3.1。

**Q3: Windows SmartScreen 拦截 NSIS 安装包？**
A: 「更多信息 → 仍要运行」（应用未公证签名 · v1.0 GA 阶段）。详见 INSTALL_TEST.md §3.2。

**Q4: Linux AppImage 双击没反应？**
A: 先 `chmod +x panda-on-desk-*.AppImage`。详见 INSTALL_TEST.md §3.3。

**Q5: 端口 1455 被占用？**
A: panda-on-desk 自动探测 1455-1465 段空闲端口，无需手动配置。详见 ARCHITECTURE.md §2。

**Q6: panda-on-desk 会上传我的数据吗？**
A: **不会**。当前 0 telemetry，所有数据本地化。详见 [PRIVACY.md](https://github.com/lc2panda/panda/blob/main/packages/panda-on-desk/PRIVACY.md)。

---

## 反馈与贡献

- Issues：[github.com/lc2panda/panda/issues](https://github.com/lc2panda/panda/issues)
- Releases：[github.com/lc2panda/panda/releases](https://github.com/lc2panda/panda/releases)
- 主仓：[github.com/lc2panda/panda](https://github.com/lc2panda/panda)

---

<sub>本站点由 GitHub Pages（Jekyll）自动渲染 · 内容源自仓库 markdown · 0 第三方依赖 · 0 telemetry</sub>
