// Input: content, timestamp, thinkingContent, toolCalls, isStreaming from UIMessage
// Output: Styled assistant message with markdown, thinking fold, tool cards, copy action
// Pos: Chat layer — renders individual assistant turns inside MessageList
import React, { useState, useCallback } from "react";
import { cn } from "../../lib/cn";
import { PdBadge } from "../atoms/PdBadge";

export interface ToolCallInfo {
  id: string;
  toolName: string;
  status: string;
  result?: string;
}

export interface AssistantMessageProps {
  content: string;
  timestamp: number;
  thinkingContent?: string;
  toolCalls?: ToolCallInfo[];
  isStreaming?: boolean;
}

/* ── Minimal Markdown-to-HTML ─────────────────────────────────────────── */

function simpleMarkdownToHtml(md: string): string {
  let html = md
    // Escape HTML entities first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks: ```lang\n...\n```
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, _lang, code) =>
      `<pre class="pd-code-block"><code>${code.trimEnd()}</code></pre>`,
  );

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="pd-inline-code">$1</code>',
  );

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Line breaks (double newline = paragraph break)
  html = html.replace(/\n\n/g, "<br/><br/>");
  html = html.replace(/\n/g, "<br/>");

  return html;
}

/* ── Status → Badge variant mapping ───────────────────────────────────── */

const statusVariant: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  completed: "success",
  running: "info",
  pending: "warning",
  error: "error",
};

/* ── Component ────────────────────────────────────────────────────────── */

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  timestamp: _timestamp,
  thinkingContent,
  toolCalls,
  isStreaming = false,
}) => {
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available in some envs */
    }
  }, [content]);

  const thinkingPreview =
    thinkingContent && thinkingContent.length > 60
      ? thinkingContent.slice(0, 60) + "..."
      : thinkingContent;

  return (
    <div
      className={cn(
        "relative group",
        "mb-[var(--pd-space-3)]",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Thinking Block ─────────────────────────────────────────────── */}
      {thinkingContent && (
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setThinkingOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 w-full text-left",
              "text-[var(--pd-text-xs)] text-[var(--pd-color-fg-muted)]",
              "bg-[var(--pd-tool-thinking-bg)]",
              "border border-[var(--pd-tool-thinking-border)]",
              "rounded-[var(--pd-radius-sm)]",
              "px-3 py-1.5",
              "hover:bg-[var(--pd-color-bg-hover)]",
              "transition-colors duration-[var(--pd-duration-quick)]",
              "cursor-pointer",
            )}
          >
            <span
              className={cn(
                "inline-block transition-transform duration-[var(--pd-duration-quick)]",
                thinkingOpen && "rotate-90",
              )}
            >
              &#9654;
            </span>
            <span className="font-medium">Thinking</span>
            {!thinkingOpen && (
              <span className="ml-1 opacity-60 truncate">
                {thinkingPreview}
              </span>
            )}
          </button>
          {thinkingOpen && (
            <div
              className={cn(
                "mt-1 px-3 py-2",
                "text-[var(--pd-text-sm)] text-[var(--pd-color-fg-muted)]",
                "leading-[var(--pd-leading-body)]",
                "whitespace-pre-wrap break-words",
                "border-l-2 border-l-[var(--pd-tool-thinking-border)]",
                "animate-[pd-fade-in-up_150ms_var(--pd-ease-decelerate)]",
              )}
            >
              {thinkingContent}
            </div>
          )}
        </div>
      )}

      {/* ── Tool Calls ─────────────────────────────────────────────────── */}
      {toolCalls && toolCalls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {toolCalls.map((tc) => (
            <div
              key={tc.id}
              className={cn(
                "inline-flex items-center gap-1.5",
                "bg-[var(--pd-tool-use-bg)]",
                "border border-[var(--pd-tool-use-border)]",
                "rounded-[var(--pd-radius-sm)]",
                "px-2.5 py-1",
                "text-[var(--pd-text-xs)]",
              )}
            >
              <span className="text-[var(--pd-tool-use-icon)] font-medium">
                {tc.toolName}
              </span>
              <PdBadge
                variant={statusVariant[tc.status] ?? "neutral"}
                size="xs"
              >
                {tc.status}
              </PdBadge>
            </div>
          ))}
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "text-[var(--pd-text-base)] text-[var(--pd-color-fg)]",
          "leading-[var(--pd-leading-body)]",
          // Code block styles injected via class names used in simpleMarkdownToHtml
          "[&_.pd-code-block]:bg-[var(--pd-code-bg)]",
          "[&_.pd-code-block]:font-[var(--pd-font-mono)]",
          "[&_.pd-code-block]:text-[var(--pd-code-base)]",
          "[&_.pd-code-block]:rounded-[var(--pd-radius-sm)]",
          "[&_.pd-code-block]:px-3 [&_.pd-code-block]:py-2",
          "[&_.pd-code-block]:my-2 [&_.pd-code-block]:overflow-x-auto",
          "[&_.pd-inline-code]:bg-[var(--pd-code-bg)]",
          "[&_.pd-inline-code]:font-[var(--pd-font-mono)]",
          "[&_.pd-inline-code]:text-[var(--pd-code-base)]",
          "[&_.pd-inline-code]:rounded-[var(--pd-radius-xs)]",
          "[&_.pd-inline-code]:px-1 [&_.pd-inline-code]:py-0.5",
        )}
        dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(content) }}
      />

      {/* ── Streaming Cursor ───────────────────────────────────────────── */}
      {isStreaming && (
        <span
          className={cn(
            "inline-block w-[2px] h-[1.1em] ml-0.5",
            "bg-[var(--pd-color-accent)]",
            "animate-[pd-streaming-shimmer_800ms_var(--pd-ease-standard)_infinite]",
            "align-text-bottom",
          )}
          aria-hidden="true"
        />
      )}

      {/* ── Copy Action Bar ────────────────────────────────────────────── */}
      {hovered && !isStreaming && (
        <div
          className={cn(
            "absolute top-1 right-1",
            "animate-[pd-fade-in-up_100ms_var(--pd-ease-decelerate)]",
          )}
        >
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "inline-flex items-center justify-center",
              "w-7 h-7 rounded-[var(--pd-radius-sm)]",
              "bg-[var(--pd-color-bg-elevated)] border border-[var(--pd-color-border)]",
              "text-[var(--pd-color-fg-muted)]",
              "hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]",
              "transition-colors duration-[var(--pd-duration-quick)]",
              "shadow-[var(--pd-shadow-sm)]",
            )}
            title="Copy"
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3.5 8.5 6.5 11.5 12.5 5.5" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="5" width="8" height="8" rx="1" />
                <path d="M3 11V3h8" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

AssistantMessage.displayName = "AssistantMessage";
