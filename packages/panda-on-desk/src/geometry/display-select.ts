// Input: Electron Display[] 列表 + 用户偏好 displayId
// Output: 选中的 Display（含 workArea）；未匹配/无效 → 主屏 fallback；空列表 → null
// Pos: panda-on-desk W22-T1 多屏支持 — 纯函数，无 electron 依赖（便于 bun:test 直接 mock）
//
// W22-T1 (2026-04-20 +08:00) — agent-α-W22-multi-display
//   背景：hitWin 默认主屏。多屏用户希望选择副屏；本模块负责"displayId → Display"映射，
//        同时 0/-1/缺省 → 主屏，未匹配 id → 主屏 fallback（永不抛）。
//   原则：纯函数 + 全防御，方便单测覆盖；电子端在 main.ts 调 selectDisplayForPanda(...)。

import type { WorkArea } from "./work-area"

/**
 * Electron 端 Display 形状的最小子集（避免引 electron 类型）。
 * 真实 Electron Display 还有 scaleFactor / rotation / internal / etc.，本模块仅需这几项。
 */
export interface DisplayShape {
  id: number
  bounds: WorkArea
  workArea: WorkArea
  internal?: boolean
  label?: string
}

/**
 * UI 下拉选项（settings.html → IPC 'panda:displays:list' 返回值）。
 */
export interface DisplayOption {
  id: number
  label: string
  isPrimary: boolean
  bounds: WorkArea
  workArea: WorkArea
}

/**
 * 返回选中 Display：
 *   - displayId === 0（默认 / "Main"）→ primaryDisplayId 对应项
 *   - displayId 在列表中 → 该项
 *   - displayId 不在列表（外接屏拔掉等）→ 主屏 fallback
 *   - 空列表 → null（调用方应回退到 SYNTHETIC_WORK_AREA）
 */
export function selectDisplayForPanda(
  displays: ReadonlyArray<DisplayShape> | null | undefined,
  displayId: number | null | undefined,
  primaryDisplayId: number | null | undefined,
): DisplayShape | null {
  if (!Array.isArray(displays) || displays.length === 0) return null
  const wantPrimary = displayId == null || displayId === 0 || displayId === -1
  if (wantPrimary) {
    if (typeof primaryDisplayId === "number") {
      const primary = displays.find((d) => d && d.id === primaryDisplayId)
      if (primary) return primary
    }
    return displays[0]
  }
  const match = displays.find((d) => d && d.id === displayId)
  if (match) return match
  // displayId 失效（屏幕被拔）→ primary fallback
  if (typeof primaryDisplayId === "number") {
    const primary = displays.find((d) => d && d.id === primaryDisplayId)
    if (primary) return primary
  }
  return displays[0]
}

/**
 * 构造 settings.html 下拉用的可序列化列表。
 * 第一项永远是 "Main / 主屏"（id=0 哨位，配合 selectDisplayForPanda 的 wantPrimary 分支）。
 */
export function buildDisplayOptions(
  displays: ReadonlyArray<DisplayShape> | null | undefined,
  primaryDisplayId: number | null | undefined,
): DisplayOption[] {
  if (!Array.isArray(displays) || displays.length === 0) return []
  return displays.map((d, idx) => {
    const isPrimary = typeof primaryDisplayId === "number" && d.id === primaryDisplayId
    const dim = `${d.bounds.width}×${d.bounds.height}`
    const baseLabel = d.label && d.label.length > 0 ? d.label : `Display ${idx + 1}`
    const label = isPrimary ? `${baseLabel} (Main · ${dim})` : `${baseLabel} (${dim})`
    return {
      id: d.id,
      label,
      isPrimary,
      bounds: d.bounds,
      workArea: d.workArea,
    }
  })
}

/**
 * 给定 hitWin 物理 bounds，判断当前所属 Display id（用于跨屏拖拽后回写 prefs.displayId）。
 * 算法：与每个 display.bounds 求中心点距离，最小者胜出（与 Electron screen.getDisplayMatching 同源）。
 * 空列表 → null。
 */
export function findDisplayForBounds(
  displays: ReadonlyArray<DisplayShape> | null | undefined,
  bounds: { x: number; y: number; width: number; height: number },
): DisplayShape | null {
  if (!Array.isArray(displays) || displays.length === 0) return null
  const cx = bounds.x + bounds.width / 2
  const cy = bounds.y + bounds.height / 2
  let best: DisplayShape | null = null
  let bestDist = Number.POSITIVE_INFINITY
  for (const d of displays) {
    if (!d || !d.bounds) continue
    const dcx = d.bounds.x + d.bounds.width / 2
    const dcy = d.bounds.y + d.bounds.height / 2
    const dist = (cx - dcx) * (cx - dcx) + (cy - dcy) * (cy - dcy)
    if (dist < bestDist) {
      bestDist = dist
      best = d
    }
  }
  return best
}

/**
 * 计算"窗口居于 display 右下角 20px 内边距"的初始 bounds（与 main.ts createWindow 默认布局一致）。
 * 用于 displayId 切换时把 hitWin 跳转到目标屏的安全位置。
 */
export function computeDefaultBoundsOnDisplay(
  display: DisplayShape | null | undefined,
  size: { width: number; height: number },
  margin = 20,
): { x: number; y: number; width: number; height: number } | null {
  if (!display || !display.workArea) return null
  const wa = display.workArea
  return {
    x: wa.x + wa.width - size.width - margin,
    y: wa.y + wa.height - size.height - margin,
    width: size.width,
    height: size.height,
  }
}
