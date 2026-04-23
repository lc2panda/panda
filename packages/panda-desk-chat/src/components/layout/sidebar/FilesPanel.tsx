// Input: chatStore (all sessions' toolCalls with file paths)
// Output: Cross-session file operations panel — file tree grouped by directory
// Pos: PdSidebar workspace panel — replaces session list when files mode active

import { useState, useMemo, useCallback } from 'react';
import { useChatStore, type UIToolCall } from '@/stores/chatStore';
import { useSessionStore } from '@/stores/sessionStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FileOp = 'read' | 'write' | 'edit' | 'search';

interface FileRecord {
  path: string;
  op: FileOp;
  sessionId: string;
  sessionName: string;
  timestamp: number;
}

interface TreeNode {
  name: string;
  fullPath: string;
  children: Map<string, TreeNode>;
  files: FileRecord[];
  isDir: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toolToOp(toolName: string): FileOp | null {
  const lower = toolName.toLowerCase();
  if (lower.includes('read') || lower === 'read') return 'read';
  if (lower.includes('write') || lower === 'write') return 'write';
  if (lower.includes('edit') || lower === 'edit') return 'edit';
  if (lower.includes('grep') || lower.includes('glob')) return 'search';
  return null;
}

function extractPath(tc: UIToolCall): string | null {
  const inp = tc.input as Record<string, unknown>;
  if (typeof inp.file_path === 'string') return inp.file_path;
  if (typeof inp.path === 'string') return inp.path;
  if (typeof inp.command === 'string') {
    const m = (inp.command as string).match(/(?:cat|less|head|tail|vim|nano|code)\s+["']?([^\s"']+)/);
    if (m) return m[1];
  }
  return null;
}

function buildTree(records: FileRecord[]): TreeNode {
  const root: TreeNode = { name: '/', fullPath: '/', children: new Map(), files: [], isDir: true };

  for (const rec of records) {
    const parts = rec.path.split('/').filter(Boolean);
    let current = root;
    let pathSoFar = '';
    for (let i = 0; i < parts.length - 1; i++) {
      pathSoFar += '/' + parts[i];
      if (!current.children.has(parts[i])) {
        current.children.set(parts[i], {
          name: parts[i],
          fullPath: pathSoFar,
          children: new Map(),
          files: [],
          isDir: true,
        });
      }
      current = current.children.get(parts[i])!;
    }
    const fileName = parts[parts.length - 1];
    if (!current.children.has(fileName)) {
      current.children.set(fileName, {
        name: fileName,
        fullPath: rec.path,
        children: new Map(),
        files: [],
        isDir: false,
      });
    }
    current.children.get(fileName)!.files.push(rec);
  }

  return root;
}

const OP_LABELS: Record<FileOp, string> = {
  read: '读取',
  edit: '修改',
  write: '写入',
  search: '搜索',
};

const OP_COLORS: Record<FileOp, string> = {
  read: 'bg-emerald-500/20 text-emerald-400',
  edit: 'bg-orange-500/20 text-orange-400',
  write: 'bg-blue-500/20 text-blue-400',
  search: 'bg-purple-500/20 text-purple-400',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TreeNodeView({
  node,
  depth,
  expandedDirs,
  onToggleDir,
}: {
  node: TreeNode;
  depth: number;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
}) {
  const isExpanded = expandedDirs.has(node.fullPath);
  const sortedChildren = useMemo(
    () =>
      [...node.children.values()].sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [node.children],
  );

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => onToggleDir(node.fullPath)}
          className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)]"
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          <span className="shrink-0 text-[10px]">{isExpanded ? '▼' : '▶'}</span>
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {isExpanded &&
          sortedChildren.map((child) => (
            <TreeNodeView
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              expandedDirs={expandedDirs}
              onToggleDir={onToggleDir}
            />
          ))}
      </div>
    );
  }

  // File leaf
  const latestOp = node.files.length > 0 ? node.files[node.files.length - 1].op : undefined;
  return (
    <div
      className="flex items-center gap-1.5 rounded px-1 py-0.5 text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg)] hover:bg-[var(--pd-color-bg-hover)]"
      style={{ paddingLeft: `${depth * 12 + 4}px` }}
      title={node.fullPath}
    >
      <span className="shrink-0 text-[10px] opacity-40">📄</span>
      <span className="truncate">{node.name}</span>
      {latestOp && (
        <span className={`ml-auto shrink-0 rounded px-1 py-0.5 text-[10px] font-medium ${OP_COLORS[latestOp]}`}>
          {OP_LABELS[latestOp]}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FilesPanel() {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));

  const sessions = useSessionStore((s) => s.sessions);
  const chatSessions = useChatStore((s) => s.sessions);

  // Collect file records from all sessions
  const records = useMemo<FileRecord[]>(() => {
    const out: FileRecord[] = [];
    for (const session of sessions) {
      const perSession = chatSessions.get(session.id);
      if (!perSession) continue;
      for (const msg of perSession.messages) {
        if (!msg.toolCalls) continue;
        for (const tc of msg.toolCalls) {
          const op = toolToOp(tc.toolName);
          const path = extractPath(tc);
          if (op && path) {
            out.push({
              path,
              op,
              sessionId: session.id,
              sessionName: session.name,
              timestamp: msg.timestamp,
            });
          }
        }
      }
    }
    // Deduplicate by path, keep latest
    const map = new Map<string, FileRecord>();
    for (const r of out) {
      const existing = map.get(r.path);
      if (!existing || r.timestamp > existing.timestamp) {
        map.set(r.path, r);
      }
    }
    return [...map.values()].sort((a, b) => b.timestamp - a.timestamp);
  }, [sessions, chatSessions]);

  const tree = useMemo(() => buildTree(records), [records]);

  const onToggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 px-3 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--pd-text-xs)] font-medium text-[var(--pd-color-fg-muted)]">
            文件操作记录
          </span>
          <span className="text-[10px] text-[var(--pd-color-fg-subtle)]">
            {records.length} 个文件
          </span>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-1">
        {records.length === 0 ? (
          <div className="px-3 py-8 text-center text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]">
            暂无文件操作记录
            <br />
            <span className="mt-1 inline-block text-[10px] opacity-60">
              与 AI 对话产生的文件操作会显示在这里
            </span>
          </div>
        ) : (
          [...tree.children.values()]
            .sort((a, b) => (a.isDir !== b.isDir ? (a.isDir ? -1 : 1) : a.name.localeCompare(b.name)))
            .map((child) => (
              <TreeNodeView
                key={child.fullPath}
                node={child}
                depth={0}
                expandedDirs={expandedDirs}
                onToggleDir={onToggleDir}
              />
            ))
        )}
      </div>

      {/* Legend */}
      {records.length > 0 && (
        <div className="shrink-0 border-t border-[var(--pd-color-border)] px-3 py-2">
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(OP_LABELS) as [FileOp, string][]).map(([op, label]) => (
              <span
                key={op}
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${OP_COLORS[op]}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
