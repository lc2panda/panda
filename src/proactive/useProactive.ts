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

    // 设置定时 tick（每 5 分钟一次），而非每次 effect 都触发
    // 首次立即执行一次 cron 任务检查
    if (tickTimerRef.current === null) {
      // 立即执行一次 cron 任务
      if (isProactiveActive() || isNightModeActive()) {
        void runNightTasks().catch(() => {})
      }

      // 设置 5 分钟间隔的定时器
      const TICK_INTERVAL_MS = 5 * 60 * 1000
      tickTimerRef.current = setInterval(() => {
        if (isProactiveActive() || isNightModeActive()) {
          void runNightTasks().catch(() => {})
        }
      }, TICK_INTERVAL_MS)
    }

    return () => {
      if (tickTimerRef.current) {
        clearInterval(tickTimerRef.current)
        tickTimerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, queuedCommandsLength, hasActiveLocalJsxUI, isInPlanMode])
}
