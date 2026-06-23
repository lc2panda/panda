// Input: mock ConnectedMCPServer.client.request (tools/list) — 成功 / 抛错 / 非 connected
// Output: 断言 fetchToolsForClient 不缓存空分支、抛错后清缓存可重试、成功结果被缓存
// Pos: v2.28.4 — channel reply 修复回归测试，覆盖 fetchToolsForClient memoize 缓存中毒竞态

import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { fetchToolsForClient } from '../client.js'
import type { ConnectedMCPServer, MCPServerConnection } from '../types.js'

// ---------- 辅助：构造最小可用的 mock client ----------

type RequestFn = (params: unknown, schema: unknown) => Promise<unknown>

/**
 * 构造一个最小 ConnectedMCPServer：仅填充 fetchToolsForClient 实际访问的字段
 * （client.request / config.type / capabilities.tools / name / type）。
 */
function makeConnectedClient(
  name: string,
  request: RequestFn,
  opts: { tools?: boolean } = {},
): ConnectedMCPServer {
  return {
    type: 'connected',
    name,
    capabilities: opts.tools === false ? {} : { tools: {} },
    config: { type: 'stdio', command: 'noop' },
    client: { request },
    cleanup: async () => {},
  } as unknown as ConnectedMCPServer
}

/** tools/list 成功响应，含两个工具。 */
function toolsListResult() {
  return {
    tools: [
      { name: 'reply', description: 'reply tool', inputSchema: { type: 'object' } },
      { name: 'send', description: 'send tool', inputSchema: { type: 'object' } },
    ],
  }
}

describe('fetchToolsForClient 缓存中毒修复 (v2.28.4)', () => {
  beforeEach(() => {
    // 每个用例前清空缓存，避免跨用例污染
    fetchToolsForClient.cache.clear()
  })

  test('非 connected client → 返回 [] 且不污染缓存；之后同名 client connected 可拿到真实 tools', async () => {
    const name = 'wechat-A'

    // 1) 初连竞态：握手未完成，client 尚未 connected
    const pending = {
      type: 'pending',
      name,
      config: { type: 'stdio', command: 'noop' },
    } as unknown as MCPServerConnection

    const r1 = await fetchToolsForClient(pending)
    expect(r1).toEqual([])
    // 关键：非 connected 分支绝不能在缓存里钉一个 Promise<[]>
    expect(fetchToolsForClient.cache.has(name)).toBe(false)

    // 2) 之后真正 connected，应当能拿到真实 tools
    const request = mock(async () => toolsListResult())
    const connected = makeConnectedClient(name, request)
    const r2 = await fetchToolsForClient(connected)
    expect(r2.map(t => t.name)).toEqual([
      `mcp__${name}__reply`,
      `mcp__${name}__send`,
    ])
    expect(request).toHaveBeenCalledTimes(1)
  })

  test('无 tools capability → 返回 [] 且不缓存', async () => {
    const name = 'wechat-no-cap'
    const request = mock(async () => toolsListResult())
    const client = makeConnectedClient(name, request, { tools: false })

    const r = await fetchToolsForClient(client)
    expect(r).toEqual([])
    // 不应发起 tools/list，也不应缓存
    expect(request).toHaveBeenCalledTimes(0)
    expect(fetchToolsForClient.cache.has(name)).toBe(false)
  })

  test('tools/list 抛错 → 返回 [] 且缓存被清，重试成功能拿到 tools', async () => {
    const name = 'feishu-B'

    // 第一次：tools/list 在握手中途抛错
    const failing = mock(async () => {
      throw new Error('handshake in progress')
    })
    const c1 = makeConnectedClient(name, failing)
    const r1 = await fetchToolsForClient(c1)
    expect(r1).toEqual([])
    expect(failing).toHaveBeenCalledTimes(1)
    // 关键：被拒绝的 Promise 必须从缓存清除，否则后续永久复用空结果
    expect(fetchToolsForClient.cache.has(name)).toBe(false)

    // 第二次：连接稳定后重试，应当重新发 tools/list 并拿到真实 tools
    const ok = mock(async () => toolsListResult())
    const c2 = makeConnectedClient(name, ok)
    const r2 = await fetchToolsForClient(c2)
    expect(r2.map(t => t.name)).toEqual([
      `mcp__${name}__reply`,
      `mcp__${name}__send`,
    ])
    expect(ok).toHaveBeenCalledTimes(1)
  })

  test('成功结果被缓存：第二次调用不重发 tools/list', async () => {
    const name = 'wechat-C'
    const request = mock(async () => toolsListResult())
    const client = makeConnectedClient(name, request)

    const r1 = await fetchToolsForClient(client)
    const r2 = await fetchToolsForClient(client)
    expect(r1).toEqual(r2)
    // 第二次命中缓存，request 只应被调用一次
    expect(request).toHaveBeenCalledTimes(1)
    expect(fetchToolsForClient.cache.has(name)).toBe(true)
  })
})
