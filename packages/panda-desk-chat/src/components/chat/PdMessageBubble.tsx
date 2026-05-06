// Input: content (already-extracted text), thinkingContent, isStreaming, transcriptMode, interaction props
// Output: cc-haha 1:1 AssistantMessage — left-aligned bubble with rounded-tl-[8px] tail + group-hover ActionBar
//         W23C 任务 #3：长内容缩略（保留 head/tail 行 + 中间 ... 截断）+ 单条消息内 Expand 按钮 +
//         transcriptMode === 'verbose' 全展开（Ctrl+O 全局切换）
// Pos: Chat layer — renders individual assistant turns inside PdMessageList.
//
// Reference: monitor/tmp/cc-haha/desktop/src/components/chat/AssistantMessage.tsx L1-58
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import React, { useState } from "react";
import { cn } from "../../lib/cn";
import { PdMarkdownRenderer } from "./PdMarkdownRenderer";
import { PdThinkingBlock } from "./PdThinkingBlock";
import { PdMessageActionBar } from "./PdMessageActionBar";
import type { TranscriptMode, MessageFeedback } from "../../stores/chatStore";
import { t } from "../../i18n";

// W23C 任务 #3：truncate 阈值（与 CLI UserPromptMessage.tsx 对齐 — 长消息缩略，
//   head/tail 各保留若干字符，中间 "+N lines" 占位）。verbose 模式跳过 truncate。
//   设计要点：
//   - 阈值不要太低，避免短消息也被截（CLI 是 10K chars，desk-chat 用更低值因为屏幕宽度有限）
//   - 同时检查行数，长但少行（被复制粘贴的 prose）也要截
const TRUNCATE_MAX_CHARS = 4_000;
const TRUNCATE_HEAD_CHARS = 1_500;
const TRUNCATE_TAIL_CHARS = 1_000;
const TRUNCATE_MAX_LINES = 60;
const TRUNCATE_HEAD_LINES = 30;
const TRUNCATE_TAIL_LINES = 15;

function shouldTruncate(text: string): boolean {
  if (!text) return false;
  if (text.length > TRUNCATE_MAX_CHARS) return true;
  const newlines = (text.match(/\n/g) || []).length;
  if (newlines > TRUNCATE_MAX_LINES) return true;
  return false;
}

function truncateText(text: string): { display: string; hiddenChars: number; hiddenLines: number } {
  if (!shouldTruncate(text)) {
    return { display: text, hiddenChars: 0, hiddenLines: 0 };
  }
  const lines = text.split("\n");
  // 优先按行截断（更适合 markdown / 代码）
  if (lines.length > TRUNCATE_MAX_LINES) {
    const head = lines.slice(0, TRUNCATE_HEAD_LINES).join("\n");
    const tail = lines.slice(-TRUNCATE_TAIL_LINES).join("\n");
    const hiddenLines = lines.length - TRUNCATE_HEAD_LINES - TRUNCATE_TAIL_LINES;
    return {
      display: `${head}\n\n... (${hiddenLines} lines hidden) ...\n\n${tail}`,
      hiddenChars: text.length - head.length - tail.length,
      hiddenLines,
    };
  }
  // 按字符截断
  const head = text.slice(0, TRUNCATE_HEAD_CHARS);
  const tail = text.slice(-TRUNCATE_TAIL_CHARS);
  const hiddenChars = text.length - TRUNCATE_HEAD_CHARS - TRUNCATE_TAIL_CHARS;
  return {
    display: `${head}\n\n... (${hiddenChars} chars hidden) ...\n\n${tail}`,
    hiddenChars,
    hiddenLines: 0,
  };
}

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

    // W23C 任务 #3：单条消息级 Expand 按钮 — 全局 verbose 时不需要按钮，
    //   per-message 状态独立于全局 transcriptMode（用户可以单独展开某条）。
    const [perMessageExpanded, setPerMessageExpanded] = useState(false);
    const truncateForThisMessage =
      !isVerbose && !isStreaming && !perMessageExpanded && shouldTruncate(content);
    const truncated = truncateForThisMessage ? truncateText(content) : null;
    const displayContent = truncated ? truncated.display : content;

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
              <PdMarkdownRenderer content={displayContent} />
              {isStreaming && (
                <span
                  aria-hidden="true"
                  className="ml-0.5 inline-block h-4 w-0.5 animate-shimmer bg-[var(--pd-color-brand)] align-text-bottom"
                />
              )}
              {/* W23C 任务 #3：truncate 时显示展开按钮 */}
              {truncated && (
                <button
                  type="button"
                  onClick={() => setPerMessageExpanded(true)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--pd-color-text-accent)] hover:underline"
                >
                  <span className="material-symbols-outlined text-[14px]">unfold_more</span>
                  {t("chat.expandTruncated", { hidden: truncated.hiddenLines || truncated.hiddenChars }) ||
                    `Show ${truncated.hiddenLines ? `${truncated.hiddenLines} more lines` : `${truncated.hiddenChars} more chars`} (Ctrl+O all)`}
                </button>
              )}
              {/* 已 per-message expanded → 显示折叠按钮 */}
              {!truncated && perMessageExpanded && shouldTruncate(content) && (
                <button
                  type="button"
                  onClick={() => setPerMessageExpanded(false)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--pd-color-text-secondary)] hover:underline"
                >
                  <span className="material-symbols-outlined text-[14px]">unfold_less</span>
                  {t("chat.collapseTruncated") || "Collapse"}
                </button>
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
