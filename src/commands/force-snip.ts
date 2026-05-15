import { feature } from 'bun:bundle'
import type { Command, LocalJSXCommandContext, LocalJSXCommandOnDone } from '../types/command.js'
import { logEvent } from '../services/analytics/index.js'

const forceSnip = {
  type: 'local-jsx',
  name: 'force-snip',
  description: 'Force-snip conversation history at the current point · 在当前位置强制截断对话历史',
  isEnabled: () => { if (feature('HISTORY_SNIP')) { return true } return false },
  immediate: true,
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalJSXCommandOnDone,
        context: LocalJSXCommandContext,
      ): Promise<React.ReactNode> {
        // Read from context.messages — AppState 不含 messages 字段，messages
        // 是 ToolUseContext 顶层字段（Tool.ts:250），由 REPL.tsx
        // getToolUseContext 注入。对齐 /recap、/copy、/rename 等同类命令。
        const messages = context.messages ?? []
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
