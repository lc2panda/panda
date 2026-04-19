// Input:  panda-on-desk src/bridge/server.ts dispatchEvent + 4 子模块占位 stub
// Output: 5+ 用例 — 验证 type 路由正确 / 占位 stub 不崩 / 未知 type 警告日志不崩
// Pos:    Phase 2 P2-T1 IPC 协议扩展验证 [NEW-FILE:#20260419-P2-06]
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { dispatchEvent } from '../src/bridge/server.js'
import {
  __getBadgeCountForTesting,
  __resetBadgeCountsForTesting,
} from '../src/badge/manager.js'
import {
  __getDndStateForTesting,
  __resetDndStateForTesting,
  isDndActive,
} from '../src/dnd/state.js'
import {
  __isDragTargetActiveForTesting,
  __resetDragTargetsForTesting,
} from '../src/dnd/target.js'
import {
  SCENE_REGISTRY,
  getSceneMeta,
  listDefaultOnScenarios,
} from '../src/scene/registry.js'
import type { OnDeskEvent } from '../src/bridge/types.js'

beforeEach(() => {
  __resetBadgeCountsForTesting()
  __resetDragTargetsForTesting()
  __resetDndStateForTesting()
})

afterEach(() => {
  __resetBadgeCountsForTesting()
  __resetDragTargetsForTesting()
  __resetDndStateForTesting()
})

// ─────────────────────────────────────────────────────────────────────────────
// Group A：dispatchEvent 路由 4 新 type → 各 stub 子模块
// ─────────────────────────────────────────────────────────────────────────────

describe('dispatchEvent / 路由 notification', () => {
  test('notification → dispatchNotification stub 不崩', () => {
    expect(() =>
      dispatchEvent({
        type: 'notification',
        kind: 'overlay',
        level: 'error',
        scenarioId: 'ci-failed',
        title: 'CI failed',
        ts: Date.now(),
      }),
    ).not.toThrow()
  })
})

describe('dispatchEvent / 路由 badge', () => {
  test('badge delta → manager stub 累加', () => {
    dispatchEvent({
      type: 'badge',
      scenarioId: 'git-remote-changed',
      delta: 3,
      ts: Date.now(),
    })
    expect(__getBadgeCountForTesting('git-remote-changed')).toBe(3)

    dispatchEvent({
      type: 'badge',
      scenarioId: 'git-remote-changed',
      delta: 1,
      ts: Date.now(),
    })
    expect(__getBadgeCountForTesting('git-remote-changed')).toBe(4)
  })

  test('badge reset → manager stub 清零', () => {
    dispatchEvent({
      type: 'badge',
      scenarioId: 'disk-low',
      delta: 5,
      ts: Date.now(),
    })
    dispatchEvent({
      type: 'badge',
      scenarioId: 'disk-low',
      reset: true,
      ts: Date.now(),
    })
    expect(__getBadgeCountForTesting('disk-low')).toBe(0)
  })
})

describe('dispatchEvent / 路由 drag-target', () => {
  test('enable → target stub 标记激活；disable → 移除', () => {
    dispatchEvent({
      type: 'drag-target',
      enable: true,
      acceptKinds: ['file'],
      scenarioId: 'file-organizer',
      ts: Date.now(),
    })
    expect(__isDragTargetActiveForTesting('file-organizer')).toBe(true)

    dispatchEvent({
      type: 'drag-target',
      enable: false,
      acceptKinds: [],
      scenarioId: 'file-organizer',
      ts: Date.now(),
    })
    expect(__isDragTargetActiveForTesting('file-organizer')).toBe(false)
  })
})

describe('dispatchEvent / 路由 dnd', () => {
  test('enabled=true → state stub 设激活；isDndActive 反映之', () => {
    expect(isDndActive()).toBe(false)
    dispatchEvent({
      type: 'dnd',
      enabled: true,
      reason: 'focus-mode',
      ts: Date.now(),
    })
    expect(isDndActive()).toBe(true)
    expect(__getDndStateForTesting().reason).toBe('focus-mode')

    dispatchEvent({
      type: 'dnd',
      enabled: false,
      ts: Date.now(),
    })
    expect(isDndActive()).toBe(false)
  })

  test('endsAt 已过 → isDndActive 返回 false', () => {
    dispatchEvent({
      type: 'dnd',
      enabled: true,
      reason: 'schedule',
      endsAt: Date.now() - 1000, // 已过期
      ts: Date.now(),
    })
    expect(isDndActive()).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B：未知 / 7 个旧 type → dispatchEvent 不崩，不误触发新分发
// ─────────────────────────────────────────────────────────────────────────────

describe('dispatchEvent / 旧 7 type 不触发新 stub', () => {
  test('pet-state / xp-gained / level-up / scene 等不应改 badge / dnd / drag', () => {
    const oldEvents: OnDeskEvent[] = [
      { type: 'pet-state', state: 'thinking', sessionId: 's', ts: Date.now() },
      { type: 'xp-gained', delta: 5, bucket: 'time', totalXp: 100, level: 1, ts: Date.now() },
      { type: 'level-up', fromLevel: 1, toLevel: 2, ts: Date.now() },
      {
        type: 'permission',
        requestId: 'r1',
        toolName: 'Bash',
        summary: 'ls',
        risk: 'low',
        ts: Date.now(),
      },
      { type: 'session', phase: 'start', sessionId: 's', ts: Date.now() },
      { type: 'scene', scene: 'celebrate', ts: Date.now() },
      { type: 'milestone', milestoneId: 'm1', ts: Date.now() },
    ]
    for (const e of oldEvents) {
      expect(() => dispatchEvent(e)).not.toThrow()
    }
    // 4 新 stub 状态全空
    expect(__getBadgeCountForTesting('any')).toBe(0)
    expect(__isDragTargetActiveForTesting('any')).toBe(false)
    expect(isDndActive()).toBe(false)
  })

  test('未知 event type → 不抛错，warn 日志（不可观测，保证 not.toThrow）', () => {
    // why: 未知 type 通常被 isValidEvent 拦截，但 dispatchEvent 是 export 函数，
    //      可能被业务直接调；exhaustive default 触发 console.warn 但不抛
    const fake = { type: 'unknown-future-type', ts: Date.now() } as unknown as OnDeskEvent
    expect(() => dispatchEvent(fake)).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C：场景注册表 — 主方案 §7 决策 #8 默认开关分级
// ─────────────────────────────────────────────────────────────────────────────

describe('scene/registry — TOP 10 + permission-request 共 11 项', () => {
  test('注册表至少 11 项，全部 TOP 10 场景在内', () => {
    expect(Object.keys(SCENE_REGISTRY).length).toBeGreaterThanOrEqual(11)
    const must = [
      'morning-brief',
      'disk-low',
      'memory-pressure',
      'network-anomaly',
      'git-remote-changed',
      'ci-failed',
      'calendar-reminder',
      'deepdream-done',
      'context-pressure',
      'midnight-care',
      'permission-request',
    ]
    for (const id of must) {
      expect(getSceneMeta(id)).not.toBeNull()
    }
  })

  test('主方案 §7 决策 #8：midnight-care 默认 OFF；ci-failed 默认 ON 且 error 级', () => {
    const midnight = getSceneMeta('midnight-care')
    expect(midnight?.defaultOn).toBe(false)
    const ci = getSceneMeta('ci-failed')
    expect(ci?.defaultOn).toBe(true)
    expect(ci?.level).toBe('error')
  })

  test('listDefaultOnScenarios 排除 midnight-care', () => {
    const onList = listDefaultOnScenarios()
    expect(onList).not.toContain('midnight-care')
    expect(onList).toContain('ci-failed')
    expect(onList).toContain('disk-low')
  })

  test('未注册场景 → getSceneMeta 返回 null', () => {
    expect(getSceneMeta('not-a-real-scene')).toBeNull()
  })
})
