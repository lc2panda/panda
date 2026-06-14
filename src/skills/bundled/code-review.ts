// Input: optional args string (effort level + free-text focus + `--comment` flag)
// Output: registers the `code-review` bundled skill (Command) into the registry
// Pos: bundled skills — 对齐上游 Claude Code v2.1.147 的 /code-review（原 /simplify）
import { AGENT_TOOL_NAME } from '../../tools/AgentTool/constants.js'
import { registerBundledSkill } from '../bundledSkills.js'

/**
 * Parsed `/code-review` arguments.
 *
 * The skill layer has no CLI flag parser (skills are prompt templates), so we
 * extract the recognised tokens out of the raw `args` string here and let the
 * generated prompt steer the model. Recognised:
 *   - effort level:  `low` | `medium` | `high`  (first bare word, optional)
 *   - `--comment`:   post findings as GitHub PR inline review comments
 *   - everything else is treated as free-text additional focus.
 */
interface CodeReviewArgs {
  effort: 'low' | 'medium' | 'high'
  postComments: boolean
  focus: string
}

function parseCodeReviewArgs(raw: string | undefined): CodeReviewArgs {
  let postComments = false
  let effort: 'low' | 'medium' | 'high' = 'medium'
  const focusTokens: string[] = []

  const tokens = (raw ?? '').trim().split(/\s+/).filter(Boolean)
  let effortSeen = false
  for (const tok of tokens) {
    const lower = tok.toLowerCase()
    if (lower === '--comment' || lower === '--comments') {
      postComments = true
      continue
    }
    if (
      !effortSeen &&
      (lower === 'low' || lower === 'medium' || lower === 'high')
    ) {
      effort = lower
      effortSeen = true
      continue
    }
    focusTokens.push(tok)
  }

  return { effort, postComments, focus: focusTokens.join(' ') }
}

/**
 * Per-effort review guidance. Higher effort fans out to more parallel review
 * agents and widens the scope from "obvious correctness bugs only" up to a
 * full reuse/quality/efficiency sweep.
 */
const EFFORT_GUIDANCE: Record<CodeReviewArgs['effort'], string> = {
  low: `**Effort: low** — Do a fast single-pass review yourself (no sub-agents). Report only **high-confidence correctness bugs**: logic errors, off-by-one, null/undefined dereferences, wrong conditionals, swapped arguments, missing await, resource leaks, and broken error handling. Skip style, naming, and "could be cleaner" suggestions.`,
  medium: `**Effort: medium** — Launch **two** ${AGENT_TOOL_NAME} agents in parallel: one hunting **correctness bugs** (logic errors, edge cases, null handling, race conditions, broken error paths), one checking **code reuse** (newly written code that duplicates an existing utility/helper). Report correctness bugs first, reuse findings second.`,
  high: `**Effort: high** — Launch **three** ${AGENT_TOOL_NAME} agents in parallel covering (1) **correctness bugs** — logic errors, edge cases, concurrency, error handling, security; (2) **code reuse** — duplication of existing utilities; (3) **quality & efficiency** — redundant state, parameter sprawl, leaky abstractions, unnecessary work in hot paths. Report correctness bugs first; they are the priority.`,
}

function buildPrompt(args: CodeReviewArgs): string {
  const sections: string[] = []

  sections.push(
    `# Code Review

Review the changed code and report **correctness bugs** — defects that make the code behave incorrectly. Prioritise real bugs over stylistic nits.`,
  )

  sections.push(
    `## Phase 1: Identify Changes

Run \`git diff\` (or \`git diff HEAD\` if there are staged changes) to see what changed. If there are no git changes, review the most recently modified files that the user mentioned or that you edited earlier in this conversation. Capture each finding's **file path** and **line number** in the new file — you will need them if posting inline comments.`,
  )

  sections.push(`## Phase 2: Review\n\n${EFFORT_GUIDANCE[args.effort]}`)

  sections.push(
    `## Phase 3: Report Findings

For every finding, report:
- **Severity** — \`bug\` (definite correctness defect) / \`possible-bug\` (needs confirmation) / \`nit\` (minor).
- **Location** — \`path:line\`.
- **What's wrong** and **why**, with a concrete fix suggestion.

Lead with \`bug\`-severity correctness issues. If the code is clean, say so plainly instead of inventing findings. Do **not** fix the code unless the user explicitly asks — this command reports; it does not auto-edit.`,
  )

  if (args.postComments) {
    sections.push(
      `## Phase 4: Post Inline PR Comments (\`--comment\`)

The user passed \`--comment\`: publish each finding as a GitHub pull-request **inline review comment** using the \`gh\` CLI via the Bash tool.

1. **Resolve the PR context.** Run:
   \`\`\`bash
   gh pr view --json number,headRepositoryOwner,headRepository,headRefName
   \`\`\`
   - If this fails or returns no PR (the current branch has no associated PR), **do not error**. Print a short notice like \`No open PR for the current branch — skipping inline comments; findings are shown above.\` and stop. Still keep the Phase 3 report.
   - Otherwise capture the PR \`number\`, the \`owner/repo\` slug, and the head ref.

2. **Determine the latest commit SHA of the PR head:**
   \`\`\`bash
   gh pr view --json headRefOid -q .headRefOid
   \`\`\`

3. **Post each finding** as an inline review comment with the PR review comments API. For a single-line comment:
   \`\`\`bash
   gh api --method POST /repos/{owner}/{repo}/pulls/{number}/comments \\
     -f body='<finding body, markdown>' \\
     -f commit_id='<headRefOid>' \\
     -f path='<file path relative to repo root>' \\
     -F line=<line number in the new file> \\
     -f side='RIGHT'
   \`\`\`
   For a multi-line range, add \`-F start_line=<n> -f start_side='RIGHT'\`.
   - Only post comments for lines that are part of this PR's diff; the API rejects comments on unchanged lines. If a finding is outside the diff, skip the inline comment for it and note that in your summary.
   - Prefix each comment body with the severity, e.g. \`**bug:** ...\`.

4. **Summarise.** End with how many inline comments were posted and how many findings were skipped (out-of-diff or no-PR).`,
    )
  }

  if (args.focus) {
    sections.push(`## Additional Focus\n\n${args.focus}`)
  }

  return sections.join('\n\n')
}

export function registerCodeReviewSkill(): void {
  registerBundledSkill({
    name: 'code-review',
    aliases: ['simplify'],
    description:
      'Review changed code by effort level and report correctness bugs; pass --comment to post findings as GitHub PR inline comments · 按 effort 等级审查变更代码并报告正确性 bug，--comment 发为 GitHub PR 内联评论',
    userInvocable: true,
    async getPromptForCommand(args) {
      const parsed = parseCodeReviewArgs(args)
      return [{ type: 'text', text: buildPrompt(parsed) }]
    },
  })
}
