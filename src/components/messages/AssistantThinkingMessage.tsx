// Input: ThinkingBlock param, addMargin, isTranscriptMode, verbose, hideInTranscript
// Output: Matrix-enhanced thinking message (折叠态 spinner / 展开态 / 完成态)
// Pos: messages/ — AI 思考过程的终端可视化
// 一旦我被修改，请更新 messages/README.md
import { c as _c } from "react/compiler-runtime";
import type { ThinkingBlock, ThinkingBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from '../../ink.js';
import { CtrlOToExpand } from '../CtrlOToExpand.js';
import { Markdown } from '../Markdown.js';
import { isZh } from '../../utils/i18n.js';
import { isMatrixTheme } from '../MatrixTheme/isMatrixTheme.js';
import { MATRIX_UI, MATRIX_SCALE } from '../MatrixTheme/matrixPalette.js';
import { ThinkingPanel } from '../MatrixTheme/ThinkingPanel.js';
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

  // 3-second auto-collapse: after thinking content appears, auto-collapse
  // to a single-line summary after a readable delay.
  const [autoCollapsed, setAutoCollapsed] = useState(false);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldShowFullThinking = isTranscriptMode || verbose;

  useEffect(() => {
    // Only auto-collapse when in expanded (non-collapsed) mode and not in
    // transcript/verbose mode (those always show full thinking).
    if (!shouldShowFullThinking || !thinking) return;

    // Start a 3-second timer to auto-collapse
    collapseTimerRef.current = setTimeout(() => {
      setAutoCollapsed(true);
    }, 3000);

    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    };
  }, [shouldShowFullThinking, thinking]);

  if (!thinking) {
    return null;
  }
  if (hideInTranscript) {
    return null;
  }
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

  // 10-line cap: show at most MAX_VISIBLE_LINES, fold the rest
  const MAX_VISIBLE_LINES = 10;
  const lines = thinking.split('\n');
  const totalLines = lines.length;
  const isOverCap = totalLines > MAX_VISIBLE_LINES;

  // After 3-sec auto-collapse, show single-line summary
  if (autoCollapsed && !verbose) {
    const summaryLine = lines[0]!.slice(0, 80) + (lines[0]!.length > 80 || totalLines > 1 ? '...' : '');
    if (matrix) {
      return (
        <Box marginTop={marginTop}>
          <Text color={MATRIX_SCALE.NEON} bold>{"\u27E9\u27E9"} </Text>
          <Text color={MATRIX_SCALE.SHADOW} italic>{summaryLine}</Text>
          <Text color={MATRIX_SCALE.SHADOW} italic> <CtrlOToExpand /></Text>
        </Box>
      );
    }
    return (
      <Box marginTop={marginTop}>
        <Text dimColor={true} italic={true}>
          {isZh() ? "\u2234 " : "\u2234 "}{summaryLine} <CtrlOToExpand />
        </Text>
      </Box>
    );
  }

  const displayThinking = isOverCap && !verbose
    ? lines.slice(0, MAX_VISIBLE_LINES).join('\n') +
      (isZh()
        ? `\n\n_... 还有 ${totalLines - MAX_VISIBLE_LINES} 行，Ctrl+O 展开_`
        : `\n\n_... ${totalLines - MAX_VISIBLE_LINES} more lines, Ctrl+O to expand_`)
    : thinking;

  if (matrix) {
    // T-B1: 用 TurnGutter (thinking) + TurnHeader 包裹，统一身份色 ╎ + ∴ 标签
    // ThinkingPanel 内部按 collapseAt 阈值自动头尾保留 + 中间折叠摘要
    return (
      <Box flexDirection="column" marginTop={marginTop} width="100%">
        <ThinkingPanel text={displayThinking} expanded={true} />
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
