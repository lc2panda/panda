// Input: 字符 age（最近落下的越亮，越久越暗）
// Output: chalk-friendly RGB 颜色字符串
// Pos: MatrixTheme 颜色层
// 一旦我被修改，请更新 MatrixTheme/README.md

/**
 * Matrix 经典绿色梯度（白绿 → 中绿 → 暗绿 → 黑）
 * 基于原版 Matrix 电影 phosphor CRT 色调 HSL(≈120°, ≈75%, L%)
 * age 范围：0 (最新) → 1 (最老/消散)
 */
export interface RGB {
  r: number
  g: number
  b: number
}

// H≈120° S≈75% 磷光绿色系（调制自原版 Matrix 电影 phosphor CRT 绿，
// 比 Rezmason H=108° S=90% 更柔和，长时间阅读不刺眼）
const HEAD: RGB = { r: 112, g: 221, b: 112 } // G8 flash — 雨头极亮（柔化）
const MID: RGB = { r: 32, g: 160, b: 32 }    // G5 neon — 主要绿（降饱和降亮）
const TAIL: RGB = { r: 10, g: 74, b: 10 }    // G2 deep — 暗绿
const FADE: RGB = { r: 2, g: 18, b: 2 }      // G0 ghost — 消散

/**
 * 按 age 插值返回 RGB。age ∈ [0, 1]。
 * 5 级渐变模拟 phosphor 余辉衰减：
 * 0-0.10: HEAD → MID    (雨头极亮 → 经典绿，快速过渡)
 * 0.10-0.35: MID → MID_DIM (经典绿 → 暗化，平稳)
 * 0.35-0.60: MID_DIM → TAIL (暗化 → 暗绿)
 * 0.60-1.0: TAIL → FADE  (暗绿 → 消散，缓慢衰减)
 */
const MID_DIM: RGB = { r: 16, g: 112, b: 16 } // G3 shadow — 中间过渡色（磷光衰减）

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

// ─── Extended Matrix UI color scale (12 stops, H≈120° S≈75%) ───────
// Retuned from Rezmason H=108° S=90% to authentic Matrix film phosphor
// green (H≈120°, S≈70-80%). Softer, less saturated — CRT phosphor glow
// rather than LED neon. Contrast ratios against #000000 noted for WCAG.
//
// Alpha research ref: monitor/20260412-香草Matrix主题精细化.md

export const MATRIX_SCALE = {
  // ── Extreme bright (rare use) ──
  BLOOM:   '#E8FFE8',  // G11 — ~20:1 — pure white-green phosphor peak
  CURSOR:  '#C0F0C0',  // G10 — ~17:1 — rain head cursor
  WHITE:   '#A0E8A0',  // G9  — ~15:1 — extreme highlight
  FLASH:   '#70DD70',  // G8  — ~11:1 — rain head flash
  // ── High brightness ──
  GLOW:    '#40CC40',  // G7  —  ~9:1 — rain head glow area
  BRIGHT:  '#33BB33',  // G6  —  ~7:1 — highlights, tool names, selection
  // ── Core readable range ──
  NEON:    '#20A020',  // G5  —  ~5:1 — prompt, emphasis (AA normal ✅)
  BASE:    '#1A8A1A',  // G4  — ~4.2:1 — body text base (AA large ✅)
  // ── Dim / secondary ──
  SHADOW:  '#107010',  // G3  — ~2.8:1 — secondary text, gutter (decorative)
  DEEP:    '#0A4A0A',  // G2  — ~1.6:1 — rain tail, background layer
  // ── Near-invisible ──
  ABYSS:   '#052505',  // G1  — ~1.2:1 — extreme fade
  GHOST:   '#021202',  // G0  — ~1.1:1 — vanished
} as const

// Status colors — Matrix-themed but distinguishable
export const MATRIX_STATUS = {
  ERROR:   '#FF4040',  // Red — breaks green palette to signal danger (5.2:1)
  WARNING: '#C8E020',  // Yellow-green — retains green base (12.0:1)
  SUCCESS: '#33BB33',  // G6 bright — positive signal (matches new scale)
  INFO:    '#20A020',  // G5 neon — standard info (matches new scale)
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
  gutter:         MATRIX_SCALE.DEEP,      // "╎" response prefix (G2 — subtle decoration)
  gutterDot:      MATRIX_SCALE.BRIGHT,    // ● dot for queued tools (G6 — stands out)

  // Borders & dialogs
  border:         MATRIX_SCALE.SHADOW,    // PermissionDialog border (G3 — doesn't compete w/ text)
  borderDim:      MATRIX_SCALE.DEEP,      // secondary borders (G2)

  // Tool names & loader
  toolName:       MATRIX_SCALE.BRIGHT,    // bold tool-use name (G6)
  toolLoader:     MATRIX_SCALE.NEON,      // blinking dot / loader (G5)

  // Thinking (body text at BASE G4 for comfortable reading)
  thinking:       MATRIX_SCALE.NEON,      // "∴ Thinking" label (G5)
  thinkingBody:   MATRIX_SCALE.BASE,      // thinking content body (G4)

  // Spinner (body text at BASE G4)
  spinner:        MATRIX_SCALE.NEON,      // braille spinner glyph (G5)
  spinnerMsg:     MATRIX_SCALE.BASE,      // spinner message text (G4)

  // Footer & hints (decorative hint/divider stay G3; info text → G4)
  hint:           MATRIX_SCALE.SHADOW,    // "? for shortcuts" etc. (G3 — decorative)
  statusLine:     MATRIX_SCALE.BASE,      // status bar text (G4)
  footerInfo:     MATRIX_SCALE.BASE,      // model · context info (G4)

  // System messages (body text → G4; divider stays G3 decorative)
  systemMsg:      MATRIX_SCALE.BASE,      // system text dimColor (G4)
  divider:        MATRIX_SCALE.SHADOW,    // message dividers (G3 — decorative)

  // Chat chrome — differentiated marks for user vs assistant
  userMark:       MATRIX_SCALE.BRIGHT,    // user message indicator "▸" (G6 — brighter)
  assistantMark:  MATRIX_SCALE.BASE,      // assistant indicator "◉" (G4 — softer)

  // Status
  error:          MATRIX_STATUS.ERROR,
  warning:        MATRIX_STATUS.WARNING,
  success:        MATRIX_STATUS.SUCCESS,
  info:           MATRIX_STATUS.INFO,

  // ── Diff view (Scheme A — brightness-layered) ───────────────────
  diffAdded:        MATRIX_SCALE.BRIGHT,    // '#3CF83E' — added line foreground
  diffRemoved:      '#FF4040',              // red — removed line foreground
  diffChanged:      '#C8E020',              // yellow-green — changed line foreground
  diffContext:       MATRIX_SCALE.SHADOW,   // '#098C12' — context line foreground
  diffHunkHeader:   MATRIX_SCALE.NEON,      // '#0DF216' — hunk header
  diffAddedBg:      '#001A00',              // deep dark green — added line bg
  diffRemovedBg:    '#1A0000',              // deep dark red — removed line bg
  diffChangedBg:    '#0D0D00',              // deep dark yellow — changed line bg
  diffAddedEmph:    MATRIX_SCALE.FLASH,     // '#9CFB9D' — added word highlight
  diffRemovedEmph:  '#FF8080',              // light red — removed word highlight
  diffChangedEmph:  '#E0FF40',              // light yellow-green — changed word highlight
  diffAddedEmphBg:  '#003300',              // added word highlight bg
  diffRemovedEmphBg:'#330000',              // removed word highlight bg

  // ── Progress bar ────────────────────────────────────────────────
  progressFill:     MATRIX_SCALE.NEON,      // '#0DF216'
  progressEmpty:    MATRIX_SCALE.DEEP,      // '#064E0B'

  // ── Dialog / Pane ───────────────────────────────────────────────
  dialogTitle:      MATRIX_SCALE.NEON,      // '#0DF216'
  dialogBorder:     MATRIX_SCALE.SHADOW,    // '#098C12'

  // ── Selection highlight ─────────────────────────────────────────
  selectHighlight:  MATRIX_SCALE.FLASH,    // '#70DD70' — strong contrast for selections

  // ── Pane divider character ──────────────────────────────────────
  paneChar:         '━',                    // Matrix-style heavy divider
} as const
