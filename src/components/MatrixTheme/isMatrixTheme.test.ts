import { test, expect, beforeEach, afterEach } from 'bun:test'
import { isMatrixTheme } from './isMatrixTheme.js'

let originalTheme: string | undefined

beforeEach(() => {
  originalTheme = process.env.PANDA_THEME
})

afterEach(() => {
  if (originalTheme === undefined) {
    delete process.env.PANDA_THEME
  } else {
    process.env.PANDA_THEME = originalTheme
  }
})

test('isMatrixTheme — env 未设置返回 false', () => {
  delete process.env.PANDA_THEME
  expect(isMatrixTheme()).toBe(false)
})

test('isMatrixTheme — env=matrix 返回 true', () => {
  process.env.PANDA_THEME = 'matrix'
  expect(isMatrixTheme()).toBe(true)
})

test('isMatrixTheme — env=light 返回 false', () => {
  process.env.PANDA_THEME = 'light'
  expect(isMatrixTheme()).toBe(false)
})

test('isMatrixTheme — env=dark 返回 false', () => {
  process.env.PANDA_THEME = 'dark'
  expect(isMatrixTheme()).toBe(false)
})
