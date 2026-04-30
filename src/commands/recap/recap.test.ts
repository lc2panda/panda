/**
 * Input:  mock LocalJSXCommandContext + 假 SessionMemory + 假 generateAwaySummary
 * Output: 断言 /recap 命令的 call() 在以下场景的行为：
 *   1) 空会话 → onDone 系统消息提示，不调 setMessages
 *   2) 当前 turn 已有 away_summary → onDone 提示已存在，不调 setMessages
 *   3) 正常路径 → setMessages 收到一条新的 SystemMessage{subtype:'away_summary'}
 * Pos:    src/commands/recap/recap.test.ts — 集成层测试，验证命令注册后能正确
 *         驱动 setMessages 通路，最终触达 SystemTextMessage 的 ※ 渲染分支。
 *
 * NEW-FILE:#20260426-01
 */

import { test, expect, mock, afterEach, describe } from 'bun:test'
import type { Message } from '../../types/message.js'

afterEach(() => {
  mock.restore()
})

function makeContext(messages: Message[]) {
  const captured: Array<Message[]> = []
  const setMessages = (
    updater: (prev: Message[]) => Message[],
  ): void => {
    const next = updater(messages)
    captured.push(next)
  }
  const ctx = {
    getAppState: () => ({ messages }) as any,
    setMessages,
  } as any
  return { ctx, captured }
}

function userMsg(content: string, isMeta = false): Message {
  return {
    type: 'user',
    message: {
      id: 'u',
      role: 'user',
      content: [{ type: 'text', text: content }],
    },
    uuid: 'u',
    timestamp: '0',
    isMeta,
  } as unknown as Message
}

function awaySummaryMsg(text = 'recap text'): Message {
  return {
    type: 'system',
    subtype: 'away_summary',
    content: text,
    uuid: 's',
    timestamp: '0',
    isMeta: false,
  } as unknown as Message
}

describe('/recap command integration', () => {
  test('空 messages → onDone 提示，不调 setMessages', async () => {
    mock.module('../../services/awaySummary.js', () => ({
      generateAwaySummary: async () => 'should-not-be-called',
    }))
    const { default: recap } = await import('./index.js?empty=1')
    if (recap.type !== 'local-jsx') {
      throw new Error('recap must be local-jsx')
    }
    const mod = await recap.load()
    const { ctx, captured } = makeContext([])
    let doneText: string | undefined
    let doneOpts: any
    const onDone = (t?: string, o?: any) => {
      doneText = t
      doneOpts = o
    }
    await mod.call(onDone, ctx, '')
    expect(doneText).toContain('No conversation')
    expect(doneOpts?.display).toBe('system')
    expect(captured.length).toBe(0)
  })

  test('已存在 away_summary（同 turn）→ 提示已存在，不再调用 generateAwaySummary', async () => {
    let generateCalls = 0
    mock.module('../../services/awaySummary.js', () => ({
      generateAwaySummary: async () => {
        generateCalls++
        return 'fresh-summary'
      },
    }))
    const { default: recap } = await import('./index.js?dup=1')
    if (recap.type !== 'local-jsx') throw new Error('type mismatch')
    const mod = await recap.load()
    const messages: Message[] = [userMsg('hi'), awaySummaryMsg('old')]
    const { ctx, captured } = makeContext(messages)
    let doneText: string | undefined
    const onDone = (t?: string) => {
      doneText = t
    }
    await mod.call(onDone, ctx, '')
    expect(doneText).toContain('already exists')
    expect(generateCalls).toBe(0)
    expect(captured.length).toBe(0)
  })

  test('正常路径 → setMessages 被调用一次，新消息为 system+away_summary', async () => {
    mock.module('../../services/awaySummary.js', () => ({
      generateAwaySummary: async () =>
        'You were debugging X. Next: add cleanup.',
    }))
    const { default: recap } = await import('./index.js?ok=1')
    if (recap.type !== 'local-jsx') throw new Error('type mismatch')
    const mod = await recap.load()
    const messages: Message[] = [userMsg('please help debug')]
    const { ctx, captured } = makeContext(messages)
    let doneText: string | undefined
    let doneOpts: any
    const onDone = (t?: string, o?: any) => {
      doneText = t
      doneOpts = o
    }
    await mod.call(onDone, ctx, '')
    expect(captured.length).toBe(1)
    const last = captured[0]![captured[0]!.length - 1]! as any
    expect(last.type).toBe('system')
    expect(last.subtype).toBe('away_summary')
    expect(last.content).toContain('debugging')
    // onDone with display:'skip' → 不在 transcript 留 stdout 包装
    expect(doneOpts?.display).toBe('skip')
    expect(doneText).toBeUndefined()
  })

  test('generateAwaySummary 返回 null（abort/error）→ 提示并不 push', async () => {
    mock.module('../../services/awaySummary.js', () => ({
      generateAwaySummary: async () => null,
    }))
    const { default: recap } = await import('./index.js?null=1')
    if (recap.type !== 'local-jsx') throw new Error('type mismatch')
    const mod = await recap.load()
    const messages: Message[] = [userMsg('hi')]
    const { ctx, captured } = makeContext(messages)
    let doneText: string | undefined
    const onDone = (t?: string) => {
      doneText = t
    }
    await mod.call(onDone, ctx, '')
    expect(captured.length).toBe(0)
    // v2.25.57: null 路径文案细分为 timeout / empty / err 三类，断言关键字 "empty"
    expect(doneText).toContain('empty')
  })
})

describe('/recap command shape', () => {
  test('注册元信息正确', async () => {
    mock.module('../../services/awaySummary.js', () => ({
      generateAwaySummary: async () => 'x',
    }))
    const { default: recap } = await import('./index.js?meta=1')
    expect(recap.name).toBe('recap')
    expect(recap.type).toBe('local-jsx')
    expect(recap.description).toContain('summary')
    expect(recap.immediate).toBe(true)
  })
})

describe('/recap 与自动版冲突防护', () => {
  test('isMeta=true 的 user 消息不应重置守卫（与 hook 同源）', async () => {
    let generateCalls = 0
    mock.module('../../services/awaySummary.js', () => ({
      generateAwaySummary: async () => {
        generateCalls++
        return 'fresh'
      },
    }))
    const { default: recap } = await import('./index.js?meta-user=1')
    if (recap.type !== 'local-jsx') throw new Error('type mismatch')
    const mod = await recap.load()
    // 顺序：user → away_summary → meta-user（meta 不重置守卫，仍应判定"已存在"）
    const messages: Message[] = [
      userMsg('real user msg'),
      awaySummaryMsg(),
      userMsg('meta', true),
    ]
    const { ctx, captured } = makeContext(messages)
    let doneText: string | undefined
    await mod.call((t?: string) => {
      doneText = t
    }, ctx, '')
    expect(generateCalls).toBe(0)
    expect(captured.length).toBe(0)
    expect(doneText).toContain('already exists')
  })

  test('新 user turn（非 meta）后允许再次手动 recap', async () => {
    mock.module('../../services/awaySummary.js', () => ({
      generateAwaySummary: async () => 'second-recap',
    }))
    const { default: recap } = await import('./index.js?new-turn=1')
    if (recap.type !== 'local-jsx') throw new Error('type mismatch')
    const mod = await recap.load()
    const messages: Message[] = [
      userMsg('first'),
      awaySummaryMsg('first-recap'),
      userMsg('second real user msg'),
    ]
    const { ctx, captured } = makeContext(messages)
    await mod.call(() => {}, ctx, '')
    expect(captured.length).toBe(1)
    const last = captured[0]![captured[0]!.length - 1]! as any
    expect(last.subtype).toBe('away_summary')
    expect(last.content).toBe('second-recap')
  })
})
