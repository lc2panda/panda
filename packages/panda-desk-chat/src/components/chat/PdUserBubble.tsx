// Input: content string, timestamp number from UIMessage
// Output: Styled user message bubble with accent border and hover timestamp
// Pos: Chat layer — renders individual user turns inside MessageList
import React, { useState } from "react";
import { cn } from "../../lib/cn";

export interface PdUserBubbleProps {
  content: string;
  timestamp: number;
}

function formatRelativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const PdUserBubble: React.FC<PdUserBubbleProps> = React.memo(({
  content,
  timestamp,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative group",
        "border-l-2 border-l-[var(--pd-color-accent)]",
        "bg-[var(--pd-color-bg-elevated)]",
        "rounded-[var(--pd-radius-md)]",
        "px-4 py-3",
        "mb-[var(--pd-space-3)]",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <span
          className={cn(
            "absolute top-2 right-3",
            "text-[var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]",
            "select-none pointer-events-none",
            "animate-[pd-fade-in-up_150ms_var(--pd-ease-decelerate)]",
          )}
        >
          {formatRelativeTime(timestamp)}
        </span>
      )}
      <p
        className={cn(
          "text-[var(--pd-text-base)] text-[var(--pd-color-fg)]",
          "leading-[var(--pd-leading-body)]",
          "whitespace-pre-wrap break-words m-0",
        )}
      >
        {content}
      </p>
    </div>
  );
});

PdUserBubble.displayName = "PdUserBubble";
