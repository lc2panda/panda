# Panda Desk Chat

> Panda 的图形化桌面端 · 多会话 AI 对话客户端（macOS / Windows）

[![desktop](https://img.shields.io/badge/Panda%20Desk%20Chat-v0.3.7-blue)](https://github.com/lc2panda/panda/releases/latest) [![runtime](https://img.shields.io/badge/Electron-desktop-black)](https://www.electronjs.org/) [![download](https://img.shields.io/badge/download-Releases-success)](https://github.com/lc2panda/panda/releases/latest)

**Panda Desk Chat** 是 [Panda](../../README.md) 的官方 UI 桌面端：在图形界面里和 AI 对话，提供多会话管理、设置页、定时任务、连接器与应用内更新检查。它复用本机 `panda` CLI 的服务商、认证与模型配置，开箱即用。

---

## 安装

从 [GitHub Releases](https://github.com/lc2panda/panda/releases/latest) 下载最新安装包：

| 平台 | 安装包 |
|------|------|
| macOS (Apple Silicon) | `Panda-<版本>-arm64.dmg` |
| Windows (x64) | `Panda Setup <版本>.exe` |

下载后双击安装，启动 `Panda` 即可。首次启动会自动读取本机 `panda` CLI 的现有配置（服务商、认证、模型），无需重复配置。

> macOS 首次打开若提示「无法验证开发者」，在「系统设置 → 隐私与安全性」中点「仍要打开」。

---

## 升级与更新

> **一句话**：安装和升级用**同一个入口，无需先卸载** —— 直接覆盖即可。

- **应用内自动更新（推荐）**：打开 **关于页 → 检查更新**。内置 electron-updater 对接 GitHub Releases 自动检测新版本，发现后引导下载安装。
- **手动覆盖**：从 [GitHub Releases](https://github.com/lc2panda/panda/releases/latest) 重新下载最新 `Panda-<版本>-arm64.dmg`（或 Windows `Panda Setup <版本>.exe`），覆盖安装即可，旧版无需先删除。

---

## 从源码运行（开发者）

```bash
cd packages/panda-desk-chat
bun install
bun run dev          # 开发模式
bun run build:electron   # 构建 Electron 产物
bun run dist         # 打包安装包（DMG / NSIS）
```

更多 CLI 能力、Provider 配置与版本演进，见仓库根 [README](../../README.md)。
