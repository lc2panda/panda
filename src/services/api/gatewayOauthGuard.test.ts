// Input:  ANTHROPIC_BASE_URL env var（自定义 gateway / 官方端点 / 空）
// Output: isFirstPartyAnthropicBaseUrl() 门控结果 → OAuth 是否允许注入
// Pos:    Wave1-项4 P0 修复验证 — 自定义 gateway 不再误收用户 OAuth 凭证

import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { isFirstPartyAnthropicBaseUrl } from '../../utils/model/providers.js'

/**
 * 恢复 env var 的辅助（Bun 测试无自动 env 沙箱）
 */
function withBaseUrl(url: string | undefined, fn: () => void) {
  const saved = process.env.ANTHROPIC_BASE_URL
  const savedUserType = process.env.USER_TYPE
  if (url === undefined) {
    delete process.env.ANTHROPIC_BASE_URL
  } else {
    process.env.ANTHROPIC_BASE_URL = url
  }
  try {
    fn()
  } finally {
    if (saved === undefined) delete process.env.ANTHROPIC_BASE_URL
    else process.env.ANTHROPIC_BASE_URL = saved
    if (savedUserType === undefined) delete process.env.USER_TYPE
    else process.env.USER_TYPE = savedUserType
  }
}

describe('Wave1-项4 P0 — isFirstPartyAnthropicBaseUrl() OAuth 门控', () => {
  // ── 合法 first-party 端点 → 允许注入 OAuth ──────────────────────────────

  test('ANTHROPIC_BASE_URL 未设（默认）→ first-party=true，OAuth 可注入', () => {
    withBaseUrl(undefined, () => {
      expect(isFirstPartyAnthropicBaseUrl()).toBe(true)
    })
  })

  test('ANTHROPIC_BASE_URL=https://api.anthropic.com → first-party=true，OAuth 可注入', () => {
    withBaseUrl('https://api.anthropic.com', () => {
      expect(isFirstPartyAnthropicBaseUrl()).toBe(true)
    })
  })

  test('ANTHROPIC_BASE_URL=https://api.anthropic.com/v1 → first-party=true，OAuth 可注入', () => {
    withBaseUrl('https://api.anthropic.com/v1', () => {
      expect(isFirstPartyAnthropicBaseUrl()).toBe(true)
    })
  })

  // ── staging 放行（USER_TYPE=ant）────────────────────────────────────────

  test('staging: ANTHROPIC_BASE_URL=https://api-staging.anthropic.com + USER_TYPE=ant → first-party=true，OAuth 可注入', () => {
    const savedUserType = process.env.USER_TYPE
    process.env.USER_TYPE = 'ant'
    withBaseUrl('https://api-staging.anthropic.com', () => {
      expect(isFirstPartyAnthropicBaseUrl()).toBe(true)
    })
    if (savedUserType === undefined) delete process.env.USER_TYPE
    else process.env.USER_TYPE = savedUserType
  })

  test('staging URL 未设 ANTHROPIC_BASE_URL（USE_STAGING_OAUTH 动态注入 baseURL）→ first-party=true，OAuth 可注入', () => {
    // 当 USE_STAGING_OAUTH=true 时，client.ts 在 clientConfig 中动态设置 baseURL，
    // 但不修改 process.env.ANTHROPIC_BASE_URL，因此门控函数看到 baseUrl=undefined → true
    withBaseUrl(undefined, () => {
      expect(isFirstPartyAnthropicBaseUrl()).toBe(true)
    })
  })

  // ── 自定义 gateway（P0 漏洞场景）→ 禁止注入 OAuth ─────────────────────

  test('自定义 gateway: ANTHROPIC_BASE_URL=https://my-gateway.example.com → first-party=false，OAuth 禁止注入', () => {
    withBaseUrl('https://my-gateway.example.com', () => {
      expect(isFirstPartyAnthropicBaseUrl()).toBe(false)
    })
  })

  test('自定义 gateway: ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1 → first-party=false，OAuth 禁止注入', () => {
    withBaseUrl('https://openrouter.ai/api/v1', () => {
      expect(isFirstPartyAnthropicBaseUrl()).toBe(false)
    })
  })

  test('自定义 gateway: ANTHROPIC_BASE_URL=http://localhost:8080 → first-party=false，OAuth 禁止注入（无 ant 白名单）', () => {
    withBaseUrl('http://localhost:8080', () => {
      expect(isFirstPartyAnthropicBaseUrl()).toBe(false)
    })
  })

  test('自定义 gateway: ANTHROPIC_BASE_URL=https://api.anthropic.com.evil.com → first-party=false（前缀欺骗防御）', () => {
    withBaseUrl('https://api.anthropic.com.evil.com', () => {
      expect(isFirstPartyAnthropicBaseUrl()).toBe(false)
    })
  })

  test('非法 URL（parse 异常）→ first-party=false，OAuth 禁止注入', () => {
    withBaseUrl('not-a-valid-url', () => {
      expect(isFirstPartyAnthropicBaseUrl()).toBe(false)
    })
  })

  // ── staging URL 但无 USER_TYPE=ant → 不在白名单 ─────────────────────────

  test('staging URL 但 USER_TYPE 非 ant → first-party=false，staging URL 不放行外部用户', () => {
    const savedUserType = process.env.USER_TYPE
    delete process.env.USER_TYPE
    withBaseUrl('https://api-staging.anthropic.com', () => {
      expect(isFirstPartyAnthropicBaseUrl()).toBe(false)
    })
    if (savedUserType === undefined) delete process.env.USER_TYPE
    else process.env.USER_TYPE = savedUserType
  })
})

describe('Wave1-项4 P0 — OAuth 门控逻辑组合（纯逻辑验证）', () => {
  /**
   * 模拟 client.ts 的门控判断：
   *   resolvedAuthToken = (!_hasThirdParty && isClaudeAISubscriber && isFirstParty) ? oauthToken : undefined
   *   resolvedApiKey    = (_hasThirdParty || !isClaudeAISubscriber || !isFirstParty) ? apiKey : null
   *
   * 此处不 mock 整个 getAnthropicClient（副作用太多），而是用等价纯函数验证门控矩阵。
   */
  function computeResolved({
    hasThirdParty,
    isSubscriber,
    isFirstParty,
    oauthToken,
    apiKey,
  }: {
    hasThirdParty: boolean
    isSubscriber: boolean
    isFirstParty: boolean
    oauthToken: string | undefined
    apiKey: string | undefined
  }): { resolvedApiKey: string | null; resolvedAuthToken: string | undefined } {
    const resolvedApiKey =
      hasThirdParty || !isSubscriber || !isFirstParty ? apiKey ?? null : null
    const resolvedAuthToken =
      !hasThirdParty && isSubscriber && isFirstParty ? oauthToken : undefined
    return { resolvedApiKey, resolvedAuthToken }
  }

  test('first-party + OAuth subscriber → OAuth 注入，apiKey=null', () => {
    const r = computeResolved({
      hasThirdParty: false,
      isSubscriber: true,
      isFirstParty: true,
      oauthToken: 'sk-oauth-abc',
      apiKey: undefined,
    })
    expect(r.resolvedAuthToken).toBe('sk-oauth-abc')
    expect(r.resolvedApiKey).toBeNull()
  })

  test('自定义 gateway + OAuth subscriber → OAuth 不注入，回退 apiKey', () => {
    // P0 漏洞场景: 此处 OAuth token 不得泄露到第三方 gateway
    const r = computeResolved({
      hasThirdParty: false,
      isSubscriber: true,
      isFirstParty: false,           // 自定义 ANTHROPIC_BASE_URL
      oauthToken: 'sk-oauth-secret', // 不应外发
      apiKey: 'gw-key-from-user',
    })
    expect(r.resolvedAuthToken).toBeUndefined()    // OAuth 不注入
    expect(r.resolvedApiKey).toBe('gw-key-from-user') // 用 gateway key
  })

  test('thirdPartyProvider（Moonshot/Minimax/OpenAI）→ OAuth 不注入，无误伤', () => {
    const r = computeResolved({
      hasThirdParty: true,           // _hasThirdParty=true
      isSubscriber: true,
      isFirstParty: true,
      oauthToken: 'sk-oauth-abc',
      apiKey: 'moonshot-api-key',
    })
    expect(r.resolvedAuthToken).toBeUndefined()
    expect(r.resolvedApiKey).toBe('moonshot-api-key')
  })

  test('非 OAuth subscriber（API key 用户）→ OAuth 不注入', () => {
    const r = computeResolved({
      hasThirdParty: false,
      isSubscriber: false,
      isFirstParty: true,
      oauthToken: undefined,
      apiKey: 'sk-ant-user-key',
    })
    expect(r.resolvedAuthToken).toBeUndefined()
    expect(r.resolvedApiKey).toBe('sk-ant-user-key')
  })

  test('staging OAuth（isFirstParty=true via ant 白名单）→ OAuth 正常注入', () => {
    const r = computeResolved({
      hasThirdParty: false,
      isSubscriber: true,
      isFirstParty: true,   // staging URL 在 ant 白名单中 → isFirstPartyAnthropicBaseUrl()=true
      oauthToken: 'staging-oauth-token',
      apiKey: undefined,
    })
    expect(r.resolvedAuthToken).toBe('staging-oauth-token')
    expect(r.resolvedApiKey).toBeNull()
  })
})
