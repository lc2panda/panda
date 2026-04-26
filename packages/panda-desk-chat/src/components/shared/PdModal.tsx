// Input: open / onClose / title / children / width / footer
// Output: glass-panel modal overlay with backdrop + ESC + close button
// Pos: Shared layer — used by ConfirmDialog and ad-hoc dialogs
//
// Source 1:1: cc-haha desktop/src/components/shared/Modal.tsx (L1-L65)

import { useEffect, type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
};

export function PdModal({ open, onClose, title, children, width = 560, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--pd-color-overlay-scrim)] transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className="glass-panel relative rounded-[var(--pd-radius-xl)] max-h-[85vh] flex flex-col"
        style={{ width, maxWidth: 'calc(100vw - 48px)' }}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-0">
            <h2 className="text-xl font-bold text-[var(--pd-color-text-primary)]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--pd-color-text-secondary)] transition-colors hover:bg-[var(--pd-color-surface-hover)] hover:text-[var(--pd-color-text-primary)]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>

        {footer && (
          <div className="px-6 pb-6 pt-0 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
