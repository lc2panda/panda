// Input: 字符雨需要的字符池
// Output: 4 套字符集，按需选用
// Pos: MatrixTheme 基础数据层
// 一旦我被修改，请更新 MatrixTheme/README.md

/**
 * Half-width katakana — 标志性 Matrix 字符
 * 单字节宽度，渲染稳定，无字宽问题
 */
export const KATAKANA = 'ｦｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'.split(
  '',
)

/**
 * 数字 0-9
 */
export const DIGITS = '0123456789'.split('')

/**
 * 符号集 — 扁平字符
 */
export const SYMBOLS = '!@#$%&*+=-/<>?[]{}|~'.split('')

/**
 * 混合集 = katakana + digits + symbols（推荐）
 */
export const MIXED = [...KATAKANA, ...DIGITS, ...SYMBOLS]

/**
 * 纯 ASCII fallback（终端不支持 Unicode 时）
 */
export const ASCII_ONLY = [
  ...DIGITS,
  ...SYMBOLS,
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
]

export type CharSet = 'katakana' | 'digits' | 'symbols' | 'mixed' | 'ascii'

const SET_MAP: Record<CharSet, string[]> = {
  katakana: KATAKANA,
  digits: DIGITS,
  symbols: SYMBOLS,
  mixed: MIXED,
  ascii: ASCII_ONLY,
}

/**
 * 从指定字符集随机取一个字符。
 */
export function pickChar(
  set: CharSet = 'mixed',
  rng: () => number = Math.random,
): string {
  const pool = SET_MAP[set] || MIXED
  return pool[Math.floor(rng() * pool.length)]!
}

/**
 * 取字符池长度（用于 hash 测试）
 */
export function getSetSize(set: CharSet): number {
  return (SET_MAP[set] || MIXED).length
}
