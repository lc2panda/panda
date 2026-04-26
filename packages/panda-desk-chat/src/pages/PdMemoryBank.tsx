// Input: 路由 — useTabStore.activeTabId === MEMORY_BANK_TAB_ID 时挂载
// Output: 5 层记忆浏览器 — working / episodic / semantic / procedural / prospective
//          按 panda CLI 项目维度切换；可点开单文件查看全文
// Pos: Page layer — PdContentRouter 'memory-bank' 分支唯一目标
//
// Comdr 指令 cc-haha 路线 A — PdMemoryBank 真实数据接入：
//   bridge.listMemdirProjects()         → 列所有 panda CLI 项目（含 memory/ 目录）
//   bridge.listMemdirLayer(slug, layer) → 拉某项目某 layer 的文件列表（含预览）
//   bridge.readMemdirFile(path)         → 单文件全文 modal
//
// 数据形态来源 panda CLI src/memdir/paths.ts getAutoMemPath()：
//   ~/.pandacc/projects/<sanitize-cwd>/memory/{working,episodes,semantic,
//     procedural,dreams}/
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useCallback, useEffect, useMemo, useState } from 'react';
import { t } from '../i18n';
import {
  listMemdirProjects,
  listMemdirLayer,
  readMemdirFile,
} from '../ipc/bridge';
import type {
  MemdirEntry,
  MemdirLayer,
  MemdirProjectMeta,
  MemdirReadResult,
} from '../ipc/types';

type UiLayer = Exclude<MemdirLayer, 'patterns' | 'scars'>;

interface LayerMeta {
  key: UiLayer;
  icon: string;
  titleKey: string;
  descKey: string;
  pathHintKey: string;
}

const LAYERS: LayerMeta[] = [
  { key: 'working', icon: 'flash_on', titleKey: 'memoryBank.layer.working.title', descKey: 'memoryBank.layer.working.desc', pathHintKey: 'memoryBank.layer.working.pathHint' },
  { key: 'episodic', icon: 'history', titleKey: 'memoryBank.layer.episodic.title', descKey: 'memoryBank.layer.episodic.desc', pathHintKey: 'memoryBank.layer.episodic.pathHint' },
  { key: 'semantic', icon: 'school', titleKey: 'memoryBank.layer.semantic.title', descKey: 'memoryBank.layer.semantic.desc', pathHintKey: 'memoryBank.layer.semantic.pathHint' },
  { key: 'procedural', icon: 'build', titleKey: 'memoryBank.layer.procedural.title', descKey: 'memoryBank.layer.procedural.desc', pathHintKey: 'memoryBank.layer.procedural.pathHint' },
  { key: 'prospective', icon: 'event_upcoming', titleKey: 'memoryBank.layer.prospective.title', descKey: 'memoryBank.layer.prospective.desc', pathHintKey: 'memoryBank.layer.prospective.pathHint' },
];

interface State {
  projects: MemdirProjectMeta[];
  selectedProject: string | null; // projectSlug；null = 仍未选定
  activeLayer: UiLayer;
  entries: MemdirEntry[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  openedFile: MemdirReadResult | null;
  openedFileLoading: boolean;
}

export function PdMemoryBank() {
  const [state, setState] = useState<State>({
    projects: [],
    selectedProject: null,
    activeLayer: 'working',
    entries: [],
    loading: true,
    error: null,
    searchQuery: '',
    openedFile: null,
    openedFileLoading: false,
  });

  // 启动：拉项目列表，自动选第一个非空项目
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const projects = await listMemdirProjects();
        if (!mounted) return;
        const firstProject = projects[0]?.projectSlug ?? null;
        setState((s) => ({
          ...s,
          projects,
          selectedProject: firstProject,
          loading: false,
        }));
      } catch (err) {
        if (!mounted) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // selectedProject / activeLayer 改 → 拉条目
  useEffect(() => {
    if (!state.selectedProject) {
      setState((s) => ({ ...s, entries: [] }));
      return;
    }
    let mounted = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    void (async () => {
      try {
        const entries = await listMemdirLayer(state.selectedProject!, state.activeLayer);
        if (!mounted) return;
        setState((s) => ({ ...s, entries, loading: false }));
      } catch (err) {
        if (!mounted) return;
        setState((s) => ({
          ...s,
          entries: [],
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [state.selectedProject, state.activeLayer]);

  const filtered = useMemo(() => {
    if (!state.searchQuery) return state.entries;
    const q = state.searchQuery.toLowerCase();
    return state.entries.filter(
      (e) =>
        e.filename.toLowerCase().includes(q) ||
        e.relativePath.toLowerCase().includes(q) ||
        (e.preview ?? '').toLowerCase().includes(q),
    );
  }, [state.entries, state.searchQuery]);

  const activeMeta = LAYERS.find((l) => l.key === state.activeLayer)!;
  const selectedProjectMeta = state.projects.find((p) => p.projectSlug === state.selectedProject) ?? null;

  const handleOpenFile = useCallback(async (filePath: string) => {
    setState((s) => ({ ...s, openedFileLoading: true }));
    try {
      const result = await readMemdirFile(filePath);
      setState((s) => ({ ...s, openedFile: result, openedFileLoading: false }));
    } catch {
      setState((s) => ({ ...s, openedFileLoading: false }));
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--pd-color-surface)]">
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto w-full max-w-3xl">
          <header className="mb-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)]">
                <span aria-hidden="true" className="material-symbols-outlined text-[22px] text-[var(--pd-color-brand)]">
                  memory
                </span>
              </div>
              <h1
                className="text-2xl font-bold tracking-tight text-[var(--pd-color-text-primary)]"
                style={{ fontFamily: 'var(--pd-font-headline)' }}
              >
                {t('memoryBank.title')}
              </h1>
            </div>
            <p className="text-sm text-[var(--pd-color-text-secondary)]">
              {t('memoryBank.description')}
            </p>
          </header>

          {/* 项目选择条 */}
          {state.projects.length > 0 && (
            <div className="mb-4 rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)] p-3 shadow-sm">
              <div className="text-[10px] font-bold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider mb-2">
                {t('memoryBank.projectLabel')}
              </div>
              <select
                value={state.selectedProject ?? ''}
                onChange={(e) => setState((s) => ({ ...s, selectedProject: e.target.value || null }))}
                className="w-full rounded-md border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] px-3 py-1.5 text-xs font-mono text-[var(--pd-color-text-primary)] outline-none"
              >
                {state.projects.map((p) => (
                  <option key={p.projectSlug} value={p.projectSlug}>
                    {p.projectCwd}
                  </option>
                ))}
              </select>
              {selectedProjectMeta && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {LAYERS.map((l) => {
                    const count = selectedProjectMeta.layerSummary[l.key] ?? 0;
                    return (
                      <span
                        key={l.key}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--pd-color-surface)] text-[var(--pd-color-text-tertiary)] border border-[var(--pd-color-border)]/40"
                      >
                        {l.key}: {count}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {state.projects.length === 0 && !state.loading && !state.error && (
            <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-6 text-center shadow-sm">
              <span aria-hidden="true" className="material-symbols-outlined text-[32px] text-[var(--pd-color-text-tertiary)] mb-2 block">
                inbox
              </span>
              <p className="text-sm text-[var(--pd-color-text-tertiary)]">
                {t('memoryBank.noProjects')}
              </p>
            </div>
          )}

          {state.projects.length > 0 && (
            <>
              {/* 5 层 tabs */}
              <div className="mb-4 flex flex-wrap gap-2">
                {LAYERS.map((l) => {
                  const isActive = l.key === state.activeLayer;
                  return (
                    <button
                      key={l.key}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, activeLayer: l.key }))}
                      className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[image:var(--pd-gradient-btn-primary)] text-[var(--pd-color-btn-primary-fg)] border-transparent shadow-[var(--pd-shadow-button-primary)]'
                          : 'border-[var(--pd-color-border)] text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)]'
                      }`}
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                        {l.icon}
                      </span>
                      {t(l.titleKey)}
                    </button>
                  );
                })}
              </div>

              {/* 搜索条 */}
              <div className="mb-4 flex h-10 items-center rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] px-3 shadow-sm">
                <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[var(--pd-color-text-tertiary)]">
                  search
                </span>
                <input
                  type="text"
                  placeholder={t('memoryBank.searchPlaceholder')}
                  value={state.searchQuery}
                  onChange={(e) => setState((s) => ({ ...s, searchQuery: e.target.value }))}
                  className="ml-2 flex-1 bg-transparent text-sm text-[var(--pd-color-text-primary)] placeholder:text-[var(--pd-color-text-tertiary)] outline-none"
                />
              </div>

              {/* 层描述 */}
              <div className="mb-4 rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)] p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[var(--pd-color-brand)] mt-0.5">
                    {activeMeta.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[var(--pd-color-text-primary)]">
                      {t(activeMeta.titleKey)}
                    </div>
                    <div className="mt-1 text-xs text-[var(--pd-color-text-tertiary)] leading-relaxed">
                      {t(activeMeta.descKey)}
                    </div>
                    <div className="mt-1 text-[10px] text-[var(--pd-color-text-tertiary)] font-mono break-all">
                      {t(activeMeta.pathHintKey)}
                    </div>
                  </div>
                </div>
              </div>

              {state.loading && (
                <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-6 text-center text-sm text-[var(--pd-color-text-tertiary)] shadow-sm">
                  {t('memoryBank.loading')}
                </div>
              )}

              {!state.loading && state.error && (
                <div className="rounded-2xl border border-[var(--pd-color-error)]/40 bg-[var(--pd-color-error)]/5 p-4 shadow-sm">
                  <div className="text-sm font-medium text-[var(--pd-color-error)]">
                    {t('memoryBank.error')}
                  </div>
                  <div className="mt-1 text-xs text-[var(--pd-color-text-secondary)] break-words">
                    {state.error}
                  </div>
                </div>
              )}

              {!state.loading && !state.error && filtered.length === 0 && (
                <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-6 text-center shadow-sm">
                  <span aria-hidden="true" className="material-symbols-outlined text-[32px] text-[var(--pd-color-text-tertiary)] mb-2 block">
                    inbox
                  </span>
                  <p className="text-sm text-[var(--pd-color-text-tertiary)]">
                    {state.searchQuery ? t('memoryBank.noMatching') : t('memoryBank.empty')}
                  </p>
                </div>
              )}

              {!state.loading && !state.error && filtered.length > 0 && (
                <div className="space-y-2">
                  {filtered.map((entry) => (
                    <button
                      key={entry.path}
                      type="button"
                      onClick={() => void handleOpenFile(entry.path)}
                      className="w-full text-left rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-4 shadow-sm transition-colors hover:bg-[var(--pd-color-surface-hover)]"
                    >
                      <div className="flex items-start gap-3">
                        <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[var(--pd-color-text-tertiary)] mt-0.5">
                          description
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--pd-color-text-primary)] truncate font-mono">
                            {entry.relativePath || entry.filename}
                          </div>
                          {entry.preview && (
                            <div className="mt-1 text-xs text-[var(--pd-color-text-tertiary)] line-clamp-2 leading-relaxed">
                              {entry.preview}
                            </div>
                          )}
                          <div className="mt-1 flex items-center gap-3 text-[10px] text-[var(--pd-color-text-tertiary)]">
                            <span>{new Date(entry.modifiedAt).toLocaleString()}</span>
                            <span>{formatSize(entry.size)}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <p className="mt-6 text-xs text-[var(--pd-color-text-tertiary)]">
            {t('memoryBank.savedHint')}
          </p>
        </div>
      </div>

      {state.openedFile && (
        <FileViewerModal
          file={state.openedFile}
          onClose={() => setState((s) => ({ ...s, openedFile: null }))}
        />
      )}
    </div>
  );
}

function FileViewerModal({
  file,
  onClose,
}: {
  file: MemdirReadResult;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--pd-color-text-primary)]/30 p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] flex flex-col rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] shadow-lg overflow-hidden"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--pd-color-border)]/40 bg-[var(--pd-color-surface-container-low)]">
          <div className="flex items-center gap-2 min-w-0">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[var(--pd-color-text-tertiary)]">
              article
            </span>
            <div className="text-xs font-mono text-[var(--pd-color-text-primary)] truncate">
              {file.path}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--pd-color-text-tertiary)] hover:bg-[var(--pd-color-surface-hover)]"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
              close
            </span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <pre
            className="whitespace-pre-wrap break-words text-xs leading-relaxed text-[var(--pd-color-text-secondary)]"
            style={{ fontFamily: 'var(--pd-font-mono, ui-monospace, monospace)' }}
          >
            {file.content}
          </pre>
        </div>
        <div className="border-t border-[var(--pd-color-border)]/40 px-5 py-2 text-[10px] text-[var(--pd-color-text-tertiary)] flex items-center justify-between">
          <span>{new Date(file.modifiedAt).toLocaleString()}</span>
          <span>{formatSize(file.size)}</span>
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default PdMemoryBank;
