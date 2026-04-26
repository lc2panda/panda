// Input: 路由 — useTabStore.activeTabId === PATTERNS_TAB_ID 时挂载
// Output: 经验记忆双区块 — 跨项目扫 patterns/ + scars/ 目录，按项目分组展示
// Pos: Page layer — PdContentRouter 'patterns' 分支唯一目标
//
// Comdr 指令 cc-haha 路线 A — PdPatternsScars 真实数据接入：
//   bridge.listMemdirProjects()         → 列所有 panda CLI 项目
//   bridge.listMemdirLayer(slug, layer) → 对每个项目读 patterns/ + scars/
//   bridge.readMemdirFile(path)         → 单条记忆点开看全文
//
// 注意：panda CLI src/memdir/paths.ts 实际把 patterns / scars 写成**目录**
//       （patterns/<topic>.md 多个文件），不是单个 patterns.md。本页按目
//       录扫并把多文件聚合渲染。空目录给空态。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useCallback, useEffect, useState } from 'react';
import { t } from '../i18n';
import {
  listMemdirProjects,
  listMemdirLayer,
  readMemdirFile,
} from '../ipc/bridge';
import type {
  MemdirEntry,
  MemdirProjectMeta,
} from '../ipc/types';

interface ProjectBundle {
  meta: MemdirProjectMeta;
  patterns: MemdirEntry[];
  scars: MemdirEntry[];
}

interface State {
  bundles: ProjectBundle[];
  loading: boolean;
  error: string | null;
  /** 单文件全文 modal — null 时关闭。 */
  openedFile: { path: string; content: string; modifiedAt: string; size: number } | null;
  openedFileLoading: boolean;
}

export function PdPatternsScars() {
  const [state, setState] = useState<State>({
    bundles: [],
    loading: true,
    error: null,
    openedFile: null,
    openedFileLoading: false,
  });

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const projects = await listMemdirProjects();
        if (!mounted) return;
        // 仅保留含 patterns 或 scars 子目录的项目（避免空项目刷屏）
        const filtered = projects.filter(
          (p) =>
            (p.layerSummary.patterns ?? 0) > 0 ||
            (p.layerSummary.scars ?? 0) > 0,
        );
        if (filtered.length === 0) {
          setState((s) => ({ ...s, bundles: [], loading: false }));
          return;
        }
        const bundles: ProjectBundle[] = [];
        for (const meta of filtered) {
          const [patterns, scars] = await Promise.all([
            (meta.layerSummary.patterns ?? 0) > 0
              ? listMemdirLayer(meta.projectSlug, 'patterns')
              : Promise.resolve([] as MemdirEntry[]),
            (meta.layerSummary.scars ?? 0) > 0
              ? listMemdirLayer(meta.projectSlug, 'scars')
              : Promise.resolve([] as MemdirEntry[]),
          ]);
          bundles.push({ meta, patterns, scars });
        }
        if (!mounted) return;
        setState((s) => ({ ...s, bundles, loading: false }));
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

  const handleOpenFile = useCallback(async (filePath: string) => {
    setState((s) => ({ ...s, openedFileLoading: true }));
    try {
      const result = await readMemdirFile(filePath);
      if (!result) {
        setState((s) => ({ ...s, openedFileLoading: false }));
        return;
      }
      setState((s) => ({
        ...s,
        openedFile: result,
        openedFileLoading: false,
      }));
    } catch {
      setState((s) => ({ ...s, openedFileLoading: false }));
    }
  }, []);

  const handleCloseFile = useCallback(() => {
    setState((s) => ({ ...s, openedFile: null }));
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--pd-color-surface)]">
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto w-full max-w-3xl">
          <header className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)]">
                <span aria-hidden="true" className="material-symbols-outlined text-[22px] text-[var(--pd-color-brand)]">
                  psychology_alt
                </span>
              </div>
              <h1
                className="text-2xl font-bold tracking-tight text-[var(--pd-color-text-primary)]"
                style={{ fontFamily: 'var(--pd-font-headline)' }}
              >
                {t('patterns.title')}
              </h1>
            </div>
            <p className="text-sm text-[var(--pd-color-text-secondary)]">
              {t('patterns.description')}
            </p>
          </header>

          {state.loading && (
            <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-6 text-center text-sm text-[var(--pd-color-text-tertiary)] shadow-sm">
              {t('patterns.loading')}
            </div>
          )}

          {!state.loading && state.error && (
            <div className="rounded-2xl border border-[var(--pd-color-error)]/40 bg-[var(--pd-color-error)]/5 p-4 shadow-sm">
              <div className="text-sm font-medium text-[var(--pd-color-error)]">
                {t('patterns.error')}
              </div>
              <div className="mt-1 text-xs text-[var(--pd-color-text-secondary)] break-words">
                {state.error}
              </div>
            </div>
          )}

          {!state.loading && !state.error && state.bundles.length === 0 && (
            <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-6 text-center shadow-sm">
              <span aria-hidden="true" className="material-symbols-outlined text-[32px] text-[var(--pd-color-text-tertiary)] mb-2 block">
                inbox
              </span>
              <p className="text-sm text-[var(--pd-color-text-tertiary)]">
                {t('patterns.empty')}
              </p>
            </div>
          )}

          {!state.loading && !state.error && state.bundles.length > 0 && (
            <div className="space-y-6">
              {state.bundles.map((b) => (
                <ProjectBlock
                  key={b.meta.projectSlug}
                  bundle={b}
                  onOpenFile={handleOpenFile}
                />
              ))}
            </div>
          )}

          <p className="mt-6 text-xs text-[var(--pd-color-text-tertiary)] font-mono break-all">
            {t('patterns.pathHint')}
          </p>
        </div>
      </div>

      {state.openedFile && (
        <FileViewerModal
          file={state.openedFile}
          onClose={handleCloseFile}
        />
      )}
    </div>
  );
}

function ProjectBlock({
  bundle,
  onOpenFile,
}: {
  bundle: ProjectBundle;
  onOpenFile: (path: string) => Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] shadow-sm overflow-hidden">
      <div className="border-b border-[var(--pd-color-border)]/40 px-5 py-3 bg-[var(--pd-color-surface-container-low)]">
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-[var(--pd-color-text-tertiary)]">
            folder
          </span>
          <div className="text-xs font-mono text-[var(--pd-color-text-primary)] truncate">
            {bundle.meta.projectCwd}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--pd-color-border)]/40">
        <Section
          icon="check_circle"
          accent="success"
          title={t('patterns.patterns.title')}
          desc={t('patterns.patterns.desc')}
          entries={bundle.patterns}
          emptyText={t('patterns.patterns.empty')}
          onOpenFile={onOpenFile}
        />
        <Section
          icon="cancel"
          accent="error"
          title={t('patterns.scars.title')}
          desc={t('patterns.scars.desc')}
          entries={bundle.scars}
          emptyText={t('patterns.scars.empty')}
          onOpenFile={onOpenFile}
        />
      </div>
    </div>
  );
}

function Section({
  icon,
  accent,
  title,
  desc,
  entries,
  emptyText,
  onOpenFile,
}: {
  icon: string;
  accent: 'success' | 'error';
  title: string;
  desc: string;
  entries: MemdirEntry[];
  emptyText: string;
  onOpenFile: (path: string) => Promise<void>;
}) {
  const iconColor =
    accent === 'success' ? 'text-[var(--pd-color-success)]' : 'text-[var(--pd-color-error)]';

  return (
    <section className="px-5 py-4">
      <div className="flex items-center gap-3 mb-3">
        <span aria-hidden="true" className={`material-symbols-outlined text-[20px] ${iconColor}`}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--pd-color-text-tertiary)]">{desc}</p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--pd-color-surface-container-low)] text-[var(--pd-color-text-tertiary)]">
          {entries.length === 0
            ? t('patterns.fileCount.zero')
            : entries.length === 1
              ? t('patterns.fileCount.one')
              : t('patterns.fileCount.many').replace('{n}', String(entries.length))}
        </span>
      </div>
      {entries.length === 0 ? (
        <div className="text-center text-xs text-[var(--pd-color-text-tertiary)] py-4">
          {emptyText}
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.path}
              className="rounded-xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)] p-3 transition-colors hover:bg-[var(--pd-color-surface-hover)]"
            >
              <button
                type="button"
                onClick={() => void onOpenFile(e.path)}
                className="w-full text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span aria-hidden="true" className="material-symbols-outlined text-[14px] text-[var(--pd-color-text-tertiary)]">
                    description
                  </span>
                  <span className="text-xs font-mono font-medium text-[var(--pd-color-text-primary)] truncate">
                    {e.relativePath || e.filename}
                  </span>
                </div>
                {e.preview && (
                  <p className="mt-1.5 text-[11px] text-[var(--pd-color-text-tertiary)] line-clamp-2 leading-relaxed">
                    {e.preview}
                  </p>
                )}
                <div className="mt-1 text-[10px] text-[var(--pd-color-text-tertiary)]">
                  {new Date(e.modifiedAt).toLocaleString()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FileViewerModal({
  file,
  onClose,
}: {
  file: { path: string; content: string; modifiedAt: string; size: number };
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

export default PdPatternsScars;
