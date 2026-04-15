// Input: cols / rows / onDone callback
// Output: ~5.5s Matrix 启动动画（v2.14.1 refined with CRT scanline + cursor blink）
// Pos: MatrixTheme 启动屏，由 LogoV2 在 isMatrixTheme() 时返回
// 一旦我被修改，请更新 MatrixTheme/README.md

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Box, Text, useInput } from '../../ink.js'
import { MatrixCharRain } from './MatrixCharRain.js'
import { MATRIX_SCALE, MATRIX_SCALE_LIGHT } from './matrixPalette.js'
import { getMatrixWindowsDefaults } from '../../utils/terminalCapability.js'
import { isMatrixLight } from './isMatrixTheme.js'

// Windows 低能力终端降级参数
const _winDefaults = getMatrixWindowsDefaults()

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

// CRT scanline: alternate rows use slightly dimmer color
// Light mode uses dark-on-light variant
const LOGO_COLORS_DARK = [
  MATRIX_SCALE.FLASH,  // row 0 — bright
  MATRIX_SCALE.GLOW,   // row 1 — slightly dimmer (scanline)
  MATRIX_SCALE.FLASH,  // row 2 — bright
  MATRIX_SCALE.GLOW,   // row 3 — scanline
  MATRIX_SCALE.FLASH,  // row 4 — bright
  MATRIX_SCALE.GLOW,   // row 5 — scanline
]

const LOGO_COLORS_LIGHT = [
  MATRIX_SCALE_LIGHT.FLASH,  // row 0 — dark accent
  MATRIX_SCALE_LIGHT.GLOW,   // row 1 — slightly lighter (scanline)
  MATRIX_SCALE_LIGHT.FLASH,  // row 2
  MATRIX_SCALE_LIGHT.GLOW,   // row 3
  MATRIX_SCALE_LIGHT.FLASH,  // row 4
  MATRIX_SCALE_LIGHT.GLOW,   // row 5
]

const WAKE_UP_TEXT = '〔 W A K E   U P,   N E O … 〕'
const TYPE_INTERVAL_MS = 100
const CURSOR_BLINK_MS = 500

/**
 * Matrix 主题启动屏（~5.5s total, 按 ⏎/Esc 跳过）。
 *
 * 阶段：
 *  - 0-500ms    rain   : 字符雨快速填屏（提升初始冲击感）
 *  - 500-2000ms logo   : 字符雨 + Panda logo 淡入（1.5s, CRT scanline effect）
 *  - 2000ms+    wakeup : "WAKE UP, NEO …" 打字机逐字显示 + blinking cursor（~2.3s）
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
  const [cursorVisible, setCursorVisible] = useState(true)

  // rain 阶段时长：低能力终端缩短以减少渲染压力
  const rainDurationMs = _winDefaults ? 300 : 500
  const logoDurationMs = _winDefaults ? 1500 : 2000
  const bootCharSet = _winDefaults?.charSet ?? 'mixed'
  const bootFps = _winDefaults?.fps ?? 30

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('logo'), rainDurationMs)
    const t2 = setTimeout(() => setPhase('wakeup'), logoDurationMs)
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

  // Blinking cursor during wakeup phase
  useEffect(() => {
    if (phase !== 'wakeup') return
    const t = setInterval(() => setCursorVisible(v => !v), CURSOR_BLINK_MS)
    return () => clearInterval(t)
  }, [phase])

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

  // Cursor: visible during typing, hidden once complete (hold phase)
  const cursor = phase === 'wakeup' && cursorVisible ? '▌' : phase === 'wakeup' ? ' ' : ''

  // Select colors based on light/dark mode
  const lightMode = isMatrixLight()
  const LOGO_COLORS = lightMode ? LOGO_COLORS_LIGHT : LOGO_COLORS_DARK
  const S = lightMode ? MATRIX_SCALE_LIGHT : MATRIX_SCALE

  return (
    <Box flexDirection="column">
      <MatrixCharRain
        rows={3}
        cols={cols}
        density={_winDefaults?.density ?? 0.4}
        fps={bootFps}
        charSet={bootCharSet}
        headLength={4}
        tailLength={_winDefaults?.tailLength ?? 5}
      />
      <Box flexDirection="column" alignItems="center" paddingY={1}>
        {showLogo && (
          <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={S.NEON}
            paddingX={2}
            paddingY={1}
          >
            {PANDA_LOGO.map((line, i) => (
              <Text key={i} color={LOGO_COLORS[i] || S.FLASH}>
                {line}
              </Text>
            ))}
            <Box height={1} />
            {/* 打字机阶段永远 reserve 一行高度，避免 wakeupDisplay 从空到有时 logo 框跳动 */}
            <Text color={S.NEON}>
              {showWakeup ? `${wakeupDisplay}${cursor}` : ' '}
            </Text>
          </Box>
        )}
      </Box>
      <MatrixCharRain
        rows={3}
        cols={cols}
        density={_winDefaults?.density ?? 0.4}
        fps={bootFps}
        charSet={bootCharSet}
        headLength={4}
        tailLength={_winDefaults?.tailLength ?? 5}
      />
      <Box>
        <Text color={S.SHADOW}>
          {`   ▶ PANDA CODE  ·  v${MACRO.VERSION}  ·  SYSTEM INITIALIZED  ·  ⏎ skip`}
        </Text>
      </Box>
    </Box>
  )
}
