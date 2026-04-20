// Input: 无（运行 bun test 时由 Bun 注入）
// Output: TurnGutter / TurnHeader / TurnGutterContext / palette token 的 smoke 测试
// Pos: T0 地基交付物，验证 palette 4 新 token 与组件可被正常导入实例化
//
// 注意：避免依赖 ink-testing-library，本文件只检测：
// 1) palette 4 新 token 都存在且有合法 hex
// 2) 3 个共享 hooks 都可被 import（运行期不试图调用 React hooks）
// 3) TurnGutter / TurnHeader / TurnGutterContext 可被 import 且导出正确

import { test, expect, beforeEach, afterEach } from 'bun:test'
import { MATRIX_UI, MATRIX_UI_LIGHT } from './matrixPalette.js'

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

test('palette — MATRIX_UI 4 新 token 都为合法 hex', () => {
  for (const k of [
    'userGutter',
    'pandaGutter',
    'toolGutter',
    'thinkingGutter',
  ] as const) {
    expect(MATRIX_UI[k]).toMatch(/^#[0-9A-Fa-f]{6}$/)
  }
})

test('palette — MATRIX_UI_LIGHT 4 新 token 都为合法 hex', () => {
  for (const k of [
    'userGutter',
    'pandaGutter',
    'toolGutter',
    'thinkingGutter',
  ] as const) {
    expect(MATRIX_UI_LIGHT[k]).toMatch(/^#[0-9A-Fa-f]{6}$/)
  }
})

test('palette — 4 token 互不相同（dark）', () => {
  const set = new Set([
    MATRIX_UI.userGutter,
    MATRIX_UI.pandaGutter,
    MATRIX_UI.toolGutter,
    MATRIX_UI.thinkingGutter,
  ])
  expect(set.size).toBe(4)
})

test('imports — TurnGutter / TurnHeader / TurnGutterContext 可加载', async () => {
  const g = await import('./TurnGutter.js')
  const h = await import('./TurnHeader.js')
  const c = await import('./TurnGutterContext.js')
  expect(typeof g.TurnGutter).toBe('function')
  expect(typeof h.TurnHeader).toBe('function')
  expect(typeof c.TurnGutterProvider).toBe('function')
  expect(typeof c.useTurnRole).toBe('function')
})

test('imports — 3 个共享 hooks 可加载', async () => {
  const a = await import('../../hooks/useFlashOnce.js')
  const b = await import('../../hooks/usePhosphorFadeIn.js')
  const c = await import('../../hooks/useMatrixUI.js')
  expect(typeof a.useFlashOnce).toBe('function')
  expect(typeof b.usePhosphorFadeIn).toBe('function')
  expect(typeof c.useMatrixUI).toBe('function')
})

test('useMatrixUI — Matrix 主题返回 dark UI（默认）', async () => {
  process.env.PANDA_THEME = 'matrix'
  // 直接调用（不在 React tree 中），useMatrixUI 内部不实际用 useState/useEffect
  const { useMatrixUI } = await import('../../hooks/useMatrixUI.js')
  const ui = useMatrixUI()
  // dark 模式下 toolGutter = MATRIX_SCALE.BRIGHT
  expect(ui.toolGutter).toBe(MATRIX_UI.toolGutter)
})
