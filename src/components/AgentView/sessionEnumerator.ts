// Input: ~/.pandacc/sessions/*.json + jobs/roster.json + ~/.pandacc/projects/<key>/<sid>.jsonl 末尾
// Output: SessionEntry[]（已排序）供 Dashboard 渲染
// Pos: src/components/AgentView/ —— 视图层与持久化层之间的合并器

import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'
import { errorMessage, isFsInaccessible } from '../../utils/errors.js'
import { isProcessRunning } from '../../utils/genericProcessUtils.js'
import { jsonParse } from '../../utils/slowOperations.js'
import { sanitizePath } from '../../utils/path.js'
import { logForDebugging } from '../../utils/debug.js'
import { readRoster } from './roster.js'
import type {
  RosterEntry,
  SessionEntry,
  SessionShape,
  SessionStatus,
} from './types.js'

type PidFileData = {
  pid: number
  sessionId: string
  cwd: string
  startedAt: number
  kind?: string
  name?: string
  status?: 'busy' | 'idle' | 'waiting'
  waitingFor?: string
  updatedAt?: number
  agent?: string
}

function getSessionsDir(): string {
  return join(getClaudeConfigHomeDir(), 'sessions')
}

function getProjectsDir(): string {
  return join(getClaudeConfigHomeDir(), 'projects')
}

/**
 * Read all PID files. Stale (process not running) entries are skipped.
 * Errors per-file are logged but do not abort the enumeration.
 */
async function readLivePidFiles(): Promise<PidFileData[]> {
  const dir = getSessionsDir()
  let files: string[]
  try {
    files = await readdir(dir)
  } catch (e) {
    if (!isFsInaccessible(e)) {
      logForDebugging(`[agentView] readdir sessions failed: ${errorMessage(e)}`)
    }
    return []
  }

  const result: PidFileData[] = []
  for (const file of files) {
    if (!/^\d+\.json$/.test(file)) continue
    const pid = parseInt(file.slice(0, -5), 10)
    // Always include current process (probe-self always returns false on
    // some platforms; cheap to just trust the file is fresh).
    if (pid !== process.pid && !isProcessRunning(pid)) continue
    try {
      const raw = await readFile(join(dir, file), 'utf8')
      const data = jsonParse(raw) as PidFileData
      if (data && typeof data.pid === 'number') {
        result.push(data)
      }
    } catch (e) {
      logForDebugging(`[agentView] read ${file} failed: ${errorMessage(e)}`)
    }
  }
  return result
}

/**
 * Read the LAST user/assistant message text from a transcript jsonl.
 * Reads from the tail (≤8KB) and returns a short summary. Never throws.
 */
async function readLastMessageSnippet(
  sessionId: string,
  cwd: string,
): Promise<string> {
  const key = sanitizePath(cwd)
  const path = join(getProjectsDir(), key, `${sessionId}.jsonl`)
  try {
    const st = await stat(path)
    if (st.size === 0) return ''
    const buf = await readFile(path, 'utf8')
    // Tail-only: split by line, scan from the end for first user/assistant entry
    const lines = buf.split('\n').reverse()
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const entry = jsonParse(line) as {
          message?: { role?: string; content?: unknown }
        }
        const role = entry?.message?.role
        if (role !== 'user' && role !== 'assistant') continue
        const content = entry.message?.content
        let text = ''
        if (typeof content === 'string') {
          text = content
        } else if (Array.isArray(content)) {
          for (const block of content as Array<{
            type?: string
            text?: string
          }>) {
            if (block?.type === 'text' && typeof block.text === 'string') {
              text = block.text
              break
            }
          }
        }
        text = text.replace(/\s+/g, ' ').trim()
        if (text) {
          return text.length > 120 ? text.slice(0, 117) + '...' : text
        }
      } catch {
        // skip malformed line
      }
    }
    return ''
  } catch (e) {
    if (!isFsInaccessible(e)) {
      logForDebugging(
        `[agentView] tail ${sessionId} failed: ${errorMessage(e)}`,
      )
    }
    return ''
  }
}

function pidStatusToSessionStatus(s?: string): SessionStatus {
  switch (s) {
    case 'busy':
      return 'working'
    case 'waiting':
      return 'waiting'
    case 'idle':
      return 'idle'
    default:
      return 'idle'
  }
}

/**
 * Merge a live PID file with optional roster entry → SessionEntry.
 */
async function toEntryFromPid(
  pid: PidFileData,
  roster: RosterEntry | undefined,
): Promise<SessionEntry> {
  const sessionId = pid.sessionId
  const lastMessage = await readLastMessageSnippet(sessionId, pid.cwd)
  return {
    id: roster?.id ?? `pid:${pid.pid}`,
    displayName: roster?.name ?? sessionId.slice(0, 8),
    sessionId,
    pid: pid.pid,
    status: pidStatusToSessionStatus(pid.status),
    shape: 'alive',
    cwd: pid.cwd,
    startedAt: pid.startedAt,
    lastMessage,
    pinned: roster?.pinned ?? false,
    prStatus: null,
    waitingFor: pid.waitingFor,
    notes: roster?.notes,
  }
}

/**
 * Roster-only entry (no live PID file) → SessionEntry with exited shape.
 */
async function toEntryFromRoster(r: RosterEntry): Promise<SessionEntry> {
  const lastMessage = r.sessionId
    ? await readLastMessageSnippet(r.sessionId, r.cwd)
    : ''
  return {
    id: r.id,
    displayName: r.name,
    sessionId: r.sessionId,
    pid: null,
    status: r.lastStatus ?? 'stopped',
    shape: 'exited',
    cwd: r.cwd,
    startedAt: r.createdAt,
    lastMessage,
    pinned: r.pinned,
    prStatus: null,
    notes: r.notes,
  }
}

/**
 * Default sort:
 *  pinned ↓ → status priority (working>waiting>idle>completed>failed>stopped) → startedAt ↓
 */
function statusPriority(s: SessionStatus): number {
  switch (s) {
    case 'working':
      return 6
    case 'waiting':
      return 5
    case 'idle':
      return 4
    case 'completed':
      return 3
    case 'failed':
      return 2
    case 'stopped':
      return 1
  }
}

function sortEntries(entries: SessionEntry[]): SessionEntry[] {
  return [...entries].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    const sp = statusPriority(b.status) - statusPriority(a.status)
    if (sp !== 0) return sp
    return b.startedAt - a.startedAt
  })
}

/**
 * Build the merged SessionEntry list for dashboard rendering.
 * Self-PID is filtered out: dashboard process shouldn't list itself.
 */
export async function enumerateSessions(): Promise<SessionEntry[]> {
  const [pidFiles, roster] = await Promise.all([
    readLivePidFiles(),
    readRoster(),
  ])
  const filtered = pidFiles.filter(p => p.pid !== process.pid)

  // Build a sessionId→rosterEntry map so live sessions can pick up names/pin.
  const rosterBySession = new Map<string, RosterEntry>()
  const rosterById = new Map<string, RosterEntry>()
  for (const r of roster.entries) {
    rosterById.set(r.id, r)
    if (r.sessionId) rosterBySession.set(r.sessionId, r)
  }

  const liveEntries = await Promise.all(
    filtered.map(p => toEntryFromPid(p, rosterBySession.get(p.sessionId))),
  )

  // Roster-only: entries whose sessionId is not in any live PID file.
  const liveSessionIds = new Set(filtered.map(p => p.sessionId))
  const rosterOnlyEntries = await Promise.all(
    roster.entries
      .filter(r => !r.sessionId || !liveSessionIds.has(r.sessionId))
      .map(toEntryFromRoster),
  )

  return sortEntries([...liveEntries, ...rosterOnlyEntries])
}

export const _internal = {
  readLivePidFiles,
  readLastMessageSnippet,
  toEntryFromPid,
  toEntryFromRoster,
  sortEntries,
  statusPriority,
}
