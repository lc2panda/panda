// Input: Streaming state (verb, elapsed time, token count)
// Output: Animated pill indicating active generation
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
/*  PdStreamingIndicator                                                     */
/* -------------------------------------------------------------------------- */

export const PdStreamingIndicator: React.FC<PdStreamingIndicatorProps> = ({
  verb,
  elapsed,
  tokens,
  className,
}) => {
  const elapsedDisplay = elapsed < 60
    ? `${elapsed}s`
    : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[var(--pd-space-1\\.5)]",
        "px-[var(--pd-space-3)] py-[var(--pd-space-1)]",
        "rounded-[var(--pd-radius-full)]",
        "bg-[var(--pd-color-accent-subtle)]",
        "text-[var(--pd-color-accent-fg)]",
        "text-[var(--pd-text-xs)]",
        "font-[var(--pd-font-medium)]",
        "select-none",
        "animate-[pd-streaming-shimmer_2s_ease-in-out_infinite]",
        className,
      )}
    >
      {/* Shimmer diamond */}
      <span className="text-[var(--pd-color-accent)]" aria-hidden="true">
        &#x27E1;
      </span>

      <span>{verb}...</span>
      <span className="text-[var(--pd-color-accent-fg)] opacity-70">
        {elapsedDisplay}
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
