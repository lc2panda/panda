// Input: expanded state + toggle callback; reads sessionStore for session list
// Output: Collapsible sidebar with date-grouped session list, project selector, pin, search, CRUD, workspace panels, navigation
// Pos: Layout layer — left panel navigation, wired to sessionStore + chatStore + tabStore + windowManager bridge

import { type ComponentType, type ReactNode, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/cn';
import { useSessionStore, type SessionMeta } from '@/stores/sessionStore';
import { useChatStore } from '@/stores/chatStore';
import { useTabStore } from '@/stores/tabStore';
import { useUIStore } from '@/stores/uiStore';
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
  // @ts-ignore lucide-react bundled .d.ts misses Clock at top-level
  Clock as _Clock,
  // @ts-ignore lucide-react bundled .d.ts omissions
  Folder as _Folder,
  // @ts-ignore
  Sparkles as _Sparkles,
  // @ts-ignore
  Wand2 as _Wand2,
  // @ts-ignore
  Download as _Download,
  // @ts-ignore lucide-react 0.511 ships Pin & FolderKanban at runtime but bundled .d.ts misses top-level named exports
  Pin as _Pin,
  // @ts-ignore same as above
  FolderKanban as _FolderKanban,
  // @ts-ignore same as above
  Copy as _Copy,
  // @ts-ignore same as above
  Archive as _Archive,
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
const Clock = _Clock as IconFC;
const Folder = _Folder as IconFC;
const Sparkles = _Sparkles as IconFC;
const Wand2 = _Wand2 as IconFC;
const Download = _Download as IconFC;
const FolderKanban = _FolderKanban as IconFC;
const CopyIcon = _Copy as IconFC;
const ArchiveIcon = _Archive as IconFC;

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

// cc-haha 风格：去掉工作区侧栏导航（搜索/文件/记忆/工作流）— 全部依赖 CommandPalette
// 和 Inspector tab，不占 sidebar 空间。底部只保留单一 Settings。
const bottomNav: NavEntry[] = [
  { icon: <Settings size={20} />, label: '设置' },
];

// Workspace panel mode type (matches workspaceNav order)
type WorkspaceMode = 'sessions' | 'search' | 'files' | 'memory' | 'workflow';

const WORKSPACE_NAV_MODES: WorkspaceMode[] = ['search', 'files', 'memory', 'workflow'];

// ---------------------------------------------------------------------------
// cc-haha 风格分组：today / yesterday / last7days / last30days / older
// Panda 保留 pinned/archived 作为特殊优先级前置/后置
// ---------------------------------------------------------------------------
type DateGroupKey = 'pinned' | 'today' | 'yesterday' | 'last7days' | 'last30days' | 'older' | 'archived';

interface DateGroup {
  key: DateGroupKey;
  label: string;
  sessions: SessionMeta[];
}

const GROUP_LABELS: Record<DateGroupKey, string> = {
  pinned: '已固定',
  today: '今天',
  yesterday: '昨天',
  last7days: '近 7 天',
  last30days: '近 30 天',
  older: '更早',
  archived: '已归档',
};

const GROUP_ORDER: DateGroupKey[] = ['pinned', 'today', 'yesterday', 'last7days', 'last30days', 'older', 'archived'];

function groupSessionsByDate(sessions: SessionMeta[]): DateGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86_400_000;
  const last7daysStart = todayStart - 6 * 86_400_000;
  const last30daysStart = todayStart - 29 * 86_400_000;

  const buckets: Record<DateGroupKey, SessionMeta[]> = {
    pinned: [], today: [], yesterday: [], last7days: [], last30days: [], older: [], archived: [],
  };
  for (const s of sessions) {
    if (s.archived) { buckets.archived.push(s); continue; }
    if (s.isPinned) { buckets.pinned.push(s); continue; }
    const ts = new Date(s.lastActive || s.createdAt).getTime();
    if (ts >= todayStart) buckets.today.push(s);
    else if (ts >= yesterdayStart) buckets.yesterday.push(s);
    else if (ts >= last7daysStart) buckets.last7days.push(s);
    else if (ts >= last30daysStart) buckets.last30days.push(s);
    else buckets.older.push(s);
  }
  return GROUP_ORDER
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({ key, label: GROUP_LABELS[key], sessions: buckets[key] }));
}

// cc-haha formatRelativeTime 等效：Xs ago / Xm ago / Xh ago / Xd ago
function formatRelativeTime(iso: string | undefined): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `${mon}mo`;
  return `${Math.floor(mon / 12)}y`;
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

function DateGroupHeader({ label, onToggle }: DateGroupHeaderProps) {
  // Claude Desktop 风格：仅灰色小字分组头，无箭头，无 hover 态
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === 'Enter') onToggle(); }}
      className={cn(
        'px-3 pt-5 pb-2',
        'text-[12px] font-medium text-[var(--pd-color-fg-subtle)]',
        'select-none',
      )}
    >
      {label}
    </div>
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
    <div ref={ref} className="relative shrink-0 px-4 pb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-[6px] px-2',
          'bg-transparent text-[14px] text-[var(--pd-color-fg)]',
          'transition-colors cursor-pointer',
          'hover:bg-[var(--pd-color-bg-hover)]',
        )}
        style={{ height: 32 }}
      >
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
  archived?: boolean;
  relativeTime?: string;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onOpenInNewWindow: () => void;
  onTogglePin: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
}

function SessionItem({
  name,
  active,
  expanded,
  messageCount: _messageCount,
  isPinned,
  archived,
  relativeTime,
  onSelect,
  onDelete,
  onRename,
  onOpenInNewWindow,
  onTogglePin,
  onDuplicate,
  onArchive,
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
        'group flex w-full items-center gap-2 rounded-[6px]',
        'h-8 py-1.5 pl-3 pr-2 text-left transition-colors duration-[35ms] ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer',
        'text-[12px] leading-[16px]',
        active
          ? 'bg-[var(--pd-color-bg-selected)] text-[var(--pd-color-fg)]'
          : 'text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]',
        archived && 'opacity-50',
      )}
    >
      {/* cc-haha 风格 1×1px 小圆点 marker */}
      {expanded && (
        <span
          className="h-1 w-1 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: active ? 'var(--pd-color-accent)' : 'var(--pd-color-fg-tertiary)',
            opacity: active ? 1 : 0.5,
          }}
          aria-hidden="true"
        />
      )}

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
              <div className="flex-1 min-w-0">
                <span className="block truncate text-sm leading-[1.45]">{name}</span>
              </div>
              {/* cc-haha 风格：hover 时显示相对时间 */}
              {relativeTime && (
                <span className="flex-shrink-0 text-[10px] text-[var(--pd-color-fg-tertiary)] opacity-0 transition-opacity group-hover:opacity-100">
                  {relativeTime}
                </span>
              )}
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
              {/* Duplicate — visible on hover */}
              {onDuplicate && (
                <span
                  role="button"
                  tabIndex={-1}
                  title="复制会话"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onDuplicate();
                    }
                  }}
                  className={cn(
                    'shrink-0 rounded-[var(--pd-radius-xs)] p-0.5',
                    'opacity-0 transition-opacity group-hover:opacity-100',
                    'text-[var(--pd-color-fg-subtle)] hover:text-[var(--pd-color-accent)]',
                  )}
                >
                  <CopyIcon size={14} />
                </span>
              )}
              {/* Archive — visible on hover */}
              {onArchive && (
                <span
                  role="button"
                  tabIndex={-1}
                  title={archived ? '取消归档' : '归档'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onArchive();
                    }
                  }}
                  className={cn(
                    'shrink-0 rounded-[var(--pd-radius-xs)] p-0.5',
                    'opacity-0 transition-opacity group-hover:opacity-100',
                    archived
                      ? 'text-[var(--pd-color-accent)]'
                      : 'text-[var(--pd-color-fg-subtle)] hover:text-[var(--pd-color-accent)]',
                  )}
                >
                  <ArchiveIcon size={14} />
                </span>
              )}
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
  const duplicateSession = useSessionStore((s) => s.duplicateSession);
  const archiveSession = useSessionStore((s) => s.archiveSession);
  const projectFilter = useSessionStore((s) => s.projectFilter);
  const setProjectFilter = useSessionStore((s) => s.setProjectFilter);
  const loadSessionsFromDisk = useSessionStore((s) => s.loadSessionsFromDisk);

  // Chat + Tab stores
  const setChatActiveSession = useChatStore((s) => s.setActiveSession);
  const loadSessionHistory = useChatStore((s) => s.loadSessionHistory);
  const addTab = useTabStore((s) => s.addTab);

  // Collapsed date-group state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Load disk sessions on mount
  useEffect(() => {
    loadSessionsFromDisk();
  }, [loadSessionsFromDisk]);

  // ── Handlers ──
  const handleSelectSession = useCallback(
    (sessionId: string) => {
      useUIStore.getState().setActiveView('chat');
      setActive(sessionId);
      setChatActiveSession(sessionId);
      // Lazy-load history from disk — does NOT spawn CLI (lazy start on first message)
      loadSessionHistory(sessionId);
    },
    [setActive, setChatActiveSession, loadSessionHistory],
  );

  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);

  const handleNewSession = useCallback(async () => {
    setActiveView('chat');
    const session = await createSession();
    addTab(session.id, session.name);
    setChatActiveSession(session.id);
  }, [createSession, addTab, setChatActiveSession, setActiveView]);

  const handleOpenScheduled = useCallback(() => {
    setActiveView('scheduled');
  }, [setActiveView]);

  const handleOpenSettings = useCallback(() => {
    setActiveView('settings');
  }, [setActiveView]);

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

  const handleDuplicateSession = useCallback(
    async (sessionId: string) => {
      const dup = await duplicateSession(sessionId);
      if (dup) {
        setActive(dup.id);
        setChatActiveSession(dup.id);
        addTab(dup.id, dup.name);
      }
    },
    [duplicateSession, setActive, setChatActiveSession, addTab],
  );

  const handleArchiveSession = useCallback(
    (sessionId: string) => {
      archiveSession(sessionId);
    },
    [archiveSession],
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
          relativeTime={formatRelativeTime(session.lastActive || session.createdAt)}
          onSelect={() => handleSelectSession(session.id)}
          onDelete={() => handleDeleteSession(session.id)}
          onRename={(name) => handleRenameSession(session.id, name)}
          onOpenInNewWindow={() => openSessionInWindow(session.id)}
          onTogglePin={() => togglePin(session.id)}
          onDuplicate={() => handleDuplicateSession(session.id)}
          onArchive={() => handleArchiveSession(session.id)}
          archived={session.archived}
        />
      );
    },
    [activeId, expanded, handleSelectSession, handleDeleteSession, handleRenameSession, togglePin, handleDuplicateSession, handleArchiveSession, toggleGroup],
  );

  // ── Unique projects for selector ──
  const uniqueProjects = useMemo(() => getUniqueProjects(sessions), [sessions]);

  return (
    <aside
      className={cn(
        'flex h-full flex-col overflow-hidden shrink-0',
        'bg-[var(--pd-color-bg-subtle)]',
        'border-r border-[var(--pd-color-border)]',
      )}
      style={{
        width: expanded
          ? 'var(--pd-layout-sidebar-width)'
          : 'var(--pd-layout-sidebar-rail)',
        minWidth: expanded
          ? 'var(--pd-layout-sidebar-width)'
          : 'var(--pd-layout-sidebar-rail)',
        maxWidth: expanded
          ? 'var(--pd-layout-sidebar-width)'
          : 'var(--pd-layout-sidebar-rail)',
        paddingTop: 44, // macOS traffic-light avoidance
        transition: `width var(--pd-motion-sidebar-duration) var(--pd-motion-sidebar-easing), min-width var(--pd-motion-sidebar-duration) var(--pd-motion-sidebar-easing), max-width var(--pd-motion-sidebar-duration) var(--pd-motion-sidebar-easing)`,
      }}
    >
      {/* Brand row — app-icon 32×32 rounded-lg + Manrope brand text + GitHub + toggle */}
      <div className={cn(
        'flex shrink-0 px-3 pb-2',
        expanded ? 'items-center justify-between gap-3' : 'flex-col items-center gap-2',
      )}>
        <div className={cn('flex min-w-0 items-center', expanded ? 'gap-2.5' : 'justify-center')}>
          {/* Panda logomark — pure SVG, white base + brand P + decorative dot */}
          <div
            className="h-8 w-8 rounded-lg flex-shrink-0"
            style={{
              filter:
                'drop-shadow(0 2px 6px rgba(27,28,26,0.04)) drop-shadow(0 1px 2px rgba(27,28,26,0.04))',
            }}
            aria-hidden="true"
          >
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="32" height="32" rx="7" fill="var(--pd-color-bg-elevated, #FFFFFF)" stroke="rgba(218,193,186,0.5)" strokeWidth="0.5" />
              <path d="M9 7 H18 Q23.5 7 23.5 13 Q23.5 19 18 19 H13 V25 H9 Z M13 11 V15 H18 Q19.5 15 19.5 13 Q19.5 11 18 11 Z" fill="var(--pd-color-accent, #D97757)" />
              <circle cx="23" cy="24" r="1.9" fill="var(--pd-color-accent, #D97757)" />
            </svg>
          </div>
          {expanded && (
            <span
              className="text-[13px] font-semibold tracking-tight text-[var(--pd-color-fg)]"
              style={{ fontFamily: 'var(--pd-font-headline)' }}
            >
              Panda
            </span>
          )}
        </div>
        <div className={cn('flex items-center', expanded ? 'gap-1.5' : 'flex-col gap-2')}>
          {expanded && (
            <a
              href="https://github.com/lc2panda/panda"
              target="_blank"
              rel="noreferrer"
              title="GitHub"
              className={cn(
                'inline-flex items-center justify-center rounded-md p-1',
                'text-[var(--pd-color-fg-tertiary)] transition-colors',
                'hover:text-[var(--pd-color-fg)] hover:bg-[var(--pd-color-bg-hover)]',
                'no-underline',
              )}
              style={{ textDecoration: 'none' }}
            >
              <svg width={16} height={16} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.22.48-2.69-1.07-2.69-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.88 2.34.67.07-.52.28-.88.51-1.08-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.21 2.2.82A7.64 7.64 0 0 1 8 3.9c.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
            </a>
          )}
          <button
            type="button"
            onClick={onToggle}
            title={expanded ? '折叠侧栏' : '展开侧栏'}
            className={cn(
              'flex items-center justify-center rounded-full h-8 w-8',
              'text-[var(--pd-color-fg-tertiary)] transition-colors',
              'hover:text-[var(--pd-color-fg)] hover:bg-[var(--pd-color-bg-hover)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pd-color-border-focus)]',
            )}
            aria-label={expanded ? '折叠侧栏' : '展开侧栏'}
          >
            {expanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        </div>
      </div>

      {/* 2 项一级入口：New session + Scheduled（nav-item spec: px-3 py-2 gap-2.5 icon 20 text-sm） */}
      <div className={cn('shrink-0 px-3 pb-3 flex flex-col', expanded ? 'gap-0.5' : 'items-center gap-2')}>
        <button
          type="button"
          onClick={handleNewSession}
          title="新建对话"
          className={cn(
            'flex items-center rounded-[8px] transition-all duration-200',
            expanded ? 'w-full gap-2.5 px-3 py-2' : 'h-10 w-10 justify-center',
            'text-[14px] text-[var(--pd-color-fg)]',
            'hover:bg-[var(--pd-color-bg-hover)]',
          )}
        >
          <Plus size={20} className="shrink-0" />
          {expanded && <span>新建对话</span>}
        </button>
        <button
          type="button"
          onClick={handleOpenScheduled}
          title="定时任务"
          aria-current={activeView === 'scheduled' ? 'page' : undefined}
          className={cn(
            'flex items-center rounded-[8px] transition-all duration-200',
            expanded ? 'w-full gap-2.5 px-3 py-2' : 'h-10 w-10 justify-center',
            'text-[14px]',
            activeView === 'scheduled'
              ? 'bg-[var(--pd-color-bg-selected)] text-[var(--pd-color-fg)] font-medium shadow-[0_8px_24px_rgba(15,23,42,0.08)]'
              : 'text-[var(--pd-color-fg)] hover:bg-[var(--pd-color-bg-hover)]',
          )}
        >
          <Clock size={20} className="shrink-0" />
          {expanded && <span>定时任务</span>}
        </button>
      </div>

      {/* 项目筛选 + 搜索（仅展开时）— 对标 cc-haha */}
      {expanded && (
        <>
          <div className="shrink-0 px-3 pb-1 flex items-center justify-between">
            <ProjectSelector
              projects={uniqueProjects}
              selected={projectFilter}
              onSelect={setProjectFilter}
            />
          </div>
          <div className="shrink-0 px-3 pb-2">
            <input
              id="sidebar-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索会话..."
              className={cn(
                'w-full h-8 px-2.5 text-xs rounded-[var(--pd-radius-md)]',
                'border border-[var(--pd-color-border)] bg-[var(--pd-color-bg)]',
                'text-[var(--pd-color-fg)] placeholder:text-[var(--pd-color-fg-subtle)]',
                'outline-none transition-colors',
                'focus:border-[var(--pd-color-border-focus)]',
              )}
            />
          </div>
        </>
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
                onDuplicate={() => handleDuplicateSession(session.id)}
                onArchive={() => handleArchiveSession(session.id)}
                archived={session.archived}
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
            onDuplicate={() => handleDuplicateSession(session.id)}
            onArchive={() => handleArchiveSession(session.id)}
            archived={session.archived}
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

      </div>

      {/* cc-haha 风格底部：仅一个 Settings，border-top */}
      <div className={cn(
        'shrink-0 border-t border-[var(--pd-color-border)] p-3',
        expanded ? '' : 'flex justify-center',
      )}>
        <button
          type="button"
          onClick={handleOpenSettings}
          title="设置"
          aria-current={activeView === 'settings' ? 'page' : undefined}
          className={cn(
            'flex items-center rounded-[var(--pd-radius-md)] transition-colors cursor-pointer',
            expanded ? 'w-full gap-3 px-3 py-2' : 'h-9 w-9 justify-center',
            'text-[14px]',
            activeView === 'settings'
              ? 'bg-[var(--pd-color-bg-selected)] text-[var(--pd-color-fg)] font-medium'
              : 'text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]',
          )}
        >
          <Settings size={18} className="shrink-0" />
          {expanded && <span>设置</span>}
        </button>
      </div>

      {/* ── PetStrip — Panda 特色：点击打开 Inspector petState 面板 ── */}
      <button
        type="button"
        onClick={() => {
          useUIStore.getState().setInspectorTab(8);
          useUIStore.getState().setInspectorVisible(true);
        }}
        title="打开宠物面板"
        className={cn(
          'flex shrink-0 items-center justify-center gap-2 cursor-pointer',
          'border-t border-[var(--pd-color-border-subtle)]',
          'text-[11px] text-[var(--pd-color-fg-subtle)]',
          'hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg-muted)]',
          'transition-colors duration-150',
        )}
        style={{ height: 'var(--pd-layout-pet-strip)' }}
      >
        {expanded ? (
          <>
            <span aria-hidden="true">🐼</span>
            <span>Panda · LV1</span>
          </>
        ) : (
          <span aria-hidden="true" className="text-[16px]">🐼</span>
        )}
      </button>
    </aside>
  );
}
