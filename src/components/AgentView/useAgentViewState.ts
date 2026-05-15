// Input: 用户交互事件（光标移动/分组切换/peek 开关/rename 草稿）
// Output: DashboardState 快照 + setter
// Pos: src/components/AgentView/ —— 单文件实现 Zustand 风格的状态机，避免引入新依赖

import { useCallback, useEffect, useRef, useState } from 'react'
import { enumerateSessions } from './sessionEnumerator.js'
import type { DashboardState, GroupMode, SessionEntry } from './types.js'

const REFRESH_MS = 2_000

const INITIAL_STATE: DashboardState = {
  entries: [],
  cursor: 0,
  groupMode: 'status',
  peekOpen: false,
  renameMode: false,
  renameDraft: '',
  pendingStopId: null,
  lastError: null,
}

export type AgentViewActions = {
  refresh: () => Promise<void>
  moveCursor: (delta: number) => void
  setCursor: (index: number) => void
  jumpToIndex: (index: number) => void
  setGroupMode: (mode: GroupMode) => void
  togglePeek: () => void
  closePeek: () => void
  beginRename: (currentName: string) => void
  setRenameDraft: (draft: string) => void
  endRename: () => void
  setPendingStop: (id: string | null) => void
  setError: (err: string | null) => void
}

/**
 * Dashboard 状态钩子。
 * - 自动每 2 秒刷新一次 entries
 * - 光标/选中/分组/peek/rename/pendingStop 全部在内存里
 */
export function useAgentViewState(): {
  state: DashboardState
  actions: AgentViewActions
  selected: SessionEntry | null
} {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE)
  const stateRef = useRef(state)
  stateRef.current = state

  const refresh = useCallback(async () => {
    try {
      const entries = await enumerateSessions()
      setState(prev => {
        // 光标位置保持在原 id 上，否则裁剪到合法范围。
        const prevId = prev.entries[prev.cursor]?.id
        let nextCursor = prev.cursor
        if (prevId) {
          const idx = entries.findIndex(e => e.id === prevId)
          if (idx >= 0) nextCursor = idx
        }
        if (nextCursor >= entries.length) {
          nextCursor = Math.max(0, entries.length - 1)
        }
        return {
          ...prev,
          entries,
          cursor: nextCursor,
          lastError: null,
        }
      })
    } catch (e) {
      setState(prev => ({
        ...prev,
        lastError: (e as Error)?.message ?? 'enumerate failed',
      }))
    }
  }, [])

  // 初次加载 + 定时刷新。在 rename 模式期间暂停以免光标抖动。
  useEffect(() => {
    void refresh()
    const id = setInterval(() => {
      if (!stateRef.current.renameMode) void refresh()
    }, REFRESH_MS)
    return () => clearInterval(id)
  }, [refresh])

  const moveCursor = useCallback((delta: number) => {
    setState(prev => {
      if (prev.entries.length === 0) return prev
      const next = Math.max(
        0,
        Math.min(prev.entries.length - 1, prev.cursor + delta),
      )
      return { ...prev, cursor: next }
    })
  }, [])

  const setCursor = useCallback((index: number) => {
    setState(prev => {
      if (prev.entries.length === 0) return prev
      const next = Math.max(0, Math.min(prev.entries.length - 1, index))
      return { ...prev, cursor: next }
    })
  }, [])

  const jumpToIndex = setCursor

  const setGroupMode = useCallback((mode: GroupMode) => {
    setState(prev => ({ ...prev, groupMode: mode }))
  }, [])

  const togglePeek = useCallback(() => {
    setState(prev => ({ ...prev, peekOpen: !prev.peekOpen }))
  }, [])

  const closePeek = useCallback(() => {
    setState(prev => ({ ...prev, peekOpen: false }))
  }, [])

  const beginRename = useCallback((currentName: string) => {
    setState(prev => ({ ...prev, renameMode: true, renameDraft: currentName }))
  }, [])

  const setRenameDraft = useCallback((draft: string) => {
    setState(prev => ({ ...prev, renameDraft: draft }))
  }, [])

  const endRename = useCallback(() => {
    setState(prev => ({ ...prev, renameMode: false, renameDraft: '' }))
  }, [])

  const setPendingStop = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, pendingStopId: id }))
  }, [])

  const setError = useCallback((err: string | null) => {
    setState(prev => ({ ...prev, lastError: err }))
  }, [])

  const selected = state.entries[state.cursor] ?? null

  const actions: AgentViewActions = {
    refresh,
    moveCursor,
    setCursor,
    jumpToIndex,
    setGroupMode,
    togglePeek,
    closePeek,
    beginRename,
    setRenameDraft,
    endRename,
    setPendingStop,
    setError,
  }

  return { state, actions, selected }
}
