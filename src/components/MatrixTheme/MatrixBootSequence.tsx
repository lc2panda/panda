// Input: cols / rows / onDone callback
// Output: ~5.5s Matrix 启动动画（v2.14.1 refined with CRT scanline + cursor blink）
//         v2.22 (T-A1): 新增 bootlog 阶段 — 5 行 phosphor scan-in 系统启动诗句
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

type Phase = 'rain' | 'logo' | 'bootlog' | 'wakeup' | 'hold' | 'done'

// v3 P9.6: logo 显示完成后立即触发一次"通电"脉冲（150ms 全 logo BASE→FLASH→BASE）。
// 4 帧 ░▒▓█ —— 每帧 ~37ms，恰好 150ms 内打完。
const LOGO_PULSE_FRAMES = ['\u2591', '\u2592', '\u2593', '\u2588'] as const
const LOGO_PULSE_FRAME_MS = 37

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

// T-A1: 系统启动诗句 — 每行 [左正文, 右标签]
// 左 prefix '▸' 用 SHADOW，正文 BASE，右标签 BRIGHT
const BOOT_LINES: ReadonlyArray<readonly [string, string]> = [
  ['phosphor matrix online', 'ok'],
  ['neural link established', 'ok'],
  ['semantic vectors loaded', '1536d'],
  ['jack-in port: panda://localhost', 'ok'],
  ['welcome, operator', ''],
]
const BOOT_LINE_INTERVAL_MS = 140

const WAKE_UP_TEXT = '〔 W A K E   U P,   N E O … 〕'
// v2.22: 缩短 typewriter 让出 800ms 给 bootlog 阶段
const TYPE_INTERVAL_MS = 60
const CURSOR_BLINK_MS = 500

/**
 * Matrix 主题启动屏（~5.5s total, 按 ⏎/Esc 跳过）。
 *
 * 阶段（v2.22 T-A1 加入 bootlog 后）：
 *  - 0-500ms     rain    : 字符雨快速填屏（提升初始冲击感）
 *  - 500-2000ms  logo    : 字符雨 + Panda logo 淡入（1.5s, CRT scanline effect）
 *  - 2000-2800ms bootlog : 5 行 phosphor 系统启动诗句逐行 scan-in（每行 140ms）
 *  - 2800-4300ms wakeup  : "WAKE UP, NEO …" 打字机逐字显示 + blinking cursor（~1.5s）
 *  - 4300-5500ms hold    : 文字完整显示后停留 1.2s 让用户读完
 *  - 5500ms+     done    : 卸载 + onDone 回调
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
  const [shownLines, setShownLines] = useState(0)
  // P9.6: logo 通电脉冲 — phase 进入 logo 后 150ms 内 4 帧切色
  const [logoPulse, setLogoPulse] = useState(0)

  // rain 阶段时长：低能力终端缩短以减少渲染压力
  const rainDurationMs = _winDefaults ? 300 : 500
  const logoDurationMs = _winDefaults ? 1500 : 2000
  const bootlogDurationMs = 800
  const bootCharSet = _winDefaults?.charSet ?? 'mixed'
  const bootFps = _winDefaults?.fps ?? 30

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('logo'), rainDurationMs)
    const t2 = setTimeout(() => setPhase('bootlog'), logoDurationMs)
    const t3 = setTimeout(() => setPhase('wakeup'), logoDurationMs + bootlogDurationMs)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  // P9.6: logo 阶段开始时连推 4 帧脉冲
  useEffect(() => {
    if (phase !== 'logo') return
    if (logoPulse >= LOGO_PULSE_FRAMES.length) return
    const t = setTimeout(() => setLogoPulse(n => n + 1), LOGO_PULSE_FRAME_MS)
    return () => clearTimeout(t)
  }, [phase, logoPulse])

  // T-A1: bootlog 阶段每 140ms 推进一行
  useEffect(() => {
    if (phase !== 'bootlog') return
    if (shownLines >= BOOT_LINES.length) return
    const t = setTimeout(() => setShownLines(n => n + 1), BOOT_LINE_INTERVAL_MS)
    return () => clearTimeout(t)
  }, [phase, shownLines])

  // 进入 wakeup 时确保所有 bootlog 行已显示（防止跳过/快速过渡时残缺）
  useEffect(() => {
    if (phase === 'wakeup' || phase === 'hold' || phase === 'done') {
      setShownLines(BOOT_LINES.length)
    }
  }, [phase])

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
  const showBootLog = phase === 'bootlog' || phase === 'wakeup' || phase === 'hold'
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
            {PANDA_LOGO.map((line, i) => {
              // P9.6: pulse 阶段（logoPulse 0..LOGO_PULSE_FRAMES.length-1）整 logo 强制 FLASH
              // pulse 完成后回归 LOGO_COLORS 静态分布
              const inPulse = phase === 'logo' && logoPulse < LOGO_PULSE_FRAMES.length
              const color = inPulse ? S.FLASH : (LOGO_COLORS[i] || S.FLASH)
              return (
                <Text key={i} color={color}>
                  {line}
                </Text>
              )
            })}
            <Box height={1} />
            {/* T-A1: bootlog 阶段 — 5 行系统启动诗句逐行 phosphor scan-in
                左 ▸ 用 SHADOW（次级装饰），正文 BASE（可读主体），右标签 BRIGHT（强调） */}
            {showBootLog && (
              <Box flexDirection="column">
                {BOOT_LINES.slice(0, shownLines).map(([l, r], i) => (
                  <Text key={i}>
                    <Text color={S.SHADOW}>▸ </Text>
                    <Text color={S.BASE}>{l.padEnd(34, ' ')}</Text>
                    <Text color={S.BRIGHT}>{r}</Text>
                  </Text>
                ))}
                {/* reserve 行高，避免行数变化时框抖动 */}
                {Array.from({ length: BOOT_LINES.length - shownLines }).map((_, i) => (
                  <Text key={`pad-${i}`}> </Text>
                ))}
              </Box>
            )}
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
