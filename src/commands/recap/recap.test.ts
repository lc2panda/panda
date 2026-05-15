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
  // v2.26.2+ hotfix regression: messages 通过 ToolUseContext.messages 注入
  // （见 Tool.ts:250 + REPL.tsx getToolUseContext L2525），AppState 类型
  // 里根本没有 messages 字段（见 AppStateStore.ts AppState 定义）。运行时
  // context.getAppState().messages === undefined，触发 "No conversation
  // yet" 误判 → 这是 Comdr 实测 P0 bug 的真因。
  //
  // 旧 mock 把 messages 假塞进 getAppState() 让测试通过但掩盖了 bug。
  // 现在 getAppState() 返回的 AppState shape **不含** messages，messages
  // 仅通过 ctx.messages 暴露 — 强制 recap.ts 必须读 context.messages 才能
  // 跑通测试，与运行时契约对齐。
  const ctx = {
    getAppState: () => ({}) as any, // 模拟真实 AppState — 不含 messages
    messages,
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
    // v2.25.59: onDone 立即 ack（display:'system' + 'Generating recap…'）
    expect(doneOpts?.display).toBe('system')
    expect(doneText).toBe('Generating recap…')
    // setMessages 在 background fire-and-forget 中触发，等 microtask 跑完再断言
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(captured.length).toBe(1)
    const last = captured[0]![captured[0]!.length - 1]! as any
    expect(last.type).toBe('system')
    expect(last.subtype).toBe('away_summary')
    expect(last.content).toContain('debugging')
  })

  test('generateAwaySummary 返回 null（abort/error）→ background 不 push', async () => {
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
    // v2.25.59: onDone 立即 ack 'Generating recap…' 即使 background 失败
    expect(doneText).toBe('Generating recap…')
    await new Promise(resolve => setTimeout(resolve, 50))
    // background null → 不 push（仅 log，dispatch 已 ack）
    expect(captured.length).toBe(0)
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

// v2.26.2+ hotfix regression — Comdr 实测 /recap 永远 "No conversation yet"
// 的 P0 bug。真因：recap.ts 旧版读 context.getAppState().messages 拿到
// undefined，AppState 类型里根本没有 messages 字段。messages 是
// ToolUseContext 顶层字段（Tool.ts:250），由 REPL.tsx:2525 getToolUseContext
// 直接装进 context.messages。固定下此契约，防止再次回归。
describe('/recap regression — context.messages 是 messages 的唯一真源', () => {
  test('当 getAppState() 返回的 AppState 不含 messages（真实运行时契约）但 context.messages 有数据 → 走正常路径，不应误判为空会话', async () => {
    mock.module('../../services/awaySummary.js', () => ({
      generateAwaySummary: async () => 'a recap from real context.messages',
    }))
    const { default: recap } = await import('./index.js?regression-runtime=1')
    if (recap.type !== 'local-jsx') throw new Error('type mismatch')
    const mod = await recap.load()

    // 严格模拟运行时：getAppState() 返回的对象**没有** messages 字段，
    // 同时 ctx.messages 有真实历史。如果实现还读 getAppState().messages
    // 就会拿到 undefined → 报 "No conversation yet" → 测试失败。
    const messages: Message[] = [userMsg('please summarise our convo')]
    const captured: Array<Message[]> = []
    const ctx = {
      getAppState: () => ({}) as any, // 真实 AppState — 不含 messages
      messages,
      setMessages: (updater: (prev: Message[]) => Message[]) => {
        captured.push(updater(messages))
      },
    } as any

    let doneText: string | undefined
    await mod.call(
      (t?: string) => {
        doneText = t
      },
      ctx,
      '',
    )
    // 必须走 happy path（onDone 'Generating recap…'），而不是 early return
    // 'No conversation yet' — 这正是 Comdr 实测到的 bug 表现。
    expect(doneText).toBe('Generating recap…')
    expect(doneText).not.toContain('No conversation')
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(captured.length).toBe(1)
  })

  test('当 ctx.messages 是 undefined（极端 defensive 路径）→ 走 "No conversation" 不 crash', async () => {
    mock.module('../../services/awaySummary.js', () => ({
      generateAwaySummary: async () => 'should-not-be-called',
    }))
    const { default: recap } = await import(
      './index.js?regression-no-messages=1'
    )
    if (recap.type !== 'local-jsx') throw new Error('type mismatch')
    const mod = await recap.load()

    const captured: Array<Message[]> = []
    const ctx = {
      getAppState: () => ({}) as any,
      // 故意 omit messages 字段 — 模拟非常老的 context 路径
      setMessages: (updater: (prev: Message[]) => Message[]) => {
        captured.push(updater([]))
      },
    } as any

    let doneText: string | undefined
    await mod.call(
      (t?: string) => {
        doneText = t
      },
      ctx,
      '',
    )
    expect(doneText).toContain('No conversation')
    expect(captured.length).toBe(0)
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
