// Input: Content to contain/overlay/organize
// Output: Structured container with interaction patterns
// Pos: Container layer — wraps atoms and content blocks
import React from "react";
import { cn } from "@/lib/cn";

export interface PdCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: "flat" | "sm" | "md";
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap: Record<NonNullable<PdCardProps["padding"]>, string> = {
  none: "p-0",
  sm: "p-[var(--pd-space-2)]",
  md: "p-[var(--pd-space-4)]",
  lg: "p-[var(--pd-space-6)]",
};

export const PdCard = React.forwardRef<HTMLDivElement, PdCardProps>(
  (
    {
      elevation = "sm",
      interactive = false,
      padding = "md",
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--pd-radius-lg)]",
          "bg-[var(--pd-color-bg-elevated)]",
          "border border-[var(--pd-color-border-subtle)]",
          "text-[var(--pd-color-fg)]",
          paddingMap[padding],
          elevation === "flat" && "shadow-none",
          elevation === "sm" && "shadow-[var(--pd-shadow-sm)]",
          elevation === "md" && "shadow-[var(--pd-shadow-md)]",
          interactive &&
            "cursor-pointer transition-shadow duration-[var(--pd-duration-normal)] hover:shadow-[var(--pd-shadow-md)]",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

PdCard.displayName = "PdCard";
