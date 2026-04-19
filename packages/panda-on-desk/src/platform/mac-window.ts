// Input: Electron BrowserWindow（仅 macOS 平台有效；其他平台调用是 no-op）
// Output: NSWindow stationary collection behavior + SkyLight 私有 Space 注入；保证 overlay 不被 mission control / space 切换吞掉
// Pos: panda-on-desk 平台层 — macOS NSWindow 注入入口（被 main.ts → applyPlatformSpecific 调用）
//
// Forked from clawd-on-desk@4b07658:src/mac-window.js (MIT License)
// JS → TS 直接转 + 品牌词 "Clawd:" 替换为 "[panda-on-desk]"；模块命名空间收敛到 platform/
//
// 一旦此处签名变更，请同步更新：
//   · platform/index.ts 中 macOS 分发分支
//   · ../main.ts 中 reapplyMacVisibility 调用点
//   · ../platform/README.md 文件清单

/* eslint-disable @typescript-eslint/no-require-imports */

const isMac = process.platform === 'darwin'

// AppKit `NSWindowCollectionBehavior` 枚举值（Apple Headers 公开常量）
const NSWindowCollectionBehaviorCanJoinAllSpaces = 1 << 0
const NSWindowCollectionBehaviorMoveToActiveSpace = 1 << 1
const NSWindowCollectionBehaviorManaged = 1 << 2
const NSWindowCollectionBehaviorTransient = 1 << 3
const NSWindowCollectionBehaviorStationary = 1 << 4
const NSWindowCollectionBehaviorParticipatesInCycle = 1 << 5
const NSWindowCollectionBehaviorIgnoresCycle = 1 << 6
const NSWindowCollectionBehaviorFullScreenPrimary = 1 << 7
const NSWindowCollectionBehaviorFullScreenAuxiliary = 1 << 8
const NSWindowCollectionBehaviorFullScreenNone = 1 << 9
const NSWindowCollectionBehaviorFullScreenAllowsTiling = 1 << 11
const NSWindowCollectionBehaviorFullScreenDisallowsTiling = 1 << 12
const NSWindowCollectionBehaviorPrimary = 1 << 16
const NSWindowCollectionBehaviorAuxiliary = 1 << 17
const NSWindowCollectionBehaviorCanJoinAllApplications = 1 << 18
const NSWindowAnimationBehaviorNone = 2
const CGAssistiveTechHighWindowLevel = 1500

interface ObjcBridge {
  NSNumber: any
  NSArray: any
  msgPtr: (...args: any[]) => any
  msgULong: (...args: any[]) => number
  msgLong: (...args: any[]) => number
  msgPtrInt: (...args: any[]) => any
  msgPtrPtr: (...args: any[]) => any
  msgVoidULong: (...args: any[]) => void
  msgVoidLong: (...args: any[]) => void
  msgVoidBool: (...args: any[]) => void
}

interface SkyLightBridge {
  connection: number
  space: number
  SLSSpaceAddWindowsAndRemoveFromSpaces: (...args: any[]) => number
}

let objc: ObjcBridge | null = null
let selWindow: any = null
let selCollectionBehavior: any = null
let selSetCollectionBehavior: any = null
let selSetAnimationBehavior: any = null
let selSetCanHide: any = null
let selSetHidesOnDeactivate: any = null
let selSetMovable: any = null
let selSetLevel: any = null
let selWindowNumber: any = null
let selNumberWithInt: any = null
let selArrayWithObject: any = null
let warnedApplyFailure = false
let warnedSkyLightFailure = false
let skyLight: SkyLightBridge | null = null

function initObjc(): ObjcBridge {
  if (objc) return objc

  const koffi = require('koffi')
  const libobjc = koffi.load('/usr/lib/libobjc.A.dylib')
  const objc_getClass = libobjc.func('void *objc_getClass(const char *name)')
  const sel_registerName = libobjc.func('void *sel_registerName(const char *name)')

  objc = {
    NSNumber: objc_getClass('NSNumber'),
    NSArray: objc_getClass('NSArray'),
    msgPtr: libobjc.func('objc_msgSend', 'void *', ['void *', 'void *']),
    msgULong: libobjc.func('objc_msgSend', 'ulong', ['void *', 'void *']),
    msgLong: libobjc.func('objc_msgSend', 'long', ['void *', 'void *']),
    msgPtrInt: libobjc.func('objc_msgSend', 'void *', ['void *', 'void *', 'int']),
    msgPtrPtr: libobjc.func('objc_msgSend', 'void *', ['void *', 'void *', 'void *']),
    msgVoidULong: libobjc.func('objc_msgSend', 'void', ['void *', 'void *', 'ulong']),
    msgVoidLong: libobjc.func('objc_msgSend', 'void', ['void *', 'void *', 'long']),
    msgVoidBool: libobjc.func('objc_msgSend', 'void', ['void *', 'void *', 'bool']),
  }

  selWindow = sel_registerName('window')
  selCollectionBehavior = sel_registerName('collectionBehavior')
  selSetCollectionBehavior = sel_registerName('setCollectionBehavior:')
  selSetAnimationBehavior = sel_registerName('setAnimationBehavior:')
  selSetCanHide = sel_registerName('setCanHide:')
  selSetHidesOnDeactivate = sel_registerName('setHidesOnDeactivate:')
  selSetMovable = sel_registerName('setMovable:')
  selSetLevel = sel_registerName('setLevel:')
  selWindowNumber = sel_registerName('windowNumber')
  selNumberWithInt = sel_registerName('numberWithInt:')
  selArrayWithObject = sel_registerName('arrayWithObject:')
  return objc
}

function initSkyLight(): SkyLightBridge {
  if (skyLight) return skyLight

  // Technique follows Masko Code's SkyLightOperator approach: create a private
  // system-level Space and move overlay windows into it so Space swipes do not
  // animate or temporarily hide them.
  const koffi = require('koffi')
  const lib = koffi.load(
    '/System/Library/PrivateFrameworks/SkyLight.framework/Versions/A/SkyLight',
  )

  const SLSMainConnectionID = lib.func('SLSMainConnectionID', 'int', [])
  const SLSSpaceCreate = lib.func('SLSSpaceCreate', 'int', ['int', 'int', 'int'])
  const SLSSpaceSetAbsoluteLevel = lib.func('SLSSpaceSetAbsoluteLevel', 'int', [
    'int',
    'int',
    'int',
  ])
  const SLSShowSpaces = lib.func('SLSShowSpaces', 'int', ['int', 'void *'])
  const SLSSpaceAddWindowsAndRemoveFromSpaces = lib.func(
    'SLSSpaceAddWindowsAndRemoveFromSpaces',
    'int',
    ['int', 'int', 'void *', 'int'],
  )

  const connection = SLSMainConnectionID()
  const space = SLSSpaceCreate(connection, 1, 0)

  skyLight = {
    connection,
    space,
    SLSSpaceAddWindowsAndRemoveFromSpaces,
  }

  // Same strategy as Masko Code: create an absolute-level system Space that is
  // not part of the user's left/right Space swipe animation.
  SLSSpaceSetAbsoluteLevel(connection, space, 100)
  SLSShowSpaces(connection, makeNSNumberArray(space))

  return skyLight
}

function nativeHandleToPointer(handle: Buffer | null | undefined): bigint | null {
  if (!handle || handle.length < 8) return null
  const ptr = handle.readBigUInt64LE(0)
  return ptr === 0n ? null : ptr
}

function makeNSNumberArray(value: number): any {
  const { NSNumber, NSArray, msgPtrInt, msgPtrPtr } = initObjc()
  const number = msgPtrInt(NSNumber, selNumberWithInt, value)
  return msgPtrPtr(NSArray, selArrayWithObject, number)
}

function delegateWindowToStationarySpace(nsWindow: any): boolean {
  try {
    const { msgLong } = initObjc()
    const { connection, space, SLSSpaceAddWindowsAndRemoveFromSpaces } = initSkyLight()
    const windowNumber = Number(msgLong(nsWindow, selWindowNumber)) || 0
    if (!windowNumber) return false

    SLSSpaceAddWindowsAndRemoveFromSpaces(
      connection,
      space,
      makeNSNumberArray(windowNumber),
      7,
    )
    return true
  } catch (err) {
    if (!warnedSkyLightFailure) {
      console.warn(
        '[panda-on-desk] failed to move macOS window into stationary SkyLight space:',
        (err as Error).message,
      )
      warnedSkyLightFailure = true
    }
    return false
  }
}

/**
 * Apply NSWindow Stationary collection behavior + LSUIElement-friendly tweaks.
 *
 * 调用方：main.ts reapplyMacVisibility() — 在每个 BrowserWindow 创建后 / Space 切换后调用。
 * 非 macOS 平台直接返回 false（no-op）。
 */
export function applyStationaryCollectionBehavior(browserWindow: any): boolean {
  if (!isMac || !browserWindow || browserWindow.isDestroyed()) return false

  try {
    const { msgPtr, msgULong, msgVoidULong, msgVoidLong, msgVoidBool } = initObjc()
    const nsView = nativeHandleToPointer(browserWindow.getNativeWindowHandle())
    if (!nsView) return false

    // Electron exposes NSView*. The collection behavior lives on its NSWindow.
    const nsWindow = msgPtr(nsView, selWindow)
    if (!nsWindow) return false

    const current = Number(msgULong(nsWindow, selCollectionBehavior)) || 0
    const clearMask =
      NSWindowCollectionBehaviorMoveToActiveSpace |
      NSWindowCollectionBehaviorManaged |
      NSWindowCollectionBehaviorTransient |
      NSWindowCollectionBehaviorParticipatesInCycle |
      NSWindowCollectionBehaviorFullScreenPrimary |
      NSWindowCollectionBehaviorFullScreenNone |
      NSWindowCollectionBehaviorFullScreenAllowsTiling |
      NSWindowCollectionBehaviorPrimary |
      NSWindowCollectionBehaviorAuxiliary |
      NSWindowCollectionBehaviorCanJoinAllApplications
    const setMask =
      NSWindowCollectionBehaviorCanJoinAllSpaces |
      NSWindowCollectionBehaviorStationary |
      NSWindowCollectionBehaviorFullScreenAuxiliary |
      NSWindowCollectionBehaviorIgnoresCycle |
      NSWindowCollectionBehaviorFullScreenDisallowsTiling
    const next = (current & ~clearMask) | setMask

    if (next !== current) {
      msgVoidULong(nsWindow, selSetCollectionBehavior, next)
    }
    msgVoidBool(nsWindow, selSetCanHide, false)
    msgVoidBool(nsWindow, selSetHidesOnDeactivate, false)
    msgVoidBool(nsWindow, selSetMovable, false)
    msgVoidLong(nsWindow, selSetAnimationBehavior, NSWindowAnimationBehaviorNone)
    msgVoidLong(nsWindow, selSetLevel, CGAssistiveTechHighWindowLevel)
    delegateWindowToStationarySpace(nsWindow)
    return true
  } catch (err) {
    if (!warnedApplyFailure) {
      console.warn(
        '[panda-on-desk] failed to apply macOS stationary window behavior:',
        (err as Error).message,
      )
      warnedApplyFailure = true
    }
    return false
  }
}

/**
 * macOS LSUIElement / Dock 隐藏适配。
 *
 * NSApplication.activationPolicy 实际由 Electron 的 `app.dock.hide()` 间接覆盖；
 * 这里仅暴露语义化入口，便于 main.ts 调用统一接口。
 *
 * 注：彻底的 LSUIElement=YES 需在 package.json `build.mac.extendInfo` 写
 *   `"LSUIElement": true`（A1 §2.4 已记录）；运行时调用 app.dock.hide() 是补充措施。
 */
export function applyLSUIElement(): void {
  if (!isMac) return
  try {
    // 仅在 packaged app 时 dock 是真实存在的；开发态可能为 undefined
    const electron = require('electron')
    if (electron?.app?.dock && typeof electron.app.dock.hide === 'function') {
      electron.app.dock.hide()
    }
  } catch (err) {
    console.warn(
      '[panda-on-desk] applyLSUIElement: failed to hide dock:',
      (err as Error).message,
    )
  }
}

/**
 * macOS vibrancy / blur 效果（仅 macOS 支持）。
 *
 * Electron BrowserWindow.setVibrancy('under-window' | 'sidebar' | 'titlebar' | ...)
 * 是 Electron 内置 API，这里包一层 platform 守卫，避免误在 Win/Linux 调用。
 */
export function applyVibrancy(
  browserWindow: any,
  type:
    | 'appearance-based'
    | 'light'
    | 'dark'
    | 'titlebar'
    | 'selection'
    | 'menu'
    | 'popover'
    | 'sidebar'
    | 'medium-light'
    | 'ultra-dark'
    | 'header'
    | 'sheet'
    | 'window'
    | 'hud'
    | 'fullscreen-ui'
    | 'tooltip'
    | 'content'
    | 'under-window'
    | 'under-page' = 'under-window',
): boolean {
  if (!isMac || !browserWindow || browserWindow.isDestroyed()) return false
  try {
    if (typeof browserWindow.setVibrancy === 'function') {
      browserWindow.setVibrancy(type)
      return true
    }
  } catch (err) {
    console.warn(
      '[panda-on-desk] applyVibrancy failed:',
      (err as Error).message,
    )
  }
  return false
}
