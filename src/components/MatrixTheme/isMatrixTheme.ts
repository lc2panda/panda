// Input: 当前 theme name（当前通过 env 读取）
// Output: bool — 是否是 Matrix 主题 / 明暗变体
// Pos: MatrixTheme 主题检测 helper — Phase C / Phase D 共用接入点
// 一旦我被修改，请更新 MatrixTheme/README.md

import { getSystemThemeName } from '../../utils/systemTheme.js'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

/**
 * 检测当前是否是 Matrix 主题。
 *
 * 直接同步读 `~/.pandacc.json` 的 theme 字段，绕过 getGlobalConfig 的
 * configReadingAllowed 初始化守卫（React render 早期调 getGlobalConfig 会
 * throw → catch 返回 false → React Compiler cache key 不依赖结果 → 永久
 * 卡在 false 渲染路径，╎ 永远不出现）。
 *
 * 双源（任一为 'matrix' 即视为启用）：
 *   1) env `PANDA_THEME=matrix`（临时覆盖最高优先）
 *   2) ~/.pandacc.json → .theme 字段（用户 /theme 持久化）
 *
 * 进程级缓存：第一次成功读后冻结，避免重复 fs IO。
 */

const MATRIX_THEMES = new Set(['matrix', 'matrix-dark', 'matrix-light'])

function getConfigPath(): string {
  const dir =
    process.env.PANDA_CONFIG_DIR ||
    process.env.CLAUDE_CONFIG_DIR ||
    homedir()
  // 大多数情况文件在 ~/.pandacc.json（dir=homedir 时）
  // PANDA_CONFIG_DIR 模式下文件在 <dir>/.config.json（getGlobalClaudeFile 行为）
  if (
    process.env.PANDA_CONFIG_DIR ||
    process.env.CLAUDE_CONFIG_DIR
  ) {
    return join(dir, '.config.json')
  }
  return join(dir, '.pandacc.json')
}

let cachedTheme: string | undefined = undefined  // undefined = 尚未成功读到

import { appendFileSync } from 'node:fs'

let _callCount = 0
let _trueCount = 0
const DEBUG_LOG = join(homedir(), '.pandacc', 'isMatrixTheme-debug.log')

function dbg(label: string, result: boolean): void {
  _callCount++
  if (result) _trueCount++
  // 记录前 50 次详细 + 每条 stack 的第 3-5 行（caller 路径）
  if (_callCount > 50) return
  let caller = ''
  try {
    const stack = new Error().stack || ''
    caller = stack
      .split('\n')
      .slice(3, 6)
      .map(l => l.trim().replace(/^at\s+/, ''))
      .join(' | ')
  } catch {
    caller = '?'
  }
  try {
    appendFileSync(
      DEBUG_LOG,
      `[${new Date().toISOString()}] #${_callCount} (T=${_trueCount}) ${label} ← ${caller}\n`,
    )
  } catch {
    // ignore
  }
}

// 通过 globalThis 间接读 env，绕过 bun bundler 的 process.env.PANDA_THEME
// 静态 inline + DCE（直接 process.env.X 在 build time 被 inline 成 undefined，
// 整个 isMatrixTheme() 三元被 dead-code-eliminate 成 false 分支）。
const _gt = globalThis as unknown as {
  process?: { env?: Record<string, string | undefined> }
  __PANDA_IS_MATRIX_PREFETCH?: boolean
}

function readEnv(name: string): string | undefined {
  return _gt.process?.env?.[name]
}

// Module load 时同步 prefetch — 在 React Compiler 编译的组件代码运行之前
// 就把结果写到 globalThis，确保**首次 mount** 时 isMatrixTheme() 立即返回正确值。
// 这是绕过 React Compiler cache key 不依赖 isMatrixTheme() 的关键修复。
;(function prefetchOnModuleLoad() {
  if (_gt.__PANDA_IS_MATRIX_PREFETCH !== undefined) return
  if (readEnv('PANDA_THEME') === 'matrix') {
    _gt.__PANDA_IS_MATRIX_PREFETCH = true
    return
  }
  try {
    const path = getConfigPath()
    if (!existsSync(path)) {
      _gt.__PANDA_IS_MATRIX_PREFETCH = false
      return
    }
    const cfg = JSON.parse(readFileSync(path, 'utf-8')) as { theme?: unknown }
    const theme = typeof cfg.theme === 'string' ? cfg.theme : ''
    _gt.__PANDA_IS_MATRIX_PREFETCH = MATRIX_THEMES.has(theme)
  } catch {
    _gt.__PANDA_IS_MATRIX_PREFETCH = false
  }
})()

export function isMatrixTheme(): boolean {
  // 优先从 module load 时 prefetch 的 globalThis 缓存读取（最快 + 100% 准确）
  if (_gt.__PANDA_IS_MATRIX_PREFETCH !== undefined) {
    const v = _gt.__PANDA_IS_MATRIX_PREFETCH
    dbg(`prefetch hit → ${v}`, v)
    return v
  }
  // 兜底（理论上 prefetch 一定会 run，永远不会到此）
  if (readEnv('PANDA_THEME') === 'matrix') return true
  if (cachedTheme !== undefined) return MATRIX_THEMES.has(cachedTheme)
  try {
    const path = getConfigPath()
    if (!existsSync(path)) return false
    const raw = readFileSync(path, 'utf-8')
    const cfg = JSON.parse(raw) as { theme?: unknown }
    const theme = typeof cfg.theme === 'string' ? cfg.theme : ''
    cachedTheme = theme
    return MATRIX_THEMES.has(theme)
  } catch {
    return false
  }
}

/**
 * Matrix 主题 + 系统暗色模式。
 * 用于 MatrixCharRain、MatrixBootSequence 选择深色/浅色渲染路径。
 */
export function isMatrixDark(): boolean {
  return isMatrixTheme() && getSystemThemeName() === 'dark'
}

/**
 * Matrix 主题 + 系统亮色模式。
 */
export function isMatrixLight(): boolean {
  return isMatrixTheme() && getSystemThemeName() === 'light'
}
