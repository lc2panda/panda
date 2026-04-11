// Input: cols / rows / onDone callback
// Output: ~2s Matrix 启动动画
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

type Phase = 'rain' | 'logo' | 'wakeup' | 'done'

const PANDA_LOGO = [
  '██████╗  █████╗ ███╗   ██╗██████╗  █████╗ ',
  '██╔══██╗██╔══██╗████╗  ██║██╔══██╗██╔══██╗',
  '██████╔╝███████║██╔██╗ ██║██║  ██║███████║',
  '██╔═══╝ ██╔══██║██║╚██╗██║██║  ██║██╔══██║',
  '██║     ██║  ██║██║ ╚████║██████╔╝██║  ██║',
  '╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝',
]

const WAKE_UP_TEXT = '〔 W A K E   U P,   N E O … 〕'

/**
 * Matrix 主题启动屏（~2s）。
 *
 * 阶段：
 *  - 0-300ms   rain    : 全屏字符雨
 *  - 300-1500ms logo   : 字符雨 + Panda logo 淡入
 *  - 1500-2000ms wakeup: 字符雨 + logo + "WAKE UP, NEO" 打字
 *  - 2000ms+   done    : 卸载，调用 onDone
 *
 * 按 Enter / Escape 可直接跳过。
 */
export function MatrixBootSequence({
  cols,
  rows: _rows = 18,
  onDone,
}: MatrixBootSequenceProps): React.ReactNode {
  const [phase, setPhase] = useState<Phase>('rain')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('logo'), 300)
    const t2 = setTimeout(() => setPhase('wakeup'), 1500)
    const t3 = setTimeout(() => setPhase('done'), 2000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

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
  const showWakeup = phase === 'wakeup'

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
            {showWakeup && (
              <Text color={MATRIX_COLORS.MID_HEX}>{WAKE_UP_TEXT}</Text>
            )}
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
          {'   ▶ SYSTEM BOOT  ·  v2.10.0  ·  ⏎ skip'}
        </Text>
      </Box>
    </Box>
  )
}
