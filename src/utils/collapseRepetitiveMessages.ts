// Input: RenderableMessage[]
// Output: RenderableMessage[] (same shape)
// Pos: Messages.tsx collapse pipeline — folds consecutive identical short assistant messages
import type { RenderableMessage } from '../types/message.js'

const MIN_COLLAPSE_COUNT = 3
const MAX_TEXT_LENGTH = 30

function getShortAssistantText(msg: RenderableMessage): string | null {
  if (msg.type !== 'assistant') return null
  const content = msg.message?.content
  if (typeof content === 'string') {
    return content.trim().length <= MAX_TEXT_LENGTH ? content.trim() : null
  }
  if (Array.isArray(content) && content.length === 1) {
    const block = content[0]
    if (
      block &&
      typeof block === 'object' &&
      'type' in block &&
      block.type === 'text' &&
      'text' in block
    ) {
      const text = (block as { text: string }).text.trim()
      return text.length <= MAX_TEXT_LENGTH ? text : null
    }
  }
  return null
}

/**
 * Collapses consecutive assistant messages with identical short text content.
 * Targets proactive-tick "." responses and similar repetitive patterns.
 * Replaces a run of N identical messages with the first message, annotated
 * with the fold count.
 */
export function collapseRepetitiveMessages(
  messages: RenderableMessage[],
): RenderableMessage[] {
  const result: RenderableMessage[] = []
  let i = 0

  while (i < messages.length) {
    const msg = messages[i]!
    const text = getShortAssistantText(msg)

    if (text !== null) {
      let count = 1
      while (i + count < messages.length) {
        if (getShortAssistantText(messages[i + count]!) !== text) break
        count++
      }

      if (count >= MIN_COLLAPSE_COUNT) {
        result.push({
          ...msg,
          message: {
            ...(msg.message as object),
            content: [
              {
                type: 'text' as const,
                text: `${text}  ··· ${count} 条相同消息已折叠`,
              },
            ],
          },
        })
        i += count
      } else {
        for (let j = 0; j < count; j++) {
          result.push(messages[i + j]!)
        }
        i += count
      }
    } else {
      result.push(msg)
      i++
    }
  }

  return result
}
