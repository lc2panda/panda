// Input:  petXP.ts 写入 / 启动时读取；machineId 来自 os.hostname()+platform()
// Output: ~/.pandacc/companion-stats.json schema v1（含 HMAC sign 防偶然篡改）
// Pos:    petXP.ts 内部状态源；首启时 createDefaultStats()；与 settings.json 同目录但独立文件
//         严守 anthropic byte-equal — 仅本地存储，无网络请求；零外部依赖（仅 node 内置）
//
// [NEW-FILE:#20260419-OD-02]

import {
  createHmac,
  randomBytes,
} from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import { hostname, platform } from 'node:os'
import { join } from 'node:path'

import { getClaudeConfigHomeDir } from '../utils/envUtils.js'
import {
  COMPANION_STATS_SCHEMA_VERSION,
  COMPANION_STATS_SCHEMA_VERSION_NEXT,
  type Eye,
  type Hat,
  type MilestoneId,
  MILESTONES,
  type PetState,
  SEASON_BUCKETS,
  type SeasonBucket,
  type StatName,
  STAT_NAMES,
  type XpBucket,
  XP_BUCKETS,
} from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// Schema v1
// ─────────────────────────────────────────────────────────────────────────────

export type HistoryEvent = {
  ts: number
  event: 'level_up' | 'milestone' | 'rarity_up' | 'created' | 'streak_bonus'
  from?: number | string
  to?: number | string
  xp?: number
  id?: MilestoneId
}

export type CompanionStatsV1 = {
  version: 1
  createdAt: number
  lastUpdatedAt: number
  xp: {
    total: number
    today: number
    todayResetAt: number
    overflow: number
    byBucket: Record<XpBucket, number>
  }
  level: number
  unlocks: {
    states: PetState[]
    hats: Hat[]
    eyes: Eye[]
  }
  stats: Record<StatName, number>
  milestones: Partial<Record<MilestoneId, number>> // ms timestamp
  history: HistoryEvent[]
  streak: {
    current: number
    lastSeenDay: string // YYYY-MM-DD（+08:00 锚点）
  }
  hmac: string // sign of the rest（见 signHMAC）
}

// 历史环形缓冲上限（防止 history 无限增长拖慢 JSON parse）
export const HISTORY_MAX_LEN = 200

// ─────────────────────────────────────────────────────────────────────────────
// Schema v2（前瞻 — reader 兼容，writer 暂未启用）
// W12-T3: v2 在 v1 基础上叠加 `seasons: Record<SeasonBucket, number>` 4 桶 XP
// 设计原则：
//   1) v2 reader 见到 v1 数据 → seasons 缺失，自动补 0（forward migration）
//   2) v1 reader 见到 v2 数据 → 透传未知字段被 stableStringify 全收（HMAC 仍校验通过）
//      但 normalize 路径会丢 seasons —— 故 v1 reader 只读核心字段，v2 字段通过
//      readSeasonsForward(s) 这条独立辅助函数取（向前兼容）
//   3) writer 仍写 v1（version=1, 不含 seasons）—— 保证 byte-equal 与旧二进制兼容
// ─────────────────────────────────────────────────────────────────────────────

export type CompanionStatsV2 = CompanionStatsV1 & {
  version: 2
  seasons: Record<SeasonBucket, number>
}

// reader-only：判断 raw schema 版本（不抛错；未知 → 'unknown'）
export type DetectedSchema = 'v0' | 'v1' | 'v2' | 'unknown'

export function detectSchemaVersion(raw: unknown): DetectedSchema {
  if (!raw || typeof raw !== 'object') return 'unknown'
  const v = (raw as { version?: unknown }).version
  if (v === COMPANION_STATS_SCHEMA_VERSION) return 'v1'
  if (v === COMPANION_STATS_SCHEMA_VERSION_NEXT) return 'v2'
  if (v === undefined || v === null) return 'v0'
  return 'unknown'
}

// 构造空 seasons（4 桶 = 0）
function emptySeasons(): Record<SeasonBucket, number> {
  const s = {} as Record<SeasonBucket, number>
  for (const b of SEASON_BUCKETS) s[b] = 0
  return s
}

// 校正 seasons：缺字段补 0、非数字 → 0、负数 → 0
function normalizeSeasons(input: unknown): Record<SeasonBucket, number> {
  const out = emptySeasons()
  if (!input || typeof input !== 'object') return out
  const r = input as Record<string, unknown>
  for (const b of SEASON_BUCKETS) {
    const v = r[b]
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
      out[b] = v
    }
  }
  return out
}

// 前向兼容 reader：从 v1 / v2 数据中提取 seasons 桶（v1 → 全 0；v2 → 校正读取）
// why 独立辅助：v1 reader 主路径不感知 seasons，避免污染 HMAC stableStringify
//   排序行为；调用方按需取 seasons 时才走这里
export function readSeasonsForward(
  raw: CompanionStatsV1 | CompanionStatsV2 | unknown,
): Record<SeasonBucket, number> {
  if (!raw || typeof raw !== 'object') return emptySeasons()
  const seasons = (raw as { seasons?: unknown }).seasons
  return normalizeSeasons(seasons)
}

// ─────────────────────────────────────────────────────────────────────────────
// HMAC：tier-1 软防护（详 A2 §6）
// secret 由 hostname+platform 拼成 — 不依赖网络、对"偶然手改"足够；
// 失败时不报错，调用方决定是否重置 default。
// ─────────────────────────────────────────────────────────────────────────────

const HMAC_VERSION_TAG = 'panda-pet-v1'

function hmacSecret(): string {
  // why: hostname+platform 是机器身份近似；用户手抄到另一台机也能验证失败
  return `${hostname()}|${platform()}|${HMAC_VERSION_TAG}`
}

// 序列化为稳定字符串（按 key 排序）— 保证同一对象多次序列化结果一致
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const entries = Object.keys(value as Record<string, unknown>)
    .sort()
    .map(
      k =>
        `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`,
    )
  return `{${entries.join(',')}}`
}

export function signHMAC(s: Omit<CompanionStatsV1, 'hmac'>): string {
  // why omit hmac: 自指字段必须排除，否则 verify 永远失败
  const payload = stableStringify(s)
  return createHmac('sha256', hmacSecret()).update(payload).digest('hex')
}

export function verifyHMAC(s: CompanionStatsV1): boolean {
  if (!s || typeof s.hmac !== 'string' || s.hmac.length === 0) return false
  const { hmac, ...rest } = s
  const expected = signHMAC(rest)
  if (expected.length !== hmac.length) return false
  // 常数时间比对（防止极端 timing attack — 此场景实际意义不大但形式正确）
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ hmac.charCodeAt(i)
  }
  return diff === 0
}

// ─────────────────────────────────────────────────────────────────────────────
// 默认值构造 — 首启时调用
// ─────────────────────────────────────────────────────────────────────────────

function todayKey(now: number = Date.now()): string {
  // +08:00 锚点（Asia/Singapore）— 与全局时间真实性校验保持一致
  // why: streak 跨天判断必须固定时区，避免用户跨时区飞行错算
  const d = new Date(now + 8 * 60 * 60 * 1000) // shift to +08:00 wall clock
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function createDefaultStats(now: number = Date.now()): CompanionStatsV1 {
  const byBucket = {} as Record<XpBucket, number>
  for (const b of XP_BUCKETS) byBucket[b] = 0

  const stats = {} as Record<StatName, number>
  for (const n of STAT_NAMES) stats[n] = 0

  const base: Omit<CompanionStatsV1, 'hmac'> = {
    version: COMPANION_STATS_SCHEMA_VERSION,
    createdAt: now,
    lastUpdatedAt: now,
    xp: {
      total: 0,
      today: 0,
      todayResetAt: now,
      overflow: 0,
      byBucket,
    },
    level: 1,
    unlocks: {
      states: ['idle', 'sleeping', 'dozing'],
      hats: ['none'],
      eyes: ['·'],
    },
    stats,
    milestones: {},
    history: [{ ts: now, event: 'created' }],
    streak: { current: 0, lastSeenDay: todayKey(now) },
  }
  return { ...base, hmac: signHMAC(base) }
}

// ─────────────────────────────────────────────────────────────────────────────
// Migration — v0 → v1（v0 不存在的字段补 default）
// ─────────────────────────────────────────────────────────────────────────────

export function migrateStats(raw: unknown, now: number = Date.now()): CompanionStatsV1 {
  // 任何无法识别 / 损坏的输入 → 创建全新 default（不丢已有合法字段时尽量保留）
  if (!raw || typeof raw !== 'object') return createDefaultStats(now)
  const r = raw as Record<string, unknown>
  const def = createDefaultStats(now)

  const versionRaw = r.version
  // 已经是 v1 且 schema 完整 → 透传（HMAC 验证由 loadStats 调用方处理）
  if (versionRaw === COMPANION_STATS_SCHEMA_VERSION) {
    return r as CompanionStatsV1
  }

  // W12-T3: v2 written 数据 → 自动降级到 v1（向后兼容路径，丢 seasons 但保留核心字段）
  // why: 让此版 panda CLI 能读未来 v2 用户存档；seasons 仅作为 reader-side 增强
  //   字段，丢弃后核心 XP/level/milestones 全保留
  if (versionRaw === COMPANION_STATS_SCHEMA_VERSION_NEXT) {
    return migrateStatsV2toV1(r as unknown as CompanionStatsV2, now)
  }

  // v0（无 version 字段） → 尽量保留 createdAt / level / xp.total，其余补 default
  // why explicit pick: def 含 hmac 字段，spread 进 merged 会污染 signHMAC 输入
  //   （signHMAC 用 stableStringify 编码全部 own keys），必须手动剥离
  const { hmac: _defHmac, ...defNoHmac } = def
  const merged: Omit<CompanionStatsV1, 'hmac'> = {
    ...defNoHmac,
    createdAt:
      typeof r.createdAt === 'number' && r.createdAt > 0
        ? r.createdAt
        : defNoHmac.createdAt,
    lastUpdatedAt: now,
    level:
      typeof r.level === 'number' && r.level >= 1 && r.level <= 60
        ? Math.floor(r.level)
        : defNoHmac.level,
  }
  return { ...merged, hmac: signHMAC(merged) }
}

// ─────────────────────────────────────────────────────────────────────────────
// Migration v1 ↔ v2 — 双向（W12-T3 前瞻）
// 注意：writer 仍只写 v1；这两个函数仅供 reader/未来升级路径使用
// ─────────────────────────────────────────────────────────────────────────────

// v1 → v2：补 seasons 桶（全 0）+ 升 version；HMAC 重签
// why: 若未来开关启用 v2 写入，此函数即一次性升档入口
export function migrateStatsV1toV2(
  v1: CompanionStatsV1,
  now: number = Date.now(),
): CompanionStatsV2 {
  const seasons = readSeasonsForward(v1) // 兼容 v1 已被外部加 seasons 字段的极端情况
  const { hmac: _ignored, ...rest } = v1
  const upgraded: Omit<CompanionStatsV2, 'hmac'> = {
    ...rest,
    version: COMPANION_STATS_SCHEMA_VERSION_NEXT as 2,
    lastUpdatedAt: now,
    seasons,
  }
  return { ...upgraded, hmac: signHMAC(upgraded as unknown as Omit<CompanionStatsV1, 'hmac'>) }
}

// v2 → v1：丢 seasons 字段降回 v1（向后兼容 — 旧 binary 读 v2 数据时调用）
// why: 旧版本 panda CLI 读到未来 v2 数据时，先降为 v1 再走原 reader 路径，零破坏
export function migrateStatsV2toV1(
  v2: CompanionStatsV2,
  now: number = Date.now(),
): CompanionStatsV1 {
  const { hmac: _ignored, seasons: _drop, version: _v, ...rest } = v2
  const downgraded: Omit<CompanionStatsV1, 'hmac'> = {
    ...rest,
    version: COMPANION_STATS_SCHEMA_VERSION,
    lastUpdatedAt: now,
  }
  return { ...downgraded, hmac: signHMAC(downgraded) }
}

// ─────────────────────────────────────────────────────────────────────────────
// 持久化路径（与 settings.json 同目录）
// ─────────────────────────────────────────────────────────────────────────────

export function getStatsFilePath(): string {
  return join(getClaudeConfigHomeDir(), 'companion-stats.json')
}

// 写入用原子 rename：tmp → rename，crash 不会留半截 JSON
function atomicWriteFile(path: string, content: string): void {
  const dir = path.substring(0, Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')))
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  // why randomBytes: 防并发写入两个 panda 进程 tmp 撞名
  const suffix = randomBytes(6).toString('hex')
  const tmp = `${path}.${suffix}.tmp`
  writeFileSync(tmp, content, { encoding: 'utf-8' })
  renameSync(tmp, path)
}

// ─────────────────────────────────────────────────────────────────────────────
// 主入口：load / save
// ─────────────────────────────────────────────────────────────────────────────

export function loadStats(now: number = Date.now()): CompanionStatsV1 {
  const path = getStatsFilePath()
  if (!existsSync(path)) return createDefaultStats(now)
  try {
    const raw = readFileSync(path, { encoding: 'utf-8' })
    const parsed: unknown = JSON.parse(raw)
    const migrated = migrateStats(parsed, now)
    // HMAC 验证失败：A2 §6 决策为"不报错，仅日志警告" — 但读到完全损坏的存档
    // 我们仍返回原值（让 UI 决定是否标 ⚠ tampered）；只有解析失败才走 default 路径
    if (!verifyHMAC(migrated)) {
      // why warn-not-throw: 用户可能合法编辑（重置 streak 测 UI 等）；硬失败会卡 CLI
      console.warn(
        '[panda] companion-stats.json HMAC verify failed — treating as tampered (no penalty)',
      )
    }
    return migrated
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(
      `[panda] companion-stats.json parse failed, resetting to default: ${msg}`,
    )
    return createDefaultStats(now)
  }
}

export function saveStats(s: CompanionStatsV1): void {
  // why re-sign on save: lastUpdatedAt 等任意字段变更后都要重算 hmac
  const { hmac: _ignored, ...rest } = s
  const signed: CompanionStatsV1 = { ...rest, hmac: signHMAC(rest) }
  atomicWriteFile(getStatsFilePath(), JSON.stringify(signed, null, 2) + '\n')
}

// 测试辅助：暴露 todayKey 供 petXP / 测试复用
export { todayKey }
