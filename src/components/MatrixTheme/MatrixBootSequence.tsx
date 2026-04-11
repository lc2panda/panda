// Input: cols / rows / onDone callback
// Output: ~5.5s Matrix 启动动画（v2.11.3 延长）
// Pos: MatrixTheme 启动屏，由 LogoV2 在 isMatrixTheme() 时返回
// 一旦我被修改，请更新 MatrixTheme/README.md

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Box, Text, useInput } from '../../ink.js'
import { MatrixCharRain } from './MatrixCharRain.js'
import { MATRIX_COLORS } from './matrixPalette.js'

interface MatrixBootSequenceProps {
  cols: number
  /** 高度，默认 18 */
  rows?: number
  /** 完成或跳过后的回调 */
  onDone?: () => void
}

type Phase = 'rain' | 'logo' | 'wakeup' | 'hold' | 'done'

const PANDA_LOGO = [
  '██████╗  █████╗ ███╗   ██╗██████╗  █████╗ ',
  '██╔══██╗██╔══██╗████╗  ██║██╔══██╗██╔══██╗',
  '██████╔╝███████║██╔██╗ ██║██║  ██║███████║',
  '██╔═══╝ ██╔══██║██║╚██╗██║██║  ██║██╔══██║',
  '██║     ██║  ██║██║ ╚████║██████╔╝██║  ██║',
  '╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝',
]

const WAKE_UP_TEXT = '〔 W A K E   U P,   N E O … 〕'
// 打字机逐字显示的字符数 → time 映射
// 总计 WAKE_UP_TEXT 长度 ~23 字符，每字符 ~100ms = ~2.3s 打字
const TYPE_INTERVAL_MS = 100

/**
 * Matrix 主题启动屏（~5.5s total, 按 ⏎/Esc 跳过）。
 *
 * 阶段：
 *  - 0-500ms    rain   : 字符雨快速填屏（提升初始冲击感）
 *  - 500-2000ms logo   : 字符雨 + Panda logo 淡入（1.5s）
 *  - 2000ms+    wakeup : "WAKE UP, NEO …" 打字机逐字显示（~2.3s）
 *  - 4300-5500ms hold  : 文字完整显示后停留 1.2s 让用户读完
 *  - 5500ms+    done   : 卸载 + onDone 回调
 *
 * 按 Enter / Escape 任意阶段可直接跳过。
 */
export function MatrixBootSequence({
  cols,
  rows: _rows = 18,
  onDone,
}: MatrixBootSequenceProps): React.ReactNode {
  const [phase, setPhase] = useState<Phase>('rain')
  const [typedChars, setTypedChars] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('logo'), 500)
    const t2 = setTimeout(() => setPhase('wakeup'), 2000)
    // hold 阶段（打字完成后）在 wakeup useEffect 里触发
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  // 打字机效果：每 TYPE_INTERVAL_MS 递增一个字符
  useEffect(() => {
    if (phase !== 'wakeup') return
    if (typedChars >= WAKE_UP_TEXT.length) {
      // 打完了 → 进入 hold
      const t = setTimeout(() => setPhase('hold'), 100)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setTypedChars(n => n + 1), TYPE_INTERVAL_MS)
    return () => clearTimeout(t)
  }, [phase, typedChars])

  // hold 阶段持续 1200ms 后结束
  useEffect(() => {
    if (phase !== 'hold') return
    const t = setTimeout(() => setPhase('done'), 1200)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'done') onDone?.()
  }, [phase, onDone])

  // 跳过：按 Enter / Escape
  useInput((_input, key) => {
    if (key.return || key.escape) {
      setPhase('done')
    }
  })

  if (phase === 'done') return null

  const showLogo = phase !== 'rain'
  const showWakeup = phase === 'wakeup' || phase === 'hold'
  const wakeupDisplay = phase === 'hold'
    ? WAKE_UP_TEXT
    : WAKE_UP_TEXT.slice(0, typedChars)

  return (
    <Box flexDirection="column">
      <MatrixCharRain
        rows={2}
        cols={cols}
        density={0.4}
        fps={30}
        charSet="mixed"
        headLength={4}
        tailLength={5}
      />
      <Box flexDirection="column" alignItems="center" paddingY={1}>
        {showLogo && (
          <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={MATRIX_COLORS.MID_HEX}
            paddingX={2}
            paddingY={1}
          >
            {PANDA_LOGO.map((line, i) => (
              <Text key={i} color={MATRIX_COLORS.HEAD_HEX}>
                {line}
              </Text>
            ))}
            <Box height={1} />
            {/* 打字机阶段永远 reserve 一行高度，避免 wakeupDisplay 从空到有时 logo 框跳动 */}
            <Text color={MATRIX_COLORS.MID_HEX}>
              {showWakeup ? wakeupDisplay : ' '}
            </Text>
          </Box>
        )}
      </Box>
      <MatrixCharRain
        rows={2}
        cols={cols}
        density={0.4}
        fps={30}
        charSet="mixed"
        headLength={4}
        tailLength={5}
      />
      <Box>
        <Text color={MATRIX_COLORS.TAIL_HEX}>
          {'   ▶ SYSTEM BOOT  ·  v2.11.3  ·  ⏎ skip'}
        </Text>
      </Box>
    </Box>
  )
}
