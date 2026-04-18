// Input: text, useBriefLayout, timestamp
// Output: Matrix-themed user (OPERATOR) message — v3 chrome：
//   非 brief：[OPERATOR · ts] 顶标（仅 roleChanged 由父级决定是否传 timestamp 让 TurnHeader 渲）
//             ▌ GLOW gutter + 极深绿底 #001A00 包裹 user 文本
//   brief   ：保留原 You + ts 紧凑布局
// Pos: messages/ — user message 的核心入口，配合 Messages.tsx roleChanged 顶标决策
// 一旦我被修改，请更新 messages/README.md
//
// v3 P3：移除 React Compiler 缓存样板（手写 React），简化为正常 React 函数；
// React Compiler 会在编译期自动 memoize，无需手写 _c。

import figures from 'figures'
import * as React from 'react'
import { useContext } from 'react'
import { useQueuedMessage } from '../../context/QueuedMessageContext.js'
import { Box, Text } from '../../ink.js'
import { formatBriefTimestamp } from '../../utils/formatBriefTimestamp.js'
import {
  findThinkingTriggerPositions,
  getRainbowColor,
  isUltrathinkEnabled,
} from '../../utils/thinking.js'
import { MessageActionsSelectedContext } from '../messageActions.js'
import { isMatrixTheme } from '../MatrixTheme/isMatrixTheme.js'
import { MATRIX_SCALE, MATRIX_UI } from '../MatrixTheme/matrixPalette.js'
import { TurnGutter } from '../MatrixTheme/TurnGutter.js'

// Matrix green gradient for ultrathink (replaces rainbow)
const MATRIX_GRADIENT = [
  MATRIX_SCALE.DEEP,    // #064E0B — G2
  MATRIX_SCALE.SHADOW,  // #098C12 — G3
  MATRIX_SCALE.NEON,    // #0DF216 — G5
  MATRIX_SCALE.BRIGHT,  // #3CF83E — G6
  MATRIX_SCALE.NEON,    // #0DF216 — G5
  MATRIX_SCALE.SHADOW,  // #098C12 — G3
] as const

function getMatrixGradientColor(charIndex: number): string {
  return MATRIX_GRADIENT[charIndex % MATRIX_GRADIENT.length]!
}

type Props = {
  text: string
  useBriefLayout?: boolean
  timestamp?: string
}

/**
 * 渲染 ultrathink 触发段染色 + 普通段。返回 ReactNode 数组（已 keyed）。
 * 文本无 trigger 时直接返回单段 textColor 的 <Text>。
 */
function renderUltrathinkParts(
  text: string,
  textColor: string,
  matrix: boolean,
): React.ReactNode {
  const triggers = isUltrathinkEnabled() ? findThinkingTriggerPositions(text) : []
  if (triggers.length === 0) {
    return <Text color={textColor}>{text}</Text>
  }
  const parts: React.ReactNode[] = []
  let cursor = 0
  for (const t of triggers) {
    if (t.start > cursor) {
      parts.push(
        <Text key={`plain-${cursor}`} color={textColor}>
          {text.slice(cursor, t.start)}
        </Text>,
      )
    }
    for (let i = t.start; i < t.end; i++) {
      const charColor = matrix
        ? getMatrixGradientColor(i - t.start)
        : getRainbowColor(i - t.start)
      parts.push(
        <Text key={`rb-${i}`} color={charColor}>
          {text[i]}
        </Text>,
      )
    }
    cursor = t.end
  }
  if (cursor < text.length) {
    parts.push(
      <Text key={`plain-${cursor}`} color={textColor}>
        {text.slice(cursor)}
      </Text>,
    )
  }
  return <>{parts}</>
}

export function HighlightedThinkingText({
  text,
  useBriefLayout,
  timestamp,
}: Props): React.ReactNode {
  const isQueued = useQueuedMessage()?.isQueued ?? false
  const isSelected = useContext(MessageActionsSelectedContext)
  const matrix = isMatrixTheme()
  // body 文本基色
  const textColor = matrix ? MATRIX_SCALE.BASE : 'text'
  const subtleColor = matrix ? MATRIX_SCALE.SHADOW : undefined

  // ── brief 布局（紧凑模式 — Kairos 等 brief tool 使用，保留原行为）──
  if (useBriefLayout) {
    const ts = timestamp ? formatBriefTimestamp(timestamp) : ''
    const youColor = isQueued
      ? matrix
        ? MATRIX_SCALE.SHADOW
        : 'subtle'
      : matrix
        ? MATRIX_SCALE.NEON
        : 'briefLabelYou'
    const bodyColor = isQueued
      ? matrix
        ? MATRIX_SCALE.SHADOW
        : 'subtle'
      : textColor
    return (
      <Box flexDirection="column" paddingLeft={2}>
        <Box flexDirection="row">
          <Text color={youColor}>You</Text>
          {ts && (
            <Text dimColor={!matrix} color={subtleColor}>
              {' '}
              {ts}
            </Text>
          )}
        </Box>
        <Text color={bodyColor}>{text}</Text>
      </Box>
    )
  }

  // ── 普通布局：v3 OPERATOR-NEO chrome ──
  if (matrix) {
    // user 行整行极深绿底 + ▌ solid gutter（GLOW 色，由 TurnGutter role=user 自动派生）
    return (
      <Box flexDirection="row" backgroundColor={MATRIX_UI.userBg}>
        <TurnGutter role="user" style="solid">
          {renderUltrathinkParts(text, textColor, true)}
        </TurnGutter>
      </Box>
    )
  }

  // 非 Matrix 主题：保留原 ▸ pointer 行
  const pointerColor = isSelected ? 'suggestion' : 'subtle'
  return (
    <Text>
      <Text color={pointerColor}>{figures.pointer} </Text>
      {renderUltrathinkParts(text, textColor, false)}
    </Text>
  )
}
