// Input:  panda CLI 内部信号（PetState / XP / 升级 / 权限请求 / scene / session
//         + P2-T1 helpers: notification / badge / drag-target / dnd）
// Output: HTTP POST → http://127.0.0.1:<port>/event（端口/secret 从 ~/.pandacc/runtime.json 读）
// Pos:    panda CLI → panda-on-desk 单向桥（SSE 反向订阅可选）；
//         feature('BUDDY') + companionOnDesk gate；on-desk 离线时静默忽略
//         严守 anthropic byte-equal — 仅 node 内置 http/fs，无 anthropic 通道
//
// [NEW-FILE:#20260419-P1-05]
// 2026-04-19 +08:00 P2-T1 扩展：6 helpers (push/bumpBadge/resetBadge/enableDrag/disableDrag/setDnd)
// 2026-04-19 +08:00 W1-T4 扩展：pushPetStateChange + throttle 500ms（实测端到端 IPC）
// 2026-04-19 +08:00 W2-T2 扩展：pushLevelUp / pushXpUpdate / pushLevelChange — 升级烟花动画 IPC

import { feature } from 'bun:bundle'
import { existsSync, readFileSync } from 'node:fs'
import { request as httpRequest, type IncomingMessage } from 'node:http'
import { join } from 'node:path'

import { getClaudeConfigHomeDir } from '../utils/envUtils.js'
import {
  APP_IDENTITY,
  type BadgeEvent,
  type DndEvent,
  type DragTargetEvent,
  type LevelUpEvent,
  type NotificationEvent,
  type OnDeskEvent,
  type PermissionRequestEvent,
  type PetState,
  type PetStateChangeEvent,
  type ReverseMessage,
  type RuntimeJson,
  RUNTIME_FILE_NAME,
  SECRET_HEADER,
  type Species,
  type SpeciesChangeEvent,
  type XPGainedEvent,
} from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// runtime.json 读取（缓存 + invalidate）
// ─────────────────────────────────────────────────────────────────────────────

interface CachedRuntime {
  loadedAt: number
  data: RuntimeJson | null
  /** 用于 cache invalidation 的文件 mtime */
  mtimeMs: number
}

let runtimeCache: CachedRuntime | null = null

/** 缓存 TTL — 1 秒；on-desk 重启时端口可能变 */
const RUNTIME_CACHE_TTL_MS = 1_000

export function __resetRuntimeCacheForTesting(): void {
  runtimeCache = null
}

function getRuntimePath(): string {
  return join(getClaudeConfigHomeDir(), RUNTIME_FILE_NAME)
}

function readRuntime(): RuntimeJson | null {
  const path = getRuntimePath()
  if (!existsSync(path)) return null
  try {
    const raw = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<RuntimeJson>
    if (
      typeof parsed.port !== 'number' ||
      typeof parsed.secret !== 'string' ||
      parsed.secret.length === 0 ||
      typeof parsed.pid !== 'number'
    ) {
      return null
    }
    // why: clamp port to non-privileged range so a corrupt file can't redirect to 80/443
    if (parsed.port < 1024 || parsed.port > 65_535) return null
    return {
      version: parsed.version ?? 1,
      port: parsed.port,
      secret: parsed.secret,
      pid: parsed.pid,
      startedAt: parsed.startedAt ?? 0,
      appVersion: parsed.appVersion,
    }
  } catch {
    return null
  }
}

function getRuntime(): RuntimeJson | null {
  const now = Date.now()
  if (runtimeCache && now - runtimeCache.loadedAt < RUNTIME_CACHE_TTL_MS) {
    return runtimeCache.data
  }
  const data = readRuntime()
  runtimeCache = { loadedAt: now, data, mtimeMs: now }
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// feature gate — feature('BUDDY') + globalConfig.companionOnDesk
// ─────────────────────────────────────────────────────────────────────────────

/** lazy import 避免 bridge.ts 进入 config 模块 require 链初始化时序问题 */
function readCompanionOnDeskFlag(): boolean {
  try {
    // why: dynamic require 不绕开 type system，但避免 CLI 冷启动 import 链
    // companionOnDesk 字段尚未声明在 GlobalConfig，按 (any) 读取 + 默认 true
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cfg = require('../utils/config.js') as {
      getGlobalConfig?: () => Record<string, unknown> & { companionOnDesk?: boolean }
    }
    if (typeof cfg.getGlobalConfig !== 'function') return true
    const v = cfg.getGlobalConfig().companionOnDesk
    if (v === false) return false
    return true
  } catch {
    return true
  }
}

export function isOnDeskEnabled(): boolean {
  if (!feature('BUDDY')) return false
  return readCompanionOnDeskFlag()
}

// ─────────────────────────────────────────────────────────────────────────────
// 内部：HTTP 请求（fire-and-forget；失败静默吞）
// ─────────────────────────────────────────────────────────────────────────────

interface PostResult {
  ok: boolean
  status?: number
  /** 仅诊断/测试用 — 生产路径不暴露 */
  error?: string
}

/** 默认请求超时（ms） — on-desk 卡死时不阻塞 panda CLI 主路径 */
const DEFAULT_REQUEST_TIMEOUT_MS = 1_500

function postToOnDesk(
  pathname: string,
  body: unknown,
  opts: { timeoutMs?: number } = {},
): Promise<PostResult> {
  return new Promise(resolve => {
    const runtime = getRuntime()
    if (!runtime) {
      resolve({ ok: false, error: 'runtime-not-available' })
      return
    }
    let payload: string
    try {
      payload = JSON.stringify(body)
    } catch (err) {
      resolve({
        ok: false,
        error: `serialize-failed:${err instanceof Error ? err.message : String(err)}`,
      })
      return
    }
    const req = httpRequest(
      {
        host: '127.0.0.1',
        port: runtime.port,
        path: pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload).toString(),
          [SECRET_HEADER]: runtime.secret,
        },
        timeout: opts.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
      },
      (res: IncomingMessage) => {
        // drain to free socket
        res.resume()
        const status = res.statusCode ?? 0
        if (status === 401 || status === 403) {
          // why: 鉴权失败 → 缓存的 secret 已 stale，强制下次重读 runtime.json
          runtimeCache = null
        }
        resolve({ ok: status >= 200 && status < 300, status })
      },
    )
    req.on('error', err => {
      // ECONNREFUSED / ENOENT → on-desk 未启动；静默
      if ((err as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
        runtimeCache = null
      }
      resolve({ ok: false, error: err.message })
    })
    req.on('timeout', () => {
      req.destroy()
      resolve({ ok: false, error: 'timeout' })
    })
    req.write(payload)
    req.end()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — 1. push 单事件
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 推送单个事件给 panda-on-desk。fire-and-forget，永不抛错。
 *
 * 静默路径：feature 关 / config 关 / runtime.json 不存在 / on-desk 离线 / 鉴权失败。
 *
 * @returns Promise<boolean> — 仅供测试观测 ack；调用方无需 await
 */
export async function pushEventToOnDesk(event: OnDeskEvent): Promise<boolean> {
  if (!isOnDeskEnabled()) return false
  try {
    const r = await postToOnDesk('/event', event)
    return r.ok
  } catch {
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — 2. 权限气泡
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 弹出权限请求气泡到 panda-on-desk。
 *
 * 与 pushEventToOnDesk 等价但语义更清晰；调用方通常不关心 ack。
 */
export async function pushPermissionRequest(
  req: Omit<PermissionRequestEvent, 'type' | 'ts'>,
): Promise<boolean> {
  return pushEventToOnDesk({ type: 'permission', ts: Date.now(), ...req })
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — 2.5 P2-T1 高层 helpers（A3 TOP 10 场景统一调用入口）
// 设计：纯 build* 构造器（易测）+ 薄 helper 包装 fire-and-forget。
// 这样测试可直接断言 buildXxxEvent 字段，不必绕过 feature gate / mock HTTP server。
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 构造 NotificationEvent — 纯函数，便于单测验证字段。
 * why: helper 内部 push 是 fire-and-forget，单测难直接观测；分离 build 后纯函数验证。
 */
export function buildNotificationEvent(
  opts: Omit<NotificationEvent, 'type' | 'ts'>,
): NotificationEvent {
  return { type: 'notification', ts: Date.now(), ...opts }
}

/** 构造 BadgeEvent（delta 模式）— delta 默认 +1，正负均可 */
export function buildBadgeBumpEvent(scenarioId: string, delta = 1): BadgeEvent {
  return { type: 'badge', scenarioId, delta, ts: Date.now() }
}

/** 构造 BadgeEvent（reset 模式）— 清零角标 */
export function buildBadgeResetEvent(scenarioId: string): BadgeEvent {
  return { type: 'badge', scenarioId, reset: true, ts: Date.now() }
}

/** 构造 DragTargetEvent — enable 模式 */
export function buildDragTargetEnableEvent(
  scenarioId: string,
  kinds: string[],
): DragTargetEvent {
  return {
    type: 'drag-target',
    enable: true,
    acceptKinds: kinds,
    scenarioId,
    ts: Date.now(),
  }
}

/** 构造 DragTargetEvent — disable 模式 */
export function buildDragTargetDisableEvent(scenarioId: string): DragTargetEvent {
  return {
    type: 'drag-target',
    enable: false,
    acceptKinds: [],
    scenarioId,
    ts: Date.now(),
  }
}

/** 构造 DndEvent — A3 §5 Focus 模式 / 时段静音 */
export function buildDndEvent(
  enabled: boolean,
  opts: { reason?: DndEvent['reason']; endsAt?: number } = {},
): DndEvent {
  return {
    type: 'dnd',
    enabled,
    reason: opts.reason,
    endsAt: opts.endsAt,
    ts: Date.now(),
  }
}

/**
 * 推送通知事件 — A/B/F/E/D 五类呈现统一入口。
 *
 * 业务方按 A3 §3 TOP 10 表选 kind；同时弹横幅 + overlay + badge 时串发 3 次。
 * why: helper 屏蔽 type+ts 字段，让调用点无需感知 OnDeskEvent union。
 */
export function pushNotification(opts: Omit<NotificationEvent, 'type' | 'ts'>): void {
  void pushEventToOnDesk(buildNotificationEvent(opts))
}

/**
 * 角标累加 — A3 #5/#6/#7 场景"未读 +1"。delta 默认 +1，正负均可。
 */
export function bumpBadge(scenarioId: string, delta = 1): void {
  void pushEventToOnDesk(buildBadgeBumpEvent(scenarioId, delta))
}

/** 角标清零 — overlay 已读 / 用户进入对应面板时调。 */
export function resetBadge(scenarioId: string): void {
  void pushEventToOnDesk(buildBadgeResetEvent(scenarioId))
}

/** 进入拖拽接收模式 — A3 #6 file-organizer / screenshot-snippet。 */
export function enableDragTarget(scenarioId: string, kinds: string[]): void {
  void pushEventToOnDesk(buildDragTargetEnableEvent(scenarioId, kinds))
}

/** 退出拖拽接收模式。 */
export function disableDragTarget(scenarioId: string): void {
  void pushEventToOnDesk(buildDragTargetDisableEvent(scenarioId))
}

/**
 * 切换 DND 全局状态 — A3 §5 Focus 模式 / 时段静音。
 *
 * @param enabled true 开启 DND（累积 badge，抑制 overlay/system）
 * @param opts.reason  'manual' | 'schedule' | 'focus-mode'
 * @param opts.endsAt  自动恢复时刻 epoch ms；不传则常驻
 */
export function setDnd(
  enabled: boolean,
  opts: { reason?: DndEvent['reason']; endsAt?: number } = {},
): void {
  void pushEventToOnDesk(buildDndEvent(enabled, opts))
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — 2.6 W1-T4 PetState change 推送（带 throttle 500ms）
// 决策：throttle 而非 debounce —— state 变化语义是"立刻同步桌面端"，
// 但同 state 在 500ms 窗口内的重复发送应被合并以避免 hook tick 刷屏。
// ─────────────────────────────────────────────────────────────────────────────

/** 构造 PetStateChangeEvent — 纯函数便于单测 */
export function buildPetStateChangeEvent(
  state: PetState,
  sessionId: string,
  forcedUntilMs?: number,
): PetStateChangeEvent {
  return {
    type: 'pet-state',
    state,
    sessionId,
    ts: Date.now(),
    ...(forcedUntilMs !== undefined ? { forcedUntilMs } : {}),
  }
}

/** Throttle 窗口（ms）— hook tick 500ms / 渲染节拍 500ms 同源 */
export const PET_STATE_THROTTLE_MS = 500

interface PetStateThrottleState {
  /** 上一次实发的 state（去重 + 节流判定） */
  lastSentState: PetState | null
  /** 上一次实发时间戳 */
  lastSentAtMs: number
  /** 节流窗口内挂起的最新 state（窗口结束时落地） */
  pendingState: PetState | null
  /** 挂起的 sessionId / forcedUntilMs */
  pendingSessionId: string | null
  pendingForcedUntilMs: number | undefined
  /** 待触发的 setTimeout 句柄 */
  pendingTimer: ReturnType<typeof setTimeout> | null
}

const _petStateThrottle: PetStateThrottleState = {
  lastSentState: null,
  lastSentAtMs: 0,
  pendingState: null,
  pendingSessionId: null,
  pendingForcedUntilMs: undefined,
  pendingTimer: null,
}

export function __resetPetStateThrottleForTesting(): void {
  if (_petStateThrottle.pendingTimer !== null) {
    clearTimeout(_petStateThrottle.pendingTimer)
  }
  _petStateThrottle.lastSentState = null
  _petStateThrottle.lastSentAtMs = 0
  _petStateThrottle.pendingState = null
  _petStateThrottle.pendingSessionId = null
  _petStateThrottle.pendingForcedUntilMs = undefined
  _petStateThrottle.pendingTimer = null
}

/**
 * 内部：纯节流+去重核心（与 feature gate 解耦），便于单元测试。
 *
 * 不直接调用 isOnDeskEnabled —— 上层 pushPetStateChange 负责 gate；
 * 测试可注入自定义 emitter 验证 throttle/dedup 行为，无需 mock feature() 。
 *
 * @param state         当前 PetState
 * @param sessionId     会话 id
 * @param forcedUntilMs 可选 forced TTL
 * @param emit          事件实发回调（测试可断言调用次数 / 顺序）
 * @param nowMs         当前时间戳（默认 Date.now；测试可注入控制时间）
 */
export function __pushPetStateThrottledCore(
  state: PetState,
  sessionId: string,
  forcedUntilMs: number | undefined,
  emit: (event: PetStateChangeEvent) => void,
  nowMs: number = Date.now(),
): void {
  // 去重：与上一次实发 state 完全相同则吞
  if (
    _petStateThrottle.lastSentState === state &&
    _petStateThrottle.lastSentAtMs > 0
  ) {
    return
  }

  const elapsed = nowMs - _petStateThrottle.lastSentAtMs
  if (elapsed >= PET_STATE_THROTTLE_MS || _petStateThrottle.lastSentAtMs === 0) {
    // 立即发送
    _petStateThrottle.lastSentState = state
    _petStateThrottle.lastSentAtMs = nowMs
    emit(buildPetStateChangeEvent(state, sessionId, forcedUntilMs))
    return
  }

  // 节流窗口内：挂起 pending（覆盖之前 pending 取最新）
  _petStateThrottle.pendingState = state
  _petStateThrottle.pendingSessionId = sessionId
  _petStateThrottle.pendingForcedUntilMs = forcedUntilMs
  if (_petStateThrottle.pendingTimer === null) {
    const wait = PET_STATE_THROTTLE_MS - elapsed
    _petStateThrottle.pendingTimer = setTimeout(() => {
      _petStateThrottle.pendingTimer = null
      const ps = _petStateThrottle.pendingState
      const sid = _petStateThrottle.pendingSessionId
      const fmu = _petStateThrottle.pendingForcedUntilMs
      _petStateThrottle.pendingState = null
      _petStateThrottle.pendingSessionId = null
      _petStateThrottle.pendingForcedUntilMs = undefined
      if (ps === null || sid === null) return
      // 二次去重：pending 与 lastSent 相同则不发
      if (_petStateThrottle.lastSentState === ps) return
      _petStateThrottle.lastSentState = ps
      _petStateThrottle.lastSentAtMs = Date.now()
      emit(buildPetStateChangeEvent(ps, sid, fmu))
    }, Math.max(0, wait))
  }
}

/**
 * 推送 PetState 变化给 panda-on-desk —— 节流 500ms 防刷屏。
 *
 * 行为：
 *   1. 同 state 重复推送 → 直接吞（去重）
 *   2. 距上次推送 ≥ 500ms → 立即发送
 *   3. 距上次推送 < 500ms → 挂起 pending；窗口结束时发送最后一次 pending（取最新值）
 *
 * 静默路径：feature 关 / config 关 / runtime.json 不存在 / on-desk 离线 / 鉴权失败。
 *
 * @param state 当前 PetState（12 态之一）
 * @param sessionId panda CLI 会话 id（用于多终端聚合）
 * @param forcedUntilMs 可选，对应 PetStateChangeEvent.forcedUntilMs
 */
export function pushPetStateChange(
  state: PetState,
  sessionId: string,
  forcedUntilMs?: number,
): void {
  // why: feature gate 提前短路；isOnDeskEnabled 已含 feature('BUDDY')
  if (!isOnDeskEnabled()) return
  __pushPetStateThrottledCore(state, sessionId, forcedUntilMs, ev => {
    void pushEventToOnDesk(ev)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — 2.7 W2-T1 物种切换推送（去重；无节流 — 用户主动 /buddy theme 频次低）
// 设计：与 PetStateChangeEvent throttle 同结构，但仅用 dedup（不用 timer pending），
//       避免引入第二个 setInterval 句柄；物种切换属于"主动事件"，应即时落地。
// ─────────────────────────────────────────────────────────────────────────────

/** 18 物种白名单 — 与 src/buddy/types.ts SPECIES 同源（types.ts Species union 守护字面量） */
export const SPECIES_WHITELIST: readonly Species[] = [
  'duck', 'goose', 'blob', 'cat', 'dragon', 'octopus', 'owl',
  'penguin', 'turtle', 'snail', 'ghost', 'axolotl', 'capybara',
  'cactus', 'robot', 'rabbit', 'mushroom', 'chonk',
] as const

/** 构造 SpeciesChangeEvent — 纯函数便于单测 */
export function buildSpeciesChangeEvent(
  species: Species,
  sessionId: string,
): SpeciesChangeEvent {
  return {
    type: 'species',
    species,
    sessionId,
    ts: Date.now(),
  }
}

/** 上一次实发 species（去重） */
let _lastSentSpecies: Species | null = null

export function __resetSpeciesDedupForTesting(): void {
  _lastSentSpecies = null
}

/**
 * 内部：去重核心（与 feature gate 解耦），便于单元测试。
 *
 * @param species 目标物种
 * @param sessionId 会话 id
 * @param emit 实发回调（测试可断言调用次数 / 顺序）
 */
export function __pushSpeciesChangeCore(
  species: Species,
  sessionId: string,
  emit: (event: SpeciesChangeEvent) => void,
): void {
  if (_lastSentSpecies === species) return
  _lastSentSpecies = species
  emit(buildSpeciesChangeEvent(species, sessionId))
}

/**
 * 推送物种切换给 panda-on-desk —— /buddy theme <species> 跑后调用。
 *
 * 行为：
 *   1. 同 species 重复推送 → 直接吞（去重）
 *   2. 物种白名单外 → 直接返回（参数校验）
 *
 * 静默路径：feature 关 / config 关 / runtime.json 不存在 / on-desk 离线 / 鉴权失败。
 *
 * @param species 18 物种之一
 * @param sessionId panda CLI 会话 id（用于多终端聚合）
 */
export function pushSpeciesChange(species: Species, sessionId: string): void {
  // why: 参数校验提前 — 防 string 类型断言溜号注入未知 species
  if (!SPECIES_WHITELIST.includes(species)) return
  if (!isOnDeskEnabled()) return
  __pushSpeciesChangeCore(species, sessionId, ev => {
    void pushEventToOnDesk(ev)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — 2.8 W2-T2 升级动画 / XP 进度推送
// 决策：3 个 helper 都是 fire-and-forget；不做 throttle / dedup —
// pushLevelUp 一次性事件天然不会刷屏；pushXpUpdate 由调用方控周期（默认 30s）。
// ─────────────────────────────────────────────────────────────────────────────

/** 构造 LevelUpEvent — 纯函数便于单测 */
export function buildLevelUpEvent(
  fromLevel: number,
  toLevel: number,
  unlocks?: LevelUpEvent['unlocks'],
): LevelUpEvent {
  return {
    type: 'level-up',
    fromLevel,
    toLevel,
    ts: Date.now(),
    ...(unlocks !== undefined ? { unlocks } : {}),
  }
}

/** 构造 XPGainedEvent — 纯函数便于单测 */
export function buildXpGainedEvent(opts: {
  delta: number
  bucket: string
  totalXp: number
  level: number
  /** 可选：到下一级百分比（0-100），desk 端直接用，不再算 */
  pctToNext?: number
  /** 可选：当前 effective rarity，desk 端 levelup-fx 用其上色 */
  rarity?: string
}): XPGainedEvent {
  // why: pctToNext / rarity 走 XPGainedEvent 的扩展字段（desk 端按 (any) 读）；
  // schema 字段保持向后兼容（旧 desk 端忽略未知 key）
  return {
    type: 'xp-gained',
    delta: opts.delta,
    bucket: opts.bucket,
    totalXp: opts.totalXp,
    level: opts.level,
    ts: Date.now(),
    ...(opts.pctToNext !== undefined ? { pctToNext: opts.pctToNext } : {}),
    ...(opts.rarity !== undefined ? { rarity: opts.rarity } : {}),
  } as XPGainedEvent
}

/**
 * 推送等级跳变给 panda-on-desk — 升级烟花动画触发器。
 *
 * 静默路径：feature 关 / config 关 / runtime.json 不存在 / on-desk 离线 / 鉴权失败。
 *
 * @param fromLevel 升级前等级
 * @param toLevel   升级后等级
 * @param unlocks   可选解锁列表（state/hat/eye/rarity 摘要）
 */
export function pushLevelUp(
  fromLevel: number,
  toLevel: number,
  unlocks?: LevelUpEvent['unlocks'],
): void {
  if (!isOnDeskEnabled()) return
  if (!Number.isFinite(fromLevel) || !Number.isFinite(toLevel)) return
  if (toLevel <= fromLevel) return // 防御：非升级不发
  void pushEventToOnDesk(buildLevelUpEvent(fromLevel, toLevel, unlocks))
}

/**
 * 推送 XP 进度更新给 panda-on-desk — desk 端用 pctToNext 直接更新进度条。
 *
 * 调用方负责节流（推荐 30s 周期；详 src/buddy/petXP.ts startXpPeriodicPush）。
 *
 * @param opts.delta     最近一次入账增量（可 0，表示纯进度刷新）
 * @param opts.bucket    XP 桶来源；纯进度刷新可填 'streak.daily' / 'time' 等
 * @param opts.totalXp   累计 XP 总量
 * @param opts.level     当前等级
 * @param opts.pctToNext 到下一级百分比（0-100）
 * @param opts.rarity    当前 effective rarity（'common'..'legendary'）
 */
export function pushXpUpdate(opts: {
  delta: number
  bucket: string
  totalXp: number
  level: number
  pctToNext?: number
  rarity?: string
}): void {
  if (!isOnDeskEnabled()) return
  void pushEventToOnDesk(buildXpGainedEvent(opts))
}

/**
 * 推送等级变更（不含烟花）— 仅刷新 desk 端等级徽章颜色 / 数字。
 *
 * 与 pushLevelUp 的区别：本 helper 用于"加载完成首屏推送当前等级"；
 * pushLevelUp 用于跨阈值跳变（触发烟花动画）。
 *
 * 实现复用 pushXpUpdate（XPGainedEvent 携带 level + rarity 即可让 desk 刷徽章），
 * delta=0 表示纯刷新；bucket 占位 'streak.daily'。
 */
export function pushLevelChange(
  level: number,
  rarity: string,
  totalXp: number = 0,
  pctToNext: number = 0,
): void {
  if (!isOnDeskEnabled()) return
  if (!Number.isFinite(level) || level <= 0) return
  pushXpUpdate({
    delta: 0,
    bucket: 'streak.daily',
    totalXp,
    level,
    pctToNext,
    rarity,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — 3. 在线探测
// ─────────────────────────────────────────────────────────────────────────────

interface SubscribeOptions {
  /** 探测间隔 ms — 默认 5s */
  intervalMs?: number
  /** 仅触发首次 + 每次状态翻转；默认 true */
  onlyOnChange?: boolean
}

/**
 * 订阅 panda-on-desk 是否在线。返回 unsubscribe 函数。
 *
 * 实现：定时 GET /health；on-desk 上线/下线时 callback(true/false)。
 * 若 isOnDeskEnabled() 为 false，立即 callback(false) 并返回 noop。
 */
export function subscribeToOnDesk(
  callback: (online: boolean) => void,
  options: SubscribeOptions = {},
): () => void {
  if (!isOnDeskEnabled()) {
    queueMicrotask(() => callback(false))
    return () => undefined
  }
  const interval = options.intervalMs ?? 5_000
  const onlyOnChange = options.onlyOnChange ?? true
  let stopped = false
  let lastOnline: boolean | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  const tick = async (): Promise<void> => {
    if (stopped) return
    const online = await checkHealth()
    if (!stopped && (!onlyOnChange || lastOnline !== online)) {
      lastOnline = online
      try {
        callback(online)
      } catch {
        // user callback errors must not break subscription
      }
    }
    if (!stopped) {
      timer = setTimeout(tick, interval)
    }
  }

  // 首次立即探测
  void tick()

  return () => {
    stopped = true
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }
}

/** 单次探测 — GET /health；可独立用于 isAvailable() 等场景 */
export function checkHealth(timeoutMs = 1_000): Promise<boolean> {
  return new Promise(resolve => {
    const runtime = getRuntime()
    if (!runtime) {
      resolve(false)
      return
    }
    const req = httpRequest(
      {
        host: '127.0.0.1',
        port: runtime.port,
        path: '/health',
        method: 'GET',
        timeout: timeoutMs,
      },
      (res: IncomingMessage) => {
        if ((res.statusCode ?? 0) !== 200) {
          res.resume()
          resolve(false)
          return
        }
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => {
          try {
            const parsed = JSON.parse(Buffer.concat(chunks).toString('utf-8')) as {
              app?: string
            }
            resolve(parsed.app === APP_IDENTITY)
          } catch {
            resolve(false)
          }
        })
      },
    )
    req.on('error', () => resolve(false))
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
    req.end()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 公共 API — 4. SSE 反向订阅（desk → CLI）
// ─────────────────────────────────────────────────────────────────────────────

interface ReverseSubscription {
  close(): void
}

/**
 * 订阅 desk 端反向推送（state 镜像 / 权限响应等）。
 *
 * 极简 SSE 客户端 — 不引入 EventSource polyfill，仅按 `data: <json>\n\n` 切分。
 * 断线后调用方需自行重连（当前不内置 retry，避免 panda CLI 主路径开销）。
 */
export function subscribeReverseStream(
  onMessage: (msg: ReverseMessage) => void,
): ReverseSubscription {
  if (!isOnDeskEnabled()) {
    return { close: () => undefined }
  }
  const runtime = getRuntime()
  if (!runtime) {
    return { close: () => undefined }
  }
  const req = httpRequest({
    host: '127.0.0.1',
    port: runtime.port,
    path: '/state',
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      [SECRET_HEADER]: runtime.secret,
    },
  })
  let buffer = ''
  let closed = false
  req.on('response', (res: IncomingMessage) => {
    if ((res.statusCode ?? 0) !== 200) {
      res.resume()
      return
    }
    res.setEncoding('utf-8')
    res.on('data', (chunk: string) => {
      buffer += chunk
      let idx = buffer.indexOf('\n\n')
      while (idx !== -1) {
        const frame = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 2)
        const dataLine = frame
          .split('\n')
          .find(line => line.startsWith('data:'))
        if (dataLine) {
          try {
            const msg = JSON.parse(dataLine.slice(5).trim()) as ReverseMessage
            onMessage(msg)
          } catch {
            // skip malformed frame
          }
        }
        idx = buffer.indexOf('\n\n')
      }
    })
  })
  req.on('error', () => {
    // 断线静默；调用方按需重连
  })
  req.end()
  return {
    close: () => {
      if (closed) return
      closed = true
      req.destroy()
    },
  }
}
