// Input: rows / cols / density / fps / charSet
// Output: 字符雨 Box 渲染（深度层次 + 变异闪烁 + 5 级消散）
// Pos: MatrixTheme 渲染核心，被 MatrixBanner / MatrixBootSequence 消费
// 一旦我被修改，请更新 MatrixTheme/README.md

import * as React from 'react'
import { useRef } from 'react'
import { Box, Text } from '../../ink.js'
import { useAnimationFrame } from '../../ink/hooks/use-animation-frame.js'
import { type CharSet, pickChar } from './matrixCharSets.js'
import { ageToHex } from './matrixPalette.js'
import { getMatrixWindowsDefaults } from '../../utils/terminalCapability.js'

// Windows 低能力终端降级参数（模块级缓存，只检测一次）
const _winDefaults = getMatrixWindowsDefaults()

// ─── 深度层定义 ─────────────────────────────────────────────
// 3 层深度制造视觉空间感（基于 Rezmason/matrix 异步滚动模型）
// depth=0 前景: 快、亮、稀有
// depth=1 中景: 中速、中亮、主力层
// depth=2 背景: 慢、暗、稀疏

interface DepthLayer {
  /** 激活比例（density 基准 × 此比例） */
  activationChance: number
  /** 速度范围 [min, max) 行/秒 */
  speedMin: number
  speedMax: number
  /** 亮度偏移（+值使 age 更暗，-值更亮） */
  brightnessOffset: number
  /** 字符闪烁基准概率（每帧变异率） */
  flickerRate: number
  /** 微闪光触发概率（临时提亮 1 帧） */
  sparkleRate: number
}

const DEPTH_LAYERS: DepthLayer[] = [
  // 前景 — 10% 列，快 5-8 行/s，100% 亮度，低闪烁
  { activationChance: 0.10, speedMin: 5, speedMax: 8, brightnessOffset: 0, flickerRate: 0.03, sparkleRate: 0.01 },
  // 中景 — 60% 列，中速 8-15 行/s，70% 有效亮度（+0.15 age offset），低闪烁
  { activationChance: 0.60, speedMin: 8, speedMax: 15, brightnessOffset: 0.15, flickerRate: 0.04, sparkleRate: 0.015 },
  // 背景 — 30% 列，慢 15-20 行/s，40% 有效亮度（+0.35 offset），几乎不闪烁
  { activationChance: 0.30, speedMin: 15, speedMax: 20, brightnessOffset: 0.35, flickerRate: 0.02, sparkleRate: 0.005 },
]

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
  /** 是否激活 */
  active: boolean
  /** 深度层索引 */
  depth: number
  /** 上次更新 time */
  lastTime: number
  /** 列间速度微调（-15%~+15% 随机） */
  speedJitter: number
}

/**
 * Matrix 字符雨核心组件。
 * 关键设计：
 * - 不调任何 setState，所有 state 用 useRef
 * - 3 层深度制造空间感（前景快/中景稳/背景慢）
 * - 字符变异 3%/帧 + 微闪光 1% 制造 phosphor 闪烁感
 * - 5 级 age 消散渐变（alpha 调研结论）
 * - useAnimationFrame 拿 time，每帧重算直接 return JSX
 * - Ink diff-based 渲染自动只更新变化的格子
 */
export function MatrixCharRain(props: MatrixCharRainProps): React.ReactNode {
  const {
    rows,
    cols,
    density = _winDefaults?.density ?? 0.25,
    fps = _winDefaults?.fps ?? 20,
    charSet = _winDefaults?.charSet ?? 'mixed',
    tailLength = _winDefaults?.tailLength ?? 8,
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
    const layer = DEPTH_LAYERS[col.depth]
    const jitteredSpeed = col.speed * (1 + col.speedJitter)
    col.headY += jitteredSpeed * dt
    col.lastTime = time

    // 当雨头落到底部下方 + tail 距离时，重新从顶部开始
    if (col.headY > rows + tailLength) {
      col.headY = -Math.floor(Math.random() * 5)
      // 从所属层重新取速度
      col.speed = layer.speedMin + Math.random() * (layer.speedMax - layer.speedMin)
      // 偶尔重新装填字符
      if (Math.random() < 0.3) {
        for (let y = 0; y < rows; y++) {
          col.chars[y] = pickChar(charSet)
        }
      }
    }

    // 雨头位置字符变异（每帧 3-5%）
    const headInt = Math.floor(col.headY)
    if (headInt >= 0 && headInt < rows && Math.random() < layer.flickerRate) {
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
        segments.push(<Text key={x}> </Text>)
        continue
      }
      const headY = col.headY
      const distance = headY - y // 0 = 正在下落，>0 = 已经过去
      if (distance < 0 || distance > tailLength) {
        segments.push(<Text key={x}> </Text>)
        continue
      }

      const layer = DEPTH_LAYERS[col.depth]
      const rawAge = distance / tailLength
      // 深度亮度偏移 + 微闪光（1% 可见字符瞬时提亮）
      let age = rawAge + layer.brightnessOffset
      if (Math.random() < layer.sparkleRate) {
        age = Math.max(0, age - 0.3) // 临时提亮，更亮
      }
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
  // 深度层选择：根据随机值决定
  const depthRoll = Math.random()
  let depth: number
  // 10% 前景 / 60% 中景 / 30% 背景
  if (depthRoll < 0.10) depth = 0
  else if (depthRoll < 0.70) depth = 1
  else depth = 2

  const layer = DEPTH_LAYERS[depth]
  // 是否激活（受 density 和层激活比例共同控制）
  // 前景 10% 稀有，中景 60% 主力，背景 30% 补充
  const effectiveDensity = density * layer.activationChance * 4 // ×4 补偿使总密度 ~density
  const active = Math.random() < effectiveDensity

  const chars: string[] = []
  for (let y = 0; y < rows; y++) {
    chars.push(pickChar(charSet))
  }

  return {
    headY: -Math.floor(Math.random() * rows),
    speed: layer.speedMin + Math.random() * (layer.speedMax - layer.speedMin),
    chars,
    active,
    depth,
    lastTime: 0,
    speedJitter: (Math.random() - 0.5) * 0.3, // -15% ~ +15% 速度微调
  }
}

