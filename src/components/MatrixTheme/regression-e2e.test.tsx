// Input: 无（运行 bun test 时由 Bun 注入）
// Output: Matrix 主题端到端 regression — 全组件 import 烟囱 + isMatrixTheme env 三分支 + usage 边界守护
// Pos: W13-T3 Matrix regression 加固落点；与 MatrixHUD.test.ts (W11) / TurnGutter.test.ts (T0) 互补
//
// [NEW-FILE:#W13-03]
// 设计目标：W13-T3 — 在以下 3 类回归点设栅栏，避免 Matrix 主题被以下退化打破：
//   1) 全 Matrix 组件 import 不抛错（messages=[] / undefined / 缺字段三场景）
//   2) MatrixHUD / MatrixBanner / MatrixSpinner / MatrixCharRain / WelcomeCard 各自 smoke
//   3) isMatrixTheme env 三分支 (unset / light / dark)
//   4) safeUsage 在各种 raw 边界（null / undefined / 缺 input_tokens / 缺 output_tokens / 非对象）下不抛
//
// 测试策略与 TurnGutter.test.ts / MatrixHUD.test.ts 一致：
//   - 不依赖 ink-testing-library（Windows 兼容性差）
//   - 只检测 import 可用 + 函数签名正确 + 关键 helper 行为正确
//   - 用 safeUsage / getCurrentUsage 做"无 React tree 调用"边界

import { test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { safeUsage, safeUsageTotal } from '../../utils/usage-safe.js'
import { getCurrentUsage } from '../../utils/tokens.js'
import type { Message } from '../../types/message.js'

// W13-T3: globalThis prefetch 缓存清理 + isolate 用户 ~/.pandacc.json
const _gt = globalThis as unknown as {
  __PANDA_IS_MATRIX_PREFETCH?: boolean
}

let originalTheme: string | undefined
let originalConfigDir: string | undefined
let originalClaudeConfigDir: string | undefined
let isolatedDir: string

beforeEach(() => {
  originalTheme = process.env.PANDA_THEME
  originalConfigDir = process.env.PANDA_CONFIG_DIR
  originalClaudeConfigDir = process.env.CLAUDE_CONFIG_DIR
  isolatedDir = mkdtempSync(join(tmpdir(), 'matrix-regression-'))
  process.env.PANDA_CONFIG_DIR = isolatedDir
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

// ─────────────────────────────────────────────────────────────────────
// 1) Matrix 组件 import smoke
// ─────────────────────────────────────────────────────────────────────

test('imports — MatrixHUD 可加载且导出 function', async () => {
  const m = await import('./MatrixHUD.js')
  expect(typeof m.MatrixHUD).toBe('function')
})

test('imports — MatrixBanner 可加载且导出 function', async () => {
  const m = await import('./MatrixBanner.js')
  expect(typeof m.MatrixBanner).toBe('function')
})

test('imports — MatrixSpinner 可加载且导出 function', async () => {
  const m = await import('./MatrixSpinner.js')
  expect(typeof m.MatrixSpinner).toBe('function')
})

test('imports — MatrixCharRain 可加载且导出 function', async () => {
  const m = await import('./MatrixCharRain.js')
  expect(typeof m.MatrixCharRain).toBe('function')
})

test('imports — WelcomeCard 可加载且导出 function', async () => {
  const m = await import('./WelcomeCard.js')
  expect(typeof m.WelcomeCard).toBe('function')
})

test('imports — MatrixBootSequence 可加载且导出 function', async () => {
  const m = await import('./MatrixBootSequence.js')
  expect(typeof m.MatrixBootSequence).toBe('function')
})

test('imports — TurnHeader / TurnGutter / ScanLine 可加载', async () => {
  const h = await import('./TurnHeader.js')
  const g = await import('./TurnGutter.js')
  const s = await import('./ScanLine.js')
  expect(typeof h.TurnHeader).toBe('function')
  expect(typeof g.TurnGutter).toBe('function')
  expect(typeof s.ScanLine).toBe('function')
})

// ─────────────────────────────────────────────────────────────────────
// 2) isMatrixTheme env 三分支
// ─────────────────────────────────────────────────────────────────────

test('isMatrixTheme — env 未设置 + isolate user config → false', async () => {
  delete process.env.PANDA_THEME
  const { isMatrixTheme } = await import('./isMatrixTheme.js')
  expect(isMatrixTheme()).toBe(false)
})

test('isMatrixTheme — env=matrix → true', async () => {
  process.env.PANDA_THEME = 'matrix'
  const { isMatrixTheme } = await import('./isMatrixTheme.js')
  expect(isMatrixTheme()).toBe(true)
})

test('isMatrixTheme — env=light → false（禁止 user config 污染）', async () => {
  process.env.PANDA_THEME = 'light'
  const { isMatrixTheme } = await import('./isMatrixTheme.js')
  expect(isMatrixTheme()).toBe(false)
})

test('isMatrixTheme — env=dark → false（禁止 user config 污染）', async () => {
  process.env.PANDA_THEME = 'dark'
  const { isMatrixTheme } = await import('./isMatrixTheme.js')
  expect(isMatrixTheme()).toBe(false)
})

// ─────────────────────────────────────────────────────────────────────
// 3) usage 边界 — getCurrentUsage / safeUsage 各路径都不抛
// ─────────────────────────────────────────────────────────────────────

test('getCurrentUsage — 空数组 → null（首次启动场景）', () => {
  expect(getCurrentUsage([])).toBeNull()
})

test('getCurrentUsage — 全 user message 无 usage → null', () => {
  const msgs: Message[] = [
    {
      type: 'user',
      uuid: 'u1',
      message: { role: 'user', content: 'hi' },
    } as unknown as Message,
  ]
  expect(getCurrentUsage(msgs)).toBeNull()
})

test('safeUsage — null/undefined/非对象/空对象/缺字段 全部不抛 + 返 number', () => {
  for (const raw of [null, undefined, 0, '', 'abc', [], {}, NaN, true]) {
    const u = safeUsage(raw)
    expect(typeof u.input_tokens).toBe('number')
    expect(typeof u.output_tokens).toBe('number')
    expect(typeof u.cache_creation_input_tokens).toBe('number')
    expect(typeof u.cache_read_input_tokens).toBe('number')
    expect(Number.isFinite(u.input_tokens)).toBe(true)
    expect(Number.isFinite(u.output_tokens)).toBe(true)
  }
})

test('safeUsage — 缺 input_tokens 字段 → 0 fallback', () => {
  const u = safeUsage({ output_tokens: 100 })
  expect(u.input_tokens).toBe(0)
  expect(u.output_tokens).toBe(100)
  expect(u.cache_read_input_tokens).toBe(0)
})

test('safeUsage — 缺 output_tokens 字段 → 0 fallback', () => {
  const u = safeUsage({ input_tokens: 50 })
  expect(u.input_tokens).toBe(50)
  expect(u.output_tokens).toBe(0)
})

test('safeUsage — 字符串数字字段 → 转 number', () => {
  const u = safeUsage({
    input_tokens: '100',
    output_tokens: '50',
    cache_read_input_tokens: '20',
  })
  expect(u.input_tokens).toBe(100)
  expect(u.output_tokens).toBe(50)
  expect(u.cache_read_input_tokens).toBe(20)
})

test('safeUsage — 非 finite (NaN/Infinity) 字段 → 0 fallback', () => {
  const u = safeUsage({
    input_tokens: NaN,
    output_tokens: Infinity,
    cache_read_input_tokens: -Infinity,
  })
  expect(u.input_tokens).toBe(0)
  expect(u.output_tokens).toBe(0)
  expect(u.cache_read_input_tokens).toBe(0)
})

test('safeUsageTotal — null raw → 0', () => {
  expect(safeUsageTotal(null)).toBe(0)
  expect(safeUsageTotal(undefined)).toBe(0)
})

test('safeUsageTotal — 完整 usage → 四字段相加', () => {
  const total = safeUsageTotal({
    input_tokens: 10,
    output_tokens: 20,
    cache_creation_input_tokens: 5,
    cache_read_input_tokens: 3,
  })
  expect(total).toBe(38)
})

// ─────────────────────────────────────────────────────────────────────
// 4) Matrix 组件不依赖 React tree 的 helper 调用 — 不抛
// ─────────────────────────────────────────────────────────────────────

test('useMatrixUI — Matrix=matrix 返回 dark UI 对象', async () => {
  process.env.PANDA_THEME = 'matrix'
  delete _gt.__PANDA_IS_MATRIX_PREFETCH
  const { useMatrixUI } = await import('../../hooks/useMatrixUI.js')
  const ui = useMatrixUI()
  expect(ui).toBeTruthy()
  expect(typeof ui.toolGutter).toBe('string')
})

test('matrixPalette — MATRIX_UI / MATRIX_UI_LIGHT 都导出', async () => {
  const m = await import('./matrixPalette.js')
  expect(m.MATRIX_UI).toBeTruthy()
  expect(m.MATRIX_UI_LIGHT).toBeTruthy()
  expect(typeof m.MATRIX_UI.statusLine).toBe('string')
})

test('isMatrixDark / isMatrixLight — env=light 不是 matrix → 都 false', async () => {
  process.env.PANDA_THEME = 'light'
  const { isMatrixDark, isMatrixLight } = await import('./isMatrixTheme.js')
  expect(isMatrixDark()).toBe(false)
  expect(isMatrixLight()).toBe(false)
})
