// Input: 无（bun test 运行）
// Output: TurnSeparator 组件 smoke 测试 — 验证模块可 import 且返回函数
// Pos: v3 P10 验证 — 与 TurnGutter.test.ts 同套守护 chrome 地基
//
// [NEW-FILE:#20260418-25]

import { test, expect } from 'bun:test'

test('TurnSeparator — 模块可加载且 export 函数', async () => {
  const m = await import('./TurnSeparator.js')
  expect(typeof m.TurnSeparator).toBe('function')
})

test('turnRole — ROLE_LABEL 升级为 OPERATOR/PANDA', async () => {
  const { ROLE_LABEL } = await import('./turnRole.js')
  expect(ROLE_LABEL.user).toBe('OPERATOR')
  expect(ROLE_LABEL.panda).toBe('PANDA')
  expect(ROLE_LABEL.tool).toBe('tool')
  expect(ROLE_LABEL.thinking).toBe('thinking')
})

test('turnRole — ROLE_TOKEN 映射到正确的 palette key', async () => {
  const { ROLE_TOKEN } = await import('./turnRole.js')
  expect(ROLE_TOKEN.user).toBe('userGutter')
  expect(ROLE_TOKEN.panda).toBe('pandaGutter')
  expect(ROLE_TOKEN.tool).toBe('toolGutter')
  expect(ROLE_TOKEN.thinking).toBe('thinkingGutter')
})

test('palette — v3 新 token 存在且合法', async () => {
  const { MATRIX_UI, MATRIX_UI_LIGHT, MATRIX_BREATH_PULSE, MATRIX_BREATH_PULSE_LIGHT } =
    await import('./matrixPalette.js')
  expect(MATRIX_UI.userBg).toMatch(/^#[0-9A-Fa-f]{6}$/)
  expect(MATRIX_UI.roleSeparator).toMatch(/^#[0-9A-Fa-f]{6}$/)
  expect(MATRIX_UI_LIGHT.userBg).toMatch(/^#[0-9A-Fa-f]{6}$/)
  expect(MATRIX_UI_LIGHT.roleSeparator).toMatch(/^#[0-9A-Fa-f]{6}$/)
  expect(MATRIX_BREATH_PULSE.length).toBe(4)
  expect(MATRIX_BREATH_PULSE_LIGHT.length).toBe(4)
})

test('usePhosphorBreath — hook 可 import 且为函数', async () => {
  const m = await import('../../hooks/usePhosphorBreath.js')
  expect(typeof m.usePhosphorBreath).toBe('function')
})
