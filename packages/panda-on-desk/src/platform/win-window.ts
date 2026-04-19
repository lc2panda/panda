// Input: Windows PID（需前台化的目标进程）/ BrowserWindow（可选，保留顶置补强入口）
// Output: 调用 user32.dll AllowSetForegroundWindow(pid) 提权 + 顶置策略；非 Win32 平台 no-op
// Pos: panda-on-desk 平台层 — Windows Win32 FFI 入口（被 main.ts _allowSetForeground / platform/index.ts 调用）
//
// Forked from clawd-on-desk@4b07658:src/main.js (MIT License) - Win32 FFI extracted
// 上游 main.js L37-49 的 koffi FFI 初始化 + L250-252 的 AllowSetForegroundWindow 调用点
// 整体抽离到独立模块，避免 main.ts 一个 god file 承载所有平台分支。
//
// [NEW-FILE:#20260419-P1-12]
//
// 一旦此处签名变更，请同步更新：
//   · platform/index.ts 中 win32 分发分支
//   · ../main.ts 中 _allowSetForeground 与 guardAlwaysOnTop / reassertWinTopmost 调用点

/* eslint-disable @typescript-eslint/no-require-imports */

const isWin = process.platform === 'win32'

// ── Win32 topmost 策略常量（与 main.ts 中 WIN_TOPMOST_LEVEL 对齐） ──
//
// Electron BrowserWindow.setAlwaysOnTop(flag, level) 支持的 level 取值中，
// `pop-up-menu` 高于 `taskbar` 与 `modal-panel`，可防止被 shell UI 盖住。
export const WIN_TOPMOST_LEVEL = 'pop-up-menu' as const

// ── user32.dll 函数指针缓存 ──
let _allowSetForegroundFn: ((pid: number) => boolean) | null = null
let _warnedInitFailure = false

/**
 * 延迟加载 user32.dll → AllowSetForegroundWindow(dwProcessId)。
 *
 * 返回 null 表示 koffi 不可用（开发机 / 非 Win 平台 / 依赖缺失）；调用方必须容错。
 * 初始化失败仅 warn 一次，避免刷日志。
 */
function loadAllowSetForeground(): ((pid: number) => boolean) | null {
  if (!isWin) return null
  if (_allowSetForegroundFn) return _allowSetForegroundFn
  try {
    const koffi = require('koffi')
    const user32 = koffi.load('user32.dll')
    // 签名来自 MSDN: BOOL AllowSetForegroundWindow(DWORD dwProcessId);
    const fn = user32.func(
      'bool __stdcall AllowSetForegroundWindow(int dwProcessId)',
    )
    _allowSetForegroundFn = (pid: number) => {
      try {
        return Boolean(fn(pid))
      } catch (err) {
        console.warn(
          '[panda-on-desk] AllowSetForegroundWindow invocation failed:',
          (err as Error).message,
        )
        return false
      }
    }
    return _allowSetForegroundFn
  } catch (err) {
    if (!_warnedInitFailure) {
      console.warn(
        '[panda-on-desk] koffi/AllowSetForegroundWindow not available:',
        (err as Error).message,
      )
      _warnedInitFailure = true
    }
    return null
  }
}

/**
 * Windows 前台窗口提权：允许指定 PID 在后续 SetForegroundWindow 中获得前台焦点。
 *
 * 调用语义：MSDN `AllowSetForegroundWindow` —— 当前进程必须处于“有前台权利”
 *   （刚接收过用户输入）时调用方可生效；因此主进程一定要在 ipcMain 收到
 *   用户事件的同一 tick 内委派。
 *
 * 非 Win32 平台、FFI 加载失败、或非法 pid，一律安全返回 false。
 */
export function allowSetForegroundWindow(pid: number): boolean {
  if (!isWin) return false
  if (!Number.isFinite(pid) || pid <= 0) return false
  const fn = loadAllowSetForeground()
  if (!fn) return false
  return fn(pid)
}

/**
 * Windows 顶置补强：按 `pop-up-menu` level 重新声明 alwaysOnTop。
 *
 * 与 main.ts reassertWinTopmost() 对齐 —— 当 hwnd 失效 / 焦点外移后
 * 需要重新抬起 pet/hit overlay。
 */
export function reassertTopmost(browserWindow: any): boolean {
  if (!isWin) return false
  if (!browserWindow || browserWindow.isDestroyed()) return false
  try {
    browserWindow.setAlwaysOnTop(true, WIN_TOPMOST_LEVEL)
    return true
  } catch (err) {
    console.warn(
      '[panda-on-desk] reassertTopmost failed:',
      (err as Error).message,
    )
    return false
  }
}

/**
 * BrowserWindow 创建后立刻挂 blur → reassert 顶置的守卫。
 *
 * 对应 main.ts guardAlwaysOnTop() —— 上游 Windows 特有的 hwnd 抢焦行为。
 */
export function guardAlwaysOnTop(browserWindow: any): void {
  if (!isWin) return
  if (!browserWindow || browserWindow.isDestroyed()) return
  try {
    browserWindow.on('blur', () => {
      try {
        browserWindow.setAlwaysOnTop(true, WIN_TOPMOST_LEVEL)
      } catch {}
    })
  } catch (err) {
    console.warn(
      '[panda-on-desk] guardAlwaysOnTop failed:',
      (err as Error).message,
    )
  }
}

/**
 * 诊断导出：供 main.ts 判断 FFI 是否就绪，从而选择 inline 兜底路径。
 */
export function isFfiReady(): boolean {
  if (!isWin) return false
  return loadAllowSetForeground() !== null
}
