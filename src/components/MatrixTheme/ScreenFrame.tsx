// Input: position 'top' | 'bottom' + sessionId + modelId + 可选 turnCount/status/git/...
// Output: 终端外壳 — 顶/底 ╔══╗╚══╝ frame + 2 行 status bar
// Pos: REPL 主屏顶/底 — 让对话流被「外壳」包住，从光秃秃升级到完整赛博浓重视觉
// 一旦我被修改，请更新 MatrixTheme/README.md
//
// [NEW-FILE:#20260426-MTX3-1] · v3.7 Pro 波次3 屏幕骨架
// 波次4（2026-04-29）：状态栏 5s refresh — RAM/git branch/git clean 数据自动刷新；
//   refresh 时仅换值不闪烁动效（直接 setState）。reducedMotion 不影响（数据更新无视觉抖动）。
// 设计目标：
//   1. 顶 frame `╔══╗` + 2 行 status bar（model / sessionId / link 灯 / boot/link/chrome/scan / RAM / cache / turns）
//   2. 底 frame `╚══╝` + 2 行 status bar（status / latency / sessionId / git / 快捷键 hint）
//   3. 圆角 ◜◝◞◟ 通过 PANDA_FRAME_ROUNDED=1 启用，默认方角（最大字体兼容）
//   4. 窄终端（columns < 80）走简化布局：仅必要字段
//   5. 波次4 — RAM / git branch / git clean 5s 自动 refresh（不闪烁，仅换值）

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Box, Text } from '../../ink.js';
import { isMatrixTheme, isMatrixLight } from './isMatrixTheme.js';
import {
  MATRIX_SCALE,
  MATRIX_SCALE_LIGHT,
  MATRIX_UI,
  MATRIX_UI_LIGHT,
} from './matrixPalette.js';
import { getBranch, getIsClean, getIsGit } from '../../utils/git.js';

export interface ScreenFrameProps {
  /** 顶 frame 还是底 frame */
  position: 'top' | 'bottom';
  /** 终端列宽 */
  cols: number;
  /** 当前会话 ID（取前 8 字符显示）— undefined 时不渲染该字段 */
  sessionId?: string;
  /** 模型 id（如 'opus-4-7'）— undefined 时不渲染 */
  modelId?: string;
  /** 已使用 RAM (MB)，约值显示 — undefined 时跳过 */
  ramMB?: number;
  /** cache 命中率 (0-100) — undefined 时跳过 */
  cacheHitPct?: number;
  /** 当前 turn 数 — undefined 时跳过 */
  turnCount?: number;
  /** 链路状态 */
  status?: 'idle' | 'gen' | 'thinking';
  /** 上一回合延迟 (ms) — undefined 时跳过 */
  lastLatencyMs?: number;
  /** git 分支名 — undefined 时跳过 git 字段 */
  gitBranch?: string;
  /** git 工作区是否干净 */
  gitClean?: boolean;
}

/**
 * 字符宽度阈值。columns 小于此值时走 simplified 布局（仅必要字段）。
 */
const NARROW_TERMINAL_THRESHOLD = 80;

/**
 * status bar 数据 refresh 周期（毫秒）。波次4 —— 5 秒一次拉数据，
 * 直接换值（不闪烁/动画），保持低视觉负担。
 */
const STATUS_REFRESH_MS = 5000;

/**
 * 波次4 — 自刷新 RAM / git 状态。
 *
 * - RAM：进程驻留集大小（rss），轻量，无系统调用风险
 * - gitBranch / gitClean：通过 utils/git 缓存层（getCachedBranch/getIsClean），
 *   实测调用 < 5ms 且内部已 memoize
 *
 * 返回静态对象（每 5s 整体替换），React 浅比较无问题。
 */
function useScreenFrameLiveData(enabled: boolean): {
  ramMB?: number;
  gitBranch?: string;
  gitClean?: boolean;
} {
  const [data, setData] = useState<{
    ramMB?: number;
    gitBranch?: string;
    gitClean?: boolean;
  }>({});

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const refresh = async () => {
      // RAM
      let ramMB: number | undefined;
      try {
        const usage = process.memoryUsage();
        ramMB = usage.rss / 1024 / 1024;
      } catch {
        ramMB = undefined;
      }
      // git
      let gitBranch: string | undefined;
      let gitClean: boolean | undefined;
      try {
        const isGit = await getIsGit();
        if (isGit) {
          [gitBranch, gitClean] = await Promise.all([
            getBranch().catch(() => undefined),
            getIsClean({ ignoreUntracked: true }).catch(() => undefined),
          ]);
        }
      } catch {
        // ignore
      }
      if (!cancelled) {
        setData({ ramMB, gitBranch, gitClean });
      }
    };
    void refresh(); // 首次立即拉
    const id = setInterval(() => void refresh(), STATUS_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled]);

  return data;
}

/**
 * 探测圆角字体支持：默认禁用（使用方角 ╔╗╚╝），
 * `PANDA_FRAME_ROUNDED=1` env 可启用圆角 ◜◝◞◟。
 *
 * 理由：圆角字符在等宽终端字体（Hack/Menlo/Monaco/Cascadia 等）支持率参差不齐，
 * 默认走方角避免视觉错位 / 显示空白。用户终端验证支持后可手动启用。
 */
function useRoundedFrame(): boolean {
  if (typeof process === 'undefined') return false;
  return process.env.PANDA_FRAME_ROUNDED === '1';
}

interface FrameChars {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
}

function getFrameChars(rounded: boolean): FrameChars {
  if (rounded) {
    // 圆角四角 ◜◝◞◟ + 双线 ═ + 双线 ║
    return {
      topLeft: '\u25DC', // ◜
      topRight: '\u25DD', // ◝
      bottomLeft: '\u25DF', // ◟
      bottomRight: '\u25DE', // ◞
      horizontal: '\u2550', // ═
      vertical: '\u2551', // ║
    };
  }
  // 方角 ╔╗╚╝ + 双线 ═ + 双线 ║
  return {
    topLeft: '\u2554', // ╔
    topRight: '\u2557', // ╗
    bottomLeft: '\u255A', // ╚
    bottomRight: '\u255D', // ╝
    horizontal: '\u2550', // ═
    vertical: '\u2551', // ║
  };
}

/**
 * 截短 sessionId 到前 N 位（默认 8）。
 */
function shortenSessionId(sessionId: string | undefined, n = 8): string {
  if (!sessionId) return '';
  return sessionId.replace(/-/g, '').slice(0, n);
}

/**
 * 链路状态灯 ●●○：3 段 phosphor 风格的链路标签。
 *   idle:     ●●○   (2 亮 1 暗 = 待命)
 *   gen:      ●○●   (波动 = 流动中)
 *   thinking: ○●●   (offset = 思考中)
 */
function statusLights(status: 'idle' | 'gen' | 'thinking' | undefined): string {
  switch (status) {
    case 'gen':
      return '\u25CF\u25CB\u25CF';
    case 'thinking':
      return '\u25CB\u25CF\u25CF';
    case 'idle':
    default:
      return '\u25CF\u25CF\u25CB';
  }
}

/**
 * 状态文案（idle/gen/thinking → idle/gen/think）。
 */
function statusLabel(status: 'idle' | 'gen' | 'thinking' | undefined): string {
  switch (status) {
    case 'gen':
      return 'gen';
    case 'thinking':
      return 'think';
    case 'idle':
    default:
      return 'idle';
  }
}

export function ScreenFrame(props: ScreenFrameProps): React.ReactNode {
  // 即使非 matrix 也要 mount hook（顺序固定），最后渲染才决定 null
  // —— React hooks 规则：hook 调用顺序必须稳定。
  const matrixOn = isMatrixTheme();
  // 波次4 — live data：仅 matrix 主题启用 5s refresh，节省非 matrix 用户资源
  const live = useScreenFrameLiveData(matrixOn);
  // use* 命名函数也放 early-return 前，避免 eslint-rules-of-hooks 误报与风格漂移
  const rounded = useRoundedFrame();

  if (!matrixOn) return null;

  const { position, cols } = props;
  const chars = getFrameChars(rounded);
  const lightMode = isMatrixLight();
  const ui = lightMode ? MATRIX_UI_LIGHT : MATRIX_UI;
  const scale = lightMode ? MATRIX_SCALE_LIGHT : MATRIX_SCALE;

  // props 优先 > live data fallback（让 REPL 显式注入仍优先生效）
  const effRamMB = props.ramMB ?? live.ramMB;
  const effGitBranch = props.gitBranch ?? live.gitBranch;
  const effGitClean = props.gitClean ?? live.gitClean;

  // frame 颜色：MATRIX_UI 中绿暗一档（避免抢主线绿光风头）
  const frameColor = ui.divider; // SHADOW (G3) — 装饰性边框
  const labelColor = ui.hint; // 极暗 — 字段标签
  const valueColor = ui.statusLine; // BASE (G4) — 数值
  const accentColor = scale.NEON; // G5 — 强调（model id / status 等）

  // 框线宽度 = cols（总长一致，含两端角字符）
  const innerWidth = Math.max(0, cols - 2);
  const horizontalLine = chars.horizontal.repeat(innerWidth);
  const isNarrow = cols < NARROW_TERMINAL_THRESHOLD;

  // 顶 frame 渲染
  if (position === 'top') {
    return (
      <Box flexDirection="column" width={cols}>
        {/* ╔════════════════╗ — 顶角 */}
        <Box flexDirection="row">
          <Text color={frameColor}>
            {chars.topLeft}
            {horizontalLine}
            {chars.topRight}
          </Text>
        </Box>

        {/* status bar line 1: ║ ◉ PANDA ▐ MATRIX TERMINAL v3.7    {sessionId 前 8} · {model id} · {●●○ link 状态灯}      ║ */}
        <Box flexDirection="row" width={cols}>
          <Text color={frameColor}>{chars.vertical}</Text>
          <Text> </Text>
          <Text color={accentColor}>{'\u25C9 '}</Text>
          <Text color={valueColor} bold>
            PANDA
          </Text>
          <Text color={frameColor}>{' \u2590 '}</Text>
          <Text color={labelColor}>MATRIX TERMINAL v3.7</Text>
          {!isNarrow && props.sessionId && (
            <>
              <Text color={labelColor}>{'    '}</Text>
              <Text color={valueColor}>{shortenSessionId(props.sessionId)}</Text>
            </>
          )}
          {!isNarrow && props.modelId && (
            <>
              <Text color={labelColor}>{' \u00B7 '}</Text>
              <Text color={accentColor}>{props.modelId}</Text>
            </>
          )}
          {!isNarrow && (
            <>
              <Text color={labelColor}>{' \u00B7 '}</Text>
              <Text color={valueColor}>{statusLights(props.status)}</Text>
              <Text color={labelColor}> link</Text>
            </>
          )}
          <Box flexGrow={1} />
          <Text color={frameColor}>{chars.vertical}</Text>
        </Box>

        {/* status bar line 2: ║ ◤ boot ✓  link ✓  chrome ✓  scan ✓     ⚡ {RAM} · cache {hit}% · {turns} turns ║ */}
        <Box flexDirection="row" width={cols}>
          <Text color={frameColor}>{chars.vertical}</Text>
          <Text> </Text>
          <Text color={accentColor}>{'\u25E4 '}</Text>
          <Text color={labelColor}>boot </Text>
          <Text color={accentColor}>{'\u2713'}</Text>
          {!isNarrow && (
            <>
              <Text color={labelColor}>{'  link '}</Text>
              <Text color={accentColor}>{'\u2713'}</Text>
              <Text color={labelColor}>{'  chrome '}</Text>
              <Text color={accentColor}>{'\u2713'}</Text>
              <Text color={labelColor}>{'  scan '}</Text>
              <Text color={accentColor}>{'\u2713'}</Text>
            </>
          )}
          {effRamMB !== undefined && !isNarrow && (
            <>
              <Text color={labelColor}>{'     \u26A1 '}</Text>
              <Text color={valueColor}>{effRamMB.toFixed(1)}MB</Text>
            </>
          )}
          {props.cacheHitPct !== undefined && (
            <>
              <Text color={labelColor}>{' \u00B7 cache '}</Text>
              <Text color={valueColor}>{Math.round(props.cacheHitPct)}%</Text>
            </>
          )}
          {props.turnCount !== undefined && (
            <>
              <Text color={labelColor}>{' \u00B7 '}</Text>
              <Text color={valueColor}>{props.turnCount}</Text>
              <Text color={labelColor}> turns</Text>
            </>
          )}
          <Box flexGrow={1} />
          <Text color={frameColor}>{chars.vertical}</Text>
        </Box>
      </Box>
    );
  }

  // 底 frame 渲染
  return (
    <Box flexDirection="column" width={cols}>
      {/* status bar line 1: ║ ⌛ {idle/gen} · ⚡ {latency}ms · ◇ {sessionId} · ⛓ {branch} · {clean/dirty}        ║ */}
      <Box flexDirection="row" width={cols}>
        <Text color={frameColor}>{chars.vertical}</Text>
        <Text> </Text>
        <Text color={accentColor}>{'\u231B '}</Text>
        <Text color={valueColor}>{statusLabel(props.status)}</Text>
        {props.lastLatencyMs !== undefined && !isNarrow && (
          <>
            <Text color={labelColor}>{'  \u00B7  \u26A1 '}</Text>
            <Text color={valueColor}>{Math.round(props.lastLatencyMs)}ms</Text>
          </>
        )}
        {!isNarrow && props.sessionId && (
          <>
            <Text color={labelColor}>{'  \u00B7  \u25C7 '}</Text>
            <Text color={valueColor}>{shortenSessionId(props.sessionId)}</Text>
          </>
        )}
        {!isNarrow && (
          <>
            <Text color={labelColor}>{'  \u00B7  '}</Text>
            <Text color={valueColor}>{'\u26C1\u26C1\u26C1'}</Text>
            <Text color={labelColor}> green</Text>
          </>
        )}
        {effGitBranch && !isNarrow && (
          <>
            <Text color={labelColor}>{'  \u00B7  \u26D3 '}</Text>
            <Text color={valueColor}>{effGitBranch}</Text>
            <Text color={labelColor}>
              {' \u00B7 '}
              {effGitClean === false ? 'dirty' : 'clean'}
            </Text>
          </>
        )}
        <Box flexGrow={1} />
        <Text color={frameColor}>{chars.vertical}</Text>
      </Box>

      {/* status bar line 2: ║ ◤ ↑↓ scroll  ⏎ submit  ⌃c abort  ⌃R rewind  ⌃B bg  /help ║ */}
      <Box flexDirection="row" width={cols}>
        <Text color={frameColor}>{chars.vertical}</Text>
        <Text> </Text>
        <Text color={accentColor}>{'\u25E4 '}</Text>
        <Text color={labelColor}>
          {isNarrow
            ? '\u23CE submit  \u2303c abort'
            : '\u2191\u2193 scroll  \u23CE submit  \u2303c abort  \u2303R rewind  \u2303B bg  /help'}
        </Text>
        <Box flexGrow={1} />
        <Text color={frameColor}>{chars.vertical}</Text>
      </Box>

      {/* ╚════════════════╝ — 底角 */}
      <Box flexDirection="row">
        <Text color={frameColor}>
          {chars.bottomLeft}
          {horizontalLine}
          {chars.bottomRight}
        </Text>
      </Box>
    </Box>
  );
}
