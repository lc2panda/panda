// Input: 无（运行时从 isMatrixLight 判断变体）
// Output: cli-highlight 兼容的 Theme 对象（dark/light 两套），按 highlight.js 类别上色
// Pos: HighlightedCodeFallback 在 isMatrixTheme() 时注入本 theme，让代码块用 phosphor 调色板
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260418-10]
// 设计目标：T-B2 — 用 Matrix phosphor 调色板替换 cli-highlight 默认 ANSI 配色。
// highlight.js 类别 → MATRIX_SCALE 颜色（gradient 从 GHOST/SHADOW 到 FLASH/BLOOM）：
//   keyword/built_in   → BRIGHT (G6) bold     — 控制流强调
//   string/regexp      → NEON   (G5)          — 字面量稳态
//   number/literal     → FLASH  (G8)          — 数值高亮
//   comment            → SHADOW (G3) italic   — 退回背景
//   function/title     → GLOW   (G7) bold     — 函数名亮
//   operator/punctuation → BASE (G4)          — 主体文本
//   class/type         → BRIGHT (G6)          — 类型醒目
//   variable           → BASE   (G4)
//   meta               → SHADOW (G3)          — 装饰性
//   error              → '#FF4040' bold       — 红色破绿基线警示

import chalk from 'chalk'
import { MATRIX_SCALE, MATRIX_SCALE_LIGHT, MATRIX_STATUS, MATRIX_STATUS_LIGHT } from './matrixPalette.js'
import { isMatrixLight } from './isMatrixTheme.js'

// cli-highlight Theme = Record<string, chalk.Chalk>
type ChalkLike = (s: string) => string

function buildTheme(scale: typeof MATRIX_SCALE | typeof MATRIX_SCALE_LIGHT, status: typeof MATRIX_STATUS | typeof MATRIX_STATUS_LIGHT): Record<string, ChalkLike> {
  return {
    keyword:         chalk.hex(scale.BRIGHT).bold,
    built_in:        chalk.hex(scale.BRIGHT).bold,
    type:            chalk.hex(scale.BRIGHT),
    literal:         chalk.hex(scale.FLASH),
    number:          chalk.hex(scale.FLASH),
    regexp:          chalk.hex(scale.NEON),
    string:          chalk.hex(scale.NEON),
    subst:           chalk.hex(scale.NEON),
    symbol:          chalk.hex(scale.GLOW),
    class:           chalk.hex(scale.BRIGHT).bold,
    function:        chalk.hex(scale.GLOW).bold,
    title:           chalk.hex(scale.GLOW).bold,
    params:          chalk.hex(scale.BASE),
    comment:         chalk.hex(scale.SHADOW).italic,
    doctag:          chalk.hex(scale.SHADOW).italic,
    meta:            chalk.hex(scale.SHADOW),
    'meta-keyword':  chalk.hex(scale.SHADOW),
    'meta-string':   chalk.hex(scale.NEON),
    section:         chalk.hex(scale.BRIGHT).bold,
    tag:             chalk.hex(scale.BRIGHT),
    name:            chalk.hex(scale.GLOW),
    'builtin-name':  chalk.hex(scale.BRIGHT).bold,
    attr:            chalk.hex(scale.BASE),
    attribute:       chalk.hex(scale.BASE),
    variable:        chalk.hex(scale.BASE),
    'template-tag':  chalk.hex(scale.BRIGHT),
    'template-variable': chalk.hex(scale.GLOW),
    operator:        chalk.hex(scale.BASE),
    punctuation:     chalk.hex(scale.BASE),
    bullet:          chalk.hex(scale.GLOW),
    code:            chalk.hex(scale.NEON),
    emphasis:        chalk.hex(scale.BASE).italic,
    strong:          chalk.hex(scale.BRIGHT).bold,
    formula:         chalk.hex(scale.NEON),
    link:            chalk.hex(scale.GLOW).underline,
    quote:           chalk.hex(scale.SHADOW).italic,
    addition:        chalk.hex(scale.BRIGHT),
    deletion:        chalk.hex(status.ERROR),
    error:           chalk.hex(status.ERROR).bold,
    default:         chalk.hex(scale.BASE),
  }
}

let _darkTheme: ReturnType<typeof buildTheme> | null = null
let _lightTheme: ReturnType<typeof buildTheme> | null = null

export function getMatrixSyntaxTheme(): Record<string, ChalkLike> {
  if (isMatrixLight()) {
    _lightTheme ??= buildTheme(MATRIX_SCALE_LIGHT, MATRIX_STATUS_LIGHT)
    return _lightTheme
  }
  _darkTheme ??= buildTheme(MATRIX_SCALE, MATRIX_STATUS)
  return _darkTheme
}
