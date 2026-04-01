import { AGENT_TOOL_NAME } from '../../tools/AgentTool/constants.js'
import { registerBundledSkill } from '../bundledSkills.js'

const HUNTER_PROMPT = `# Bug Hunter

You are a systematic bug hunter. Your goal is to find real, verifiable bugs in the current codebase changes — not style issues, not hypothetical concerns, but actual defects that would cause incorrect behavior.

## Phase 1: Understand the Changes

Run \`git diff\` (or \`git diff HEAD\` if there are staged changes) to see what changed. If there are no git changes, ask the user what to review.

Identify:
- What the change is supposed to do
- What files were modified
- What the key logic changes are

## Phase 2: Hunt for Bugs

Launch multiple ${AGENT_TOOL_NAME} workers in parallel, each hunting for a different class of bug:

### Agent 1: Logic Bug Hunter
Look for:
- Off-by-one errors in loops, slices, and boundary conditions
- Incorrect boolean logic (flipped conditions, missing negations, wrong operators)
- Null/undefined access on paths that can reach the code
- Race conditions in async code (missing awaits, concurrent mutation)
- Type coercion issues that change behavior silently
- Error handling that swallows or misroutes errors

### Agent 2: Integration Bug Hunter
Look for:
- Callers of changed functions that pass arguments in the wrong order or type
- Changed return types or shapes that callers don't handle
- Broken assumptions — code that worked before the change but breaks now because an invariant shifted
- Missing updates to related code (e.g., changed a type but not its serializer)
- Import/export mismatches after renames or moves

### Agent 3: Edge Case Hunter
Look for:
- Empty input, missing input, or unexpected input types
- Concurrent access or re-entrant calls
- Large inputs that could cause performance degradation or OOM
- Unicode, special characters, or encoding issues in string handling
- Platform-specific behavior differences (OS, Node version, etc.)

## Phase 3: Verify and Report

Wait for all agents to complete. For each potential bug found:

1. **Verify it's real** — trace the code path to confirm the bug actually triggers. Hypothetical concerns without a concrete trigger path are not bugs.
2. **Assess severity** — would this cause data loss, crashes, incorrect results, or is it cosmetic?
3. **Provide a fix** if straightforward, or describe what the fix should do.

Discard false positives silently. Only report bugs you can demonstrate with a concrete code path.

### Report Format

For each verified bug:
- **Location**: file:line
- **Bug**: one-line description
- **Trigger**: how to make it happen
- **Severity**: critical / high / medium / low
- **Fix**: suggested fix or fix direction

If no bugs were found, say so — a clean review is a valid outcome.
`

export function registerHunterSkill(): void {
  registerBundledSkill({
    name: 'hunter',
    description:
      'Hunt for real bugs in your code changes using parallel analysis agents.',
    userInvocable: true,
    async getPromptForCommand(args) {
      let prompt = HUNTER_PROMPT
      if (args) {
        prompt += `\n## Additional Focus\n\n${args}`
      }
      return [{ type: 'text', text: prompt }]
    },
  })
}
