// Input: icon, title, description, action ReactNode props
// Output: Centered empty-state placeholder with optional CTA
// Pos: Special layer — zero-data state display
import React, { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface PdEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PdEmptyState = forwardRef<HTMLDivElement, PdEmptyStateProps>(
  ({ icon, title, description, action, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center",
          "py-[var(--pd-space-12)] px-[var(--pd-space-6)]",
          className,
        )}
      >
        {icon && (
          <div className="mb-[var(--pd-space-4)] text-[var(--pd-color-fg-muted)]">
            <div className="w-12 h-12 flex items-center justify-center">{icon}</div>
          </div>
        )}
        <h3 className="text-[var(--pd-text-lg)] font-[var(--pd-font-semibold)] text-[var(--pd-color-fg)]">
          {title}
        </h3>
        {description && (
          <p className="mt-[var(--pd-space-2)] text-[var(--pd-text-sm)] text-[var(--pd-color-fg-muted)] max-w-sm">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-[var(--pd-space-6)]">{action}</div>
        )}
      </div>
    );
  },
);

PdEmptyState.displayName = "PdEmptyState";
