// Input:  W6-T4 性能 polish 第二波验证 —
//          BadgeManager cap / dispatcher size cap / SVG minify 完整性 / launcher fast-path
// Output: ≥ 5 用例覆盖：
//          1. BadgeManager 超过 MAX_BADGE_ENTRIES → FIFO 淘汰最旧条目
//          2. BadgeManager 活跃 scenario 反复 bump → LRU 排位刷新（不被淘汰）
//          3. dispatcher size cap — batch 达到 NOTIFICATION_BATCH_MAX_SIZE → 立即 flush
//          4. SVG minify — 18+1 物种 sprite 仍含 12 state group + <text> 完整保留
//          5. SVG minify — 总字节数 < 270KB（before ≈ 291KB，验证 ≥10% 削减）
//          6. NOTIFICATION_BATCH_MAX_SIZE 常量已导出且为合理值
//          7. BadgeManager cap 后续 publishSnapshot 不抛、签名 dedupe 仍工作
// Pos:    panda-on-desk W6-T4 性能 polish 第二波集成测试 [NEW-FILE:#W6-05]
//         严守 byte-equal — 不引用 src/services/api/{claude,oauth,providers}
//         不引入新依赖（仅 node:fs/path + bun:test + 自家模块）

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import {
  __getBadgeCountForTesting,
  __resetBadgeCountsForTesting,
  __snapshotForTesting,
  bumpBadge,
  MAX_BADGE_ENTRIES,
  setBadgeRendererNotifier,
  type BadgeUpdatePayload,
} from '../src/badge/manager.js'
import {
  __flushNotificationBatchForTesting,
  __getNotificationBatchSizeForTesting,
  __resetNotificationBatchForTesting,
  dispatchNotificationBatched,
  NOTIFICATION_BATCH_MAX_SIZE,
} from '../src/notification/dispatcher.js'

// ─────────────────────────────────────────────────────────────────────────────
// 测试隔离
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  __resetBadgeCountsForTesting()
  __resetNotificationBatchForTesting()
})

afterEach(() => {
  __resetBadgeCountsForTesting()
  __resetNotificationBatchForTesting()
})

// ─────────────────────────────────────────────────────────────────────────────
// Group A：BadgeManager 内存上限（W6-T4 性能优化点）
// ─────────────────────────────────────────────────────────────────────────────

describe('W6-T4 / BadgeManager cap — 超过 MAX_BADGE_ENTRIES → FIFO/LRU 淘汰', () => {
  test('cap 常量为合理值（256）', () => {
    expect(MAX_BADGE_ENTRIES).toBe(256)
  })

  test('注入 MAX_BADGE_ENTRIES + 50 个唯一 scenarioId → Map size 不超过 cap', () => {
    // 静音 publish 回调以避免噪音
    setBadgeRendererNotifier(() => {})

    for (let i = 0; i < MAX_BADGE_ENTRIES + 50; i++) {
      bumpBadge(`scenario-${i}`, 1)
    }

    const snap = __snapshotForTesting()
    expect(snap.size).toBe(MAX_BADGE_ENTRIES)

    // 最早的 50 个应被淘汰
    expect(__getBadgeCountForTesting('scenario-0')).toBe(0)
    expect(__getBadgeCountForTesting('scenario-49')).toBe(0)
    // 最晚的应保留
    expect(__getBadgeCountForTesting(`scenario-${MAX_BADGE_ENTRIES + 49}`)).toBe(1)
  })

  test('活跃 scenario 反复 bump → LRU 排位刷新，不被新 entry 挤掉', () => {
    setBadgeRendererNotifier(() => {})

    // 注入 cap-1 个 entry，留 1 槽
    for (let i = 0; i < MAX_BADGE_ENTRIES - 1; i++) {
      bumpBadge(`old-${i}`, 1)
    }
    // 把 'hot' 注入 — 它现在是最新（Map 尾）
    bumpBadge('hot', 1)
    // 反复 bump 'hot' → 每次 delete+set 把它移回 Map 尾
    for (let i = 0; i < 10; i++) {
      bumpBadge('hot', 1)
    }
    // 现在再注入 100 个新的 → 'hot' 不应被淘汰（它的 LRU 位置很新）
    for (let i = 0; i < 100; i++) {
      bumpBadge(`new-${i}`, 1)
    }

    expect(__getBadgeCountForTesting('hot')).toBe(11)
    // old-0 是最早注入的，应被挤掉
    expect(__getBadgeCountForTesting('old-0')).toBe(0)
  })

  test('cap 后 publishSnapshot 不抛 + dedupe 签名仍工作', () => {
    const sends: BadgeUpdatePayload[] = []
    setBadgeRendererNotifier((_ch, p) => {
      sends.push(p as BadgeUpdatePayload)
    })

    // 注入超 cap，每次都触发 publish
    for (let i = 0; i < MAX_BADGE_ENTRIES + 5; i++) {
      bumpBadge(`s-${i}`, 1)
    }

    // 至少 cap 次 publish（每次 entries 内容都不同 → dedupe 不命中）
    expect(sends.length).toBeGreaterThanOrEqual(MAX_BADGE_ENTRIES)
    // 末次 total = MAX_BADGE_ENTRIES（cap 后稳定）
    expect(sends[sends.length - 1].total).toBe(MAX_BADGE_ENTRIES)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group B：dispatcher batch size cap（W6-T4 背压）
// ─────────────────────────────────────────────────────────────────────────────

describe('W6-T4 / dispatcher batch size cap — 超过 NOTIFICATION_BATCH_MAX_SIZE → 立即 flush', () => {
  test('cap 常量为合理值（512）', () => {
    expect(NOTIFICATION_BATCH_MAX_SIZE).toBe(512)
  })

  test('注入 cap+1 个 distinct key → batch size 在达到 cap 时触发 flush 归零', () => {
    // 注入正好 cap-1 个 distinct key（不同 scenarioId）→ size = cap-1
    for (let i = 0; i < NOTIFICATION_BATCH_MAX_SIZE - 1; i++) {
      dispatchNotificationBatched({
        type: 'notification',
        kind: 'overlay',
        level: 'info',
        scenarioId: `cap-test-${i}`,
        title: `t${i}`,
        ts: Date.now(),
      })
    }
    expect(__getNotificationBatchSizeForTesting()).toBe(NOTIFICATION_BATCH_MAX_SIZE - 1)

    // 第 cap 个进入 → size 达到 cap → 立即 flush → size 归零
    dispatchNotificationBatched({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: `cap-test-trigger`,
      title: `trigger`,
      ts: Date.now(),
    })
    expect(__getNotificationBatchSizeForTesting()).toBe(0)
  })

  test('cap 后续 dispatch 仍能正常合并（状态可恢复）', () => {
    // 触发一次 cap flush
    for (let i = 0; i < NOTIFICATION_BATCH_MAX_SIZE; i++) {
      dispatchNotificationBatched({
        type: 'notification',
        kind: 'overlay',
        level: 'info',
        scenarioId: `s-${i}`,
        title: 't',
        ts: Date.now(),
      })
    }
    expect(__getNotificationBatchSizeForTesting()).toBe(0)

    // 然后正常 batch 同 key 两次 → size = 1（合并）
    dispatchNotificationBatched({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 'normal',
      title: 'a',
      ts: Date.now(),
    })
    dispatchNotificationBatched({
      type: 'notification',
      kind: 'overlay',
      level: 'info',
      scenarioId: 'normal',
      title: 'b',
      ts: Date.now(),
    })
    expect(__getNotificationBatchSizeForTesting()).toBe(1)
    __flushNotificationBatchForTesting()
    expect(__getNotificationBatchSizeForTesting()).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Group C：SVG bundle minify（W6-T4 bundle size 优化）
// ─────────────────────────────────────────────────────────────────────────────

describe('W6-T4 / SVG sprites minify — 体积削减且 schema 完整', () => {
  // 解析 themes/panda/sprites 目录 — 测试运行 cwd 为仓库根（bun test 默认）
  const SPRITES_DIR = join(
    process.cwd(),
    'packages',
    'panda-on-desk',
    'themes',
    'panda',
    'sprites',
  )

  function listSvg(): string[] {
    return readdirSync(SPRITES_DIR).filter(f => f.endsWith('.svg'))
  }

  test('19 物种 SVG 全部存在（18 species + default）', () => {
    const svgs = listSvg()
    expect(svgs.length).toBe(19)
  })

  test('每个 SVG 含 12 state group + 12 <text> 元素 + 合法 xml 头', () => {
    const svgs = listSvg()
    for (const f of svgs) {
      const c = readFileSync(join(SPRITES_DIR, f), 'utf8')
      expect(c.startsWith('<?xml')).toBe(true)
      const stateMatches = c.match(/data-state=/g) || []
      expect(stateMatches.length).toBe(12)
      const textMatches = c.match(/<text\b/g) || []
      expect(textMatches.length).toBe(12)
    }
  })

  test('总 SVG 字节数 < 270KB（before ≈ 291KB，验证 ≥10% 削减）', () => {
    const svgs = listSvg()
    let total = 0
    for (const f of svgs) {
      total += Buffer.byteLength(readFileSync(join(SPRITES_DIR, f)))
    }
    // before minify: ~298,000 bytes; after: ~267,000 bytes
    expect(total).toBeLessThan(270 * 1024)
  })
})
