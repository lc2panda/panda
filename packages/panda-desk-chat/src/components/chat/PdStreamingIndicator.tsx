// Input: Streaming state (verb, elapsed time, token count)
// Output: Animated pill indicating active generation with 3-dot pulse
// Pos: Chat layer — visual feedback for streaming responses
import React from "react";
import { cn } from "../../lib/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface PdStreamingIndicatorProps {
  verb: string;       // "Thinking" | "Writing" | "Running bash"
  elapsed: number;    // seconds
  tokens?: number;    // generated token count
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatElapsed(s: number): string {
  if (s < 60) return `${Math.floor(s)}s`;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}m ${sec}s`;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const PdStreamingIndicator: React.FC<PdStreamingIndicatorProps> = ({
  verb,
  elapsed,
  tokens,
  className,
}) => {
  const elapsedDisplay = formatElapsed(elapsed);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full",
        "bg-[var(--pd-color-bg-float)] text-[var(--pd-color-fg-muted)]",
        "text-xs font-medium select-none",
        className,
      )}
    >
      {/* Shimmer cursor (original) */}
      <span className="inline-block w-2 h-4 rounded-sm bg-[var(--pd-color-accent)] animate-pulse" />

      {/* 3-dot pulse — uses pd-pulse-dot keyframe from global.css */}
      <span className="inline-flex items-center gap-1" aria-hidden="true">
        <span className="pd-thinking-dot" />
        <span className="pd-thinking-dot" />
        <span className="pd-thinking-dot" />
      </span>

      <span className="text-[var(--pd-color-fg-muted)]">
        正在输入...
      </span>

      <span className="text-[var(--pd-color-accent-fg)] opacity-70">
        {verb} · {elapsedDisplay}
      </span>

      {tokens !== undefined && tokens > 0 && (
        <span className="text-[var(--pd-color-accent-fg)] opacity-70">
          {tokens.toLocaleString()} tokens
        </span>
      )}
    </span>
  );
};

PdStreamingIndicator.displayName = "PdStreamingIndicator";
