// Input: checked state, onChange callback, size/disabled/label props
// Output: Accessible toggle switch with CSS-variable theming
// Pos: Atom layer — building block for all composite components
import React from "react";
import { cn } from "../../lib/cn";

export interface PdSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: "sm" | "md";
  disabled?: boolean;
  label?: string;
  className?: string;
}

const trackSizes: Record<string, string> = {
  sm: "w-8 h-4",
  md: "w-10 h-5",
};

const thumbSizes: Record<string, string> = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
};

const thumbTranslate: Record<string, string> = {
  sm: "translate-x-4",
  md: "translate-x-5",
};

export const PdSwitch: React.FC<PdSwitchProps> = ({
  checked,
  onChange,
  size = "md",
  disabled = false,
  label,
  className,
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  const track = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full",
        "transition-colors duration-[var(--pd-duration-quick)]",
        "focus-visible:outline-none focus-visible:shadow-[var(--pd-shadow-focus)]",
        trackSizes[size],
        checked
          ? "bg-[var(--pd-color-accent)]"
          : "bg-[var(--pd-color-border-strong)]",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full bg-[var(--pd-color-bg-elevated)] shadow-sm",
          "transition-transform duration-[var(--pd-duration-quick)]",
          "translate-x-0.5",
          thumbSizes[size],
          checked && thumbTranslate[size],
        )}
      />
    </button>
  );

  if (label) {
    return (
      <label
        className={cn(
          "inline-flex items-center gap-2 text-sm text-[var(--pd-color-fg)]",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        {track}
        <span>{label}</span>
      </label>
    );
  }

  return <span className={className}>{track}</span>;
};

PdSwitch.displayName = "PdSwitch";
