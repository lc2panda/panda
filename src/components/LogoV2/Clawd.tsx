import * as React from 'react';
import { Box, Text } from '../../ink.js';

export type ClawdPose = 'default' | 'arms-up' | 'look-left' | 'look-right';
type Props = { pose?: ClawdPose };

export function Clawd({ pose = 'default' }: Props) {
  const happy = pose === 'arms-up';
  const mouth = happy ? '╰──◡──╯' : '╰─────╯';

  return (
    <Box flexDirection="column" alignItems="center">
      <Text>
        <Text color="#00ccdd">{'   '}</Text>
        <Text color="#222233" bold>{'▄██▄'}</Text>
        <Text color="#00ccdd">{'     '}</Text>
        <Text color="#222233" bold>{'▄██▄'}</Text>
      </Text>
      <Text>
        <Text color="#00ccdd">{'  ╭'}</Text>
        <Text color="#222233" bold>{'████'}</Text>
        <Text color="#ffffff" bold>{'▀▀▀▀▀'}</Text>
        <Text color="#222233" bold>{'████'}</Text>
        <Text color="#00ccdd">{'╮'}</Text>
      </Text>
      <Text>
        <Text color="#00ccdd">{'  │'}</Text>
        <Text color="#ffffff" bold>{' '}</Text>
        <Text color="#222233" bold>{'▓██'}</Text>
        <Text color="#ffffff" bold>{'  ▼  '}</Text>
        <Text color="#222233" bold>{'██▓'}</Text>
        <Text color="#ffffff" bold>{' '}</Text>
        <Text color="#00ccdd">{'│'}</Text>
      </Text>
      <Text>
        <Text color="#00ccdd">{'  │'}</Text>
        <Text color="#ff99aa">{' ◦'}</Text>
        <Text color="#222233" bold>{'▓'}</Text>
        <Text color="#66eeff">{'◉'}</Text>
        <Text color="#222233" bold>{'▓'}</Text>
        <Text color="#ffffff" bold>{'     '}</Text>
        <Text color="#222233" bold>{'▓'}</Text>
        <Text color="#66eeff">{'◉'}</Text>
        <Text color="#222233" bold>{'▓'}</Text>
        <Text color="#ff99aa">{'◦ '}</Text>
        <Text color="#00ccdd">{'│'}</Text>
      </Text>
      <Text>
        <Text color="#00ccdd">{'  │'}</Text>
        <Text color="#ffffff" bold>{'    '}</Text>
        <Text color="#555566">{mouth}</Text>
        <Text color="#ffffff" bold>{'    '}</Text>
        <Text color="#00ccdd">{'│'}</Text>
      </Text>
      <Text>
        <Text color="#00ccdd">{'  ╰─────────────────╯'}</Text>
      </Text>
    </Box>
  );
}
