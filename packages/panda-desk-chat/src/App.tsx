// Input:  none (root component)
// Output: three-column layout shell — Sidebar | (TabBar + Content) | Inspector
// Pos:    React root — wraps layout with store-connected PdSidebar and TabBar
import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { PdSidebar } from './components/layout/PdSidebar';
import { TabBar } from './components/layout/TabBar';
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { useSettingsStore } from './stores';

const VERSION = '0.1.0';

export function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [page, setPage] = useState<'chat' | 'settings'>('chat');
  const theme = useSettingsStore((s) => s.theme);

  const handleToggleSidebar = useCallback(
    () => setSidebarExpanded((prev) => !prev),
    [],
  );

  // System theme follower
  useEffect(() => {
    if (theme !== 'system') {
      document.documentElement.setAttribute('data-theme', theme);
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (e: MediaQueryList | MediaQueryListEvent) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    };
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--pd-color-bg)] text-[var(--pd-color-fg)]">
      {/* Sidebar — store-connected */}
      <PdSidebar expanded={sidebarExpanded} onToggle={handleToggleSidebar} />

      {/* Main area: TabBar + ChatPage or SettingsPage */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TabBar />
        {page === 'settings' ? (
          <SettingsPage onBack={() => setPage('chat')} />
        ) : (
          <ChatPage />
        )}
      </div>

      {/* Inspector panel (placeholder) */}
      <aside
        className={cn(
          'flex flex-col border-l border-[var(--pd-color-border)]',
          'w-[260px] min-w-[260px]',
          'bg-[var(--pd-color-bg-subtle)]',
        )}
      >
        <div className="flex h-10 shrink-0 items-center border-b border-[var(--pd-color-border)] px-3 text-xs font-medium text-[var(--pd-color-fg-muted)]">
          Inspector
        </div>
        <div className="flex-1 px-3 py-2">
          <div className="rounded-lg border border-dashed border-[var(--pd-color-border)] p-4 text-center text-xs text-[var(--pd-color-fg-muted)]">
            Context panel — placeholder
          </div>
        </div>
        <div className="shrink-0 border-t border-[var(--pd-color-border-subtle)] px-3 py-1 text-right text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-subtle)]">
          v{VERSION}
        </div>
      </aside>
    </div>
  );
}
