// Input: SkillExecution + OutcomeScore + followup messages
// Output: SkillDiff[] — candidate improvements derived from signals
// Pos: src/skills/learning/diffExtractor.ts — stage 3 of Hermes four-stage loop

import type { SkillExecution, OutcomeScore, SkillDiff } from './types.js'

/**
 * From execution + outcome, extract potential improvement diffs.
 * MVP: only looks at obvious signals — no LLM call.
 */
export function extractDiffs(
  exec: SkillExecution,
  outcome: OutcomeScore,
  followupMessages: ReadonlyArray<{ role: string; content: string }>,
): SkillDiff[] {
  const diffs: SkillDiff[] = []

  // Signal 1: explicit user rejection → step-revision candidate
  if (outcome.signals.includes('user-rejected')) {
    diffs.push({
      skillName: exec.skillName,
      diffType: 'step-revision',
      description:
        'User rejected the skill output. Skill prompt may need clarification.',
    })
  }

  // Signal 2: user immediately re-invokes the same skill → arg-correction
  const followupText = followupMessages.map(m => m.content).join(' ')
  if (
    followupText.includes(`/${exec.skillName}`) ||
    followupText.includes(exec.skillName)
  ) {
    diffs.push({
      skillName: exec.skillName,
      diffType: 'arg-correction',
      description: 'User re-invoked the same skill with different args.',
    })
  }

  return diffs
}

/**
 * LLM-aided diff extraction. For low-score outcomes with user followups we
 * ask a small/fast model to produce up to 3 structured diffs. Any failure
 * (no signal, no network, parse error, missing sideQuery infra) falls back
 * to the heuristic `extractDiffs`. The LLM path is a strict superset of the
 * heuristic: worst case we return the same diffs.
 */
export async function extractDiffsLLM(
  exec: SkillExecution,
  outcome: OutcomeScore,
  followupMessages: ReadonlyArray<{ role: string; content: string }>,
): Promise<SkillDiff[]> {
  // Budget gate: only spend LLM tokens on clearly-failed executions with
  // at least one followup message that could explain what went wrong.
  if (outcome.score >= 0.5 || followupMessages.length === 0) {
    return extractDiffs(exec, outcome, followupMessages)
  }

  try {
    const { queryHaiku } = await import('../../services/api/claude.js')
    const { asSystemPrompt } = await import('../../utils/systemPromptType.js')

    const controller = new AbortController()
    // 8s hard timeout — learning loop is best-effort and must not stall
    // the host turn. If Haiku misses the window we fall back to heuristic.
    const timer = setTimeout(() => controller.abort(), 8000)

    const userPrompt = [
      `Skill: ${exec.skillName}`,
      `Args: ${JSON.stringify(exec.args).slice(0, 500)}`,
      `Result: ${exec.result}`,
      `Score: ${outcome.score} (signals: ${outcome.signals.join(', ')})`,
      `User followup:`,
      ...followupMessages.map(
        (m, i) => `  [${i}] ${m.role}: ${m.content.slice(0, 200)}`,
      ),
      ``,
      `Output a JSON array with up to 3 items. Each item: {"diffType": "arg-correction"|"step-revision"|"output-rewrite", "description": "...", "beforeSnippet": "...", "afterSnippet": "..."}. If signal is too weak, return []. Respond with ONLY valid JSON, no prose.`,
    ].join('\n')

    const systemPrompt = asSystemPrompt([
      `You analyse failed skill executions and propose small, targeted improvements. Your output must be valid JSON only.`,
    ])

    let response
    try {
      response = await queryHaiku({
        systemPrompt,
        userPrompt,
        signal: controller.signal,
        options: {
          querySource: 'skill_learning_diff',
          agents: [],
          isNonInteractiveSession: true,
          hasAppendSystemPrompt: false,
          mcpTools: [],
        },
      })
    } finally {
      clearTimeout(timer)
    }

    const rawContent = response?.message?.content
    let text = ''
    if (typeof rawContent === 'string') {
      text = rawContent
    } else if (Array.isArray(rawContent)) {
      for (const block of rawContent) {
        if (block && (block as { type?: string }).type === 'text') {
          text += (block as { text?: string }).text || ''
        }
      }
    }
    if (!text) return extractDiffs(exec, outcome, followupMessages)

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return extractDiffs(exec, outcome, followupMessages)

    const parsed = JSON.parse(jsonMatch[0]) as Array<Partial<SkillDiff>>
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return extractDiffs(exec, outcome, followupMessages)
    }

    const allowedTypes = new Set<SkillDiff['diffType']>([
      'arg-correction',
      'step-revision',
      'output-rewrite',
    ])
    const diffs = parsed
      .slice(0, 3)
      .map<SkillDiff>(d => ({
        skillName: exec.skillName,
        diffType: allowedTypes.has(d.diffType as SkillDiff['diffType'])
          ? (d.diffType as SkillDiff['diffType'])
          : 'step-revision',
        description: typeof d.description === 'string' ? d.description : '',
        beforeSnippet:
          typeof d.beforeSnippet === 'string' ? d.beforeSnippet : undefined,
        afterSnippet:
          typeof d.afterSnippet === 'string' ? d.afterSnippet : undefined,
      }))
      .filter(d => d.description.length > 0)

    if (diffs.length === 0) {
      return extractDiffs(exec, outcome, followupMessages)
    }
    return diffs
  } catch {
    // Any failure — missing module, import cycle, API error, JSON parse —
    // quietly degrade to heuristic. This is intentional: the learning loop
    // is not allowed to break the host turn.
    return extractDiffs(exec, outcome, followupMessages)
  }
}
