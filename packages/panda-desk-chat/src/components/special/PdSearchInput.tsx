// Input: value, onChange, onClear, placeholder, autoFocus props
// Output: Search input with icon, clear button, and shortcut hint
// Pos: Special layer — search/filter input for lists and panels
import React, { forwardRef, useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PdSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  shortcutHint?: string;
  disabled?: boolean;
  className?: string;
}

export const PdSearchInput = forwardRef<HTMLInputElement, PdSearchInputProps>(
  ({ value, onChange, placeholder = "Search…", onClear, autoFocus, shortcutHint, disabled, className }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    const handleClear = () => {
      onChange("");
      onClear?.();
      inputRef.current?.focus();
    };

    return (
      <div className={cn("relative flex items-center", className)}>
        <Search className="absolute left-3 w-4 h-4 text-[var(--pd-color-fg-muted)] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          className={cn(
            "w-full h-9 pl-9 pr-8 rounded-[var(--pd-radius-sm)]",
            "border border-[var(--pd-color-border)] bg-[var(--pd-color-bg)]",
            "text-[var(--pd-color-fg)] text-sm placeholder:text-[var(--pd-color-fg-muted)]",
            "transition-colors duration-[var(--pd-duration-quick)]",
            "focus:outline-none focus:shadow-[var(--pd-shadow-focus)]",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "absolute right-2 p-0.5 rounded-[var(--pd-radius-sm)]",
              "text-[var(--pd-color-fg-muted)] hover:text-[var(--pd-color-fg)]",
              "hover:bg-[var(--pd-color-bg-hover)]",
              "transition-colors duration-[var(--pd-duration-fast)]",
            )}
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {shortcutHint && !value && (
          <span className="absolute right-3 text-xs text-[var(--pd-color-fg-subtle)] pointer-events-none">
            {shortcutHint}
          </span>
        )}
      </div>
    );
  },
);

PdSearchInput.displayName = "PdSearchInput";
