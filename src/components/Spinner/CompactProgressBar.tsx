// Input: phase / percent / tokensProcessed / tokensTotal / elapsedMs / attempt
// Output: ASCII 进度条行（`[████░░░░] 53%  Phase…` + token + elapsed + attempt 第二行）
// Pos: components/Spinner 子模块，仅 /compact 时显示，复用 spinner 行外观
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"
import * as React from 'react'
import { Box, Text } from '../../ink.js'
import { formatDuration, formatNumber } from '../../utils/format.js'
import { isZh } from '../../utils/i18n.js'
import type { CompactProgressPhase } from '../../Tool.js'

const BAR_WIDTH = 16
const BAR_FILLED = '\u2588' // █
const BAR_EMPTY = '\u2591' // ░

export type CompactProgressState = {
  phase: CompactProgressPhase | null
  percent: number | null
  tokensProcessed: number | null
  tokensTotal: number | null
  attempt: number | null
  maxAttempts: number | null
  startedAt: number
  note: string | null
}

export function createInitialCompactProgress(
  now: number = Date.now(),
): CompactProgressState {
  return {
    phase: null,
    percent: null,
    tokensProcessed: null,
    tokensTotal: null,
    attempt: null,
    maxAttempts: null,
    startedAt: now,
    note: null,
  }
}

const PHASE_ZH: Record<CompactProgressPhase, string> = {
  'Pre-hooks': '运行预压缩钩子',
  Summarizing: '生成摘要',
  'Restoring files': '恢复文件',
  'Post-hooks': '运行后压缩钩子',
}

const PHASE_EN: Record<CompactProgressPhase, string> = {
  'Pre-hooks': 'Running PreCompact hooks',
  Summarizing: 'Generating summary',
  'Restoring files': 'Restoring files',
  'Post-hooks': 'Running PostCompact hooks',
}

/**
 * Build the 16-char ASCII bar. Percent is clamped to [0, 100] so off-by-one
 * estimations from the producer never render a malformed line. When percent
 * is null we render a fully empty bar — the spinner glyph above already
 * conveys "in progress" without a deceptive partial fill.
 */
export function renderBar(percent: number | null): string {
  if (percent === null || !Number.isFinite(percent)) {
    return BAR_EMPTY.repeat(BAR_WIDTH)
  }
  const clamped = Math.max(0, Math.min(100, percent))
  const filled = Math.round((clamped / 100) * BAR_WIDTH)
  return BAR_FILLED.repeat(filled) + BAR_EMPTY.repeat(BAR_WIDTH - filled)
}

export function renderPercent(percent: number | null): string {
  if (percent === null || !Number.isFinite(percent)) {
    return '  --%'
  }
  const clamped = Math.max(0, Math.min(100, percent))
  return `${String(Math.round(clamped)).padStart(3, ' ')}%`
}

export function renderPhaseLabel(phase: CompactProgressPhase | null): string {
  if (!phase) return ''
  return isZh() ? PHASE_ZH[phase] : PHASE_EN[phase]
}

export function buildSecondaryLine(state: CompactProgressState): string {
  const parts: string[] = []
  const zh = isZh()
  if (state.tokensProcessed !== null || state.tokensTotal !== null) {
    const processed = state.tokensProcessed ?? 0
    const total = state.tokensTotal
    if (total !== null && total > 0) {
      parts.push(
        `${zh ? '词元' : 'tokens'}: ${formatNumber(processed)} / ${formatNumber(total)}`,
      )
    } else if (processed > 0) {
      parts.push(`${zh ? '词元' : 'tokens'}: ${formatNumber(processed)}`)
    }
  }
  const elapsed = Date.now() - state.startedAt
  if (elapsed > 0) {
    parts.push(`${zh ? '耗时' : 'elapsed'}: ${formatDuration(elapsed)}`)
  }
  if (state.attempt !== null && state.maxAttempts !== null) {
    parts.push(
      `${zh ? '尝试' : 'attempt'} ${state.attempt}/${state.maxAttempts}`,
    )
  }
  if (state.note) parts.push(state.note)
  return parts.join(' \u00B7 ')
}

export type CompactProgressBarProps = {
  state: CompactProgressState
}

/**
 * Renders the two-line compact progress bar. Mounted below the existing
 * spinner row so the spinner glyph / amber warming (Worker A) stays
 * visible alongside the bar — they convey orthogonal signals (live vs
 * stage-locked progress).
 */
export function CompactProgressBar({
  state,
}: CompactProgressBarProps): React.ReactNode {
  const bar = renderBar(state.percent)
  const pct = renderPercent(state.percent)
  const label = renderPhaseLabel(state.phase)
  const secondary = buildSecondaryLine(state)
  return (
    <Box flexDirection="column" width="100%" paddingLeft={2}>
      <Box flexDirection="row" flexWrap="wrap">
        <Text color="claude">
          {'['}
          {bar}
          {']'}
        </Text>
        <Text dimColor> {pct}</Text>
        {label && <Text dimColor>{`  ${label}\u2026`}</Text>}
      </Box>
      {secondary && (
        <Box flexDirection="row" paddingLeft={3}>
          <Text dimColor>{secondary}</Text>
        </Box>
      )}
    </Box>
  )
}
