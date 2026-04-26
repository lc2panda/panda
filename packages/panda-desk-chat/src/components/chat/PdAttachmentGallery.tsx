// Input:  attachments[] (image/file with name + previewUrl/data) + variant + onRemove
// Output: composer pill row OR message thumb grid; click image opens PdImageGalleryModal
// Pos:    Chat layer — composer attachment preview + assistant message inline image grid
//
// Source 1:1: cc-haha desktop/src/components/chat/AttachmentGallery.tsx (L1-L113)
//   - className 转换：var(--color-*) → var(--pd-color-*)
//   - cc-haha ImageGalleryModal → panda PdImageGalleryModal（同任务新建）
import { useMemo, useState } from 'react';
import { PdImageGalleryModal } from './PdImageGalleryModal';

export type AttachmentPreview = {
  id?: string;
  type: 'image' | 'file';
  name: string;
  data?: string;
  previewUrl?: string;
};

type Props = {
  attachments: AttachmentPreview[];
  variant?: 'composer' | 'message';
  onRemove?: (id: string) => void;
};

export function PdAttachmentGallery({ attachments, variant = 'message', onRemove }: Props) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const images = useMemo(
    () =>
      attachments
        .filter((attachment) => attachment.type === 'image' && (attachment.previewUrl || attachment.data))
        .map((attachment) => ({
          src: attachment.previewUrl || attachment.data || '',
          name: attachment.name,
        })),
    [attachments],
  );

  if (attachments.length === 0) return null;

  const isComposer = variant === 'composer';

  return (
    <>
      <div className={isComposer ? 'flex flex-wrap items-center gap-2' : 'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
        {attachments.map((attachment, index) => {
          if (attachment.type === 'image' && (attachment.previewUrl || attachment.data)) {
            const src = attachment.previewUrl || attachment.data || '';
            return (
              <div
                key={attachment.id || `${attachment.name}-${index}`}
                className={isComposer ? 'group relative' : ''}
              >
                <button
                  type="button"
                  onClick={() => setActiveImageIndex(images.findIndex((image) => image.src === src))}
                  className={
                    isComposer
                      ? 'overflow-hidden rounded-xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)]'
                      : 'overflow-hidden rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] text-left shadow-sm transition-transform hover:scale-[1.01]'
                  }
                >
                  <img
                    src={src}
                    alt={attachment.name}
                    className={
                      isComposer
                        ? 'h-16 w-16 object-cover'
                        : 'max-h-[340px] w-full max-w-[360px] object-cover'
                    }
                  />
                </button>
                {onRemove && attachment.id && (
                  <button
                    type="button"
                    onClick={() => onRemove(attachment.id!)}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--pd-color-error)] text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`Remove ${attachment.name}`}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          }

          return (
            <div
              key={attachment.id || `${attachment.name}-${index}`}
              className="flex items-center gap-2 rounded-xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-3 py-2 text-xs text-[var(--pd-color-text-secondary)]"
            >
              <span className="material-symbols-outlined text-[14px]">attach_file</span>
              <span className="max-w-[220px] truncate">{attachment.name}</span>
              {onRemove && attachment.id && (
                <button
                  type="button"
                  onClick={() => onRemove(attachment.id!)}
                  className="ml-1 text-[var(--pd-color-text-tertiary)] transition-colors hover:text-[var(--pd-color-error)]"
                  aria-label={`Remove ${attachment.name}`}
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {activeImageIndex !== null && activeImageIndex >= 0 && (
        <PdImageGalleryModal
          open={activeImageIndex !== null}
          images={images}
          activeIndex={activeImageIndex}
          onClose={() => setActiveImageIndex(null)}
          onSelect={setActiveImageIndex}
        />
      )}
    </>
  );
}
