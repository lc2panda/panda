/**
 * Input:  user invokes `/recap` slash command (no args)
 * Output: pushes a SystemMessage{subtype:'away_summary'} into the transcript,
 *         rendered by SystemTextMessage as a `※`-prefixed dimmed card.
 * Pos:    src/commands/recap/index.ts — manual entry point that mirrors the
 *         5-minute blur-triggered automatic recap (src/hooks/useAwaySummary.ts).
 *         Reuses generateAwaySummary() from src/services/awaySummary.ts as a
 *         pure function — no timer/blur side effects involved.
 *
 * NEW-FILE:#20260426-01
 *
 * 设计要点：
 * - type='local-jsx'：需要直接 setMessages push 自定义 SystemMessage 子类型，
 *   `local` 仅能产 `<local-command-stdout>` 包装的 user 消息，无法触达 ※ 渲染分支。
 * - hasSummarySinceLastUserTurn 守卫：与 useAwaySummary 同源逻辑，避免手动 +
 *   自动同 turn 内重复生成。已存在则提示用户。
 * - AbortController：用户在生成中按 Esc 可立即中止，不留 partial 卡片。
 */
import type {
  Command,
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

const recap = {
  type: 'local-jsx',
  name: 'recap',
  description:
    'Generate a "where we left off" summary of the current session · 立即生成"上次进度"摘要卡片',
  immediate: true,
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalJSXCommandOnDone,
        context: LocalJSXCommandContext,
      ): Promise<React.ReactNode> {
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

        // v2.25.59 hotfix: fire-and-forget — onDone 立即 ack 不阻塞 dispatch，
        // generateAwaySummary 在 background 跑，完成后 setMessages push ※ 卡片。
        // 之前 v2.25.57 的 await + 30s timeout 在某条件下 onDone 仍不显示
        // (Comdr 实测：等 60s 仍零反应)，根因可能在 await 期间 outer Promise
        // 长时间挂起影响 React render path。改为 fire-and-forget 让 dispatch
        // 链路立即解锁，给用户即时反馈。
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
      },
    }),
} satisfies Command

export default recap
