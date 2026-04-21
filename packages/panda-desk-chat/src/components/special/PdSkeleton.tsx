// Input: width, height, variant, animate props
// Output: Placeholder skeleton with shimmer animation
// Pos: Special layer — loading state indicator
import React, { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface PdSkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: "text" | "circular" | "rectangular";
  animate?: boolean;
  className?: string;
}

export const PdSkeleton = forwardRef<HTMLDivElement, PdSkeletonProps>(
  ({ width, height, variant = "text", animate = true, className }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        style={{ width, height: height ?? (variant === "text" ? "1em" : undefined) }}
        className={cn(
          "bg-[var(--pd-color-bg-hover)]",
          variant === "circular" && "rounded-full aspect-square",
          variant === "rectangular" && "rounded-[var(--pd-radius-sm)]",
          variant === "text" && "rounded-[var(--pd-radius-sm)] w-full",
          animate && "animate-pulse",
          className,
        )}
      />
    );
  },
);

PdSkeleton.displayName = "PdSkeleton";
