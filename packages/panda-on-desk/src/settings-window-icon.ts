// Input: app + process.platform — main.js L110-112 require & 调用入口
// Output: applyWindowsAppUserModelId / getSettingsWindowIconPath / WINDOWS_APP_USER_MODEL_ID
// Pos: panda-on-desk Windows AppUserModelId + settings 窗口图标 — v0.1-alpha 占位 stub
//
// Forked from clawd-on-desk@4b07658:src/settings-window-icon.js (MIT License) — 仅占位
// [NEW-FILE:#20260419-DESK-FIX-01]
//
// TODO[v0.5]: 真实接入 panda 品牌 AppUserModelId + 主题化 settings 图标资源
// 当前仅满足 main.js require 链路不抛错；接口与 clawd 1:1，所有方法 no-op。

"use strict";

export const WINDOWS_APP_USER_MODEL_ID = "panda-on-desk.lc2panda";

/**
 * Stub: 真实实现会在 Windows 平台调用 app.setAppUserModelId。
 * v0.1-alpha 不做任何事 — 不影响 4 BrowserWindow 启动。
 */
export function applyWindowsAppUserModelId(_app: unknown, _platform: string): void {
  // no-op
}

/**
 * Stub: 返回 null 让 settings 窗口走 electron 默认 icon。
 */
export function getSettingsWindowIconPath(): string | null {
  return null;
}
