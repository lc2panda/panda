// Input: bun test 触发；mock process.platform / fake BrowserWindow stub
// Output: 验证 platform/{mac-window,win-window,linux-x11,index}.ts 4 模块按 process.platform 正确分发
// Pos: panda-on-desk Phase 1 跨平台 dispatcher 回归测试
//
// [NEW-FILE:#20260419-P1-15]

import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const PKG_ROOT = path.resolve(__dirname, '..')

/**
 * 假 BrowserWindow —— 仅暴露 platform/index.ts 调用到的 API：
 *   isDestroyed / setAlwaysOnTop / on / getNativeWindowHandle / setVibrancy
 * 任何调用都被记账到 calls 数组，便于断言。
 */
function makeFakeBrowserWindow() {
  const calls: Array<{ method: string; args: any[] }> = []
  return {
    calls,
    isDestroyed: () => false,
    setAlwaysOnTop: (...args: any[]) => calls.push({ method: 'setAlwaysOnTop', args }),
    on: (...args: any[]) => calls.push({ method: 'on', args }),
    setVibrancy: (...args: any[]) => calls.push({ method: 'setVibrancy', args }),
    // mac-window 在 darwin 分支会读 nativeWindowHandle，给一个零指针让其早返
    getNativeWindowHandle: () => Buffer.alloc(8, 0),
  }
}

/**
 * 用 Object.defineProperty 临时改写 process.platform，兼容 Node 22 / Bun。
 * 测试结束后恢复原值，避免污染其他 test。
 */
function withPlatform<T>(p: NodeJS.Platform, fn: () => T): T {
  const desc = Object.getOwnPropertyDescriptor(process, 'platform')
  Object.defineProperty(process, 'platform', { value: p, configurable: true })
  try {
    return fn()
  } finally {
    if (desc) {
      Object.defineProperty(process, 'platform', desc)
    } else {
      Object.defineProperty(process, 'platform', { value: process.platform, configurable: true })
    }
  }
}

/**
 * 强制 require 重新加载某模块（绕过 Node require cache），让模块顶部 isMac/isWin/isLinux
 * 常量根据当前 process.platform 重新求值。
 *
 * Bun 的 require 也走 CommonJS cache，删除 require.cache[id] 同样生效。
 */
function freshRequire<T = any>(modPath: string): T {
  const resolved = require.resolve(modPath)
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete (require.cache as Record<string, any>)[resolved]
  return require(modPath) as T
}

/**
 * 平台 dispatcher 联同其底层 4 模块全部 fresh require —— 确保 isMac/isWin/isLinux
 * 顶部常量按当前已切换的 process.platform 重新求值。
 */
function freshLoadPlatform(): any {
  const root = path.join(PKG_ROOT, 'src/platform')
  for (const rel of ['mac-window.ts', 'win-window.ts', 'linux-x11.ts', 'index.ts']) {
    const resolved = require.resolve(path.join(root, rel))
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (require.cache as Record<string, any>)[resolved]
  }
  return require(path.join(root, 'index.ts'))
}

describe('panda-on-desk platform dispatcher (P1-T7)', () => {
  // ── 文件清单存在 + fork / NEW-FILE 标注齐备 ──
  it('platform 4 模块文件齐全且包含必要标注', () => {
    const expected: Array<[string, string]> = [
      ['src/platform/mac-window.ts', 'Forked from clawd-on-desk@4b07658'],
      ['src/platform/win-window.ts', '[NEW-FILE:#20260419-P1-12]'],
      ['src/platform/linux-x11.ts', '[NEW-FILE:#20260419-P1-13]'],
      ['src/platform/index.ts', '[NEW-FILE:#20260419-P1-14]'],
    ]
    for (const [rel, marker] of expected) {
      const p = path.join(PKG_ROOT, rel)
      expect(fs.existsSync(p)).toBe(true)
      const head = fs.readFileSync(p, 'utf8').slice(0, 1500)
      expect(head).toContain(marker)
    }
  })

  // ── platform === 'darwin' → mac-window 分支被命中 ──
  it("process.platform === 'darwin' 加载 mac-window 且不抛错", () => {
    withPlatform('darwin', () => {
      const platformMod = freshLoadPlatform()
      expect(platformMod.getPlatformId()).toBe('darwin')
      const fakeWin = makeFakeBrowserWindow()
      // mac 分支会进入 applyStationaryCollectionBehavior；nsView 取出来是 null 因 Buffer 全 0 → 安全早返 false
      // 关键是：不能抛错（即便不在真实 mac 上 koffi.load(libobjc) 会失败也被 swallow）
      expect(() => platformMod.applyPlatformSpecific(fakeWin)).not.toThrow()
    })
  })

  // ── platform === 'win32' → win-window 分支被命中 + setAlwaysOnTop 调用 ──
  it("process.platform === 'win32' 加载 win-window 并触发 setAlwaysOnTop", () => {
    withPlatform('win32', () => {
      const platformMod = freshLoadPlatform()
      expect(platformMod.getPlatformId()).toBe('win32')
      const fakeWin = makeFakeBrowserWindow()
      const ok = platformMod.applyPlatformSpecific(fakeWin)
      expect(ok).toBe(true)
      // win32 分支必须挂 blur 守卫 + setAlwaysOnTop(true, 'pop-up-menu')
      const setTop = fakeWin.calls.find((c: any) => c.method === 'setAlwaysOnTop')
      expect(setTop).toBeDefined()
      expect(setTop?.args[0]).toBe(true)
      expect(setTop?.args[1]).toBe('pop-up-menu')
      const onBlur = fakeWin.calls.find((c: any) => c.method === 'on' && c.args[0] === 'blur')
      expect(onBlur).toBeDefined()
    })
  })

  // ── platform === 'linux' → linux-x11 分支（Phase 1 no-op）──
  it("process.platform === 'linux' 加载 linux-x11，dispatch 返回 false（Phase 1 no-op）", () => {
    withPlatform('linux', () => {
      const platformMod = freshLoadPlatform()
      expect(platformMod.getPlatformId()).toBe('linux')
      const fakeWin = makeFakeBrowserWindow()
      const ok = platformMod.applyPlatformSpecific(fakeWin)
      // Phase 1 X11 stub —— 显式返回 false，且不能调用任何 BrowserWindow 副作用 API
      expect(ok).toBe(false)
      expect(fakeWin.calls.length).toBe(0)
      // helper isWaylandSession 在非 linux 真机也能被调用（不抛）
      expect(typeof platformMod.isWaylandSession()).toBe('boolean')
    })
  })

  // ── 即使非当前平台模块也可被 require（不应在 import 顶部 dlopen） ──
  it('mac-window / win-window / linux-x11 在任何平台上都可被 require（不抛错）', () => {
    // 此用例在当前真机平台（Win11 = win32）上执行；只要 import 顶层不直接 koffi.load 即视为通过
    expect(() => freshRequire(path.join(PKG_ROOT, 'src/platform/mac-window.ts'))).not.toThrow()
    expect(() => freshRequire(path.join(PKG_ROOT, 'src/platform/win-window.ts'))).not.toThrow()
    expect(() => freshRequire(path.join(PKG_ROOT, 'src/platform/linux-x11.ts'))).not.toThrow()
    expect(() => freshRequire(path.join(PKG_ROOT, 'src/platform/index.ts'))).not.toThrow()
  })

  // ── 兜底：destroyed window / null 入参不能崩 ──
  it('applyPlatformSpecific 对 null / destroyed window 安全返回 false', () => {
    const platformMod = freshLoadPlatform()
    expect(platformMod.applyPlatformSpecific(null)).toBe(false)
    expect(platformMod.applyPlatformSpecific(undefined)).toBe(false)
    const destroyed = { isDestroyed: () => true }
    expect(platformMod.applyPlatformSpecific(destroyed)).toBe(false)
  })
})
