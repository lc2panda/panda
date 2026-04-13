import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Box, Text, useTheme } from '../../ink.js';
import { getTheme, type Theme } from '../../utils/theme.js';
import { isMatrixTheme } from '../MatrixTheme/isMatrixTheme.js';
import { MATRIX_UI, MATRIX_SCALE } from '../MatrixTheme/matrixPalette.js';
import { getDefaultCharacters, interpolateColor, parseRGB, toRGBColor } from './utils.js';
const DEFAULT_CHARACTERS = getDefaultCharacters();
const SPINNER_FRAMES = [...DEFAULT_CHARACTERS, ...[...DEFAULT_CHARACTERS].reverse()];
// Matrix theme: denser braille ramp for a "data-stream" feel. Chosen to
// monotonically fill 1→8 dots so the spinner reads like a progress bar
// sweeping across the glyph. Used only when PANDA_THEME=matrix.
const MATRIX_SPINNER_FRAMES = ['⠁', '⠃', '⠇', '⡇', '⡏', '⡟', '⡿', '⣿', '⣾', '⣼', '⣸', '⣰', '⣠', '⣀'];
const MATRIX_GREEN = MATRIX_UI.spinner;
const REDUCED_MOTION_DOT = '●';
const REDUCED_MOTION_CYCLE_MS = 2000; // 2-second cycle: 1s visible, 1s dim
const ERROR_RED = {
  r: 171,
  g: 43,
  b: 63
};
type Props = {
  frame: number;
  messageColor: keyof Theme;
  stalledIntensity?: number;
  reducedMotion?: boolean;
  time?: number;
};
export function SpinnerGlyph(t0) {
  const $ = _c(9);
  const {
    frame,
    messageColor,
    stalledIntensity: t1,
    reducedMotion: t2,
    time: t3
  } = t0;
  const stalledIntensity = t1 === undefined ? 0 : t1;
  const reducedMotion = t2 === undefined ? false : t2;
  const time = t3 === undefined ? 0 : t3;
  const [themeName] = useTheme();
  const theme = getTheme(themeName);
  // Matrix theme: opt-in via PANDA_THEME=matrix. Swaps frames to a denser
  // braille ramp and forces a #00ff41 neon-green color. The escape early-
  // returns so default code paths stay byte-equal when isMatrixTheme() is false.
  if (isMatrixTheme()) {
    if (reducedMotion) {
      const isDim = Math.floor(time / (REDUCED_MOTION_CYCLE_MS / 2)) % 2 === 1;
      return <Box flexWrap="wrap" height={1} width={2}><Text color={MATRIX_GREEN} dimColor={isDim}>{REDUCED_MOTION_DOT}</Text></Box>;
    }
    const matrixChar = MATRIX_SPINNER_FRAMES[frame % MATRIX_SPINNER_FRAMES.length];
    // Smooth pulse: interpolate SHADOW → NEON → BRIGHT based on continuous sine phase
    const pulsePhase = Math.sin(frame * 0.15) * 0.5 + 0.5;
    const SHADOW_RGB = { r: 9, g: 140, b: 18 };
    const NEON_RGB = { r: 13, g: 242, b: 22 };
    const BRIGHT_RGB = { r: 60, g: 248, b: 62 };
    // 0→0.5: SHADOW→NEON, 0.5→1: NEON→BRIGHT
    const pulseRGB = pulsePhase <= 0.5
      ? interpolateColor(SHADOW_RGB, NEON_RGB, pulsePhase * 2)
      : interpolateColor(NEON_RGB, BRIGHT_RGB, (pulsePhase - 0.5) * 2);
    const pulseColor = toRGBColor(pulseRGB);
    return <Box flexWrap="wrap" height={1} width={2}><Text color={pulseColor}>{matrixChar}</Text></Box>;
  }
  if (reducedMotion) {
    const isDim = Math.floor(time / (REDUCED_MOTION_CYCLE_MS / 2)) % 2 === 1;
    let t4;
    if ($[0] !== isDim || $[1] !== messageColor) {
      t4 = <Box flexWrap="wrap" height={1} width={2}><Text color={messageColor} dimColor={isDim}>{REDUCED_MOTION_DOT}</Text></Box>;
      $[0] = isDim;
      $[1] = messageColor;
      $[2] = t4;
    } else {
      t4 = $[2];
    }
    return t4;
  }
  const spinnerChar = SPINNER_FRAMES[frame % SPINNER_FRAMES.length];
  if (stalledIntensity > 0) {
    const baseColorStr = theme[messageColor];
    const baseRGB = baseColorStr ? parseRGB(baseColorStr) : null;
    if (baseRGB) {
      const interpolated = interpolateColor(baseRGB, ERROR_RED, stalledIntensity);
      return <Box flexWrap="wrap" height={1} width={2}><Text color={toRGBColor(interpolated)}>{spinnerChar}</Text></Box>;
    }
    const color = stalledIntensity > 0.5 ? "error" : messageColor;
    let t4;
    if ($[3] !== color || $[4] !== spinnerChar) {
      t4 = <Box flexWrap="wrap" height={1} width={2}><Text color={color}>{spinnerChar}</Text></Box>;
      $[3] = color;
      $[4] = spinnerChar;
      $[5] = t4;
    } else {
      t4 = $[5];
    }
    return t4;
  }
  let t4;
  if ($[6] !== messageColor || $[7] !== spinnerChar) {
    t4 = <Box flexWrap="wrap" height={1} width={2}><Text color={messageColor}>{spinnerChar}</Text></Box>;
    $[6] = messageColor;
    $[7] = spinnerChar;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  return t4;
}
