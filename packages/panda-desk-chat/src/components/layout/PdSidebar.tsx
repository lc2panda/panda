// Input: sessionStore / chatStore / tabStore / uiStore + i18n
// Output: 左侧栏 — Brand / 2-Nav / ProjectFilter / Search / SessionList / Settings / Context-menu / 删除确认
// Pos: Layout layer — cc-haha desktop/src/components/layout/Sidebar.tsx 1:1
//
// Source: cc-haha desktop/src/components/layout/Sidebar.tsx L1-503（503 行）
//   panda 适配：
//     - cc-haha @tauri-apps/api/window startDragging → Electron 拖拽由 [data-drag-region] 处理
//     - cc-haha __TAURI_INTERNALS__ → panda 'electronAPI' in window
//     - cc-haha SessionListItem.title/workDir/modifiedAt/projectPath/workDirExists → panda SessionMeta.name/cwd/lastActive 等价映射
//     - cc-haha sessionsApi.getRecentProjects → panda sessionStore.availableProjects（PdProjectFilter 内部已实现降级）
//     - className 全部前缀替换：var(--color-*) → var(--pd-color-*)、var(--radius-*) → var(--pd-radius-*)、
//       var(--font-*) → var(--pd-font-*)、var(--shadow-*) → var(--pd-shadow-*)
//     - PdSidebar 接受 expanded/onToggle props（panda 已有契约），cc-haha 内部 sidebarOpen 由 prop 替换
//     - app-icon.png 不存在 → 用 /icon.svg
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSessionStore, type SessionMeta } from '../../stores/sessionStore';
import { useUIStore } from '../../stores/uiStore';
import {
  useTabStore,
  SETTINGS_TAB_ID,
  SCHEDULED_TAB_ID,
  SUPER_ASSISTANT_TAB_ID,
  // Comdr 指令: panda 独有能力补齐 — Group 1（4 个新 NavItem 的 tab id）
  CONNECTORS_TAB_ID,
  PATTERNS_TAB_ID,
  MEMORY_BANK_TAB_ID,
  AGENT_TEAMS_TAB_ID,
  // Comdr 指令: 学习助手 + Output Styles 重组 — 学习助手 tab id
  LEARNING_TAB_ID,
  // Comdr 指令 cc-haha 路线 A 调整: 会话控制 NavItem 已下线 — 嵌入 Composer 底部
  //   工具调试 NavItem 已下线 — 迁入 Settings sub-tab
  //   常量 SESSION_CONTROLS_TAB_ID / TOOL_INSPECTION_TAB_ID 仍保留在 tabStore，
  //   供 restoreTabs 历史 tab 自动失效逻辑使用，本文件不再 import。
} from '../../stores/tabStore';
import { useChatStore } from '../../stores/chatStore';
import { useToastStore } from '../../stores/toastStore';
import { t } from '../../i18n';
import { PdProjectFilter } from './PdProjectFilter';

const isElectron =
  typeof window !== 'undefined' &&
  ('electronAPI' in window || 'pandaAPI' in window);
const isWindows =
  typeof navigator !== 'undefined' && /Win/.test(navigator.platform);

type TimeGroup = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'older';

const TIME_GROUP_ORDER: TimeGroup[] = ['today', 'yesterday', 'last7days', 'last30days', 'older'];

export interface PdSidebarProps {
  /** cc-haha sidebarOpen 等价 — 由 AppShell 管理。 */
  expanded: boolean;
  /** cc-haha toggleSidebar 等价。 */
  onToggle: () => void;
}

export function PdSidebar({ expanded, onToggle }: PdSidebarProps) {
  const sessions = useSessionStore((s) => s.sessions);
  const selectedProjects = useSessionStore((s) => s.selectedProjects);
  const error = useSessionStore((s) => s.error);
  const fetchSessions = useSessionStore((s) => s.fetchSessions);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const renameSession = useSessionStore((s) => s.renameSession);
  const addToast = useToastStore((s) => s.addToast);
  // cc-haha sidebarOpen → 来自 prop expanded
  const sidebarOpen = expanded;
  const toggleSidebar = onToggle;
  const activeTabId = useTabStore((s) => s.activeTabId);
  const closeTab = useTabStore((s) => s.closeTab);
  const disconnectSession = useChatStore((s) => s.disconnectSession);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!contextMenu || sidebarOpen) return;
    setContextMenu(null);
  }, [contextMenu, sidebarOpen]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [contextMenu]);

  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (selectedProjects.length > 0) {
      // cc-haha 用 projectPath；panda SessionMeta 用 cwd（语义等价）
      result = result.filter((s) => selectedProjects.includes(s.cwd));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      // cc-haha 用 title；panda 用 name
      result = result.filter((s) => (s.name ?? '').toLowerCase().includes(q));
    }
    return result;
  }, [sessions, selectedProjects, searchQuery]);

  const timeGroups = useMemo(() => groupByTime(filteredSessions), [filteredSessions]);

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setContextMenu(null);
    setPendingDeleteSessionId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteSessionId) return;
    await deleteSession(pendingDeleteSessionId);
    disconnectSession(pendingDeleteSessionId);
    closeTab(pendingDeleteSessionId);
    setPendingDeleteSessionId(null);
  }, [closeTab, deleteSession, disconnectSession, pendingDeleteSessionId]);

  const handleStartRename = useCallback((id: string, currentTitle: string) => {
    setContextMenu(null);
    setRenamingId(id);
    setRenameValue(currentTitle);
  }, []);

  const handleFinishRename = useCallback(async () => {
    if (renamingId && renameValue.trim()) {
      await renameSession(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  }, [renamingId, renameValue, renameSession]);

  // cc-haha startDragging via @tauri-apps/api/window
  // panda Electron：拖拽通过 [data-drag-region] CSS 完成；保留 ref 以维持 cc-haha 结构。
  const startDraggingRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!isElectron) return;
    // panda Electron：drag 由 -webkit-app-region: drag CSS 处理；这里保持 noop
    startDraggingRef.current = async () => {
      /* noop — drag handled by [data-drag-region] CSS */
    };
  }, []);

  const handleSidebarDrag = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, select, a, [role="button"]')) return;
    startDraggingRef.current?.();
  }, []);

  // cc-haha 用 useTranslation hook；panda 用 t() 函数（等价）
  const tt = t;

  const timeGroupLabels: Record<TimeGroup, string> = {
    today: tt('sidebar.timeGroup.today'),
    yesterday: tt('sidebar.timeGroup.yesterday'),
    last7days: tt('sidebar.timeGroup.last7days'),
    last30days: tt('sidebar.timeGroup.last30days'),
    older: tt('sidebar.timeGroup.older'),
  };

  return (
    <aside
      onMouseDown={handleSidebarDrag}
      className="sidebar-panel relative h-full flex flex-col bg-[var(--pd-color-surface-sidebar)] border-r border-[var(--pd-color-border)] select-none"
      data-state={sidebarOpen ? 'open' : 'closed'}
      aria-label="Sidebar"
    >
      <div className={`px-3 pb-2 ${isElectron && !isWindows ? 'pt-[44px]' : 'pt-3'}`}>
        <div className={`flex ${sidebarOpen ? 'items-center justify-between gap-3' : 'flex-col items-center gap-2'}`}>
          {/* Comdr 指令: 品牌标识仅 "Panda"，去掉熊猫 emoji 图标 + GitHub 链接 */}
          <div className={`flex min-w-0 items-center ${sidebarOpen ? '' : 'justify-center'}`}>
            <span
              className={`sidebar-copy ${sidebarOpen ? 'sidebar-copy--visible' : 'sidebar-copy--hidden'} text-[15px] font-bold tracking-tight text-[var(--pd-color-text-primary)]`}
              style={{ fontFamily: 'var(--pd-font-headline)' }}
            >
              Panda
            </span>
          </div>
          <div className={`flex items-center ${sidebarOpen ? 'gap-1.5' : 'flex-col gap-2'}`}>
            <button
              type="button"
              onClick={toggleSidebar}
              data-testid={sidebarOpen ? 'sidebar-collapse-button' : 'sidebar-expand-button'}
              className={`sidebar-toggle-button ${sidebarOpen ? 'sidebar-toggle-button--open h-8 w-8' : 'sidebar-toggle-button--collapsed h-8 w-8'} flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pd-color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pd-color-surface-sidebar)]`}
              aria-label={sidebarOpen ? tt('sidebar.collapse') : tt('sidebar.expand')}
              title={sidebarOpen ? tt('sidebar.collapse') : tt('sidebar.expand')}
            >
              <SidebarToggleIcon collapsed={!sidebarOpen} />
            </button>
          </div>
        </div>
      </div>

      <div className={`px-3 pb-3 flex flex-col ${sidebarOpen ? 'gap-0.5' : 'items-center gap-2'}`}>
        <NavItem
          active={false}
          collapsed={!sidebarOpen}
          label={tt('sidebar.newSession')}
          onClick={async () => {
            try {
              const currentTabId = useTabStore.getState().activeTabId;
              const currentSession = currentTabId
                ? useSessionStore.getState().sessions.find((s) => s.id === currentTabId)
                : null;
              const workDir = currentSession?.cwd || undefined;
              const meta = await useSessionStore.getState().createSession(workDir);
              useTabStore.getState().openTab(meta.id, tt('sidebar.newSession'));
              useChatStore.getState().connectToSession(meta.id);
            } catch (error) {
              addToast({
                type: 'error',
                message: error instanceof Error ? error.message : tt('sidebar.sessionListFailed'),
              });
            }
          }}
          icon={<PlusIcon />}
        >
          {tt('sidebar.newSession')}
        </NavItem>
        <NavItem
          active={activeTabId === SCHEDULED_TAB_ID}
          collapsed={!sidebarOpen}
          label={tt('sidebar.scheduled')}
          onClick={() => useTabStore.getState().openTab(SCHEDULED_TAB_ID, tt('sidebar.scheduled'), 'scheduled')}
          icon={<ClockIcon />}
        >
          {tt('sidebar.scheduled')}
        </NavItem>
        {/* Comdr 指令: 超级助手仅在 Settings 中保留；Sidebar 不显示（节省空间） */}
        {/* Comdr 指令: 数据连接器移到 Settings 内（设置类不放 Sidebar） */}
        {/* Comdr 指令: 学习助手 NavItem — 学习/写作/知识管理会话入口 */}
        <NavItem
          active={activeTabId === LEARNING_TAB_ID}
          collapsed={!sidebarOpen}
          label={tt('sidebar.learning')}
          onClick={() =>
            useTabStore
              .getState()
              .openTab(LEARNING_TAB_ID, tt('sidebar.learning'), 'learning')
          }
          icon={<span className="material-symbols-outlined text-[18px]" aria-hidden="true">school</span>}
        >
          {tt('sidebar.learning')}
        </NavItem>
        {/* Comdr 指令: panda 独有能力 — 查看类入口（经验记忆/记忆浏览器/团队） */}
        <NavItem
          active={activeTabId === PATTERNS_TAB_ID}
          collapsed={!sidebarOpen}
          label={tt('sidebar.patterns')}
          onClick={() =>
            useTabStore
              .getState()
              .openTab(PATTERNS_TAB_ID, tt('sidebar.patterns'), 'patterns')
          }
          icon={<span className="material-symbols-outlined text-[18px]" aria-hidden="true">psychology_alt</span>}
        >
          {tt('sidebar.patterns')}
        </NavItem>
        <NavItem
          active={activeTabId === MEMORY_BANK_TAB_ID}
          collapsed={!sidebarOpen}
          label={tt('sidebar.memoryBank')}
          onClick={() =>
            useTabStore
              .getState()
              .openTab(MEMORY_BANK_TAB_ID, tt('sidebar.memoryBank'), 'memory-bank')
          }
          icon={<span className="material-symbols-outlined text-[18px]" aria-hidden="true">memory</span>}
        >
          {tt('sidebar.memoryBank')}
        </NavItem>
        <NavItem
          active={activeTabId === AGENT_TEAMS_TAB_ID}
          collapsed={!sidebarOpen}
          label={tt('sidebar.agentTeams')}
          onClick={() =>
            useTabStore
              .getState()
              .openTab(AGENT_TEAMS_TAB_ID, tt('sidebar.agentTeams'), 'agent-teams')
          }
          icon={<span className="material-symbols-outlined text-[18px]" aria-hidden="true">groups</span>}
        >
          {tt('sidebar.agentTeams')}
        </NavItem>
        {/* Comdr 指令 cc-haha 路线 A 调整：
            - 会话控制 NavItem 已下线 — Fork/Branch/Resume/Stop 嵌入 Composer 底部按钮组
            - 工具调试 NavItem 已下线 — 迁入 Settings 'toolInspection' sub-tab
            历史已打开 tab 由 restoreTabs/PdContentRouter 自动失效兜底（cleanup 逻辑见 tabStore + PdContentRouter）。 */}
      </div>

      {sidebarOpen ? (
        <>
          <div
            data-testid="sidebar-project-filter-section"
            className="sidebar-section sidebar-section--visible relative z-20 flex-none px-3 pb-2"
            style={{ overflow: 'visible' }}
          >
            <div className="flex h-9 items-center rounded-[14px] border border-[var(--pd-color-sidebar-search-border)] bg-[var(--pd-color-sidebar-search-bg)] pl-1.5 pr-3 transition-colors focus-within:border-[var(--pd-color-border-focus)]">
              <PdProjectFilter variant="embedded" />
              <span className="mx-2 h-4 w-px bg-[var(--pd-color-border)]/80" aria-hidden="true" />
              <span className="pointer-events-none flex shrink-0 items-center text-[var(--pd-color-text-tertiary)]">
                <SearchIcon />
              </span>
              <input
                id="sidebar-search"
                type="text"
                placeholder={tt('sidebar.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent pl-2 pr-0 text-[13px] text-[var(--pd-color-text-primary)] placeholder:text-[var(--pd-color-text-tertiary)] outline-none"
              />
            </div>
          </div>

          <div
            data-testid="sidebar-session-list-section"
            className="sidebar-section sidebar-section--visible flex flex-1 min-h-0 flex-col"
          >
            <div className="sidebar-scroll-area min-h-0 flex-1 overflow-y-auto px-3">
              {error && (
                <div className="mx-1 mt-2 rounded-[var(--pd-radius-md)] border border-[var(--pd-color-error)]/20 bg-[var(--pd-color-error)]/5 px-3 py-2">
                  <div className="text-xs font-medium text-[var(--pd-color-error)]">{tt('sidebar.sessionListFailed')}</div>
                  <div className="mt-1 text-[11px] text-[var(--pd-color-text-secondary)] break-words">{error}</div>
                  <button
                    onClick={() => fetchSessions()}
                    className="mt-2 text-[11px] font-medium text-[var(--pd-color-brand)] hover:underline"
                  >
                    {tt('common.retry')}
                  </button>
                </div>
              )}
              {filteredSessions.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-[var(--pd-color-text-tertiary)]">
                  {searchQuery ? tt('sidebar.noMatching') : tt('sidebar.noSessions')}
                </div>
              )}
              {TIME_GROUP_ORDER.map((group) => {
                const items = timeGroups.get(group);
                if (!items || items.length === 0) return null;
                return (
                  <div key={group} className="mb-1">
                    <div className="px-2 pb-1 pt-4 text-[11px] font-semibold tracking-wide text-[var(--pd-color-text-tertiary)]">
                      {timeGroupLabels[group]}
                    </div>
                    {items.map((session) => (
                      <div key={session.id} className="relative">
                        {renamingId === session.id ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleFinishRename}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleFinishRename();
                              if (e.key === 'Escape') {
                                setRenamingId(null);
                                setRenameValue('');
                              }
                            }}
                            className="ml-1 w-full rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border-focus)] bg-[var(--pd-color-surface)] px-3 py-2 text-sm text-[var(--pd-color-text-primary)] outline-none"
                          />
                        ) : (
                          <button
                            onClick={() => {
                              useTabStore.getState().openTab(session.id, session.name);
                              useChatStore.getState().connectToSession(session.id);
                            }}
                            onContextMenu={(e) => handleContextMenu(e, session.id)}
                            className={`
                              group w-full rounded-[12px] px-3 py-2 text-left text-sm transition-colors duration-200
                              ${session.id === activeTabId
                                ? 'bg-[var(--pd-color-sidebar-item-active)] text-[var(--pd-color-text-primary)]'
                                : 'text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-sidebar-item-hover)]'
                              }
                            `}
                          >
                            <span className="flex items-center gap-2.5">
                              <span
                                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                style={{
                                  backgroundColor: session.id === activeTabId ? 'var(--pd-color-brand)' : 'var(--pd-color-text-tertiary)',
                                  opacity: session.id === activeTabId ? 1 : 0.5,
                                }}
                              />
                              <span className="flex-1 truncate font-medium tracking-[-0.01em]">{session.name || 'Untitled'}</span>
                              <span className="flex-shrink-0 text-[10px] text-[var(--pd-color-text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100">
                                {formatRelativeTime(session.lastActive)}
                              </span>
                            </span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1" aria-hidden="true" />
      )}

      <div className={`border-t border-[var(--pd-color-border)] p-3 ${sidebarOpen ? '' : 'flex justify-center'}`}>
        <NavItem
          active={activeTabId === SETTINGS_TAB_ID}
          collapsed={!sidebarOpen}
          label={tt('sidebar.settings')}
          onClick={() => useTabStore.getState().openTab(SETTINGS_TAB_ID, tt('sidebar.settings'), 'settings')}
          icon={<span className="material-symbols-outlined text-[18px]">settings</span>}
        >
          {tt('sidebar.settings')}
        </NavItem>
      </div>

      {contextMenu && sidebarOpen && (
        <div
          className="fixed z-50 min-w-[140px] rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] py-1"
          style={{ left: contextMenu.x, top: contextMenu.y, boxShadow: 'var(--pd-shadow-dropdown)' }}
        >
          <button
            onClick={() => {
              const session = sessions.find((s) => s.id === contextMenu.id);
              handleStartRename(contextMenu.id, session?.name || '');
            }}
            className="w-full px-3 py-1.5 text-left text-xs text-[var(--pd-color-text-primary)] transition-colors hover:bg-[var(--pd-color-surface-hover)]"
          >
            {tt('common.rename')}
          </button>
          <button
            onClick={() => handleDelete(contextMenu.id)}
            className="w-full px-3 py-1.5 text-left text-xs text-[var(--pd-color-error)] transition-colors hover:bg-[var(--pd-color-surface-hover)]"
          >
            {tt('common.delete')}
          </button>
        </div>
      )}

      {/* cc-haha ConfirmDialog → panda 内联简化（保持 modal 结构 1:1） */}
      {pendingDeleteSessionId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
          <div
            className="bg-[var(--pd-color-surface)] rounded-xl border border-[var(--pd-color-border)] p-6 max-w-sm w-full mx-4"
            style={{ boxShadow: 'var(--pd-shadow-dropdown)' }}
          >
            <h3 className="text-sm font-semibold text-[var(--pd-color-text-primary)] mb-2">{tt('common.delete')}</h3>
            <p className="text-xs text-[var(--pd-color-text-secondary)] mb-4">{tt('sidebar.confirmDelete')}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingDeleteSessionId(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--pd-color-border)] text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)]"
              >
                {tt('common.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 text-xs rounded-lg bg-[var(--pd-color-error)] text-white hover:opacity-90"
              >
                {tt('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function groupByTime(sessions: SessionMeta[]): Map<TimeGroup, SessionMeta[]> {
  const groups = new Map<TimeGroup, SessionMeta[]>();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const sevenDaysAgo = startOfToday - 7 * 86400000;
  const thirtyDaysAgo = startOfToday - 30 * 86400000;

  for (const session of sessions) {
    const ts = new Date(session.lastActive).getTime();
    let group: TimeGroup;
    if (ts >= startOfToday) group = 'today';
    else if (ts >= startOfYesterday) group = 'yesterday';
    else if (ts >= sevenDaysAgo) group = 'last7days';
    else if (ts >= thirtyDaysAgo) group = 'last30days';
    else group = 'older';

    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(session);
  }

  return groups;
}

function NavItem({
  active,
  collapsed,
  label,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  collapsed: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={collapsed ? label : undefined}
      className={`
        flex items-center transition-colors duration-200
        ${collapsed ? 'h-10 w-10 justify-center rounded-[var(--pd-radius-md)] px-0 py-0' : 'w-full gap-2.5 rounded-[12px] px-3 py-2.5 text-sm'}
        ${active
          ? 'bg-[var(--pd-color-sidebar-item-active)] font-medium text-[var(--pd-color-text-primary)]'
          : 'text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-sidebar-item-hover)] hover:text-[var(--pd-color-text-primary)]'
        }
      `}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className={`sidebar-copy ${collapsed ? 'sidebar-copy--hidden' : 'sidebar-copy--visible'}`}>
        {children}
      </span>
    </button>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d`;
  return `${Math.floor(day / 30)}mo`;
}

// GitHubIcon 已删除（Comdr 指令：去掉左侧栏 GitHub 图标）

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width={collapsed ? 16 : 14}
      height={collapsed ? 16 : 14}
      viewBox="0 0 14 14"
      fill="none"
      className={`sidebar-toggle-icon ${collapsed ? 'sidebar-toggle-icon--collapsed' : 'sidebar-toggle-icon--open'}`}
      aria-hidden="true"
    >
      <path
        d={collapsed ? 'M5 3 9 7l-4 4' : 'M9 3 5 7l4 4'}
        className="sidebar-toggle-chevron"
      />
    </svg>
  );
}

// cc-haha L1-503 — 503 行；panda 复刻 + Electron/SessionMeta 字段映射 + 内联 ConfirmDialog。
