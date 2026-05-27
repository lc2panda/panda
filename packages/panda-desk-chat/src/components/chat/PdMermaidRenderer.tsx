// Input: mermaid diagram source (the body of a ```mermaid``` fenced block)
// Output: cc-haha 1:1 rendered SVG diagram + header (Mermaid · Preview · Copy) + fullscreen modal w/ zoom + pan
// Pos:    Chat layer — invoked by PdMarkdownRenderer when a fenced block uses language=mermaid
//
// Source 1:1: cc-haha desktop/src/components/chat/MermaidRenderer.tsx (L1-362)
//
// Notes:
// - cc-haha 静态 import mermaid + DOMPurify。panda 当前 package.json 未列 mermaid，
//   我们采用动态 import + 轻量 SVG sanitize，让 mermaid 装载后立即生效，未装载时
//   静默降级为可读源码。className/UI 严格 cc-haha 1:1。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import { useCallback, useEffect, useRef, useState } from 'react'
import { PdModal } from '../shared/PdModal'
import { PdCopyButton } from './PdCopyButton'

export interface PdMermaidRendererProps {
  code: string
}

let mermaidInitialized = false
let mermaidIdCounter = 0

interface MermaidLike {
  initialize: (config: Record<string, unknown>) => void
  render: (id: string, code: string) => Promise<{ svg: string }>
}

const MIN_PREVIEW_ZOOM = 0.5
const MAX_PREVIEW_ZOOM = 3
const PREVIEW_ZOOM_STEP = 0.25

type SvgMetrics = { width: number; height: number }
type DragState = {
  pointerId: number
  startX: number
  startY: number
  scrollLeft: number
  scrollTop: number
}

function clampZoom(value: number) {
  return Math.min(MAX_PREVIEW_ZOOM, Math.max(MIN_PREVIEW_ZOOM, value))
}

function getPointerPosition(
  event: Pick<React.PointerEvent<HTMLDivElement>, 'clientX' | 'clientY' | 'pageX' | 'pageY'>,
) {
  const x = Number.isFinite(event.clientX) ? event.clientX : event.pageX
  const y = Number.isFinite(event.clientY) ? event.clientY : event.pageY
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
  }
}

function parseSvgMetrics(svg: string): SvgMetrics | null {
  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/i)
  if (viewBoxMatch) {
    const viewBox = viewBoxMatch[1]
    if (!viewBox) return null
    const values = viewBox.split(/[\s,]+/).map((part) => Number.parseFloat(part))
    if (values.length === 4 && values.every((value) => Number.isFinite(value))) {
      const [, , width, height] = values
      if (width !== undefined && height !== undefined) return { width, height }
    }
  }
  const widthMatch = svg.match(/\bwidth="([0-9.]+)(?:px)?"/i)
  const heightMatch = svg.match(/\bheight="([0-9.]+)(?:px)?"/i)
  if (widthMatch && heightMatch) {
    const widthValue = widthMatch[1]
    const heightValue = heightMatch[1]
    if (!widthValue || !heightValue) return null
    const width = Number.parseFloat(widthValue)
    const height = Number.parseFloat(heightValue)
    if (Number.isFinite(width) && Number.isFinite(height)) return { width, height }
  }
  return null
}

async function loadMermaid(): Promise<MermaidLike | null> {
  try {
    // v2.27.2 Bug H 真补：改用标准字面量动态 import，让 Vite 看到 'mermaid' 字面量
    // 后自动 code-split 出 lazy chunk。原 Function('s','return import(s)') 黑魔法
    // 在 dev 模式可跑（Node ESM），但 packaged Vite 构建产物里完全找不到 mermaid
    // chunk，导致 packaged 100% 失效。
    const mod = (await import('mermaid')) as { default?: MermaidLike } | MermaidLike
    const instance = mod && typeof mod === 'object' && 'default' in mod && mod.default
      ? mod.default
      : (mod as MermaidLike)
    if (!instance || typeof instance.render !== 'function') return null
    if (!mermaidInitialized) {
      try {
        instance.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'strict',
          suppressErrorRendering: true,
          fontFamily: 'var(--pd-font-sans)',
        })
      } catch {
        /* initialize is best-effort */
      }
      mermaidInitialized = true
    }
    return instance
  } catch {
    return null
  }
}

/** Light-weight SVG scrubber: removes <script> and on* attributes without
 *  pulling DOMPurify (panda 暂未装). Mermaid output is otherwise trusted. */
function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+="[^"]*"/gi, '')
    .replace(/\son[a-z]+='[^']*'/gi, '')
}

export function PdMermaidRenderer({ code }: PdMermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previewViewportRef = useRef<HTMLDivElement>(null)
  const previewContentRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewZoom, setPreviewZoom] = useState(1)
  const [isDraggingPreview, setIsDraggingPreview] = useState(false)

  const svgMetrics = svg ? parseSvgMetrics(svg) : null

  useEffect(() => {
    let cancelled = false
    setSvg(null)
    setError(null)
    setMissing(false)
    loadMermaid().then(async (mermaid) => {
      if (cancelled) return
      if (!mermaid) {
        setMissing(true)
        return
      }
      const id = `pd-mermaid-${++mermaidIdCounter}`
      try {
        const { svg: renderedSvg } = await mermaid.render(id, code)
        if (!cancelled) {
          setSvg(renderedSvg)
        }
      } catch (err) {
        if (!cancelled) {
          setError(String((err as { message?: string })?.message ?? err))
        }
      }
    })
    return () => {
      cancelled = true
    }
  }, [code])

  const handlePreview = useCallback(() => setPreviewOpen(true), [])
  const handlePreviewClose = useCallback(() => setPreviewOpen(false), [])
  const zoomIn = useCallback(
    () => setPreviewZoom((value) => clampZoom(value + PREVIEW_ZOOM_STEP)),
    [],
  )
  const zoomOut = useCallback(
    () => setPreviewZoom((value) => clampZoom(value - PREVIEW_ZOOM_STEP)),
    [],
  )
  const resetZoom = useCallback(() => setPreviewZoom(1), [])

  useEffect(() => {
    if (!previewOpen) {
      setPreviewZoom(1)
      setIsDraggingPreview(false)
      dragStateRef.current = null
    }
  }, [previewOpen, svg])

  const stopDraggingPreview = useCallback(() => {
    const viewport = previewViewportRef.current
    const dragState = dragStateRef.current
    if (viewport && dragState) {
      try {
        viewport.releasePointerCapture(dragState.pointerId)
      } catch {
        /* ignore release failures */
      }
    }
    dragStateRef.current = null
    setIsDraggingPreview(false)
  }, [])

  useEffect(() => stopDraggingPreview, [stopDraggingPreview])

  useEffect(() => {
    if (!previewOpen || !previewContentRef.current) return
    const renderedSvg = previewContentRef.current.querySelector('svg')
    if (!renderedSvg) return
    renderedSvg.setAttribute('width', '100%')
    renderedSvg.setAttribute('height', '100%')
    renderedSvg.style.width = '100%'
    renderedSvg.style.height = '100%'
    renderedSvg.style.display = 'block'
  }, [previewOpen, svg, previewZoom])

  const handlePreviewWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    const direction = event.deltaY < 0 ? PREVIEW_ZOOM_STEP : -PREVIEW_ZOOM_STEP
    setPreviewZoom((value) => clampZoom(value + direction))
  }, [])

  const handlePreviewPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const viewport = previewViewportRef.current
    if (!viewport) return
    const { x, y } = getPointerPosition(event)
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: x,
      startY: y,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    }
    setIsDraggingPreview(true)
    viewport.setPointerCapture(event.pointerId)
  }, [])

  const handlePreviewPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const viewport = previewViewportRef.current
    const dragState = dragStateRef.current
    if (!viewport || !dragState || dragState.pointerId !== event.pointerId) return
    event.preventDefault()
    const { x, y } = getPointerPosition(event)
    viewport.scrollLeft = dragState.scrollLeft - (x - dragState.startX)
    viewport.scrollTop = dragState.scrollTop - (y - dragState.startY)
  }, [])

  const handlePreviewPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return
    stopDraggingPreview()
  }, [stopDraggingPreview])

  const previewCanvasStyle = svgMetrics
    ? {
        width: `${svgMetrics.width * previewZoom}px`,
        height: `${svgMetrics.height * previewZoom}px`,
      }
    : undefined

  if (error) {
    return (
      <div className="my-4 overflow-hidden rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-error)]/30">
        <div className="flex items-center gap-2 border-b border-[var(--pd-color-error)]/20 bg-[var(--pd-color-error-container)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--pd-color-error)]">
          <span className="material-symbols-outlined text-[14px]">error</span>
          Mermaid Error
        </div>
        <div className="bg-[var(--pd-color-error-container)]/30 px-3 py-2 font-[var(--pd-font-mono)] text-[11px] text-[var(--pd-color-error)]">
          {error}
        </div>
      </div>
    )
  }

  if (missing) {
    return (
      <div className="my-4 overflow-hidden rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-outline-variant)]/50 bg-[var(--pd-color-surface-container-low)]">
        <div className="flex items-center gap-2 border-b border-[var(--pd-color-outline-variant)]/40 bg-[var(--pd-color-surface-container)] px-3 py-1.5 text-[11px] text-[var(--pd-color-text-tertiary)]">
          <span className="material-symbols-outlined text-[14px]">account_tree</span>
          <span className="font-semibold uppercase tracking-[0.14em]">Mermaid (source)</span>
        </div>
        <pre className="m-0 px-3 py-2 font-[var(--pd-font-mono)] text-[11px] leading-[1.5] text-[var(--pd-color-text-secondary)] whitespace-pre-wrap break-words">
          {code}
        </pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="my-4 flex items-center justify-center rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-border)]/50 bg-[var(--pd-color-surface-container-low)] py-8">
        <div className="flex items-center gap-2 text-[11px] text-[var(--pd-color-text-tertiary)]">
          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
          Rendering diagram...
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="my-4 overflow-hidden rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-outline-variant)]/50 bg-[var(--pd-color-surface-container-low)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--pd-color-outline-variant)]/40 bg-[var(--pd-color-surface-container)] px-3 py-1.5 text-[11px] text-[var(--pd-color-text-tertiary)]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">account_tree</span>
            <span className="font-semibold uppercase tracking-[0.14em]">Mermaid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePreview}
              className="flex items-center gap-1 rounded-md border border-[var(--pd-color-outline-variant)]/40 bg-[var(--pd-color-surface-container-lowest)] px-2 py-1 text-[11px] text-[var(--pd-color-text-tertiary)] transition-colors hover:bg-[var(--pd-color-surface-container-high)] hover:text-[var(--pd-color-text-primary)]"
            >
              <span className="material-symbols-outlined text-[12px]">fullscreen</span>
              Preview
            </button>
            <PdCopyButton
              text={code}
              className="rounded-md border border-[var(--pd-color-outline-variant)]/40 bg-[var(--pd-color-surface-container-lowest)] px-2 py-1 text-[11px] text-[var(--pd-color-text-tertiary)] transition-colors hover:bg-[var(--pd-color-surface-container-high)] hover:text-[var(--pd-color-text-primary)]"
            />
          </div>
        </div>

        {/* Diagram */}
        <div
          ref={containerRef}
          className="flex items-center justify-center overflow-auto bg-white p-4 cursor-pointer"
          style={{ maxHeight: 400 }}
          onClick={handlePreview}
          dangerouslySetInnerHTML={{ __html: sanitizeSvg(svg) }}
        />
      </div>

      {/* Fullscreen preview modal */}
      <PdModal open={previewOpen} onClose={handlePreviewClose} width={1100}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--pd-color-text-primary)]">
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
              Mermaid Diagram
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-1 py-1">
                <button
                  type="button"
                  onClick={zoomOut}
                  aria-label="Zoom out"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--pd-color-text-secondary)] transition-colors hover:bg-[var(--pd-color-surface-hover)] hover:text-[var(--pd-color-text-primary)]"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  className="min-w-[68px] rounded-md px-2 py-1 text-[11px] font-semibold text-[var(--pd-color-text-secondary)] transition-colors hover:bg-[var(--pd-color-surface-hover)] hover:text-[var(--pd-color-text-primary)]"
                >
                  {Math.round(previewZoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={zoomIn}
                  aria-label="Zoom in"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--pd-color-text-secondary)] transition-colors hover:bg-[var(--pd-color-surface-hover)] hover:text-[var(--pd-color-text-primary)]"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
              <PdCopyButton
                text={code}
                className="rounded-md border border-[var(--pd-color-border)] px-2.5 py-1 text-[11px] text-[var(--pd-color-text-tertiary)] transition-colors hover:text-[var(--pd-color-text-primary)]"
              />
            </div>
          </div>
          <div
            ref={previewViewportRef}
            data-testid="mermaid-preview-viewport"
            className="overflow-auto rounded-xl bg-white"
            style={{
              maxHeight: '75vh',
              cursor: isDraggingPreview ? 'grabbing' : 'grab',
            }}
            onWheel={handlePreviewWheel}
            onPointerDown={handlePreviewPointerDown}
            onPointerMove={handlePreviewPointerMove}
            onPointerUp={handlePreviewPointerUp}
            onPointerCancel={handlePreviewPointerUp}
            onPointerLeave={handlePreviewPointerUp}
          >
            <div className="min-h-full min-w-full p-6">
              <div
                ref={previewContentRef}
                className="mx-auto shrink-0 select-none"
                style={previewCanvasStyle}
                data-dragging={isDraggingPreview ? 'true' : 'false'}
                aria-label="Mermaid preview canvas"
                dangerouslySetInnerHTML={{ __html: sanitizeSvg(svg) }}
              />
            </div>
          </div>
          <div className="text-[11px] text-[var(--pd-color-text-tertiary)]">
            Use the zoom controls to enlarge the diagram. Drag inside the preview to pan, or use the trackpad, mouse wheel, and scrollbars. Hold Ctrl/Command while scrolling to zoom.
          </div>
        </div>
      </PdModal>
    </>
  )
}

PdMermaidRenderer.displayName = 'PdMermaidRenderer'
