// Input: chatStore (active session messages → Edit tool calls with old_string/new_string)
// Output: 累积 Diff 视图 — 按文件分组显示所有编辑的增删行
// Pos: PdInspector > diff tab 内容区

import { useState, useMemo } from 'react';
import { useChatStore, type UIToolCall } from '../../../stores/chatStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiffHunk {
  filePath: string;
  oldLines: string[];
  newLines: string[];
}

interface FileDiff {
  filePath: string;
  hunks: DiffHunk[];
  added: number;
  removed: number;
}

// ---------------------------------------------------------------------------
// Extract diffs from Edit tool calls
// ---------------------------------------------------------------------------

function extractDiffs(messages: { toolCalls?: UIToolCall[] }[]): FileDiff[] {
  const fileMap = new Map<string, DiffHunk[]>();

  for (const msg of messages) {
    if (!msg.toolCalls) continue;
    for (const tc of msg.toolCalls) {
      const lower = tc.toolName.toLowerCase();
      if (!lower.includes('edit') && lower !== 'edit') continue;

      const input = tc.input;
      if (!input || typeof input !== 'object') continue;

      const filePath = (input.file_path ?? input.filePath ?? '') as string;
      const oldStr = (input.old_string ?? input.oldString ?? '') as string;
      const newStr = (input.new_string ?? input.newString ?? '') as string;

      if (!filePath || (!oldStr && !newStr)) continue;

      const hunk: DiffHunk = {
        filePath,
        oldLines: oldStr ? oldStr.split('\n') : [],
        newLines: newStr ? newStr.split('\n') : [],
      };

      if (!fileMap.has(filePath)) {
        fileMap.set(filePath, []);
      }
      fileMap.get(filePath)!.push(hunk);
    }
  }

  return Array.from(fileMap.entries()).map(([filePath, hunks]) => {
    let added = 0;
    let removed = 0;
    for (const h of hunks) {
      removed += h.oldLines.length;
      added += h.newLines.length;
    }
    return { filePath, hunks, added, removed };
  });
}

// ---------------------------------------------------------------------------
// Short path — strip common prefix
// ---------------------------------------------------------------------------

function shortPath(fp: string): string {
  // Show last 3 segments at most
  const parts = fp.split('/');
  if (parts.length <= 4) return fp;
  return '.../' + parts.slice(-3).join('/');
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

interface FileDiffBlockProps {
  diff: FileDiff;
}

function FileDiffBlock({ diff }: FileDiffBlockProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded border border-[var(--pd-color-border)] overflow-hidden">
      {/* File header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full cursor-pointer items-center gap-2 border-none bg-[var(--pd-color-bg-hover)] px-3 py-1.5 text-left"
      >
        <span className="text-xs text-[var(--pd-color-fg-muted)]">
          {expanded ? '\u25BE' : '\u25B8'}
        </span>
        <span className="flex-1 truncate font-mono text-xs font-medium text-[var(--pd-color-fg)]">
          {shortPath(diff.filePath)}
        </span>
        <span className="font-mono text-[10px] text-emerald-400">+{diff.added}</span>
        <span className="font-mono text-[10px] text-red-400">-{diff.removed}</span>
      </button>

      {/* Hunks */}
      {expanded && (
        <div className="max-h-[300px] overflow-y-auto">
          {diff.hunks.map((hunk, hi) => (
            <div key={hi} className="border-t border-[var(--pd-color-border)]">
              {/* Removed lines */}
              {hunk.oldLines.map((line, li) => (
                <div
                  key={`old-${hi}-${li}`}
                  className="flex items-start bg-red-500/10 px-3 py-0.5 font-mono text-[11px]"
                >
                  <span className="w-5 shrink-0 select-none text-right text-[10px] text-red-400/60">
                    -
                  </span>
                  <pre className="m-0 flex-1 overflow-x-auto whitespace-pre text-red-300">
                    {line}
                  </pre>
                </div>
              ))}
              {/* Added lines */}
              {hunk.newLines.map((line, li) => (
                <div
                  key={`new-${hi}-${li}`}
                  className="flex items-start bg-emerald-500/10 px-3 py-0.5 font-mono text-[11px]"
                >
                  <span className="w-5 shrink-0 select-none text-right text-[10px] text-emerald-400/60">
                    +
                  </span>
                  <pre className="m-0 flex-1 overflow-x-auto whitespace-pre text-emerald-300">
                    {line}
                  </pre>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function DiffPanel() {
  const session = useChatStore((s) => s.getActiveSession());
  const messages = session?.messages ?? [];

  const diffs = useMemo(() => extractDiffs(messages), [messages]);
  const totalAdded = diffs.reduce((sum, d) => sum + d.added, 0);
  const totalRemoved = diffs.reduce((sum, d) => sum + d.removed, 0);

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Title + stats */}
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-[var(--pd-fg)]">
          累积变更 ({diffs.length} 文件)
        </h3>
        {diffs.length > 0 && (
          <div className="flex gap-2">
            <span className="font-mono text-xs text-emerald-400">+{totalAdded}</span>
            <span className="font-mono text-xs text-red-400">-{totalRemoved}</span>
          </div>
        )}
      </div>
      <div className="border-t border-[var(--pd-color-border)]" />

      {diffs.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--pd-color-fg-muted)]">
          暂无文件变更
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto">
          {diffs.map((diff) => (
            <FileDiffBlock key={diff.filePath} diff={diff} />
          ))}
        </div>
      )}
    </div>
  );
}
