// Input: panda CLI ~/.pandacc/teams 真实落盘数据（IPC bridge listTeams/getTeamDetail/isAgentTeamsEnabled）
// Output: AgentTeams 主页 — 团队列表 + 详情视图 + Inbox 展开 + 启用状态徽章 + 空态
// Pos: Page layer — PdContentRouter 'agent-teams' / 'team' 分支挂载点
//
// Comdr 指令: 接 ~/.pandacc/teams 真实数据，禁绝 mock。
//   数据来源（panda CLI src/utils/swarm/teamHelpers.ts + utils/teammateMailbox.ts）：
//     ~/.pandacc/teams/<name>/inboxes/<agent>.json — 每个 inbox 是 mailbox JSON
//     ~/.pandacc/settings.json env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS — 启用开关
//   未启用 / 0 团队 → 空态引导用户去 Settings/Panda Env 启用。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useMemo, useState } from 'react';
import {
  listTeams,
  getTeamDetail,
  isAgentTeamsEnabled,
} from '../ipc/bridge';
import type { TeamMeta, TeamDetail, AgentInbox } from '../ipc/types';
import { useTabStore, SETTINGS_TAB_ID } from '../stores/tabStore';
import { useUIStore } from '../stores/uiStore';

// ─── Inline keyframes for pulse-subtle animation ─────────────────
const pulseSubtleStyle = `
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; transform: scale(0.98); }
}
.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}
`;

// ─── Helpers ──────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return '—';
  const diff = Date.now() - ts;
  if (diff < 0) return '刚刚';
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}m 前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h 前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d 前`;
  return `${Math.floor(day / 30)}mo 前`;
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

/** 总消息数（按每个 inbox.messageCount 求和；缺省按 0 计）。 */
function totalMessages(inboxes: AgentInbox[]): number {
  return inboxes.reduce((acc, ib) => acc + (ib.messageCount ?? 0), 0);
}

/** 缩短长 UUID 名（>20 字符 → 前 8…后 4）。 */
function shortName(name: string): string {
  if (name.length <= 20) return name;
  return `${name.slice(0, 8)}…${name.slice(-4)}`;
}

// ─── 顶级组件 ─────────────────────────────────────────────────────

export function PdAgentTeams() {
  const [teams, setTeams] = useState<TeamMeta[]>([]);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const setPendingSettingsTab = useUIStore((s) => s.setPendingSettingsTab);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const openTab = useTabStore((s) => s.openTab);
  const settingsTabExists = useTabStore((s) =>
    s.tabs.some((t) => t.sessionId === SETTINGS_TAB_ID),
  );

  // 拉真实数据
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([listTeams(), isAgentTeamsEnabled()])
      .then(([t, en]) => {
        if (cancelled) return;
        setTeams(t);
        setEnabled(en);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const handleRefresh = () => setRefreshTick((n) => n + 1);
  const handleOpenSettings = () => {
    setPendingSettingsTab('pandaEnv');
    if (settingsTabExists) {
      setActiveTab(SETTINGS_TAB_ID);
    } else {
      openTab(SETTINGS_TAB_ID, 'Settings', 'settings');
    }
  };

  // ── 详情视图分支 ──
  if (selectedTeamName) {
    return (
      <>
        <style>{pulseSubtleStyle}</style>
        <TeamDetailView
          name={selectedTeamName}
          onBack={() => setSelectedTeamName(null)}
        />
      </>
    );
  }

  return (
    <>
      <style>{pulseSubtleStyle}</style>
      <div
        className="flex-1 flex flex-col relative overflow-hidden bg-[var(--pd-color-surface)] text-[var(--pd-color-text-primary)]"
        style={{ fontFamily: 'var(--pd-font-body)' }}
      >
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto w-full">
          {/* ── Header ── */}
          <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold text-[var(--pd-color-text-primary)] mb-1"
                style={{ fontFamily: 'var(--pd-font-headline)' }}
              >
                团队
              </h1>
              <p className="text-sm text-[var(--pd-color-text-tertiary)]">
                Agent 协同工作流 — ~/.pandacc/teams 落盘数据
              </p>
            </div>
            <div className="flex items-center gap-2">
              <EnabledBadge enabled={enabled} loading={loading} />
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--pd-color-border)] text-xs font-semibold text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)] transition-colors"
                title="刷新"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                刷新
              </button>
            </div>
          </header>

          {/* ── 主体 ── */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-[var(--pd-color-text-tertiary)]">
              <span className="material-symbols-outlined animate-pulse-subtle mr-2">
                sync
              </span>
              加载团队列表…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-[var(--pd-color-error)]/40 bg-[var(--pd-color-error-container)]/30 p-6 text-sm text-[var(--pd-color-error)]">
              加载失败：{error}
            </div>
          ) : teams.length === 0 ? (
            <EmptyState enabled={enabled} onOpenSettings={handleOpenSettings} />
          ) : (
            <TeamGrid
              teams={teams}
              onSelect={(name) => setSelectedTeamName(name)}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default PdAgentTeams;

// ─── Sub: 启用状态徽章 ────────────────────────────────────────────

function EnabledBadge({
  enabled,
  loading,
}: {
  enabled: boolean;
  loading: boolean;
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--pd-color-border)] text-[11px] font-semibold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--pd-color-text-tertiary)] animate-pulse-subtle" />
        加载中
      </span>
    );
  }
  if (enabled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--pd-color-success)]/40 bg-[var(--pd-color-success)]/10 text-[11px] font-semibold text-[var(--pd-color-success)] uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--pd-color-success)] animate-pulse-subtle shadow-[0_0_6px_rgba(126,219,139,0.6)]" />
        Agent Teams 已启用
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--pd-color-warning)]/40 bg-[var(--pd-color-warning)]/10 text-[11px] font-semibold text-[var(--pd-color-warning)] uppercase tracking-wider">
      <span className="material-symbols-outlined text-[12px]">info</span>
      Agent Teams 未启用
    </span>
  );
}

// ─── Sub: 团队列表网格 ────────────────────────────────────────────

function TeamGrid({
  teams,
  onSelect,
}: {
  teams: TeamMeta[];
  onSelect: (name: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {teams.map((team) => (
        <TeamCard key={team.name} team={team} onSelect={onSelect} />
      ))}
    </div>
  );
}

function TeamCard({
  team,
  onSelect,
}: {
  team: TeamMeta;
  onSelect: (name: string) => void;
}) {
  const progress = team.memberCount > 0
    ? Math.round((team.activeMembers / team.memberCount) * 100)
    : 0;

  return (
    <button
      onClick={() => onSelect(team.name)}
      className="group text-left rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] p-5 shadow-sm hover:shadow-md hover:border-[var(--pd-color-border-strong)] transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-2 bg-[var(--pd-color-primary-fixed)]/20 rounded-lg flex-shrink-0">
            <span className="material-symbols-outlined text-[var(--pd-color-brand)] text-lg">
              groups
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="text-sm font-bold text-[var(--pd-color-text-primary)] truncate"
              style={{ fontFamily: 'var(--pd-font-headline)' }}
              title={team.name}
            >
              {shortName(team.name)}
            </h3>
            <p className="text-[10px] font-medium text-[var(--pd-color-text-tertiary)] uppercase tracking-tighter">
              {team.memberCount} members · {team.activeMembers} active
            </p>
          </div>
        </div>
        {team.activeMembers > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[var(--pd-color-success)]/30 bg-[var(--pd-color-success)]/10 text-[10px] font-semibold text-[var(--pd-color-success)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--pd-color-success)] animate-pulse-subtle shadow-[0_0_6px_rgba(126,219,139,0.6)]" />
            活跃
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-high)] text-[10px] font-semibold text-[var(--pd-color-text-tertiary)]">
            空闲
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] text-[var(--pd-color-text-tertiary)] uppercase tracking-wider font-semibold mb-1">
          <span>活跃占比</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--pd-color-surface-container-high)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[image:var(--pd-gradient-btn-primary)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-[var(--pd-color-text-tertiary)]">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">schedule</span>
          {formatRelativeTime(team.lastActiveAt)}
        </span>
        <span className="flex items-center gap-1 group-hover:text-[var(--pd-color-text-primary)] transition-colors">
          查看 inbox
          <span className="material-symbols-outlined text-xs">chevron_right</span>
        </span>
      </div>
    </button>
  );
}

// ─── Sub: 空态 ─────────────────────────────────────────────────────

function EmptyState({
  enabled,
  onOpenSettings,
}: {
  enabled: boolean;
  onOpenSettings: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] p-10 text-center shadow-sm">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--pd-color-primary-fixed)]/20 mb-4">
        <span className="material-symbols-outlined text-[var(--pd-color-brand)] text-3xl">
          {enabled ? 'groups' : 'lock'}
        </span>
      </div>
      <h2
        className="text-lg font-bold text-[var(--pd-color-text-primary)] mb-2"
        style={{ fontFamily: 'var(--pd-font-headline)' }}
      >
        {enabled ? '暂无团队' : '尚未启用 Agent Teams'}
      </h2>
      <p className="text-sm text-[var(--pd-color-text-secondary)] mb-6 max-w-md mx-auto leading-relaxed">
        {enabled
          ? '~/.pandacc/teams 目录为空。运行 panda CLI 的团队任务后会自动落盘 inbox。'
          : '请先在 Settings → Panda Env 中启用 CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1，然后通过 panda CLI 创建团队。'}
      </p>
      <button
        onClick={onOpenSettings}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[image:var(--pd-gradient-btn-primary)] text-[var(--pd-color-btn-primary-fg)] shadow-[var(--pd-shadow-button-primary)] text-xs font-semibold uppercase tracking-wider hover:brightness-105 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-sm">settings</span>
        前往 Settings → Panda Env
      </button>
    </div>
  );
}

// ─── Sub: 团队详情视图 ────────────────────────────────────────────

function TeamDetailView({
  name,
  onBack,
}: {
  name: string;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTeamDetail(name)
      .then((d) => {
        if (cancelled) return;
        setDetail(d);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [name, refreshTick]);

  const stats = useMemo(() => {
    if (!detail) return null;
    return {
      memberCount: detail.memberCount,
      activeMembers: detail.activeMembers,
      totalMessages: totalMessages(detail.inboxes),
      lastActiveAt: detail.lastActiveAt,
    };
  }, [detail]);

  return (
    <div
      className="flex-1 flex flex-col relative overflow-hidden bg-[var(--pd-color-surface)] text-[var(--pd-color-text-primary)]"
      style={{ fontFamily: 'var(--pd-font-body)' }}
    >
      <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto w-full">
        {/* Header */}
        <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full border border-[var(--pd-color-border)] hover:bg-[var(--pd-color-surface-hover)] text-[var(--pd-color-text-secondary)] transition-colors"
              title="返回"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </button>
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold text-[var(--pd-color-text-primary)] mb-1 break-all"
                style={{ fontFamily: 'var(--pd-font-headline)' }}
                title={name}
              >
                {name}
              </h1>
              <p className="text-xs text-[var(--pd-color-text-tertiary)] font-mono">
                ~/.pandacc/teams/{name}
              </p>
            </div>
          </div>
          <button
            onClick={() => setRefreshTick((n) => n + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--pd-color-border)] text-xs font-semibold text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)] transition-colors"
            title="刷新"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            刷新
          </button>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[var(--pd-color-text-tertiary)]">
            <span className="material-symbols-outlined animate-pulse-subtle mr-2">
              sync
            </span>
            加载团队详情…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[var(--pd-color-error)]/40 bg-[var(--pd-color-error-container)]/30 p-6 text-sm text-[var(--pd-color-error)]">
            加载失败：{error}
          </div>
        ) : !detail ? (
          <div className="rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] p-10 text-center text-sm text-[var(--pd-color-text-tertiary)]">
            团队不存在或已被删除。
          </div>
        ) : (
          <>
            {/* Stats grid */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  icon="groups"
                  label="成员总数"
                  value={String(stats.memberCount)}
                />
                <StatCard
                  icon="bolt"
                  label="活跃"
                  value={String(stats.activeMembers)}
                  accent={stats.activeMembers > 0 ? 'success' : 'muted'}
                />
                <StatCard
                  icon="forum"
                  label="总消息数"
                  value={String(stats.totalMessages)}
                />
                <StatCard
                  icon="schedule"
                  label="最近活动"
                  value={formatRelativeTime(stats.lastActiveAt)}
                />
              </div>
            )}

            {/* Inboxes list */}
            <section>
              <h2
                className="text-sm font-semibold text-[var(--pd-color-text-secondary)] uppercase tracking-wider mb-3"
                style={{ fontFamily: 'var(--pd-font-headline)' }}
              >
                Inboxes ({detail.inboxes.length})
              </h2>
              {detail.inboxes.length === 0 ? (
                <div className="rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] p-8 text-center text-sm text-[var(--pd-color-text-tertiary)]">
                  该团队暂无 inbox 文件。
                </div>
              ) : (
                <div className="space-y-2">
                  {detail.inboxes.map((inbox) => (
                    <InboxRow
                      key={inbox.name}
                      inbox={inbox}
                      expanded={expandedAgent === inbox.name}
                      onToggle={() =>
                        setExpandedAgent((prev) =>
                          prev === inbox.name ? null : inbox.name,
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub: 统计卡 ──────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent = 'default',
}: {
  icon: string;
  label: string;
  value: string;
  accent?: 'default' | 'success' | 'muted';
}) {
  const accentClass =
    accent === 'success'
      ? 'text-[var(--pd-color-success)]'
      : accent === 'muted'
      ? 'text-[var(--pd-color-text-tertiary)]'
      : 'text-[var(--pd-color-text-primary)]';

  return (
    <div className="rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-[10px] font-semibold text-[var(--pd-color-text-tertiary)] uppercase tracking-wider">
        <span className="material-symbols-outlined text-sm">{icon}</span>
        {label}
      </div>
      <div
        className={`text-xl font-bold ${accentClass}`}
        style={{ fontFamily: 'var(--pd-font-headline)' }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Sub: Inbox 行（点击展开看内容） ──────────────────────────────

function InboxRow({
  inbox,
  expanded,
  onToggle,
}: {
  inbox: AgentInbox;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isActive = Date.now() - new Date(inbox.mtime).getTime() < 5 * 60 * 1000;

  return (
    <div className="rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-[var(--pd-color-surface-hover)] transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isActive
                ? 'bg-[var(--pd-color-success)] animate-pulse-subtle shadow-[0_0_6px_rgba(126,219,139,0.6)]'
                : 'bg-[var(--pd-color-text-tertiary)]/40'
            }`}
          />
          <span
            className="font-mono text-sm font-semibold text-[var(--pd-color-text-primary)] truncate"
            title={inbox.name}
          >
            {inbox.name}
          </span>
          {typeof inbox.messageCount === 'number' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--pd-color-surface-container-high)] text-[10px] font-semibold text-[var(--pd-color-text-secondary)]">
              <span className="material-symbols-outlined text-[10px]">forum</span>
              {inbox.messageCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--pd-color-text-tertiary)]">
          <span>{formatBytes(inbox.size)}</span>
          <span>{formatRelativeTime(inbox.mtime)}</span>
          <span
            className="material-symbols-outlined text-sm transition-transform"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            expand_more
          </span>
        </div>
      </button>
      {expanded && <InboxContent inbox={inbox} />}
    </div>
  );
}

// ─── Sub: Inbox 内容展开 ─────────────────────────────────────────

function InboxContent({ inbox }: { inbox: AgentInbox }) {
  // 兼容三种 schema：直接数组、{messages: []}、{entries: []}
  const messages = useMemo(() => {
    if (Array.isArray(inbox.content)) return inbox.content;
    if (inbox.content && typeof inbox.content === 'object') {
      const obj = inbox.content as Record<string, unknown>;
      if (Array.isArray(obj.messages)) return obj.messages;
      if (Array.isArray(obj.entries)) return obj.entries;
      if (Array.isArray(obj.inbox)) return obj.inbox;
    }
    return null;
  }, [inbox.content]);

  if (inbox.content === null) {
    return (
      <div className="border-t border-[var(--pd-color-border)] p-4 text-xs text-[var(--pd-color-error)]">
        JSON 解析失败 — 文件可能损坏或非 JSON 格式。
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="border-t border-[var(--pd-color-border)] p-4 bg-[var(--pd-color-surface-container)] font-mono text-[11px] text-[var(--pd-color-text-tertiary)] overflow-x-auto">
        <pre className="whitespace-pre-wrap break-all">
          {JSON.stringify(inbox.content, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container)] divide-y divide-[var(--pd-color-border)]">
      {messages.slice(0, 50).map((msg, idx) => (
        <MessageRow key={idx} index={idx} msg={msg} />
      ))}
      {messages.length > 50 && (
        <div className="p-3 text-[11px] text-[var(--pd-color-text-tertiary)] text-center">
          仅显示前 50 / {messages.length} 条
        </div>
      )}
    </div>
  );
}

function MessageRow({ index, msg }: { index: number; msg: unknown }) {
  if (!msg || typeof msg !== 'object') {
    return (
      <div className="p-3 font-mono text-[11px] text-[var(--pd-color-text-tertiary)]">
        [{index}] {String(msg)}
      </div>
    );
  }

  const obj = msg as Record<string, unknown>;
  const from = typeof obj.from === 'string' ? obj.from : null;
  const text = typeof obj.text === 'string' ? obj.text : null;
  const timestamp = typeof obj.timestamp === 'string' ? obj.timestamp : null;
  const summary = typeof obj.summary === 'string' ? obj.summary : null;
  const read = typeof obj.read === 'boolean' ? obj.read : null;

  return (
    <div className="p-3 hover:bg-[var(--pd-color-surface-hover)] transition-colors">
      <div className="flex items-center gap-2 mb-1.5 text-[11px]">
        <span className="font-semibold text-[var(--pd-color-text-primary)]">
          [{index}]
        </span>
        {from && (
          <span className="px-1.5 py-0.5 rounded bg-[var(--pd-color-primary-fixed)]/20 text-[var(--pd-color-brand)] font-mono">
            {from}
          </span>
        )}
        {timestamp && (
          <span className="text-[var(--pd-color-text-tertiary)] font-mono">
            {new Date(timestamp).toLocaleString('zh-CN', {
              hour12: false,
            })}
          </span>
        )}
        {read === false && (
          <span className="px-1.5 py-0.5 rounded-full bg-[var(--pd-color-warning)]/20 text-[var(--pd-color-warning)] text-[10px] font-semibold">
            未读
          </span>
        )}
      </div>
      {summary && (
        <div className="mb-1.5 text-[12px] text-[var(--pd-color-text-secondary)] italic">
          {summary}
        </div>
      )}
      {text && (
        <pre className="font-mono text-[11px] text-[var(--pd-color-text-primary)] whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
          {text}
        </pre>
      )}
      {!text && !summary && (
        <pre className="font-mono text-[11px] text-[var(--pd-color-text-tertiary)] whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
          {JSON.stringify(obj, null, 2)}
        </pre>
      )}
    </div>
  );
}
