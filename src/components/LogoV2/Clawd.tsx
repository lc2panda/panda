import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { env } from '../../utils/env.js';
export type ClawdPose = 'default' | 'arms-up'
| 'look-left'
| 'look-right';

type Props = {
  pose?: ClawdPose;
};

export function Clawd(t0) {
  const $ = _c(4);
  let t1;
  if ($[0] !== t0) {
    t1 = t0 === undefined ? {} : t0;
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const {
    pose: t2
  } = t1;
  const pose = t2 === undefined ? "default" : t2;
  let t3;
  if ($[2] !== pose) {
    t3 = <Box flexDirection="column" alignItems="center">
      <Text>{' ▄████▀▀▀▀▀▀████▄ '}</Text>
      <Text>{'████▀        ▀████'}</Text>
      <Text>{'▀▀             ▀▀ '}</Text>
      <Text>{'   ▄█▄   ▄█▄     '}</Text>
      <Text>{'  █▄█▀   █▄██    '}</Text>
      <Text>{'  ▀▀▀ ▄▄  ▀▀▀    '}</Text>
      <Text>{'     ╰──╯         '}</Text>
      <Text>{' █▄▄▄       ▄▄▄█ '}</Text>
      <Text>{'  ▀██████████████▀ '}</Text>
    </Box>;
    $[2] = pose;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  return t3;
}
