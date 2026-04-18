// Input: 无
// Output: MATRIX_UI 或 MATRIX_UI_LIGHT
// Pos: 封装 dark/light 切换，所有 Matrix 组件统一调用
//
// [NEW-FILE:#20260418-13]
// 注意：此函数不会自动响应主题切换；如果用户运行时切换主题，
// 需要重新渲染（通常由 ThemeProvider 触发）才能拿到新值。

import { MATRIX_UI, MATRIX_UI_LIGHT } from '../components/MatrixTheme/matrixPalette.js'
import { isMatrixLight } from '../components/MatrixTheme/isMatrixTheme.js'

export function useMatrixUI(): typeof MATRIX_UI | typeof MATRIX_UI_LIGHT {
  return isMatrixLight() ? MATRIX_UI_LIGHT : MATRIX_UI
}
