// Input: CLAUDE.md entries (mock/localStorage for now) + project memory metadata
// Output: Memory library panel — shows project memory entries with title, summary, time
// Pos: PdSidebar workspace panel — replaces session list when memory mode active

import { useState, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MemoryEntry {
  id: string;
  title: string;
  summary: string;
  updatedAt: string; // ISO 8601
  source: 'claude.md' | 'memory' | 'session';
}

// ---------------------------------------------------------------------------
// Mock data (will be replaced by IPC bridge / localStorage)
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'panda-desk-memory-entries';

function loadEntries(): MemoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MemoryEntry[];
  } catch { /* ignore */ }

  // Default entries showing typical CLAUDE.md structure
  return [
    {
      id: 'claude-md-project',
      title: 'CLAUDE.md (项目)',
      summary: '项目架构、命令、工作指南',
      updatedAt: new Date().toISOString(),
      source: 'claude.md',
    },
    {
      id: 'claude-md-user',
      title: 'CLAUDE.md (用户)',
      summary: '全局用户偏好和规则',
      updatedAt: new Date().toISOString(),
      source: 'claude.md',
    },
    {
      id: 'memory-scars',
      title: '伤疤记忆',
      summary: '已知坑点和避坑策略',
      updatedAt: new Date().toISOString(),
      source: 'memory',
    },
    {
      id: 'memory-semantic',
      title: '语义记忆',
      summary: '项目知识、架构决策、版本线',
      updatedAt: new Date().toISOString(),
      source: 'memory',
    },
    {
      id: 'memory-procedural',
      title: '程序记忆',
      summary: '工作流、发版流程、部署模式',
      updatedAt: new Date().toISOString(),
      source: 'memory',
    },
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SOURCE_LABELS: Record<MemoryEntry['source'], string> = {
  'claude.md': 'CLAUDE.md',
  memory: '记忆库',
  session: '会话',
};

const SOURCE_COLORS: Record<MemoryEntry['source'], string> = {
  'claude.md': 'bg-blue-500/20 text-blue-400',
  memory: 'bg-purple-500/20 text-purple-400',
  session: 'bg-emerald-500/20 text-emerald-400',
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin} 分钟前`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} 小时前`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} 天前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MemoryPanel() {
  const [filter, setFilter] = useState<MemoryEntry['source'] | 'all'>('all');

  const entries = useMemo(() => loadEntries(), []);

  const filtered = useMemo(
    () => (filter === 'all' ? entries : entries.filter((e) => e.source === filter)),
    [entries, filter],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header + filter */}
      <div className="shrink-0 px-3 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--pd-text-xs)] font-medium text-[var(--pd-color-fg-muted)]">
            记忆库
          </span>
          <span className="text-[10px] text-[var(--pd-color-fg-subtle)]">
            {filtered.length} 条
          </span>
        </div>
        <div className="mt-1.5 flex gap-1">
          {(['all', 'claude.md', 'memory', 'session'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                'rounded-[var(--pd-radius-sm)] px-2 py-0.5 text-[10px] font-medium transition-colors',
                filter === f
                  ? 'bg-[var(--pd-color-accent)]/20 text-[var(--pd-color-accent)]'
                  : 'text-[var(--pd-color-fg-subtle)] hover:bg-[var(--pd-color-bg-hover)]',
              ].join(' ')}
            >
              {f === 'all' ? '全部' : SOURCE_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto px-2">
        {filtered.length === 0 ? (
          <div className="px-3 py-8 text-center text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]">
            暂无记忆条目
          </div>
        ) : (
          filtered.map((entry) => (
            <div
              key={entry.id}
              className="mb-0.5 rounded-[var(--pd-radius-md)] px-3 py-2 transition-colors hover:bg-[var(--pd-color-bg-hover)]"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-medium ${SOURCE_COLORS[entry.source]}`}
                >
                  {SOURCE_LABELS[entry.source]}
                </span>
                <span className="ml-auto text-[10px] text-[var(--pd-color-fg-subtle)]">
                  {formatTime(entry.updatedAt)}
                </span>
              </div>
              <h4 className="mt-0.5 text-[length:var(--pd-text-sm)] font-medium text-[var(--pd-color-fg)]">
                {entry.title}
              </h4>
              <p className="mt-0.5 line-clamp-2 text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]">
                {entry.summary}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer action */}
      <div className="shrink-0 border-t border-[var(--pd-color-border)] px-3 py-2">
        <button
          onClick={() => {
            // TODO: Wire to IPC — open CLAUDE.md in default editor
            console.log('[MemoryPanel] open in editor');
          }}
          className={[
            'w-full rounded-[var(--pd-radius-md)] py-1.5 text-center',
            'text-[length:var(--pd-text-xs)] font-medium',
            'bg-[var(--pd-color-bg-hover)] text-[var(--pd-color-fg-muted)]',
            'transition-colors hover:bg-[var(--pd-color-accent)]/10 hover:text-[var(--pd-color-accent)]',
          ].join(' ')}
        >
          在编辑器中打开 CLAUDE.md
        </button>
      </div>
    </div>
  );
}
