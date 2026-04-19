// Input:  panda CLI 内部事件（PetState 变化 / XP 增量 / 升级 / 权限请求 / 会话生命周期 /
//         P2-T1 新增：notification / badge / drag-target / dnd 4 类）
// Output: 跨进程 IPC 协议字段 — panda CLI ↔ panda-on-desk 共用 schema
// Pos:    src/desk/bridge.ts 与 packages/panda-on-desk/src/bridge/types.ts 同源
//         严守 anthropic byte-equal — 无 anthropic 通道引用
//
// [NEW-FILE:#20260419-P1-06]
// 2026-04-19 +08:00 P2-T1 扩展：4 新事件 + NotificationKind/Level 枚举（agent-α-P2-protocol）

// 注意：故意不 `import type from '../buddy/types.js'` —
// buddy/types.ts 通过 `import('../utils/theme.js').Theme` 触发整条根 src 编译链，
// 会让 panda-on-desk 子包 tsc 拉进 100+ 不相关文件。
// PetState 12 态 / Hat 8 / Eye 6 / Rarity 5 在 v2.21.30 后已稳定，重声明 string union
// 比拖编译图代价低；CI 侧用 src/desk/types.parity.test.ts 守护两侧字面量一致（待 P1-T6+）。

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
// 协议常量 — runtime.json schema / HTTP header / 端口范围
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
  /** schema 版本，对应 RUNTIME_SCHEMA_VERSION */
  version: number
  /** 实际监听端口（1455 起按 +1 探测） */
  port: number
  /** 32 字节 hex shared secret（panda CLI 必须带在 X-Panda-Secret header） */
  secret: string
  /** panda-on-desk 进程 PID（用于死进程清理） */
  pid: number
  /** 写入时刻 epoch ms */
  startedAt: number
  /** panda-on-desk 包版本（可选） */
  appVersion?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// 事件 discriminated union — panda CLI → on-desk
// ─────────────────────────────────────────────────────────────────────────────

/** PetState 变化推送 */
export interface PetStateChangeEvent {
  type: 'pet-state'
  state: PetState
  /** panda CLI session id（多终端时 desk 取最高优先级聚合） */
  sessionId: string
  /** 触发时刻 epoch ms */
  ts: number
  /** 可选 — 当前 forced state TTL（D4 P5-T1 联动） */
  forcedUntilMs?: number
}

/** XP 增量推送（A2 宠物养成） */
export interface XPGainedEvent {
  type: 'xp-gained'
  /** 增量值（可正可零，不应负） */
  delta: number
  /** XP 桶来源（time/inputTokens/outputTokens/cmdBasic 等 11 桶之一） */
  bucket: string
  /** 累计 XP 之后的总量（desk 侧不需自己重算） */
  totalXp: number
  /** 当前等级 */
  level: number
  ts: number
}

/** 升级事件 — 一次性 */
export interface LevelUpEvent {
  type: 'level-up'
  fromLevel: number
  toLevel: number
  /** 升级解锁的内容摘要 */
  unlocks?: {
    states?: PetState[]
    hats?: Hat[]
    eyes?: Eye[]
    rarity?: Rarity
  }
  ts: number
}

/** 里程碑达成 */
export interface MilestoneReachedEvent {
  type: 'milestone'
  milestoneId: string
  ts: number
}

/** 权限请求气泡（panda CLI 弹出审批 → desk 显示气泡） */
export interface PermissionRequestEvent {
  type: 'permission'
  /** 唯一请求 id（用于响应回执 reverse 通道） */
  requestId: string
  toolName: string
  /** 简短人类可读摘要（不超 200 字符；实际参数 desk 不需要） */
  summary: string
  /** 风险等级：low/medium/high/critical */
  risk: 'low' | 'medium' | 'high' | 'critical'
  ts: number
  /** TTL ms — 超时未响应自动忽略 */
  ttlMs?: number
}

/** 会话生命周期 — start/end，desk 用于 stale session 清理 */
export interface SessionLifecycleEvent {
  type: 'session'
  phase: 'start' | 'end'
  sessionId: string
  ts: number
}

/** 场景触发（A3 超级助手）— 触发 desk 端动画 */
export interface SceneTriggerEvent {
  type: 'scene'
  scene: 'celebrate' | 'feed' | 'pet' | 'sweep' | 'sleep'
  ttlMs?: number
  ts: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 P2-T1 — TOP 10 超级助手联动 4 新事件类型
// 决策：单一 NotificationKind / 复合呈现用多个 event 串联（避免单 event 多通道
// 状态机复杂度）；BadgeEvent / DragTargetEvent / DndEvent 各自独立。
// ─────────────────────────────────────────────────────────────────────────────

/** 通知呈现形式 — A3 §2 表中 A/B/F/E/D 五类 */
export type NotificationKind = 'system' | 'overlay' | 'badge' | 'sound' | 'drag-target'

/** 通知严重等级 — 影响默认 ttlMs / 颜色 / DND 行为 */
export type NotificationLevel = 'info' | 'warning' | 'error' | 'success'

/** overlay 浮卡可携带的快捷动作按钮（最多 3 个） */
export interface NotificationAction {
  /** 动作 id（点回执 reverse 通道带回此 id） */
  id: string
  /** 按钮文字（已 i18n） */
  label: string
  /** 主按钮高亮（最多 1 个） */
  primary?: boolean
  /** 全局快捷键提示文本（如 "Ctrl+Shift+Y"），不在此处注册 */
  shortcut?: string
}

/**
 * 通知事件 — A3 TOP 10 场景统一出口
 * 单 event 单 kind；同时弹横幅 + overlay + badge 时 → 业务方串发 3 个 event。
 */
export interface NotificationEvent {
  type: 'notification'
  kind: NotificationKind
  level: NotificationLevel
  /** 场景 id — 见 panda-on-desk/src/scene/registry.ts SCENE_REGISTRY 键 */
  scenarioId: string
  /** 横幅标题 / overlay 卡片标题 */
  title: string
  /** overlay 详情正文（kind=overlay 必填） */
  body?: string
  /** overlay 自动消失时间（默认 5000；error 级 10000；critical 持久） */
  ttlMs?: number
  /** overlay 按钮 — 最多 3 个 */
  actions?: NotificationAction[]
  /** kind=badge 时叠加的角标信息 */
  badge?: { count?: number; color?: string }
  /** kind=sound 时的音效线索 */
  soundCue?: 'short' | 'critical' | 'gentle'
  /** 触发 PetState 切换（与 PetStateChangeEvent 解耦：业务侧也可单独发） */
  petStateOverride?: PetState
  ts: number
}

/** 状态栏角标累加 / 清零 — A3 §3 #5 / #6 / #7 等场景 */
export interface BadgeEvent {
  type: 'badge'
  scenarioId: string
  /** 增量；正负均可，默认 +1 */
  delta?: number
  /** true = 清零；与 delta 互斥（同时给则以 reset 优先） */
  reset?: boolean
  ts: number
}

/** 拖拽接收开关 — A3 §3 #6 file-organizer / screenshot-snippet */
export interface DragTargetEvent {
  type: 'drag-target'
  /** true = 进入接收模式；false = 退出 */
  enable: boolean
  /** 接受的 dnd 类别（'file'/'text'/'image'）；enable=false 时可空数组 */
  acceptKinds: string[]
  scenarioId: string
  ts: number
}

/** Do Not Disturb 全局开关 — A3 §5 DND/Focus 模式 */
export interface DndEvent {
  type: 'dnd'
  enabled: boolean
  /** 触发原因 — 'manual' 用户手动 / 'schedule' 时段触发 / 'focus-mode' 专注模式 */
  reason?: 'manual' | 'schedule' | 'focus-mode'
  /** 自动恢复时刻 epoch ms；不传则常驻直到再次手动关闭 */
  endsAt?: number
  ts: number
}

/** 完整事件联合体 — discriminated by `type` */
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

// ─────────────────────────────────────────────────────────────────────────────
// HTTP 响应 schema
// ─────────────────────────────────────────────────────────────────────────────

/** /event POST 响应 */
export interface EventAck {
  ok: true
  receivedAt: number
}

/** /event POST 错误响应 */
export interface EventError {
  ok: false
  error: string
}

/** /health GET 响应 */
export interface HealthResponse {
  app: typeof APP_IDENTITY
  version: number
  pid: number
  uptimeMs: number
}

/** SSE state 推送消息（desk → panda CLI） */
export interface ReverseStateMsg {
  type: 'state'
  state: PetState
  ts: number
}

/** SSE 权限响应（用户在 desk 上点了允许/拒绝） */
export interface ReversePermissionResponse {
  type: 'permission-response'
  requestId: string
  decision: 'approve' | 'deny'
  ts: number
}

/** desk → panda CLI 反向消息联合体 */
export type ReverseMessage = ReverseStateMsg | ReversePermissionResponse
