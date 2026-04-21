// Input: Cmd+K 触发
// Output: 全局命令面板浮层
// Pos: App 顶层 overlay

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { t } from '../../i18n';

export interface Command {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void;
}

export interface PdCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function PdCommandPalette({ open, onClose, commands }: PdCommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return commands;
    return commands.filter(cmd => fuzzyMatch(query, cmd.label) || fuzzyMatch(query, cmd.group));
  }, [query, commands]);

  const grouped = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filtered.forEach(cmd => {
      if (!groups[cmd.group]) groups[cmd.group] = [];
      groups[cmd.group].push(cmd);
    });
    return groups;
  }, [filtered]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const executeSelected = useCallback(() => {
    if (filtered[selectedIndex]) {
      filtered[selectedIndex].action();
      onClose();
    }
  }, [filtered, selectedIndex, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        executeSelected();
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filtered.length, executeSelected, onClose]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 'var(--pd-z-modal)',
      display: 'flex', justifyContent: 'center', paddingTop: '20vh',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      }} />

      {/* Panel */}
      <div style={{
        position: 'relative', width: '560px', maxHeight: '400px',
        background: 'var(--pd-color-bg-elevated)',
        borderRadius: 'var(--pd-radius-xl)',
        boxShadow: 'var(--pd-shadow-xl)',
        border: '1px solid var(--pd-color-border)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }} onKeyDown={handleKeyDown}>
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 16px',
          borderBottom: '1px solid var(--pd-color-border)',
        }}>
          <Search size={18} style={{ color: 'var(--pd-color-fg-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('commandPalette.placeholder')}
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', fontSize: 'var(--pd-text-base)',
              color: 'var(--pd-color-fg)',
              fontFamily: 'var(--pd-font-sans)',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--pd-color-fg-muted)', padding: '2px',
            }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} style={{ flex: 1, overflow: 'auto', padding: '4px' }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: '24px', textAlign: 'center',
              color: 'var(--pd-color-fg-muted)', fontSize: 'var(--pd-text-sm)',
            }}>
              {t('commandPalette.noResults')}
            </div>
          ) : (
            Object.entries(grouped).map(([group, cmds]) => (
              <div key={group}>
                <div style={{
                  padding: '6px 12px', fontSize: '11px',
                  color: 'var(--pd-color-fg-muted)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {group}
                </div>
                {cmds.map(cmd => {
                  const globalIdx = filtered.indexOf(cmd);
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => { cmd.action(); onClose(); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        width: '100%', padding: '8px 12px',
                        background: globalIdx === selectedIndex ? 'var(--pd-color-bg-hover)' : 'transparent',
                        border: 'none', borderRadius: 'var(--pd-radius-sm)',
                        cursor: 'pointer', textAlign: 'left',
                        color: 'var(--pd-color-fg)', fontSize: 'var(--pd-text-sm)',
                        fontFamily: 'var(--pd-font-sans)',
                      }}
                      role="option"
                      aria-selected={globalIdx === selectedIndex}
                    >
                      {cmd.icon && <span style={{ flexShrink: 0, width: 18 }}>{cmd.icon}</span>}
                      <span style={{ flex: 1 }}>{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd style={{
                          fontSize: '10px', padding: '2px 6px',
                          borderRadius: 'var(--pd-radius-xs)',
                          background: 'var(--pd-color-bg-subtle)',
                          color: 'var(--pd-color-fg-muted)',
                          border: '1px solid var(--pd-color-border)',
                        }}>
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
