// Input: width (列数) + 可选 density / seed
// Output: 单行静态字符雨 — `▒ ░  ░ ▒    ░     ▒  ░  ░  ▒` 极暗散布
// Pos: ScreenFrame 顶/底 frame 之间 — 营造终端外壳上下呼应
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260426-MTX3-2] · v3.7 Pro 波次3 屏幕骨架
// 设计目标：
//   1. 单行渲染，由调用方控制行数（通常各挂 1 行）
//   2. 字符 ░ ▒（极暗深度）+ 空格，密度 ~25%
//   3. mount 时种子一次（useState 初始化）→ 不抖动 / 不重算
//   4. 颜色固定为 SHADOW (G3) — 不抢主色风头
//   5. 静态：本波次不做漂移动效（漂移留波次4，避免视觉负担）

import * as React from 'react';
import { useState } from 'react';
import { Box, Text } from '../../ink.js';
import { isMatrixTheme, isMatrixLight } from './isMatrixTheme.js';
import { MATRIX_SCALE, MATRIX_SCALE_LIGHT } from './matrixPalette.js';

interface StaticCharRainProps {
  /** 终端列数（通常传 useTerminalSize().columns） */
  width: number;
  /** 字符密度，默认 0.25（每 4 列 1 个字符） */
  density?: number;
  /** 自定义种子（测试用），undefined 则 mount 时随机一次 */
  seed?: number;
}

/**
 * 字符池：极暗深度密度字符。
 * - U+2591 ░ — 浅密度
 * - U+2592 ▒ — 中密度
 */
const CHAR_POOL = ['\u2591', '\u2592'];

/**
 * 用整数种子线性同余生成可复现的"伪随机"序列。
 * 简单 LCG（不依赖外部 RNG），避免 Math.random() 在每次 render 都重算。
 *
 * @param seed 整数种子
 * @returns 一个 () => number 函数，每次返回 [0, 1) 浮点
 */
function makeRng(seed: number): () => number {
  let state = seed >>> 0 || 1; // 避免 0
  return () => {
    // LCG: a=1664525, c=1013904223, m=2^32（Numerical Recipes 推荐）
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/**
 * 根据种子生成固定密度的字符串（width 长度）。
 * @param width 终端列数
 * @param density 0..1 密度（每位有此概率出字符，否则空格）
 * @param seed 种子
 */
function generatePattern(
  width: number,
  density: number,
  seed: number,
): string {
  const rng = makeRng(seed);
  let out = '';
  for (let i = 0; i < width; i++) {
    if (rng() < density) {
      const idx = Math.floor(rng() * CHAR_POOL.length);
      out += CHAR_POOL[idx]!;
    } else {
      out += ' ';
    }
  }
  return out;
}

/**
 * 静态字符雨单行组件。
 * mount 时一次性生成 pattern；后续 render 不重算（useState 持久化种子）。
 */
export function StaticCharRain(props: StaticCharRainProps): React.ReactNode {
  const { width, density = 0.25, seed } = props;

  // 种子持久化：seed prop 存在时用之；否则 mount 时一次性随机
  // Hooks 必须无条件调用（React #300：theme 翻转时 early-return 会少 hook）
  const [resolvedSeed] = useState(() =>
    seed !== undefined ? seed : Math.floor(Math.random() * 0xffff_ffff),
  );

  if (!isMatrixTheme()) return null;

  const lightMode = isMatrixLight();
  // 颜色：SHADOW (G3) — 极暗，不抢正文 / chrome 风头
  const color = lightMode ? MATRIX_SCALE_LIGHT.SHADOW : MATRIX_SCALE.SHADOW;

  if (width <= 0) return null;

  const pattern = generatePattern(width, density, resolvedSeed);

  return (
    <Box flexDirection="row" width={width}>
      <Text color={color}>{pattern}</Text>
    </Box>
  );
}

/** 仅供测试的纯函数导出（覆盖率：种子稳定 + 密度近似） */
export const __test_only__ = {
  generatePattern,
  makeRng,
  CHAR_POOL,
};
