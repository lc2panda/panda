// Input:  bun test 触发；mock electron { app, Menu, Tray, nativeImage, nativeTheme, dialog, shell }
// Output: ≥5 用例 — 6 menu items 注册 / click handlers 接通 ctx / 图标主题切换 / destroy 干净
// Pos:    panda-on-desk W12-T2 系统托盘实测 [NEW-FILE:#20260420-W12-02]
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}

import { afterEach, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test'
import * as path from 'node:path'

// ─────────────────────────────────────────────────────────────────────────────
// electron mock —— tray/index.ts 直接 import { app, Menu, Tray, nativeImage, ... }
// ESM 环境下 import 是 hoisted，必须在 await import('../src/tray/...') 之前完成 mock.module
// 我们用 dynamic import 控制顺序。
// ─────────────────────────────────────────────────────────────────────────────

type ClickHandler = (menuItem?: any) => void
type MenuItemTemplate = {
  label?: string
  type?: string
  checked?: boolean
  click?: ClickHandler
}

let lastMenuTemplate: MenuItemTemplate[] | null = null
const trayListeners: Record<string, ClickHandler[]> = {}
const themeListeners: ClickHandler[] = []

type TrayStub = {
  setToolTip: (t: string) => void
  setContextMenu: (menu: any) => void
  setImage: (img: any) => void
  on: (event: string, fn: ClickHandler) => void
  isDestroyed: () => boolean
  destroy: () => void
  _destroyed: boolean
  _toolTip: string | null
  _contextMenu: any
  _image: any
  _setImageCalls: any[]
}

let lastTrayInstance: TrayStub | null = null
let mockIsDark = false

function buildElectronMock() {
  class TrayMock {
    _destroyed = false
    _toolTip: string | null = null
    _contextMenu: any = null
    _image: any = null
    _setImageCalls: any[] = []
    constructor(img: any) {
      this._image = img
      lastTrayInstance = this as unknown as TrayStub
    }
    setToolTip(t: string) { this._toolTip = t }
    setContextMenu(menu: any) { this._contextMenu = menu }
    setImage(img: any) { this._image = img; this._setImageCalls.push(img) }
    on(event: string, fn: ClickHandler) {
      if (!trayListeners[event]) trayListeners[event] = []
      trayListeners[event].push(fn)
    }
    isDestroyed() { return this._destroyed }
    destroy() { this._destroyed = true }
  }

  const fakeImage = {
    isEmpty: () => false,
    resize: (_o: any) => fakeImage,
    setTemplateImage: (_v: boolean) => {},
  }
  const emptyImage = {
    isEmpty: () => true,
    resize: (_o: any) => emptyImage,
    setTemplateImage: (_v: boolean) => {},
  }

  return {
    app: {
      isPackaged: false,
      getVersion: () => '9.9.9-test',
      quit: () => {},
    },
    Menu: {
      buildFromTemplate: (tpl: MenuItemTemplate[]) => {
        lastMenuTemplate = tpl
        return { __template: tpl }
      },
    },
    Tray: TrayMock,
    nativeImage: {
      createFromPath: (_p: string) => fakeImage,
      createEmpty: () => emptyImage,
    },
    nativeTheme: {
      get shouldUseDarkColors() { return mockIsDark },
      on: (event: string, fn: ClickHandler) => {
        if (event === 'updated') themeListeners.push(fn)
      },
    },
    dialog: {
      showMessageBox: (_o: any) => Promise.resolve({ response: 0 }),
    },
    shell: {
      openExternal: (_url: string) => {},
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 在所有 import 之前完成 mock.module —— 用 beforeAll + dynamic import 控制顺序
// ─────────────────────────────────────────────────────────────────────────────
let trayMod: typeof import('../src/tray/index.js')

beforeAll(async () => {
  mock.module('electron', () => buildElectronMock())
  // dynamic import 让 mock.module 先生效
  trayMod = await import('../src/tray/index.js')
})

function makeFakeCtx(over: any = {}): any {
  const state = { winVisible: true, dnd: false }
  const calls = { togglePetVisibility: 0, openSettingsWindow: 0, setDnd: [] as boolean[], requestQuit: 0 }
  const ctx: any = {
    getWin: () => ({
      isDestroyed: () => false,
      isVisible: () => state.winVisible,
    }),
    getHitWin: () => ({
      isDestroyed: () => false,
      isVisible: () => state.winVisible,
      hide: () => { state.winVisible = false },
      show: () => { state.winVisible = true },
    }),
    openSettingsWindow: () => { calls.openSettingsWindow++ },
    togglePetVisibility: () => { state.winVisible = !state.winVisible; calls.togglePetVisibility++ },
    getDoNotDisturb: () => state.dnd,
    setDoNotDisturb: (v: boolean) => { state.dnd = !!v; calls.setDnd.push(!!v) },
    requestQuit: () => { calls.requestQuit++ },
    appVersion: '1.2.3-test',
    getLang: () => 'en',
    ...over,
    calls,
    _state: state,
  }
  return ctx
}

beforeEach(() => {
  lastMenuTemplate = null
  lastTrayInstance = null
  for (const k of Object.keys(trayListeners)) delete trayListeners[k]
  themeListeners.length = 0
  mockIsDark = false
})

afterEach(() => {
  if (lastTrayInstance && !lastTrayInstance.isDestroyed()) {
    try { lastTrayInstance.destroy() } catch {}
  }
})

describe('panda-on-desk W12-T2 Tray (systray 实测)', () => {
  it('文件头部携带 [NEW-FILE:#20260419-W3-01] 标注', () => {
    const fs = require('node:fs') as typeof import('node:fs')
    const p = path.join(__dirname, '..', 'src', 'tray', 'index.ts')
    const head = fs.readFileSync(p, 'utf8').slice(0, 1200)
    expect(head).toContain('[NEW-FILE:#20260419-W3-01]')
    expect(head).toContain('Input')
    expect(head).toContain('Output')
    expect(head).toContain('Pos')
  })

  it('initPandaTray 注册 5 个业务菜单项 (Show/Hide + DND + Settings + About + Quit) + 3 个分隔符', () => {
    const ctx = makeFakeCtx()
    const handle = trayMod.initPandaTray(ctx)
    expect(handle).toBeDefined()
    expect(handle.tray).not.toBeNull()
    expect(lastMenuTemplate).not.toBeNull()
    const tpl = lastMenuTemplate!
    const items = tpl.filter(t => t.type !== 'separator')
    expect(items.length).toBe(5)
    const seps = tpl.filter(t => t.type === 'separator')
    expect(seps.length).toBe(3)
    expect(items[0].label).toBe('Hide panda')
    expect(items[1].label).toBe('DND mode')
    expect(items[1].type).toBe('checkbox')
    expect(items[2].label).toBe('Settings…')
    expect(items[3].label).toBe('About panda-on-desk')
    expect(items[4].label).toBe('Quit panda-on-desk')
    for (const it of items) {
      expect(typeof it.click).toBe('function')
    }
    handle.destroy()
  })

  it('click handlers 正确调用 ctx.{togglePetVisibility,setDoNotDisturb,openSettingsWindow,requestQuit}', () => {
    const ctx = makeFakeCtx()
    const handle = trayMod.initPandaTray(ctx)
    const items = lastMenuTemplate!.filter(t => t.type !== 'separator')
    items[0].click!()
    expect(ctx.calls.togglePetVisibility).toBe(1)
    items[1].click!({ checked: true })
    expect(ctx.calls.setDnd).toEqual([true])
    items[1].click!({ checked: false })
    expect(ctx.calls.setDnd).toEqual([true, false])
    items[2].click!()
    expect(ctx.calls.openSettingsWindow).toBe(1)
    expect(() => items[3].click!()).not.toThrow()
    items[4].click!()
    expect(ctx.calls.requestQuit).toBe(1)
    handle.destroy()
  })

  it('nativeTheme.on("updated") 被注册，主题切换后 tray.setImage 被重新调用', () => {
    const ctx = makeFakeCtx()
    const handle = trayMod.initPandaTray(ctx)
    expect(themeListeners.length).toBeGreaterThanOrEqual(1)
    expect(lastTrayInstance).not.toBeNull()
    const initialSetImageCount = lastTrayInstance!._setImageCalls.length
    mockIsDark = true
    for (const fn of themeListeners) fn()
    expect(lastTrayInstance!._setImageCalls.length).toBeGreaterThan(initialSetImageCount)
    handle.destroy()
  })

  it('getDoNotDisturb=true 时 DND 菜单项 checked=true', () => {
    const ctx = makeFakeCtx()
    ctx.getDoNotDisturb = () => true
    const handle = trayMod.initPandaTray(ctx)
    const items = lastMenuTemplate!.filter(t => t.type !== 'separator')
    expect(items[1].label).toBe('DND mode')
    expect(items[1].type).toBe('checkbox')
    expect(items[1].checked).toBe(true)
    handle.destroy()
  })

  it('rebuild() 反映 win 可见状态切换 (Hide panda ⇄ Show panda)', () => {
    const ctx = makeFakeCtx()
    const handle = trayMod.initPandaTray(ctx)
    let items = lastMenuTemplate!.filter(t => t.type !== 'separator')
    expect(items[0].label).toBe('Hide panda')
    ctx.getWin = () => ({ isDestroyed: () => false, isVisible: () => false })
    handle.rebuild()
    items = lastMenuTemplate!.filter(t => t.type !== 'separator')
    expect(items[0].label).toBe('Show panda')
    handle.destroy()
  })

  it('destroy() 清理干净 —— tray.isDestroyed()=true，二次 destroy 不抛错', () => {
    const ctx = makeFakeCtx()
    const handle = trayMod.initPandaTray(ctx)
    expect(handle.tray).not.toBeNull()
    expect(lastTrayInstance!.isDestroyed()).toBe(false)
    handle.destroy()
    expect(lastTrayInstance!.isDestroyed()).toBe(true)
    expect(() => handle.destroy()).not.toThrow()
  })

  it('i18n 随 getLang 动态切换 —— zh 返回中文标签', () => {
    const ctx = makeFakeCtx({ getLang: () => 'zh' })
    const handle = trayMod.initPandaTray(ctx)
    const items = lastMenuTemplate!.filter(t => t.type !== 'separator')
    expect(items[0].label).toBe('隐藏 panda')
    expect(items[1].label).toBe('免打扰模式')
    expect(items[2].label).toBe('设置…')
    expect(items[3].label).toBe('关于 panda-on-desk')
    expect(items[4].label).toBe('退出 panda-on-desk')
    handle.destroy()
  })
})
