// Input: key-value 工作记忆写入/读取（可指定 global|project|session scope）
// Output: 分层持久化 working-memory.json (v2) + 注入安全聚合视图
// Pos: assistant/ 工作记忆层，跨 session 状态中枢（与 emotionalMemory 并列）
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

/**
 * Working Memory — 分层 scope（session / project / global）
 *
 * Schema v2:
 * {
 *   version: 2,
 *   updatedAt: number,
 *   global: Record<key, Entry>,
 *   projects: Record<slug, {
 *     sourcePath?: string,
 *     entries: Record<key, Entry>,
 *     sessions: Record<sessionId, { entries: Record<key, Entry> }>
 *   }>
 * }
 *
 * 兼容 API：
 *   setWorkingMemory(key, value, scope?)
 *   getWorkingMemory(key, scope?)
 *   deleteWorkingMemory(key, scope?)
 *   getAllWorkingMemory(opts?)
 *   clearWorkingMemory(scope?)  // 默认仅清当前 session
 *   getInjectedWorkingMemoryEntries()
 */

import { join } from 'path'
import { homedir } from 'os'
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  renameSync,
  unlinkSync,
  statSync,
} from 'fs'
import { checkAndRecoverJSON } from '../memdir/sqliteIntegrity.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkingMemoryScope = 'global' | 'project' | 'session'

export type WorkingMemoryEntry = {
  key: string
  value: string
  updatedAt: number
}

type StoredEntry = {
  value: string
  updatedAt: number
}

type ProjectBucket = {
  sourcePath?: string
  entries: Record<string, StoredEntry>
  sessions: Record<string, { entries: Record<string, StoredEntry> }>
}

type StoreV2 = {
  version: 2
  updatedAt: number
  global: Record<string, StoredEntry>
  projects: Record<string, ProjectBucket>
}

type LegacyEntry = {
  key: string
  value: string
  updatedAt: number
}

// ---------------------------------------------------------------------------
// Paths & limits
// ---------------------------------------------------------------------------

const MEMORY_DIR = join(homedir(), '.pandacc', 'assistant')
const MEMORY_FILE = join(MEMORY_DIR, 'working-memory.json')
const MEMORY_FILE_TMP = MEMORY_FILE + '.tmp'
const MEMORY_FILE_V1_BAK = MEMORY_FILE + '.v1-bak'
const TTL_MS = 24 * 60 * 60 * 1000

const LIMITS = {
  global: 50,
  project: 30,
  session: 20,
} as const

// ---------------------------------------------------------------------------
// Routing table (写死)
// ---------------------------------------------------------------------------

const SESSION_KEYS = new Set([
  'lastPrompt',
  'lastPromptTime',
  'sessionStartTime',
  'last-skill-execution',
  'clipboard-recent',
])

const PROJECT_KEYS = new Set([
  'currentProject',
  'code-health-failed',
])

const GLOBAL_KEYS = new Set([
  'os-notification-degraded',
  'im-unread-digest',
  'im-reverse-push-queue',
  'notification-urgent',
  'wechat-group-digest',
  'wechat-contact-insights',
  'wechat-sentiment',
  'wechat-monthly-report',
  'wechat-topic-tracker',
])

/** 前缀 → global（长前缀优先，语义上均 global） */
const GLOBAL_PREFIXES = [
  'wechat-situational-',
  'wechat-',
  'calendar-upcoming-',
] as const

/**
 * 按路由表解析 key 的默认 scope。
 * 未知 key → project。
 */
export function resolveWorkingMemoryScope(key: string): WorkingMemoryScope {
  if (SESSION_KEYS.has(key)) return 'session'
  if (PROJECT_KEYS.has(key)) return 'project'
  if (GLOBAL_KEYS.has(key)) return 'global'
  for (const prefix of GLOBAL_PREFIXES) {
    if (key.startsWith(prefix)) return 'global'
  }
  return 'project'
}

// ---------------------------------------------------------------------------
// Identity resolution（禁止 process.cwd()；lazy require 避免循环依赖）
// ---------------------------------------------------------------------------

function resolveProjectIdentity(): { slug: string; sourcePath: string } {
  let sourcePath = 'unknown'
  try {
    // lazy require：与现有 assistant 模块风格一致
    const state = require('../bootstrap/state.js') as {
      getProjectRoot: () => string
      getOriginalCwd: () => string
    }
    const root =
      (typeof state.getProjectRoot === 'function' && state.getProjectRoot()) ||
      (typeof state.getOriginalCwd === 'function' && state.getOriginalCwd()) ||
      ''
    if (root) sourcePath = root
  } catch {
    // keep unknown
  }
  let slug = 'unknown'
  try {
    const { sanitizePath } = require('../utils/sessionStoragePortable.js') as {
      sanitizePath: (p: string) => string
    }
    slug = sanitizePath(sourcePath)
  } catch {
    slug = sourcePath.replace(/[^a-zA-Z0-9]/g, '-') || 'unknown'
  }
  return { slug, sourcePath }
}

function resolveSessionId(): string {
  try {
    const state = require('../bootstrap/state.js') as {
      getSessionId: () => string
    }
    const id = state.getSessionId?.()
    if (id) return String(id)
  } catch {
    // fall through
  }
  return 'unknown-session'
}

// ---------------------------------------------------------------------------
// In-process cache（整文件一份；每次 API 用当前 project/session id 索引）
// ---------------------------------------------------------------------------

let cachedStore: StoreV2 | null = null
let cachedMtimeMs = 0

function emptyStore(): StoreV2 {
  return {
    version: 2,
    updatedAt: Date.now(),
    global: {},
    projects: {},
  }
}

function ensureProjectBucket(
  store: StoreV2,
  slug: string,
  sourcePath?: string,
): ProjectBucket {
  let bucket = store.projects[slug]
  if (!bucket) {
    bucket = { sourcePath, entries: {}, sessions: {} }
    store.projects[slug] = bucket
  } else if (sourcePath && !bucket.sourcePath) {
    bucket.sourcePath = sourcePath
  }
  return bucket
}

function ensureSessionBucket(
  project: ProjectBucket,
  sessionId: string,
): { entries: Record<string, StoredEntry> } {
  let session = project.sessions[sessionId]
  if (!session) {
    session = { entries: {} }
    project.sessions[sessionId] = session
  }
  return session
}

function isFresh(entry: StoredEntry, now: number): boolean {
  return now - entry.updatedAt < TTL_MS
}

/** 剔除过期条目；返回是否发生变更 */
function pruneExpired(store: StoreV2, now: number = Date.now()): boolean {
  let changed = false

  for (const key of Object.keys(store.global)) {
    if (!isFresh(store.global[key]!, now)) {
      delete store.global[key]
      changed = true
    }
  }

  for (const slug of Object.keys(store.projects)) {
    const project = store.projects[slug]!
    for (const key of Object.keys(project.entries)) {
      if (!isFresh(project.entries[key]!, now)) {
        delete project.entries[key]
        changed = true
      }
    }
    for (const sid of Object.keys(project.sessions)) {
      const session = project.sessions[sid]!
      for (const key of Object.keys(session.entries)) {
        if (!isFresh(session.entries[key]!, now)) {
          delete session.entries[key]
          changed = true
        }
      }
      if (Object.keys(session.entries).length === 0) {
        delete project.sessions[sid]
        changed = true
      }
    }
    if (
      Object.keys(project.entries).length === 0 &&
      Object.keys(project.sessions).length === 0
    ) {
      // 保留空 project 桶无意义，清理
      delete store.projects[slug]
      changed = true
    }
  }

  return changed
}

/** 分层上限：超出时按 updatedAt 升序丢最旧 */
function enforceLimit(
  map: Record<string, StoredEntry>,
  limit: number,
): void {
  const keys = Object.keys(map)
  if (keys.length <= limit) return
  const sorted = keys
    .map(k => ({ k, t: map[k]!.updatedAt }))
    .sort((a, b) => a.t - b.t)
  const drop = sorted.length - limit
  for (let i = 0; i < drop; i++) {
    delete map[sorted[i]!.k]
  }
}

// ---------------------------------------------------------------------------
// Migration v1 → v2
// ---------------------------------------------------------------------------

function isLegacyArray(data: unknown): data is LegacyEntry[] {
  return Array.isArray(data)
}

function migrateV1ToV2(
  entries: LegacyEntry[],
  project: { slug: string; sourcePath: string },
  sessionId: string,
): StoreV2 {
  const store = emptyStore()
  const now = Date.now()
  const projectBucket = ensureProjectBucket(store, project.slug, project.sourcePath)
  const sessionBucket = ensureSessionBucket(projectBucket, sessionId)

  for (const e of entries) {
    if (!e || typeof e.key !== 'string' || typeof e.value !== 'string') continue
    const updatedAt =
      typeof e.updatedAt === 'number' && Number.isFinite(e.updatedAt)
        ? e.updatedAt
        : now
    if (now - updatedAt >= TTL_MS) continue

    const scope = resolveWorkingMemoryScope(e.key)
    const stored: StoredEntry = { value: e.value, updatedAt }
    if (scope === 'global') {
      store.global[e.key] = stored
    } else if (scope === 'session') {
      sessionBucket.entries[e.key] = stored
    } else {
      projectBucket.entries[e.key] = stored
    }
  }

  enforceLimit(store.global, LIMITS.global)
  enforceLimit(projectBucket.entries, LIMITS.project)
  enforceLimit(sessionBucket.entries, LIMITS.session)
  store.updatedAt = now
  return store
}

function backupV1IfNeeded(raw: string): void {
  try {
    if (!existsSync(MEMORY_FILE_V1_BAK)) {
      // 优先从当前文件复制；若文件已被动过则用 raw 落盘
      if (existsSync(MEMORY_FILE)) {
        copyFileSync(MEMORY_FILE, MEMORY_FILE_V1_BAK)
      } else {
        writeFileSync(MEMORY_FILE_V1_BAK, raw, 'utf-8')
      }
    }
  } catch {
    // 备份失败不阻断迁移
  }
}

// ---------------------------------------------------------------------------
// Load / Save
// ---------------------------------------------------------------------------

function parseStore(raw: string): { store: StoreV2; migrated: boolean } {
  const data = JSON.parse(raw) as unknown
  const project = resolveProjectIdentity()
  const sessionId = resolveSessionId()

  if (isLegacyArray(data)) {
    backupV1IfNeeded(raw)
    return {
      store: migrateV1ToV2(data, project, sessionId),
      migrated: true,
    }
  }

  if (
    data &&
    typeof data === 'object' &&
    (data as StoreV2).version === 2 &&
    typeof (data as StoreV2).global === 'object' &&
    typeof (data as StoreV2).projects === 'object'
  ) {
    const v2 = data as StoreV2
    // 防御缺字段
    if (!v2.global) v2.global = {}
    if (!v2.projects) v2.projects = {}
    return { store: v2, migrated: false }
  }

  // 未知结构：空仓
  return { store: emptyStore(), migrated: false }
}

function load(): StoreV2 {
  try {
    if (existsSync(MEMORY_FILE)) {
      const mtimeMs = statSync(MEMORY_FILE).mtimeMs
      if (cachedStore && cachedMtimeMs === mtimeMs) {
        // 即使命中缓存也做 TTL 裁剪（不强制写盘，避免热路径抖动）
        pruneExpired(cachedStore)
        return cachedStore
      }

      checkAndRecoverJSON(MEMORY_FILE)
      const raw = readFileSync(MEMORY_FILE, 'utf-8')
      const { store, migrated } = parseStore(raw)
      const pruned = pruneExpired(store)
      if (migrated || pruned) {
        save(store)
      } else {
        cachedStore = store
        cachedMtimeMs = mtimeMs
      }
      return store
    }
  } catch {
    // fall through to empty
  }
  const store = emptyStore()
  cachedStore = store
  cachedMtimeMs = 0
  return store
}

function save(store: StoreV2): void {
  try {
    if (!existsSync(MEMORY_DIR)) {
      mkdirSync(MEMORY_DIR, { recursive: true })
    }
    store.version = 2
    store.updatedAt = Date.now()
    // 原子写：tmp → rename
    writeFileSync(MEMORY_FILE_TMP, JSON.stringify(store, null, 2), 'utf-8')
    try {
      renameSync(MEMORY_FILE_TMP, MEMORY_FILE)
    } catch {
      // Windows 等环境 rename 覆盖可能失败，回退直接写
      writeFileSync(MEMORY_FILE, JSON.stringify(store, null, 2), 'utf-8')
      try {
        if (existsSync(MEMORY_FILE_TMP)) unlinkSync(MEMORY_FILE_TMP)
      } catch {
        // ignore tmp cleanup
      }
    }
    cachedStore = store
    try {
      cachedMtimeMs = statSync(MEMORY_FILE).mtimeMs
    } catch {
      cachedMtimeMs = Date.now()
    }
  } catch {
    // 持久化失败：仍更新内存缓存，保证进程内一致
    cachedStore = store
  }
}

// ---------------------------------------------------------------------------
// Entry access helpers
// ---------------------------------------------------------------------------

function readFromScope(
  store: StoreV2,
  key: string,
  scope: WorkingMemoryScope,
  project: { slug: string; sourcePath: string },
  sessionId: string,
): StoredEntry | undefined {
  if (scope === 'global') {
    return store.global[key]
  }
  const bucket = store.projects[project.slug]
  if (!bucket) return undefined
  if (scope === 'project') {
    return bucket.entries[key]
  }
  // session
  return bucket.sessions[sessionId]?.entries[key]
}

function writeToScope(
  store: StoreV2,
  key: string,
  scope: WorkingMemoryScope,
  project: { slug: string; sourcePath: string },
  sessionId: string,
  entry: StoredEntry,
): void {
  if (scope === 'global') {
    store.global[key] = entry
    enforceLimit(store.global, LIMITS.global)
    return
  }
  const bucket = ensureProjectBucket(store, project.slug, project.sourcePath)
  if (scope === 'project') {
    bucket.entries[key] = entry
    enforceLimit(bucket.entries, LIMITS.project)
    return
  }
  const session = ensureSessionBucket(bucket, sessionId)
  session.entries[key] = entry
  enforceLimit(session.entries, LIMITS.session)
}

function deleteFromScope(
  store: StoreV2,
  key: string,
  scope: WorkingMemoryScope,
  project: { slug: string; sourcePath: string },
  sessionId: string,
): boolean {
  if (scope === 'global') {
    if (key in store.global) {
      delete store.global[key]
      return true
    }
    return false
  }
  const bucket = store.projects[project.slug]
  if (!bucket) return false
  if (scope === 'project') {
    if (key in bucket.entries) {
      delete bucket.entries[key]
      return true
    }
    return false
  }
  const session = bucket.sessions[sessionId]
  if (session && key in session.entries) {
    delete session.entries[key]
    return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * 写入工作记忆。未指定 scope 时按路由表落层。
 * 签名兼容：setWorkingMemory(key, value)
 */
export function setWorkingMemory(
  key: string,
  value: string,
  scope?: WorkingMemoryScope,
): void {
  const store = load()
  const project = resolveProjectIdentity()
  const sessionId = resolveSessionId()
  const target = scope ?? resolveWorkingMemoryScope(key)
  writeToScope(store, key, target, project, sessionId, {
    value,
    updatedAt: Date.now(),
  })
  save(store)
}

/**
 * 读取工作记忆。未指定 scope 时按路由表定位；
 * 迁移期 fallback：session → project → global（仅 get）。
 */
export function getWorkingMemory(
  key: string,
  scope?: WorkingMemoryScope,
): string | undefined {
  const store = load()
  const project = resolveProjectIdentity()
  const sessionId = resolveSessionId()
  const now = Date.now()

  const tryScope = (s: WorkingMemoryScope): string | undefined => {
    const entry = readFromScope(store, key, s, project, sessionId)
    if (entry && isFresh(entry, now)) return entry.value
    return undefined
  }

  if (scope) {
    return tryScope(scope)
  }

  const primary = resolveWorkingMemoryScope(key)
  const hit = tryScope(primary)
  if (hit !== undefined) return hit

  // 迁移期 fallback：session → project → global（跳过已试 primary）
  for (const s of ['session', 'project', 'global'] as const) {
    if (s === primary) continue
    const v = tryScope(s)
    if (v !== undefined) return v
  }
  return undefined
}

/**
 * 删除工作记忆条目。未指定 scope 时按路由表定位（不跨层扫删）。
 */
export function deleteWorkingMemory(
  key: string,
  scope?: WorkingMemoryScope,
): void {
  const store = load()
  const project = resolveProjectIdentity()
  const sessionId = resolveSessionId()
  const target = scope ?? resolveWorkingMemoryScope(key)
  if (deleteFromScope(store, key, target, project, sessionId)) {
    save(store)
  }
}

/**
 * 聚合视图：global + 当前 project entries + 当前 session。
 * forInjection: true 时同样集合（避免 dream / 注入泄漏他 session）。
 * 默认行为与 forInjection 相同安全集合。
 */
export function getAllWorkingMemory(opts?: {
  forInjection?: boolean
}): WorkingMemoryEntry[] {
  // opts.forInjection 保留参数以便调用方显式声明意图；当前与默认同集
  void opts
  const store = load()
  const project = resolveProjectIdentity()
  const sessionId = resolveSessionId()
  const now = Date.now()
  const out: WorkingMemoryEntry[] = []

  for (const [key, entry] of Object.entries(store.global)) {
    if (isFresh(entry, now)) {
      out.push({ key, value: entry.value, updatedAt: entry.updatedAt })
    }
  }

  const bucket = store.projects[project.slug]
  if (bucket) {
    for (const [key, entry] of Object.entries(bucket.entries)) {
      if (isFresh(entry, now)) {
        out.push({ key, value: entry.value, updatedAt: entry.updatedAt })
      }
    }
    const session = bucket.sessions[sessionId]
    if (session) {
      for (const [key, entry] of Object.entries(session.entries)) {
        if (isFresh(entry, now)) {
          out.push({ key, value: entry.value, updatedAt: entry.updatedAt })
        }
      }
    }
  }

  // 新→旧，便于注入截断时保留新鲜项
  out.sort((a, b) => b.updatedAt - a.updatedAt)
  return out
}

/**
 * 注入专用：global + 当前 project + 当前 session。
 * volatile 过滤可在 context 侧完成。
 */
export function getInjectedWorkingMemoryEntries(): WorkingMemoryEntry[] {
  return getAllWorkingMemory({ forInjection: true })
}

/**
 * 清理工作记忆。
 * - 默认 / 'session'：仅清当前 session（禁止误清 global）
 * - 'project'：清当前 project entries + 其下全部 sessions
 * - 'global'：仅清 global
 * - 'all'：整仓重置
 */
export function clearWorkingMemory(
  scope: WorkingMemoryScope | 'all' = 'session',
): void {
  const store = load()
  const project = resolveProjectIdentity()
  const sessionId = resolveSessionId()

  if (scope === 'all') {
    save(emptyStore())
    return
  }

  if (scope === 'global') {
    store.global = {}
    save(store)
    return
  }

  if (scope === 'project') {
    const bucket = store.projects[project.slug]
    if (bucket) {
      bucket.entries = {}
      bucket.sessions = {}
    }
    save(store)
    return
  }

  // session（默认）
  const bucket = store.projects[project.slug]
  if (bucket?.sessions[sessionId]) {
    delete bucket.sessions[sessionId]
    save(store)
  }
}

/** 测试用：丢弃进程内缓存，强制下次从磁盘重读 */
export function __resetWorkingMemoryCacheForTests(): void {
  cachedStore = null
  cachedMtimeMs = 0
}

/** 测试/诊断用：暴露路径 */
export function __getWorkingMemoryPathsForTests(): {
  file: string
  v1Bak: string
  dir: string
} {
  return { file: MEMORY_FILE, v1Bak: MEMORY_FILE_V1_BAK, dir: MEMORY_DIR }
}
