// Input: launch.cjs spawn → electron main 进程入口
// Output: 4 类 BrowserWindow（pet / hit / settings / update-bubble）+ 透明 overlay + 单实例锁 + 生命周期编排
// Pos: panda-on-desk 主进程 god file（改造 fork — 上游 3119 行 → 单 panda provider 削皮 ~30%）
//
// Forked from clawd-on-desk@4b07658:src/main.js (MIT License) - Adapted to panda single provider
//
// 削皮范围（删除 multi-provider 分支）：
//   · agent-gate / agents/codex* / agents/gemini* / agents/copilot* / agents/cursor* / agents/kiro* /
//     agents/opencode* / agents/codebuddy* —— 单 panda provider 不需要
//   · CodexLogMonitor + GeminiLogMonitor 启动段 —— 不存在
//   · isAgentEnabled / hasAnyEnabledAgent / detectRunningAgentProcesses 多 agent 分支
//   · settings-controller 中 agent 注入依赖（startMonitorForAgent / stopMonitorForAgent / clearSessionsByAgent / dismissPermissionsByAgent）
//   · ipcMain agent 选择 / 切换路由
//   · provider/registry 收敛为单条 panda
//
// 保留：
//   · 4 BrowserWindow 类型（hit / pet / settings / update-bubble）
//   · 生命周期 app.on(ready/window-all-closed/activate/before-quit/second-instance)
//   · 单实例锁 app.requestSingleInstanceLock
//   · 透明 overlay + 点击穿透 + alwaysOnTop
//   · macOS 平台特殊处理调用入口（mac-window —— 待 P1-T7 fork）
//   · Windows koffi FFI 提权调用入口（platform/win-window —— 待 P1-T7 fork）
//
// 引用现有 fork 模块：
//   state.ts / theme-loader.ts / animation-cycle.ts / menu.ts / shortcuts.ts / updater.ts /
//   i18n.ts / platform/login-item.ts / util/focus.ts / util/tick.ts / util/log-rotate.ts /
//   geometry/{hit-geometry,size-utils,visible-margins,drag-position,work-area}.ts
//
// 待 fork 模块（P1-T4 ~ P1-T8 内补齐，下文 require 处用 try/catch + TODO 注明）：
//   prefs.ts / server.ts / permission.ts / settings-controller.ts / settings-actions.ts /
//   shortcut-actions.ts / mini.ts / update-bubble.ts / mac-window.ts / settings-window-icon.ts /
//   platform/win-window.ts (Windows koffi user32 FFI 提权)

/* eslint-disable @typescript-eslint/no-require-imports */
// @ts-nocheck — 维持 1:1 fork 行为；待 P1-T9 架构精修时补强类型

import { app, BrowserWindow, screen, Menu, ipcMain, globalShortcut, nativeTheme, dialog, shell } from 'electron'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { pathToFileURL } from 'node:url'

// ── 已 fork 的几何模块 ─────────────────────────────────────────────────────────
import * as hitGeometry from './geometry/hit-geometry'
import {
  findNearestWorkArea,
  computeLooseClamp,
  getDisplayInsets,
  SYNTHETIC_WORK_AREA,
} from './geometry/work-area'
import {
  getThemeMarginBox,
  computeStableVisibleContentMargins,
  getLooseDragMargins,
  getRestClampMargins,
} from './geometry/visible-margins'
import {
  createDragSnapshot,
  computeAnchoredDragBounds,
  computeFinalDragBounds,
  materializeVirtualBounds,
} from './geometry/drag-position'
import { getLaunchSizingWorkArea, getProportionalPixelSize } from './geometry/size-utils'

// ── 已 fork 的工具模块 ─────────────────────────────────────────────────────────
import * as animationCycle from './animation-cycle'
import * as themeLoader from './theme-loader'
import initState from './state'
import initFocus from './util/focus'
import initTick from './util/tick'
import * as loginItemHelpers from './platform/login-item'

// menu.ts / shortcuts.ts / updater.ts 上游仍是 CommonJS 工厂；用 require 形态消费
const initMenu = require('./menu') as (ctx: any) => any
const initUpdater = require('./updater') as (ctx: any) => any
const shortcutActions = require('./shortcuts') as {
  SHORTCUT_ACTIONS: Record<string, { persistent: boolean; defaultAccelerator: string; labelKey: string }>
  SHORTCUT_ACTION_IDS: string[]
}
const { SHORTCUT_ACTIONS, SHORTCUT_ACTION_IDS } = shortcutActions

// ── 待 fork 模块的兜底加载（P1-T4 ~ P1-T8 内补齐） ────────────────────────────
// 用 try/catch 让 main 进程在 fork 模块尚未到位时可继续 TS 编译并启动空窗。
function _safeRequire<T = any>(modPath: string, fallback: T): T {
  try {
    return require(modPath) as T
  } catch (err) {
    console.warn(`[panda-on-desk] optional module ${modPath} not yet forked:`, (err as Error).message)
    return fallback
  }
}

// mac-window：macOS NSWindowCollectionBehavior 注入入口（P1-T7 已 fork 到 platform/mac-window.ts）
// TODO[P1-T9]: 改为 import { applyPlatformSpecific } from './platform' 一行调用替代 reapplyMacVisibility
const macWindowMod = _safeRequire<{
  applyStationaryCollectionBehavior?: (w: any) => boolean
}>('./platform/mac-window', {})
const applyStationaryCollectionBehavior = macWindowMod.applyStationaryCollectionBehavior
  ?? ((_w: any) => false)

// settings-window-icon：Windows AppUserModelId + settings 窗口图标（P1-T5 fork）
const settingsIconMod = _safeRequire<{
  applyWindowsAppUserModelId?: (app: any, platform: string) => void
  getSettingsWindowIconPath?: (opts: any) => string | null
}>('./settings-window-icon', {})
const applyWindowsAppUserModelId = settingsIconMod.applyWindowsAppUserModelId ?? (() => {})
const getSettingsWindowIconPath = settingsIconMod.getSettingsWindowIconPath ?? (() => null)

// prefs / settings-controller / settings-actions（P1-T5 fork — 持久化 + 配置中心）
const prefsModule = _safeRequire<any>('./prefs', null)
const settingsControllerMod = _safeRequire<any>('./settings-controller', null)
const settingsActionsMod = _safeRequire<any>('./settings-actions', { ANIMATION_OVERRIDES_EXPORT_VERSION: 1 })
const { ANIMATION_OVERRIDES_EXPORT_VERSION } = settingsActionsMod

// server / permission / mini / update-bubble（P1-T4 / P1-T8 fork — 业务模块）
const serverMod = _safeRequire<any>('./server', null)
const permissionMod = _safeRequire<any>('./permission', null)
const miniMod = _safeRequire<any>('./mini', null)
const updateBubbleMod = _safeRequire<any>('./update-bubble', null)

// W1-T4：bridge IPC server（P2-T1 已实装协议，W1-T4 在 main 进程实际拉起）
// why _safeRequire: 子包 build 顺序 / 缺失依赖时不应阻挡 4 BrowserWindow 启动；
//   IPC bridge 失败时 panda-on-desk 仍可作为纯桌面宠物运行（panda CLI 推送将静默 ECONNREFUSED）。
const bridgeServerMod = _safeRequire<{
  startBridgeServer?: (opts: any) => Promise<{ port: number; secret: string; broadcast: (msg: any) => void; close: () => Promise<void> }>
}>('./bridge/server', {})

// W2-T4：badge 角标 manager — 把 hit 窗 sendToHitWin 注入为 renderer notifier
// 失败容错：badge module 缺失时不阻挡主路径（仅没有红圆 badge）。
const badgeManagerMod = _safeRequire<{
  setBadgeRendererNotifier?: (fn: ((channel: string, payload: any) => void) | null) => void
}>('./badge/manager', {})

// platform/win-window：Windows koffi user32 FFI 提权（P1-T7 fork）
// 上游 main.js L37-46 的 AllowSetForegroundWindow 直接 inline；此处提取到 platform/win-window.ts。
// TODO[P1-T7]: 替换为 import { allowSetForegroundWindow } from './platform/win-window'
const winWindowMod = _safeRequire<{
  allowSetForegroundWindow?: (pid: number) => boolean
}>('./platform/win-window', {})

// ── 平台常量 ───────────────────────────────────────────────────────────────────
const isMac = process.platform === 'darwin'
const isLinux = process.platform === 'linux'
const isWin = process.platform === 'win32'
const LINUX_WINDOW_TYPE = 'toolbar'
const WIN_TOPMOST_LEVEL = 'pop-up-menu' // 上游约束：高于 taskbar shell UI

// ── Autoplay policy: allow sound playback without user gesture ──
// MUST be set before any BrowserWindow is created (before app.whenReady)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

applyWindowsAppUserModelId(app, process.platform)

// ── Windows: AllowSetForegroundWindow via FFI（inline 兜底；P1-T7 抽到 platform/win-window） ──
let _allowSetForeground: ((pid: number) => boolean) | null = winWindowMod.allowSetForegroundWindow ?? null
if (isWin && !_allowSetForeground) {
  try {
    const koffi = require('koffi')
    const user32 = koffi.load('user32.dll')
    const fn = user32.func('bool __stdcall AllowSetForegroundWindow(int dwProcessId)')
    _allowSetForeground = (pid: number) => fn(pid)
  } catch (err) {
    console.warn('[panda-on-desk] koffi/AllowSetForegroundWindow not available:', (err as Error).message)
  }
}

// ── Window size presets ──
const SIZES = {
  S: { width: 200, height: 200 },
  M: { width: 280, height: 280 },
  L: { width: 360, height: 360 },
} as const

// ── Prefs path（即便 prefs 模块未 fork，userData 路径要先就位） ──
const PREFS_PATH = path.join(app.getPath('userData'), 'panda-on-desk-prefs.json')
const _initialPrefsLoad = prefsModule ? prefsModule.load(PREFS_PATH) : null

// ── 最小 settings 控制器 stub（prefs/settings-controller 未 fork 时的兜底） ──
// 真实实现待 P1-T5 落地；接口签名与 clawd `createSettingsController` 对齐，
// 仅暴露 main.ts 直接调用的 get/getSnapshot/applyUpdate/subscribe，让 4 BrowserWindow 注册路径可跑通。
function _stubSettingsController() {
  const _snap: Record<string, any> = {
    lang: 'en',
    showTray: true,
    showDock: true,
    size: 'P:25',
    miniMode: false,
    positionSaved: false,
    x: 0,
    y: 0,
    openAtLoginHydrated: false,
    manageClaudeHooksAutomatically: false,
    autoStartWithClaude: false,
    shortcuts: {},
    agents: { panda: { enabled: true, permissionsEnabled: true } },
  }
  const _subs = new Set<(snap: any) => void>()
  return {
    get(key: string) { return _snap[key] },
    getSnapshot() { return { ..._snap } },
    applyUpdate(key: string, value: any) {
      _snap[key] = value
      for (const fn of _subs) try { fn({ ..._snap }) } catch {}
    },
    subscribe(fn: (snap: any) => void) {
      _subs.add(fn)
      return () => _subs.delete(fn)
    },
  }
}

const _settingsController = settingsControllerMod
  ? settingsControllerMod.createSettingsController({
      prefsPath: PREFS_PATH,
      loadResult: _initialPrefsLoad,
      injectedDeps: {
        // panda 单 provider — 删除上游 startMonitorForAgent / stopMonitorForAgent /
        // clearSessionsByAgent / dismissPermissionsByAgent / installAutoStart 等多 agent 注入。
        // 仅保留与 4 窗 + 全局快捷键直接相关的 deps。
        setOpenAtLogin: _writeSystemOpenAtLogin,
        activateTheme: (id: string, variantId?: string, overrideMap?: any) =>
          _deferredActivateTheme(id, variantId, overrideMap),
        getThemeInfo: (id: string) => _deferredGetThemeInfo(id),
        removeThemeDir: (id: string) => _deferredRemoveThemeDir(id),
        globalShortcut,
        shortcutHandlers: {
          togglePet: () => togglePetVisibility(),
        },
        getShortcutFailure: (actionId: string) => getShortcutFailure(actionId),
        clearShortcutFailure: (actionId: string) => clearShortcutFailure(actionId),
      },
    })
  : _stubSettingsController()

// ── 跨平台 open-at-login（保留 panda 单 provider 路径） ──
function _writeSystemOpenAtLogin(enabled: boolean): void {
  if (isLinux) {
    const launchScript = path.join(__dirname, '..', 'launch.cjs')
    const execCmd = app.isPackaged
      ? `"${process.env.APPIMAGE || app.getPath('exe')}"`
      : `node "${launchScript}"`
    loginItemHelpers.linuxSetOpenAtLogin(enabled, { execCmd })
    return
  }
  app.setLoginItemSettings(
    loginItemHelpers.getLoginItemSettings({
      isPackaged: app.isPackaged,
      openAtLogin: enabled,
      execPath: process.execPath,
      appPath: app.getAppPath(),
    })
  )
}
function _readSystemOpenAtLogin(): boolean {
  if (isLinux) return loginItemHelpers.linuxGetOpenAtLogin()
  return app.getLoginItemSettings(
    app.isPackaged ? {} : { path: process.execPath, args: [app.getAppPath()] }
  ).openAtLogin
}

// ── Theme：active theme + 延迟绑定的 activateTheme/getThemeInfo/removeThemeDir ──
themeLoader.init(__dirname, app.getPath('userData'))
const _requestedThemeId = _settingsController.get('themeId') || 'panda'
let activeTheme = themeLoader.loadTheme(_requestedThemeId, {
  variantId: _settingsController.get('themeVariantId'),
})

function _deferredActivateTheme(id: string, variantId?: string, overrideMap?: any) {
  const next = themeLoader.loadTheme(id, { variantId, overrideMap })
  activeTheme = next
  return { themeId: next.themeId, variantId: next.variantId }
}
function _deferredGetThemeInfo(id: string) {
  return themeLoader.discoverThemes().find((t: any) => t.themeId === id) || null
}
function _deferredRemoveThemeDir(_id: string) {
  // TODO[P1-T5]: 接入 settings-actions 的 removeThemeDir
  return false
}

// ── Shortcut failure tracking（最小 stub） ─────────────────────────────────────
const _shortcutFailures = new Map<string, string>()
function getShortcutFailure(actionId: string) { return _shortcutFailures.get(actionId) || null }
function clearShortcutFailure(actionId: string) { _shortcutFailures.delete(actionId) }

// ── 模块级运行时状态（lang 等镜像缓存——subscriber 同步） ──────────────────────
let lang = _settingsController.get('lang')
let showTray = _settingsController.get('showTray')
let showDock = _settingsController.get('showDock')
let isQuitting = false
let dragLocked = false
let mouseOverPet = false
let idlePaused = false
let viewportOffsetY = 0
let themeReloadInProgress = false

// ── 4 类 BrowserWindow handle ─────────────────────────────────────────────────
let win: any = null            // ① pet 透明 overlay
let hitWin: any = null         // ② hit-region 输入窗
let settingsWindow: any = null // ③ settings panel
// ④ update-bubble —— 由 update-bubble.ts 内部持有 BrowserWindow（getBubbleWindow()）

// ── menu / state / focus / tick / updater / sessions（最小骨架） ───────────────
const sessions = new Map<string, any>()
const STATE_PRIORITY: Record<string, number> = {
  idle: 0, working: 5, waiting: 10, error: 15, complete: 20, notification: 25,
}

function getPrimaryWorkAreaSafe() {
  try { return screen.getPrimaryDisplay().workArea } catch { return null }
}
function getNearestWorkArea(p: { x: number; y: number }) {
  return findNearestWorkArea(p, screen ? screen.getAllDisplays() : []) || SYNTHETIC_WORK_AREA
}
function getCurrentPixelSize(workArea?: any) {
  const prefs = _settingsController.getSnapshot()
  const wa = workArea || getPrimaryWorkAreaSafe() || SYNTHETIC_WORK_AREA
  return getProportionalPixelSize(prefs.size, wa, SIZES)
}
function clampToScreenVisual(x: number, y: number, w: number, h: number) {
  const wa = getNearestWorkArea({ x: x + w / 2, y: y + h / 2 })
  return computeLooseClamp(x, y, w, h, wa)
}

// pet bounds 抽象（virtual vs physical 在 drag-position 模块内部处理）
let _petVirtualBounds: { x: number; y: number; width: number; height: number } | null = null
function getPetWindowBounds() {
  if (_petVirtualBounds) return _petVirtualBounds
  if (win && !win.isDestroyed()) return win.getBounds()
  return { x: 0, y: 0, width: 0, height: 0 }
}
function applyPetWindowBounds(b: { x: number; y: number; width: number; height: number }) {
  _petVirtualBounds = { ...b }
  if (win && !win.isDestroyed()) {
    materializeVirtualBounds(win, b)
  }
}
function getHitRectScreen(petBounds: { x: number; y: number; width: number; height: number }) {
  // [DESK-PET-VISIBLE-FIX 20260419] hitGeometry.getHitRectScreen 真实签名为 6 参（theme/bounds/state/file/hitBox/options）
  // 当前以 2 参调用，必返 null；为避免 main.ts:758 / :447 撞 'Cannot read properties of null'
  // 给一个基于 petBounds 的合理 fallback（与宠物窗 1:1 对齐，再外扩 20px 作 hit 边距）。
  const rect = hitGeometry.getHitRectScreen(petBounds as any, activeTheme as any) as
    | { left: number; top: number; right: number; bottom: number }
    | null
  if (rect && Number.isFinite(rect.left)) return rect
  const pad = 20
  const bx = Number.isFinite(petBounds?.x) ? petBounds.x : 100
  const by = Number.isFinite(petBounds?.y) ? petBounds.y : 100
  const bw = Number.isFinite(petBounds?.width) && petBounds.width > 0 ? petBounds.width : 200
  const bh = Number.isFinite(petBounds?.height) && petBounds.height > 0 ? petBounds.height : 200
  return {
    left: bx - pad,
    top: by - pad,
    right: bx + bw + pad,
    bottom: by + bh + pad,
  }
}
function isProportionalMode() {
  const sz = String(_settingsController.get('size') || '')
  return sz.startsWith('P:')
}
function hasStoredPositionThemeMismatch(_prefs: any) {
  // TODO[P1-T5]: 接入 visible-margins/theme 比对
  return false
}

// ── Sessions / state / focus / tick 子系统初始化（最小可启动）  ────────────────
const _stateCtx: any = {
  getCursorScreenPoint: () => screen.getCursorScreenPoint(),
  sendToRenderer: (...args: any[]) => sendToRenderer(...args),
  sendToHitWin: (...args: any[]) => sendToHitWin(...args),
  playSound: (_n: string) => {}, // TODO[P1-T8]: 接入 sound 子系统
  getActiveTheme: () => activeTheme,
  isAgentEnabled: (_id: string) => true,                      // 单 panda provider — 永远 enabled
  isAgentPermissionsEnabled: (_id: string) => true,
  hasAnyEnabledAgent: () => true,
  startWakePoll: () => {},
  stopWakePoll: () => {},
  detectRunningAgentProcesses: (_cb: any) => {},               // 单 provider — 不需要扫多 agent 进程
  buildSessionSubmenu: () => [],
}
const _state = initState(_stateCtx)

const _focus = initFocus({
  allowSetForegroundWindow: _allowSetForeground,
  isWin, isMac, isLinux,
})
const _tick = initTick({
  getWin: () => win,
  getHitWin: () => hitWin,
  getActiveTheme: () => activeTheme,
  isPaused: () => idlePaused,
  isMouseOverPet: () => mouseOverPet,
  state: _state,
})

// updater / menu / mini / server / permission / update-bubble 走延迟构造，避免 require 循环
let _menu: any = null
let _mini: any = null
let _server: any = null
let _perm: any = null
let _updateBubble: any = null
let _updater: any = null
// W1-T4：bridge IPC server handle（startBridgeServer 成功后填入；before-quit 清理）
let _bridgeHandle: { port: number; secret: string; broadcast: (msg: any) => void; close: () => Promise<void> } | null = null

// hwnd recovery / topmost watchdog（Windows） ─────────────────────────────────
let hwndRecoveryTimer: any = null
let _topmostWatchdog: any = null
function scheduleHwndRecovery() {
  if (!isWin) return
  if (hwndRecoveryTimer) return
  hwndRecoveryTimer = setTimeout(() => {
    hwndRecoveryTimer = null
    reassertWinTopmost()
  }, 250)
}
function reassertWinTopmost() {
  if (win && !win.isDestroyed()) win.setAlwaysOnTop(true, WIN_TOPMOST_LEVEL)
  if (hitWin && !hitWin.isDestroyed()) hitWin.setAlwaysOnTop(true, WIN_TOPMOST_LEVEL)
}
function guardAlwaysOnTop(w: any) {
  if (!isWin || !w || w.isDestroyed()) return
  w.on('blur', () => {
    try { w.setAlwaysOnTop(true, WIN_TOPMOST_LEVEL) } catch {}
  })
}
function startTopmostWatchdog() {
  if (!isWin || _topmostWatchdog) return
  _topmostWatchdog = setInterval(() => {
    try {
      if (win && !win.isDestroyed()) win.setAlwaysOnTop(true, WIN_TOPMOST_LEVEL)
      if (hitWin && !hitWin.isDestroyed()) hitWin.setAlwaysOnTop(true, WIN_TOPMOST_LEVEL)
      const updateBubbleWin = _updateBubble && _updateBubble.getBubbleWindow && _updateBubble.getBubbleWindow()
      if (updateBubbleWin && !updateBubbleWin.isDestroyed() && updateBubbleWin.isVisible()) {
        updateBubbleWin.setAlwaysOnTop(true, WIN_TOPMOST_LEVEL)
      }
    } catch {}
  }, 1500)
}
function stopTopmostWatchdog() {
  if (_topmostWatchdog) { clearInterval(_topmostWatchdog); _topmostWatchdog = null }
}

// ── macOS 可见性 / dock ────────────────────────────────────────────────────────
function reapplyMacVisibility() {
  if (!isMac) return
  const candidates = [win, hitWin].filter((w) => w && !w.isDestroyed())
  for (const w of candidates) {
    try { applyStationaryCollectionBehavior(w) } catch {}
  }
}
function applyDockVisibility() {
  if (!isMac || !app.dock) return
  if (_settingsController.get('showDock') === false) app.dock.hide()
  else app.dock.show()
}

// ── Renderer 通信 helpers ──────────────────────────────────────────────────────
function sendToRenderer(channel: string, ...args: any[]) {
  if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
    win.webContents.send(channel, ...args)
  }
}
function sendToHitWin(channel: string, ...args: any[]) {
  if (hitWin && !hitWin.isDestroyed() && hitWin.webContents && !hitWin.webContents.isDestroyed()) {
    hitWin.webContents.send(channel, ...args)
  }
}
// W1-T4：bridge POST /event → 转发给 hitWin renderer（preload 暴露 panda.onEvent，
// hit.html 内 handler 调 window.__pandaSetState 切 UI）。同时也广播给主 win 以兼容未来扩展。
function forwardBridgeEventToRenderer(event: any) {
  try {
    sendToHitWin('panda-event', event)
    sendToRenderer('panda-event', event)
  } catch (err) {
    // 静默：renderer 未就绪时不应阻塞 bridge ack
    console.warn('[panda-on-desk] forwardBridgeEventToRenderer failed:', (err as Error)?.message)
  }
}
function syncRendererStateAfterLoad() {
  sendToRenderer('state-change', _state.getCurrentState(), _state.getCurrentSvg())
}
function syncHitStateAfterLoad() {
  sendToHitWin('viewport-offset', viewportOffsetY)
}
function syncHitWin() {
  if (!hitWin || hitWin.isDestroyed()) return
  if (!win || win.isDestroyed()) return
  const petBounds = getPetWindowBounds()
  const hitRect = getHitRectScreen(petBounds)
  hitWin.setBounds({
    x: Math.round(hitRect.left),
    y: Math.round(hitRect.top),
    width: Math.round(hitRect.right - hitRect.left),
    height: Math.round(hitRect.bottom - hitRect.top),
  })
}
function repositionFloatingBubbles() {
  if (_perm && typeof _perm.repositionBubbles === 'function') _perm.repositionBubbles()
  if (_updateBubble && typeof _updateBubble.repositionUpdateBubble === 'function') _updateBubble.repositionUpdateBubble()
}

// pet 显隐
function togglePetVisibility() {
  if (!win || win.isDestroyed()) return
  if (win.isVisible()) {
    win.hide()
    if (hitWin && !hitWin.isDestroyed()) hitWin.hide()
  } else {
    win.showInactive()
    if (hitWin && !hitWin.isDestroyed()) hitWin.showInactive()
    reapplyMacVisibility()
  }
}

// ── 拖拽快照辅助 ───────────────────────────────────────────────────────────────
let _dragSnapshot: any = null
function beginDragSnapshot() {
  _dragSnapshot = createDragSnapshot(getPetWindowBounds(), screen ? screen.getAllDisplays() : [])
}
function clearDragSnapshot() { _dragSnapshot = null }
function moveWindowForDrag() {
  if (!_dragSnapshot || !win || win.isDestroyed()) return
  const cursor = screen.getCursorScreenPoint()
  const next = computeAnchoredDragBounds(_dragSnapshot, cursor, getLooseDragMargins(activeTheme))
  if (next) applyPetWindowBounds(next)
}
function checkMiniModeSnap() {
  if (_mini && typeof _mini.checkSnap === 'function') _mini.checkSnap()
}
function exitMiniMode() {
  if (_mini && typeof _mini.exitMiniMode === 'function') _mini.exitMiniMode()
}

// ── Stale cleanup / http server / monitor ticker ──────────────────────────────
function startMainTick() { if (_tick && typeof _tick.start === 'function') _tick.start() }
function startHttpServer() { if (_server && typeof _server.start === 'function') _server.start() }
function startStaleCleanup() { if (_state && typeof _state.startStaleCleanup === 'function') _state.startStaleCleanup() }
function initFocusHelper() { if (_focus && typeof _focus.init === 'function') _focus.init() }

// ── flushRuntimeStateToPrefs / contextMenu / tray helpers（占位） ──────────────
function flushRuntimeStateToPrefs() {
  if (!_petVirtualBounds || !win || win.isDestroyed()) return
  _settingsController.applyUpdate('x', _petVirtualBounds.x)
  _settingsController.applyUpdate('y', _petVirtualBounds.y)
  _settingsController.applyUpdate('positionSaved', true)
}
function buildContextMenu() {
  if (_menu && typeof _menu.buildContextMenu === 'function') _menu.buildContextMenu()
}
function showPetContextMenu() {
  if (_menu && typeof _menu.showContextMenu === 'function') _menu.showContextMenu()
}
function popupMenuAt(menu: any) {
  try { menu.popup({ window: win }) } catch {}
}
function createTray() {
  if (_menu && typeof _menu.createTray === 'function') _menu.createTray()
}
function ensureContextMenuOwner() {
  if (_menu && typeof _menu.ensureContextMenuOwner === 'function') _menu.ensureContextMenuOwner()
}
function focusTerminalWindow(pid: number, cwd?: string, editor?: string, pidChain?: number[]) {
  if (_focus && typeof _focus.focusTerminal === 'function') _focus.focusTerminal(pid, cwd, editor, pidChain)
}

// ── Permission / update-bubble 委托 ────────────────────────────────────────────
function showCodexNotifyBubble(_payload: any) { /* removed — codex 已删除 */ }
function clearCodexNotifyBubbles(_sid: string) { /* removed — codex 已删除 */ }

// ── update-bubble 拉起 ────────────────────────────────────────────────────────
function showUpdateBubble(payload: any) {
  if (_updateBubble && typeof _updateBubble.showUpdateBubble === 'function') {
    _updateBubble.showUpdateBubble(payload)
  }
}
function hideUpdateBubble() {
  if (_updateBubble && typeof _updateBubble.hideUpdateBubble === 'function') {
    _updateBubble.hideUpdateBubble()
  }
}
function syncUpdateBubbleVisibility() {
  if (_updateBubble && typeof _updateBubble.syncVisibility === 'function') {
    _updateBubble.syncVisibility()
  }
}
function handleUpdateBubbleHeight(event: any, height: number) {
  if (_updateBubble && typeof _updateBubble.handleUpdateBubbleHeight === 'function') {
    _updateBubble.handleUpdateBubbleHeight(event, height)
  }
}
function handleUpdateBubbleAction(event: any, actionId: string) {
  if (_updateBubble && typeof _updateBubble.handleUpdateBubbleAction === 'function') {
    _updateBubble.handleUpdateBubbleAction(event, actionId)
  }
}

// ── Update session（Phase 1：仅 panda agent） ─────────────────────────────────
function updateSession(sid: string, state: string, event?: any, extra: any = {}) {
  if (_state && typeof _state.updateSession === 'function') {
    _state.updateSession(sid, state, event, { ...extra, agentId: 'panda' })
  } else {
    sessions.set(sid, { state, ...extra, agentId: 'panda', updatedAt: Date.now() })
  }
}

// ── 持久 globalShortcut 注册 ───────────────────────────────────────────────────
function registerPersistentShortcutsFromSettings() {
  const snap = _settingsController.getSnapshot()
  const shortcuts = (snap && snap.shortcuts) || {}
  for (const actionId of Object.keys(SHORTCUT_ACTIONS)) {
    const meta = SHORTCUT_ACTIONS[actionId]
    if (!meta || !meta.persistent) continue
    const accel = shortcuts[actionId] || meta.defaultAccelerator
    if (!accel) continue
    const handler = actionId === 'togglePet' ? togglePetVisibility : null
    if (typeof handler !== 'function') continue
    try {
      const ok = globalShortcut.register(accel, handler)
      if (!ok) _shortcutFailures.set(actionId, 'register-returned-false')
    } catch (err) {
      _shortcutFailures.set(actionId, (err as Error).message)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings panel BrowserWindow（窗 ③） — 单实例非 modal + 系统标题栏
// ─────────────────────────────────────────────────────────────────────────────
function getSettingsWindowIcon() {
  return getSettingsWindowIconPath({
    platform: process.platform,
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    appDir: path.join(__dirname, '..'),
    existsSync: fs.existsSync,
  })
}

function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (settingsWindow.isMinimized()) settingsWindow.restore()
    settingsWindow.show()
    settingsWindow.focus()
    return
  }
  const iconPath = getSettingsWindowIcon()
  const opts: any = {
    width: 800,
    height: 560,
    minWidth: 640,
    minHeight: 480,
    show: false,
    frame: true,
    transparent: false,
    resizable: true,
    minimizable: true,
    maximizable: true,
    skipTaskbar: false,
    alwaysOnTop: false,
    title: 'panda-on-desk Settings',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1c1f' : '#f5f5f7',
    webPreferences: {
      preload: path.join(__dirname, 'preload', 'settings.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  }
  if (iconPath) opts.icon = iconPath
  settingsWindow = new BrowserWindow(opts)
  settingsWindow.setMenuBarVisibility(false)
  // TODO[P1-T6]: settings.html 需要在 renderer 4 窗任务里 fork 落地
  const settingsHtml = path.join(__dirname, '..', 'renderer', 'settings.html')
  if (fs.existsSync(settingsHtml)) {
    settingsWindow.loadFile(settingsHtml)
  } else {
    settingsWindow.loadURL('data:text/html,<body><h1>panda-on-desk settings (P1-T6 待补)</h1></body>')
  }
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show()
    settingsWindow.focus()
  })
  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 主 createWindow —— pet (窗 ①) + hit-region (窗 ②)
// ─────────────────────────────────────────────────────────────────────────────
function createWindow() {
  const prefs = _settingsController.getSnapshot()

  // Legacy S/M/L → P:N 迁移（保留上游同名分支）
  if ((SIZES as any)[prefs.size]) {
    const wa = getPrimaryWorkAreaSafe() || SYNTHETIC_WORK_AREA
    const px = (SIZES as any)[prefs.size].width
    const ratio = Math.round((px / wa.width) * 100)
    const migrated = `P:${Math.max(1, Math.min(75, ratio))}`
    _settingsController.applyUpdate('size', migrated)
  }

  if (isMac) applyDockVisibility()

  const launchSizingWorkArea = getLaunchSizingWorkArea(
    prefs,
    getPrimaryWorkAreaSafe() || SYNTHETIC_WORK_AREA,
    getNearestWorkArea
  )
  const size = getCurrentPixelSize(launchSizingWorkArea)

  let startBounds: { x: number; y: number; width: number; height: number }
  if (prefs.miniMode && _mini && typeof _mini.restoreFromPrefs === 'function') {
    startBounds = _mini.restoreFromPrefs(prefs, size)
  } else if (prefs.positionSaved) {
    startBounds = { x: prefs.x, y: prefs.y, width: size.width, height: size.height }
  } else {
    const workArea = getPrimaryWorkAreaSafe() || SYNTHETIC_WORK_AREA
    startBounds = {
      x: workArea.x + workArea.width - size.width - 20,
      y: workArea.y + workArea.height - size.height - 20,
      width: size.width,
      height: size.height,
    }
  }
  const startupNeedsRegularize =
    (prefs.positionSaved || prefs.miniMode) && hasStoredPositionThemeMismatch(prefs)

  // ── 窗 ① pet 透明 overlay ──
  win = new BrowserWindow({
    width: size.width,
    height: size.height,
    x: startBounds.x,
    y: startBounds.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    fullscreenable: false,
    enableLargerThanScreen: true,
    ...(isLinux ? { type: LINUX_WINDOW_TYPE } : {}),
    ...(isMac ? { type: 'panel', roundedCorners: false } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload', 'main.js'),
      backgroundThrottling: false,
      nodeIntegration: false,
      contextIsolation: true,
      additionalArguments: ['--theme-config=' + JSON.stringify(themeLoader.getRendererConfig())],
    },
  })
  win.setFocusable(false)

  if (isLinux) {
    win.on('close', (event: any) => {
      if (!isQuitting) {
        event.preventDefault()
        if (!win.isVisible()) win.showInactive()
      }
    })
    win.on('unresponsive', () => {
      if (isQuitting) return
      console.warn('[panda-on-desk] renderer unresponsive — reloading')
      win.webContents.reload()
    })
  }
  if (isWin) win.setAlwaysOnTop(true, WIN_TOPMOST_LEVEL)

  // v2.24.3 hotfix: 路径改为 src/renderer/hit.html（hit.html 已含 panda SVG + drag CSS）
  // 旧路径 '../renderer/' 错位一级（main.js 在 src/，renderer/ 也在 src/，应直接 './renderer/'）
  // fallback URL 也内嵌完整 panda SVG（双保险，无 hit.html 也显示宠物）
  const hitHtmlPath = path.join(__dirname, 'renderer', 'hit.html')
  if (fs.existsSync(hitHtmlPath)) {
    win.loadFile(hitHtmlPath)
  } else {
    // why: 双保险 fallback — 即使 hit.html 缺失也能看到 panda 形象 + 拖拽
    win.loadURL(
      'data:text/html;charset=utf-8,' + encodeURIComponent(
        '<!DOCTYPE html><html><head><style>' +
        '*{margin:0;padding:0;box-sizing:border-box}' +
        'html,body{width:100%;height:100%;overflow:hidden;background:transparent;-webkit-app-region:drag;user-select:none}' +
        '#pet{width:100%;height:100%;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3));cursor:grab}' +
        '#pet:active{cursor:grabbing}' +
        '#pet svg{width:80%;height:80%;animation:breath 3s ease-in-out infinite}' +
        '@keyframes breath{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}' +
        '</style></head><body><div id="pet">' +
        '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
        '<ellipse cx="55" cy="55" rx="22" ry="26" fill="#1a1a1a"/>' +
        '<ellipse cx="145" cy="55" rx="22" ry="26" fill="#1a1a1a"/>' +
        '<circle cx="100" cy="105" r="65" fill="#f5f5f5" stroke="#222" stroke-width="3"/>' +
        '<ellipse cx="75" cy="100" rx="16" ry="20" fill="#1a1a1a" transform="rotate(-15 75 100)"/>' +
        '<ellipse cx="125" cy="100" rx="16" ry="20" fill="#1a1a1a" transform="rotate(15 125 100)"/>' +
        '<circle cx="75" cy="100" r="5" fill="#fff"/>' +
        '<circle cx="125" cy="100" r="5" fill="#fff"/>' +
        '<circle cx="76" cy="101" r="2.5" fill="#000"/>' +
        '<circle cx="126" cy="101" r="2.5" fill="#000"/>' +
        '<ellipse cx="100" cy="125" rx="6" ry="4" fill="#1a1a1a"/>' +
        '<path d="M100 130 Q92 140 85 136 M100 130 Q108 140 115 136" stroke="#1a1a1a" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '</svg></div></body></html>'
      )
    )
  }
  applyPetWindowBounds(startBounds)
  if (startupNeedsRegularize) {
    const clamped = computeFinalDragBounds(getPetWindowBounds(), size, clampToScreenVisual)
    if (clamped) applyPetWindowBounds(clamped)
  }
  win.showInactive()
  if (isLinux) win.setSkipTaskbar(true)
  reapplyMacVisibility()
  if (isMac) {
    setTimeout(() => {
      if (!win || win.isDestroyed()) return
      applyDockVisibility()
    }, 0)
  }

  buildContextMenu()
  if (!isMac || showTray) createTray()
  ensureContextMenuOwner()

  // ── 窗 ② hitWin 输入窗（吞所有 pointer 事件） ──
  {
    const initBounds = getPetWindowBounds()
    const initHit = getHitRectScreen(initBounds)
    const hx = Math.round(initHit.left)
    const hy = Math.round(initHit.top)
    const hw = Math.round(initHit.right - initHit.left)
    const hh = Math.round(initHit.bottom - initHit.top)

    hitWin = new BrowserWindow({
      width: hw,
      height: hh,
      x: hx,
      y: hy,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      hasShadow: false,
      fullscreenable: false,
      enableLargerThanScreen: true,
      ...(isLinux ? { type: LINUX_WINDOW_TYPE } : {}),
      ...(isMac ? { type: 'panel', roundedCorners: false } : {}),
      focusable: !isLinux, // Windows 输入路由 bug workaround
      webPreferences: {
        preload: path.join(__dirname, 'preload', 'hit.js'),
        backgroundThrottling: false,
        nodeIntegration: false,
        contextIsolation: true,
        additionalArguments: [
          '--hit-theme-config=' + JSON.stringify(themeLoader.getHitRendererConfig()),
        ],
      },
    })
    try { hitWin.setShape([{ x: 0, y: 0, width: hw, height: hh }]) } catch {}
    hitWin.setIgnoreMouseEvents(false) // PERMANENT — 永不切换
    if (isMac) hitWin.setFocusable(false)
    hitWin.showInactive()
    if (isLinux) hitWin.setSkipTaskbar(true)
    if (isWin) hitWin.setAlwaysOnTop(true, WIN_TOPMOST_LEVEL)
    reapplyMacVisibility()
    const hitHtml = path.join(__dirname, '..', 'renderer', 'hit.html')
    if (fs.existsSync(hitHtml)) {
      hitWin.loadFile(hitHtml)
    } else {
      hitWin.loadURL('data:text/html,<body style="margin:0;background:transparent"></body>')
    }
    if (isWin) guardAlwaysOnTop(hitWin)

    const syncFloatingWindows = () => {
      syncHitWin()
      repositionFloatingBubbles()
    }
    win.on('move', syncFloatingWindows)
    win.on('resize', syncFloatingWindows)

    hitWin.webContents.on('did-finish-load', () => {
      sendToHitWin('theme-config', themeLoader.getHitRendererConfig())
      if (themeReloadInProgress) return
      syncHitStateAfterLoad()
    })
    hitWin.webContents.on('render-process-gone', (_event: any, details: any) => {
      console.error('[panda-on-desk] hitWin renderer crashed:', details && details.reason)
      hitWin.webContents.reload()
    })
  }

  // ── pet/hit ipcMain handlers（保留所有非 multi-agent 通道） ──
  ipcMain.on('show-context-menu', showPetContextMenu)
  ipcMain.on('drag-move', () => moveWindowForDrag())
  ipcMain.on('pause-cursor-polling', () => { idlePaused = true })
  ipcMain.on('resume-from-reaction', () => {
    idlePaused = false
    if (_mini && _mini.getMiniTransitioning && _mini.getMiniTransitioning()) return
    sendToRenderer('state-change', _state.getCurrentState(), _state.getCurrentSvg())
  })
  ipcMain.on('drag-lock', (_event: any, locked: boolean) => {
    dragLocked = !!locked
    if (locked) {
      mouseOverPet = true
      beginDragSnapshot()
    } else {
      clearDragSnapshot()
      syncHitWin()
    }
  })
  ipcMain.on('start-drag-reaction', () => sendToRenderer('start-drag-reaction'))
  ipcMain.on('end-drag-reaction', () => sendToRenderer('end-drag-reaction'))
  ipcMain.on('play-click-reaction', (_e: any, svg: string, duration: number) => {
    sendToRenderer('play-click-reaction', svg, duration)
  })
  ipcMain.on('drag-end', () => {
    try {
      if (!(_mini && _mini.getMiniMode && _mini.getMiniMode()) && !(_mini && _mini.getMiniTransitioning && _mini.getMiniTransitioning())) {
        checkMiniModeSnap()
        if (_mini && _mini.getMiniMode && _mini.getMiniMode()) return
        if (_mini && _mini.getMiniTransitioning && _mini.getMiniTransitioning()) return
        if (win && !win.isDestroyed()) {
          const size2 = getCurrentPixelSize()
          const virtualBounds = getPetWindowBounds()
          const clamped = computeFinalDragBounds(virtualBounds, size2, clampToScreenVisual)
          if (clamped) applyPetWindowBounds(clamped)
          reassertWinTopmost()
          scheduleHwndRecovery()
          syncHitWin()
          repositionFloatingBubbles()
        }
      }
    } finally {
      dragLocked = false
      clearDragSnapshot()
    }
  })
  ipcMain.on('exit-mini-mode', () => {
    if (_mini && _mini.getMiniMode && _mini.getMiniMode()) exitMiniMode()
  })
  ipcMain.on('focus-terminal', () => {
    let best: any = null
    let bestTime = 0
    let bestPriority = -1
    for (const [, s] of sessions as any) {
      if (!s.sourcePid) continue
      const pri = STATE_PRIORITY[s.state] || 0
      if (pri > bestPriority || (pri === bestPriority && s.updatedAt > bestTime)) {
        best = s
        bestTime = s.updatedAt
        bestPriority = pri
      }
    }
    if (best) focusTerminalWindow(best.sourcePid, best.cwd, best.editor, best.pidChain)
  })
  ipcMain.on('show-session-menu', () => {
    if (_menu && typeof _menu.buildSessionSubmenu === 'function') {
      popupMenuAt(Menu.buildFromTemplate(_menu.buildSessionSubmenu()))
    }
  })

  // bubble height / decide / update-bubble height-action
  ipcMain.on('bubble-height', (event: any, height: number) => {
    if (_perm && typeof _perm.handleBubbleHeight === 'function') _perm.handleBubbleHeight(event, height)
  })
  ipcMain.on('permission-decide', (event: any, behavior: any) => {
    if (_perm && typeof _perm.handleDecide === 'function') _perm.handleDecide(event, behavior)
  })
  ipcMain.on('update-bubble-height', (event: any, height: number) =>
    handleUpdateBubbleHeight(event, height)
  )
  ipcMain.on('update-bubble-action', (event: any, actionId: string) =>
    handleUpdateBubbleAction(event, actionId)
  )

  initFocusHelper()
  startMainTick()
  startHttpServer()
  startStaleCleanup()

  win.webContents.on('did-finish-load', () => {
    sendToRenderer('theme-config', themeLoader.getRendererConfig())
    sendToRenderer('viewport-offset', viewportOffsetY)
    if (themeReloadInProgress) return
    syncRendererStateAfterLoad()
  })

  win.webContents.on('render-process-gone', (_event: any, details: any) => {
    console.error('[panda-on-desk] renderer crashed:', details && details.reason)
    dragLocked = false
    idlePaused = false
    mouseOverPet = false
    win.webContents.reload()
  })

  guardAlwaysOnTop(win)
  startTopmostWatchdog()

  // ── 显示拓扑变化 → 重新 clamp ──
  screen.on('display-metrics-changed', () => {
    reapplyMacVisibility()
    if (!win || win.isDestroyed()) return
    if (_mini && _mini.getMiniTransitioning && _mini.getMiniTransitioning()) return
    if (_mini && _mini.getMiniMode && _mini.getMiniMode()) {
      if (typeof _mini.handleDisplayChange === 'function') _mini.handleDisplayChange()
      return
    }
    const size3 = getCurrentPixelSize()
    const { x, y } = getPetWindowBounds()
    const clamped = clampToScreenVisual(x, y, size3.width, size3.height)
    if (isProportionalMode() || clamped.x !== x || clamped.y !== y) {
      applyPetWindowBounds({ ...clamped, width: size3.width, height: size3.height })
      syncHitWin()
      repositionFloatingBubbles()
    }
  })
  screen.on('display-removed', () => {
    reapplyMacVisibility()
    if (!win || win.isDestroyed()) return
    if (_mini && _mini.getMiniTransitioning && _mini.getMiniTransitioning()) return
    if (_mini && _mini.getMiniMode && _mini.getMiniMode()) {
      exitMiniMode()
      return
    }
    const size4 = getCurrentPixelSize()
    const { x, y } = getPetWindowBounds()
    const clamped = clampToScreenVisual(x, y, size4.width, size4.height)
    applyPetWindowBounds({ ...clamped, width: size4.width, height: size4.height })
    syncHitWin()
    repositionFloatingBubbles()
  })
  screen.on('display-added', () => {
    reapplyMacVisibility()
    repositionFloatingBubbles()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// settings:* / 通用 ipc handlers（保留非 agent 通道）
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.handle('settings:get-snapshot', () => _settingsController.getSnapshot())
ipcMain.handle('settings:update', (_event: any, key: string, value: any) => {
  _settingsController.applyUpdate(key, value)
  return { status: 'ok' }
})
ipcMain.handle('settings:open-external', async (_event: any, url: string) => {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return { status: 'error', message: 'Invalid URL' }
  }
  try {
    await shell.openExternal(url)
    return { status: 'ok' }
  } catch (err) {
    return { status: 'error', message: (err && (err as Error).message) || String(err) }
  }
})
ipcMain.handle('settings:open-window', () => { openSettingsWindow(); return { status: 'ok' } })

// ── First-run hydrate openAtLogin from system → prefs ──
function hydrateSystemBackedSettings() {
  if (_settingsController.get('openAtLoginHydrated')) return
  try {
    const sysOpen = _readSystemOpenAtLogin()
    _settingsController.applyUpdate('openAtLogin', !!sysOpen)
  } catch (err) {
    console.warn('[panda-on-desk] readSystemOpenAtLogin failed:', (err as Error).message)
  }
  _settingsController.applyUpdate('openAtLoginHydrated', true)
}

// ─────────────────────────────────────────────────────────────────────────────
// 单实例锁 + 生命周期
// ─────────────────────────────────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win) {
      win.showInactive()
      if (isLinux) win.setSkipTaskbar(true)
    }
    if (hitWin && !hitWin.isDestroyed()) {
      hitWin.showInactive()
      if (isLinux) hitWin.setSkipTaskbar(true)
    }
    reapplyMacVisibility()
  })

  if (isMac && app.dock) {
    if (_settingsController.get('showDock') === false) app.dock.hide()
  }

  app.whenReady().then(() => {
    hydrateSystemBackedSettings()
    createWindow()
    registerPersistentShortcutsFromSettings()

    // ── 删除：上游 codexLogMonitor / geminiLogMonitor 启动段（panda 单 provider 不需要） ──
    // ── 删除：installTerminalFocusExtension（VS Code/Cursor agent 联动，单 provider 阶段不做） ──

    // 业务模块延迟构造（待对应 P1-T 落地后接入真实实现）
    if (initMenu) {
      _menu = initMenu({
        get win() { return win },
        get hitWin() { return hitWin },
        get isQuitting() { return isQuitting },
        set isQuitting(v: boolean) { isQuitting = v },
        lang,
        showTray,
        showDock,
        getActiveTheme: () => activeTheme,
        getActiveThemeCapabilities: () => activeTheme && activeTheme.capabilities,
        sendToRenderer,
        sendToHitWin,
        togglePetVisibility,
        openSettingsWindow,
        getCurrentPixelSize,
        getMiniMode: () => (_mini && _mini.getMiniMode && _mini.getMiniMode()) || false,
        reapplyMacVisibility,
        applyDockVisibility,
        i18nLang: () => lang,
        // panda 单 provider — 上游 menu.ctx.agents/registry 收敛为单条 panda
        agents: { panda: { id: 'panda', label: 'Panda', enabled: true } },
        getActiveAgentId: () => 'panda',
      })
    }

    if (initUpdater) {
      _updater = initUpdater({
        showUpdateBubble,
        hideUpdateBubble,
        sendToRenderer,
      })
      if (_updater && typeof _updater.setupAutoUpdater === 'function') {
        try { _updater.setupAutoUpdater() } catch (err) {
          console.warn('[panda-on-desk] setupAutoUpdater failed:', (err as Error).message)
        }
      }
    }

    // _server / _perm / _mini / _updateBubble — 等 P1-T4 / P1-T8 fork 落地后挂入：
    if (serverMod) _server = serverMod({ updateSession, getActiveTheme: () => activeTheme })
    if (permissionMod) _perm = permissionMod({ getWin: () => win, getHitWin: () => hitWin, sendToRenderer })
    if (miniMod) _mini = miniMod({ getWin: () => win, getHitWin: () => hitWin, sendToRenderer })
    if (updateBubbleMod) {
      _updateBubble = updateBubbleMod({
        getWin: () => win,
        getHitWin: () => hitWin,
        sendToRenderer,
        getActiveTheme: () => activeTheme,
      })
    }

    // ── W2-T4：注入 badge renderer notifier — manager 内 publishSnapshot 时推 'badge:update' 给 hitWin ──
    // 失败容错：缺失 manager 不阻挡主路径，仅退化为无 badge 显示。
    if (badgeManagerMod && typeof badgeManagerMod.setBadgeRendererNotifier === 'function') {
      try {
        badgeManagerMod.setBadgeRendererNotifier((channel, payload) => sendToHitWin(channel, payload))
        console.log('[panda-on-desk] badge renderer notifier wired (channel: badge:update)')
      } catch (err) {
        console.warn('[panda-on-desk] setBadgeRendererNotifier failed:', (err as Error)?.message)
      }
    }

    // ── W1-T4：拉起 bridge IPC server（panda CLI ↔ panda-on-desk 单向桥 + SSE 反向） ──
    // 端口 1455+ 自动探测；secret 32 字节随机；落盘 ~/.pandacc/runtime.json。
    // 失败容错：bridge 拉起失败不影响 4 BrowserWindow 主路径，只是 panda CLI 推送会 ECONNREFUSED 静默吞。
    if (bridgeServerMod && typeof bridgeServerMod.startBridgeServer === 'function') {
      try {
        const appVersion = (() => {
          try { return app.getVersion() } catch { return undefined }
        })()
        const startPromise = bridgeServerMod.startBridgeServer({
          // bridge 收到 /event → 转发给 hitWin renderer 触发 UI
          onEvent: (event: any) => forwardBridgeEventToRenderer(event),
          appVersion,
        })
        startPromise.then(handle => {
          _bridgeHandle = handle
          console.log(`[panda-on-desk] bridge IPC server listening on 127.0.0.1:${handle.port}`)
        }).catch((err: Error) => {
          console.warn('[panda-on-desk] bridge IPC server start failed:', err && err.message)
        })
      } catch (err) {
        console.warn('[panda-on-desk] startBridgeServer threw synchronously:', (err as Error)?.message)
      }
    }
  })

  app.on('before-quit', () => {
    isQuitting = true
    flushRuntimeStateToPrefs()
    globalShortcut.unregisterAll()
    if (_perm && typeof _perm.cleanup === 'function') _perm.cleanup()
    if (_server && typeof _server.cleanup === 'function') _server.cleanup()
    if (_updateBubble && typeof _updateBubble.cleanup === 'function') _updateBubble.cleanup()
    if (_state && typeof _state.cleanup === 'function') _state.cleanup()
    if (_tick && typeof _tick.cleanup === 'function') _tick.cleanup()
    if (_mini && typeof _mini.cleanup === 'function') _mini.cleanup()
    stopTopmostWatchdog()
    if (hwndRecoveryTimer) { clearTimeout(hwndRecoveryTimer); hwndRecoveryTimer = null }
    if (_focus && typeof _focus.cleanup === 'function') _focus.cleanup()
    if (hitWin && !hitWin.isDestroyed()) hitWin.destroy()
    // W1-T4：bridge IPC server 关闭 + runtime.json 清理（防 panda CLI 持续连旧端口）
    if (_bridgeHandle && typeof _bridgeHandle.close === 'function') {
      try { _bridgeHandle.close() } catch (err) {
        console.warn('[panda-on-desk] bridge close failed:', (err as Error)?.message)
      }
      _bridgeHandle = null
    }
  })

  app.on('window-all-closed', () => {
    if (!isQuitting && process.platform !== 'darwin') {
      // pet 窗口可能被用户隐藏；维持 Electron 宿主进程存活直到 before-quit 触发
      return
    }
    app.quit()
  })

  app.on('activate', () => {
    // macOS: dock 重新激活时恢复 4 窗
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else if (win && !win.isDestroyed() && !win.isVisible()) {
      win.showInactive()
      if (hitWin && !hitWin.isDestroyed()) hitWin.showInactive()
      reapplyMacVisibility()
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports（test fixture / 反向探针 — 仅暴露非 anthropic 路径的 helpers）
// ─────────────────────────────────────────────────────────────────────────────
export const __test = {
  getPetWindowBounds,
  applyPetWindowBounds,
  getCurrentPixelSize,
  clampToScreenVisual,
  isProportionalMode,
  togglePetVisibility,
  openSettingsWindow,
  showUpdateBubble,
  hideUpdateBubble,
  registerPersistentShortcutsFromSettings,
}
