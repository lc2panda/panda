// Input: packages/panda-on-desk/src/overlay/bubble-window.ts (BrowserWindow factory 注入路径)
// Output: ≥6 集成用例 — BrowserWindow 完整生命周期 (create → loadFile → show →
//         minimize-equiv (hide) → close → destroy) + 多窗叠加 + ttl 自动销毁
// Pos:    W7-T3 panda-on-desk 窗口管理稳定性集成验证（god-file main.ts 之外的 overlay 5th window）
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}
//
// [NEW-FILE:#W7-02]
// 2026-04-20 +08:00 W7-T3 测试加固 — 窗口生命周期 mock Electron 集成

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test'

import {
  __getOverlayStackForTesting,
  __getOverlayStackSizeForTesting,
  __resetOverlayStackForTesting,
  setBubbleWindowFactory,
  setOverlayWorkAreaProvider,
  showOverlayBubble,
  type OverlayBrowserWindow,
  type OverlayWindowOptions,
} from '../src/overlay/bubble-window.js'
import type { NotificationEvent } from '../src/bridge/types.js'

// ─────────────────────────────────────────────────────────────────────────────
// Mock BrowserWindow — 完整生命周期事件追踪
// 与 overlay.test.ts MockWindow 同结构，但额外暴露 lifecycle event log
// ─────────────────────────────────────────────────────────────────────────────

interface LifecycleEvent {
  ts: number
  kind:
    | 'created'
    | 'loadFile'
    | 'show'
    | 'hide'
    | 'minimize'
    | 'close'
    | 'destroyed'
    | 'setBounds'
    | 'setAlwaysOnTop'
    | 'setIgnoreMouseEvents'
    | 'webContents.send'
  payload?: unknown
}

interface MockBrowserWindow extends OverlayBrowserWindow {
  __opts: OverlayWindowOptions
  __destroyed: boolean
  __minimized: boolean
  __visible: boolean
  __lifecycle: LifecycleEvent[]
  __closeListeners: Array<(...args: unknown[]) => void>
  __webContentsListeners: Map<string, Array<(...args: unknown[]) => void>>
  __triggerWebContents: (event: string, ...args: unknown[]) => void
  __triggerClose: () => void
  __minimizeAndRestore: () => void
}

function makeMockBrowserWindow(opts: OverlayWindowOptions): MockBrowserWindow {
  const lifecycle: LifecycleEvent[] = []
  const closeListeners: Array<(...args: unknown[]) => void> = []
  const webContentsListeners = new Map<string, Array<(...args: unknown[]) => void>>()
  const log = (kind: LifecycleEvent['kind'], payload?: unknown) => {
    lifecycle.push({ ts: Date.now(), kind, payload })
  }

  log('created', { width: opts.width, height: opts.height })

  const win: MockBrowserWindow = {
    __opts: opts,
    __destroyed: false,
    __minimized: false,
    __visible: false,
    __lifecycle: lifecycle,
    __closeListeners: closeListeners,
    __webContentsListeners: webContentsListeners,
    loadFile: (file: string) => {
      log('loadFile', file)
    },
    setBounds: b => {
      log('setBounds', b)
    },
    setAlwaysOnTop: (flag: boolean, level?: string) => {
      log('setAlwaysOnTop', { flag, level })
    },
    setIgnoreMouseEvents: (ignore: boolean) => {
      log('setIgnoreMouseEvents', ignore)
    },
    show: () => {
      win.__visible = true
      win.__minimized = false
      log('show')
    },
    hide: () => {
      win.__visible = false
      log('hide')
    },
    close: () => {
      if (win.__destroyed) return
      win.__destroyed = true
      win.__visible = false
      log('close')
      for (const fn of closeListeners.slice()) {
        try {
          fn()
        } catch {
          /* noop */
        }
      }
      log('destroyed')
    },
    isDestroyed: () => win.__destroyed,
    on: (event, listener) => {
      if (event === 'closed') closeListeners.push(listener)
    },
    webContents: {
      send: (channel: string, ...args: unknown[]) => {
        log('webContents.send', { channel, args })
      },
      on: (event: string, listener: (...args: unknown[]) => void) => {
        const arr = webContentsListeners.get(event) ?? []
        arr.push(listener)
        webContentsListeners.set(event, arr)
      },
      once: (event: string, listener: (...args: unknown[]) => void) => {
        const arr = webContentsListeners.get(event) ?? []
        // simulate "once" — wrap to remove after first invoke
        const wrap = (...a: unknown[]) => {
          listener(...a)
          const i = arr.indexOf(wrap)
          if (i !== -1) arr.splice(i, 1)
        }
        arr.push(wrap)
        webContentsListeners.set(event, arr)
      },
    },
    __triggerWebContents: (event: string, ...args: unknown[]) => {
      const arr = webContentsListeners.get(event)
      if (!arr) return
      for (const fn of arr.slice()) fn(...args)
    },
    __triggerClose: () => win.close(),
    __minimizeAndRestore: () => {
      // BrowserWindow API 没有标准 minimize on overlay；这里用 hide+show 模拟
      win.hide()
      log('minimize')
      win.__minimized = true
      // 恢复
      win.show()
    },
  }
  return win
}

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  __resetOverlayStackForTesting()
  setOverlayWorkAreaProvider(() => ({ x: 0, y: 0, width: 1920, height: 1080 }))
})

afterEach(() => {
  __resetOverlayStackForTesting()
})

function makeNotif(opts: Partial<NotificationEvent> = {}): NotificationEvent {
  return {
    type: 'notification',
    kind: 'overlay',
    level: 'info',
    scenarioId: 'w7t3-window-lc',
    title: 'W7-T3 lifecycle',
    body: 'lifecycle test',
    ts: Date.now(),
    ttlMs: 60_000, // 防 ttl 在测试期间触发
    ...opts,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-LC-1 · BrowserWindow 完整生命周期 (create → loadFile → show → hide → close → destroyed)
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · panda-on-desk window lifecycle · 单窗', () => {
  test('create → loadFile → did-finish-load → show → close → destroyed 6 阶段全击中', () => {
    let captured: MockBrowserWindow | null = null
    setBubbleWindowFactory(opts => {
      const w = makeMockBrowserWindow(opts)
      captured = w
      return w
    })

    const handle = showOverlayBubble(makeNotif())
    expect(handle).not.toBeNull()
    expect(captured).not.toBeNull()
    const win = captured!

    // 1. created
    expect(win.__lifecycle.find(e => e.kind === 'created')).toBeDefined()
    // 2. loadFile (bubble.html)
    const loadEv = win.__lifecycle.find(e => e.kind === 'loadFile')
    expect(loadEv).toBeDefined()
    expect(String(loadEv?.payload)).toContain('bubble.html')

    // 3. did-finish-load 触发 → renderer 收 overlay-show payload + win.show()
    // why W14-T3：通道名从 'overlay:show' 改为 'overlay-show'，与 preload/bubble.ts
    //   的 onOverlayShow → ipcRenderer.on('overlay-show') 对齐。旧通道名导致 mac
    //   用户实测 overlay 创建后 renderer 收不到 payload，永远空白。
    win.__triggerWebContents('did-finish-load')
    const sendEvents = win.__lifecycle.filter(e => e.kind === 'webContents.send')
    expect(sendEvents.length).toBeGreaterThanOrEqual(1)
    expect((sendEvents[0].payload as { channel: string }).channel).toBe('overlay-show')
    expect(win.__visible).toBe(true)
    expect(win.__lifecycle.find(e => e.kind === 'show')).toBeDefined()

    // 4. close → 5. destroyed
    handle!.close()
    expect(win.__destroyed).toBe(true)
    expect(win.__lifecycle.find(e => e.kind === 'close')).toBeDefined()
    expect(win.__lifecycle.find(e => e.kind === 'destroyed')).toBeDefined()

    // 6. 出栈
    expect(__getOverlayStackSizeForTesting()).toBe(0)
  })

  test('外部 close (window.close 直接触发) → 自动出栈', () => {
    let captured: MockBrowserWindow | null = null
    setBubbleWindowFactory(opts => {
      const w = makeMockBrowserWindow(opts)
      captured = w
      return w
    })

    showOverlayBubble(makeNotif())
    expect(__getOverlayStackSizeForTesting()).toBe(1)

    captured!.__triggerClose() // 模拟用户点 X
    expect(captured!.__destroyed).toBe(true)
    expect(__getOverlayStackSizeForTesting()).toBe(0)
  })

  test('minimize 等价行为 (hide → show) → 不影响栈状态', () => {
    let captured: MockBrowserWindow | null = null
    setBubbleWindowFactory(opts => {
      const w = makeMockBrowserWindow(opts)
      captured = w
      return w
    })

    showOverlayBubble(makeNotif())
    captured!.__triggerWebContents('did-finish-load')
    expect(captured!.__visible).toBe(true)
    expect(__getOverlayStackSizeForTesting()).toBe(1)

    // minimize-restore 序列
    captured!.__minimizeAndRestore()
    expect(captured!.__visible).toBe(true) // 恢复后可见
    // 关键：栈 size 不变 — minimize 不影响业务栈
    expect(__getOverlayStackSizeForTesting()).toBe(1)

    const minimizeEvent = captured!.__lifecycle.find(e => e.kind === 'minimize')
    expect(minimizeEvent).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-LC-2 · 多窗叠加 + 栈管理
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · panda-on-desk window lifecycle · 多窗', () => {
  test('连续 push 3 个 overlay → 栈中保留 3 个 + 各自 setBounds 至少调用一次', () => {
    const captured: MockBrowserWindow[] = []
    setBubbleWindowFactory(opts => {
      const w = makeMockBrowserWindow(opts)
      captured.push(w)
      return w
    })

    showOverlayBubble(makeNotif({ title: 'one' }))
    showOverlayBubble(makeNotif({ title: 'two' }))
    showOverlayBubble(makeNotif({ title: 'three' }))

    expect(__getOverlayStackSizeForTesting()).toBe(3)
    expect(captured.length).toBe(3)
    // relayoutStack 至少跑过；每窗都至少有一个 setBounds 事件
    for (const w of captured) {
      const setBoundsEvents = w.__lifecycle.filter(e => e.kind === 'setBounds')
      expect(setBoundsEvents.length).toBeGreaterThanOrEqual(1)
    }
  })

  test('栈中间窗口 close → 仅该窗销毁 + 其余保留 + 重排', () => {
    const captured: MockBrowserWindow[] = []
    setBubbleWindowFactory(opts => {
      const w = makeMockBrowserWindow(opts)
      captured.push(w)
      return w
    })

    const h1 = showOverlayBubble(makeNotif({ title: 'top' }))
    const h2 = showOverlayBubble(makeNotif({ title: 'mid' }))
    showOverlayBubble(makeNotif({ title: 'bot' }))
    expect(__getOverlayStackSizeForTesting()).toBe(3)

    // 关掉中间
    h2!.close()
    expect(captured[1].__destroyed).toBe(true)
    expect(captured[0].__destroyed).toBe(false)
    expect(captured[2].__destroyed).toBe(false)
    expect(__getOverlayStackSizeForTesting()).toBe(2)

    // 关掉头
    h1!.close()
    expect(__getOverlayStackSizeForTesting()).toBe(1)
    expect(captured[2].__destroyed).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-LC-3 · TTL 自动销毁链路
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · panda-on-desk window lifecycle · TTL 自动销毁', () => {
  test('短 ttlMs (50ms) → window 自动 close + 出栈（real timer）', async () => {
    let captured: MockBrowserWindow | null = null
    setBubbleWindowFactory(opts => {
      const w = makeMockBrowserWindow(opts)
      captured = w
      return w
    })

    showOverlayBubble(makeNotif({ ttlMs: 50 }))
    expect(__getOverlayStackSizeForTesting()).toBe(1)
    expect(captured!.__destroyed).toBe(false)

    // 等 ttl 触发
    await new Promise<void>(resolve => setTimeout(resolve, 120))

    expect(captured!.__destroyed).toBe(true)
    expect(__getOverlayStackSizeForTesting()).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-LC-4 · factory 未注入 → showOverlayBubble noop（main.ts 启动早期）
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · panda-on-desk window lifecycle · factory 未注入', () => {
  test('未 setBubbleWindowFactory → showOverlayBubble 返回 null + 栈空', () => {
    setBubbleWindowFactory(null)
    const handle = showOverlayBubble(makeNotif())
    expect(handle).toBeNull()
    expect(__getOverlayStackSizeForTesting()).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-LC-5 · 重排时窗口已销毁 → 不抛错（健壮性）
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · panda-on-desk window lifecycle · 健壮性', () => {
  test('setBounds 时窗口已外部销毁 → 不抛 + 栈状态机自洽', () => {
    let captured: MockBrowserWindow | null = null
    setBubbleWindowFactory(opts => {
      const w = makeMockBrowserWindow(opts)
      captured = w
      return w
    })

    showOverlayBubble(makeNotif({ title: 'first' }))
    expect(__getOverlayStackSizeForTesting()).toBe(1)
    // 强制把第一个窗销毁 (绕过 close listener) — 模拟 electron crash
    captured!.__destroyed = true

    // 触发重排 — push 第二个会跑 relayoutStack，遍历所有 entry
    expect(() => showOverlayBubble(makeNotif({ title: 'second' }))).not.toThrow()
    // 第一个窗 setBounds 应被 isDestroyed gate 拦住
    const stack = __getOverlayStackForTesting()
    expect(stack.length).toBe(2) // entry 仍在栈中（出栈靠 closed event）
  })
})
