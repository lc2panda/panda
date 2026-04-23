// Input: onNavigate callback (sessionId + messageId) for jumping to search results
// Output: Multi-mode search panel — sessions/files/full-text with IPC backend + fallback
// Pos: PdSidebar workspace panel — replaces session list when search mode active

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useChatStore, type UIMessage } from '@/stores/chatStore';
import { useSessionStore, type SessionMeta } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { searchFiles as ipcSearchFiles } from '@/ipc/bridge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SearchMode = 'sessions' | 'files' | 'fulltext';

interface SessionSearchResult {
  sessionId: string;
  sessionName: string;
  messageId?: string;
  snippet: string;
  matchType: 'title' | 'content';
}

interface FileSearchResult {
  path: string;
  name: string;
  isDir: boolean;
  source: 'ipc' | 'toolcalls';
}

interface FulltextSearchResult {
  path: string;
  name: string;
  lineNumber?: number;
  lineContent?: string;
  source: 'ipc' | 'toolcalls';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODE_LABELS: Record<SearchMode, string> = {
  sessions: '会话',
  files: '文件',
  fulltext: '全文',
};

const MODE_ICONS: Record<SearchMode, string> = {
  sessions: '💬',
  files: '📁',
  fulltext: '🔍',
};

const FILE_TOOLS = new Set(['Read', 'Write', 'Edit', 'Grep', 'Glob', 'FileReadTool', 'FileEditTool', 'FileWriteTool', 'GrepTool', 'GlobTool']);

// ---------------------------------------------------------------------------
// Props & hook
// ---------------------------------------------------------------------------

export interface SearchPanelProps {
  onNavigate?: (sessionId: string, messageId?: string) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Helpers — extract file paths from tool calls
// ---------------------------------------------------------------------------

function extractPathsFromToolCalls(
  sessions: SessionMeta[],
  chatSessions: Map<string, { messages: UIMessage[] }>,
): FileSearchResult[] {
  const seen = new Map<string, FileSearchResult>();

  for (const session of sessions) {
    const perSession = chatSessions.get(session.id);
    if (!perSession) continue;
    for (const msg of perSession.messages) {
      if (!msg.toolCalls) continue;
      for (const tc of msg.toolCalls) {
        if (!FILE_TOOLS.has(tc.toolName)) continue;
        const p = (tc.input as Record<string, unknown>).file_path
          ?? (tc.input as Record<string, unknown>).path
          ?? (tc.input as Record<string, unknown>).command; // Glob pattern
        if (typeof p !== 'string') continue;
        // Skip glob patterns (contain *)
        if (p.includes('*')) continue;
        const name = p.split('/').pop() || p;
        if (!seen.has(p)) {
          seen.set(p, { path: p, name, isDir: false, source: 'toolcalls' });
        }
      }
    }
  }

  return [...seen.values()];
}

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  // simple substring + path segment match
  if (lower.includes(q)) return true;
  // match filename specifically
  const fileName = lower.split('/').pop() || '';
  return fileName.includes(q);
}

// ---------------------------------------------------------------------------
// Highlight helper
// ---------------------------------------------------------------------------

function highlightMatch(text: string, query: string) {
  if (!query || query.length < 2) return text;
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
// Main component
// ---------------------------------------------------------------------------

export function SearchPanel({ onNavigate }: SearchPanelProps) {
  const sessions = useSessionStore((s) => s.sessions);
  const chatSessions = useChatStore((s) => s.sessions);
  const openInspectorFile = useUIStore((s) => s.openInspectorFile);

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('sessions');
  const [ipcFileResults, setIpcFileResults] = useState<FileSearchResult[]>([]);
  const [ipcSearching, setIpcSearching] = useState(false);
  const [ipcError, setIpcError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 250);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Session search (existing logic) ──────────────────────────────────────
  const sessionResults = useMemo(() => {
    if (mode !== 'sessions' || !debouncedQuery || debouncedQuery.length < 2) return [];
    const q = debouncedQuery.toLowerCase();
    const out: SessionSearchResult[] = [];

    for (const session of sessions) {
      // Title match
      if (session.name.toLowerCase().includes(q)) {
        out.push({
          sessionId: session.id,
          sessionName: session.name,
          snippet: session.name,
          matchType: 'title',
        });
      }

      // Message content match
      const perSession = chatSessions.get(session.id);
      if (perSession) {
        for (const msg of perSession.messages) {
          if (msg.content.toLowerCase().includes(q)) {
            out.push({
              sessionId: session.id,
              sessionName: session.name,
              messageId: msg.id,
              snippet: extractSnippet(msg.content, q),
              matchType: 'content',
            });
          }
        }
      }
    }
    return out.slice(0, 50);
  }, [debouncedQuery, sessions, chatSessions, mode]);

  // ── File search — IPC + fallback ─────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'files' && mode !== 'fulltext') return;
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setIpcFileResults([]);
      setIpcError(null);
      return;
    }

    let cancelled = false;
    setIpcSearching(true);
    setIpcError(null);

    const activeId = useSessionStore.getState().activeId || 'default';

    ipcSearchFiles(activeId, debouncedQuery, 50)
      .then((results) => {
        if (cancelled) return;
        setIpcFileResults(
          results.map((r: { path: string; name: string; isDir: boolean }) => ({
            path: r.path,
            name: r.name,
            isDir: r.isDir,
            source: 'ipc' as const,
          })),
        );
      })
      .catch(() => {
        if (cancelled) return;
        // IPC not available — use fallback
        setIpcError('IPC 不可用，使用本地 tool call 数据');
        const allFiles = extractPathsFromToolCalls(sessions, chatSessions);
        setIpcFileResults(allFiles.filter((f) => fuzzyMatch(f.path, debouncedQuery)));
      })
      .finally(() => {
        if (!cancelled) setIpcSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, mode, sessions, chatSessions]);

  // ── Fallback file results (from tool calls) ──────────────────────────────
  const toolCallFileResults = useMemo(() => {
    if (mode !== 'files' || !debouncedQuery || debouncedQuery.length < 2) return [];
    return extractPathsFromToolCalls(sessions, chatSessions).filter((f) =>
      fuzzyMatch(f.path, debouncedQuery),
    );
  }, [mode, debouncedQuery, sessions, chatSessions]);

  // Merge IPC + fallback, IPC first
  const mergedFileResults = useMemo(() => {
    const seen = new Set<string>();
    const out: FileSearchResult[] = [];
    for (const r of ipcFileResults) {
      if (!seen.has(r.path)) {
        seen.add(r.path);
        out.push(r);
      }
    }
    for (const r of toolCallFileResults) {
      if (!seen.has(r.path)) {
        seen.add(r.path);
        out.push(r);
      }
    }
    return out.slice(0, 100);
  }, [ipcFileResults, toolCallFileResults]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFileClick = useCallback(
    (path: string) => {
      openInspectorFile(path);
    },
    [openInspectorFile],
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col gap-2 p-2">
      {/* Search input */}
      <input
        ref={inputRef}
        type="text"
        placeholder={
          mode === 'sessions'
            ? '搜索会话标题和消息...'
            : mode === 'files'
              ? '搜索项目文件...'
              : '全文搜索文件内容...'
        }
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded border border-[var(--pd-color-border)] bg-[var(--pd-color-bg-input)] px-3 py-1.5 text-[length:var(--pd-text-sm)] text-[var(--pd-color-fg)] placeholder:text-[var(--pd-color-fg-muted)] focus:border-[var(--pd-color-accent)] focus:outline-none"
      />

      {/* Mode tabs */}
      <div className="flex gap-1">
        {(Object.keys(MODE_LABELS) as SearchMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded px-2 py-1 text-[length:var(--pd-text-xs)] font-medium transition-colors ${
              mode === m
                ? 'bg-[var(--pd-color-accent)] text-white'
                : 'bg-[var(--pd-color-bg-hover)] text-[var(--pd-color-fg-muted)] hover:text-[var(--pd-color-fg)]'
            }`}
          >
            {MODE_ICONS[m]} {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Session results ─────────────────────────────────────────── */}
        {mode === 'sessions' && (
          <>
            {debouncedQuery.length >= 2 && sessionResults.length === 0 && (
              <p className="mt-4 text-center text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]">
                未找到匹配的会话
              </p>
            )}
            {sessionResults.map((r, i) => (
              <button
                key={`${r.sessionId}-${r.messageId ?? 'title'}-${i}`}
                onClick={() => onNavigate?.(r.sessionId, r.messageId)}
                className="mb-1 w-full rounded p-2 text-left hover:bg-[var(--pd-color-bg-hover)]"
              >
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-[10px]">
                    {r.matchType === 'title' ? '📌' : '💬'}
                  </span>
                  <span className="truncate text-[length:var(--pd-text-xs)] font-medium text-[var(--pd-color-fg-muted)]">
                    {r.sessionName}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[length:var(--pd-text-sm)] text-[var(--pd-color-fg)]">
                  {highlightMatch(r.snippet, debouncedQuery)}
                </p>
              </button>
            ))}
          </>
        )}

        {/* ── File results ────────────────────────────────────────────── */}
        {(mode === 'files' || mode === 'fulltext') && (
          <>
            {ipcSearching && (
              <p className="mt-2 text-center text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]">
                搜索中...
              </p>
            )}
            {ipcError && (
              <p className="mt-1 text-center text-[length:var(--pd-text-xs)] text-orange-400/80">
                {ipcError}
              </p>
            )}
            {!ipcSearching && debouncedQuery.length >= 2 && mergedFileResults.length === 0 && (
              <p className="mt-4 text-center text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]">
                未找到匹配文件
              </p>
            )}
            {mergedFileResults.map((r) => (
              <button
                key={r.path}
                onClick={() => handleFileClick(r.path)}
                className="mb-1 flex w-full items-center gap-2 rounded p-2 text-left hover:bg-[var(--pd-color-bg-hover)]"
              >
                <span className="shrink-0 text-[12px]">{r.isDir ? '📁' : '📄'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[length:var(--pd-text-sm)] text-[var(--pd-color-fg)]">
                    {highlightMatch(r.name, debouncedQuery)}
                  </p>
                  <p className="truncate text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]">
                    {highlightMatch(r.path, debouncedQuery)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium ${
                    r.source === 'ipc'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {r.source === 'ipc' ? 'FS' : '历史'}
                </span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Snippet extraction
// ---------------------------------------------------------------------------

function extractSnippet(content: string, query: string, radius = 60): string {
  const idx = content.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return content.slice(0, 120);
  const start = Math.max(0, idx - radius);
  const end = Math.min(content.length, idx + query.length + radius);
  return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
}
