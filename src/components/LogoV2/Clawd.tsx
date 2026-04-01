import * as React from 'react';
import { Box, Text } from '../../ink.js';

export type ClawdPose = 'default' | 'arms-up' | 'look-left' | 'look-right';
type Props = { pose?: ClawdPose };

function R({ children }: { children: React.ReactNode }) {
  return <Text>{children}</Text>;
}
function P({ f, b, c = '▀' }: { f: string; b: string; c?: string }) {
  return <Text color={f} backgroundColor={b}>{c}</Text>;
}

const K = '#111118';
const D = '#1a1a2e';
const C = '#22c5d6';
const Cd = '#1a9aaa';
const W = '#ffffff';
const Wl = '#e8eaec';
const Bk = '#1a1a2e';
const Ep = '#2a2040';
const Ew = '#f0f0f0';
const Pk = '#e8a0a0';
const Mg = '#d080a0';
const Au1 = '#2060a0';
const Au2 = '#30a870';
const Au3 = '#4050b0';
const Ns = '#444466';
const Tg = '#e05070';
const Mth = '#888899';

export function Clawd({ pose = 'default' }: Props) {
  const elook = pose === 'look-left' ? 'l' : pose === 'look-right' ? 'r' : 'd';
  const smile = pose === 'arms-up';

  return (
    <Box flexDirection="column">
      <R><P f={K} b={K}/><P f={K} b={K}/><P f={K} b={D}/><P f={D} b={Au2}/><P f={Au1} b={C}/><P f={C} b={C}/><P f={C} b={C}/><P f={C} b={C}/><P f={C} b={C}/><P f={C} b={C}/><P f={Au3} b={C}/><P f={D} b={Au1}/><P f={D} b={K}/><P f={K} b={K}/></R>
      <R><P f={K} b={D}/><P f={Au2} b={C}/><P f={C} b={Cd}/><P f={Cd} b={Bk}/><P f={Bk} b={Bk}/><P f={Cd} b={Cd}/><P f={C} b={Cd}/><P f={C} b={Cd}/><P f={Cd} b={Cd}/><P f={Bk} b={Bk}/><P f={Bk} b={Cd}/><P f={Cd} b={C}/><P f={Au1} b={D}/><P f={K} b={K}/></R>
      <R><P f={D} b={C}/><P f={Cd} b={Bk}/><P f={Bk} b={Bk}/><P f={Bk} b={Wl}/><P f={W} b={W}/><P f={W} b={W}/><P f={W} b={W}/><P f={W} b={W}/><P f={W} b={W}/><P f={W} b={W}/><P f={Wl} b={Bk}/><P f={Bk} b={Bk}/><P f={Cd} b={Au3}/><P f={D} b={K}/></R>
      <R><P f={C} b={Cd}/><P f={Bk} b={W}/><P f={W} b={W}/><P f={W} b={Ep}/><P f={Ep} b={Ep}/><P f={Ep} b={Ep}/>{elook==='l' ? <P f={Ew} b={Ep}/> : <P f={Ep} b={Ew}/>}<P f={W} b={W}/><P f={W} b={W}/>{elook==='r' ? <P f={Ew} b={Ep}/> : <P f={Ep} b={Ew}/>}<P f={Ep} b={Ep}/><P f={Ep} b={W}/><P f={W} b={Bk}/><P f={Cd} b={Au1}/></R>
      <R><P f={C} b={Cd}/><P f={W} b={W}/><P f={W} b={W}/><P f={Ep} b={Ep}/>{elook==='l' ? <P f={Ew} b={Ep}/> : <P f={Ep} b={Ew}/>}<P f={Ep} b={Ep}/><P f={Ep} b={W}/><P f={W} b={W}/><P f={W} b={Ep}/><P f={Ep} b={Ep}/>{ elook==='r' ? <P f={Ew} b={Ep}/> : <P f={Ep} b={Ew}/>}<P f={Ep} b={W}/><P f={W} b={Bk}/><P f={Cd} b={Au3}/></R>
      <R><P f={C} b={Cd}/><P f={W} b={W}/><P f={W} b={Pk}/><P f={W} b={W}/><P f={W} b={W}/><P f={W} b={W}/><P f={W} b={Ns}/><P f={Ns} b={W}/><P f={W} b={W}/><P f={W} b={W}/><P f={W} b={W}/><P f={Pk} b={W}/><P f={W} b={Bk}/><P f={Cd} b={D}/></R>
      <R><P f={Cd} b={C}/><P f={W} b={W}/><P f={W} b={W}/><P f={W} b={W}/><P f={W} b={W}/>{smile ? <P f={W} b={Mth}/> : <P f={W} b={W}/>}{smile ? <P f={Mth} b={Tg}/> : <P f={Mth} b={Mth}/>}{smile ? <P f={Mth} b={Tg}/> : <P f={Mth} b={Mth}/>}{smile ? <P f={W} b={Mth}/> : <P f={W} b={W}/>}<P f={W} b={W}/><P f={W} b={W}/><P f={W} b={W}/><P f={Bk} b={Cd}/><P f={C} b={D}/></R>
      <R><P f={K} b={Cd}/><P f={Cd} b={C}/><P f={W} b={Wl}/><P f={W} b={W}/><P f={W} b={W}/><P f={W} b={W}/><P f={W} b={W}/><P f={W} b={W}/><P f={W} b={W}/><P f={W} b={W}/><P f={Wl} b={W}/><P f={C} b={Cd}/><P f={Cd} b={D}/><P f={K} b={K}/></R>
      <R><P f={K} b={K}/><P f={D} b={Cd}/><P f={Cd} b={C}/><P f={C} b={C}/><P f={C} b={C}/><P f={C} b={C}/><P f={C} b={C}/><P f={C} b={C}/><P f={C} b={C}/><P f={C} b={C}/><P f={Cd} b={Au2}/><P f={D} b={D}/><P f={K} b={K}/><P f={K} b={K}/></R>
    </Box>
  );
}
