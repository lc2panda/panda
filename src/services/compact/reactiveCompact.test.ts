// Input:  Reactive compact prompt-too-long classifier helpers
// Output: Reactive compaction is enabled and recognizes context-limit assistant errors
// Pos:    Minimal guard that reactive compact is no longer an inert stub

import { describe, expect, test } from 'bun:test'
import {
  isReactiveCompactEnabled,
  isWithheldPromptTooLong,
} from './reactiveCompact.js'

describe('reactive compact wiring', () => {
  test('is enabled for prompt/context too long recovery', () => {
    expect(isReactiveCompactEnabled()).toBe(true)
  })

  test('recognizes context window full withheld errors', () => {
    expect(
      isWithheldPromptTooLong({
        type: 'assistant',
        isApiErrorMessage: true,
        message: {
          content: [
            {
              type: 'text',
              text: 'Context window is full. Reduce conversation history, system prompt, or tools.',
            },
          ],
        },
      } as any),
    ).toBe(true)
  })
})
