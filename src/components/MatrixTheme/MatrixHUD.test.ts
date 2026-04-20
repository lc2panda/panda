// Input: 无（运行 bun test 时由 Bun 注入）
// Output: MatrixHUD null-usage P0 regression — 验证 getCurrentUsage 返 null 时 HUD 不抛 "null is not an object"
// Pos: T-D1 footer 守护回归测试，对应 P0 hotfix #20260420 (Mac CLI v2.25.x 实测崩溃)
//
// 测试策略（与 TurnGutter.test.ts 一致，避免 ink-testing-library）：
// 1) 前置条件：getCurrentUsage([]) 返 null（首次启动 / 无 API call 之前）
// 2) 前置条件：getCurrentUsage([不带 usage 的 message]) 返 null
// 3) import smoke：MatrixHUD 模块可加载，导出 function
// 4) 源码级守护：MatrixHUD.tsx 含 `usage?.input_tokens` 守护表达式（防止回归）
// 5) 源码级守护：禁止裸 `usage.input_tokens` / `usage.output_tokens`（除注释外）

import { test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { getCurrentUsage } from '../../utils/tokens.js'
import type { Message } from '../../types/message.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const matrixHudSource = readFileSync(
  join(__dirname, 'MatrixHUD.tsx'),
  'utf8',
)

test('getCurrentUsage — 空 messages[] 返 null（P0 触发条件）', () => {
  expect(getCurrentUsage([])).toBeNull()
})

test('getCurrentUsage — 无 assistant usage 的 messages 返 null', () => {
  const userMsgs: Message[] = [
    {
      type: 'user',
      uuid: 'test-uuid-1',
      message: { role: 'user', content: 'hi' },
    } as unknown as Message,
  ]
  expect(getCurrentUsage(userMsgs)).toBeNull()
})

test('imports — MatrixHUD 可加载且导出 function', async () => {
  const m = await import('./MatrixHUD.js')
  expect(typeof m.MatrixHUD).toBe('function')
})

test('源码守护 — MatrixHUD 用 ?? 0 守护 input_tokens（P0 修复存在）', () => {
  expect(matrixHudSource).toMatch(/usage\?\.input_tokens\s*\?\?\s*0/)
  expect(matrixHudSource).toMatch(/usage\?\.output_tokens\s*\?\?\s*0/)
})

test('源码守护 — MatrixHUD 不含裸 usage.input_tokens / usage.output_tokens（除注释/字符串外）', () => {
  // 移除单行注释与块注释，再扫裸访问
  const stripped = matrixHudSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
  // 任何 `usage.input_tokens` / `usage.output_tokens` 不允许（必须 ?. 或 ?? 守护）
  expect(stripped).not.toMatch(/[^.?]usage\.input_tokens/)
  expect(stripped).not.toMatch(/[^.?]usage\.output_tokens/)
})

test('源码守护 — usage===null 时 ctxStr 跳过（避免渲染 0/200k 空 ctx）', () => {
  // 必须含 `usage && ctxMax > 0` 复合守护
  expect(matrixHudSource).toMatch(/usage\s*&&\s*ctxMax\s*>\s*0/)
})
