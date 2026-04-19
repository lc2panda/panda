// Input: 拖拽起点 cursor + 当前 bounds + 窗口 size
// Output: 锚定式拖拽目标 bounds（通过 clamp 函数兜底落屏）
// Pos: panda-on-desk 几何库 — 鼠标拖拽时窗口位置算子
//
// Forked from clawd-on-desk@4b07658:src/drag-position.js (MIT License)
// JS → TS 直接转，仅添加最小 type annotation。

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Bounds extends Point, Size {}

export interface DragSnapshot {
  cursor: Point
  bounds: Point
  size: Size
}

export type ClampPosition = (
  x: number,
  y: number,
  w: number,
  h: number,
) => Point

function copyPoint(point: Point): Point {
  return { x: point.x, y: point.y }
}

function copySize(size: Size): Size {
  return { width: size.width, height: size.height }
}

export function createDragSnapshot(
  cursor: Point | null | undefined,
  bounds: Point | null | undefined,
  size: Size | null | undefined,
): DragSnapshot | null {
  if (!cursor || !bounds || !size) return null
  return {
    cursor: copyPoint(cursor),
    bounds: { x: bounds.x, y: bounds.y },
    size: copySize(size),
  }
}

export function computeAnchoredDragBounds(
  snapshot: DragSnapshot | null | undefined,
  cursor: Point | null | undefined,
  clampPosition?: ClampPosition,
): Bounds | null {
  if (!snapshot || !cursor) return null
  const { width, height } = snapshot.size
  const targetX = snapshot.bounds.x + (cursor.x - snapshot.cursor.x)
  const targetY = snapshot.bounds.y + (cursor.y - snapshot.cursor.y)
  const pos = clampPosition
    ? clampPosition(targetX, targetY, width, height)
    : { x: targetX, y: targetY }
  return { x: pos.x, y: pos.y, width, height }
}

export function computeFinalDragBounds(
  bounds: Point | null | undefined,
  size: Size | null | undefined,
  clampPosition?: ClampPosition,
): Bounds | null {
  if (!bounds || !size || !clampPosition) return null
  const pos = clampPosition(bounds.x, bounds.y, size.width, size.height)
  return { x: pos.x, y: pos.y, width: size.width, height: size.height }
}

export function materializeVirtualBounds(
  virtualBounds: Bounds | null | undefined,
  workArea: { y?: number } | null | undefined,
): { bounds: Bounds; viewportOffsetY: number } | null {
  if (!virtualBounds) return null
  const minY =
    workArea && Number.isFinite(workArea.y as number)
      ? (workArea.y as number)
      : -Infinity
  const realY = Math.max(virtualBounds.y, minY)
  return {
    bounds: {
      x: virtualBounds.x,
      y: realY,
      width: virtualBounds.width,
      height: virtualBounds.height,
    },
    viewportOffsetY: Math.max(0, realY - virtualBounds.y),
  }
}
