// Input:  XP 桶 + 增量 / 信号事件（addXP / recordMilestone）；feature('BUDDY') gate
// Output: 当前等级 / 解锁的 state/hat / 升级回调 / Effective rarity
// Pos:    src/buddy/CompanionSprite.tsx + petState.ts 等渲染层引用 isStateUnlocked；
//         信号源（usage.ts/cmd hooks/Stop event）调 addXP / recordMilestone；
//         严守 anthropic byte-equal — 仅本地计算与本地存储，无网络
//
// [NEW-FILE:#20260419-OD-01]

import { useSyncExternalStore } from 'react'
import { feature } from 'bun:bundle'

import {
  type CompanionStatsV1,
  type HistoryEvent,
  HISTORY_MAX_LEN,
  loadStats,
  saveStats,
  todayKey,
} from './petStats.js'
import {
  DAILY_XP_CAP,
  EPIC_MILESTONE_XP_THRESHOLD,
  type Eye,
  type Hat,
  HAT_UNLOCK_LEVEL,
  EYE_UNLOCK_LEVEL,
  LEVEL_RARITY_THRESHOLDS,
  MAX_LEVEL,
  MILESTONE_XP,
  type MilestoneId,
  type PetState,
  PETSTATE_UNLOCK_LEVEL,
  type Rarity,
  RARITIES,
  SHINY_EPIC_MILESTONE_COUNT,
  TIME_XP_CAP_MIN,
  type XpBucket,
  XP_RATES,
  totalXpForLevel,
  xpRequiredForLevel,
} from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// 模块级单例状态 — 由 loadStats() 初始化；feature('BUDDY')=false 时仍允许读写
// （save 路径会判定）。所有写入函数走 mutate→save→notify 三步。
// ─────────────────────────────────────────────────────────────────────────────

let cache: CompanionStatsV1 | null = null
const subscribers = new Set<() => void>()
const levelUpHandlers = new Set<(from: number, to: number) => void>()

function ensureLoaded(now: number = Date.now()): CompanionStatsV1 {
  if (cache) return cache
  cache = loadStats(now)
  return cache
}

function notify(): void {
  for (const cb of subscribers) {
    try {
      cb()
    } catch {
      /* swallow — 一个订阅者炸不能拖垮其他人 */
    }
  }
}

function persist(now: number = Date.now()): void {
  if (!cache) return
  cache.lastUpdatedAt = now
  // why feature gate at write: 即使被禁用，读取测试仍可能调用；只在写入时短路
  // 但测试希望可以直接调；改成 try/catch 防 fs 失败也 OK
  if (!feature('BUDDY')) {
    notify()
    return
  }
  try {
    saveStats(cache)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[panda] petXP persist failed: ${msg}`)
  }
  notify()
}

// 测试专用：完全重置内存缓存（不动磁盘）— 让每个用例从干净状态开始
// why exported under __ prefix: 避免被业务代码误用
export function __resetCacheForTesting(seed?: CompanionStatsV1 | null): void {
  cache = seed ?? null
  // 清空订阅者：避免上一用例的 hook 在下一用例触发
  subscribers.clear()
  levelUpHandlers.clear()
}

// ─────────────────────────────────────────────────────────────────────────────
// 等级推导（从 total XP 反推）
// ─────────────────────────────────────────────────────────────────────────────

function levelFromTotal(totalXp: number): number {
  // why 线性扫描：MAX_LEVEL=60 极小，循环 60 次远比维护查找表简单
  let acc = 0
  for (let lv = 1; lv < MAX_LEVEL; lv++) {
    const needed = xpRequiredForLevel(lv)
    if (acc + needed > totalXp) return lv
    acc += needed
  }
  return MAX_LEVEL
}

// 跨天检查：若 lastSeenDay !== today → reset today, overflow 50% 返还
function applyDailyRollover(s: CompanionStatsV1, now: number): void {
  const today = todayKey(now)
  if (s.streak.lastSeenDay === today) return

  // 50% overflow 返还到 today（A2 §1 决策：超出累 overflow，次日返还 50%）
  const refund = Math.floor(s.xp.overflow * 0.5)
  s.xp.today = refund
  s.xp.overflow = 0
  s.xp.todayResetAt = now
  // streak 推进（跨"恰好一天"= +1；跨多天 = 重置 1）
  const lastDay = s.streak.lastSeenDay
  if (lastDay && isConsecutiveDay(lastDay, today)) {
    s.streak.current += 1
  } else {
    s.streak.current = 1
  }
  s.streak.lastSeenDay = today

  // streak.daily XP 自动加（+50 × min(streak, 7)）
  const streakXp = XP_RATES['streak.daily'] * Math.min(s.streak.current, 7)
  if (streakXp > 0) {
    s.xp.total += streakXp
    s.xp.byBucket['streak.daily'] += streakXp
    pushHistory(s, {
      ts: now,
      event: 'streak_bonus',
      xp: streakXp,
      to: s.streak.current,
    })
  }
}

function isConsecutiveDay(prev: string, today: string): boolean {
  const [py, pm, pd] = prev.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  if (
    py === undefined ||
    pm === undefined ||
    pd === undefined ||
    ty === undefined ||
    tm === undefined ||
    td === undefined
  ) {
    return false
  }
  const prevMs = Date.UTC(py, pm - 1, pd)
  const todayMs = Date.UTC(ty, tm - 1, td)
  return todayMs - prevMs === 86_400_000
}

function pushHistory(s: CompanionStatsV1, ev: HistoryEvent): void {
  s.history.push(ev)
  // 环形缓冲：仅保留最近 HISTORY_MAX_LEN 条
  if (s.history.length > HISTORY_MAX_LEN) {
    s.history.splice(0, s.history.length - HISTORY_MAX_LEN)
  }
}

// 解锁列表自动同步（升级时调用）
function refreshUnlocks(s: CompanionStatsV1): void {
  const lv = s.level
  const states: PetState[] = []
  for (const [state, threshold] of Object.entries(PETSTATE_UNLOCK_LEVEL)) {
    if (lv >= threshold) states.push(state as PetState)
  }
  s.unlocks.states = states

  const hats: Hat[] = []
  for (const [hat, threshold] of Object.entries(HAT_UNLOCK_LEVEL)) {
    if (lv >= threshold) hats.push(hat as Hat)
  }
  s.unlocks.hats = hats

  const eyes: Eye[] = []
  for (const [eye, threshold] of Object.entries(EYE_UNLOCK_LEVEL)) {
    if (lv >= threshold) eyes.push(eye as Eye)
  }
  s.unlocks.eyes = eyes
}

// 升级到 newLevel 时触发的副作用：history + 自动里程碑（lv_10/25/50）
function applyLevelUp(s: CompanionStatsV1, fromLevel: number, toLevel: number, now: number): void {
  pushHistory(s, { ts: now, event: 'level_up', from: fromLevel, to: toLevel })
  refreshUnlocks(s)
  // 自动里程碑：只有跨过阈值时记录（recordMilestoneInternal 已含幂等）
  if (fromLevel < 10 && toLevel >= 10) recordMilestoneInternal(s, 'lv_10', now)
  if (fromLevel < 25 && toLevel >= 25) recordMilestoneInternal(s, 'lv_25', now)
  if (fromLevel < 50 && toLevel >= 50) recordMilestoneInternal(s, 'lv_50', now)

  for (const handler of levelUpHandlers) {
    try {
      handler(fromLevel, toLevel)
    } catch {
      /* swallow */
    }
  }
}

// 内部里程碑记录（不触发 persist；调用方负责 persist）
// 返回 true = 首次解锁；false = 已记录过
function recordMilestoneInternal(
  s: CompanionStatsV1,
  id: MilestoneId,
  now: number,
): boolean {
  if (s.milestones[id]) return false
  s.milestones[id] = now
  const xp = MILESTONE_XP[id] ?? 0
  if (xp > 0) {
    s.xp.total += xp
    s.xp.byBucket['milestone'] += xp
  }
  pushHistory(s, { ts: now, event: 'milestone', id, xp })
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// 公开 API · 写入
// ─────────────────────────────────────────────────────────────────────────────

export type AddXpResult = {
  xpAdded: number
  newLevel: number
  leveledUp: boolean
}

/**
 * 增加 XP — 应用 bucket 单价、time 桶 480min 封顶、日 XP 2000 封顶（超出累 overflow）
 *
 * @param bucket 来源桶
 * @param rawAmount 原始数量（time=分钟数；tokens.*=token 数；cmd/turn/etc=次数）
 * @returns 实际入账 XP / 新等级 / 是否升级
 */
export function addXP(
  bucket: XpBucket,
  rawAmount: number,
  now: number = Date.now(),
): AddXpResult {
  if (rawAmount <= 0 || !Number.isFinite(rawAmount)) {
    return { xpAdded: 0, newLevel: getCurrentLevel(now), leveledUp: false }
  }
  const s = ensureLoaded(now)
  applyDailyRollover(s, now)

  // time 桶单独 480min/day 封顶（额外限制，叠加在 DAILY_XP_CAP 之前）
  let amount = rawAmount
  if (bucket === 'time') {
    // 计算今天已计入 time 桶的"分钟数"（XP / 单价反推）
    const minutesToday = (s.xp.byBucket.time ?? 0) / XP_RATES.time
    const remaining = Math.max(0, TIME_XP_CAP_MIN - minutesToday)
    amount = Math.min(amount, remaining)
    if (amount <= 0) {
      return { xpAdded: 0, newLevel: s.level, leveledUp: false }
    }
  }

  let rawXp: number
  if (bucket === 'tokens.in' || bucket === 'tokens.out' || bucket === 'tokens.cache') {
    // tokens 桶：按 1k token 计单价
    rawXp = (amount / 1000) * XP_RATES[bucket]
  } else {
    rawXp = amount * XP_RATES[bucket]
  }
  rawXp = Math.floor(rawXp)
  if (rawXp <= 0) {
    return { xpAdded: 0, newLevel: s.level, leveledUp: false }
  }

  // 日封顶 DAILY_XP_CAP（time 桶不算入 today 限制 — 8h 已是绝对上限不需重复）
  // why exclude time: 否则中度玩家 8h on + 任何打字都会触发 cap
  let xpAdded = rawXp
  if (bucket !== 'time') {
    const remainingToday = Math.max(0, DAILY_XP_CAP - s.xp.today)
    if (rawXp > remainingToday) {
      const overflow = rawXp - remainingToday
      xpAdded = remainingToday
      s.xp.overflow += overflow
    }
    s.xp.today += xpAdded
  }

  s.xp.total += xpAdded
  s.xp.byBucket[bucket] = (s.xp.byBucket[bucket] ?? 0) + xpAdded

  // 升级检查
  const fromLevel = s.level
  const toLevel = levelFromTotal(s.xp.total)
  const leveledUp = toLevel > fromLevel
  if (leveledUp) {
    s.level = toLevel
    applyLevelUp(s, fromLevel, toLevel, now)
  }

  persist(now)
  return { xpAdded, newLevel: s.level, leveledUp }
}

export function recordMilestone(
  id: MilestoneId,
  now: number = Date.now(),
): { unlocked: boolean } {
  const s = ensureLoaded(now)
  applyDailyRollover(s, now)
  const unlocked = recordMilestoneInternal(s, id, now)
  if (!unlocked) return { unlocked: false }

  // 里程碑可能携带 XP → 重新计算等级
  const fromLevel = s.level
  const toLevel = levelFromTotal(s.xp.total)
  if (toLevel > fromLevel) {
    s.level = toLevel
    applyLevelUp(s, fromLevel, toLevel, now)
  }
  persist(now)
  return { unlocked: true }
}

// 订阅升级事件（UI 显示动画）
export function subscribeLevelUp(
  handler: (from: number, to: number) => void,
): () => void {
  levelUpHandlers.add(handler)
  return () => {
    levelUpHandlers.delete(handler)
  }
}

// 订阅整体状态变更（usePetProgression 内部）
export function subscribeStats(cb: () => void): () => void {
  subscribers.add(cb)
  return () => {
    subscribers.delete(cb)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 公开 API · 读取
// ─────────────────────────────────────────────────────────────────────────────

export function getCurrentLevel(now: number = Date.now()): number {
  return ensureLoaded(now).level
}

export function getCurrentXP(now: number = Date.now()): {
  total: number
  today: number
  toNextLevel: number
  pctToNext: number
} {
  const s = ensureLoaded(now)
  if (s.level >= MAX_LEVEL) {
    return { total: s.xp.total, today: s.xp.today, toNextLevel: 0, pctToNext: 100 }
  }
  const baseAtCurrentLv = totalXpForLevel(s.level)
  const required = xpRequiredForLevel(s.level)
  const into = s.xp.total - baseAtCurrentLv
  const toNext = Math.max(0, required - into)
  const pct = required > 0 ? Math.min(100, Math.floor((into / required) * 100)) : 0
  return {
    total: s.xp.total,
    today: s.xp.today,
    toNextLevel: toNext,
    pctToNext: pct,
  }
}

// effective rarity = max(bones / level / shiny)
// bones 由调用方传入（getCompanion 已知）
export function getEffectiveRarity(
  bonesRarity: Rarity,
  now: number = Date.now(),
): Rarity {
  const s = ensureLoaded(now)
  // 等级阈值
  let levelRarity: Rarity = 'common'
  for (const t of LEVEL_RARITY_THRESHOLDS) {
    if (s.level >= t.level) levelRarity = t.rarity
  }
  // shiny 通道：≥3 epic milestone → 强制 legendary
  const shiny = getShinyEarnedFrom(s)
  const channels: Rarity[] = [bonesRarity, levelRarity]
  if (shiny) channels.push('legendary')

  let best: Rarity = 'common'
  let bestIdx = -1
  for (const r of channels) {
    const idx = RARITIES.indexOf(r)
    if (idx > bestIdx) {
      bestIdx = idx
      best = r
    }
  }
  return best
}

function getShinyEarnedFrom(s: CompanionStatsV1): boolean {
  let count = 0
  for (const id of Object.keys(s.milestones) as MilestoneId[]) {
    const xp = MILESTONE_XP[id] ?? 0
    if (xp >= EPIC_MILESTONE_XP_THRESHOLD) count++
  }
  return count >= SHINY_EPIC_MILESTONE_COUNT
}

export function getShinyEarned(now: number = Date.now()): boolean {
  return getShinyEarnedFrom(ensureLoaded(now))
}

export function isStateUnlocked(state: PetState, now: number = Date.now()): boolean {
  const s = ensureLoaded(now)
  return s.unlocks.states.includes(state)
}

export function isHatUnlocked(hat: Hat, now: number = Date.now()): boolean {
  const s = ensureLoaded(now)
  return s.unlocks.hats.includes(hat)
}

export function getUnlockedStates(now: number = Date.now()): PetState[] {
  return [...ensureLoaded(now).unlocks.states]
}

export function getCompletedMilestones(now: number = Date.now()): MilestoneId[] {
  return Object.keys(ensureLoaded(now).milestones) as MilestoneId[]
}

// why exported: petXPSignals.ts::recordStreakStartupSignal 需要读取 lastSeenDay 判定跨日
// 不能直接 loadStats（绕过模块缓存导致测试 seedFresh 失效）
export function getStreakLastSeenDay(now: number = Date.now()): string {
  return ensureLoaded(now).streak.lastSeenDay
}

// ─────────────────────────────────────────────────────────────────────────────
// React hook（供 CompanionSprite/MiniPet/buddy 命令订阅）
// useSyncExternalStore：状态在模块单例 cache 中，自然适合 external store 模式
// ─────────────────────────────────────────────────────────────────────────────

type ProgressionView = {
  level: number
  xp: ReturnType<typeof getCurrentXP>
  rarity: Rarity
  shiny: boolean
}

// why memoize: useSyncExternalStore 要求 getSnapshot 引用稳定时返回相同值
// 否则 React 误判变更触发无限渲染；用 lastSnapshot 缓存对比 level 等关键字段
let lastSnapshot: ProgressionView | null = null
function getSnapshot(bonesRarity: Rarity): ProgressionView {
  const level = getCurrentLevel()
  const xp = getCurrentXP()
  const rarity = getEffectiveRarity(bonesRarity)
  const shiny = getShinyEarned()
  if (
    lastSnapshot &&
    lastSnapshot.level === level &&
    lastSnapshot.xp.total === xp.total &&
    lastSnapshot.xp.today === xp.today &&
    lastSnapshot.rarity === rarity &&
    lastSnapshot.shiny === shiny
  ) {
    return lastSnapshot
  }
  lastSnapshot = { level, xp, rarity, shiny }
  return lastSnapshot
}

/**
 * 订阅养成系统状态 — bonesRarity 由调用方传入（getCompanion().rarity）。
 *
 * why feature gate inline: feature() 必须直接出现在 if 分支中（bun:bundle 限制）
 */
export function usePetProgression(bonesRarity: Rarity): ProgressionView {
  // useSyncExternalStore 在 SSR 也安全；纯本地状态无需 server snapshot
  const snapshot = useSyncExternalStore(
    subscribeStats,
    () => getSnapshot(bonesRarity),
    () => getSnapshot(bonesRarity),
  )
  // why feature gate: 关闭 BUDDY 时返回静态 default（不影响业务流）
  if (!feature('BUDDY')) {
    return {
      level: 1,
      xp: { total: 0, today: 0, toNextLevel: 80, pctToNext: 0 },
      rarity: bonesRarity,
      shiny: false,
    }
  }
  return snapshot
}
