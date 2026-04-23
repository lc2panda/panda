// Input: Thinking content from assistant
// Output: Collapsible thinking block with timing + pulse animation
// Pos: Chat layer — displays model reasoning process
import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface PdThinkingBlockProps {
  content: string;
  isStreaming?: boolean;
  defaultExpanded?: boolean;
  /** When true, the block is not rendered at all (summary mode). */
  forceCollapsed?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function preview(text: string, maxLen = 140): string {
  const oneLine = text.replace(/\n/g, " ").trim();
  return oneLine.length > maxLen ? `${oneLine.slice(0, maxLen)}…` : oneLine;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const PdThinkingBlock = React.memo(function PdThinkingBlock({
  content,
  isStreaming = false,
  defaultExpanded = false,
  forceCollapsed = false,
  className,
}: PdThinkingBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  /* -- Timing ------------------------------------------------------------ */
  const startTimeRef = useRef<number | null>(null);
  const [elapsedSecs, setElapsedSecs] = useState<number | null>(null);

  // Record start time when streaming begins
  useEffect(() => {
    if (isStreaming && startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
  }, [isStreaming]);

  // Calculate elapsed time when streaming ends
  useEffect(() => {
    if (!isStreaming && startTimeRef.current !== null) {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      setElapsedSecs(elapsed);
    }
  }, [isStreaming]);

  // Update elapsed time while streaming (live counter)
  useEffect(() => {
    if (!isStreaming) return;
    const timer = setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsedSecs(Math.round((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isStreaming]);

  if (forceCollapsed) return null;

  const headerLabel = isStreaming
    ? "思考中"
    : elapsedSecs !== null
      ? `思考了 ${elapsedSecs}s`
      : "思考";

  return (
    <div
      className={cn(
        "rounded-[var(--pd-radius-md)]",
        "border-l-2 border-[var(--pd-color-border-subtle)]",
        "bg-[var(--pd-color-bg-subtle)]",
        "overflow-hidden",
        className,
      )}
    >
      {/* Header / Toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center gap-[var(--pd-space-1\\.5)] px-3 py-2",
          "text-[var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]",
          "hover:bg-[var(--pd-color-bg-hover)]",
          "transition-colors duration-[var(--pd-duration-fast)]",
          "select-none cursor-pointer",
        )}
      >
        <span
          className={cn(
            "transition-transform duration-[var(--pd-duration-quick)]",
            expanded && "rotate-90",
          )}
        >
          ▸
        </span>
        <span className="font-[var(--pd-font-medium)]">{headerLabel}</span>
        {isStreaming && (
          <span className="inline-flex items-center gap-[3px] ml-1">
            <span className="pd-thinking-dot" />
            <span className="pd-thinking-dot" />
            <span className="pd-thinking-dot" />
          </span>
        )}
      </button>

      {/* Content */}
      <div
        className={cn(
          "px-3 pb-3",
          !expanded && "hidden",
        )}
      >
        <p className="whitespace-pre-wrap text-[var(--pd-text-sm)] text-[var(--pd-color-fg-muted)]">
          {expanded ? content : preview(content)}
          {isStreaming && (
            <span className="animate-pulse ml-0.5">▊</span>
          )}
        </p>
      </div>
    </div>
  );
});

PdThinkingBlock.displayName = "PdThinkingBlock";
