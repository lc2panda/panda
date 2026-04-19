// Input:  StatusLine.tsx 源码 + MiniPet 模块导出
// Output: bun test 用例集 — mini-pet prepend 位置 / Matrix theme 兼容 / 子 flag 隐藏
// Pos:    src/components/StatusLine.minipet.test.tsx — D3 P4-T3 集成测试 [NEW-FILE:#20260419-AB-06]
//
// 一旦本测试或 src/components/StatusLine.tsx / src/buddy/MiniPet.tsx 被修改，
// 请同步更新 src/buddy/README.md 的 mini-pet 章节。
//
// 设计目标（D3 DoD）：
//   1) <MiniPet /> 在 StatusLine 普通分支 + Matrix theme 分支 双双 prepend 在最左
//   2) statusLineText 渲染逻辑保留（不被 MiniPet 改写）
//   3) Matrix theme 分支独立守护（▐ 分隔符、MATRIX_UI.statusLine 颜色仍生效）
//   4) companionMiniPet=false → MiniPet 不渲染（通过纯函数 shouldRenderMiniPetFor 等价覆盖）
//
// 注意：feature('BUDDY') 在 bun test 默认 false → 组件渲染管线无法直接断言；
//   走"源码静态结构"+"纯函数语义"两层间接断言（同 sprites.panda.test.ts 模式）。

import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'
import { MiniPet, shouldRenderMiniPetFor } from '../buddy/MiniPet.js'
// v2.21.30 方向 A：panda 系实装退役；mini-pet 18 物种通用，测试用 duck 代表任意物种
import { duck, type Species } from '../buddy/types.js'

const STATUS_LINE_PATH = join(
  import.meta.dir,
  'StatusLine.tsx',
)
const STATUS_LINE_SRC = readFileSync(STATUS_LINE_PATH, 'utf-8')

// ─────────────────────────────────────────────────────────────────────────────
// 1. MiniPet import 已加入
// ─────────────────────────────────────────────────────────────────────────────

describe('StatusLine.tsx import 守护', () => {
  test('源码 import { MiniPet } from buddy/MiniPet', () => {
    expect(STATUS_LINE_SRC).toContain(
      "import { MiniPet } from '../buddy/MiniPet.js'",
    )
  })

  test('MiniPet 是可调用 React 组件函数', () => {
    expect(typeof MiniPet).toBe('function')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. MiniPet prepend 在最左（Matrix + 普通双分支）
// ─────────────────────────────────────────────────────────────────────────────

// 提取 StatusLineInner 内 isMatrixTheme 真分支的完整 return JSX 片段
// 通过定位 if (isMatrixTheme()) { ... } 内首个 return 到 </Box>; 结尾
function extractMatrixBranch(): string {
  const start = STATUS_LINE_SRC.indexOf('if (isMatrixTheme()) {')
  expect(start).toBeGreaterThan(-1)
  const returnIdx = STATUS_LINE_SRC.indexOf('return <Box', start)
  expect(returnIdx).toBeGreaterThan(-1)
  // 截到该 return 块的 </Box>; 结尾
  const endBox = STATUS_LINE_SRC.indexOf('</Box>;', returnIdx)
  expect(endBox).toBeGreaterThan(returnIdx)
  return STATUS_LINE_SRC.slice(start, endBox + '</Box>;'.length)
}

// 提取 isMatrixTheme 之后的"普通分支"return JSX
function extractDefaultBranch(): string {
  // 普通分支：第二个 "return <Box paddingX"（第一个在 Matrix 分支内）
  const first = STATUS_LINE_SRC.indexOf('return <Box paddingX')
  const second = STATUS_LINE_SRC.indexOf('return <Box paddingX', first + 1)
  expect(second).toBeGreaterThan(first)
  const endBox = STATUS_LINE_SRC.indexOf('</Box>;', second)
  expect(endBox).toBeGreaterThan(second)
  return STATUS_LINE_SRC.slice(second, endBox + '</Box>;'.length)
}

describe('MiniPet 左侧 prepend 位置', () => {
  test('Matrix theme 分支 — <MiniPet /> 出现在 statusLineText 之前', () => {
    const branch = extractMatrixBranch()
    expect(branch).toContain('<MiniPet />')
    const miniPetIdx = branch.indexOf('<MiniPet />')
    const statusTextIdx = branch.indexOf('statusLineText')
    expect(miniPetIdx).toBeGreaterThan(-1)
    expect(statusTextIdx).toBeGreaterThan(miniPetIdx)
  })

  test('Matrix theme 分支 — <MiniPet /> 紧接 <Box> 之后（最左位置）', () => {
    const branch = extractMatrixBranch()
    // 找到 return <Box ... > 后第一个非空字符串子节点
    const m = branch.match(/<Box[^>]*>\s*<MiniPet \/>/)
    expect(m).toBeTruthy()
  })

  test('普通分支 — <MiniPet /> 出现在 statusLineText 之前', () => {
    const branch = extractDefaultBranch()
    expect(branch).toContain('<MiniPet />')
    const miniPetIdx = branch.indexOf('<MiniPet />')
    const statusTextIdx = branch.indexOf('statusLineText')
    expect(miniPetIdx).toBeGreaterThan(-1)
    expect(statusTextIdx).toBeGreaterThan(miniPetIdx)
  })

  test('普通分支 — <MiniPet /> 紧接 <Box> 之后（最左位置）', () => {
    const branch = extractDefaultBranch()
    const m = branch.match(/<Box[^>]*>\s*<MiniPet \/>/)
    expect(m).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. statusLineText 仍可见（StatusLine 渲染未被 MiniPet 替换）
// ─────────────────────────────────────────────────────────────────────────────

describe('statusLineText 兼容回归', () => {
  test('Matrix 分支保留 statusLineText 渲染（含 MATRIX_UI.statusLine + Ansi）', () => {
    const branch = extractMatrixBranch()
    expect(branch).toContain('MATRIX_UI.statusLine')
    expect(branch).toContain('<Ansi>{statusLineText}</Ansi>')
  })

  test('Matrix 分支保留 ▐ 分隔符（divider）', () => {
    const branch = extractMatrixBranch()
    expect(branch).toContain('MATRIX_UI.divider')
    expect(branch).toContain('▐')
  })

  test('普通分支保留 statusLineText 渲染（dimColor + Ansi）', () => {
    const branch = extractDefaultBranch()
    expect(branch).toContain('dimColor')
    expect(branch).toContain('<Ansi>{statusLineText}</Ansi>')
  })

  test('两分支均保留 isFullscreenEnvEnabled 占位降级', () => {
    expect(extractMatrixBranch()).toContain('isFullscreenEnvEnabled()')
    expect(extractDefaultBranch()).toContain('isFullscreenEnvEnabled()')
  })

  test('两分支均保留 paddingX={paddingX} 与 gap={2}', () => {
    expect(extractMatrixBranch()).toMatch(/paddingX=\{paddingX\}/)
    expect(extractMatrixBranch()).toMatch(/gap=\{2\}/)
    expect(extractDefaultBranch()).toMatch(/paddingX=\{paddingX\}/)
    expect(extractDefaultBranch()).toMatch(/gap=\{2\}/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. companionMiniPet=false 隐藏（语义层等价覆盖）
// ─────────────────────────────────────────────────────────────────────────────

describe('companionMiniPet 子 flag 隐藏（v2.21.30 方向 A：18 物种通用）', () => {
  const DUCK_COMP = { species: duck } as { species: Species }

  test('companionMiniPet=false → shouldRenderMiniPetFor 返 false', () => {
    expect(
      shouldRenderMiniPetFor(DUCK_COMP, {
        companionMuted: false,
        companionMiniPet: false,
      }),
    ).toBe(false)
  })

  test('companionMiniPet=true → shouldRenderMiniPetFor 返 true（duck 18 物种通用）', () => {
    expect(
      shouldRenderMiniPetFor(DUCK_COMP, {
        companionMuted: false,
        companionMiniPet: true,
      }),
    ).toBe(true)
  })

  test('feature(BUDDY)=false 时 MiniPet 始终返 null（bun test 默认场景）', () => {
    // bun test 下 feature('BUDDY') 编译宏取默认 false，组件直接 return null
    const result = MiniPet()
    expect(result).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. byte-equal 守护：确认 buildStatusLineCommandInput / 协议字段未被改动
// ─────────────────────────────────────────────────────────────────────────────

describe('byte-equal 守护 — statusline command 协议字段', () => {
  test('buildStatusLineCommandInput 函数体保留（model/workspace/version/cost/...）', () => {
    expect(STATUS_LINE_SRC).toContain('function buildStatusLineCommandInput')
    expect(STATUS_LINE_SRC).toContain('display_name: renderModelName(runtimeModel)')
    expect(STATUS_LINE_SRC).toContain('current_dir: getCwd()')
    expect(STATUS_LINE_SRC).toContain('version: MACRO.VERSION')
  })

  test('executeStatusLineCommand 调用入口保留', () => {
    expect(STATUS_LINE_SRC).toContain('executeStatusLineCommand(statusInput')
  })
})
