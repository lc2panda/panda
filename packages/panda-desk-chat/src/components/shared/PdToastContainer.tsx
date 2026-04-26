// Input: toasts[] from useUIStore
// Output: bottom-right floating stack of PdToast items
// Pos: Shared layer — mounted at App root for global notifications
//
// Source 1:1: cc-haha desktop/src/components/shared/Toast.tsx (L35-L47 ToastContainer block)

import { useUIStore } from '../../stores/uiStore';
import { PdToast } from './PdToast';

export function PdToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <PdToast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
