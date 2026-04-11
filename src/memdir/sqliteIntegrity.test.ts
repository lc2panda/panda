import { test, expect, beforeEach } from 'bun:test'
import { checkAndRecoverSQLite, checkAndRecoverJSON } from './sqliteIntegrity.js'
import { writeFileSync, existsSync, unlinkSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { Database } from 'bun:sqlite'

const TMP = join(tmpdir(), 'panda-integrity-test')

beforeEach(() => {
  try {
    if (existsSync(TMP)) {
      const files = readdirSync(TMP)
      for (const f of files) try { unlinkSync(join(TMP, f)) } catch {}
    } else {
      mkdirSync(TMP, { recursive: true })
    }
  } catch {}
})

test('checkAndRecoverSQLite — :memory: 总是 ok', () => {
  const result = checkAndRecoverSQLite(':memory:')
  expect(result.ok).toBe(true)
  expect(result.recovered).toBe(false)
})

test('checkAndRecoverSQLite — 不存在的文件 ok', () => {
  const result = checkAndRecoverSQLite(join(TMP, 'not-exist.db'))
  expect(result.ok).toBe(true)
})

test('checkAndRecoverSQLite — 健康数据库返回 ok', () => {
  const dbPath = join(TMP, 'healthy.db')
  const db = new Database(dbPath)
  db.run('CREATE TABLE foo (id INTEGER)')
  db.run('INSERT INTO foo VALUES (1)')
  db.close()

  const result = checkAndRecoverSQLite(dbPath)
  expect(result.ok).toBe(true)
  expect(existsSync(dbPath)).toBe(true)
})

test('checkAndRecoverSQLite — 故意损坏文件触发自愈', () => {
  const dbPath = join(TMP, 'broken.db')
  writeFileSync(dbPath, 'this is not a sqlite database', 'utf-8')

  const result = checkAndRecoverSQLite(dbPath)
  expect(result.ok).toBe(false)
  expect(result.recovered).toBe(true)
  expect(result.recoveryAction).toBe('backed-up')
  expect(existsSync(dbPath)).toBe(false)
})

test('checkAndRecoverJSON — 健康 JSON ok', () => {
  const filePath = join(TMP, 'good.json')
  writeFileSync(filePath, '{"a": 1}', 'utf-8')

  const result = checkAndRecoverJSON(filePath)
  expect(result.ok).toBe(true)
  expect(existsSync(filePath)).toBe(true)
})

test('checkAndRecoverJSON — 不存在的文件 ok', () => {
  const result = checkAndRecoverJSON(join(TMP, 'not-exist.json'))
  expect(result.ok).toBe(true)
})

test('checkAndRecoverJSON — 空文件 ok', () => {
  const filePath = join(TMP, 'empty.json')
  writeFileSync(filePath, '', 'utf-8')
  expect(checkAndRecoverJSON(filePath).ok).toBe(true)
})

test('checkAndRecoverJSON — 损坏 JSON 触发自愈', () => {
  const filePath = join(TMP, 'broken.json')
  writeFileSync(filePath, '{invalid json{', 'utf-8')

  const result = checkAndRecoverJSON(filePath)
  expect(result.ok).toBe(false)
  expect(result.recovered).toBe(true)
  expect(result.recoveryAction).toBe('backed-up')
  expect(existsSync(filePath)).toBe(false)
})
