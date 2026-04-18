// Input: 文本字符串
// Output: 拆 token 后带颜色标记的段（lineIndex 决定 BASE/NEON parity；关键词高亮 BRIGHT）
// Pos: AssistantTextMessage 在 Matrix 主题下前置 markdown 高亮（轻量，不替代 Markdown.tsx 完整渲染）
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260418-23] · v3 P5：
//   - 按行 parity 在 BASE / NEON 间交替，模拟 CRT scanline subtle 明暗带
//   - CamelCase / `code` / 数字 / URL / .ext 文件名等关键词 → BRIGHT
//   - 不破坏既有 Markdown 渲染（仅新增 ScanlineText 组件供需要的地方手工接入）
//
// 暴露：
//   - tokenizeScanline(text, lineParity) → Token[]   纯函数，方便测试
//   - <ScanlineText text=... lineIndex=... />          React 组件

import * as React from 'react'
import { Text } from '../../ink.js'
import {
  MATRIX_SCALE,
  MATRIX_SCALE_LIGHT,
} from './matrixPalette.js'
import { isMatrixLight } from './isMatrixTheme.js'

export type ScanlineColor = 'base' | 'neon' | 'bright'

export interface ScanlineToken {
  text: string
  color: ScanlineColor
}

// 关键词正则：依次匹配
//   1. inline `code`（反引号包裹，不含换行）
//   2. URL（http/https + 非空白）
//   3. 文件名带扩展（.tsx/.ts/.js/.json/.md/.py 等常见 4 字母内）
//   4. 数字（含小数）
//   5. CamelCase 标识符（>= 2 大小写交替段）
const KEYWORD_RE = /(`[^`\n]+`|https?:\/\/\S+|\b[\w./-]+\.[a-z]{1,5}\b|\b\d+(?:\.\d+)?\b|\b[A-Z][a-z]+(?:[A-Z][a-z0-9]*)+\b)/g

/**
 * 把单行文本切成 ScanlineToken[]。
 * @param text       单行文本（不含 \n）
 * @param lineParity 行号奇偶（0=偶 BASE，1=奇 NEON）
 */
export function tokenizeScanline(text: string, lineParity: 0 | 1): ScanlineToken[] {
  const baseColor: ScanlineColor = lineParity === 0 ? 'base' : 'neon'
  if (!text) return []
  const tokens: ScanlineToken[] = []
  let cursor = 0
  for (const m of text.matchAll(KEYWORD_RE)) {
    const idx = m.index ?? 0
    if (idx > cursor) {
      tokens.push({ text: text.slice(cursor, idx), color: baseColor })
    }
    tokens.push({ text: m[0], color: 'bright' })
    cursor = idx + m[0].length
  }
  if (cursor < text.length) {
    tokens.push({ text: text.slice(cursor), color: baseColor })
  }
  return tokens
}

function colorHex(c: ScanlineColor, lightMode: boolean): string {
  const S = lightMode ? MATRIX_SCALE_LIGHT : MATRIX_SCALE
  switch (c) {
    case 'base':
      return S.BASE
    case 'neon':
      return S.NEON
    case 'bright':
      return S.BRIGHT
  }
}

interface ScanlineTextProps {
  text: string
  /** 整段文本在父级中的行偏移；用于跨段落保持 parity 连续 */
  lineOffset?: number
}

/**
 * 多行文本按行 parity 渲染，关键词 BRIGHT 高亮。
 * 不处理 markdown 列表/标题等 — 仅处理 inline 染色。
 */
export function ScanlineText({ text, lineOffset = 0 }: ScanlineTextProps): React.ReactNode {
  const lightMode = isMatrixLight()
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        const parity: 0 | 1 = ((i + lineOffset) % 2 === 0 ? 0 : 1)
        const tokens = tokenizeScanline(line, parity)
        return (
          <Text key={i}>
            {tokens.length === 0 ? (
              ' '
            ) : (
              tokens.map((t, j) => (
                <Text key={j} color={colorHex(t.color, lightMode)}>
                  {t.text}
                </Text>
              ))
            )}
          </Text>
        )
      })}
    </>
  )
}
