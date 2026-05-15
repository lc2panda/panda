// Input: SessionEntry[] + cursor + groupMode
// Output: 渲染分组容器（带标题 + 各组的行列表）
// Pos: src/components/AgentView/ —— 复用 SessionRow 完成分组视图

import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { homedir } from 'os';
import type { GroupMode, SessionEntry, SessionStatus } from './types.js';
import { statusLabel } from './icons.js';
import { SessionRow } from './SessionRow.js';

const HOME = homedir();

function shortenCwd(cwd: string): string {
  return cwd.startsWith(HOME) ? '~' + cwd.slice(HOME.length) : cwd;
}

const STATUS_ORDER: SessionStatus[] = ['working', 'waiting', 'idle', 'completed', 'failed', 'stopped'];

function buildGroups(
  entries: SessionEntry[],
  mode: GroupMode,
): {
  title: string;
  rows: { entry: SessionEntry; absIndex: number }[];
}[] {
  const indexed = entries.map((entry, absIndex) => ({ entry, absIndex }));
  const pinned = indexed.filter(x => x.entry.pinned);
  const rest = indexed.filter(x => !x.entry.pinned);

  const groups: { title: string; rows: typeof indexed }[] = [];
  if (pinned.length > 0) {
    groups.push({ title: 'Pinned', rows: pinned });
  }

  if (mode === 'status') {
    for (const s of STATUS_ORDER) {
      const rows = rest.filter(x => x.entry.status === s);
      if (rows.length > 0) {
        groups.push({ title: statusLabel(s), rows });
      }
    }
  } else {
    const byCwd = new Map<string, typeof indexed>();
    for (const x of rest) {
      const k = shortenCwd(x.entry.cwd);
      if (!byCwd.has(k)) byCwd.set(k, []);
      byCwd.get(k)!.push(x);
    }
    const keys = [...byCwd.keys()].sort();
    for (const k of keys) {
      groups.push({ title: k, rows: byCwd.get(k)! });
    }
  }

  return groups;
}

export type StatusGroupingProps = {
  entries: SessionEntry[];
  cursor: number;
  groupMode: GroupMode;
  tick: number;
  pendingStopId: string | null;
};

export function StatusGrouping(props: StatusGroupingProps): React.ReactElement {
  const { entries, cursor, groupMode, tick, pendingStopId } = props;

  if (entries.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text dimColor>No active sessions. Press Shift+Enter to dispatch a new one.</Text>
      </Box>
    );
  }

  const groups = buildGroups(entries, groupMode);
  return (
    <Box flexDirection="column">
      {groups.map((group, gi) => (
        <Box key={`g-${gi}-${group.title}`} flexDirection="column">
          <Box paddingX={1}>
            <Text bold color="suggestion">
              {group.title}
            </Text>
            <Text dimColor> ({group.rows.length})</Text>
          </Box>
          {group.rows.map(({ entry, absIndex }) => (
            <Box key={entry.id} paddingX={1}>
              <SessionRow
                entry={entry}
                selected={absIndex === cursor}
                index={absIndex}
                tick={tick}
                pendingStop={pendingStopId === entry.id}
              />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
