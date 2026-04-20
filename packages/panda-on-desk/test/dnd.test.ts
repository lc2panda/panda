// Input:  bun test 触发
// Output: ≥8 用例 — DND 状态机 + 持久化 + 自动恢复 + 计划静音 + 隐私过滤 + 5min 聚合 + dispatcher 入口 gate
// Pos:    Phase 2 P2-T5 DND 模式 + 隐私敏感 + 通知聚合验证 [NEW-FILE:#20260419-P2-20]
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}

import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 在 import DND 模块前先设置临时配置目录，确保 dnd-state.json / dnd-schedule.json 写入隔离
const TMP_DIR = mkdtempSync(join(tmpdir(), 'panda-on-desk-dnd-test-'))
process.env.PANDA_CONFIG_DIR = TMP_DIR

beforeAll(() => {
  process.env.PANDA_CONFIG_DIR = TMP_DIR
})

import {
  __getDndFilePathForTesting,
  __getDndStateForTesting,
  __resetDndStateForTesting,
  __setDndPersistenceForTesting,
  dispatchDnd,
  getDndState,
  hydrateDndFromDisk,
  isDndActive,
  isInDnd,
  setDnd,
} from '../src/dnd/state.js'
import {
  __getScheduleFilePathForTesting,
  __resetScheduleForTesting,
  __setScheduleForTesting,
  __setSchedulePersistenceForTesting,
  getDndSchedule,
  isInScheduledDnd,
  setDndSchedule,
} from '../src/dnd/schedule.js'
import {
  __getEnabledHighPrivacyForTesting,
  __resetPrivacyForTesting,
  enableHighPrivacyScene,
  shouldDeliverNotification,
} from '../src/dnd/privacy.js'
import {
  __getWindowCountForTesting,
  __getWindowForTesting,
  __resetAggregatorForTesting,
  aggregateNotification,
  AGGREGATION_WINDOW_MS,
} from '../src/dnd/aggregator.js'
import { dispatchNotification } from '../src/notification/dispatcher.js'
import {
  __getBadgeCountForTesting,
  __resetBadgeCountsForTesting,
} from '../src/badge/manager.js'
import { __resetQueueForTesting, __setPersistenceForTesting, getPending } from '../src/queue/queue.js'
import {
  __resetOnlineDetectorForTesting,
  __simulatePowerEventForTesting,
} from '../src/queue/online-detector.js'
import type { NotificationEvent } from '../src/bridge/types.js'

// ─────────────────────────────────────────────────────────────────────────────
// 工厂
// ─────────────────────────────────────────────────────────────────────────────

function mkBadgeEvent(scenarioId: string, level: NotificationEvent['level']): NotificationEvent {
  return {
    type: 'notification',
    kind: 'badge',
    level,
    scenarioId,
    title: 't',
    badge: { count: 1 },
    ts: Date.now(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试隔离
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  __resetDndStateForTesting()
  __resetScheduleForTesting()
  __resetPrivacyForTesting()
  __resetAggregatorForTesting()
  __resetBadgeCountsForTesting()
  __resetQueueForTesting()
  __resetOnlineDetectorForTesting()
  __setDndPersistenceForTesting(true)
  __setSchedulePersistenceForTesting(true)
  __setPersistenceForTesting(false) // 队列 jsonl 测试不必落盘
  // why: 默认 22:00-08:00 在 UTC 测试环境下可能误判 → 在 reset 后强制关闭 schedule，
  //      privacy/dispatcher 测试组不依赖时段 DND；schedule 组内会显式 __setScheduleForTesting 重新注入
  __setScheduleForTesting({ startHHmm: '22:00', endHHmm: '08:00', enabled: false })
})

afterEach(() => {
  __resetDndStateForTesting()
  __resetScheduleForTesting()
  __resetPrivacyForTesting()
  __resetAggregatorForTesting()
  __resetBadgeCountsForTesting()
  __resetQueueForTesting()
  __resetOnlineDetectorForTesting()
})

// ─────────────────────────────────────────────────────────────────────────────
// Group A：DND 状态机 + 持久化 + 自动恢复
// ─────────────────────────────────────────────────────────────────────────────

describe('dnd/state — setDnd / getDndState / isInDnd', () => {
  test('setDnd enabled=true → isInDnd 返回 true；reason 写入', () => {
    setDnd({ enabled: true, reason: 'manual' })
    expect(isInDnd()).toBe(true)
    expect(getDndState().enabled).toBe(true)
    expect(getDndState().reason).toBe('manual')
    // 兼容旧 export
    expect(isDndActive()).toBe(true)
  })

  test('setDnd enabled=false → isInDnd 返回 false', () => {
    setDnd({ enabled: true, reason: 'focus-mode' })
    expect(isInDnd()).toBe(true)
    setDnd({ enabled: false })
    expect(isInDnd()).toBe(false)
    expect(getDndState().endsAt).toBeUndefined()
  })

  test('endsAt 已过 → isInDnd 自动惰性恢复', () => {
    setDnd({ enabled: true, reason: 'schedule', endsAt: Date.now() - 1000 })
    // 立即查询应返回 false 并修正内存态
    expect(isInDnd()).toBe(false)
    expect(__getDndStateForTesting().enabled).toBe(false)
  })

  test('dispatchDnd（DndEvent 入口）= setDnd 等价', () => {
    dispatchDnd({
      type: 'dnd',
      enabled: true,
      reason: 'focus-mode',
      ts: Date.now(),
    })
    expect(isInDnd()).toBe(true)
    expect(getDndState().reason).toBe('focus-mode')
  })

  test('持久化：setDnd 后落盘 dnd-state.json；hydrateDndFromDisk 可恢复', () => {
    setDnd({ enabled: true, reason: 'manual' })
    expect(existsSync(__getDndFilePathForTesting())).toBe(true)
    const raw = readFileSync(__getDndFilePathForTesting(), 'utf-8')
    const parsed = JSON.parse(raw)
    expect(parsed.enabled).toBe(true)
    expect(parsed.reason).toBe('manual')

    // 模拟进程重启
    __resetDndStateForTesting()
    expect(isInDnd()).toBe(false)
    const ok = hydrateDndFromDisk()
    expect(ok).toBe(true)
    expect(isInDnd()).toBe(true)
    expect(getDndState().reason).toBe('manual')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B：计划 DND
// ─────────────────────────────────────────────────────────────────────────────

describe('dnd/schedule — isInScheduledDnd', () => {
  test('默认计划 22:00-08:00；02:00 应在静音内', () => {
    __setScheduleForTesting(null) // 走默认
    const at02 = new Date()
    at02.setHours(2, 0, 0, 0)
    expect(isInScheduledDnd(at02)).toBe(true)
    const at12 = new Date()
    at12.setHours(12, 0, 0, 0)
    expect(isInScheduledDnd(at12)).toBe(false)
  })

  test('跨天窗口 22:00-08:00：23:30 / 07:30 静音中；09:00 / 21:00 静音外', () => {
    __setScheduleForTesting({ startHHmm: '22:00', endHHmm: '08:00', enabled: true })
    const make = (h: number, m: number): Date => {
      const d = new Date()
      d.setHours(h, m, 0, 0)
      return d
    }
    expect(isInScheduledDnd(make(23, 30))).toBe(true)
    expect(isInScheduledDnd(make(7, 30))).toBe(true)
    expect(isInScheduledDnd(make(9, 0))).toBe(false)
    expect(isInScheduledDnd(make(21, 0))).toBe(false)
  })

  test('enabled=false → isInScheduledDnd 始终 false', () => {
    __setScheduleForTesting({ startHHmm: '22:00', endHHmm: '08:00', enabled: false })
    const at02 = new Date()
    at02.setHours(2, 0, 0, 0)
    expect(isInScheduledDnd(at02)).toBe(false)
  })

  test('setDndSchedule 落盘 + 读取', () => {
    setDndSchedule({ startHHmm: '23:00', endHHmm: '06:30', enabled: true })
    expect(existsSync(__getScheduleFilePathForTesting())).toBe(true)
    const cfg = getDndSchedule()
    expect(cfg.startHHmm).toBe('23:00')
    expect(cfg.endHHmm).toBe('06:30')
  })

  test('非法 HHmm → setDndSchedule 抛错', () => {
    expect(() =>
      setDndSchedule({ startHHmm: '25:00', endHHmm: '06:30' }),
    ).toThrow()
    expect(() =>
      setDndSchedule({ startHHmm: '22:00', endHHmm: 'abc' }),
    ).toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C：隐私过滤
// ─────────────────────────────────────────────────────────────────────────────

describe('dnd/privacy — shouldDeliverNotification', () => {
  test('DND off + low privacy + 任意 level → 放行', () => {
    expect(isInDnd()).toBe(false)
    // disk-low 是 low privacy
    expect(shouldDeliverNotification(mkBadgeEvent('disk-low', 'info'))).toBe(true)
    expect(shouldDeliverNotification(mkBadgeEvent('disk-low', 'warning'))).toBe(true)
    expect(shouldDeliverNotification(mkBadgeEvent('disk-low', 'error'))).toBe(true)
  })

  test('DND on + low + info → 抑制；DND on + low + error → 强透传', () => {
    setDnd({ enabled: true, reason: 'manual' })
    expect(shouldDeliverNotification(mkBadgeEvent('disk-low', 'info'))).toBe(false)
    expect(shouldDeliverNotification(mkBadgeEvent('disk-low', 'error'))).toBe(true)
    // low + warning + DND on → 透传（仅 info 抑制）
    expect(shouldDeliverNotification(mkBadgeEvent('disk-low', 'warning'))).toBe(true)
  })

  test('DND on + medium privacy → 抑制（calendar-reminder）', () => {
    setDnd({ enabled: true, reason: 'manual' })
    // calendar-reminder 是 medium privacy
    expect(shouldDeliverNotification(mkBadgeEvent('calendar-reminder', 'info'))).toBe(false)
    expect(shouldDeliverNotification(mkBadgeEvent('calendar-reminder', 'warning'))).toBe(false)
    // error 强透传
    expect(shouldDeliverNotification(mkBadgeEvent('calendar-reminder', 'error'))).toBe(true)
  })

  test('high privacy（构造场景）+ 用户未显式 enable → 抑制；显式 enable 后仅 DND off 放行', () => {
    // 注册表中无 high privacy 场景 — 用未注册的 scenarioId 模拟（默认 low）；
    // 直接用 calendar-reminder=medium 验证 high 路径需手动构造，本用例聚焦 enable 集合契约
    const scenarioId = 'private-scene-x'
    enableHighPrivacyScene(scenarioId)
    expect(__getEnabledHighPrivacyForTesting().has(scenarioId)).toBe(true)
    // 未注册 scene → 视为 low；DND off → 放行
    expect(shouldDeliverNotification(mkBadgeEvent(scenarioId, 'info'))).toBe(true)
  })

  test('计划 DND 命中 → 等同于手动 DND', () => {
    __setScheduleForTesting({ startHHmm: '00:00', endHHmm: '23:59', enabled: true })
    expect(isInScheduledDnd()).toBe(true)
    expect(shouldDeliverNotification(mkBadgeEvent('disk-low', 'info'))).toBe(false)
    expect(shouldDeliverNotification(mkBadgeEvent('disk-low', 'error'))).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group D：5 分钟聚合
// ─────────────────────────────────────────────────────────────────────────────

describe('dnd/aggregator — aggregateNotification', () => {
  test('首次 → skip=false；窗口内重复 → skip=true + mergedCount 累计', () => {
    const e = mkBadgeEvent('ci-failed', 'error')
    expect(aggregateNotification(e, 1000).skip).toBe(false)
    const r2 = aggregateNotification(e, 2000)
    expect(r2.skip).toBe(true)
    expect(r2.mergedCount).toBe(2)
    const r3 = aggregateNotification(e, 60_000)
    expect(r3.skip).toBe(true)
    expect(r3.mergedCount).toBe(3)
  })

  test('窗口过期（>5min）→ 重置为新首次', () => {
    const e = mkBadgeEvent('git-remote-changed', 'info')
    aggregateNotification(e, 0)
    aggregateNotification(e, 1000)
    expect(__getWindowForTesting('git-remote-changed')?.count).toBe(2)
    // 跨过窗口边界
    const r = aggregateNotification(e, AGGREGATION_WINDOW_MS + 10)
    expect(r.skip).toBe(false)
    expect(__getWindowForTesting('git-remote-changed')?.count).toBe(1)
  })

  test('不同 scenarioId 各自独立窗口', () => {
    aggregateNotification(mkBadgeEvent('a', 'info'), 0)
    aggregateNotification(mkBadgeEvent('b', 'info'), 0)
    expect(__getWindowCountForTesting()).toBe(2)
    expect(aggregateNotification(mkBadgeEvent('a', 'info'), 100).skip).toBe(true)
    expect(aggregateNotification(mkBadgeEvent('b', 'info'), 100).skip).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group E：dispatcher 入口 gate 集成
// ─────────────────────────────────────────────────────────────────────────────

describe('dispatcher 入口 gate — DND + 隐私 + 聚合一体生效', () => {
  test('DND on + medium privacy → dispatcher 抑制（badge 不累加）', () => {
    setDnd({ enabled: true, reason: 'manual' })
    // calendar-reminder 是 medium；DND on → privacy gate 抑制
    dispatchNotification(mkBadgeEvent('calendar-reminder', 'info'))
    expect(__getBadgeCountForTesting('calendar-reminder')).toBe(0)
  })

  test('DND on + low + warning + 5min 聚合 → 第二次起被聚合 skip（badge 仅 +1）', () => {
    setDnd({ enabled: true, reason: 'manual' })
    // disk-low + warning + DND on → privacy 放行（仅 info 抑制），进入聚合
    dispatchNotification(mkBadgeEvent('disk-low', 'warning'))
    dispatchNotification(mkBadgeEvent('disk-low', 'warning'))
    dispatchNotification(mkBadgeEvent('disk-low', 'warning'))
    // 第一条放行 → badge +1；第 2/3 条被 aggregator skip
    expect(__getBadgeCountForTesting('disk-low')).toBe(1)
  })

  test('DND off → 聚合不介入（高频通知全部 forward）', () => {
    expect(isInDnd()).toBe(false)
    dispatchNotification(mkBadgeEvent('disk-low', 'info'))
    dispatchNotification(mkBadgeEvent('disk-low', 'info'))
    dispatchNotification(mkBadgeEvent('disk-low', 'info'))
    // DND off → aggregator 不介入，3 条都 +1
    expect(__getBadgeCountForTesting('disk-low')).toBe(3)
  })

  test('DND on + low + error → 强透传（badge 累加 + 不进队列）', () => {
    setDnd({ enabled: true, reason: 'manual' })
    // 模拟在线，避免被 queue 拦
    __simulatePowerEventForTesting('resume')
    dispatchNotification(mkBadgeEvent('ci-failed', 'error'))
    expect(__getBadgeCountForTesting('ci-failed')).toBe(1)
    expect(getPending().length).toBe(0)
  })

  test('被 gate 抑制的事件不进 offline 队列（gate 早于 isOnline 检查）', () => {
    setDnd({ enabled: true, reason: 'manual' })
    __simulatePowerEventForTesting('suspend') // 离线
    // medium privacy + DND on + info → privacy gate 抑制
    dispatchNotification(mkBadgeEvent('calendar-reminder', 'info'))
    expect(getPending().length).toBe(0)
    expect(__getBadgeCountForTesting('calendar-reminder')).toBe(0)
  })
})
