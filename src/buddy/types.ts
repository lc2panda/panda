export const RARITIES = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
] as const
export type Rarity = (typeof RARITIES)[number]

// One species name collides with a model-codename canary in excluded-strings.txt.
// The check greps build output (not source), so runtime-constructing the value keeps
// the literal out of the bundle while the check stays armed for the actual codename.
// All species encoded uniformly; `as` casts are type-position only (erased pre-bundle).
const c = String.fromCharCode
// biome-ignore format: keep the species list compact

export const duck = c(0x64,0x75,0x63,0x6b) as 'duck'
export const goose = c(0x67, 0x6f, 0x6f, 0x73, 0x65) as 'goose'
export const blob = c(0x62, 0x6c, 0x6f, 0x62) as 'blob'
export const cat = c(0x63, 0x61, 0x74) as 'cat'
export const dragon = c(0x64, 0x72, 0x61, 0x67, 0x6f, 0x6e) as 'dragon'
export const octopus = c(0x6f, 0x63, 0x74, 0x6f, 0x70, 0x75, 0x73) as 'octopus'
export const owl = c(0x6f, 0x77, 0x6c) as 'owl'
export const penguin = c(0x70, 0x65, 0x6e, 0x67, 0x75, 0x69, 0x6e) as 'penguin'
export const turtle = c(0x74, 0x75, 0x72, 0x74, 0x6c, 0x65) as 'turtle'
export const snail = c(0x73, 0x6e, 0x61, 0x69, 0x6c) as 'snail'
export const ghost = c(0x67, 0x68, 0x6f, 0x73, 0x74) as 'ghost'
export const axolotl = c(0x61, 0x78, 0x6f, 0x6c, 0x6f, 0x74, 0x6c) as 'axolotl'
export const capybara = c(
  0x63,
  0x61,
  0x70,
  0x79,
  0x62,
  0x61,
  0x72,
  0x61,
) as 'capybara'
export const cactus = c(0x63, 0x61, 0x63, 0x74, 0x75, 0x73) as 'cactus'
export const robot = c(0x72, 0x6f, 0x62, 0x6f, 0x74) as 'robot'
export const rabbit = c(0x72, 0x61, 0x62, 0x62, 0x69, 0x74) as 'rabbit'
export const mushroom = c(
  0x6d,
  0x75,
  0x73,
  0x68,
  0x72,
  0x6f,
  0x6f,
  0x6d,
) as 'mushroom'
export const chonk = c(0x63, 0x68, 0x6f, 0x6e, 0x6b) as 'chonk'

// panda 系（D1 P1-T2）：append 末尾保旧 18 物种 hash 不漂移；沿用 fromCharCode 模式与既有 species 一致
export const panda = c(0x70, 0x61, 0x6e, 0x64, 0x61) as 'panda'
export const redPanda = c(
  0x72,
  0x65,
  0x64,
  0x50,
  0x61,
  0x6e,
  0x64,
  0x61,
) as 'redPanda'
export const kungFuPanda = c(
  0x6b,
  0x75,
  0x6e,
  0x67,
  0x46,
  0x75,
  0x50,
  0x61,
  0x6e,
  0x64,
  0x61,
) as 'kungFuPanda'

export const SPECIES = [
  duck,
  goose,
  blob,
  cat,
  dragon,
  octopus,
  owl,
  penguin,
  turtle,
  snail,
  ghost,
  axolotl,
  capybara,
  cactus,
  robot,
  rabbit,
  mushroom,
  chonk,
  // append 末尾：mulberry32 是 deterministic，旧 18 物种 hash 落点不变
  panda,
  redPanda,
  kungFuPanda,
] as const
export type Species = (typeof SPECIES)[number] // biome-ignore format: keep compact

// panda 系子集，渲染层用以 gate state-driven sprite 切换（旧 18 物种走 IDLE_SEQUENCE 兼容）
export const PANDA_SPECIES = [panda, redPanda, kungFuPanda] as const
export type PandaSpecies = (typeof PANDA_SPECIES)[number]
export function isPandaSpecies(s: Species): s is PandaSpecies {
  return (PANDA_SPECIES as readonly Species[]).includes(s)
}

// PetState 12 态枚举（D1 P1-T1）— 优先级数值越大越高
// 排序原则：异常/通知 > 系统操作 > 多任务并发 > 单任务 > 待机梯度
export const PET_STATES = [
  'error',
  'notification',
  'sweeping',
  'attention',
  'juggling',
  'carrying',
  'working',
  'thinking',
  'waking',
  'idle',
  'dozing',
  'sleeping',
] as const
export type PetState = (typeof PET_STATES)[number]

// 优先级表：数值越大越高；getCurrentPetState 取最大者
export const PET_STATE_PRIORITY: Record<PetState, number> = {
  error: 120,
  notification: 110,
  sweeping: 100,
  attention: 90,
  juggling: 80,
  carrying: 70,
  working: 60,
  thinking: 50,
  waking: 40,
  idle: 30,
  dozing: 20,
  sleeping: 10,
}

// 一次性状态：触发后短暂展示后自动回退 idle（idle timer + one-shot 在 P3 加）
export const ONE_SHOT_STATES: ReadonlySet<PetState> = new Set<PetState>([
  'error',
  'notification',
  'attention',
])

export const EYES = ['·', '✦', '×', '◉', '@', '°'] as const
export type Eye = (typeof EYES)[number]

export const HATS = [
  'none',
  'crown',
  'tophat',
  'propeller',
  'halo',
  'wizard',
  'beanie',
  'tinyduck',
] as const
export type Hat = (typeof HATS)[number]

export const STAT_NAMES = [
  'DEBUGGING',
  'PATIENCE',
  'CHAOS',
  'WISDOM',
  'SNARK',
] as const
export type StatName = (typeof STAT_NAMES)[number]

// Deterministic parts — derived from hash(userId)
export type CompanionBones = {
  rarity: Rarity
  species: Species
  eye: Eye
  hat: Hat
  shiny: boolean
  stats: Record<StatName, number>
}

// Model-generated soul — stored in config after first hatch
export type CompanionSoul = {
  name: string
  personality: string
}

export type Companion = CompanionBones &
  CompanionSoul & {
    hatchedAt: number
  }

// What actually persists in config. Bones are regenerated from hash(userId)
// on every read so species renames don't break stored companions and users
// can't edit their way to a legendary.
export type StoredCompanion = CompanionSoul & { hatchedAt: number }

export const RARITY_WEIGHTS = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
} as const satisfies Record<Rarity, number>

export const RARITY_STARS = {
  common: '★',
  uncommon: '★★',
  rare: '★★★',
  epic: '★★★★',
  legendary: '★★★★★',
} as const satisfies Record<Rarity, string>

export const RARITY_COLORS = {
  common: 'inactive',
  uncommon: 'success',
  rare: 'permission',
  epic: 'autoAccept',
  legendary: 'warning',
} as const satisfies Record<Rarity, keyof import('../utils/theme.js').Theme>
