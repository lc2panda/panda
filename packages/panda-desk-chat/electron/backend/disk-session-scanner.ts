// Input: sessionId (UUID) or none; reads ~/.pandacc/projects/**/*.jsonl
// Output: DiskSessionMeta[] / SessionDetail / launch info / boolean side-effects
// Pos: electron main — disk-side session discovery for pd:sessions:* IPC (Phase 1)
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
//
// Reference implementation:
//   monitor/tmp/cc-haha-0.1.5/src/server/services/sessionService.ts
//     - listSessions         (L440-497)  → listAllSessions
//     - getSession           (L502-534)  → getSessionDetail
//     - getSessionLaunchInfo (L675-704)  → getSessionLaunchInfo
//     - entriesToMessages    (L739-778)  → entriesToMessages
//     - resolveWorkDirFromEntries (L132-150)
//     - extractTitle         (L283-320)
//     - findSessionFile      (L398-426)
//     - readJsonlFile        (L103-125)
//     - deleteSessionFile    (L706-710)

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

import type {
  DiskSessionMeta,
  SessionDetail,
  SessionMessage,
} from '../../src/ipc/types.js';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Root directory storing per-project session transcripts. */
export const PANDACC_ROOT = path.join(os.homedir(), '.pandacc', 'projects');

/** Title extracted from first user message is capped at this length. */
const TITLE_MAX_LENGTH = 80;

/** UUID v4 / loose UUID pattern — guards against path traversal. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Raw types (internal) ────────────────────────────────────────────────────

/** A single parsed JSONL entry — shape mirrors cc-haha SessionService.RawEntry. */
export interface RawEntry {
  type?: string;
  uuid?: string;
  parentUuid?: string | null;
  parent_tool_use_id?: string | null;
  isSidechain?: boolean;
  isMeta?: boolean;
  cwd?: string;
  message?: {
    role?: string;
    content?: unknown;
    model?: string;
    id?: string;
    type?: string;
  };
  timestamp?: string;
  customTitle?: string;
  title?: string;
  aiTitle?: string;
  workDir?: string;
  [key: string]: unknown;
}

/** Return type of `getSessionLaunchInfo`. */
export interface SessionLaunchInfo {
  filePath: string;
  projectDir: string;
  workDir: string;
  transcriptMessageCount: number;
  customTitle?: string;
}

// ─── Path sanitization ───────────────────────────────────────────────────────

/**
 * Sanitize an absolute path to the flat directory-name form used under
 * `~/.pandacc/projects/`. Every `/` (and `\` on Windows) becomes `-`.
 *
 * Example: `/Users/panda/Downloads/cc-panda` → `-Users-panda-Downloads-cc-panda`.
 */
export function sanitizeProjectPath(absPath: string): string {
  return absPath.replace(/[/\\]/g, '-');
}

/**
 * Reverse of `sanitizeProjectPath` — restores `/` from `-`.
 *
 * POSIX-oriented (matches cc-haha behaviour). Windows drive letters are not
 * preserved, but this module runs in Electron main on macOS/Linux primarily.
 */
export function desanitizeProjectPath(dirName: string): string {
  return dirName.replace(/-/g, path.sep);
}

// ─── JSONL parsing ───────────────────────────────────────────────────────────

/**
 * Read a `.jsonl` transcript file into an array of entries.
 * Malformed lines are skipped; missing files return `[]`.
 */
export async function readJsonlFile(filePath: string): Promise<RawEntry[]> {
  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.warn(`[disk-session-scanner] readJsonlFile failed: ${filePath}`, err);
    }
    return [];
  }

  const entries: RawEntry[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed) as RawEntry);
    } catch {
      // skip malformed lines — matches cc-haha L120-122
    }
  }
  return entries;
}

// ─── Entry → SessionMessage conversion ───────────────────────────────────────

/**
 * Flatten arbitrary message content to a plain string for
 * renderer-side history replay. Arrays of content blocks are reduced to
 * their text portions; tool blocks are rendered as compact placeholders.
 */
function stringifyContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (content == null) return '';

  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const raw of content) {
      if (raw == null) continue;
      if (typeof raw === 'string') {
        parts.push(raw);
        continue;
      }
      if (typeof raw !== 'object') {
        parts.push(String(raw));
        continue;
      }
      const block = raw as Record<string, unknown>;
      const blockType = typeof block.type === 'string' ? block.type : '';
      if (blockType === 'text' && typeof block.text === 'string') {
        parts.push(block.text);
      } else if (blockType === 'tool_use') {
        const name = typeof block.name === 'string' ? block.name : 'tool';
        parts.push(`[tool_use: ${name}]`);
      } else if (blockType === 'tool_result') {
        const inner = block.content;
        if (typeof inner === 'string') {
          parts.push(`[tool_result] ${inner}`);
        } else {
          parts.push('[tool_result]');
        }
      } else if (blockType === 'thinking' && typeof block.thinking === 'string') {
        parts.push(block.thinking);
      }
    }
    return parts.join('\n');
  }

  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
}

/**
 * Convert raw JSONL entries to the renderer-friendly `SessionMessage[]`.
 * Mirrors cc-haha `entriesToMessages` (L739-778) but collapses content to
 * a string, since `SessionMessage.content` is typed as `string` in
 * `src/ipc/types.ts`.
 */
export function entriesToMessages(entries: RawEntry[]): SessionMessage[] {
  const messages: SessionMessage[] = [];

  for (const entry of entries) {
    if (!entry.message?.role) continue;
    if (entry.isMeta) continue;

    const entryType = entry.type;
    if (entryType !== 'user' && entryType !== 'assistant' && entryType !== 'system') {
      continue;
    }

    const role = entry.message.role;
    if (role !== 'user' && role !== 'assistant' && role !== 'system') continue;

    messages.push({
      role,
      content: stringifyContent(entry.message.content),
      timestamp: typeof entry.timestamp === 'string' ? entry.timestamp : undefined,
      uuid: typeof entry.uuid === 'string' ? entry.uuid : undefined,
    });
  }

  return messages;
}

// ─── Title / workDir extraction ──────────────────────────────────────────────

/**
 * Extract a display title from raw entries. Priority (matches cc-haha L283-319):
 *   1. Latest `custom-title` entry (`customTitle` field)
 *   2. Latest `ai-title` entry (`aiTitle` field)
 *   3. Latest `session-meta` entry with a `title` field
 *   4. First non-meta user message text, truncated to `TITLE_MAX_LENGTH`
 * Returns `undefined` if no signal is found (caller decides fallback).
 */
export function extractTitle(entries: RawEntry[]): string | undefined {
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (!e) continue;
    if (e.type === 'custom-title' && typeof e.customTitle === 'string' && e.customTitle.length > 0) {
      return e.customTitle;
    }
  }

  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (!e) continue;
    if (e.type === 'ai-title' && typeof e.aiTitle === 'string' && e.aiTitle.length > 0) {
      return e.aiTitle;
    }
  }

  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (!e) continue;
    if (e.type === 'session-meta' && typeof e.title === 'string' && e.title.length > 0) {
      return e.title;
    }
  }

  for (const e of entries) {
    if (e.type !== 'user' || e.isMeta || e.message?.role !== 'user') continue;
    const content = e.message.content;
    let text: string | undefined;
    if (typeof content === 'string') {
      text = content;
    } else if (Array.isArray(content)) {
      const textBlock = content.find((b) => {
        if (!b || typeof b !== 'object') return false;
        const block = b as Record<string, unknown>;
        return block.type === 'text' && typeof block.text === 'string';
      }) as { text?: string } | undefined;
      if (textBlock?.text) text = textBlock.text;
    }
    if (text) {
      const trimmed = text.trim();
      if (!trimmed) continue;
      return trimmed.length > TITLE_MAX_LENGTH
        ? trimmed.slice(0, TITLE_MAX_LENGTH) + '...'
        : trimmed;
    }
  }

  return undefined;
}

/**
 * Resolve the original working directory for a session. Priority:
 *   1. Any `session-meta` entry with a `workDir` string field
 *   2. Most recent `cwd` field on any entry
 * Returns `undefined` if no signal is present.
 */
export function resolveWorkDirFromEntries(entries: RawEntry[]): string | undefined {
  for (const entry of entries) {
    if (entry.type === 'session-meta' && typeof entry.workDir === 'string' && entry.workDir.trim()) {
      return entry.workDir;
    }
  }

  for (let i = entries.length - 1; i >= 0; i--) {
    const cwd = entries[i]?.cwd;
    if (typeof cwd === 'string' && cwd.trim()) {
      return cwd;
    }
  }

  return undefined;
}

// ─── Session file discovery ──────────────────────────────────────────────────

function isValidSessionId(id: string): boolean {
  return UUID_PATTERN.test(id);
}

interface DiscoveredFile {
  filePath: string;
  projectDir: string;
  sessionId: string;
}

/**
 * Enumerate every `.jsonl` session file under `PANDACC_ROOT`, without
 * parsing their contents. Safe against missing root / unreadable subdirs.
 */
async function discoverSessionFiles(): Promise<DiscoveredFile[]> {
  let projectDirs: string[];
  try {
    projectDirs = await fs.readdir(PANDACC_ROOT);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.warn(`[disk-session-scanner] readdir failed: ${PANDACC_ROOT}`, err);
    }
    return [];
  }

  const out: DiscoveredFile[] = [];

  for (const dir of projectDirs) {
    const dirPath = path.join(PANDACC_ROOT, dir);

    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }

    let files: string[];
    try {
      files = await fs.readdir(dirPath);
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.endsWith('.jsonl')) continue;
      const sessionId = file.slice(0, -'.jsonl'.length);
      if (!isValidSessionId(sessionId)) continue;
      out.push({
        filePath: path.join(dirPath, file),
        projectDir: dir,
        sessionId,
      });
    }
  }

  return out;
}

/**
 * Locate the `.jsonl` file for a given session id across all project
 * directories. If multiple matches exist (unusual — same UUID under two
 * projects), the most recently modified wins and a warning is logged.
 */
export async function findSessionFile(
  sessionId: string,
): Promise<{ filePath: string; projectDir: string } | null> {
  if (!isValidSessionId(sessionId)) return null;

  let projectDirs: string[];
  try {
    projectDirs = await fs.readdir(PANDACC_ROOT);
  } catch {
    return null;
  }

  const matches: Array<{ filePath: string; projectDir: string; mtimeMs: number }> = [];

  for (const dir of projectDirs) {
    const filePath = path.join(PANDACC_ROOT, dir, `${sessionId}.jsonl`);
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) continue;
      matches.push({ filePath, projectDir: dir, mtimeMs: stat.mtimeMs });
    } catch {
      continue;
    }
  }

  if (matches.length === 0) return null;

  if (matches.length > 1) {
    console.warn(
      `[disk-session-scanner] sessionId ${sessionId} matched ${matches.length} files across projects; using newest`,
      matches.map((m) => m.filePath),
    );
    matches.sort((a, b) => b.mtimeMs - a.mtimeMs);
  }

  const winner = matches[0]!;
  return { filePath: winner.filePath, projectDir: winner.projectDir };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * List every session discoverable under `~/.pandacc/projects/`.
 * Sorted by `lastModified` descending (newest first). IO errors on
 * individual files are swallowed so a single corrupt transcript cannot
 * blank out the whole sidebar.
 */
export async function listAllSessions(): Promise<DiskSessionMeta[]> {
  const files = await discoverSessionFiles();
  const items: DiskSessionMeta[] = [];

  for (const { filePath, projectDir, sessionId } of files) {
    try {
      const stat = await fs.stat(filePath);
      const entries = await readJsonlFile(filePath);

      const messageCount = entries.reduce((acc, e) => {
        if (e.isMeta) return acc;
        if (!e.message?.role) return acc;
        if (e.type !== 'user' && e.type !== 'assistant') return acc;
        return acc + 1;
      }, 0);

      const title = extractTitle(entries) ?? 'Untitled Session';
      const workDir = resolveWorkDirFromEntries(entries) ?? desanitizeProjectPath(projectDir);

      items.push({
        id: sessionId,
        title,
        projectPath: projectDir,
        messageCount,
        lastModified: stat.mtime.toISOString(),
        workDir,
      });
    } catch (err) {
      console.warn(`[disk-session-scanner] skipping ${filePath}:`, err);
    }
  }

  items.sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
  );

  return items;
}

/**
 * Fetch full detail (meta + ordered messages) for a single session.
 * Returns `null` when the session file is missing or unreadable.
 */
export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  const found = await findSessionFile(sessionId);
  if (!found) return null;

  let stat: Awaited<ReturnType<typeof fs.stat>>;
  try {
    stat = await fs.stat(found.filePath);
  } catch (err) {
    console.warn(`[disk-session-scanner] stat failed: ${found.filePath}`, err);
    return null;
  }

  const entries = await readJsonlFile(found.filePath);
  const messages = entriesToMessages(entries);
  const title = extractTitle(entries) ?? 'Untitled Session';
  const workDir = resolveWorkDirFromEntries(entries) ?? desanitizeProjectPath(found.projectDir);

  return {
    id: sessionId,
    title,
    projectPath: found.projectDir,
    messageCount: messages.length,
    lastModified: stat.mtime.toISOString(),
    workDir,
    messages,
  };
}

/**
 * Inspect a session to determine how to launch the CLI against it.
 * A placeholder session (created by the desktop app but never answered)
 * has `transcriptMessageCount === 0`; callers may wish to delete it and
 * start fresh instead of `--resume`-ing a dead UUID.
 *
 * Mirrors cc-haha `getSessionLaunchInfo` (L675-704).
 */
export async function getSessionLaunchInfo(
  sessionId: string,
): Promise<SessionLaunchInfo | null> {
  const found = await findSessionFile(sessionId);
  if (!found) return null;

  const entries = await readJsonlFile(found.filePath);
  const workDir =
    resolveWorkDirFromEntries(entries) ??
    desanitizeProjectPath(found.projectDir) ??
    process.cwd();

  let customTitle: string | undefined;
  let transcriptMessageCount = 0;

  for (const entry of entries) {
    if (entry.type === 'custom-title' && typeof entry.customTitle === 'string') {
      customTitle = entry.customTitle;
    }
    if (
      !entry.isMeta &&
      entry.message?.role &&
      (entry.type === 'user' || entry.type === 'assistant' || entry.type === 'system')
    ) {
      transcriptMessageCount++;
    }
  }

  return {
    filePath: found.filePath,
    projectDir: found.projectDir,
    workDir,
    transcriptMessageCount,
    ...(customTitle !== undefined ? { customTitle } : {}),
  };
}

/**
 * Delete the on-disk transcript for a session. No-op when the file is
 * missing. Intended for cleaning up placeholder sessions that were never
 * used — do not call on an active, CLI-owned session id.
 */
export async function deleteSessionFile(sessionId: string): Promise<void> {
  const found = await findSessionFile(sessionId);
  if (!found) return;

  try {
    await fs.unlink(found.filePath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return;
    console.warn(`[disk-session-scanner] unlink failed: ${found.filePath}`, err);
  }
}
