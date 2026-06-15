import { c as _c } from "react/compiler-runtime";
import figures from 'figures';
import * as React from 'react';
import { Box, Text } from 'src/ink.js';
import { AGENT_COLOR_TO_THEME_COLOR, AGENT_COLORS, type AgentColorName } from 'src/tools/AgentTool/agentColorManager.js';
import type { PromptInputMode } from 'src/types/textInputTypes.js';
import { getTeammateColor } from 'src/utils/teammate.js';
import type { Theme } from 'src/utils/theme.js';
import { isAgentSwarmsEnabled } from '../../utils/agentSwarmsEnabled.js';
import { isMatrixTheme } from '../MatrixTheme/isMatrixTheme.js';
import { MATRIX_UI } from '../MatrixTheme/matrixPalette.js';
type Props = {
  mode: PromptInputMode;
  isLoading: boolean;
  viewingAgentName?: string;
  viewingAgentColor?: AgentColorName;
};

/**
 * Gets the theme color key for the teammate's assigned color.
 * Returns undefined if not a teammate or if the color is invalid.
 */
function getTeammateThemeColor(): keyof Theme | undefined {
  if (!isAgentSwarmsEnabled()) {
    return undefined;
  }
  const colorName = getTeammateColor();
  if (!colorName) {
    return undefined;
  }
  if (AGENT_COLORS.includes(colorName as AgentColorName)) {
    return AGENT_COLOR_TO_THEME_COLOR[colorName as AgentColorName];
  }
  return undefined;
}
type PromptCharProps = {
  isLoading: boolean;
  // Dead code elimination: parameter named themeColor to avoid "teammate" string in external builds
  themeColor?: keyof Theme;
};

/**
 * Display width (in terminal columns) of the prompt prefix rendered to the
 * left of the text input, by mode/theme. Must stay in lockstep with the
 * strings rendered in PromptChar / PromptInputModeIndicator below:
 *   - Matrix theme prompt char: 'neo ▸ ' / 'neo ▪ ' → 6 columns
 *   - bash mode (non-matrix):   '! '                → 2 columns
 *   - default prompt char:      figures.pointer+' ' → 2 columns
 *
 * Used by PromptInput to reserve exactly the prefix width when computing the
 * text input column budget, so Cursor wraps at the same width the <Text> box
 * actually has. A mismatch here is what made the Matrix prompt overflow and
 * collapse the input to a single truncated row.
 */
export function promptPrefixWidth(
  mode: PromptInputMode,
  viewingAgentName?: string,
): number {
  // When viewing an agent, the prefix is always the prompt char (never bash).
  if (!viewingAgentName && mode === 'bash') {
    return 2; // '! '
  }
  return isMatrixTheme() ? 6 : 2; // 'neo ▸ ' (6) vs figures.pointer+' ' (2)
}

/**
 * Renders the prompt character (❯).
 * Teammate color overrides the default color when set.
 * Matrix theme: renders "neo ▸" in green (#00ff41).
 */
function PromptChar(t0) {
  const $ = _c(3);
  const {
    isLoading,
    themeColor
  } = t0;
  const teammateColor = themeColor;
  const matrixActive = isMatrixTheme();
  const color = matrixActive ? MATRIX_UI.prompt : (teammateColor ?? (false ? "subtle" : undefined));
  let t1;
  if ($[0] !== color || $[1] !== isLoading) {
    t1 = matrixActive
      ? <Text color={MATRIX_UI.prompt} dimColor={isLoading}>{isLoading ? 'neo ▪ ' : 'neo ▸ '}</Text>
      : <Text color={color} dimColor={isLoading}>{figures.pointer} </Text>;
    $[0] = color;
    $[1] = isLoading;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}
export function PromptInputModeIndicator(t0) {
  const $ = _c(6);
  const {
    mode,
    isLoading,
    viewingAgentName,
    viewingAgentColor
  } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = getTeammateThemeColor();
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const teammateColor = t1;
  const viewedTeammateThemeColor = viewingAgentColor ? AGENT_COLOR_TO_THEME_COLOR[viewingAgentColor] : undefined;
  let t2;
  if ($[1] !== isLoading || $[2] !== mode || $[3] !== viewedTeammateThemeColor || $[4] !== viewingAgentName) {
    t2 = <Box alignItems="flex-start" alignSelf="flex-start" flexWrap="nowrap" justifyContent="flex-start">{viewingAgentName ? <PromptChar isLoading={isLoading} themeColor={viewedTeammateThemeColor} /> : mode === "bash" ? <Text color="bashBorder" dimColor={isLoading}>! </Text> : <PromptChar isLoading={isLoading} themeColor={isAgentSwarmsEnabled() ? teammateColor : undefined} />}</Box>;
    $[1] = isLoading;
    $[2] = mode;
    $[3] = viewedTeammateThemeColor;
    $[4] = viewingAgentName;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}
