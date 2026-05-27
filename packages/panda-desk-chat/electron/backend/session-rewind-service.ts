// Input: sessionId (UUID) + userTurnIndex (0-indexed) + optional restoreFiles flag
// Output: RewindPreview (preview) or RewindResult (execute) — jsonl truncation + file-history snapshot restore
// Pos: electron main — session rewind backend; called by IPC session:rewind:preview / session:rewind:execute
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
//
// File-history layout (panda-cli):
//   ~/.pandacc/file-history/<sessionId>/<backupFileName>
//   where backupFileName encodes the original file path (see panda-cli src/utils/fileHistory.ts:resolveBackupPath)
//
// jsonl layout:
//   One JSON object per line.  Only entries with type='user' or type='assistant'
//   count as conversation turns.  All other types (attribution-snapshot, queue-operation, etc.)
//   are preserved up to the chosen boundary and dropped after it.

import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { findSessionFile, type RawEntry } from './disk-session-scanner';

// ─── Constants ────────────────────────────────────────────────────────────────

const PANDACC_HOME = process.env['CLAUDE_CONFIG_HOME'] ?? path.join(os.homedir(), '.pandacc');
const FILE_HISTORY_ROOT = path.join(PANDACC_HOME, 'file-history');

/** Tools that write files; we extract file_path from their input. */
const FILE_MODIFYING_TOOLS = new Set([
  'FileEditTool',
  'Edit',
  'FileWriteTool',
  'Write',
  'NotebookEditTool',
  'NotebookEdit',
]);

// ─── Public types ─────────────────────────────────────────────────────────────

export interface RewindPreview {
  /** The 0-indexed user turn the rewind would target (inclusive boundary). */
  targetTurn: number;
  /** Number of conversation entries after the target turn (will be removed). */
  messagesAfter: number;
  /** File paths extracted from assistant tool_use blocks after the target turn. */
  filesAffected: string[];
  /** Whether the rewind can proceed. */
  canRollback: boolean;
  /** Human-readable reason when canRollback is false. */
  reason?: string;
}

export interface RewindResult {
  ok: boolean;
  /** Absolute path of the .bak backup file created before truncation. */
  backupPath: string;
  /** Files actually restored from file-history snapshots. */
  restoredFiles: string[];
  /** Error message when ok is false. */
  error?: string;
}

export interface RewindOptions {
  /** Attempt to restore file-history snapshots for affected files. */
  restoreFiles?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse one jsonl line; return null on empty/invalid JSON. */
function parseLine(line: string): RawEntry | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as RawEntry;
  } catch {
    return null;
  }
}

/** Read all non-empty parsed lines from a jsonl file. */
async function readAllEntries(filePath: string): Promise<Array<{ raw: string; entry: RawEntry }>> {
  const text = await fsPromises.readFile(filePath, 'utf8');
  const results: Array<{ raw: string; entry: RawEntry }> = [];
  for (const line of text.split('\n')) {
    const entry = parseLine(line);
    if (entry !== null) {
      results.push({ raw: line, entry });
    }
  }
  return results;
}

/** Extract file paths from assistant tool_use blocks. */
function extractFilePaths(entries: RawEntry[]): string[] {
  const paths = new Set<string>();
  for (const entry of entries) {
    if (entry.type !== 'assistant') continue;
    const content = entry.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (
        typeof block === 'object' &&
        block !== null &&
        (block as Record<string, unknown>)['type'] === 'tool_use'
      ) {
        const b = block as Record<string, unknown>;
        const name = (b['name'] as string | undefined) ?? '';
        if (!FILE_MODIFYING_TOOLS.has(name)) continue;
        const input = b['input'] as Record<string, unknown> | undefined;
        if (!input) continue;
        const fp =
          (input['file_path'] as string | undefined) ??
          (input['path'] as string | undefined);
        if (fp && typeof fp === 'string') {
          paths.add(fp);
        }
      }
    }
  }
  return Array.from(paths);
}

/**
 * Find the backup file in `~/.pandacc/file-history/<sessionId>/` whose name
 * encodes the given original file path.
 *
 * panda-cli resolveBackupPath encodes the absolute path by replacing every '/'
 * with '-' and prepending a timestamp.  We look for any backup entry whose
 * filename (without the leading timestamp segment) ends with the sanitized path.
 */
async function findBackupForFile(
  sessionId: string,
  originalPath: string,
): Promise<string | null> {
  const sessionHistoryDir = path.join(FILE_HISTORY_ROOT, sessionId);
  let entries: string[];
  try {
    entries = await fsPromises.readdir(sessionHistoryDir);
  } catch {
    return null;
  }

  // Sanitize the original path the same way panda-cli does: replace '/' with '-'
  const sanitized = originalPath.replace(/\//g, '-');

  // Sort descending by mtime so we pick the most-recent backup first
  const withStats = await Promise.all(
    entries.map(async (name) => {
      const fullPath = path.join(sessionHistoryDir, name);
      try {
        const s = await fsPromises.stat(fullPath);
        return { name, fullPath, mtime: s.mtimeMs };
      } catch {
        return { name, fullPath, mtime: 0 };
      }
    }),
  );
  withStats.sort((a, b) => b.mtime - a.mtime);

  for (const { name, fullPath } of withStats) {
    // The backup filename format from panda-cli is:
    //   <timestamp>-<sanitized-path>
    // or sometimes just the sanitized path.  Match by suffix.
    if (name.endsWith(sanitized) || name === sanitized) {
      return fullPath;
    }
  }
  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Preview what a rewind to `userTurnIndex` (0-indexed) would affect.
 *
 * The rewind truncates the conversation to include the first
 * (userTurnIndex + 1) user turns (inclusive).
 */
export async function previewSessionRewind(
  sessionId: string,
  userTurnIndex: number,
): Promise<RewindPreview> {
  // Locate the jsonl file
  const found = await findSessionFile(sessionId);
  if (!found) {
    return {
      targetTurn: userTurnIndex,
      messagesAfter: 0,
      filesAffected: [],
      canRollback: false,
      reason: `会话文件未找到: ${sessionId}`,
    };
  }

  const lines = await readAllEntries(found.filePath);
  const allEntries = lines.map((l) => l.entry);

  // Count user turns and find the cut-point line index
  let userTurnCount = -1;
  let cutLineIndex = -1; // inclusive last line to keep

  for (let i = 0; i < lines.length; i++) {
    const e = lines[i].entry;
    if (e.type === 'user') {
      userTurnCount++;
      if (userTurnCount === userTurnIndex) {
        cutLineIndex = i;
        // Keep scanning to include the assistant reply in the same "turn block"
        // We stop right here — everything from cutLineIndex+1 onward is "after"
        break;
      }
    }
  }

  // Validate the turn index
  const totalUserTurns = allEntries.filter((e) => e.type === 'user').length;

  if (userTurnIndex < 0 || userTurnCount < userTurnIndex || cutLineIndex === -1) {
    return {
      targetTurn: userTurnIndex,
      messagesAfter: 0,
      filesAffected: [],
      canRollback: false,
      reason: `userTurnIndex ${userTurnIndex} 越界（会话共有 ${totalUserTurns} 个 user turn，有效范围 0–${totalUserTurns - 1}）`,
    };
  }

  if (userTurnIndex === totalUserTurns - 1) {
    return {
      targetTurn: userTurnIndex,
      messagesAfter: 0,
      filesAffected: [],
      canRollback: false,
      reason: '目标已是最后一个 user turn，无需回退',
    };
  }

  // Entries after the cut point
  const entriesAfter = allEntries.slice(cutLineIndex + 1);
  const messagesAfter = entriesAfter.length;
  const filesAffected = extractFilePaths(entriesAfter);

  return {
    targetTurn: userTurnIndex,
    messagesAfter,
    filesAffected,
    canRollback: true,
  };
}

/**
 * Execute the rewind: backup the jsonl, truncate it to the target turn,
 * and optionally restore file-history snapshots.
 */
export async function executeSessionRewind(
  sessionId: string,
  userTurnIndex: number,
  options: RewindOptions = {},
): Promise<RewindResult> {
  // Preview first to validate and collect affected files
  const preview = await previewSessionRewind(sessionId, userTurnIndex);
  if (!preview.canRollback) {
    return {
      ok: false,
      backupPath: '',
      restoredFiles: [],
      error: preview.reason ?? '无法回退',
    };
  }

  // Locate the jsonl file again
  const found = await findSessionFile(sessionId);
  if (!found) {
    return {
      ok: false,
      backupPath: '',
      restoredFiles: [],
      error: `会话文件未找到: ${sessionId}`,
    };
  }

  const jsonlPath = found.filePath;
  const lines = await readAllEntries(jsonlPath);

  // Re-locate the cut point (same logic as preview)
  let userTurnCount = -1;
  let cutLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const e = lines[i].entry;
    if (e.type === 'user') {
      userTurnCount++;
      if (userTurnCount === userTurnIndex) {
        cutLineIndex = i;
        break;
      }
    }
  }

  if (cutLineIndex === -1) {
    return {
      ok: false,
      backupPath: '',
      restoredFiles: [],
      error: `内部错误: 无法定位第 ${userTurnIndex} 个 user turn`,
    };
  }

  // Create backup
  const timestamp = Date.now();
  const backupPath = `${jsonlPath}.bak.${timestamp}`;
  try {
    await fsPromises.copyFile(jsonlPath, backupPath);
  } catch (err) {
    return {
      ok: false,
      backupPath: '',
      restoredFiles: [],
      error: `备份失败: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Truncate jsonl to lines[0..cutLineIndex] (inclusive)
  const keepLines = lines
    .slice(0, cutLineIndex + 1)
    .map((l) => l.raw)
    .join('\n');
  try {
    await fsPromises.writeFile(jsonlPath, keepLines + '\n', 'utf8');
  } catch (err) {
    // Restore from backup on write failure
    try {
      await fsPromises.copyFile(backupPath, jsonlPath);
    } catch {
      // best-effort
    }
    return {
      ok: false,
      backupPath,
      restoredFiles: [],
      error: `写入 jsonl 失败: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Optionally restore file snapshots
  const restoredFiles: string[] = [];
  if (options.restoreFiles && preview.filesAffected.length > 0) {
    for (const originalPath of preview.filesAffected) {
      const backupSrc = await findBackupForFile(sessionId, originalPath);
      if (!backupSrc) {
        // No snapshot found — skip silently
        continue;
      }
      try {
        // Ensure the target directory exists
        await fsPromises.mkdir(path.dirname(originalPath), { recursive: true });
        await fsPromises.copyFile(backupSrc, originalPath);
        restoredFiles.push(originalPath);
      } catch {
        // Best-effort; do not fail the entire rewind
      }
    }
  }

  return {
    ok: true,
    backupPath,
    restoredFiles,
  };
}
