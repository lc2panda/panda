// Auto-generated stub — replaced with persistent implementation (Phase 1.5)
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

interface WorkingMemoryEntry {
  key: string
  value: string
  updatedAt: number
}

const MAX_ENTRIES = 50
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const PERSIST_DIR = join(homedir(), '.pandacc', 'assistant')
const PERSIST_PATH = join(PERSIST_DIR, 'working-memory.json')

let _entries: Map<string, WorkingMemoryEntry> | null = null

function load(): Map<string, WorkingMemoryEntry> {
  if (_entries !== null) return _entries
  _entries = new Map()
  // 完整性校验：损坏的 JSON 会被重命名为 .broken-<timestamp>，上层回退到空 Map
  try {
    const { checkAndRecoverJSON } = require('../memdir/sqliteIntegrity.js')
    checkAndRecoverJSON(PERSIST_PATH)
  } catch {}
  try {
    const raw = readFileSync(PERSIST_PATH, 'utf-8')
    const arr = JSON.parse(raw) as WorkingMemoryEntry[]
    if (Array.isArray(arr)) {
      for (const e of arr) _entries.set(e.key, e)
    }
  } catch {
    // first run or corrupted — start empty
  }
  return _entries
}

function save(): void {
  try {
    mkdirSync(PERSIST_DIR, { recursive: true })
    writeFileSync(PERSIST_PATH, JSON.stringify(Array.from(load().values()), null, 2))
  } catch {
    // silently ignore write errors
  }
}

function isExpired(entry: WorkingMemoryEntry): boolean {
  return Date.now() - entry.updatedAt > TTL_MS
}

function evictIfNeeded(): void {
  const entries = load()
  if (entries.size <= MAX_ENTRIES) return
  const sorted = Array.from(entries.entries()).sort(
    (a, b) => a[1].updatedAt - b[1].updatedAt,
  )
  while (sorted.length > MAX_ENTRIES) {
    const oldest = sorted.shift()!
    entries.delete(oldest[0])
  }
}

export function setWorkingMemory(key: string, value: string) {
  const entries = load()
  entries.set(key, { key, value, updatedAt: Date.now() })
  evictIfNeeded()
  save()
}

export function getWorkingMemory(key: string) {
  const entry = load().get(key)
  if (!entry) return undefined
  if (isExpired(entry)) {
    load().delete(key)
    save()
    return undefined
  }
  return entry.value
}

export function getAllWorkingMemory() {
  const now = Date.now()
  const entries = load()
  const result: WorkingMemoryEntry[] = []
  let changed = false
  for (const [k, e] of entries) {
    if (now - e.updatedAt > TTL_MS) {
      entries.delete(k)
      changed = true
    } else {
      result.push(e)
    }
  }
  if (changed) save()
  return result
}

export function clearWorkingMemory() {
  const entries = load()
  entries.clear()
  save()
}

export function deleteWorkingMemory(key: string) {
  const entries = load()
  if (entries.delete(key)) save()
}

export function getRelevantMemory(context: string): WorkingMemoryEntry[] {
  const all = getAllWorkingMemory()
  if (!context || context.length < 3) return all.slice(0, 10)
  const ctx = context.toLowerCase()
  // 按相关性排序：key 或 value 包含上下文关键词的优先
  return all
    .map(e => {
      let score = 0
      if (ctx.includes(e.key.toLowerCase())) score += 2
      if (typeof e.value === 'string' && ctx.includes(e.value.slice(0, 50).toLowerCase())) score += 1
      // 语义 key 加分
      if (['currentProject', 'recentFiles', 'lastToolChain'].includes(e.key)) score += 1
      return { ...e, _score: score }
    })
    .sort((a, b) => (b as any)._score - (a as any)._score)
    .slice(0, 10)
    .map(({ _score, ...rest }) => rest) as WorkingMemoryEntry[]
}
