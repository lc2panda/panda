// Input:  API error assistant messages containing context/prompt-too-long text + media-size error getters
// Output: Prompt/context too long classifier remains backward-compatible; media-size errors are bilingual with dual strip keys
// Pos:    API error normalization guard for reactive compaction + document/image strip compatibility

import { describe, expect, test } from 'bun:test'
import {
  getImageTooLargeErrorMessage,
  getMediaSizeErrorStripMap,
  getPdfInvalidErrorMessage,
  getPdfPasswordProtectedErrorMessage,
  getPdfTooLargeErrorMessage,
  getRequestTooLargeErrorMessage,
  isPromptTooLongMessage,
} from './errors.js'

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

describe('media size error i18n + strip-map dual registration', () => {
  test('strip map registers both English and Chinese for every size error class', () => {
    const map = getMediaSizeErrorStripMap()
    const keys = Object.keys(map)

    // EN
    expect(keys.some(k => k.startsWith('PDF too large'))).toBe(true)
    expect(keys.some(k => k.startsWith('PDF is password protected'))).toBe(true)
    expect(keys.some(k => k.startsWith('The PDF file was not valid'))).toBe(true)
    expect(keys.some(k => k.startsWith('Image was too large'))).toBe(true)
    expect(keys.some(k => k.startsWith('Request too large'))).toBe(true)

    // ZH
    expect(keys.some(k => k.startsWith('PDF 过大'))).toBe(true)
    expect(keys.some(k => k.startsWith('PDF 已加密'))).toBe(true)
    expect(keys.some(k => k.startsWith('PDF 文件无效'))).toBe(true)
    expect(keys.some(k => k.startsWith('图片过大'))).toBe(true)
    expect(keys.some(k => k.startsWith('请求过大'))).toBe(true)

    // Exactly 10 keys: 5 error classes × 2 locales
    expect(keys).toHaveLength(10)
  })

  test('strip map maps request-too-large to both document and image', () => {
    const map = getMediaSizeErrorStripMap()
    const enKey = Object.keys(map).find(k => k.startsWith('Request too large'))!
    const zhKey = Object.keys(map).find(k => k.startsWith('请求过大'))!
    expect([...map[enKey]!].sort()).toEqual(['document', 'image'])
    expect([...map[zhKey]!].sort()).toEqual(['document', 'image'])
  })

  test('locale-aware getters resolve to a registered strip key', () => {
    const map = getMediaSizeErrorStripMap()
    for (const msg of [
      getPdfTooLargeErrorMessage(),
      getPdfPasswordProtectedErrorMessage(),
      getPdfInvalidErrorMessage(),
      getImageTooLargeErrorMessage(),
      getRequestTooLargeErrorMessage(),
    ]) {
      expect(map[msg]).toBeDefined()
    }
  })

  test('English request-too-large keeps max size and esc hint when interactive', () => {
    // Non-interactive vs interactive is environment-dependent; assert stable EN substrings
    // that always appear in the EN strip-map entry regardless of session mode.
    const enKey = Object.keys(getMediaSizeErrorStripMap()).find(k =>
      k.startsWith('Request too large'),
    )!
    expect(enKey).toContain('max 20MB')
    // Either interactive or non-interactive EN hint
    expect(
      enKey.includes('Double press esc') || enKey.includes('Try with a smaller file'),
    ).toBe(true)
  })

  test('Chinese request-too-large mentions session context and size', () => {
    const zhKey = Object.keys(getMediaSizeErrorStripMap()).find(k =>
      k.startsWith('请求过大'),
    )!
    expect(zhKey).toContain('最大 20MB')
    expect(zhKey).toContain('含会话上下文')
  })
})
