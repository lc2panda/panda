// Input: workArea + ratio% + prefs（已保存位置）
// Output: 等比例像素尺寸（竖屏自动 1.6× 提升）
// Pos: panda-on-desk 几何库 — 启动尺寸/比例计算
//
// Forked from clawd-on-desk@4b07658:src/size-utils.js (MIT License)
// JS → TS 直接转。

import type { WorkArea } from './work-area'

// Portrait displays tend to be physically narrower, so the pet at ratio% of the long edge
// still reads as small. 1.6× lifts it back to a visually comparable size, while the 0.6
// cap on width prevents a tall narrow screen from being swallowed by the pet.
const PORTRAIT_BOOST = 1.6
const PORTRAIT_MAX_WIDTH_RATIO = 0.6

export interface PrefsLike {
  positionSaved?: boolean
  miniMode?: boolean
  x?: number
  y?: number
  preMiniX?: number
  preMiniY?: number
}

export function getProportionalBasePx(workArea: WorkArea | null | undefined): number {
  if (!workArea) return 0
  const width = Number(workArea.width) || 0
  const height = Number(workArea.height) || 0
  return Math.max(width, height)
}

export function getProportionalPixelSize(
  ratio: number,
  workArea: WorkArea | null | undefined,
): { width: number; height: number } {
  const safeRatio = Number.isFinite(ratio) ? ratio : 10
  const width = Number(workArea?.width) || 0
  const height = Number(workArea?.height) || 0
  const basePx = getProportionalBasePx(workArea)
  let px = Math.round((basePx * safeRatio) / 100)

  if (height > width && width > 0) {
    const boostedPx = Math.round(px * PORTRAIT_BOOST)
    const maxPortraitPx = Math.round(width * PORTRAIT_MAX_WIDTH_RATIO)
    px = Math.min(boostedPx, maxPortraitPx)
  }

  return { width: px, height: px }
}

export function getLaunchSizingWorkArea(
  prefs: PrefsLike | null | undefined,
  fallbackWorkArea: WorkArea,
  findNearestWorkArea?: (x: number, y: number) => WorkArea | null | undefined,
): WorkArea {
  if (!prefs || typeof findNearestWorkArea !== 'function') return fallbackWorkArea

  const candidates = [
    prefs.positionSaved ? { x: prefs.x as number, y: prefs.y as number } : null,
    prefs.miniMode
      ? { x: prefs.preMiniX as number, y: prefs.preMiniY as number }
      : null,
  ].filter(Boolean) as { x: number; y: number }[]

  for (const point of candidates) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue
    return findNearestWorkArea(point.x + 1, point.y + 1) || fallbackWorkArea
  }

  return fallbackWorkArea
}
