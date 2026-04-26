// Input: Toast object (id/type/message) from useUIStore
// Output: Single toast item with type-keyed left-border + dismiss button
// Pos: Shared layer — rendered inside PdToastContainer
//
// Source 1:1: cc-haha desktop/src/components/shared/Toast.tsx (L1-L33 ToastItem block)

import { useUIStore, type Toast as ToastType } from '../../stores/uiStore';

const typeStyles: Record<ToastType['type'], string> = {
  success: 'border-l-4 border-l-[var(--pd-color-success)]',
  error: 'border-l-4 border-l-[var(--pd-color-error)]',
  warning: 'border-l-4 border-l-[var(--pd-color-warning)]',
  info: 'border-l-4 border-l-[var(--pd-color-text-accent)]',
};

export function PdToast({ toast }: { toast: ToastType }) {
  const removeToast = useUIStore((s) => s.removeToast);

  return (
    <div
      className={`
        bg-[var(--pd-color-surface)] rounded-[var(--pd-radius-md)] shadow-[var(--pd-shadow-dropdown)]
        px-4 py-3 text-sm text-[var(--pd-color-text-primary)]
        ${typeStyles[toast.type]}
        animate-in slide-in-from-right fade-in duration-200
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <span>{toast.message}</span>
        <button
          onClick={() => removeToast(toast.id)}
          className="text-[var(--pd-color-text-tertiary)] hover:text-[var(--pd-color-text-primary)] text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
