// Input: expanded state + toggle callback; reads sessionStore for session list
// Output: Collapsible sidebar with date-grouped session list, project selector, pin, search, CRUD, workspace panels, navigation
// Pos: Layout layer — left panel navigation, wired to sessionStore + chatStore + tabStore + windowManager bridge

import { type ComponentType, type ReactNode, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/cn';
import { useSessionStore, type SessionMeta } from '@/stores/sessionStore';
import { useChatStore } from '@/stores/chatStore';
import { useTabStore } from '@/stores/tabStore';
import { openSessionInWindow } from '@/ipc/bridge';
import { PdNavItem } from './PdNavItem';
import { SearchPanel } from './sidebar/SearchPanel';
import { FilesPanel } from './sidebar/FilesPanel';
import { MemoryPanel } from './sidebar/MemoryPanel';
import { WorkflowPanel } from './sidebar/WorkflowPanel';
import { useVirtualList } from '@/hooks/useVirtualList';
import {
  MessageSquare as _MessageSquare,
  Search as _Search,
  FolderOpen as _FolderOpen,
  Brain as _Brain,
  GitBranch as _GitBranch,
  Settings as _Settings,
  User as _User,
  PanelLeftClose as _PanelLeftClose,
  PanelLeftOpen as _PanelLeftOpen,
  Plus as _Plus,
  Trash2 as _Trash2,
  ArrowUpRight as _ArrowUpRight,
  ChevronDown as _ChevronDown,
  ChevronRight as _ChevronRight,
  // @ts-ignore lucide-react 0.511 ships Pin & FolderKanban at runtime but bundled .d.ts misses top-level named exports
  Pin as _Pin,
  // @ts-ignore same as above
  FolderKanban as _FolderKanban,
} from 'lucide-react';

// Re-type lucide icons for React 18 compat (hoisted @types/react@19 conflict)
type IconFC = ComponentType<{ className?: string; size?: number }>;
const MessageSquare = _MessageSquare as IconFC;
const Search = _Search as IconFC;
const FolderOpen = _FolderOpen as IconFC;
const Brain = _Brain as IconFC;
const GitBranch = _GitBranch as IconFC;
const Settings = _Settings as IconFC;
const User = _User as IconFC;
const PanelLeftClose = _PanelLeftClose as IconFC;
const PanelLeftOpen = _PanelLeftOpen as IconFC;
const Plus = _Plus as IconFC;
const Trash2 = _Trash2 as IconFC;
const ExternalLink = _ArrowUpRight as IconFC;
const PinIcon = _Pin as IconFC;
const ChevronDown = _ChevronDown as IconFC;
const ChevronRight = _ChevronRight as IconFC;
const FolderKanban = _FolderKanban as IconFC;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PdSidebarProps {
  expanded: boolean;
  onToggle: () => void;
}

/** @deprecated Use PdNavItemProps from PdNavItem instead */
export interface PdSidebarItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
  shortcut?: string;
}

// ---------------------------------------------------------------------------
// Navigation definitions
// ---------------------------------------------------------------------------
interface NavEntry {
  icon: ReactNode;
  label: string;
  shortcut?: string;
}

const workspaceNav: NavEntry[] = [
  { icon: <Search size={20} />,     label: '搜索',     shortcut: '⌘K' },
  { icon: <FolderOpen size={20} />, label: '文件浏览', shortcut: '⌘0' },
  { icon: <Brain size={20} />,      label: '记忆库' },
  { icon: <GitBranch size={20} />,  label: '工作流' },
];

const bottomNav: NavEntry[] = [
  { icon: <Settings size={20} />, label: '设置' },
  { icon: <User size={20} />,    label: '账户' },
];

// Workspace panel mode type (matches workspaceNav order)
type WorkspaceMode = 'sessions' | 'search' | 'files' | 'memory' | 'workflow';

const WORKSPACE_NAV_MODES: WorkspaceMode[] = ['search', 'files', 'memory', 'workflow'];

// ---------------------------------------------------------------------------
// Date grouping logic
// ---------------------------------------------------------------------------
type DateGroupKey = 'pinned' | 'today' | 'yesterday' | 'last7days' | 'older';

interface DateGroup {
  key: DateGroupKey;
  label: string;
  sessions: SessionMeta[];
}

const GROUP_LABELS: Record<DateGroupKey, string> = {
  pinned: '📌 已固定',
  today: '今天',
  yesterday: '昨天',
  last7days: '近 7 天',
  older: '更早',
};

const GROUP_ORDER: DateGroupKey[] = ['pinned', 'today', 'yesterday', 'last7days', 'older'];

function groupSessionsByDate(sessions: SessionMeta[]): DateGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86_400_000;
  const last7daysStart = todayStart - 6 * 86_400_000;

  const buckets: Record<DateGroupKey, SessionMeta[]> = {
    pinned: [],
    today: [],
    yesterday: [],
    last7days: [],
    older: [],
  };

  for (const s of sessions) {
    if (s.isPinned) {
      buckets.pinned.push(s);
      continue;
    }
    const ts = new Date(s.createdAt).getTime();
    if (ts >= todayStart) {
      buckets.today.push(s);
    } else if (ts >= yesterdayStart) {
      buckets.yesterday.push(s);
    } else if (ts >= last7daysStart) {
      buckets.last7days.push(s);
    } else {
      buckets.older.push(s);
    }
  }

  return GROUP_ORDER
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({ key, label: GROUP_LABELS[key], sessions: buckets[key] }));
}

// ---------------------------------------------------------------------------
// Extract unique project names from sessions
// ---------------------------------------------------------------------------
function extractProjectName(cwd: string): string {
  if (!cwd) return '未知项目';
  const parts = cwd.replace(/\/+$/, '').split('/');
  return parts[parts.length - 1] || '未知项目';
}

function getUniqueProjects(sessions: SessionMeta[]): string[] {
  const set = new Set<string>();
  for (const s of sessions) {
    if (s.cwd) set.add(s.cwd);
  }
  return Array.from(set).sort();
}

// ---------------------------------------------------------------------------
// DateGroupHeader — collapsible section header
// ---------------------------------------------------------------------------
interface DateGroupHeaderProps {
  label: string;
  collapsed: boolean;
  onToggle: () => void;
}

function DateGroupHeader({ label, collapsed, onToggle }: DateGroupHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-1.5 px-3 py-1 mt-1',
        'text-xs text-[var(--pd-color-fg-muted)] uppercase tracking-wider',
        'hover:text-[var(--pd-color-fg)] transition-colors cursor-pointer select-none',
      )}
    >
      <span className="shrink-0 w-3.5">
        {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
      </span>
      <span>{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// ProjectSelector — dropdown filter above search
// ---------------------------------------------------------------------------
interface ProjectSelectorProps {
  projects: string[];
  selected: string | null;
  onSelect: (project: string | null) => void;
}

function ProjectSelector({ projects, selected, onSelect }: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const displayName = selected ? extractProjectName(selected) : '全部项目';

  return (
    <div ref={ref} className="relative shrink-0 px-3 pb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center gap-2 rounded-[var(--pd-radius-md)] px-3',
          'bg-[var(--pd-color-bg-elevated)] border-b border-[var(--pd-color-border-subtle)]',
          'text-sm text-[var(--pd-color-fg)] transition-colors cursor-pointer',
          'hover:bg-[var(--pd-color-bg-hover)]',
        )}
        style={{ height: 36 }}
      >
        <FolderKanban size={16} className="shrink-0 text-[var(--pd-color-fg-muted)]" />
        <span className="flex-1 truncate text-left">{displayName}</span>
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-[var(--pd-color-fg-subtle)] transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            'absolute left-3 right-3 top-[38px] z-50',
            'rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)]',
            'bg-[var(--pd-color-bg-elevated)] shadow-lg',
            'max-h-48 overflow-y-auto',
          )}
        >
          {/* "All projects" option */}
          <button
            type="button"
            onClick={() => { onSelect(null); setOpen(false); }}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
              'hover:bg-[var(--pd-color-bg-hover)]',
              selected === null
                ? 'text-[var(--pd-color-accent)] font-medium'
                : 'text-[var(--pd-color-fg)]',
            )}
          >
            全部项目
          </button>

          {projects.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { onSelect(p); setOpen(false); }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                'hover:bg-[var(--pd-color-bg-hover)]',
                selected === p
                  ? 'text-[var(--pd-color-accent)] font-medium'
                  : 'text-[var(--pd-color-fg)]',
              )}
            >
              <FolderOpen size={14} className="shrink-0 text-[var(--pd-color-fg-muted)]" />
              <span className="truncate">{extractProjectName(p)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section divider
// ---------------------------------------------------------------------------
function SidebarDivider() {
  return (
    <div className="mx-3 my-1 h-px bg-[var(--pd-color-border-subtle)]" />
  );
}

// ---------------------------------------------------------------------------
// Session list item (double-click rename + delete on hover)
// ---------------------------------------------------------------------------
interface SessionItemProps {
  id: string;
  name: string;
  active: boolean;
  expanded: boolean;
  messageCount: number;
  isPinned?: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onOpenInNewWindow: () => void;
  onTogglePin: () => void;
}

function SessionItem({
  name,
  active,
  expanded,
  messageCount,
  isPinned,
  onSelect,
  onDelete,
  onRename,
  onOpenInNewWindow,
  onTogglePin,
}: SessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }, [editValue, name, onRename]);

  const cancelRename = useCallback(() => {
    setEditValue(name);
    setIsEditing(false);
  }, [name]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onDoubleClick={() => {
        if (expanded) {
          setEditValue(name);
          setIsEditing(true);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect();
      }}
      className={cn(
        'group flex w-full items-center gap-2 rounded-[var(--pd-radius-md)] px-3 py-1.5',
        'text-[var(--pd-color-fg-muted)] transition-colors cursor-pointer',
        'duration-[var(--pd-duration-quick)] ease-[var(--pd-ease-standard)]',
        'hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]',
        active && 'bg-[var(--pd-color-accent-subtle)] text-[var(--pd-color-fg)]',
      )}
    >
      <span className="shrink-0">
        <MessageSquare size={16} />
      </span>

      {expanded && (
        <>
          {isEditing ? (
            <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') cancelRename();
                  e.stopPropagation();
                }}
                onBlur={commitRename}
                className={cn(
                  'flex-1 rounded-[var(--pd-radius-sm)] border border-[var(--pd-color-border)]',
                  'bg-[var(--pd-color-bg)] px-1.5 py-0.5 text-sm',
                  'text-[var(--pd-color-fg)] outline-none',
                  'focus:border-[var(--pd-color-accent)]',
                )}
              />
            </div>
          ) : (
            <>
              <div className="flex flex-1 flex-col truncate">
                <span className="truncate text-sm">{name}</span>
                {messageCount > 0 && (
                  <span className="text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-subtle)]">
                    {messageCount} 条消息
                  </span>
                )}
              </div>
              {/* Pin — visible on hover or when pinned */}
              <span
                role="button"
                tabIndex={-1}
                title={isPinned ? '取消固定' : '固定'}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onTogglePin();
                  }
                }}
                className={cn(
                  'shrink-0 rounded-[var(--pd-radius-xs)] p-0.5 transition-opacity',
                  isPinned
                    ? 'opacity-100 text-[var(--pd-color-accent)]'
                    : 'opacity-0 group-hover:opacity-100 text-[var(--pd-color-fg-subtle)] hover:text-[var(--pd-color-accent)]',
                )}
              >
                <PinIcon size={14} />
              </span>
              {/* Delete — visible on hover */}
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onDelete();
                  }
                }}
                className={cn(
                  'shrink-0 rounded-[var(--pd-radius-xs)] p-0.5',
                  'opacity-0 transition-opacity group-hover:opacity-100',
                  'text-[var(--pd-color-fg-subtle)] hover:text-[var(--pd-color-danger)]',
                )}
              >
                <Trash2 size={14} />
              </span>
              {/* Open in New Window — visible on hover */}
              <span
                role="button"
                tabIndex={-1}
                title="Open in New Window"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInNewWindow();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onOpenInNewWindow();
                  }
                }}
                className={cn(
                  'shrink-0 rounded-[var(--pd-radius-xs)] p-0.5',
                  'opacity-0 transition-opacity group-hover:opacity-100',
                  'text-[var(--pd-color-fg-subtle)] hover:text-[var(--pd-color-accent)]',
                )}
              >
                <ExternalLink size={14} />
              </span>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PdSidebar({ expanded, onToggle }: PdSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('sessions');

  // Session store
  const sessions = useSessionStore((s) => s.sessions);
  const activeId = useSessionStore((s) => s.activeId);
  const setActive = useSessionStore((s) => s.setActive);
  const createSession = useSessionStore((s) => s.createSession);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const renameSession = useSessionStore((s) => s.renameSession);
  const togglePin = useSessionStore((s) => s.togglePin);
  const projectFilter = useSessionStore((s) => s.projectFilter);
  const setProjectFilter = useSessionStore((s) => s.setProjectFilter);

  // Chat + Tab stores
  const setChatActiveSession = useChatStore((s) => s.setActiveSession);
  const addTab = useTabStore((s) => s.addTab);

  // Collapsed date-group state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Handlers ──
  const handleSelectSession = useCallback(
    (sessionId: string) => {
      setActive(sessionId);
      setChatActiveSession(sessionId);
    },
    [setActive, setChatActiveSession],
  );

  const handleNewSession = useCallback(async () => {
    const session = await createSession();
    addTab(session.id, session.name);
    setChatActiveSession(session.id);
  }, [createSession, addTab, setChatActiveSession]);

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      deleteSession(sessionId);
      // After delete, activeId is updated by the store — sync chatStore
      const remaining = sessions.filter((s) => s.id !== sessionId);
      if (remaining.length > 0 && activeId === sessionId) {
        setChatActiveSession(remaining[0].id);
      }
    },
    [deleteSession, sessions, activeId, setChatActiveSession],
  );

  const handleRenameSession = useCallback(
    (sessionId: string, name: string) => {
      renameSession(sessionId, name);
    },
    [renameSession],
  );

  // ── Workspace panel toggle ──
  const toggleWorkspaceMode = useCallback(
    (mode: WorkspaceMode) => {
      setWorkspaceMode((prev) => (prev === mode ? 'sessions' : mode));
    },
    [],
  );

  // Search panel navigation: switch to session and scroll to message
  const handleSearchNavigate = useCallback(
    (sessionId: string, _messageId?: string) => {
      setActive(sessionId);
      setChatActiveSession(sessionId);
      setWorkspaceMode('sessions');
    },
    [setActive, setChatActiveSession],
  );

  // ── Filter by project, then by search ──
  const projectFiltered = projectFilter
    ? sessions.filter((s) => s.cwd === projectFilter)
    : sessions;

  const filteredSessions = searchQuery.trim()
    ? projectFiltered.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : projectFiltered;

  // ── Date-grouped sessions ──
  const dateGroups = useMemo(() => groupSessionsByDate(filteredSessions), [filteredSessions]);

  // ── Virtual scrolling: flatten groups into a single list for virtualization ──
  const SIDEBAR_VIRTUALIZE_THRESHOLD = 100;
  const shouldVirtualizeSidebar = expanded && filteredSessions.length > SIDEBAR_VIRTUALIZE_THRESHOLD;

  type SidebarVItem =
    | { kind: 'header'; key: string; label: string; collapsed: boolean }
    | { kind: 'session'; session: SessionMeta }
    | { kind: 'divider'; key: string };

  const sidebarVItems = useMemo<SidebarVItem[]>(() => {
    if (!shouldVirtualizeSidebar) return [];
    const items: SidebarVItem[] = [];
    for (const group of dateGroups) {
      const isCollapsed = !!collapsedGroups[group.key];
      items.push({ kind: 'header', key: group.key, label: group.label, collapsed: isCollapsed });
      if (!isCollapsed) {
        for (const session of group.sessions) {
          items.push({ kind: 'session', session });
        }
      }
      items.push({ kind: 'divider', key: `div-${group.key}` });
    }
    return items;
  }, [shouldVirtualizeSidebar, dateGroups, collapsedGroups]);

  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  const {
    virtualItems: sidebarVirtualItems,
    totalHeight: sidebarTotalHeight,
    paddingTop: sidebarPaddingTop,
    paddingBottom: sidebarPaddingBottom,
    onScroll: sidebarVirtualOnScroll,
  } = useVirtualList({
    items: sidebarVItems,
    containerRef: sidebarScrollRef,
    estimatedItemHeight: 48,
    overscan: 8,
    enabled: shouldVirtualizeSidebar,
  });

  const handleSidebarScroll = useCallback(
    (e: React.UIEvent) => {
      if (shouldVirtualizeSidebar) sidebarVirtualOnScroll(e);
    },
    [shouldVirtualizeSidebar, sidebarVirtualOnScroll],
  );

  const renderSidebarVItem = useCallback(
    (vItem: SidebarVItem) => {
      if (vItem.kind === 'header') {
        return (
          <DateGroupHeader
            key={vItem.key}
            label={vItem.label}
            collapsed={vItem.collapsed}
            onToggle={() => toggleGroup(vItem.key)}
          />
        );
      }
      if (vItem.kind === 'divider') {
        return <SidebarDivider key={vItem.key} />;
      }
      const session = vItem.session;
      return (
        <SessionItem
          key={session.id}
          id={session.id}
          name={session.name}
          active={session.id === activeId}
          expanded={expanded}
          messageCount={session.messageCount}
          isPinned={session.isPinned}
          onSelect={() => handleSelectSession(session.id)}
          onDelete={() => handleDeleteSession(session.id)}
          onRename={(name) => handleRenameSession(session.id, name)}
          onOpenInNewWindow={() => openSessionInWindow(session.id)}
          onTogglePin={() => togglePin(session.id)}
        />
      );
    },
    [activeId, expanded, handleSelectSession, handleDeleteSession, handleRenameSession, togglePin, toggleGroup],
  );

  // ── Unique projects for selector ──
  const uniqueProjects = useMemo(() => getUniqueProjects(sessions), [sessions]);

  return (
    <aside
      className={cn(
        'flex h-full flex-col overflow-hidden border-r border-[var(--pd-color-border)]',
        'bg-[var(--pd-color-bg-subtle)]',
        'transition-[width] duration-[var(--pd-duration-slow)] ease-[var(--pd-ease-emphasized)]',
      )}
      style={{
        width: expanded
          ? 'var(--pd-layout-sidebar-width)'
          : 'var(--pd-layout-sidebar-rail)',
        paddingTop: 44, // macOS traffic-light avoidance
      }}
    >
      {/* ── Toggle button ── */}
      <div className="flex shrink-0 items-center px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          title={expanded ? '折叠侧栏' : '展开侧栏'}
          className={cn(
            'flex items-center justify-center rounded-[var(--pd-radius-md)] p-1.5',
            'text-[var(--pd-color-fg-muted)] transition-colors',
            'hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]',
          )}
        >
          {expanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </div>

      {/* ── Project selector + New Chat + Search (expanded only) ── */}
      {expanded && (
        <div className="shrink-0 space-y-2">
          {/* Project selector */}
          {uniqueProjects.length > 1 && (
            <ProjectSelector
              projects={uniqueProjects}
              selected={projectFilter}
              onSelect={setProjectFilter}
            />
          )}

          <div className="px-3 pb-2">
            <button
              type="button"
              onClick={handleNewSession}
              className={cn(
                'flex w-full items-center gap-2 rounded-[var(--pd-radius-md)] px-3 py-2 mb-2',
                'bg-[var(--pd-color-accent)] text-[var(--pd-color-fg-on-accent)]',
                'text-sm font-medium transition-colors',
                'hover:opacity-90',
              )}
            >
              <Plus size={16} />
              <span>新建会话</span>
            </button>

            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--pd-color-fg-subtle)]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索会话..."
                className={cn(
                  'w-full rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)]',
                  'bg-[var(--pd-color-bg)] py-1.5 pl-8 pr-3 text-sm',
                  'text-[var(--pd-color-fg)] placeholder:text-[var(--pd-color-fg-subtle)]',
                  'outline-none focus:border-[var(--pd-color-accent)]',
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Session list (date-grouped) / Workspace panels + workspace nav ── */}
      <div
        ref={sidebarScrollRef}
        onScroll={handleSidebarScroll}
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2"
      >
        {/* ── Workspace panels (replace session list when active) ── */}
        {workspaceMode === 'search' && expanded && (
          <SearchPanel onNavigate={handleSearchNavigate} />
        )}
        {workspaceMode === 'files' && expanded && (
          <FilesPanel />
        )}
        {workspaceMode === 'memory' && expanded && (
          <MemoryPanel />
        )}
        {workspaceMode === 'workflow' && expanded && (
          <WorkflowPanel />
        )}

        {/* ── Session list (only when in 'sessions' mode) ── */}
        {workspaceMode === 'sessions' && expanded && filteredSessions.length === 0 && (
          <div className="px-3 py-4 text-center text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-subtle)]">
            {searchQuery ? '无匹配会话' : '暂无会话，点击上方创建'}
          </div>
        )}

        {/* Virtualized expanded session list */}
        {workspaceMode === 'sessions' && expanded && shouldVirtualizeSidebar && (
          <div style={{ height: sidebarTotalHeight, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
              <div style={{ height: sidebarPaddingTop }} />
              {sidebarVirtualItems.map((vi) => renderSidebarVItem(vi.item))}
              <div style={{ height: sidebarPaddingBottom }} />
            </div>
          </div>
        )}

        {/* Non-virtualized expanded session list (original) */}
        {workspaceMode === 'sessions' && expanded && !shouldVirtualizeSidebar && dateGroups.map((group) => (
          <div key={group.key}>
            <DateGroupHeader
              label={group.label}
              collapsed={!!collapsedGroups[group.key]}
              onToggle={() => toggleGroup(group.key)}
            />
            {!collapsedGroups[group.key] && group.sessions.map((session) => (
              <SessionItem
                key={session.id}
                id={session.id}
                name={session.name}
                active={session.id === activeId}
                expanded={expanded}
                messageCount={session.messageCount}
                isPinned={session.isPinned}
                onSelect={() => handleSelectSession(session.id)}
                onDelete={() => handleDeleteSession(session.id)}
                onRename={(name) => handleRenameSession(session.id, name)}
                onOpenInNewWindow={() => openSessionInWindow(session.id)}
                onTogglePin={() => togglePin(session.id)}
              />
            ))}
            <SidebarDivider />
          </div>
        ))}

        {/* Collapsed sidebar: flat icon-only list */}
        {workspaceMode === 'sessions' && !expanded && filteredSessions.map((session) => (
          <SessionItem
            key={session.id}
            id={session.id}
            name={session.name}
            active={session.id === activeId}
            expanded={expanded}
            messageCount={session.messageCount}
            isPinned={session.isPinned}
            onSelect={() => handleSelectSession(session.id)}
            onDelete={() => handleDeleteSession(session.id)}
            onRename={(name) => handleRenameSession(session.id, name)}
            onOpenInNewWindow={() => openSessionInWindow(session.id)}
            onTogglePin={() => togglePin(session.id)}
          />
        ))}

        {/* Collapsed: icon-only new-session button */}
        {workspaceMode === 'sessions' && !expanded && (
          <button
            type="button"
            onClick={handleNewSession}
            title="新建会话"
            className={cn(
              'flex items-center justify-center rounded-[var(--pd-radius-md)] p-2 mt-1',
              'text-[var(--pd-color-fg-muted)] transition-colors',
              'hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]',
            )}
          >
            <Plus size={20} />
          </button>
        )}

        <SidebarDivider />

        {workspaceNav.map((item, idx) => (
          <PdNavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            shortcut={item.shortcut}
            collapsed={!expanded}
            active={workspaceMode === WORKSPACE_NAV_MODES[idx]}
            onClick={() => toggleWorkspaceMode(WORKSPACE_NAV_MODES[idx])}
          />
        ))}
      </div>

      {/* ── Bottom (settings + account) ── */}
      <div className="shrink-0 border-t border-[var(--pd-color-border-subtle)] px-2 py-2">
        {bottomNav.map((item) => (
          <PdNavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            collapsed={!expanded}
          />
        ))}
      </div>

      {/* ── PetStrip — reserved for panda-on-desk integration ── */}
      <div
        className={cn(
          'flex shrink-0 items-center justify-center',
          'border-t border-[var(--pd-color-border-subtle)]',
          'text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-subtle)]',
        )}
        style={{ height: 'var(--pd-layout-pet-strip)' }}
        aria-hidden="true"
      />
    </aside>
  );
}
