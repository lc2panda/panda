// Input:  system/tools block 列表 + messages 列表
// Output: addCacheBreakpoints 按 Anthropic 4-marker 上限动态收缩 messages primary/secondary
// Pos:    Wave 14 Rho-3 P0-A — 5-marker 超限防御单元测试

import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import {
  MAX_CACHE_CONTROL_MARKERS,
  addCacheBreakpoints,
  countExistingCacheControlMarkers,
} from './claude.js'
import { createUserMessage } from '../../utils/messages.js'
import type { UserMessage } from '../../types/message.js'

const originalAnthropicApiKey = process.env.ANTHROPIC_API_KEY
const originalFirstPartyApiKey = process.env.FIRST_PARTY_ANTHROPIC_API_KEY

beforeAll(() => {
  process.env.ANTHROPIC_API_KEY = 'test-api-key'
  process.env.FIRST_PARTY_ANTHROPIC_API_KEY = 'test-api-key'
})

afterAll(() => {
  if (originalAnthropicApiKey === undefined) {
    delete process.env.ANTHROPIC_API_KEY
  } else {
    process.env.ANTHROPIC_API_KEY = originalAnthropicApiKey
  }
  if (originalFirstPartyApiKey === undefined) {
    delete process.env.FIRST_PARTY_ANTHROPIC_API_KEY
  } else {
    process.env.FIRST_PARTY_ANTHROPIC_API_KEY = originalFirstPartyApiKey
  }
})

function mkMsgs(n: number): UserMessage[] {
  return Array.from({ length: n }, (_, i) =>
    createUserMessage({ content: `msg-${i}` }),
  ) as UserMessage[]
}

function countMarkersInMessages(result: readonly { content: unknown }[]): number {
  let count = 0
  for (const msg of result) {
    if (!Array.isArray(msg.content)) continue
    for (const block of msg.content) {
      if (block && typeof block === 'object' && 'cache_control' in block) {
        count += 1
      }
    }
  }
  return count
}

describe('Wave 14 Rho-3 — countExistingCacheControlMarkers', () => {
  test('system + tools 均无 cache_control → 0', () => {
    const system = [{ type: 'text', text: 'a' }]
    const tools = [{ name: 'T', description: '', input_schema: {} }]
    expect(countExistingCacheControlMarkers(system, tools)).toBe(0)
  })

  test('system 1 marker + tools 1 marker → 2', () => {
    const system = [
      { type: 'text', text: 'a' },
      { type: 'text', text: 'b', cache_control: { type: 'ephemeral' } },
    ]
    const tools = [
      { name: 'A', description: '', input_schema: {} },
      {
        name: 'B',
        description: '',
        input_schema: {},
        cache_control: { type: 'ephemeral', ttl: '1h' },
      },
    ]
    expect(countExistingCacheControlMarkers(system, tools)).toBe(2)
  })

  test('system 2 markers + tools 1 marker → 3 (Nu-2 退化路径场景)', () => {
    const system = [
      { type: 'text', text: 'attr' }, // billing header, null scope
      {
        type: 'text',
        text: 'prefix',
        cache_control: { type: 'ephemeral', ttl: '1h' },
      },
      {
        type: 'text',
        text: 'rest',
        cache_control: { type: 'ephemeral', ttl: '1h' },
      },
    ]
    const tools = [
      { name: 'A', description: '', input_schema: {} },
      {
        name: 'Z',
        description: '',
        input_schema: {},
        cache_control: { type: 'ephemeral', ttl: '1h' },
      },
    ]
    expect(countExistingCacheControlMarkers(system, tools)).toBe(3)
  })

  test('undefined 输入 → 0', () => {
    expect(countExistingCacheControlMarkers(undefined, undefined)).toBe(0)
  })

  test('MAX_CACHE_CONTROL_MARKERS 对齐 Anthropic 官方上限 4', () => {
    expect(MAX_CACHE_CONTROL_MARKERS).toBe(4)
  })
})

describe('Wave 14 Rho-3 — addCacheBreakpoints marker budget 防御', () => {
  test('occupiedMarkerCount 未传（默认 0）→ 双 marker（保留旧行为，backward-compat）', () => {
    const messages = mkMsgs(5)
    const result = addCacheBreakpoints(messages, true, 'repl_main_thread')
    // primary @ last + secondary @ messages[0] = 2 marker
    expect(countMarkersInMessages(result)).toBe(2)
  })

  test('occupiedMarkerCount=2 (firstParty Global Cache 命中路径) → 双 marker 不变 (byte-equal)', () => {
    const messages = mkMsgs(5)
    const result = addCacheBreakpoints(
      messages,
      true,
      'repl_main_thread',
      false,
      null,
      [],
      false,
      2, // 4 - 2 = 2 slots → 双 marker
    )
    expect(countMarkersInMessages(result)).toBe(2)
  })

  test('occupiedMarkerCount=3 (Nu-2 5-marker 退化场景) → 砍 secondary，保 primary', () => {
    const messages = mkMsgs(5)
    const result = addCacheBreakpoints(
      messages,
      true,
      'repl_main_thread',
      false,
      null,
      [],
      false,
      3, // 4 - 3 = 1 slot → 仅 primary
    )
    expect(countMarkersInMessages(result)).toBe(1)
    // primary @ 末尾，secondary @ 首条应该无 marker
    const last = result[result.length - 1]!
    const first = result[0]!
    expect(
      Array.isArray(last.content) &&
        last.content.some(b => b && typeof b === 'object' && 'cache_control' in b),
    ).toBe(true)
    expect(
      Array.isArray(first.content) &&
        first.content.some(
          b => b && typeof b === 'object' && 'cache_control' in b,
        ),
    ).toBe(false)
  })

  test('occupiedMarkerCount=4 (system + tools 已占满 4) → 不插任何 messages marker', () => {
    const messages = mkMsgs(5)
    const result = addCacheBreakpoints(
      messages,
      true,
      'repl_main_thread',
      false,
      null,
      [],
      false,
      4,
    )
    expect(countMarkersInMessages(result)).toBe(0)
  })

  test('occupiedMarkerCount=5 (极端超限) → messages 砍光，总 marker 仍可能 >4 但本函数尽力', () => {
    const messages = mkMsgs(5)
    const result = addCacheBreakpoints(
      messages,
      true,
      'repl_main_thread',
      false,
      null,
      [],
      false,
      5,
    )
    // 本函数只管 messages 侧，能砍 0 个是已做完的部分
    expect(countMarkersInMessages(result)).toBe(0)
  })

  test('enablePromptCaching=false → 无论 budget 如何都无 marker', () => {
    const messages = mkMsgs(5)
    const result = addCacheBreakpoints(
      messages,
      false, // caching off
      'repl_main_thread',
      false,
      null,
      [],
      false,
      2,
    )
    expect(countMarkersInMessages(result)).toBe(0)
  })

  test('messages.length < 4 → secondary 本就未启用，不受 budget 影响', () => {
    const messages = mkMsgs(2)
    const result = addCacheBreakpoints(
      messages,
      true,
      'repl_main_thread',
      false,
      null,
      [],
      false,
      2,
    )
    // 仅 primary
    expect(countMarkersInMessages(result)).toBe(1)
  })

  test('总 marker ≤ 4：occupied=2 + messages=2 → 4 刚好不超', () => {
    const messages = mkMsgs(5)
    const result = addCacheBreakpoints(
      messages,
      true,
      'repl_main_thread',
      false,
      null,
      [],
      false,
      2,
    )
    const messageMarkers = countMarkersInMessages(result)
    expect(2 + messageMarkers).toBeLessThanOrEqual(MAX_CACHE_CONTROL_MARKERS)
    expect(2 + messageMarkers).toBe(4)
  })

  test('总 marker ≤ 4：occupied=3 + messages=1 = 4', () => {
    const messages = mkMsgs(5)
    const result = addCacheBreakpoints(
      messages,
      true,
      'repl_main_thread',
      false,
      null,
      [],
      false,
      3,
    )
    const messageMarkers = countMarkersInMessages(result)
    expect(3 + messageMarkers).toBeLessThanOrEqual(MAX_CACHE_CONTROL_MARKERS)
    expect(3 + messageMarkers).toBe(4)
  })
})
