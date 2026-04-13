// Input: text, useBriefLayout, timestamp
// Output: Matrix-themed thinking text with green gradient ultrathink
// Pos: messages/ — thinking 文本高亮渲染
// 一旦我被修改，请更新 messages/README.md
import { c as _c } from "react/compiler-runtime";
import figures from 'figures';
import * as React from 'react';
import { useContext } from 'react';
import { useQueuedMessage } from '../../context/QueuedMessageContext.js';
import { Box, Text } from '../../ink.js';
import { formatBriefTimestamp } from '../../utils/formatBriefTimestamp.js';
import { findThinkingTriggerPositions, getRainbowColor, isUltrathinkEnabled } from '../../utils/thinking.js';
import { MessageActionsSelectedContext } from '../messageActions.js';
import { isMatrixTheme } from '../MatrixTheme/isMatrixTheme.js';
import { MATRIX_SCALE } from '../MatrixTheme/matrixPalette.js';

// Matrix green gradient for ultrathink (replaces rainbow)
const MATRIX_GRADIENT = [
  MATRIX_SCALE.DEEP,    // #064E0B — G2
  MATRIX_SCALE.SHADOW,  // #098C12 — G3
  MATRIX_SCALE.NEON,    // #0DF216 — G5
  MATRIX_SCALE.BRIGHT,  // #3CF83E — G6
  MATRIX_SCALE.NEON,    // #0DF216 — G5
  MATRIX_SCALE.SHADOW,  // #098C12 — G3
] as const;

function getMatrixGradientColor(charIndex: number): string {
  return MATRIX_GRADIENT[charIndex % MATRIX_GRADIENT.length]!;
}

type Props = {
  text: string;
  useBriefLayout?: boolean;
  timestamp?: string;
};
export function HighlightedThinkingText(t0: Props) {
  const $ = _c(31);
  const {
    text,
    useBriefLayout,
    timestamp
  } = t0;
  const isQueued = useQueuedMessage()?.isQueued ?? false;
  const isSelected = useContext(MessageActionsSelectedContext);
  const matrix = isMatrixTheme();
  const pointerColor = matrix ? MATRIX_SCALE.SHADOW : (isSelected ? "suggestion" : "subtle");
  const textColor = matrix ? MATRIX_SCALE.BASE : "text";             // #0BBF18 in Matrix
  const subtleColor = matrix ? MATRIX_SCALE.SHADOW : undefined;      // #098C12 in Matrix
  if (useBriefLayout) {
    let t1;
    if ($[0] !== timestamp) {
      t1 = timestamp ? formatBriefTimestamp(timestamp) : "";
      $[0] = timestamp;
      $[1] = t1;
    } else {
      t1 = $[1];
    }
    const ts = t1;
    const t2 = isQueued ? (matrix ? MATRIX_SCALE.SHADOW : "subtle") : (matrix ? MATRIX_SCALE.NEON : "briefLabelYou");
    let t3;
    if ($[2] !== t2) {
      t3 = <Text color={t2}>You</Text>;
      $[2] = t2;
      $[3] = t3;
    } else {
      t3 = $[3];
    }
    let t4;
    if ($[4] !== ts || $[5] !== subtleColor) {
      t4 = ts ? <Text dimColor={!matrix} color={subtleColor}> {ts}</Text> : null;
      $[4] = ts;
      $[5] = subtleColor;
      $[6] = t4;
    } else {
      t4 = $[6];
    }
    let t5;
    if ($[7] !== t3 || $[8] !== t4) {
      t5 = <Box flexDirection="row">{t3}{t4}</Box>;
      $[7] = t3;
      $[8] = t4;
      $[9] = t5;
    } else {
      t5 = $[9];
    }
    const t6 = isQueued ? (matrix ? MATRIX_SCALE.SHADOW : "subtle") : textColor;
    let t7;
    if ($[10] !== t6 || $[11] !== text) {
      t7 = <Text color={t6}>{text}</Text>;
      $[10] = t6;
      $[11] = text;
      $[12] = t7;
    } else {
      t7 = $[12];
    }
    let t8;
    if ($[13] !== t5 || $[14] !== t7) {
      t8 = <Box flexDirection="column" paddingLeft={2}>{t5}{t7}</Box>;
      $[13] = t5;
      $[14] = t7;
      $[15] = t8;
    } else {
      t8 = $[15];
    }
    return t8;
  }
  let parts;
  let t1;
  if ($[16] !== pointerColor || $[17] !== text || $[18] !== matrix || $[19] !== textColor) {
    t1 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const triggers = isUltrathinkEnabled() ? findThinkingTriggerPositions(text) : [];
      if (triggers.length === 0) {
        let t2;
        if ($[22] !== pointerColor) {
          t2 = <Text color={pointerColor}>{figures.pointer} </Text>;
          $[22] = pointerColor;
          $[23] = t2;
        } else {
          t2 = $[23];
        }
        let t3;
        if ($[24] !== text || $[25] !== textColor) {
          t3 = <Text color={textColor}>{text}</Text>;
          $[24] = text;
          $[25] = textColor;
          $[26] = t3;
        } else {
          t3 = $[26];
        }
        let t4;
        if ($[27] !== t2 || $[28] !== t3) {
          t4 = <Text>{t2}{t3}</Text>;
          $[27] = t2;
          $[28] = t3;
          $[29] = t4;
        } else {
          t4 = $[29];
        }
        t1 = t4;
        break bb0;
      }
      parts = [];
      let cursor = 0;
      for (const t of triggers) {
        if (t.start > cursor) {
          parts.push(<Text key={`plain-${cursor}`} color={textColor}>{text.slice(cursor, t.start)}</Text>);
        }
        for (let i = t.start; i < t.end; i++) {
          // Matrix: green gradient instead of rainbow
          const charColor = matrix
            ? getMatrixGradientColor(i - t.start)
            : getRainbowColor(i - t.start);
          parts.push(<Text key={`rb-${i}`} color={charColor}>{text[i]}</Text>);
        }
        cursor = t.end;
      }
      if (cursor < text.length) {
        parts.push(<Text key={`plain-${cursor}`} color={textColor}>{text.slice(cursor)}</Text>);
      }
    }
    $[16] = pointerColor;
    $[17] = text;
    $[18] = matrix;
    $[19] = textColor;
    $[20] = parts;
    $[21] = t1;
  } else {
    parts = $[20];
    t1 = $[21];
  }
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    return t1;
  }
  let t2;
  if ($[22] !== pointerColor) {
    t2 = <Text color={pointerColor}>{figures.pointer} </Text>;
    $[22] = pointerColor;
    $[23] = t2;
  } else {
    t2 = $[23];
  }
  let t3;
  if ($[28] !== parts || $[29] !== t2) {
    t3 = <Text>{t2}{parts}</Text>;
    $[28] = parts;
    $[29] = t2;
    $[30] = t3;
  } else {
    t3 = $[30];
  }
  return t3;
}
