// Input: model + messages（用于算 ctx 用量）
// Output: Matrix 风格 HUD 单行 — ◢ model · ctx X/Y · ⟳ hit% · ◇ tps/min
// Pos: PromptInputFooter Matrix 分支专用；只在 isMatrixTheme() && 无自定义 statusLine 时渲染
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260418-05]
// 设计目标：T-D1 — 把现有 footer 的 model+ctx 极简两块扩展为 4 段 HUD：
//   ◢ model           — 模型名（去 -YYYYMMDD 尾）
//   ctx used/max      — 输入+输出 token / 上下文窗口
//   ⟳ hit%            — cache hit 比例
//   ◇ tps/min         — 输出 token 速率（基于会话总时长粗估）
// 标签 hint+dim、数值 statusLine；ctx > 80% 数值变 warning；任一段缺数据则跳过。
// 仅 Matrix 主题生效；其它主题不引用本文件。

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Text } from '../../ink.js'
import { isMatrixTheme, isMatrixLight } from './isMatrixTheme.js'
import { useMatrixUI } from '../../hooks/useMatrixUI.js'
import {
  getTotalCacheReadInputTokens,
  getTotalCacheCreationInputTokens,
} from '../../bootstrap/state.js'
import { getContextWindowForModel } from '../../utils/context.js'
import { getCurrentUsage } from '../../utils/tokens.js'
import { getTotalOutputTokens, getTotalDuration } from '../../cost-tracker.js'
import { MATRIX_SCALE, MATRIX_SCALE_LIGHT } from './matrixPalette.js'
import type { Message } from '../../types/message.js'
import type { ModelName } from '../../utils/model/model.js'

// v3 P7: ctx > 80% 时数值字段在 warning ↔ FLASH 间周期闪烁（1.2s 周期）
function useWarnFlash(active: boolean, periodMs = 1200): boolean {
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!active) {
      setOn(false)
      return
    }
    const id = setInterval(() => setOn(v => !v), periodMs / 2)
    return () => clearInterval(id)
  }, [active, periodMs])
  return on
}

interface Props {
  model: ModelName | null | undefined
  messages: Message[]
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export function MatrixHUD({ model, messages }: Props): React.ReactNode {
  if (!isMatrixTheme()) return null
  const ui = useMatrixUI()

  // 模型名（去 -YYYYMMDD 尾）
  const modelName = model ? String(model).replace(/-\d{8}$/, '') : null

  // ctx used/max
  const usage = getCurrentUsage(messages)
  const used = usage.input_tokens + usage.output_tokens
  const ctxMax = model ? getContextWindowForModel(model, []) : 0
  const ctxPct = ctxMax > 0 ? used / ctxMax : 0
  const ctxStr = ctxMax > 0 ? `${fmtNum(used)}/${fmtNum(ctxMax)}` : null
  // P7: ctx > 80% 启用闪烁；交替 warning ↔ FLASH（高对比 alarm，无关高亮带）
  const ctxOver = ctxPct > 0.8
  const ctxFlashing = useWarnFlash(ctxOver)
  const flashHi = isMatrixLight() ? MATRIX_SCALE_LIGHT.FLASH : MATRIX_SCALE.FLASH
  const ctxColor = ctxOver ? (ctxFlashing ? flashHi : ui.warning) : ui.statusLine

  // cache hit%
  const cacheRead = getTotalCacheReadInputTokens()
  const cacheCreate = getTotalCacheCreationInputTokens()
  const cacheTotal = cacheRead + cacheCreate
  const hitPct = cacheTotal > 0 ? Math.round((cacheRead / cacheTotal) * 100) : null

  // tps/min — output tokens / total session minutes
  const totalOut = getTotalOutputTokens()
  const totalDurMs = getTotalDuration()
  const tpsMin = totalDurMs > 0 ? Math.round((totalOut / (totalDurMs / 1000)) * 60) : null

  // 不渲染空 HUD（无 model 也无 ctx）
  if (!modelName && !ctxStr && hitPct === null && tpsMin === null) return null

  return (
    <Text>
      {modelName && (
        <>
          <Text color={ui.hint} dimColor>{'\u25E2 '}</Text>
          <Text color={ui.statusLine}>{modelName}</Text>
          {/* P9.4: 模型字段后挂一个 ▎ active indicator（呼吸 dot 由 TurnHeader 已渲，HUD 这里恒亮） */}
          <Text color={ui.toolName}>{'\u258E'}</Text>
        </>
      )}
      {ctxStr && (
        <>
          <Text color={ui.hint} dimColor>{'  \u00B7  ctx '}</Text>
          <Text color={ctxColor}>{ctxStr}</Text>
        </>
      )}
      {hitPct !== null && (
        <>
          <Text color={ui.hint} dimColor>{'  \u00B7  \u27F3 '}</Text>
          <Text color={ui.statusLine}>{`${hitPct}%`}</Text>
        </>
      )}
      {tpsMin !== null && tpsMin > 0 && (
        <>
          <Text color={ui.hint} dimColor>{'  \u00B7  \u25C7 '}</Text>
          <Text color={ui.statusLine}>{`${fmtNum(tpsMin)}/min`}</Text>
        </>
      )}
    </Text>
  )
}
