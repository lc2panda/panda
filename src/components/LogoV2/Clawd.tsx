import * as React from 'react';
import { Box, Text } from '../../ink.js';

export type ClawdPose = 'default' | 'arms-up' | 'look-left' | 'look-right';
type Props = { pose?: ClawdPose };

export function Clawd({ pose = 'default' }: Props) {
  const happy = pose === 'arms-up';
  const mouth = happy ? '  ╰ ◡ ╯  ' : '  ╰───╯  ';

  return (
    <Box flexDirection="column" alignItems="center">
      <Text>{'   ▄███▄     ▄███▄'}</Text>
      <Text>{'  ██████▀▀▀▀▀██████'}</Text>
      <Text>{'  █ '}<Text color="blackBright">{'▄███▄'}</Text>{'   '}<Text color="blackBright">{'▄███▄'}</Text>{' █'}</Text>
      <Text>{'  █ '}<Text color="blackBright">{'█'}</Text><Text color="#00ccdd" bold>{'◉'}</Text><Text color="blackBright">{'██'}</Text>{'   '}<Text color="blackBright">{'██'}</Text><Text color="#00ccdd" bold>{'◉'}</Text><Text color="blackBright">{'█'}</Text>{' █'}</Text>
      <Text>{'  █ '}<Text color="blackBright">{'▀███▀'}</Text>{' ▼ '}<Text color="blackBright">{'▀███▀'}</Text>{' █'}</Text>
      <Text>{'  █  '}<Text color="#ff8899">{'◦'}</Text>{mouth}<Text color="#ff8899">{'◦'}</Text>{'  █'}</Text>
      <Text>{'  ▀█▄▄▄▄▄▄▄▄▄▄▄█▀'}</Text>
    </Box>
  );
}
