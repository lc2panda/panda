// Input: Electron BrowserWindow（仅 Linux 平台有效；其他平台调用是 no-op）
// Output: 当前 Phase 1 的 X11 适配是 stub —— 透明窗 / 点击穿透 / type:'toolbar' 由 Electron BrowserWindow 自动覆盖
// Pos: panda-on-desk 平台层 — Linux X11 占位（v1.5+ Wayland 正式适配）
//
// [NEW-FILE:#20260419-P1-13]
//
// 历史背景：
//   · clawd-on-desk@4b07658 在 src/main.js 用 LINUX_WINDOW_TYPE = 'toolbar' 解决任务栏吞窗，
//     用 launch.js 的 --no-sandbox / --disable-setuid-sandbox 解决 chromium 沙箱在 X11 的兼容问题。
//     这两处已经分别在 panda-on-desk 的 src/main.ts 和 launch.cjs 内联实现，无需独立文件。
//   · X11 透明窗 + setIgnoreMouseEvents 由 Electron BrowserWindow 自身（mutter / kwin / xfwm4 默认开 compositor）支持；
//     当前 Phase 1 不需要 koffi → libX11 / Xfixes 的 native call。
//
// TODO（v1.5+ Wayland）：
//   · 检测 XDG_SESSION_TYPE === 'wayland' 时禁用 setIgnoreMouseEvents 的 forward:true 路径
//     （wayland 下 Electron 的 hit-test forward 仍有 bug：electron#33035）；
//   · 评估 layer-shell 协议 —— wlroots 系（sway/hyprland）可走 wlr-layer-shell 拿真正的 overlay；
//     gnome wayland 仍需走 portal 兜底；
//   · LSUIElement / Dock 隐藏在 Linux 下等价于不创建任务栏项 —— 已由 type:'toolbar' + setSkipTaskbar(true) 实现。
//
// 一旦此处签名变更，请同步更新 platform/index.ts 中 linux 分发分支。

const isLinux = process.platform === 'linux'

/**
 * Linux X11 平台特殊处理 —— 当前 Phase 1 stub。
 *
 * Phase 1 内 X11 透明 overlay + 点击穿透由 BrowserWindow 自身完成（无需 koffi 调用 X11 API）。
 * 留此函数仅为 platform/index.ts 的统一接口签名，不执行任何副作用。
 *
 * 返回 false 表示“无任何平台特殊变更落地”，与 mac-window / win-window 失败语义对齐。
 */
export function applyLinuxX11Tweaks(_browserWindow: any): boolean {
  if (!isLinux) return false
  // Intentional no-op for Phase 1.
  // 当 v1.5+ 启用 Wayland layer-shell 时，将在此挂入 koffi → libwayland-client 调用。
  return false
}

/**
 * 诊断导出：当前会话是否运行在 Wayland 之上。
 *
 * 用于 v1.5+ 路径分流；Phase 1 仅暴露语义化 helper，不影响运行行为。
 */
export function isWaylandSession(): boolean {
  if (!isLinux) return false
  const sessionType = (process.env.XDG_SESSION_TYPE || '').toLowerCase()
  if (sessionType === 'wayland') return true
  if (process.env.WAYLAND_DISPLAY) return true
  return false
}
