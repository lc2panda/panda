// Input: content (already-extracted text), thinkingContent, isStreaming, transcriptMode, interaction props
// Output: cc-haha 1:1 AssistantMessage — left-aligned bubble with rounded-tl-[8px] tail + group-hover ActionBar
// Pos: Chat layer — renders individual assistant turns inside PdMessageList.
//
// Reference: monitor/tmp/cc-haha/desktop/src/components/chat/AssistantMessage.tsx L1-58
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import React from "react";
import { cn } from "../../lib/cn";
import { PdMarkdownRenderer } from "./PdMarkdownRenderer";
import { PdThinkingBlock } from "./PdThinkingBlock";
import { PdMessageActionBar } from "./PdMessageActionBar";
import type { TranscriptMode, MessageFeedback } from "../../stores/chatStore";

/**
 * Legacy export kept so external imports of `ToolCallInfo` keep type-checking.
 * The store no longer produces this shape — tool calls live in their own
 * MessageEntry now.
 *
 * @deprecated since the cc-haha alignment refactor. Use UIToolUseMessage / UIToolResultMessage from chatStore.
 */
export interface ToolCallInfo {
  id: string;
  toolName: string;
  status: "pending" | "running" | "success" | "error";
  input?: Record<string, unknown>;
  result?: string;
  isError?: boolean;
}

export interface PdMessageBubbleProps {
  content: string;
  /** Kept for prop compat; minimal style does not render timestamps. */
  timestamp: number;
  /** Thinking trace shown above the body when present. */
  thinkingContent?: string;
  isStreaming?: boolean;
  transcriptMode?: TranscriptMode;
  /** Kept for prop compat; retry surfaced elsewhere in the UI. */
  isLastAssistant?: boolean;
  /** Kept for prop compat. */
  onRetry?: () => void;
  /** Kept for prop compat. */
  feedback?: MessageFeedback;
  /** Kept for prop compat. */
  onFeedbackChange?: (feedback: MessageFeedback) => void;
}

/* ── Helpers (cc-haha AssistantMessage L44-57 shouldUseDocumentLayout) ───── */

function shouldUseDocumentLayout(content: string): boolean {
  const normalized = content.trim();
  if (!normalized) return false;
  if (/```/.test(normalized)) return true;
  if (/^\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|\|.+\|)/m.test(normalized)) return true;
  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  return (
    paragraphs.length >= 2 ||
    normalized.split("\n").filter((line) => line.trim()).length >= 8
  );
}

/* ── Component ─────────────────────────────────────────────────────────── */

export const PdMessageBubble: React.FC<PdMessageBubbleProps> = React.memo(
  ({
    content,
    thinkingContent,
    isStreaming = false,
    transcriptMode = "normal",
    isLastAssistant = false,
    onRetry,
  }) => {
    const hasBody = content.trim().length > 0;
    const hasThinking = !!thinkingContent && thinkingContent.trim().length > 0;
    const showActions = !isStreaming && hasBody;
    const isSummary = transcriptMode === "summary";
    const isVerbose = transcriptMode === "verbose";
    const documentLayout = shouldUseDocumentLayout(content);

    // 1:1 cc-haha AssistantMessage L13-42
    return (
      <div className="group mb-5 flex justify-start">
        <div
          data-message-shell="assistant"
          data-layout={documentLayout ? "document" : "bubble"}
          className={cn(
            "flex min-w-0 flex-col items-start gap-2",
            documentLayout
              ? "w-full max-w-full"
              : "w-full max-w-[88%] sm:max-w-[80%] lg:max-w-[72%]",
          )}
        >
          {/* Thinking trace（panda 增强 — cc-haha 把 thinking 内联进 markdown） */}
          {hasThinking && (
            <PdThinkingBlock
              content={thinkingContent!}
              isStreaming={isStreaming && !hasBody}
              defaultExpanded={isVerbose}
              forceCollapsed={isSummary}
            />
          )}

          {(hasBody || isStreaming) && (
            <div
              className={cn(
                "rounded-[20px] rounded-tl-[8px]",
                "border border-[var(--pd-color-border)]/60",
                "bg-[var(--pd-color-surface)]",
                "px-4 py-3",
                "text-sm text-[var(--pd-color-text-primary)]",
                "shadow-sm",
                documentLayout ? "w-full" : "max-w-full",
              )}
            >
              <PdMarkdownRenderer content={content} />
              {isStreaming && (
                <span
                  aria-hidden="true"
                  className="ml-0.5 inline-block h-4 w-0.5 animate-shimmer bg-[var(--pd-color-brand)] align-text-bottom"
                />
              )}
            </div>
          )}

          {/* cc-haha L34-38: ActionBar align="start" 在卡片下方（非右侧） */}
          {showActions && (
            <PdMessageActionBar
              copyText={content}
              copyLabel="Copy reply"
              align="start"
              onRetry={isLastAssistant ? onRetry : undefined}
            />
          )}
        </div>
      </div>
    );
  },
);

PdMessageBubble.displayName = "PdMessageBubble";
