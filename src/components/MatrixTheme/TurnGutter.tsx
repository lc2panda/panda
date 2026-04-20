// Input: role + children + 可选 style ('solid' | 'line')
// Output: 左 1 字宽 gutter（身份色）+ 右内容；style='solid' 用 ▌ 实心条（user/OPERATOR），'line' 用 │ 细线（panda/tool/thinking）
// Pos: Matrix 主题消息渲染地基，被所有 *Message.tsx 包裹
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260418-01] · v3 升级：style prop 引入实心 ▌ vs 细线 │ 的双形态，配合 OPERATOR-NEO chrome 三维区分。
// 仅在 isMatrixTheme() 为 true 时生效；其它主题透传 children 不破坏既有 UX。

import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { MATRIX_UI, MATRIX_UI_LIGHT } from './matrixPalette.js';
import { isMatrixLight, isMatrixTheme } from './isMatrixTheme.js';
import { ROLE_TOKEN, type TurnRole } from './turnRole.js';

// 兼容历史 import（Phase 1 / 2 旧文件直接 import { TurnRole } from './TurnGutter'）
export type { TurnRole } from './turnRole.js';

/**
 * gutter 形态：
 * - 'solid'：用 ▌ 实心条（user/OPERATOR 高亮，配合 userBg 极深绿底强化身份）
 * - 'line' ：用 │ 细线（panda/tool/thinking 低调）
 */
export type GutterStyle = 'solid' | 'line';

interface Props {
  role: TurnRole;
  /** v3 P3：默认按 role 派生（user → solid，其它 → line），可显式覆盖 */
  style?: GutterStyle;
  children: React.ReactNode;
}

function defaultStyleForRole(role: TurnRole): GutterStyle {
  return role === 'user' ? 'solid' : 'line';
}

const GLYPH: Record<GutterStyle, string> = {
  solid: '\u258C', // ▌ 半角实心条
  line: '\u2502', // │ 单细线
};

export function TurnGutter({ role, style, children }: Props): React.ReactNode {
  if (!isMatrixTheme()) {
    // 非 Matrix 主题保持原行为，children 透传
    return <>{children}</>;
  }
  const ui = isMatrixLight() ? MATRIX_UI_LIGHT : MATRIX_UI;
  const color = ui[ROLE_TOKEN[role]];
  const glyph = GLYPH[style ?? defaultStyleForRole(role)];
  return (
    <Box flexDirection="row">
      <Box width={2} flexShrink={0}>
        <Text color={color}>{glyph}</Text>
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        {children}
      </Box>
    </Box>
  );
}
