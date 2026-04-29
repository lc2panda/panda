// Input:  createDumpPromptsFetch 返回的 fetch wrapper + 多轮 POST 调用
// Output: ~/.pandacc/dump-prompts/<id>.jsonl 落盘完整性守护
// Pos:    v2.21.21 dump-prompts 修复 — 每轮必落盘 request 记录，含 systemHash/toolsHash
//         用于 cache 诊断截面对比；同时守护 Anthropic 原生通道 request body byte-equal

import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'fs'
import { readFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

// 重要：必须在 import dumpPrompts 之前设定 env，因为 getClaudeConfigHomeDir
// 用 memoize 缓存结果。USER_TYPE=ant 也是 dump 落盘的前置条件。
const __origUserType = process.env.USER_TYPE
const __origConfigDir = process.env.CLAUDE_CONFIG_DIR
const __origPandaDir = process.env.PANDA_CONFIG_DIR
process.env.USER_TYPE = 'ant'
const __tmpHome = mkdtempSync(join(tmpdir(), 'pandacc-test-dump-'))
process.env.CLAUDE_CONFIG_DIR = __tmpHome
delete process.env.PANDA_CONFIG_DIR

const {
  createDumpPromptsFetch,
  getDumpPromptsPath,
  clearAllDumpState,
  clearApiRequestCache,
} = await import('./dumpPrompts.js')

// ─── Test helpers ─────────────────────────────────────────────────────

type DumpRecord = {
  type: string
  timestamp: string
  requestId?: string
  data?: unknown
  [k: string]: unknown
}

function mkBody(
  turn: number,
  opts: { systemText?: string; toolName?: string; extraMsgs?: number } = {},
): string {
  const systemText = opts.systemText ?? 'You are helpful.'
  const toolName = opts.toolName ?? 'Bash'
  const messages: Array<{ role: string; content: string }> = []
  for (let i = 1; i <= turn; i++) {
    messages.push({ role: 'user', content: `T${i} user` })
    if (i < turn) messages.push({ role: 'assistant', content: `T${i} reply` })
  }
  for (let k = 0; k < (opts.extraMsgs ?? 0); k++) {
    messages.push({ role: 'user', content: `extra-${k}` })
  }
  return JSON.stringify({
    model: 'claude-opus-4-7',
    stream: true,
    max_tokens: 4096,
    system: [{ type: 'text', text: systemText }],
    tools: [{ name: toolName, description: '', input_schema: {} }],
    messages,
  })
}

async function drainEventLoop(): Promise<void> {
  // dumpRequest runs via setImmediate; let the I/O queue drain.
  await new Promise<void>(r => setImmediate(r))
  await new Promise<void>(r => setImmediate(r))
  await new Promise(r => setTimeout(r, 50))
}

async function readDumpRecords(agentId: string): Promise<DumpRecord[]> {
  const raw = await readFile(getDumpPromptsPath(agentId), 'utf8')
  return raw
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as DumpRecord)
}

function stubResponse(): Response {
  return new Response('{"ok":true,"id":"stub"}', {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

// ─── Global fetch stub ────────────────────────────────────────────────

const __origFetch = globalThis.fetch
// Per-test override slot — reset in beforeEach
let currentFetchHook: (
  url: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response> = async () => stubResponse()
globalThis.fetch = ((url: RequestInfo | URL, init?: RequestInit) =>
  currentFetchHook(url, init)) as typeof globalThis.fetch

beforeEach(() => {
  clearAllDumpState()
  clearApiRequestCache()
  currentFetchHook = async () => stubResponse()
})

afterAll(() => {
  globalThis.fetch = __origFetch
  if (__origUserType === undefined) delete process.env.USER_TYPE
  else process.env.USER_TYPE = __origUserType
  if (__origConfigDir === undefined) delete process.env.CLAUDE_CONFIG_DIR
  else process.env.CLAUDE_CONFIG_DIR = __origConfigDir
  if (__origPandaDir !== undefined) process.env.PANDA_CONFIG_DIR = __origPandaDir
  rmSync(__tmpHome, { recursive: true, force: true })
})

// ─── Assertion 1: 每轮必有 request 记录 ────────────────────────────────

describe('v2.21.21 dump-prompts — 每轮必落盘 request 记录', () => {
  test('3 轮连续调用后，JSONL 中 type=request 记录数 === 3', async () => {
    const agentId = 'session-assert-1'
    const dumpFetch = createDumpPromptsFetch(agentId)!
    for (let i = 1; i <= 3; i++) {
      await dumpFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        body: mkBody(i),
      })
      await drainEventLoop()
    }
    await drainEventLoop()

    const recs = await readDumpRecords(agentId)
    const requests = recs.filter(r => r.type === 'request')
    expect(requests.length).toBe(3)
    // 每条都带完整字段
    for (const r of requests) {
      expect(typeof r.requestId).toBe('string')
      expect(r.model).toBe('claude-opus-4-7')
      expect(r.stream).toBe(true)
      expect(typeof r.systemHash).toBe('string')
      expect(typeof r.systemLen).toBe('number')
      expect(typeof r.toolsHash).toBe('string')
      expect(typeof r.toolCount).toBe('number')
      expect(typeof r.messagesCount).toBe('number')
      expect(r.max_tokens).toBe(4096)
    }
  })
})

// ─── Assertion 2: systemHash 稳定性 ─────────────────────────────────────

describe('v2.21.21 dump-prompts — systemHash 稳定 + 敏感', () => {
  test('同 system payload 两轮间 systemHash byte-equal', async () => {
    const agentId = 'session-assert-2a'
    const dumpFetch = createDumpPromptsFetch(agentId)!
    await dumpFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      body: mkBody(1, { systemText: 'SAME' }),
    })
    await drainEventLoop()
    await dumpFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      body: mkBody(2, { systemText: 'SAME' }),
    })
    await drainEventLoop()

    const reqs = (await readDumpRecords(agentId))
      .filter(r => r.type === 'request')
      .sort((a, b) => (a.messagesCount as number) - (b.messagesCount as number))
    expect(reqs.length).toBe(2)
    expect(reqs[0]!.systemHash).toBe(reqs[1]!.systemHash)
    expect(reqs[0]!.systemLen).toBe(reqs[1]!.systemLen)
  })

  test('改动 system 一个字符后 systemHash 立刻不同', async () => {
    const agentId = 'session-assert-2b'
    const dumpFetch = createDumpPromptsFetch(agentId)!
    await dumpFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      body: mkBody(1, { systemText: 'ORIGINAL' }),
    })
    await drainEventLoop()
    // 同长度，改一个字符
    await dumpFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      body: mkBody(2, { systemText: 'ORIGINAl' }),
    })
    await drainEventLoop()

    const reqs = (await readDumpRecords(agentId))
      .filter(r => r.type === 'request')
      .sort((a, b) => (a.messagesCount as number) - (b.messagesCount as number))
    expect(reqs.length).toBe(2)
    expect(reqs[0]!.systemHash).not.toBe(reqs[1]!.systemHash)
    // systemLen 相同证明是 byte-level diff 被 hash 捕获
    expect(reqs[0]!.systemLen).toBe(reqs[1]!.systemLen)
  })
})

// ─── Assertion 3: toolsHash 稳定性 ──────────────────────────────────────

describe('v2.21.21 dump-prompts — toolsHash 稳定', () => {
  test('同 tools payload 两轮间 toolsHash byte-equal', async () => {
    const agentId = 'session-assert-3'
    const dumpFetch = createDumpPromptsFetch(agentId)!
    await dumpFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      body: mkBody(1, { toolName: 'Bash' }),
    })
    await drainEventLoop()
    await dumpFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      body: mkBody(2, { toolName: 'Bash' }),
    })
    await drainEventLoop()

    const reqs = (await readDumpRecords(agentId))
      .filter(r => r.type === 'request')
      .sort((a, b) => (a.messagesCount as number) - (b.messagesCount as number))
    expect(reqs.length).toBe(2)
    expect(reqs[0]!.toolsHash).toBe(reqs[1]!.toolsHash)
    expect(reqs[0]!.toolCount).toBe(reqs[1]!.toolCount)
  })
})

// ─── Assertion 4: requestId 配对 ────────────────────────────────────────

describe('v2.21.21 dump-prompts — requestId 配对 response/message', () => {
  test('response 的 requestId 必存在于 request 记录集合', async () => {
    const agentId = 'session-assert-4a'
    const dumpFetch = createDumpPromptsFetch(agentId)!
    for (let i = 1; i <= 3; i++) {
      await dumpFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        body: mkBody(i),
      })
      await drainEventLoop()
    }
    // 额外等待 response 的 async body drain
    await new Promise(r => setTimeout(r, 200))

    const recs = await readDumpRecords(agentId)
    const reqIds = new Set(
      recs.filter(r => r.type === 'request').map(r => r.requestId as string),
    )
    const responses = recs.filter(r => r.type === 'response')
    expect(responses.length).toBeGreaterThan(0)
    for (const r of responses) {
      expect(typeof r.requestId).toBe('string')
      expect(reqIds.has(r.requestId!)).toBe(true)
    }
  })

  test('message 的 requestId 必存在于 request 记录集合', async () => {
    const agentId = 'session-assert-4b'
    const dumpFetch = createDumpPromptsFetch(agentId)!
    for (let i = 1; i <= 3; i++) {
      await dumpFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        body: mkBody(i),
      })
      await drainEventLoop()
    }
    await drainEventLoop()

    const recs = await readDumpRecords(agentId)
    const reqIds = new Set(
      recs.filter(r => r.type === 'request').map(r => r.requestId as string),
    )
    const messages = recs.filter(r => r.type === 'message')
    expect(messages.length).toBeGreaterThan(0)
    for (const m of messages) {
      expect(typeof m.requestId).toBe('string')
      expect(reqIds.has(m.requestId!)).toBe(true)
    }
  })
})

// ─── Assertion 5: requestId 唯一性 ──────────────────────────────────────

describe('v2.21.21 dump-prompts — requestId 唯一', () => {
  test('100 次连发 requestId 全唯一', async () => {
    const agentId = 'session-assert-5'
    const dumpFetch = createDumpPromptsFetch(agentId)!
    for (let i = 1; i <= 100; i++) {
      await dumpFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        body: mkBody(i),
      })
    }
    // 统一等待所有 setImmediate flush
    for (let k = 0; k < 6; k++) await drainEventLoop()

    const recs = await readDumpRecords(agentId)
    const reqs = recs.filter(r => r.type === 'request')
    expect(reqs.length).toBe(100)
    const ids = new Set(reqs.map(r => r.requestId as string))
    expect(ids.size).toBe(100)
  })
})

// ─── Assertion 6: 向后兼容旧读取器 ──────────────────────────────────────

describe('v2.21.21 dump-prompts — 向后兼容 {type,timestamp,data} 三件套', () => {
  test('旧读取器只看 type/timestamp/data 三字段能遍历所有记录不报错', async () => {
    const agentId = 'session-assert-6'
    const dumpFetch = createDumpPromptsFetch(agentId)!
    for (let i = 1; i <= 3; i++) {
      await dumpFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        body: mkBody(i, {
          systemText: i === 3 ? 'CHANGED' : 'You are helpful.',
        }),
      })
      await drainEventLoop()
    }
    await drainEventLoop()

    const recs = await readDumpRecords(agentId)
    // Simulate a legacy reader — switch on `type`, only reads three fields.
    // It must never throw and must see every known legacy type.
    const seenTypes = new Set<string>()
    for (const rec of recs) {
      // three-field read
      const { type, timestamp, data } = rec
      expect(typeof type).toBe('string')
      expect(typeof timestamp).toBe('string')
      seenTypes.add(type)
      // legacy types still carry data
      if (type === 'init' || type === 'system_update' || type === 'message') {
        expect(data).toBeDefined()
      }
      if (type === 'response') {
        expect(data).toBeDefined()
      }
      // Unknown new type 'request' — legacy reader would skip; we just
      // verify it doesn't pollute legacy-type behaviour and carries no `data`.
      if (type === 'request') {
        expect((rec as DumpRecord).data).toBeUndefined()
      }
    }
    // 所有旧类型仍然存在
    expect(seenTypes.has('init')).toBe(true)
    expect(seenTypes.has('system_update')).toBe(true)
    expect(seenTypes.has('message')).toBe(true)
    expect(seenTypes.has('request')).toBe(true)
  })
})

// ─── Byte-equal guard: dump 不改变原生通道 request body ───────────────

describe('v2.21.21 dump-prompts — Anthropic 通道 request body byte-equal 守护', () => {
  test('dump 启用 vs 禁用两种模式下，实际 fetch 收到的 request body 完全一致', async () => {
    const body1 = mkBody(2, { systemText: 'GUARD-TEST', toolName: 'Write' })

    // 模式 A：dump 启用
    let capturedWithDump: string | null = null
    currentFetchHook = async (_url, init) => {
      capturedWithDump = String(init?.body ?? '')
      return stubResponse()
    }
    const dumpFetch = createDumpPromptsFetch('session-byte-equal-on')!
    await dumpFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      body: body1,
    })
    await drainEventLoop()

    // 模式 B：dump 禁用（直接走原 globalThis.fetch hook）
    let capturedNoDump: string | null = null
    currentFetchHook = async (_url, init) => {
      capturedNoDump = String(init?.body ?? '')
      return stubResponse()
    }
    await globalThis.fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      body: body1,
    })

    expect(capturedWithDump).not.toBeNull()
    expect(capturedNoDump).not.toBeNull()
    // 字节级等价：同长度 + 同内容
    expect(capturedWithDump!.length).toBe(capturedNoDump!.length)
    expect(capturedWithDump).toBe(capturedNoDump)
    // 双向健壮性：双方都应 byte-equal 于原始 body1
    expect(capturedWithDump).toBe(body1)
    expect(capturedNoDump).toBe(body1)
  })

  test('多轮下每次 dump 启用的 body 与原始构造 byte-equal', async () => {
    const dumpFetch = createDumpPromptsFetch('session-byte-equal-multi')!
    const bodies: string[] = []
    const captured: string[] = []
    currentFetchHook = async (_url, init) => {
      captured.push(String(init?.body ?? ''))
      return stubResponse()
    }
    for (let i = 1; i <= 5; i++) {
      const b = mkBody(i, {
        systemText: i % 2 === 0 ? 'EVEN-SYS' : 'ODD-SYS',
      })
      bodies.push(b)
      await dumpFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        body: b,
      })
      await drainEventLoop()
    }
    expect(captured.length).toBe(5)
    for (let i = 0; i < 5; i++) {
      expect(captured[i]).toBe(bodies[i]!)
    }
  })
})

// ─── v2.25.53+ SSE buffer 增量解析（不再全流入内存） ──────────────────

/**
 * 构造一个流式 Response，body 通过 ReadableStream 喂入 SSE event。
 * eventCount 是 content_block_delta event 数量；textPerEvent 是每条 event
 * 的 data 文本长度（用于模拟"总流大小"）。
 */
function makeStreamingResponse(
  eventCount: number,
  textPerEvent: number,
): Response {
  const encoder = new TextEncoder()
  let i = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i >= eventCount) {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
        return
      }
      // 一次塞 ~16 个 event，避免 chunk 边界过细影响测试速度
      const batch = Math.min(16, eventCount - i)
      const lines: string[] = []
      for (let k = 0; k < batch; k++) {
        const text = 'x'.repeat(textPerEvent)
        const payload = JSON.stringify({
          type: 'content_block_delta',
          index: i + k,
          delta: { type: 'text_delta', text },
        })
        lines.push(`data: ${payload}`)
      }
      // SSE event 之间用 '\n\n' 分隔
      controller.enqueue(encoder.encode(lines.join('\n\n') + '\n\n'))
      i += batch
    },
  })
  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  })
}

describe('v2.25.53+ dump-prompts SSE 增量解析', () => {
  test('10 MB 流：解析后 chunks 数正确，落盘 jsonl 仍含全部 chunks', async () => {
    const agentId = 'session-sse-incremental-1'
    // 10 MB 总流 ≈ 1000 events * 10 KB/event
    const eventCount = 1000
    const textPerEvent = 10 * 1024
    currentFetchHook = async () => makeStreamingResponse(eventCount, textPerEvent)
    const dumpFetch = createDumpPromptsFetch(agentId)!
    await dumpFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      body: mkBody(1),
    })
    // 流较大，给充足时间 drain
    await drainEventLoop()
    await new Promise(r => setTimeout(r, 500))

    const recs = await readDumpRecords(agentId)
    const responses = recs.filter(r => r.type === 'response')
    expect(responses.length).toBe(1)
    const respData = responses[0]!.data as { stream: boolean; chunks: unknown[] }
    expect(respData.stream).toBe(true)
    expect(respData.chunks.length).toBe(eventCount)
    // 任取一条断言结构
    const sample = respData.chunks[0] as {
      type: string
      delta: { type: string; text: string }
    }
    expect(sample.type).toBe('content_block_delta')
    expect(sample.delta.type).toBe('text_delta')
    expect(sample.delta.text.length).toBe(textPerEvent)
  })

  test('chunk 边界跨 \\n\\n 分隔符：增量 drain 仍能正确切割', async () => {
    const agentId = 'session-sse-incremental-2'
    const encoder = new TextEncoder()
    const events = [
      JSON.stringify({ type: 'message_start' }),
      JSON.stringify({ type: 'content_block_start', index: 0 }),
      JSON.stringify({
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'text_delta', text: 'AAA' },
      }),
      JSON.stringify({ type: 'content_block_stop', index: 0 }),
      JSON.stringify({ type: 'message_stop' }),
    ]
    // 故意把分隔符切到不同 chunk 内：先发前两个 event 到 'data:' 头，再补 payload
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        // chunk 1: 完整两个 event + 第三个 event 的前半（含 'data: ' 但缺尾 '\n\n'）
        const part1 =
          `data: ${events[0]}\n\n` +
          `data: ${events[1]}\n\n` +
          `data: ${events[2]!.slice(0, 30)}`
        // chunk 2: 第三个 event 后半 + 第四个 event
        const part2 =
          events[2]!.slice(30) + `\n\ndata: ${events[3]}\n\n`
        // chunk 3: 第五个 event + DONE
        const part3 = `data: ${events[4]}\n\ndata: [DONE]\n\n`
        controller.enqueue(encoder.encode(part1))
        controller.enqueue(encoder.encode(part2))
        controller.enqueue(encoder.encode(part3))
        controller.close()
      },
    })
    currentFetchHook = async () =>
      new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })

    const dumpFetch = createDumpPromptsFetch(agentId)!
    await dumpFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      body: mkBody(1),
    })
    await drainEventLoop()
    await new Promise(r => setTimeout(r, 200))

    const recs = await readDumpRecords(agentId)
    const responses = recs.filter(r => r.type === 'response')
    expect(responses.length).toBe(1)
    const respData = responses[0]!.data as { stream: boolean; chunks: unknown[] }
    expect(respData.chunks.length).toBe(5)
    // 第三个 event 是 content_block_delta，text 应被还原为 'AAA'
    const delta = respData.chunks[2] as {
      type: string
      delta: { text: string }
    }
    expect(delta.type).toBe('content_block_delta')
    expect(delta.delta.text).toBe('AAA')
  })
})
