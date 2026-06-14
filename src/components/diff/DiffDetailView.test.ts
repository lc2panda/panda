import { describe, expect, test } from 'bun:test'
import { clampOffset } from './DiffDetailView.js'

describe('DiffDetailView scroll offset clamping', () => {
  // maxOffset = total lines - viewport height. With 100 lines in a 20-row
  // viewport the bottom-most valid offset is 80.
  const maxOffset = 80

  test('top boundary: never scrolls above 0', () => {
    expect(clampOffset(-1, maxOffset)).toBe(0)
    expect(clampOffset(-50, maxOffset)).toBe(0)
    expect(clampOffset(0, maxOffset)).toBe(0)
  })

  test('bottom boundary: never scrolls past maxOffset', () => {
    expect(clampOffset(81, maxOffset)).toBe(maxOffset)
    expect(clampOffset(9999, maxOffset)).toBe(maxOffset)
    expect(clampOffset(maxOffset, maxOffset)).toBe(maxOffset)
  })

  test('within range: returns value unchanged', () => {
    expect(clampOffset(1, maxOffset)).toBe(1)
    expect(clampOffset(40, maxOffset)).toBe(40)
    expect(clampOffset(79, maxOffset)).toBe(79)
  })

  test('content shorter than viewport: maxOffset 0 pins to top', () => {
    expect(clampOffset(5, 0)).toBe(0)
    expect(clampOffset(-5, 0)).toBe(0)
    expect(clampOffset(0, 0)).toBe(0)
  })

  test('page-jump arithmetic stays in bounds at both ends', () => {
    const viewport = 20
    // PgDn from near the end clamps to maxOffset rather than overshooting.
    expect(clampOffset(75 + viewport, maxOffset)).toBe(maxOffset)
    // PgUp from near the top clamps to 0 rather than going negative.
    expect(clampOffset(5 - viewport, maxOffset)).toBe(0)
  })
})
