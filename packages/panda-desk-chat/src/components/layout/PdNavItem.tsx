// Input: icon, label, active, onClick, shortcut, badge
// Output: 侧边栏导航项
// Pos: PdSidebar 内的导航入口

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface PdNavItemProps {
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
      onClick={onClick}
      className={cn('pd-nav-item', active && 'pd-nav-item--active', className)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : '8px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        width: '100%',
        padding: collapsed ? '8px' : '6px 12px',
        border: 'none',
        borderRadius: 'var(--pd-radius-md)',
        background: active ? 'var(--pd-color-bg-hover)' : 'transparent',
        color: active ? 'var(--pd-color-fg)' : 'var(--pd-color-fg-muted)',
        cursor: 'pointer',
        fontSize: 'var(--pd-text-sm)',
        fontWeight: active ? 500 : 400,
        transition: 'background var(--pd-duration-fast) var(--pd-ease-standard)',
      }}
      title={collapsed ? label : undefined}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      <span style={{ flexShrink: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </span>
      {!collapsed && (
        <>
          <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label}
          </span>
          {badge !== undefined && (
            <span style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: 'var(--pd-radius-full)',
              background: 'var(--pd-color-accent)',
              color: 'var(--pd-color-fg-on-accent)',
              fontWeight: 600,
            }}>
              {badge}
            </span>
          )}
          {shortcut && (
            <span style={{ fontSize: '10px', color: 'var(--pd-color-fg-muted)', opacity: 0.6 }}>
              {shortcut}
            </span>
          )}
        </>
      )}
    </button>
  )
);
PdNavItem.displayName = 'PdNavItem';
