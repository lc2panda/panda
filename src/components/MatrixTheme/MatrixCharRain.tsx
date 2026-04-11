// Input: rows / cols / density / fps / charSet
// Output: 字符雨 Box 渲染（每帧 y++，颜色按 age 渐变）
// Pos: MatrixTheme 渲染核心，被 MatrixBanner / MatrixBootSequence 消费
// 一旦我被修改，请更新 MatrixTheme/README.md

import * as React from 'react'
import { useRef } from 'react'
import { Box, Text } from '../../ink.js'
import { useAnimationFrame } from '../../ink/hooks/use-animation-frame.js'
import { type CharSet, pickChar } from './matrixCharSets.js'
import { ageToHex } from './matrixPalette.js'

interface MatrixCharRainProps {
  rows: number
  cols: number
  /** 0..1: 密度，0.2 = 每 5 列一道雨 */
  density?: number
  /** 帧率，默认 20 */
  fps?: number
  /** 字符池 */
  charSet?: CharSet
  /** 雨头长度（亮的部分），默认 4 */
  headLength?: number
  /** 雨尾长度（消散），默认 8 */
  tailLength?: number
}

/**
 * 单列雨的内部状态。
 */
interface ColumnState {
  /** 雨头当前 y 坐标（可超 rows，循环） */
  headY: number
  /** 速度（y 每秒下降多少行） */
  speed: number
  /** 字符历史，长度 = rows，记录每行字符（停留态） */
  chars: string[]
  /** 是否激活（density 控制） */
  active: boolean
  /** 上次更新 time */
  lastTime: number
}

/**
 * Matrix 字符雨核心组件。
 * 关键设计：
 * - 不调任何 setState，所有 state 用 useRef
 * - useAnimationFrame 拿到 time，每帧重算并直接 return JSX
 * - JSX 结构每帧相同（rows × cols 的 Text 矩阵），只内容/颜色变
 * - Ink diff-based 渲染会自动只更新变化的格子
 */
export function MatrixCharRain(props: MatrixCharRainProps): React.ReactNode {
  const {
    rows,
    cols,
    density = 0.25,
    fps = 20,
    charSet = 'mixed',
    tailLength = 8,
  } = props

  // useRef 持久化每列状态，每帧更新
  const columnsRef = useRef<ColumnState[] | null>(null)
  const initializedColsRef = useRef(0)

  // 初始化或 cols 变化时重建
  if (columnsRef.current === null || initializedColsRef.current !== cols) {
    const next: ColumnState[] = []
    for (let i = 0; i < cols; i++) {
      next.push(createColumn(rows, density, charSet))
    }
    columnsRef.current = next
    initializedColsRef.current = cols
  }

  // 拿到帧时钟
  const intervalMs = Math.max(16, Math.floor(1000 / fps))
  const [ref, time] = useAnimationFrame(intervalMs)

  // 每帧推进所有列
  const columns = columnsRef.current
  const firstLastTime = columns[0]?.lastTime ?? time
  const dt = Math.max(0, (time - firstLastTime) / 1000)
  for (const col of columns) {
    if (!col.active) continue
    col.headY += col.speed * dt
    col.lastTime = time
    // 当雨头落到底部下方 + tail 距离时，重新从顶部开始
    if (col.headY > rows + tailLength) {
      col.headY = -Math.floor(Math.random() * 5)
      col.speed = 5 + Math.random() * 15
      // 偶尔重新装填字符
      if (Math.random() < 0.3) {
        for (let y = 0; y < rows; y++) {
          col.chars[y] = pickChar(charSet)
        }
      }
    }
    // 雨头位置随机替换字符（制造闪烁）
    const headInt = Math.floor(col.headY)
    if (headInt >= 0 && headInt < rows && Math.random() < 0.4) {
      col.chars[headInt] = pickChar(charSet)
    }
  }

  // 渲染 rows × cols 的字符矩阵
  const lines: React.ReactNode[] = []
  for (let y = 0; y < rows; y++) {
    const segments: React.ReactNode[] = []
    for (let x = 0; x < cols; x++) {
      const col = columns[x]
      if (!col || !col.active) {
        segments.push(
          <Text key={x}> </Text>,
        )
        continue
      }
      const headY = col.headY
      const distance = headY - y // 0 = 正在下落，>0 = 已经过去
      if (distance < 0 || distance > tailLength) {
        segments.push(
          <Text key={x}> </Text>,
        )
        continue
      }
      const age = distance / tailLength
      const color = ageToHex(age)
      const char = col.chars[y] || pickChar(charSet)
      segments.push(
        <Text key={x} color={color}>
          {char}
        </Text>,
      )
    }
    lines.push(
      <Box key={y} flexDirection="row">
        {segments}
      </Box>,
    )
  }

  return (
    <Box ref={ref} flexDirection="column">
      {lines}
    </Box>
  )
}

function createColumn(rows: number, density: number, charSet: CharSet): ColumnState {
  const active = Math.random() < density
  const chars: string[] = []
  for (let y = 0; y < rows; y++) {
    chars.push(pickChar(charSet))
  }
  return {
    headY: -Math.floor(Math.random() * rows),
    speed: 5 + Math.random() * 15,
    chars,
    active,
    lastTime: 0,
  }
}
