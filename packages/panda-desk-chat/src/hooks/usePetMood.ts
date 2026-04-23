// Input: chatStore session state (chatState, toolCalls, errors), buddyStore events
// Output: Derived PetMood string with debounce — drives PdPetMood animation
// Pos: Hooks layer — bridges store state to pet mood display component

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useBuddyStore } from '@/stores/buddyStore';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type PetMoodState = 'idle' | 'thinking' | 'coding' | 'error' | 'celebrating';

export interface PetMoodConfig {
  emoji: string;
  color: string;
  animation: string;
  label: string;
}

export const PET_MOOD_MAP: Record<PetMoodState, PetMoodConfig> = {
  idle: {
    emoji: '\u{1F60A}',        // 😊
    color: 'var(--pd-color-fg-muted)',
    animation: 'pd-pet-breathe',
    label: 'Idle',
  },
  thinking: {
    emoji: '\u{1F914}',        // 🤔
    color: '#5b8dd9',
    animation: 'pd-pet-headshake',
    label: 'Thinking',
  },
  coding: {
    emoji: '\u{1F4BB}',        // 💻
    color: '#5a9e6f',
    animation: 'pd-pet-blink',
    label: 'Coding',
  },
  error: {
    emoji: '\u{1F635}',        // 😵
    color: '#dc2626',
    animation: 'pd-pet-tremble',
    label: 'Error',
  },
  celebrating: {
    emoji: '\u{1F389}',        // 🎉
    color: '#f59e0b',
    animation: 'pd-pet-bounce',
    label: 'Celebrating',
  },
};

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const ERROR_DISPLAY_MS = 5_000;
const CELEBRATING_DISPLAY_MS = 3_000;
/** Minimum time between mood transitions to prevent flicker */
const DEBOUNCE_MS = 300;

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Derives the current pet mood from chat + buddy store state.
 *
 * Priority (high → low):
 *   1. celebrating — buddy event within last 3 s
 *   2. error       — last tool call errored within last 5 s
 *   3. coding      — a tool is currently executing
 *   4. thinking    — assistant is streaming / thinking
 *   5. idle        — default
 *
 * Includes 300 ms debounce to prevent rapid flicker between states.
 */
export function usePetMood(): { mood: PetMoodState; config: PetMoodConfig } {
  const [mood, setMood] = useState<PetMoodState>('idle');
  const lastChangeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Store selectors (shallow) ---
  const activeSession = useChatStore((s) => s.getActiveSession());
  const buddyEvents = useBuddyStore((s) => s.events);

  const chatState = activeSession?.chatState ?? 'idle';
  const messages = activeSession?.messages;

  // Derive raw mood (no debounce)
  const deriveRawMood = useCallback((): PetMoodState => {
    const now = Date.now();

    // 1. Celebrating — any buddy event within CELEBRATING_DISPLAY_MS
    if (buddyEvents.length > 0) {
      const latest = buddyEvents[buddyEvents.length - 1];
      if (now - latest.timestamp < CELEBRATING_DISPLAY_MS) {
        return 'celebrating';
      }
    }

    // 2. Error — most recent tool call is an error within ERROR_DISPLAY_MS
    if (messages && messages.length > 0) {
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role !== 'assistant' || !msg.toolCalls) continue;
        for (let j = msg.toolCalls.length - 1; j >= 0; j--) {
          const tc = msg.toolCalls[j];
          if (tc.isError && tc.status === 'error') {
            // Use message timestamp as proxy (tool calls don't have their own timestamp)
            if (now - msg.timestamp < ERROR_DISPLAY_MS) {
              return 'error';
            }
          }
          // Only check the most recent tool call
          break;
        }
        break;
      }
    }

    // 3. Coding — tool is currently executing
    if (chatState === 'tool_executing') {
      return 'coding';
    }

    // 4. Thinking — streaming or thinking
    if (chatState === 'streaming' || chatState === 'thinking') {
      return 'thinking';
    }

    // 5. Default
    return 'idle';
  }, [chatState, messages, buddyEvents]);

  // Debounced mood update
  useEffect(() => {
    const rawMood = deriveRawMood();
    if (rawMood === mood) return;

    const now = Date.now();
    const elapsed = now - lastChangeRef.current;

    if (elapsed >= DEBOUNCE_MS) {
      // Enough time has passed — update immediately
      setMood(rawMood);
      lastChangeRef.current = now;
    } else {
      // Schedule update after remaining debounce time
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setMood(rawMood);
        lastChangeRef.current = Date.now();
        timerRef.current = null;
      }, DEBOUNCE_MS - elapsed);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [deriveRawMood, mood]);

  // Re-evaluate periodically for time-based transitions (error/celebrating decay)
  useEffect(() => {
    const interval = setInterval(() => {
      const rawMood = deriveRawMood();
      if (rawMood !== mood) {
        setMood(rawMood);
        lastChangeRef.current = Date.now();
      }
    }, 1_000);
    return () => clearInterval(interval);
  }, [deriveRawMood, mood]);

  return { mood, config: PET_MOOD_MAP[mood] };
}
