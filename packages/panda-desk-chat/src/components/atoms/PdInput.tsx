// Input: User text input, error/icon/clearable props
// Output: Styled input field with a11y support
// Pos: Atom layer — building block for all composite components
import React, { forwardRef, useRef, useImperativeHandle } from "react";
import { cn } from "../../lib/cn";

export interface PdInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

export const PdInput = forwardRef<HTMLInputElement, PdInputProps>(
  ({ error, icon, clearable, onClear, className, disabled, value, ...rest }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    const hasValue =
      value !== undefined && value !== null && String(value).length > 0;

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (innerRef.current) {
        // Dispatch a native change event to support uncontrolled inputs
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        nativeInputValueSetter?.call(innerRef.current, "");
        innerRef.current.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };

    return (
      <div className={cn("relative inline-flex items-center w-full", className)}>
        {icon && (
          <span className="absolute left-3 text-[var(--pd-color-fg-muted)] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={innerRef}
          value={value}
          disabled={disabled}
          className={cn(
            "h-9 w-full px-3 text-sm",
            "rounded-[var(--pd-radius-sm)]",
            "border border-[var(--pd-color-border)]",
            "bg-[var(--pd-color-bg)] text-[var(--pd-color-fg)]",
            "placeholder:text-[var(--pd-color-fg-muted)]",
            "transition-colors duration-[var(--pd-duration-quick)]",
            "focus:outline-none focus:border-[var(--pd-color-border-focus)]",
            "focus:shadow-[var(--pd-shadow-focus)]",
            error && "border-[var(--pd-color-error)]",
            disabled && "bg-[var(--pd-color-bg-disabled)] opacity-50 cursor-not-allowed",
            icon && "pl-9",
            clearable && hasValue && "pr-8",
          )}
          {...rest}
        />
        {clearable && hasValue && (
          <button
            type="button"
            tabIndex={-1}
            onClick={handleClear}
            className={cn(
              "absolute right-2 p-0.5 rounded-[var(--pd-radius-sm)]",
              "text-[var(--pd-color-fg-muted)] hover:text-[var(--pd-color-fg)]",
              "hover:bg-[var(--pd-color-bg-hover)]",
              "transition-colors duration-[var(--pd-duration-quick)]",
            )}
            aria-label="Clear input"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M4 4l6 6M10 4l-6 6" />
            </svg>
          </button>
        )}
      </div>
    );
  },
);

PdInput.displayName = "PdInput";
