// Input: isActive（仅在 streaming 状态启用 polling）
// Output: number — 当前流式 token 估算（基于字节数 / 4）
// Pos: TurnHeader 流式 progress bar 用；singleton ref 避开 Context/Store
//      reduce REPL re-render 频率 — 每 100ms 节流一次
//
// [NEW-FILE:#20260426-MTX4-1] · v3.7 Pro 波次4 流式 progress
//
// 架构理由：
//   流式 token 在 REPL.tsx `responseLengthRef.current` 中累加（字节长度），
//   该 ref 不在 React state / store / Context 中。TurnHeader 又在
//   Messages.tsx 路径深处渲染。如果把 streamingText / responseLength 提到
//   props 链上，Messages 整体频繁 re-render（每 token 字节都触发）。
//
//   方案：用 module-level singleton ref，REPL 在每次 setStreamingText
//   时同步 publish 当前长度到 ref；TurnHeader 通过 useStreamProgress
//   hook 每 100ms 读 ref 并更新 local state — 节流到最快 10Hz。
//
// 性能：100ms 节流意味着即使每 token 都 publish，TurnHeader 也最多 10 次/秒
//   re-render（远低于人眼临界 60Hz）。
//
// reducedMotion：呼叫方（TurnHeader）在 reducedMotion 时直接 fallback 到
//   静态字符 ▰ GEN，不调用本 hook。

import { useEffect, useState, useRef } from 'react'

/**
 * Module-level singleton ref —— 全局唯一的 stream progress source。
 * REPL.tsx 在 streaming 时 publishStreamProgress(byteLen)；
 * 任意组件通过 useStreamProgress() hook 订阅（节流）。
 */
let _streamProgressBytes = 0
let _streamProgressTick = 0 // 每次 publish 自增，用于让 hook 知道是否变化

/**
 * REPL 调用方在 streamingText 变化时 publish。
 * 直接传字节长度（streamingText.length）。
 */
export function publishStreamProgress(bytes: number): void {
  if (bytes !== _streamProgressBytes) {
    _streamProgressBytes = bytes
    _streamProgressTick++
  }
}

/**
 * 重置（streaming 结束 / resetLoadingState 时调用）。
 */
export function resetStreamProgress(): void {
  _streamProgressBytes = 0
  _streamProgressTick++
}

/**
 * useStreamProgress —— 节流 100ms 读取 module-level ref，返回当前字节数。
 * @param isActive 仅在 isActive=true 时启用 polling，其余时间立即返回 0
 * @param pollMs 节流周期，默认 100ms（最快 10Hz）
 */
export function useStreamProgress(isActive: boolean, pollMs = 100): number {
  const [bytes, setBytes] = useState(0)
  const lastTickRef = useRef(_streamProgressTick)

  useEffect(() => {
    if (!isActive) {
      // 转入非 active：重置展示值
      if (bytes !== 0) setBytes(0)
      return
    }
    const id = setInterval(() => {
      // 仅 tick 变化时才 setState（避免无意义 re-render）
      if (lastTickRef.current !== _streamProgressTick) {
        lastTickRef.current = _streamProgressTick
        setBytes(_streamProgressBytes)
      }
    }, pollMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, pollMs])

  return bytes
}
