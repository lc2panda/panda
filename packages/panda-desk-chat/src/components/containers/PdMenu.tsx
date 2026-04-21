// Input: items config, onSelect callback, trigger ReactNode
// Output: Context menu with keyboard navigation and a11y
// Pos: Container layer — overlay menu for contextual actions
import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface PdMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
}

export interface PdMenuProps {
  items: PdMenuItem[];
  onSelect?: (id: string) => void;
  trigger: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}

export function PdMenu({ items, onSelect, trigger, align = "start", className }: PdMenuProps) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const actionItems = items.filter((i) => !i.separator && !i.disabled);

  // Outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Esc close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); setOpen(false); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIdx((i) => (i + 1) % actionItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIdx((i) => (i <= 0 ? actionItems.length - 1 : i - 1));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (focusIdx >= 0 && focusIdx < actionItems.length) {
          onSelect?.(actionItems[focusIdx].id);
          setOpen(false);
        }
      }
    },
    [open, focusIdx, actionItems, onSelect],
  );

  // Reset focus on open
  useEffect(() => {
    if (open) setFocusIdx(-1);
  }, [open]);

  // Scroll focused into view
  useEffect(() => {
    if (!open || focusIdx < 0 || !menuRef.current) return;
    const els = menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]');
    els[focusIdx]?.scrollIntoView({ block: "nearest" });
  }, [focusIdx, open]);

  let actionIdx = -1;

  return (
    <div ref={containerRef} className={cn("relative inline-flex", className)} onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); } }}
      >
        {trigger}
      </div>

      {/* Menu panel */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={cn(
            "absolute top-full mt-1 z-[var(--pd-z-dropdown)]",
            "min-w-[200px] max-h-72 overflow-auto",
            "rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)]",
            "bg-[var(--pd-color-bg-elevated)] shadow-[var(--pd-shadow-lg)]",
            "py-1",
            align === "start" ? "left-0" : "right-0",
          )}
        >
          {items.map((item, i) => {
            if (item.separator) {
              return (
                <div
                  key={`sep-${i}`}
                  role="separator"
                  className="my-1 h-px bg-[var(--pd-color-border-subtle)]"
                />
              );
            }

            const myActionIdx = item.disabled ? -1 : ++actionIdx;
            const isFocused = myActionIdx >= 0 && myActionIdx === focusIdx;

            return (
              <div
                key={item.id}
                role="menuitem"
                tabIndex={item.disabled ? -1 : 0}
                aria-disabled={item.disabled || undefined}
                onClick={() => {
                  if (!item.disabled) { onSelect?.(item.id); setOpen(false); }
                }}
                onMouseEnter={() => { if (!item.disabled && myActionIdx >= 0) setFocusIdx(myActionIdx); }}
                className={cn(
                  "flex items-center gap-3 px-3 py-1.5 text-sm",
                  "cursor-pointer select-none outline-none",
                  "transition-colors duration-[var(--pd-duration-fast)]",
                  item.disabled
                    ? "text-[var(--pd-color-fg-disabled)] cursor-not-allowed"
                    : item.danger
                      ? "text-[var(--pd-color-error)] hover:bg-[var(--pd-color-error-bg)] focus:bg-[var(--pd-color-error-bg)]"
                      : "text-[var(--pd-color-fg)] hover:bg-[var(--pd-color-bg-hover)] focus:bg-[var(--pd-color-bg-hover)]",
                  isFocused && "bg-[var(--pd-color-bg-hover)]",
                )}
              >
                {item.icon && <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="ml-auto text-xs text-[var(--pd-color-fg-subtle)]">{item.shortcut}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
