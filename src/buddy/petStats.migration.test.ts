// Input: src/buddy/petStats.ts migrateStats / loadStats / signHMAC / verifyHMAC
// Output: ≥8 边界用例 — v0 → v1 各种残缺字段 / corrupted JSON / version 不匹配 /
//         非法 createdAt / 嵌套对象注入 / HMAC fallback / 空文件 / 截断 JSON
// Pos:    W7-T3 panda buddy 存档迁移稳定性集成验证
//         严守 anthropic byte-equal — 仅 node 内置 + 自家 buddy 模块
//
// [NEW-FILE:#W7-03]
// 2026-04-20 +08:00 W7-T3 测试加固 — companion-stats v0→v1 migration 边界

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
  createDefaultStats,
  getStatsFilePath,
  loadStats,
  migrateStats,
  saveStats,
  signHMAC,
  verifyHMAC,
} from './petStats.js'
import { COMPANION_STATS_SCHEMA_VERSION } from './types.js'

// ─────────────────────────────────────────────────────────────────────────────
// 隔离配置目录
// ─────────────────────────────────────────────────────────────────────────────

let tmpDir: string
let savedPandaCfg: string | undefined
let savedClaudeCfg: string | undefined

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'panda-w7t3-stats-mig-'))
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
// W7-T3-MIG-1 · v0 残缺字段集
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · petStats migration v0 → v1 · 字段残缺', () => {
  test('完全空 v0 对象 {} → 全字段 default + version=1 + HMAC valid', () => {
    const m = migrateStats({}, 5_000_000)
    expect(m.version).toBe(1)
    expect(m.createdAt).toBe(5_000_000)
    expect(m.lastUpdatedAt).toBe(5_000_000)
    expect(m.level).toBe(1)
    expect(m.xp.total).toBe(0)
    expect(verifyHMAC(m)).toBe(true)
  })

  test('v0 仅含 level → 保留 level + 其余 default + HMAC valid', () => {
    const m = migrateStats({ level: 12 }, 6_000_000)
    expect(m.level).toBe(12)
    expect(m.createdAt).toBe(6_000_000) // createdAt 缺失 → 用 now
    expect(verifyHMAC(m)).toBe(true)
  })

  test('v0 含 createdAt + level + 大量未知字段 → 保留 + 忽略 unknowns', () => {
    const v0 = {
      createdAt: 1_700_000_000_000,
      level: 30,
      foo: 'bar',
      baz: { nested: true },
      arr: [1, 2, 3],
    }
    const m = migrateStats(v0, 8_000_000)
    expect(m.createdAt).toBe(1_700_000_000_000)
    expect(m.level).toBe(30)
    expect((m as unknown as { foo?: unknown }).foo).toBeUndefined()
    expect(verifyHMAC(m)).toBe(true)
  })

  test('v0 非法 level 类型 (string) → 回退 default 1', () => {
    const m = migrateStats({ level: '99' as unknown as number }, 9_000_000)
    expect(m.level).toBe(1)
  })

  test('v0 level 浮点数 → Math.floor (validation 守护 1<=level<=60)', () => {
    const m = migrateStats({ level: 5.7 }, 1_000_000)
    expect(m.level).toBe(5)
  })

  test('v0 negative level → 回退 default 1', () => {
    const m = migrateStats({ level: -3 }, 1_100_000)
    expect(m.level).toBe(1)
  })

  test('v0 level 边界值 60 (max) → 保留', () => {
    const m = migrateStats({ level: 60 }, 1_200_000)
    expect(m.level).toBe(60)
  })

  test('v0 level 边界值 61 (超 max) → 回退 default 1', () => {
    const m = migrateStats({ level: 61 }, 1_300_000)
    expect(m.level).toBe(1)
  })

  test('v0 createdAt 0 (非法 — 必 > 0) → 用 now', () => {
    const m = migrateStats({ createdAt: 0, level: 5 }, 1_400_000)
    expect(m.createdAt).toBe(1_400_000)
  })

  test('v0 createdAt 非 number (string) → 用 now', () => {
    const m = migrateStats(
      { createdAt: '1700000000000' as unknown as number, level: 5 },
      1_500_000,
    )
    expect(m.createdAt).toBe(1_500_000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-MIG-2 · v1 透传 + version 不匹配
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · petStats migration · version 守护', () => {
  test('完整 v1 schema → 透传不动（含 hmac 字段）', () => {
    const orig = createDefaultStats(2_000_000)
    const m = migrateStats(orig, 3_000_000)
    expect(m).toBe(orig as unknown as CompanionStatsV1)
  })

  test('version=2 (未来 schema 版本) → 当作 v0 处理 + 不抛错', () => {
    const future = { version: 2, createdAt: 1_000, level: 99 }
    const m = migrateStats(future, 4_000_000)
    expect(m.version).toBe(COMPANION_STATS_SCHEMA_VERSION)
    expect(m.createdAt).toBe(1_000)
  })

  test('version=null 显式 → 当作 v0 处理', () => {
    const m = migrateStats({ version: null, createdAt: 5_000, level: 8 }, 7_000_000)
    expect(m.version).toBe(1)
    expect(m.level).toBe(8)
  })

  test('version=string "1" (类型不匹配 strict equal) → 当作 v0 处理', () => {
    const m = migrateStats({ version: '1', createdAt: 5_000 }, 7_500_000)
    expect(m.version).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-MIG-3 · loadStats corrupted JSON fallback
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · petStats loadStats · corrupted JSON fallback', () => {
  test('截断 JSON ({"versio) → reset default + 不抛', () => {
    writeRawStats('{"versio')
    const s = loadStats(11_000_000)
    expect(s.version).toBe(1)
    expect(s.createdAt).toBe(11_000_000)
    expect(verifyHMAC(s)).toBe(true)
  })

  test('完全非 JSON 文本 → reset default + 不抛', () => {
    writeRawStats('this is not json at all\n garbage bytes \x00\x01\x02')
    const s = loadStats(12_000_000)
    expect(s.version).toBe(1)
    expect(s.createdAt).toBe(12_000_000)
  })

  test('空文件 → reset default + 不抛', () => {
    writeRawStats('')
    const s = loadStats(13_000_000)
    expect(s.version).toBe(1)
    expect(s.createdAt).toBe(13_000_000)
  })

  test('JSON 顶层是数组 → migrate 走 default 路径 (非 object)', () => {
    writeRawStats('[1, 2, 3]')
    const s = loadStats(14_000_000)
    // 顶层是 object（数组也是），migrate 把它当 v0 处理 → 走默认 (无 version 字段)
    expect(s.version).toBe(1)
    expect(s.createdAt).toBe(14_000_000)
  })

  test('JSON 顶层是 number → typeof !== object → reset default', () => {
    writeRawStats('42')
    const s = loadStats(15_000_000)
    expect(s.version).toBe(1)
  })

  test('JSON 顶层是 null → migrate 走 default 路径', () => {
    writeRawStats('null')
    const s = loadStats(16_000_000)
    expect(s.version).toBe(1)
    expect(s.createdAt).toBe(16_000_000)
  })

  test('文件不存在 → 直接 default (不进 readFileSync)', () => {
    const s = loadStats(17_000_000)
    expect(s.version).toBe(1)
    expect(s.createdAt).toBe(17_000_000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-MIG-4 · HMAC tamper 后 loadStats 行为
// 决策：HMAC 失败仅 console.warn，不重置 — 让 UI 决定标 ⚠ tampered
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · petStats loadStats · HMAC tamper 行为', () => {
  test('合法 v1 + 篡改 xp.total → loadStats 仍返回原数据 (warn 但不重置)', () => {
    const orig = createDefaultStats(20_000_000)
    saveStats(orig)
    // 手改文件 — 改 xp.total 但不更新 hmac
    const path = getStatsFilePath()
    const fs = require('node:fs') as typeof import('node:fs')
    const raw = fs.readFileSync(path, 'utf-8')
    const data = JSON.parse(raw) as CompanionStatsV1
    data.xp.total = 999_999
    fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')

    // loadStats 应仍返回篡改后的 xp.total（不静默 reset）
    const loaded = loadStats(21_000_000)
    expect(loaded.xp.total).toBe(999_999)
    // 但 HMAC verify 失败
    expect(verifyHMAC(loaded)).toBe(false)
  })

  test('save → load 往返 — HMAC 在 save 时会重新签 → load 必通过 verify', () => {
    const orig = createDefaultStats(22_000_000)
    orig.level = 7
    orig.xp.total = 333
    saveStats(orig)
    const loaded = loadStats(23_000_000)
    expect(loaded.level).toBe(7)
    expect(loaded.xp.total).toBe(333)
    expect(verifyHMAC(loaded)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-MIG-5 · migrateStats 输入类型边界
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · petStats migrateStats · 类型边界', () => {
  test('migrateStats(null) → default + 不抛', () => {
    const m = migrateStats(null, 30_000_000)
    expect(m.version).toBe(1)
    expect(m.createdAt).toBe(30_000_000)
  })

  test('migrateStats(undefined) → default + 不抛', () => {
    const m = migrateStats(undefined, 31_000_000)
    expect(m.version).toBe(1)
  })

  test('migrateStats(string) → default + 不抛', () => {
    const m = migrateStats('not-an-object', 32_000_000)
    expect(m.version).toBe(1)
  })

  test('migrateStats(boolean false) → default + 不抛', () => {
    const m = migrateStats(false, 33_000_000)
    expect(m.version).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// W7-T3-MIG-6 · signHMAC 决定性 + verify 一致性
// ─────────────────────────────────────────────────────────────────────────────

describe('W7-T3 · petStats signHMAC · 决定性', () => {
  test('signHMAC 对相同输入返回相同 hex', () => {
    const s = createDefaultStats(40_000_000)
    const { hmac, ...rest } = s
    const a = signHMAC(rest)
    const b = signHMAC(rest)
    expect(a).toBe(b)
    expect(a).toBe(hmac) // createDefaultStats 的 hmac 应正等于 signHMAC(rest)
  })

  test('signHMAC 对字段顺序不敏感 (stableStringify 排序)', () => {
    const s1 = createDefaultStats(41_000_000)
    const { hmac: _h1, ...rest1 } = s1
    // 用 spread 重排顺序：先放 streak，再放 createdAt
    const reordered: Omit<CompanionStatsV1, 'hmac'> = {
      streak: rest1.streak,
      version: rest1.version,
      createdAt: rest1.createdAt,
      lastUpdatedAt: rest1.lastUpdatedAt,
      xp: rest1.xp,
      level: rest1.level,
      unlocks: rest1.unlocks,
      stats: rest1.stats,
      milestones: rest1.milestones,
      history: rest1.history,
    }
    expect(signHMAC(reordered)).toBe(signHMAC(rest1))
  })
})
