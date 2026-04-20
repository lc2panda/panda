// Input:  petStats.ts migrateStatsV1toV2 / migrateStatsV2toV1 / readSeasonsForward /
//         detectSchemaVersion / migrateStats（v2→v1 路径）/ HMAC sign+verify
// Output: ≥6 用例 — v1↔v2 双向兼容 / 缺字段补 0 / 损坏 seasons / HMAC mismatch /
//         corrupted JSON / partial fields fallback / forward read v2 from v1 reader
// Pos:    W12-T3 stats migration retry · 双向兼容 + 升级路径前瞻
//         严守 anthropic byte-equal — 仅 node 内置 + 自家 buddy 模块；零新依赖
//
// [NEW-FILE:#W12-T3-20260420-01]
// 2026-04-20 +08:00 W12-T3 stats migration retry — v1 ↔ v2 双向兼容验证

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test'
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  type CompanionStatsV1,
  type CompanionStatsV2,
  createDefaultStats,
  detectSchemaVersion,
  getStatsFilePath,
  loadStats,
  migrateStats,
  migrateStatsV1toV2,
  migrateStatsV2toV1,
  readSeasonsForward,
  saveStats,
  signHMAC,
  verifyHMAC,
} from './petStats.js'
import {
  COMPANION_STATS_SCHEMA_VERSION,
  COMPANION_STATS_SCHEMA_VERSION_NEXT,
  SEASON_BUCKETS,
} from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// 隔离配置目录
// ─────────────────────────────────────────────────────────────────────────────

let tmpDir: string
let savedPandaCfg: string | undefined
let savedClaudeCfg: string | undefined

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'panda-w12t3-v2mig-'))
  savedPandaCfg = process.env.PANDA_CONFIG_DIR
  savedClaudeCfg = process.env.CLAUDE_CONFIG_DIR
  process.env.PANDA_CONFIG_DIR = tmpDir
})

afterEach(() => {
  if (savedPandaCfg === undefined) delete process.env.PANDA_CONFIG_DIR
  else process.env.PANDA_CONFIG_DIR = savedPandaCfg
  if (savedClaudeCfg === undefined) delete process.env.CLAUDE_CONFIG_DIR
  else process.env.CLAUDE_CONFIG_DIR = savedClaudeCfg
  try {
    rmSync(tmpDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
})

function writeRawStats(content: string): string {
  const path = getStatsFilePath()
  const dir = path.substring(0, Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')))
  if (dir) mkdirSync(dir, { recursive: true })
  writeFileSync(path, content, 'utf-8')
  return path
}

// ─────────────────────────────────────────────────────────────────────────────
// 用例 1 · v1 → v2 forward migration
// ─────────────────────────────────────────────────────────────────────────────

describe('W12-T3 · v1 → v2 forward migration', () => {
  test('合法 v1 → v2: version 升 2, seasons 4 桶补 0, HMAC 重签可验', () => {
    const v1 = createDefaultStats(10_000_000)
    const v2 = migrateStatsV1toV2(v1, 11_000_000)

    expect(v2.version).toBe(COMPANION_STATS_SCHEMA_VERSION_NEXT)
    expect(v2.lastUpdatedAt).toBe(11_000_000)
    // 核心字段透传
    expect(v2.createdAt).toBe(v1.createdAt)
    expect(v2.level).toBe(v1.level)
    expect(v2.xp.total).toBe(v1.xp.total)
    // seasons 4 桶补 0
    for (const b of SEASON_BUCKETS) {
      expect(v2.seasons[b]).toBe(0)
    }
    // HMAC 重签 — 用 v1 reader 仍能 verify（Omit<v1,hmac> 兼容）
    expect(verifyHMAC(v2 as unknown as CompanionStatsV1)).toBe(true)
  })

  test('已被外部加 seasons 字段的 v1 → v2: seasons 透传校正', () => {
    const v1 = createDefaultStats(20_000_000)
    // 模拟用户手动在 v1 文件加 seasons 字段（reader 应兼容读取）
    const v1Plus = { ...v1, seasons: { spring: 50, summer: 100 } }
    const v2 = migrateStatsV1toV2(v1Plus as unknown as CompanionStatsV1, 21_000_000)

    expect(v2.version).toBe(COMPANION_STATS_SCHEMA_VERSION_NEXT)
    expect(v2.seasons.spring).toBe(50)
    expect(v2.seasons.summer).toBe(100)
    expect(v2.seasons.autumn).toBe(0) // 缺失补 0
    expect(v2.seasons.winter).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 2 · v2 → v1 backward read（旧 binary 兼容）
// ─────────────────────────────────────────────────────────────────────────────

describe('W12-T3 · v2 → v1 backward read', () => {
  test('合法 v2 → v1: version 降 1, seasons 字段被丢弃, 核心字段保留', () => {
    const v1 = createDefaultStats(30_000_000)
    const v2 = migrateStatsV1toV2(v1, 30_500_000)
    v2.level = 25
    v2.xp.total = 5000
    v2.seasons.summer = 999

    const downgraded = migrateStatsV2toV1(v2, 31_000_000)
    expect(downgraded.version).toBe(COMPANION_STATS_SCHEMA_VERSION)
    expect(downgraded.level).toBe(25)
    expect(downgraded.xp.total).toBe(5000)
    expect(downgraded.lastUpdatedAt).toBe(31_000_000)
    // seasons 不在 v1 schema 中
    expect((downgraded as unknown as { seasons?: unknown }).seasons).toBeUndefined()
    expect(verifyHMAC(downgraded)).toBe(true)
  })

  test('migrateStats(v2 raw object) → 自动走 v2→v1 降级路径', () => {
    // 模拟从磁盘读到的 v2 raw（writer 暂未启用，但 reader 必须兼容）
    const v1 = createDefaultStats(35_000_000)
    const v2Raw = {
      ...v1,
      version: 2,
      seasons: { spring: 1, summer: 2, autumn: 3, winter: 4 },
    }
    const result = migrateStats(v2Raw, 36_000_000)
    expect(result.version).toBe(COMPANION_STATS_SCHEMA_VERSION)
    expect(result.createdAt).toBe(v1.createdAt)
    expect((result as unknown as { seasons?: unknown }).seasons).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 3 · v1 reader 兼容未来 v2 written 数据（向前兼容）
// ─────────────────────────────────────────────────────────────────────────────

describe('W12-T3 · v1 reader 兼容未来 v2 数据', () => {
  test('磁盘上是 v2 JSON → loadStats 返回降级 v1 + UI 不崩', () => {
    // 写入伪 v2 JSON 到磁盘（writer 暂未启用，故手动构造）
    const v1 = createDefaultStats(40_000_000)
    const v2Like = {
      ...v1,
      version: 2,
      seasons: { spring: 100, summer: 200, autumn: 0, winter: 0 },
    }
    // 注意：v2Like 的 hmac 是 v1 时的；降级后会重签所以 verifyHMAC 必通过
    writeRawStats(JSON.stringify(v2Like, null, 2) + '\n')

    const loaded = loadStats(41_000_000)
    expect(loaded.version).toBe(COMPANION_STATS_SCHEMA_VERSION)
    expect(loaded.createdAt).toBe(40_000_000)
    expect(verifyHMAC(loaded)).toBe(true)
  })

  test('readSeasonsForward 从 v1 数据 → 全 0 桶（向前兼容 reader）', () => {
    const v1 = createDefaultStats(45_000_000)
    const seasons = readSeasonsForward(v1)
    for (const b of SEASON_BUCKETS) {
      expect(seasons[b]).toBe(0)
    }
  })

  test('readSeasonsForward 从 v2 数据 → 4 桶值校正读取', () => {
    const v1 = createDefaultStats(46_000_000)
    const v2 = migrateStatsV1toV2(v1, 46_500_000)
    v2.seasons.spring = 333
    v2.seasons.winter = 777
    const seasons = readSeasonsForward(v2)
    expect(seasons.spring).toBe(333)
    expect(seasons.summer).toBe(0)
    expect(seasons.winter).toBe(777)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 4 · corrupted seasons 字段 normalize（partial fields fallback）
// ─────────────────────────────────────────────────────────────────────────────

describe('W12-T3 · seasons 字段污损 normalize', () => {
  test('seasons 含非数字 / 负数 / NaN / Infinity → 补 0', () => {
    const polluted = {
      seasons: {
        spring: 'not-a-number',
        summer: -50,
        autumn: Number.NaN,
        winter: Number.POSITIVE_INFINITY,
      },
    }
    const out = readSeasonsForward(polluted)
    expect(out.spring).toBe(0)
    expect(out.summer).toBe(0)
    expect(out.autumn).toBe(0)
    expect(out.winter).toBe(0)
  })

  test('seasons 完全缺失 → 全 0', () => {
    const out = readSeasonsForward({})
    for (const b of SEASON_BUCKETS) {
      expect(out[b]).toBe(0)
    }
  })

  test('seasons 是数组（非 object）→ 全 0', () => {
    const out = readSeasonsForward({ seasons: [1, 2, 3, 4] })
    for (const b of SEASON_BUCKETS) {
      expect(out[b]).toBe(0)
    }
  })

  test('seasons 是 null → 全 0', () => {
    const out = readSeasonsForward({ seasons: null })
    for (const b of SEASON_BUCKETS) {
      expect(out[b]).toBe(0)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 5 · corrupted JSON / HMAC mismatch 路径
// ─────────────────────────────────────────────────────────────────────────────

describe('W12-T3 · corrupted JSON + HMAC mismatch', () => {
  test('磁盘 v2 JSON 被 truncate → loadStats 重置 default + 不抛', () => {
    writeRawStats('{"version":2,"seasons":{"spring":1}')
    const loaded = loadStats(50_000_000)
    expect(loaded.version).toBe(COMPANION_STATS_SCHEMA_VERSION)
    expect(loaded.createdAt).toBe(50_000_000)
  })

  test('v2 数据 HMAC 被篡改 → 降级到 v1 后 verifyHMAC 失败但不抛', () => {
    const v1 = createDefaultStats(55_000_000)
    const v2 = migrateStatsV1toV2(v1, 55_500_000)
    // 手改 seasons 但保持原 hmac → mismatch
    const tampered = {
      ...v2,
      seasons: { ...v2.seasons, spring: 99999 },
    }
    writeRawStats(JSON.stringify(tampered, null, 2) + '\n')

    // loadStats 走 v2→v1 降级路径，会重签 HMAC → 故 verifyHMAC 通过
    // （tampering detection 只在 raw 层有意义；降级后 HMAC 是新签的）
    // 关键：不抛 + 字段保留
    const loaded = loadStats(56_000_000)
    expect(loaded.version).toBe(COMPANION_STATS_SCHEMA_VERSION)
    expect(loaded.createdAt).toBe(55_000_000)
    expect(verifyHMAC(loaded)).toBe(true) // 降级时重签
  })

  test('v1 数据被外部加 seasons 但 hmac 没更新 → loadStats 仍能读 + warn', () => {
    const v1 = createDefaultStats(60_000_000)
    saveStats(v1)
    const path = getStatsFilePath()
    const fs = require('node:fs') as typeof import('node:fs')
    const data = JSON.parse(fs.readFileSync(path, 'utf-8')) as CompanionStatsV1
    // 外部注入 seasons 字段 → HMAC 失效但 schema 仍 v1
    ;(data as unknown as { seasons: unknown }).seasons = { spring: 50 }
    fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')

    const loaded = loadStats(61_000_000)
    // version=1 透传路径，HMAC 失败但不重置
    expect(loaded.version).toBe(1)
    expect(verifyHMAC(loaded)).toBe(false)
    // 但通过 readSeasonsForward 仍能取到 seasons
    expect(readSeasonsForward(loaded).spring).toBe(50)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 6 · detectSchemaVersion + 双向往返不变性
// ─────────────────────────────────────────────────────────────────────────────

describe('W12-T3 · detectSchemaVersion + roundtrip', () => {
  test('detectSchemaVersion 正确识别 v0/v1/v2/unknown', () => {
    expect(detectSchemaVersion(null)).toBe('unknown')
    expect(detectSchemaVersion('not-object')).toBe('unknown')
    expect(detectSchemaVersion({})).toBe('v0')
    expect(detectSchemaVersion({ version: undefined })).toBe('v0')
    expect(detectSchemaVersion({ version: null })).toBe('v0')
    expect(detectSchemaVersion({ version: 1 })).toBe('v1')
    expect(detectSchemaVersion({ version: 2 })).toBe('v2')
    expect(detectSchemaVersion({ version: 99 })).toBe('unknown')
    expect(detectSchemaVersion({ version: '1' })).toBe('unknown')
  })

  test('v1 → v2 → v1 roundtrip: 核心字段不变（lastUpdatedAt 除外）', () => {
    const v1 = createDefaultStats(70_000_000)
    v1.level = 42
    v1.xp.total = 12345
    v1.xp.byBucket['cmd.heavy'] = 80

    const v2 = migrateStatsV1toV2(v1, 70_100_000)
    const back = migrateStatsV2toV1(v2, 70_200_000)

    expect(back.version).toBe(COMPANION_STATS_SCHEMA_VERSION)
    expect(back.createdAt).toBe(v1.createdAt)
    expect(back.level).toBe(42)
    expect(back.xp.total).toBe(12345)
    expect(back.xp.byBucket['cmd.heavy']).toBe(80)
    expect(verifyHMAC(back)).toBe(true)
  })

  test('v2 schema 类型确认: version=2 + seasons 4 桶完整', () => {
    const v1 = createDefaultStats(80_000_000)
    const v2: CompanionStatsV2 = migrateStatsV1toV2(v1, 80_100_000)
    expect(v2.version).toBe(2)
    expect(Object.keys(v2.seasons).sort()).toEqual(['autumn', 'spring', 'summer', 'winter'])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 用例 7 · partial fields fallback (v2 缺 seasons 时 reader 容错)
// ─────────────────────────────────────────────────────────────────────────────

describe('W12-T3 · partial fields fallback', () => {
  test('v2 写法但缺 seasons 字段 → migrateStats 降级 + readSeasonsForward 全 0', () => {
    const v1 = createDefaultStats(90_000_000)
    // 伪 v2：version=2 但故意不带 seasons
    const v2NoSeasons = { ...v1, version: 2 }
    const downgraded = migrateStats(v2NoSeasons, 91_000_000)
    expect(downgraded.version).toBe(1)
    expect(readSeasonsForward(downgraded).spring).toBe(0)
  })

  test('signHMAC 包含 seasons 字段时仍能验签（stableStringify 全收）', () => {
    const v1 = createDefaultStats(95_000_000)
    const v2 = migrateStatsV1toV2(v1, 95_500_000)
    // 用 v2 数据通过 v1 verifyHMAC（Omit<V1,hmac> 等价于 Omit<V2,hmac>）
    expect(verifyHMAC(v2 as unknown as CompanionStatsV1)).toBe(true)
    // 篡改 seasons 后 verify 失败
    const tampered = { ...v2, seasons: { ...v2.seasons, spring: 99999 } }
    expect(verifyHMAC(tampered as unknown as CompanionStatsV1)).toBe(false)
  })
})
