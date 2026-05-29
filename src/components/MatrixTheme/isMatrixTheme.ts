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
    process.env.PANDA_CONFIG_DIR || process.env.CLAUDE_CONFIG_DIR || homedir()
  // 大多数情况文件在 ~/.pandacc.json（dir=homedir 时）
  // PANDA_CONFIG_DIR 模式下文件在 <dir>/.config.json（getGlobalClaudeFile 行为）
  if (process.env.PANDA_CONFIG_DIR || process.env.CLAUDE_CONFIG_DIR) {
    return join(dir, '.config.json')
  }
  return join(dir, '.pandacc.json')
}

let cachedTheme: string | undefined // undefined = 尚未成功读到

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
  // env 显式设置时优先 env（PANDA_THEME 为运行期临时覆盖最高优先），
  // 哪怕值不是 'matrix'（如 'light' / 'dark'）也以 env 为准 → false。
  // W13-T3 修复：先于 prefetch 读 env，避免用户 ~/.pandacc.json
  // 已设 theme=matrix 时 prefetch=true 永远盖过运行期 env 切换。
  const envTheme = readEnv('PANDA_THEME')
  if (envTheme !== undefined && envTheme !== '') {
    return envTheme === 'matrix'
  }
  // 优先从 module load 时 prefetch 的 globalThis 缓存读取（最快 + 100% 准确）
  if (_gt.__PANDA_IS_MATRIX_PREFETCH !== undefined) {
    return _gt.__PANDA_IS_MATRIX_PREFETCH
  }
  // 兜底（理论上 prefetch 一定会 run，永远不会到此）
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
 * 显式更新 prefetch 缓存与模块级缓存。
 *
 * 用于 ThemeProvider 在 /theme 切换主题后通知 isMatrixTheme():
 *   - matrix → true：保持 env=matrix + prefetch=true（兜底一致）
 *   - 非 matrix → false：env 删除时 prefetch=false 防止旧缓存残留
 *
 * 不修改 process.env（由调用方负责）。仅刷新 in-memory 缓存。
 *
 * 设计动机：原 prefetch 缓存是 module-load 一次性，无 invalidate 路径。
 * /theme 切换时 ThemeProvider 删除 env=matrix 后，下次 isMatrixTheme() 跳过
 * env 分支命中 prefetch=true（旧值），导致主题热切失效（Comdr #4，2026-04-26）。
 */
export function setMatrixThemeCache(isMatrix: boolean): void {
  _gt.__PANDA_IS_MATRIX_PREFETCH = isMatrix
  // 模块级 cachedTheme 是兜底路径（prefetch undefined 时才走），但保持一致以防
  // 未来 prefetch 被某条路径绕过。
  cachedTheme = isMatrix ? 'matrix' : ''
}

/**
 * 测试专用：把缓存恢复到模块加载初始态（cachedTheme=undefined +
 * prefetch=undefined）。生产代码不应调用 — beforeEach 用，让单测从干净
 * 状态开始走 env / fs 真实路径。
 */
export function _resetMatrixThemeCacheForTest(): void {
  cachedTheme = undefined
  _gt.__PANDA_IS_MATRIX_PREFETCH = undefined
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
