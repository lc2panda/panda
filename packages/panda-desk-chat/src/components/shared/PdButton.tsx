// Input: variant / size / loading / icon / native button props
// Output: themed button (primary gradient / secondary / danger / ghost) with optional spinner
// Pos: Shared layer — primary action surface across cc-haha-derived dialogs
//
// Source 1:1: cc-haha desktop/src/components/shared/Button.tsx (L1-L63)

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[image:var(--pd-gradient-btn-primary)] text-[var(--pd-color-btn-primary-fg)] shadow-[var(--pd-shadow-button-primary)] hover:bg-[image:var(--pd-gradient-btn-primary-hover)] hover:brightness-105 active:translate-y-[1px]',
  secondary:
    'bg-[var(--pd-color-surface)] text-[var(--pd-color-text-primary)] border border-[var(--pd-color-border)] hover:bg-[var(--pd-color-surface-hover)]',
  danger:
    'bg-[var(--pd-color-error)] text-white hover:opacity-90',
  ghost:
    'bg-transparent text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)] hover:text-[var(--pd-color-text-primary)]',
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export function PdButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-1.5 rounded-[var(--pd-radius-md)]
        font-medium transition-colors duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}
      `}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
