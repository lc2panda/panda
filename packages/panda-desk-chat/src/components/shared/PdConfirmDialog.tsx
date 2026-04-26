// Input: open / onClose / onConfirm / title / body / labels / variant / loading
// Output: PdModal-wrapped Yes/Cancel confirmation flow
// Pos: Shared layer — destructive-action confirmation surface
//
// Source 1:1: cc-haha desktop/src/components/shared/ConfirmDialog.tsx (L1-L49)

import { PdModal } from './PdModal';
import { PdButton } from './PdButton';

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
};

export function PdConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <PdModal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      width={460}
      footer={(
        <>
          <PdButton variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </PdButton>
          <PdButton variant={confirmVariant} onClick={() => void onConfirm()} loading={loading}>
            {confirmLabel}
          </PdButton>
        </>
      )}
    >
      <p className="text-sm leading-6 text-[var(--pd-color-text-secondary)]">
        {body}
      </p>
    </PdModal>
  );
}
