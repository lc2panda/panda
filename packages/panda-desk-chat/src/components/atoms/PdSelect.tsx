// Input: options array, value, onChange, size/disabled/placeholder props
// Output: Accessible dropdown select with keyboard navigation
// Pos: Atom layer — form primitive for single-value selection
import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PdSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface PdSelectProps {
  options: PdSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles: Record<string, string> = {
  sm: "h-8 px-2 text-sm",
  md: "h-9 px-3 text-base",
  lg: "h-11 px-4 text-lg",
};

export const PdSelect = forwardRef<HTMLDivElement, PdSelectProps>(
  ({ options, value, onChange, placeholder = "Select…", disabled, size = "md", className }, ref) => {
    const [open, setOpen] = useState(false);
    const [focusIdx, setFocusIdx] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selected = options.find((o) => o.value === value);

    // Close on outside click
    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const enabled = options.filter((o) => !o.disabled);
        if (e.key === "Escape") { setOpen(false); return; }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!open) { setOpen(true); setFocusIdx(0); return; }
          if (focusIdx >= 0 && focusIdx < enabled.length) {
            onChange?.(enabled[focusIdx].value);
            setOpen(false);
          }
          return;
        }
        if (!open) return;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusIdx((i) => (i + 1) % enabled.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusIdx((i) => (i <= 0 ? enabled.length - 1 : i - 1));
        }
      },
      [open, focusIdx, options, onChange],
    );

    // Scroll focused item into view
    useEffect(() => {
      if (!open || focusIdx < 0 || !listRef.current) return;
      const items = listRef.current.querySelectorAll<HTMLElement>('[role="option"]');
      items[focusIdx]?.scrollIntoView({ block: "nearest" });
    }, [focusIdx, open]);

    return (
      <div ref={ref} className={cn("relative inline-block", className)}>
        <div
          ref={containerRef}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setOpen(!open)}
          onKeyDown={disabled ? undefined : handleKeyDown}
          className={cn(
            "flex items-center justify-between gap-2 rounded-[var(--pd-radius-sm)]",
            "border border-[var(--pd-color-border)] bg-[var(--pd-color-bg)]",
            "transition-colors duration-[var(--pd-duration-quick)]",
            "focus-visible:outline-none focus-visible:shadow-[var(--pd-shadow-focus)]",
            "cursor-pointer select-none",
            sizeStyles[size],
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <span className={cn(!selected && "text-[var(--pd-color-fg-muted)]")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="w-4 h-4 shrink-0 text-[var(--pd-color-fg-muted)]" />
        </div>

        {open && (
          <ul
            ref={listRef}
            role="listbox"
            className={cn(
              "absolute z-[var(--pd-z-dropdown)] mt-1 w-full max-h-60 overflow-auto",
              "rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)]",
              "bg-[var(--pd-color-bg-elevated)] shadow-[var(--pd-shadow-lg)]",
              "py-1",
            )}
          >
            {options.filter((o) => !o.disabled).map((opt, idx) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer select-none",
                  "transition-colors duration-[var(--pd-duration-fast)]",
                  idx === focusIdx && "bg-[var(--pd-color-bg-hover)]",
                  opt.value === value
                    ? "text-[var(--pd-color-accent)] font-medium"
                    : "text-[var(--pd-color-fg)]",
                )}
                onClick={() => { onChange?.(opt.value); setOpen(false); }}
                onMouseEnter={() => setFocusIdx(idx)}
              >
                <span className="flex-1">{opt.label}</span>
                {opt.value === value && <Check className="w-4 h-4" />}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);

PdSelect.displayName = "PdSelect";
