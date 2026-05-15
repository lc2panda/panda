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
  peekPageOffset: 0,
  renameMode: false,
  renameDraft: '',
  pendingStopId: null,
  lastError: null,
  dispatchPrompt: '',
}

export type AgentViewActions = {
  refresh: () => Promise<void>
  moveCursor: (delta: number) => void
  setCursor: (index: number) => void
  jumpToIndex: (index: number) => void
  setGroupMode: (mode: GroupMode) => void
  togglePeek: () => void
  closePeek: () => void
  /** Peek 翻页：+1=往更早翻一页，-1=往更新翻一页。0 = 最新一页。 */
  movePeekPage: (delta: number) => void
  beginRename: (currentName: string) => void
  setRenameDraft: (draft: string) => void
  endRename: () => void
  setPendingStop: (id: string | null) => void
  setError: (err: string | null) => void
  /** 设置 dispatch prompt（Shift+Enter 时携带的草稿，Ctrl+G 编辑入口）。 */
  setDispatchPrompt: (text: string) => void
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
    // 切换时复位翻页到最新页（避免下次打开仍停留在旧偏移）。
    setState(prev => ({
      ...prev,
      peekOpen: !prev.peekOpen,
      peekPageOffset: 0,
    }))
  }, [])

  const closePeek = useCallback(() => {
    setState(prev => ({ ...prev, peekOpen: false, peekPageOffset: 0 }))
  }, [])

  const movePeekPage = useCallback((delta: number) => {
    setState(prev => {
      // 仅在 peek 打开时翻页有意义。
      if (!prev.peekOpen) return prev
      // 不允许偏移为负（=未来不存在）。上限由 PeekPanel 自己根据实际消息数裁掉。
      const next = Math.max(0, prev.peekPageOffset + delta)
      if (next === prev.peekPageOffset) return prev
      return { ...prev, peekPageOffset: next }
    })
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

  const setDispatchPrompt = useCallback((text: string) => {
    setState(prev => ({ ...prev, dispatchPrompt: text }))
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
    movePeekPage,
    beginRename,
    setRenameDraft,
    endRename,
    setPendingStop,
    setError,
    setDispatchPrompt,
  }

  return { state, actions, selected }
}
