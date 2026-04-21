// Input: expanded state + toggle callback
// Output: Collapsible sidebar with 3-section navigation (main, workspace, bottom)
// Pos: Layout layer — left panel navigation, reads settingsStore

import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import {
  MessageSquare,
  History,
  Bot,
  Wand2,
  Wrench,
  ListTodo,
  Heart,
  Search,
  FolderOpen,
  Brain,
  GitBranch,
  Settings,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PdSidebarProps {
  expanded: boolean;
  onToggle: () => void;
}

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

const mainNav: NavEntry[] = [
  { icon: <MessageSquare size={20} />, label: '对话',       shortcut: '⌘1' },
  { icon: <History size={20} />,       label: '会话历史',   shortcut: '⌘2' },
  { icon: <Bot size={20} />,           label: 'Agents',     shortcut: '⌘3' },
  { icon: <Wand2 size={20} />,         label: 'Skills',     shortcut: '⌘4' },
  { icon: <Wrench size={20} />,        label: 'Tools & MCP',shortcut: '⌘5' },
  { icon: <ListTodo size={20} />,      label: '任务计划',   shortcut: '⌘6' },
  { icon: <Heart size={20} />,         label: 'Buddy 养成', shortcut: '⌘7' },
];

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

// ---------------------------------------------------------------------------
// Sidebar Item
// ---------------------------------------------------------------------------
function SidebarItem({
  icon,
  label,
  active = false,
  badge,
  onClick,
  expanded,
}: PdSidebarItemProps & { expanded: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={expanded ? undefined : label}
      className={cn(
        'group flex w-full items-center gap-3 rounded-[var(--pd-radius-md)] px-3 py-2',
        'text-[var(--pd-color-fg-muted)] transition-colors',
        'duration-[var(--pd-duration-quick)] ease-[var(--pd-ease-standard)]',
        'hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]',
        active && 'bg-[var(--pd-color-bg-selected)] text-[var(--pd-color-fg)]',
      )}
    >
      <span className="shrink-0">{icon}</span>
      {expanded && (
        <>
          <span className="truncate text-sm">{label}</span>
          {badge != null && badge > 0 && (
            <span
              className={cn(
                'ml-auto inline-flex h-5 min-w-5 items-center justify-center',
                'rounded-[var(--pd-radius-full)] bg-[var(--pd-color-accent)] px-1.5',
                'text-[length:var(--pd-text-xs)] font-medium text-[var(--pd-color-fg-on-accent)]',
              )}
            >
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </button>
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
// Component
// ---------------------------------------------------------------------------
export function PdSidebar({ expanded, onToggle }: PdSidebarProps) {
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
        // macOS traffic-light avoidance
        paddingTop: 44,
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

      {/* ── Main navigation ── */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2">
        {mainNav.map((item, idx) => (
          <SidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            shortcut={item.shortcut}
            active={idx === 0}
            expanded={expanded}
          />
        ))}

        <SidebarDivider />

        {/* ── Workspace section ── */}
        {workspaceNav.map((item) => (
          <SidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            shortcut={item.shortcut}
            expanded={expanded}
          />
        ))}
      </nav>

      {/* ── Bottom section (settings + account) ── */}
      <div className="shrink-0 border-t border-[var(--pd-color-border-subtle)] px-2 py-2">
        {bottomNav.map((item) => (
          <SidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            expanded={expanded}
          />
        ))}
      </div>

      {/* ── PetStrip placeholder ── */}
      <div
        className={cn(
          'flex shrink-0 items-center justify-center',
          'border-t border-[var(--pd-color-border-subtle)]',
          'text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-subtle)]',
        )}
        style={{ height: 'var(--pd-layout-pet-strip)' }}
      >
        {expanded ? '🐼 PetStrip' : '🐼'}
      </div>
    </aside>
  );
}
