// Input: Tab ID, position coordinates, callbacks
// Output: Context menu overlay with tab actions
// Pos: Layout layer — Chrome-style tab right-click menu

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TabContextMenuProps {
  tabId: string;
  x: number;
  y: number;
  onClose: () => void;
  onCloseTab: (id: string) => void;
  onCloseOthers: (id: string) => void;
  onCloseAll: () => void;
  onPin: (id: string) => void;
  isPinned: boolean;
}

// ---------------------------------------------------------------------------
// Menu item
// ---------------------------------------------------------------------------

interface MenuItemProps {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function MenuItem({ label, onClick, danger }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full px-3 py-1.5 text-left text-[var(--pd-text-sm)]',
        'transition-colors duration-[var(--pd-duration-quick)]',
        'hover:bg-[var(--pd-color-bg-hover)]',
        danger
          ? 'text-[var(--pd-color-danger)] hover:text-[var(--pd-color-danger)]'
          : 'text-[var(--pd-color-fg)]',
      )}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

function Separator() {
  return <div className="my-1 h-px bg-[var(--pd-color-border)]" />;
}

// ---------------------------------------------------------------------------
// TabContextMenu
// ---------------------------------------------------------------------------

export function TabContextMenu({
  tabId,
  x,
  y,
  onClose,
  onCloseTab,
  onCloseOthers,
  onCloseAll,
  onPin,
  isPinned,
}: TabContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Close on click-outside or ESC ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-50 min-w-[160px] py-1',
        'bg-[var(--pd-color-bg-elevated)]',
        'border border-[var(--pd-color-border)]',
        'shadow-[var(--pd-shadow-md)]',
        'rounded-[var(--pd-radius-md)]',
      )}
      style={{ left: x, top: y }}
    >
      <MenuItem
        label={isPinned ? 'Unpin Tab' : 'Pin Tab'}
        onClick={() => { onPin(tabId); onClose(); }}
      />
      <Separator />
      <MenuItem
        label="Close Tab"
        onClick={() => { onCloseTab(tabId); onClose(); }}
      />
      <MenuItem
        label="Close Others"
        onClick={() => { onCloseOthers(tabId); onClose(); }}
      />
      <MenuItem
        label="Close All"
        danger
        onClick={() => { onCloseAll(); onClose(); }}
      />
    </div>
  );
}
