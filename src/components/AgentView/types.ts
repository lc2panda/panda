// Input: roster.json 行 + ~/.pandacc/sessions/<pid>.json + transcript 头尾
// Output: TypeScript types AgentView 全组件共用
// Pos: src/components/AgentView/ —— Tier 1 dashboard 类型唯一来源

/**
 * Status 来源：
 *  - working / idle / waiting 来自 `~/.pandacc/sessions/<pid>.json.status`
 *  - completed / failed / stopped 来自 transcript 末尾或 roster.lastStatus
 *  - 未启动的 roster 项（只在 jobs/roster.json 里）= 'stopped'
 */
export type SessionStatus =
  | 'working'
  | 'idle'
  | 'waiting' // = "Needs input"
  | 'completed'
  | 'failed'
  | 'stopped'

/**
 * Tier 1 状态形状（活/退出/loop 睡眠）。Tier 3 才接入 /loop。
 */
export type SessionShape = 'alive' | 'exited' | 'looping'

/**
 * 组合视图条目：合并 PID 文件 + roster 元数据 + transcript 头尾。
 */
export type SessionEntry = {
  /** 内部 ID = roster entry id 或 PID 字符串。永不为空。 */
  id: string
  /** 显示名（roster.name 或 sessionId 前 8 字符）。 */
  displayName: string
  /** 真实 sessionId（用于 --resume）。Roster-only 条目可能为 null。 */
  sessionId: string | null
  /** PID（live 时存在）。 */
  pid: number | null
  /** 当前状态。 */
  status: SessionStatus
  /** 形状。 */
  shape: SessionShape
  /** 工作目录（绝对路径）。 */
  cwd: string
  /** 启动时间戳（ms）。 */
  startedAt: number
  /** 最近一条用户/助手消息节选（≤120 字符）。 */
  lastMessage: string
  /** 是否 pinned。 */
  pinned: boolean
  /** Tier 3 用：PR 状态点（保留字段，Tier 1 始终为 null）。 */
  prStatus: 'open' | 'merged' | 'closed' | null
  /** waitingFor 文案（仅 status='waiting' 时有值）。 */
  waitingFor?: string
  /** roster.json 里登记的额外笔记。 */
  notes?: string
}

/**
 * roster.json 单条记录 schema。
 */
export type RosterEntry = {
  id: string
  /** 用户给的友好名。可重命名。 */
  name: string
  /** 关联的真实 sessionId（用于 resume 定位 transcript）。 */
  sessionId: string | null
  /** 历史 cwd（即使 session 已停也用得上）。 */
  cwd: string
  /** 是否 pinned。 */
  pinned: boolean
  /** 创建时间 ms。 */
  createdAt: number
  /** 最后看到时间 ms。 */
  lastSeenAt: number
  /** 上次结束状态（仅当 session 真的退出过）。 */
  lastStatus?: SessionStatus
  /** 用户笔记。 */
  notes?: string
}

/**
 * 全 roster 文件内容。
 */
export type RosterFile = {
  version: 1
  entries: RosterEntry[]
}

/**
 * Tier 1 分组方式。
 */
export type GroupMode = 'status' | 'cwd'

/**
 * Dashboard 总状态机。
 */
export type DashboardState = {
  /** 全部条目（已排序）。 */
  entries: SessionEntry[]
  /** 当前光标行（0-based）。 */
  cursor: number
  /** 分组方式。 */
  groupMode: GroupMode
  /** Peek panel 开关。 */
  peekOpen: boolean
  /** Rename 输入模式。 */
  renameMode: boolean
  /** Rename 当前输入值。 */
  renameDraft: string
  /** Stop 双击确认 pending 的 entry id。 */
  pendingStopId: string | null
  /** 状态最近刷新错误（如果有）。 */
  lastError: string | null
}
