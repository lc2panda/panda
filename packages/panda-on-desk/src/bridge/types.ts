// Input:  panda CLI 侧 src/desk/types.ts
// Output: 同源协议 schema — 本地内联保证 Electron CJS 加载（不跨根 ESM package.json）
// Pos:    packages/panda-on-desk/src/bridge/server.ts 引用本文件
//         严守 anthropic byte-equal — 仅类型 + 常量，无运行时依赖
//
// [NEW-FILE:#20260419-P1-07]
// 2026-04-20 W18-T3 修复：Electron 41 + Node22 require 解析 nearest package.json
//   漏过 packages/panda-on-desk/package.json，认到根 type:"module"。原 `export *
//   from '../../../../src/desk/types.js'` 在 spawn 时炸 "exports is not defined in
//   ES module scope"。把 6 个协议常量内联；值与 src/desk/types.ts 完全一致。
//   parity 测试（types.parity.test.ts）守护双向一致性。

/** Pet 状态 12 态 — 与 src/buddy/types.ts PET_STATES 1:1 同步 */
export type PetState =
  | 'error'
  | 'notification'
  | 'sweeping'
  | 'attention'
  | 'juggling'
  | 'carrying'
  | 'working'
  | 'thinking'
  | 'waking'
  | 'idle'
  | 'dozing'
  | 'sleeping'

/** 帽子 8 顶 — 与 src/buddy/types.ts HATS 同步 */
export type Hat =
  | 'none'
  | 'crown'
  | 'tophat'
  | 'propeller'
  | 'halo'
  | 'wizard'
  | 'beanie'
  | 'tinyduck'

/** 眼睛 6 — 与 src/buddy/types.ts EYES 同步 */
export type Eye = '·' | '✦' | '×' | '◉' | '@' | '°'

/** 稀有度 — 与 src/buddy/types.ts RARITIES 同步 */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

// ─────────────────────────────────────────────────────────────────────────────
// 协议常量 — 与 src/desk/types.ts 逐字节一致（parity 测试守护）
// ─────────────────────────────────────────────────────────────────────────────

/** runtime.json 落盘文件名（位于 ~/.pandacc/runtime.json） */
export const RUNTIME_FILE_NAME = 'runtime.json'

/** runtime.json schema 版本，未来 schema 升级时用于兼容 fallback */
export const RUNTIME_SCHEMA_VERSION = 1 as const

/** HTTP 鉴权 header 名 — 每个 POST 必须含此 header */
export const SECRET_HEADER = 'X-Panda-Secret'

/** 端口探测起始 + 上限：1455 → 1455 + PORT_PROBE_MAX - 1 */
export const PORT_BASE = 1455
export const PORT_PROBE_MAX = 16

/** 兼容标识 — health 返回该字符串才认为是 panda-on-desk（防误命中其他 1455+ 服务） */
export const APP_IDENTITY = 'panda-on-desk' as const

// ─────────────────────────────────────────────────────────────────────────────
// runtime.json 落盘 schema
// ─────────────────────────────────────────────────────────────────────────────

export interface RuntimeJson {
  version: number
  port: number
  secret: string
  pid: number
  startedAt: number
  appVersion?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// 事件 discriminated union — panda CLI → on-desk
// ─────────────────────────────────────────────────────────────────────────────

export interface PetStateChangeEvent {
  type: 'pet-state'
  state: PetState
  sessionId: string
  ts: number
  forcedUntilMs?: number
}

export interface XPGainedEvent {
  type: 'xp-gained'
  delta: number
  bucket: string
  totalXp: number
  level: number
  ts: number
}

export interface LevelUpEvent {
  type: 'level-up'
  fromLevel: number
  toLevel: number
  unlocks?: {
    states?: PetState[]
    hats?: Hat[]
    eyes?: Eye[]
    rarity?: Rarity
  }
  ts: number
}

export interface MilestoneReachedEvent {
  type: 'milestone'
  milestoneId: string
  ts: number
}

export interface PermissionRequestEvent {
  type: 'permission'
  requestId: string
  toolName: string
  summary: string
  risk: 'low' | 'medium' | 'high' | 'critical'
  ts: number
  ttlMs?: number
}

export interface SessionLifecycleEvent {
  type: 'session'
  phase: 'start' | 'end'
  sessionId: string
  ts: number
}

export interface SceneTriggerEvent {
  type: 'scene'
  scene: 'celebrate' | 'feed' | 'pet' | 'sweep' | 'sleep'
  ttlMs?: number
  ts: number
}

/** 18 物种字符串字面量（与 src/buddy/types.ts SPECIES 同源；types.parity 测试守护） */
export type Species =
  | 'duck' | 'goose' | 'blob' | 'cat' | 'dragon' | 'octopus' | 'owl'
  | 'penguin' | 'turtle' | 'snail' | 'ghost' | 'axolotl' | 'capybara'
  | 'cactus' | 'robot' | 'rabbit' | 'mushroom' | 'chonk'

export interface SpeciesChangeEvent {
  type: 'species'
  species: Species
  sessionId: string
  ts: number
}

export type NotificationKind = 'system' | 'overlay' | 'badge' | 'sound' | 'drag-target'
export type NotificationLevel = 'info' | 'warning' | 'error' | 'success'

export interface NotificationAction {
  id: string
  label: string
  primary?: boolean
  shortcut?: string
}

export interface NotificationEvent {
  type: 'notification'
  kind: NotificationKind
  level: NotificationLevel
  scenarioId: string
  title: string
  body?: string
  ttlMs?: number
  actions?: NotificationAction[]
  badge?: { count?: number; color?: string }
  soundCue?: 'short' | 'critical' | 'gentle'
  petStateOverride?: PetState
  ts: number
}

export interface BadgeEvent {
  type: 'badge'
  scenarioId: string
  delta?: number
  reset?: boolean
  ts: number
}

export interface DragTargetEvent {
  type: 'drag-target'
  enable: boolean
  acceptKinds: string[]
  scenarioId: string
  ts: number
}

export interface DndEvent {
  type: 'dnd'
  enabled: boolean
  reason?: 'manual' | 'schedule' | 'focus-mode'
  endsAt?: number
  ts: number
}

export type OnDeskEvent =
  | PetStateChangeEvent
  | XPGainedEvent
  | LevelUpEvent
  | MilestoneReachedEvent
  | PermissionRequestEvent
  | SessionLifecycleEvent
  | SceneTriggerEvent
  | NotificationEvent
  | BadgeEvent
  | DragTargetEvent
  | DndEvent
  | SpeciesChangeEvent

// ─────────────────────────────────────────────────────────────────────────────
// HTTP 响应 schema
// ─────────────────────────────────────────────────────────────────────────────

export interface EventAck {
  ok: true
  receivedAt: number
}

export interface EventError {
  ok: false
  error: string
}

export interface HealthResponse {
  app: typeof APP_IDENTITY
  version: number
  pid: number
  uptimeMs: number
  appVersion?: string
  electronVersion?: string
  eventsProcessed?: number
  notifications?: number
  errors?: number
  startedAt?: number
}

export interface ReverseStateMsg {
  type: 'state'
  state: PetState
  ts: number
}

export interface ReversePermissionResponse {
  type: 'permission-response'
  requestId: string
  decision: 'approve' | 'deny'
  ts: number
}

export type ReverseMessage = ReverseStateMsg | ReversePermissionResponse
