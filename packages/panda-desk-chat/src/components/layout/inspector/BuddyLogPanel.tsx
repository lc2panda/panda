// Input: buddyStore state (level, xp, milestones, events, stats)
// Output: Inspector panel showing buddy level, XP bar, milestones, event timeline, stats
// Pos: PdInspector > buddyLog tab content area
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useBuddyStore } from '../../../stores/buddyStore';
import type { BuddyEvent, BuddyMilestone } from '../../../stores/buddyStore';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  return `${MM}-${DD} ${hh}:${mm}`;
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function XPBar({ xp, xpToNextLevel, level }: { xp: number; xpToNextLevel: number; level: number }) {
  const pct = xpToNextLevel > 0 ? Math.min((xp / xpToNextLevel) * 100, 100) : 0;
  return (
    <div style={{ padding: '12px', borderBottom: '1px solid var(--pd-color-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 'var(--pd-text-base)', fontWeight: 600 }}>
          Lv.{level}
        </span>
        <span style={{ fontSize: 'var(--pd-text-xs)', color: 'var(--pd-color-fg-muted)' }}>
          {xp} / {xpToNextLevel} XP
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: 'var(--pd-color-bg-hover)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 3,
            background: 'var(--pd-color-accent, #22c55e)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

function MilestoneRow({ m }: { m: BuddyMilestone }) {
  const pct = m.threshold > 0 ? Math.min((m.current / m.threshold) * 100, 100) : 0;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 0',
        opacity: m.achieved ? 1 : 0.7,
      }}
    >
      <span style={{ fontSize: 'var(--pd-text-sm)', width: 20, textAlign: 'center' }}>
        {m.achieved ? '\u2705' : '\u{1F4CB}'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--pd-text-sm)', fontWeight: 500 }}>
          {m.name}
        </div>
        <div style={{ fontSize: 'var(--pd-text-xs)', color: 'var(--pd-color-fg-muted)' }}>
          {m.description}
        </div>
        {!m.achieved && (
          <div
            style={{
              marginTop: 3,
              height: 3,
              borderRadius: 2,
              background: 'var(--pd-color-bg-hover)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                borderRadius: 2,
                background: 'var(--pd-color-accent, #22c55e)',
              }}
            />
          </div>
        )}
        {!m.achieved && (
          <div style={{ fontSize: 'var(--pd-text-2xs, 10px)', color: 'var(--pd-color-fg-muted)', marginTop: 2 }}>
            {m.current} / {m.threshold}
          </div>
        )}
      </div>
    </div>
  );
}

function EventRow({ e }: { e: BuddyEvent }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '6px 0',
        borderBottom: '1px solid var(--pd-color-border)',
      }}
    >
      <span style={{ fontSize: 'var(--pd-text-base)' }}>{e.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--pd-text-sm)', fontWeight: 500 }}>{e.title}</div>
        <div style={{ fontSize: 'var(--pd-text-xs)', color: 'var(--pd-color-fg-muted)' }}>
          {e.description}
        </div>
        <div style={{ fontSize: 'var(--pd-text-2xs, 10px)', color: 'var(--pd-color-fg-subtle, #888)', marginTop: 2 }}>
          {formatTime(e.timestamp)}
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
      <span style={{ fontSize: 'var(--pd-text-xs)', color: 'var(--pd-color-fg-muted)' }}>{label}</span>
      <span style={{ fontSize: 'var(--pd-text-xs)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Panel                                                                */
/* -------------------------------------------------------------------------- */

export function BuddyLogPanel() {
  const level = useBuddyStore((s) => s.level);
  const xp = useBuddyStore((s) => s.xp);
  const xpToNextLevel = useBuddyStore((s) => s.xpToNextLevel);
  const milestones = useBuddyStore((s) => s.milestones);
  const events = useBuddyStore((s) => s.events);
  const stats = useBuddyStore((s) => s.stats);

  // Events in reverse chronological order
  const recentEvents = [...events].reverse().slice(0, 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* XP Bar */}
      <XPBar xp={xp} xpToNextLevel={xpToNextLevel} level={level} />

      {/* Stats summary */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--pd-color-border)' }}>
        <div style={{ fontSize: 'var(--pd-text-xs)', fontWeight: 600, marginBottom: 4, color: 'var(--pd-color-fg-muted)' }}>
          统计
        </div>
        <StatItem label="总消息数" value={stats.totalMessages} />
        <StatItem label="工具调用" value={stats.totalToolCalls} />
        <StatItem label="代码行数" value={stats.totalCodeLines} />
        <StatItem label="连续天数" value={stats.consecutiveDays} />
        <StatItem label="工具种类" value={Object.keys(stats.firstToolUse).length} />
      </div>

      {/* Milestones */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--pd-color-border)' }}>
        <div style={{ fontSize: 'var(--pd-text-xs)', fontWeight: 600, marginBottom: 4, color: 'var(--pd-color-fg-muted)' }}>
          里程碑
        </div>
        {milestones.map((m) => (
          <MilestoneRow key={m.id} m={m} />
        ))}
      </div>

      {/* Event timeline */}
      <div style={{ padding: '8px 12px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 'var(--pd-text-xs)', fontWeight: 600, marginBottom: 4, color: 'var(--pd-color-fg-muted)' }}>
          事件时间线
        </div>
        {recentEvents.length === 0 ? (
          <div style={{ fontSize: 'var(--pd-text-xs)', color: 'var(--pd-color-fg-muted)', textAlign: 'center', paddingTop: 20 }}>
            暂无事件
          </div>
        ) : (
          recentEvents.map((e) => <EventRow key={e.id} e={e} />)
        )}
      </div>
    </div>
  );
}
