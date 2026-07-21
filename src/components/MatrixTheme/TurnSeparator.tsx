// Input: turnIndex（参考用）+ 可选 width（响应式）
// Output: ╳ ─ ── ─── ─── ─── ── ─── ── ── ─── ─── ─ ╳ — 十字坐标 + 错落扫描线
// Pos: Messages.tsx roleChanged 处 TurnHeader 之前；turn 之间分隔
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// 历史：
//   v3.2: 5-turn 一次的 katakana 彩蛋移除，组件保留为 null-renderer。
//   v3.7 Pro 波次3（2026-04-29）: 复活并升级为「╳ 十字坐标 + 错落扫描线」分隔条。
// 设计目标：
//   1. 两端各一个 ╳ 十字坐标（中绿）— 标记 turn 边界
//   2. 中段错落虚线 ─ ── ─── ────（极暗 SHADOW）— 视觉节奏
//   3. mount 时种子一次（pattern 不抖动）
//   4. 静态，不做动效
//   5. 响应式：windowed columns 适配，最少 12 字符

import * as React from 'react';
import { useState } from 'react';
import { Box, Text } from '../../ink.js';
import { isMatrixTheme, isMatrixLight } from './isMatrixTheme.js';
import { MATRIX_SCALE, MATRIX_SCALE_LIGHT } from './matrixPalette.js';

interface Props {
  /** 参考 turn 序号（可作种子混合，避免相邻 turn 完全相同） */
  turnIndex: number;
  /** 终端列数；undefined 时退化为 60 字符默认宽度 */
  width?: number;
}

/**
 * 同上 LCG（与 StaticCharRain 同公式以保证测试可复现）。
 */
function makeRng(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/**
 * 生成扫描线 pattern：交替 dash 段（长度 1-4）+ 单空格分隔。
 *
 * 例：` ─ ── ─── ──── ─── ── `（含两端的 ╳ 各占 1 字符 + 各 1 个相邻空格）
 *
 * @param innerWidth 中段（不含两端 ╳ 与紧邻空格）字符数
 * @param seed       种子
 * @returns          中段 pattern 字符串（长度恰为 innerWidth）
 */
function generateDashPattern(innerWidth: number, seed: number): string {
  if (innerWidth <= 0) return '';
  const rng = makeRng(seed);
  let out = '';
  while (out.length < innerWidth) {
    // dash 段长度 1-4
    const dashLen = 1 + Math.floor(rng() * 4);
    const dashes = '\u2500'.repeat(dashLen); // ─
    // 间隔 1 空格
    const segment = dashes + ' ';
    // 截断不超 innerWidth
    if (out.length + segment.length > innerWidth) {
      out += ' '.repeat(innerWidth - out.length);
      break;
    }
    out += segment;
  }
  return out.slice(0, innerWidth);
}

export function TurnSeparator({ turnIndex, width }: Props): React.ReactNode {
  // 种子混合 turnIndex（不同 turn 看到不同分隔，但同一 turn 不抖动）
  // Hooks 必须无条件调用（React #300：theme 翻转时 early-return 会少 hook）
  const [seed] = useState(() => {
    const base = Math.floor(Math.random() * 0xffff_ffff);
    return (base ^ (turnIndex * 2654435761)) >>> 0; // 黄金比例哈希混合
  });

  if (!isMatrixTheme()) return null;

  // 默认宽度 60；响应式时由 props.width 覆盖
  const cols = width ?? 60;
  // 响应式下限 12 字符（极窄终端仍有最小可读分隔）
  const safeWidth = Math.max(12, cols);

  // 两端 ╳ 各占 1 字符，紧邻 1 空格 → 中段 = safeWidth - 4
  const innerWidth = Math.max(4, safeWidth - 4);

  const lightMode = isMatrixLight();
  const dashColor = lightMode ? MATRIX_SCALE_LIGHT.SHADOW : MATRIX_SCALE.SHADOW; // G3 极暗
  const crossColor = lightMode ? MATRIX_SCALE_LIGHT.NEON : MATRIX_SCALE.NEON; // G5 中绿

  const pattern = generateDashPattern(innerWidth, seed);

  return (
    <Box flexDirection="row" width={safeWidth}>
      <Text color={crossColor}>{'\u2573'}</Text>
      <Text> </Text>
      <Text color={dashColor}>{pattern}</Text>
      <Text> </Text>
      <Text color={crossColor}>{'\u2573'}</Text>
    </Box>
  );
}

/** 仅供测试的纯函数导出 */
export const __test_only__ = {
  generateDashPattern,
  makeRng,
};
