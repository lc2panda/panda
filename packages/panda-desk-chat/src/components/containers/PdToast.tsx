// Input: Content to contain/overlay/organize
// Output: Structured container with interaction patterns
// Pos: Container layer — wraps atoms and content blocks
import React, { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface PdToastProps {
  id: string;
  type: ToastType;
  message: string;
  onDismiss: (id: string) => void;
  duration?: number;
}

export interface PdToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  position?: "top-right" | "bottom-right";
}

/* -------------------------------------------------------------------------- */
/*  Icon & color maps                                                         */
/* -------------------------------------------------------------------------- */

const iconMap: Record<ToastType, string> = {
  info: "\u2139",      // ℹ
  success: "\u2713",   // ✓
  warning: "\u26A0",   // ⚠
  error: "\u2715",     // ✕
};

const borderColorMap: Record<ToastType, string> = {
  info: "var(--pd-color-info)",
  success: "var(--pd-color-success)",
  warning: "var(--pd-color-warning)",
  error: "var(--pd-color-error)",
};

const iconColorMap: Record<ToastType, string> = {
  info: "var(--pd-color-info)",
  success: "var(--pd-color-success)",
  warning: "var(--pd-color-warning)",
  error: "var(--pd-color-error)",
};

/* -------------------------------------------------------------------------- */
/*  PdToast                                                                   */
/* -------------------------------------------------------------------------- */

export function PdToast({ id, type, message, onDismiss, duration = 5000 }: PdToastProps) {
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      setVisible(false);
      // Wait for fade-out before removing
      setTimeout(() => onDismiss(id), 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => onDismiss(id), 200);
  }, [id, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-[var(--pd-space-3)]",
        "w-[320px]",
        "rounded-[var(--pd-radius-md)]",
        "bg-[var(--pd-color-bg-elevated)]",
        "border border-[var(--pd-color-border-subtle)]",
        "shadow-[var(--pd-shadow-md)]",
        "p-[var(--pd-space-3)]",
        "transition-all duration-[var(--pd-duration-normal)]",
        visible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
      )}
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: borderColorMap[type],
      }}
    >
      {/* Icon */}
      <span
        className="flex-shrink-0 text-[var(--pd-text-base)] leading-none mt-[2px]"
        style={{ color: iconColorMap[type] }}
        aria-hidden="true"
      >
        {iconMap[type]}
      </span>

      {/* Message */}
      <span className="flex-1 text-[var(--pd-text-sm)] text-[var(--pd-color-fg)] leading-[var(--pd-leading-body)]">
        {message}
      </span>

      {/* Close */}
      <button
        type="button"
        onClick={handleClose}
        className={cn(
          "flex-shrink-0 p-[var(--pd-space-0\\.5)]",
          "text-[var(--pd-color-fg-muted)] hover:text-[var(--pd-color-fg)]",
          "rounded-[var(--pd-radius-sm)]",
          "transition-colors duration-[var(--pd-duration-fast)]",
        )}
        aria-label="Dismiss"
      >
        <span aria-hidden="true">{"\u2715"}</span>
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PdToastContainer                                                          */
/* -------------------------------------------------------------------------- */

export function PdToastContainer({
  toasts,
  onDismiss,
  position = "top-right",
}: PdToastContainerProps) {
  return (
    <div
      className={cn(
        "fixed flex flex-col gap-[var(--pd-space-2)]",
        "p-[var(--pd-space-4)]",
        "pointer-events-none",
        position === "top-right" && "top-0 right-0",
        position === "bottom-right" && "bottom-0 right-0",
      )}
      style={{ zIndex: "var(--pd-z-popover)" } as React.CSSProperties}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <PdToast
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onDismiss={onDismiss}
            duration={toast.duration}
          />
        </div>
      ))}
    </div>
  );
}
