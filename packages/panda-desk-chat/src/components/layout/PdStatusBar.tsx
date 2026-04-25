// Input: Model name, token counts, connection state, permission mode, DND flag, pet mood
// Output: Bottom status bar showing live session metadata with pet mood indicator
// Pos: Layout layer — bottom edge of center column, above PetStrip

import { type ComponentType } from 'react';
import { cn } from '@/lib/cn';
import { useI18n } from '@/hooks/useI18n';
import { Circle as _Circle } from 'lucide-react';

// Re-type lucide icons for React 18 compat (hoisted @types/react@19 conflict)
type IconFC = ComponentType<{ className?: string; size?: number; fill?: string; stroke?: string }>;
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
// Component — cc-haha StatusBar spec: 36px height, JetBrains Mono 11px,
// border-top, justify-between, content: project | model
// ---------------------------------------------------------------------------
export function PdStatusBar({
  model,
  tokenCount,
  connectionState = 'connected',
}: PdStatusBarProps) {
  const { t } = useI18n();
  const connColor = connectionColors[connectionState];
  const connLabel = t(connectionI18nKeys[connectionState] as any);

  return (
    <div
      className={cn(
        'shrink-0 flex items-center justify-between',
        'h-[var(--pd-layout-statusbar-height)] px-4',
        'border-t border-[var(--pd-color-border)]',
        'bg-[var(--pd-color-bg-subtle)]',
        'text-[11px] text-[var(--pd-color-fg-muted)]',
        'font-[family-name:var(--pd-font-mono)] select-none',
      )}
    >
      {/* Left: connection dot + label */}
      <div className="flex items-center gap-2">
        <Circle
          size={8}
          fill={connColor}
          stroke="none"
          className={cn(
            (connectionState === 'connecting' || connectionState === 'error') && 'animate-pulse',
          )}
        />
        <span>{connLabel}</span>
      </div>

      {/* Right: model + tokens */}
      <div className="flex items-center gap-3">
        {model && <span className="text-[var(--pd-color-fg-tertiary)]">{model}</span>}
        {tokenCount && (tokenCount.input > 0 || tokenCount.output > 0) && (
          <span className="text-[var(--pd-color-fg-tertiary)]">
            ↑{formatTokens(tokenCount.input)} ↓{formatTokens(tokenCount.output)}
          </span>
        )}
      </div>
    </div>
  );
}
