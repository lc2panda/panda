import { feature } from 'bun:bundle'
import type { Command, LocalJSXCommandContext, LocalJSXCommandOnDone } from '../types/command.js'
import { logEvent } from '../services/analytics/index.js'

const forceSnip = {
  type: 'local-jsx',
  name: 'force-snip',
  description: 'Force-snip conversation history at the current point',
  isEnabled: () => { if (feature('HISTORY_SNIP')) { return true } return false },
  immediate: true,
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalJSXCommandOnDone,
        context: LocalJSXCommandContext,
      ): Promise<React.ReactNode> {
        const messages = context.getAppState().messages
        if (messages.length === 0) {
          onDone('No messages to snip.', { display: 'system' })
          return null
        }

        const lastAssistantIdx = messages.findLastIndex(
          (m: { type: string }) => m.type === 'assistant',
        )
        if (lastAssistantIdx === -1) {
          onDone('No assistant messages found to snip at.', {
            display: 'system',
          })
          return null
        }

        context.setMessages(prev => {
          return prev.map((msg, i) => {
            if (i <= lastAssistantIdx) {
              return { ...msg, isSnipped: true } as typeof msg
            }
            return msg
          })
        })

        logEvent('tengu_force_snip', {
          snipped_count: lastAssistantIdx + 1,
          total_messages: messages.length,
        })

        onDone(
          `Snipped ${lastAssistantIdx + 1} message(s). They will be excluded from the API context on the next turn.`,
          { display: 'system' },
        )
        return null
      },
    }),
} satisfies Command

export default forceSnip
