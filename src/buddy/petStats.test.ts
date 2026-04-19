// Input: petStats.ts 全部 export
// Output: schema 完整性 / HMAC sign+verify / migrate / 原子写入 / version 守护
// Pos:    Phase 0 P0-T3 验证 [NEW-FILE:#20260419-OD-02]

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  type CompanionStatsV1,
  createDefaultStats,
  getStatsFilePath,
  HISTORY_MAX_LEN,
  loadStats,
  migrateStats,
  saveStats,
  signHMAC,
  todayKey,
  verifyHMAC,
} from './petStats.js'
import {
  COMPANION_STATS_SCHEMA_VERSION,
  STAT_NAMES,
  XP_BUCKETS,
} from './types.js'

// 隔离的临时配置目录 — 每个用例独立目录避免污染真实 ~/.pandacc
let tmpDir: string
let savedEnv: { panda: string | undefined; claude: string | undefined }

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'panda-pet-stats-test-'))
  savedEnv = {
    panda: process.env.PANDA_CONFIG_DIR,
    claude: process.env.CLAUDE_CONFIG_DIR,
  }
  process.env.PANDA_CONFIG_DIR = tmpDir
})

afterEach(() => {
  process.env.PANDA_CONFIG_DIR = savedEnv.panda
  process.env.CLAUDE_CONFIG_DIR = savedEnv.claude
  if (savedEnv.panda === undefined) delete process.env.PANDA_CONFIG_DIR
  if (savedEnv.claude === undefined) delete process.env.CLAUDE_CONFIG_DIR
  try {
    rmSync(tmpDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

// ─────────────────────────────────────────────────────────────────────────────
describe('createDefaultStats — schema 完整性', () => {
  test('返回 v1 schema + 全部字段就位', () => {
    const s = createDefaultStats(1_000_000_000)
    expect(s.version).toBe(COMPANION_STATS_SCHEMA_VERSION)
    expect(s.createdAt).toBe(1_000_000_000)
    expect(s.lastUpdatedAt).toBe(1_000_000_000)
    expect(s.level).toBe(1)
    expect(s.xp.total).toBe(0)
    expect(s.xp.today).toBe(0)
    expect(s.xp.overflow).toBe(0)
    expect(typeof s.hmac).toBe('string')
    expect(s.hmac.length).toBeGreaterThan(0)
  })

  test('默认 unlocks 仅含等级 1 三态 / none hat / · eye', () => {
    const s = createDefaultStats()
    expect(s.unlocks.states.sort()).toEqual(['dozing', 'idle', 'sleeping'])
    expect(s.unlocks.hats).toEqual(['none'])
    expect(s.unlocks.eyes).toEqual(['·'])
  })

  test('byBucket 包含全部 11 个 XP 桶且初始 0', () => {
    const s = createDefaultStats()
    for (const b of XP_BUCKETS) {
      expect(s.xp.byBucket[b]).toBe(0)
    }
  })

  test('stats 包含全部 5 个属性且初始 0', () => {
    const s = createDefaultStats()
    for (const n of STAT_NAMES) {
      expect(s.stats[n]).toBe(0)
    }
  })

  test('history 包含 created 事件', () => {
    const s = createDefaultStats(123_456)
    expect(s.history).toHaveLength(1)
    expect(s.history[0]).toEqual({ ts: 123_456, event: 'created' })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('HMAC sign + verify', () => {
  test('createDefaultStats 签名能通过 verify', () => {
    const s = createDefaultStats()
    expect(verifyHMAC(s)).toBe(true)
  })

  test('篡改 xp.total 后 verify 失败', () => {
    const s = createDefaultStats()
    const tampered = { ...s, xp: { ...s.xp, total: 9_999_999 } }
    expect(verifyHMAC(tampered)).toBe(false)
  })

  test('篡改 level 后 verify 失败', () => {
    const s = createDefaultStats()
    const tampered = { ...s, level: 60 }
    expect(verifyHMAC(tampered)).toBe(false)
  })

  test('signHMAC 对相同字段稳定', () => {
    const s = createDefaultStats(2_000_000)
    const { hmac: _, ...rest } = s
    expect(signHMAC(rest)).toBe(signHMAC(rest))
  })

  test('verifyHMAC 拒绝缺失 hmac 字段', () => {
    const s = createDefaultStats()
    const without = { ...s, hmac: '' }
    expect(verifyHMAC(without)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('migrateStats — v0 → v1 兼容', () => {
  test('null / undefined → 全新 default', () => {
    const a = migrateStats(null, 5_000)
    expect(a.version).toBe(1)
    expect(a.createdAt).toBe(5_000)

    const b = migrateStats(undefined, 6_000)
    expect(b.version).toBe(1)
  })

  test('完整 v1 schema → 透传不动', () => {
    const orig = createDefaultStats(7_000)
    const migrated = migrateStats(orig, 8_000)
    // 透传 → 引用同 createdAt
    expect(migrated.createdAt).toBe(7_000)
    expect(migrated.version).toBe(1)
  })

  test('v0 部分字段（无 version）→ 保留 createdAt + level，其余补 default', () => {
    const v0 = { createdAt: 100_000, level: 7, foo: 'bar' }
    const migrated = migrateStats(v0, 200_000)
    expect(migrated.version).toBe(1)
    expect(migrated.createdAt).toBe(100_000)
    expect(migrated.level).toBe(7)
    expect(migrated.lastUpdatedAt).toBe(200_000)
    expect(verifyHMAC(migrated)).toBe(true)
  })

  test('v0 非法 level（> 60）回退 default 1', () => {
    const v0 = { createdAt: 100_000, level: 9999 }
    const migrated = migrateStats(v0, 200_000)
    expect(migrated.level).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('loadStats / saveStats — 原子写入 + 持久化往返', () => {
  test('文件不存在 → 返回 default', () => {
    const s = loadStats(1_000_000)
    expect(s.version).toBe(1)
    expect(s.createdAt).toBe(1_000_000)
  })

  test('save → load 字段保真', () => {
    const orig = createDefaultStats(500_000)
    orig.level = 5
    orig.xp.total = 1234
    saveStats(orig)
    expect(existsSync(getStatsFilePath())).toBe(true)
    const loaded = loadStats()
    expect(loaded.level).toBe(5)
    expect(loaded.xp.total).toBe(1234)
    expect(verifyHMAC(loaded)).toBe(true)
  })

  test('损坏 JSON → 重置 default（不抛）', () => {
    const path = getStatsFilePath()
    // 确保目录存在
    saveStats(createDefaultStats())
    writeFileSync(path, '{this is not json', 'utf-8')
    const recovered = loadStats(900_000)
    expect(recovered.version).toBe(1)
    expect(recovered.createdAt).toBe(900_000)
  })

  test('原子写入 — tmp 文件不残留', () => {
    saveStats(createDefaultStats())
    const path = getStatsFilePath()
    // 父目录中不应存在 .tmp 残留（rename 后清理）
    const dir = path.substring(0, path.lastIndexOf(path.includes('\\') ? '\\' : '/'))
    const fs = require('node:fs') as typeof import('node:fs')
    const entries = fs.readdirSync(dir)
    const tmps = entries.filter(e => e.endsWith('.tmp'))
    expect(tmps).toHaveLength(0)
  })

  test('schema version 1 守护 — 写入后从磁盘读回 version 字段', () => {
    saveStats(createDefaultStats())
    const raw = readFileSync(getStatsFilePath(), 'utf-8')
    const parsed = JSON.parse(raw) as { version: number }
    expect(parsed.version).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('todayKey — 时区锚点 +08:00', () => {
  test('返回 YYYY-MM-DD 格式', () => {
    const key = todayKey()
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('UTC 16:00 → +08 次日（边界跨天）', () => {
    // 2026-04-19 UTC 16:00 = 2026-04-20 +08:00 00:00
    const ts = Date.UTC(2026, 3, 19, 16, 0, 0)
    expect(todayKey(ts)).toBe('2026-04-20')
  })
})

// 守护：常量 HISTORY_MAX_LEN 与 schema 协议
describe('protocol guards', () => {
  test('HISTORY_MAX_LEN 公开且合理', () => {
    expect(HISTORY_MAX_LEN).toBeGreaterThanOrEqual(100)
    expect(HISTORY_MAX_LEN).toBeLessThanOrEqual(1000)
  })
})
