// Input: Model name, token counts, connection state, permission mode, DND flag
// Output: Bottom status bar showing live session metadata
// Pos: Layout layer — bottom edge of center column, above PetStrip

import { type ComponentType } from 'react';
import { cn } from '@/lib/cn';
import { StatusBarChips } from './StatusBarChips';
import {
  BellOff as _BellOff,
  Bell as _Bell,
  Circle as _Circle,
} from 'lucide-react';

// Re-type lucide icons for React 18 compat (hoisted @types/react@19 conflict)
type IconFC = ComponentType<{ className?: string; size?: number; fill?: string; stroke?: string }>;
const BellOff = _BellOff as IconFC;
const Bell = _Bell as IconFC;
const Circle = _Circle as IconFC;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ConnectionState = 'connected' | 'disconnected' | 'connecting';

export interface PdStatusBarProps {
  model?: string;
  tokenCount?: { input: number; output: number };
  connectionState?: ConnectionState;
  permissionMode?: string;
  dnd?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const connectionMeta: Record<ConnectionState, { color: string; label: string }> = {
  connected:    { color: 'var(--pd-color-success)',  label: 'Connected' },
  disconnected: { color: 'var(--pd-color-error)',    label: 'Disconnected' },
  connecting:   { color: 'var(--pd-color-warning)',  label: 'Connecting...' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PdStatusBar({
  model,
  tokenCount,
  connectionState = 'connected',
  permissionMode,
  dnd = false,
}: PdStatusBarProps) {
  const conn = connectionMeta[connectionState];

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between px-3',
        'border-t border-[var(--pd-color-border-subtle)]',
        'bg-[var(--pd-color-bg-subtle)]',
        'text-[length:var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]',
        'select-none',
      )}
      style={{ height: 'var(--pd-layout-statusbar-height)' }}
    >
      {/* -- Left: chips + model + tokens -- */}
      <div className="flex items-center gap-3">
        <StatusBarChips />

        {model && (
          <span
            className={cn(
              'rounded-[var(--pd-radius-sm)] px-1.5 py-0.5',
              'text-[var(--pd-color-fg-muted)]',
            )}
          >
            {model}
          </span>
        )}

        {tokenCount && (
          <span className="tabular-nums">
            {formatTokens(tokenCount.input)} in / {formatTokens(tokenCount.output)} out
          </span>
        )}
      </div>

      {/* -- Right: connection + DND -- */}
      <div className="flex items-center gap-3">
        {/* Connection indicator */}
        <span className="flex items-center gap-1.5" title={conn.label}>
          <Circle
            size={8}
            fill={conn.color}
            stroke="none"
            className={cn(
              connectionState === 'connecting' && 'animate-pulse',
            )}
          />
          <span>{conn.label}</span>
        </span>

        {/* Permission mode */}
        {permissionMode && (
          <span
            className={cn(
              'rounded-[var(--pd-radius-sm)] border border-[var(--pd-color-border-subtle)]',
              'px-1.5 py-0.5',
            )}
          >
            {permissionMode}
          </span>
        )}

        {/* DND toggle */}
        <button
          type="button"
          title={dnd ? 'Do Not Disturb (on)' : 'Notifications (on)'}
          className={cn(
            'rounded-[var(--pd-radius-sm)] p-0.5 transition-colors',
            'hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]',
          )}
        >
          {dnd ? <BellOff size={14} /> : <Bell size={14} />}
        </button>
      </div>
    </div>
  );
}
