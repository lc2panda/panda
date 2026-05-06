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
): Promise<null> {
  logForDebugging('[recap] call() entered')
  const messages = context.getAppState().messages
  if (messages.length === 0) {
    logForDebugging('[recap] empty messages → early return')
    onDone('No conversation yet — nothing to recap.', {
      display: 'system',
    })
    return null
  }
  if (hasSummarySinceLastUserTurn(messages)) {
    logForDebugging('[recap] already exists this turn → early return')
    onDone('Recap already exists for the current turn.', {
      display: 'system',
    })
    return null
  }

  // fire-and-forget: onDone 立即 ack，setMessages 在 background 跑
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
}
