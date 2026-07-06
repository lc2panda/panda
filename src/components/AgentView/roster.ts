// Input: dashboard 操作（pin/rename/add/touch/remove）
// Output: ~/.pandacc/jobs/roster.json 原子写入（proper-lockfile 保护）
// Pos: src/components/AgentView/ —— Tier 1 jobs 注册表的唯一读写入口
//
// 与 src/utils/concurrentSessions.ts 的区别：
//  - concurrentSessions 写 ~/.pandacc/sessions/<pid>.json（每个 panda 进程自己维护）
//  - roster 写 ~/.pandacc/jobs/roster.json（用户在 dashboard 主动收藏/命名/笔记）
//  - dashboard 在视图层合并两者

import { mkdir, readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import lockfile from 'proper-lockfile'
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'
import { logForDebugging } from '../../utils/debug.js'
import { errorMessage, isFsInaccessible } from '../../utils/errors.js'
import { jsonParse, jsonStringify } from '../../utils/slowOperations.js'
import type { RosterEntry, RosterFile, SessionStatus } from './types.js'

const ROSTER_VERSION = 1 as const
const LOCKFILE_STALE_MS = 10_000
const LOCKFILE_RETRIES = 5

function getJobsDir(): string {
  const configHome = process.env.PANDA_CONFIG_DIR ?? process.env.CLAUDE_CONFIG_DIR ?? getClaudeConfigHomeDir()
  return join(configHome, 'jobs')
}

function getRosterPath(): string {
  return join(getJobsDir(), 'roster.json')
}

async function ensureJobsDir(): Promise<void> {
  const dir = getJobsDir()
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true, mode: 0o700 })
  }
}

/**
 * Empty default roster used when file is missing or corrupt.
 */
function emptyRoster(): RosterFile {
  return { version: ROSTER_VERSION, entries: [] }
}

/**
 * Read roster (no lock — fast, used by view layer every refresh).
 * Returns empty roster on any error: missing file = first run; corrupt =
 * caller can still operate, next write will overwrite. ENOENT is silent
 * (expected first-run), other errors logged to debug.
 */
export async function readRoster(): Promise<RosterFile> {
  const path = getRosterPath()
  try {
    const raw = await readFile(path, 'utf8')
    const parsed = jsonParse(raw) as Partial<RosterFile>
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.version !== ROSTER_VERSION ||
      !Array.isArray(parsed.entries)
    ) {
      return emptyRoster()
    }
    return { version: ROSTER_VERSION, entries: parsed.entries }
  } catch (e) {
    if (!isFsInaccessible(e)) {
      logForDebugging(`[agentView/roster] read failed: ${errorMessage(e)}`)
    }
    return emptyRoster()
  }
}

/**
 * Atomic mutation: takes a transformer that produces the new roster file.
 * Guards with proper-lockfile so concurrent dashboard processes (or other
 * tooling) don't clobber each other.
 */
async function withRosterLock(
  mutate: (current: RosterFile) => RosterFile,
): Promise<RosterFile> {
  await ensureJobsDir()
  const path = getRosterPath()
  // Touch file before locking (proper-lockfile needs target to exist).
  if (!existsSync(path)) {
    await writeFile(path, jsonStringify(emptyRoster()), { mode: 0o600 })
  }
  let release: (() => Promise<void>) | null = null
  try {
    release = await lockfile.lock(path, {
      retries: LOCKFILE_RETRIES,
      stale: LOCKFILE_STALE_MS,
    })
    const current = await readRoster()
    const next = mutate(current)
    await writeFile(path, jsonStringify(next), { mode: 0o600 })
    return next
  } catch (e) {
    logForDebugging(`[agentView/roster] write failed: ${errorMessage(e)}`)
    throw e
  } finally {
    if (release) {
      try {
        await release()
      } catch {
        // best-effort release
      }
    }
  }
}

/** Insert or update a roster entry (idempotent on id). */
export async function upsertRosterEntry(
  entry: RosterEntry,
): Promise<RosterFile> {
  return withRosterLock(roster => {
    const idx = roster.entries.findIndex(e => e.id === entry.id)
    const next =
      idx >= 0
        ? [
            ...roster.entries.slice(0, idx),
            { ...roster.entries[idx], ...entry },
            ...roster.entries.slice(idx + 1),
          ]
        : [...roster.entries, entry]
    return { ...roster, entries: next }
  })
}

/** Remove an entry by id. */
export async function removeRosterEntry(id: string): Promise<RosterFile> {
  return withRosterLock(roster => ({
    ...roster,
    entries: roster.entries.filter(e => e.id !== id),
  }))
}

/** Toggle the pinned flag. */
export async function togglePinned(id: string): Promise<RosterFile> {
  return withRosterLock(roster => ({
    ...roster,
    entries: roster.entries.map(e =>
      e.id === id ? { ...e, pinned: !e.pinned } : e,
    ),
  }))
}

/** Rename an entry. Name is trimmed; empty names refuse silently. */
export async function renameEntry(
  id: string,
  newName: string,
): Promise<RosterFile> {
  const name = newName.trim()
  if (!name) {
    return readRoster()
  }
  return withRosterLock(roster => ({
    ...roster,
    entries: roster.entries.map(e => (e.id === id ? { ...e, name } : e)),
  }))
}

/** Update lastSeenAt + lastStatus (called when dashboard observes a session). */
export async function touchEntry(
  id: string,
  patch: {
    lastSeenAt?: number
    lastStatus?: SessionStatus
    sessionId?: string | null
  },
): Promise<void> {
  await withRosterLock(roster => ({
    ...roster,
    entries: roster.entries.map(e => (e.id === id ? { ...e, ...patch } : e)),
  }))
}

export const _internal = {
  getJobsDir,
  getRosterPath,
  ROSTER_VERSION,
}
