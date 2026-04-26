// Input: UI 交互事件（modal/toast/sidebar/composer/searchQuery/activeView）+ theme 持久化
// Output: cc-haha 1:1 主题/侧栏/视图/弹窗/Toast 状态 + panda 扩展（modal type / hover / composerFocused / searchQuery）
// Pos: State layer — drives App / PdSidebar / PdToast / SettingsPage
//
// Source 1:1: cc-haha desktop/src/stores/uiStore.ts (112 行)
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { create } from 'zustand';
import type { ThemeMode } from '../types/settings';

// ---------------------------------------------------------------------------
// Constants & helpers — cc-haha L4-L23
// ---------------------------------------------------------------------------

const THEME_STORAGE_KEY = 'panda-theme';

function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* localStorage unavailable */
  }
  return 'light';
}

// cc-haha L14-L18: applyTheme — 写 data-theme + colorScheme
export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
}

// cc-haha L20-L22: initializeTheme — 启动时应用持久化主题
export function initializeTheme() {
  applyTheme(getStoredTheme());
}

// ---------------------------------------------------------------------------
// Types — cc-haha L24-L64 + panda 扩展
// ---------------------------------------------------------------------------

export type Toast = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
};

/**
 * cc-haha SettingsTab — 11 类设置入口（providers/permissions/general/...）。
 * panda 现 SettingsPage 视实际 tab 而定，仍保留全集供 pendingSettingsTab 路由。
 * Comdr 指令: 加入 'superAssistant' panda 自有扩展 tab，路由到 PdSuperAssistantSettings。
 */
export type SettingsTab =
  | 'providers'
  | 'permissions'
  | 'superAssistant'
  | 'general'
  // Comdr 指令: pandaEnv — 22 个 PANDA_* 环境变量配置入口
  | 'pandaEnv'
  | 'adapters'
  // Comdr 指令: 数据连接器从 Sidebar 移到 Settings
  | 'connectors'
  | 'terminal'
  | 'mcp'
  | 'agents'
  | 'skills'
  | 'plugins'
  | 'computerUse'
  // Comdr 指令 cc-haha 路线 A 调整：工具调试从 Sidebar 迁入 Settings sub-tab，紧随 computerUse 之后。
  | 'toolInspection'
  // Comdr 指令: panda 独有能力补齐 — Group 2（4 个新 settings sub-tab）
  | 'routing'
  | 'hooks'
  // Comdr 指令: 学习助手 + Output Styles 重组 — outputStyles 顶级 tab 移除，
  //   作为 learning sub-tab 第 4 个子区块内嵌；新增 learning 顶级 tab。
  | 'learning'
  | 'voice'
  | 'about';

/**
 * cc-haha ActiveView 5 类：code / scheduled / terminal / history / settings。
 * panda 当前只用 chat / scheduled / settings —— 通过 union 扩展同时兼容。
 */
export type ActiveView =
  | 'code'
  | 'scheduled'
  | 'terminal'
  | 'history'
  | 'settings'
  | 'chat'; // panda 扩展：等价于 cc-haha 'code'

/**
 * panda 扩展：Modal 类型化 union（command-palette / settings 弹窗等）。
 * cc-haha 用 string | null；panda 收紧成 union 以利类型安全。
 */
export type ModalType =
  | 'command-palette'
  | 'settings'
  | 'confirm-delete'
  | 'model-selector'
  | 'mcp-add'
  | string
  | null;

export interface UIStore {
  theme: ThemeMode;
  sidebarOpen: boolean;
  activeView: ActiveView;
  pendingSettingsTab: SettingsTab | null;
  activeModal: ModalType;
  toasts: Toast[];

  // panda 扩展字段
  isSidebarHovered: boolean;
  composerFocused: boolean;
  searchQuery: string;

  // ── cc-haha actions ─────────────────────────────────────────────────────
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveView: (view: ActiveView) => void;
  setPendingSettingsTab: (tab: SettingsTab | null) => void;
  openModal: (id: ModalType) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // ── panda 扩展 actions ──────────────────────────────────────────────────
  setSidebarHovered: (hovered: boolean) => void;
  setComposerFocused: (focused: boolean) => void;
  setSearchQuery: (query: string) => void;
}

let toastCounter = 0;

// ---------------------------------------------------------------------------
// Store — cc-haha L66-L111
// ---------------------------------------------------------------------------

export const useUIStore = create<UIStore>()((set) => ({
  theme: getStoredTheme(),
  sidebarOpen: true,
  // panda 默认 'chat'（语义同 cc-haha 'code'）
  activeView: 'chat',
  pendingSettingsTab: null,
  activeModal: null,
  toasts: [],

  // panda 扩展默认值
  isSidebarHovered: false,
  composerFocused: false,
  searchQuery: '',

  // cc-haha L76-L80: setTheme — 应用 + 持久化 + setState
  setTheme: (theme) => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* noop */
    }
    set({ theme });
  },

  // cc-haha L82-L89: toggleTheme — light↔dark
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* noop */
      }
      return { theme: next };
    });
  },

  // cc-haha L91-L93
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveView: (view) => set({ activeView: view }),
  setPendingSettingsTab: (tab) => set({ pendingSettingsTab: tab }),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),

  // cc-haha L98-L108: addToast — auto-remove
  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },

  // cc-haha L110: removeToast
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // panda 扩展 actions
  setSidebarHovered: (isSidebarHovered) => set({ isSidebarHovered }),
  setComposerFocused: (composerFocused) => set({ composerFocused }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));

// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
