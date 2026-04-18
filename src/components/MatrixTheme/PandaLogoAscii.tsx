// Input: 无 props（可选 tagline override）
// Output: 6 行 PANDA ASCII art + 底部 tagline，CRT scanline 错落色
// Pos: 用于 WelcomeCard 左侧静态展示，复用 MatrixBootSequence 的 PANDA_LOGO 字符
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260418-06]
// 设计目标：T-A2 — 启动序列结束后，欢迎屏左侧固定一份 phosphor logo。
// 与 MatrixBootSequence 区别：
//  - 无动画（Welcome 屏要稳）
//  - 6 行亮度按 FLASH/GLOW/BRIGHT/GLOW/FLASH/GLOW 错落（电影 CRT scanline 感）
//  - 底部一行 tagline `// reality is a construct`（hint dim）

import * as React from 'react'
import { Box, Text } from '../../ink.js'
import { MATRIX_SCALE, MATRIX_SCALE_LIGHT } from './matrixPalette.js'
import { isMatrixLight } from './isMatrixTheme.js'

const PANDA_LOGO = [
  '██████╗  █████╗ ███╗   ██╗██████╗  █████╗ ',
  '██╔══██╗██╔══██╗████╗  ██║██╔══██╗██╔══██╗',
  '██████╔╝███████║██╔██╗ ██║██║  ██║███████║',
  '██╔═══╝ ██╔══██║██║╚██╗██║██║  ██║██╔══██║',
  '██║     ██║  ██║██║ ╚████║██████╔╝██║  ██║',
  '╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝',
]

// CRT scanline: alternate FLASH (bright) / GLOW (slightly dimmer)
// 与 MatrixBootSequence 同一节奏，确保两屏过渡视觉连续
const SCANLINE_DARK = [
  MATRIX_SCALE.FLASH,
  MATRIX_SCALE.GLOW,
  MATRIX_SCALE.BRIGHT,
  MATRIX_SCALE.GLOW,
  MATRIX_SCALE.FLASH,
  MATRIX_SCALE.GLOW,
]
const SCANLINE_LIGHT = [
  MATRIX_SCALE_LIGHT.FLASH,
  MATRIX_SCALE_LIGHT.GLOW,
  MATRIX_SCALE_LIGHT.BRIGHT,
  MATRIX_SCALE_LIGHT.GLOW,
  MATRIX_SCALE_LIGHT.FLASH,
  MATRIX_SCALE_LIGHT.GLOW,
]

interface Props {
  /** 是否显示 tagline（默认 true） */
  tagline?: boolean
}

export function PandaLogoAscii({ tagline = true }: Props = {}): React.ReactNode {
  const lightMode = isMatrixLight()
  const colors = lightMode ? SCANLINE_LIGHT : SCANLINE_DARK
  const S = lightMode ? MATRIX_SCALE_LIGHT : MATRIX_SCALE

  return (
    <Box flexDirection="column">
      {PANDA_LOGO.map((line, i) => (
        <Text key={i} color={colors[i] || S.FLASH}>
          {line}
        </Text>
      ))}
      {tagline && (
        <Text color={S.SHADOW} dimColor>
          {'// reality is a construct'}
        </Text>
      )}
    </Box>
  )
}
