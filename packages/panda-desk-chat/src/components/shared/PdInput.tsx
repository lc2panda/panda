// Input: native input props + label / error / required
// Output: labeled text input with focus-ring + error-state styling
// Pos: Shared layer — form fields across settings / provider dialogs
//
// Source 1:1: cc-haha desktop/src/components/shared/Input.tsx (L1-L38)

import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  required?: boolean;
};

export function PdInput({ label, error, required, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--pd-color-text-primary)]">
          {label}
          {required && <span className="text-[var(--pd-color-error)] ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`
          h-10 px-3 rounded-[var(--pd-radius-md)] border text-sm
          bg-[var(--pd-color-surface)] text-[var(--pd-color-text-primary)]
          placeholder:text-[var(--pd-color-text-tertiary)]
          transition-colors duration-150
          ${error
            ? 'border-[var(--pd-color-error)] focus:shadow-[var(--pd-shadow-error-ring)]'
            : 'border-[var(--pd-color-border)] focus:border-[var(--pd-color-border-focus)] focus:shadow-[var(--pd-shadow-focus-ring)]'
          }
          outline-none
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-[var(--pd-color-error)]">{error}</p>}
    </div>
  );
}
