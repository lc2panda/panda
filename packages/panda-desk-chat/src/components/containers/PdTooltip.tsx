// Input: Content to contain/overlay/organize
// Output: Structured container with interaction patterns
// Pos: Container layer — wraps atoms and content blocks
import React, { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface PdTooltipProps {
  content: string;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

const sideStyles: Record<NonNullable<PdTooltipProps["side"]>, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-[var(--pd-space-1\\.5)]",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-[var(--pd-space-1\\.5)]",
  left: "right-full top-1/2 -translate-y-1/2 mr-[var(--pd-space-1\\.5)]",
  right: "left-full top-1/2 -translate-y-1/2 ml-[var(--pd-space-1\\.5)]",
};

export function PdTooltip({
  content,
  children,
  side = "top",
  delay = 400,
}: PdTooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useRef(`pd-tooltip-${Math.random().toString(36).slice(2, 8)}`).current;

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  }, []);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {/* Trigger — clone child to attach aria */}
      {React.cloneElement(children, {
        "aria-describedby": visible ? tooltipId : undefined,
      })}

      {/* Tooltip bubble */}
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            "absolute z-[var(--pd-z-popover)]",
            "whitespace-nowrap",
            "rounded-[var(--pd-radius-sm)]",
            "px-[var(--pd-space-2)] py-[var(--pd-space-1)]",
            "text-[var(--pd-text-xs)]",
            "font-[var(--pd-font-medium)]",
            "pointer-events-auto",
            // Light: dark bg, light text — Dark: light bg, dark text
            // Uses palette directly for contrast inversion
            "bg-[var(--pd-palette-ink-900)] text-[var(--pd-palette-cream-100)]",
            "[data-pd-theme='dark']_&:bg-[var(--pd-palette-cream-100)] [data-pd-theme='dark']_&:text-[var(--pd-palette-ink-900)]",
            "shadow-[var(--pd-shadow-md)]",
            "transition-opacity duration-[var(--pd-duration-fast)]",
            sideStyles[side],
          )}
          // Inline dark mode override for tooltip inversion
          style={{
            animationDuration: "var(--pd-duration-fast)",
          }}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={hide}
        >
          {content}
        </div>
      )}
    </div>
  );
}
