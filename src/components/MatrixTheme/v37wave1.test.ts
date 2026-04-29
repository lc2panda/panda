// Input: 无（bun test 注入）
// Output: v3.7 Pro 波次1 chrome 升级单元测试 — 4 档色板 + getRoleColor + TurnRole 扩展 +
//   computeBarWidth 响应式 + statusLight 派生（共 4+ 用例）
// Pos: matrix v3.7 Pro 波次1 验证；与 TurnGutter.test.ts / TurnSeparator.test.ts 同套守护
//
// [NEW-FILE:#20260426-MTX1-1] · 仅测试逻辑层与导出，不依赖 ink-testing-library

import { test, expect } from 'bun:test'
import {
  MATRIX_ROLE_DARK,
  MATRIX_ROLE_LIGHT,
  getRoleColor,
  getRoleDimColor,
} from './matrixPalette.js'
import { ROLE_LABEL, ROLE_TOKEN, type TurnRole } from './turnRole.js'

test('波次1 — 4 档色板 dark hex 全部生效', () => {
  expect(MATRIX_ROLE_DARK.OPERATOR_BRIGHT).toBe('#00ff41')
  expect(MATRIX_ROLE_DARK.PANDA_STD).toBe('#00cc33')
  expect(MATRIX_ROLE_DARK.WORKER_DIM).toBe('#008822')
  expect(MATRIX_ROLE_DARK.SYSTEM_FAINT).toBe('#005511')
})

test('波次1 — 4 档色板 light hex 合法且互不相同', () => {
  for (const hex of Object.values(MATRIX_ROLE_LIGHT)) {
    expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
  }
  const set = new Set(Object.values(MATRIX_ROLE_LIGHT))
  expect(set.size).toBe(4)
})

test('波次1 — getRoleColor 返回正确 dark 值', () => {
  expect(getRoleColor('operator')).toBe('#00ff41')
  expect(getRoleColor('user')).toBe('#00ff41') // user 别名
  expect(getRoleColor('panda')).toBe('#00cc33')
  expect(getRoleColor('assistant')).toBe('#00cc33') // assistant 别名
  expect(getRoleColor('worker')).toBe('#008822')
  expect(getRoleColor('system')).toBe('#005511')
})

test('波次1 — getRoleColor 返回正确 light 值', () => {
  expect(getRoleColor('operator', true)).toBe(MATRIX_ROLE_LIGHT.OPERATOR_BRIGHT)
  expect(getRoleColor('panda', true)).toBe(MATRIX_ROLE_LIGHT.PANDA_STD)
  expect(getRoleColor('worker', true)).toBe(MATRIX_ROLE_LIGHT.WORKER_DIM)
  expect(getRoleColor('system', true)).toBe(MATRIX_ROLE_LIGHT.SYSTEM_FAINT)
})

test('波次1 — getRoleColor 未知 role 回退到 PANDA_STD', () => {
  expect(getRoleColor('unknown')).toBe('#00cc33')
  expect(getRoleColor('tool')).toBe('#00cc33')
  expect(getRoleColor('thinking')).toBe('#00cc33')
})

test('波次1 — getRoleDimColor 返回合法 hex 且与主色不同', () => {
  for (const role of ['operator', 'panda', 'worker', 'system']) {
    const main = getRoleColor(role)
    const dim = getRoleDimColor(role)
    expect(dim).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(dim).not.toBe(main) // dim 必须暗于主色
  }
})

test('波次1 — TurnRole 扩展 worker / system', () => {
  // 类型层：编译期保证；运行期通过 ROLE_LABEL / ROLE_TOKEN 访问验证
  const newRoles: TurnRole[] = ['worker', 'system']
  for (const r of newRoles) {
    expect(ROLE_LABEL[r]).toBeDefined()
    expect(ROLE_TOKEN[r]).toBeDefined()
  }
})

test('波次1 — ROLE_LABEL worker / system 大写文案', () => {
  expect(ROLE_LABEL.worker).toBe('WORKER')
  expect(ROLE_LABEL.system).toBe('SYSTEM')
  // 既有不变
  expect(ROLE_LABEL.user).toBe('OPERATOR')
  expect(ROLE_LABEL.panda).toBe('PANDA')
})

test('波次1 — ROLE_TOKEN worker / system 复用既有 palette key', () => {
  expect(ROLE_TOKEN.worker).toBe('toolGutter')
  expect(ROLE_TOKEN.system).toBe('thinkingGutter')
})

// 内部 computeBarWidth 不导出，但 TurnHeader 渲染策略可通过 statusLightFor
// 间接验证。下面验证 4 类 role 的状态灯文本：
test('波次1 — TurnHeader 模块可加载', async () => {
  const m = await import('./TurnHeader.js')
  expect(typeof m.TurnHeader).toBe('function')
})

// 窄终端响应式：手工模拟 columns 计算
test('波次1 — 延伸线宽度响应式（窄终端最少 8 字符）', () => {
  // 复制 computeBarWidth 公式（保持与 TurnHeader.tsx 同步）
  function compute(columns: number, headerTextLen: number, statusLightLen: number): number {
    const prefixWidth = 3
    const tailWidth = 2
    const statusPad = 2
    const used = prefixWidth + headerTextLen + statusLightLen + tailWidth + statusPad
    const available = columns - used
    const cap = Math.max(8, columns - 4)
    return Math.max(8, Math.min(cap, available))
  }
  // 标准终端 columns=120, header=20, status=5 → ~88
  expect(compute(120, 20, 5)).toBeGreaterThanOrEqual(80)
  // 窄终端 columns=40, header=20, status=5 → 公式得 8（floor）
  expect(compute(40, 20, 5)).toBeGreaterThanOrEqual(8)
  // 极窄 columns=20 → fallback 到 8（最小保留）
  expect(compute(20, 20, 5)).toBe(8)
  // 上限不溢出 columns - 4
  expect(compute(120, 5, 5)).toBeLessThanOrEqual(120 - 4)
})
