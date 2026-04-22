// Input: open flag, session list, onClose/onSelect callbacks
// Output: Cmd+P overlay — fuzzy-searchable session switcher panel
// Pos: App top-level overlay — wired in App.tsx (W12-1, commit bc455f6)

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, MessageSquare, X } from 'lucide-react';
import { t } from '../../i18n';

export interface SessionItem {
  id: string;
  title: string;
  updatedAt: number;
  messageCount: number;
  model?: string;
}

export interface PdSessionSwitcherProps {
  open: boolean;
  onClose: () => void;
  sessions: SessionItem[];
  onSelect: (id: string) => void;
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const s = text.toLowerCase();
  let qi = 0;
  for (let i = 0; i < s.length && qi < q.length; i++) {
    if (s[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function PdSessionSwitcher({ open, onClose, sessions, onSelect }: PdSessionSwitcherProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query) return sessions;
    return sessions.filter(s => fuzzyMatch(query, s.title));
  }, [query, sessions]);

  useEffect(() => {
    if (open) { setQuery(''); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); break;
      case 'Enter': e.preventDefault(); if (filtered[selectedIndex]) { onSelect(filtered[selectedIndex].id); onClose(); } break;
      case 'Escape': e.preventDefault(); onClose(); break;
    }
  }, [filtered, selectedIndex, onSelect, onClose]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 'var(--pd-z-modal)', display: 'flex', justifyContent: 'center', paddingTop: '20vh' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: '480px', maxHeight: '360px', background: 'var(--pd-color-bg-elevated)', borderRadius: 'var(--pd-radius-xl)', boxShadow: 'var(--pd-shadow-xl)', border: '1px solid var(--pd-color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onKeyDown={handleKeyDown}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--pd-color-border)' }}>
          <Search size={18} style={{ color: 'var(--pd-color-fg-muted)' }} />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder={t('sessionSwitcher.placeholder')} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--pd-text-base)', color: 'var(--pd-color-fg)', fontFamily: 'var(--pd-font-sans)' }} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '4px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--pd-color-fg-muted)', fontSize: 'var(--pd-text-sm)' }}>{t('sessionSwitcher.noResults')}</div>
          ) : filtered.map((s, i) => (
            <button key={s.id} onClick={() => { onSelect(s.id); onClose(); }} style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px',
              background: i === selectedIndex ? 'var(--pd-color-bg-hover)' : 'transparent',
              border: 'none', borderRadius: 'var(--pd-radius-sm)', cursor: 'pointer', textAlign: 'left',
              color: 'var(--pd-color-fg)', fontSize: 'var(--pd-text-sm)', fontFamily: 'var(--pd-font-sans)',
            }} role="option" aria-selected={i === selectedIndex}>
              <MessageSquare size={16} style={{ color: 'var(--pd-color-fg-muted)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--pd-color-fg-muted)' }}>{s.messageCount} 条消息 · {s.model || 'sonnet'}</div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--pd-color-fg-muted)', flexShrink: 0 }}>{timeAgo(s.updatedAt)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
