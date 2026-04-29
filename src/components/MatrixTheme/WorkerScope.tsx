// Input: workerName + ts + status + 可选 duration / commitSha + children
// Output: 三重边框 worker scope —
//   ╔══▶ [WORKER · 名 · ts]                                       ●  ◉
//   ┃   <children>
//   ╚══· completed · {duration} · {commit}                          ◉◉
// Pos: AgentTool/UI sub-agent UI 包装；从波次2 单线 chrome 升级到完整三重边框
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260426-MTX3-4] · v3.7 Pro 波次3 屏幕骨架
// 波次4（2026-04-29）：状态灯 1Hz 心跳呼吸 — running 时 ● 80% ↔ 100% 慢呼吸；
//   完成态 ◉ 静态。reducedMotion 时回退到静态 100% 亮度（无呼吸）。
// 设计目标：
//   1. 顶 `╔══▶ [WORKER · 名 · ts]` 流向箭头入口
//   2. 侧 `┃` 每行内容左侧 worker 暗绿色
//   3. 底 `╚══· completed · {duration}s · {commit}` 完成状态行
//   4. 完成 vs 进行中：状态灯 ●(running) → ◉(completed) 区分
//   5. 颜色梯度：边框 WORKER_DIM (#008822)，完成行 SYSTEM_FAINT (#005511)
//   6. 不强制 columns，由 children 自适应；侧边只占 1 字符宽 + 3 字符缩进
//   7. 波次4 — 状态灯心跳：running 1Hz 呼吸（usePhosphorBreath 1000ms）
//      插值在 lightOn 与 lightOn dim 之间（不在 borderDim 之间，避免太黑闪烁感）

import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { isMatrixTheme, isMatrixLight } from './isMatrixTheme.js';
import { getRoleColor, getRoleDimColor } from './matrixPalette.js';
import { MATRIX_ROLE_DARK, MATRIX_ROLE_LIGHT } from './matrixPalette.js';
import { usePhosphorBreath } from '../../hooks/usePhosphorBreath.js';
import { useAppState } from '../../state/AppState.js';

export interface WorkerScopeProps {
  /** 显示名称（如 'UI-修复' 或 prompt 摘要） */
  workerName: string;
  /** 起始时间戳（ISO 或 HH:MM:SS） */
  startTimestamp?: string;
  /** 完成时间戳（仅 status='completed'/'failed' 用） */
  endTimestamp?: string;
  /** 状态：running / completed / failed */
  status: 'running' | 'completed' | 'failed';
  /** 持续时长（秒） */
  durationSec?: number;
  /** 完成时关联的 commit sha（前 7 字符） */
  commitSha?: string;
  /** 子内容（worker 实际渲染的进度 / 结果） */
  children: React.ReactNode;
}

/**
 * 把 ISO 字符串或已是 HH:MM:SS 的字符串都正常化成 HH:MM:SS。
 */
function fmtTime(ts?: string): string {
  if (!ts) return '';
  // 已是 HH:MM:SS 格式直接返回
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(ts)) return ts;
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
 * 状态灯：running ● / completed ◉ / failed ✗
 */
function statusLight(status: WorkerScopeProps['status']): string {
  switch (status) {
    case 'running':
      return '\u25CF'; // ●
    case 'completed':
      return '\u25C9'; // ◉
    case 'failed':
      return '\u2717'; // ✗
  }
}

export function WorkerScope(props: WorkerScopeProps): React.ReactNode {
  // 非 matrix 主题：透明返回 children（不引入额外视觉元素）
  if (!isMatrixTheme()) {
    return <>{props.children}</>;
  }

  const { workerName, startTimestamp, status, durationSec, commitSha, children } = props;
  const lightMode = isMatrixLight();
  const reducedMotion = useAppState(s => s.settings.prefersReducedMotion) ?? false;

  // 颜色梯度（v3.7 Pro 波次1 4 档 + 暗 1 档）
  const borderColor = getRoleColor('worker', lightMode); // WORKER_DIM #008822
  const borderDim = getRoleDimColor('worker', lightMode); // worker dim
  const headerLabelColor = borderColor;
  const completedRoleColor = lightMode
    ? MATRIX_ROLE_LIGHT.SYSTEM_FAINT
    : MATRIX_ROLE_DARK.SYSTEM_FAINT; // SYSTEM_FAINT 极暗
  const lightOn = borderColor;
  const lightOff = borderDim;

  // 波次4 — 状态灯心跳（1Hz 慢呼吸，仅 running 时启用）。
  // 完成态 status='completed'/'failed' 静态；reducedMotion 时整体禁用动效。
  // 插值：80% ↔ 100% 亮度档位，使用 borderColor (lightOn) <-> borderDim (lightOff) 二值切换
  // —— 不需要连续插值（连续会闪烁），二值切换在阈值上下变化已足够"心跳"感。
  const breath = usePhosphorBreath(1000); // 1Hz
  const isRunning = status === 'running';
  // breath 范围 0..1，阈值 0.4 以下显 dim，以上显 on（保证 60% 时间可见，40% 时间略暗）
  const breathOn = !reducedMotion && isRunning ? breath > 0.4 : true;
  const breathColor = breathOn ? lightOn : lightOff;

  const ts = fmtTime(startTimestamp);
  const headerText = ts ? `[WORKER \u00B7 ${workerName} \u00B7 ${ts}]` : `[WORKER \u00B7 ${workerName}]`;

  // 顶 line: `   ╔══▶ [WORKER · 名 · ts]                ●  ◉`
  // 缩进 3 + 双线 ╔══ + 流向 ▶ + 空格 + header + 弹性空白 + 状态灯
  // 波次4：running 状态时 ● 用 breathColor 1Hz 呼吸（其余位置静态）
  const topLine = (
    <Box flexDirection="row">
      <Text color={borderColor}>{'   \u2554\u2550\u2550\u25B6 '}</Text>
      <Text color={headerLabelColor} bold>
        {headerText}
      </Text>
      <Box flexGrow={1} />
      {/* 状态灯：running 单 ● / completed ◉◉ */}
      <Text color={isRunning ? breathColor : lightOff}>{statusLight('running')}</Text>
      <Text> </Text>
      <Text color={status === 'completed' || status === 'failed' ? lightOn : lightOff}>
        {statusLight(status === 'failed' ? 'failed' : 'completed')}
      </Text>
    </Box>
  );

  // 底 line: `   ╚══· completed · {duration}s · {commit}                            ◉◉`
  const bottomMeta: string[] = [];
  if (status === 'completed') bottomMeta.push('completed');
  if (status === 'failed') bottomMeta.push('failed');
  if (status === 'running') bottomMeta.push('running');
  if (durationSec !== undefined) bottomMeta.push(`${durationSec}s`);
  if (commitSha) bottomMeta.push(`commit ${commitSha.slice(0, 7)}`);

  const bottomLine = (
    <Box flexDirection="row">
      <Text color={borderColor}>{'   \u255A\u2550\u2550\u00B7 '}</Text>
      <Text color={completedRoleColor}>{bottomMeta.join(' \u00B7 ')}</Text>
      <Box flexGrow={1} />
      <Text color={status === 'completed' || status === 'failed' ? lightOn : lightOff}>
        {statusLight(status === 'failed' ? 'failed' : 'completed')}
      </Text>
      <Text color={status === 'completed' || status === 'failed' ? lightOn : lightOff}>
        {statusLight(status === 'failed' ? 'failed' : 'completed')}
      </Text>
    </Box>
  );

  return (
    <Box flexDirection="column">
      {topLine}
      {/* 侧边线 + 内容容器：每行前缀 ┃ 由内容自然继承（外层 Box 不强制） */}
      <Box flexDirection="row">
        {/* 左侧 ┃ 占 1 字符宽 + 3 字符缩进对齐顶部 ╔ */}
        <Box flexDirection="column" width={4}>
          <Text color={borderColor}>{'   \u2503'}</Text>
        </Box>
        <Box flexDirection="column" flexGrow={1}>
          {children}
        </Box>
      </Box>
      {bottomLine}
    </Box>
  );
}
