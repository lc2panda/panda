// Input: 无（自取 oauthAccount/model/cwd/version）
// Output: 双线框欢迎卡 — 左 PANDA mini logo + 右 KV 表，致敬句 + 底部快捷键 hint
// Pos: Matrix 主题启动序列结束后展示，可由 LogoV2 或 MatrixBootSequence onDone 触发
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260418-07] · v3 P8 + P9.3：
//  - 新增致敬行 "▸ Wake up, Operator. The Matrix has you."（SHADOW dim）
//  - borderColor 接 usePhosphorBreath 5s 周期 BASE→NEON→BASE 慢呼吸（CRT phosphor 衰减仿真）
// 仅 Matrix 主题生效。

import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { useMatrixUI } from '../../hooks/useMatrixUI.js';
import { usePhosphorBreath } from '../../hooks/usePhosphorBreath.js';
import { isMatrixTheme, isMatrixLight } from './isMatrixTheme.js';
import { MATRIX_SCALE, MATRIX_SCALE_LIGHT, MATRIX_BREATH_PULSE, MATRIX_BREATH_PULSE_LIGHT } from './matrixPalette.js';
import { getGlobalConfig } from '../../utils/config.js';
import { getCwd } from '../../utils/cwd.js';
import { getMainLoopModel, renderModelName } from '../../utils/model/model.js';
import { isZh } from '../../utils/i18n.js';

// 4 行精简 PANDA logo（取自 Block 字体的简化版，宽度约 22）
const MINI_LOGO = ['┌─ ┌─┐ ┌┐  ┬─┐ ┌─┐ ', '├─┘├─┤ ││ ││ │├─┤ ', '│  │ │ │└┘│└─┘│ │ ', '┘  ┘ ┘ ┘  ┘   ┘ ┘ '];

function truncatePath(p: string, max: number): string {
  if (p.length <= max) return p;
  return '…' + p.slice(-(max - 1));
}

export function WelcomeCard(): React.ReactNode {
  if (!isMatrixTheme()) return null;
  const ui = useMatrixUI();
  const lightMode = isMatrixLight();
  const S = lightMode ? MATRIX_SCALE_LIGHT : MATRIX_SCALE;
  const palette = lightMode ? MATRIX_BREATH_PULSE_LIGHT : MATRIX_BREATH_PULSE;

  // P9.3: 5s 慢呼吸 — borderColor BASE → NEON → BRIGHT → NEON → BASE
  const breathT = usePhosphorBreath(5000, 100);
  const idx = Math.min(palette.length - 1, Math.floor(breathT * palette.length));
  const breathBorder = palette[idx];

  const config = getGlobalConfig();
  const account =
    config.oauthAccount?.displayName || config.oauthAccount?.emailAddress || (isZh() ? '未登录' : 'guest');
  const modelName = (() => {
    try {
      return renderModelName(getMainLoopModel());
    } catch {
      return '—';
    }
  })();
  const cwd = truncatePath(getCwd(), 38);
  const version = MACRO.VERSION;

  const labelW = isZh() ? 4 : 8;
  const kv = (label: string, value: string): React.ReactNode => (
    <Text>
      <Text color={ui.hint} dimColor>
        {label.padEnd(labelW)}
      </Text>
      <Text color={ui.statusLine}>{value}</Text>
    </Text>
  );

  const tribute = isZh() ? '▸ 醒来吧，指挥官。Matrix 已为你接入。' : '\u25B8 Wake up, Operator. The Matrix has you.';

  const hint = isZh() ? '输入 / 看命令 · ? 看快捷键 · ⏎ 发送' : 'type / for commands · ? for shortcuts · ⏎ to send';

  return (
    <Box flexDirection="column" borderStyle="double" borderColor={breathBorder} paddingX={2} paddingY={1}>
      <Box flexDirection="row" gap={3}>
        <Box flexDirection="column">
          {MINI_LOGO.map((line, i) => (
            <Text key={i} color={i % 2 === 0 ? S.FLASH : S.GLOW}>
              {line}
            </Text>
          ))}
        </Box>
        <Box flexDirection="column">
          {kv(isZh() ? '账户' : 'account', account)}
          {kv(isZh() ? '模型' : 'model', modelName)}
          {kv('cwd', cwd)}
          {kv(isZh() ? '版本' : 'version', `v${version}`)}
        </Box>
      </Box>
      {/* P8: Matrix 致敬句 — KV 表下方 / hint 上方，SHADOW dim 单行 */}
      <Box marginTop={1}>
        <Text color={ui.hint} dimColor>
          {tribute}
        </Text>
      </Box>
      <Box>
        <Text color={ui.hint} dimColor>
          {hint}
        </Text>
      </Box>
    </Box>
  );
}
