// Input: sessionStore.availableProjects / selectedProjects / setSelectedProjects + i18n
// Output: 项目过滤下拉 — Portal mounted dropdown，跨视口翻转方向，全部/单选/多选
// Pos: Layout layer — PdSidebar 内嵌；对标 cc-haha desktop/src/components/layout/ProjectFilter.tsx
//
// Source: cc-haha desktop/src/components/layout/ProjectFilter.tsx L1-357（357 行）
//   panda 适配：
//     - cc-haha sessionsApi.getRecentProjects → panda 已弃用，从 sessionStore.availableProjects 推导 ProjectOption
//     - cc-haha RecentProject (repoName/projectName/realPath/isGit/branch/modifiedAt) → panda fallbackProjectTitle 单字段
//     - className 全部前缀替换：var(--color-*) → var(--pd-color-*)、var(--font-*) → var(--pd-font-*)
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSessionStore } from '../../stores/sessionStore';
import { t } from '../../i18n';

type DropdownPos = {
  top: number;
  left: number;
  direction: 'up' | 'down';
};

type ProjectOption = {
  projectPath: string;
  title: string;
  subtitle: string | null;
  isGit: boolean;
  branch: string | null;
  modifiedAt?: string;
};

// cc-haha 用 sessionsApi 缓存近期项目；panda 没有此接口，缓存层保留为骨架（始终空），
// 项目数据完全来自 sessionStore.availableProjects（同步可得）。
type CachedProject = {
  projectPath: string;
  repoName?: string;
  projectName?: string;
  realPath?: string;
  isGit?: boolean;
  branch?: string | null;
  modifiedAt?: string;
};
let cachedProjects: CachedProject[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000;

export function PdProjectFilter({ variant = 'default' }: { variant?: 'default' | 'embedded' }) {
  const tt = t;
  const availableProjects = useSessionStore((s) => s.availableProjects);
  const selectedProjects = useSessionStore((s) => s.selectedProjects);
  const setSelectedProjects = useSessionStore((s) => s.setSelectedProjects);
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<CachedProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateDropdownPos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 420;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const direction = spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove ? 'down' : 'up';

    setDropdownPos({
      top: direction === 'down' ? rect.bottom + 8 : rect.top - 8,
      left: rect.left,
      direction,
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    updateDropdownPos();
    window.addEventListener('scroll', updateDropdownPos, true);
    window.addEventListener('resize', updateDropdownPos);
    return () => {
      window.removeEventListener('scroll', updateDropdownPos, true);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, [open, updateDropdownPos]);

  useEffect(() => {
    if (!open) return;
    if (cachedProjects && Date.now() - cacheTimestamp < CACHE_TTL) {
      setProjects(cachedProjects);
      return;
    }

    // panda：无 sessionsApi.getRecentProjects；从 availableProjects 同步派生即可
    setLoading(true);
    const next: CachedProject[] = availableProjects.map((p) => ({
      projectPath: p,
      projectName: fallbackProjectTitle(p, tt('sidebar.other')),
      realPath: p,
      isGit: false,
      branch: null,
    }));
    cachedProjects = next;
    cacheTimestamp = Date.now();
    setProjects(next);
    setLoading(false);
  }, [open, availableProjects, tt]);

  const isAllSelected = selectedProjects.length === 0;

  const options = useMemo(() => {
    const availableSet = new Set(availableProjects);
    const optionsByPath = new Map<string, ProjectOption>();

    for (const project of projects) {
      if (!availableSet.has(project.projectPath)) continue;
      optionsByPath.set(project.projectPath, {
        projectPath: project.projectPath,
        title: project.repoName || project.projectName || fallbackProjectTitle(project.projectPath, tt('sidebar.other')),
        subtitle: project.realPath ?? null,
        isGit: project.isGit ?? false,
        branch: project.branch ?? null,
        modifiedAt: project.modifiedAt,
      });
    }

    for (const projectPath of availableProjects) {
      if (optionsByPath.has(projectPath)) continue;
      optionsByPath.set(projectPath, {
        projectPath,
        title: fallbackProjectTitle(projectPath, tt('sidebar.other')),
        subtitle: null,
        isGit: false,
        branch: null,
      });
    }

    return [...optionsByPath.values()].sort(compareProjectOptions);
  }, [availableProjects, projects, tt]);

  const optionByPath = useMemo(
    () => new Map(options.map((option) => [option.projectPath, option])),
    [options],
  );

  const label = isAllSelected
    ? tt('sidebar.allProjects')
    : selectedProjects.length === 1
      ? optionByPath.get(selectedProjects[0]!)?.title || fallbackProjectTitle(selectedProjects[0]!, tt('sidebar.other'))
      : `${selectedProjects.length} projects`;
  const triggerLabel = isAllSelected ? tt('sidebar.allProjects') : label;

  const toggleProject = (projectPath: string) => {
    if (isAllSelected) {
      setSelectedProjects([projectPath]);
      return;
    }

    if (selectedProjects.includes(projectPath)) {
      const next = selectedProjects.filter((path) => path !== projectPath);
      setSelectedProjects(next.length === 0 ? [] : next);
      return;
    }

    const next = [...selectedProjects, projectPath];
    setSelectedProjects(next.length >= availableProjects.length ? [] : next);
  };

  const selectAll = () => setSelectedProjects([]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={triggerLabel}
        title={triggerLabel}
        className={
          variant === 'embedded'
            ? `inline-flex h-7 w-7 items-center justify-center rounded-[8px] border transition-colors duration-200 ${
              isAllSelected
                ? 'border-transparent text-[var(--pd-color-text-tertiary)] hover:bg-[var(--pd-color-sidebar-item-hover)] hover:text-[var(--pd-color-text-secondary)]'
                : 'border-[var(--pd-color-sidebar-item-active-border)] bg-[var(--pd-color-sidebar-item-active)] text-[var(--pd-color-text-primary)] hover:bg-[var(--pd-color-sidebar-item-hover)]'
            }`
            : 'inline-flex h-8 max-w-full items-center gap-1.5 rounded-[10px] border border-[var(--pd-color-sidebar-filter-border)] bg-[var(--pd-color-sidebar-filter-bg)] px-2 text-left text-[14px] text-[var(--pd-color-text-primary)] transition-colors duration-200 hover:bg-[var(--pd-color-sidebar-item-hover)]'
        }
      >
        {variant === 'embedded' ? (
          <span className="relative flex items-center justify-center">
            <FolderIcon className="h-[14px] w-[14px]" />
            {!isAllSelected && (
              <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-[var(--pd-color-brand)]" />
            )}
          </span>
        ) : (
          <>
            <FolderIcon className="h-[14px] w-[14px] text-[var(--pd-color-text-secondary)]" />
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold tracking-tight">{label}</span>
            </span>
            <span className="flex h-[14px] w-[14px] flex-shrink-0 items-center justify-center text-[var(--pd-color-text-tertiary)] transition-colors">
              <ChevronIcon open={open} />
            </span>
          </>
        )}
      </button>

      {open && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          className="w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[18px] border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-lowest)]"
          style={{
            position: 'fixed',
            left: Math.min(dropdownPos.left, window.innerWidth - Math.min(360, window.innerWidth - 32) - 16),
            ...(dropdownPos.direction === 'down'
              ? { top: dropdownPos.top }
              : { bottom: window.innerHeight - dropdownPos.top }),
            boxShadow: 'var(--pd-shadow-dropdown)',
            zIndex: 9999,
          }}
        >
          <div className="max-h-[360px] overflow-y-auto p-2">
            <button
              type="button"
              onClick={selectAll}
              className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors ${
                isAllSelected
                  ? 'bg-[var(--pd-color-sidebar-item-active)]'
                  : 'hover:bg-[var(--pd-color-sidebar-item-hover)]'
              }`}
            >
              <FolderIcon className="text-[var(--pd-color-text-secondary)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[var(--pd-color-text-primary)]">{tt('sidebar.allProjects')}</div>
              </div>
              {isAllSelected && <CheckIcon />}
            </button>

            <div className="mx-3 my-2 border-t border-[var(--pd-color-border)]" />

            {loading ? (
              <div className="px-4 py-6 text-center text-xs text-[var(--pd-color-text-tertiary)]">{tt('common.loading')}</div>
            ) : options.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[var(--pd-color-text-tertiary)]">{tt('sidebar.noSessions')}</div>
            ) : (
              options.map((option) => {
                const checked = !isAllSelected && selectedProjects.includes(option.projectPath);
                return (
                  <button
                    key={option.projectPath}
                    type="button"
                    onClick={() => toggleProject(option.projectPath)}
                    className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors ${
                      checked
                        ? 'bg-[var(--pd-color-sidebar-item-active)]'
                        : 'hover:bg-[var(--pd-color-sidebar-item-hover)]'
                    }`}
                  >
                    {option.isGit ? <GitBranchIcon className="text-[var(--pd-color-text-secondary)]" /> : <FolderIcon />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-[var(--pd-color-text-primary)]">{option.title}</div>
                      {option.subtitle && (
                        <div className="truncate pt-0.5 text-[11px] text-[var(--pd-color-text-tertiary)] font-[var(--pd-font-mono)]">
                          {option.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      {option.branch && (
                        <span className="max-w-[88px] truncate text-[10px] text-[var(--pd-color-text-tertiary)]">
                          {option.branch}
                        </span>
                      )}
                      {checked && <CheckIcon />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function compareProjectOptions(a: ProjectOption, b: ProjectOption) {
  if (a.modifiedAt && b.modifiedAt && a.modifiedAt !== b.modifiedAt) {
    return b.modifiedAt.localeCompare(a.modifiedAt);
  }
  if (a.modifiedAt && !b.modifiedAt) return -1;
  if (!a.modifiedAt && b.modifiedAt) return 1;
  return a.title.localeCompare(b.title);
}

function fallbackProjectTitle(projectPath: string, fallback: string) {
  if (!projectPath || projectPath === '_unknown') return fallback;
  if (projectPath.includes('/')) {
    return projectPath.split('/').filter(Boolean).pop() || fallback;
  }

  const segments = projectPath.split('-').filter(Boolean);
  return segments[segments.length - 1] || projectPath || fallback;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function FolderIcon({ className = 'text-[var(--pd-color-text-secondary)]' }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-shrink-0 ${className}`}
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function GitBranchIcon({ className = 'text-[var(--pd-color-text-secondary)]' }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-shrink-0 ${className}`}
    >
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <line x1="6" y1="9" x2="6" y2="21" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--pd-color-brand)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// cc-haha L1-357 — 357 行；panda 复刻 + sessionsApi 降级（availableProjects 同步派生）。
