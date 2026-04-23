// Input: buddyStore (level, xp, stats, events), petAvatar species 列表
// Output: 宠物状态面板 — 等级/XP 进度条、状态图标、装扮库预览、累计互动
// Pos: PdInspector > petState tab 内容区
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useMemo } from 'react';
import { useBuddyStore } from '../../../stores/buddyStore';
import { type PetSpecies } from '../../special/PdPetAvatar';

/* -------------------------------------------------------------------------- */
/*  Status definitions                                                        */
/* -------------------------------------------------------------------------- */

type PetStatus = 'idle' | 'thinking' | 'working' | 'sleeping' | 'error';

const STATUS_CONFIG: Record<PetStatus, { icon: string; label: string; color: string }> = {
  idle: { icon: '\u{1F43C}', label: '闲置', color: 'var(--pd-color-fg-muted)' },
  thinking: { icon: '\u{1F914}', label: '思考中', color: '#f59e0b' },
  working: { icon: '\u{1F528}', label: '工作中', color: '#22c55e' },
  sleeping: { icon: '\u{1F634}', label: '休眠', color: '#6366f1' },
  error: { icon: '\u{26A0}\u{FE0F}', label: '异常', color: '#ef4444' },
};

/* -------------------------------------------------------------------------- */
/*  Species catalog — 14 species from PdPetAvatar                             */
/* -------------------------------------------------------------------------- */

interface SpeciesInfo {
  id: PetSpecies;
  emoji: string;
  name: string;
}

const SPECIES_CATALOG: SpeciesInfo[] = [
  { id: 'panda', emoji: '\u{1F43C}', name: '熊猫' },
  { id: 'cat', emoji: '\u{1F431}', name: '猫咪' },
  { id: 'dog', emoji: '\u{1F436}', name: '小狗' },
  { id: 'fox', emoji: '\u{1F98A}', name: '狐狸' },
  { id: 'rabbit', emoji: '\u{1F430}', name: '兔子' },
  { id: 'bear', emoji: '\u{1F43B}', name: '熊' },
  { id: 'owl', emoji: '\u{1F989}', name: '猫头鹰' },
  { id: 'penguin', emoji: '\u{1F427}', name: '企鹅' },
  { id: 'koala', emoji: '\u{1F428}', name: '考拉' },
  { id: 'hamster', emoji: '\u{1F439}', name: '仓鼠' },
  { id: 'deer', emoji: '\u{1F98C}', name: '小鹿' },
  { id: 'wolf', emoji: '\u{1F43A}', name: '狼' },
  { id: 'dragon', emoji: '\u{1F409}', name: '龙' },
  { id: 'phoenix', emoji: '\u{1F985}', name: '凤凰' },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function inferStatus(stats: { totalMessages: number; totalToolCalls: number }): PetStatus {
  // Very basic heuristic — real implementation would read live agent state
  if (stats.totalMessages === 0 && stats.totalToolCalls === 0) return 'sleeping';
  return 'idle';
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function XPBar({ xp, xpToNextLevel }: { xp: number; xpToNextLevel: number }) {
  const pct = xpToNextLevel > 0 ? Math.min(100, Math.round((xp / xpToNextLevel) * 100)) : 0;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[var(--pd-color-fg-muted)]">
          XP {xp} / {xpToNextLevel}
        </span>
        <span className="text-[10px] text-[var(--pd-color-fg-muted)]">{pct}%</span>
      </div>
      <div
        className="h-2 w-full rounded-full overflow-hidden"
        style={{ background: 'var(--pd-color-bg-hover)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: 'var(--pd-color-accent, #22c55e)',
            minWidth: pct > 0 ? '4px' : '0',
          }}
        />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="flex items-center justify-between py-1.5"
      style={{ borderBottom: '1px solid var(--pd-color-border)' }}
    >
      <span className="text-xs text-[var(--pd-color-fg-muted)]">{label}</span>
      <span className="text-xs font-medium text-[var(--pd-color-fg)]">{value}</span>
    </div>
  );
}

function SpeciesGrid({ currentSpecies }: { currentSpecies: PetSpecies }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {SPECIES_CATALOG.map((sp) => {
        const isCurrent = sp.id === currentSpecies;
        return (
          <div
            key={sp.id}
            className="flex flex-col items-center gap-0.5 rounded-lg p-1.5 transition-colors"
            style={{
              background: isCurrent ? 'var(--pd-color-accent, #22c55e)' : 'transparent',
              border: isCurrent ? 'none' : '1px solid var(--pd-color-border)',
            }}
            title={sp.name}
          >
            <span className="text-lg leading-none">{sp.emoji}</span>
            <span
              className="text-[9px] leading-none"
              style={{ color: isCurrent ? '#fff' : 'var(--pd-color-fg-muted)' }}
            >
              {sp.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Panel                                                                */
/* -------------------------------------------------------------------------- */

export function PetStatePanel() {
  const level = useBuddyStore((s) => s.level);
  const xp = useBuddyStore((s) => s.xp);
  const xpToNextLevel = useBuddyStore((s) => s.xpToNextLevel);
  const stats = useBuddyStore((s) => s.stats);
  const events = useBuddyStore((s) => s.events);

  // Currently always panda — future: read from buddyStore
  const currentSpecies: PetSpecies = 'panda';

  const status = useMemo(() => inferStatus(stats), [stats]);
  const statusCfg = STATUS_CONFIG[status];

  const totalInteractions = stats.totalMessages + stats.totalToolCalls;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-3 pb-1">
        <h3 className="text-sm font-semibold text-[var(--pd-fg)]">宠物状态</h3>
      </div>
      <div className="mx-4 border-t border-[var(--pd-color-border)]" />

      {/* Status card */}
      <div className="px-4 pt-3 pb-2">
        <div
          className="flex items-center gap-3 rounded-lg p-3"
          style={{ background: 'var(--pd-color-bg-hover)' }}
        >
          <span className="text-3xl">{statusCfg.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: statusCfg.color }}>
                {statusCfg.label}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  background: 'var(--pd-color-accent, #22c55e)',
                  color: '#fff',
                }}
              >
                Lv.{level}
              </span>
            </div>
            <div className="mt-2">
              <XPBar xp={xp} xpToNextLevel={xpToNextLevel} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-2">
        <h4 className="mb-1 text-xs font-semibold text-[var(--pd-color-fg-muted)]">统计</h4>
        <StatRow label="累计互动" value={totalInteractions} />
        <StatRow label="总消息数" value={stats.totalMessages} />
        <StatRow label="工具调用" value={stats.totalToolCalls} />
        <StatRow label="代码行数" value={stats.totalCodeLines} />
        <StatRow label="连续天数" value={stats.consecutiveDays} />
        <StatRow label="事件记录" value={events.length} />
      </div>

      {/* Species catalog */}
      <div className="px-4 py-2">
        <h4 className="mb-2 text-xs font-semibold text-[var(--pd-color-fg-muted)]">
          装扮库 ({SPECIES_CATALOG.length} 物种)
        </h4>
        <SpeciesGrid currentSpecies={currentSpecies} />
      </div>

      {/* Bottom padding */}
      <div className="h-4 shrink-0" />
    </div>
  );
}
