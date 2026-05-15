// Input:  mock LocalJSXCommandContext + mock getSettingsForSource policySettings
// Output: asserts /goal command admin-policy gate denies under three managed
//         flags (goalCommandEnabled=false / disableAllHooks / allowManagedHooksOnly)
//         and emits a goal_marker SystemMessage on set/clear under normal policy
// Pos:    src/commands/goal/goal.test.ts — integration layer test for the
//         /goal call() handler, complementing goalStore.test.ts (pure state).
//
// NEW-FILE:#20260515-07 — covers goal 二期补完 (task #167) enterprise gate
// + marker emission paths.
//
// 一旦我被修改，请更新所属文件夹的 README.md（如有）。

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { __resetGoalStoreForTests } from '../../state/goalStore.js'
import type { Message } from '../../types/message.js'

beforeEach(() => {
  __resetGoalStoreForTests()
})

afterEach(() => {
  mock.restore()
})

function makeContext(messages: Message[] = []) {
  const captured: Message[][] = []
  const setMessages = (updater: (prev: Message[]) => Message[]): void => {
    const next = updater(messages)
    captured.push(next)
  }
  const ctx = {
    setMessages,
    options: {},
  } as unknown as Parameters<
    Awaited<ReturnType<typeof loadGoalModule>>['call']
  >[1]
  return { ctx, captured }
}

async function loadGoalModule(querySuffix = '') {
  // querySuffix lets each test get a fresh module instance after mock.module().
  const mod = await import(`./goal.js?goal-test=${querySuffix}`)
  return mod
}

function captureOnDone() {
  let text: string | undefined
  let opts: { display?: string } | undefined
  const onDone = (t?: string, o?: { display?: string }) => {
    text = t
    opts = o
  }
  return {
    onDone,
    get text() {
      return text
    },
    get opts() {
      return opts
    },
  }
}

describe('/goal admin-policy gate', () => {
  test('blocks when goalCommandEnabled === false in policySettings', async () => {
    mock.module('../../utils/settings/settings.js', () => ({
      getSettingsForSource: (source: string) =>
        source === 'policySettings'
          ? { goalCommandEnabled: false }
          : undefined,
    }))
    const goal = await loadGoalModule('a')
    const { ctx, captured } = makeContext([])
    const { onDone } = captureOnDone()
    await goal.call(onDone, ctx, 'finish tests')
    // No marker spliced (gate fires before set/clear).
    expect(captured.length).toBe(0)
  })

  test('blocks when disableAllHooks=true in policySettings', async () => {
    mock.module('../../utils/settings/settings.js', () => ({
      getSettingsForSource: (source: string) =>
        source === 'policySettings' ? { disableAllHooks: true } : undefined,
    }))
    const goal = await loadGoalModule('b')
    const { ctx, captured } = makeContext([])
    const cap = captureOnDone()
    await goal.call(cap.onDone, ctx, 'do thing')
    expect(cap.text ?? '').toMatch(/disableAllHooks/i)
    expect(captured.length).toBe(0)
  })

  test('blocks when allowManagedHooksOnly=true in policySettings', async () => {
    mock.module('../../utils/settings/settings.js', () => ({
      getSettingsForSource: (source: string) =>
        source === 'policySettings'
          ? { allowManagedHooksOnly: true }
          : undefined,
    }))
    const goal = await loadGoalModule('c')
    const { ctx, captured } = makeContext([])
    const cap = captureOnDone()
    await goal.call(cap.onDone, ctx, 'do thing')
    expect(cap.text ?? '').toMatch(/allowManagedHooksOnly/i)
    expect(captured.length).toBe(0)
  })

  test('allows /goal status (empty args) under normal policy', async () => {
    mock.module('../../utils/settings/settings.js', () => ({
      getSettingsForSource: () => undefined,
    }))
    const goal = await loadGoalModule('d')
    const { ctx, captured } = makeContext([])
    const cap = captureOnDone()
    await goal.call(cap.onDone, ctx, '')
    expect(cap.text ?? '').toMatch(/No active goal/)
    expect(captured.length).toBe(0) // status doesn't splice a marker
  })

  test('set path splices a goal_marker SystemMessage when allowed', async () => {
    mock.module('../../utils/settings/settings.js', () => ({
      getSettingsForSource: () => undefined,
    }))
    const goal = await loadGoalModule('e')
    const { ctx, captured } = makeContext([])
    const cap = captureOnDone()
    await goal.call(cap.onDone, ctx, 'all tests pass')
    expect(cap.text ?? '').toMatch(/Goal set/)
    expect(captured.length).toBe(1)
    const last = captured[0]?.[captured[0]!.length - 1] as unknown as {
      type?: string
      subtype?: string
      goalMarker?: { action?: string; payload?: { condition?: string } }
    }
    expect(last?.type).toBe('system')
    expect(last?.subtype).toBe('goal_marker')
    expect(last?.goalMarker?.action).toBe('set')
    expect(last?.goalMarker?.payload?.condition).toBe('all tests pass')
  })

  test('clear path splices a clear marker', async () => {
    mock.module('../../utils/settings/settings.js', () => ({
      getSettingsForSource: () => undefined,
    }))
    const goal = await loadGoalModule('f')
    const { ctx, captured } = makeContext([])
    const cap1 = captureOnDone()
    await goal.call(cap1.onDone, ctx, 'temporary goal')
    expect(captured.length).toBe(1) // set marker

    const cap2 = captureOnDone()
    await goal.call(cap2.onDone, ctx, 'clear')
    expect(captured.length).toBe(2) // clear marker
    const clearMarker = captured[1]?.[captured[1]!.length - 1] as unknown as {
      subtype?: string
      goalMarker?: { action?: string }
    }
    expect(clearMarker?.subtype).toBe('goal_marker')
    expect(clearMarker?.goalMarker?.action).toBe('clear')
  })
})
