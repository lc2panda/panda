/**
 * Unit tests for stringWidth.ts — ANSI stripping and width calculation
 * Covers Windows Termius edge cases (cursor control sequences)
 */

import { describe, it, expect } from 'bun:test'
import { stringWidth } from '../stringWidth.js'

describe('stringWidth — ANSI Stripping', () => {
  it('should strip basic ANSI color codes', () => {
    const str = '\x1b[31mRed Text\x1b[0m'
    expect(stringWidth(str)).toBe(8) // "Red Text"
  })

  it('should strip cursor control sequences (Windows Termius edge case)', () => {
    // \x1b[H = cursor home, \x1b[s = save cursor, \x1b[u = restore cursor
    const str = '\x1b[HHello\x1b[s World\x1b[u!'
    expect(stringWidth(str)).toBe(12) // "Hello World!"
  })

  it('should strip complex ANSI sequences with parameters', () => {
    const str = '\x1b[38;2;255;0;0mTrueColor\x1b[0m'
    expect(stringWidth(str)).toBe(9) // "TrueColor"
  })

  it('should handle mixed ANSI and visible text', () => {
    const str = '\x1b[1m\x1b[32mBold Green\x1b[0m Normal'
    expect(stringWidth(str)).toBe(17) // "Bold Green Normal" (10 + 1 space + 6)
  })

  it('should handle empty string', () => {
    expect(stringWidth('')).toBe(0)
  })

  it('should handle pure ASCII without ANSI', () => {
    expect(stringWidth('Hello World')).toBe(11)
  })

  it('should handle emoji (wide characters)', () => {
    expect(stringWidth('Hello 👋')).toBe(8) // "Hello " (6) + emoji (2)
  })

  it('should handle East Asian wide characters', () => {
    expect(stringWidth('你好')).toBe(4) // 2 wide chars = 4 columns
  })

  it('should handle zero-width joiners (emoji sequences)', () => {
    // Family emoji (man + woman + boy): U+1F468 U+200D U+1F469 U+200D U+1F466
    const family = '👨‍👩‍👦'
    // Expected: single grapheme, width 2 (emoji)
    expect(stringWidth(family)).toBe(2)
  })

  it('should handle Windows Termius residual ANSI (regression test)', () => {
    // Simulated Windows Termius output with leftover cursor sequences
    const str = '\x1b[H\x1b[2J\x1b[32mStatus:\x1b[0m Running'
    // \x1b[H = cursor home, \x1b[2J = clear screen
    expect(stringWidth(str)).toBe(15) // "Status: Running"
  })

  it('should handle ANSI with parameters (CSI sequences)', () => {
    const str = '\x1b[1;31;42mText\x1b[0m' // bold + red fg + green bg
    expect(stringWidth(str)).toBe(4) // "Text"
  })

  it('should handle control characters (non-printable)', () => {
    const str = 'Hello\x00\x01\x02World'
    // Control chars (0x00-0x1f) should not contribute to width
    expect(stringWidth(str)).toBe(10) // "HelloWorld"
  })
})
