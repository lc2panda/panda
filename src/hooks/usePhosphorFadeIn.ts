// Input: duration + steps
// Output: progress 0..1（多步颜色渐入用）
// Pos: T-C1 流式 phosphor 余辉用
//
// [NEW-FILE:#20260418-12]
// 步进式 fade-in：steps 默认 4 → 返回 0, 0.25, 0.5, 0.75, 1。
// 每步耗时 durationMs / steps，全部完成后停在 1。

import { useEffect, useState } from 'react'

export function usePhosphorFadeIn(durationMs = 300, steps = 4): number {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (step >= steps) return
    const t = setTimeout(() => setStep(n => n + 1), durationMs / steps)
    return () => clearTimeout(t)
  }, [step, steps, durationMs])
  return step / steps
}
