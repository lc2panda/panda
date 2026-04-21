// Input: Thinking content from assistant
// Output: Collapsible thinking block with preview
// Pos: Chat layer — displays model reasoning process
import React, { useState } from "react";
import { cn } from "../../lib/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface ThinkingBlockProps {
  content: string;
  isStreaming?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const PREVIEW_LENGTH = 60;

function preview(text: string): string {
  if (text.length <= PREVIEW_LENGTH) return text;
  return text.slice(0, PREVIEW_LENGTH) + "...";
}

/* -------------------------------------------------------------------------- */
/*  ThinkingBlock                                                             */
/* -------------------------------------------------------------------------- */

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  content,
  isStreaming = false,
  defaultExpanded = false,
  className,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className={cn(
        "rounded-[var(--pd-radius-md)]",
        "bg-[var(--pd-tool-thinking-bg)]",
        "border-l-2 border-[var(--pd-tool-thinking-border)]",
        "px-3 py-2",
        "transition-all duration-[var(--pd-duration-quick)]",
        className,
      )}
    >
      {/* Header — clickable toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center gap-[var(--pd-space-1\\.5)]",
          "cursor-pointer select-none bg-transparent border-none p-0",
          "text-[var(--pd-color-fg-muted)] text-[var(--pd-text-sm)]",
        )}
      >
        <span
          className={cn(
            "inline-block transition-transform duration-[var(--pd-duration-quick)]",
            expanded ? "rotate-90" : "rotate-0",
          )}
          aria-hidden="true"
        >
          ▶
        </span>
        <span>💭 Thinking</span>
      </button>

      {/* Body */}
      <div
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-[var(--pd-duration-quick)]",
          expanded ? "max-h-[2000px] opacity-100 mt-1" : "max-h-6 opacity-80 mt-0.5",
        )}
      >
        <p className="m-0 whitespace-pre-wrap text-[var(--pd-text-sm)] text-[var(--pd-color-fg-muted)]">
          {expanded ? content : preview(content)}
          {isStreaming && (
            <span className="animate-pulse ml-0.5">▊</span>
          )}
        </p>
      </div>
    </div>
  );
};

ThinkingBlock.displayName = "ThinkingBlock";
