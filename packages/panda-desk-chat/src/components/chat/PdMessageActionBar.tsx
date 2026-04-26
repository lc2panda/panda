// Input: copyText, copyLabel, onRewind, rewindLabel, align, plus panda extras (onRetry, onEdit, onBranch, role)
// Output: cc-haha 1:1 group-hover action bar — Rewind pill + Copy pill (panda extends with Retry/Edit/Branch icon-buttons)
// Pos: Chat layer — rendered below PdMessageBubble / PdUserBubble.
//
// Reference: monitor/tmp/cc-haha/desktop/src/components/chat/MessageActionBar.tsx L1-56
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import React, { useCallback, useState } from "react";
import { cn } from "../../lib/cn";

/* ── Inline 14px SVG icons — keep bundle independent of lucide alias quirks ── */
type IconProps = { className?: string };
const Svg: React.FC<React.PropsWithChildren<IconProps>> = ({ className, children }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);
const IconRetry: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <polyline points="20 5 20 11 14 11" />
    <path d="M20 11A8 8 0 1 0 18 18" />
  </Svg>
);
const IconPencil: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M14 4l6 6L8 22H2v-6z" />
    <path d="M14 4l3-3 6 6-3 3" />
  </Svg>
);
const IconBranch: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </Svg>
);

export interface PdMessageActionBarProps {
  /** Full text the Copy button writes to clipboard (cc-haha 主接口). */
  copyText?: string;
  /** Copy button aria-label / title (cc-haha 主接口). */
  copyLabel?: string;
  /** Rewind to this user turn (cc-haha 主接口). Hidden when undefined. */
  onRewind?: () => void;
  /** Rewind button aria-label / title (cc-haha 主接口). */
  rewindLabel?: string;
  /** start = 助手左对齐, end = 用户右对齐 (cc-haha 主接口). */
  align?: "start" | "end";
  /** Re-run the last assistant turn — panda 增强, hidden when undefined. */
  onRetry?: () => void;
  /** Edit the user message — panda 增强, only meaningful for role="user". */
  onEdit?: () => void;
  /** Branch the conversation — panda 增强. */
  onBranch?: () => void;
  /** panda 增强: gates Edit visibility — only shown for "user". */
  role?: "user" | "assistant";
  className?: string;
}

interface PillProps {
  onClick?: () => void;
  ariaLabel: string;
  title: string;
  children: React.ReactNode;
}

/** Shared pill style — 1:1 cc-haha L38 / L50 inline-flex min-h-7 rounded-full. */
const pillClass = cn(
  "inline-flex min-h-7 items-center gap-1 rounded-full",
  "border border-[var(--pd-color-border)]/70",
  "bg-[var(--pd-color-surface-container-low)]",
  "px-2.5",
  "text-[11px] font-medium text-[var(--pd-color-text-tertiary)]",
  "transition-colors",
  "hover:border-[var(--pd-color-brand)]/35 hover:text-[var(--pd-color-text-primary)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pd-color-brand)]/35",
);

const Pill: React.FC<PillProps> = ({ onClick, ariaLabel, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    title={title}
    className={pillClass}
  >
    {children}
  </button>
);

export const PdMessageActionBar: React.FC<PdMessageActionBarProps> = React.memo(
  ({
    copyText,
    copyLabel = "Copy",
    onRewind,
    rewindLabel = "Rewind to here",
    align = "start",
    onRetry,
    onEdit,
    onBranch,
    role = "assistant",
    className,
  }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
      const text = copyText ?? "";
      if (!text.trim()) return;
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Legacy fallback
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* clipboard unavailable — silent */
      }
    }, [copyText]);

    const hasCopy = !!copyText && copyText.trim().length > 0;
    const hasRewind = !!onRewind;
    const hasRetry = !!onRetry;
    const hasEdit = !!onEdit && role === "user";
    const hasBranch = !!onBranch;

    if (!hasCopy && !hasRewind && !hasRetry && !hasEdit && !hasBranch) return null;

    // 1:1 cc-haha L23-29 outer container
    return (
      <div
        data-message-actions
        data-align={align}
        className={cn(
          "flex w-full opacity-0 transition-opacity duration-200",
          "group-hover:opacity-100 group-focus-within:opacity-100",
          align === "end" ? "justify-end" : "justify-start",
          className,
        )}
      >
        <div className="flex items-center gap-1.5">
          {hasRewind && (
            <Pill
              onClick={onRewind}
              ariaLabel={rewindLabel}
              title={rewindLabel}
            >
              <span className="material-symbols-outlined text-[14px]">undo</span>
              <span className="hidden min-[920px]:inline">Rewind</span>
            </Pill>
          )}
          {hasCopy && (
            <Pill
              onClick={handleCopy}
              ariaLabel={copyLabel}
              title={copyLabel}
            >
              <span className="material-symbols-outlined text-[14px]">
                {copied ? "check" : "content_copy"}
              </span>
              <span className="hidden min-[920px]:inline">
                {copied ? "Copied" : "Copy"}
              </span>
            </Pill>
          )}
          {/* panda 增强: Retry / Edit / Branch icon-pills 走相同样式（不破坏 cc-haha 视觉） */}
          {hasRetry && (
            <Pill onClick={onRetry} ariaLabel="Retry response" title="Retry">
              <IconRetry className="h-3.5 w-3.5" />
              <span className="hidden min-[920px]:inline">Retry</span>
            </Pill>
          )}
          {hasEdit && (
            <Pill onClick={onEdit} ariaLabel="Edit message" title="Edit">
              <IconPencil className="h-3.5 w-3.5" />
              <span className="hidden min-[920px]:inline">Edit</span>
            </Pill>
          )}
          {hasBranch && (
            <Pill onClick={onBranch} ariaLabel="Branch conversation" title="Branch">
              <IconBranch className="h-3.5 w-3.5" />
              <span className="hidden min-[920px]:inline">Branch</span>
            </Pill>
          )}
        </div>
      </div>
    );
  },
);

PdMessageActionBar.displayName = "PdMessageActionBar";
