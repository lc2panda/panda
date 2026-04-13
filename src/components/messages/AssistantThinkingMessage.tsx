// Input: ThinkingBlock param, addMargin, isTranscriptMode, verbose, hideInTranscript
// Output: Matrix-enhanced thinking message (折叠态 spinner / 展开态 / 完成态)
// Pos: messages/ — AI 思考过程的终端可视化
// 一旦我被修改，请更新 messages/README.md
import { c as _c } from "react/compiler-runtime";
import type { ThinkingBlock, ThinkingBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import React, { useState, useEffect } from 'react';
import { Box, Text } from '../../ink.js';
import { CtrlOToExpand } from '../CtrlOToExpand.js';
import { Markdown } from '../Markdown.js';
import { isZh } from '../../utils/i18n.js';
import { isMatrixTheme } from '../MatrixTheme/isMatrixTheme.js';
import { MATRIX_UI, MATRIX_SCALE } from '../MatrixTheme/matrixPalette.js';
type Props = {
  // Accept either full ThinkingBlock/ThinkingBlockParam or a minimal shape with just type and thinking
  param: ThinkingBlock | ThinkingBlockParam | {
    type: 'thinking';
    thinking: string;
  };
  addMargin: boolean;
  isTranscriptMode: boolean;
  verbose: boolean;
  /** When true, hide this thinking block entirely (used for past thinking in transcript mode) */
  hideInTranscript?: boolean;
};

// Braille spinner frames (dots2 pattern)
const BRAILLE_FRAMES = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];
const SPINNER_INTERVAL = 80; // ms per frame

// Pulse colors for spinner
const PULSE_NEON = MATRIX_SCALE.NEON;     // #0DF216
const PULSE_BRIGHT = MATRIX_SCALE.BRIGHT; // #3CF83E

/**
 * Matrix braille spinner hook — animates at 80ms/frame with color pulse
 */
function useMatrixSpinner(enabled: boolean): { frame: string; color: string } {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % BRAILLE_FRAMES.length);
    }, SPINNER_INTERVAL);
    return () => clearInterval(id);
  }, [enabled]);

  // Pulse between NEON and BRIGHT using sin wave
  const pulse = Math.sin(frameIndex * Math.PI / BRAILLE_FRAMES.length);
  const color = pulse > 0.5 ? PULSE_BRIGHT : PULSE_NEON;

  return { frame: BRAILLE_FRAMES[frameIndex]!, color };
}

export function AssistantThinkingMessage(t0: Props) {
  const {
    param: t1,
    addMargin: t2,
    isTranscriptMode,
    verbose,
    hideInTranscript: t3
  } = t0;
  const {
    thinking
  } = t1;
  const addMargin = t2 === undefined ? false : t2;
  const hideInTranscript = t3 === undefined ? false : t3;

  // --- Matrix detection outside memo cache (P0 fix) ---
  const matrix = isMatrixTheme();
  const spinnerEnabled = matrix && !isTranscriptMode && !verbose;
  const spinner = useMatrixSpinner(spinnerEnabled);

  if (!thinking) {
    return null;
  }
  if (hideInTranscript) {
    return null;
  }
  const shouldShowFullThinking = isTranscriptMode || verbose;
  if (!shouldShowFullThinking) {
    // ── Collapsed state (AI is thinking) ──
    const marginTop = addMargin ? 1 : 0;
    if (matrix) {
      // Matrix: ⟩⟩ THINKING ⣾  (ctrl+o to expand)
      return (
        <Box marginTop={marginTop}>
          <Text color={MATRIX_SCALE.NEON} bold>{"\u27E9\u27E9"} THINKING </Text>
          <Text color={spinner.color}>{spinner.frame}</Text>
          <Text color={MATRIX_SCALE.SHADOW} italic> <CtrlOToExpand /></Text>
        </Box>
      );
    }
    // Non-matrix: original behavior
    return (
      <Box marginTop={marginTop}>
        <Text dimColor={true} italic={true}>
          {isZh() ? "\u2234 思考中" : "\u2234 Thinking"} <CtrlOToExpand />
        </Text>
      </Box>
    );
  }

  // ── Expanded state (user pressed Ctrl+O) ──
  const marginTop = addMargin ? 1 : 0;
  const displayThinking = verbose ? thinking : (thinking.length > 200 ? thinking.slice(0, 200) + (isZh() ? '…\n\n_Ctrl+O 展开完整思考_' : '…\n\n_Ctrl+O to expand full thinking_') : thinking);

  if (matrix) {
    // Matrix expanded: ⟩⟩ THINKING ━━━━━━━━━━
    return (
      <Box flexDirection="column" gap={1} marginTop={marginTop} width="100%">
        <Text>
          <Text color={MATRIX_SCALE.NEON} bold>{"\u27E9\u27E9"} THINKING</Text>
          <Text color={MATRIX_SCALE.SHADOW}> ━━━━━━━━━━</Text>
        </Text>
        <Box paddingLeft={2}>
          <Markdown dimColor={true} color={MATRIX_SCALE.BASE}>{displayThinking}</Markdown>
        </Box>
      </Box>
    );
  }

  // Non-matrix: original behavior
  return (
    <Box flexDirection="column" gap={1} marginTop={marginTop} width="100%">
      <Text dimColor={true} italic={true}>
        {isZh() ? "\u2234 思考中" : "\u2234 Thinking"}…
      </Text>
      <Box paddingLeft={2}>
        <Markdown dimColor={true}>{displayThinking}</Markdown>
      </Box>
    </Box>
  );
}
