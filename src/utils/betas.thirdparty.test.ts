import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { shouldIncludeFirstPartyOnlyBetas } from './betas.js'
import { getMCPUserAgent, getUserAgent, getWebFetchUserAgent } from './http.js'
import { getClaudeCodeUserAgent } from './userAgent.js'

/**
 * B-2 — shouldIncludeFirstPartyOnlyBetas third-party relay guard.
 *
 * getAPIProvider() inspects env only and misclassifies a relay reached via
 * ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN as 'firstParty'. The guard adds
 * isFirstPartyAnthropicBaseUrl() so a non-official ANTHROPIC_BASE_URL host
 * suppresses the first-party-only betas (notably extended-cache-ttl which
 * enables 1h cache_control TTL). Official direct / api.anthropic.com keep
 * emitting them. Bedrock/Vertex were already excluded by provider type.
 */
describe('B-2 — shouldIncludeFirstPartyOnlyBetas (third-party base_url guard)', () => {
  const saved: Record<string, string | undefined> = {}
  const KEYS = [
    'ANTHROPIC_BASE_URL',
    'CLAUDE_CODE_USE_BEDROCK',
    'CLAUDE_CODE_USE_VERTEX',
    'CLAUDE_CODE_USE_FOUNDRY',
    'PANDA_PROVIDER',
    'USER_TYPE',
    'CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS',
  ]

  beforeEach(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k]
      delete process.env[k]
    }
  })

  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  })

  test('official direct (no ANTHROPIC_BASE_URL) → true (1h beta still sent)', () => {
    expect(shouldIncludeFirstPartyOnlyBetas()).toBe(true)
  })

  test('official base_url api.anthropic.com → true', () => {
    process.env.ANTHROPIC_BASE_URL = 'https://api.anthropic.com'
    expect(shouldIncludeFirstPartyOnlyBetas()).toBe(true)
  })

  test('third-party relay base_url (non-official host) → false (1h beta suppressed)', () => {
    process.env.ANTHROPIC_BASE_URL = 'https://relay.example.com/v1'
    expect(shouldIncludeFirstPartyOnlyBetas()).toBe(false)
  })

  test('third-party relay with subdomain → false', () => {
    process.env.ANTHROPIC_BASE_URL = 'https://anthropic.proxy.example.com'
    expect(shouldIncludeFirstPartyOnlyBetas()).toBe(false)
  })

  test('malformed base_url → false (conservative third-party)', () => {
    process.env.ANTHROPIC_BASE_URL = 'not-a-valid-url'
    expect(shouldIncludeFirstPartyOnlyBetas()).toBe(false)
  })

  test('CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1 forces false even on official', () => {
    process.env.CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS = '1'
    expect(shouldIncludeFirstPartyOnlyBetas()).toBe(false)
  })

  test('bedrock provider → false (already excluded by provider type)', () => {
    process.env.CLAUDE_CODE_USE_BEDROCK = '1'
    expect(shouldIncludeFirstPartyOnlyBetas()).toBe(false)
  })

  test('vertex provider → false (already excluded by provider type)', () => {
    process.env.CLAUDE_CODE_USE_VERTEX = '1'
    expect(shouldIncludeFirstPartyOnlyBetas()).toBe(false)
  })

  test('regression: official base_url still true after third-party in same suite', () => {
    process.env.ANTHROPIC_BASE_URL = 'https://api.anthropic.com'
    expect(shouldIncludeFirstPartyOnlyBetas()).toBe(true)
  })
})

describe('UA — upstream Claude Code version split', () => {
  beforeEach(() => {
    ;(globalThis as any).MACRO = {
      VERSION: '2.30.4',
      UPSTREAM_CLAUDE_CODE_VERSION: '2.1.202',
    }
  })

  test('Claude Code UA 使用 upstream baseline version，不使用 Panda package version', () => {
    expect(MACRO.VERSION).toBe('2.30.4')
    expect(MACRO.UPSTREAM_CLAUDE_CODE_VERSION).toBe('2.1.202')
    expect(getClaudeCodeUserAgent()).toBe('claude-code/2.1.202')
    expect(getClaudeCodeUserAgent()).not.toContain(MACRO.VERSION)
  })

  test('HTTP/MCP/WebFetch UA 保留 suffix，但 claude-code 版本使用 upstream baseline', () => {
    process.env.CLAUDE_CODE_ENTRYPOINT = 'external'
    expect(getUserAgent()).toBe('claude-code/2.1.202 (external, cli)')
    expect(getMCPUserAgent()).toBe('claude-code/2.1.202 (external)')
    expect(getWebFetchUserAgent()).toContain('claude-code/2.1.202')
    expect(getWebFetchUserAgent()).not.toContain(MACRO.VERSION)
  })
})
