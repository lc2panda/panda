// Input: onNavigate callback (sessionId + messageId) for jumping to search results
// Output: Global search panel — searches across session messages + titles, renders highlighted results
// Pos: PdSidebar workspace panel — replaces session list when search mode active

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useChatStore, type UIMessage } from '@/stores/chatStore';
import { useSessionStore, type SessionMeta } from '@/stores/sessionStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchResult {
  sessionId: string;
  sessionName: string;
  messageId?: string;
  snippet: string;
  matchType: 'message' | 'title';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return (
    <>
      {before}
      <mark className="rounded bg-[var(--pd-color-accent)]/30 text-[var(--pd-color-fg)]">
        {match}
      </mark>
      {after}
    </>
  );
}

function extractSnippet(content: string, query: string, radius = 40): string {
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return content.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(content.length, idx + query.length + radius);
  let snippet = content.slice(start, end);
  if (start > 0) snippet = '…' + snippet;
  if (end < content.length) snippet = snippet + '…';
  return snippet;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface SearchPanelProps {
  onNavigate: (sessionId: string, messageId?: string) => void;
}

export function SearchPanel({ onNavigate }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce 300ms
  const handleChange = useCallback((value: string) => {
    setQuery(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(value.trim()), 300);
  }, []);

  // Cleanup timer
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Store data
  const sessions = useSessionStore((s) => s.sessions);
  const chatSessions = useChatStore((s) => s.sessions);

  // Search
  const results = useMemo<SearchResult[]>(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    const q = debouncedQuery.toLowerCase();
    const out: SearchResult[] = [];

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
              snippet: extractSnippet(msg.content, debouncedQuery),
              matchType: 'message',
            });
            // Limit to 3 message hits per session
            if (out.filter((r) => r.sessionId === session.id && r.matchType === 'message').length >= 3)
              break;
          }
        }
      }
    }

    return out.slice(0, 50); // Cap total results
  }, [debouncedQuery, sessions, chatSessions]);

  return (
    <div className="flex h-full flex-col">
      {/* Search input */}
      <div className="shrink-0 px-3 pb-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="搜索消息和会话…"
          className={[
            'w-full rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)]',
            'bg-[var(--pd-color-bg)] py-1.5 px-3 text-sm',
            'text-[var(--pd-color-fg)] placeholder:text-[var(--pd-color-fg-subtle)]',
            'outline-none focus:border-[var(--pd-color-accent)]',
          ].join(' ')}
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-2">
        {!debouncedQuery && (
          <div className="px-3 py-8 text-center text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]">
            输入关键词搜索会话标题和消息内容
            <br />
            <span className="mt-1 inline-block text-[10px] opacity-60">最少 2 个字符</span>
          </div>
        )}

        {debouncedQuery && results.length === 0 && (
          <div className="px-3 py-8 text-center text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]">
            未找到匹配结果
          </div>
        )}

        {results.map((r, i) => (
          <button
            key={`${r.sessionId}-${r.messageId ?? 'title'}-${i}`}
            onClick={() => onNavigate(r.sessionId, r.messageId)}
            className={[
              'mb-0.5 w-full rounded-[var(--pd-radius-md)] px-3 py-2 text-left',
              'transition-colors hover:bg-[var(--pd-color-bg-hover)]',
            ].join(' ')}
          >
            <div className="flex items-center gap-1.5">
              <span className={[
                'shrink-0 rounded px-1 py-0.5 text-[10px] font-medium',
                r.matchType === 'title'
                  ? 'bg-[var(--pd-color-accent)]/20 text-[var(--pd-color-accent)]'
                  : 'bg-emerald-500/20 text-emerald-400',
              ].join(' ')}>
                {r.matchType === 'title' ? '标题' : '消息'}
              </span>
              <span className="truncate text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]">
                {r.sessionName}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[length:var(--pd-text-sm)] text-[var(--pd-color-fg)]">
              {highlightMatch(r.snippet, debouncedQuery)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
