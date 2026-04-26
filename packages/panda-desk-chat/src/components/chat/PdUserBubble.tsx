// Input: content string, timestamp number, optional onRewind/rewindLabel
// Output: cc-haha 1:1 UserMessage — right-aligned bubble with 18/4/18/18 corners + group-hover ActionBar
// Pos: Chat layer — renders individual user turns inside PdMessageList.
//
// Reference: monitor/tmp/cc-haha/desktop/src/components/chat/UserMessage.tsx L1-46
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import React from "react";
import { cn } from "../../lib/cn";
import { PdMessageActionBar } from "./PdMessageActionBar";

export interface PdUserBubbleProps {
  content: string;
  timestamp: number;
  /** Rewind to this turn — when undefined the rewind pill is hidden. */
  onRewind?: () => void;
  rewindLabel?: string;
}

export const PdUserBubble: React.FC<PdUserBubbleProps> = React.memo(
  ({ content, onRewind, rewindLabel }) => {
    const hasText = content.trim().length > 0;

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
              {content}
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
