// Input:  Usage-bearing helpers invoked with replay/cached messages that may omit usage
// Output: No throw; missing usage fields are treated as zero
// Pos:    Stability guard for context recovery and accounting/logging paths

import { describe, expect, test } from 'bun:test'

if (typeof (globalThis as any).MACRO === 'undefined') {
  ;(globalThis as any).MACRO = {
    VERSION: '2.30.10-test',
    BUILD_TIME: new Date().toISOString(),
    FEEDBACK_CHANNEL: '',
    ISSUES_EXPLAINER: '',
    NATIVE_PACKAGE_URL: '@lc2panda/panda-code',
    PACKAGE_URL: '@lc2panda/panda-code',
    VERSION_CHANGELOG: '',
  }
}

describe('missing usage stability guards', () => {
  test('PromptSuggestion parent cache suppressor tolerates missing usage', async () => {
    const { getParentCacheSuppressReason } = await import(
      './services/PromptSuggestion/promptSuggestion.js'
    )

    expect(
      getParentCacheSuppressReason({
        message: {
          usage: undefined,
        },
      } as any),
    ).toBeNull()
  })

  test('cost tracker tolerates undefined usage', async () => {
    const { addToTotalSessionCost } = await import('./cost-tracker.js')

    expect(() => {
      addToTotalSessionCost(0, undefined, 'claude-test-model')
    }).not.toThrow()
  })

  test('api success logging tolerates undefined usage', async () => {
    const { logAPISuccessAndDuration } = await import('./services/api/logging.js')

    expect(() => {
      logAPISuccessAndDuration({
        model: 'claude-test-model',
        preNormalizedModel: 'claude-test-model',
        start: Date.now(),
        startIncludingRetries: Date.now(),
        ttftMs: null,
        usage: undefined,
        attempt: 1,
        messageCount: 1,
        messageTokens: 0,
        requestId: null,
        stopReason: null,
        didFallBackToNonStreaming: false,
        querySource: 'test',
        costUSD: 0,
      })
    }).not.toThrow()
  })
})
