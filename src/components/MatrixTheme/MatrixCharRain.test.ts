import { expect, test } from 'bun:test'
import { getSetSize, KATAKANA, MIXED, pickChar } from './matrixCharSets.js'
import {
  ageToHex,
  getColorByAge,
  MATRIX_COLORS,
  toHex,
} from './matrixPalette.js'

test('matrixCharSets — KATAKANA 非空', () => {
  expect(KATAKANA.length).toBeGreaterThan(40)
})

test('matrixCharSets — MIXED 包含所有子集', () => {
  expect(MIXED.length).toBeGreaterThan(KATAKANA.length)
})

test('pickChar — 默认 mixed', () => {
  const c = pickChar()
  expect(typeof c).toBe('string')
  expect(c.length).toBeGreaterThan(0)
})

test('pickChar — 用确定 RNG 可复现', () => {
  const fakeRng = () => 0 // 总是返回第一个字符
  const c = pickChar('katakana', fakeRng)
  expect(c).toBe(KATAKANA[0])
})

test('getSetSize — 各集合大小', () => {
  expect(getSetSize('katakana')).toBe(KATAKANA.length)
  expect(getSetSize('digits')).toBe(10)
})

test('matrixPalette — getColorByAge 边界', () => {
  const head = getColorByAge(0)
  expect(head.r).toBe(MATRIX_COLORS.HEAD.r)
  expect(head.g).toBe(MATRIX_COLORS.HEAD.g)

  const fade = getColorByAge(1)
  expect(fade.r).toBe(MATRIX_COLORS.FADE.r)
})

test('matrixPalette — 中段插值连续性', () => {
  const c1 = getColorByAge(0.3)
  const c2 = getColorByAge(0.31)
  // 连续插值，相邻 age 颜色差应该很小
  expect(Math.abs(c1.g - c2.g)).toBeLessThan(20)
})

test('matrixPalette — toHex 格式', () => {
  expect(toHex({ r: 0, g: 255, b: 65 })).toBe('#00ff41')
  expect(toHex({ r: 200, g: 255, b: 200 })).toBe('#c8ffc8')
})

test('matrixPalette — ageToHex 与 getColorByAge 一致', () => {
  for (let a = 0; a <= 1; a += 0.1) {
    const hex = ageToHex(a)
    const rgb = getColorByAge(a)
    expect(hex).toBe(toHex(rgb))
  }
})

test('matrixPalette — out-of-range age 钳位', () => {
  expect(getColorByAge(-0.5)).toEqual(getColorByAge(0))
  expect(getColorByAge(1.5)).toEqual(getColorByAge(1))
})
