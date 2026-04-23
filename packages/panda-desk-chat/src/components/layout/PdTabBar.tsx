// Input: Tab list, selection/close/new callbacks
// Output: Chrome-style horizontal tab bar with overflow scroll
// Pos: Layout layer — sits above main content area, within the center column

import { type ComponentType, useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/cn';
import {
  X as _X,
  Plus as _Plus,
  ChevronLeft as _ChevronLeft,
  ChevronRight as _ChevronRight,
} from 'lucide-react';

// Re-type lucide icons for React 18 compat (hoisted @types/react@19 conflict)
type IconFC = ComponentType<{ className?: string; size?: number }>;
const X = _X as IconFC;
const Plus = _Plus as IconFC;
const ChevronLeft = _ChevronLeft as IconFC;
const ChevronRight = _ChevronRight as IconFC;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PdTabBarTab {
  id: string;
  title: string;
  isActive: boolean;
  isPinned: boolean;
  hasChanges?: boolean;
}

export interface PdTabBarProps {
  tabs: PdTabBarTab[];
  onSelect: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onNewTab: () => void;
  // Drag-reorder
  onDragStart?: (index: number) => void;
  onDragOver?: (index: number) => void;
  onDragEnd?: () => void;
  onDragLeave?: () => void;
  dragFromIndex?: number | null;
  dropTargetIndex?: number | null;
  // Context menu
  onContextMenu?: (tabId: string, x: number, y: number) => void;
  // Double-click rename
  onRename?: (tabId: string, newTitle: string) => void;
  // Middle-click close
  onMiddleClick?: (tabId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PdTabBar({
  tabs,
  onSelect,
  onClose,
  onNewTab,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragLeave,
  dragFromIndex,
  dropTargetIndex,
  onContextMenu,
  onRename,
  onMiddleClick,
}: PdTabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // ── Editing state (double-click rename) ──
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // ── Overflow menu state ──
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const overflowBtnRef = useRef<HTMLButtonElement>(null);
  const overflowMenuRef = useRef<HTMLDivElement>(null);

  // ── Overflow detection ──
  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    checkOverflow();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkOverflow, { passive: true });
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkOverflow);
      ro.disconnect();
    };
  }, [checkOverflow, tabs.length]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
  }, []);

  // ── Double-click rename helpers ──
  const startEditing = useCallback((tabId: string, currentTitle: string) => {
    setEditingTabId(tabId);
    setEditValue(currentTitle);
    // Focus the input on next tick after render
    requestAnimationFrame(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    });
  }, []);

  const commitRename = useCallback(() => {
    if (editingTabId && editValue.trim()) {
      onRename?.(editingTabId, editValue.trim());
    }
    setEditingTabId(null);
    setEditValue('');
  }, [editingTabId, editValue, onRename]);

  const cancelEditing = useCallback(() => {
    setEditingTabId(null);
    setEditValue('');
  }, []);

  // ── Close overflow menu on outside click ──
  useEffect(() => {
    if (!showOverflowMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        overflowBtnRef.current?.contains(target) ||
        overflowMenuRef.current?.contains(target)
      ) {
        return;
      }
      setShowOverflowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showOverflowMenu]);

  // ── Check if tabs overflow (for showing overflow menu button) ──
  const hasOverflow = canScrollLeft || canScrollRight;

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-stretch',
        'border-b border-[var(--pd-color-border)]',
        'bg-[var(--pd-color-bg-subtle)]',
      )}
      style={{ height: 'var(--pd-layout-tabbar-height)' }}
    >
      {/* ── Scroll-left arrow ── */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-0 z-10 flex h-full w-6 items-center justify-center',
            'bg-gradient-to-r from-[var(--pd-color-bg-subtle)] to-transparent',
            'text-[var(--pd-color-fg-muted)]',
          )}
          aria-label="Scroll tabs left"
        >
          <ChevronLeft size={14} />
        </button>
      )}

      {/* ── Tab list ── */}
      <div
        ref={scrollRef}
        className="flex flex-1 items-stretch overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab, index) => (
          <div key={tab.id} className="relative flex items-stretch">
            {/* ── Drop indicator (left edge) ── */}
            {dropTargetIndex === index && dragFromIndex !== null && dragFromIndex !== index && (
              <span
                className="absolute left-0 top-1 bottom-1 z-20 w-0.5"
                style={{ background: 'var(--pd-color-accent)' }}
              />
            )}

            <button
              type="button"
              draggable={editingTabId !== tab.id}
              onClick={() => {
                if (editingTabId !== tab.id) onSelect(tab.id);
              }}
              onDoubleClick={() => {
                if (dragFromIndex === null) {
                  startEditing(tab.id, tab.title);
                }
              }}
              onMouseDown={(e) => {
                // Middle-click close (button === 1)
                if (e.button === 1) {
                  e.preventDefault();
                  if (!tab.isPinned) {
                    onMiddleClick?.(tab.id);
                  }
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu?.(tab.id, e.clientX, e.clientY);
              }}
              onDragStart={(e) => {
                if (editingTabId === tab.id) {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.effectAllowed = 'move';
                onDragStart?.(index);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                onDragOver?.(index);
              }}
              onDragLeave={() => onDragLeave?.()}
              onDrop={(e) => {
                e.preventDefault();
                onDragEnd?.();
              }}
              onDragEnd={() => onDragEnd?.()}
              className={cn(
                'group relative flex shrink-0 items-center gap-2 px-3',
                'min-w-[120px] max-w-[240px]',
                'transition-[colors,transform,opacity]',
                'duration-[var(--pd-duration-quick)] ease-[var(--pd-ease-standard)]',
                tab.isActive
                  ? 'bg-[var(--pd-color-bg)] text-[var(--pd-color-fg)]'
                  : 'text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)]',
              )}
              style={{
                height: '36px',
                fontSize: 'var(--pd-text-sm)',
                opacity: dragFromIndex === index ? 0.5 : 1,
                transition: 'transform 0.2s ease, opacity 0.15s ease, background-color 0.15s ease',
              }}
            >
              {/* Active indicator — 2px accent bottom border */}
              {tab.isActive && (
                <span
                  className="absolute inset-x-0 bottom-0"
                  style={{ height: '2px', background: 'var(--pd-color-accent)' }}
                />
              )}

              {/* Unsaved-changes dot */}
              {tab.hasChanges && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pd-color-accent)]" />
              )}

              {/* Title — inline edit or display */}
              {editingTabId === tab.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitRename();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelEditing();
                    }
                    e.stopPropagation();
                  }}
                  onBlur={() => commitRename()}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={cn(
                    'w-full truncate bg-transparent border-0 outline-none',
                    'border-b border-[var(--pd-color-accent)]',
                    'text-[var(--pd-color-fg)]',
                  )}
                  style={{
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    padding: 0,
                    margin: 0,
                  }}
                />
              ) : (
                <span className="truncate">{tab.title}</span>
              )}

              {/* Close button (hidden for pinned tabs) */}
              {!tab.isPinned && (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(tab.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onClose(tab.id);
                    }
                  }}
                  className={cn(
                    'ml-auto shrink-0 rounded-[var(--pd-radius-xs)] p-0.5',
                    'opacity-0 transition-opacity group-hover:opacity-100',
                    'text-[var(--pd-color-fg-subtle)] hover:bg-[var(--pd-color-bg-hover)]',
                    'hover:text-[var(--pd-color-fg)]',
                  )}
                >
                  <X size={12} />
                </span>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* ── Scroll-right arrow ── */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-10 z-10 flex h-full w-6 items-center justify-center',
            'bg-gradient-to-l from-[var(--pd-color-bg-subtle)] to-transparent',
            'text-[var(--pd-color-fg-muted)]',
          )}
          aria-label="Scroll tabs right"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* ── Overflow menu button (visible when tabs overflow) ── */}
      {hasOverflow && (
        <button
          ref={overflowBtnRef}
          type="button"
          onClick={() => setShowOverflowMenu((v) => !v)}
          className={cn(
            'flex shrink-0 items-center justify-center px-2',
            'text-[var(--pd-color-fg-muted)] transition-colors',
            'hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]',
            showOverflowMenu && 'bg-[var(--pd-color-bg-hover)] text-[var(--pd-color-fg)]',
          )}
          aria-label="Show all tabs"
        >
          <span style={{ fontSize: 16, lineHeight: 1, letterSpacing: '1px' }}>&#x22EF;</span>
        </button>
      )}

      {/* ── Overflow dropdown ── */}
      {showOverflowMenu && (
        <div
          ref={overflowMenuRef}
          className={cn(
            'absolute right-10 top-full z-50',
            'min-w-[180px] max-h-[300px] overflow-y-auto',
            'rounded-[var(--pd-radius-md)]',
            'border border-[var(--pd-color-border)]',
            'bg-[var(--pd-color-bg-elevated)]',
            'shadow-lg',
            'py-1',
          )}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onSelect(tab.id);
                setShowOverflowMenu(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left',
                'text-[var(--pd-text-sm)]',
                'transition-colors duration-100',
                tab.isActive
                  ? 'bg-[var(--pd-color-accent-subtle)] text-[var(--pd-color-accent-fg)] font-medium'
                  : 'text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]',
              )}
            >
              {tab.isPinned && (
                <span className="shrink-0 text-[10px]" aria-label="Pinned">
                  📌
                </span>
              )}
              <span className="truncate">{tab.title}</span>
              {tab.hasChanges && (
                <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pd-color-accent)]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── New tab button ── */}
      <button
        type="button"
        onClick={onNewTab}
        className={cn(
          'flex shrink-0 items-center justify-center px-3',
          'text-[var(--pd-color-fg-muted)] transition-colors',
          'hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]',
        )}
        aria-label="New tab"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
