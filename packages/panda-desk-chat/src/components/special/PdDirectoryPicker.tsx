// Input: value (path string), onChange, label props
// Output: Directory path display with browse button
// Pos: Special layer — file-system directory selector UI
import React, { forwardRef } from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PdDirectoryPickerProps {
  value: string;
  onChange: (path: string) => void;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const PdDirectoryPicker = forwardRef<HTMLDivElement, PdDirectoryPickerProps>(
  ({ value, onChange, label, disabled = false, placeholder = "Select directory…", className }, ref) => {
    const handleBrowse = async () => {
      if (disabled) return;
      try {
        // Attempt IPC bridge for Electron environment
        const w = (window as unknown) as Record<string, unknown>;
        if (w.electronAPI && typeof (w.electronAPI as Record<string, unknown>).selectDirectory === "function") {
          const result = await (w.electronAPI as { selectDirectory: () => Promise<string | null> }).selectDirectory();
          if (result) onChange(result);
        } else {
          // Fallback: prompt
          const result = window.prompt("Enter directory path:", value);
          if (result !== null) onChange(result);
        }
      } catch {
        // Silent fallback — prompt
        const result = window.prompt("Enter directory path:", value);
        if (result !== null) onChange(result);
      }
    };

    return (
      <div ref={ref} className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label className="text-sm font-medium text-[var(--pd-color-fg)]">{label}</label>
        )}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex-1 flex items-center h-9 px-3 rounded-[var(--pd-radius-sm)]",
              "border border-[var(--pd-color-border)] bg-[var(--pd-color-bg)]",
              "text-sm truncate",
              value
                ? "text-[var(--pd-color-fg)]"
                : "text-[var(--pd-color-fg-muted)]",
              disabled && "opacity-50",
            )}
            title={value || undefined}
          >
            {value || placeholder}
          </div>
          <button
            type="button"
            onClick={handleBrowse}
            disabled={disabled}
            className={cn(
              "inline-flex items-center justify-center h-9 px-3 gap-1.5",
              "rounded-[var(--pd-radius-sm)]",
              "border border-[var(--pd-color-border-strong)] bg-transparent",
              "text-sm text-[var(--pd-color-fg)]",
              "hover:bg-[var(--pd-color-bg-hover)]",
              "transition-colors duration-[var(--pd-duration-quick)]",
              "focus-visible:outline-none focus-visible:shadow-[var(--pd-shadow-focus)]",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            aria-label="Browse directory"
          >
            <FolderOpen className="w-4 h-4" />
            Browse
          </button>
        </div>
      </div>
    );
  },
);

PdDirectoryPicker.displayName = "PdDirectoryPicker";
