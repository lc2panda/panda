// Input: entries (files/folders), current breadcrumb path, callbacks (navigate/attach/close)
// Output: Floating popup above composer for @-mention file picker
// Pos: Special layer — portal popup triggered from Composer @-mention
// Reference: cc-haha desktop_ui 09_file_search (design spec only, not source)

import React, { useEffect, useRef, useState, type ComponentType } from 'react';
import {
  // @ts-ignore lucide-react bundled .d.ts misses Folder at top-level
  Folder as _Folder,
  // @ts-ignore lucide-react bundled .d.ts misses File at top-level
  File as _File,
} from 'lucide-react';
import { cn } from '../../lib/cn';

type IconFC = ComponentType<{ className?: string; size?: number }>;
const Folder = _Folder as IconFC;
const FileIcon = _File as IconFC;

export type PdFileEntryType = 'folder' | 'file';

export interface PdFileEntry {
  name: string;
  type: PdFileEntryType;
}

export interface PdFilePickerPopupProps {
  open: boolean;
  breadcrumb: string[];
  entries: PdFileEntry[];
  onNavigate: (name: string) => void;
  onAttach: (name: string) => void;
  onClose: () => void;
  className?: string;
}

function KbdKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center rounded-[3px] px-1.5 py-0.5',
        'bg-[var(--pd-color-bg-subtle)] text-[var(--pd-color-fg-muted)]',
        'text-[10px] font-[family-name:var(--pd-font-mono)] font-[var(--pd-font-medium)]',
      )}
    >
      {children}
    </kbd>
  );
}

export const PdFilePickerPopup: React.FC<PdFilePickerPopupProps> = ({
  open,
  breadcrumb,
  entries,
  onNavigate,
  onAttach,
  onClose,
  className,
}) => {
  const [highlightIdx, setHighlightIdx] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, entries.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const entry = entries[highlightIdx];
        if (!entry) return;
        if (entry.type === 'folder') onNavigate(entry.name);
        else onAttach(entry.name);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, entries, highlightIdx, onNavigate, onAttach, onClose]);

  useEffect(() => {
    if (highlightIdx >= entries.length) setHighlightIdx(0);
  }, [entries.length, highlightIdx]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'rounded-[14px] border border-[var(--pd-color-border)]',
        'bg-[var(--pd-color-bg-elevated)] shadow-[var(--pd-shadow-lg)]',
        'p-3 w-[min(640px,90vw)]',
        className,
      )}
      role="dialog"
      aria-label="File picker"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 px-2 py-1 text-[11px] text-[var(--pd-color-fg-muted)]">
        <Folder size={12} className="text-[var(--pd-color-accent)]" />
        {breadcrumb.map((part, i) => (
          <React.Fragment key={`${part}-${i}`}>
            <span className={cn(i === breadcrumb.length - 1 && 'text-[var(--pd-color-fg)]')}>
              {part}
            </span>
            {i < breadcrumb.length - 1 && <span>/</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Entry list */}
      <ul
        ref={listRef}
        className="mt-2 max-h-[240px] overflow-y-auto space-y-0.5 list-none m-0 p-0"
      >
        {entries.length === 0 ? (
          <li className="px-3 py-6 text-center text-[12px] text-[var(--pd-color-fg-muted)]">
            No files
          </li>
        ) : (
          entries.map((entry, i) => {
            const highlighted = i === highlightIdx;
            const Icon = entry.type === 'folder' ? Folder : FileIcon;
            return (
              <li key={entry.name}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlightIdx(i)}
                  onClick={() => {
                    if (entry.type === 'folder') onNavigate(entry.name);
                    else onAttach(entry.name);
                  }}
                  className={cn(
                    'h-8 w-full rounded-[8px] px-3 flex items-center gap-2.5 text-[13px] text-left',
                    'transition-colors duration-100',
                    highlighted
                      ? 'bg-[var(--pd-color-bg-subtle)] text-[var(--pd-color-fg)]'
                      : 'text-[var(--pd-color-fg)] hover:bg-[var(--pd-color-bg-hover)]',
                  )}
                >
                  <Icon
                    size={14}
                    className={
                      entry.type === 'folder'
                        ? 'text-[var(--pd-color-accent)] shrink-0'
                        : 'text-[var(--pd-color-fg-muted)] shrink-0'
                    }
                  />
                  <span className="truncate">{entry.name}</span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      {/* Keyboard hints */}
      <div className="border-t border-[var(--pd-color-border-subtle)] mt-2 pt-2 flex gap-4 text-[11px] text-[var(--pd-color-fg-muted)]">
        <span className="flex items-center gap-1">
          <KbdKey>↑↓</KbdKey>
          <span>navigate</span>
        </span>
        <span className="flex items-center gap-1">
          <KbdKey>Enter</KbdKey>
          <span>attach</span>
        </span>
        <span className="flex items-center gap-1">
          <KbdKey>Esc</KbdKey>
          <span>close</span>
        </span>
      </div>
    </div>
  );
};

PdFilePickerPopup.displayName = 'PdFilePickerPopup';
