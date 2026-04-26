// Input:  cwd（projectFilter / activeSession.cwd）+ filter（@xxx 之后的子串）+ onSelect
// Output: 浮在 composer 上方的目录浏览/搜索菜单（dir/file 双区段 + 键盘导航）
// Pos:    Chat layer — composer @ 触发文件菜单（forwardRef 暴露 keyDown 给 composer）
//
// Source 1:1: cc-haha desktop/src/components/chat/FileSearchMenu.tsx (L1-L236)
//   - className 转换：var(--color-*) → var(--pd-color-*)
//   - cc-haha filesystemApi.search(query, cwd) / browse(cwd) → panda bridge.searchFiles(sessionId, query) / listDirectory(sessionId, dir)
//     panda IPC 签名以 sessionId 为参数；本组件 props 仍接 cwd 但内部用 chatStore.activeSessionId 派发 IPC。
//   - cc-haha ApiError → panda 暂无（用 generic Error 信息字段）。
//   - cc-haha useTranslation hook → panda t() 函数（同义）。
import { forwardRef, useState, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import { searchFiles, listDirectory } from '../../ipc/bridge';
import { useChatStore } from '../../stores/chatStore';
import { t } from '../../i18n';
import type { TranslationKey } from '../../i18n';

type DirEntry = {
  name: string;
  path: string;
  isDirectory: boolean;
};

export type PdFileSearchMenuHandle = {
  handleKeyDown: (e: KeyboardEvent) => void;
};

type Props = {
  cwd: string;
  filter?: string;
  onSelect: (path: string, relativePath: string) => void;
};

export const PdFileSearchMenu = forwardRef<PdFileSearchMenuHandle, Props>(({ cwd, filter = '', onSelect }, ref) => {
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [currentPath, setCurrentPath] = useState(cwd);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const currentPathRef = useRef(cwd);

  const getErrorState = (error: unknown): { errorKey: TranslationKey | null; errorMessage: string | null } => {
    if (error instanceof Error) {
      const msg = error.message || '';
      if (/permission|denied|EACCES/i.test(msg)) {
        return { errorKey: 'fileSearch.accessDenied', errorMessage: null };
      }
      if (msg) {
        return { errorKey: null, errorMessage: msg };
      }
    }
    return { errorKey: 'fileSearch.loadFailed', errorMessage: null };
  };

  // Parse filter: if it contains '/', navigate to that subdir and search the rest
  // Uses currentPathRef as base so nested paths navigate from current depth
  const parseFilter = (rawFilter: string): { navigateTo: string; searchQuery: string } => {
    const base = currentPathRef.current;
    if (!rawFilter || !rawFilter.includes('/')) {
      return { navigateTo: base, searchQuery: rawFilter };
    }
    const lastSlash = rawFilter.lastIndexOf('/');
    const dirPart = rawFilter.slice(0, lastSlash + 1);
    const searchPart = rawFilter.slice(lastSlash + 1);
    const navigateTo = dirPart === '' ? base : `${base}/${dirPart}`;
    return { navigateTo, searchQuery: searchPart };
  };

  // Load directory entries
  const loadDir = useCallback(async (dirPath: string, searchQuery: string) => {
    setLoading(true);
    setErrorMessage(null);
    setErrorKey(null);
    // Only update currentPath if actually navigating to a different directory
    if (dirPath !== currentPathRef.current) {
      setCurrentPath(dirPath);
      currentPathRef.current = dirPath;
    }
    try {
      // panda IPC 以 sessionId 派发文件请求（cc-haha 用 cwd）；
      // 这里取活跃会话作为派发凭证；若无活跃会话，传空字符串由后端拒绝。
      const sessionId = useChatStore.getState().activeSessionId ?? '';
      // panda FsSearchResponse: {path,name,isDir}[]，FsListResponse: {name,isDir,size}[]（无 path）
      // → 内部 DirEntry 用 {name,path,isDirectory} 形态；list 时 path 由 dirPath/name 拼接补齐。
      if (searchQuery) {
        const arr = await searchFiles(sessionId, searchQuery);
        const list = Array.isArray(arr) ? arr : [];
        setEntries(list.map((e) => ({ name: e.name, path: e.path, isDirectory: e.isDir })));
      } else {
        const arr = await listDirectory(sessionId, dirPath);
        const list = Array.isArray(arr) ? arr : [];
        setEntries(list.map((e) => ({
          name: e.name,
          path: dirPath.endsWith('/') ? `${dirPath}${e.name}` : `${dirPath}/${e.name}`,
          isDirectory: e.isDir,
        })));
      }
      setSelectedIndex(0);
    } catch (error) {
      setEntries([]);
      const nextError = getErrorState(error);
      setErrorKey(nextError.errorKey);
      setErrorMessage(nextError.errorMessage);
    }
    setLoading(false);
  }, []);

  // Initial load: parse filter path and navigate accordingly
  useEffect(() => {
    currentPathRef.current = cwd;
    const { navigateTo, searchQuery } = parseFilter(filter);
    void loadDir(navigateTo, searchQuery);
  }, [cwd, filter, loadDir]);

  // Keyboard navigation handler exposed via ref
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, entries.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (entries[selectedIndex]) {
        onSelect(entries[selectedIndex]!.path, entries[selectedIndex]!.name);
      }
      return;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, selectedIndex]);

  useImperativeHandle(ref, () => ({ handleKeyDown }), [handleKeyDown]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`) as HTMLButtonElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Build breadcrumb segments from current path relative to cwd
  const breadcrumbs: string[] = [];
  if (currentPath !== cwd && currentPath.startsWith(cwd)) {
    const rel = currentPath.slice(cwd.length).replace(/^\//, '');
    if (rel) breadcrumbs.push(...rel.split('/'));
  }

  const dirs = entries.filter((e) => e.isDirectory);
  const files = entries.filter((e) => !e.isDirectory);

  return (
    <div
      id="file-search-menu"
      className="absolute left-0 bottom-full mb-2 z-50 w-full min-w-[480px] overflow-hidden rounded-xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-lowest)] shadow-[var(--pd-shadow-dropdown)]"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header with path */}
      <div className="flex items-center gap-1.5 border-b border-[var(--pd-color-border)] px-3 py-2 text-[11px]">
        <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-text-tertiary)]">folder_open</span>
        <span className="text-[var(--pd-color-text-tertiary)] font-mono">{cwd.split('/').pop() || cwd}</span>
        {breadcrumbs.map((seg, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-[var(--pd-color-text-tertiary)]">/</span>
            <span className="text-[var(--pd-color-text-primary)] font-mono">{seg}</span>
          </span>
        ))}
        {loading && (
          <span className="material-symbols-outlined text-[12px] text-[var(--pd-color-text-tertiary)] animate-spin ml-1">progress_activity</span>
        )}
      </div>

      {/* File list */}
      <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1">
        {loading && entries.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-[var(--pd-color-text-tertiary)]">{t('fileSearch.searching')}</div>
        ) : (errorKey || errorMessage) ? (
          <div className="px-4 py-6 text-center text-xs text-[var(--pd-color-error)]">
            {errorKey ? t(errorKey) : errorMessage}
          </div>
        ) : entries.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-[var(--pd-color-text-tertiary)]">
            {filter ? t('fileSearch.noMatch') : t('fileSearch.noFiles')}
          </div>
        ) : (
          <>
            {/* Directories */}
            {dirs.map((entry, i) => (
              <button
                key={entry.path}
                data-index={i}
                onClick={() => {
                  void loadDir(entry.path, filter);
                }}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  selectedIndex === i ? 'bg-[var(--pd-color-surface-hover)]' : 'hover:bg-[var(--pd-color-surface-hover)]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-[var(--pd-color-brand)]">folder</span>
                <span className="text-sm text-[var(--pd-color-text-primary)] truncate">{entry.name}</span>
              </button>
            ))}

            {/* Files */}
            {files.map((entry, i) => {
              const idx = dirs.length + i;
              return (
                <button
                  key={entry.path}
                  data-index={idx}
                  onClick={() => onSelect(entry.path, entry.name)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    selectedIndex === idx ? 'bg-[var(--pd-color-surface-hover)]' : 'hover:bg-[var(--pd-color-surface-hover)]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-[var(--pd-color-text-secondary)]">description</span>
                  <span className="text-sm text-[var(--pd-color-text-primary)] truncate">{entry.name}</span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Footer hint */}
      <div className="flex items-center gap-1.5 border-t border-[var(--pd-color-border)] px-3 py-1.5 text-[10px] text-[var(--pd-color-text-tertiary)]">
        <kbd className="rounded border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-1 py-0.5 font-mono">↑↓</kbd>
        <span>{t('fileSearch.navigate')}</span>
        <kbd className="ml-2 rounded border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-1 py-0.5 font-mono">Enter</kbd>
        <span>{t('fileSearch.attach')}</span>
        <kbd className="ml-2 rounded border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-1 py-0.5 font-mono">Esc</kbd>
        <span>{t('fileSearch.close')}</span>
      </div>
    </div>
  );
});

PdFileSearchMenu.displayName = 'PdFileSearchMenu';
