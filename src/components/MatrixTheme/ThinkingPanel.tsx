// Input: text (thinking 完整正文) + 可选 collapseAt 行数阈值 (默认 4)
// Output: Matrix 主题下的 thinking 折叠面板 — TurnGutter (thinking) 包裹 + TurnHeader + 行数提示
// Pos: 仅在 isMatrixTheme() 时被 AssistantThinkingMessage matrix 分支调用
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260418-04]
// 设计：T-B1 — 把原 "⟩⟩ THINKING ━━━" + paddingLeft 平铺布局，
//   统一改成 thinkingGutter ╎ + ∴ thinking · N lines 单行 header；
//   长内容（> collapseAt）默认折叠摘要，按 ctrl+o 展开（复用 transcript / verbose 路径）。
//   本组件本身不实现 keypress；展开决策由调用方传入 expanded 控制。

import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { TurnGutter } from './TurnGutter.js';
import { TurnHeader } from './TurnHeader.js';
import { useMatrixUI } from '../../hooks/useMatrixUI.js';
import { isZh } from '../../utils/i18n.js';

interface Props {
  /** thinking 文本正文 */
  text: string;
  /** 是否处于展开态。false 时只展示 header + 行数摘要 */
  expanded?: boolean;
  /** 折叠阈值（默认 4 行）— 仅当 expanded=true 时影响默认展示 */
  collapseAt?: number;
}

export function ThinkingPanel({ text, expanded = true, collapseAt = 4 }: Props): React.ReactNode {
  const ui = useMatrixUI();
  const lines = text.split('\n');
  const lineCount = lines.length;
  const summary = isZh()
    ? `∴ thinking · ${lineCount} 行`
    : `∴ thinking · ${lineCount} ${lineCount === 1 ? 'line' : 'lines'}`;

  // 折叠态：只显示行数摘要
  if (!expanded) {
    return (
      <TurnGutter role="thinking">
        <TurnHeader role="thinking" />
        <Text color={ui.thinkingBody} dimColor>
          {'  '}
          {summary}
        </Text>
      </TurnGutter>
    );
  }

  // 展开态：长内容（> collapseAt）头尾保留，中间折叠提示行数
  let displayLines: string[] = lines;
  if (lineCount > collapseAt * 2) {
    const head = lines.slice(0, collapseAt);
    const tail = lines.slice(-collapseAt);
    const hidden = lineCount - head.length - tail.length;
    const ellipsis = isZh() ? `… ${hidden} 行已折叠 …` : `… ${hidden} lines hidden …`;
    displayLines = [...head, ellipsis, ...tail];
  }

  return (
    <TurnGutter role="thinking">
      <TurnHeader role="thinking" />
      {displayLines.map((line, i) => (
        <Text key={i} color={ui.thinkingBody} dimColor>
          {'  '}
          {line}
        </Text>
      ))}
    </TurnGutter>
  );
}
