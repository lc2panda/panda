// Input: text content from tool result that may contain absolute image file paths
// Output: 1- or 2-column grid of inline image thumbnails with hover overlay; click opens fullscreen modal
// Pos:    Chat layer — invoked by PdToolCallCard / PdToolResultBlock to surface image artifacts
//
// Source 1:1: cc-haha desktop/src/components/chat/InlineImageGallery.tsx (L1-107)
//
// Notes:
// - cc-haha resolves files via getBaseUrl() + /api/filesystem/file?path=…; panda 当前没有
//   对应的本地 HTTP file bridge — 我们改用 file:// 协议直接挂载（Electron 渲染进程允许），
//   并以 PdModal 实现 fullscreen 预览。一旦 ImageGalleryModal/getBaseUrl 在 panda 落地，
//   切换替换即可，className/grid/hover 行为 1:1 cc-haha。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import { useMemo, useState } from 'react'
import { PdModal } from '../shared/PdModal'

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|bmp|avif|ico)$/i

/**
 * Extracts absolute image file paths from text content.
 * Matches paths like /Users/.../image.png, /tmp/output.jpg, etc.
 */
export function extractImagePaths(text: string): string[] {
  // Match absolute paths ending with image extensions
  // Handles paths that may be wrapped in backticks, quotes, or standalone
  const regex = /(?:^|[\s`"'(])(\/?(?:[A-Za-z]:[\\/]|\/)[^\s`"')<>]+\.(?:png|jpe?g|gif|webp|svg|bmp|avif|ico))/gim
  const paths: string[] = []
  const seen = new Set<string>()

  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const p = match[1]!.trim()
    if (!seen.has(p) && IMAGE_EXTENSIONS.test(p)) {
      seen.add(p)
      paths.push(p)
    }
  }

  return paths
}

function fileUrl(filePath: string): string {
  // panda 临时方案：file:// 直链。S10 Agent 接入 IPC 文件桥后切换。
  // TODO(S10): switch to bridge-served URL when /api/filesystem/file is wired.
  if (filePath.startsWith('/')) return `file://${filePath}`
  return filePath
}

function fileName(filePath: string): string {
  return filePath.split('/').pop() || filePath
}

export interface PdInlineImageGalleryProps {
  text: string
}

export function PdInlineImageGallery({ text }: PdInlineImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const imagePaths = useMemo(() => extractImagePaths(text), [text])

  const images = useMemo(
    () => imagePaths.map((p) => ({ src: fileUrl(p), name: fileName(p) })),
    [imagePaths],
  )

  if (images.length === 0) return null

  const active = activeIndex !== null ? images[activeIndex] : null

  return (
    <>
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--pd-color-outline)]">
          <span className="material-symbols-outlined text-[12px]">image</span>
          {images.length === 1 ? '1 image' : `${images.length} images`}
        </div>
        <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="group relative overflow-hidden rounded-xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] text-left shadow-sm transition-all hover:shadow-md hover:border-[var(--pd-color-brand)]/40"
            >
              <img
                src={img.src}
                alt={img.name}
                loading="lazy"
                className="w-full object-cover"
                style={{ maxHeight: images.length === 1 ? 400 : 240 }}
                onError={(e) => {
                  // Hide broken images
                  (e.target as HTMLImageElement).closest('button')!.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                <span className="material-symbols-outlined rounded-full bg-white/90 p-2 text-[20px] text-[var(--pd-color-text-primary)] shadow-lg">
                  fullscreen
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2.5 pb-2 pt-6">
                <span className="text-[10px] font-medium text-white/90 drop-shadow-sm">
                  {img.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <PdModal
          open={activeIndex !== null}
          onClose={() => setActiveIndex(null)}
          title={active.name}
          width={1100}
        >
          <div className="flex items-center justify-center bg-[var(--pd-color-surface-container-lowest)] p-4">
            <img
              src={active.src}
              alt={active.name}
              className="max-h-[75vh] max-w-full object-contain"
            />
          </div>
        </PdModal>
      )}
    </>
  )
}

PdInlineImageGallery.displayName = 'PdInlineImageGallery'
