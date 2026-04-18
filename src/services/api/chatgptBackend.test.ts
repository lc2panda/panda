/**
 * 阶段 2 + 3 + 4 单元测试 — ChatGPTBackendClient 翻译层
 *
 * Input:  Anthropic 请求 fixture / Responses API payload & SSE fixture
 * Output: 断言 body 结构 / Anthropic 响应结构 / 流式事件序列（含 reasoning → thinking 映射）
 * Pos:    src/services/api/openaiAdapter.ts — ChatGPTBackendClient 单测
 *
 * NEW-FILE:#20260417-02
 */

import { test, expect } from 'bun:test'
import {
  convertAnthropicToResponsesAPI,
  convertResponsesAPIToAnthropic,
  convertResponsesAPIStreamToAnthropic,
  readResponsesSSE,
  __chatgptTransportTesting,
} from './openaiAdapter.js'

// ============ Anthropic → Responses API ====================================

test('convertAnthropicToResponsesAPI 基础 message + system → instructions', () => {
  const body = convertAnthropicToResponsesAPI({
    model: 'gpt-5-codex',
    system: 'You are a helpful assistant.',
    messages: [{ role: 'user', content: 'hi' }],
    stream: true,
  })
  // 作战线 N：gpt-5-codex 已退役，mapModelToCodex 默认降级到 gpt-5.4-mini（Free 兼容）
  // 若需保留 -codex 变体可设 PANDA_CODEX_ALLOW_CODEX_MODEL=1
  expect(body.model).toBe('gpt-5.4-mini')
  expect(body.instructions).toBe('You are a helpful assistant.')
  expect(body.stream).toBe(true)
  expect(body.store).toBe(false)
  expect(body.parallel_tool_calls).toBe(false)
  expect(body.input).toEqual([
    {
      type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text: 'hi' }],
    },
  ])
  // 必须删除的字段
  expect(body).not.toHaveProperty('previous_response_id')
  expect(body).not.toHaveProperty('prompt_cache_retention')
  expect(body).not.toHaveProperty('safety_identifier')
  expect(body).not.toHaveProperty('stream_options')
})

test('convertAnthropicToResponsesAPI system 数组形态扁平化', () => {
  const body = convertAnthropicToResponsesAPI({
    model: 'gpt-5-codex',
    system: [
      { type: 'text', text: 'A' },
      { type: 'text', text: 'B' },
    ],
    messages: [{ role: 'user', content: 'x' }],
  })
  expect(body.instructions).toBe('A\nB')
})

test('convertAnthropicToResponsesAPI tool_result → function_call_output', () => {
  const body = convertAnthropicToResponsesAPI({
    model: 'gpt-5-codex',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'tool_result', tool_use_id: 'call_1', content: 'ok' },
          { type: 'text', text: 'follow up' },
        ],
      },
    ],
  })
  expect(body.input[0]).toEqual({
    type: 'function_call_output',
    call_id: 'call_1',
    output: 'ok',
  })
  expect(body.input[1]).toEqual({
    type: 'message',
    role: 'user',
    content: [{ type: 'input_text', text: 'follow up' }],
  })
})

test('convertAnthropicToResponsesAPI assistant tool_use → function_call', () => {
  const body = convertAnthropicToResponsesAPI({
    model: 'gpt-5-codex',
    messages: [
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'calling now' },
          {
            type: 'tool_use',
            id: 'call_42',
            name: 'search',
            input: { q: 'panda' },
          },
        ],
      },
    ],
  })
  expect(body.input).toEqual([
    {
      type: 'message',
      role: 'assistant',
      content: [{ type: 'output_text', text: 'calling now' }],
    },
    {
      type: 'function_call',
      name: 'search',
      arguments: JSON.stringify({ q: 'panda' }),
      call_id: 'call_42',
    },
  ])
})

test('convertAnthropicToResponsesAPI tools 扁平化 (不嵌套 function 对象)', () => {
  const body = convertAnthropicToResponsesAPI({
    model: 'gpt-5-codex',
    messages: [{ role: 'user', content: 'x' }],
    tools: [
      {
        name: 'read_file',
        description: 'reads a file',
        input_schema: { type: 'object', properties: { path: { type: 'string' } } },
      },
    ],
  })
  expect(body.tools).toEqual([
    {
      type: 'function',
      name: 'read_file',
      description: 'reads a file',
      parameters: { type: 'object', properties: { path: { type: 'string' } } },
      strict: false,
    },
  ])
})

test('convertAnthropicToResponsesAPI thinking enabled → reasoning + include', () => {
  const body = convertAnthropicToResponsesAPI({
    model: 'gpt-5-codex',
    messages: [{ role: 'user', content: 'x' }],
    thinking: { type: 'enabled', budget_tokens: 1024 },
  })
  expect(body.reasoning).toEqual({ effort: 'medium', summary: 'auto' })
  expect(body.include).toEqual(['reasoning.encrypted_content'])
})

test('convertAnthropicToResponsesAPI 历史 thinking block 回灌为 reasoning item', () => {
  const body = convertAnthropicToResponsesAPI({
    model: 'gpt-5-codex',
    messages: [
      {
        role: 'assistant',
        content: [
          {
            type: 'thinking',
            thinking: 'step 1: think about X',
            signature: 'enc_abc',
          },
          { type: 'text', text: 'answer' },
        ],
      },
    ],
  })
  expect(body.input[0]).toEqual({
    type: 'reasoning',
    summary: [{ type: 'summary_text', text: 'step 1: think about X' }],
    encrypted_content: 'enc_abc',
  })
  expect(body.input[1]).toEqual({
    type: 'message',
    role: 'assistant',
    content: [{ type: 'output_text', text: 'answer' }],
  })
})

// ============ Responses API → Anthropic (non-streaming) ====================

test('convertResponsesAPIToAnthropic message + reasoning + tool_use', () => {
  const payload = {
    id: 'resp_1',
    output: [
      {
        type: 'reasoning',
        summary: [{ type: 'summary_text', text: 'reasoned about it' }],
        encrypted_content: 'enc_xyz',
      },
      {
        type: 'message',
        content: [{ type: 'output_text', text: 'here is the answer' }],
      },
      {
        type: 'function_call',
        call_id: 'tool_1',
        name: 'run',
        arguments: '{"x":1}',
      },
    ],
    usage: {
      input_tokens: 42,
      output_tokens: 17,
      input_tokens_details: { cached_tokens: 5 },
    },
  }
  const msg = convertResponsesAPIToAnthropic(payload, 'gpt-5-codex') as any
  expect(msg.id).toBe('resp_1')
  expect(msg.stop_reason).toBe('tool_use')
  expect(msg.content[0]).toEqual({
    type: 'thinking',
    thinking: 'reasoned about it',
    signature: 'enc_xyz',
  })
  expect(msg.content[1]).toEqual({ type: 'text', text: 'here is the answer' })
  expect(msg.content[2]).toEqual({
    type: 'tool_use',
    id: 'tool_1',
    name: 'run',
    input: { x: 1 },
  })
  expect(msg.usage.input_tokens).toBe(42)
  expect(msg.usage.output_tokens).toBe(17)
  expect(msg.usage.cache_read_input_tokens).toBe(5)
})

// ============ SSE parser ===================================================

test('readResponsesSSE 解多行 event + data 块', async () => {
  const sse =
    'event: response.output_text.delta\n' +
    'data: {"type":"response.output_text.delta","delta":"hello"}\n' +
    '\n' +
    'event: response.completed\n' +
    'data: {"type":"response.completed","response":{"usage":{"input_tokens":1,"output_tokens":2}}}\n' +
    '\n'
  const enc = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(enc.encode(sse))
      controller.close()
    },
  })
  const reader = stream.getReader()
  const out: Array<{ event?: string; data: Record<string, unknown> }> = []
  for await (const ev of readResponsesSSE(reader)) {
    out.push(ev)
  }
  expect(out.length).toBe(2)
  expect(out[0].event).toBe('response.output_text.delta')
  expect((out[0].data as { delta?: string }).delta).toBe('hello')
  expect(out[1].event).toBe('response.completed')
})

// ============ 流式转换（含 reasoning → thinking 映射 Q3 关键） =============

test('convertResponsesAPIStreamToAnthropic 文本 delta → text_delta', async () => {
  async function* src() {
    yield {
      event: 'response.created',
      data: { type: 'response.created', response: { id: 'msg_s1' } },
    }
    yield {
      event: 'response.output_text.delta',
      data: { type: 'response.output_text.delta', delta: 'hel' },
    }
    yield {
      event: 'response.output_text.delta',
      data: { type: 'response.output_text.delta', delta: 'lo' },
    }
    yield {
      event: 'response.output_text.done',
      data: { type: 'response.output_text.done' },
    }
    yield {
      event: 'response.completed',
      data: {
        type: 'response.completed',
        response: {
          usage: {
            input_tokens: 3,
            output_tokens: 2,
            input_tokens_details: { cached_tokens: 0 },
          },
        },
      },
    }
  }
  const events: Record<string, unknown>[] = []
  for await (const e of convertResponsesAPIStreamToAnthropic(src(), 'gpt-5-codex')) {
    events.push(e)
  }
  const types = events.map(e => e.type)
  expect(types).toEqual([
    'message_start',
    'content_block_start',
    'content_block_delta',
    'content_block_delta',
    'content_block_stop',
    'message_delta',
    'message_stop',
  ])
  // 第一 delta 的 text
  expect((events[2] as any).delta).toEqual({ type: 'text_delta', text: 'hel' })
  expect((events[3] as any).delta).toEqual({ type: 'text_delta', text: 'lo' })
  // message_start 用了 response.id
  expect((events[0] as any).message.id).toBe('msg_s1')
})

test('convertResponsesAPIStreamToAnthropic reasoning delta → thinking_delta (Q3)', async () => {
  async function* src() {
    yield {
      event: 'response.reasoning_summary_text.delta',
      data: {
        type: 'response.reasoning_summary_text.delta',
        delta: 'I should ',
      },
    }
    yield {
      event: 'response.reasoning_summary_text.delta',
      data: {
        type: 'response.reasoning_summary_text.delta',
        delta: 'check X.',
      },
    }
    yield {
      event: 'response.reasoning_summary_text.done',
      data: { type: 'response.reasoning_summary_text.done' },
    }
    yield {
      event: 'response.output_text.delta',
      data: { type: 'response.output_text.delta', delta: 'answer' },
    }
    yield {
      event: 'response.completed',
      data: {
        type: 'response.completed',
        response: { usage: { input_tokens: 0, output_tokens: 0 } },
      },
    }
  }
  const events: any[] = []
  for await (const e of convertResponsesAPIStreamToAnthropic(src(), 'gpt-5-codex')) {
    events.push(e)
  }
  // 定位 thinking block
  const thinkStart = events.find(
    e => e.type === 'content_block_start' && e.content_block?.type === 'thinking',
  )
  expect(thinkStart).toBeTruthy()
  const thinkDeltas = events.filter(
    e => e.type === 'content_block_delta' && e.delta?.type === 'thinking_delta',
  )
  expect(thinkDeltas.length).toBe(2)
  expect(thinkDeltas[0].delta.thinking).toBe('I should ')
  expect(thinkDeltas[1].delta.thinking).toBe('check X.')
  // 后续应该有独立的 text 块
  const textStart = events.find(
    e => e.type === 'content_block_start' && e.content_block?.type === 'text',
  )
  expect(textStart).toBeTruthy()
})

test('convertResponsesAPIStreamToAnthropic reasoning 完整 item（无 delta 段）也转成 thinking block', async () => {
  async function* src() {
    yield {
      event: 'response.output_item.done',
      data: {
        type: 'response.output_item.done',
        item: {
          type: 'reasoning',
          summary: [{ type: 'summary_text', text: 'entire reasoning' }],
          encrypted_content: 'enc_done',
        },
      },
    }
    yield {
      event: 'response.completed',
      data: {
        type: 'response.completed',
        response: { usage: { input_tokens: 0, output_tokens: 0 } },
      },
    }
  }
  const events: any[] = []
  for await (const e of convertResponsesAPIStreamToAnthropic(src(), 'gpt-5-codex')) {
    events.push(e)
  }
  const thinkStart = events.find(
    e => e.type === 'content_block_start' && e.content_block?.type === 'thinking',
  )
  expect(thinkStart).toBeTruthy()
  expect(thinkStart.content_block.signature).toBe('enc_done')
  const thinkDelta = events.find(
    e => e.type === 'content_block_delta' && e.delta?.type === 'thinking_delta',
  )
  expect(thinkDelta.delta.thinking).toBe('entire reasoning')
})

// ============ 阶段 4: 工具调用流式闭环 =====================================

test('convertResponsesAPIStreamToAnthropic tool_use 流式闭环 (output_item.added + arg delta + done)', async () => {
  async function* src() {
    yield {
      event: 'response.output_item.added',
      data: {
        type: 'response.output_item.added',
        item: {
          type: 'function_call',
          call_id: 'tool_99',
          name: 'bash',
        },
      },
    }
    yield {
      event: 'response.function_call_arguments.delta',
      data: {
        type: 'response.function_call_arguments.delta',
        delta: '{"cmd":',
      },
    }
    yield {
      event: 'response.function_call_arguments.delta',
      data: {
        type: 'response.function_call_arguments.delta',
        delta: '"ls"}',
      },
    }
    yield {
      event: 'response.function_call_arguments.done',
      data: { type: 'response.function_call_arguments.done' },
    }
    yield {
      event: 'response.output_item.done',
      data: {
        type: 'response.output_item.done',
        item: { type: 'function_call', call_id: 'tool_99', name: 'bash' },
      },
    }
    yield {
      event: 'response.completed',
      data: {
        type: 'response.completed',
        response: { usage: { input_tokens: 0, output_tokens: 0 } },
      },
    }
  }
  const events: any[] = []
  for await (const e of convertResponsesAPIStreamToAnthropic(src(), 'gpt-5-codex')) {
    events.push(e)
  }
  const toolStart = events.find(
    e => e.type === 'content_block_start' && e.content_block?.type === 'tool_use',
  )
  expect(toolStart).toBeTruthy()
  expect(toolStart.content_block.id).toBe('tool_99')
  expect(toolStart.content_block.name).toBe('bash')
  const argDeltas = events.filter(
    e => e.type === 'content_block_delta' && e.delta?.type === 'input_json_delta',
  )
  expect(argDeltas.length).toBe(2)
  expect(argDeltas.map(d => d.delta.partial_json).join('')).toBe('{"cmd":"ls"}')
  // stop_reason 必须是 tool_use
  const finalDelta = events.find(e => e.type === 'message_delta')
  expect(finalDelta.delta.stop_reason).toBe('tool_use')
})

// ============ 作战线 O：message boundary 修复 (单 message 多 block) ===========

test('作战线 O — mixed content (text + tool_use) 必须落入同一个 message', async () => {
  // 复刻线上 jsonl 实测序列：一次 ChatGPT response 内既有 text 又有 function_call
  async function* src() {
    yield {
      event: 'response.created',
      data: { type: 'response.created', response: { id: 'msg_mixed_1' } },
    }
    // 第一个 output_item: message + text
    yield {
      event: 'response.output_item.added',
      data: {
        type: 'response.output_item.added',
        item: { type: 'message', role: 'assistant' },
      },
    }
    yield {
      event: 'response.output_text.delta',
      data: { type: 'response.output_text.delta', delta: 'I will run ls.' },
    }
    yield {
      event: 'response.output_text.done',
      data: { type: 'response.output_text.done' },
    }
    yield {
      event: 'response.output_item.done',
      data: {
        type: 'response.output_item.done',
        item: { type: 'message', role: 'assistant' },
      },
    }
    // 第二个 output_item: function_call
    yield {
      event: 'response.output_item.added',
      data: {
        type: 'response.output_item.added',
        item: { type: 'function_call', call_id: 'tool_O1', name: 'Bash' },
      },
    }
    yield {
      event: 'response.function_call_arguments.delta',
      data: {
        type: 'response.function_call_arguments.delta',
        delta: '{"command":"ls"}',
      },
    }
    yield {
      event: 'response.function_call_arguments.done',
      data: { type: 'response.function_call_arguments.done' },
    }
    yield {
      event: 'response.output_item.done',
      data: {
        type: 'response.output_item.done',
        item: { type: 'function_call', call_id: 'tool_O1', name: 'Bash' },
      },
    }
    yield {
      event: 'response.completed',
      data: {
        type: 'response.completed',
        response: {
          usage: {
            input_tokens: 21472,
            output_tokens: 53,
            input_tokens_details: { cached_tokens: 0 },
          },
        },
      },
    }
  }
  const events: any[] = []
  for await (const e of convertResponsesAPIStreamToAnthropic(src(), 'gpt-5.4-mini')) {
    events.push(e)
  }
  // 关键不变量 #1：message_start 仅 1 次（修复前会出现 2 次 → 拆成两条 assistant message）
  const startCount = events.filter(e => e.type === 'message_start').length
  expect(startCount).toBe(1)
  // 关键不变量 #2：message_stop 仅 1 次
  const stopCount = events.filter(e => e.type === 'message_stop').length
  expect(stopCount).toBe(1)
  // 关键不变量 #3：text 与 tool_use 都作为同一 message 的 content_block 出现
  const textStart = events.find(
    e => e.type === 'content_block_start' && e.content_block?.type === 'text',
  )
  const toolStart = events.find(
    e => e.type === 'content_block_start' && e.content_block?.type === 'tool_use',
  )
  expect(textStart).toBeTruthy()
  expect(toolStart).toBeTruthy()
  // 关键不变量 #4：block index 单调递增
  expect(textStart.index).toBe(0)
  expect(toolStart.index).toBe(1)
  // 关键不变量 #5：tool_use 的 input 是合法 JSON（input_json_delta 拼起来）
  const argDeltas = events
    .filter(e => e.type === 'content_block_delta' && e.delta?.type === 'input_json_delta')
    .map(d => d.delta.partial_json)
    .join('')
  expect(JSON.parse(argDeltas)).toEqual({ command: 'ls' })
  // 关键不变量 #6：stop_reason=tool_use（含 function_call → tool_use）
  const md = events.find(e => e.type === 'message_delta')
  expect(md.delta.stop_reason).toBe('tool_use')
  // 关键不变量 #7：usage 正确映射
  expect(md.usage.input_tokens).toBe(21472)
  expect(md.usage.output_tokens).toBe(53)
})

test('作战线 O — text only 单 block 完整序列', async () => {
  async function* src() {
    yield {
      event: 'response.created',
      data: { type: 'response.created', response: { id: 'msg_text_1' } },
    }
    yield {
      event: 'response.output_item.added',
      data: {
        type: 'response.output_item.added',
        item: { type: 'message', role: 'assistant' },
      },
    }
    yield {
      event: 'response.output_text.delta',
      data: { type: 'response.output_text.delta', delta: 'hello' },
    }
    yield {
      event: 'response.output_text.done',
      data: { type: 'response.output_text.done' },
    }
    yield {
      event: 'response.output_item.done',
      data: {
        type: 'response.output_item.done',
        item: { type: 'message', role: 'assistant' },
      },
    }
    yield {
      event: 'response.completed',
      data: {
        type: 'response.completed',
        response: { usage: { input_tokens: 10, output_tokens: 5 } },
      },
    }
  }
  const events: any[] = []
  for await (const e of convertResponsesAPIStreamToAnthropic(src(), 'gpt-5.4-mini')) {
    events.push(e)
  }
  // 序列：1 message_start + 1 content_block_start + N delta + 1 content_block_stop + 1 message_delta + 1 message_stop
  expect(events.filter(e => e.type === 'message_start').length).toBe(1)
  expect(events.filter(e => e.type === 'message_stop').length).toBe(1)
  expect(events.filter(e => e.type === 'content_block_start').length).toBe(1)
  expect(events.filter(e => e.type === 'content_block_stop').length).toBe(1)
  expect(events.filter(e => e.type === 'message_delta').length).toBe(1)
  // stop_reason 默认 end_turn（无 function_call）
  const md = events.find(e => e.type === 'message_delta')
  expect(md.delta.stop_reason).toBe('end_turn')
})

test('作战线 O — reasoning + text 混合：thinking block 必须出现在 text block 之前 (Q3 验收)', async () => {
  async function* src() {
    yield {
      event: 'response.created',
      data: { type: 'response.created', response: { id: 'msg_rt_1' } },
    }
    yield {
      event: 'response.output_item.added',
      data: {
        type: 'response.output_item.added',
        item: { type: 'reasoning' },
      },
    }
    yield {
      event: 'response.reasoning_summary_text.delta',
      data: {
        type: 'response.reasoning_summary_text.delta',
        delta: 'Thinking step 1.',
      },
    }
    yield {
      event: 'response.reasoning_summary_text.done',
      data: { type: 'response.reasoning_summary_text.done' },
    }
    yield {
      event: 'response.output_item.done',
      data: {
        type: 'response.output_item.done',
        item: { type: 'reasoning' },
      },
    }
    yield {
      event: 'response.output_item.added',
      data: {
        type: 'response.output_item.added',
        item: { type: 'message', role: 'assistant' },
      },
    }
    yield {
      event: 'response.output_text.delta',
      data: { type: 'response.output_text.delta', delta: 'Final answer.' },
    }
    yield {
      event: 'response.output_text.done',
      data: { type: 'response.output_text.done' },
    }
    yield {
      event: 'response.output_item.done',
      data: {
        type: 'response.output_item.done',
        item: { type: 'message', role: 'assistant' },
      },
    }
    yield {
      event: 'response.completed',
      data: {
        type: 'response.completed',
        response: { usage: { input_tokens: 1, output_tokens: 1 } },
      },
    }
  }
  const events: any[] = []
  for await (const e of convertResponsesAPIStreamToAnthropic(src(), 'gpt-5.4-mini')) {
    events.push(e)
  }
  // message_start 仅 1 次
  expect(events.filter(e => e.type === 'message_start').length).toBe(1)
  expect(events.filter(e => e.type === 'message_stop').length).toBe(1)
  // 找到 thinking start 和 text start，验证顺序
  const thinkStartIdx = events.findIndex(
    e => e.type === 'content_block_start' && e.content_block?.type === 'thinking',
  )
  const textStartIdx = events.findIndex(
    e => e.type === 'content_block_start' && e.content_block?.type === 'text',
  )
  expect(thinkStartIdx).toBeGreaterThanOrEqual(0)
  expect(textStartIdx).toBeGreaterThanOrEqual(0)
  // 关键不变量：thinking 在 text 之前
  expect(thinkStartIdx).toBeLessThan(textStartIdx)
  // block index 单调递增
  const thinkStart = events[thinkStartIdx]
  const textStart = events[textStartIdx]
  expect(thinkStart.index).toBe(0)
  expect(textStart.index).toBe(1)
  // 都正确收尾
  const stops = events.filter(e => e.type === 'content_block_stop')
  expect(stops.map(s => s.index)).toEqual([0, 1])
})

test('作战线 O — 空响应：仅 response.completed 也输出合法协议骨架', async () => {
  async function* src() {
    yield {
      event: 'response.created',
      data: { type: 'response.created', response: { id: 'msg_empty_1' } },
    }
    yield {
      event: 'response.completed',
      data: {
        type: 'response.completed',
        response: { usage: { input_tokens: 0, output_tokens: 0 } },
      },
    }
  }
  const events: any[] = []
  for await (const e of convertResponsesAPIStreamToAnthropic(src(), 'gpt-5.4-mini')) {
    events.push(e)
  }
  // 协议合法骨架：message_start + message_delta + message_stop（无 content_block）
  const types = events.map(e => e.type)
  expect(types).toEqual(['message_start', 'message_delta', 'message_stop'])
  // 不出现任何 content_block_*
  expect(events.some(e => String(e.type).startsWith('content_block_'))).toBe(false)
  // message_start 仅 1 次
  expect(events.filter(e => e.type === 'message_start').length).toBe(1)
  // message id 用了 response.id
  const ms = events.find(e => e.type === 'message_start') as any
  expect(ms.message.id).toBe('msg_empty_1')
})

// ============ 线 L：三路径分发器（curl header 解析 + 流式包装）================

test('parseCurlHeaderBlock 解析 HTTP/1.1 200 + headers 分离 body', () => {
  const raw = new TextEncoder().encode(
    'HTTP/1.1 200 OK\r\n' +
      'Content-Type: text/event-stream\r\n' +
      'X-Request-Id: req_123\r\n' +
      '\r\n' +
      'data: {"hello":"world"}\n\n',
  )
  const parsed = __chatgptTransportTesting.parseCurlHeaderBlock(raw)
  expect(parsed).toBeTruthy()
  if (!parsed) return
  expect(parsed.status).toBe(200)
  expect(parsed.headers.get('content-type')).toBe('text/event-stream')
  expect(parsed.headers.get('x-request-id')).toBe('req_123')
  const body = new TextDecoder().decode(raw.subarray(parsed.bodyOffset))
  expect(body).toBe('data: {"hello":"world"}\n\n')
})

test('parseCurlHeaderBlock 跳过 1xx interim（100 Continue）取最终状态', () => {
  const raw = new TextEncoder().encode(
    'HTTP/1.1 100 Continue\r\n\r\n' +
      'HTTP/2 200\r\n' +
      'Content-Type: application/json\r\n' +
      '\r\n' +
      '{"ok":true}',
  )
  const parsed = __chatgptTransportTesting.parseCurlHeaderBlock(raw)
  expect(parsed).toBeTruthy()
  if (!parsed) return
  expect(parsed.status).toBe(200)
  expect(parsed.headers.get('content-type')).toBe('application/json')
  const body = new TextDecoder().decode(raw.subarray(parsed.bodyOffset))
  expect(body).toBe('{"ok":true}')
})

test('makeResponseFromStream 聚合读 + text()/json() 契约', async () => {
  const payload = '{"answer":42}'
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      // 分两块喂，模拟 curl stdout 分片
      c.enqueue(new TextEncoder().encode(payload.slice(0, 7)))
      c.enqueue(new TextEncoder().encode(payload.slice(7)))
      c.close()
    },
  })
  const resp = __chatgptTransportTesting.makeResponseFromStream(
    200,
    new Headers({ 'content-type': 'application/json' }),
    stream,
  )
  expect(resp.status).toBe(200)
  expect(resp.ok).toBe(true)
  expect(resp.headers.get('content-type')).toBe('application/json')
  const json = (await resp.json()) as { answer: number }
  expect(json.answer).toBe(42)
})

// ============ 线 M：系统代理自动探测（Windows 注册表兜底） ===================

test('detectSystemProxy 环境变量优先：HTTPS_PROXY 最高优先级', () => {
  __chatgptTransportTesting._resetSystemProxyCacheForTesting()
  const saved = {
    HTTPS_PROXY: process.env.HTTPS_PROXY,
    https_proxy: process.env.https_proxy,
    HTTP_PROXY: process.env.HTTP_PROXY,
    http_proxy: process.env.http_proxy,
  }
  try {
    // Windows 下 env 键 case-insensitive，必须先清再设，否则 delete 会误删新值
    delete process.env.HTTPS_PROXY
    delete process.env.https_proxy
    delete process.env.HTTP_PROXY
    delete process.env.http_proxy
    process.env.HTTPS_PROXY = 'http://user-proxy:9999'
    const got = __chatgptTransportTesting.detectSystemProxy()
    expect(got).toBe('http://user-proxy:9999')
  } finally {
    // 还原
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
    __chatgptTransportTesting._resetSystemProxyCacheForTesting()
  }
})

test('detectSystemProxy 缓存命中：二次调用不重复 exec', () => {
  __chatgptTransportTesting._resetSystemProxyCacheForTesting()
  const saved = process.env.HTTPS_PROXY
  try {
    process.env.HTTPS_PROXY = 'http://cache-me:1080'
    const a = __chatgptTransportTesting.detectSystemProxy()
    // 改 env 后若无缓存应读到新值；这里验证缓存命中 → 仍返回旧值
    process.env.HTTPS_PROXY = 'http://other:2080'
    const b = __chatgptTransportTesting.detectSystemProxy()
    expect(a).toBe('http://cache-me:1080')
    expect(b).toBe('http://cache-me:1080')
  } finally {
    if (saved === undefined) delete process.env.HTTPS_PROXY
    else process.env.HTTPS_PROXY = saved
    __chatgptTransportTesting._resetSystemProxyCacheForTesting()
  }
})

test('detectSystemProxy 解析 Windows 注册表 ProxyServer=host:port 形态', () => {
  __chatgptTransportTesting._resetSystemProxyCacheForTesting()
  // 只在 Windows 下验证注册表分支；其他平台直接 PASS（该分支不会执行）
  if (process.platform !== 'win32') {
    expect(true).toBe(true)
    return
  }
  // 清空 env，强制走注册表分支
  const savedEnv = {
    HTTPS_PROXY: process.env.HTTPS_PROXY,
    https_proxy: process.env.https_proxy,
    HTTP_PROXY: process.env.HTTP_PROXY,
    http_proxy: process.env.http_proxy,
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const childProcess = require('node:child_process') as {
    execFileSync: typeof import('node:child_process').execFileSync
  }
  const originalExec = childProcess.execFileSync
  try {
    delete process.env.HTTPS_PROXY
    delete process.env.https_proxy
    delete process.env.HTTP_PROXY
    delete process.env.http_proxy
    // mock reg 输出：ProxyEnable=0x1 + ProxyServer=127.0.0.1:7890
    childProcess.execFileSync = ((
      cmd: string,
      args: readonly string[],
    ): string => {
      if (cmd !== 'reg') throw new Error(`unexpected exec: ${cmd}`)
      const flagValue = args[args.indexOf('/v') + 1]
      if (flagValue === 'ProxyEnable') {
        return (
          '\r\nHKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\r\n' +
          '    ProxyEnable    REG_DWORD    0x1\r\n\r\n'
        )
      }
      if (flagValue === 'ProxyServer') {
        return (
          '\r\nHKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\r\n' +
          '    ProxyServer    REG_SZ    127.0.0.1:7890\r\n\r\n'
        )
      }
      throw new Error(`unexpected reg query: ${flagValue}`)
    }) as typeof originalExec
    const got = __chatgptTransportTesting.detectSystemProxy()
    expect(got).toBe('http://127.0.0.1:7890')
  } finally {
    childProcess.execFileSync = originalExec
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
    __chatgptTransportTesting._resetSystemProxyCacheForTesting()
  }
})

test('detectSystemProxy 解析 Windows ProxyServer=http=x;https=y 按 https= 选择', () => {
  __chatgptTransportTesting._resetSystemProxyCacheForTesting()
  if (process.platform !== 'win32') {
    expect(true).toBe(true)
    return
  }
  const savedEnv = {
    HTTPS_PROXY: process.env.HTTPS_PROXY,
    https_proxy: process.env.https_proxy,
    HTTP_PROXY: process.env.HTTP_PROXY,
    http_proxy: process.env.http_proxy,
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const childProcess = require('node:child_process') as {
    execFileSync: typeof import('node:child_process').execFileSync
  }
  const originalExec = childProcess.execFileSync
  try {
    delete process.env.HTTPS_PROXY
    delete process.env.https_proxy
    delete process.env.HTTP_PROXY
    delete process.env.http_proxy
    childProcess.execFileSync = ((
      cmd: string,
      args: readonly string[],
    ): string => {
      if (cmd !== 'reg') throw new Error(`unexpected exec: ${cmd}`)
      const flagValue = args[args.indexOf('/v') + 1]
      if (flagValue === 'ProxyEnable') {
        return '    ProxyEnable    REG_DWORD    0x1\r\n'
      }
      if (flagValue === 'ProxyServer') {
        return (
          '    ProxyServer    REG_SZ    http=10.0.0.1:3128;https=10.0.0.2:3129\r\n'
        )
      }
      throw new Error(`unexpected reg query: ${flagValue}`)
    }) as typeof originalExec
    const got = __chatgptTransportTesting.detectSystemProxy()
    expect(got).toBe('http://10.0.0.2:3129')
  } finally {
    childProcess.execFileSync = originalExec
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
    __chatgptTransportTesting._resetSystemProxyCacheForTesting()
  }
})

test('detectSystemProxy ProxyEnable=0x0 → 返回 undefined', () => {
  __chatgptTransportTesting._resetSystemProxyCacheForTesting()
  if (process.platform !== 'win32') {
    expect(true).toBe(true)
    return
  }
  const savedEnv = {
    HTTPS_PROXY: process.env.HTTPS_PROXY,
    https_proxy: process.env.https_proxy,
    HTTP_PROXY: process.env.HTTP_PROXY,
    http_proxy: process.env.http_proxy,
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const childProcess = require('node:child_process') as {
    execFileSync: typeof import('node:child_process').execFileSync
  }
  const originalExec = childProcess.execFileSync
  try {
    delete process.env.HTTPS_PROXY
    delete process.env.https_proxy
    delete process.env.HTTP_PROXY
    delete process.env.http_proxy
    childProcess.execFileSync = ((
      cmd: string,
      args: readonly string[],
    ): string => {
      if (cmd !== 'reg') throw new Error(`unexpected exec: ${cmd}`)
      const flagValue = args[args.indexOf('/v') + 1]
      if (flagValue === 'ProxyEnable') {
        return '    ProxyEnable    REG_DWORD    0x0\r\n'
      }
      throw new Error('should not query ProxyServer when ProxyEnable=0')
    }) as typeof originalExec
    const got = __chatgptTransportTesting.detectSystemProxy()
    expect(got).toBeUndefined()
  } finally {
    childProcess.execFileSync = originalExec
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
    __chatgptTransportTesting._resetSystemProxyCacheForTesting()
  }
})

test('makeResponseFromStream 流式读取 SSE（可喂给 readResponsesSSE）', async () => {
  const sse =
    'event: delta\ndata: {"n":1}\n\n' +
    'event: delta\ndata: {"n":2}\n\n' +
    'data: [DONE]\n\n'
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new TextEncoder().encode(sse))
      c.close()
    },
  })
  const resp = __chatgptTransportTesting.makeResponseFromStream(
    200,
    new Headers({ 'content-type': 'text/event-stream' }),
    stream,
  )
  if (!resp.body) throw new Error('body missing')
  const reader = resp.body.getReader()
  const collected: Array<{ event?: string; data: Record<string, unknown> }> = []
  for await (const evt of readResponsesSSE(reader)) {
    collected.push(evt)
  }
  expect(collected.length).toBe(2)
  expect(collected[0].event).toBe('delta')
  expect(collected[0].data.n).toBe(1)
  expect(collected[1].data.n).toBe(2)
})
