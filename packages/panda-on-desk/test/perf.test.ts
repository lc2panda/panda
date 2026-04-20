// Input:  W5-T4 性能优化点 — BadgeManager dedupe / dispatcher batching / preload 加固
// Output: ≥ 5 用例验证：
//          1. BadgeManager 同 (scenarioId,count) → 仅一次 webContents.send
//          2. 不同 scenario 多次累加 → 每次 distinct snapshot 都 send（dedupe 不误伤）
//          3. dispatcher batching — 同 (scenarioId,kind,level) 5ms 窗内多 event 合并为一次 dispatchNotification
//          4. dispatcher batching — 不同 key 不被合并
//          5. preload contextBridge 风格 mock — pandaBadge.onUpdate 拿到 dedupe 后 payload
//          6. BadgeManager reset → 同 0/0 不重复 publish；后续真实 bump 重新触发
//          7. notification batching — flush 后 batch size 归零
// Pos:    panda-on-desk W5-T4 性能 polish 集成测试 [NEW-FILE:#W5-03]
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import {
  __getBadgeCountForTesting,
  __resetBadgeCountsForTesting,
  __resetBadgeDedupeSigForTesting,
  bumpBadge,
  resetBadge,
  setBadgeRendererNotifier,
  type BadgeUpdatePayload,
} from '../src/badge/manager.js'
import {
  __flushNotificationBatchForTesting,
  __getNotificationBatchSizeForTesting,
  __resetNotificationBatchForTesting,
  dispatchNotificationBatched,
  NOTIFICATION_BATCH_WINDOW_MS,
} from '../src/notification/dispatcher.js'
import { __resetDndStateForTesting } from '../src/dnd/state.js'

// ─────────────────────────────────────────────────────────────────────────────
// 测试隔离 — 每个用例前后清 manager / dispatcher batch / dnd
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  __resetBadgeCountsForTesting()
  __resetNotificationBatchForTesting()
  __resetDndStateForTesting()
})

afterEach(() => {
  __resetBadgeCountsForTesting()
  __resetNotificationBatchForTesting()
  __resetDndStateForTesting()
})

// ─────────────────────────────────────────────────────────────────────────────
// Group A：BadgeManager dedupe — 性能优化点 4
// ─────────────────────────────────────────────────────────────────────────────

describe('W5-T4 / BadgeManager dedupe — 同 (scenarioId,count) 不重复 publish', () => {
  test('连续 bump 至同 count → 仅首次触发 notifyHitWin', () => {
    const sends: BadgeUpdatePayload[] = []
    setBadgeRendererNotifier((_channel, payload) => {
      sends.push(payload as BadgeUpdatePayload)
    })

    // 首次：count 0 → 1（签名变化 → publish）
    bumpBadge('ci-failed', 1)
    expect(sends.length).toBe(1)
    expect(sends[0].total).toBe(1)

    // 第二次同 scenario delta=0（手动 bump 0 → count 不变）→ 签名同 → 不 publish
    bumpBadge('ci-failed', 0)
    expect(sends.length).toBe(1)

    // 第三次 delta=1 → count 变 2 → 签名变 → publish
    bumpBadge('ci-failed', 1)
    expect(sends.length).toBe(2)
    expect(sends[1].total).toBe(2)
  })

  test('reset 至同 count=0 → 仅首次 publish；后续重复 reset 被吞', () => {
    const sends: BadgeUpdatePayload[] = []
    setBadgeRendererNotifier((_channel, payload) => {
      sends.push(payload as BadgeUpdatePayload)
    })

    bumpBadge('disk-low', 5)
    expect(sends.length).toBe(1)

    resetBadge('disk-low')
    expect(sends.length).toBe(2)
    expect(sends[1].total).toBe(0)

    // 重复 reset → 签名（disk-low=0, total=0）相同 → 吞
    resetBadge('disk-low')
    resetBadge('disk-low')
    expect(sends.length).toBe(2)
  })

  test('多 scenarioId 累加 — 签名变化每次都 publish（dedupe 不误伤）', () => {
    const sends: BadgeUpdatePayload[] = []
    setBadgeRendererNotifier((_channel, payload) => {
      sends.push(payload as BadgeUpdatePayload)
    })

    bumpBadge('ci-failed', 1)         // sig: ci-failed=1, total=1
    bumpBadge('git-remote', 2)        // sig: ci-failed=1|git-remote=2, total=3
    bumpBadge('disk-low', 3)          // sig: 三 entry, total=6
    expect(sends.length).toBe(3)
    expect(sends[2].total).toBe(6)
    expect(__getBadgeCountForTesting('ci-failed')).toBe(1)
    expect(__getBadgeCountForTesting('git-remote')).toBe(2)
    expect(__getBadgeCountForTesting('disk-low')).toBe(3)
  })

  test('__resetBadgeDedupeSigForTesting → 签名清零后下次 publish 即使内容相同也触发', () => {
    const sends: BadgeUpdatePayload[] = []
    setBadgeRendererNotifier((_channel, payload) => {
      sends.push(payload as BadgeUpdatePayload)
    })

    bumpBadge('a', 1)
    expect(sends.length).toBe(1)

    bumpBadge('a', 0) // 同 count → 吞
    expect(sends.length).toBe(1)

    __resetBadgeDedupeSigForTesting()
    bumpBadge('a', 0) // 同 count，但签名清了 → 重新 publish
    expect(sends.length).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B：dispatcher batching — 性能优化点 3（5ms 内合并）
// ─────────────────────────────────────────────────────────────────────────────

describe('W5-T4 / dispatcher 5ms batching — 同 key 多 event 合并', () => {
  test('同 (scenarioId,kind,level) 多 event 排队 → batch size=1', () => {
    dispatchNotificationBatched({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 'ci-failed',
      title: 'try 1',
      ts: Date.now(),
    })
    dispatchNotificationBatched({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 'ci-failed',
      title: 'try 2',
      ts: Date.now(),
    })
    dispatchNotificationBatched({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 'ci-failed',
      title: 'try 3',
      ts: Date.now(),
    })
    // 同 key，batch 合并为 1 entry
    expect(__getNotificationBatchSizeForTesting()).toBe(1)
  })

  test('不同 (scenarioId,kind,level) 各自独立 — batch size=3', () => {
    dispatchNotificationBatched({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 'ci-failed',
      title: 'a',
      ts: Date.now(),
    })
    dispatchNotificationBatched({
      type: 'notification',
      kind: 'system',  // kind 不同
      level: 'info',
      scenarioId: 'ci-failed',
      title: 'a',
      ts: Date.now(),
    })
    dispatchNotificationBatched({
      type: 'notification',
      kind: 'overlay',
      level: 'error', // level 不同
      scenarioId: 'ci-failed',
      title: 'a',
      ts: Date.now(),
    })
    expect(__getNotificationBatchSizeForTesting()).toBe(3)
  })

  test('__flushNotificationBatchForTesting → 强制清空 batch', () => {
    dispatchNotificationBatched({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 'flush-test',
      title: 'pre-flush',
      ts: Date.now(),
    })
    expect(__getNotificationBatchSizeForTesting()).toBe(1)
    __flushNotificationBatchForTesting()
    expect(__getNotificationBatchSizeForTesting()).toBe(0)
  })

  test('5ms 后 timer 自动 flush → batch size 归零', async () => {
    dispatchNotificationBatched({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 'auto-flush',
      title: 'tick',
      ts: Date.now(),
    })
    expect(__getNotificationBatchSizeForTesting()).toBe(1)
    // 等 batch 窗口 + 余裕（事件循环调度延迟）
    await new Promise(r => setTimeout(r, NOTIFICATION_BATCH_WINDOW_MS + 30))
    expect(__getNotificationBatchSizeForTesting()).toBe(0)
  })

  test('NOTIFICATION_BATCH_WINDOW_MS 常量为 5（性能契约）', () => {
    expect(NOTIFICATION_BATCH_WINDOW_MS).toBe(5)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C：preload contextBridge mock — pandaBadge.onUpdate 行为契约
// ─────────────────────────────────────────────────────────────────────────────

describe('W5-T4 / preload contextBridge mock — pandaBadge.onUpdate 拿到 dedupe 后 payload', () => {
  test('mock notifier 模拟 sendToHitWin → handler 收到 BadgeUpdatePayload', () => {
    // 模拟 preload 注入的 window.pandaBadge.onUpdate
    let lastPayload: BadgeUpdatePayload | null = null
    const handlers: Array<(p: BadgeUpdatePayload) => void> = []
    const mockPandaBadge = {
      onUpdate(cb: (p: BadgeUpdatePayload) => void) {
        handlers.push(cb)
        return () => {
          const i = handlers.indexOf(cb)
          if (i !== -1) handlers.splice(i, 1)
        }
      },
    }
    mockPandaBadge.onUpdate(p => { lastPayload = p })

    // 注入 manager → mock：相当于 main.ts 启动时 setBadgeRendererNotifier 桥接
    setBadgeRendererNotifier((_channel, payload) => {
      // 模拟 webContents.send → 渲染端 ipcRenderer.on → preload handler
      for (const h of handlers) h(payload as BadgeUpdatePayload)
    })

    bumpBadge('mock-scenario', 7)
    expect(lastPayload).not.toBeNull()
    expect(lastPayload!.total).toBe(7)
    expect(lastPayload!.entries.length).toBe(1)
    expect(lastPayload!.entries[0].scenarioId).toBe('mock-scenario')
    expect(lastPayload!.entries[0].count).toBe(7)
  })

  test('handler removeListener 风格 — unsubscribe 后不再收 payload', () => {
    let recvCount = 0
    const handlers: Array<(p: BadgeUpdatePayload) => void> = []
    const mockPandaBadge = {
      onUpdate(cb: (p: BadgeUpdatePayload) => void) {
        handlers.push(cb)
        // 返回 unsubscribe（与真实 preload 一致）
        return () => {
          const i = handlers.indexOf(cb)
          if (i !== -1) handlers.splice(i, 1)
        }
      },
    }
    const unsub = mockPandaBadge.onUpdate(() => { recvCount++ })

    setBadgeRendererNotifier((_channel, payload) => {
      for (const h of handlers) h(payload as BadgeUpdatePayload)
    })

    bumpBadge('a', 1)
    expect(recvCount).toBe(1)

    // unsubscribe → 后续 publish 不应触发 handler（防内存泄漏：页面 unload 时必须 remove）
    unsub()
    bumpBadge('a', 1)
    expect(recvCount).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group D：内存 / dispose 验证 — 性能优化点（资源释放）
// ─────────────────────────────────────────────────────────────────────────────

describe('W5-T4 / 内存优化 — setBadgeRendererNotifier(null) 解绑后不再 send', () => {
  test('解绑 notifier → 后续 bump 不抛错且无 send 触发', () => {
    let sendCount = 0
    setBadgeRendererNotifier(() => { sendCount++ })

    bumpBadge('mem-leak-test', 1)
    expect(sendCount).toBe(1)

    // 模拟 hit window 销毁时 main.ts 应解绑 notifier
    setBadgeRendererNotifier(null)
    expect(() => bumpBadge('mem-leak-test', 1)).not.toThrow()
    expect(sendCount).toBe(1)
  })
})
