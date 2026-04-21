// Input: Child components (Sidebar, TabBar, main content, StatusBar, Inspector)
// Output: CSS Grid three-column layout with titlebar, responsive sidebar/inspector
// Pos: Layout layer — top-level shell that orchestrates the overall UI structure

import { type CSSProperties, type ReactNode, useMemo } from 'react';
import { cn } from '@/lib/cn';
import { useSettingsStore } from '@/stores';

// ---------------------------------------------------------------------------
// Platform detection (simple heuristic; Electron / Tauri can override)
// ---------------------------------------------------------------------------
const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AppShellProps {
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AppShell({ children }: AppShellProps) {
  const sidebarExpanded = useSettingsStore((s) => s.sidebarExpanded);
  const inspectorVisible = useSettingsStore((s) => s.inspectorVisible);

  const gridColumns = useMemo(() => {
    const sidebar = sidebarExpanded
      ? 'var(--pd-layout-sidebar-width)'
      : 'var(--pd-layout-sidebar-rail)';
    const inspector = inspectorVisible
      ? 'var(--pd-layout-right-panel)'
      : '0px';
    return `${sidebar} 1fr ${inspector}`;
  }, [sidebarExpanded, inspectorVisible]);

  const titlebarHeight = isMac
    ? 'var(--pd-layout-titlebar-mac)'
    : 'var(--pd-layout-titlebar-win)';

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--pd-color-bg)] text-[var(--pd-color-fg)]">
      {/* ── TitleBar drag region ── */}
      <div
        className="w-full shrink-0 select-none"
        style={{
          height: titlebarHeight,
          WebkitAppRegion: 'drag',
        } as CSSProperties}
      />

      {/* ── Main grid (sidebar | content | inspector) ── */}
      <div
        className={cn(
          'grid flex-1 overflow-hidden',
          'transition-[grid-template-columns]',
        )}
        style={{
          gridTemplateColumns: gridColumns,
          transitionDuration: 'var(--pd-duration-slow)',
          transitionTimingFunction: 'var(--pd-ease-emphasized)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
