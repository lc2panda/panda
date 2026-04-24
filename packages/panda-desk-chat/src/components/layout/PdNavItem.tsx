// Input: icon, label, active, onClick, shortcut, badge, collapsed, className
// Output: Sidebar navigation item with hover/active states using design tokens
// Pos: Layout layer — reusable nav entry used inside PdSidebar

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface PdNavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  shortcut?: string;
  badge?: number | string;
  className?: string;
}

export const PdNavItem = forwardRef<HTMLButtonElement, PdNavItemProps>(
  ({ icon, label, active, collapsed, onClick, shortcut, badge, className }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex w-full items-center rounded-[8px]',
        'transition-colors',
        'duration-[var(--pd-duration-quick)] ease-[var(--pd-ease-standard)]',
        collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-[10px]',
        active
          ? 'bg-[var(--pd-color-accent-subtle)] text-[var(--pd-color-fg)]'
          : 'text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]',
        className,
      )}
    >
      {/* Icon */}
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </span>

      {/* Label + badge + shortcut (only when expanded) */}
      {!collapsed && (
        <>
          <span className="truncate text-[14px] text-left" style={{ flex: 1 }}>
            {label}
          </span>

          {badge !== undefined && (
            <span
              className={cn(
                'ml-auto inline-flex h-5 min-w-5 items-center justify-center',
                'rounded-[var(--pd-radius-full)] bg-[var(--pd-color-accent)] px-1.5',
                'text-[length:var(--pd-text-xs)] font-semibold text-[var(--pd-color-fg-on-accent)]',
              )}
            >
              {typeof badge === 'number' && badge > 99 ? '99+' : badge}
            </span>
          )}

          {shortcut && (
            <span className="text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)] opacity-60">
              {shortcut}
            </span>
          )}
        </>
      )}
    </button>
  ),
);
PdNavItem.displayName = 'PdNavItem';
