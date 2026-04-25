// Input: 全局状态 + 路由
// Output: 三栏三行布局框架
// Pos: 应用根组件，承载所有页面和面板

import { useState, useCallback, useMemo, useEffect, lazy, Suspense } from 'react';
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
import { t } from './i18n';
import type { SessionItem } from './components/special/PdSessionSwitcher';
import { useChatStore, useSessionStore, useTabStore, useWindowStore } from './stores';
import { useToastStore } from './stores/toastStore';
import { useUIStore } from './stores/uiStore';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useThemeEffect } from './hooks/useThemeEffect';
import { useFontSizeEffect } from './hooks/useFontSizeEffect';
import { openNewWindow, getWindowId, onWindowInit } from './ipc/bridge';

// --- Part C: Lazy-load non-first-screen components for faster cold start ---
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ScheduledPage = lazy(() => import('./pages/ScheduledPage'));
const PdCommandPalette = lazy(() => import('./components/special/PdCommandPalette').then(m => ({ default: m.PdCommandPalette })));
const PdSessionSwitcher = lazy(() => import('./components/special/PdSessionSwitcher').then(m => ({ default: m.PdSessionSwitcher })));

export function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sideChatOpen, setSideChatOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sessionSwitcherOpen, setSessionSwitcherOpen] = useState(false);

  const { toasts, dismissToast } = useToastStore(
    useShallow((s) => ({ toasts: s.toasts, dismissToast: s.dismissToast })),
  );
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const activeSession = useChatStore((s) => {
    const id = s.activeSessionId;
    return id ? s.sessions.get(id) ?? null : null;
  });

  // --- Multi-window: init windowStore + subscribe window:init events ---
  const setWindowId = useWindowStore((s) => s.setWindowId);
  useEffect(() => {
    // Eagerly fetch windowId from main process
    getWindowId().then((id) => {
      if (id > 0) setWindowId(id);
    });
    // Also listen for window:init push from main (carries sessionId)
    const unsub = onWindowInit((payload) => {
      if (payload.windowId > 0) setWindowId(payload.windowId);
      if (payload.sessionId) {
        setChatActiveSession(payload.sessionId);
        // Ensure a tab exists for the pushed session
        const existing = useTabStore.getState().getTabBySessionId(payload.sessionId);
        if (!existing) {
          addTab(payload.sessionId, 'Session');
        } else {
          useTabStore.getState().setActiveTab(existing.id);
        }
      }
    });
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Multi-window: read ?session=ID from URL on mount ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');
    if (sessionId) {
      setChatActiveSession(sessionId);
      // Also focus/create tab for this session
      const existing = useTabStore.getState().getTabBySessionId(sessionId);
      if (existing) {
        useTabStore.getState().setActiveTab(existing.id);
      } else {
        addTab(sessionId, 'Session');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Read uiStore active view (controlled by Sidebar Scheduled/Settings buttons) ---
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);

  // --- Inspector state: store-driven (no local React state) ---
  const inspectorTab = useUIStore((s) => s.inspectorTab);
  const inspectorOpen = useUIStore((s) => s.inspectorVisible);
  const setInspectorTab = useUIStore((s) => s.setInspectorTab);
  const setInspectorOpen = useUIStore((s) => s.setInspectorVisible);

  // --- Session / Tab actions for shortcuts ---
  const createSession = useSessionStore((s) => s.createSession);
  const sessionList = useSessionStore((s) => s.sessions);
  const addTab = useTabStore((s) => s.addTab);
  const setChatActiveSession = useChatStore((s) => s.setActiveSession);

  // --- Global keyboard shortcuts (Cmd+B / Cmd+\ / Cmd+; / Cmd+N / Cmd+Shift+N / Cmd+,) ---
  useGlobalShortcuts({
    toggleSidebar: useCallback(() => setSidebarExpanded((p) => !p), []),
    toggleInspector: useCallback(() => setInspectorOpen(!inspectorOpen), []),
    toggleSideChat: useCallback(() => setSideChatOpen((p) => !p), []),
    newChat: useCallback(async () => {
      const session = await createSession();
      addTab(session.id, session.name);
      setChatActiveSession(session.id);
    }, [createSession, addTab, setChatActiveSession]),
    newWindow: useCallback(() => {
      openNewWindow();
    }, []),
    openSettings: useCallback(() => setActiveView('settings'), [setActiveView]),
    toggleCommandPalette: useCallback(() => setCommandPaletteOpen((p) => !p), []),
    toggleSessionSwitcher: useCallback(() => setSessionSwitcherOpen((p) => !p), []),
  });

  // --- Command palette commands ---
  const commands: Command[] = useMemo(() => [
    {
      id: 'new-chat',
      label: t('commandPalette.newChat'),
      group: 'Chat',
      shortcut: '⌘N',
      action: async () => {
        const session = await createSession();
        addTab(session.id, session.name);
        setChatActiveSession(session.id);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'new-window',
      label: 'New Window',
      group: 'Window',
      shortcut: '⌘⇧N',
      action: () => {
        openNewWindow();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      group: 'App',
      shortcut: '⌘,',
      action: () => {
        setActiveView('settings');
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
        setInspectorOpen(!inspectorOpen);
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
    () => (sessionList ?? []).map((s) => ({
      id: s.id,
      title: s.name,
      updatedAt: new Date(s.lastActive).getTime(),
      messageCount: s.messageCount,
    })),
    [sessionList],
  );

  // --- Theme: apply data-pd-theme to <html> based on user preference ---
  useThemeEffect();
  // --- Font size: apply --pd-font-size-base and <html> style.fontSize ---
  useFontSizeEffect();

  return (
    <div
      className={cn(
        'flex h-screen w-screen overflow-hidden',
        'bg-[var(--pd-color-bg)] text-[var(--pd-color-fg)]',
        'font-[var(--pd-font-sans)] text-[length:var(--pd-text-sm)]',
      )}
    >
      {/* -- Left: Sidebar (含顶部 traffic-light 区，cc-haha 结构) -- */}
      <PdSidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded((p) => !p)} />

      {/* -- Center: Main content (TabBar + content + StatusBar) -- */}
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{ minWidth: 0 }}
      >
        {/* TabBar 仅在 main 上方 */}
        <PdTabBarConnected />

        <div className="relative flex-1 overflow-hidden">
          {activeView === 'scheduled' ? (
            <Suspense fallback={<div style={{ padding: 'var(--pd-space-4)', opacity: 0.5 }}>Loading...</div>}>
              <ScheduledPage />
            </Suspense>
          ) : activeView === 'settings' ? (
            <Suspense fallback={<div style={{ padding: 'var(--pd-space-4)', opacity: 0.5 }}>Loading...</div>}>
              <SettingsPage />
            </Suspense>
          ) : (
            <ChatPage
              onOpenBuddyLog={() => {
                setInspectorTab(7);
                setInspectorOpen(true);
              }}
            />
          )}
        </div>

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
