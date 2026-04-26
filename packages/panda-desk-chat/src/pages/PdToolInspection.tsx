// Input: 路由 — useTabStore.activeTabId === TOOL_INSPECTION_TAB_ID 时挂载
// Output: 工具调用调试器 — audit.jsonl 倒序展示 + 统计 + 过滤 + 单条展开
// Pos: Page layer — PdContentRouter 'tool-inspection' 分支唯一目标
//
// Comdr 指令 cc-haha 路线 A — PdToolInspection 真实数据接入：
//   bridge.listRecentAudit(limit)   → ~/.pandacc/audit.jsonl 最近 N 条
//   bridge.filterAudit(filter)      → 按 sessionId / toolName / since 过滤
//   bridge.getAuditStats()          → today / total / errorRate / topTools
//
// 数据来源（panda CLI src/utils/auditLog.ts）：
//   { timestamp, session_id, tool_name, args_hash, risk_level,
//     permission_decision, outcome, duration_ms?, error_brief? }
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useCallback, useEffect, useState } from 'react';
import { t } from '../i18n';
import { PdButton } from '../components/shared/PdButton';
import {
  listRecentAudit,
  filterAudit,
  getAuditStats,
} from '../ipc/bridge';
import type {
  AuditEntry,
  AuditFilter,
  AuditOutcome,
  AuditPermissionDecision,
  AuditRiskLevel,
  AuditStats,
} from '../ipc/types';

interface State {
  entries: AuditEntry[];
  stats: AuditStats | null;
  loading: boolean;
  error: string | null;
  filter: AuditFilter;
  expandedKeys: Set<string>;
}

const DEFAULT_LIMIT = 100;

export function PdToolInspection() {
  const [state, setState] = useState<State>({
    entries: [],
    stats: null,
    loading: true,
    error: null,
    filter: {},
    expandedKeys: new Set(),
  });

  const fetchAll = useCallback(async (filter: AuditFilter) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [entries, stats] = await Promise.all([
        Object.keys(filter).length === 0
          ? listRecentAudit(DEFAULT_LIMIT)
          : filterAudit({ ...filter, limit: filter.limit ?? DEFAULT_LIMIT }),
        getAuditStats(),
      ]);
      setState((s) => ({
        ...s,
        entries,
        stats,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [entries, stats] = await Promise.all([
          listRecentAudit(DEFAULT_LIMIT),
          getAuditStats(),
        ]);
        if (!mounted) return;
        setState((s) => ({
          ...s,
          entries,
          stats,
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

  const handleFilterChange = useCallback(
    (next: Partial<AuditFilter>) => {
      const merged: AuditFilter = { ...state.filter, ...next };
      // 空字段剔除
      const cleaned: AuditFilter = {};
      if (merged.sessionId) cleaned.sessionId = merged.sessionId;
      if (merged.toolName) cleaned.toolName = merged.toolName;
      if (merged.since) cleaned.since = merged.since;
      setState((s) => ({ ...s, filter: cleaned }));
      void fetchAll(cleaned);
    },
    [state.filter, fetchAll],
  );

  const handleClearFilter = useCallback(() => {
    setState((s) => ({ ...s, filter: {} }));
    void fetchAll({});
  }, [fetchAll]);

  const handleRefresh = useCallback(() => {
    void fetchAll(state.filter);
  }, [fetchAll, state.filter]);

  const toggleExpand = useCallback((key: string) => {
    setState((s) => {
      const next = new Set(s.expandedKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...s, expandedKeys: next };
    });
  }, []);

  // 列出 stats 中独特 tool 集合，给 Filter 下拉用
  const toolOptions = state.stats?.topTools.map((t) => t.tool) ?? [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--pd-color-surface)]">
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto w-full max-w-4xl">
          <header className="mb-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)]">
                <span aria-hidden="true" className="material-symbols-outlined text-[22px] text-[var(--pd-color-brand)]">
                  bug_report
                </span>
              </div>
              <h1
                className="text-2xl font-bold tracking-tight text-[var(--pd-color-text-primary)]"
                style={{ fontFamily: 'var(--pd-font-headline)' }}
              >
                {t('toolInspection.title')}
              </h1>
            </div>
            <p className="text-sm text-[var(--pd-color-text-secondary)]">
              {t('toolInspection.description')}
            </p>
          </header>

          {/* 统计卡 */}
          {state.stats && (
            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                icon="today"
                label={t('toolInspection.stats.today')}
                value={String(state.stats.today)}
              />
              <StatCard
                icon="format_list_numbered"
                label={t('toolInspection.stats.total')}
                value={String(state.stats.total)}
              />
              <StatCard
                icon="warning"
                label={t('toolInspection.stats.errorRate')}
                value={`${(state.stats.errorRate * 100).toFixed(1)}%`}
                accent={state.stats.errorRate > 0.1 ? 'error' : 'normal'}
              />
              <StatCard
                icon="leaderboard"
                label={t('toolInspection.stats.topTools')}
                value={
                  state.stats.topTools.length === 0
                    ? '-'
                    : state.stats.topTools.map((t) => `${t.tool} (${t.count})`).slice(0, 2).join(', ')
                }
              />
            </div>
          )}

          {/* Filter */}
          <div className="mb-4 rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface-container-low)] p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider">
                {t('toolInspection.filter.title')}
              </div>
              <div className="flex gap-2">
                <PdButton variant="ghost" size="sm" onClick={handleClearFilter}>
                  {t('toolInspection.filter.clear')}
                </PdButton>
                <PdButton variant="secondary" size="sm" onClick={handleRefresh}>
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                    refresh
                  </span>
                  {t('toolInspection.refresh')}
                </PdButton>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder={t('toolInspection.filter.session')}
                value={state.filter.sessionId ?? ''}
                onChange={(e) => handleFilterChange({ sessionId: e.target.value || undefined })}
                className="rounded-md border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] px-2 py-1 text-xs font-mono text-[var(--pd-color-text-primary)] placeholder:text-[var(--pd-color-text-tertiary)] outline-none"
              />
              <select
                value={state.filter.toolName ?? ''}
                onChange={(e) => handleFilterChange({ toolName: e.target.value || undefined })}
                className="rounded-md border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] px-2 py-1 text-xs text-[var(--pd-color-text-primary)] outline-none"
              >
                <option value="">{t('toolInspection.filter.allTools')}</option>
                {toolOptions.map((tool) => (
                  <option key={tool} value={tool}>
                    {tool}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={isoToInputDateTime(state.filter.since)}
                onChange={(e) =>
                  handleFilterChange({
                    since: e.target.value ? inputDateTimeToIso(e.target.value) : undefined,
                  })
                }
                className="rounded-md border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] px-2 py-1 text-xs text-[var(--pd-color-text-primary)] outline-none"
              />
            </div>
          </div>

          {/* 列表 */}
          {state.loading && (
            <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-6 text-center text-sm text-[var(--pd-color-text-tertiary)] shadow-sm">
              {t('toolInspection.loading')}
            </div>
          )}

          {!state.loading && state.error && (
            <div className="rounded-2xl border border-[var(--pd-color-error)]/40 bg-[var(--pd-color-error)]/5 p-4 shadow-sm">
              <div className="text-sm font-medium text-[var(--pd-color-error)]">
                {t('toolInspection.error')}
              </div>
              <div className="mt-1 text-xs text-[var(--pd-color-text-secondary)] break-words">
                {state.error}
              </div>
            </div>
          )}

          {!state.loading && !state.error && state.entries.length === 0 && (
            <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-6 text-center shadow-sm">
              <span aria-hidden="true" className="material-symbols-outlined text-[32px] text-[var(--pd-color-text-tertiary)] mb-2 block">
                inbox
              </span>
              <p className="text-sm text-[var(--pd-color-text-tertiary)]">
                {t('toolInspection.empty')}
              </p>
            </div>
          )}

          {!state.loading && !state.error && state.entries.length > 0 && (
            <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-[var(--pd-color-surface-container-low)] border-b border-[var(--pd-color-border)]/40">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider w-[140px]">
                      {t('toolInspection.column.timestamp')}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider w-[110px]">
                      {t('toolInspection.column.tool')}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider">
                      {t('toolInspection.column.risk')}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider">
                      {t('toolInspection.column.permission')}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider">
                      {t('toolInspection.column.outcome')}
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider w-[80px]">
                      {t('toolInspection.column.duration')}
                    </th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {state.entries.map((entry, idx) => {
                    const key = `${entry.timestamp}-${entry.session_id}-${idx}`;
                    const expanded = state.expandedKeys.has(key);
                    return (
                      <ExpandableRow
                        key={key}
                        entry={entry}
                        expanded={expanded}
                        onToggle={() => toggleExpand(key)}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent = 'normal',
}: {
  icon: string;
  label: string;
  value: string;
  accent?: 'normal' | 'error';
}) {
  const valueColor =
    accent === 'error' ? 'text-[var(--pd-color-error)]' : 'text-[var(--pd-color-text-primary)]';
  return (
    <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-3 shadow-sm">
      <div className="text-[10px] font-bold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[var(--pd-color-text-tertiary)]">
          {icon}
        </span>
        <span className={`text-sm font-semibold ${valueColor} truncate`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function ExpandableRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: AuditEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-b border-[var(--pd-color-border)]/40 hover:bg-[var(--pd-color-surface-hover)]">
        <td className="px-3 py-2 font-mono text-[var(--pd-color-text-secondary)] whitespace-nowrap">
          {formatTime(entry.timestamp)}
        </td>
        <td className="px-3 py-2 font-medium text-[var(--pd-color-text-primary)]">
          {entry.tool_name}
        </td>
        <td className="px-3 py-2">
          <RiskBadge risk={entry.risk_level} />
        </td>
        <td className="px-3 py-2">
          <PermissionBadge decision={entry.permission_decision} />
        </td>
        <td className="px-3 py-2">
          <OutcomeBadge outcome={entry.outcome} />
        </td>
        <td className="px-3 py-2 font-mono text-[var(--pd-color-text-tertiary)] whitespace-nowrap">
          {typeof entry.duration_ms === 'number' ? `${entry.duration_ms}ms` : '-'}
        </td>
        <td className="px-3 py-2 text-right">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md p-1 text-[var(--pd-color-text-tertiary)] hover:bg-[var(--pd-color-surface-hover)] hover:text-[var(--pd-color-text-primary)]"
            aria-label={expanded ? t('toolInspection.expand.hide') : t('toolInspection.expand.show')}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-[var(--pd-color-border)]/40 bg-[var(--pd-color-surface-container-low)]">
          <td colSpan={7} className="px-3 py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <DetailRow label="session_id" value={entry.session_id} mono />
              <DetailRow label={t('toolInspection.expand.argsHash')} value={entry.args_hash || '-'} mono />
              {entry.error_brief && (
                <div className="md:col-span-2">
                  <div className="text-[10px] font-bold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider mb-1">
                    {t('toolInspection.expand.errorBrief')}
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-[var(--pd-color-error)] font-mono bg-[var(--pd-color-surface)] rounded-md border border-[var(--pd-color-border)]/40 p-2">
                    {entry.error_brief}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider mb-0.5">
        {label}
      </div>
      <div className={`text-xs ${mono ? 'font-mono' : ''} text-[var(--pd-color-text-primary)] break-all`}>
        {value}
      </div>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: AuditOutcome }) {
  const map: Record<AuditOutcome, { label: string; className: string }> = {
    success: {
      label: t('toolInspection.outcome.success'),
      className: 'border-[var(--pd-color-success)]/40 bg-[var(--pd-color-success)]/10 text-[var(--pd-color-success)]',
    },
    failure: {
      label: t('toolInspection.outcome.failure'),
      className: 'border-[var(--pd-color-error)]/40 bg-[var(--pd-color-error)]/10 text-[var(--pd-color-error)]',
    },
    cancelled: {
      label: t('toolInspection.outcome.cancelled'),
      className: 'border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] text-[var(--pd-color-text-tertiary)]',
    },
    unknown: {
      label: t('toolInspection.outcome.unknown'),
      className: 'border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] text-[var(--pd-color-text-tertiary)]',
    },
  };
  const meta = map[outcome] ?? map.unknown;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function PermissionBadge({ decision }: { decision: AuditPermissionDecision }) {
  const map: Record<AuditPermissionDecision, { label: string; className: string }> = {
    'auto-allowed': {
      label: t('toolInspection.permission.autoAllowed'),
      className: 'text-[var(--pd-color-text-tertiary)]',
    },
    'user-allowed': {
      label: t('toolInspection.permission.userAllowed'),
      className: 'text-[var(--pd-color-success)]',
    },
    'user-denied': {
      label: t('toolInspection.permission.userDenied'),
      className: 'text-[var(--pd-color-error)]',
    },
    'auto-denied': {
      label: t('toolInspection.permission.autoDenied'),
      className: 'text-[var(--pd-color-error)]',
    },
    unknown: {
      label: t('toolInspection.permission.unknown'),
      className: 'text-[var(--pd-color-text-tertiary)]',
    },
  };
  const meta = map[decision] ?? map.unknown;
  return <span className={`text-xs font-medium ${meta.className}`}>{meta.label}</span>;
}

function RiskBadge({ risk }: { risk: AuditRiskLevel }) {
  const map: Record<AuditRiskLevel, { label: string; className: string }> = {
    'read-only': {
      label: t('toolInspection.risk.readOnly'),
      className: 'border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] text-[var(--pd-color-text-tertiary)]',
    },
    'low-write': {
      label: t('toolInspection.risk.lowWrite'),
      className: 'border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] text-[var(--pd-color-text-secondary)]',
    },
    'high-write': {
      label: t('toolInspection.risk.highWrite'),
      className: 'border-[var(--pd-color-error)]/30 bg-[var(--pd-color-error)]/5 text-[var(--pd-color-error)]',
    },
    destructive: {
      label: t('toolInspection.risk.destructive'),
      className: 'border-[var(--pd-color-error)]/50 bg-[var(--pd-color-error)]/10 text-[var(--pd-color-error)]',
    },
  };
  const meta = map[risk] ?? map['read-only'];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function isoToInputDateTime(iso: string | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    // YYYY-MM-DDTHH:mm（datetime-local 格式）
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

function inputDateTimeToIso(local: string): string {
  try {
    const d = new Date(local);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString();
  } catch {
    return '';
  }
}

export default PdToolInspection;
