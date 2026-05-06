// Input: content string, timestamp number, optional onRewind/rewindLabel + transcriptMode
// Output: cc-haha 1:1 UserMessage — right-aligned bubble with 18/4/18/18 corners + group-hover ActionBar
//         W23C 任务 #3：长用户消息 truncate（与 Claude Code CLI UserPromptMessage.tsx 对齐 —
//         head/tail 各保留若干字符 + 中间 "+N lines/chars" 占位）。verbose 模式 / 已展开时全显示。
// Pos: Chat layer — renders individual user turns inside PdMessageList.
//
// Reference: monitor/tmp/cc-haha/desktop/src/components/chat/UserMessage.tsx L1-46
// CLI 参考: src/components/messages/UserPromptMessage.tsx L28-30 + L64-70
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import React, { useState } from "react";
import { cn } from "../../lib/cn";
import { PdMessageActionBar } from "./PdMessageActionBar";
import type { TranscriptMode } from "../../stores/chatStore";
import { t } from "../../i18n";

// W23C 任务 #3：truncate 阈值（与 PdMessageBubble 一致；用户消息一般不像 assistant 那么长，
//   阈值适当低一些以应对粘贴大段代码/日志的场景）。
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
  const head = text.slice(0, TRUNCATE_HEAD_CHARS);
  const tail = text.slice(-TRUNCATE_TAIL_CHARS);
  const hiddenChars = text.length - TRUNCATE_HEAD_CHARS - TRUNCATE_TAIL_CHARS;
  return {
    display: `${head}\n\n... (${hiddenChars} chars hidden) ...\n\n${tail}`,
    hiddenChars,
    hiddenLines: 0,
  };
}

export interface PdUserBubbleProps {
  content: string;
  timestamp: number;
  /** Rewind to this turn — when undefined the rewind pill is hidden. */
  onRewind?: () => void;
  rewindLabel?: string;
  /** Transcript mode — verbose 时不 truncate（Ctrl+O 全局展开承载方式）。 */
  transcriptMode?: TranscriptMode;
}

export const PdUserBubble: React.FC<PdUserBubbleProps> = React.memo(
  ({ content, onRewind, rewindLabel, transcriptMode = "normal" }) => {
    const hasText = content.trim().length > 0;

    // W23C 任务 #3：单条消息级 Expand 状态 + verbose 时跳过 truncate
    const [perMessageExpanded, setPerMessageExpanded] = useState(false);
    const isVerbose = transcriptMode === "verbose";
    const truncateForThisMessage = !isVerbose && !perMessageExpanded && shouldTruncate(content);
    const truncated = truncateForThisMessage ? truncateText(content) : null;
    const displayContent = truncated ? truncated.display : content;

    // 1:1 cc-haha UserMessage L15-45
    return (
      <div className="group mb-5 flex justify-end">
        <div
          data-message-shell="user"
          className="flex min-w-0 w-full max-w-[82%] flex-col items-end gap-2 sm:max-w-[78%] lg:max-w-[72%]"
        >
          {/* panda store 暂无 attachments 字段，跳过 AttachmentGallery（cc-haha L21-23 对应位） */}

          {hasText && (
            <div
              className={cn(
                "bg-[var(--pd-color-user-message-bg)]",
                "px-4 py-3 text-sm leading-relaxed",
                "text-[var(--pd-color-text-primary)]",
                "whitespace-pre-wrap break-words",
              )}
              style={{ borderRadius: "18px 4px 18px 18px" }}
            >
              {displayContent}
              {/* W23C 任务 #3：truncate 时显示展开按钮 */}
              {truncated && (
                <button
                  type="button"
                  onClick={() => setPerMessageExpanded(true)}
                  className="mt-2 ml-0 block text-[11px] font-medium text-[var(--pd-color-text-accent)] hover:underline"
                >
                  {t("chat.expandTruncated", { hidden: truncated.hiddenLines || truncated.hiddenChars }) ||
                    `Show ${truncated.hiddenLines ? `${truncated.hiddenLines} more lines` : `${truncated.hiddenChars} more chars`} (Ctrl+O all)`}
                </button>
              )}
              {!truncated && perMessageExpanded && shouldTruncate(content) && (
                <button
                  type="button"
                  onClick={() => setPerMessageExpanded(false)}
                  className="mt-2 ml-0 block text-[11px] font-medium text-[var(--pd-color-text-secondary)] hover:underline"
                >
                  {t("chat.collapseTruncated") || "Collapse"}
                </button>
              )}
            </div>
          )}

          {hasText && (
            <PdMessageActionBar
              copyText={content}
              copyLabel="Copy prompt"
              onRewind={onRewind}
              rewindLabel={rewindLabel}
              align="end"
            />
          )}
        </div>
      </div>
    );
  },
);

PdUserBubble.displayName = "PdUserBubble";
