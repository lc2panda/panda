// Input: 当前 theme name（当前通过 env 读取）
// Output: bool — 是否是 Matrix 主题 / 明暗变体
// Pos: MatrixTheme 主题检测 helper — Phase C / Phase D 共用接入点
// 一旦我被修改，请更新 MatrixTheme/README.md

import { getSystemThemeName } from '../../utils/systemTheme.js'

/**
 * 检测当前是否是 Matrix 主题。
 *
 * Phase C 阶段先用环境变量 `PANDA_THEME` 做 placeholder；
 * 用户可以 `PANDA_THEME=matrix panda` 启动来 opt-in。
 *
 * Phase D 会把内部实现替换为 `src/utils/theme.ts` 的真正 theme 读取，
 * 但本函数接口签名保持不变，所有调用点零改动。
 */
export function isMatrixTheme(): boolean {
  try {
    return process.env.PANDA_THEME === 'matrix'
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
