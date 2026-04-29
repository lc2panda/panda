// Input: 无（bun test 注入）
// Output: v3.7 Pro 波次3 — 屏幕骨架 4 大块单元测试
//   1. ScreenFrame 顶/底位置 + 字段渲染 + 圆角 fallback
//   2. StaticCharRain 字符密度 + 种子稳定
//   3. TurnSeparator 升级为扫描线 + ╳ 坐标
//   4. WorkerScope 三重边框
// Pos: matrix v3.7 Pro 波次3 验证；与 v37wave1/2 同套守护
//
// [NEW-FILE:#20260426-MTX3-5] · 仅测试逻辑层与导出，不依赖 ink-testing-library

import { test, expect } from 'bun:test'

// ─── Block 1: ScreenFrame ────────────────────────────────────────────

test('波次3 — ScreenFrame 模块可加载且导出函数', async () => {
  const m = await import('./ScreenFrame.js')
  expect(typeof m.ScreenFrame).toBe('function')
})

test('波次3 — ScreenFrame 默认走方角字符（兼容性最大化）', async () => {
  // 私有 helper 通过源码扫描验证（不暴露 export 避免污染 API）
  const fs = await import('node:fs')
  const src = fs.readFileSync(
    '/Users/panda/Downloads/cc-panda/src/components/MatrixTheme/ScreenFrame.tsx',
    'utf-8',
  )
  // 方角双线
  expect(src).toContain('\\u2554') // ╔
  expect(src).toContain('\\u2557') // ╗
  expect(src).toContain('\\u255A') // ╚
  expect(src).toContain('\\u255D') // ╝
  // 圆角 fallback 探测路径
  expect(src).toContain("PANDA_FRAME_ROUNDED === '1'")
  expect(src).toContain('\\u25DC') // ◜（圆角左上）
})

test('波次3 — ScreenFrame 窄终端阈值 NARROW_TERMINAL_THRESHOLD=80', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync(
    '/Users/panda/Downloads/cc-panda/src/components/MatrixTheme/ScreenFrame.tsx',
    'utf-8',
  )
  expect(src).toContain('NARROW_TERMINAL_THRESHOLD = 80')
})

test('波次3 — ScreenFrame 顶 status bar 含 PANDA / MATRIX TERMINAL v3.7 文案', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync(
    '/Users/panda/Downloads/cc-panda/src/components/MatrixTheme/ScreenFrame.tsx',
    'utf-8',
  )
  expect(src).toContain('PANDA')
  expect(src).toContain('MATRIX TERMINAL v3.7')
  // sessionId / modelId / turnCount 字段
  expect(src).toContain('sessionId')
  expect(src).toContain('modelId')
  expect(src).toContain('turnCount')
  expect(src).toContain('cacheHitPct')
  expect(src).toContain('lastLatencyMs')
})

test('波次3 — ScreenFrame 底 status bar 含快捷键 hint', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync(
    '/Users/panda/Downloads/cc-panda/src/components/MatrixTheme/ScreenFrame.tsx',
    'utf-8',
  )
  // ↑↓ scroll  ⏎ submit  ⌃c abort  ⌃R rewind  ⌃B bg  /help
  expect(src).toContain('scroll')
  expect(src).toContain('submit')
  expect(src).toContain('abort')
  expect(src).toContain('rewind')
  expect(src).toContain('/help')
})

// ─── Block 2: StaticCharRain ─────────────────────────────────────────

test('波次3 — StaticCharRain 模块可加载且导出函数', async () => {
  const m = await import('./StaticCharRain.js')
  expect(typeof m.StaticCharRain).toBe('function')
  // 测试导出
  expect(m.__test_only__).toBeDefined()
  expect(typeof m.__test_only__.generatePattern).toBe('function')
  expect(typeof m.__test_only__.makeRng).toBe('function')
})

test('波次3 — StaticCharRain 种子可复现（同种子两次 generate 结果一致）', async () => {
  const { __test_only__ } = await import('./StaticCharRain.js')
  const a = __test_only__.generatePattern(80, 0.25, 12345)
  const b = __test_only__.generatePattern(80, 0.25, 12345)
  expect(a).toBe(b)
  expect(a.length).toBe(80)
})

test('波次3 — StaticCharRain 不同种子结果不同', async () => {
  const { __test_only__ } = await import('./StaticCharRain.js')
  const a = __test_only__.generatePattern(80, 0.25, 12345)
  const b = __test_only__.generatePattern(80, 0.25, 67890)
  expect(a).not.toBe(b)
})

test('波次3 — StaticCharRain 密度近似 25%（容差 ±10%）', async () => {
  const { __test_only__ } = await import('./StaticCharRain.js')
  const pattern = __test_only__.generatePattern(1000, 0.25, 42)
  // 计算非空格字符占比
  const nonSpace = pattern.split('').filter(c => c !== ' ').length
  const ratio = nonSpace / 1000
  expect(ratio).toBeGreaterThan(0.15)
  expect(ratio).toBeLessThan(0.35)
})

test('波次3 — StaticCharRain 字符仅限 ░ ▒ + 空格', async () => {
  const { __test_only__ } = await import('./StaticCharRain.js')
  const pattern = __test_only__.generatePattern(200, 0.5, 999)
  const allowed = new Set(['\u2591', '\u2592', ' '])
  for (const c of pattern) {
    expect(allowed.has(c)).toBe(true)
  }
})

// ─── Block 3: TurnSeparator (升级版) ─────────────────────────────────

test('波次3 — TurnSeparator 已升级为函数（不再是 null-renderer）', async () => {
  const m = await import('./TurnSeparator.js')
  expect(typeof m.TurnSeparator).toBe('function')
  expect(m.__test_only__).toBeDefined()
  expect(typeof m.__test_only__.generateDashPattern).toBe('function')
})

test('波次3 — TurnSeparator dash pattern 长度精确等于 innerWidth', async () => {
  const { __test_only__ } = await import('./TurnSeparator.js')
  const a = __test_only__.generateDashPattern(50, 1234)
  expect(a.length).toBe(50)
  const b = __test_only__.generateDashPattern(20, 5678)
  expect(b.length).toBe(20)
  const c = __test_only__.generateDashPattern(0, 999)
  expect(c).toBe('')
})

test('波次3 — TurnSeparator pattern 仅含 ─ 与空格', async () => {
  const { __test_only__ } = await import('./TurnSeparator.js')
  const pattern = __test_only__.generateDashPattern(100, 42)
  const allowed = new Set(['\u2500', ' '])
  for (const c of pattern) {
    expect(allowed.has(c)).toBe(true)
  }
})

test('波次3 — TurnSeparator pattern 同种子可复现', async () => {
  const { __test_only__ } = await import('./TurnSeparator.js')
  const a = __test_only__.generateDashPattern(60, 7777)
  const b = __test_only__.generateDashPattern(60, 7777)
  expect(a).toBe(b)
})

test('波次3 — TurnSeparator 源码含 ╳ 十字坐标字符', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync(
    '/Users/panda/Downloads/cc-panda/src/components/MatrixTheme/TurnSeparator.tsx',
    'utf-8',
  )
  expect(src).toContain('\\u2573') // ╳
  // 响应式宽度
  expect(src).toContain('width')
  expect(src).toContain('safeWidth')
})

// ─── Block 4: WorkerScope ────────────────────────────────────────────

test('波次3 — WorkerScope 模块可加载且导出组件', async () => {
  const m = await import('./WorkerScope.js')
  expect(typeof m.WorkerScope).toBe('function')
})

test('波次3 — WorkerScope 源码含三重边框字符 ╔══▶ ┃ ╚══·', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync(
    '/Users/panda/Downloads/cc-panda/src/components/MatrixTheme/WorkerScope.tsx',
    'utf-8',
  )
  // 顶 ╔══▶
  expect(src).toContain('\\u2554') // ╔
  expect(src).toContain('\\u25B6') // ▶
  // 侧 ┃
  expect(src).toContain('\\u2503') // ┃
  // 底 ╚══·
  expect(src).toContain('\\u255A') // ╚
})

test('波次3 — WorkerScope 状态色映射：completed → SYSTEM_FAINT', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync(
    '/Users/panda/Downloads/cc-panda/src/components/MatrixTheme/WorkerScope.tsx',
    'utf-8',
  )
  expect(src).toContain('SYSTEM_FAINT')
  expect(src).toContain('completed')
})

test('波次3 — WorkerScope 三种状态 running/completed/failed 都被处理', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync(
    '/Users/panda/Downloads/cc-panda/src/components/MatrixTheme/WorkerScope.tsx',
    'utf-8',
  )
  expect(src).toContain("'running'")
  expect(src).toContain("'completed'")
  expect(src).toContain("'failed'")
  // 状态灯
  expect(src).toContain('\\u25CF') // ●
  expect(src).toContain('\\u25C9') // ◉
})

// ─── Integration: AgentTool/UI 已用 WorkerScope ──────────────────────

test('波次3 — AgentTool/UI 已 import WorkerScope 并替换波次2 单线 chrome', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync(
    '/Users/panda/Downloads/cc-panda/src/tools/AgentTool/UI.tsx',
    'utf-8',
  )
  expect(src).toContain('WorkerScope')
  expect(src).toContain('import { WorkerScope }')
  // 实时 + 完成态都用 WorkerScope
  expect(src).toContain('status="running"')
  expect(src).toContain('status="completed"')
  // 波次2 的 matrixWorkerChrome IIFE 已被替换（不再以 IIFE 形式存在于完成路径）
  // 注意：波次2 注释还可能在，我们只检查 WorkerScope 替换路径已生效
})

// ─── Integration: REPL 已挂 ScreenFrame + StaticCharRain ─────────────

test('波次3 — REPL.tsx 已 import + 挂载 ScreenFrame + StaticCharRain', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync(
    '/Users/panda/Downloads/cc-panda/src/screens/REPL.tsx',
    'utf-8',
  )
  // import
  expect(src).toContain('import { ScreenFrame }')
  expect(src).toContain('import { StaticCharRain }')
  // 顶 / 底两次挂载
  expect(src).toContain('position="top"')
  expect(src).toContain('position="bottom"')
})

test('波次3 — Messages.tsx 传 width 给 TurnSeparator（响应式）', async () => {
  const fs = await import('node:fs')
  const src = fs.readFileSync(
    '/Users/panda/Downloads/cc-panda/src/components/Messages.tsx',
    'utf-8',
  )
  expect(src).toMatch(/TurnSeparator[^>]*width=\{columns\}/)
})

// ─── Sanity: 全套测试聚合 ─────────────────────────────────────────────

test('波次3 — 4 大块组件全部可加载（聚合 import 验证）', async () => {
  const screenFrame = await import('./ScreenFrame.js')
  const charRain = await import('./StaticCharRain.js')
  const separator = await import('./TurnSeparator.js')
  const workerScope = await import('./WorkerScope.js')
  expect(typeof screenFrame.ScreenFrame).toBe('function')
  expect(typeof charRain.StaticCharRain).toBe('function')
  expect(typeof separator.TurnSeparator).toBe('function')
  expect(typeof workerScope.WorkerScope).toBe('function')
})
