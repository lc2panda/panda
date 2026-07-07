// Input:  API error assistant messages containing context/prompt-too-long text
// Output: Prompt/context too long classifier remains backward-compatible and catches upstream context-window-full text
// Pos:    API error normalization guard for reactive compaction

import { describe, expect, test } from 'bun:test'
import { isPromptTooLongMessage } from './errors.js'

function assistantApiError(text: string): any {
  return {
    type: 'assistant',
    isApiErrorMessage: true,
    message: {
      content: [{ type: 'text', text }],
    },
  }
}

describe('prompt/context too long detection', () => {
  test('keeps Prompt is too long compatibility', () => {
    expect(isPromptTooLongMessage(assistantApiError('Prompt is too long: 200000 tokens'))).toBe(true)
  })

  test('detects upstream context window full wording', () => {
    expect(
      isPromptTooLongMessage(
        assistantApiError(
          'API Error: 400 {"error":{"message":"Context window is full. Reduce conversation history, system prompt, or tools."}}',
        ),
      ),
    ).toBe(true)
  })
})
