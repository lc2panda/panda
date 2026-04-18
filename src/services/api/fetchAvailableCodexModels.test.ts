/**
 * Input:  fetchAvailableCodexModels(accessToken, accountId, { transport })
 * Output: 单元测试集 —— 覆盖正常 / fallback schema / 401 / 网络错 / 缺参 兜底全路径
 * Pos:    src/services/api/openaiAdapter.ts → fetchAvailableCodexModels (作战线 Q)
 *
 * 一旦我被修改，请更新我的头部注释。
 */

import { test, expect } from 'bun:test'
import { fetchAvailableCodexModels } from './openaiAdapter.js'

/** 构造一个最小可用的 ChatGPTResponse（仅满足 fetchAvailableCodexModels 调用的 status/ok/json 接口） */
function mockResp(status: number, jsonPayload: unknown): {
  status: number
  ok: boolean
  headers: Headers
  body: ReadableStream<Uint8Array>
  text: () => Promise<string>
  json: () => Promise<unknown>
} {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(),
    body: new ReadableStream<Uint8Array>({
      start(c) { c.close() },
    }),
    text: async () => JSON.stringify(jsonPayload),
    json: async () => jsonPayload,
  }
}

test('fetchAvailableCodexModels: 正常返回 { models: ModelInfo[] } (codex 协议主路径)', async () => {
  const transport = async (input: any) => {
    expect(input.method).toBe('GET')
    expect(input.url).toMatch(
      /^https:\/\/chatgpt\.com\/backend-api\/codex\/models\?client_version=[\d.]+$/,
    )
    expect(input.headers.Authorization).toBe('Bearer tok-abc')
    expect(input.headers['Chatgpt-Account-Id']).toBe('acc-123')
    expect(input.headers.Originator).toBe('codex-tui')
    expect(input.headers.Accept).toBe('application/json')
    expect(input.streaming).toBe(false)
    return mockResp(200, {
      models: [
        {
          slug: 'gpt-5.4',
          display_name: 'GPT-5.4',
          visibility: 'list',
          supported_in_api: true,
          priority: 10,
        },
        {
          slug: 'gpt-5.4-mini',
          display_name: 'GPT-5.4 mini',
          visibility: 'list',
          supported_in_api: true,
          priority: 20,
        },
      ],
    })
  }
  const out = await fetchAvailableCodexModels('tok-abc', 'acc-123', { transport: transport as any })
  expect(out).toEqual([
    { id: 'gpt-5.4', label: 'GPT-5.4' },
    { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
  ])
})

test('fetchAvailableCodexModels: 隐藏 visibility !== "list" 的项', async () => {
  const transport = async () =>
    mockResp(200, {
      models: [
        { slug: 'gpt-5.4', display_name: 'GPT-5.4', visibility: 'list', supported_in_api: true },
        { slug: 'gpt-internal', display_name: 'Internal', visibility: 'hide', supported_in_api: true },
        { slug: 'gpt-5.4-mini', display_name: 'mini', visibility: 'list', supported_in_api: true },
      ],
    })
  const out = await fetchAvailableCodexModels('tok', 'acc', { transport: transport as any })
  expect(out.map(m => m.id)).toEqual(['gpt-5.4', 'gpt-5.4-mini'])
})

test('fetchAvailableCodexModels: 隐藏 supported_in_api === false 的项', async () => {
  const transport = async () =>
    mockResp(200, {
      models: [
        { slug: 'gpt-5.4', display_name: 'GPT-5.4', visibility: 'list', supported_in_api: true },
        { slug: 'gpt-experimental', display_name: 'X', visibility: 'list', supported_in_api: false },
      ],
    })
  const out = await fetchAvailableCodexModels('tok', 'acc', { transport: transport as any })
  expect(out.map(m => m.id)).toEqual(['gpt-5.4'])
})

test('fetchAvailableCodexModels: 按 priority 升序排列', async () => {
  const transport = async () =>
    mockResp(200, {
      models: [
        { slug: 'low-priority', display_name: 'L', visibility: 'list', priority: 99 },
        { slug: 'high-priority', display_name: 'H', visibility: 'list', priority: 1 },
        { slug: 'mid-priority', display_name: 'M', visibility: 'list', priority: 50 },
      ],
    })
  const out = await fetchAvailableCodexModels('tok', 'acc', { transport: transport as any })
  expect(out.map(m => m.id)).toEqual(['high-priority', 'mid-priority', 'low-priority'])
})

test('fetchAvailableCodexModels: fallback schema { data: [{id}] } (OpenAI v1/list 格式)', async () => {
  const transport = async () =>
    mockResp(200, {
      data: [
        { id: 'gpt-4o' },
        { id: 'gpt-4o-mini' },
      ],
    })
  const out = await fetchAvailableCodexModels('tok', 'acc', { transport: transport as any })
  expect(out).toEqual([{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }])
})

test('fetchAvailableCodexModels: fallback schema 顶级数组', async () => {
  const transport = async () => mockResp(200, [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }])
  const out = await fetchAvailableCodexModels('tok', 'acc', { transport: transport as any })
  expect(out).toEqual([{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }])
})

test('fetchAvailableCodexModels: 401 兜底 → []', async () => {
  const transport = async () => mockResp(401, { error: 'unauthorized' })
  const out = await fetchAvailableCodexModels('tok', 'acc', { transport: transport as any })
  expect(out).toEqual([])
})

test('fetchAvailableCodexModels: 403 兜底 → []', async () => {
  const transport = async () => mockResp(403, { error: 'forbidden' })
  const out = await fetchAvailableCodexModels('tok', 'acc', { transport: transport as any })
  expect(out).toEqual([])
})

test('fetchAvailableCodexModels: 5xx 兜底 → []', async () => {
  const transport = async () => mockResp(503, { error: 'unavailable' })
  const out = await fetchAvailableCodexModels('tok', 'acc', { transport: transport as any })
  expect(out).toEqual([])
})

test('fetchAvailableCodexModels: 网络错（transport 抛错）兜底 → []', async () => {
  const transport = async () => {
    throw new Error('ECONNREFUSED')
  }
  const out = await fetchAvailableCodexModels('tok', 'acc', { transport: transport as any })
  expect(out).toEqual([])
})

test('fetchAvailableCodexModels: JSON 解析失败兜底 → []', async () => {
  const transport = async () => ({
    status: 200,
    ok: true,
    headers: new Headers(),
    body: new ReadableStream<Uint8Array>({ start(c) { c.close() } }),
    text: async () => 'not json',
    json: async () => {
      throw new SyntaxError('Unexpected token')
    },
  })
  const out = await fetchAvailableCodexModels('tok', 'acc', { transport: transport as any })
  expect(out).toEqual([])
})

test('fetchAvailableCodexModels: 缺 accessToken → []（不发请求）', async () => {
  let called = false
  const transport = async () => {
    called = true
    return mockResp(200, { models: [] })
  }
  const out = await fetchAvailableCodexModels('', 'acc', { transport: transport as any })
  expect(out).toEqual([])
  expect(called).toBe(false)
})

test('fetchAvailableCodexModels: 缺 accountId → []（不发请求）', async () => {
  let called = false
  const transport = async () => {
    called = true
    return mockResp(200, { models: [] })
  }
  const out = await fetchAvailableCodexModels('tok', '', { transport: transport as any })
  expect(out).toEqual([])
  expect(called).toBe(false)
})

test('fetchAvailableCodexModels: 未知 schema → []', async () => {
  const transport = async () => mockResp(200, { unexpected: 'shape' })
  const out = await fetchAvailableCodexModels('tok', 'acc', { transport: transport as any })
  expect(out).toEqual([])
})

test('fetchAvailableCodexModels: id 字段软兼容（slug → id → model → name 顺序）', async () => {
  const transport = async () =>
    mockResp(200, {
      models: [
        { slug: 'from-slug' },
        { id: 'from-id' },
        { model: 'from-model' },
        { name: 'from-name' },
      ],
    })
  const out = await fetchAvailableCodexModels('tok', 'acc', { transport: transport as any })
  expect(out.map(m => m.id)).toEqual(['from-slug', 'from-id', 'from-model', 'from-name'])
})

test('fetchAvailableCodexModels: 无 label 字段时 out 项不带 label', async () => {
  const transport = async () => mockResp(200, { models: [{ slug: 'bare-id' }] })
  const out = await fetchAvailableCodexModels('tok', 'acc', { transport: transport as any })
  expect(out).toEqual([{ id: 'bare-id' }])
  expect(out[0]).not.toHaveProperty('label')
})
