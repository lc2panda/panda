// Input: 字符 age（最近落下的越亮，越久越暗）
// Output: chalk-friendly RGB 颜色字符串
// Pos: MatrixTheme 颜色层
// 一旦我被修改，请更新 MatrixTheme/README.md

/**
 * Matrix 经典绿色梯度（白绿 → 中绿 → 暗绿 → 黑）
 * age 范围：0 (最新) → 1 (最老/消散)
 */
export interface RGB {
  r: number
  g: number
  b: number
}

const HEAD: RGB = { r: 200, g: 255, b: 200 } // 雨头亮绿
const MID: RGB = { r: 0, g: 255, b: 65 } // 经典 Matrix 绿
const TAIL: RGB = { r: 0, g: 100, b: 30 } // 暗绿
const FADE: RGB = { r: 0, g: 30, b: 10 } // 消散

/**
 * 按 age 插值返回 RGB。age ∈ [0, 1]。
 * 0-0.15: HEAD → MID
 * 0.15-0.5: MID → TAIL
 * 0.5-1: TAIL → FADE
 */
export function getColorByAge(age: number): RGB {
  const a = Math.max(0, Math.min(1, age))
  if (a < 0.15) return lerp(HEAD, MID, a / 0.15)
  if (a < 0.5) return lerp(MID, TAIL, (a - 0.15) / 0.35)
  return lerp(TAIL, FADE, (a - 0.5) / 0.5)
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
  TAIL,
  FADE,
  HEAD_HEX: toHex(HEAD),
  MID_HEX: toHex(MID),
  TAIL_HEX: toHex(TAIL),
  FADE_HEX: toHex(FADE),
}
