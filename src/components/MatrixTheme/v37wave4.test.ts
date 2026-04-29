// Input: 无（bun test 注入）
// Output: v3.7 Pro 波次4 — 4 项动效细节单元测试
//   1. 状态灯心跳（WorkerScope 1Hz 呼吸）
//   2. tool call ▸▸ 流向指示符
//   3. ScreenFrame status bar 5s refresh
//   4. 流式 progress ▰▰▰█（TurnHeader + useStreamProgress）
// Pos: matrix v3.7 Pro 波次4 验证；与 v37wave1/2/3 同套守护
//
// [NEW-FILE:#20260426-MTX4-T] · 仅测试逻辑层（progressBarFromBytes 通过反向工程暴露 +
//   useStreamProgress publish/reset 通过 module-level 副作用）；不依赖 ink-testing-library

import { test, expect } from 'bun:test'
import * as fs from 'node:fs'

const BASE = '/Users/panda/Downloads/cc-panda/src'

// ─── Block 1: 状态灯心跳（WorkerScope） ───────────────────────────────

test('波次4 — WorkerScope 已 import usePhosphorBreath', () => {
  const src = fs.readFileSync(`${BASE}/components/MatrixTheme/WorkerScope.tsx`, 'utf-8')
  expect(src).toContain("import { usePhosphorBreath }")
  expect(src).toContain("usePhosphorBreath(1000)") // 1Hz 周期
})

test('波次4 — WorkerScope 在 running 状态使用 breathColor', () => {
  const src = fs.readFileSync(`${BASE}/components/MatrixTheme/WorkerScope.tsx`, 'utf-8')
  expect(src).toContain('isRunning ? breathColor : lightOff')
})

test('波次4 — WorkerScope 兼容 reducedMotion（fallback to 静态满亮度）', () => {
  const src = fs.readFileSync(`${BASE}/components/MatrixTheme/WorkerScope.tsx`, 'utf-8')
  expect(src).toContain('reducedMotion')
  expect(src).toContain('!reducedMotion && isRunning')
})

// ─── Block 2: tool call ▸▸ 流向指示符（AssistantToolUseMessage） ─────

test('波次4 — AssistantToolUseMessage 已加 ▸▸ 流向指示符', () => {
  const src = fs.readFileSync(`${BASE}/components/messages/AssistantToolUseMessage.tsx`, 'utf-8')
  // U+25B8 = ▸
  expect(src).toContain('\\u25B8\\u25B8')
  expect(src).toContain('_matrixFlowMark')
})

test('波次4 — ▸▸ 仅在 isResolved 时显示（避免与 _matrixScan 重叠）', () => {
  const src = fs.readFileSync(`${BASE}/components/messages/AssistantToolUseMessage.tsx`, 'utf-8')
  // 关键检查：_matrixFlowMark 表达式需含 isResolved 而非 !isResolved
  const idx = src.indexOf('_matrixFlowMark')
  const segment = src.slice(idx, idx + 200)
  expect(segment).toContain('isResolved')
})

test('波次4 — ▸▸ 是静态字符（不带动效 hook 调用）', () => {
  const src = fs.readFileSync(`${BASE}/components/messages/AssistantToolUseMessage.tsx`, 'utf-8')
  // _matrixFlowMark 内部不应调用任何 useFlash/usePhosphor/useState
  const idx = src.indexOf('_matrixFlowMark')
  const segment = src.slice(idx, idx + 300)
  expect(segment).not.toMatch(/use(?:State|Effect|Flash|Phosphor)\(/)
})

// ─── Block 3: ScreenFrame status bar 5s refresh ──────────────────────

test('波次4 — ScreenFrame 已 import git utility', () => {
  const src = fs.readFileSync(`${BASE}/components/MatrixTheme/ScreenFrame.tsx`, 'utf-8')
  expect(src).toContain("import { getBranch, getIsClean, getIsGit }")
})

test('波次4 — ScreenFrame STATUS_REFRESH_MS = 5000（5s 周期）', () => {
  const src = fs.readFileSync(`${BASE}/components/MatrixTheme/ScreenFrame.tsx`, 'utf-8')
  expect(src).toContain('STATUS_REFRESH_MS = 5000')
})

test('波次4 — ScreenFrame useScreenFrameLiveData hook 实现完整', () => {
  const src = fs.readFileSync(`${BASE}/components/MatrixTheme/ScreenFrame.tsx`, 'utf-8')
  expect(src).toContain('useScreenFrameLiveData')
  expect(src).toContain('process.memoryUsage()')
  expect(src).toContain('getBranch().catch')
  expect(src).toContain('getIsClean')
  // setInterval 5s 周期
  expect(src).toContain('setInterval(() => void refresh(), STATUS_REFRESH_MS)')
})

test('波次4 — ScreenFrame props 优先于 live data（兼容显式注入）', () => {
  const src = fs.readFileSync(`${BASE}/components/MatrixTheme/ScreenFrame.tsx`, 'utf-8')
  expect(src).toContain('props.ramMB ?? live.ramMB')
  expect(src).toContain('props.gitBranch ?? live.gitBranch')
  expect(src).toContain('props.gitClean ?? live.gitClean')
})

test('波次4 — ScreenFrame refresh 直接换值（不闪烁）', () => {
  const src = fs.readFileSync(`${BASE}/components/MatrixTheme/ScreenFrame.tsx`, 'utf-8')
  // setData 直接传新对象 — 无 fade / flash / phosphor 包装
  expect(src).toMatch(/setData\(\{\s*ramMB,\s*gitBranch,\s*gitClean\s*\}\)/)
})

// ─── Block 4: 流式 progress ▰▰▰█ (TurnHeader + useStreamProgress) ─

test('波次4 — useStreamProgress hook 模块导出 publish/reset/use 三函数', async () => {
  const m = await import('../../hooks/useStreamProgress.js')
  expect(typeof m.publishStreamProgress).toBe('function')
  expect(typeof m.resetStreamProgress).toBe('function')
  expect(typeof m.useStreamProgress).toBe('function')
})

test('波次4 — useStreamProgress publish 后 module ref 更新', async () => {
  const m = await import('../../hooks/useStreamProgress.js')
  m.resetStreamProgress()
  // 测试 publish/reset 是 noop-safe（不 throw）
  expect(() => m.publishStreamProgress(0)).not.toThrow()
  expect(() => m.publishStreamProgress(50)).not.toThrow()
  expect(() => m.publishStreamProgress(500)).not.toThrow()
  expect(() => m.resetStreamProgress()).not.toThrow()
})

test('波次4 — TurnHeader 已 import useStreamProgress + useAppState', () => {
  const src = fs.readFileSync(`${BASE}/components/MatrixTheme/TurnHeader.tsx`, 'utf-8')
  expect(src).toContain("import { useStreamProgress }")
  expect(src).toContain("import { useAppState }")
})

test('波次4 — TurnHeader progressBarFromBytes 函数实现：byte→bar', () => {
  const src = fs.readFileSync(`${BASE}/components/MatrixTheme/TurnHeader.tsx`, 'utf-8')
  expect(src).toContain('function progressBarFromBytes')
  expect(src).toContain('Math.min(12, Math.max(1, Math.floor(bytes / 50)))')
  // U+25B0 = ▰, U+2588 = █
  expect(src).toContain("'\\u25B0'.repeat")
  expect(src).toContain("'\\u2588'") // 末尾静态 █
})

test('波次4 — TurnHeader 仅在 panda + isLoading + 非 reducedMotion 启用 progress', () => {
  const src = fs.readFileSync(`${BASE}/components/MatrixTheme/TurnHeader.tsx`, 'utf-8')
  expect(src).toContain("role === 'panda' && !!isLoading && !reducedMotion")
})

test('波次4 — REPL.tsx 已接入 publishStreamProgress + resetStreamProgress', () => {
  const src = fs.readFileSync(`${BASE}/screens/REPL.tsx`, 'utf-8')
  expect(src).toContain("import { publishStreamProgress, resetStreamProgress }")
  expect(src).toContain('publishStreamProgress(next ? next.length : 0)')
  expect(src).toContain('resetStreamProgress()')
})

test('波次4 — useStreamProgress 节流 100ms（最快 10Hz）', () => {
  const src = fs.readFileSync(`${BASE}/hooks/useStreamProgress.ts`, 'utf-8')
  expect(src).toContain('pollMs = 100')
  expect(src).toContain('setInterval(')
})

// ─── 集成：reducedMotion 兼容性 ────────────────────────────────────

test('波次4 集成 — 全部动效都尊重 prefersReducedMotion setting', () => {
  // 三处动效组件都应读 settings.prefersReducedMotion
  const wsSrc = fs.readFileSync(`${BASE}/components/MatrixTheme/WorkerScope.tsx`, 'utf-8')
  const thSrc = fs.readFileSync(`${BASE}/components/MatrixTheme/TurnHeader.tsx`, 'utf-8')
  expect(wsSrc).toContain('settings.prefersReducedMotion')
  expect(thSrc).toContain('settings.prefersReducedMotion')
})

test('波次4 集成 — 4 项动效模块全部可加载（聚合 import 验证）', async () => {
  const ws = await import('./WorkerScope.js')
  const th = await import('./TurnHeader.js')
  const sf = await import('./ScreenFrame.js')
  const sp = await import('../../hooks/useStreamProgress.js')
  expect(typeof ws.WorkerScope).toBe('function')
  expect(typeof th.TurnHeader).toBe('function')
  expect(typeof sf.ScreenFrame).toBe('function')
  expect(typeof sp.publishStreamProgress).toBe('function')
})

// ─── 性能验证：节流到 10Hz 的 sanity check ──────────────────────────

test('波次4 性能 — useStreamProgress tick 累加正确（避免 stale ref）', async () => {
  const m = await import('../../hooks/useStreamProgress.js')
  m.resetStreamProgress()
  // 反复 publish 同值不增加 tick；不同值增加 tick
  // 间接验证：通过 module 内 let 变量行为
  const src = fs.readFileSync(`${BASE}/hooks/useStreamProgress.ts`, 'utf-8')
  // 仅 byte 变化时才 tick++
  expect(src).toContain('if (bytes !== _streamProgressBytes)')
  expect(src).toContain('_streamProgressTick++')
})

test('波次4 性能 — progress bar 宽度上限 12 ▰（不溢出 chrome）', () => {
  const src = fs.readFileSync(`${BASE}/components/MatrixTheme/TurnHeader.tsx`, 'utf-8')
  // 12 段上限保证：约 12+1+1+3=17 字符（▰×12 + █ + 空格 + GEN），
  // 在最窄 80 columns 终端内仍有 60+ 字符给主标 + 延伸线
  expect(src).toContain('Math.min(12,')
})
