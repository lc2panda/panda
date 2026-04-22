// Input: 全局状态 + 路由
// Output: 三栏三行布局框架
// Pos: 应用根组件，承载所有页面和面板

import { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/cn';
import { PdSidebar } from './components/layout/PdSidebar';
import { PdTabBarConnected } from './components/layout/PdTabBarConnected';
import { PdStatusBar } from './components/layout/PdStatusBar';
import { PdInspector } from './components/layout/PdInspector';
import { ChatPage } from './pages/ChatPage';
import { PdSideChat } from './components/chat';
import { PdToastContainer } from './components/containers/PdToast';
import type { Command } from './components/special/PdCommandPalette';
import type { SessionItem } from './components/special/PdSessionSwitcher';
import { useSettingsStore, useChatStore, useSessionStore, useTabStore } from './stores';
import { useToastStore } from './stores/toastStore';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';

// --- Part C: Lazy-load non-first-screen components for faster cold start ---
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PdCommandPalette = lazy(() => import('./components/special/PdCommandPalette').then(m => ({ default: m.PdCommandPalette })));
const PdSessionSwitcher = lazy(() => import('./components/special/PdSessionSwitcher').then(m => ({ default: m.PdSessionSwitcher })));

type Page = 'chat' | 'settings';

export function App() {
  const [page, setPage] = useState<Page>('chat');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTab, setInspectorTab] = useState(0);
  const [sideChatOpen, setSideChatOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sessionSwitcherOpen, setSessionSwitcherOpen] = useState(false);

  const { toasts, dismissToast } = useToastStore(
    useShallow((s) => ({ toasts: s.toasts, dismissToast: s.dismissToast })),
  );
  const theme = useSettingsStore((s) => s.theme);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const activeSession = useChatStore((s) => {
    const id = s.activeSessionId;
    return id ? s.sessions.get(id) ?? null : null;
  });

  // --- Session / Tab actions for shortcuts ---
  const createSession = useSessionStore((s) => s.createSession);
  const sessionList = useSessionStore((s) => s.sessions);
  const addTab = useTabStore((s) => s.addTab);
  const setChatActiveSession = useChatStore((s) => s.setActiveSession);

  // --- Global keyboard shortcuts (Cmd+B / Cmd+\ / Cmd+; / Cmd+N / Cmd+,) ---
  useGlobalShortcuts({
    toggleSidebar: useCallback(() => setSidebarExpanded((p) => !p), []),
    toggleInspector: useCallback(() => setInspectorOpen((p) => !p), []),
    toggleSideChat: useCallback(() => setSideChatOpen((p) => !p), []),
    newChat: useCallback(() => {
      const session = createSession();
      addTab(session.id, session.name);
      setChatActiveSession(session.id);
    }, [createSession, addTab, setChatActiveSession]),
    openSettings: useCallback(() => setPage('settings'), []),
    toggleCommandPalette: useCallback(() => setCommandPaletteOpen((p) => !p), []),
    toggleSessionSwitcher: useCallback(() => setSessionSwitcherOpen((p) => !p), []),
  });

  // --- Command palette commands ---
  const commands: Command[] = useMemo(() => [
    {
      id: 'new-chat',
      label: 'New Chat',
      group: 'Chat',
      shortcut: '⌘N',
      action: () => {
        const session = createSession();
        addTab(session.id, session.name);
        setChatActiveSession(session.id);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      group: 'App',
      shortcut: '⌘,',
      action: () => {
        setPage('settings');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'toggle-sidebar',
      label: 'Toggle Sidebar',
      group: 'View',
      shortcut: '⌘B',
      action: () => {
        setSidebarExpanded((p) => !p);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'toggle-inspector',
      label: 'Toggle Inspector',
      group: 'View',
      shortcut: '⌘\\',
      action: () => {
        setInspectorOpen((p) => !p);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'toggle-side-chat',
      label: 'Toggle Side Chat',
      group: 'View',
      shortcut: '⌘;',
      action: () => {
        setSideChatOpen((p) => !p);
        setCommandPaletteOpen(false);
      },
    },
  ], [createSession, addTab, setChatActiveSession]);

  // --- Session switcher items (SessionMeta → SessionItem) ---
  const switcherSessions: SessionItem[] = useMemo(
    () => sessionList.map((s) => ({
      id: s.id,
      title: s.name,
      updatedAt: new Date(s.lastActive).getTime(),
      messageCount: s.messageCount,
    })),
    [sessionList],
  );

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
        <PdTabBarConnected />

        {/* Content - flex */}
        <div className="relative flex-1 overflow-hidden">
          {page === 'settings' ? (
            <Suspense fallback={<div style={{ padding: 'var(--pd-space-4)', opacity: 0.5 }}>Loading...</div>}>
              <SettingsPage onClose={() => setPage('chat')} />
            </Suspense>
          ) : (
            <ChatPage />
          )}
        </div>

        {/* StatusBar - 32px */}
        <PdStatusBar
          model={activeSession?.statusVerb || undefined}
          tokenCount={
            activeSession && (activeSession.tokenUsage.input > 0 || activeSession.tokenUsage.output > 0)
              ? activeSession.tokenUsage
              : undefined
          }
          connectionState={activeSession?.connectionState ?? 'disconnected'}
        />
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
      <PdToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Suspense fallback={null}>
        <PdCommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          commands={commands}
        />
        <PdSessionSwitcher
          open={sessionSwitcherOpen}
          onClose={() => setSessionSwitcherOpen(false)}
          sessions={switcherSessions}
          onSelect={(id) => {
            setChatActiveSession(id);
            setSessionSwitcherOpen(false);
          }}
        />
      </Suspense>
    </div>
  );
}
