// Input: User text input, autoResize/maxHeight/error/onSubmit props
// Output: Styled auto-resizing textarea with keyboard shortcuts
// Pos: Atom layer — building block for all composite components
import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  useCallback,
} from "react";
import { cn } from "../../lib/cn";

export interface PdTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
  maxHeight?: number;
  error?: boolean;
  onSubmit?: () => void;
}

export const PdTextarea = forwardRef<HTMLTextAreaElement, PdTextareaProps>(
  (
    {
      autoResize = false,
      maxHeight = 200,
      error,
      onSubmit,
      className,
      disabled,
      onKeyDown,
      onChange,
      value,
      ...rest
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    const resize = useCallback(() => {
      const el = innerRef.current;
      if (!el || !autoResize) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
      el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [autoResize, maxHeight]);

    // Resize on value change
    useEffect(() => {
      resize();
    }, [value, resize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      resize();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Cmd/Ctrl+Enter -> submit
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onSubmit?.();
      }
      onKeyDown?.(e);
    };

    return (
      <textarea
        ref={innerRef}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full px-3 py-2 text-sm min-h-[36px]",
          "rounded-[var(--pd-radius-sm)]",
          "border border-[var(--pd-color-border)]",
          "bg-[var(--pd-color-bg)] text-[var(--pd-color-fg)]",
          "placeholder:text-[var(--pd-color-fg-muted)]",
          "transition-colors duration-[var(--pd-duration-quick)]",
          "focus:outline-none focus:border-[var(--pd-color-border-focus)]",
          "focus:shadow-[var(--pd-shadow-focus)]",
          "resize-none",
          error && "border-[var(--pd-color-error)]",
          disabled && "bg-[var(--pd-color-bg-disabled)] opacity-50 cursor-not-allowed",
          className,
        )}
        {...rest}
      />
    );
  },
);

PdTextarea.displayName = "PdTextarea";
