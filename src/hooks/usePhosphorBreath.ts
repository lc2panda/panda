// Input: periodMs（呼吸周期，默认 1600ms）+ 可选 frameMs（采样间隔，默认 80ms）+ 可选 enabled
// Output: number ∈ [0, 1] — 当前呼吸相位（0.5 + 0.5·sin(2π·phase)）
// Pos: Matrix 沉浸感动效共享 hook；TurnHeader / WelcomeCard / cursor / [exec] 等组件复用
//
// [NEW-FILE:#20260418-24] · v3 P9 沉浸感增强：
//   "phosphor afterglow" 呼吸 — 模拟 CRT 余辉的缓慢明暗循环。
//   组件用返回的 t 值插值颜色：
//     idx = Math.floor(t * MATRIX_BREATH_PULSE.length) → 取数组帧
//     或 ageToHex(0.5 - t * 0.4) → 在 BASE↔NEON 区间连续插值
//
// 性能注意：80ms/帧 = 12.5 fps，对 ink 来说很轻；建议同 component 内只调用一次。
// React #310/#300：调用方必须无条件调用本 hook；用 enabled=false 关闭 interval，
// 不得用 early-return 跳过 hook 声明。

import { useEffect, useState } from 'react'

export function usePhosphorBreath(
  periodMs = 1600,
  frameMs = 80,
  enabled = true,
): number {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const start = Date.now()
    const id = setInterval(() => {
      const phase = ((Date.now() - start) % periodMs) / periodMs
      // 标准 0..1 余弦波（起点 0.5，峰值 1，谷值 0）
      setT(0.5 + 0.5 * Math.sin(phase * 2 * Math.PI))
    }, frameMs)
    return () => clearInterval(id)
  }, [periodMs, frameMs, enabled])
  return t
}
