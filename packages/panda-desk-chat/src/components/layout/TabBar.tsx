// Input: Tab list from tabStore + sessionStore/chatStore coordination
// Output: Horizontal tab bar with session tabs, wired to stores
// Pos: Layout layer — sits between TitleBar and ChatPage

import { useCallback } from 'react';
import { cn } from '@/lib/cn';
import { useTabStore } from '@/stores/tabStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useChatStore } from '@/stores/chatStore';
import { PdTabBar, type PdTabBarTab } from './PdTabBar';

// ---------------------------------------------------------------------------
// Connected TabBar — bridges stores to presentational PdTabBar
// ---------------------------------------------------------------------------
export function TabBar() {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const addTab = useTabStore((s) => s.addTab);
  const removeTab = useTabStore((s) => s.removeTab);

  const setActiveSession = useSessionStore((s) => s.setActive);
  const createSession = useSessionStore((s) => s.createSession);

  const setChatActiveSession = useChatStore((s) => s.setActiveSession);

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

  // ── Close tab ──
  const handleClose = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;
      removeTab(tabId);
      // If closing active tab, the store will pick a new active tab;
      // we need to sync session stores with the new active
      const remaining = tabs.filter((t) => t.id !== tabId);
      if (activeTabId === tabId && remaining.length > 0) {
        const next = remaining[remaining.length - 1];
        setActiveSession(next.sessionId);
        setChatActiveSession(next.sessionId);
      }
    },
    [tabs, activeTabId, removeTab, setActiveSession, setChatActiveSession],
  );

  // ── New tab ──
  const handleNewTab = useCallback(() => {
    const session = createSession();
    addTab(session.id, session.name);
    setChatActiveSession(session.id);
  }, [createSession, addTab, setChatActiveSession]);

  // ── Map store tabs → PdTabBarTab props ──
  const tabBarTabs: PdTabBarTab[] = tabs
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((tab) => ({
      id: tab.id,
      title: tab.title,
      isActive: tab.id === activeTabId,
      isPinned: tab.isPinned,
    }));

  return (
    <PdTabBar
      tabs={tabBarTabs}
      onSelect={handleSelect}
      onClose={handleClose}
      onNewTab={handleNewTab}
    />
  );
}
