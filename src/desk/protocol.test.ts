// Input:  src/desk/bridge.ts P2-T1 6 helpers + 4 build* 构造器
// Output: 13 用例 — 验证 OnDeskEvent 序列化字段正确 / feature off 静默不抛错 /
//         on-desk 离线时 helpers 不抛错（继承 P1-T5 容错）
// Pos:    Phase 2 P2-T1 IPC 协议扩展验证 [NEW-FILE:#20260419-P2-05]
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  __resetRuntimeCacheForTesting,
  buildBadgeBumpEvent,
  buildBadgeResetEvent,
  buildDndEvent,
  buildDragTargetDisableEvent,
  buildDragTargetEnableEvent,
  buildNotificationEvent,
  bumpBadge,
  disableDragTarget,
  enableDragTarget,
  pushNotification,
  resetBadge,
  setDnd,
} from './bridge.js'
import type {
  BadgeEvent,
  DndEvent,
  DragTargetEvent,
  NotificationEvent,
  OnDeskEvent,
} from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// Test fixtures — 隔离配置目录避免污染真实 ~/.pandacc
// ─────────────────────────────────────────────────────────────────────────────

let tmpDir: string
let savedEnv: { panda: string | undefined; claude: string | undefined }

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'panda-protocol-test-'))
  savedEnv = {
    panda: process.env.PANDA_CONFIG_DIR,
    claude: process.env.CLAUDE_CONFIG_DIR,
  }
  process.env.PANDA_CONFIG_DIR = tmpDir
  __resetRuntimeCacheForTesting()
})

afterEach(() => {
  __resetRuntimeCacheForTesting()
  if (savedEnv.panda === undefined) delete process.env.PANDA_CONFIG_DIR
  else process.env.PANDA_CONFIG_DIR = savedEnv.panda
  if (savedEnv.claude === undefined) delete process.env.CLAUDE_CONFIG_DIR
  else process.env.CLAUDE_CONFIG_DIR = savedEnv.claude
  try {
    rmSync(tmpDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Group A：纯 build* 构造器字段验证（6 helpers 各 1 用例）
// ─────────────────────────────────────────────────────────────────────────────

describe('protocol / buildNotificationEvent', () => {
  test('完整字段透传 + type/ts 注入', () => {
    const before = Date.now()
    const ev = buildNotificationEvent({
      kind: 'overlay',
      level: 'error',
      scenarioId: 'ci-failed',
      title: 'CI #42 failed',
      body: 'commit abc1234 / branch main',
      ttlMs: 10_000,
      actions: [
        { id: 'view-log', label: 'View Log', primary: true, shortcut: 'Ctrl+Shift+L' },
        { id: 'rerun', label: 'Re-run' },
      ],
      soundCue: 'critical',
      petStateOverride: 'error',
    })
    const after = Date.now()
    expect(ev.type).toBe('notification')
    expect(ev.ts).toBeGreaterThanOrEqual(before)
    expect(ev.ts).toBeLessThanOrEqual(after)
    expect(ev.kind).toBe('overlay')
    expect(ev.level).toBe('error')
    expect(ev.scenarioId).toBe('ci-failed')
    expect(ev.title).toBe('CI #42 failed')
    expect(ev.body).toBe('commit abc1234 / branch main')
    expect(ev.ttlMs).toBe(10_000)
    expect(ev.actions?.length).toBe(2)
    expect(ev.actions?.[0]?.primary).toBe(true)
    expect(ev.soundCue).toBe('critical')
    expect(ev.petStateOverride).toBe('error')
    // why: 序列化必须可 round-trip 而不丢字段（IPC 通过 JSON 传输）
    const round = JSON.parse(JSON.stringify(ev)) as NotificationEvent
    expect(round).toEqual(ev)
  })
})

describe('protocol / buildBadgeBumpEvent', () => {
  test('默认 delta=+1；可传负值；序列化保留', () => {
    const ev = buildBadgeBumpEvent('git-remote-changed')
    expect(ev.type).toBe('badge')
    expect(ev.scenarioId).toBe('git-remote-changed')
    expect(ev.delta).toBe(1)
    expect(ev.reset).toBeUndefined()

    const negative = buildBadgeBumpEvent('git-remote-changed', -3)
    expect(negative.delta).toBe(-3)

    const round = JSON.parse(JSON.stringify(ev)) as BadgeEvent
    expect(round.type).toBe('badge')
    expect(round.delta).toBe(1)
  })
})

describe('protocol / buildBadgeResetEvent', () => {
  test('reset=true 且无 delta', () => {
    const ev = buildBadgeResetEvent('disk-low')
    expect(ev.type).toBe('badge')
    expect(ev.scenarioId).toBe('disk-low')
    expect(ev.reset).toBe(true)
    expect(ev.delta).toBeUndefined()
  })
})

describe('protocol / buildDragTargetEnableEvent', () => {
  test('enable=true + acceptKinds 透传', () => {
    const ev = buildDragTargetEnableEvent('file-organizer', ['file', 'image'])
    expect(ev.type).toBe('drag-target')
    expect(ev.enable).toBe(true)
    expect(ev.acceptKinds).toEqual(['file', 'image'])
    expect(ev.scenarioId).toBe('file-organizer')

    const round = JSON.parse(JSON.stringify(ev)) as DragTargetEvent
    expect(round.acceptKinds).toEqual(['file', 'image'])
  })
})

describe('protocol / buildDragTargetDisableEvent', () => {
  test('enable=false + acceptKinds 空数组', () => {
    const ev = buildDragTargetDisableEvent('screenshot-snippet')
    expect(ev.type).toBe('drag-target')
    expect(ev.enable).toBe(false)
    expect(ev.acceptKinds).toEqual([])
    expect(ev.scenarioId).toBe('screenshot-snippet')
  })
})

describe('protocol / buildDndEvent', () => {
  test('enabled + reason + endsAt 全透传', () => {
    const endsAt = Date.now() + 60_000
    const ev = buildDndEvent(true, { reason: 'focus-mode', endsAt })
    expect(ev.type).toBe('dnd')
    expect(ev.enabled).toBe(true)
    expect(ev.reason).toBe('focus-mode')
    expect(ev.endsAt).toBe(endsAt)

    // 关闭 DND，无 reason / endsAt
    const off = buildDndEvent(false)
    expect(off.enabled).toBe(false)
    expect(off.reason).toBeUndefined()
    expect(off.endsAt).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B：helper fire-and-forget 路径（feature off + on-desk 离线均不抛错）
// 这些 helper 返回 void；只验证不抛 + 不阻塞主路径
// ─────────────────────────────────────────────────────────────────────────────

describe('protocol / helpers fire-and-forget · feature off + on-desk 离线', () => {
  test('pushNotification 不抛错', () => {
    expect(() =>
      pushNotification({
        kind: 'system',
        level: 'info',
        scenarioId: 'morning-brief',
        title: '早安',
      }),
    ).not.toThrow()
  })

  test('bumpBadge / resetBadge 不抛错', () => {
    expect(() => bumpBadge('git-remote-changed')).not.toThrow()
    expect(() => bumpBadge('git-remote-changed', 5)).not.toThrow()
    expect(() => resetBadge('git-remote-changed')).not.toThrow()
  })

  test('enableDragTarget / disableDragTarget 不抛错', () => {
    expect(() => enableDragTarget('file-organizer', ['file'])).not.toThrow()
    expect(() => disableDragTarget('file-organizer')).not.toThrow()
  })

  test('setDnd 不抛错（含 reason/endsAt）', () => {
    expect(() => setDnd(true, { reason: 'manual' })).not.toThrow()
    expect(() => setDnd(true, { reason: 'schedule', endsAt: Date.now() + 1000 })).not.toThrow()
    expect(() => setDnd(false)).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C：discriminated union 类型守卫（编译期 + 运行时 type 字段唯一）
// ─────────────────────────────────────────────────────────────────────────────

describe('protocol / OnDeskEvent discriminated union', () => {
  test('4 新事件 type 字段两两互斥', () => {
    const evs: OnDeskEvent[] = [
      buildNotificationEvent({
        kind: 'system',
        level: 'info',
        scenarioId: 'deepdream-done',
        title: 'Dream done',
      }),
      buildBadgeBumpEvent('disk-low'),
      buildDragTargetEnableEvent('file-organizer', ['file']),
      buildDndEvent(true, { reason: 'manual' }),
    ]
    const types = new Set(evs.map(e => e.type))
    expect(types.size).toBe(4)
    expect(types.has('notification')).toBe(true)
    expect(types.has('badge')).toBe(true)
    expect(types.has('drag-target')).toBe(true)
    expect(types.has('dnd')).toBe(true)
  })
})
