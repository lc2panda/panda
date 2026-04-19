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
  mushroom,
  octopus,
  owl,
  penguin,
  rabbit,
  robot,
  snail,
  turtle,
} from './types.js'
// why v2.21.30 方向 A：panda 系实装退役（v2.21.27-29 反馈"5×12 画布太小不像熊猫"），
//   仅保留 BODIES 旧 18 物种 byte-equal 路径；getStateSprite 接口保留供 CompanionSprite
//   按物种走 state-driven path（无特化 sprite 时 fallback 到旧 renderSprite）。

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
  // why v2.21.30 方向 A：panda 系退役后 BODIES 覆盖 18 物种全集；未注册物种走 duck 兜底防 undefined.length 崩溃
  const frames = BODIES[bones.species] ?? BODIES[duck]
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
  // why v2.21.30 方向 A：panda 系退役；BODIES 覆盖 18 物种全集，未注册物种返回 1 防 NaN
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
// state-driven sprite 主索引（v2.21.30 方向 A 改造）
// 历史：v2.21.27/28/29 用 panda/redPanda/kungFuPanda 三 panda 系实装，因 5×12 ASCII
//   画布太小 N 次重画仍"不像熊猫"；指挥官批方案 A — 退役 panda 系实装，旧 18 物种通过
//   /buddy theme 切换；接口（STATE_SPECIES_BODIES + getStateSprite）保留供未来扩展。
// ─────────────────────────────────────────────────────────────────────────────

// why Partial<Record>：留扩展点供未来给特定物种加 state-driven 帧；当前 18 物种全走 fallback
//   到旧 BODIES（CompanionSprite 检测到 getStateSprite 返回 undefined 即走 renderSprite）
export const STATE_SPECIES_BODIES: Partial<
  Record<Species, Partial<Record<PetState, string[][]>>>
> = {}

// 取指定 (species, state, frameIndex) 的 sprite，无则返回 undefined 让调用方 fallback
// why v2.21.30 方向 A：18 物种 fallback IDLE — STATE_SPECIES_BODIES 当前空表，
//   函数稳定返回 undefined；CompanionSprite 渲染层走 renderSprite 旧路径保 byte-equal
export function getStateSprite(
  species: Species,
  state: PetState,
  frame: number,
): string[] | undefined {
  const speciesFrames = STATE_SPECIES_BODIES[species]
  if (!speciesFrames) return undefined
  const stateFrames = speciesFrames[state] ?? speciesFrames.idle
  if (!stateFrames || stateFrames.length === 0) return undefined
  return stateFrames[frame % stateFrames.length]
}
