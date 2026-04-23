// Input: content, timestamp, thinkingContent, toolCalls, isStreaming, transcriptMode, interaction props
// Output: Left-aligned assistant bubble with asymmetric radius, border, shadow, hover ActionBar
// Pos: Chat layer — renders individual assistant turns inside MessageList
import React, { useState, useCallback, useMemo, useRef } from "react";
import { cn } from "../../lib/cn";
import { PdBadge } from "../atoms/PdBadge";
import { PdMarkdownRenderer } from "./PdMarkdownRenderer";
import type { TranscriptMode, MessageFeedback } from "../../stores/chatStore";

export interface ToolCallInfo {
  id: string;
  toolName: string;
  status: string;
  result?: string;
}

export interface PdMessageBubbleProps {
  content: string;
  timestamp: number;
  thinkingContent?: string;
  toolCalls?: ToolCallInfo[];
  isStreaming?: boolean;
  transcriptMode?: TranscriptMode;
  /** Whether this is the last assistant message in the session */
  isLastAssistant?: boolean;
  /** Retry callback — only invoked on the last assistant message */
  onRetry?: () => void;
  /** Current feedback state */
  feedback?: MessageFeedback;
  /** Feedback change callback */
  onFeedbackChange?: (feedback: MessageFeedback) => void;
}

/* ── Status → Badge variant mapping ───────────────────────────────────── */

const statusVariant: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  completed: "success",
  running: "info",
  pending: "warning",
  error: "error",
};

/* ── Timestamp formatter ─────────────────────────────────────────────── */

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isSameDay) return `${hh}:${mm}`;
  const mon = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${mon}-${day} ${hh}:${mm}`;
}

/* ── Inline SVG Icons ────────────────────────────────────────────────── */

const CopyIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="5" width="8" height="8" rx="1" />
    <path d="M3 11V3h8" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3.5 8.5 6.5 11.5 12.5 5.5" />
  </svg>
);

const RetryIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 2.5v4h4" />
    <path d="M2.5 6.5A5.5 5.5 0 1 1 3 10" />
  </svg>
);

const ThumbUpIcon: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 14H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2m0 7V7m0 7h6.28a2 2 0 0 0 1.94-1.52l1.07-4.28A1 1 0 0 0 12.32 7H9.5V3.5a1.5 1.5 0 0 0-3 0L5 7" />
  </svg>
);

const ThumbDownIcon: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 2h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2m0-7v7m0-7H4.72a2 2 0 0 0-1.94 1.52l-1.07 4.28A1 1 0 0 0 2.68 9H5.5v3.5a1.5 1.5 0 0 0 3 0L11 9" />
  </svg>
);

/* ── Action button base style ────────────────────────────────────────── */

const actionBtnCls = cn(
  "w-7 h-7 flex items-center justify-center rounded-[var(--pd-radius-sm)]",
  "cursor-pointer text-[var(--pd-color-fg-muted)]",
  "hover:bg-[var(--pd-color-bg-subtle)] hover:text-[var(--pd-color-fg)]",
  "transition-colors duration-[var(--pd-duration-quick)]",
);

/* ── Component ────────────────────────────────────────────────────────── */

export const PdMessageBubble: React.FC<PdMessageBubbleProps> = React.memo(({
  content,
  timestamp,
  thinkingContent,
  toolCalls,
  isStreaming = false,
  transcriptMode = 'normal',
  isLastAssistant = false,
  onRetry,
  feedback,
  onFeedbackChange,
}) => {
  const isSummary = transcriptMode === 'summary';
  const isVerbose = transcriptMode === 'verbose';
  const [thinkingOpen, setThinkingOpen] = useState(isVerbose);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Entry animation: only for newly mounted, non-streaming, normal-mode bubbles
  const isNewMount = useRef(true);
  const shouldAnimate = isNewMount.current && !isStreaming && transcriptMode === 'normal';
  // After first render, mark as not new
  if (isNewMount.current) isNewMount.current = false;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available in some envs */
    }
  }, [content]);

  const handleRetry = useCallback(() => {
    if (onRetry) onRetry();
  }, [onRetry]);

  const handleThumbUp = useCallback(() => {
    if (!onFeedbackChange) return;
    onFeedbackChange(feedback === 'positive' ? null : 'positive');
  }, [feedback, onFeedbackChange]);

  const handleThumbDown = useCallback(() => {
    if (!onFeedbackChange) return;
    onFeedbackChange(feedback === 'negative' ? null : 'negative');
  }, [feedback, onFeedbackChange]);

  const formattedTime = useMemo(() => formatTimestamp(timestamp), [timestamp]);

  const showActionBar = hovered && !isStreaming;

  const thinkingPreview =
    thinkingContent && thinkingContent.length > 60
      ? thinkingContent.slice(0, 60) + "..."
      : thinkingContent;

  return (
    <div
      className={cn(
        "relative group",
        "mb-[var(--pd-space-3)]",
        shouldAnimate && "pd-bubble-enter",
      )}
      style={{
        marginLeft: 40,
        background: 'var(--pd-color-surface, var(--pd-color-bg))',
        borderRadius: '8px 20px 20px 20px',
        border: '1px solid color-mix(in srgb, var(--pd-color-border) 60%, transparent)',
        boxShadow: 'var(--pd-shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
        padding: '12px 16px',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Thinking Block ─────────────────────────────────────────────── */}
      {thinkingContent && !isSummary && (
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
          {isSummary ? (
            /* Summary mode — single-line count */
            <div
              className={cn(
                "inline-flex items-center gap-1.5",
                "bg-[var(--pd-tool-use-bg)]",
                "border border-[var(--pd-tool-use-border)]",
                "rounded-[var(--pd-radius-sm)]",
                "px-2.5 py-1",
                "text-[var(--pd-text-xs)]",
                "text-[var(--pd-color-fg-muted)]",
              )}
            >
              <span aria-hidden="true">🔧</span>
              <span>{toolCalls.length} tool call{toolCalls.length !== 1 ? 's' : ''}</span>
            </div>
          ) : (
            /* Normal / Verbose mode — individual chips */
            toolCalls.map((tc) => (
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
            ))
          )}
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      <PdMarkdownRenderer content={content} />

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

      {/* ── Action Bar (hover) ─────────────────────────────────────────── */}
      {showActionBar && (
        <div
          className={cn(
            "absolute top-1 right-1",
            "flex items-center gap-1",
            "bg-[var(--pd-color-bg-elevated)]",
            "rounded-[var(--pd-radius-md)]",
            "shadow-[var(--pd-shadow-sm)]",
            "border border-[var(--pd-color-border)]",
            "p-1",
            "animate-[pd-fade-in-up_100ms_var(--pd-ease-decelerate)]",
          )}
        >
          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            className={actionBtnCls}
            title={copied ? "Copied!" : "Copy"}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>

          {/* Retry — only on last assistant, not in transcript mode */}
          {isLastAssistant && transcriptMode === 'normal' && onRetry && (
            <button
              type="button"
              onClick={handleRetry}
              className={actionBtnCls}
              title="Retry"
            >
              <RetryIcon />
            </button>
          )}

          {/* Feedback — only for non-transcript assistant messages */}
          {transcriptMode === 'normal' && (
            <>
              <button
                type="button"
                onClick={handleThumbUp}
                className={cn(
                  actionBtnCls,
                  feedback === 'positive' && "text-[var(--pd-color-accent)] bg-[var(--pd-color-bg-subtle)]",
                )}
                title="Helpful"
              >
                <ThumbUpIcon filled={feedback === 'positive'} />
              </button>
              <button
                type="button"
                onClick={handleThumbDown}
                className={cn(
                  actionBtnCls,
                  feedback === 'negative' && "text-[var(--pd-color-danger,#ef4444)] bg-[var(--pd-color-bg-subtle)]",
                )}
                title="Not helpful"
              >
                <ThumbDownIcon filled={feedback === 'negative'} />
              </button>
            </>
          )}

          {/* Timestamp */}
          <span className="text-xs text-[var(--pd-color-fg-muted)] px-1.5 select-none whitespace-nowrap leading-7">
            {formattedTime}
          </span>
        </div>
      )}
    </div>
  );
});

PdMessageBubble.displayName = "PdMessageBubble";
