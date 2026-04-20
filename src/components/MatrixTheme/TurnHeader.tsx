// Input: role + 可选 displayName + 可选 timestamp + 可选 flashTrigger + 可选 isLoading
// Output: 单行 turn 顶部身份标签 — v3：`[OPERATOR · HH:MM:SS]` / `[PANDA · HH:MM:SS]`
// Pos: 与 TurnGutter 配合，仅在 roleChanged 的首条 message 顶部插入一行
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260418-02] · v3 P3 升级 — OPERATOR-NEO chrome 顶标。
//  - displayName 优先级 > ROLE_LABEL[role]
//  - timestamp 显示为 HH:MM:SS（24h，本地）
//  - phosphor fade-in：组件首次挂载时 4 步色阶从 SHADOW 渐入到身份色（300ms 总）
//  - flashTrigger 完成 flash：变化时 150ms 内提到 FLASH 高亮
//  - isLoading=true 时在时间戳后追加 ░▒▓█▓▒░ 呼吸 dot（P9 沉浸感）
//  - flash 优先级 > fade

import * as React from 'react';
import { Box, Text } from '../../ink.js';
import {
  MATRIX_UI,
  MATRIX_UI_LIGHT,
  MATRIX_SCALE,
  MATRIX_SCALE_LIGHT,
  ageToHex,
  ageToHexLight,
} from './matrixPalette.js';
import { isMatrixLight, isMatrixTheme } from './isMatrixTheme.js';
import { useFlashOnce } from '../../hooks/useFlashOnce.js';
import { usePhosphorFadeIn } from '../../hooks/usePhosphorFadeIn.js';
import { usePhosphorBreath } from '../../hooks/usePhosphorBreath.js';
import { ROLE_LABEL, ROLE_TOKEN, type TurnRole } from './turnRole.js';

// 呼吸 dot 帧序（4 帧，单字符 480ms 周期 ≈ 120ms/帧）
const BREATH_DOT_FRAMES = ['\u2591', '\u2592', '\u2593', '\u2588']; // ░ ▒ ▓ █

interface Props {
  role: TurnRole;
  /** 优先于 ROLE_LABEL 显示的角色名（预留扩展，如 sub-agent 名） */
  displayName?: string;
  /** ISO 时间戳；undefined 时不显示时间段 */
  timestamp?: string;
  /** v3：完成 flash 触发器 — 任意值变化触发 150ms 高亮 */
  flashTrigger?: unknown;
  /** v3 P9：标记 message 仍在 streaming 时显示呼吸 dot */
  isLoading?: boolean;
}

function fmtTime(ts?: string): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  } catch {
    return '';
  }
}

export function TurnHeader({ role, displayName, timestamp, flashTrigger, isLoading }: Props): React.ReactNode {
  if (!isMatrixTheme()) return null;
  const lightMode = isMatrixLight();
  const ui = lightMode ? MATRIX_UI_LIGHT : MATRIX_UI;
  const baseColor = ui[ROLE_TOKEN[role]];

  // T-C1 phosphor fade-in：4 步从 SHADOW (age=1.0) 到目标色（首帧期 only）
  const fadeProgress = usePhosphorFadeIn(300, 4); // 0 → 1
  const fading = fadeProgress < 1;
  const fadeAge = 0.7 - fadeProgress * 0.5;
  const fadeColor = lightMode ? ageToHexLight(fadeAge) : ageToHex(fadeAge);

  // T-C3 完成 flash：触发后 150ms 内高亮成 FLASH
  const flashed = useFlashOnce(flashTrigger, 150);
  const flashColor = lightMode ? MATRIX_SCALE_LIGHT.FLASH : MATRIX_SCALE.FLASH;

  // P9 呼吸 dot：仅 isLoading 时启用
  const breathT = usePhosphorBreath(480);
  const dotIdx = Math.min(BREATH_DOT_FRAMES.length - 1, Math.floor(breathT * BREATH_DOT_FRAMES.length));
  const dotChar = BREATH_DOT_FRAMES[dotIdx];

  // 优先级：flash > fade > base
  const finalColor = flashed ? flashColor : fading ? fadeColor : baseColor;
  const ts = fmtTime(timestamp);
  const labelText = displayName ?? ROLE_LABEL[role];
  // v3 chrome：`[OPERATOR · 18:54:23]`
  const headerText = ts ? `[${labelText} · ${ts}]` : `[${labelText}]`;

  return (
    <Box flexDirection="row">
      <Text color={finalColor} dimColor={!flashed}>
        {headerText}
      </Text>
      {isLoading && <Text color={lightMode ? MATRIX_SCALE_LIGHT.NEON : MATRIX_SCALE.NEON}> {dotChar}</Text>}
    </Box>
  );
}
