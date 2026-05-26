// Input: sessionId (UUID) or none; reads ~/.pandacc/projects/**/*.jsonl
// Output: DiskSessionMeta[] / SessionDetail / launch info / boolean side-effects
// Pos: electron main — disk-side session discovery for pd:sessions:* IPC (Phase 1)
//
// 路径决策：panda CLI 默认会话路径为 ~/.pandacc/projects/（panda 自有，与 Claude Code .claude/projects/ 隔离）。
// 引用：src/main.tsx L731、src/tools/FileReadTool/FileReadTool.ts L216、
//       src/utils/sessionStoragePortable.ts L390、src/utils/permissions/filesystem.ts L282 等。
// .pandacc 路径下还存放：plugins/skills/scheduled tasks/assistant/channels/cache 等 panda 全套数据。
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
  MessageEntry,
  SessionDetail,
} from '../../src/ipc/types.js';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Root directory storing per-project session transcripts.
 *  panda CLI 默认路径 = ~/.pandacc/projects/（与 Claude Code 的 ~/.claude/projects/ 隔离）。 */
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

// ─── Entry → MessageEntry conversion ─────────────────────────────────────────

/**
 * Convert a single RawEntry to a MessageEntry, faithfully mirroring
 * cc-haha sessionService L156-205. The `content` field is preserved as
 * the raw `unknown` so renderer-side dispatch can extract text /
 * tool_use / tool_result / thinking blocks losslessly.
 *
 * Type rules:
 *   - role=user + Array content with any tool_result block → 'tool_result'
 *   - role=user otherwise                                  → 'user'
 *   - role=assistant + Array content with any tool_use     → 'tool_use'
 *   - role=assistant otherwise                              → 'assistant'
 *   - any other role                                        → 'system'
 */
function entryToMessage(
  entry: RawEntry,
  parentToolUseId?: string,
): MessageEntry | null {
  const msg = entry.message;
  if (!msg || !msg.role) return null;

  let type: MessageEntry['type'];
  const role = msg.role;

  if (role === 'user') {
    if (Array.isArray(msg.content)) {
      const hasToolResult = (msg.content as Array<Record<string, unknown>>).some(
        (block) => block?.type === 'tool_result',
      );
      type = hasToolResult ? 'tool_result' : 'user';
    } else {
      type = 'user';
    }
  } else if (role === 'assistant') {
    if (Array.isArray(msg.content)) {
      const hasToolUse = (msg.content as Array<Record<string, unknown>>).some(
        (block) => block?.type === 'tool_use',
      );
      type = hasToolUse ? 'tool_use' : 'assistant';
    } else {
      type = 'assistant';
    }
  } else {
    type = 'system';
  }

  return {
    id: typeof entry.uuid === 'string' && entry.uuid.length > 0
      ? entry.uuid
      : crypto.randomUUID(),
    type,
    content: msg.content,
    timestamp: typeof entry.timestamp === 'string' && entry.timestamp.length > 0
      ? entry.timestamp
      : new Date().toISOString(),
    model: typeof msg.model === 'string' ? msg.model : undefined,
    parentUuid: typeof entry.parentUuid === 'string' ? entry.parentUuid : undefined,
    parentToolUseId,
    isSidechain: entry.isSidechain === true ? true : undefined,
  };
}

/**
 * If `entry` is itself an Agent tool_use turn, return the tool_use id of
 * the Agent block embedded in its content. Mirrors cc-haha L207-222.
 */
function extractAgentToolUseId(entry: RawEntry): string | undefined {
  const content = entry.message?.content;
  if (!Array.isArray(content)) return undefined;

  for (const raw of content as Array<Record<string, unknown>>) {
    if (
      raw?.type === 'tool_use' &&
      raw?.name === 'Agent' &&
      typeof raw?.id === 'string' &&
      raw.id.length > 0
    ) {
      return raw.id;
    }
  }
  return undefined;
}

/**
 * Resolve the owning Agent tool_use id for an entry that lives inside a
 * sub-agent sidechain. Mirrors cc-haha L224-280.
 *
 * Resolution order:
 *   1. Explicit `parent_tool_use_id` on the entry → use it directly.
 *   2. If `isSidechain` is not true → no parent.
 *   3. Otherwise walk up `parentUuid` until we hit an entry that *is* an
 *      Agent tool_use turn (i.e. extractAgentToolUseId returns a string)
 *      or one whose own resolved id is already in cache. Cycles guarded
 *      by a visited set.
 */
function resolveParentToolUseId(
  entry: RawEntry,
  entriesByUuid: Map<string, RawEntry>,
  cache: Map<string, string | undefined>,
): string | undefined {
  if (
    typeof entry.parent_tool_use_id === 'string' &&
    entry.parent_tool_use_id.length > 0
  ) {
    return entry.parent_tool_use_id;
  }

  if (entry.isSidechain !== true) return undefined;

  const cacheKey = entry.uuid;
  if (cacheKey && cache.has(cacheKey)) return cache.get(cacheKey);

  let resolved: string | undefined;
  let currentParentUuid =
    typeof entry.parentUuid === 'string' ? entry.parentUuid : undefined;
  const visited = new Set<string>();

  while (currentParentUuid && !visited.has(currentParentUuid)) {
    visited.add(currentParentUuid);
    const parentEntry = entriesByUuid.get(currentParentUuid);
    if (!parentEntry) break;

    const directAgentToolUseId = extractAgentToolUseId(parentEntry);
    if (directAgentToolUseId) {
      resolved = directAgentToolUseId;
      break;
    }

    if (parentEntry.uuid && cache.has(parentEntry.uuid)) {
      resolved = cache.get(parentEntry.uuid);
      break;
    }

    currentParentUuid =
      typeof parentEntry.parentUuid === 'string'
        ? parentEntry.parentUuid
        : undefined;
  }

  if (cacheKey) cache.set(cacheKey, resolved);
  return resolved;
}

/**
 * Convert raw JSONL entries to renderer-friendly `MessageEntry[]`.
 * Mirrors cc-haha `entriesToMessages` (L739-778):
 *   - Skip entries without a real `message.role`
 *   - Skip `isMeta` bookkeeping entries
 *   - Skip non-transcript types (anything besides user/assistant/system)
 *   - For each kept entry, resolve sidechain parent tool_use id, then
 *     emit a MessageEntry whose `type` reflects the inner content.
 */
export function entriesToMessages(entries: RawEntry[]): MessageEntry[] {
  const messages: MessageEntry[] = [];
  const entriesByUuid = new Map<string, RawEntry>();
  const parentToolUseIdCache = new Map<string, string | undefined>();

  for (const entry of entries) {
    if (typeof entry.uuid === 'string' && entry.uuid.length > 0) {
      entriesByUuid.set(entry.uuid, entry);
    }
  }

  for (const entry of entries) {
    if (!entry.message?.role) continue;
    if (entry.isMeta) continue;

    const entryType = entry.type;
    if (entryType !== 'user' && entryType !== 'assistant' && entryType !== 'system') {
      continue;
    }

    const parentToolUseId = resolveParentToolUseId(
      entry,
      entriesByUuid,
      parentToolUseIdCache,
    );
    const msg = entryToMessage(entry, parentToolUseId);
    if (msg) messages.push(msg);
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
      const cleaned = sanitizeTitleText(text);
      if (!cleaned) continue;
      return cleaned.length > TITLE_MAX_LENGTH
        ? cleaned.slice(0, TITLE_MAX_LENGTH) + '...'
        : cleaned;
    }
  }

  return undefined;
}

/**
 * Strip out CLI command wrappers and notification payloads that are not
 * user-meaningful as session titles. Panda user messages frequently contain
 * XML-like envelopes like `<command-name>/plu...</command-name>` or
 * `<task-notification>…</task-notification>` as transport metadata; showing
 * those in the sidebar makes every entry look identical and broken.
 */
function sanitizeTitleText(raw: string): string {
  let text = raw;
  // Drop any <tag>...</tag> blocks whose tag name looks like a CLI envelope.
  text = text.replace(
    /<(command-[a-z-]+|task-notification|local-command-[a-z-]+|system-reminder)[^>]*>[\s\S]*?<\/\1>/gi,
    ' ',
  );
  // Drop orphan opening/closing tags if the paired tag got truncated.
  text = text.replace(/<\/?(command-[a-z-]+|task-notification|local-command-[a-z-]+|system-reminder)[^>]*>/gi, ' ');
  // Collapse whitespace and trim.
  return text.replace(/\s+/g, ' ').trim();
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
  // v2.26.14 Bug B fix (1:1 align cc-haha): the previous `process.cwd()`
  // tail-fallback silently spawned panda-cli at "/" when Electron main was
  // launched from Finder, breaking `panda-cli --resume` for any historical
  // session whose transcript was recorded under a real project directory.
  // Strict precedence: session-meta.workDir → entries[].cwd → desanitize
  // projectDir. No silent "/"-style fallback — callers must handle null.
  let workDir = resolveWorkDirFromEntries(entries);
  if (!workDir) {
    const desanitized = desanitizeProjectPath(found.projectDir);
    if (desanitized) workDir = desanitized;
  }
  if (!workDir) {
    return null;
  }

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
