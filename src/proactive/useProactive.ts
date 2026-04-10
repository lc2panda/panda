import { useEffect, useRef } from 'react'
import {
  isProactiveActive,
  isProactivePaused,
} from './index.js'
import { isNightModeActive, runNightTasks } from './nightMode.js'

type UseProactiveOptions = {
  isLoading: boolean
  queuedCommandsLength: number
  hasActiveLocalJsxUI: boolean
  isInPlanMode: boolean
  onSubmitTick: (prompt: string) => void
  onQueueTick: (prompt: string) => void
}

// Panda: 持久化定时器，避免 React effect 重跑反复重置 setInterval
// 之前的 bug: 依赖 isLoading/queuedCommandsLength 等频繁变化的 props,
// effect 每次重跑都 clearInterval + 重建, 导致 5 分钟定时器在活跃会话中永远不触发
const TICK_INTERVAL_MS = 5 * 60 * 1000

function _runTickIfEligible(): void {
  if (isProactivePaused()) return
  if (!isProactiveActive() && !isNightModeActive()) return
  void runNightTasks().catch(() => {})
}

export function useProactive(_options: UseProactiveOptions): void {
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const didInitialTickRef = useRef(false)

  // 空依赖数组: 只在 mount 时启动一次, unmount 时清理
  // 定时器内部检查 proactive state, 未激活时为 no-op
  useEffect(() => {
    // 首次激活时立即执行一次 cron 检查
    if (!didInitialTickRef.current) {
      didInitialTickRef.current = true
      _runTickIfEligible()
    }

    // 启动持久定时器（整个 hook 生命周期内只创建一次）
    if (tickTimerRef.current === null) {
      tickTimerRef.current = setInterval(_runTickIfEligible, TICK_INTERVAL_MS)
    }

    return () => {
      if (tickTimerRef.current) {
        clearInterval(tickTimerRef.current)
        tickTimerRef.current = null
      }
    }
  }, [])
}
