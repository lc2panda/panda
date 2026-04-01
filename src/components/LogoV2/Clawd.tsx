import * as React from 'react';
import { Box, Text } from '../../ink.js';

export type ClawdPose = 'default' | 'arms-up' | 'look-left' | 'look-right';
type Props = { pose?: ClawdPose };

export function Clawd({ pose = 'default' }: Props) {
  const L = pose === 'look-left';
  const R = pose === 'look-right';
  const eyeL = L ? '◑' : R ? '◐' : '◉';
  const eyeR = L ? '◑' : R ? '◐' : '◉';
  const mouth = pose === 'arms-up' ? '◡' : 'ω';

  return (
    <Box flexDirection="column" alignItems="center">
      <Text>{'▄█▄'}<Text color="#00bbcc">{'▄▀▀▀▄'}</Text>{'▄█▄'}</Text>
      <Text><Text color="#00bbcc">{'▐'}</Text>{'█'}<Text color="#00bbcc" bold>{eyeL}</Text>{'█ ▾ █'}<Text color="#00bbcc" bold>{eyeR}</Text>{'█'}<Text color="#00bbcc">{'▌'}</Text></Text>
      <Text><Text color="#00bbcc">{'▝▀'}</Text><Text color="#ff8899">{'‧'}</Text>{` ${mouth} `}<Text color="#ff8899">{'‧'}</Text><Text color="#00bbcc">{'▀▘'}</Text></Text>
    </Box>
  );
}
