// Input: trigger（变化时触发）+ duration
// Output: bool — duration 时长内 true，之后 false
// Pos: 跨组件 flash 效果工具
//
// [NEW-FILE:#20260418-11]
// 典型用例：thinking 完成、tool 完成时让 gutter / header 短暂高亮一闪。

import { useEffect, useState } from 'react'

export function useFlashOnce(trigger: unknown, durationMs = 150): boolean {
  const [active, setActive] = useState(false)
  useEffect(() => {
    if (trigger === undefined || trigger === null) return
    setActive(true)
    const t = setTimeout(() => setActive(false), durationMs)
    return () => clearTimeout(t)
  }, [trigger, durationMs])
  return active
}
