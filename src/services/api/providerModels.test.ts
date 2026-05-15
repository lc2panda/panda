// Input:  fetchProviderModels(baseURL, apiKey, { transport })
// Output: 单元测试集 —— 覆盖正常 / fallback URL 链 / parse 错 / 错误响应 / 超时 / 黑名单 兜底全路径
// Pos:    src/services/api/providerModels.ts （作战线 V/W）
//
// 一旦我被修改，请更新我的头部注释。

import { test, expect, describe } from 'bun:test'
import {
  buildModelEndpointCandidates,
  fetchProviderModels,
  parseProviderModelsResponse,
} from './providerModels.js'

describe('buildModelEndpointCandidates', () => {
  test('DeepSeek anthropic baseURL → 包含 anthropic 路径 + 剥后缀域名 root', () => {
    const candidates = buildModelEndpointCandidates('https://api.deepseek.com/anthropic')
    // 实测：anthropic/v1/models 端点存在 (401)，必须保留为候选
    expect(candidates).toContain('https://api.deepseek.com/anthropic/v1/models')
    expect(candidates).toContain('https://api.deepseek.com/v1/models')
  })

  test('Qwen anthropic baseURL → dashscope compatible-mode 必须排首位', () => {
    const candidates = buildModelEndpointCandidates(
      'https://dashscope-intl.aliyuncs.com/apps/anthropic',
    )
    // 实测：apps/anthropic 路径 404，compatible-mode 是唯一可用 → 应排首位
    expect(candidates[0]).toBe('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models')
    expect(candidates).toContain('https://dashscope-intl.aliyuncs.com/v1/models')
  })

  test('Kimi moonshot.cn baseURL → /v1/models 直接命中', () => {
    const candidates = buildModelEndpointCandidates('https://api.moonshot.cn')
    expect(candidates).toContain('https://api.moonshot.cn/v1/models')
  })

  test('Kimi api.kimi.com 旧 baseURL → /coding/v1/models 优先（root 实测 404）', () => {
    const candidates = buildModelEndpointCandidates('https://api.kimi.com/coding/')
    expect(candidates).toContain('https://api.kimi.com/coding/v1/models')
  })

  test('GLM bigmodel.cn baseURL → paas/v4 首选 + anthropic 路径已黑名单 skip', () => {
    const candidates = buildModelEndpointCandidates('https://open.bigmodel.cn/api/anthropic/')
    // 实测：paas/v4 是唯一可靠路径（401）；anthropic 实测 10s+ 挂死 → 黑名单 skip
    expect(candidates[0]).toBe('https://open.bigmodel.cn/api/paas/v4/models')
    expect(candidates).not.toContain('https://open.bigmodel.cn/api/anthropic/v1/models')
    expect(candidates).not.toContain('https://open.bigmodel.cn/v1/models') // root 返回 HTML
  })

  test('Volcano baseURL → ark v3 优先', () => {
    const candidates = buildModelEndpointCandidates(
      'https://ark.cn-beijing.volces.com/api/coding',
    )
    expect(candidates[0]).toBe('https://ark.cn-beijing.volces.com/api/v3/models')
    expect(candidates).toContain('https://ark.cn-beijing.volces.com/api/coding/v1/models')
  })

  test('MiniMax anthropic baseURL → host-root /v1/models 优先', () => {
    const candidates = buildModelEndpointCandidates('https://api.minimax.io/anthropic')
    // host-known 优先：api.minimax.io/v1/models 实测 401（可用）
    expect(candidates[0]).toBe('https://api.minimax.io/v1/models')
    expect(candidates).toContain('https://api.minimax.io/anthropic/v1/models')
  })

  test('OpenAI 标准 baseURL → /v1/models 候选包含', () => {
    const candidates = buildModelEndpointCandidates('https://api.openai.com/v1')
    expect(candidates).toContain('https://api.openai.com/v1/models')
  })

  test('无 trailing slash 不重复 / 候选去重', () => {
    const candidates = buildModelEndpointCandidates('https://api.example.com/')
    expect(new Set(candidates).size).toBe(candidates.length)
  })

  test('非法 URL → 仍生成主路径（不抛）', () => {
    const candidates = buildModelEndpointCandidates('not-a-url')
    expect(candidates).toEqual(['not-a-url/v1/models'])
  })

  test('黑名单：GLM anthropic /v1/models 永不出现', () => {
    const candidates = buildModelEndpointCandidates('https://open.bigmodel.cn/api/anthropic/')
    for (const c of candidates) {
      expect(c).not.toBe('https://open.bigmodel.cn/api/anthropic/v1/models')
    }
  })
})

describe('parseProviderModelsResponse', () => {
  test('OpenAI 标准 { data: [{ id }] }', () => {
    const out = parseProviderModelsResponse({
      data: [{ id: 'deepseek-chat' }, { id: 'deepseek-reasoner' }],
    })
    expect(out).toEqual([{ id: 'deepseek-chat' }, { id: 'deepseek-reasoner' }])
  })

  test('Codex 协议 { models: [{ slug, display_name }] }', () => {
    const out = parseProviderModelsResponse({
      models: [
        { slug: 'gpt-5', display_name: 'GPT-5', visibility: 'list' },
        { slug: 'gpt-5-mini', display_name: 'GPT-5 mini', visibility: 'list' },
      ],
    })
    expect(out).toEqual([
      { id: 'gpt-5', label: 'GPT-5' },
      { id: 'gpt-5-mini', label: 'GPT-5 mini' },
    ])
  })

  test('Codex visibility !== list 隐藏', () => {
    const out = parseProviderModelsResponse({
      models: [
        { slug: 'a', visibility: 'list' },
        { slug: 'b', visibility: 'hide' },
        { slug: 'c', visibility: 'list' },
      ],
    })
    expect(out.map(m => m.id)).toEqual(['a', 'c'])
  })

  test('Codex supported_in_api === false 隐藏', () => {
    const out = parseProviderModelsResponse({
      models: [
        { slug: 'a', supported_in_api: true },
        { slug: 'b', supported_in_api: false },
      ],
    })
    expect(out.map(m => m.id)).toEqual(['a'])
  })

  test('错误响应 { error: {...} } → []', () => {
    const out = parseProviderModelsResponse({
      error: { message: 'invalid key', type: 'authentication_error' },
    })
    expect(out).toEqual([])
  })

  test('智谱错误响应 { code: 401, msg: ... } → []', () => {
    const out = parseProviderModelsResponse({
      code: 401,
      msg: '令牌已过期或验证不正确',
      success: false,
    })
    expect(out).toEqual([])
  })

  test('过滤 embedding / image / tts 模型', () => {
    const out = parseProviderModelsResponse({
      data: [
        { id: 'deepseek-chat' },
        { id: 'text-embedding-3-small' },
        { id: 'tts-1' },
        { id: 'dall-e-3' },
        { id: 'whisper-1' },
        { id: 'gpt-4o' },
      ],
    })
    expect(out.map(m => m.id)).toEqual(['deepseek-chat', 'gpt-4o'])
  })

  test('顶级 array', () => {
    const out = parseProviderModelsResponse([{ id: 'a' }, { id: 'b' }])
    expect(out.map(m => m.id)).toEqual(['a', 'b'])
  })

  test('string array', () => {
    const out = parseProviderModelsResponse(['a', 'b'])
    expect(out.map(m => m.id)).toEqual(['a', 'b'])
  })

  test('去重 id', () => {
    const out = parseProviderModelsResponse({
      data: [{ id: 'a' }, { id: 'a' }, { id: 'b' }],
    })
    expect(out.map(m => m.id)).toEqual(['a', 'b'])
  })

  test('null / undefined / 错误类型 → []', () => {
    expect(parseProviderModelsResponse(null)).toEqual([])
    expect(parseProviderModelsResponse(undefined)).toEqual([])
    expect(parseProviderModelsResponse(42)).toEqual([])
    expect(parseProviderModelsResponse('string')).toEqual([])
  })

  test('阿里 dashscope output.models 兼容', () => {
    const out = parseProviderModelsResponse({
      output: {
        models: [{ id: 'qwen-max' }, { id: 'qwen-plus' }],
      },
    })
    expect(out.map(m => m.id)).toEqual(['qwen-max', 'qwen-plus'])
  })
})

describe('fetchProviderModels', () => {
  // 工厂：mock fetch 响应
  function mockFetch(
    handler: (url: string) => {
      status?: number
      body?: unknown
      throwBeforeResponse?: boolean
    },
  ): typeof fetch {
    return (async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      const result = handler(url)
      if (result.throwBeforeResponse) {
        throw new Error('network error')
      }
      const status = result.status ?? 200
      return {
        status,
        ok: status >= 200 && status < 300,
        json: async () => result.body,
        text: async () => JSON.stringify(result.body ?? ''),
        headers: new Headers(),
      } as Response
    }) as typeof fetch
  }

  test('正常：第一个候选返回 models 直接成功', async () => {
    const tries: string[] = []
    const transport = mockFetch(url => {
      tries.push(url)
      return {
        body: { data: [{ id: 'deepseek-chat' }, { id: 'deepseek-reasoner' }] },
      }
    })
    const out = await fetchProviderModels(
      'https://api.deepseek.com/anthropic',
      'sk-test',
      { transport },
    )
    expect(out.map(m => m.id)).toEqual(['deepseek-chat', 'deepseek-reasoner'])
    // 第一个候选即返回 → 只发一次请求
    expect(tries.length).toBe(1)
  })

  test('主路径 404 → fallback 后续候选成功', async () => {
    const tries: string[] = []
    const transport = mockFetch(url => {
      tries.push(url)
      if (url === 'https://api.deepseek.com/anthropic/v1/models') {
        return { status: 404, body: { error: 'not found' } }
      }
      if (url === 'https://api.deepseek.com/v1/models') {
        return { body: { data: [{ id: 'deepseek-chat' }] } }
      }
      return { status: 500 }
    })
    const out = await fetchProviderModels(
      'https://api.deepseek.com/anthropic',
      'sk-test',
      { transport },
    )
    expect(out.map(m => m.id)).toEqual(['deepseek-chat'])
    // 至少包含 anthropic 和 v1 两个候选
    expect(tries).toContain('https://api.deepseek.com/anthropic/v1/models')
    expect(tries).toContain('https://api.deepseek.com/v1/models')
  })

  test('全部失败（404 / network err / 错误 body） → []', async () => {
    const transport = mockFetch(url => {
      if (url.includes('compatible-mode')) {
        return { status: 404 }
      }
      return { status: 401, body: { error: 'invalid key' } }
    })
    const out = await fetchProviderModels(
      'https://dashscope-intl.aliyuncs.com/apps/anthropic',
      'invalid',
      { transport },
    )
    expect(out).toEqual([])
  })

  test('网络抛错 → fallback 继续', async () => {
    let firstCall = true
    const transport = mockFetch(_url => {
      if (firstCall) {
        firstCall = false
        return { throwBeforeResponse: true }
      }
      return { body: { data: [{ id: 'deepseek-chat' }] } }
    })
    const out = await fetchProviderModels(
      'https://api.deepseek.com/anthropic',
      'sk-test',
      { transport },
    )
    expect(out.map(m => m.id)).toEqual(['deepseek-chat'])
  })

  test('缺 baseURL 或 apiKey → 直接 []', async () => {
    expect(await fetchProviderModels('', 'k')).toEqual([])
    expect(await fetchProviderModels('https://x', '')).toEqual([])
  })

  test('请求带 Authorization Bearer + x-api-key', async () => {
    let capturedInit: RequestInit | undefined
    const transport = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedInit = init
      return {
        status: 200,
        ok: true,
        json: async () => ({ data: [{ id: 'm1' }] }),
        text: async () => '',
        headers: new Headers(),
      } as Response
    }) as typeof fetch
    await fetchProviderModels('https://api.example.com', 'mykey', { transport })
    const headers = capturedInit?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer mykey')
    expect(headers['x-api-key']).toBe('mykey')
  })

  test('总超时：所有候选都慢 → 超时退出返回 []', async () => {
    const transport = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      // 模拟挂死的 endpoint：仅在 abort 时 reject，否则永远不 resolve
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'))
        })
      })
    }) as typeof fetch
    const start = Date.now()
    const out = await fetchProviderModels('https://x.com/anthropic', 'k', {
      transport,
      totalTimeoutMs: 200,
      perRequestTimeoutMs: 50,
    })
    expect(out).toEqual([])
    const elapsed = Date.now() - start
    // 总耗时应该在 totalTimeoutMs ± 一定 buffer 内退出
    expect(elapsed).toBeLessThan(1000)
  })

  test('AbortController 触发 abort → fetch 抛错 → fallback', async () => {
    const tries: string[] = []
    const transport = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      tries.push(url)
      // 第一次：等 abort signal
      if (tries.length === 1) {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'))
          })
        })
      }
      // 后续候选立即返回
      return {
        status: 200,
        ok: true,
        json: async () => ({ data: [{ id: 'fallback-model' }] }),
        text: async () => '',
        headers: new Headers(),
      } as Response
    }) as typeof fetch
    const out = await fetchProviderModels(
      'https://api.deepseek.com/anthropic',
      'k',
      { transport, perRequestTimeoutMs: 50, totalTimeoutMs: 5000 },
    )
    expect(out.map(m => m.id)).toEqual(['fallback-model'])
    expect(tries.length).toBeGreaterThanOrEqual(2)
  })

  test('黑名单 URL 不出现在候选中（GLM anthropic 挂死端点）', async () => {
    const tries: string[] = []
    const transport = mockFetch(url => {
      tries.push(url)
      return { body: { data: [{ id: 'glm-5.1' }] } }
    })
    await fetchProviderModels('https://open.bigmodel.cn/api/anthropic/', 'k', { transport })
    // 黑名单的 URL 永远不应被请求
    expect(tries).not.toContain('https://open.bigmodel.cn/api/anthropic/v1/models')
    expect(tries).not.toContain('https://open.bigmodel.cn/v1/models')
  })
})
