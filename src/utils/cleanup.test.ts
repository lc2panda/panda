// Input: mock 30 天前的 dump-prompts/<id>.jsonl + 现在时间 jsonl
// Output: 验证 cleanupOldMessageFilesInBackground 调用后旧 jsonl 被删除、新 jsonl 保留
// Pos: src/utils/ 单元测试 — 守护 v2.25.53+ dump-prompts retention 不再漏（见
//      monitor/audit-pandacc-storage-2026-04-26.md）
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, utimesSync, existsSync, readdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

// 必须先设 PANDA_CONFIG_DIR 后 import — getClaudeConfigHomeDir 走 memoize 缓存
const __origPanda = process.env.PANDA_CONFIG_DIR
const __origClaude = process.env.CLAUDE_CONFIG_DIR
const __tmpHome = mkdtempSync(join(tmpdir(), 'pandacc-cleanup-test-'))
process.env.PANDA_CONFIG_DIR = __tmpHome
delete process.env.CLAUDE_CONFIG_DIR

const { cleanupOldMessageFilesInBackground } = await import('./cleanup.js')

afterAll(() => {
  rmSync(__tmpHome, { recursive: true, force: true })
  if (__origPanda === undefined) delete process.env.PANDA_CONFIG_DIR
  else process.env.PANDA_CONFIG_DIR = __origPanda
  if (__origClaude !== undefined) process.env.CLAUDE_CONFIG_DIR = __origClaude
})

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.now()

function setOldMtime(path: string, daysAgo: number): void {
  const t = (NOW - daysAgo * DAY) / 1000
  utimesSync(path, t, t)
}

describe('v2.25.53+ cleanup — dump-prompts retention 已加入', () => {
  beforeEach(() => {
    // 每次清掉再重建，避免别的 case 残留干扰
    const dir = join(__tmpHome, 'dump-prompts')
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
  })

  test('45 天前的 dump-prompts/<id>.jsonl → 被删除；今天的 → 保留', async () => {
    const dir = join(__tmpHome, 'dump-prompts')
    const old = join(dir, 'old-session.jsonl')
    const fresh = join(dir, 'fresh-session.jsonl')
    writeFileSync(old, '{"type":"init"}\n')
    writeFileSync(fresh, '{"type":"init"}\n')
    setOldMtime(old, 45)
    setOldMtime(fresh, 1)

    await cleanupOldMessageFilesInBackground()

    expect(existsSync(old)).toBe(false)
    expect(existsSync(fresh)).toBe(true)
  })

  test('全部 jsonl 都新 → 一个都不删', async () => {
    const dir = join(__tmpHome, 'dump-prompts')
    const a = join(dir, 'a.jsonl')
    const b = join(dir, 'b.jsonl')
    writeFileSync(a, '{}\n')
    writeFileSync(b, '{}\n')
    setOldMtime(a, 1)
    setOldMtime(b, 5)

    await cleanupOldMessageFilesInBackground()

    expect(existsSync(a)).toBe(true)
    expect(existsSync(b)).toBe(true)
  })

  test('混合：旧 jsonl 删除 + 不匹配扩展名（.txt）保留 + 子目录保留', async () => {
    const dir = join(__tmpHome, 'dump-prompts')
    const oldJsonl = join(dir, 'old.jsonl')
    const oldTxt = join(dir, 'old.txt') // 错的扩展，不在 cleanup 范围
    const subdir = join(dir, 'subdir')
    mkdirSync(subdir, { recursive: true })
    writeFileSync(oldJsonl, '{}\n')
    writeFileSync(oldTxt, 'log\n')
    setOldMtime(oldJsonl, 60)
    setOldMtime(oldTxt, 60)

    await cleanupOldMessageFilesInBackground()

    expect(existsSync(oldJsonl)).toBe(false)
    expect(existsSync(oldTxt)).toBe(true) // 不在 cleanup 范围
    expect(existsSync(subdir)).toBe(true)
    // dump-prompts 目录本身不应被删（removeEmptyDir=false）
    expect(existsSync(dir)).toBe(true)
  })

  test('dump-prompts 目录不存在 → cleanup 不抛错（首次启动场景）', async () => {
    const dir = join(__tmpHome, 'dump-prompts')
    rmSync(dir, { recursive: true, force: true })
    expect(existsSync(dir)).toBe(false)

    // 直接调用，无异常
    await cleanupOldMessageFilesInBackground()

    // 目录不存在仍不存在（cleanup 不会自动创建）
    expect(existsSync(dir)).toBe(false)
  })

  test('dump-prompts 目录存在但全空 → cleanup 后目录仍保留（不删空目录，避免抢着 unlink 正在使用的 jsonl 路径）', async () => {
    const dir = join(__tmpHome, 'dump-prompts')
    expect(readdirSync(dir).length).toBe(0)
    await cleanupOldMessageFilesInBackground()
    // removeEmptyDir=false 决定了即便空也保留
    expect(existsSync(dir)).toBe(true)
  })
})
