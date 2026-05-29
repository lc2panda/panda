// Input: useInput 事件流（input + Key + InputEvent）
// Output: 调用 AgentViewActions / 业务 callbacks，无返回值
// Pos: src/components/AgentView/ —— 20+ 键位的集中分发器，便于单测

import { useCallback } from 'react'
import type { Key } from '../../ink/events/input-event.js'
import {
  removeRosterEntry,
  renameEntry,
  togglePinned,
  upsertRosterEntry,
} from './roster.js'
import type { AgentViewActions } from './useAgentViewState.js'
import type { DashboardState, SessionEntry } from './types.js'

export type AgentViewCallbacks = {
  /** Enter / → : Attach 选中 session（spawn 子进程）。 */
  onAttach: (entry: SessionEntry) => void
  /** Shift+Enter: Dispatch + Attach（创建新 session 然后 attach）。 */
  onDispatchAndAttach: (entry: SessionEntry | null, draft: string) => void
  /** Ctrl+G: 在 $EDITOR 打开 dispatch prompt。 */
  onEditPrompt: () => void
  /** Ctrl+X: 第二次按 = 真删（已 pendingStop）；第一次 = 标记 pending。 */
  onStop: (entry: SessionEntry) => void
  /** ← 在空 prompt 上 = 退出 dashboard 回 shell。 */
  onExit: () => void
  /**
   * Enter 在 dispatch prompt 以 `! <command>` 开头时触发。
   * 将命令分流到 LocalShellTask 作为后台 shell session 执行，不进入 agent REPL。
   * 上游 2.1.154: "type `! <command>` to run a shell command as a background session".
   */
  onSpawnShell: (command: string) => void
}

type Handler = (input: string, key: Key) => boolean

/**
 * 工厂：根据状态 + actions + callbacks 构造一个 useInput handler。
 * 返回值 boolean = 是否消费了事件（用于子模式 short-circuit）。
 */
export function createKeyHandler(
  state: DashboardState,
  actions: AgentViewActions,
  callbacks: AgentViewCallbacks,
): Handler {
  return (input, key) => {
    // ---- Rename 模式：吃掉所有 keystroke，回车提交，Esc 取消 ----
    if (state.renameMode) {
      const selected = state.entries[state.cursor]
      if (key.return) {
        if (selected) {
          void renameEntry(selected.id, state.renameDraft).catch(err => {
            actions.setError(`rename failed: ${(err as Error).message}`)
          })
        }
        actions.endRename()
        return true
      }
      if (key.escape) {
        actions.endRename()
        return true
      }
      if (key.backspace || key.delete) {
        actions.setRenameDraft(state.renameDraft.slice(0, -1))
        return true
      }
      if (input && !key.ctrl && !key.meta) {
        actions.setRenameDraft(state.renameDraft + input)
        return true
      }
      return true // swallow everything else while renaming
    }

    // ---- Peek 面板打开时 Space 关闭 / Esc 关闭 ----
    if (state.peekOpen && key.escape) {
      actions.closePeek()
      return true
    }

    // ---- Peek 翻页：PgUp 往更早翻 / PgDn 往更新翻（仅 peek 打开时）----
    if (state.peekOpen && key.pageUp) {
      actions.movePeekPage(+1)
      return true
    }
    if (state.peekOpen && key.pageDown) {
      actions.movePeekPage(-1)
      return true
    }

    const selected = state.entries[state.cursor]

    // ---- 移动 ----
    if (key.upArrow) {
      actions.moveCursor(-1)
      // 移动光标后清掉 pendingStop（双击窗口期被中断）
      if (state.pendingStopId) actions.setPendingStop(null)
      return true
    }
    if (key.downArrow) {
      actions.moveCursor(1)
      if (state.pendingStopId) actions.setPendingStop(null)
      return true
    }

    // ---- Alt+1..9 跳转前 9 个 ----
    if (key.meta && input && /^[1-9]$/.test(input)) {
      const idx = parseInt(input, 10) - 1
      actions.jumpToIndex(idx)
      return true
    }

    // ---- Shift+Enter / Ctrl+Enter: Dispatch + Attach ----
    // 注意：Ink 的 key.shift 在 return 上未必稳定（终端依赖 Kitty 协议），
    // 在不可用的终端我们 fallback 到 Ctrl+Enter（key.ctrl）。
    // 必须先于普通 Enter/→ Attach 分支判定，否则 Ctrl+Enter 会先匹配 Attach。
    // dispatchPrompt 作为 draft 透传，handler 通过 --prefill 注入到新 panda 子进程。
    if (key.return && (key.shift || key.ctrl)) {
      // ---- `! <command>` 前缀：分流到 LocalShellTask 后台 shell session ----
      // 上游 2.1.154: "type `! <command>` to run a shell command as a background session"
      // 若 dispatch prompt 以 `!` 开头，提取命令后半段，调用 onSpawnShell，
      // 不进入 agent REPL（不调用 onDispatchAndAttach）。
      const shellMatch = state.dispatchPrompt.match(/^!\s*(.+)/)
      if (shellMatch) {
        const shellCmd = shellMatch[1].trim()
        if (shellCmd.length > 0) {
          callbacks.onSpawnShell(shellCmd)
          return true
        }
      }
      callbacks.onDispatchAndAttach(selected ?? null, state.dispatchPrompt)
      return true
    }

    // ---- Attach: Enter / → ----
    if ((key.return || key.rightArrow) && !key.shift && !key.ctrl && selected) {
      callbacks.onAttach(selected)
      return true
    }

    // ---- Space: Peek 切换 ----
    if (input === ' ' && !key.ctrl && !key.meta) {
      actions.togglePeek()
      return true
    }

    // ---- Ctrl+S: 分组切换 ----
    if (key.ctrl && (input === 's' || input === 'S')) {
      actions.setGroupMode(state.groupMode === 'status' ? 'cwd' : 'status')
      return true
    }

    // ---- Ctrl+T: Pin toggle ----
    if (key.ctrl && (input === 't' || input === 'T')) {
      if (selected) {
        // pid-only 行需要先 promote 到 roster
        if (selected.id.startsWith('pid:')) {
          const newId = selected.sessionId ?? `pid-${selected.pid}`
          void upsertRosterEntry({
            id: newId,
            name: selected.displayName,
            sessionId: selected.sessionId,
            cwd: selected.cwd,
            pinned: true,
            createdAt: selected.startedAt,
            lastSeenAt: Date.now(),
          }).catch(err =>
            actions.setError(`pin failed: ${(err as Error).message}`),
          )
        } else {
          void togglePinned(selected.id).catch(err =>
            actions.setError(`pin failed: ${(err as Error).message}`),
          )
        }
      }
      return true
    }

    // ---- Ctrl+R: 进入 rename 模式 ----
    if (key.ctrl && (input === 'r' || input === 'R')) {
      if (selected) {
        actions.beginRename(selected.displayName)
      }
      return true
    }

    // ---- Ctrl+X: Stop（第二次确认 = 删除 roster 项） ----
    if (key.ctrl && (input === 'x' || input === 'X')) {
      if (!selected) return true
      if (state.pendingStopId === selected.id) {
        // 第二次：真删
        if (!selected.id.startsWith('pid:')) {
          void removeRosterEntry(selected.id).catch(err =>
            actions.setError(`remove failed: ${(err as Error).message}`),
          )
        }
        actions.setPendingStop(null)
        callbacks.onStop(selected)
      } else {
        actions.setPendingStop(selected.id)
      }
      return true
    }

    // ---- Ctrl+G: 编辑 dispatch prompt ----
    if (key.ctrl && (input === 'g' || input === 'G')) {
      callbacks.onEditPrompt()
      return true
    }

    // ---- ← / Esc / q: 退出 dashboard ----
    if (
      key.leftArrow ||
      key.escape ||
      (!key.ctrl && (input === 'q' || input === 'Q'))
    ) {
      callbacks.onExit()
      return true
    }

    return false
  }
}

/**
 * Hook 形式包装 createKeyHandler。
 */
export function useAgentViewKeybindings(
  state: DashboardState,
  actions: AgentViewActions,
  callbacks: AgentViewCallbacks,
): Handler {
  return useCallback(createKeyHandler(state, actions, callbacks), [
    state,
    actions,
    callbacks,
  ])
}
