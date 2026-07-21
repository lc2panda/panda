// Input: role + 可选 displayName + 可选 timestamp + 可选 flashTrigger + 可选 isLoading
// Output: 单行 turn 顶部身份标签 — v3.7 Pro：
//   `▎▶ [OPERATOR · 17:42:44] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ◉ IN ▌`
//   元素：
//     1. 行首 prefix `▎▶ `（左竖线 ▎ + 流向箭头 ▶；色=role 主色）
//     2. `[ROLE_LABEL · ts]` 顶标（v3 phosphor fade / flash / breath 动效保留）
//     3. ` ━━━━ ` 延伸线（响应 useTerminalSize().columns，最少 8 字符；色=role 暗 1 级）
//     4. ` ◉/▰/●` 状态灯（按 role + isLoading computed）
//     5. ` ▌` 末尾流标记（同 role 主色）
// Pos: 与 TurnGutter 配合，仅在 roleChanged 的首条 message 顶部插入一行
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260418-02] · v3 P3 升级 — OPERATOR-NEO chrome 顶标。
// v3.7 Pro 波次1（2026-04-29）：扩展 chrome 6 元素（4 档色板 + 头部升级）。
//  - displayName 优先级 > ROLE_LABEL[role]
//  - timestamp 显示为 HH:MM:SS（24h，本地）
//  - phosphor fade-in：组件首次挂载时 4 步色阶从 SHADOW 渐入到身份色（300ms 总）
//  - flashTrigger 完成 flash：变化时 150ms 内提到 FLASH 高亮
//  - isLoading=true 时在状态灯位呈现 ▰ GEN（v3.7 Pro 取代旧呼吸 dot）
//  - flash 优先级 > fade > base
//  - chrome 主色由 getRoleColor() 直接返回 4 档色板（不经 ROLE_TOKEN）
//  - 延伸线宽度响应终端宽：min 8 / max columns - 用文本宽 - 2
// v3.7 Pro 波次4（2026-04-29）：panda role + isLoading 时升级 GEN 状态为流式 progress bar：
//   `[PANDA · 12:34:56] ━━━━━━━━ ▰▰▰▰▰▰▰▰▰▰█ GEN ▌`
//   - useStreamProgress hook 节流到 100ms 一次 re-render（最快 10Hz）
//   - 宽度上限 = 12 ▰（约 token 数 / 50）+ 末尾闪烁 █
//   - reducedMotion 时回退到静态 ▰ GEN（与 v3.7 Pro 一致）

import * as React from 'react';
import { Box, Text } from '../../ink.js';
import {
  MATRIX_SCALE,
  MATRIX_SCALE_LIGHT,
  ageToHex,
  ageToHexLight,
  getRoleColor,
  getRoleDimColor,
} from './matrixPalette.js';
import { isMatrixLight, isMatrixTheme } from './isMatrixTheme.js';
import { useFlashOnce } from '../../hooks/useFlashOnce.js';
import { usePhosphorFadeIn } from '../../hooks/usePhosphorFadeIn.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { useStreamProgress } from '../../hooks/useStreamProgress.js';
import { useAppState } from '../../state/AppState.js';
import { ROLE_LABEL, type TurnRole } from './turnRole.js';

/**
 * 流式 progress bar 渲染 —— ▰ 数量按 byte 累加（约每 50 字节 1 个 ▰），
 * 上限 12 段（避免溢出 chrome）。末尾 █ 静态字符（不闪烁，避免视觉抖动）。
 *
 * 公式：bytes / 50 → block count，cap 在 [0, 12]。
 *   ~50 字节 ≈ 12 token（GPT 类 BPE 平均 4 字节/token）
 *   bar 0 → 显示 ▰ GEN（无填充）
 *   bar 12 → 显示 ▰▰▰▰▰▰▰▰▰▰▰▰█ GEN（满）
 */
function progressBarFromBytes(bytes: number): string {
  if (bytes <= 0) return '\u25B0';
  const blocks = Math.min(12, Math.max(1, Math.floor(bytes / 50)));
  return '\u25B0'.repeat(blocks) + '\u2588';
}

interface Props {
  role: TurnRole;
  /** 优先于 ROLE_LABEL 显示的角色名（如 sub-agent worker 的具体名 'UI-修复'） */
  displayName?: string;
  /** ISO 时间戳；undefined 时不显示时间段 */
  timestamp?: string;
  /** v3：完成 flash 触发器 — 任意值变化触发 150ms 高亮 */
  flashTrigger?: unknown;
  /** v3 P9：标记 message 仍在 streaming 时显示状态灯 GEN */
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

/**
 * 状态灯：根据 role + isLoading 派生。
 * - operator/user → ◉ IN（输入完成）
 * - panda/assistant + loading → ▰ GEN
 * - panda/assistant + 完成     → ●
 * - worker + loading → ●（呼吸由 dim 衍生，省略 hook 避免大幅 re-render）
 * - worker + 完成    → ◉
 * - system           → ◉
 */
function statusLightFor(role: TurnRole, isLoading: boolean): string {
  switch (role) {
    case 'user':
      return '\u25C9 IN'; // ◉ IN
    case 'panda':
      return isLoading ? '\u25B0 GEN' : '\u25CF'; // ▰ GEN | ●
    case 'worker':
      return isLoading ? '\u25CF' : '\u25C9'; // ● | ◉
    case 'system':
      return '\u25C9'; // ◉
    case 'tool':
    case 'thinking':
    default:
      return '\u25CF'; // ●（兼容旧 role）
  }
}

/**
 * 计算延伸线（━）宽度。
 * 公式：columns - prefixUsed - statusLightLen - tailMarkerLen - safety
 * 最小 8 字符，最大 columns - 4。
 */
function computeBarWidth(
  columns: number,
  headerTextLen: number,
  statusLightLen: number,
): number {
  // prefix '▎▶ ' = 3 字宽（▎=1, ▶=1, 空格=1）
  // tail ' ▌' = 2 字宽（空格 + ▌）
  // status light 前一个空格 + 后一个空格 = 2
  const prefixWidth = 3;
  const tailWidth = 2;
  const statusPad = 2;
  const used = prefixWidth + headerTextLen + statusLightLen + tailWidth + statusPad;
  const available = columns - used;
  // 至少 8 字符；安全上限避免 ink soft-wrap 多算 1（columns - 4）
  const cap = Math.max(8, columns - 4);
  return Math.max(8, Math.min(cap, available));
}

export function TurnHeader({ role, displayName, timestamp, flashTrigger, isLoading }: Props): React.ReactNode {
  // 全部 hooks 无条件调用（React #300：isMatrixTheme 在 render 间翻转时
  // early-return 后少 hook → "Rendered fewer hooks than expected"）
  // v3.7 Pro 波次4：reducedMotion 时禁用流式 progress bar 动效（回退静态 ▰ GEN）
  const reducedMotion = useAppState(s => s.settings.prefersReducedMotion) ?? false;
  // 仅在 panda 流式时启用 stream progress hook（节流 100ms）
  const isPandaStreaming = role === 'panda' && !!isLoading && !reducedMotion;
  const streamBytes = useStreamProgress(isPandaStreaming);
  // T-C1 phosphor fade-in：4 步从 SHADOW (age=1.0) 到目标色（首帧期 only）
  const fadeProgress = usePhosphorFadeIn(300, 4); // 0 → 1
  // T-C3 完成 flash：触发后 150ms 内高亮成 FLASH
  const flashed = useFlashOnce(flashTrigger, 150);
  // 终端宽度响应（hook 在 render 期同步读 context；窄终端缩短延伸线）
  const { columns } = useTerminalSize();

  if (!isMatrixTheme()) return null;
  const lightMode = isMatrixLight();

  // v3.7 Pro 波次1：直接用 4 档色板，不再走 ROLE_TOKEN → MATRIX_UI 间接映射
  const baseColor = getRoleColor(role, lightMode);
  const dimColor = getRoleDimColor(role, lightMode);

  const fading = fadeProgress < 1;
  const fadeAge = 0.7 - fadeProgress * 0.5;
  const fadeColor = lightMode ? ageToHexLight(fadeAge) : ageToHex(fadeAge);

  const flashColor = lightMode ? MATRIX_SCALE_LIGHT.FLASH : MATRIX_SCALE.FLASH;

  // 优先级：flash > fade > base
  const finalColor = flashed ? flashColor : fading ? fadeColor : baseColor;

  const ts = fmtTime(timestamp);
  const labelText = displayName ?? ROLE_LABEL[role];
  // v3 chrome 文本：`[OPERATOR · 18:54:23]`
  const headerText = ts ? `[${labelText} \u00B7 ${ts}]` : `[${labelText}]`;

  // 状态灯
  // 波次4：panda + streaming + 非 reducedMotion 时升级 GEN 为流式 progress bar
  let statusLight: string;
  if (isPandaStreaming) {
    statusLight = `${progressBarFromBytes(streamBytes)} GEN`;
  } else {
    statusLight = statusLightFor(role, !!isLoading);
  }

  // 延伸线宽度（响应式，最少 8）
  const barWidth = computeBarWidth(columns, headerText.length, statusLight.length);
  const bar = '\u2501'.repeat(barWidth); // ━

  // prefix 与 tail 标记
  const prefix = '\u258E\u25B6 '; // ▎▶<空格>
  const tail = '\u258C'; // ▌

  return (
    <Box flexDirection="row">
      {/* prefix ▎▶ — role 主色，强调 chrome 入口 */}
      <Text color={finalColor}>{prefix}</Text>
      {/* 顶标 [LABEL · ts] — 沿用既有动效色 */}
      <Text color={finalColor} dimColor={!flashed && fading}>
        {headerText}
      </Text>
      {/* 状态灯 ◉/▰/● — role 主色（v3.8 简化：移除 ━━━ 延伸线，过度装饰） */}
      <Text color={finalColor}> {statusLight}</Text>
      {/* 末尾 ▌ — 同 role 主色 */}
      <Text color={finalColor}> {tail}</Text>
    </Box>
  );
}
