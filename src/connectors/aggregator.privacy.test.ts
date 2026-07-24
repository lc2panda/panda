// Input: applyPrivacyFilter 消息列表 + 隐私配置
// Output: 正常 redact/排除；异常 fail-closed（单条占位 / 整批空列表）
// Pos: connectors/ 隐私过滤回归测试 (P-002)

import { describe, expect, test } from 'bun:test'
import {
  applyPrivacyFilter,
  type AggregatorPrivacyConfig,
} from './aggregator.js'
import type { IMMessage } from './types.js'

function msg(partial: Partial<IMMessage> & { id: string; content: string }): IMMessage {
  return {
    platform: 'feishu',
    channelId: 'ch-1',
    channelName: 'general',
    senderId: 'u-1',
    senderName: 'alice',
    contentType: 'text',
    timestamp: Date.now(),
    isRead: false,
    isMentioned: false,
    ...partial,
  }
}

const privacy: AggregatorPrivacyConfig = {
  filterPatterns: ['secret-token-\\w+', 'password'],
  excludeChannels: ['private-ch'],
  excludeSenders: ['bot-spam'],
}

describe('applyPrivacyFilter (P-002 fail-closed)', () => {
  test('正常过滤：模式 redact + 频道/发送者排除', () => {
    const input = [
      msg({ id: '1', content: 'hello world' }),
      msg({ id: '2', content: 'here is secret-token-abc keep rest' }),
      msg({ id: '3', content: 'ok', channelId: 'private-ch' }),
      msg({ id: '4', content: 'ok', senderId: 'bot-spam' }),
    ]
    const out = applyPrivacyFilter(input, privacy)
    expect(out.map(m => m.id)).toEqual(['1', '2'])
    expect(out[0]!.content).toBe('hello world')
    expect(out[1]!.content).toBe('here is [REDACTED] keep rest')
    expect(out[1]!.content).not.toContain('secret-token-abc')
  })

  test('无隐私配置 → 原样透传', () => {
    const input = [msg({ id: '1', content: 'password=visible' })]
    expect(applyPrivacyFilter(input, null)).toEqual(input)
  })

  test('过滤器单条抛错 → 不放行原文，使用安全占位', () => {
    const poison: IMMessage = msg({ id: 'poison', content: 'SENSITIVE_RAW' })
    Object.defineProperty(poison, 'content', {
      enumerable: true,
      get() {
        throw new Error('content boom')
      },
    })
    const safe = msg({ id: 'safe', content: 'all good' })
    const out = applyPrivacyFilter([poison, safe], privacy)
    expect(out).toHaveLength(2)
    const poisoned = out.find(m => m.id === 'poison')
    expect(poisoned).toBeDefined()
    expect(poisoned!.content).toBe('[REDACTED_FILTER_ERROR]')
    expect(poisoned!.content).not.toBe('SENSITIVE_RAW')
    expect(out.find(m => m.id === 'safe')!.content).toBe('all good')
  })

  test('整批失败 → 返回空列表，不得返回未过滤全集', () => {
    // Non-iterable-like object that throws on iteration
    const batchBomb = {
      [Symbol.iterator](): Iterator<IMMessage> {
        throw new Error('batch boom')
      },
    } as unknown as IMMessage[]

    const out = applyPrivacyFilter(batchBomb, privacy)
    expect(out).toEqual([])
  })

  test('无效正则不导致 fail-open 放行敏感原文', () => {
    const badPrivacy: AggregatorPrivacyConfig = {
      filterPatterns: ['[invalid', 'secret-token-\\w+'],
      excludeChannels: [],
      excludeSenders: [],
    }
    const input = [msg({ id: '1', content: 'x secret-token-xyz y' })]
    const out = applyPrivacyFilter(input, badPrivacy)
    expect(out).toHaveLength(1)
    // Valid pattern still applied; invalid one skipped
    expect(out[0]!.content).toBe('x [REDACTED] y')
    expect(out[0]!.content).not.toContain('secret-token-xyz')
  })
})
