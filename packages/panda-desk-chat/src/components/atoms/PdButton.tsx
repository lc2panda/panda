// Input: User click/keyboard interactions, variant/size/loading/icon props
// Output: Styled button primitive with a11y support, polymorphic rendering
// Pos: Atom layer — building block for all composite components
import React, { forwardRef } from "react";
import { cn } from "../../lib/cn";
import { PdSpinner } from "./PdSpinner";

export interface PdButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "link";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  as?: React.ElementType;
}

const variantStyles: Record<string, string> = {
  primary: [
    "bg-[var(--pd-color-accent)] text-[var(--pd-color-fg-on-accent)]",
    "hover:bg-[var(--pd-color-accent-hover)]",
    "active:bg-[var(--pd-color-accent-active)]",
  ].join(" "),
  secondary: [
    "border border-[var(--pd-color-border-strong)] bg-transparent",
    "text-[var(--pd-color-fg)]",
    "hover:bg-[var(--pd-color-bg-hover)]",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--pd-color-fg)]",
    "hover:bg-[var(--pd-color-bg-hover)]",
  ].join(" "),
  danger: [
    "bg-[var(--pd-color-error)] text-white",
    "hover:opacity-90",
    "active:opacity-80",
  ].join(" "),
  link: [
    "bg-transparent text-[var(--pd-color-accent)] underline",
    "hover:text-[var(--pd-color-accent-hover)]",
    "p-0 h-auto",
  ].join(" "),
};

const sizeStyles: Record<string, string> = {
  xs: "h-6 px-2 text-xs gap-1",
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 px-4 text-base gap-2",
  lg: "h-11 px-6 text-lg gap-2",
};

const spinnerSizeMap: Record<string, "xs" | "sm" | "md" | "lg"> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "md",
};

export const PdButton = forwardRef<HTMLButtonElement, PdButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconRight,
      as,
      className,
      disabled,
      children,
      ...rest
    },
    ref,
  ) => {
    const Component = as || "button";
    const isDisabled = disabled || loading;

    return (
      <Component
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium",
          "rounded-[var(--pd-radius-sm)]",
          "transition-colors",
          "duration-[var(--pd-duration-quick)]",
          "focus-visible:outline-none focus-visible:shadow-[var(--pd-shadow-focus)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          loading && "pointer-events-none opacity-70",
          className,
        )}
        disabled={isDisabled}
        {...rest}
      >
        {loading ? (
          <PdSpinner variant="ring" size={spinnerSizeMap[size]} />
        ) : (
          <>
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
            {iconRight && <span className="shrink-0">{iconRight}</span>}
          </>
        )}
      </Component>
    );
  },
);

PdButton.displayName = "PdButton";
