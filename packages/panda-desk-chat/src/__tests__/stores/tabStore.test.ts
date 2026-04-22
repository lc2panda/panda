// Input: tabStore actions (add, remove, setActive, reorder, rename, pin/unpin, closeOthers, closeAll)
// Output: state assertions validating tab lifecycle and ordering
// Pos: test layer — validates tabStore logic

import { describe, it, expect, beforeEach } from 'vitest';
import { useTabStore } from '@/stores/tabStore';

describe('tabStore', () => {
  beforeEach(() => {
    // Reset store to pristine state
    useTabStore.setState({ tabs: [], activeTabId: null });
  });

  // ── addTab ─────────────────────────────────────────────────────────────

  describe('addTab', () => {
    it('adds a tab and sets it as active', () => {
      useTabStore.getState().addTab('s1', 'Session 1');

      const { tabs, activeTabId } = useTabStore.getState();
      expect(tabs).toHaveLength(1);
      expect(tabs[0].sessionId).toBe('s1');
      expect(tabs[0].title).toBe('Session 1');
      expect(tabs[0].isActive).toBe(true);
      expect(tabs[0].isPinned).toBe(false);
      expect(activeTabId).toBe(tabs[0].id);
    });

    it('deactivates previous tabs when adding a new one', () => {
      useTabStore.getState().addTab('s1', 'First');
      useTabStore.getState().addTab('s2', 'Second');

      const { tabs } = useTabStore.getState();
      expect(tabs).toHaveLength(2);
      expect(tabs[0].isActive).toBe(false);
      expect(tabs[1].isActive).toBe(true);
    });

    it('assigns incrementing order values', () => {
      useTabStore.getState().addTab('s1', 'A');
      useTabStore.getState().addTab('s2', 'B');
      useTabStore.getState().addTab('s3', 'C');

      const { tabs } = useTabStore.getState();
      expect(tabs.map((t) => t.order)).toEqual([0, 1, 2]);
    });
  });

  // ── removeTab ──────────────────────────────────────────────────────────

  describe('removeTab', () => {
    it('removes the specified tab', () => {
      useTabStore.getState().addTab('s1', 'A');
      useTabStore.getState().addTab('s2', 'B');
      const tabId = useTabStore.getState().tabs[0].id;

      useTabStore.getState().removeTab(tabId);

      const { tabs } = useTabStore.getState();
      expect(tabs).toHaveLength(1);
      expect(tabs[0].sessionId).toBe('s2');
    });

    it('activates the last remaining tab when the active tab is removed', () => {
      useTabStore.getState().addTab('s1', 'A');
      useTabStore.getState().addTab('s2', 'B');
      // s2 is active
      const activeId = useTabStore.getState().activeTabId!;

      useTabStore.getState().removeTab(activeId);

      const { tabs, activeTabId } = useTabStore.getState();
      expect(tabs).toHaveLength(1);
      expect(activeTabId).toBe(tabs[0].id);
      expect(tabs[0].isActive).toBe(true);
    });

    it('sets activeTabId to null when all tabs are removed', () => {
      useTabStore.getState().addTab('s1', 'A');
      const tabId = useTabStore.getState().tabs[0].id;

      useTabStore.getState().removeTab(tabId);

      expect(useTabStore.getState().tabs).toHaveLength(0);
      expect(useTabStore.getState().activeTabId).toBeNull();
    });

    it('re-indexes order after removal', () => {
      useTabStore.getState().addTab('s1', 'A');
      useTabStore.getState().addTab('s2', 'B');
      useTabStore.getState().addTab('s3', 'C');
      const firstId = useTabStore.getState().tabs[0].id;

      useTabStore.getState().removeTab(firstId);

      const { tabs } = useTabStore.getState();
      expect(tabs.map((t) => t.order)).toEqual([0, 1]);
    });
  });

  // ── setActiveTab ───────────────────────────────────────────────────────

  describe('setActiveTab', () => {
    it('activates the specified tab and deactivates others', () => {
      useTabStore.getState().addTab('s1', 'A');
      useTabStore.getState().addTab('s2', 'B');
      const firstTabId = useTabStore.getState().tabs[0].id;

      useTabStore.getState().setActiveTab(firstTabId);

      const { tabs, activeTabId } = useTabStore.getState();
      expect(activeTabId).toBe(firstTabId);
      expect(tabs.find((t) => t.id === firstTabId)!.isActive).toBe(true);
      expect(tabs.filter((t) => t.id !== firstTabId).every((t) => !t.isActive)).toBe(true);
    });
  });

  // ── reorderTabs ────────────────────────────────────────────────────────

  describe('reorderTabs', () => {
    it('moves a tab from one position to another', () => {
      useTabStore.getState().addTab('s1', 'A');
      useTabStore.getState().addTab('s2', 'B');
      useTabStore.getState().addTab('s3', 'C');

      // Move index 0 to index 2
      useTabStore.getState().reorderTabs(0, 2);

      const titles = useTabStore
        .getState()
        .tabs.sort((a, b) => a.order - b.order)
        .map((t) => t.title);
      expect(titles).toEqual(['B', 'C', 'A']);
    });

    it('is a no-op for out-of-bounds indices', () => {
      useTabStore.getState().addTab('s1', 'A');
      const before = useTabStore.getState().tabs;

      useTabStore.getState().reorderTabs(-1, 5);

      // State reference should be unchanged (returned state)
      expect(useTabStore.getState().tabs.map((t) => t.title)).toEqual(['A']);
    });
  });

  // ── renameTab ──────────────────────────────────────────────────────────

  describe('renameTab', () => {
    it('updates the title of the specified tab', () => {
      useTabStore.getState().addTab('s1', 'Old Name');
      const tabId = useTabStore.getState().tabs[0].id;

      useTabStore.getState().renameTab(tabId, 'New Name');

      expect(useTabStore.getState().tabs[0].title).toBe('New Name');
    });
  });

  // ── pinTab / unpinTab ──────────────────────────────────────────────────

  describe('pin/unpin', () => {
    it('pinTab marks a tab as pinned', () => {
      useTabStore.getState().addTab('s1', 'A');
      const tabId = useTabStore.getState().tabs[0].id;

      useTabStore.getState().pinTab(tabId);
      expect(useTabStore.getState().tabs[0].isPinned).toBe(true);
    });

    it('unpinTab marks a tab as unpinned', () => {
      useTabStore.getState().addTab('s1', 'A');
      const tabId = useTabStore.getState().tabs[0].id;
      useTabStore.getState().pinTab(tabId);

      useTabStore.getState().unpinTab(tabId);
      expect(useTabStore.getState().tabs[0].isPinned).toBe(false);
    });
  });

  // ── closeOthers ────────────────────────────────────────────────────────

  describe('closeOthers', () => {
    it('keeps only the target tab and pinned tabs', () => {
      useTabStore.getState().addTab('s1', 'A');
      useTabStore.getState().addTab('s2', 'B');
      useTabStore.getState().addTab('s3', 'C');

      // Pin tab A
      const tabA = useTabStore.getState().tabs[0].id;
      useTabStore.getState().pinTab(tabA);

      // closeOthers from tab C (active)
      const tabC = useTabStore.getState().tabs[2].id;
      useTabStore.getState().closeOthers(tabC);

      const { tabs, activeTabId } = useTabStore.getState();
      // Should keep A (pinned) and C (target)
      expect(tabs).toHaveLength(2);
      expect(tabs.map((t) => t.sessionId).sort()).toEqual(['s1', 's3']);
      expect(activeTabId).toBe(tabC);
    });
  });

  // ── closeAll ───────────────────────────────────────────────────────────

  describe('closeAll', () => {
    it('removes all unpinned tabs', () => {
      useTabStore.getState().addTab('s1', 'A');
      useTabStore.getState().addTab('s2', 'B');

      useTabStore.getState().closeAll();

      expect(useTabStore.getState().tabs).toHaveLength(0);
      expect(useTabStore.getState().activeTabId).toBeNull();
    });

    it('keeps pinned tabs and activates the first one', () => {
      useTabStore.getState().addTab('s1', 'A');
      useTabStore.getState().addTab('s2', 'B');
      useTabStore.getState().addTab('s3', 'C');

      const tabB = useTabStore.getState().tabs[1].id;
      useTabStore.getState().pinTab(tabB);

      useTabStore.getState().closeAll();

      const { tabs, activeTabId } = useTabStore.getState();
      expect(tabs).toHaveLength(1);
      expect(tabs[0].sessionId).toBe('s2');
      expect(tabs[0].isActive).toBe(true);
      expect(activeTabId).toBe(tabB);
    });
  });

  // ── getTabBySessionId ──────────────────────────────────────────────────

  describe('getTabBySessionId', () => {
    it('returns the tab matching the sessionId', () => {
      useTabStore.getState().addTab('s1', 'A');
      useTabStore.getState().addTab('s2', 'B');

      const tab = useTabStore.getState().getTabBySessionId('s1');
      expect(tab).toBeDefined();
      expect(tab!.sessionId).toBe('s1');
    });

    it('returns undefined for unknown sessionId', () => {
      expect(useTabStore.getState().getTabBySessionId('ghost')).toBeUndefined();
    });
  });
});
