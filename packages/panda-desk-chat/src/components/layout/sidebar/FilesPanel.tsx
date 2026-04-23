// Input: chatStore toolCalls + IPC listDirectory, uiStore for inspector linkage
// Output: File tree with operation timeline, search filter, relative timestamps, inspector click-through
// Pos: PdSidebar workspace panel — file browser with IPC-backed directory listing + fallback

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useChatStore, type UIMessage } from '@/stores/chatStore';
import { useSessionStore, type SessionMeta } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { listDirectory as ipcListDirectory } from '@/ipc/bridge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FileOp = 'read' | 'edit' | 'write' | 'search';

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

interface IpcDirEntry {
  name: string;
  isDir: boolean;
  size: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOL_OP_MAP: Record<string, FileOp> = {
  Read: 'read',
  FileReadTool: 'read',
  Write: 'write',
  FileWriteTool: 'write',
  Edit: 'edit',
  FileEditTool: 'edit',
  Grep: 'search',
  GrepTool: 'search',
  Glob: 'search',
  GlobTool: 'search',
};

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
// Helpers
// ---------------------------------------------------------------------------

function toolToOp(toolName: string): FileOp | null {
  return TOOL_OP_MAP[toolName] ?? null;
}

function extractPath(tc: { toolName: string; input: Record<string, unknown> }): string | null {
  const inp = tc.input;
  if (typeof inp.file_path === 'string') return inp.file_path;
  if (typeof inp.path === 'string' && !String(inp.path).includes('*')) return inp.path;
  if (typeof inp.pattern === 'string') {
    const m = String(inp.pattern).match(/^([^*?]+)\//);
    if (m) return m[1];
  }
  return null;
}

function relativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 0) return '刚刚';
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
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
    if (!fileName) continue;
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

function matchesFilter(node: TreeNode, filter: string): boolean {
  const q = filter.toLowerCase();
  if (node.name.toLowerCase().includes(q)) return true;
  if (node.fullPath.toLowerCase().includes(q)) return true;
  // Check children recursively
  for (const child of node.children.values()) {
    if (matchesFilter(child, filter)) return true;
  }
  return false;
}

function highlightText(text: string, query: string) {
  if (!query || query.length < 1) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-500/30 text-inherit">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TreeNodeView({
  node,
  depth,
  expandedDirs,
  onToggleDir,
  onFileClick,
  filter,
}: {
  node: TreeNode;
  depth: number;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
  onFileClick: (path: string) => void;
  filter: string;
}) {
  const isExpanded = expandedDirs.has(node.fullPath);

  // Filter: skip nodes that don't match
  if (filter && !matchesFilter(node, filter)) return null;

  const sortedChildren = useMemo(
    () =>
      [...node.children.values()].sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        // Sort by latest timestamp (newest first), then by name
        const aTime = a.files[0]?.timestamp ?? 0;
        const bTime = b.files[0]?.timestamp ?? 0;
        if (aTime !== bTime) return bTime - aTime;
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
          <span className="w-3 shrink-0 text-center text-[10px]">{isExpanded ? '▾' : '▸'}</span>
          <span className="truncate">{filter ? highlightText(node.name, filter) : node.name}</span>
        </button>
        {isExpanded &&
          sortedChildren.map((child) => (
            <TreeNodeView
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              expandedDirs={expandedDirs}
              onToggleDir={onToggleDir}
              onFileClick={onFileClick}
              filter={filter}
            />
          ))}
      </div>
    );
  }

  // File node
  const latestOp = node.files[0];
  const ops = [...new Set(node.files.map((f) => f.op))];
  return (
    <button
      onClick={() => onFileClick(node.fullPath)}
      className="group flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg)] hover:bg-[var(--pd-color-bg-hover)]"
      style={{ paddingLeft: `${depth * 12 + 4}px` }}
      title={`${node.fullPath}\n最近: ${latestOp ? relativeTime(latestOp.timestamp) : '—'}`}
    >
      <span className="w-3 shrink-0 text-center text-[10px]">📄</span>
      <span className="min-w-0 flex-1 truncate">
        {filter ? highlightText(node.name, filter) : node.name}
      </span>
      {/* Operation badges */}
      <span className="flex shrink-0 gap-0.5">
        {ops.map((op) => (
          <span
            key={op}
            className={`rounded px-1 py-px text-[8px] font-medium leading-none ${OP_COLORS[op]}`}
          >
            {OP_LABELS[op]}
          </span>
        ))}
      </span>
      {/* Relative time */}
      {latestOp && (
        <span className="shrink-0 text-[9px] text-[var(--pd-color-fg-muted)] opacity-0 transition-opacity group-hover:opacity-100">
          {relativeTime(latestOp.timestamp)}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// IPC Directory listing component
// ---------------------------------------------------------------------------

function IpcDirectoryView({
  onFileClick,
  filter,
}: {
  onFileClick: (path: string) => void;
  filter: string;
}) {
  const [entries, setEntries] = useState<IpcDirEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDir, setCurrentDir] = useState('.');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const activeId = useSessionStore.getState().activeId || 'default';
    ipcListDirectory(activeId, currentDir)
      .then((result) => {
        if (cancelled) return;
        setEntries(result as unknown as IpcDirEntry[]);
      })
      .catch(() => {
        if (!cancelled) setError('无法连接文件系统');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentDir]);

  const filteredEntries = useMemo(() => {
    if (!filter) return entries;
    const q = filter.toLowerCase();
    return entries.filter((e) => e.name.toLowerCase().includes(q));
  }, [entries, filter]);

  if (loading) {
    return (
      <p className="py-2 text-center text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]">
        加载目录...
      </p>
    );
  }

  if (error) return null; // Silently fall back to tool-call tree

  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center gap-1 px-1">
        <span className="text-[10px] text-[var(--pd-color-fg-muted)]">📂</span>
        <span className="truncate text-[10px] text-[var(--pd-color-fg-muted)]">{currentDir}</span>
        {currentDir !== '.' && (
          <button
            onClick={() => {
              const parent = currentDir.split('/').slice(0, -1).join('/') || '.';
              setCurrentDir(parent);
            }}
            className="ml-auto text-[10px] text-[var(--pd-color-accent)] hover:underline"
          >
            上级
          </button>
        )}
      </div>
      {filteredEntries.map((entry) => (
        <button
          key={entry.name}
          onClick={() => {
            if (entry.isDir) {
              setCurrentDir(currentDir === '.' ? entry.name : `${currentDir}/${entry.name}`);
            } else {
              onFileClick(currentDir === '.' ? entry.name : `${currentDir}/${entry.name}`);
            }
          }}
          className="flex w-full items-center gap-1.5 rounded px-2 py-0.5 text-left text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg)] hover:bg-[var(--pd-color-bg-hover)]"
        >
          <span className="shrink-0 text-[10px]">{entry.isDir ? '📁' : '📄'}</span>
          <span className="min-w-0 flex-1 truncate">
            {filter ? highlightText(entry.name, filter) : entry.name}
          </span>
          {!entry.isDir && entry.size > 0 && (
            <span className="shrink-0 text-[9px] text-[var(--pd-color-fg-muted)]">
              {entry.size < 1024
                ? `${entry.size}B`
                : entry.size < 1024 * 1024
                  ? `${(entry.size / 1024).toFixed(1)}K`
                  : `${(entry.size / 1024 / 1024).toFixed(1)}M`}
            </span>
          )}
        </button>
      ))}
      {filteredEntries.length === 0 && (
        <p className="py-1 text-center text-[10px] text-[var(--pd-color-fg-muted)]">空</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FilesPanel() {
  const sessions = useSessionStore((s) => s.sessions);
  const chatSessions = useChatStore((s) => s.sessions);
  const openInspectorFile = useUIStore((s) => s.openInspectorFile);

  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));
  const [filter, setFilter] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'tree' | 'browse'>('timeline');
  const filterRef = useRef<HTMLInputElement>(null);

  // ── Extract file records from tool calls ─────────────────────────────────
  const records = useMemo(() => {
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

  // ── All records (for timeline, grouped per-file with full history) ───────
  const allRecords = useMemo(() => {
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
            out.push({ path, op, sessionId: session.id, sessionName: session.name, timestamp: msg.timestamp });
          }
        }
      }
    }
    return out.sort((a, b) => b.timestamp - a.timestamp);
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

  const handleFileClick = useCallback(
    (path: string) => {
      openInspectorFile(path);
    },
    [openInspectorFile],
  );

  // ── Filtered timeline ────────────────────────────────────────────────────
  const filteredTimeline = useMemo(() => {
    if (!filter) return allRecords.slice(0, 100);
    const q = filter.toLowerCase();
    return allRecords.filter((r) => r.path.toLowerCase().includes(q)).slice(0, 100);
  }, [allRecords, filter]);

  // Stats
  const opCounts = useMemo(() => {
    const counts: Record<FileOp, number> = { read: 0, edit: 0, write: 0, search: 0 };
    for (const r of records) counts[r.op]++;
    return counts;
  }, [records]);

  return (
    <div className="flex h-full flex-col gap-1 p-2">
      {/* Filter input */}
      <input
        ref={filterRef}
        type="text"
        placeholder="过滤文件..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full rounded border border-[var(--pd-color-border)] bg-[var(--pd-color-bg-input)] px-2 py-1 text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg)] placeholder:text-[var(--pd-color-fg-muted)] focus:border-[var(--pd-color-accent)] focus:outline-none"
      />

      {/* View mode tabs */}
      <div className="flex gap-1">
        {(['timeline', 'tree', 'browse'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setViewMode(m)}
            className={`flex-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
              viewMode === m
                ? 'bg-[var(--pd-color-accent)] text-white'
                : 'bg-[var(--pd-color-bg-hover)] text-[var(--pd-color-fg-muted)] hover:text-[var(--pd-color-fg)]'
            }`}
          >
            {m === 'timeline' ? '⏱ 时间线' : m === 'tree' ? '🌲 树' : '📂 浏览'}
          </button>
        ))}
      </div>

      {/* Op summary badges */}
      <div className="flex flex-wrap gap-1">
        {(Object.entries(OP_LABELS) as [FileOp, string][]).map(([op, label]) => (
          <span
            key={op}
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${OP_COLORS[op]}`}
          >
            {label} {opCounts[op]}
          </span>
        ))}
        <span className="rounded bg-[var(--pd-color-bg-hover)] px-1.5 py-0.5 text-[10px] text-[var(--pd-color-fg-muted)]">
          {records.length} 文件
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Timeline view ──────────────────────────────────────────── */}
        {viewMode === 'timeline' && (
          <div className="space-y-0.5">
            {filteredTimeline.length === 0 ? (
              <p className="mt-4 text-center text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]">
                {filter ? '无匹配记录' : '暂无文件操作记录'}
              </p>
            ) : (
              filteredTimeline.map((r, i) => (
                <button
                  key={`${r.path}-${r.timestamp}-${i}`}
                  onClick={() => handleFileClick(r.path)}
                  className="group flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left hover:bg-[var(--pd-color-bg-hover)]"
                >
                  <span
                    className={`shrink-0 rounded px-1 py-px text-[8px] font-medium leading-none ${OP_COLORS[r.op]}`}
                  >
                    {OP_LABELS[r.op]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg)]">
                    {filter ? highlightText(r.path.split('/').pop() || r.path, filter) : (r.path.split('/').pop() || r.path)}
                  </span>
                  <span className="shrink-0 text-[9px] text-[var(--pd-color-fg-muted)]">
                    {relativeTime(r.timestamp)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* ── Tree view ──────────────────────────────────────────────── */}
        {viewMode === 'tree' && (
          <div>
            {records.length === 0 ? (
              <p className="mt-4 text-center text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]">
                暂无文件操作记录
              </p>
            ) : (
              [...tree.children.values()].map((child) => (
                <TreeNodeView
                  key={child.fullPath}
                  node={child}
                  depth={0}
                  expandedDirs={expandedDirs}
                  onToggleDir={onToggleDir}
                  onFileClick={handleFileClick}
                  filter={filter}
                />
              ))
            )}
          </div>
        )}

        {/* ── Browse view (IPC directory listing) ────────────────────── */}
        {viewMode === 'browse' && (
          <IpcDirectoryView onFileClick={handleFileClick} filter={filter} />
        )}
      </div>
    </div>
  );
}
