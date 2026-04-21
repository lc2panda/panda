// Input: 全局状态 + 路由
// Output: 三栏三行布局框架
// Pos: 应用根组件，承载所有页面和面板

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { PdSidebar } from './components/layout/PdSidebar';
import { PdTabBar } from './components/layout/PdTabBar';
import { PdStatusBar } from './components/layout/PdStatusBar';
import { PdInspector } from './components/layout/PdInspector';
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { PdSideChat } from './components/chat';
import { PdToast } from './components/containers/PdToast';
import { useSettingsStore, useChatStore } from './stores';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';

type Page = 'chat' | 'settings';

export function App() {
  const [page, setPage] = useState<Page>('chat');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState(0);
  const [sideChatOpen, setSideChatOpen] = useState(false);

  const theme = useSettingsStore((s) => s.theme);
  const activeSessionId = useChatStore((s) => s.activeSessionId);

  // --- Global keyboard shortcuts (Cmd+B / Cmd+\ / Cmd+; / Cmd+N / Cmd+,) ---
  useGlobalShortcuts({
    toggleSidebar: useCallback(() => setSidebarExpanded((p) => !p), []),
    toggleInspector: useCallback(() => setInspectorOpen((p) => !p), []),
    toggleSideChat: useCallback(() => setSideChatOpen((p) => !p), []),
    newChat: useCallback(() => { /* TODO: wire to store */ }, []),
    openSettings: useCallback(() => setPage('settings'), []),
  });

  // --- System theme follower ---
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
    <div
      className={cn(
        'flex h-screen w-screen overflow-hidden',
        'bg-[var(--pd-color-bg)] text-[var(--pd-color-fg)]',
        'font-[var(--pd-font-sans)] text-[length:var(--pd-text-sm)]',
      )}
    >
      {/* -- Left: Sidebar (280px expanded / 72px rail) -- */}
      <PdSidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded((p) => !p)} />

      {/* -- Center: Main content (flex, max 1200px) -- */}
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{ maxWidth: 'var(--pd-main-max-width, 1200px)', minWidth: 0 }}
      >
        {/* TabBar - 40px */}
        <PdTabBar
          tabs={[]}
          onSelect={() => {}}
          onClose={() => {}}
          onNewTab={() => {}}
        />

        {/* Content - flex */}
        <div className="relative flex-1 overflow-hidden">
          {page === 'settings' ? (
            <SettingsPage onBack={() => setPage('chat')} />
          ) : (
            <ChatPage />
          )}
        </div>

        {/* StatusBar - 32px */}
        <PdStatusBar />
      </div>

      {/* -- Right: Inspector (320px, toggleable) -- */}
      {inspectorOpen && (
        <PdInspector
          activeTab={inspectorTab}
          onTabChange={setInspectorTab}
          onClose={() => setInspectorOpen(false)}
        />
      )}

      {/* -- Overlays -- */}
      {sideChatOpen && activeSessionId && (
        <PdSideChat
          parentSessionId={activeSessionId}
          onClose={() => setSideChatOpen(false)}
        />
      )}
      <PdToast toasts={[]} onDismiss={() => {}} />
    </div>
  );
}
