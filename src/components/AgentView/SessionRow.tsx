// Input: SessionEntry + 是否光标行 + tick（用于 working 动画）
// Output: 单行 Ink 渲染
// Pos: src/components/AgentView/ —— Dashboard 列表单元

import * as React from 'react';
import figures from 'figures';
import { Box, Text } from '../../ink.js';
import { homedir } from 'os';
import type { SessionEntry, SessionStatus } from './types.js';
import { STAR_ICON, statusIcon, statusLabel, prDot } from './icons.js';

const HOME = homedir();

function shortenCwd(cwd: string, max: number = 36): string {
  let p = cwd;
  if (p.startsWith(HOME)) p = '~' + p.slice(HOME.length);
  if (p.length <= max) return p;
  return '…' + p.slice(p.length - max + 1);
}

/** 状态颜色：Ink Text color 字符串。 */
function statusInkColor(s: SessionStatus): string | undefined {
  switch (s) {
    case 'working':
      return 'cyan';
    case 'waiting':
      return 'yellow';
    case 'idle':
      return 'gray';
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    case 'stopped':
      return 'gray';
  }
}

export type SessionRowProps = {
  entry: SessionEntry;
  selected: boolean;
  index: number;
  tick: number;
  pendingStop: boolean;
};

export function SessionRow(props: SessionRowProps): React.ReactElement {
  const { entry, selected, index, tick, pendingStop } = props;
  const pointer = selected ? figures.pointer : ' ';
  const pinMark = entry.pinned ? STAR_ICON : ' ';
  const glyph = statusIcon(entry.status, entry.shape, tick);
  const color = statusInkColor(entry.status);
  const hotkey = index < 9 ? `[${index + 1}]` : '   ';
  const summary = entry.lastMessage || statusLabel(entry.status);
  const cwdLabel = shortenCwd(entry.cwd);
  const pr = prDot(entry.prStatus);

  return (
    <Box flexDirection="row" gap={1}>
      <Text color={selected ? 'suggestion' : undefined}>{pointer}</Text>
      <Text dimColor>{hotkey}</Text>
      <Text color={color}>{glyph}</Text>
      <Text color={entry.pinned ? 'yellow' : undefined}>{pinMark}</Text>
      <Text bold={selected} color={selected ? 'suggestion' : undefined}>
        {entry.displayName}
      </Text>
      <Text dimColor>·</Text>
      <Text dimColor>{cwdLabel}</Text>
      {pr ? (
        <>
          <Text> </Text>
          <Text>{pr}</Text>
        </>
      ) : null}
      <Text> </Text>
      <Text dimColor>{summary}</Text>
      {pendingStop ? (
        <Text color="red" bold>
          {' '}
          [press Ctrl+X again to remove]
        </Text>
      ) : null}
    </Box>
  );
}
