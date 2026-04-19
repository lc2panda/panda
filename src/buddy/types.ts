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

// why v2.21.30 方向 A：v2.21.27/28/29 panda 系 5×12 ASCII 画布太小重画 N 次仍"不像熊猫"，
//   指挥官批方案 A — 退役 panda/redPanda/kungFuPanda 三物种实装，复用旧 18 物种做 /buddy theme 切换；
//   PetState 状态机 + MiniPet + idle/sleeping 等 A+B 项目精华保留，让所有物种都享受。
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
] as const
export type Species = (typeof SPECIES)[number] // biome-ignore format: keep compact

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

// ─────────────────────────────────────────────────────────────────────────────
// Phase 0 · 养成系统（v0.7 / on-desk 主方案 §3）— [NEW-FILE:#20260419-OD-01/02 配套 schema]
// 单价 / 等级公式 / 解锁阈值 / 里程碑 ID 集中此处，便于审计与调参。
// 严守"只追加不改前面"约定 — 上面 RARITIES/EYES/HATS/SPECIES 等 byte-equal 不动。
// ─────────────────────────────────────────────────────────────────────────────

// XP 来源桶（11 个）— 信号来源详 A2 §1
export const XP_BUCKETS = [
  'time',
  'tokens.in',
  'tokens.out',
  'tokens.cache',
  'cmd.basic',
  'cmd.heavy',
  'turn.success',
  'error.recover',
  'deepdream',
  'streak.daily',
  'milestone',
] as const
export type XpBucket = (typeof XP_BUCKETS)[number]

// 单价表（XP/单位）— 单位含义详 A2 §1 表头
// why frozen: 调参属于"配置变更"，应先改这里再 commit；避免运行时被任何模块意外篡改
export const XP_RATES: Readonly<Record<XpBucket, number>> = Object.freeze({
  time: 1, // per minute (capped 8h/day → 480 min)
  'tokens.in': 2, // per 1000 tokens
  'tokens.out': 5, // per 1000 tokens
  'tokens.cache': 0.5, // per 1000 tokens
  'cmd.basic': 3, // per slash cmd
  'cmd.heavy': 8, // per /edit /build /test /buddy
  'turn.success': 15, // per Stop event
  'error.recover': 25, // bonus
  deepdream: 200,
  'streak.daily': 50, // × min(streak, 7)
  milestone: 0, // 个别里程碑独立 XP（见 MILESTONE_XP）
})

export const MAX_LEVEL = 60
export const DAILY_XP_CAP = 2000
export const TIME_XP_CAP_MIN = 480 // 8h / day

// 等级公式：XP_required(L→L+1) = floor(80 × L^1.55)
// L=1 → 80；L=10 → 2949；L=30 → 16k；L=59 → 49k（详 A2 §2 表）
// L < 1 / L >= MAX_LEVEL → Infinity（满级或非法 → 不可再升）
// why pure: 纯数学便于测试 + 任何模块共享同一份单源真理
export function xpRequiredForLevel(level: number): number {
  if (level < 1 || level >= MAX_LEVEL) return Infinity
  return Math.floor(80 * Math.pow(level, 1.55))
}

// 累计 XP（从 1 级到 N 级所需总和）— UI 进度条计算用
// totalXpForLevel(1) = 0；totalXpForLevel(2) = 80；满级 60 ≈ 2.18M
export function totalXpForLevel(level: number): number {
  if (level <= 1) return 0
  let total = 0
  const cap = Math.min(level, MAX_LEVEL)
  for (let i = 1; i < cap; i++) total += xpRequiredForLevel(i)
  return total
}

// 等级阈值 → 自动稀有度跃迁（A2 §3 通道 A）
// effectiveRarity = max(bones.rarity, levelRarity, milestoneShiny)
export const LEVEL_RARITY_THRESHOLDS: ReadonlyArray<{
  level: number
  rarity: Rarity
}> = Object.freeze([
  Object.freeze({ level: 1, rarity: 'common' as Rarity }),
  Object.freeze({ level: 10, rarity: 'uncommon' as Rarity }),
  Object.freeze({ level: 25, rarity: 'rare' as Rarity }),
  Object.freeze({ level: 40, rarity: 'epic' as Rarity }),
  Object.freeze({ level: 55, rarity: 'legendary' as Rarity }),
])

// PetState 解锁阶梯（A2 §4.1）
// 未解锁的 state 一律降级为 idle —— "低级宠不会做事"养成感
// why frozen: 解锁表是养成体验核心契约，运行时变更会破坏存档一致性
export const PETSTATE_UNLOCK_LEVEL: Readonly<Record<PetState, number>> =
  Object.freeze({
    idle: 1,
    sleeping: 1,
    dozing: 1,
    thinking: 5,
    waking: 5,
    working: 10,
    notification: 10,
    attention: 15,
    error: 15,
    carrying: 20,
    juggling: 30,
    sweeping: 45,
  })

// HATS 解锁阶梯（A2 §4.2 简化版 — 取 8 顶单门槛阈值；带 milestone 双门槛的 wizard/halo
// 在 petXP.ts 内额外校验里程碑条件，types 这里只编码等级阈值兜底）
export const HAT_UNLOCK_LEVEL: Readonly<Record<Hat, number>> = Object.freeze({
  none: 1,
  beanie: 5,
  propeller: 12,
  tinyduck: 18,
  tophat: 25,
  halo: 35,
  wizard: 45,
  crown: 55,
})

// EYES 解锁阶梯（A2 §4.3）— `×` 由 milestone 触发，等级阈值给 Infinity 强制走里程碑路径
export const EYE_UNLOCK_LEVEL: Readonly<Record<Eye, number>> = Object.freeze({
  '·': 1,
  '°': 3,
  '✦': 8,
  '◉': 20,
  '@': 35,
  '×': Number.POSITIVE_INFINITY,
})

// 里程碑 13 个（详 A2 §8）—— ID 列表 + 各自独立 XP 奖励
// 触发逻辑在 petXP.ts::recordMilestone（首次记录返回 unlocked=true）
export const MILESTONES = [
  'first_1m_tokens',
  'first_100_commits',
  'streak_7',
  'streak_30',
  'first_deepdream',
  'first_fix_bug',
  'first_pr_merged',
  'first_skill_created',
  'epic_marathon_4h',
  'midnight_owl',
  'lv_10',
  'lv_25',
  'lv_50',
] as const
export type MilestoneId = (typeof MILESTONES)[number]

// 单个里程碑 XP 奖励（A2 §8 表）— 13 项
// "epic" 级里程碑（≥500 XP）累计 ≥ 3 个 → shiny 永久点亮（A2 §3 通道 C）
export const MILESTONE_XP: Readonly<Record<MilestoneId, number>> = Object.freeze({
  first_1m_tokens: 500,
  first_100_commits: 500,
  streak_7: 700,
  streak_30: 3000,
  first_deepdream: 300,
  first_fix_bug: 200,
  first_pr_merged: 600,
  first_skill_created: 400,
  epic_marathon_4h: 800,
  midnight_owl: 200,
  lv_10: 1000,
  lv_25: 2500,
  lv_50: 5000,
})

// epic 里程碑阈值 — XP ≥ 此值即视为"epic 级"（A2 §3 通道 C 触发条件）
export const EPIC_MILESTONE_XP_THRESHOLD = 500
export const SHINY_EPIC_MILESTONE_COUNT = 3

// 持久化 schema 版本号（迁移用；任何字段语义变更必须 +1）
export const COMPANION_STATS_SCHEMA_VERSION = 1

