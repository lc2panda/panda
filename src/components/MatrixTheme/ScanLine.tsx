// Input: active (是否运行中) + 可选 width
// Output: 12 字宽往返 horizontal scan，HEAD ▒░· ramp；done 时显示 ✓
// Pos: tool message header 旁的 inline 进度指示
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260418-09]
// 设计目标：T-C4 — 给 tool 调用一个轻量"扫描中"动效。
//  - 12 字宽轨道，HEAD 三字符 (▒░·) 往返扫
//  - active=false 时变 ✓ 完成
//  - 仅 isMatrixTheme() 时渲染；其它主题不应引用本文件

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Box, Text } from '../../ink.js'
import { isMatrixTheme, isMatrixLight } from './isMatrixTheme.js'
import { MATRIX_SCALE, MATRIX_SCALE_LIGHT } from './matrixPalette.js'

const HEAD = ['\u2592', '\u2591', '\u00B7'] // ▒ ░ ·
const FRAME_MS = 90

interface Props {
  /** 是否扫描中（false → ✓ 完成） */
  active: boolean
  /** 轨道宽度（默认 12） */
  width?: number
}

export function ScanLine({ active, width = 12 }: Props): React.ReactNode {
  if (!isMatrixTheme()) return null
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick(t => t + 1), FRAME_MS)
    return () => clearInterval(id)
  }, [active])

  const lightMode = isMatrixLight()
  const S = lightMode ? MATRIX_SCALE_LIGHT : MATRIX_SCALE

  if (!active) {
    return (
      <Box width={width + 2}>
        <Text color={S.BRIGHT}>{'\u2713'}</Text>
        <Text color={S.SHADOW} dimColor>
          {' '.repeat(Math.max(0, width - 1))}
        </Text>
      </Box>
    )
  }

  // 往返：tick 在 0..(2*width-2) 周期，前半段右移，后半段左移
  const cycle = Math.max(1, 2 * width - 2)
  const pos = tick % cycle
  const headPos = pos < width ? pos : cycle - pos
  // 渲染：以 headPos 为中心，写 HEAD 三字符（中心最亮）
  const cells: string[] = Array(width).fill(' ')
  for (let i = 0; i < HEAD.length; i++) {
    const idx = headPos - i
    if (idx >= 0 && idx < width) cells[idx] = HEAD[i]!
  }

  return (
    <Box width={width + 2}>
      <Text color={S.GLOW}>{cells.join('')}</Text>
    </Box>
  )
}
