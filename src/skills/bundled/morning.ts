import { getAutoMemPath } from '../../memdir/paths.js'
import { getOriginalCwd } from '../../bootstrap/state.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerMorningSkill(): void {
  registerBundledSkill({
    name: 'morning',
    description:
      'Generate a morning briefing — yesterday summary, open TODOs, today priorities, project status.',
    userInvocable: true,
    async getPromptForCommand(args) {
      const memoryDir = getAutoMemPath()
      const cwd = getOriginalCwd()
      let prompt = `# Morning Briefing

Memory directory: \`${memoryDir}\`
Working directory: \`${cwd}\`

## Phase 1 — Yesterday's Work

- Read recent memory files in \`${memoryDir}\` (ls, then skim the most recently modified files)
- Summarize what was accomplished yesterday or in the most recent session
- Note any decisions made or issues encountered

## Phase 2 — Open Items

- Check for TODO.md or similar task files in the project root
- Run \`git status\` to see uncommitted changes
- Run \`git log --oneline -10\` to see recent commits
- Check for any open branches with \`git branch\`
- Identify anything left incomplete

## Phase 3 — Today's Priorities

Based on the above, suggest a prioritized list of tasks for today:
1. Urgent / blocking items first
2. In-progress work that should be finished
3. New work that could be started

## Phase 4 — Project Status

- Brief git status summary (branch, clean/dirty, ahead/behind)
- Any stale branches or old PRs worth cleaning up

## Output

Present everything in concise Chinese (中文). Keep it under 25 lines. Use bullet points. Highlight the top 3 priorities clearly.`

      if (args.trim()) {
        prompt += `\n\n## Additional context\n\n${args.trim()}`
      }
      return [{ type: 'text', text: prompt }]
    },
  })
}
