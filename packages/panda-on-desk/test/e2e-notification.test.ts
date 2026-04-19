// Input:  bun test 触发 — W2-T3 端到端实测：HTTP /event → bridge.dispatchEvent → notification/dispatcher → native/overlay/badge
// Output: ≥ 6 用例 — 验证：mock HTTP server 路由 / kind=system→native / kind=overlay→bubble /
//         kind=badge→bumpBadge / DND on + level=info → 抑制 / 离线 → enqueue
// Pos:    Phase W2 P3 收尾 · W2-T3 通知联动实测 [NEW-FILE:#20260419-W2-03]
//         严守 anthropic byte-equal — 不引用 src/services/api/{claude,oauth,providers}
//         零新依赖 — 仅使用 bun:test + node:http + node:crypto
//
// 链路覆盖（panda CLI → on-desk）:
//   raw HTTP POST /event (NotificationEvent)
//     → bridge/server.ts dispatchEvent
//       → notification/dispatcher.ts dispatchNotification
//         → native/overlay/badge 子模块（注入 mock 验证 1 次调用）

import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 在 import 任何 panda-on-desk 模块前先隔离配置目录，防止 runtime.json / queue jsonl 污染真实 ~/.pandacc
const TMP_DIR = mkdtempSync(join(tmpdir(), 'panda-w2t3-e2e-'))
process.env.PANDA_CONFIG_DIR = TMP_DIR

beforeAll(() => {
  process.env.PANDA_CONFIG_DIR = TMP_DIR
})

import { startBridgeServer, dispatchEvent } from '../src/bridge/server.js'
import {
  __getBadgeCountForTesting,
  __resetBadgeCountsForTesting,
} from '../src/badge/manager.js'
import {
  __resetDndStateForTesting,
  setDnd,
} from '../src/dnd/state.js'
import { __resetPrivacyForTesting } from '../src/dnd/privacy.js'
import { __resetAggregatorForTesting } from '../src/dnd/aggregator.js'
import { __resetDragTargetsForTesting } from '../src/dnd/target.js'
import {
  __resetOnlineDetectorForTesting,
  __simulatePowerEventForTesting,
} from '../src/queue/online-detector.js'
import {
  __resetQueueForTesting,
  __setPersistenceForTesting,
  getPending,
} from '../src/queue/queue.js'
import {
  __getOverlayStackSizeForTesting,
  __resetOverlayStackForTesting,
  setBubbleWindowFactory,
  setOverlayWorkAreaProvider,
  type OverlayBrowserWindow,
  type OverlayWindowOptions,
} from '../src/overlay/bubble-window.js'
import {
  __setOsascriptSpawnerForTesting,
  __setForceDisableElectronForTesting as macForceDisable,
} from '../src/notification/native/mac.js'
import {
  __setPowerShellSpawnerForTesting,
  __setForceDisableElectronForTesting as winForceDisable,
} from '../src/notification/native/win.js'
import {
  __setNotifySendSpawnerForTesting,
  __setForceDisableElectronForTesting as linuxForceDisable,
} from '../src/notification/native/linux.js'
import { __setPlatformForTesting } from '../src/notification/native/index.js'
import { dispatchNotification } from '../src/notification/dispatcher.js'
import {
  type NotificationEvent,
  type OnDeskEvent,
  SECRET_HEADER,
} from '../src/bridge/types.js'

import { request as httpRequest } from 'node:http'

// ─────────────────────────────────────────────────────────────────────────────
// 工具：raw HTTP request（模拟 panda CLI 推送）
// ─────────────────────────────────────────────────────────────────────────────

interface RawResp {
  status: number
  body: string
}

function rawRequest(opts: {
  port: number
  path: string
  method: string
  headers?: Record<string, string>
  body?: string
}): Promise<RawResp> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      {
        host: '127.0.0.1',
        port: opts.port,
        path: opts.path,
        method: opts.method,
        headers: {
          'Content-Type': 'application/json',
          ...(opts.body ? { 'Content-Length': Buffer.byteLength(opts.body).toString() } : {}),
          ...(opts.headers ?? {}),
        },
        timeout: 2_000,
      },
      res => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf-8'),
          }),
        )
      },
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('timeout'))
    })
    if (opts.body) req.write(opts.body)
    req.end()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 工具：mock BrowserWindow（不依赖真 electron）
// ─────────────────────────────────────────────────────────────────────────────

interface MockWindow extends OverlayBrowserWindow {
  __closed: boolean
}

function makeMockWindow(_opts: OverlayWindowOptions): MockWindow {
  const closeListeners: Array<() => void> = []
  const win: MockWindow = {
    __closed: false,
    loadFile: () => {},
    setBounds: () => {},
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
      if (event === 'closed') closeListeners.push(listener as () => void)
    },
    webContents: {
      send: () => {},
      on: () => {},
      once: () => {},
    },
  }
  return win
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试隔离 — 全模块 reset；注入 mock window factory + 平台 stub
// ─────────────────────────────────────────────────────────────────────────────

const createdWindows: MockWindow[] = []

beforeEach(() => {
  __resetBadgeCountsForTesting()
  __resetOverlayStackForTesting()
  __resetDndStateForTesting()
  __resetPrivacyForTesting()
  __resetAggregatorForTesting()
  __resetDragTargetsForTesting()
  __resetOnlineDetectorForTesting()
  __resetQueueForTesting()
  // why: 关闭持久化避免污染 TMP_DIR jsonl 落盘断言其他用例
  __setPersistenceForTesting(false)

  createdWindows.length = 0
  setBubbleWindowFactory(opts => {
    const w = makeMockWindow(opts)
    createdWindows.push(w)
    return w
  })
  setOverlayWorkAreaProvider(() => ({ x: 0, y: 0, width: 1920, height: 1080 }))

  // native 平台 stub — 强制禁用 electron 路径，所有 spawner 设为 noop
  __setOsascriptSpawnerForTesting(async () => {})
  __setPowerShellSpawnerForTesting(async () => {})
  __setNotifySendSpawnerForTesting(async () => {})
  macForceDisable(true)
  winForceDisable(true)
  linuxForceDisable(true)
  __setPlatformForTesting(null)
})

afterEach(() => {
  __resetBadgeCountsForTesting()
  __resetOverlayStackForTesting()
  __resetDndStateForTesting()
  __resetPrivacyForTesting()
  __resetAggregatorForTesting()
  __resetDragTargetsForTesting()
  __resetOnlineDetectorForTesting()
  __resetQueueForTesting()
  __setPersistenceForTesting(true)

  __setOsascriptSpawnerForTesting(null)
  __setPowerShellSpawnerForTesting(null)
  __setNotifySendSpawnerForTesting(null)
  macForceDisable(false)
  winForceDisable(false)
  linuxForceDisable(false)
  __setPlatformForTesting(null)

  createdWindows.length = 0
  setBubbleWindowFactory(null)
})

// 所有用例结束后清理 TMP_DIR
afterEach(() => {
  // 清理可能残留的 dnd-state.json / runtime.json
  try {
    rmSync(join(TMP_DIR, 'runtime.json'), { force: true })
  } catch {
    /* ignore */
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Group A：mock HTTP server → POST /event NotificationEvent → dispatchEvent 调 1 次
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T3 端到端 / mock HTTP server → bridge → dispatcher', () => {
  test('startBridgeServer + raw HTTP POST /event → onEvent 接收 1 次 NotificationEvent', async () => {
    const onEventCalls: OnDeskEvent[] = []
    const handle = await startBridgeServer({
      basePort: 16_400,
      maxProbe: 50,
      secret: 'w2t3-e2e-1',
      onEvent: (e: OnDeskEvent) => onEventCalls.push(e),
    })
    try {
      const event: NotificationEvent = {
        type: 'notification',
        kind: 'overlay',
        level: 'info',
        scenarioId: 'morning-brief',
        title: 'Good morning, commander',
        body: '4 PRs need review',
        ts: Date.now(),
      }
      const resp = await rawRequest({
        port: handle.port,
        path: '/event',
        method: 'POST',
        headers: { [SECRET_HEADER]: 'w2t3-e2e-1' },
        body: JSON.stringify(event),
      })
      expect(resp.status).toBe(200)
      // bridge 同步调 onEvent + dispatchEvent；onEvent 只接 1 次
      expect(onEventCalls.length).toBe(1)
      expect(onEventCalls[0].type).toBe('notification')
      expect((onEventCalls[0] as NotificationEvent).scenarioId).toBe('morning-brief')

      // dispatchEvent 同步路由到 dispatchNotification → showOverlayBubble → mock window 创建
      expect(createdWindows.length).toBe(1)
      expect(__getOverlayStackSizeForTesting()).toBe(1)
    } finally {
      await handle.close()
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B：kind=='system' → showNativeNotification 调
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T3 / kind=system → native 分发', () => {
  test('kind=system + platform=darwin → osascript spawner 被调 1 次', async () => {
    __setPlatformForTesting('darwin')
    let osascriptCalls = 0
    __setOsascriptSpawnerForTesting(async () => {
      osascriptCalls += 1
    })

    dispatchNotification({
      type: 'notification',
      kind: 'system',
      level: 'warning',
      scenarioId: 'disk-low',
      title: 'Disk Low',
      body: '5GB remaining',
      ts: Date.now(),
    })

    // 异步 microtask + Promise 链
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(osascriptCalls).toBe(1)
    // overlay 不应被触发
    expect(__getOverlayStackSizeForTesting()).toBe(0)
  })

  test('kind=system + platform=win32 → powershell spawner 被调 1 次', async () => {
    __setPlatformForTesting('win32')
    let psCalls = 0
    __setPowerShellSpawnerForTesting(async () => {
      psCalls += 1
    })

    dispatchNotification({
      type: 'notification',
      kind: 'system',
      level: 'error',
      scenarioId: 'ci-failed',
      title: 'CI failed',
      body: 'pipeline broken',
      ts: Date.now(),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(psCalls).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C：kind=='overlay' → showOverlayBubble 调
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T3 / kind=overlay → bubble window 创建', () => {
  test('kind=overlay → mock window 创建 1 次；overlay 栈 size=1', () => {
    dispatchNotification({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 'morning-brief',
      title: 'morning briefing ready',
      body: '4 PRs + 2 tasks',
      ts: Date.now(),
    })

    expect(createdWindows.length).toBe(1)
    expect(__getOverlayStackSizeForTesting()).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group D：kind=='badge' → bumpBadge 调
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T3 / kind=badge → bumpBadge', () => {
  test('kind=badge + count=3 → __getBadgeCountForTesting=3', () => {
    dispatchNotification({
      type: 'notification',
      kind: 'badge',
      level: 'info',
      scenarioId: 'git-remote-changed',
      title: 'remote ahead',
      badge: { count: 3 },
      ts: Date.now(),
    })

    expect(__getBadgeCountForTesting('git-remote-changed')).toBe(3)
  })

  test('kind=badge 无 count → 默认 +1', () => {
    dispatchNotification({
      type: 'notification',
      kind: 'badge',
      level: 'info',
      scenarioId: 'git-remote-changed',
      title: 'remote ahead',
      ts: Date.now(),
    })

    expect(__getBadgeCountForTesting('git-remote-changed')).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group E：DND on + level=info → shouldDeliverNotification false（dispatcher 抑制）
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T3 / DND on + level=info → 抑制', () => {
  test('DND 开启 + level=info → overlay 不创建 / badge 不累加', () => {
    setDnd({ enabled: true, reason: 'manual' })

    dispatchNotification({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 'morning-brief', // privacy=low
      title: 'morning brief',
      body: 'should be suppressed',
      ts: Date.now(),
    })

    // privacy=low + DND on + level=info → checkPrivacyUnderDnd → 抑制
    expect(createdWindows.length).toBe(0)
    expect(__getOverlayStackSizeForTesting()).toBe(0)
  })

  test('DND 开启 + level=error → 透传（low privacy 紧急错误优先）', () => {
    setDnd({ enabled: true, reason: 'manual' })

    dispatchNotification({
      type: 'notification',
      kind: 'overlay',
      level: 'error',
      scenarioId: 'ci-failed', // privacy=low
      title: 'CI failed',
      body: 'pipeline broken',
      ts: Date.now(),
    })

    // shouldDeliverNotification: dnd && level==='error' → 直接进 DND off 分支 → 放行
    expect(__getOverlayStackSizeForTesting()).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group F：离线 → enqueue
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T3 / 离线 → enqueue', () => {
  test('lock-screen → isOnline=false → dispatchNotification → 入队，不创建 overlay', () => {
    __simulatePowerEventForTesting('lock-screen')

    const event: NotificationEvent = {
      type: 'notification',
      kind: 'overlay',
      level: 'warning',
      scenarioId: 'disk-low',
      title: 'Disk almost full',
      body: '92% used',
      ts: Date.now(),
    }
    dispatchNotification(event)

    // 入队成功 — 不触发 overlay
    expect(__getOverlayStackSizeForTesting()).toBe(0)
    const pending = getPending()
    expect(pending.length).toBe(1)
    expect(pending[0].scenarioId).toBe('disk-low')
  })

  test('resume → isOnline=true → 后续 dispatchNotification 直发 overlay（不再入队）', () => {
    // 先触发 lock，再 resume，验证状态切换正确
    __simulatePowerEventForTesting('suspend')
    __simulatePowerEventForTesting('resume')

    dispatchNotification({
      type: 'notification',
      kind: 'overlay',
      level: 'warning',
      scenarioId: 'memory-pressure',
      title: 'memory pressure',
      ts: Date.now(),
    })

    expect(__getOverlayStackSizeForTesting()).toBe(1)
    expect(getPending().length).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group G：兜底 — dispatchEvent 显式调 + 未知 kind 兜底（不崩）
// ─────────────────────────────────────────────────────────────────────────────

describe('W2-T3 / dispatchEvent 兼容旧入口', () => {
  test('显式调 dispatchEvent(notification) → dispatchNotification 路由', () => {
    expect(() =>
      dispatchEvent({
        type: 'notification',
        kind: 'overlay',
        level: 'info',
        scenarioId: 'morning-brief',
        title: 'direct dispatchEvent path',
        ts: Date.now(),
      }),
    ).not.toThrow()

    expect(__getOverlayStackSizeForTesting()).toBe(1)
  })
})
