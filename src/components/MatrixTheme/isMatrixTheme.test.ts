import { test, expect, beforeEach, afterEach } from 'bun:test'
import { isMatrixTheme } from './isMatrixTheme.js'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let originalTheme: string | undefined
let originalConfigDir: string | undefined
let originalClaudeConfigDir: string | undefined
let isolatedDir: string

// W13-T3 修复：globalThis prefetch 缓存 + cachedTheme 模块级缓存需在每个 test 前清空，
// 且必须 isolate 用户 ~/.pandacc.json（用户已 theme=matrix 会污染 "未设置返回 false" 用例）。
const _gt = globalThis as unknown as {
  __PANDA_IS_MATRIX_PREFETCH?: boolean
}

beforeEach(() => {
  originalTheme = process.env.PANDA_THEME
  originalConfigDir = process.env.PANDA_CONFIG_DIR
  originalClaudeConfigDir = process.env.CLAUDE_CONFIG_DIR
  // isolate 用户 config — 指向空临时目录，确保读不到 .config.json
  isolatedDir = mkdtempSync(join(tmpdir(), 'isMatrixTheme-test-'))
  process.env.PANDA_CONFIG_DIR = isolatedDir
  // 清掉所有缓存层，让函数重新走 env / fs 路径
  delete _gt.__PANDA_IS_MATRIX_PREFETCH
})

afterEach(() => {
  if (originalTheme === undefined) {
    delete process.env.PANDA_THEME
  } else {
    process.env.PANDA_THEME = originalTheme
  }
  if (originalConfigDir === undefined) {
    delete process.env.PANDA_CONFIG_DIR
  } else {
    process.env.PANDA_CONFIG_DIR = originalConfigDir
  }
  if (originalClaudeConfigDir === undefined) {
    delete process.env.CLAUDE_CONFIG_DIR
  } else {
    process.env.CLAUDE_CONFIG_DIR = originalClaudeConfigDir
  }
  try {
    rmSync(isolatedDir, { recursive: true, force: true })
  } catch {
    // ignore
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
