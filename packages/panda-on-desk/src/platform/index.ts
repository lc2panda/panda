// Input: Electron BrowserWindow + 当前 process.platform
// Output: 统一 applyPlatformSpecific(window) 接口；按 darwin / win32 / linux 动态分发到对应平台模块
// Pos: panda-on-desk 平台层入口 —— 对外只暴露一个 applyPlatformSpecific，主进程不必散落 if (isMac) ...
//
// [NEW-FILE:#20260419-P1-14]
//
// 设计动机：
//   · main.ts 内已有 reapplyMacVisibility() / reassertWinTopmost() / guardAlwaysOnTop() 等散点调用；
//     P1-T7 收尾通过本 dispatcher 把“窗口创建后必跑一遍的平台 tweak”收敛成一行 applyPlatformSpecific(win)；
//   · 动态 require —— 非当前平台模块依然 require 进 V8（TS 编译需要），但 platform 守卫确保 koffi.load
//     不会真正发起 dlopen（避免在 win11 上 require mac-window 时炸 libobjc.A.dylib 缺失）。
//
// 一旦此处签名变更，请同步更新：
//   · ../main.ts 中 createWindow() 后调用 applyPlatformSpecific(win) / applyPlatformSpecific(hitWin)
//   · test/platform.test.ts 平台 dispatch 用例

/* eslint-disable @typescript-eslint/no-require-imports */

import {
  applyStationaryCollectionBehavior,
  applyLSUIElement,
  applyVibrancy,
} from './mac-window'
import {
  allowSetForegroundWindow,
  reassertTopmost,
  guardAlwaysOnTop,
  isFfiReady,
  WIN_TOPMOST_LEVEL,
} from './win-window'
import { applyLinuxX11Tweaks, isWaylandSession } from './linux-x11'

export type PlatformId = 'darwin' | 'win32' | 'linux' | 'unknown'

/**
 * 当前进程平台标识 —— 与 process.platform 同义但收敛到固定枚举。
 */
export function getPlatformId(): PlatformId {
  switch (process.platform) {
    case 'darwin':
      return 'darwin'
    case 'win32':
      return 'win32'
    case 'linux':
      return 'linux'
    default:
      return 'unknown'
  }
}

/**
 * 平台分发的统一入口：在每个 BrowserWindow 创建后调用一次。
 *
 * 各平台分支：
 *   · darwin → applyStationaryCollectionBehavior（NSWindow stationary collection）
 *   · win32  → guardAlwaysOnTop + reassertTopmost（Win11 顶置防抢）
 *   · linux  → applyLinuxX11Tweaks（Phase 1 no-op，预留 Wayland 路径）
 *
 * 任意分支抛错都被 swallow，保证主进程窗口创建路径不被平台特殊化破坏。
 *
 * @returns true 表示至少有一项平台 tweak 成功；false 表示无任何变更（含失败 / no-op）
 */
export function applyPlatformSpecific(browserWindow: any): boolean {
  if (!browserWindow || (typeof browserWindow.isDestroyed === 'function' && browserWindow.isDestroyed())) {
    return false
  }
  const platform = getPlatformId()
  try {
    switch (platform) {
      case 'darwin':
        return applyStationaryCollectionBehavior(browserWindow)
      case 'win32': {
        guardAlwaysOnTop(browserWindow)
        return reassertTopmost(browserWindow)
      }
      case 'linux':
        return applyLinuxX11Tweaks(browserWindow)
      default:
        return false
    }
  } catch (err) {
    console.warn(
      `[panda-on-desk] applyPlatformSpecific(${platform}) failed:`,
      (err as Error).message,
    )
    return false
  }
}

// ── Re-exports（让上层 import { allowSetForegroundWindow } from '@panda/desk/platform' 直通） ──
export {
  // macOS
  applyStationaryCollectionBehavior,
  applyLSUIElement,
  applyVibrancy,
  // Windows
  allowSetForegroundWindow,
  reassertTopmost,
  guardAlwaysOnTop,
  isFfiReady,
  WIN_TOPMOST_LEVEL,
  // Linux
  applyLinuxX11Tweaks,
  isWaylandSession,
}
