// Input: Content to contain/overlay/organize
// Output: Structured container with interaction patterns
// Pos: Container layer — wraps atoms and content blocks
import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface PdDropdownProps {
  trigger: React.ReactElement;
  children: React.ReactNode;
  align?: "start" | "end";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface PdDropdownItemProps {
  icon?: React.ReactNode;
  label: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

/* -------------------------------------------------------------------------- */
/*  PdDropdown                                                                */
/* -------------------------------------------------------------------------- */

export function PdDropdown({
  trigger,
  children,
  align = "start",
  open: controlledOpen,
  onOpenChange,
}: PdDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const focusIndexRef = useRef(-1);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const toggle = useCallback(() => setOpen(!isOpen), [isOpen, setOpen]);

  // Outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, setOpen]);

  // Esc close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, setOpen]);

  // Keyboard navigation
  const getMenuItems = useCallback((): HTMLElement[] => {
    if (!menuRef.current) return [];
    return Array.from(
      menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'),
    );
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      const items = getMenuItems();
      if (items.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        focusIndexRef.current = (focusIndexRef.current + 1) % items.length;
        items[focusIndexRef.current].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        focusIndexRef.current =
          focusIndexRef.current <= 0
            ? items.length - 1
            : focusIndexRef.current - 1;
        items[focusIndexRef.current].focus();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (focusIndexRef.current >= 0 && focusIndexRef.current < items.length) {
          items[focusIndexRef.current].click();
        }
      }
    },
    [isOpen, getMenuItems],
  );

  // Reset focus index when opening
  useEffect(() => {
    if (isOpen) {
      focusIndexRef.current = -1;
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-flex" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      {React.cloneElement(trigger, {
        onClick: (e: React.MouseEvent) => {
          trigger.props.onClick?.(e);
          toggle();
        },
        "aria-haspopup": "menu",
        "aria-expanded": isOpen,
      })}

      {/* Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className={cn(
            "absolute top-full mt-[var(--pd-space-1)] z-[var(--pd-z-dropdown)]",
            "min-w-[180px]",
            "rounded-[var(--pd-radius-md)]",
            "border border-[var(--pd-color-border)]",
            "bg-[var(--pd-color-bg-elevated)]",
            "shadow-[var(--pd-shadow-lg)]",
            "py-[var(--pd-space-1)]",
            "overflow-hidden",
            "transition-opacity duration-[var(--pd-duration-fast)]",
            align === "start" ? "left-0" : "right-0",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PdDropdownItem                                                            */
/* -------------------------------------------------------------------------- */

export function PdDropdownItem({
  icon,
  label,
  shortcut,
  danger = false,
  disabled = false,
  onClick,
}: PdDropdownItemProps) {
  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) onClick?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !disabled) onClick?.();
      }}
      className={cn(
        "flex items-center gap-[var(--pd-space-3)]",
        "px-[var(--pd-space-3)] py-[var(--pd-space-1\\.5)]",
        "text-[var(--pd-text-sm)]",
        "cursor-pointer select-none",
        "transition-colors duration-[var(--pd-duration-fast)]",
        "outline-none",
        disabled
          ? "text-[var(--pd-color-fg-disabled)] cursor-not-allowed"
          : danger
            ? "text-[var(--pd-color-error)] hover:bg-[var(--pd-color-error-bg)] focus:bg-[var(--pd-color-error-bg)]"
            : "text-[var(--pd-color-fg)] hover:bg-[var(--pd-color-bg-hover)] focus:bg-[var(--pd-color-bg-hover)]",
      )}
    >
      {icon && <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{icon}</span>}
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className="ml-auto text-[var(--pd-text-xs)] text-[var(--pd-color-fg-subtle)]">
          {shortcut}
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PdDropdownSeparator                                                       */
/* -------------------------------------------------------------------------- */

export function PdDropdownSeparator() {
  return (
    <div
      role="separator"
      className="my-[var(--pd-space-1)] h-px bg-[var(--pd-color-border-subtle)]"
    />
  );
}
