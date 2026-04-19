// Input: theme + 当前窗口 bounds + state/file 标识 + hitBox/contentBox
// Output: 屏幕坐标系下的 SVG 资产矩形 / hit 矩形 / content 矩形
// Pos: panda-on-desk 几何库 — 透明窗 hitbox 与渲染矩形换算
//
// Forked from clawd-on-desk@4b07658:src/hit-geometry.js (MIT License)
// JS → TS 直接转。

export interface ViewBox {
  x: number
  y: number
  width: number
  height: number
}

export interface ContentBox {
  x: number
  y: number
  width: number
  height: number
}

export interface ThemeLike {
  viewBox: ViewBox
  layout?: {
    contentBox?: ContentBox
    centerX: number
    centerXRatio: number
    visibleHeightRatio: number
    baselineY: number
    baselineBottomRatio: number
  }
  objectScale?: {
    fileOffsets?: Record<string, { x?: number; y?: number }>
    fileScales?: Record<string, number>
    widthRatio?: number
    heightRatio?: number
    imgWidthRatio?: number
    offsetX?: number
    imgOffsetX?: number
    offsetY?: number
    objBottom?: number
    imgBottom?: number
  }
  eyeTracking?: { enabled?: boolean; states?: string[] }
}

export interface BoundsRect {
  x: number
  y: number
  width: number
  height: number
}

export interface HitBox {
  x: number
  y: number
  w: number
  h: number
}

export function usesObjectChannel(
  theme: ThemeLike | null | undefined,
  state: string | null | undefined,
  file: string | null | undefined,
): boolean {
  if (!theme || !file || !file.endsWith('.svg')) return false
  const eyeStates =
    theme.eyeTracking && theme.eyeTracking.enabled ? theme.eyeTracking.states || [] : []
  return !!state && eyeStates.includes(state)
}

export function usesNormalizedLayout(
  theme: ThemeLike | null | undefined,
  state: string | null | undefined,
  file: string | null | undefined,
): boolean {
  if (!theme || !theme.layout || !theme.layout.contentBox) return false
  if (
    (state && state.startsWith('mini-')) ||
    (file && file.startsWith('mini-'))
  )
    return false
  return true
}

function getFileLayout(theme: ThemeLike, file: string) {
  const os = theme.objectScale || {}
  const fileOffsets = os.fileOffsets || {}
  const fileScales = os.fileScales || {}
  const offset = fileOffsets[file] || {}
  return {
    widthRatio: os.widthRatio || 1.9,
    heightRatio: os.heightRatio || 1.3,
    imgWidthRatio: os.imgWidthRatio || os.widthRatio || 1.9,
    offsetX: os.offsetX || 0,
    imgOffsetX: os.imgOffsetX != null ? os.imgOffsetX : os.offsetX || 0,
    objBottom:
      os.objBottom != null
        ? os.objBottom
        : 1 - (os.offsetY || 0) - (os.heightRatio || 1.3),
    imgBottom: os.imgBottom != null ? os.imgBottom : 0.05,
    fileScale: fileScales[file] || 1,
    offsetPxX: offset.x || 0,
    offsetPxY: offset.y || 0,
  }
}

function getNormalizedLayout(theme: ThemeLike, file: string) {
  if (!theme || !theme.layout || !theme.layout.contentBox) return null
  const viewBox = theme.viewBox
  const layout = theme.layout
  const os = theme.objectScale || {}
  const fileOffsets = os.fileOffsets || {}
  const fileScales = os.fileScales || {}
  const offset = fileOffsets[file] || {}
  const contentBox = layout.contentBox!
  const fileScale = fileScales[file] || 1
  const unitRatio = (layout.visibleHeightRatio * fileScale) / contentBox.height

  return {
    leftRatio: layout.centerXRatio - (layout.centerX - viewBox.x) * unitRatio,
    bottomRatio:
      layout.baselineBottomRatio -
      (viewBox.y + viewBox.height - layout.baselineY) * unitRatio,
    widthRatio: viewBox.width * unitRatio,
    heightRatio: viewBox.height * unitRatio,
    offsetPxX: offset.x || 0,
    offsetPxY: offset.y || 0,
  }
}

function fitViewBoxIntoRect(
  outerRect: { x: number; y: number; w: number; h: number },
  viewBox: ViewBox,
) {
  const scale = Math.min(outerRect.w / viewBox.width, outerRect.h / viewBox.height)
  const width = viewBox.width * scale
  const height = viewBox.height * scale
  return {
    x: outerRect.x + (outerRect.w - width) / 2,
    y: outerRect.y + (outerRect.h - height) / 2,
    w: width,
    h: height,
  }
}

export function getAssetRectScreen(
  theme: ThemeLike | null | undefined,
  bounds: BoundsRect | null | undefined,
  state: string | null | undefined,
  file: string,
): { x: number; y: number; w: number; h: number } | null {
  if (!theme || !bounds) return null

  const viewBox = theme.viewBox

  if (usesNormalizedLayout(theme, state, file)) {
    const normalized = getNormalizedLayout(theme, file)!
    return {
      x: bounds.x + bounds.width * normalized.leftRatio + normalized.offsetPxX,
      y:
        bounds.y +
        bounds.height -
        bounds.height * normalized.heightRatio -
        bounds.height * normalized.bottomRatio -
        normalized.offsetPxY,
      w: bounds.width * normalized.widthRatio,
      h: bounds.height * normalized.heightRatio,
    }
  }

  const layout = getFileLayout(theme, file)
  const left = bounds.x + bounds.width * layout.offsetX + layout.offsetPxX

  if (usesObjectChannel(theme, state, file)) {
    const outerRect = {
      x: left,
      y:
        bounds.y +
        bounds.height -
        bounds.height * layout.heightRatio -
        bounds.height * layout.objBottom -
        layout.offsetPxY,
      w: bounds.width * layout.widthRatio,
      h: bounds.height * layout.heightRatio,
    }
    return fitViewBoxIntoRect(outerRect, viewBox)
  }

  const width = bounds.width * layout.imgWidthRatio * layout.fileScale
  const height = width * (viewBox.height / viewBox.width)
  return {
    x: bounds.x + bounds.width * layout.imgOffsetX + layout.offsetPxX,
    y:
      bounds.y +
      bounds.height -
      height -
      bounds.height * layout.imgBottom -
      layout.offsetPxY,
    w: width,
    h: height,
  }
}

export function getHitRectScreen(
  theme: ThemeLike | null | undefined,
  bounds: BoundsRect | null | undefined,
  state: string | null | undefined,
  file: string,
  hitBox: HitBox | null | undefined,
  options: { padX?: number; padY?: number } = {},
) {
  if (!theme || !bounds || !hitBox) return null

  const artRect = getAssetRectScreen(theme, bounds, state, file)
  if (!artRect) return null

  const vb = theme.viewBox
  const scaleX = artRect.w / vb.width
  const scaleY = artRect.h / vb.height
  const padX = options.padX || 0
  const padY = options.padY || 0

  return {
    left: artRect.x + (hitBox.x - vb.x) * scaleX - padX,
    top: artRect.y + (hitBox.y - vb.y) * scaleY - padY,
    right: artRect.x + (hitBox.x - vb.x + hitBox.w) * scaleX + padX,
    bottom: artRect.y + (hitBox.y - vb.y + hitBox.h) * scaleY + padY,
  }
}

export function getContentRectScreen(
  theme: ThemeLike | null | undefined,
  bounds: BoundsRect | null | undefined,
  state: string | null | undefined,
  file: string,
  options: { box?: ContentBox } = {},
) {
  const box = options.box || (theme && theme.layout && theme.layout.contentBox)
  if (!theme || !bounds || !box) return null

  const artRect = getAssetRectScreen(theme, bounds, state, file)
  if (!artRect) return null

  const vb = theme.viewBox
  const scaleX = artRect.w / vb.width
  const scaleY = artRect.h / vb.height

  return {
    left: artRect.x + (box.x - vb.x) * scaleX,
    top: artRect.y + (box.y - vb.y) * scaleY,
    right: artRect.x + (box.x - vb.x + box.width) * scaleX,
    bottom: artRect.y + (box.y - vb.y + box.height) * scaleY,
  }
}
