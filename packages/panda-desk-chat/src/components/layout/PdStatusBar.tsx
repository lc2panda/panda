// Input: Model name, token counts, connection state, permission mode, DND flag, pet mood
// Output: Bottom status bar showing live session metadata with pet mood indicator
// Pos: Layout layer — bottom edge of center column, above PetStrip

import { type ComponentType } from 'react';
import { cn } from '@/lib/cn';
import { StatusBarChips } from './StatusBarChips';
import { PdPetMood } from '@/components/special/PdPetMood';
import { useBuddyStore } from '@/stores/buddyStore';
import { useI18n } from '@/hooks/useI18n';
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
export type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface PdStatusBarProps {
  model?: string;
  tokenCount?: { input: number; output: number };
  connectionState?: ConnectionState;
  permissionMode?: string;
  dnd?: boolean;
  /** Callback when pet mood/level badge is clicked (e.g. open Inspector petState tab) */
  onPetClick?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const connectionColors: Record<ConnectionState, string> = {
  connected:    'var(--pd-color-success)',
  disconnected: 'var(--pd-color-error)',
  connecting:   'var(--pd-color-warning)',
  error:        'var(--pd-color-error)',
};

const connectionI18nKeys: Record<ConnectionState, string> = {
  connected:    'statusbar.connection.connected',
  disconnected: 'statusbar.connection.disconnected',
  connecting:   'statusbar.connection.connecting',
  error:        'statusbar.connection.error',
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
  onPetClick,
}: PdStatusBarProps) {
  const { t } = useI18n();
  const connColor = connectionColors[connectionState];
  const connLabel = t(connectionI18nKeys[connectionState] as any);
  const buddyLevel = useBuddyStore((s) => s.level);

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
      {/* -- Left: pet mood + level + chips + model + tokens -- */}
      <div className="flex items-center gap-3">
        {/* Pet mood indicator + Level badge */}
        <button
          type="button"
          onClick={onPetClick}
          disabled={!onPetClick}
          title={`Buddy Lv.${buddyLevel} — ${onPetClick ? 'Click to inspect' : ''}`}
          className={cn(
            'flex items-center gap-1 rounded-[var(--pd-radius-sm)] px-0.5',
            onPetClick && 'cursor-pointer hover:bg-[var(--pd-color-bg-hover)] transition-colors',
            !onPetClick && 'cursor-default',
          )}
        >
          <PdPetMood size="xs" />
          <span
            className={cn(
              'rounded-full px-1.5 py-0 text-[10px] font-semibold',
              'bg-[var(--pd-pet-level-badge)] text-white',
            )}
            title={`Buddy Level ${buddyLevel}`}
          >
            Lv.{buddyLevel}
          </span>
        </button>

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
        <span className="flex items-center gap-1.5" title={connLabel}>
          <Circle
            size={8}
            fill={connColor}
            stroke="none"
            className={cn(
              (connectionState === 'connecting' || connectionState === 'error') && 'animate-pulse',
            )}
          />
          <span>{connLabel}</span>
        </span>

        {/* DND toggle */}
        <button
          type="button"
          title={dnd ? `${t('statusbar.dnd')} (on)` : `${t('statusbar.dnd')} (off)`}
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
