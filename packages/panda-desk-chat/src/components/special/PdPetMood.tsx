// Input: mood prop (PetMoodState) or auto-derived from usePetMood hook; size prop
// Output: Animated emoji avatar with mood-specific color glow and CSS animation
// Pos: Special layer — compact mood indicator for StatusBar and inline displays

import React, { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { usePetMood, PET_MOOD_MAP } from '@/hooks/usePetMood';
import type { PetMoodState, PetMoodConfig } from '@/hooks/usePetMood';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface PdPetMoodProps {
  /** Override auto-detected mood. When omitted, derives from chatStore + buddyStore. */
  mood?: PetMoodState;
  /** Display size. xs = 20x20 (StatusBar), sm = 28, md = 36, lg = 48. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show the mood label text beside the emoji. */
  showLabel?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Size config                                                               */
/* -------------------------------------------------------------------------- */

const SIZE_MAP: Record<string, { container: string; fontSize: string }> = {
  xs: { container: 'w-5 h-5', fontSize: '12px' },
  sm: { container: 'w-7 h-7', fontSize: '16px' },
  md: { container: 'w-9 h-9', fontSize: '22px' },
  lg: { container: 'w-12 h-12', fontSize: '30px' },
};

/* -------------------------------------------------------------------------- */
/*  CSS Keyframes (injected once via <style>)                                  */
/* -------------------------------------------------------------------------- */

const KEYFRAMES_ID = 'pd-pet-mood-keyframes';

const KEYFRAMES_CSS = `
@keyframes pd-pet-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
@keyframes pd-pet-headshake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}
@keyframes pd-pet-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes pd-pet-tremble {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
@keyframes pd-pet-bounce {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
  60% { transform: translateY(-3px); }
}
`;

const ANIMATION_DURATIONS: Record<string, string> = {
  'pd-pet-breathe': '3s ease-in-out infinite',
  'pd-pet-headshake': '1s ease-in-out infinite',
  'pd-pet-blink': '0.5s step-end infinite',
  'pd-pet-tremble': '0.3s ease-in-out infinite',
  'pd-pet-bounce': '0.5s ease-out infinite',
};

/* -------------------------------------------------------------------------- */
/*  Style injector                                                            */
/* -------------------------------------------------------------------------- */

let keyframesInjected = false;

function ensureKeyframes(): void {
  if (keyframesInjected) return;
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) {
    keyframesInjected = true;
    return;
  }
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = KEYFRAMES_CSS;
  document.head.appendChild(style);
  keyframesInjected = true;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * PdPetMood — animated mood indicator.
 *
 * Can operate in two modes:
 * - **Auto mode** (default): reads mood from `usePetMood()` hook.
 * - **Controlled mode**: pass `mood` prop to override.
 */
export const PdPetMood = forwardRef<HTMLDivElement, PdPetMoodProps>(
  ({ mood: moodProp, size = 'md', showLabel = false, className }, ref) => {
    // Inject keyframes on first render
    ensureKeyframes();

    // Auto-derive mood when prop not provided
    const auto = usePetMood();
    const resolvedMood: PetMoodState = moodProp ?? auto.mood;
    const config: PetMoodConfig = PET_MOOD_MAP[resolvedMood];
    const s = SIZE_MAP[size] ?? SIZE_MAP.md;

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1',
          className,
        )}
        data-mood={resolvedMood}
        title={config.label}
      >
        {/* Emoji container with animation */}
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full select-none',
            s.container,
          )}
          style={{
            fontSize: s.fontSize,
            lineHeight: 1,
            animation: ANIMATION_DURATIONS[config.animation] ?? 'none',
            boxShadow: `0 0 8px ${config.color}33`,
          }}
          role="img"
          aria-label={`Pet mood: ${config.label}`}
        >
          {config.emoji}
        </span>

        {/* Optional label */}
        {showLabel && (
          <span
            className="text-[10px] font-medium"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        )}
      </div>
    );
  },
);

PdPetMood.displayName = 'PdPetMood';

/* -------------------------------------------------------------------------- */
/*  Re-exports for convenience                                                */
/* -------------------------------------------------------------------------- */

export type { PetMoodState, PetMoodConfig };
