// Input: conversation messages from completed session
// Output: boolean suggestion to user about running /skillify
// Pos: post-session analysis — detects repeatable multi-step patterns
import type { Message } from '../types/message.js'
import { logForDebugging } from '../utils/debug.js'

/**
 * Heuristics for detecting a repeatable multi-step workflow in a session.
 *
 * Returns a suggestion string if the session looks like it contains a
 * reusable pattern, or null if not worth suggesting.
 */
export function analyzeSessionForSkillCandidate(
  messages: Message[],
): string | null {
  try {
    const userMessages = messages.filter((m) => m.type === 'user')
    const assistantMessages = messages.filter((m) => m.type === 'assistant')

    // Need at least 4 user turns to constitute a "multi-step workflow"
    if (userMessages.length < 4) return null

    // Check for repeated structural patterns — user gives similar instructions
    const userTexts = userMessages
      .map((m) => {
        const content = m.message?.content
        if (typeof content === 'string') return content
        if (!Array.isArray(content)) return ''
        return content
          .filter(
            (b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text',
          )
          .map((b) => b.text)
          .join('\n')
      })
      .filter((t) => t.trim().length > 0)

    // Heuristic 1: User gave step-by-step instructions (numbered list)
    const hasStepInstructions = userTexts.some(
      (t) =>
        /(?:步骤|step)\s*[1-3]/i.test(t) ||
        /(?:1\.|第一步|首先)[\s\S]*(?:2\.|第二步|然后)/i.test(t),
    )

    // Heuristic 2: Session had tool use (indicates a concrete workflow)
    const toolUseCount = assistantMessages.filter((m) => {
      const content = m.message?.content
      if (!Array.isArray(content)) return false
      return content.some((b) => b.type === 'tool_use')
    }).length

    const hasSignificantToolUse = toolUseCount >= 3

    // Heuristic 3: User repeated similar commands/patterns
    const commandPatterns = userTexts.filter(
      (t) =>
        t.startsWith('/') || /^(run|execute|do|make|create|build|deploy)/i.test(t),
    )
    const hasRepeatedCommands = commandPatterns.length >= 2

    // Combined scoring
    let score = 0
    if (hasStepInstructions) score += 2
    if (hasSignificantToolUse) score += 1
    if (hasRepeatedCommands) score += 1
    if (userMessages.length >= 6) score += 1

    if (score >= 3) {
      return (
        '本次会话包含可复用的多步骤工作流。' +
        '运行 `/skillify` 可将其保存为可重复调用的 Skill。'
      )
    }

    return null
  } catch (e) {
    logForDebugging('autoLearn analysis error', e)
    return null
  }
}
