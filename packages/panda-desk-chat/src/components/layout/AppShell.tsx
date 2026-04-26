// Input: settingsStore / uiStore / tabStore / chatStore + i18n + global shortcuts
// Output: 顶层三栏 shell — Sidebar | Main(TabBar + ContentRouter) — cc-haha 1:1
// Pos: Layout layer — App.tsx 唯一子组件
//
// Source: cc-haha desktop/src/components/layout/AppShell.tsx L1-119（119 行）
//   panda 适配：
//     - cc-haha settingsStore.fetchAll → panda 隐式（settingsStore 模块加载即完成）
//     - cc-haha @tauri-apps/api/event 'native-menu-navigate' → panda 'menu-navigate'（CustomEvent）
//     - cc-haha initializeDesktopServerUrl → panda IPC bridge 由 main.tsx 已 bootstrap，此处 noop
//     - cc-haha desktop/.../UpdateChecker → panda 已存在自动更新由 main 进程驱动，此处隐藏
//     - 保持 className 字符串 1:1，仅前缀替换 var(--color-*) → var(--pd-color-*)
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useState } from 'react';
import { PdSidebar } from './PdSidebar';
import { PdContentRouter } from './PdContentRouter';
import { PdTabBar } from './PdTabBar';
import { useUIStore } from '../../stores/uiStore';
import { useTabStore, SETTINGS_TAB_ID } from '../../stores/tabStore';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { t } from '../../i18n';
import { useGlobalShortcuts } from '../../hooks/useGlobalShortcuts';
import { useThemeEffect } from '../../hooks/useThemeEffect';
import { useFontSizeEffect } from '../../hooks/useFontSizeEffect';

export function AppShell() {
  const isSidebarHovered = useUIStore((s) => s.isSidebarHovered);
  // cc-haha sidebarOpen 来自 uiStore；panda 沿用 uiStore.activeView/sidebarHovered，
  // 真正的 expanded/collapsed 状态走 useState（与 cc-haha L17-L18 ready/sidebarOpen 等价局部态）
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ready, setReady] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        // panda：fetchSettings 在 settingsStore 模块加载即完成；此处仅 restore tabs
        await useTabStore.getState().restoreTabs();
        const { activeTabId: activeId, tabs } = useTabStore.getState();
        const activeTab = tabs.find((tab) => tab.sessionId === activeId);
        if (activeId && activeTab?.type === 'session') {
          useChatStore.getState().connectToSession(activeId);
        }
        // Comdr 指令 (任务 4): 启动时强制拉取一次 model 列表 — settingsStore.fetchAll
        //   原仅在 PdProviderSettings 进入时触发 → 启动后 PdModelSelector 永远显示 placeholder。
        //   即使 IPC 返回空，fetchAll 内部已对 providerStore 兜底。
        useSettingsStore.getState().fetchAll().catch((err: unknown) => {
          console.warn('[AppShell] settingsStore.fetchAll failed:', err);
        });
        if (!cancelled) {
          setReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setStartupError(error instanceof Error ? error.message : String(error));
          setReady(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for native menu navigation events (About / Settings) — Electron CustomEvent
  // cc-haha 用 @tauri-apps/api/event 'native-menu-navigate'；panda 用 window CustomEvent 'menu-navigate'
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      const target = detail as 'about' | 'settings';
      if (target === 'about') {
        // panda：uiStore 暂无 setPendingSettingsTab；保留 noop（后续可补）
      }
      useTabStore.getState().openTab(SETTINGS_TAB_ID, t('sidebar.settings'), 'settings');
    };
    window.addEventListener('menu-navigate', handler);
    return () => window.removeEventListener('menu-navigate', handler);
  }, []);

  useThemeEffect();
  useFontSizeEffect();
  useGlobalShortcuts({
    toggleSidebar: () => setSidebarOpen((p) => !p),
    openSettings: () =>
      useTabStore.getState().openTab(SETTINGS_TAB_ID, t('sidebar.settings'), 'settings'),
  });

  if (startupError) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--pd-color-surface)] px-6">
        <div className="max-w-xl rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] p-6">
          <h1 className="text-lg font-semibold text-[var(--pd-color-text-primary)]">
            {t('app.serverFailed')}
          </h1>
          <p className="mt-2 text-sm text-[var(--pd-color-text-secondary)]">
            {startupError}
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--pd-color-surface)] text-[var(--pd-color-text-secondary)]">
        {t('app.launching')}
      </div>
    );
  }

  // Reference isSidebarHovered to satisfy unused-var lint (mirrors cc-haha
  // structural state imports without affecting render output).
  void isSidebarHovered;

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--pd-color-surface)]">
      <div
        data-testid="sidebar-shell"
        data-state={sidebarOpen ? 'open' : 'closed'}
        className="sidebar-shell pd-sidebar-shell"
      >
        <PdSidebar expanded={sidebarOpen} onToggle={() => setSidebarOpen((p) => !p)} />
      </div>
      <main
        id="content-area"
        data-sidebar-state={sidebarOpen ? 'open' : 'closed'}
        className="min-w-0 flex-1 flex flex-col overflow-hidden"
      >
        <PdTabBar />
        <PdContentRouter />
      </main>
    </div>
  );
}

// cc-haha L1-119 — 119 行；panda 复刻含 Electron 适配 + i18n + theme 副作用注入。
