// Input: variant/size/dot/count/children props
// Output: Styled badge/label/counter primitive with a11y support
// Pos: Atom layer — building block for all composite components
import React from "react";
import { cn } from "../../lib/cn";

export interface PdBadgeProps {
  variant?: "neutral" | "success" | "warning" | "error" | "info" | "accent";
  size?: "xs" | "sm";
  dot?: boolean;
  count?: number;
  children?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  neutral: "bg-[var(--pd-color-bg-subtle)] text-[var(--pd-color-fg-muted)]",
  success: "bg-[var(--pd-color-success-bg)] text-[var(--pd-color-success)]",
  warning: "bg-[var(--pd-color-warning-bg)] text-[var(--pd-color-warning)]",
  error: "bg-[var(--pd-color-error-bg)] text-[var(--pd-color-error)]",
  info: "bg-[var(--pd-color-info-bg)] text-[var(--pd-color-info)]",
  accent: "bg-[var(--pd-color-accent-subtle)] text-[var(--pd-color-accent-fg)]",
};

const dotColors: Record<string, string> = {
  neutral: "bg-[var(--pd-color-fg-muted)]",
  success: "bg-[var(--pd-color-success)]",
  warning: "bg-[var(--pd-color-warning)]",
  error: "bg-[var(--pd-color-error)]",
  info: "bg-[var(--pd-color-info)]",
  accent: "bg-[var(--pd-color-accent)]",
};

const sizeStyles: Record<string, string> = {
  xs: "text-[10px] px-1.5 py-0",
  sm: "text-xs px-2 py-0.5",
};

export const PdBadge: React.FC<PdBadgeProps> = ({
  variant = "neutral",
  size = "sm",
  dot = false,
  count,
  children,
  className,
}) => {
  // Dot-only mode: small circle for status indication
  if (dot) {
    return (
      <span
        className={cn(
          "relative inline-flex",
          className,
        )}
      >
        {children}
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
            dotColors[variant],
          )}
        />
      </span>
    );
  }

  // Count mode: numeric badge
  if (count !== undefined) {
    const display = count > 99 ? "99+" : String(count);
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center",
          "min-w-[18px] h-[18px] px-1",
          "rounded-[var(--pd-radius-full)]",
          "text-[10px] font-semibold leading-none",
          variantStyles[variant],
          className,
        )}
      >
        {display}
      </span>
    );
  }

  // Default: text badge
  return (
    <span
      className={cn(
        "inline-flex items-center",
        "rounded-[var(--pd-radius-full)]",
        "font-medium leading-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
};

PdBadge.displayName = "PdBadge";
