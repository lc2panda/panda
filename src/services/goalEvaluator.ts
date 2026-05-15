// Input:  active goal condition + recent transcript messages + abort signal
// Output: { met: boolean, reason: string } evaluator decision, or null on error
// Pos:    src/services/goalEvaluator.ts — invoked from query/stopHooks.ts at
//         turn end. Wraps a small-fast-model (Haiku) call mirroring the
//         awaySummary.ts pattern (same getSmallFastModel/queryModelWithoutStreaming).
//
// NEW-FILE:#20260515-04 — implements upstream Claude Code v2.1.139 `/goal`.
//
// 一旦我被修改，请更新所属文件夹的 README.md（如有）。

import { APIUserAbortError } from '@anthropic-ai/sdk'
import { getEmptyToolPermissionContext } from '../Tool.js'
import type { Message } from '../types/message.js'
import { logForDebugging } from '../utils/debug.js'
import {
  createUserMessage,
  getAssistantMessageText,
} from '../utils/messages.js'
import { getSmallFastModel } from '../utils/model/model.js'
import { asSystemPrompt } from '../utils/systemPromptType.js'
import { queryModelWithoutStreaming } from './api/claude.js'

// Goal evaluator only needs recent context — large transcripts blow up Haiku's
// context and cost. 10 messages ≈ 5 exchanges, enough to judge "have we made
// progress on this condition." Aligns with awaySummary's 30 but is tighter
// because the eval prompt is a strict yes/no rather than a free-form summary.
const RECENT_MESSAGE_WINDOW = 10

const EVALUATOR_SYSTEM_PROMPT = `You are an evaluator. You assess whether a stated goal condition has been met based on a coding-assistant conversation transcript. You reply ONLY with strict JSON of the shape {"met": true|false, "reason": "<short reason ≤ 200 chars>"}. No prose outside the JSON. No code fences. No explanation.`

function buildEvaluatorPrompt(condition: string): string {
  return [
    `Goal condition: "${condition}"`,
    '',
    'Given the conversation above, has the goal condition been met by the assistant\'s most recent reply (the final assistant turn)? Consider only objective evidence — completed file edits, verified test runs, explicit confirmation. Do not mark met=true based solely on the assistant promising future work.',
    '',
    'Reply with strict JSON only: {"met": <bool>, "reason": "<≤200 chars>"}.',
  ].join('\n')
}

export type GoalEvaluation = {
  met: boolean
  reason: string
}

/**
 * Run one evaluator pass. Returns null on abort, empty transcript, API error,
 * or unparseable JSON — caller (stopHooks) treats null the same as met=false
 * (continue) but logs distinctly so we can monitor evaluator reliability.
 */
export async function evaluateGoal(
  condition: string,
  messages: readonly Message[],
  signal: AbortSignal,
): Promise<GoalEvaluation | null> {
  if (messages.length === 0) {
    logForDebugging('[goal-eval] empty transcript → null')
    return null
  }

  try {
    const recent = messages.slice(-RECENT_MESSAGE_WINDOW)
    // Append the evaluator prompt as a final user message so the Haiku call
    // sees: [transcript tail] + [eval instruction]. Same shape as awaySummary.
    const queryMessages: Message[] = [
      ...recent,
      createUserMessage({ content: buildEvaluatorPrompt(condition) }),
    ]

    const response = await queryModelWithoutStreaming({
      messages: queryMessages,
      // Evaluator-specific system prompt — DO NOT inherit main system prompt
      // (it would carry tool definitions etc. that bloat tokens for no gain).
      systemPrompt: asSystemPrompt([EVALUATOR_SYSTEM_PROMPT]),
      thinkingConfig: { type: 'disabled' },
      tools: [],
      signal,
      options: {
        getToolPermissionContext: async () => getEmptyToolPermissionContext(),
        model: getSmallFastModel(),
        toolChoice: undefined,
        isNonInteractiveSession: false,
        hasAppendSystemPrompt: false,
        agents: [],
        querySource: 'goal_evaluator',
        mcpTools: [],
        skipCacheWrite: true,
      },
    })

    if (response.isApiErrorMessage) {
      logForDebugging(
        `[goal-eval] API error: ${getAssistantMessageText(response)}`,
      )
      return null
    }

    const text = getAssistantMessageText(response).trim()
    if (text.length === 0) {
      logForDebugging('[goal-eval] empty model response')
      return null
    }

    return parseEvaluatorJson(text)
  } catch (err) {
    if (err instanceof APIUserAbortError || signal.aborted) {
      return null
    }
    logForDebugging(`[goal-eval] failed: ${err}`)
    return null
  }
}

/**
 * Extract {met, reason} from Haiku's reply. Tolerant of code fences and minor
 * whitespace because small fast models occasionally wrap JSON in ```json…```
 * despite the strict system prompt.
 */
export function parseEvaluatorJson(text: string): GoalEvaluation | null {
  // Strip ``` fences if model added them despite instructions
  let stripped = text.trim()
  if (stripped.startsWith('```')) {
    // Remove first line (``` or ```json) and last line (```)
    const lines = stripped.split('\n')
    if (lines.length >= 2) {
      lines.shift()
      if (lines[lines.length - 1]?.trim().startsWith('```')) {
        lines.pop()
      }
      stripped = lines.join('\n').trim()
    }
  }
  // Find first {...} block — gives a chance against leading prose
  const firstBrace = stripped.indexOf('{')
  const lastBrace = stripped.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    logForDebugging(`[goal-eval] no JSON braces in: ${stripped.slice(0, 200)}`)
    return null
  }
  const jsonSlice = stripped.slice(firstBrace, lastBrace + 1)

  try {
    const obj = JSON.parse(jsonSlice) as unknown
    if (
      typeof obj !== 'object' ||
      obj === null ||
      typeof (obj as { met?: unknown }).met !== 'boolean'
    ) {
      logForDebugging(`[goal-eval] bad schema: ${jsonSlice.slice(0, 200)}`)
      return null
    }
    const met = (obj as { met: boolean }).met
    const reasonRaw = (obj as { reason?: unknown }).reason
    const reason =
      typeof reasonRaw === 'string'
        ? reasonRaw.slice(0, 200)
        : met
          ? 'goal met'
          : 'not yet met'
    return { met, reason }
  } catch (err) {
    logForDebugging(
      `[goal-eval] JSON parse error: ${err} for: ${jsonSlice.slice(0, 200)}`,
    )
    return null
  }
}
