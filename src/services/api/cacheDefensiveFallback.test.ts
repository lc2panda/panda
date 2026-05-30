// Input:  withRetry 的 operation 抛出 400 cache_control 错误
// Output: 自动 strip cache_control + retry 1 次；非 cache_control 400 走正常 retry
// Pos:    Wave 7 P1-2 防御式 cache_control fallback 单元测试
//
// 覆盖：
// 1. 400 + error.message 含 "cache_control" → retryContext.stripCacheControl 置 true，重试 1 次
// 2. 400 + 其他错误（无 cache keyword）→ 不 strip，走正常 retry
// 3. stripCacheControlFromRequestParams helper 正确剥离 system/tools/messages 的 cache_control + scope

import { describe, expect, test } from 'bun:test'
import { APIError } from '@anthropic-ai/sdk'
import { stripCacheControlFromRequestParams } from './promptCacheBreakDetection.js'
import { isCacheControlRejection400, withRetry } from './withRetry.js'

// Build a minimal APIError. The SDK's APIError constructor signature is
// (status, error, message, headers) — error is the response body.
function makeAPIError(
  status: number,
  body: unknown,
  message: string,
): APIError {
  return new APIError(status, body, message, new Headers())
}

// Drive the withRetry generator to completion, yielding system error messages
// along the way. Returns the final resolved value.
async function drain<T>(
  gen: AsyncGenerator<unknown, T>,
): Promise<{ value: T; yields: unknown[] }> {
  const yields: unknown[] = []
  let next = await gen.next()
  while (!next.done) {
    yields.push(next.value)
    next = await gen.next()
  }
  return { value: next.value, yields }
}

describe('Wave 7 P1-2 — withRetry defensive cache_control fallback', () => {
  // CACHE-003 (281293a) resets stripCacheControl on explicit-cache providers to
  // protect Anthropic 直连 from being falsely stripped. This test targets the
  // implicit-provider scenario (the real use case for defensive fallback —
  // third-party proxies that reject cache_control with 400). We force implicit
  // cache strategy so CACHE-003 reset doesn't fire.
  const priorForceStrategy = process.env.PANDA_FORCE_CACHE_STRATEGY
  const forceImplicit = () => {
    process.env.PANDA_FORCE_CACHE_STRATEGY = 'implicit'
  }
  const restoreStrategy = () => {
    if (priorForceStrategy === undefined) {
      delete process.env.PANDA_FORCE_CACHE_STRATEGY
    } else {
      process.env.PANDA_FORCE_CACHE_STRATEGY = priorForceStrategy
    }
  }

  test('400 "cache_control" → flips context.stripCacheControl, retries once, succeeds', async () => {
    forceImplicit()
    let attempt = 0
    const contextSeen: { stripCacheControl?: boolean }[] = []

    const gen = withRetry(
      async () => ({}) as any, // fake client
      async (_client, attemptNum, context) => {
        attempt = attemptNum
        contextSeen.push({ stripCacheControl: context.stripCacheControl })
        if (attemptNum === 1) {
          throw makeAPIError(
            400,
            {
              type: 'error',
              error: {
                type: 'invalid_request_error',
                message:
                  'messages.0.content.0.cache_control: Unsupported field for this provider',
              },
            },
            'messages.0.content.0.cache_control: Unsupported field for this provider',
          )
        }
        return 'ok-after-strip' as const
      },
      {
        model: 'claude-fake',
        thinkingConfig: { type: 'disabled' },
        maxRetries: 3,
      },
    )

    const { value } = await drain(gen)
    expect(value).toBe('ok-after-strip')
    // operation called twice: first failed, second succeeded
    expect(attempt).toBe(2)
    expect(contextSeen.length).toBe(2)
    expect(contextSeen[0]?.stripCacheControl).toBeFalsy()
    expect(contextSeen[1]?.stripCacheControl).toBe(true)
    restoreStrategy()
  })

  test('400 without cache keyword → NOT marked for strip; error propagates (non-retryable 400)', async () => {
    let operationCalls = 0
    let finalStripFlag: boolean | undefined

    const gen = withRetry(
      async () => ({}) as any,
      async (_client, _attempt, context) => {
        operationCalls++
        finalStripFlag = context.stripCacheControl
        throw makeAPIError(
          400,
          {
            type: 'error',
            error: {
              type: 'invalid_request_error',
              message: 'max_tokens: must be at least 1',
            },
          },
          'max_tokens: must be at least 1',
        )
      },
      {
        model: 'claude-fake',
        thinkingConfig: { type: 'disabled' },
        maxRetries: 2,
      },
    )

    await expect(drain(gen)).rejects.toThrow()
    // 400 non-cache errors are not retryable (shouldRetry returns false for
    // unknown 400), so operation runs exactly once and strip flag stays off.
    expect(operationCalls).toBe(1)
    expect(finalStripFlag).toBeFalsy()
  })

  test('DISABLE_CACHE_DEFENSIVE_FALLBACK=1 → no strip, error propagates on cache_control 400', async () => {
    const prev = process.env.DISABLE_CACHE_DEFENSIVE_FALLBACK
    process.env.DISABLE_CACHE_DEFENSIVE_FALLBACK = '1'
    try {
      let operationCalls = 0
      const gen = withRetry(
        async () => ({}) as any,
        async () => {
          operationCalls++
          throw makeAPIError(
            400,
            {
              type: 'error',
              error: {
                type: 'invalid_request_error',
                message: 'cache_control not supported',
              },
            },
            'cache_control not supported',
          )
        },
        {
          model: 'claude-fake',
          thinkingConfig: { type: 'disabled' },
          maxRetries: 2,
        },
      )

      await expect(drain(gen)).rejects.toThrow()
      // With defensive fallback disabled, no extra retry attempt happens
      // for cache_control 400 (still non-retryable 400 → bails immediately).
      expect(operationCalls).toBe(1)
    } finally {
      if (prev === undefined) {
        delete process.env.DISABLE_CACHE_DEFENSIVE_FALLBACK
      } else {
        process.env.DISABLE_CACHE_DEFENSIVE_FALLBACK = prev
      }
    }
  })
})

describe('B-1 — isCacheControlRejection400 (clean 400 + third-party relay wrapping)', () => {
  // The real upstream TTL-ordering error text Anthropic returns.
  const ttlOrderingMsg =
    "messages.2.content.7.cache_control.ttl: a ttl='1h' cache_control block " +
    "must not come after a ttl='5m' cache_control block. Note that blocks are " +
    'processed in the following order: tools, system, messages.'

  test('clean APIError 400 with cache_control keyword → true', () => {
    const err = makeAPIError(
      400,
      { type: 'error', error: { type: 'invalid_request_error', message: ttlOrderingMsg } },
      ttlOrderingMsg,
    )
    expect(isCacheControlRejection400(err)).toBe(true)
  })

  test('clean APIError 400 scope + unsupported parameter → true', () => {
    const msg = 'unsupported parameter: scope'
    const err = makeAPIError(
      400,
      { type: 'error', error: { type: 'invalid_request_error', message: msg } },
      msg,
    )
    expect(isCacheControlRejection400(err)).toBe(true)
  })

  test('clean APIError 400 unrelated (max_tokens) → false', () => {
    const msg = 'max_tokens: must be at least 1'
    const err = makeAPIError(
      400,
      { type: 'error', error: { type: 'invalid_request_error', message: msg } },
      msg,
    )
    expect(isCacheControlRejection400(err)).toBe(false)
  })

  test('B-1: third-party relay upstream_error wrapping cache_control TTL ordering (plain Error, not APIError 400) → true', () => {
    // Relay forwards to Anthropic, gets the cache_control TTL 400, re-wraps it
    // as a streaming upstream_error event. Surfaces as a plain Error whose
    // message carries the original cache_control TTL-ordering text.
    const err = new Error(
      `${ttlOrderingMsg}\ndata: {"type":"error","error":{"type":"upstream_error","message":"Upstream request failed"}}`,
    )
    expect(isCacheControlRejection400(err)).toBe(true)
  })

  test('B-1: relay error with cache_control text in .error body (object) → true', () => {
    const err = {
      message: 'Upstream request failed',
      error: {
        type: 'upstream_error',
        upstream: {
          message:
            "cache_control.ttl: a ttl='1h' cache_control block must not come after a ttl='5m' cache_control block",
        },
      },
    }
    expect(isCacheControlRejection400(err)).toBe(true)
  })

  test('B-1 negative: generic upstream_error WITHOUT cache_control signature → false (no over-match)', () => {
    const err = new Error(
      'data: {"type":"error","error":{"type":"upstream_error","message":"Upstream request failed"}}',
    )
    expect(isCacheControlRejection400(err)).toBe(false)
  })

  test('B-1 negative: network error mentioning cache but no TTL ordering → false', () => {
    const err = new Error('failed to read cache from disk: ENOENT')
    expect(isCacheControlRejection400(err)).toBe(false)
  })
})

describe('Wave 7 P1-2 — stripCacheControlFromRequestParams helper', () => {
  test('strips cache_control from system blocks', () => {
    const params = {
      system: [
        { type: 'text', text: 'hello', cache_control: { type: 'ephemeral' } },
        { type: 'text', text: 'world' },
      ],
    }
    const stripped = stripCacheControlFromRequestParams(params)
    expect(stripped.system).toEqual([
      { type: 'text', text: 'hello' },
      { type: 'text', text: 'world' },
    ])
    // Input unchanged (non-mutating)
    expect((params.system[0] as { cache_control?: unknown }).cache_control)
      .toBeTruthy()
  })

  test('strips cache_control from tool definitions', () => {
    const params = {
      tools: [
        {
          name: 'Bash',
          description: 'run',
          input_schema: {},
          cache_control: { type: 'ephemeral', ttl: '1h', scope: 'global' },
        },
        { name: 'Read', description: 'read', input_schema: {} },
      ],
    }
    const stripped = stripCacheControlFromRequestParams(params)
    expect(stripped.tools?.[0]).toEqual({
      name: 'Bash',
      description: 'run',
      input_schema: {},
    })
    expect(stripped.tools?.[1]).toEqual({
      name: 'Read',
      description: 'read',
      input_schema: {},
    })
  })

  test('strips cache_control from message content blocks including nested tool_result', () => {
    const params = {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'hi',
              cache_control: { type: 'ephemeral', scope: 'global' },
            },
            {
              type: 'tool_result',
              tool_use_id: 'abc',
              content: [
                {
                  type: 'text',
                  text: 'nested',
                  cache_control: { type: 'ephemeral' },
                },
              ],
              cache_control: { type: 'ephemeral' },
            },
          ],
        },
        {
          role: 'assistant',
          content: 'plain string stays plain',
        },
      ],
    }
    const stripped = stripCacheControlFromRequestParams(params)
    const firstMsg = stripped.messages?.[0] as { content: unknown[] }
    expect(firstMsg.content[0]).toEqual({ type: 'text', text: 'hi' })
    const toolResult = firstMsg.content[1] as {
      type: string
      tool_use_id: string
      content: unknown[]
      cache_control?: unknown
    }
    expect(toolResult.cache_control).toBeUndefined()
    expect(toolResult.content[0]).toEqual({ type: 'text', text: 'nested' })
    expect(stripped.messages?.[1]).toEqual({
      role: 'assistant',
      content: 'plain string stays plain',
    })
  })

  test('no cache_control anywhere → returns structurally-equal shallow clone', () => {
    const params = {
      system: [{ type: 'text', text: 'x' }],
      tools: [{ name: 'T', description: '', input_schema: {} }],
      messages: [{ role: 'user', content: 'hey' }],
    }
    const stripped = stripCacheControlFromRequestParams(params)
    expect(stripped).toEqual(params)
  })
})
