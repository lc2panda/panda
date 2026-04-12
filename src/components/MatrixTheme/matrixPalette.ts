// Input: 字符 age（最近落下的越亮，越久越暗）
// Output: chalk-friendly RGB 颜色字符串
// Pos: MatrixTheme 颜色层
// 一旦我被修改，请更新 MatrixTheme/README.md

/**
 * Matrix 经典绿色梯度（白绿 → 中绿 → 暗绿 → 黑）
 * 基于 Rezmason/matrix 经典版 HSL(108°, 90%, L%) 色相
 * age 范围：0 (最新) → 1 (最老/消散)
 */
export interface RGB {
  r: number
  g: number
  b: number
}

// H=108° S=90% 色相体系（Rezmason 标准，比常见的 #00FF41 H=135° 更接近原版 phosphor 绿）
const HEAD: RGB = { r: 156, g: 251, b: 157 } // G8 flash — 雨头极亮
const MID: RGB = { r: 13, g: 242, b: 22 }    // G5 matrix — 经典绿
const TAIL: RGB = { r: 6, g: 78, b: 11 }     // G2 deep — 暗绿
const FADE: RGB = { r: 1, g: 13, b: 1 }      // G0 ghost — 消散

/**
 * 按 age 插值返回 RGB。age ∈ [0, 1]。
 * 5 级渐变模拟 phosphor 余辉衰减：
 * 0-0.10: HEAD → MID    (雨头极亮 → 经典绿，快速过渡)
 * 0.10-0.35: MID → MID_DIM (经典绿 → 暗化，平稳)
 * 0.35-0.60: MID_DIM → TAIL (暗化 → 暗绿)
 * 0.60-1.0: TAIL → FADE  (暗绿 → 消散，缓慢衰减)
 */
const MID_DIM: RGB = { r: 9, g: 140, b: 18 } // G3 shadow — 中间过渡色

export function getColorByAge(age: number): RGB {
  const a = Math.max(0, Math.min(1, age))
  if (a < 0.10) return lerp(HEAD, MID, a / 0.10)
  if (a < 0.35) return lerp(MID, MID_DIM, (a - 0.10) / 0.25)
  if (a < 0.60) return lerp(MID_DIM, TAIL, (a - 0.35) / 0.25)
  return lerp(TAIL, FADE, (a - 0.60) / 0.40)
}

function lerp(a: RGB, b: RGB, t: number): RGB {
  const tt = Math.max(0, Math.min(1, t))
  return {
    r: Math.round(a.r + (b.r - a.r) * tt),
    g: Math.round(a.g + (b.g - a.g) * tt),
    b: Math.round(a.b + (b.b - a.b) * tt),
  }
}

/**
 * 转 ink 兼容的 hex 颜色字符串 "#RRGGBB"。
 */
export function toHex(rgb: RGB): string {
  const h = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')
  return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`
}

/**
 * 便捷：直接 age → hex。
 */
export function ageToHex(age: number): string {
  return toHex(getColorByAge(age))
}

export const MATRIX_COLORS = {
  HEAD,
  MID,
  MID_DIM,
  TAIL,
  FADE,
  HEAD_HEX: toHex(HEAD),
  MID_HEX: toHex(MID),
  TAIL_HEX: toHex(TAIL),
  FADE_HEX: toHex(FADE),
}

// ─── Extended Matrix UI color scale (12 stops, H=108° S=90%) ────────
// Based on Rezmason/matrix classic palette (HSL hue 108°, saturation 90%).
// H=108° is more accurate to the original film's phosphor green than the
// commonly-used #00FF41 (H=135°). Each stop's contrast ratio against
// #000000 is noted for WCAG compliance.
//
// Alpha research ref: monitor/20260412-香草Matrix主题精细化.md

export const MATRIX_SCALE = {
  // ── Extreme bright (rare use) ──
  BLOOM:   '#F0FFF0',  // G11 — 20.3:1 — pure white-green phosphor peak
  CURSOR:  '#E0FEE1',  // G10 — 19.3:1 — rain head cursor
  WHITE:   '#C8FDC9',  // G9  — 17.9:1 — extreme highlight
  FLASH:   '#9CFB9D',  // G8  — 15.5:1 — rain head flash
  // ── High brightness ──
  GLOW:    '#6CFA6E',  // G7  — 13.0:1 — rain head glow area
  BRIGHT:  '#3CF83E',  // G6  — 10.8:1 — highlights, tool names
  // ── Core readable range ──
  NEON:    '#0DF216',  // G5  —  9.1:1 — classic Matrix green (prompt, emphasis)
  BASE:    '#0BBF18',  // G4  —  6.7:1 — body text base (AA ✅)
  // ── Dim / secondary ──
  SHADOW:  '#098C12',  // G3  —  4.3:1 — secondary text, gutter (AA large ✅)
  DEEP:    '#064E0B',  // G2  —  2.2:1 — rain tail, background layer
  // ── Near-invisible ──
  ABYSS:   '#031A03',  // G1  —  1.2:1 — extreme fade
  GHOST:   '#010D01',  // G0  —  1.1:1 — vanished
} as const

// Status colors — Matrix-themed but distinguishable
export const MATRIX_STATUS = {
  ERROR:   '#FF4040',  // Red — breaks green palette to signal danger (5.2:1)
  WARNING: '#C8E020',  // Yellow-green — retains green base (12.0:1)
  SUCCESS: '#3CF83E',  // G6 bright — positive signal
  INFO:    '#0DF216',  // G5 neon — standard info
} as const

// ─── Semantic UI mapping ────────────────────────────────────────────
// Every Matrix-themed component should import MATRIX_UI instead of
// hardcoding hex strings. Changing a value here propagates everywhere.
//
// Design principle: "minimal visual burden" — use NEON/BRIGHT sparingly
// for emphasis; BASE/SHADOW for body text and decorations.

export const MATRIX_UI = {
  // Prompt & input
  prompt:         MATRIX_SCALE.NEON,      // "neo ▸" prompt character (G5)
  promptDim:      MATRIX_SCALE.SHADOW,    // prompt when loading (G3)

  // Message gutter
  gutter:         MATRIX_SCALE.SHADOW,    // "╎" response prefix (G3)
  gutterDot:      MATRIX_SCALE.NEON,      // ● dot for queued tools (G5)

  // Borders & dialogs
  border:         MATRIX_SCALE.NEON,      // PermissionDialog border (G5)
  borderDim:      MATRIX_SCALE.SHADOW,    // secondary borders (G3)

  // Tool names & loader
  toolName:       MATRIX_SCALE.BRIGHT,    // bold tool-use name (G6)
  toolLoader:     MATRIX_SCALE.NEON,      // blinking dot / loader (G5)

  // Thinking
  thinking:       MATRIX_SCALE.NEON,      // "∴ Thinking" label (G5)
  thinkingBody:   MATRIX_SCALE.SHADOW,    // thinking content body (G3)

  // Spinner
  spinner:        MATRIX_SCALE.NEON,      // braille spinner glyph (G5)
  spinnerMsg:     MATRIX_SCALE.SHADOW,    // spinner message text (G3)

  // Footer & hints
  hint:           MATRIX_SCALE.SHADOW,    // "? for shortcuts" etc. (G3)
  statusLine:     MATRIX_SCALE.SHADOW,    // status bar text (G3)
  footerInfo:     MATRIX_SCALE.SHADOW,    // model · context info (G3)

  // System messages
  systemMsg:      MATRIX_SCALE.SHADOW,    // system text dimColor (G3)
  divider:        MATRIX_SCALE.SHADOW,    // message dividers (G3)

  // Chat chrome
  userMark:       MATRIX_SCALE.NEON,      // user message indicator "▸" (G5)
  assistantMark:  MATRIX_SCALE.NEON,      // assistant indicator "◉" (G5)

  // Status
  error:          MATRIX_STATUS.ERROR,
  warning:        MATRIX_STATUS.WARNING,
  success:        MATRIX_STATUS.SUCCESS,
  info:           MATRIX_STATUS.INFO,
} as const
