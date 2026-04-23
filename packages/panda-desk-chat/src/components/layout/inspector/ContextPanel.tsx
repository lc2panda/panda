// Input: chatStore (active session tokenUsage, messages, elapsedSeconds), settingsStore (model)
// Output: 上下文概览面板 — token 用量、缓存命中率、模型、会话时长
// Pos: PdInspector > context tab 内容区

import { useChatStore, type PerSessionState, type TokenUsage } from '../../../stores/chatStore';
import { useSettingsStore } from '../../../stores/settingsStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m} 分 ${s} 秒` : `${m} 分钟`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h} 小时 ${rm} 分` : `${h} 小时`;
}

function cacheHitRate(usage: TokenUsage): number | null {
  const read = usage.cacheRead ?? 0;
  const write = usage.cacheWrite ?? 0;
  if (read + write === 0) return null;
  return Math.round((read / (read + write)) * 100);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatRowProps {
  label: string;
  value: string;
  sub?: boolean;
}

function StatRow({ label, value, sub }: StatRowProps) {
  return (
    <div className={`flex items-center justify-between py-1 ${sub ? 'pl-4' : ''}`}>
      <span className="text-xs text-[var(--pd-color-fg-muted)]">{label}</span>
      <span className="font-mono text-xs text-[var(--pd-color-fg)]">{value}</span>
    </div>
  );
}

interface ProgressBarProps {
  ratio: number; // 0..1
  label?: string;
}

function ProgressBar({ ratio, label }: ProgressBarProps) {
  const pct = Math.min(Math.max(ratio, 0), 1) * 100;
  return (
    <div className="mt-1 mb-2">
      {label && (
        <div className="mb-0.5 text-right font-mono text-[10px] text-[var(--pd-color-fg-muted)]">
          {label}
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--pd-color-bg-hover)]">
        <div
          className="h-full rounded-full bg-[var(--pd-color-accent)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const MAX_CONTEXT_TOKENS = 200_000;

export function ContextPanel() {
  const session: PerSessionState | null = useChatStore((s) => s.getActiveSession());
  const model = useSettingsStore((s) => s.model);

  const usage = session?.tokenUsage ?? { input: 0, output: 0 };
  const total = usage.input + usage.output;
  const hit = cacheHitRate(usage);
  const elapsed = session?.elapsedSeconds ?? 0;
  const msgCount = session?.messages.length ?? 0;
  const claudeMdCount = 3; // Static — actual CLAUDE.md file count not tracked in chatStore

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Title */}
      <h3 className="text-sm font-semibold text-[var(--pd-fg)]">上下文概览</h3>
      <div className="border-t border-[var(--pd-color-border)]" />

      {/* System prompt */}
      <StatRow label="系统提示词" value={session ? '已加载 \u2713' : '\u2014'} />
      <StatRow label="CLAUDE.md" value={`${claudeMdCount} 个文件`} />

      {/* Token usage */}
      <div className="border-t border-[var(--pd-color-border)] pt-2">
        <StatRow
          label="Token 用量"
          value={total > 0 ? `${formatNum(total)} / ${formatNum(MAX_CONTEXT_TOKENS)}` : '\u2014'}
        />
        <ProgressBar
          ratio={total / MAX_CONTEXT_TOKENS}
          label={total > 0 ? `${Math.round((total / MAX_CONTEXT_TOKENS) * 100)}%` : undefined}
        />
        <StatRow label="输入" value={usage.input > 0 ? formatNum(usage.input) : '\u2014'} sub />
        <StatRow label="输出" value={usage.output > 0 ? formatNum(usage.output) : '\u2014'} sub />
      </div>

      {/* Cache */}
      <div className="border-t border-[var(--pd-color-border)] pt-2">
        <StatRow label="缓存" value={hit !== null ? `命中 ${hit}%` : '\u2014'} />
        <StatRow
          label="创建"
          value={usage.cacheWrite ? `${formatNum(usage.cacheWrite)} tokens` : '\u2014'}
          sub
        />
        <StatRow
          label="读取"
          value={usage.cacheRead ? `${formatNum(usage.cacheRead)} tokens` : '\u2014'}
          sub
        />
      </div>

      {/* Meta */}
      <div className="border-t border-[var(--pd-color-border)] pt-2">
        <StatRow label="模型" value={model || '\u2014'} />
        <StatRow label="会话时长" value={elapsed > 0 ? formatDuration(elapsed) : '\u2014'} />
        <StatRow label="消息数" value={msgCount > 0 ? String(msgCount) : '\u2014'} />
        <StatRow
          label="状态"
          value={session?.chatState === 'idle' ? '空闲' :
                 session?.chatState === 'streaming' ? '生成中...' :
                 session?.chatState === 'thinking' ? '思考中...' :
                 session?.chatState === 'tool_executing' ? '工具执行中...' :
                 session?.chatState === 'permission_pending' ? '等待授权' :
                 '\u2014'}
        />
      </div>
    </div>
  );
}
