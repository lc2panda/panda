// Input: commands list (name+description), callbacks (select/close)
// Output: Floating popup listing slash commands with keyboard navigation
// Pos: Special layer — portal popup triggered from Composer "/" prefix
// Reference: cc-haha desktop_ui 09_slash_command (design spec only, not source)

import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/cn';

export interface PdSlashCommand {
  name: string;
  description: string;
}

export interface PdSlashCommandPopupProps {
  open: boolean;
  commands: PdSlashCommand[];
  onSelect: (name: string) => void;
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

export const PdSlashCommandPopup: React.FC<PdSlashCommandPopupProps> = ({
  open,
  commands,
  onSelect,
  onClose,
  className,
}) => {
  const [highlightIdx, setHighlightIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, commands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = commands[highlightIdx];
        if (cmd) onSelect(cmd.name);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, commands, highlightIdx, onSelect, onClose]);

  useEffect(() => {
    if (highlightIdx >= commands.length) setHighlightIdx(0);
  }, [commands.length, highlightIdx]);

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
      aria-label="Slash commands"
    >
      <ul className="max-h=[280px] overflow-y-auto space-y-0.5 list-none m-0 p-0 max-h-[280px]">
        {commands.length === 0 ? (
          <li className="px-3 py-6 text-center text-[12px] text-[var(--pd-color-fg-muted)]">
            No commands
          </li>
        ) : (
          commands.map((cmd, i) => {
            const highlighted = i === highlightIdx;
            return (
              <li key={cmd.name}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlightIdx(i)}
                  onClick={() => onSelect(cmd.name)}
                  className={cn(
                    'h-8 w-full rounded-[8px] px-3 flex items-center gap-3 text-[13px] text-left',
                    'transition-colors duration-100',
                    highlighted
                      ? 'bg-[var(--pd-color-bg-subtle)]'
                      : 'hover:bg-[var(--pd-color-bg-hover)]',
                  )}
                >
                  <span
                    className={cn(
                      'font-[family-name:var(--pd-font-mono)] font-[var(--pd-font-medium)]',
                      'text-[var(--pd-color-accent)]',
                    )}
                  >
                    {cmd.name}
                  </span>
                  <span className="ml-auto text-[var(--pd-color-fg-muted)] truncate">
                    {cmd.description}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      <div className="border-t border-[var(--pd-color-border-subtle)] mt-2 pt-2 flex gap-4 text-[11px] text-[var(--pd-color-fg-muted)]">
        <span className="flex items-center gap-1">
          <KbdKey>Up</KbdKey>
          <KbdKey>Down</KbdKey>
          <span>navigate</span>
        </span>
        <span className="flex items-center gap-1">
          <KbdKey>Enter</KbdKey>
          <span>select</span>
        </span>
        <span className="flex items-center gap-1">
          <KbdKey>Esc</KbdKey>
          <span>dismiss</span>
        </span>
      </div>
    </div>
  );
};

PdSlashCommandPopup.displayName = 'PdSlashCommandPopup';
