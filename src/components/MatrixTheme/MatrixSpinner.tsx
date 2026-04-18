// Input: time (ms, 由 useAnimationFrame 传入) + 可选 reducedMotion
// Output: 8 帧 ramp `[░ ▒ ▓ █ ▓ ▒ ░ ◌]` Matrix 风格 spinner，80ms/帧
// Pos: 可独立复用的 Matrix spinner；SpinnerGlyph 已内嵌 Matrix 分支（braille），本组件给非 SpinnerGlyph 路径用
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260418-08]
// 设计目标：T-C2 — 提供任务规范的 8 帧 block-ramp Matrix spinner（密度逐渐填充→消散→空）。
// 与 SpinnerGlyph 内嵌的 braille pulse 路径互补：
//  - 本组件用于非主 spinner 入口（如 Tool 头扫描线 prefix、自定义 panel loader）
//  - GLOW 色（最常被瞳孔吸引的高亮带，与 NEON/BRIGHT 区隔）
//  - reducedMotion 时退化成静态 ◌（与 SpinnerGlyph 的 ● 区别开避免与已激活 spinner 重叠）

import * as React from 'react'
import { Box, Text } from '../../ink.js'
import { MATRIX_SCALE, MATRIX_SCALE_LIGHT } from './matrixPalette.js'
import { isMatrixLight, isMatrixTheme } from './isMatrixTheme.js'

const FRAMES = ['\u2591', '\u2592', '\u2593', '\u2588', '\u2593', '\u2592', '\u2591', '\u25CC']
const FRAME_MS = 80

interface Props {
  /** 当前时间（毫秒，通常来自 useAnimationFrame）。未提供时静态。 */
  time?: number
  /** 用户偏好低动效。展示静态 ◌ */
  reducedMotion?: boolean
}

export function MatrixSpinner({ time = 0, reducedMotion = false }: Props): React.ReactNode {
  if (!isMatrixTheme()) return null
  const S = isMatrixLight() ? MATRIX_SCALE_LIGHT : MATRIX_SCALE
  if (reducedMotion) {
    return (
      <Box width={2} height={1}>
        <Text color={S.GLOW}>{'\u25CC'}</Text>
      </Box>
    )
  }
  const frame = Math.floor(time / FRAME_MS) % FRAMES.length
  const ch = FRAMES[frame]
  return (
    <Box width={2} height={1}>
      <Text color={S.GLOW}>{ch}</Text>
    </Box>
  )
}
