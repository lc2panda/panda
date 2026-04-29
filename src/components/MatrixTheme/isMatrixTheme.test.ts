import { test, expect, beforeEach, afterEach } from 'bun:test'
import {
  isMatrixTheme,
  setMatrixThemeCache,
  _resetMatrixThemeCacheForTest,
} from './isMatrixTheme.js'
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
  // （Comdr #4 fix 2026-04-26 引入 setMatrixThemeCache 后，跨 test 残留更明显）
  _resetMatrixThemeCacheForTest()
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

// Comdr #4 (2026-04-26): /theme 热切修复 — prefetch 缓存可被 setMatrixThemeCache 主动刷新
test('setMatrixThemeCache — 切到非 matrix 后 prefetch 不再返回 true', () => {
  // 模拟启动时 .pandacc.json=matrix → prefetch=true
  delete process.env.PANDA_THEME
  setMatrixThemeCache(true)
  expect(isMatrixTheme()).toBe(true)
  // 用户 /theme dark：env 删除（已是 undefined） + prefetch 刷新 false
  setMatrixThemeCache(false)
  expect(isMatrixTheme()).toBe(false)
})

test('setMatrixThemeCache — 切到 matrix 后 prefetch=true 即使 env 未设', () => {
  delete process.env.PANDA_THEME
  setMatrixThemeCache(false)
  expect(isMatrixTheme()).toBe(false)
  // 用户 /theme matrix：env=matrix + prefetch=true
  setMatrixThemeCache(true)
  expect(isMatrixTheme()).toBe(true)
})

test('setMatrixThemeCache — env 显式设置时优先级最高（覆盖 prefetch）', () => {
  // prefetch=false 但 env=matrix → 仍返回 true（env 优先）
  setMatrixThemeCache(false)
  process.env.PANDA_THEME = 'matrix'
  expect(isMatrixTheme()).toBe(true)
  // prefetch=true 但 env=dark → 仍返回 false（env 优先）
  setMatrixThemeCache(true)
  process.env.PANDA_THEME = 'dark'
  expect(isMatrixTheme()).toBe(false)
})
