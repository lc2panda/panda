import * as React from 'react';
import { Box, Text } from '../../ink.js';

export type ClawdPose = 'default' | 'arms-up' | 'look-left' | 'look-right';
type Props = { pose?: ClawdPose };

const _ = '#000000';
const W = '#ffffff';
const E = '#1a1a2e';
const C = '#00d4e6';
const P = '#ff99aa';
const N = '#444455';
const T = '#ee5577';
const H = '#ccddee';

function P_({ f, b }: { f: string; b: string }) {
  return <Text color={f} backgroundColor={b}>▀</Text>;
}

export function Clawd({ pose = 'default' }: Props) {
  const eL = pose === 'look-left';
  const eR = pose === 'look-right';
  const happy = pose === 'arms-up';

  const eyeL1 = eL ? E : (eR ? _ : E);
  const eyeL2 = eL ? _ : (eR ? E : _);
  const eyeR1 = eL ? _ : (eR ? E : _);
  const eyeR2 = eL ? E : (eR ? _ : E);

  return (
    <Box flexDirection="column">
      <Text>
        <P_ f={_} b={_}/><P_ f={_} b={_}/><P_ f={_} b={E}/><P_ f={E} b={E}/>
        <P_ f={_} b={C}/><P_ f={C} b={C}/><P_ f={C} b={C}/><P_ f={C} b={C}/>
        <P_ f={C} b={C}/><P_ f={C} b={C}/><P_ f={C} b={C}/><P_ f={_} b={C}/>
        <P_ f={E} b={E}/><P_ f={_} b={E}/><P_ f={_} b={_}/><P_ f={_} b={_}/>
      </Text>
      <Text>
        <P_ f={_} b={_}/><P_ f={E} b={C}/><P_ f={C} b={E}/><P_ f={E} b={E}/>
        <P_ f={E} b={W}/><P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={W} b={W}/>
        <P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={E} b={W}/>
        <P_ f={E} b={E}/><P_ f={C} b={E}/><P_ f={E} b={C}/><P_ f={_} b={_}/>
      </Text>
      <Text>
        <P_ f={_} b={C}/><P_ f={C} b={W}/><P_ f={W} b={W}/><P_ f={W} b={E}/>
        <P_ f={E} b={E}/><P_ f={E} b={E}/><P_ f={W} b={W}/><P_ f={W} b={W}/>
        <P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={E} b={E}/><P_ f={E} b={E}/>
        <P_ f={W} b={E}/><P_ f={W} b={W}/><P_ f={C} b={W}/><P_ f={_} b={C}/>
      </Text>
      <Text>
        <P_ f={C} b={C}/><P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={E} b={E}/>
        <P_ f={eyeL1} b={eyeL2}/><P_ f={E} b={E}/><P_ f={W} b={W}/><P_ f={W} b={W}/>
        <P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={E} b={E}/><P_ f={eyeR1} b={eyeR2}/>
        <P_ f={E} b={E}/><P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={C} b={C}/>
      </Text>
      <Text>
        <P_ f={C} b={C}/><P_ f={W} b={W}/><P_ f={P} b={W}/><P_ f={W} b={W}/>
        <P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={W} b={N}/><P_ f={N} b={N}/>
        <P_ f={N} b={N}/><P_ f={N} b={W}/><P_ f={W} b={W}/><P_ f={W} b={W}/>
        <P_ f={W} b={W}/><P_ f={W} b={P}/><P_ f={W} b={W}/><P_ f={C} b={C}/>
      </Text>
      <Text>
        <P_ f={C} b={C}/><P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={W} b={W}/>
        <P_ f={W} b={W}/>{happy ? <P_ f={W} b={N}/> : <P_ f={W} b={W}/>}
        {happy ? <P_ f={N} b={T}/> : <P_ f={W} b={N}/>}
        {happy ? <P_ f={W} b={T}/> : <P_ f={W} b={W}/>}
        {happy ? <P_ f={N} b={T}/> : <P_ f={W} b={N}/>}
        {happy ? <P_ f={W} b={N}/> : <P_ f={W} b={W}/>}
        <P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={W} b={W}/>
        <P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={C} b={C}/>
      </Text>
      <Text>
        <P_ f={_} b={C}/><P_ f={C} b={W}/><P_ f={W} b={W}/><P_ f={W} b={W}/>
        <P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={W} b={W}/>
        <P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={W} b={W}/>
        <P_ f={W} b={W}/><P_ f={W} b={W}/><P_ f={C} b={W}/><P_ f={_} b={C}/>
      </Text>
      <Text>
        <P_ f={_} b={_}/><P_ f={_} b={C}/><P_ f={C} b={C}/><P_ f={C} b={C}/>
        <P_ f={C} b={C}/><P_ f={C} b={C}/><P_ f={C} b={C}/><P_ f={C} b={C}/>
        <P_ f={C} b={C}/><P_ f={C} b={C}/><P_ f={C} b={C}/><P_ f={C} b={C}/>
        <P_ f={C} b={C}/><P_ f={C} b={C}/><P_ f={_} b={C}/><P_ f={_} b={_}/>
      </Text>
    </Box>
  );
}
