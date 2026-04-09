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

export function useProactive(options: UseProactiveOptions): void {
  const {
    isLoading,
    queuedCommandsLength,
    hasActiveLocalJsxUI,
    isInPlanMode,
    onSubmitTick,
    onQueueTick,
  } = options

  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isProactiveActive()) {
      if (tickTimerRef.current) {
        clearInterval(tickTimerRef.current)
        tickTimerRef.current = null
      }
      return
    }

    if (isProactivePaused()) {
      return
    }

    if (isLoading || hasActiveLocalJsxUI || isInPlanMode) {
      return
    }

    if (queuedCommandsLength > 0) {
      return
    }

    const tickPrompt = '/proactive-tick'

    if (tickTimerRef.current === null) {
      if (!isLoading) {
        // 执行已注册的 cron 定时任务（dream, health, 71 场景等）
        // /proactive on 或 night-mode 均可触发，不限于夜间
        if (isProactiveActive() || isNightModeActive()) {
          void runNightTasks().catch(() => {})
        }
        onSubmitTick(tickPrompt)
      }
    }

    return () => {
      if (tickTimerRef.current) {
        clearInterval(tickTimerRef.current)
        tickTimerRef.current = null
      }
    }
  }, [
    isLoading,
    queuedCommandsLength,
    hasActiveLocalJsxUI,
    isInPlanMode,
    onSubmitTick,
    onQueueTick,
  ])
}
