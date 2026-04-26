// Input: User tab interactions (open/close/setActive/move/rename) + cc-haha 持久化恢复
// Output: cc-haha 1:1 标签栏状态（ordered tabs + active id + 类型 session/settings/scheduled）
//         + panda 扩展层（pin/closeOthers/closeAll/windowId/getTabBySessionId/getTabsForWindow）
// Pos: State layer — drives / PdSidebar / TabContextMenu
//
// Source 1:1: cc-haha desktop/src/stores/tabStore.ts (169 行)
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import * as bridge from '../ipc/bridge';
import { useWindowStore } from './windowStore';

// ---------------------------------------------------------------------------
// Constants — cc-haha L4-L7
// ---------------------------------------------------------------------------

const TAB_STORAGE_KEY = 'panda-open-tabs';

export const SETTINGS_TAB_ID = '__settings__';
export const SCHEDULED_TAB_ID = '__scheduled__';
// Comdr 指令: 超级助手特殊 tab id（与 settings/scheduled 同级）
export const SUPER_ASSISTANT_TAB_ID = '__super_assistant__';
// Comdr 指令: panda 独有能力补齐 — Group 1（4 个新 NavItem 对应特殊 tab id）
export const CONNECTORS_TAB_ID = '__connectors__';
export const PATTERNS_TAB_ID = '__patterns__';
export const MEMORY_BANK_TAB_ID = '__memory_bank__';
export const AGENT_TEAMS_TAB_ID = '__agent_teams__';
// Comdr 指令: 学习助手 + Output Styles 重组 — 学习助手专属 tab id
export const LEARNING_TAB_ID = '__learning__';
// Comdr 指令 cc-haha 路线 A 调整：'session-controls' / 'tool-inspection' Sidebar NavItem 已下线
//   - 会话控制已嵌入 Composer 底部按钮组
//   - 工具调试已迁入 Settings sub-tab
//   常量保留以便 restoreTabs 历史失效逻辑识别、PdContentRouter 自动 closeTab 回滚。
export const SESSION_CONTROLS_TAB_ID = '__session_controls__';
export const TOOL_INSPECTION_TAB_ID = '__tool_inspection__';

// ---------------------------------------------------------------------------
// Types — cc-haha L9-L37
// ---------------------------------------------------------------------------

// Comdr 指令: TabType 加 'super-assistant'，restoreTabs/openTab/PdContentRouter 共用
// Comdr 指令: panda 独有能力补齐 — Group 1（4 个新 tab 类型）
// Comdr 指令: 学习助手 + Output Styles 重组 — TabType 加 'learning'
// Comdr 指令 cc-haha 路线 A: 会话控制 + 工具调试器
export type TabType =
  | 'session'
  | 'settings'
  | 'scheduled'
  | 'super-assistant'
  | 'connectors'
  | 'patterns'
  | 'memory-bank'
  | 'agent-teams'
  | 'learning'
  | 'session-controls'
  | 'tool-inspection';

/**
 * Tab — cc-haha 形态：sessionId 作主键 + title + type + status。
 * 同时保留 panda 扩展字段（id / order / isActive / isPinned / windowId）
 * 以兼容现有 PdTabBar 渲染逻辑。
 */
export interface Tab {
  /** cc-haha 主键：sessionId 即标签身份。 */
  sessionId: string;
  title: string;
  type: TabType;
  /** cc-haha 状态机（idle/running/error）。 */
  status: 'idle' | 'running' | 'error';
  /** panda 扩展：独立 UUID（用于 的 tabId 引用）。 */
  id: string;
  /** panda 扩展：渲染顺序。 */
  order: number;
  /** panda 扩展：当前激活态。 */
  isActive: boolean;
  /** panda 扩展：固定标签。 */
  isPinned: boolean;
  /** panda 扩展：所属 window 的 BrowserWindow id（undefined = 全部 window）。 */
  windowId?: number;
}

type TabPersistence = {
  openTabs: Array<{ sessionId: string; title: string; type?: TabType }>;
  activeTabId: string | null;
};

export interface TabStore {
  tabs: Tab[];
  /** cc-haha 命名：activeTabId（实际值是激活 Tab 的 sessionId）。 */
  activeTabId: string | null;

  // ── cc-haha actions (1:1) ────────────────────────────────────────────────
  // cc-haha L43-L55
  openTab: (sessionId: string, title: string, type?: TabType) => void;
  // cc-haha L57-L77
  closeTab: (sessionId: string) => void;
  // cc-haha L79-L82
  setActiveTab: (sessionId: string) => void;
  // cc-haha L84-L89
  updateTabTitle: (sessionId: string, title: string) => void;
  // cc-haha L91-L95
  updateTabStatus: (sessionId: string, status: Tab['status']) => void;
  // cc-haha L97-L106
  replaceTabSession: (oldSessionId: string, newSessionId: string) => void;
  // cc-haha L108-L117
  moveTab: (fromIndex: number, toIndex: number) => void;
  // cc-haha L119-L128
  saveTabs: () => void;
  // cc-haha L130-L168
  restoreTabs: () => Promise<void>;

  // ── panda 扩展 actions（保留向下兼容）────────────────────────────────────
  /** panda 兼容：添加 tab，等价于 openTab 的语义（sessionId + title）。 */
  addTab: (sessionId: string, title: string, windowId?: number) => void;
  /** panda 兼容：按 panda 内部 tab.id 移除（自动转为 sessionId 调用 closeTab）。 */
  removeTab: (tabId: string) => void;
  /** panda 兼容：按 panda 内部 tab.id 重命名。 */
  renameTab: (tabId: string, title: string) => void;
  /** panda 兼容：按 panda 内部 tab.id 重排序（对 cc-haha moveTab 的 sessionId 形态包装）。 */
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  /** panda 扩展：固定标签。 */
  pinTab: (tabId: string) => void;
  /** panda 扩展：取消固定。 */
  unpinTab: (tabId: string) => void;
  /** panda 扩展：关闭其他（保留 pinned + 目标）。 */
  closeOthers: (tabId: string) => void;
  /** panda 扩展：关闭全部（保留 pinned）。 */
  closeAll: () => void;
  /** panda 扩展：按 sessionId 查找 Tab。 */
  getTabBySessionId: (sessionId: string) => Tab | undefined;
  /** panda 扩展：按 windowId 过滤 Tab。 */
  getTabsForWindow: (windowId: number) => Tab[];
}

// ---------------------------------------------------------------------------
// Store — cc-haha L39-L169（活字 1:1）
// ---------------------------------------------------------------------------

export const useTabStore = create<TabStore>()((set, get) => ({
  tabs: [],
  activeTabId: null,

  // cc-haha L43-L55: openTab — 已存在则只激活，否则追加并激活
  openTab: (sessionId, title, type = 'session') => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.sessionId === sessionId);
    if (existing) {
      set({
        tabs: tabs.map((t) => ({ ...t, isActive: t.sessionId === sessionId })),
        activeTabId: sessionId,
      });
    } else {
      const resolvedWindowId =
        useWindowStore.getState().windowId > 0
          ? useWindowStore.getState().windowId
          : undefined;
      const newTab: Tab = {
        sessionId,
        title,
        type,
        status: 'idle',
        id: crypto.randomUUID(),
        order: tabs.length,
        isActive: true,
        isPinned: false,
        windowId: resolvedWindowId,
      };
      set({
        tabs: [...tabs.map((t) => ({ ...t, isActive: false })), newTab],
        activeTabId: sessionId,
      });
    }
    get().saveTabs();
  },

  // cc-haha L57-L77: closeTab — 按 sessionId 移除并维护 activeTabId
  closeTab: (sessionId) => {
    const { tabs, activeTabId } = get();
    const index = tabs.findIndex((t) => t.sessionId === sessionId);
    if (index < 0) return;

    const newTabs = tabs.filter((t) => t.sessionId !== sessionId);
    let newActiveId = activeTabId;

    if (activeTabId === sessionId) {
      if (newTabs.length === 0) {
        newActiveId = null;
      } else if (index >= newTabs.length) {
        newActiveId = newTabs[newTabs.length - 1]!.sessionId;
      } else {
        newActiveId = newTabs[index]!.sessionId;
      }
    }

    // 重新计算 order + isActive 镜像
    const reindexed = newTabs.map((t, i) => ({
      ...t,
      order: i,
      isActive: t.sessionId === newActiveId,
    }));

    set({ tabs: reindexed, activeTabId: newActiveId });
    get().saveTabs();
  },

  // cc-haha L79-L82: setActiveTab — 切换激活 sessionId
  setActiveTab: (sessionId) => {
    set((s) => ({
      tabs: s.tabs.map((t) => ({ ...t, isActive: t.sessionId === sessionId })),
      activeTabId: sessionId,
    }));
    get().saveTabs();
  },

  // cc-haha L84-L89: updateTabTitle
  updateTabTitle: (sessionId, title) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.sessionId === sessionId ? { ...t, title } : t)),
    }));
    get().saveTabs();
  },

  // cc-haha L91-L95: updateTabStatus（不持久化）
  updateTabStatus: (sessionId, status) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.sessionId === sessionId ? { ...t, status } : t)),
    }));
  },

  // cc-haha L97-L106: replaceTabSession
  replaceTabSession: (oldSessionId, newSessionId) => {
    const { activeTabId } = get();
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.sessionId === oldSessionId ? { ...t, sessionId: newSessionId } : t,
      ),
      activeTabId: activeTabId === oldSessionId ? newSessionId : activeTabId,
    }));
    get().saveTabs();
  },

  // cc-haha L108-L117: moveTab — 按 index 重排
  moveTab: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const { tabs } = get();
    if (
      fromIndex < 0 ||
      fromIndex >= tabs.length ||
      toIndex < 0 ||
      toIndex >= tabs.length
    )
      return;
    const newTabs = [...tabs];
    const [moved] = newTabs.splice(fromIndex, 1);
    newTabs.splice(toIndex, 0, moved!);
    // 重新计算 order
    const reindexed = newTabs.map((t, i) => ({ ...t, order: i }));
    set({ tabs: reindexed });
    get().saveTabs();
  },

  // cc-haha L119-L128: saveTabs — localStorage 持久化
  saveTabs: () => {
    const { tabs, activeTabId } = get();
    const data: TabPersistence = {
      openTabs: tabs.map((t) => ({
        sessionId: t.sessionId,
        title: t.title,
        type: t.type,
      })),
      activeTabId,
    };
    try {
      localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* noop */
    }
  },

  // cc-haha L130-L168: restoreTabs — 启动时校验 sessionId 仍存在
  restoreTabs: async () => {
    try {
      const raw = localStorage.getItem(TAB_STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw) as TabPersistence;
      if (!data.openTabs || data.openTabs.length === 0) return;

      // panda IPC: bridge.listSessions() 替换 cc-haha sessionsApi.list({ limit: 200 })
      const list = await bridge.listSessions();
      // SessionListResponse 是数组；为保险按 ducktype 处理
      const arr = Array.isArray(list)
        ? list
        : (list as unknown as { sessions?: Array<{ id: string; title?: string }> }).sessions ?? [];
      const existingIds = new Set(arr.map((s) => s.id));

      const validTabs: Tab[] = data.openTabs
        .filter((t) => {
          // Comdr 指令 cc-haha 路线 A 调整：'session-controls' / 'tool-inspection'
          //   Sidebar 入口已下线 — 历史持久化 tab 在恢复时直接丢弃。
          if (t.type === 'session-controls' || t.type === 'tool-inspection') {
            return false;
          }
          // Special tabs are always valid
          // Comdr 指令: super-assistant 与 settings/scheduled 同列为特殊 tab
          // Comdr 指令: panda 独有能力补齐 — Group 1（4 新特殊 tab 加入白名单）
          // Comdr 指令: 学习助手 + Output Styles 重组 — 'learning' 加入白名单
          if (
            t.type === 'settings' ||
            t.type === 'scheduled' ||
            t.type === 'super-assistant' ||
            t.type === 'connectors' ||
            t.type === 'patterns' ||
            t.type === 'memory-bank' ||
            t.type === 'agent-teams' ||
            t.type === 'learning'
          )
            return true;
          // Session tabs must exist on backend
          return existingIds.has(t.sessionId);
        })
        .map((t, i) => {
          const id = crypto.randomUUID();
          // Comdr 指令: panda 独有能力补齐 — Group 1
          // Comdr 指令: 学习助手 + Output Styles 重组
          // Comdr 指令 cc-haha 路线 A 调整：session-controls / tool-inspection 已从白名单移除
          //   （上方 filter 已经把它们丢弃，这里不会进入）
          if (
            t.type === 'settings' ||
            t.type === 'scheduled' ||
            t.type === 'super-assistant' ||
            t.type === 'connectors' ||
            t.type === 'patterns' ||
            t.type === 'memory-bank' ||
            t.type === 'agent-teams' ||
            t.type === 'learning'
          ) {
            return {
              sessionId: t.sessionId,
              title: t.title,
              type: t.type,
              status: 'idle' as const,
              id,
              order: i,
              isActive: false,
              isPinned: false,
            };
          }
          const fromList = arr.find((s) => s.id === t.sessionId);
          return {
            sessionId: t.sessionId,
            title:
              ((fromList as { title?: string })?.title ??
                (fromList as { name?: string })?.name) ||
              t.title,
            type: 'session' as const,
            status: 'idle' as const,
            id,
            order: i,
            isActive: false,
            isPinned: false,
          };
        });

      if (validTabs.length === 0) return;

      const activeId =
        data.activeTabId &&
        validTabs.some((t) => t.sessionId === data.activeTabId)
          ? data.activeTabId
          : validTabs[0]!.sessionId;

      // 同步 isActive 镜像
      const finalTabs = validTabs.map((t) => ({
        ...t,
        isActive: t.sessionId === activeId,
      }));

      set({ tabs: finalTabs, activeTabId: activeId });
    } catch {
      /* noop */
    }
  },

  // ── panda 扩展层 ─────────────────────────────────────────────────────────
  // panda addTab → 委托 cc-haha openTab；保留 windowId 注入路径
  addTab: (sessionId, title, windowId?) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.sessionId === sessionId);
    if (existing) {
      set({
        tabs: tabs.map((t) => ({ ...t, isActive: t.sessionId === sessionId })),
        activeTabId: sessionId,
      });
    } else {
      const resolvedWindowId =
        windowId ??
        (useWindowStore.getState().windowId > 0
          ? useWindowStore.getState().windowId
          : undefined);
      const newTab: Tab = {
        sessionId,
        title,
        type: 'session',
        status: 'idle',
        id: crypto.randomUUID(),
        order: tabs.length,
        isActive: true,
        isPinned: false,
        windowId: resolvedWindowId,
      };
      set({
        tabs: [...tabs.map((t) => ({ ...t, isActive: false })), newTab],
        activeTabId: sessionId,
      });
    }
    get().saveTabs();
  },

  // panda removeTab(tabId) → 转为 sessionId 调用 closeTab
  removeTab: (tabId) => {
    const tab = get().tabs.find((t) => t.id === tabId);
    if (!tab) return;
    get().closeTab(tab.sessionId);
  },

  // panda renameTab(tabId) → 转为 sessionId 调用 updateTabTitle
  renameTab: (tabId, title) => {
    const tab = get().tabs.find((t) => t.id === tabId);
    if (!tab) return;
    get().updateTabTitle(tab.sessionId, title);
  },

  // panda reorderTabs(fromIndex,toIndex) → 直接调 cc-haha moveTab
  reorderTabs: (fromIndex, toIndex) => {
    get().moveTab(fromIndex, toIndex);
  },

  // panda pinTab / unpinTab — panda-only 字段
  pinTab: (tabId) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, isPinned: true } : t,
      ),
    })),

  unpinTab: (tabId) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, isPinned: false } : t,
      ),
    })),

  // panda closeOthers — 保留 pinned + 目标
  closeOthers: (tabId) => {
    set((state) => {
      const target = state.tabs.find((t) => t.id === tabId);
      if (!target) return state;
      const kept = state.tabs.filter((t) => t.id === tabId || t.isPinned);
      const reindexed = kept.map((t, i) => ({
        ...t,
        order: i,
        isActive: t.id === tabId,
      }));
      return {
        tabs: reindexed,
        activeTabId: target.sessionId,
      };
    });
    get().saveTabs();
  },

  // panda closeAll — 保留 pinned，激活第一个 pinned
  closeAll: () => {
    set((state) => {
      const pinned = state.tabs.filter((t) => t.isPinned);
      if (pinned.length === 0) {
        return { tabs: [], activeTabId: null };
      }
      const reindexed = pinned.map((t, i) => ({
        ...t,
        order: i,
        isActive: i === 0,
      }));
      return {
        tabs: reindexed,
        activeTabId: reindexed[0].sessionId,
      };
    });
    get().saveTabs();
  },

  getTabBySessionId: (sessionId) => {
    return get().tabs.find((t) => t.sessionId === sessionId);
  },

  getTabsForWindow: (windowId) => {
    return get().tabs.filter(
      (t) => t.windowId === undefined || t.windowId === windowId,
    );
  },
}));

// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
