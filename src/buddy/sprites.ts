import type { CompanionBones, Eye, Hat, PetState, Species } from './types.js'
import {
  axolotl,
  blob,
  cactus,
  capybara,
  cat,
  chonk,
  dragon,
  duck,
  ghost,
  goose,
  isPandaSpecies,
  kungFuPanda,
  mushroom,
  octopus,
  owl,
  panda,
  penguin,
  rabbit,
  redPanda,
  robot,
  snail,
  turtle,
} from './types.js'
import { KUNG_FU_PANDA_BODIES } from './sprites/kungFuPanda.js'
import { PANDA_BODIES } from './sprites/panda.js'
import { RED_PANDA_BODIES } from './sprites/redPanda.js'

// Each sprite is 5 lines tall, 12 wide (after {E}→1char substitution).
// Multiple frames per species for idle fidget animation.
// Line 0 is the hat slot — must be blank in frames 0-1; frame 2 may use it.
const BODIES: Record<Species, string[][]> = {
  [duck]: [
    [
      '            ',
      '    __      ',
      '  <({E} )___  ',
      '   (  ._>   ',
      '    `--´    ',
    ],
    [
      '            ',
      '    __      ',
      '  <({E} )___  ',
      '   (  ._>   ',
      '    `--´~   ',
    ],
    [
      '            ',
      '    __      ',
      '  <({E} )___  ',
      '   (  .__>  ',
      '    `--´    ',
    ],
  ],
  [goose]: [
    [
      '            ',
      '     ({E}>    ',
      '     ||     ',
      '   _(__)_   ',
      '    ^^^^    ',
    ],
    [
      '            ',
      '    ({E}>     ',
      '     ||     ',
      '   _(__)_   ',
      '    ^^^^    ',
    ],
    [
      '            ',
      '     ({E}>>   ',
      '     ||     ',
      '   _(__)_   ',
      '    ^^^^    ',
    ],
  ],
  [blob]: [
    [
      '            ',
      '   .----.   ',
      '  ( {E}  {E} )  ',
      '  (      )  ',
      '   `----´   ',
    ],
    [
      '            ',
      '  .------.  ',
      ' (  {E}  {E}  ) ',
      ' (        ) ',
      '  `------´  ',
    ],
    [
      '            ',
      '    .--.    ',
      '   ({E}  {E})   ',
      '   (    )   ',
      '    `--´    ',
    ],
  ],
  [cat]: [
    [
      '            ',
      '   /\\_/\\    ',
      '  ( {E}   {E})  ',
      '  (  ω  )   ',
      '  (")_(")   ',
    ],
    [
      '            ',
      '   /\\_/\\    ',
      '  ( {E}   {E})  ',
      '  (  ω  )   ',
      '  (")_(")~  ',
    ],
    [
      '            ',
      '   /\\-/\\    ',
      '  ( {E}   {E})  ',
      '  (  ω  )   ',
      '  (")_(")   ',
    ],
  ],
  [dragon]: [
    [
      '            ',
      '  /^\\  /^\\  ',
      ' <  {E}  {E}  > ',
      ' (   ~~   ) ',
      '  `-vvvv-´  ',
    ],
    [
      '            ',
      '  /^\\  /^\\  ',
      ' <  {E}  {E}  > ',
      ' (        ) ',
      '  `-vvvv-´  ',
    ],
    [
      '   ~    ~   ',
      '  /^\\  /^\\  ',
      ' <  {E}  {E}  > ',
      ' (   ~~   ) ',
      '  `-vvvv-´  ',
    ],
  ],
  [octopus]: [
    [
      '            ',
      '   .----.   ',
      '  ( {E}  {E} )  ',
      '  (______)  ',
      '  /\\/\\/\\/\\  ',
    ],
    [
      '            ',
      '   .----.   ',
      '  ( {E}  {E} )  ',
      '  (______)  ',
      '  \\/\\/\\/\\/  ',
    ],
    [
      '     o      ',
      '   .----.   ',
      '  ( {E}  {E} )  ',
      '  (______)  ',
      '  /\\/\\/\\/\\  ',
    ],
  ],
  [owl]: [
    [
      '            ',
      '   /\\  /\\   ',
      '  (({E})({E}))  ',
      '  (  ><  )  ',
      '   `----´   ',
    ],
    [
      '            ',
      '   /\\  /\\   ',
      '  (({E})({E}))  ',
      '  (  ><  )  ',
      '   .----.   ',
    ],
    [
      '            ',
      '   /\\  /\\   ',
      '  (({E})(-))  ',
      '  (  ><  )  ',
      '   `----´   ',
    ],
  ],
  [penguin]: [
    [
      '            ',
      '  .---.     ',
      '  ({E}>{E})     ',
      ' /(   )\\    ',
      '  `---´     ',
    ],
    [
      '            ',
      '  .---.     ',
      '  ({E}>{E})     ',
      ' |(   )|    ',
      '  `---´     ',
    ],
    [
      '  .---.     ',
      '  ({E}>{E})     ',
      ' /(   )\\    ',
      '  `---´     ',
      '   ~ ~      ',
    ],
  ],
  [turtle]: [
    [
      '            ',
      '   _,--._   ',
      '  ( {E}  {E} )  ',
      ' /[______]\\ ',
      '  ``    ``  ',
    ],
    [
      '            ',
      '   _,--._   ',
      '  ( {E}  {E} )  ',
      ' /[______]\\ ',
      '   ``  ``   ',
    ],
    [
      '            ',
      '   _,--._   ',
      '  ( {E}  {E} )  ',
      ' /[======]\\ ',
      '  ``    ``  ',
    ],
  ],
  [snail]: [
    [
      '            ',
      ' {E}    .--.  ',
      '  \\  ( @ )  ',
      '   \\_`--´   ',
      '  ~~~~~~~   ',
    ],
    [
      '            ',
      '  {E}   .--.  ',
      '  |  ( @ )  ',
      '   \\_`--´   ',
      '  ~~~~~~~   ',
    ],
    [
      '            ',
      ' {E}    .--.  ',
      '  \\  ( @  ) ',
      '   \\_`--´   ',
      '   ~~~~~~   ',
    ],
  ],
  [ghost]: [
    [
      '            ',
      '   .----.   ',
      '  / {E}  {E} \\  ',
      '  |      |  ',
      '  ~`~``~`~  ',
    ],
    [
      '            ',
      '   .----.   ',
      '  / {E}  {E} \\  ',
      '  |      |  ',
      '  `~`~~`~`  ',
    ],
    [
      '    ~  ~    ',
      '   .----.   ',
      '  / {E}  {E} \\  ',
      '  |      |  ',
      '  ~~`~~`~~  ',
    ],
  ],
  [axolotl]: [
    [
      '            ',
      '}~(______)~{',
      '}~({E} .. {E})~{',
      '  ( .--. )  ',
      '  (_/  \\_)  ',
    ],
    [
      '            ',
      '~}(______){~',
      '~}({E} .. {E}){~',
      '  ( .--. )  ',
      '  (_/  \\_)  ',
    ],
    [
      '            ',
      '}~(______)~{',
      '}~({E} .. {E})~{',
      '  (  --  )  ',
      '  ~_/  \\_~  ',
    ],
  ],
  [capybara]: [
    [
      '            ',
      '  n______n  ',
      ' ( {E}    {E} ) ',
      ' (   oo   ) ',
      '  `------´  ',
    ],
    [
      '            ',
      '  n______n  ',
      ' ( {E}    {E} ) ',
      ' (   Oo   ) ',
      '  `------´  ',
    ],
    [
      '    ~  ~    ',
      '  u______n  ',
      ' ( {E}    {E} ) ',
      ' (   oo   ) ',
      '  `------´  ',
    ],
  ],
  [cactus]: [
    [
      '            ',
      ' n  ____  n ',
      ' | |{E}  {E}| | ',
      ' |_|    |_| ',
      '   |    |   ',
    ],
    [
      '            ',
      '    ____    ',
      ' n |{E}  {E}| n ',
      ' |_|    |_| ',
      '   |    |   ',
    ],
    [
      ' n        n ',
      ' |  ____  | ',
      ' | |{E}  {E}| | ',
      ' |_|    |_| ',
      '   |    |   ',
    ],
  ],
  [robot]: [
    [
      '            ',
      '   .[||].   ',
      '  [ {E}  {E} ]  ',
      '  [ ==== ]  ',
      '  `------´  ',
    ],
    [
      '            ',
      '   .[||].   ',
      '  [ {E}  {E} ]  ',
      '  [ -==- ]  ',
      '  `------´  ',
    ],
    [
      '     *      ',
      '   .[||].   ',
      '  [ {E}  {E} ]  ',
      '  [ ==== ]  ',
      '  `------´  ',
    ],
  ],
  [rabbit]: [
    [
      '            ',
      '   (\\__/)   ',
      '  ( {E}  {E} )  ',
      ' =(  ..  )= ',
      '  (")__(")  ',
    ],
    [
      '            ',
      '   (|__/)   ',
      '  ( {E}  {E} )  ',
      ' =(  ..  )= ',
      '  (")__(")  ',
    ],
    [
      '            ',
      '   (\\__/)   ',
      '  ( {E}  {E} )  ',
      ' =( .  . )= ',
      '  (")__(")  ',
    ],
  ],
  [mushroom]: [
    [
      '            ',
      ' .-o-OO-o-. ',
      '(__________)',
      '   |{E}  {E}|   ',
      '   |____|   ',
    ],
    [
      '            ',
      ' .-O-oo-O-. ',
      '(__________)',
      '   |{E}  {E}|   ',
      '   |____|   ',
    ],
    [
      '   . o  .   ',
      ' .-o-OO-o-. ',
      '(__________)',
      '   |{E}  {E}|   ',
      '   |____|   ',
    ],
  ],
  [chonk]: [
    [
      '            ',
      '  /\\    /\\  ',
      ' ( {E}    {E} ) ',
      ' (   ..   ) ',
      '  `------´  ',
    ],
    [
      '            ',
      '  /\\    /|  ',
      ' ( {E}    {E} ) ',
      ' (   ..   ) ',
      '  `------´  ',
    ],
    [
      '            ',
      '  /\\    /\\  ',
      ' ( {E}    {E} ) ',
      ' (   ..   ) ',
      '  `------´~ ',
    ],
  ],
}

const HAT_LINES: Record<Hat, string> = {
  none: '',
  crown: '   \\^^^/    ',
  tophat: '   [___]    ',
  propeller: '    -+-     ',
  halo: '   (   )    ',
  wizard: '    /^\\     ',
  beanie: '   (___)    ',
  tinyduck: '    ,>      ',
}

export function renderSprite(bones: CompanionBones, frame = 0): string[] {
  // why: v2.21.27 production crash — BODIES 仅含旧 18 物种，panda 系访问 undefined 崩溃；
  //      panda 系 fallback 走 PANDA_SPECIES_BODIES.idle，旧 18 物种逻辑保 byte-equal
  const frames = isPandaSpecies(bones.species)
    ? (PANDA_SPECIES_BODIES[bones.species]?.idle ?? BODIES[duck])
    : BODIES[bones.species]
  const body = frames[frame % frames.length]!.map(line =>
    line.replaceAll('{E}', bones.eye),
  )
  const lines = [...body]
  // Only replace with hat if line 0 is empty (some fidget frames use it for smoke etc)
  if (bones.hat !== 'none' && !lines[0]!.trim()) {
    lines[0] = HAT_LINES[bones.hat]
  }
  // Drop blank hat slot — wastes a row in the Card and ambient sprite when
  // there's no hat and the frame isn't using it for smoke/antenna/etc.
  // Only safe when ALL frames have blank line 0; otherwise heights oscillate.
  if (!lines[0]!.trim() && frames.every(f => !f[0]!.trim())) lines.shift()
  return lines
}

export function spriteFrameCount(species: Species): number {
  // why: v2.21.27 production crash — BODIES 不含 panda 系，spriteFrameCount(panda) 抛 TypeError；
  //      panda 系帧数取 idle 帧数（state-driven 渲染下 frameCount 仅用于 sprite tick 节奏）
  if (isPandaSpecies(species)) {
    return PANDA_SPECIES_BODIES[species]?.idle?.length ?? 1
  }
  return BODIES[species]?.length ?? 1
}

export function renderFace(bones: CompanionBones): string {
  const eye: Eye = bones.eye
  switch (bones.species) {
    case duck:
    case goose:
      return `(${eye}>`
    case blob:
      return `(${eye}${eye})`
    case cat:
      return `=${eye}ω${eye}=`
    case dragon:
      return `<${eye}~${eye}>`
    case octopus:
      return `~(${eye}${eye})~`
    case owl:
      return `(${eye})(${eye})`
    case penguin:
      return `(${eye}>)`
    case turtle:
      return `[${eye}_${eye}]`
    case snail:
      return `${eye}(@)`
    case ghost:
      return `/${eye}${eye}\\`
    case axolotl:
      return `}${eye}.${eye}{`
    case capybara:
      return `(${eye}oo${eye})`
    case cactus:
      return `|${eye}  ${eye}|`
    case robot:
      return `[${eye}${eye}]`
    case rabbit:
      return `(${eye}..${eye})`
    case mushroom:
      return `|${eye}  ${eye}|`
    case chonk:
      return `(${eye}.${eye})`
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// panda 系 state-driven sprite 主索引（D1 P2-T1 占位）
// 旧 18 物种 BODIES 上方保持 byte-equal；下方为新增 panda 系扩展点
// 由 D2 sprite agent (β/γ/δ) 填充 panda.ts / redPanda.ts / kungFuPanda.ts
// 结构：Species → PetState → frames（每帧 5 行 ≤ 12 字符 + {E} 眼位占位）
// ─────────────────────────────────────────────────────────────────────────────

// why: Partial<Record<...>> 让 panda 系子集渐进式填充而不破类型；旧 18 物种走 BODIES 不影响
// D3 P2-T5 合流：D2 三个 sprite agent 已落盘 panda.ts / redPanda.ts / kungFuPanda.ts
export const PANDA_SPECIES_BODIES: Partial<
  Record<Species, Partial<Record<PetState, string[][]>>>
> = {
  [panda]: PANDA_BODIES,
  [redPanda]: RED_PANDA_BODIES,
  [kungFuPanda]: KUNG_FU_PANDA_BODIES,
}

// 取指定 (species, state, frameIndex) 的 sprite，无则 fallback 到 idle frame 0
// why: 渲染层 P3-T2 接入时需要稳定 fallback 链，避免 panda sprite 缺帧导致渲染崩溃
export function getStateSprite(
  species: Species,
  state: PetState,
  frame: number,
): string[] | undefined {
  const speciesFrames = PANDA_SPECIES_BODIES[species]
  if (!speciesFrames) return undefined
  const stateFrames = speciesFrames[state] ?? speciesFrames.idle
  if (!stateFrames || stateFrames.length === 0) return undefined
  return stateFrames[frame % stateFrames.length]
}
