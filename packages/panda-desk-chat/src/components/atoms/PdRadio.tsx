// Input: options array, value, onChange, name/disabled props
// Output: Accessible radio group with CSS-variable theming
// Pos: Atom layer — form primitive for single-choice selection
import React, { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface PdRadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface PdRadioProps {
  options: PdRadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name: string;
  disabled?: boolean;
  className?: string;
}

export const PdRadio = forwardRef<HTMLDivElement, PdRadioProps>(
  ({ options, value, onChange, name, disabled = false, className }, ref) => {
    return (
      <div ref={ref} role="radiogroup" aria-label={name} className={cn("flex flex-col gap-2", className)}>
        {options.map((opt) => {
          const isSelected = opt.value === value;
          const isDisabled = disabled || opt.disabled;

          return (
            <label
              key={opt.value}
              className={cn(
                "inline-flex items-center gap-2 select-none",
                isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              )}
            >
              <input
                type="radio"
                role="radio"
                name={name}
                value={opt.value}
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => !isDisabled && onChange?.(opt.value)}
                className="sr-only peer"
              />
              <span
                className={cn(
                  "inline-flex items-center justify-center w-4 h-4 rounded-full",
                  "border-2 border-[var(--pd-color-border-strong)]",
                  "transition-colors duration-[var(--pd-duration-quick)]",
                  "peer-focus-visible:shadow-[var(--pd-shadow-focus)]",
                  isSelected && "border-[var(--pd-color-terra-500)]",
                )}
              >
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[var(--pd-color-terra-500)]" />
                )}
              </span>
              <span className="text-sm text-[var(--pd-color-fg)]">{opt.label}</span>
            </label>
          );
        })}
      </div>
    );
  },
);

PdRadio.displayName = "PdRadio";
