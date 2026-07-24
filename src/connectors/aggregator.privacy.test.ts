// Input: applyPrivacyFilter 边界输入（正常/异常/坏正则/空配置/保留期）
// Output: bun:test 断言 fail-closed 语义 + P-003/P-004 规则
// Pos: connectors 隐私过滤回归测试（P-002/P-003/P-004）

import { describe, expect, test } from 'bun:test'
import {
  applyPrivacyFilter,
  applyDataRetentionFilter,
  type AggregatorPrivacyConfig,
} from './aggregator.js'
import type { IMMessage } from './types.js'
import {
  containsSensitive,
  containsSensitiveContent,
  getDataRetentionCutoffMs,
  type PrivacyConfig,
} from '../assistant/privacyConfig.js'

function msg(partial: Partial<IMMessage> & Pick<IMMessage, 'id' | 'content'>): IMMessage {
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

const basePrivacy: AggregatorPrivacyConfig = {
  filterPatterns: ['secret', 'token'],
  excludeChannels: ['secret-channel'],
  excludeSenders: ['bad-actor'],
}

describe('applyPrivacyFilter (fail-closed)', () => {
  test('redacts matching patterns in content', () => {
    const input = [msg({ id: '1', content: 'here is a secret value and a token' })]
    const out = applyPrivacyFilter(input, basePrivacy)
    expect(out).toHaveLength(1)
    expect(out[0]!.content).toContain('[REDACTED]')
    expect(out[0]!.content).not.toContain('secret')
    expect(out[0]!.content).not.toContain('token')
  })

  test('drops excluded channel and sender', () => {
    const input = [
      msg({ id: 'ok', content: 'hello', channelId: 'public' }),
      msg({ id: 'ch', content: 'hidden', channelId: 'secret-channel' }),
      msg({ id: 'bad', content: 'nope', senderId: 'bad-actor' }),
    ]
    const out = applyPrivacyFilter(input, basePrivacy)
    expect(out.map(m => m.id)).toEqual(['ok'])
  })

  test('No privacy config → pass-through', () => {
    const input = [msg({ id: '1', content: 'secret remains' })]
    const out = applyPrivacyFilter(input, null)
    expect(out).toHaveLength(1)
    expect(out[0]!.content).toBe('secret remains')
  })

  test('invalid regex pattern is skipped (other patterns still apply)', () => {
    const privacy: AggregatorPrivacyConfig = {
      filterPatterns: ['[invalid', 'secret'],
      excludeChannels: [],
      excludeSenders: [],
    }
    const input = [msg({ id: '1', content: 'top secret plan' })]
    const out = applyPrivacyFilter(input, privacy)
    expect(out).toHaveLength(1)
    expect(out[0]!.content).toContain('[REDACTED]')
    expect(out[0]!.content).not.toContain('secret')
  })

  test('throwing content getter yields safe placeholder, never original text', () => {
    const poisoned = msg({ id: 'poison', content: 'ORIGINAL_LEAK_secret' })
    Object.defineProperty(poisoned, 'content', {
      get() {
        throw new Error('content boom')
      },
      enumerable: true,
      configurable: true,
    })

    const out = applyPrivacyFilter([poisoned], basePrivacy)
    // Fail-closed: either dropped entirely OR safe placeholder — never ORIGINAL_LEAK
    const leaked = out.some(m => {
      try {
        return String(m.content).includes('ORIGINAL_LEAK')
      } catch {
        return true // even reading result throws = failure
      }
    })
    expect(leaked).toBe(false)
    if (out.length === 1) {
      expect(out[0]!.content).toBe('[REDACTED_FILTER_ERROR]')
      expect(out[0]!.id).toBe('poison')
    }
  })

  test('batch-level failure returns empty list (never unfiltered set)', () => {
    // Force a batch failure by making excludeChannels iteration throw via a Proxy
    const badPrivacy = new Proxy(basePrivacy, {
      get(target, prop, receiver) {
        if (prop === 'excludeChannels') {
          throw new Error('batch boom')
        }
        return Reflect.get(target, prop, receiver)
      },
    }) as AggregatorPrivacyConfig

    const input = [
      msg({ id: '1', content: 'a' }),
      msg({ id: '2', content: 'b' }),
    ]
    const out = applyPrivacyFilter(input, badPrivacy)
    expect(out).toEqual([])
  })
})

describe('P-003 privacy.json path/domain/app/sensitive', () => {
  test('excludeApps drops matching senderName / channelName', () => {
    const privacy: AggregatorPrivacyConfig = {
      filterPatterns: [],
      excludeChannels: [],
      excludeSenders: [],
      excludeApps: ['1Password', 'Keychain'],
    }
    const input = [
      msg({ id: 'keep', content: 'ok', senderName: 'alice' }),
      msg({ id: 'app', content: 'vault', senderName: '1Password' }),
      msg({ id: 'ch', content: 'keys', channelName: 'Keychain Access' }),
    ]
    const out = applyPrivacyFilter(input, privacy)
    expect(out.map(m => m.id)).toEqual(['keep'])
  })

  test('excludeBrowserDomains drops messages with matching URL/domain', () => {
    const privacy: AggregatorPrivacyConfig = {
      filterPatterns: [],
      excludeChannels: [],
      excludeSenders: [],
      excludeBrowserDomains: ['*.bank.*', 'secrets.gov'],
    }
    const input = [
      msg({ id: 'ok', content: 'see https://example.com/docs' }),
      msg({ id: 'bank', content: 'login https://online.bank.com/home' }),
      msg({
        id: 'att',
        content: 'file',
        attachments: [{ type: 'link', name: 'gov', url: 'https://secrets.gov/x' }],
      }),
    ]
    const out = applyPrivacyFilter(input, privacy)
    expect(out.map(m => m.id)).toEqual(['ok'])
  })

  test('excludePaths drops messages with matching attachment path', () => {
    const privacy: AggregatorPrivacyConfig = {
      filterPatterns: [],
      excludeChannels: [],
      excludeSenders: [],
      excludePaths: ['~/.ssh/**', '**/id_rsa'],
    }
    const input = [
      msg({ id: 'ok', content: 'readme', attachments: [{ type: 'file', name: 'notes.txt' }] }),
      msg({
        id: 'ssh',
        content: 'key',
        attachments: [{ type: 'file', name: '/Users/x/.ssh/id_rsa' }],
      }),
      msg({ id: 'path-in-body', content: 'copy ~/.ssh/config to backup' }),
    ]
    const out = applyPrivacyFilter(input, privacy)
    expect(out.map(m => m.id)).toEqual(['ok'])
  })

  test('sensitivePatterns redact via filterPatterns merge field', () => {
    const privacy: AggregatorPrivacyConfig = {
      filterPatterns: ['password', 'api[_-]?key'],
      excludeChannels: [],
      excludeSenders: [],
    }
    const out = applyPrivacyFilter(
      [msg({ id: '1', content: 'password=hunter2 api_key=xyz' })],
      privacy,
    )
    expect(out).toHaveLength(1)
    expect(out[0]!.content).not.toMatch(/password/i)
    expect(out[0]!.content).not.toMatch(/api_key/i)
    expect(out[0]!.content).toContain('[REDACTED]')
  })
})

describe('P-004 dataRetentionDays (connector only)', () => {
  const DAY = 86_400_000
  const now = Date.UTC(2026, 6, 24, 12, 0, 0) // 2026-07-24

  test('applyDataRetentionFilter drops messages older than cutoff', () => {
    const input = [
      msg({ id: 'fresh', content: 'new', timestamp: now - 10 * DAY }),
      msg({ id: 'old', content: 'stale', timestamp: now - 100 * DAY }),
      msg({ id: 'edge', content: 'edge', timestamp: now - 90 * DAY }),
    ]
    const out = applyDataRetentionFilter(input, 90, now)
    expect(out.map(m => m.id).sort()).toEqual(['edge', 'fresh'])
  })

  test('dataRetentionDays=0 or undefined does not drop', () => {
    const input = [msg({ id: 'old', content: 'x', timestamp: now - 365 * DAY })]
    expect(applyDataRetentionFilter(input, 0, now)).toHaveLength(1)
    expect(applyDataRetentionFilter(input, undefined, now)).toHaveLength(1)
  })

  test('applyPrivacyFilter honors dataRetentionDays on override', () => {
    const privacy: AggregatorPrivacyConfig = {
      filterPatterns: [],
      excludeChannels: [],
      excludeSenders: [],
      dataRetentionDays: 30,
    }
    const input = [
      msg({ id: 'fresh', content: 'ok', timestamp: Date.now() - 5 * DAY }),
      msg({ id: 'old', content: 'stale', timestamp: Date.now() - 60 * DAY }),
    ]
    const out = applyPrivacyFilter(input, privacy)
    expect(out.map(m => m.id)).toEqual(['fresh'])
  })

  test('getDataRetentionCutoffMs respects config days', () => {
    const cfg: PrivacyConfig = {
      excludePaths: [],
      excludeApps: [],
      excludeBrowserDomains: [],
      sensitivePatterns: [],
      dataRetentionDays: 90,
      localLLMForSensitive: true,
    }
    const cutoff = getDataRetentionCutoffMs(cfg, now)
    expect(cutoff).toBe(now - 90 * DAY)
    expect(getDataRetentionCutoffMs({ ...cfg, dataRetentionDays: 0 }, now)).toBeNull()
  })
})

describe('containsSensitiveContent compatibility alias', () => {
  test('alias equals containsSensitive behavior', () => {
    const cfg: PrivacyConfig = {
      excludePaths: [],
      excludeApps: [],
      excludeBrowserDomains: [],
      sensitivePatterns: ['password', 'sk-'],
      dataRetentionDays: 90,
      localLLMForSensitive: true,
    }
    expect(containsSensitive('password=1', cfg)).toBe(true)
    expect(containsSensitiveContent('password=1', cfg)).toBe(true)
    expect(containsSensitive('hello', cfg)).toBe(false)
    expect(containsSensitiveContent('hello', cfg)).toBe(false)
    expect(containsSensitiveContent).toBe(containsSensitive)
  })
})
