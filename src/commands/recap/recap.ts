// Input:  /recap slash command invocation (no args used)
// Output: pushes a SystemMessage{subtype:'away_summary'} into the transcript,
//         rendered by SystemTextMessage as a `※`-prefixed dimmed card.
// Pos:    src/commands/recap/recap.ts — actual `call` implementation,
//         lazy-loaded from index.ts via dynamic import (mirroring /color
//         pattern at src/commands/color/color.ts).
//
// v2.25.60 hotfix: split out from index.ts. Previously index.ts used
// `load: () => Promise.resolve({ async call })` which produced a plain
// object whose `call` property collided with Function.prototype.call in
// some V8 dispatch paths, causing /recap to silently no-op for Comdr.
// Aligning with /color's file split makes load() return a true ESM
// module namespace where `call` is unambiguously the export function.
//
// v2.26.2+ hotfix: real-runtime bug — AppState has no `messages` field
// (see AppStateStore.ts). messages live on ToolUseContext.messages
// (Tool.ts:250), wired in REPL.tsx getToolUseContext at L2525. The legacy
// `context.getAppState().messages` read returned undefined at runtime,
// triggering the "No conversation yet — nothing to recap" early return on
// every invocation. Test mocks faked appState.messages so the test suite
// passed (recap.test.ts:29), masking the bug. Fix: read context.messages
// directly, matching /copy, /rename, /export, /btw, /diff, /feedback.
//
// 一旦我被修改，请更新所属文件夹的 README.md（如有）。

import type {
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../../types/command.js'
import type { Message } from '../../types/message.js'
import { generateAwaySummary } from '../../services/awaySummary.js'
import { createAwaySummaryMessage } from '../../utils/messages.js'
import { logForDebugging } from '../../utils/debug.js'

/**
 * Returns true if there is already an away_summary system message after the
 * most recent user message. Mirrors hasSummarySinceLastUserTurn() in
 * useAwaySummary.ts to keep manual + automatic paths from doubling up.
 */
function hasSummarySinceLastUserTurn(messages: readonly Message[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!
    if (m.type === 'user' && !m.isMeta && !m.isCompactSummary) return false
    if (m.type === 'system' && m.subtype === 'away_summary') return true
  }
  return false
}

export async function call(
  onDone: LocalJSXCommandOnDone,
  context: LocalJSXCommandContext,
  _args?: string, // processSlashCommand 传 3 参数，对齐避免类型 mismatch
): Promise<null> {
  logForDebugging('[recap] call() entered')

  // v2.25.61 hotfix: 包整个 body 在 try/catch 里，任何 throw 都会 onDone 显示
  // 给用户。之前 v2.25.60 实测 [recap] call() entered 出现但无后续 log，
  // 怀疑 context.getAppState() 或类似 sync 调用 throw 被 processSlashCommand
  // 外层 catch 静默吞掉，用户看不到任何反馈。
  //
  // v2.26.2+ hotfix: 真因找到 — AppState 类型里根本没有 messages 字段
  // (见 AppStateStore.ts)。messages 是 ToolUseContext 顶层字段
  // (Tool.ts:250)，由 REPL.tsx:2525 的 getToolUseContext 把 messagesRef
  // 直接装进 context.messages。之前调用 context.getAppState().messages
  // 永远拿到 undefined → 触发 "No conversation yet" early return。
  // 单测里 makeContext({ getAppState: () => ({ messages }) }) 假塞了
  // messages 到 appState 上，所以测试通过运行时挂掉。
  // 修复：改读 context.messages，对齐 /copy /rename /export /btw /diff
  // /feedback 这一组同类命令的标准用法。
  try {
    logForDebugging(
      `[recap] reading context.messages (length=${context.messages?.length ?? 'undefined'})`,
    )
    const messages = context.messages ?? []
    logForDebugging(`[recap] messages.length=${messages.length}`)

    if (messages.length === 0) {
      logForDebugging('[recap] empty messages → early return')
      onDone('No conversation yet — nothing to recap.', {
        display: 'system',
      })
      return null
    }

    logForDebugging('[recap] checking hasSummarySinceLastUserTurn guard')
    if (hasSummarySinceLastUserTurn(messages)) {
      logForDebugging('[recap] already exists this turn → early return')
      onDone('Recap already exists for the current turn.', {
        display: 'system',
      })
      return null
    }

    logForDebugging(
      `[recap] dispatching background generate (messages=${messages.length})`,
    )
    onDone('Generating recap…', { display: 'system' })

    void (async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      try {
        const text = await generateAwaySummary(messages, controller.signal)
        clearTimeout(timeoutId)
        if (controller.signal.aborted) {
          logForDebugging('[recap] background timed out (30s)')
          return
        }
        if (text === null) {
          logForDebugging('[recap] background returned null')
          return
        }
        logForDebugging(
          `[recap] background success, pushing summary (${text.length} chars)`,
        )
        context.setMessages(prev => [...prev, createAwaySummaryMessage(text)])
      } catch (err) {
        clearTimeout(timeoutId)
        const msg = err instanceof Error ? err.message : String(err)
        logForDebugging(`[recap] background failed: ${msg}`)
      }
    })()

    return null
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : ''
    logForDebugging(`[recap] call() throw: ${msg}\n${stack}`)
    onDone(`Recap error: ${msg}`, { display: 'system' })
    return null
  }
}
