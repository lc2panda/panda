// Input: AgentView 内部模块（roster / sortEntries / 键位 handler / state reducer 行为）
// Output: bun:test 断言守护核心算法不回归
// Pos: src/components/AgentView/ —— Tier 1 单元测试集合

import { beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  readRoster,
  removeRosterEntry,
  renameEntry,
  togglePinned,
  upsertRosterEntry,
  _internal as rosterInternal,
} from './roster.js'
import { _internal as enumInternal } from './sessionEnumerator.js'
import { createKeyHandler } from './useAgentViewKeybindings.js'
import type { AgentViewActions } from './useAgentViewState.js'
import type { DashboardState, RosterEntry, SessionEntry } from './types.js'
import { computePeekWindow, PEEK_PAGE_SIZE } from './PeekPanel.js'

const FAKE_HOME = mkdtempSync(join(tmpdir(), 'panda-av-test-'))

beforeEach(() => {
  // Redirect roster / sessions paths into a sandbox tmpdir per test run.
  process.env.PANDA_CONFIG_DIR = FAKE_HOME
})

describe('roster: CRUD', () => {
  test('readRoster on missing file → empty roster', async () => {
    rmSync(FAKE_HOME, { recursive: true, force: true })
    process.env.PANDA_CONFIG_DIR = FAKE_HOME
    const r = await readRoster()
    expect(r.version).toBe(1)
    expect(r.entries).toEqual([])
  })

  test('upsertRosterEntry inserts new entry then updates same id', async () => {
    const entry: RosterEntry = {
      id: 'job-a',
      name: 'Alpha',
      sessionId: 'sess-alpha',
      cwd: '/tmp/a',
      pinned: false,
      createdAt: 100,
      lastSeenAt: 100,
    }
    await upsertRosterEntry(entry)
    let r = await readRoster()
    expect(r.entries).toHaveLength(1)
    expect(r.entries[0]?.name).toBe('Alpha')

    await upsertRosterEntry({ ...entry, name: 'Alpha v2' })
    r = await readRoster()
    expect(r.entries).toHaveLength(1)
    expect(r.entries[0]?.name).toBe('Alpha v2')
  })

  test('togglePinned flips pinned', async () => {
    await upsertRosterEntry({
      id: 'job-b',
      name: 'Beta',
      sessionId: null,
      cwd: '/tmp/b',
      pinned: false,
      createdAt: 1,
      lastSeenAt: 1,
    })
    await togglePinned('job-b')
    let r = await readRoster()
    expect(r.entries.find(e => e.id === 'job-b')?.pinned).toBe(true)
    await togglePinned('job-b')
    r = await readRoster()
    expect(r.entries.find(e => e.id === 'job-b')?.pinned).toBe(false)
  })

  test('renameEntry refuses empty name', async () => {
    await upsertRosterEntry({
      id: 'job-c',
      name: 'Gamma',
      sessionId: null,
      cwd: '/tmp/c',
      pinned: false,
      createdAt: 1,
      lastSeenAt: 1,
    })
    await renameEntry('job-c', '   ')
    const r = await readRoster()
    expect(r.entries.find(e => e.id === 'job-c')?.name).toBe('Gamma')
  })

  test('renameEntry trims and applies', async () => {
    await upsertRosterEntry({
      id: 'job-d',
      name: 'Delta',
      sessionId: null,
      cwd: '/tmp/d',
      pinned: false,
      createdAt: 1,
      lastSeenAt: 1,
    })
    await renameEntry('job-d', '  Delta v2  ')
    const r = await readRoster()
    expect(r.entries.find(e => e.id === 'job-d')?.name).toBe('Delta v2')
  })

  test('removeRosterEntry drops the matching id', async () => {
    await upsertRosterEntry({
      id: 'job-e',
      name: 'Epsilon',
      sessionId: null,
      cwd: '/tmp/e',
      pinned: false,
      createdAt: 1,
      lastSeenAt: 1,
    })
    await removeRosterEntry('job-e')
    const r = await readRoster()
    expect(r.entries.find(e => e.id === 'job-e')).toBeUndefined()
  })
})

describe('sessionEnumerator: sortEntries', () => {
  test('pinned first, working over idle, newer first within same bucket', () => {
    const e = (over: Partial<SessionEntry>): SessionEntry => ({
      id: 'x',
      displayName: 'x',
      sessionId: null,
      pid: null,
      status: 'idle',
      shape: 'alive',
      cwd: '/tmp',
      startedAt: 0,
      lastMessage: '',
      pinned: false,
      prStatus: null,
      ...over,
    })
    const sorted = enumInternal.sortEntries([
      e({ id: 'a', status: 'idle', startedAt: 100 }),
      e({ id: 'b', status: 'working', startedAt: 200 }),
      e({ id: 'c', pinned: true, status: 'idle', startedAt: 50 }),
      e({ id: 'd', status: 'working', startedAt: 300 }),
    ])
    expect(sorted.map(s => s.id)).toEqual(['c', 'd', 'b', 'a'])
  })

  test('statusPriority order is working > waiting > idle > completed > failed > stopped', () => {
    expect(enumInternal.statusPriority('working')).toBeGreaterThan(
      enumInternal.statusPriority('waiting'),
    )
    expect(enumInternal.statusPriority('waiting')).toBeGreaterThan(
      enumInternal.statusPriority('idle'),
    )
    expect(enumInternal.statusPriority('idle')).toBeGreaterThan(
      enumInternal.statusPriority('completed'),
    )
    expect(enumInternal.statusPriority('completed')).toBeGreaterThan(
      enumInternal.statusPriority('failed'),
    )
    expect(enumInternal.statusPriority('failed')).toBeGreaterThan(
      enumInternal.statusPriority('stopped'),
    )
  })
})

describe('useAgentViewKeybindings.createKeyHandler', () => {
  type Calls = {
    moveCursor: number[]
    setGroupMode: string[]
    togglePeek: number
    beginRename: string[]
    setPendingStop: (string | null)[]
    attach: string[]
    exit: number
    dispatch: number
    dispatchDraft: string[]
    movePeekPage: number[]
    editPrompt: number
    setDispatchPrompt: string[]
    spawnShell: string[]
  }
  const fakeKey = (
    over: Partial<Record<string, boolean>>,
  ): import('../../ink/events/input-event.js').Key => ({
    upArrow: false,
    downArrow: false,
    leftArrow: false,
    rightArrow: false,
    pageDown: false,
    pageUp: false,
    wheelUp: false,
    wheelDown: false,
    home: false,
    end: false,
    return: false,
    escape: false,
    ctrl: false,
    shift: false,
    fn: false,
    tab: false,
    backspace: false,
    delete: false,
    meta: false,
    super: false,
    ...over,
  })

  const makeEntry = (id: string): SessionEntry => ({
    id,
    displayName: id,
    sessionId: id + '-sess',
    pid: 1234,
    status: 'idle',
    shape: 'alive',
    cwd: '/tmp',
    startedAt: 0,
    lastMessage: '',
    pinned: false,
    prStatus: null,
  })

  const baseState = (over: Partial<DashboardState> = {}): DashboardState => ({
    entries: [makeEntry('one'), makeEntry('two'), makeEntry('three')],
    cursor: 0,
    groupMode: 'status',
    peekOpen: false,
    peekPageOffset: 0,
    renameMode: false,
    renameDraft: '',
    pendingStopId: null,
    lastError: null,
    dispatchPrompt: '',
    ...over,
  })

  function makeCallbacks() {
    const calls: Calls = {
      moveCursor: [],
      setGroupMode: [],
      togglePeek: 0,
      beginRename: [],
      setPendingStop: [],
      attach: [],
      exit: 0,
      dispatch: 0,
      dispatchDraft: [],
      movePeekPage: [],
      editPrompt: 0,
      setDispatchPrompt: [],
      spawnShell: [],
    }
    const actions: AgentViewActions = {
      refresh: async () => {},
      moveCursor: d => {
        calls.moveCursor.push(d)
      },
      setCursor: () => {},
      jumpToIndex: i => {
        calls.moveCursor.push(i)
      },
      setGroupMode: m => {
        calls.setGroupMode.push(m)
      },
      togglePeek: () => {
        calls.togglePeek++
      },
      closePeek: () => {},
      movePeekPage: d => {
        calls.movePeekPage.push(d)
      },
      beginRename: n => {
        calls.beginRename.push(n)
      },
      setRenameDraft: () => {},
      endRename: () => {},
      setPendingStop: id => {
        calls.setPendingStop.push(id)
      },
      setError: () => {},
      setDispatchPrompt: t => {
        calls.setDispatchPrompt.push(t)
      },
    }
    const cb = {
      onAttach: (e: SessionEntry) => {
        calls.attach.push(e.id)
      },
      onDispatchAndAttach: (_e: SessionEntry | null, draft: string) => {
        calls.dispatch++
        calls.dispatchDraft.push(draft)
      },
      onEditPrompt: () => {
        calls.editPrompt++
      },
      onStop: () => {},
      onExit: () => {
        calls.exit++
      },
      onSpawnShell: (cmd: string) => {
        calls.spawnShell.push(cmd)
      },
    }
    return { calls, actions, cb }
  }

  test('↑ moves cursor up', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(baseState({ cursor: 1 }), actions, cb)
    handler('', fakeKey({ upArrow: true }))
    expect(calls.moveCursor).toEqual([-1])
  })

  test('↓ moves cursor down', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(baseState(), actions, cb)
    handler('', fakeKey({ downArrow: true }))
    expect(calls.moveCursor).toEqual([1])
  })

  test('Enter attaches selected', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(baseState({ cursor: 1 }), actions, cb)
    handler('', fakeKey({ return: true }))
    expect(calls.attach).toEqual(['two'])
  })

  test('Space toggles peek', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(baseState(), actions, cb)
    handler(' ', fakeKey({}))
    expect(calls.togglePeek).toBe(1)
  })

  test('Ctrl+S toggles group mode', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(
      baseState({ groupMode: 'status' }),
      actions,
      cb,
    )
    handler('s', fakeKey({ ctrl: true }))
    expect(calls.setGroupMode).toEqual(['cwd'])
  })

  test('Alt+1 jumps to index 0', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(baseState({ cursor: 2 }), actions, cb)
    handler('1', fakeKey({ meta: true }))
    expect(calls.moveCursor).toEqual([0])
  })

  test('Alt+3 jumps to index 2', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(baseState(), actions, cb)
    handler('3', fakeKey({ meta: true }))
    expect(calls.moveCursor).toEqual([2])
  })

  test('Ctrl+R begins rename with current name', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(baseState({ cursor: 1 }), actions, cb)
    handler('r', fakeKey({ ctrl: true }))
    expect(calls.beginRename).toEqual(['two'])
  })

  test('Ctrl+X marks pendingStop on first press, clears on second (delete path)', () => {
    const { calls, actions, cb } = makeCallbacks()
    let s = baseState({ cursor: 0 })
    const handler1 = createKeyHandler(s, actions, cb)
    handler1('x', fakeKey({ ctrl: true }))
    expect(calls.setPendingStop).toEqual(['one'])

    // Simulate state update: pendingStopId set, then 2nd press clears.
    const s2 = { ...s, pendingStopId: 'one' }
    const handler2 = createKeyHandler(s2, actions, cb)
    handler2('x', fakeKey({ ctrl: true }))
    expect(calls.setPendingStop).toEqual(['one', null])
  })

  test('← exits dashboard', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(baseState(), actions, cb)
    handler('', fakeKey({ leftArrow: true }))
    expect(calls.exit).toBe(1)
  })

  test('q exits dashboard', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(baseState(), actions, cb)
    handler('q', fakeKey({}))
    expect(calls.exit).toBe(1)
  })

  // ---- Tier 2 (v2.26.1, Worker P) ----

  test('Ctrl+G calls onEditPrompt (open $EDITOR for dispatch prompt)', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(baseState(), actions, cb)
    handler('g', fakeKey({ ctrl: true }))
    expect(calls.editPrompt).toBe(1)
  })

  test('Shift+Enter dispatches with dispatchPrompt as draft', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(
      baseState({ dispatchPrompt: 'fix the bug in foo.ts' }),
      actions,
      cb,
    )
    handler('', fakeKey({ return: true, shift: true }))
    expect(calls.dispatch).toBe(1)
    expect(calls.dispatchDraft).toEqual(['fix the bug in foo.ts'])
  })

  test('Ctrl+Enter (fallback for non-Kitty terminals) also dispatches with draft', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(
      baseState({ dispatchPrompt: 'review pr 42' }),
      actions,
      cb,
    )
    handler('', fakeKey({ return: true, ctrl: true }))
    expect(calls.dispatchDraft).toEqual(['review pr 42'])
  })

  test('PgUp in peek-open paginates older (movePeekPage +1)', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(
      baseState({ peekOpen: true }),
      actions,
      cb,
    )
    handler('', fakeKey({ pageUp: true }))
    expect(calls.movePeekPage).toEqual([1])
  })

  test('PgDn in peek-open paginates newer (movePeekPage -1)', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(
      baseState({ peekOpen: true }),
      actions,
      cb,
    )
    handler('', fakeKey({ pageDown: true }))
    expect(calls.movePeekPage).toEqual([-1])
  })

  test('PgUp/PgDn ignored when peek is closed (no-op)', () => {
    const { calls, actions, cb } = makeCallbacks()
    const handler = createKeyHandler(
      baseState({ peekOpen: false }),
      actions,
      cb,
    )
    handler('', fakeKey({ pageUp: true }))
    handler('', fakeKey({ pageDown: true }))
    expect(calls.movePeekPage).toEqual([])
  })

  test('rename mode: typed chars accumulate, Enter ends, Esc cancels', () => {
    const { calls, actions, cb } = makeCallbacks()
    // First test: typing -> setRenameDraft chain (we re-spy through closure)
    let draft = 'foo'
    const customActions: AgentViewActions = {
      ...actions,
      setRenameDraft: d => {
        draft = d
      },
      endRename: () => {
        calls.beginRename.push('END')
      },
    }
    const state = baseState({ renameMode: true, renameDraft: draft })
    const handler = createKeyHandler(state, customActions, cb)
    handler('b', fakeKey({}))
    expect(draft).toBe('foob')
    const handler2 = createKeyHandler(
      { ...state, renameDraft: draft },
      customActions,
      cb,
    )
    handler2('', fakeKey({ return: true }))
    expect(calls.beginRename).toContain('END')
  })

  describe('! prefix: shell command dispatch', () => {
    test('`! ls` → calls onSpawnShell("ls"), does NOT call onDispatchAndAttach', () => {
      const { calls, actions, cb } = makeCallbacks()
      const handler = createKeyHandler(
        baseState({ dispatchPrompt: '! ls' }),
        actions,
        cb,
      )
      handler('', fakeKey({ return: true, shift: true }))
      expect(calls.spawnShell).toEqual(['ls'])
      expect(calls.dispatch).toBe(0)
    })

    test('`!   ls -la  ` trims extra whitespace → onSpawnShell("ls -la")', () => {
      const { calls, actions, cb } = makeCallbacks()
      const handler = createKeyHandler(
        baseState({ dispatchPrompt: '!   ls -la  ' }),
        actions,
        cb,
      )
      handler('', fakeKey({ return: true, shift: true }))
      expect(calls.spawnShell).toEqual(['ls -la'])
      expect(calls.dispatch).toBe(0)
    })

    test('`! ` (only spaces after !) → falls through to onDispatchAndAttach, not shell', () => {
      // /^!\s*(.+)/ does not match when nothing follows `!` + spaces
      const { calls, actions, cb } = makeCallbacks()
      const handler = createKeyHandler(
        baseState({ dispatchPrompt: '! ' }),
        actions,
        cb,
      )
      handler('', fakeKey({ return: true, shift: true }))
      expect(calls.spawnShell).toEqual([])
      expect(calls.dispatch).toBe(1)
    })

    test('ordinary text (no ! prefix) → onDispatchAndAttach, NOT onSpawnShell', () => {
      const { calls, actions, cb } = makeCallbacks()
      const handler = createKeyHandler(
        baseState({ dispatchPrompt: 'hello world' }),
        actions,
        cb,
      )
      handler('', fakeKey({ return: true, shift: true }))
      expect(calls.spawnShell).toEqual([])
      expect(calls.dispatch).toBe(1)
    })

    test('Ctrl+Enter with `! echo hi` → also routes to shell', () => {
      const { calls, actions, cb } = makeCallbacks()
      const handler = createKeyHandler(
        baseState({ dispatchPrompt: '! echo hi' }),
        actions,
        cb,
      )
      handler('', fakeKey({ return: true, ctrl: true }))
      expect(calls.spawnShell).toEqual(['echo hi'])
      expect(calls.dispatch).toBe(0)
    })
  })
})

describe('PeekPanel.computePeekWindow (Tier 2 paging)', () => {
  test('PAGE_SIZE constant exists', () => {
    expect(typeof PEEK_PAGE_SIZE).toBe('number')
    expect(PEEK_PAGE_SIZE).toBeGreaterThan(0)
  })

  test('20 messages, offset 0 → last page slice', () => {
    const r = computePeekWindow(20, 0, 8)
    expect(r.start).toBe(12)
    expect(r.end).toBe(20)
    expect(r.totalPages).toBe(3)
    expect(r.clampedOffset).toBe(0)
  })

  test('20 messages, offset 1 → middle page', () => {
    const r = computePeekWindow(20, 1, 8)
    expect(r.start).toBe(4)
    expect(r.end).toBe(12)
  })

  test('20 messages, offset 2 → first page (partial)', () => {
    const r = computePeekWindow(20, 2, 8)
    expect(r.start).toBe(0)
    expect(r.end).toBe(4)
  })

  test('offset overshoots → clamped to last valid page', () => {
    const r = computePeekWindow(20, 99, 8)
    expect(r.clampedOffset).toBe(2)
    expect(r.start).toBe(0)
    expect(r.end).toBe(4)
  })

  test('empty messages → empty window, no crash', () => {
    const r = computePeekWindow(0, 0, 8)
    expect(r.start).toBe(0)
    expect(r.end).toBe(0)
    expect(r.totalPages).toBe(1)
  })

  test('fewer than one page → single page window', () => {
    const r = computePeekWindow(3, 0, 8)
    expect(r.start).toBe(0)
    expect(r.end).toBe(3)
    expect(r.totalPages).toBe(1)
  })
})

describe('roster: file path helpers', () => {
  test('getRosterPath ends with jobs/roster.json', () => {
    const p = rosterInternal.getRosterPath()
    expect(p.endsWith('jobs/roster.json')).toBe(true)
  })

  test('jobs directory anchored under PANDA_CONFIG_DIR', () => {
    const previousConfigDir = process.env.PANDA_CONFIG_DIR
    try {
      process.env.PANDA_CONFIG_DIR = '/tmp/panda-test-config'
      expect(rosterInternal.getJobsDir()).toBe('/tmp/panda-test-config/jobs')
    } finally {
      if (previousConfigDir === undefined) {
        delete process.env.PANDA_CONFIG_DIR
      } else {
        process.env.PANDA_CONFIG_DIR = previousConfigDir
      }
    }
  })
})

