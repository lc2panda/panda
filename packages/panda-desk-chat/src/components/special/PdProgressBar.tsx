// Input: value (0-100), variant, size, label props
// Output: Accessible horizontal progress bar
// Pos: Special layer — progress/status visualization
import React, { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface PdProgressBarProps {
  value: number;
  variant?: "default" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const variantColors: Record<string, string> = {
  default: "bg-[var(--pd-color-accent)]",
  success: "bg-[var(--pd-color-success)]",
  warning: "bg-[var(--pd-color-warning)]",
  error: "bg-[var(--pd-color-error)]",
};

const sizeHeights: Record<string, string> = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export const PdProgressBar = forwardRef<HTMLDivElement, PdProgressBarProps>(
  ({ value, variant = "default", size = "md", label, className }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {label && (
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[var(--pd-color-fg)]">{label}</span>
            <span className="text-xs text-[var(--pd-color-fg-muted)]">{Math.round(clamped)}%</span>
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
          className={cn(
            "w-full rounded-full overflow-hidden",
            "bg-[var(--pd-color-bg-hover)]",
            sizeHeights[size],
          )}
        >
          <div
            className={cn(
              "h-full rounded-full",
              "transition-[width] duration-[var(--pd-duration-normal)] ease-[var(--pd-ease-standard)]",
              variantColors[variant],
            )}
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    );
  },
);

PdProgressBar.displayName = "PdProgressBar";
