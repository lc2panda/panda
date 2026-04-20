// Input: bun test 触发
// Output: ≥7 用例 — FIFO / 溢出丢最旧 / 离线检测 / 离线 enqueue / 上线 flush + overlay 聚合 /
//         jsonl 持久化 + hydrate / subscribeOnlineChange 回调
// Pos:    Phase 2 P2-T6 通知队列 + 离线累积验证 [NEW-FILE:#20260419-P2-24]
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}

import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 在 import 队列模块前先设置临时配置目录，确保 jsonl 写入隔离
const TMP_DIR = mkdtempSync(join(tmpdir(), 'panda-on-desk-queue-test-'))
process.env.PANDA_CONFIG_DIR = TMP_DIR

// 清理 anthropic 凭据相关 env 干扰（红线：不动 anthropic 通道，但保险起见）
beforeAll(() => {
  process.env.PANDA_CONFIG_DIR = TMP_DIR
})

import {
  QUEUE_MAX,
  __getQueueFilePathForTesting,
  __resetQueueForTesting,
  __setPersistenceForTesting,
  enqueue,
  flush,
  getPending,
  hydrateFromDisk,
} from '../src/queue/queue.js'
import {
  __getSubscriberCountForTesting,
  __resetOnlineDetectorForTesting,
  __simulatePowerEventForTesting,
  isOnline,
  subscribeOnlineChange,
} from '../src/queue/online-detector.js'
import {
  __isOrchestratorRunningForTesting,
  __resetOrchestratorForTesting,
  flushAndShow,
  setFlushOverlayRenderer,
  startQueueOrchestrator,
} from '../src/queue/orchestrator.js'
import { dispatchNotification } from '../src/notification/dispatcher.js'
// why: 默认计划 22:00-08:00 在 UTC 测试环境下可能误判 → 强制关闭，避免 dispatcher 走 privacy gate 抑制
import { __setScheduleForTesting } from '../src/dnd/schedule.js'
import type { NotificationEvent } from '../src/bridge/types.js'

// ─────────────────────────────────────────────────────────────────────────────
// 测试数据工厂
// ─────────────────────────────────────────────────────────────────────────────

function mkEvent(scenarioId: string, level: NotificationEvent['level'] = 'info'): NotificationEvent {
  return {
    type: 'notification',
    kind: 'overlay',
    level,
    scenarioId,
    title: `test-${scenarioId}`,
    body: 'test body',
    ts: Date.now(),
  }
}

beforeEach(() => {
  __resetQueueForTesting()
  __resetOnlineDetectorForTesting()
  __resetOrchestratorForTesting()
  __setPersistenceForTesting(true)
  // why: 强制关闭计划 DND，避免 dispatcher 在 UTC 测试环境下因默认 22:00-08:00 误判而走 privacy gate
  __setScheduleForTesting({ startHHmm: '22:00', endHHmm: '08:00', enabled: false })
})

afterEach(() => {
  __resetQueueForTesting()
  __resetOnlineDetectorForTesting()
  __resetOrchestratorForTesting()
})

// ─────────────────────────────────────────────────────────────────────────────
// Group A：queue.ts FIFO + 溢出
// ─────────────────────────────────────────────────────────────────────────────

describe('queue.ts / FIFO + 溢出', () => {
  test('1. enqueue + flush 顺序正确（FIFO）', () => {
    const e1 = mkEvent('a')
    const e2 = mkEvent('b')
    const e3 = mkEvent('c')
    enqueue(e1)
    enqueue(e2)
    enqueue(e3)
    expect(getPending().length).toBe(3)

    const out = flush()
    expect(out.length).toBe(3)
    expect(out[0].scenarioId).toBe('a')
    expect(out[1].scenarioId).toBe('b')
    expect(out[2].scenarioId).toBe('c')
    expect(getPending().length).toBe(0)
  })

  test('2. 队列溢出时丢最旧（FIFO 截断）', () => {
    // 入队 QUEUE_MAX + 5 个
    for (let i = 0; i < QUEUE_MAX + 5; i += 1) {
      enqueue(mkEvent(`s-${i}`))
    }
    expect(getPending().length).toBe(QUEUE_MAX)
    // 最早 5 个应该被丢
    const first = getPending()[0]
    expect(first.scenarioId).toBe('s-5')
    const last = getPending()[QUEUE_MAX - 1]
    expect(last.scenarioId).toBe(`s-${QUEUE_MAX + 4}`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B：online-detector.ts powerMonitor 模拟
// ─────────────────────────────────────────────────────────────────────────────

describe('online-detector.ts / powerMonitor 模拟', () => {
  test('3. 默认 online；lock-screen → false；unlock-screen → true', () => {
    expect(isOnline()).toBe(true)
    __simulatePowerEventForTesting('lock-screen')
    expect(isOnline()).toBe(false)
    __simulatePowerEventForTesting('unlock-screen')
    expect(isOnline()).toBe(true)
  })

  test('4. suspend → false；resume → true；subscribeOnlineChange 回调正确触发', () => {
    const calls: boolean[] = []
    const unsubscribe = subscribeOnlineChange(state => calls.push(state))
    expect(__getSubscriberCountForTesting()).toBe(1)

    __simulatePowerEventForTesting('suspend')
    __simulatePowerEventForTesting('resume')
    __simulatePowerEventForTesting('lock-screen')

    expect(calls).toEqual([false, true, false])
    // 重复触发同状态不应再回调
    __simulatePowerEventForTesting('lock-screen')
    expect(calls).toEqual([false, true, false])

    unsubscribe()
    expect(__getSubscriberCountForTesting()).toBe(0)
    __simulatePowerEventForTesting('resume')
    expect(calls).toEqual([false, true, false])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C：dispatcher.ts 离线 → enqueue 不调 native；上线 → flush + 聚合
// ─────────────────────────────────────────────────────────────────────────────

describe('dispatcher × queue × orchestrator', () => {
  test('5. 离线时 dispatchNotification → enqueue（不调 overlay/badge/sound 子模块）', () => {
    __simulatePowerEventForTesting('lock-screen')
    expect(isOnline()).toBe(false)

    // 派发 3 条；本应 overlay 渲染，但离线模式下直接入队
    dispatchNotification(mkEvent('ci-failed', 'error'))
    dispatchNotification(mkEvent('git-remote', 'info'))
    dispatchNotification(mkEvent('disk-low', 'warning'))

    expect(getPending().length).toBe(3)
    // 顺序应保留
    expect(getPending()[0].scenarioId).toBe('ci-failed')
    expect(getPending()[2].scenarioId).toBe('disk-low')
  })

  test('6. 上线 → flush + 聚合 overlay（startQueueOrchestrator 钩子触发）', () => {
    // 注入测试用 renderer
    const captured: NotificationEvent[][] = []
    setFlushOverlayRenderer(events => {
      captured.push([...events])
    })

    startQueueOrchestrator()
    expect(__isOrchestratorRunningForTesting()).toBe(true)

    // 离线 → 入队 3 条
    __simulatePowerEventForTesting('lock-screen')
    dispatchNotification(mkEvent('a', 'error'))
    dispatchNotification(mkEvent('b'))
    dispatchNotification(mkEvent('c'))
    expect(getPending().length).toBe(3)

    // 上线 → orchestrator 钩子调 flushAndShow → 1 次 renderer 调用，传入 3 条
    __simulatePowerEventForTesting('unlock-screen')
    expect(captured.length).toBe(1)
    expect(captured[0].length).toBe(3)
    expect(captured[0][0].scenarioId).toBe('a')
    // flush 后队列应清空
    expect(getPending().length).toBe(0)
  })

  test('7. flushAndShow 在空队列时不调 renderer（避免空 overlay）', () => {
    let callCount = 0
    setFlushOverlayRenderer(() => {
      callCount += 1
    })
    const out = flushAndShow()
    expect(out.length).toBe(0)
    expect(callCount).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group D：jsonl 持久化 + hydrate
// ─────────────────────────────────────────────────────────────────────────────

describe('queue.ts / jsonl 持久化', () => {
  test('8. enqueue 持久化 jsonl 写入 + hydrate 从盘恢复', () => {
    const filePath = __getQueueFilePathForTesting()
    // 先确保从干净状态开始
    __resetQueueForTesting()
    expect(existsSync(filePath)).toBe(false)

    enqueue(mkEvent('persist-1', 'error'))
    enqueue(mkEvent('persist-2', 'info'))

    expect(existsSync(filePath)).toBe(true)
    const raw = readFileSync(filePath, 'utf-8')
    const lines = raw.split('\n').filter(l => l.trim().length > 0)
    expect(lines.length).toBe(2)
    const parsed1 = JSON.parse(lines[0]) as NotificationEvent
    expect(parsed1.scenarioId).toBe('persist-1')
    expect(parsed1.level).toBe('error')

    // 模拟进程重启 — 只清内存，jsonl 保留
    __setPersistenceForTesting(false) // 防 reset 清盘
    // 直接清内存（不通过 reset，因为 reset 会清盘）
    flush() // flush 在 persistence=false 下也不清盘
    __setPersistenceForTesting(true)

    // jsonl 应仍存在
    // 注：上面 flush() 内调了 clearJsonl，因 persistenceEnabled 已切回 true 之前
    // 但实际 flush() 在 persistence=false 时跳过清盘 — 所以仍存在
    // 重新写一遍以确保文件有内容
    enqueue(mkEvent('persist-3', 'warning'))
    flush() // 这次 persistence=true，会清盘

    // 重新写两条用于 hydrate 测试
    enqueue(mkEvent('hydrate-a'))
    enqueue(mkEvent('hydrate-b', 'error'))
    // 此时盘上有 2 条；模拟"重启" — 只清内存
    __setPersistenceForTesting(false)
    flush() // 清内存不清盘
    __setPersistenceForTesting(true)

    expect(getPending().length).toBe(0)
    // hydrate 从盘恢复
    const restored = hydrateFromDisk()
    expect(restored).toBe(2)
    expect(getPending().length).toBe(2)
    expect(getPending()[0].scenarioId).toBe('hydrate-a')
    expect(getPending()[1].scenarioId).toBe('hydrate-b')

    // 清理
    __resetQueueForTesting()
    expect(existsSync(filePath)).toBe(false)
  })

  test('9. flush 后 jsonl 文件被清空', () => {
    __resetQueueForTesting()
    enqueue(mkEvent('clear-test'))
    const filePath = __getQueueFilePathForTesting()
    expect(existsSync(filePath)).toBe(true)
    flush()
    expect(existsSync(filePath)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 测试套件结束 — 清理临时目录
// ─────────────────────────────────────────────────────────────────────────────

describe('teardown', () => {
  test('10. 清理临时配置目录', () => {
    try {
      rmSync(TMP_DIR, { recursive: true, force: true })
    } catch {
      // ignore
    }
    expect(true).toBe(true)
  })
})
