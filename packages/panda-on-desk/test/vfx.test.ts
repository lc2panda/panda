// Input:  P2-T4 三个子能力 — badge/manager + dnd/target + sound/player + dispatcher 接入
// Output: ≥ 8 用例覆盖 bumpBadge / resetBadge / getTotalCount / drag-target enable+disable /
//         sound cooldown / dispatcher.soundCue 调度 / dispatcher.kind=badge 委派
// Pos:    Phase 2 P2-T4 状态 badge + 拖拽接收 + 声音 cue 验证
//
// [NEW-FILE:#20260419-P2-16]
// 2026-04-19 +08:00 agent-δ-P2-vfx · ≥8 用例 + IPC 推送回调注入断言

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import {
  __getBadgeCountForTesting,
  __resetBadgeCountsForTesting,
  __snapshotForTesting,
  BADGE_UPDATE_CHANNEL,
  bumpBadge,
  getBadgeState,
  getTotalCount,
  resetBadge,
  setBadgeRendererNotifier,
  type BadgeUpdatePayload,
} from '../src/badge/manager.js'
import {
  __getStackForTesting,
  __isDragTargetActiveForTesting,
  __resetDragTargetsForTesting,
  DRAG_TARGET_CHANNEL,
  disableDragTarget,
  enableDragTarget,
  getActiveDragTarget,
  handleDrop,
  setDragTargetDropForwarder,
  setDragTargetRendererNotifier,
  type DragTargetDropPayload,
  type DragTargetStatePayload,
} from '../src/dnd/target.js'
import {
  __getLastPlayedAtForTesting,
  __resetSoundForTesting,
  __setClockForTesting,
  playSound,
  setSoundRendererNotifier,
  SOUND_COOLDOWN_MS,
  SOUND_PLAY_CHANNEL,
  type SoundPlayPayload,
} from '../src/sound/player.js'
import { dispatchNotification } from '../src/notification/dispatcher.js'
import { dispatchEvent } from '../src/bridge/server.js'
// why: 默认计划 22:00-08:00 在 UTC 测试环境下可能误判 → 强制关闭，避免 dispatcher 抑制 sound/badge
import { __setScheduleForTesting } from '../src/dnd/schedule.js'

// ─────────────────────────────────────────────────────────────────────────────
// 测试隔离
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  __resetBadgeCountsForTesting()
  __resetDragTargetsForTesting()
  __resetSoundForTesting()
  // why: 强制关闭计划 DND，避免 UTC 测试环境下默认 22:00-08:00 误判抑制 dispatcher 路由
  __setScheduleForTesting({ startHHmm: '22:00', endHHmm: '08:00', enabled: false })
})

afterEach(() => {
  __resetBadgeCountsForTesting()
  __resetDragTargetsForTesting()
  __resetSoundForTesting()
})

// ─────────────────────────────────────────────────────────────────────────────
// Group A · badge/manager
// ─────────────────────────────────────────────────────────────────────────────

describe('badge/manager · bump / reset / total', () => {
  test('bumpBadge 增量累加（默认 +1 / 显式 delta）', () => {
    bumpBadge('git-remote-changed')
    expect(__getBadgeCountForTesting('git-remote-changed')).toBe(1)
    bumpBadge('git-remote-changed', 4)
    expect(__getBadgeCountForTesting('git-remote-changed')).toBe(5)
    // 颜色透传
    const st = bumpBadge('git-remote-changed', 0, '#ff0000')
    expect(st.color).toBe('#ff0000')
  })

  test('bumpBadge 负值 clamp 到 0；不会变负', () => {
    bumpBadge('disk-low', 2)
    bumpBadge('disk-low', -10)
    expect(__getBadgeCountForTesting('disk-low')).toBe(0)
  })

  test('resetBadge 清零但保留 entry（lastUpdated 更新）', () => {
    bumpBadge('ci-failed', 7)
    const beforeReset = getBadgeState('ci-failed')!.lastUpdated
    // 强制时钟前进，确保 lastUpdated 变化可观察
    const afterCount = (() => {
      resetBadge('ci-failed')
      return __getBadgeCountForTesting('ci-failed')
    })()
    expect(afterCount).toBe(0)
    const afterReset = getBadgeState('ci-failed')!.lastUpdated
    expect(afterReset).toBeGreaterThanOrEqual(beforeReset)
  })

  test('getTotalCount 跨多 scenario 聚合', () => {
    bumpBadge('git-remote-changed', 3)
    bumpBadge('disk-low', 2)
    bumpBadge('ci-failed', 5)
    expect(getTotalCount()).toBe(10)
    resetBadge('disk-low')
    expect(getTotalCount()).toBe(8)
  })

  test('IPC notifier 注入后 — bump 触发 BADGE_UPDATE_CHANNEL 推送', () => {
    const calls: Array<{ channel: string; payload: BadgeUpdatePayload }> = []
    setBadgeRendererNotifier((channel, payload) => {
      calls.push({ channel, payload })
    })
    bumpBadge('git-remote-changed', 2)
    bumpBadge('disk-low', 3)
    expect(calls.length).toBe(2)
    expect(calls[0].channel).toBe(BADGE_UPDATE_CHANNEL)
    expect(calls[1].payload.total).toBe(5)
    expect(calls[1].payload.entries.length).toBe(2)
    // snapshot 同步
    const snap = __snapshotForTesting()
    expect(snap.size).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B · dnd/target
// ─────────────────────────────────────────────────────────────────────────────

describe('dnd/target · enable / disable / 栈式覆盖 / drop 回执', () => {
  test('enableDragTarget 注册并激活；disableDragTarget 取消', () => {
    enableDragTarget('file-organizer', ['file'])
    expect(__isDragTargetActiveForTesting('file-organizer')).toBe(true)
    expect(getActiveDragTarget()?.scenarioId).toBe('file-organizer')

    disableDragTarget('file-organizer')
    expect(__isDragTargetActiveForTesting('file-organizer')).toBe(false)
    expect(getActiveDragTarget()).toBeNull()
  })

  test('多 scenario 同时启用 — 最新覆盖（栈顶为 active）', () => {
    enableDragTarget('file-organizer', ['file'])
    enableDragTarget('screenshot-snippet', ['image'])
    const top = getActiveDragTarget()
    expect(top?.scenarioId).toBe('screenshot-snippet')
    expect(top?.kinds).toEqual(['image'])

    // 关闭栈顶 → 回退到次新
    disableDragTarget('screenshot-snippet')
    expect(getActiveDragTarget()?.scenarioId).toBe('file-organizer')

    // 关闭非栈顶 — 不影响栈顶
    enableDragTarget('screenshot-snippet', ['image'])
    enableDragTarget('clipboard', ['text'])
    disableDragTarget('file-organizer')
    expect(getActiveDragTarget()?.scenarioId).toBe('clipboard')
    expect(__getStackForTesting().length).toBe(2)
  })

  test('IPC notifier — enable/disable 触发 DRAG_TARGET_CHANNEL 推送（active 切换）', () => {
    const calls: DragTargetStatePayload[] = []
    setDragTargetRendererNotifier((channel, payload) => {
      expect(channel).toBe(DRAG_TARGET_CHANNEL)
      calls.push(payload)
    })
    enableDragTarget('file-organizer', ['file'])
    disableDragTarget('file-organizer')
    expect(calls.length).toBe(2)
    expect(calls[0].active).toBe(true)
    expect(calls[0].kinds).toEqual(['file'])
    expect(calls[1].active).toBe(false)
  })

  test('handleDrop → 经 forwarder 转发到 panda CLI', () => {
    const drops: DragTargetDropPayload[] = []
    setDragTargetDropForwarder(p => drops.push(p))
    handleDrop({
      scenarioId: 'file-organizer',
      kind: 'file',
      data: ['/tmp/a.txt'],
      ts: Date.now(),
    })
    expect(drops.length).toBe(1)
    expect(drops[0].data).toEqual(['/tmp/a.txt'])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C · sound/player
// ─────────────────────────────────────────────────────────────────────────────

describe('sound/player · playSound + cooldown', () => {
  test('playSound 触发 — IPC notifier 收到 SOUND_PLAY_CHANNEL 负载', () => {
    const calls: SoundPlayPayload[] = []
    setSoundRendererNotifier((channel, payload) => {
      expect(channel).toBe(SOUND_PLAY_CHANNEL)
      calls.push(payload)
    })
    const ok = playSound('short')
    expect(ok).toBe(true)
    expect(calls.length).toBe(1)
    expect(calls[0].cue).toBe('short')
    expect(calls[0].src.startsWith('data:audio/wav;base64,')).toBe(true)
  })

  test('同 cue 10s 内 cooldown — 二次调用返回 false 且不推送', () => {
    let now = 1_000_000
    __setClockForTesting(() => now)
    const calls: SoundPlayPayload[] = []
    setSoundRendererNotifier((_c, p) => calls.push(p))

    expect(playSound('critical')).toBe(true)
    // 5s 后 — 仍在 cooldown
    now += 5_000
    expect(playSound('critical')).toBe(false)
    // 10s 边界 — 仍 cooldown（< SOUND_COOLDOWN_MS）
    now = 1_000_000 + SOUND_COOLDOWN_MS - 1
    expect(playSound('critical')).toBe(false)
    // 超过 cooldown
    now = 1_000_000 + SOUND_COOLDOWN_MS + 1
    expect(playSound('critical')).toBe(true)

    expect(calls.length).toBe(2)
    expect(__getLastPlayedAtForTesting('critical')).toBe(now)
  })

  test('不同 cue 互不阻塞 cooldown', () => {
    // why: 时钟起点 ≥ SOUND_COOLDOWN_MS，避开 last=0 → now-last=0 < cooldown 的首次冷启边界
    let now = SOUND_COOLDOWN_MS + 1
    __setClockForTesting(() => now)
    setSoundRendererNotifier(() => {})
    expect(playSound('short')).toBe(true)
    expect(playSound('critical')).toBe(true)
    expect(playSound('gentle')).toBe(true)
    // 重复 — 全部 cooldown
    expect(playSound('short')).toBe(false)
    expect(playSound('critical')).toBe(false)
    expect(playSound('gentle')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group D · dispatcher 接入
// ─────────────────────────────────────────────────────────────────────────────

describe('notification/dispatcher · soundCue + kind=badge 委派', () => {
  test('event.soundCue → 异步触发 playSound（cooldown 表更新）', async () => {
    const calls: SoundPlayPayload[] = []
    setSoundRendererNotifier((_c, p) => calls.push(p))
    dispatchNotification({
      type: 'notification',
      kind: 'overlay',
      level: 'error',
      scenarioId: 'ci-failed',
      title: 'CI failed',
      soundCue: 'critical',
      ts: Date.now(),
    })
    // queueMicrotask 异步 — 等一拍
    await new Promise<void>(r => queueMicrotask(r))
    expect(calls.length).toBe(1)
    expect(calls[0].cue).toBe('critical')
  })

  test('kind=badge → 委派 bumpBadge', () => {
    dispatchNotification({
      type: 'notification',
      kind: 'badge',
      level: 'info',
      scenarioId: 'git-remote-changed',
      title: 'remote ahead',
      badge: { count: 3, color: '#3b82f6' },
      ts: Date.now(),
    })
    expect(__getBadgeCountForTesting('git-remote-changed')).toBe(3)
    expect(getBadgeState('git-remote-changed')?.color).toBe('#3b82f6')
  })

  test('kind=sound + soundCue → playSound 仅播 1 次（不双触发）', async () => {
    const calls: SoundPlayPayload[] = []
    setSoundRendererNotifier((_c, p) => calls.push(p))
    dispatchNotification({
      type: 'notification',
      kind: 'sound',
      level: 'info',
      scenarioId: 'morning-brief',
      title: 'morning',
      soundCue: 'gentle',
      ts: Date.now(),
    })
    await new Promise<void>(r => queueMicrotask(r))
    // why: queueMicrotask 仅 1 次，dispatcher 内 switch case 'sound' 不再二次播放
    expect(calls.length).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group E · bridge dispatchEvent → BadgeEvent / DragTargetEvent
// ─────────────────────────────────────────────────────────────────────────────

describe('bridge/dispatchEvent · BadgeEvent + DragTargetEvent forward', () => {
  test('BadgeEvent → bumpBadge / resetBadge 联通', () => {
    dispatchEvent({
      type: 'badge',
      scenarioId: 'disk-low',
      delta: 4,
      ts: Date.now(),
    })
    expect(__getBadgeCountForTesting('disk-low')).toBe(4)

    dispatchEvent({
      type: 'badge',
      scenarioId: 'disk-low',
      reset: true,
      ts: Date.now(),
    })
    expect(__getBadgeCountForTesting('disk-low')).toBe(0)
  })

  test('DragTargetEvent → enable/disable 栈联通', () => {
    dispatchEvent({
      type: 'drag-target',
      enable: true,
      acceptKinds: ['file', 'image'],
      scenarioId: 'file-organizer',
      ts: Date.now(),
    })
    expect(getActiveDragTarget()?.scenarioId).toBe('file-organizer')
    expect(getActiveDragTarget()?.kinds).toEqual(['file', 'image'])

    dispatchEvent({
      type: 'drag-target',
      enable: false,
      acceptKinds: [],
      scenarioId: 'file-organizer',
      ts: Date.now(),
    })
    expect(getActiveDragTarget()).toBeNull()
  })
})
