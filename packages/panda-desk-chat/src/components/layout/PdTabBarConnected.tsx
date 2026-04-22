// Input: tabStore + sessionStore + chatStore state
// Output: Store-connected tab bar with drag-reorder, context menu, close protection
// Pos: Layout layer — connected wrapper around PdTabBar, sits between TitleBar and ChatPage

import { useCallback, useState } from 'react';
import { useTabStore } from '@/stores/tabStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useChatStore } from '@/stores/chatStore';
import { PdTabBar, type PdTabBarTab } from './PdTabBar';
import { TabContextMenu } from './PdTabContextMenu';

// ---------------------------------------------------------------------------
// Drag state
// ---------------------------------------------------------------------------
interface DragState {
  fromIndex: number;
}

// ---------------------------------------------------------------------------
// Context menu state
// ---------------------------------------------------------------------------
interface CtxMenuState {
  tabId: string;
  x: number;
  y: number;
  isPinned: boolean;
}

// ---------------------------------------------------------------------------
// Connected TabBar — bridges stores to presentational PdTabBar
// ---------------------------------------------------------------------------
export function PdTabBarConnected() {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const addTab = useTabStore((s) => s.addTab);
  const removeTab = useTabStore((s) => s.removeTab);
  const reorderTabs = useTabStore((s) => s.reorderTabs);
  const pinTab = useTabStore((s) => s.pinTab);
  const unpinTab = useTabStore((s) => s.unpinTab);
  const closeOthers = useTabStore((s) => s.closeOthers);
  const closeAll = useTabStore((s) => s.closeAll);

  const setActiveSession = useSessionStore((s) => s.setActive);
  const createSession = useSessionStore((s) => s.createSession);

  const setChatActiveSession = useChatStore((s) => s.setActiveSession);

  // ── Helper: check if a session is actively streaming ──
  const isSessionStreaming = useCallback(
    (sessionId: string): boolean => {
      const session = useChatStore.getState().sessions.get(sessionId);
      if (!session) return false;
      return session.chatState === 'streaming' || session.chatState === 'thinking';
    },
    [],
  );

  // ── Drag state ──
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  // ── Context menu state ──
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);

  // ── Sorted tabs ──
  const sorted = tabs.slice().sort((a, b) => a.order - b.order);

  // ── Select tab ──
  const handleSelect = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;
      setActiveTab(tabId);
      setActiveSession(tab.sessionId);
      setChatActiveSession(tab.sessionId);
    },
    [tabs, setActiveTab, setActiveSession, setChatActiveSession],
  );

  // ── Close tab (with streaming protection) ──
  const handleClose = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;

      // Close protection: confirm if session is streaming
      if (isSessionStreaming(tab.sessionId)) {
        const confirmed = window.confirm(
          'This tab has an active response in progress. Close anyway?',
        );
        if (!confirmed) return;
      }

      removeTab(tabId);
      const remaining = tabs.filter((t) => t.id !== tabId);
      if (activeTabId === tabId && remaining.length > 0) {
        const next = remaining[remaining.length - 1];
        setActiveSession(next.sessionId);
        setChatActiveSession(next.sessionId);
      }
    },
    [tabs, activeTabId, removeTab, setActiveSession, setChatActiveSession, isSessionStreaming],
  );

  // ── New tab ──
  const handleNewTab = useCallback(async () => {
    const session = await createSession();
    addTab(session.id, session.name);
    setChatActiveSession(session.id);
  }, [createSession, addTab, setChatActiveSession]);

  // ── Drag handlers ──
  const handleDragStart = useCallback((index: number) => {
    setDrag({ fromIndex: index });
  }, []);

  const handleDragOver = useCallback((index: number) => {
    setDropTarget(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (drag !== null && dropTarget !== null && drag.fromIndex !== dropTarget) {
      reorderTabs(drag.fromIndex, dropTarget);
    }
    setDrag(null);
    setDropTarget(null);
  }, [drag, dropTarget, reorderTabs]);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  // ── Context menu handlers ──
  const handleContextMenu = useCallback(
    (tabId: string, x: number, y: number) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;
      setCtxMenu({ tabId, x, y, isPinned: tab.isPinned });
    },
    [tabs],
  );

  const handlePin = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;
      if (tab.isPinned) {
        unpinTab(tabId);
      } else {
        pinTab(tabId);
      }
    },
    [tabs, pinTab, unpinTab],
  );

  const handleCloseOthers = useCallback(
    (tabId: string) => {
      closeOthers(tabId);
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) {
        setActiveSession(tab.sessionId);
        setChatActiveSession(tab.sessionId);
      }
    },
    [tabs, closeOthers, setActiveSession, setChatActiveSession],
  );

  const handleCloseAll = useCallback(() => {
    closeAll();
  }, [closeAll]);

  // ── Map store tabs to PdTabBarTab props ──
  const tabBarTabs: PdTabBarTab[] = sorted.map((tab) => ({
    id: tab.id,
    title: tab.title,
    isActive: tab.id === activeTabId,
    isPinned: tab.isPinned,
  }));

  return (
    <>
      <PdTabBar
        tabs={tabBarTabs}
        onSelect={handleSelect}
        onClose={handleClose}
        onNewTab={handleNewTab}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragLeave={handleDragLeave}
        dragFromIndex={drag?.fromIndex ?? null}
        dropTargetIndex={dropTarget}
        onContextMenu={handleContextMenu}
      />
      {ctxMenu && (
        <TabContextMenu
          tabId={ctxMenu.tabId}
          x={ctxMenu.x}
          y={ctxMenu.y}
          isPinned={ctxMenu.isPinned}
          onClose={() => setCtxMenu(null)}
          onCloseTab={handleClose}
          onCloseOthers={handleCloseOthers}
          onCloseAll={handleCloseAll}
          onPin={handlePin}
        />
      )}
    </>
  );
}
