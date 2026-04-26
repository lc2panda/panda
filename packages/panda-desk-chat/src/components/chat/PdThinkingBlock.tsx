// Input: thinking content string, isActive flag (cc-haha 接口), legacy isStreaming/defaultExpanded/forceCollapsed
// Output: cc-haha 1:1 ThinkingBlock — ▸/▾ caret + italic label + 3-dot pulse + monospace expanded panel
// Pos: Chat layer — displays model reasoning trace inline above assistant body.
//
// Reference: monitor/tmp/cc-haha/desktop/src/components/chat/ThinkingBlock.tsx L1-87
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/cn";
import { t } from "../../i18n";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface PdThinkingBlockProps {
  content: string;
  /** cc-haha 主接口名 — true 时跑 thinking-dots 动画 + 内联光标. */
  isActive?: boolean;
  /** Legacy alias for isActive — kept for prop compat with older callers. */
  isStreaming?: boolean;
  /** Open expanded panel by default (verbose transcript mode). */
  defaultExpanded?: boolean;
  /** When true, the block is not rendered at all (summary mode). */
  forceCollapsed?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const PdThinkingBlock = React.memo(function PdThinkingBlock({
  content,
  isActive,
  isStreaming,
  defaultExpanded = false,
  forceCollapsed = false,
  className,
}: PdThinkingBlockProps) {
  const active = isActive ?? isStreaming ?? false;
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);

  // 1:1 cc-haha L9-13: auto-scroll expanded panel to bottom while active
  useEffect(() => {
    if (expanded && active && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, expanded, active]);

  if (forceCollapsed) return null;

  // 1:1 cc-haha L15-18: preview = first non-empty line, slice(0,80) + '...'
  const lines = content.split("\n").filter((l) => l.trim());
  const firstLine = lines[0]?.replace(/\s+/g, " ").trim() || "";
  const preview = firstLine.length > 80 ? firstLine.slice(0, 80) + "..." : firstLine;

  // cc-haha L31: t('thinking.label') — panda i18n 已有 chat.thinking key（"思考中..."）
  // 注意 cc-haha 文案是 "Thinking" + 单独的 thinking-dots 动画拼出 "..." → panda
  // 把 "..." 作为静态尾缀已经在 catalog 中，这里我们把 "..." 切掉再交给 dots 动画。
  const rawLabel = t("chat.thinking");
  const labelText = rawLabel.replace(/\.{3,}$/, "").replace(/\u2026$/, "");

  return (
    <div className={cn("mb-1", className)}>
      <style>{thinkingStyles}</style>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left",
          "text-[12px] text-[var(--pd-color-text-tertiary)]",
          "transition-colors hover:text-[var(--pd-color-text-secondary)]",
        )}
      >
        <span className="text-[10px] text-[var(--pd-color-outline)]">
          {expanded ? "\u25BE" : "\u25B8"}
        </span>
        <span className="shrink-0 font-medium italic">
          {labelText}
          {active && <span className="thinking-dots" />}
        </span>
        {!expanded && preview && (
          <span className="min-w-0 flex-1 truncate font-[var(--pd-font-mono)] text-[11px] text-[var(--pd-color-text-tertiary)]">
            {preview}
            {active && <span className="thinking-inline-cursor" />}
          </span>
        )}
      </button>
      {expanded && (
        <div
          ref={contentRef}
          className={cn(
            "mt-1 max-h-[300px] overflow-y-auto",
            "rounded-lg border border-[var(--pd-color-border)]/40",
            "bg-[var(--pd-color-surface-container-lowest)]",
            "p-2.5",
            "font-[var(--pd-font-mono)] text-[11px] leading-[1.35]",
            "text-[var(--pd-color-text-secondary)]",
            "whitespace-pre-wrap break-words",
          )}
        >
          {content}
          {active && <span className="thinking-cursor" />}
        </div>
      )}
    </div>
  );
});

PdThinkingBlock.displayName = "PdThinkingBlock";

/* -------------------------------------------------------------------------- */
/*  Inline styles — 1:1 cc-haha ThinkingBlock L54-87 thinkingStyles            */
/*  panda 仅做 token 前缀替换：var(--color-X) → var(--pd-color-X)              */
/* -------------------------------------------------------------------------- */

const thinkingStyles = `
@keyframes thinking-cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes thinking-dots {
  0%, 20% { content: ''; }
  40% { content: '.'; }
  60% { content: '..'; }
  80%, 100% { content: '...'; }
}
.thinking-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--pd-color-text-tertiary);
  vertical-align: middle;
  margin-left: 1px;
  animation: thinking-cursor-blink 1s step-end infinite;
}
.thinking-inline-cursor {
  display: inline-block;
  width: 1px;
  height: 0.95em;
  margin-left: 3px;
  vertical-align: text-bottom;
  background: var(--pd-color-text-tertiary);
  animation: thinking-cursor-blink 1s step-end infinite;
}
.thinking-dots::after {
  content: '';
  animation: thinking-dots 1.4s steps(1, end) infinite;
}
`;
