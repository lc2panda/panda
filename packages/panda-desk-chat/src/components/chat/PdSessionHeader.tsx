// Input: title (session display name), metaLastUpdated (humanized "5m ago"), messageCount, optional cwd
// Output: Sticky H1 header above the message list — Manrope 28px extrabold + accent stripe + dotted meta
// Pos:    Chat layer — top of PdMessageList, sets conversational context for the active session
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import React from "react";
import { cn } from "../../lib/cn";

export interface PdSessionHeaderProps {
  /** Session title or first 60-char excerpt of the opening user message. */
  title: string;
  /** Humanized "5m ago" / "2h ago" string. Empty string hides the segment. */
  metaLastUpdated?: string;
  /** Number of UI messages currently in the session. */
  messageCount: number;
  /** Optional working-directory hint shown as a third metadata segment. */
  cwd?: string;
  className?: string;
}

const TITLE_TRUNCATE_AT = 60;

function truncate(value: string, max: number): string {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max).trim()}…` : value;
}

export const PdSessionHeader: React.FC<PdSessionHeaderProps> = React.memo(
  ({ title, metaLastUpdated, messageCount, cwd, className }) => {
    const displayTitle = truncate(title?.trim() || "Untitled session", TITLE_TRUNCATE_AT);
    const metaParts: string[] = [];
    if (metaLastUpdated && metaLastUpdated.trim().length > 0) {
      metaParts.push(`last updated ${metaLastUpdated}`);
    }
    if (typeof messageCount === "number" && messageCount >= 0) {
      metaParts.push(`${messageCount} message${messageCount === 1 ? "" : "s"}`);
    }
    if (cwd && cwd.trim().length > 0) {
      const segs = cwd.split("/").filter(Boolean);
      const tail = segs.slice(-2).join("/");
      metaParts.push(tail || cwd);
    }

    return (
      <header
        className={cn(
          "sticky top-0 z-10",
          "pd-session-header",
          className,
        )}
      >
        <div className="mx-auto max-w-[860px] px-10 py-5 border-l-2 border-[var(--pd-color-accent)] pl-3">
          <h1
            className={cn(
              "text-[28px] leading-[1.15] font-extrabold",
              "tracking-[-0.02em]",
              "text-[var(--pd-color-fg)]",
              "truncate",
            )}
            style={{ fontFamily: "var(--pd-font-headline)" }}
            title={title}
          >
            {displayTitle}
          </h1>
          {metaParts.length > 0 && (
            <div
              className={cn(
                "mt-1.5 flex flex-wrap items-center gap-x-2",
                "text-[12px] font-medium",
                "text-[var(--pd-color-fg-tertiary)]",
              )}
            >
              {metaParts.map((part, i) => (
                <React.Fragment key={`${i}-${part}`}>
                  {i > 0 && (
                    <span aria-hidden="true" className="opacity-60">
                      ·
                    </span>
                  )}
                  <span className="truncate max-w-[280px]">{part}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </header>
    );
  },
);

PdSessionHeader.displayName = "PdSessionHeader";
