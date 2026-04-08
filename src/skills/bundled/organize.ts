import { homedir } from 'os'
import { join } from 'path'
import { getOriginalCwd } from '../../bootstrap/state.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerOrganizeSkill(): void {
  registerBundledSkill({
    name: 'organize',
    description:
      'Analyze a directory structure and suggest cleanup · 分析目录结构并建议整理',
    argumentHint: '[path]',
    userInvocable: true,
    async getPromptForCommand(args) {
      const targetDir =
        args.trim() || getOriginalCwd() || join(homedir(), 'Downloads')
      const prompt = `# File Organization Analysis

Target directory: \`${targetDir}\`

## Phase 1 — Survey

- List the directory contents (non-recursive first, then key subdirectories)
- Categorize files by type: documents, images, code, archives, config, other
- Note file sizes — flag anything over 100MB

## Phase 2 — Identify Issues

- **Redundant files**: duplicate names, backup copies (*.bak, *-copy, *.old)
- **Orphaned files**: temp files, .DS_Store, Thumbs.db, *.swp, *~
- **Misplaced files**: files that don't belong in their current directory
- **Naming inconsistencies**: mixed conventions (camelCase vs snake_case, etc.)

## Phase 3 — Recommendations

For each issue found, suggest a concrete action:
- Move file X to directory Y
- Delete orphaned file Z
- Rename for consistency

## Safety Rules

- Do NOT execute any changes — this is analysis only
- Present findings as a report the user can review
- Group suggestions by priority (quick wins first)

## Output

Present in concise Chinese (中文). Use tables where helpful.`

      return [{ type: 'text', text: prompt }]
    },
  })
}
