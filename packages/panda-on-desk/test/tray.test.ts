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
  const calls = {
    togglePetVisibility: 0,
    openSettingsWindow: 0,
    setDnd: [] as boolean[],
    setDndWithEndsAt: [] as Array<{ enabled: boolean; endsAt?: number }>,
    requestQuit: 0,
  }
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
    // W14-T2：新签名 — DND 子菜单 click 走这里，endsAt 透传
    setDoNotDisturbWithEndsAt: (v: boolean, endsAt?: number) => {
      state.dnd = !!v
      calls.setDndWithEndsAt.push({ enabled: !!v, endsAt })
    },
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
    // W14-T2：DND 改 submenu，items[1] 不再有 click；其余 4 项仍 click
    expect(typeof items[0].click).toBe('function')
    expect(typeof items[2].click).toBe('function')
    expect(typeof items[3].click).toBe('function')
    expect(typeof items[4].click).toBe('function')
    expect(items[2].label).toBe('Settings…')
    expect(items[3].label).toBe('About panda-on-desk')
    expect(items[4].label).toBe('Quit panda-on-desk')
    handle.destroy()
  })

  it('click handlers 正确调用 ctx.{togglePetVisibility,openSettingsWindow,requestQuit} + DND 子菜单走 setDoNotDisturbWithEndsAt', () => {
    const ctx = makeFakeCtx()
    const handle = trayMod.initPandaTray(ctx)
    const items = lastMenuTemplate!.filter(t => t.type !== 'separator')
    items[0].click!()
    expect(ctx.calls.togglePetVisibility).toBe(1)
    // W14-T2：DND 是 submenu — 父项无 click，子项才有
    const submenu = (items[1] as any).submenu as MenuItemTemplate[]
    expect(Array.isArray(submenu)).toBe(true)
    const dndItems = submenu.filter(s => s.type !== 'separator')
    expect(dndItems.length).toBe(5)
    // 选 "On for 15 minutes" → enabled=true, endsAt 约 +15min
    const before = Date.now()
    dndItems[1].click!()
    expect(ctx.calls.setDndWithEndsAt.length).toBe(1)
    expect(ctx.calls.setDndWithEndsAt[0].enabled).toBe(true)
    expect(ctx.calls.setDndWithEndsAt[0].endsAt).toBeGreaterThanOrEqual(before + 15 * 60 * 1000 - 1000)
    expect(ctx.calls.setDndWithEndsAt[0].endsAt).toBeLessThanOrEqual(Date.now() + 15 * 60 * 1000 + 1000)
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

  it('getDoNotDisturb=true 时 DND 菜单项 checked=true + Forever 子项 radio 选中', () => {
    const ctx = makeFakeCtx()
    ctx.getDoNotDisturb = () => true
    const handle = trayMod.initPandaTray(ctx)
    const items = lastMenuTemplate!.filter(t => t.type !== 'separator')
    expect(items[1].label).toBe('DND mode')
    expect(items[1].type).toBe('checkbox')
    expect(items[1].checked).toBe(true)
    const submenu = (items[1] as any).submenu as MenuItemTemplate[]
    const dndItems = submenu.filter(s => s.type !== 'separator')
    // dnd=true → Off radio 不选；Forever radio 选中
    expect(dndItems[0].label).toBe('Off')
    expect(dndItems[0].checked).toBe(false)
    expect(dndItems[4].label).toBe('On until I turn it off')
    expect(dndItems[4].checked).toBe(true)
    handle.destroy()
  })

  it('W14-T2 DND submenu 5 项 (Off/15m/1h/2h/Forever) — endsAt 时长精确', () => {
    const ctx = makeFakeCtx()
    const handle = trayMod.initPandaTray(ctx)
    const items = lastMenuTemplate!.filter(t => t.type !== 'separator')
    const submenu = (items[1] as any).submenu as MenuItemTemplate[]
    const dndItems = submenu.filter(s => s.type !== 'separator')
    expect(dndItems.length).toBe(5)
    expect(dndItems.map(i => i.label)).toEqual([
      'Off',
      'On for 15 minutes',
      'On for 1 hour',
      'On for 2 hours',
      'On until I turn it off',
    ])
    // Off → enabled=false, endsAt undefined
    dndItems[0].click!()
    const last0 = ctx.calls.setDndWithEndsAt[ctx.calls.setDndWithEndsAt.length - 1]
    expect(last0.enabled).toBe(false)
    expect(last0.endsAt).toBeUndefined()
    // 1h → enabled=true, endsAt ≈ +1h
    const t1 = Date.now()
    dndItems[2].click!()
    const last1 = ctx.calls.setDndWithEndsAt[ctx.calls.setDndWithEndsAt.length - 1]
    expect(last1.enabled).toBe(true)
    expect(last1.endsAt).toBeGreaterThanOrEqual(t1 + 60 * 60 * 1000 - 1000)
    // 2h
    const t2 = Date.now()
    dndItems[3].click!()
    const last2 = ctx.calls.setDndWithEndsAt[ctx.calls.setDndWithEndsAt.length - 1]
    expect(last2.endsAt).toBeGreaterThanOrEqual(t2 + 2 * 60 * 60 * 1000 - 1000)
    // Forever → endsAt undefined
    dndItems[4].click!()
    const last3 = ctx.calls.setDndWithEndsAt[ctx.calls.setDndWithEndsAt.length - 1]
    expect(last3.enabled).toBe(true)
    expect(last3.endsAt).toBeUndefined()
    handle.destroy()
  })

  it('W14-T2 DND submenu fallback — 无 setDoNotDisturbWithEndsAt 时降级到 setDoNotDisturb', () => {
    const ctx = makeFakeCtx()
    // 删掉新签名 — 验证向后兼容（旧 main.ts 不会注入新方法）
    delete ctx.setDoNotDisturbWithEndsAt
    const handle = trayMod.initPandaTray(ctx)
    const items = lastMenuTemplate!.filter(t => t.type !== 'separator')
    const submenu = (items[1] as any).submenu as MenuItemTemplate[]
    const dndItems = submenu.filter(s => s.type !== 'separator')
    dndItems[1].click!() // 15m
    expect(ctx.calls.setDnd).toEqual([true])
    dndItems[0].click!() // Off
    expect(ctx.calls.setDnd).toEqual([true, false])
    handle.destroy()
  })

  it('W14-T2 About 对话框含 3 按钮 (OK / Open repo / View LICENSE) + LICENSE click 调 shell.openExternal', async () => {
    // 重新 mock electron — 让 dialog.showMessageBox 返回 LICENSE 按钮 (response=2)
    const openCalls: string[] = []
    let lastButtons: string[] | null = null
    let lastTitle: string | null = null
    mock.module('electron', () => {
      const base = buildElectronMock()
      base.dialog = {
        showMessageBox: (opts: any) => {
          lastButtons = opts.buttons || []
          lastTitle = opts.title || ''
          return Promise.resolve({ response: 2 })
        },
      } as any
      base.shell = {
        openExternal: (url: string) => { openCalls.push(url) },
      } as any
      return base
    })
    const trayModFresh = await import('../src/tray/index.js?w14_about=' + Date.now())
    const ctx = makeFakeCtx()
    const handle = trayModFresh.initPandaTray(ctx)
    const items = lastMenuTemplate!.filter(t => t.type !== 'separator')
    expect(items[3].label).toBe('About panda-on-desk')
    items[3].click!()
    // 等 microtask 完成 dialog promise
    await new Promise(r => setTimeout(r, 5))
    expect(lastButtons).toEqual(['OK', 'Open repo', 'View LICENSE'])
    expect(lastTitle).toBe('About panda-on-desk')
    expect(openCalls.length).toBe(1)
    expect(openCalls[0]).toContain('LICENSE')
    handle.destroy()
    // 还原 mock 给后续测试
    mock.module('electron', () => buildElectronMock())
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
