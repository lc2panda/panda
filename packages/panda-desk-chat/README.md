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

### Windows 安装

桌面端 Windows 版从 [Releases](https://github.com/lc2panda/panda/releases/latest) 下载 `Panda Setup 0.3.7.exe`，双击运行安装即可。

> ⚠️ **诚实标注**：Windows 端为 **wine 跨编产物，尚未在 Windows 实机充分验证**。已知注意点：(a) 未签名 exe 可能触发 SmartScreen「Windows 已保护你的电脑」，点「更多信息 → 仍要运行」即可；(b) 桌面端复用 `panda` CLI 配置，首次使用 CLI 功能需本机已装 bun（用 PowerShell `irm bun.sh/install.ps1 | iex` 安装）。与 v2.27.7 声明一致。

CLI（命令行）在 Windows 用 PowerShell 一行安装：

```powershell
irm https://raw.githubusercontent.com/lc2panda/panda/main/install.ps1 | iex
```

> `curl ... | bash` 仅适用 macOS / Linux；Windows 请用 `install.ps1`。`.tgz` 跨平台，已捆绑 win32 ripgrep。

---

## 升级与更新

> **一句话**：安装和升级用**同一个入口，无需先卸载** —— 直接覆盖即可。

- **应用内自动更新（推荐）**：打开 **关于页 → 检查更新**。内置 electron-updater 对接 GitHub Releases 自动检测新版本，发现后引导下载安装。
- **手动覆盖（macOS）**：从 [GitHub Releases](https://github.com/lc2panda/panda/releases/latest) 重新下载最新 `Panda-<版本>-arm64.dmg`，覆盖安装即可，旧版无需先删除。
- **手动覆盖（Windows）**：用应用内 **关于页 → 检查更新**，或从 Releases 重新下载新版 `Panda Setup 0.3.7.exe` 运行覆盖安装。
- **CLI 升级（Windows）**：重跑 `irm https://raw.githubusercontent.com/lc2panda/panda/main/install.ps1 | iex` 覆盖升级，无需卸载；或 `npm i -g @lc2panda/panda-code@latest --registry=https://npm.pkg.github.com`。验证 `panda --version`。

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
