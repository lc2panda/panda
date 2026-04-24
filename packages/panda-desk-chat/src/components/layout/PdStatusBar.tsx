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
// Component
// ---------------------------------------------------------------------------
export function PdStatusBar({
  connectionState = 'connected',
}: PdStatusBarProps) {
  const { t } = useI18n();
  const connColor = connectionColors[connectionState];
  const connLabel = t(connectionI18nKeys[connectionState] as any);

  // cc-haha / Claude.ai 风格：无底部 StatusBar。仅保留一个右下角浮动连接
  // 指示点（绝对定位，不占 layout）。model/tokens/permission/buddy 各自归位
  // 到 Composer 或 Sidebar。
  return (
    <div
      aria-hidden={connectionState === 'connected'}
      className={cn(
        'pointer-events-none absolute bottom-2 right-3 z-10',
        'flex items-center gap-1.5',
        'text-[11px] text-[var(--pd-color-fg-muted)]',
        'select-none',
      )}
      title={connLabel}
    >
      <Circle
        size={7}
        fill={connColor}
        stroke="none"
        className={cn(
          (connectionState === 'connecting' || connectionState === 'error') && 'animate-pulse',
        )}
      />
      {connectionState !== 'connected' && <span>{connLabel}</span>}
    </div>
  );
}
