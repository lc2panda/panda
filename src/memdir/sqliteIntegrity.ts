// Input: SQLite database file path or JSON persistence file path
// Output: integrity check result + auto-recovery (rename corrupted file, let caller rebuild)
// Pos: defensive layer for FTS5 / future persistent SQLite / critical JSON state files
//
// IMPORTANT: bun:sqlite 必须用函数内 require() 而非顶层 import。
// 否则 Bun build 会把 import 'bun:sqlite' 留在 dist/cli.js 顶部，
// Node.js ESM loader 不认识 bun: 协议会直接抛 ERR_UNSUPPORTED_ESM_URL_SCHEME。
// 复用 src/connectors/wechat/index.ts:899 同款 require 模式。

import { existsSync, readFileSync, renameSync } from 'fs'

export interface IntegrityResult {
  ok: boolean
  errors: string[]
  recovered: boolean
  recoveryAction?: 'none' | 'rebuilt' | 'backed-up'
}

/**
 * 对一个 SQLite 数据库做 PRAGMA integrity_check 并尝试自愈。
 * - ok → 直接返回
 * - 损坏 → 重命名为 <path>.broken-<timestamp>，让上层重建
 * - :memory: 与不存在的文件视为 ok（无需校验）
 */
export function checkAndRecoverSQLite(dbPath: string): IntegrityResult {
  if (dbPath === ':memory:') {
    return { ok: true, errors: [], recovered: false, recoveryAction: 'none' }
  }

  if (!existsSync(dbPath)) {
    return { ok: true, errors: [], recovered: false, recoveryAction: 'none' }
  }

  // 函数内 require 避免顶层 import 'bun:sqlite' 污染 ESM bundle
  let Database: typeof import('bun:sqlite').Database
  try {
    Database = (require('bun:sqlite') as typeof import('bun:sqlite')).Database
  } catch {
    // 非 Bun runtime（用户用 node 跑） → SQLite 校验功能不可用，但不应阻止启动
    return { ok: true, errors: [], recovered: false, recoveryAction: 'none' }
  }

  const errors: string[] = []
  let db: InstanceType<typeof Database> | null = null

  try {
    db = new Database(dbPath, { readonly: true })
    const result = db.query('PRAGMA integrity_check').all() as Array<{ integrity_check: string }>

    // 期望 [{ integrity_check: 'ok' }]
    if (result.length === 1 && result[0].integrity_check === 'ok') {
      db.close()
      return { ok: true, errors: [], recovered: false, recoveryAction: 'none' }
    }

    for (const row of result) {
      errors.push(row.integrity_check)
    }

    db.close()
    db = null

    return backupCorruptedFile(dbPath, errors)
  } catch (e) {
    if (db) {
      try { db.close() } catch {}
    }
    errors.push((e as Error).message)
    return backupCorruptedFile(dbPath, errors)
  } finally {
    if (db) {
      try { db.close() } catch {}
    }
  }
}

/**
 * 对一个 JSON 持久化文件做 parse 校验，损坏自动备份。
 * - 空文件视为 ok
 * - 不存在视为 ok
 */
export function checkAndRecoverJSON(filePath: string): IntegrityResult {
  if (!existsSync(filePath)) {
    return { ok: true, errors: [], recovered: false, recoveryAction: 'none' }
  }

  try {
    const content = readFileSync(filePath, 'utf-8')
    if (content.trim() === '') {
      return { ok: true, errors: [], recovered: false, recoveryAction: 'none' }
    }
    JSON.parse(content)
    return { ok: true, errors: [], recovered: false, recoveryAction: 'none' }
  } catch (e) {
    return backupCorruptedFile(filePath, [(e as Error).message])
  }
}

function backupCorruptedFile(filePath: string, errors: string[]): IntegrityResult {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const brokenPath = `${filePath}.broken-${timestamp}`
    renameSync(filePath, brokenPath)
    return {
      ok: false,
      errors,
      recovered: true,
      recoveryAction: 'backed-up',
    }
  } catch {
    return {
      ok: false,
      errors,
      recovered: false,
      recoveryAction: 'none',
    }
  }
}
