// Input:  packages/panda-on-desk/src/overlay/{bubble-window,permission-bubble}.ts
//         + packages/panda-on-desk/src/shortcuts/global.ts + dispatcher 接入路径
// Output: ≥7 用例 — 验证 overlay 创建 / ttl 自动 close / 多 overlay 排队 /
//         permission 按钮回调 SSE / 全局快捷键注册 / 冲突 fallback warn 不抛 /
//         退出时 unregisterAll 清理
// Pos:    Phase 2 P2-T3 overlay + 权限气泡 + 快捷键验证 [NEW-FILE:#20260419-P2-14]
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from 'bun:test'

import { dispatchNotification } from '../src/notification/dispatcher.js'
import {
  __findOverlayEntryForTesting,
  __getOverlayStackForTesting,
  __getOverlayStackSizeForTesting,
  __resetOverlayStackForTesting,
  setBubbleWindowFactory,
  setOverlayWorkAreaProvider,
  showOverlayBubble,
  type OverlayBrowserWindow,
  type OverlayWindowOptions,
} from '../src/overlay/bubble-window.js'
import {
  __getPendingPermissionsForTesting,
  __resetPermissionBubbleForTesting,
  __triggerPermissionDecisionForTesting,
  hotkeyAllowLatest,
  hotkeyDenyLatest,
  setPermissionResponseSink,
  showPermissionBubble,
} from '../src/overlay/permission-bubble.js'
import {
  __ACCELERATORS_FOR_TESTING,
  __getRegisteredShortcutsForTesting,
  __resetGlobalShortcutsForTesting,
  registerGlobalShortcuts,
  setGlobalShortcutImpl,
  unregisterAll,
  type GlobalShortcutLike,
} from '../src/shortcuts/global.js'
import {
  __resetOnlineDetectorForTesting,
} from '../src/queue/online-detector.js'
// why: 默认计划 22:00-08:00 在 UTC 测试环境下可能误判 → 强制关闭，避免 dispatcher 抑制 overlay
import { __setScheduleForTesting } from '../src/dnd/schedule.js'
import type { NotificationEvent, PermissionRequestEvent } from '../src/bridge/types.js'

// ─────────────────────────────────────────────────────────────────────────────
// Mock BrowserWindow — 不依赖真 electron
// ─────────────────────────────────────────────────────────────────────────────

interface MockWindow extends OverlayBrowserWindow {
  __opts: OverlayWindowOptions
  __closed: boolean
  __sentChannels: Array<{ channel: string; args: unknown[] }>
  __setBoundsCalls: Array<{ x: number; y: number; width: number; height: number }>
  __webContentsListeners: Map<string, Array<(...args: unknown[]) => void>>
  __closeListeners: Array<(...args: unknown[]) => void>
}

function makeMockWindow(opts: OverlayWindowOptions): MockWindow {
  const sentChannels: Array<{ channel: string; args: unknown[] }> = []
  const setBoundsCalls: Array<{ x: number; y: number; width: number; height: number }> = []
  const webContentsListeners = new Map<string, Array<(...args: unknown[]) => void>>()
  const closeListeners: Array<(...args: unknown[]) => void> = []

  const win: MockWindow = {
    __opts: opts,
    __closed: false,
    __sentChannels: sentChannels,
    __setBoundsCalls: setBoundsCalls,
    __webContentsListeners: webContentsListeners,
    __closeListeners: closeListeners,
    loadFile: () => {},
    setBounds: b => {
      setBoundsCalls.push({ ...b })
    },
    setAlwaysOnTop: () => {},
    setIgnoreMouseEvents: () => {},
    show: () => {},
    hide: () => {},
    close: () => {
      if (win.__closed) return
      win.__closed = true
      for (const fn of closeListeners.slice()) {
        try {
          fn()
        } catch {
          /* noop */
        }
      }
    },
    isDestroyed: () => win.__closed,
    on: (event, listener) => {
      if (event === 'closed') closeListeners.push(listener)
    },
    webContents: {
      send: (channel, ...args) => {
        sentChannels.push({ channel, args })
      },
      on: (event, listener) => {
        const list = webContentsListeners.get(event) ?? []
        list.push(listener)
        webContentsListeners.set(event, list)
      },
      once: (event, listener) => {
        // 测试中 once = 同 on（足够覆盖 did-finish-load 触发场景）
        const list = webContentsListeners.get(event) ?? []
        list.push(listener)
        webContentsListeners.set(event, list)
      },
    },
  }
  return win
}

const createdWindows: MockWindow[] = []
function trackingFactory(opts: OverlayWindowOptions): MockWindow {
  const w = makeMockWindow(opts)
  createdWindows.push(w)
  return w
}

beforeEach(() => {
  __resetOverlayStackForTesting()
  __resetPermissionBubbleForTesting()
  __resetGlobalShortcutsForTesting()
  __resetOnlineDetectorForTesting()
  createdWindows.length = 0
  setBubbleWindowFactory(trackingFactory)
  setOverlayWorkAreaProvider(() => ({ x: 0, y: 0, width: 1920, height: 1080 }))
  // why: 强制关闭计划 DND，避免 UTC 测试环境下默认 22:00-08:00 误判抑制 overlay
  __setScheduleForTesting({ startHHmm: '22:00', endHHmm: '08:00', enabled: false })
})

afterEach(() => {
  __resetOverlayStackForTesting()
  __resetPermissionBubbleForTesting()
  __resetGlobalShortcutsForTesting()
  createdWindows.length = 0
})

// ─────────────────────────────────────────────────────────────────────────────
// Group A：overlay 浮卡核心
// ─────────────────────────────────────────────────────────────────────────────

describe('overlay/bubble-window — showOverlayBubble', () => {
  test('mock BrowserWindow → 创建 1 个窗口；栈大小 = 1', () => {
    const event: NotificationEvent = {
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 'morning-brief',
      title: 'Good morning, commander',
      body: '4 PRs need review',
      ts: Date.now(),
    }
    const handle = showOverlayBubble(event)
    expect(handle).not.toBeNull()
    expect(createdWindows.length).toBe(1)
    expect(__getOverlayStackSizeForTesting()).toBe(1)
    expect(createdWindows[0].__opts.transparent).toBe(true)
    expect(createdWindows[0].__opts.frame).toBe(false)
    expect(createdWindows[0].__opts.alwaysOnTop).toBe(true)
    expect(createdWindows[0].__opts.focusable).toBe(true)
  })

  test('ttlMs=200 后栈中自动移除（默认/级别推断 + 显式 ttl 都生效）', async () => {
    const event: NotificationEvent = {
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 'morning-brief',
      title: 'tick',
      ttlMs: 200,
      ts: Date.now(),
    }
    showOverlayBubble(event)
    expect(__getOverlayStackSizeForTesting()).toBe(1)

    await new Promise(resolve => setTimeout(resolve, 260))

    expect(__getOverlayStackSizeForTesting()).toBe(0)
    expect(createdWindows[0].__closed).toBe(true)
  })

  test('多 overlay 排队 — 同时显示 3 个，验证栈顺序（最新在最上）', () => {
    for (let i = 0; i < 3; i += 1) {
      showOverlayBubble({
        type: 'notification',
        kind: 'overlay',
        level: 'info',
        scenarioId: `s-${i}`,
        title: `bubble-${i}`,
        ts: Date.now(),
      })
    }
    expect(__getOverlayStackSizeForTesting()).toBe(3)
    expect(createdWindows.length).toBe(3)

    // 栈布局：最新（index 2）紧贴底部 (1080-16=1064)，向上堆叠
    const stack = __getOverlayStackForTesting()
    expect(stack.length).toBe(3)

    // setBounds 应被调用至少 3 次（每次 push 触发重排）
    const lastWin = createdWindows[2]
    const firstWin = createdWindows[0]
    expect(lastWin.__setBoundsCalls.length).toBeGreaterThan(0)
    expect(firstWin.__setBoundsCalls.length).toBeGreaterThan(0)

    // 视觉栈序：最新（index 2）的最终 y 大于 / 等于 旧的（index 0）— 因为最新紧贴底部
    const lastY = lastWin.__setBoundsCalls[lastWin.__setBoundsCalls.length - 1].y
    const firstY = firstWin.__setBoundsCalls[firstWin.__setBoundsCalls.length - 1].y
    expect(lastY).toBeGreaterThan(firstY)
  })

  test('ttlMs 默认推断 — error 级别 → 10s（仅断言定时器存在 + 不立即关）', () => {
    showOverlayBubble({
      type: 'notification',
      kind: 'overlay',
      level: 'error',
      scenarioId: 'ci-failed',
      title: 'CI failed',
      ts: Date.now(),
    })
    // 立即检查：栈中仍有 1 个（10s 不会立刻触发）
    expect(__getOverlayStackSizeForTesting()).toBe(1)
  })

  test('factory 未注入 → showOverlayBubble 返回 null 且不抛错', () => {
    setBubbleWindowFactory(null)
    const handle = showOverlayBubble({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 's',
      title: 't',
      ts: Date.now(),
    })
    expect(handle).toBeNull()
    expect(__getOverlayStackSizeForTesting()).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B：permission 气泡 + SSE 推回
// ─────────────────────────────────────────────────────────────────────────────

describe('overlay/permission-bubble — showPermissionBubble', () => {
  test('按钮回调（approve）→ responseSink 收到 ReversePermissionResponse', () => {
    const sink = mock(() => {})
    setPermissionResponseSink(sink)

    const event: PermissionRequestEvent = {
      type: 'permission',
      requestId: 'req-001',
      toolName: 'Bash',
      summary: 'rm -rf /tmp/foo',
      risk: 'high',
      ts: Date.now(),
    }
    const handle = showPermissionBubble(event)
    expect(handle).not.toBeNull()
    expect(__getOverlayStackSizeForTesting()).toBe(1)
    expect(__getPendingPermissionsForTesting().length).toBe(1)

    // 模拟用户点 Allow
    __triggerPermissionDecisionForTesting(handle!.id, event.requestId, 'approve')

    expect(sink).toHaveBeenCalledTimes(1)
    const arg = (sink as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as {
      type: string
      requestId: string
      decision: string
    }
    expect(arg.type).toBe('permission-response')
    expect(arg.requestId).toBe('req-001')
    expect(arg.decision).toBe('approve')

    // overlay 应被关闭 + pending 移除
    expect(__getOverlayStackSizeForTesting()).toBe(0)
    expect(__getPendingPermissionsForTesting().length).toBe(0)
  })

  test('全局快捷键 hotkeyDenyLatest → 推回 deny + 关闭最新气泡', () => {
    const sink = mock(() => {})
    setPermissionResponseSink(sink)

    showPermissionBubble({
      type: 'permission',
      requestId: 'req-A',
      toolName: 'Edit',
      summary: 'edit /etc/hosts',
      risk: 'medium',
      ts: Date.now(),
    })
    showPermissionBubble({
      type: 'permission',
      requestId: 'req-B',
      toolName: 'Write',
      summary: 'write secret.txt',
      risk: 'critical',
      ts: Date.now(),
    })

    expect(__getPendingPermissionsForTesting().length).toBe(2)

    const handled = hotkeyDenyLatest()
    expect(handled).toBe(true)

    // 最新（req-B）应被 deny
    const calls = (sink as unknown as { mock: { calls: unknown[][] } }).mock.calls
    expect(calls.length).toBe(1)
    const arg = calls[0][0] as { requestId: string; decision: string }
    expect(arg.requestId).toBe('req-B')
    expect(arg.decision).toBe('deny')

    // req-A 仍在 pending
    expect(__getPendingPermissionsForTesting().length).toBe(1)
    expect(__getPendingPermissionsForTesting()[0].requestId).toBe('req-A')
  })

  test('hotkeyAllowLatest 在无 pending 时返回 false（noop）', () => {
    expect(hotkeyAllowLatest()).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C：dispatcher 接入 overlay 分支
// ─────────────────────────────────────────────────────────────────────────────

describe('dispatcher — kind=overlay 接入 showOverlayBubble', () => {
  test('普通 overlay 事件 → 创建 1 个 overlay', () => {
    dispatchNotification({
      type: 'notification',
      kind: 'overlay',
      level: 'warning',
      scenarioId: 'disk-low',
      title: 'Disk almost full',
      body: '92% used',
      ts: Date.now(),
    })
    expect(__getOverlayStackSizeForTesting()).toBe(1)
  })

  test('actions 含 permission_request marker → 升级为 permission 气泡', () => {
    dispatchNotification({
      type: 'notification',
      kind: 'overlay',
      level: 'error',
      scenarioId: 'req-X',
      title: 'Bash',
      body: 'sudo rm -rf /',
      actions: [
        { id: 'allow', label: 'Allow' },
        { id: 'deny', label: 'Deny' },
        { id: 'permission_request', label: '__marker__' },
      ],
      ts: Date.now(),
    })
    expect(__getOverlayStackSizeForTesting()).toBe(1)
    expect(__getPendingPermissionsForTesting().length).toBe(1)
    expect(__getPendingPermissionsForTesting()[0].requestId).toBe('req-X')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group D：全局快捷键
// ─────────────────────────────────────────────────────────────────────────────

describe('shortcuts/global — registerGlobalShortcuts', () => {
  test('mock globalShortcut.register 调用 2 次（Allow + Deny）', () => {
    const calls: Array<{ accel: string; cb: () => void }> = []
    const impl: GlobalShortcutLike = {
      register: (accelerator, callback) => {
        calls.push({ accel: accelerator, cb: callback })
        return true
      },
      unregister: () => {},
      unregisterAll: () => {},
    }
    setGlobalShortcutImpl(impl)
    registerGlobalShortcuts()

    expect(calls.length).toBe(2)
    expect(calls[0].accel).toBe(__ACCELERATORS_FOR_TESTING.allow)
    expect(calls[1].accel).toBe(__ACCELERATORS_FOR_TESTING.deny)

    const reg = __getRegisteredShortcutsForTesting()
    expect(reg.length).toBe(2)
    expect(reg.every(r => r.ok)).toBe(true)
  })

  test('快捷键冲突 fallback — register 返 false 不抛，console.warn 兜底', () => {
    const warnSpy = mock(() => {})
    const origWarn = console.warn
    console.warn = warnSpy

    try {
      const impl: GlobalShortcutLike = {
        register: () => false, // 模拟系统冲突
        unregister: () => {},
        unregisterAll: () => {},
      }
      setGlobalShortcutImpl(impl)

      expect(() => registerGlobalShortcuts()).not.toThrow()

      const reg = __getRegisteredShortcutsForTesting()
      expect(reg.length).toBe(2)
      expect(reg.every(r => !r.ok)).toBe(true)
      // 至少 2 次 warn（Allow + Deny）
      expect(warnSpy).toHaveBeenCalled()
    } finally {
      console.warn = origWarn
    }
  })

  test('panda-on-desk 退出 — unregisterAll 调 impl.unregister 对每个已成功项', () => {
    const unregistered: string[] = []
    const impl: GlobalShortcutLike = {
      register: () => true,
      unregister: accel => {
        unregistered.push(accel)
      },
      unregisterAll: () => {},
    }
    setGlobalShortcutImpl(impl)
    registerGlobalShortcuts()

    unregisterAll()

    expect(unregistered.length).toBe(2)
    expect(unregistered).toContain(__ACCELERATORS_FOR_TESTING.allow)
    expect(unregistered).toContain(__ACCELERATORS_FOR_TESTING.deny)
    expect(__getRegisteredShortcutsForTesting().length).toBe(0)
  })

  test('快捷键回调 → 触发 hotkeyAllow/Deny → SSE sink 推回', () => {
    const captured: Record<string, () => void> = {}
    const impl: GlobalShortcutLike = {
      register: (accel, cb) => {
        captured[accel] = cb
        return true
      },
      unregister: () => {},
      unregisterAll: () => {},
    }
    setGlobalShortcutImpl(impl)
    registerGlobalShortcuts()

    const sink = mock(() => {})
    setPermissionResponseSink(sink)

    showPermissionBubble({
      type: 'permission',
      requestId: 'req-shortcut',
      toolName: 'Bash',
      summary: 'ls',
      risk: 'low',
      ts: Date.now(),
    })

    // 触发 Allow 快捷键
    captured[__ACCELERATORS_FOR_TESTING.allow]()

    expect(sink).toHaveBeenCalledTimes(1)
    const arg = (sink as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as {
      requestId: string
      decision: string
    }
    expect(arg.requestId).toBe('req-shortcut')
    expect(arg.decision).toBe('approve')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group E：bubble entry 引用辅助 — __findOverlayEntryForTesting
// ─────────────────────────────────────────────────────────────────────────────

describe('overlay — entry 引用辅助', () => {
  test('__findOverlayEntryForTesting 能按 id 找到 entry', () => {
    const handle = showOverlayBubble({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 's',
      title: 't',
      ts: Date.now(),
    })
    expect(handle).not.toBeNull()
    const entry = __findOverlayEntryForTesting(handle!.id)
    expect(entry).toBeDefined()
    expect(entry?.id).toBe(handle!.id)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group F：W14-T3 真弹出验证 — IPC 通道契约 / preload 对齐 / 实际 send overlay-show
// ─────────────────────────────────────────────────────────────────────────────
//
// 背景：P2-T3 + W2-T3 写了 showOverlayBubble 但 Mac 用户实测 overlay 不可见。
// 根因：
//   ① main.ts 从未注入 setBubbleWindowFactory → showOverlayBubble 永远 noop
//   ② preload/bubble.ts 只暴露 onPermissionShow，bubble-window.ts send('overlay:show')
//      通道名不匹配 → 即便创建了窗也收不到 payload
//   ③ bubble.html 没有 overlay 渲染分支 → 即便收到 payload 也无法显示
//
// 本组用例验证：
//   - 通道名修正为 'overlay-show'（与 preload onOverlayShow 对齐）
//   - did-finish-load 后 send + show 真触发
//   - actions[] / level / title / body 完整透传给 renderer
//   - bubble.html / preload/bubble.ts 物理存在 + 暴露 onOverlayShow API
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('W14-T3 — overlay 真运行时弹出验证', () => {
  test('did-finish-load 触发 → webContents.send 真调，通道名 = overlay-show', () => {
    const event: NotificationEvent = {
      type: 'notification',
      kind: 'overlay',
      level: 'warning',
      scenarioId: 'ci-failed',
      title: 'CI failed on main',
      body: 'pipeline #4521 broken',
      actions: [
        { id: 'open', label: 'Open PR', primary: true },
        { id: 'dismiss', label: 'Dismiss' },
      ],
      ts: Date.now(),
    }
    showOverlayBubble(event)
    expect(createdWindows.length).toBe(1)
    const w = createdWindows[0]

    // 模拟 renderer ready — 触发 did-finish-load 监听器
    const onceListeners = w.__webContentsListeners.get('did-finish-load') ?? []
    expect(onceListeners.length).toBeGreaterThan(0)
    for (const fn of onceListeners) fn()

    // 应 send 一次 overlay-show（通道名修正后才会到 preload onOverlayShow）
    const sent = w.__sentChannels.filter(s => s.channel === 'overlay-show')
    expect(sent.length).toBe(1)
    const payload = sent[0].args[0] as {
      id: string
      title: string
      body: string
      level: string
      actions: Array<{ id: string; label: string }>
    }
    expect(payload.title).toBe('CI failed on main')
    expect(payload.body).toBe('pipeline #4521 broken')
    expect(payload.level).toBe('warning')
    expect(payload.actions.length).toBe(2)
    expect(payload.actions[0].id).toBe('open')

    // 不应 send 旧通道 'overlay:show'（链路断点的根因之一）
    const stale = w.__sentChannels.filter(s => s.channel === 'overlay:show')
    expect(stale.length).toBe(0)
  })

  test('payload.body 缺失 → 默认 ""（renderer 不会 undefined 渲染）', () => {
    showOverlayBubble({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 'morning-brief',
      title: 'Good morning, commander',
      ts: Date.now(),
    })
    const w = createdWindows[0]
    const onceListeners = w.__webContentsListeners.get('did-finish-load') ?? []
    for (const fn of onceListeners) fn()
    const sent = w.__sentChannels.find(s => s.channel === 'overlay-show')
    expect(sent).toBeDefined()
    const payload = sent!.args[0] as { body: string; actions: unknown[] }
    expect(payload.body).toBe('')
    expect(payload.actions).toEqual([])
  })

  test('preload/bubble.js 真存在 + 暴露 onOverlayShow / onOverlayHide / overlayAction', () => {
    // why W14-T3: bubble-window.ts webPreferences.preload 指向 preload/bubble.js
    //   该 preload 必须暴露 onOverlayShow 才能让 bubble.html 收到 overlay 数据
    const preloadPath = join(__dirname, '..', 'src', 'preload', 'bubble.js')
    expect(existsSync(preloadPath)).toBe(true)
    const src = readFileSync(preloadPath, 'utf-8')
    expect(src.includes('onOverlayShow')).toBe(true)
    expect(src.includes('onOverlayHide')).toBe(true)
    expect(src.includes('overlayAction')).toBe(true)
    // 通道名物理对齐 — 'overlay-show' / 'overlay-hide' / 'overlay-action'
    expect(src.includes("'overlay-show'")).toBe(true)
    expect(src.includes("'overlay-hide'")).toBe(true)
    expect(src.includes("'overlay-action'")).toBe(true)
  })

  test('bubble.html 真存在 + 含 overlay 渲染分支（onOverlayShow 监听 + 动态 actions）', () => {
    const htmlPath = join(__dirname, '..', 'src', 'renderer', 'bubble.html')
    expect(existsSync(htmlPath)).toBe(true)
    const html = readFileSync(htmlPath, 'utf-8')
    // 必须订阅 onOverlayShow（W14-T3 核心修复）
    expect(html.includes('onOverlayShow')).toBe(true)
    // 必须有动态 actions 渲染（forEach + createElement button）
    expect(html.includes('actions') && html.includes('createElement')).toBe(true)
    // 必须用 textContent 防 XSS（不用 innerHTML 注入用户 title/body）
    expect(html.includes('textContent')).toBe(true)
    // 必须有 overlayAction IPC 推回 — 让按钮点击有去处
    expect(html.includes('overlayAction')).toBe(true)
    // 自包含 — 不引用外部 .js / .css 资源
    expect(html.includes('<script src=')).toBe(false)
    expect(html.includes('<link rel="stylesheet"')).toBe(false)
  })

  test('did-finish-load 后 win.show() 真调（防止透明窗存在但未显示）', () => {
    let showCalls = 0
    setBubbleWindowFactory(opts => {
      const w = makeMockWindow(opts)
      const origShow = w.show
      w.show = () => { showCalls += 1; origShow.call(w) }
      createdWindows.push(w)
      return w
    })
    showOverlayBubble({
      type: 'notification',
      kind: 'overlay',
      level: 'success',
      scenarioId: 'task-done',
      title: 'Task complete',
      ts: Date.now(),
    })
    const w = createdWindows[0]
    const onceListeners = w.__webContentsListeners.get('did-finish-load') ?? []
    for (const fn of onceListeners) fn()
    expect(showCalls).toBe(1)
  })

  test('options.show=false 防失焦闪烁；renderer ready 后才 show（契约）', () => {
    showOverlayBubble({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 's',
      title: 't',
      ts: Date.now(),
    })
    expect(createdWindows[0].__opts.show).toBe(false)
    // 同时校验 transparent / frame:false / alwaysOnTop / focusable —
    // 这些是 overlay 真弹出 + 真可点击的硬约束
    expect(createdWindows[0].__opts.transparent).toBe(true)
    expect(createdWindows[0].__opts.frame).toBe(false)
    expect(createdWindows[0].__opts.alwaysOnTop).toBe(true)
    expect(createdWindows[0].__opts.focusable).toBe(true)
    expect(createdWindows[0].__opts.skipTaskbar).toBe(true)
  })

  test('多 actions 全字段透传（id/label/primary/shortcut）— renderer 渲染需要', () => {
    const event: NotificationEvent = {
      type: 'notification',
      kind: 'overlay',
      level: 'warning',
      scenarioId: 'pr-review',
      title: 'PR #42 ready for review',
      body: 'feat(panda): add overlay真弹出',
      actions: [
        { id: 'review', label: 'Review now', primary: true, shortcut: 'Cmd+Shift+R' },
        { id: 'snooze', label: 'Snooze 1h' },
        { id: 'open-pr', label: 'Open in browser', shortcut: 'Cmd+Shift+O' },
      ],
      ts: Date.now(),
    }
    showOverlayBubble(event)
    const w = createdWindows[0]
    const onceListeners = w.__webContentsListeners.get('did-finish-load') ?? []
    for (const fn of onceListeners) fn()
    const sent = w.__sentChannels.find(s => s.channel === 'overlay-show')
    const payload = sent!.args[0] as {
      actions: Array<{ id: string; label: string; primary?: boolean; shortcut?: string }>
    }
    expect(payload.actions.length).toBe(3)
    expect(payload.actions[0].primary).toBe(true)
    expect(payload.actions[0].shortcut).toBe('Cmd+Shift+R')
    expect(payload.actions[1].primary).toBeUndefined()
    expect(payload.actions[2].shortcut).toBe('Cmd+Shift+O')
  })

  test('did-finish-load 抛错时 silent — 不阻断后续 overlay；窗口仍在栈中', () => {
    showOverlayBubble({
      type: 'notification',
      kind: 'overlay',
      level: 'error',
      scenarioId: 'crash',
      title: 'Module crash',
      ts: Date.now(),
    })
    const w = createdWindows[0]
    // 模拟 webContents.send 抛错（renderer 已销毁等极端情况）
    const origSend = w.webContents.send
    w.webContents.send = () => { throw new Error('renderer destroyed') }
    const onceListeners = w.__webContentsListeners.get('did-finish-load') ?? []
    expect(() => { for (const fn of onceListeners) fn() }).not.toThrow()
    w.webContents.send = origSend
    // 栈仍稳定
    expect(__getOverlayStackSizeForTesting()).toBe(1)
  })

  test('端到端：dispatchNotification(overlay) → factory 调 → did-finish-load → overlay-show payload 完整', () => {
    dispatchNotification({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 'morning-brief',
      title: 'Good morning, commander',
      body: '4 PRs need review · 2 calendar events',
      actions: [
        { id: 'open-brief', label: 'Open brief', primary: true },
      ],
      ts: Date.now(),
    })
    expect(createdWindows.length).toBe(1)
    const w = createdWindows[0]
    const onceListeners = w.__webContentsListeners.get('did-finish-load') ?? []
    for (const fn of onceListeners) fn()
    const sent = w.__sentChannels.find(s => s.channel === 'overlay-show')
    expect(sent).toBeDefined()
    const payload = sent!.args[0] as {
      title: string
      body: string
      scenarioId: string
      actions: Array<{ id: string; label: string }>
    }
    expect(payload.title).toBe('Good morning, commander')
    expect(payload.body).toBe('4 PRs need review · 2 calendar events')
    expect(payload.scenarioId).toBe('morning-brief')
    expect(payload.actions[0].id).toBe('open-brief')
  })
})
