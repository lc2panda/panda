// Input: Model routing info (from/to model, reason) via chatStore.routingInfo
// Output: Inline banner showing model switch notification
// Pos: ChatPage — between error banners and MessageList, conditional on routingInfo
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import React from "react";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface PdRoutingBannerProps {
  fromModel?: string;
  toModel: string;
  reason?: string;
  onDismiss?: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const PdRoutingBanner: React.FC<PdRoutingBannerProps> = ({
  fromModel,
  toModel,
  reason,
  onDismiss,
}) => {
  return (
    <div
      className={cn(
        "routing-banner",
        "flex items-center gap-[var(--pd-space-2)]",
        "rounded-[var(--pd-radius-md)]",
        "bg-[var(--pd-color-accent-subtle)]",
        "border-l-[3px] border-l-[var(--pd-color-accent)]",
        "px-[var(--pd-space-3)] py-[var(--pd-space-2)]",
        "my-[var(--pd-space-2)]",
        "mx-auto max-w-[600px]",
      )}
      role="status"
      aria-label={`Model switched to ${toModel}`}
    >
      {/* Icon */}
      <span className="shrink-0 text-base" aria-hidden="true">
        {"\uD83D\uDD04"}
      </span>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[var(--pd-text-sm)]",
            "font-[var(--pd-font-medium)]",
            "text-[var(--pd-color-fg)]",
            "truncate",
          )}
        >
          {fromModel ? (
            <>
              Switched from{" "}
              <span className="font-[var(--pd-font-semibold)]">{fromModel}</span>
              {" "}to{" "}
              <span className="font-[var(--pd-font-semibold)]">{toModel}</span>
            </>
          ) : (
            <>
              Switched to{" "}
              <span className="font-[var(--pd-font-semibold)]">{toModel}</span>
            </>
          )}
        </p>
        {reason && (
          <p
            className={cn(
              "mt-[var(--pd-space-0\\.5)]",
              "text-[var(--pd-text-xs)]",
              "text-[var(--pd-color-fg-muted)]",
            )}
          >
            {reason}
          </p>
        )}
      </div>

      {/* Dismiss */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            "shrink-0",
            "w-6 h-6 flex items-center justify-center",
            "rounded-[var(--pd-radius-sm)]",
            "text-[var(--pd-color-fg-muted)]",
            "hover:bg-[var(--pd-color-bg-hover)]",
            "hover:text-[var(--pd-color-fg)]",
            "transition-colors duration-[var(--pd-duration-fast)]",
          )}
          aria-label="Dismiss routing notification"
        >
          {"\u2715"}
        </button>
      )}
    </div>
  );
};

PdRoutingBanner.displayName = "PdRoutingBanner";
