// Input: theme + 当前 bounds + visibleMargins/edge-pin 选项
// Output: 拖拽/复位时的安全 margin 边距 + 内容稳定可视边距
// Pos: panda-on-desk 几何库 — 跨主题的可视边距对齐 + 边缘吸附
//
// Forked from clawd-on-desk@4b07658:src/visible-margins.js (MIT License)
// JS → TS 直接转。

import * as hitGeometry from './hit-geometry'
import type { ThemeLike, BoundsRect, ContentBox } from './hit-geometry'

interface ThemeMaybe extends ThemeLike {
  _marginEnvelopeFiles?: string[]
  states?: Record<string, string | string[] | { file?: string; files?: string[] }>
  workingTiers?: Array<{ file?: string }>
  jugglingTiers?: Array<{ file?: string }>
  idleAnimations?: Array<string | { file?: string }>
  reactions?: Record<string, string | { file?: string }>
}

export function getThemeMarginBox(theme: ThemeMaybe | null | undefined): ContentBox | null {
  if (!theme || !theme.layout) return null
  return (theme.layout as any).marginBox || theme.layout.contentBox || null
}

export function collectThemeEnvelopeFiles(
  theme: ThemeMaybe | null | undefined,
): string[] {
  if (!theme) return []
  if (Array.isArray(theme._marginEnvelopeFiles)) return theme._marginEnvelopeFiles

  const files = new Set<string>()
  const addFile = (file: any) => {
    if (typeof file !== 'string' || !file || file.startsWith('mini-')) return
    files.add(file)
  }
  const addEntry = (entry: any) => {
    if (!entry) return
    if (typeof entry === 'string') {
      addFile(entry)
      return
    }
    if (Array.isArray(entry)) {
      entry.forEach(addEntry)
      return
    }
    if (typeof entry === 'object') {
      addFile(entry.file)
      if (Array.isArray(entry.files)) entry.files.forEach(addFile)
    }
  }

  for (const [state, entry] of Object.entries(theme.states || {})) {
    if (state.startsWith('mini-')) continue
    addEntry(entry)
  }
  ;(theme.workingTiers || []).forEach(addEntry)
  ;(theme.jugglingTiers || []).forEach(addEntry)
  ;(theme.idleAnimations || []).forEach(addEntry)
  Object.values(theme.reactions || {}).forEach(addEntry)

  theme._marginEnvelopeFiles = [...files]
  return theme._marginEnvelopeFiles
}

export function computeStableVisibleContentMargins(
  theme: ThemeMaybe | null | undefined,
  bounds: BoundsRect | null | undefined,
  options: { box?: ContentBox; files?: string[] } = {},
): { top: number; bottom: number } {
  if (!theme || !bounds) return { top: 0, bottom: 0 }
  const box = options.box || getThemeMarginBox(theme)
  if (!box) return { top: 0, bottom: 0 }

  let top = Infinity
  let bottom = Infinity
  const files = options.files || collectThemeEnvelopeFiles(theme)
  for (const file of files) {
    const content = hitGeometry.getContentRectScreen(theme, bounds, null, file, {
      box,
    })
    if (!content) continue
    top = Math.min(top, Math.max(0, Math.round(content.top - bounds.y)))
    bottom = Math.min(
      bottom,
      Math.max(0, Math.round(bounds.y + bounds.height - content.bottom)),
    )
  }

  return {
    top: Number.isFinite(top) ? top : 0,
    bottom: Number.isFinite(bottom) ? bottom : 0,
  }
}

function normalizeMargin(value: number | null | undefined): number {
  return Number.isFinite(value as number) ? Math.max(0, Math.round(value as number)) : 0
}

// ON 贴边溢出量 —— 按 Peter PR#125 hitRect 基准反算窗口高度比例
const EDGE_PIN_TOP_RATIO = 0.6
const EDGE_PIN_BOTTOM_RATIO = 0.25

function normalizeBottomInset(value: number | null | undefined): number | null {
  return Number.isFinite(value as number)
    ? Math.max(0, Math.round(value as number))
    : null
}

function getCappedEdgePinBottom(
  heightPx: number,
  bottomInset: number | null | undefined,
): number {
  const desiredBottom = Math.round(heightPx * EDGE_PIN_BOTTOM_RATIO)
  const cappedInset = normalizeBottomInset(bottomInset)
  return cappedInset == null ? desiredBottom : Math.min(desiredBottom, cappedInset)
}

export interface DragMarginOptions {
  width?: number
  height?: number
  visibleMargins?: { top?: number; bottom?: number }
  allowEdgePinning?: boolean
  bottomInset?: number | null
}

export function getLooseDragMargins(opts: DragMarginOptions = {}): {
  marginX: number
  marginTop: number
  marginBottom: number
} {
  const { width, height, visibleMargins, allowEdgePinning, bottomInset } = opts
  const marginX = Number.isFinite(width as number) ? Math.round((width as number) * 0.25) : 0
  const rubberBandY = Number.isFinite(height as number)
    ? Math.round((height as number) * 0.25)
    : 0
  const margins = visibleMargins || {}
  const topMargin = normalizeMargin(margins.top)
  const heightPx = Number.isFinite(height as number) ? Math.round(height as number) : 0

  if (allowEdgePinning) {
    return {
      marginX,
      marginTop: Math.round(heightPx * EDGE_PIN_TOP_RATIO),
      marginBottom: getCappedEdgePinBottom(heightPx, bottomInset),
    }
  }

  return {
    marginX,
    marginTop: topMargin + rubberBandY,
    marginBottom: rubberBandY,
  }
}

export function getRestClampMargins(opts: DragMarginOptions = {}): {
  top: number
  bottom: number
} {
  const { height, visibleMargins, allowEdgePinning, bottomInset } = opts
  const margins = visibleMargins || {}
  const topMargin = normalizeMargin(margins.top)
  const bottomMargin = normalizeMargin(margins.bottom)
  const heightPx = Number.isFinite(height as number) ? Math.round(height as number) : 0

  if (allowEdgePinning) {
    return {
      top: Math.round(heightPx * EDGE_PIN_TOP_RATIO),
      bottom: getCappedEdgePinBottom(heightPx, bottomInset),
    }
  }

  return { top: topMargin, bottom: bottomMargin }
}
