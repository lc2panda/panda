// Input: options array, value, onChange props
// Output: Segmented control with sliding active indicator
// Pos: Special layer — tab-like toggle for switching views/modes
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface PdSegmentedOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface PdSegmentedControlProps {
  options: PdSegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const PdSegmentedControl = forwardRef<HTMLDivElement, PdSegmentedControlProps>(
  ({ options, value, onChange, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    // Update indicator position
    useEffect(() => {
      if (!containerRef.current) return;
      const idx = options.findIndex((o) => o.value === value);
      if (idx < 0) return;
      const buttons = containerRef.current.querySelectorAll<HTMLElement>('[role="tab"]');
      const btn = buttons[idx];
      if (btn) {
        setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
      }
    }, [value, options]);

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex relative p-0.5 rounded-[var(--pd-radius-md)]",
          "bg-[var(--pd-color-bg-hover)]",
          className,
        )}
      >
        {/* Sliding indicator */}
        <div
          className={cn(
            "absolute top-0.5 bottom-0.5 rounded-[var(--pd-radius-sm)]",
            "bg-[var(--pd-color-bg-elevated)] shadow-sm",
            "transition-all duration-[var(--pd-duration-normal)] ease-[var(--pd-ease-standard)]",
          )}
          style={{ left: indicator.left, width: indicator.width }}
        />

        <div ref={containerRef} role="tablist" className="relative flex">
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={opt.disabled}
                onClick={() => !opt.disabled && onChange(opt.value)}
                className={cn(
                  "relative z-10 px-3 py-1.5 text-sm font-medium",
                  "rounded-[var(--pd-radius-sm)]",
                  "transition-colors duration-[var(--pd-duration-quick)]",
                  "focus-visible:outline-none focus-visible:shadow-[var(--pd-shadow-focus)]",
                  isActive
                    ? "text-[var(--pd-color-fg)]"
                    : "text-[var(--pd-color-fg-muted)] hover:text-[var(--pd-color-fg)]",
                  opt.disabled && "opacity-50 cursor-not-allowed",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);

PdSegmentedControl.displayName = "PdSegmentedControl";
