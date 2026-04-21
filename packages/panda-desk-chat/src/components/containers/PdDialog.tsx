// Input: Content to contain/overlay/organize
// Output: Structured container with interaction patterns
// Pos: Container layer — wraps atoms and content blocks
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { cn } from "@/lib/cn";

export interface PdDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "full";
  destructive?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sizeMap: Record<NonNullable<PdDialogProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  full: "max-w-[90vw] max-h-[85vh]",
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PdDialog({
  open,
  onClose,
  title,
  description,
  size = "md",
  destructive = false,
  children,
  footer,
}: PdDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    if (open) {
      // Force layout before triggering animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [],
  );

  // Auto-focus first focusable element on open
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const timer = setTimeout(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  const titleId = title ? "pd-dialog-title" : undefined;
  const descId = description ? "pd-dialog-desc" : undefined;

  return ReactDOM.createPortal(
    // Backdrop
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center",
        "bg-[var(--pd-color-scrim)]",
        "transition-opacity",
        `duration-[var(--pd-duration-normal)]`,
        visible ? "opacity-100" : "opacity-0",
      )}
      style={{ zIndex: "var(--pd-z-modal)" } as React.CSSProperties}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Dialog panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex flex-col",
          "bg-[var(--pd-color-bg-elevated)]",
          "border border-[var(--pd-color-border)]",
          "rounded-[var(--pd-radius-xl)]",
          "shadow-[var(--pd-shadow-xl)]",
          "w-full overflow-hidden",
          sizeMap[size],
          "transition-all",
          `duration-[var(--pd-duration-normal)]`,
          visible
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0",
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-[var(--pd-space-6)] pt-[var(--pd-space-6)] pb-[var(--pd-space-2)]">
            {title && (
              <h2
                id={titleId}
                className={cn(
                  "text-[var(--pd-text-lg)] font-[var(--pd-font-semibold)]",
                  destructive
                    ? "text-[var(--pd-color-error)]"
                    : "text-[var(--pd-color-fg)]",
                )}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                id={descId}
                className="mt-[var(--pd-space-1)] text-[var(--pd-text-sm)] text-[var(--pd-color-fg-muted)]"
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-[var(--pd-space-6)] py-[var(--pd-space-4)]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-[var(--pd-space-3)] border-t border-[var(--pd-color-border-subtle)] px-[var(--pd-space-6)] py-[var(--pd-space-4)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
