import { getOriginalCwd } from '../../bootstrap/state.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerHealthCheckSkill(): void {
  registerBundledSkill({
    name: 'health-check',
    description:
      'Quick project health diagnosis — git status, dependency freshness, security hints, lint status · 快速项目健康诊断 — git 状态、依赖版本、安全提示、lint 状态',
    userInvocable: true,
    async getPromptForCommand(args) {
      const cwd = getOriginalCwd()
      let prompt = `# Project Health Check

Working directory: \`${cwd}\`

## 1. Git Status

- Run \`git status\` — report uncommitted changes, untracked files
- Run \`git log --oneline -5\` — recent activity
- Check if the branch is behind its remote: \`git rev-list --count HEAD..@{upstream} 2>/dev/null\`
- List stale branches (no commits in 30+ days): \`git for-each-ref --sort=-committerdate --format='%(refname:short) %(committerdate:relative)' refs/heads/\`

## 2. Dependencies

- If package.json exists, check for outdated packages: \`bun outdated 2>/dev/null || npm outdated 2>/dev/null\`
- Report any packages with major version bumps available
- Check for known vulnerabilities: \`bun audit 2>/dev/null || npm audit --json 2>/dev/null\`

## 3. Code Quality Signals

- Count TODO/FIXME/HACK comments: \`grep -rn 'TODO\\|FIXME\\|HACK' --include='*.ts' --include='*.tsx' --include='*.js' . | head -20\`
- If tsconfig.json exists, run \`bun tsc --noEmit 2>&1 | tail -5\` to check type errors (report count only)
- If .eslintrc or eslint config exists, note its presence

## 4. Summary Report

Present a health scorecard:
- Git: clean/dirty, up-to-date/behind
- Dependencies: all current / N outdated / N vulnerable
- Code quality: N TODOs, type check pass/fail

## Output

Present in concise Chinese (中文). Use a simple scorecard format. Flag critical issues with clear markers.`

      if (args.trim()) {
        prompt += `\n\n## Focus area\n\n${args.trim()}`
      }
      return [{ type: 'text', text: prompt }]
    },
  })
}
