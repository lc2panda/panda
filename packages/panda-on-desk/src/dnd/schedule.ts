// Input:  ~/.pandacc/dnd-schedule.json（{startHHmm, endHHmm}；缺省 22:00-08:00）
// Output: isInScheduledDnd() — 当前本地时间是否落在静音时段内（跨天支持）
// Pos:    panda-on-desk DND 计划静音；A3 §5 时段静音
//         orchestrator / privacy 过滤可叠加调用
//
// [NEW-FILE:#20260419-P2-17]
// 2026-04-19 +08:00 P2-T5 实装（agent-ε-P2-dnd-retry）

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

const SCHEDULE_FILE_NAME = 'dnd-schedule.json'

export interface DndSchedule {
  /** 静音开始时刻 'HH:mm'（24 小时制） */
  startHHmm: string
  /** 静音结束时刻 'HH:mm'（24 小时制；end < start 视为跨天） */
  endHHmm: string
  /** 是否启用计划静音；缺省 true */
  enabled?: boolean
}

const DEFAULT_SCHEDULE: DndSchedule = {
  startHHmm: '22:00',
  endHHmm: '08:00',
  enabled: true,
}

function getConfigHomeDir(): string {
  const fromEnv = process.env.PANDA_CONFIG_DIR ?? process.env.CLAUDE_CONFIG_DIR
  return (fromEnv ?? join(homedir(), '.pandacc')).normalize('NFC')
}

function getScheduleFilePath(): string {
  return join(getConfigHomeDir(), SCHEDULE_FILE_NAME)
}

// ─────────────────────────────────────────────────────────────────────────────
// 内存缓存（避免每次读盘）
// ─────────────────────────────────────────────────────────────────────────────

let cached: DndSchedule | null = null
let persistenceEnabled = true

function ensureConfigDir(): void {
  const dir = dirname(getScheduleFilePath())
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

/** 解析 'HH:mm' → 当日分钟数；非法格式返回 null */
function parseHHmm(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim())
  if (!m) return null
  const hh = Number(m[1])
  const mm = Number(m[2])
  if (!Number.isInteger(hh) || hh < 0 || hh > 23) return null
  if (!Number.isInteger(mm) || mm < 0 || mm > 59) return null
  return hh * 60 + mm
}

function loadSchedule(): DndSchedule {
  if (cached) return cached
  const path = getScheduleFilePath()
  if (!existsSync(path)) {
    cached = DEFAULT_SCHEDULE
    return cached
  }
  try {
    const raw = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<DndSchedule>
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.startHHmm !== 'string' ||
      typeof parsed.endHHmm !== 'string' ||
      parseHHmm(parsed.startHHmm) === null ||
      parseHHmm(parsed.endHHmm) === null
    ) {
      cached = DEFAULT_SCHEDULE
      return cached
    }
    cached = {
      startHHmm: parsed.startHHmm,
      endHHmm: parsed.endHHmm,
      enabled: parsed.enabled ?? true,
    }
    return cached
  } catch {
    cached = DEFAULT_SCHEDULE
    return cached
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 公开 API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 当前本地时间是否落在计划静音时段内。
 * - 配置 enabled=false → false
 * - end > start → 同日内 [start, end)
 * - end < start → 跨午夜，[start, 24:00) ∪ [0, end)
 * - end == start → 整日（视为常驻静音）
 */
export function isInScheduledDnd(now: Date = new Date()): boolean {
  const schedule = loadSchedule()
  if (schedule.enabled === false) return false
  const startMin = parseHHmm(schedule.startHHmm)
  const endMin = parseHHmm(schedule.endHHmm)
  if (startMin === null || endMin === null) return false
  const nowMin = now.getHours() * 60 + now.getMinutes()
  if (startMin === endMin) return true
  if (endMin > startMin) {
    return nowMin >= startMin && nowMin < endMin
  }
  // 跨天
  return nowMin >= startMin || nowMin < endMin
}

/** 读取当前生效配置（缓存命中则不读盘） */
export function getDndSchedule(): Readonly<DndSchedule> {
  return loadSchedule()
}

/**
 * 写入新计划。校验失败抛错；落盘失败 swallow（内存仍生效）。
 */
export function setDndSchedule(schedule: DndSchedule): void {
  if (parseHHmm(schedule.startHHmm) === null) {
    throw new Error(`invalid startHHmm: ${schedule.startHHmm}`)
  }
  if (parseHHmm(schedule.endHHmm) === null) {
    throw new Error(`invalid endHHmm: ${schedule.endHHmm}`)
  }
  cached = { ...schedule, enabled: schedule.enabled ?? true }
  if (!persistenceEnabled) return
  try {
    ensureConfigDir()
    const path = getScheduleFilePath()
    const tmp = `${path}.tmp`
    writeFileSync(tmp, JSON.stringify(cached, null, 2), { encoding: 'utf-8' })
    renameSync(tmp, path)
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 测试辅助
// ─────────────────────────────────────────────────────────────────────────────

export function __resetScheduleForTesting(): void {
  cached = null
}

export function __setSchedulePersistenceForTesting(enabled: boolean): void {
  persistenceEnabled = enabled
}

export function __setScheduleForTesting(schedule: DndSchedule | null): void {
  cached = schedule
}

export function __getScheduleFilePathForTesting(): string {
  return getScheduleFilePath()
}
