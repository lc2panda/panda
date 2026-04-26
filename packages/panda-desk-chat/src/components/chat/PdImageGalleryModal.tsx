// Input:  open / images[] / activeIndex / onClose / onSelect
// Output: PdModal full-screen image lightbox with arrow-key + thumbnail navigation
// Pos:    Chat layer — image attachment lightbox launched from PdAttachmentGallery
//
// Source 1:1: cc-haha desktop/src/components/chat/ImageGalleryModal.tsx (L1-L92)
//   - className 转换：var(--color-*) → var(--pd-color-*)
//   - cc-haha shared/Modal → panda shared/PdModal（同形态：open/onClose/title/width/footer）
import { useEffect } from 'react';
import { PdModal } from '../shared/PdModal';

type GalleryImage = {
  src: string;
  name: string;
};

type Props = {
  open: boolean;
  images: GalleryImage[];
  activeIndex: number;
  onClose: () => void;
  onSelect: (index: number) => void;
};

export function PdImageGalleryModal({ open, images, activeIndex, onClose, onSelect }: Props) {
  const activeImage = images[activeIndex];

  useEffect(() => {
    if (!open || images.length <= 1) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onSelect((activeIndex - 1 + images.length) % images.length);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        onSelect((activeIndex + 1) % images.length);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, images.length, onSelect, open]);

  if (!activeImage) return null;

  return (
    <PdModal open={open} onClose={onClose} width={960}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--pd-color-text-primary)]">{activeImage.name}</div>
            <div className="text-xs text-[var(--pd-color-text-tertiary)]">
              {activeIndex + 1} / {images.length}
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelect((activeIndex - 1 + images.length) % images.length)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--pd-color-border)] text-[var(--pd-color-text-secondary)] transition-colors hover:bg-[var(--pd-color-surface-hover)]"
                aria-label="Previous image"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                onClick={() => onSelect((activeIndex + 1) % images.length)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--pd-color-border)] text-[var(--pd-color-text-secondary)] transition-colors hover:bg-[var(--pd-color-surface-hover)]"
                aria-label="Next image"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex max-h-[70vh] items-center justify-center overflow-hidden rounded-2xl bg-[#111]">
          <img src={activeImage.src} alt={activeImage.name} className="max-h-[70vh] w-full object-contain" />
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={`${image.name}-${index}`}
                onClick={() => onSelect(index)}
                className={`overflow-hidden rounded-xl border transition-all ${
                  index === activeIndex
                    ? 'border-[var(--pd-color-brand)] shadow-[0_0_0_1px_var(--pd-color-brand)]'
                    : 'border-[var(--pd-color-border)]'
                }`}
              >
                <img src={image.src} alt={image.name} className="h-16 w-16 object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </PdModal>
  );
}
