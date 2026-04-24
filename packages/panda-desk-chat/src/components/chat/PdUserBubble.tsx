// Input: content string, timestamp number from UIMessage
// Output: Right-aligned user message bubble with asymmetric radius (Claude desktop style)
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
      style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--pd-space-3)' }}
    >
      <div
        className={cn("relative group")}
        style={{
          background: 'var(--pd-color-user-message-bg, var(--pd-color-surface-container, #EFEEEA))',
          borderRadius: '18px 4px 18px 18px',
          padding: '12px 16px',
          maxWidth: '82%',
          color: 'var(--pd-color-fg)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {hovered && (
          <span
            className={cn(
              "absolute -top-5 right-1",
              "text-[11px] text-[var(--pd-color-fg-muted)]",
              "select-none pointer-events-none",
              "animate-[pd-fade-in-up_150ms_var(--pd-ease-decelerate)]",
            )}
          >
            {formatRelativeTime(timestamp)}
          </span>
        )}
        <p
          className={cn(
            "whitespace-pre-wrap break-words m-0",
          )}
          style={{
            fontSize: '15px',
            lineHeight: 1.55,
          }}
        >
          {content}
        </p>
      </div>
    </div>
  );
});

PdUserBubble.displayName = "PdUserBubble";
