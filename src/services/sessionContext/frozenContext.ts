// Input: session lifecycle calls (start / reset) + disk file contents
// Output: byte-stable session context for prefix cache hit (Hermes P0-4)
// Pos: defensive layer wrapping CLAUDE.md / MEMORY.md / profile.md disk reads
//
// Why: Anthropic/OpenAI/Bedrock prefix cache hits depend on byte-identical
// system prompts across turns. Mid-session events such as settings sync,
// team memory sync, or compaction clear the memoize layer under
// getMemoryFiles() → subsequent reads re-hit disk → file mtime/whitespace
// drift breaks cache → 90% cost saving evaporates. This module captures
// the exact bytes at session start and keeps returning them even when
// memoize caches are invalidated mid-session. Writes still persist to
// disk immediately (user never loses data) but only take effect on the
// NEXT session, exactly matching Hermes Agent's design.

import { logForDebugging } from '../../utils/debug.js'
import { normalize, resolve } from 'path'

interface FrozenSnapshot {
  readonly filePath: string
  readonly content: string
  readonly frozenAt: number
  readonly bytes: number
}

const _frozenFiles = new Map<string, FrozenSnapshot>()
let _sessionFrozen = false

// Normalize a file path for Map keying. Handles symlink-resolved paths,
// relative paths, and duplicate slashes without touching disk.
function normalizeKey(filePath: string): string {
  try {
    return normalize(resolve(filePath))
  } catch {
    return filePath
  }
}

/**
 * Session startup: capture the exact bytes of a file into the frozen
 * snapshot. Caller is responsible for the actual disk read — this module
 * stays pure (no I/O) so it is trivially mockable in tests and safe to
 * call from any execution layer.
 *
 * Re-freezing the same path is idempotent: the NEW content replaces the
 * OLD. Callers wanting stability should guard with isSessionFrozen().
 */
export function freezeFile(filePath: string, content: string): void {
  const key = normalizeKey(filePath)
  _frozenFiles.set(key, {
    filePath: key,
    content,
    frozenAt: Date.now(),
    bytes: content.length,
  })
}

/**
 * Read a frozen snapshot by path. Returns null if the file is not in the
 * snapshot — caller should fall back to disk read. Does NOT consult
 * _sessionFrozen so early-freeze-then-read flows work even before the
 * session is marked "frozen" (useful for tests and staged startup).
 */
export function readFrozen(filePath: string): string | null {
  const key = normalizeKey(filePath)
  const entry = _frozenFiles.get(key)
  return entry ? entry.content : null
}

/**
 * Mark the session as frozen. After this, the bootstrap path SHOULD NOT
 * add more files to the snapshot unless explicitly unfreezing. readFrozen()
 * consumers may use isSessionFrozen() to decide whether missing-key fallback
 * to disk is "expected" (frozen, but file not in scope) or "premature"
 * (not yet frozen, so skip the frozen layer entirely).
 */
export function markSessionFrozen(): void {
  _sessionFrozen = true
  logForDebugging(
    `[frozenContext] session frozen with ${_frozenFiles.size} files (${getFrozenStats().totalBytes} bytes)`,
  )
}

export function isSessionFrozen(): boolean {
  return _sessionFrozen
}

/**
 * Reset the entire frozen snapshot. Call sites: /clear, compact, tests.
 * After unfreeze, the next session-start hook will capture a fresh
 * snapshot from disk — that is the intended flush path for user-edited
 * CLAUDE.md / MEMORY.md changes to take effect.
 */
export function unfreezeSession(): void {
  if (_sessionFrozen || _frozenFiles.size > 0) {
    logForDebugging(
      `[frozenContext] unfreezing session (had ${_frozenFiles.size} files)`,
    )
  }
  _frozenFiles.clear()
  _sessionFrozen = false
}

/**
 * Debug/observability helper — returns count, total bytes, and file list.
 * Used by tests and could surface in /doctor output.
 */
export function getFrozenStats(): {
  count: number
  totalBytes: number
  files: string[]
} {
  const files: string[] = []
  let totalBytes = 0
  for (const [path, entry] of _frozenFiles) {
    files.push(path)
    totalBytes += entry.bytes
  }
  return { count: _frozenFiles.size, totalBytes, files }
}
