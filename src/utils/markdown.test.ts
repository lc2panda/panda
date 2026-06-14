import { describe, expect, test } from 'bun:test'
import { applyMarkdown } from './markdown'

// Strip ANSI color codes so assertions focus on textual content / glyphs.
const ESC = String.fromCharCode(27)
const ANSI_PATTERN = new RegExp(`${ESC}\\[[0-9;]*m`, 'g')
const stripAnsi = (s: string): string => s.replace(ANSI_PATTERN, '')

const render = (md: string): string =>
  stripAnsi(applyMarkdown(md, 'dark', null))

describe('applyMarkdown task lists', () => {
  test('renders unchecked task item with ☐ glyph', () => {
    const out = render('- [ ] todo unchecked')
    expect(out).toContain('☐ todo unchecked')
    expect(out).not.toContain('- [ ]')
  })

  test('renders checked task item with ☑ glyph', () => {
    const out = render('- [x] done checked')
    expect(out).toContain('☑ done checked')
    expect(out).not.toContain('- [x]')
  })

  test('mixed task list keeps non-task bullets and ordered numbering intact', () => {
    const out = render(
      ['- [ ] todo', '- [x] done', '- plain bullet', '', '1. first', '2. second'].join('\n'),
    )
    expect(out).toContain('☐ todo')
    expect(out).toContain('☑ done')
    expect(out).toMatch(/-\s+plain bullet/)
    expect(out).toMatch(/1\.\s+first/)
    expect(out).toMatch(/2\.\s+second/)
  })
})
