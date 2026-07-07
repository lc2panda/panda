// Input:  vitest test cases exercising goalStore set/clear/record API
// Output: green test suite verifying invariants of the /goal singleton store
// Pos:    src/state/goalStore.test.ts — companion to goalStore.ts; covers the
//         pure logic (no API, no React) so regressions in turn-counting,
//         length validation, or listener fan-out get caught at PR time.
//
// NEW-FILE:#20260515-06 — implements upstream Claude Code v2.1.139 `/goal`.
//
// 一旦我被修改，请更新所属文件夹的 README.md（如有）。

import { describe, it, expect, beforeEach } from 'bun:test'
import {
  __resetGoalStoreForTests,
  clearGoal,
  findActiveGoalMarker,
  GOAL_CONDITION_MAX_LENGTH,
  GOAL_MARKER_SUBTYPE,
  getGoal,
  getGoalConditionPreview,
  getGoalElapsedDisplay,
  isGoalActive,
  recordGoalTurn,
  restoreFromMarker,
  setGoal,
  subscribeGoal,
} from './goalStore.js'

beforeEach(() => {
  __resetGoalStoreForTests()
})

describe('goalStore', () => {
  it('starts inactive', () => {
    expect(isGoalActive()).toBe(false)
    expect(getGoal()).toBeNull()
  })

  it('sets a goal with trimmed condition + defaults', () => {
    const g = setGoal('  finish all tests  ')
    expect(g.condition).toBe('finish all tests')
    expect(g.turns).toBe(0)
    expect(g.tokens).toBe(0)
    expect(g.lastReason).toBeNull()
    expect(g.lastMet).toBeNull()
    expect(isGoalActive()).toBe(true)
  })

  it('rejects empty/whitespace conditions', () => {
    expect(() => setGoal('')).toThrow(/cannot be empty/)
    expect(() => setGoal('   ')).toThrow(/cannot be empty/)
    expect(isGoalActive()).toBe(false)
  })

  it('rejects conditions over 4000 chars', () => {
    const tooLong = 'a'.repeat(GOAL_CONDITION_MAX_LENGTH + 1)
    expect(() => setGoal(tooLong)).toThrow(/too long/)
    expect(isGoalActive()).toBe(false)
  })

  it('accepts exactly 4000 chars', () => {
    const exact = 'b'.repeat(GOAL_CONDITION_MAX_LENGTH)
    const g = setGoal(exact)
    expect(g.condition.length).toBe(GOAL_CONDITION_MAX_LENGTH)
  })

  it('replaces an existing goal (single-active invariant)', () => {
    setGoal('first')
    const second = setGoal('second')
    expect(getGoal()?.condition).toBe('second')
    expect(second.turns).toBe(0)
  })

  it('clearGoal returns previous + idempotent when none active', () => {
    expect(clearGoal()).toBeNull()
    setGoal('to be cleared')
    const prev = clearGoal()
    expect(prev?.condition).toBe('to be cleared')
    expect(isGoalActive()).toBe(false)
    expect(clearGoal()).toBeNull()
  })

  it('recordGoalTurn increments + updates last fields', () => {
    setGoal('keep going')
    const r1 = recordGoalTurn({
      met: false,
      reason: 'still working',
      tokensThisTurn: 100,
    })
    expect(r1?.turns).toBe(1)
    expect(r1?.tokens).toBe(100)
    expect(r1?.lastMet).toBe(false)
    expect(r1?.lastReason).toBe('still working')

    const r2 = recordGoalTurn({
      met: true,
      reason: 'done',
      tokensThisTurn: 50,
    })
    expect(r2?.turns).toBe(2)
    expect(r2?.tokens).toBe(150)
    expect(r2?.lastMet).toBe(true)
    expect(r2?.lastReason).toBe('done')
  })

  it('recordGoalTurn is no-op when no active goal', () => {
    const r = recordGoalTurn({ met: true, reason: 'x' })
    expect(r).toBeNull()
  })

  it('subscribeGoal notifies on set/clear/record + unsubscribes cleanly', () => {
    let count = 0
    const unsub = subscribeGoal(() => {
      count++
    })
    setGoal('a')
    expect(count).toBe(1)
    recordGoalTurn({ met: false, reason: 'r' })
    expect(count).toBe(2)
    clearGoal()
    expect(count).toBe(3)
    unsub()
    setGoal('b')
    expect(count).toBe(3) // no further notifications after unsub
  })

  it('elapsed display formats sec/min/hour correctly', () => {
    setGoal('timed')
    const g = getGoal()!
    const base = g.setAtMs
    expect(getGoalElapsedDisplay(base + 5_000)).toBe('5s')
    expect(getGoalElapsedDisplay(base + 65_000)).toBe('1m5s')
    expect(getGoalElapsedDisplay(base + 3_725_000)).toBe('1h2m')
  })

  it('elapsed display is 0s when inactive', () => {
    expect(getGoalElapsedDisplay()).toBe('0s')
  })

  it('preview truncates long conditions', () => {
    setGoal('x'.repeat(200))
    const p = getGoalConditionPreview(50)
    expect(p.length).toBeLessThanOrEqual(50)
    expect(p.endsWith('…')).toBe(true)
  })

  it('preview returns full condition when short enough', () => {
    setGoal('short')
    expect(getGoalConditionPreview(60)).toBe('short')
  })
})

describe('goalStore — restoreFromMarker', () => {
  it('returns null when transcript has no markers', () => {
    const r = restoreFromMarker([
      { type: 'user' },
      { type: 'assistant' },
    ])
    expect(r).toBeNull()
    expect(isGoalActive()).toBe(false)
  })

  it('returns null when transcript ends with a clear marker', () => {
    const r = restoreFromMarker([
      {
        type: 'system',
        subtype: GOAL_MARKER_SUBTYPE,
        goalMarker: {
          action: 'set',
          payload: { condition: 'old', setAtMs: 1, maxTurns: 50 },
        },
      },
      {
        type: 'system',
        subtype: GOAL_MARKER_SUBTYPE,
        goalMarker: { action: 'clear', payload: null },
      },
    ])
    expect(r).toBeNull()
    expect(isGoalActive()).toBe(false)
  })

  it('rehydrates condition from the most recent set marker', () => {
    const r = restoreFromMarker([
      { type: 'user' },
      {
        type: 'system',
        subtype: GOAL_MARKER_SUBTYPE,
        goalMarker: {
          action: 'set',
          payload: { condition: 'first', setAtMs: 1, maxTurns: 20 },
        },
      },
      { type: 'assistant' },
      {
        type: 'system',
        subtype: GOAL_MARKER_SUBTYPE,
        goalMarker: {
          action: 'set',
          payload: { condition: 'second', setAtMs: 2, maxTurns: 30 },
        },
      },
      { type: 'assistant' },
    ])
    expect(r).not.toBeNull()
    expect(r?.condition).toBe('second')
    expect(r?.turns).toBe(0) // turn baseline reset
    expect(r?.tokens).toBe(0) // token baseline reset
    expect(r?.lastMet).toBeNull() // last-eval reset
    expect(isGoalActive()).toBe(true)
    expect(getGoal()?.condition).toBe('second')
  })

  it('ignores malformed set markers and falls back to older valid one', () => {
    const r = restoreFromMarker([
      {
        type: 'system',
        subtype: GOAL_MARKER_SUBTYPE,
        goalMarker: {
          action: 'set',
          payload: { condition: 'valid older', setAtMs: 1, maxTurns: 50 },
        },
      },
      {
        type: 'system',
        subtype: GOAL_MARKER_SUBTYPE,
        goalMarker: { action: 'set', payload: { condition: '' } }, // malformed
      },
    ])
    expect(r?.condition).toBe('valid older')
  })

  it('skips non-system messages and non-goal subtypes', () => {
    // findActiveGoalMarker should ignore unrelated SystemMessages.
    const marker = findActiveGoalMarker([
      { type: 'user' },
      { type: 'system', subtype: 'informational', content: 'hi' },
      { type: 'attachment' },
      {
        type: 'system',
        subtype: GOAL_MARKER_SUBTYPE,
        goalMarker: {
          action: 'set',
          payload: { condition: 'the goal', setAtMs: 5, maxTurns: 50 },
        },
      },
    ])
    expect(marker?.condition).toBe('the goal')
  })

  it('ignores legacy maxTurns in restored markers', () => {
    const r = restoreFromMarker([
      {
        type: 'system',
        subtype: GOAL_MARKER_SUBTYPE,
        goalMarker: {
          action: 'set',
          payload: { condition: 'legacy max', setAtMs: 1, maxTurns: 50 },
        },
      },
    ])
    expect(r?.condition).toBe('legacy max')
    expect(r).not.toHaveProperty('maxTurns')
  })
})
