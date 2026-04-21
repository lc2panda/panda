// Input: checked state, onChange callback, label/disabled/indeterminate props
// Output: Accessible checkbox with CSS-variable theming
// Pos: Atom layer — form primitive for boolean/indeterminate selection
import React, { forwardRef, useEffect, useRef } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PdCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  className?: string;
}

export const PdCheckbox = forwardRef<HTMLInputElement, PdCheckboxProps>(
  ({ checked = false, onChange, label, disabled = false, indeterminate = false, className }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    useEffect(() => {
      if (inputRef && "current" in inputRef && inputRef.current) {
        inputRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate, inputRef]);

    const handleChange = () => {
      if (!disabled) onChange?.(!checked);
    };

    return (
      <label
        className={cn(
          "inline-flex items-center gap-2 select-none",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          className,
        )}
      >
        <input
          ref={inputRef}
          type="checkbox"
          role="checkbox"
          aria-checked={indeterminate ? "mixed" : checked}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only peer"
        />
        <span
          className={cn(
            "inline-flex items-center justify-center w-4 h-4 rounded-[3px]",
            "border border-[var(--pd-color-border-strong)]",
            "transition-colors duration-[var(--pd-duration-quick)]",
            "peer-focus-visible:shadow-[var(--pd-shadow-focus)]",
            (checked || indeterminate) && "bg-[var(--pd-color-bamboo-500)] border-[var(--pd-color-bamboo-500)]",
          )}
        >
          {checked && !indeterminate && <Check className="w-3 h-3 text-white" />}
          {indeterminate && <Minus className="w-3 h-3 text-white" />}
        </span>
        {label && (
          <span className="text-sm text-[var(--pd-color-fg)]">{label}</span>
        )}
      </label>
    );
  },
);

PdCheckbox.displayName = "PdCheckbox";
