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
    <div
      className={cn(
        'mx-auto my-3 max-w-[820px] px-1',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
          'bg-[var(--pd-color-bg-subtle)] border border-[var(--pd-color-border-subtle)]',
          'text-[12px] font-[var(--pd-font-medium)] text-[var(--pd-color-fg-muted)] select-none',
        )}
      >
        <span className="inline-flex items-center gap-1" aria-hidden="true">
          <span className="pd-thinking-dot" />
          <span className="pd-thinking-dot" />
          <span className="pd-thinking-dot" />
        </span>
        <span>{verb || '正在思考'}</span>
        <span className="text-[var(--pd-color-fg-subtle)]">·</span>
        <span className="font-[family-name:var(--pd-font-mono)] tabular-nums">{elapsedDisplay}</span>
        {tokens !== undefined && tokens > 0 && (
          <>
            <span className="text-[var(--pd-color-fg-subtle)]">·</span>
            <span className="font-[family-name:var(--pd-font-mono)] tabular-nums">
              {tokens.toLocaleString()} tok
            </span>
          </>
        )}
      </span>
    </div>
  );
};

PdStreamingIndicator.displayName = "PdStreamingIndicator";
