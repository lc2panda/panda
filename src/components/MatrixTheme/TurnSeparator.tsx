// Input: turnIndex（参考用，决定是否触发彩蛋帧）
// Output: turn 之间的极简分隔行 — 主帧：── · ── · ── · ── · ──（DEEP 色）
//         每 5 turn 换 katakana 彩蛋：ｱ  ﾑ    7    ﾝ  ﾄ    ﾞ
// Pos: Messages.tsx roleChanged 处 TurnHeader 之前插入
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260418-22] · v3 P4：替代之前 marginTop={1} 的纯空白留白，
// 给 turn 边界一个极轻的视觉锚点。颜色全部走 DEEP（roleSeparator），不抢眼。

import * as React from 'react'
import { Box, Text } from '../../ink.js'
import { isMatrixLight, isMatrixTheme } from './isMatrixTheme.js'
import { MATRIX_UI, MATRIX_UI_LIGHT, ageToHex, ageToHexLight } from './matrixPalette.js'

// 主分隔帧：5 个 ── · 节拍，居中、居前留 3 空格缩进对齐 gutter
const MAIN_PATTERN = '   \u2500\u2500 \u00B7 \u2500\u2500 \u00B7 \u2500\u2500 \u00B7 \u2500\u2500 \u00B7 \u2500\u2500'
// 彩蛋帧：稀疏 katakana — 更"残影/数据流"
const EASTER_PATTERN = '   \uFF71  \uFF91    7    \uFF9D  \uFF84    \uFF9E'
const EASTER_INTERVAL = 5

interface Props {
  /** 参考 turn 序号（不必严格连续，仅决定 % 5 == 0 是否触发彩蛋） */
  turnIndex: number
}

export function TurnSeparator({ turnIndex }: Props): React.ReactNode {
  if (!isMatrixTheme()) return null
  const lightMode = isMatrixLight()
  const ui = lightMode ? MATRIX_UI_LIGHT : MATRIX_UI
  const baseColor = ui.roleSeparator
  // 彩蛋色比主色稍亮一档（age 0.7 ≈ TAIL→FADE 中段）
  const easterColor = lightMode ? ageToHexLight(0.7) : ageToHex(0.7)

  // v3.1 (指挥官实测反馈)：常规 ── · ── 分隔每 turn 都出现造成阅读负担。
  // 改为只保留 5-turn 一次的 katakana decay 彩蛋；其余 turn 之间走纯空白留白。
  const isEaster = turnIndex > 0 && turnIndex % EASTER_INTERVAL === 0
  if (!isEaster) return null

  return (
    <Box marginTop={1} marginBottom={0}>
      <Text color={easterColor} dimColor>
        {EASTER_PATTERN}
      </Text>
    </Box>
  )
}
