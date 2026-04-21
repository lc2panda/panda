// Input: open state, onClose callback, side/width/title/children props
// Output: Slide-in drawer overlay with a11y and keyboard support
// Pos: Container layer — modal panel for secondary content
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PdDrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  width?: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PdDrawer({
  open,
  onClose,
  side = "right",
  width = "360px",
  title,
  children,
  className,
}: PdDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const els = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (els.length === 0) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, []);

  // Auto-focus on open
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const t = setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const isRight = side === "right";
  const translateHidden = isRight ? "translate-x-full" : "-translate-x-full";
  const translateVisible = "translate-x-0";
  const posClass = isRight ? "right-0" : "left-0";

  return ReactDOM.createPortal(
    <div
      className={cn(
        "fixed inset-0 bg-[var(--pd-color-scrim)]",
        "transition-opacity duration-[var(--pd-duration-normal)]",
        visible ? "opacity-100" : "opacity-0",
      )}
      style={{ zIndex: "var(--pd-z-modal)" } as React.CSSProperties}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Drawer"}
        onKeyDown={handleKeyDown}
        style={{ width }}
        className={cn(
          "fixed top-0 h-full flex flex-col",
          "bg-[var(--pd-color-bg-elevated)]",
          "border-[var(--pd-color-border)]",
          isRight ? "border-l" : "border-r",
          "shadow-[var(--pd-shadow-xl)]",
          "transition-transform ease-[var(--pd-ease-standard)]",
          "duration-[var(--pd-duration-normal)]",
          posClass,
          visible ? translateVisible : translateHidden,
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[var(--pd-space-4)] py-[var(--pd-space-3)] border-b border-[var(--pd-color-border-subtle)]">
          {title && (
            <h2 className="text-[var(--pd-text-lg)] font-[var(--pd-font-semibold)] text-[var(--pd-color-fg)]">
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "p-1 rounded-[var(--pd-radius-sm)]",
              "text-[var(--pd-color-fg-muted)] hover:bg-[var(--pd-color-bg-hover)]",
              "transition-colors duration-[var(--pd-duration-quick)]",
              "focus-visible:outline-none focus-visible:shadow-[var(--pd-shadow-focus)]",
            )}
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-[var(--pd-space-4)] py-[var(--pd-space-4)]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
