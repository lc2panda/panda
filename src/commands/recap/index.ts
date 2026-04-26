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
        const messages = context.getAppState().messages
        if (messages.length === 0) {
          onDone('No conversation yet — nothing to recap.', {
            display: 'system',
          })
          return null
        }
        if (hasSummarySinceLastUserTurn(messages)) {
          onDone('Recap already exists for the current turn.', {
            display: 'system',
          })
          return null
        }

        const controller = new AbortController()
        const text = await generateAwaySummary(messages, controller.signal)

        if (controller.signal.aborted || text === null) {
          onDone('Recap generation aborted or returned empty.', {
            display: 'system',
          })
          return null
        }

        context.setMessages(prev => [...prev, createAwaySummaryMessage(text)])
        onDone(undefined, { display: 'skip' })
        return null
      },
    }),
} satisfies Command

export default recap
