// Input: SessionEntry[] (来自 enumerateSessions)
// Output: 断言 buildActiveSessionsJson 过滤/映射为合法 active-session JSON
// Pos: src/cli/handlers/ —— claude agents --json 输出契约测试

import { describe, expect, test } from 'bun:test'
import { buildActiveSessionsJson } from './agents.js'
import type { SessionEntry } from '../../components/AgentView/types.js'

function makeEntry(overrides: Partial<SessionEntry>): SessionEntry {
  return {
    id: 'pid:1234',
    displayName: 'demo',
    sessionId: 'sess-1',
    pid: 1234,
    status: 'idle',
    shape: 'alive',
    cwd: '/tmp/work',
    startedAt: 1700000000000,
    lastMessage: 'hello',
    pinned: false,
    prStatus: null,
    ...overrides,
  }
}

describe('agents --json: buildActiveSessionsJson', () => {
  test('empty input serializes to a valid empty JSON array', () => {
    const result = buildActiveSessionsJson([])
    expect(result).toEqual([])
    expect(JSON.parse(JSON.stringify(result))).toEqual([])
  })

  test('only alive sessions are included; exited/looping roster-only entries dropped', () => {
    const entries: SessionEntry[] = [
      makeEntry({ id: 'pid:1', pid: 1, shape: 'alive' }),
      makeEntry({ id: 'roster:x', pid: null, shape: 'exited' }),
      makeEntry({ id: 'pid:2', pid: 2, shape: 'looping' }),
    ]
    const result = buildActiveSessionsJson(entries)
    expect(result.map(r => r.id)).toEqual(['pid:1'])
  })

  test('maps stable fields and is JSON-serializable', () => {
    const entry = makeEntry({
      id: 'pid:99',
      displayName: 'my-agent',
      sessionId: 'abc-123',
      pid: 99,
      status: 'working',
      cwd: '/repo',
      startedAt: 1781329492515,
      pinned: true,
      prStatus: 'open',
      waitingFor: 'review',
    })
    const [json] = buildActiveSessionsJson([entry])
    // Round-trips through JSON without loss.
    const roundTripped = JSON.parse(JSON.stringify(json))
    expect(roundTripped).toEqual({
      id: 'pid:99',
      name: 'my-agent',
      sessionId: 'abc-123',
      pid: 99,
      status: 'working',
      cwd: '/repo',
      startedAt: 1781329492515,
      pinned: true,
      prStatus: 'open',
      waitingFor: 'review',
    })
  })

  test('waitingFor omitted when absent (no fabricated null fields)', () => {
    const [json] = buildActiveSessionsJson([makeEntry({})])
    expect('waitingFor' in json).toBe(false)
  })
})
