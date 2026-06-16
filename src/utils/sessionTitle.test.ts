// Input:  buildTitleLanguageDirective / buildSessionTitlePrompt(language?)
// Output: Bun test assertions — 验证 M2 标题按对话语言生成 + language 固定语言
// Pos:    src/utils/sessionTitle.test.ts — unit tests for M2 会话标题语言
import { describe, expect, test } from 'bun:test'
import {
  buildSessionTitlePrompt,
  buildTitleLanguageDirective,
} from './sessionTitle.js'

describe('buildTitleLanguageDirective (M2)', () => {
  test('未配置 language → 跟随对话语言', () => {
    expect(buildTitleLanguageDirective()).toContain(
      'same language as the conversation',
    )
    expect(buildTitleLanguageDirective('')).toContain(
      'same language as the conversation',
    )
    expect(buildTitleLanguageDirective('   ')).toContain(
      'same language as the conversation',
    )
  })

  test('language=zh → 固定 Chinese', () => {
    expect(buildTitleLanguageDirective('zh')).toBe('Write the title in Chinese.')
    expect(buildTitleLanguageDirective('ZH')).toBe('Write the title in Chinese.')
  })

  test('language=en → 固定 English', () => {
    expect(buildTitleLanguageDirective('en')).toBe('Write the title in English.')
  })

  test('未知 language 码 → 原样使用', () => {
    expect(buildTitleLanguageDirective('xx-custom')).toBe(
      'Write the title in xx-custom.',
    )
  })
})

describe('buildSessionTitlePrompt (M2)', () => {
  test('配置 language=zh 时 prompt 含中文指令', () => {
    const p = buildSessionTitlePrompt('zh')
    expect(p).toContain('Write the title in Chinese.')
    // 仍保留原始标题生成规则
    expect(p).toContain('concise, sentence-case title')
  })

  test('未配置 language 时 prompt 含跟随对话语言指令', () => {
    const p = buildSessionTitlePrompt()
    expect(p).toContain('same language as the conversation')
    expect(p).not.toContain('Write the title in Chinese.')
  })

  test('两种模式都返回非空合法 prompt', () => {
    expect(buildSessionTitlePrompt('en').length).toBeGreaterThan(50)
    expect(buildSessionTitlePrompt().length).toBeGreaterThan(50)
  })
})
