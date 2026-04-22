// TODO(W12): Not yet wired to any page — integrate or remove in W12
// Input: Event type and data (milestone, species unlock, holiday, upgrade, achievement)
// Output: Decorative event card in conversation flow
// Pos: Chat layer — Panda-exclusive conversation milestone cards
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import React, { useMemo } from "react";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type BuddyEventType =
  | "milestone"
  | "species_unlock"
  | "holiday"
  | "upgrade"
  | "achievement";

export interface PdBuddyEventCardProps {
  type: BuddyEventType;
  title: string;
  description: string;
  emoji?: string;
  timestamp?: number;
}

/* -------------------------------------------------------------------------- */
/*  Type → Visual Config                                                      */
/* -------------------------------------------------------------------------- */

interface TypeConfig {
  gradient: string;
  borderColor: string;
  defaultEmoji: string;
}

const TYPE_CONFIG: Record<BuddyEventType, TypeConfig> = {
  milestone: {
    gradient: "from-amber-500/15 to-yellow-400/10",
    borderColor: "border-amber-400/40",
    defaultEmoji: "\u{1F3C6}",
  },
  species_unlock: {
    gradient: "from-emerald-500/15 to-green-400/10",
    borderColor: "border-emerald-400/40",
    defaultEmoji: "\u{1F43C}",
  },
  holiday: {
    gradient: "from-pink-500/10 via-purple-400/10 to-cyan-400/10",
    borderColor: "border-pink-400/40",
    defaultEmoji: "\u{1F389}",
  },
  upgrade: {
    gradient: "from-blue-500/15 to-sky-400/10",
    borderColor: "border-blue-400/40",
    defaultEmoji: "\u{2B06}\u{FE0F}",
  },
  achievement: {
    gradient: "from-purple-500/15 to-violet-400/10",
    borderColor: "border-purple-400/40",
    defaultEmoji: "\u{2728}",
  },
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const PdBuddyEventCard: React.FC<PdBuddyEventCardProps> = ({
  type,
  title,
  description,
  emoji,
  timestamp,
}) => {
  const config = TYPE_CONFIG[type];
  const displayEmoji = emoji ?? config.defaultEmoji;

  const formattedTime = useMemo(() => {
    if (!timestamp) return null;
    return new Intl.DateTimeFormat("default", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  }, [timestamp]);

  return (
    <div
      className={cn(
        "buddy-event-card",
        "max-w-[400px] mx-auto my-[12px]",
        "flex items-start gap-[var(--pd-space-3)]",
        "rounded-[var(--pd-radius-lg)]",
        "border",
        config.borderColor,
        "bg-gradient-to-r",
        config.gradient,
        "p-[var(--pd-space-3)]",
        "shadow-[var(--pd-shadow-sm)]",
      )}
      role="status"
      aria-label={`${type} event: ${title}`}
    >
      {/* Emoji column */}
      <div
        className={cn(
          "shrink-0",
          "w-10 h-10 flex items-center justify-center",
          "rounded-[var(--pd-radius-md)]",
          "bg-[var(--pd-color-bg-elevated)]",
          "text-[1.5rem] leading-none",
        )}
        aria-hidden="true"
      >
        {displayEmoji}
      </div>

      {/* Text column */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[var(--pd-text-sm)]",
            "font-[var(--pd-font-semibold)]",
            "text-[var(--pd-color-fg)]",
            "leading-snug",
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "mt-[var(--pd-space-0\\.5)]",
            "text-[var(--pd-text-xs)]",
            "text-[var(--pd-color-fg-muted)]",
            "leading-relaxed",
          )}
        >
          {description}
        </p>
        {formattedTime && (
          <p
            className={cn(
              "mt-[var(--pd-space-1)]",
              "text-[var(--pd-text-2xs)]",
              "text-[var(--pd-color-fg-subtle)]",
            )}
          >
            {formattedTime}
          </p>
        )}
      </div>
    </div>
  );
};

PdBuddyEventCard.displayName = "PdBuddyEventCard";
