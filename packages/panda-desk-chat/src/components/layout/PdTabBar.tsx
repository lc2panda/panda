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
}: PdTabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
              draggable
              onClick={() => onSelect(tab.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu?.(tab.id, e.clientX, e.clientY);
              }}
              onDragStart={(e) => {
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
                'transition-colors',
                'duration-[var(--pd-duration-quick)] ease-[var(--pd-ease-standard)]',
                tab.isActive
                  ? 'bg-[var(--pd-color-bg)] text-[var(--pd-color-fg)]'
                  : 'text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)]',
              )}
              style={{
                height: '36px',
                fontSize: 'var(--pd-text-sm)',
                opacity: dragFromIndex === index ? 0.5 : 1,
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

              {/* Title */}
              <span className="truncate">{tab.title}</span>

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
