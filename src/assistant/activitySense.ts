import { execSync } from 'child_process'

export function getActivitySense() {
  let gitBranch = ''
  let hasUncommitted = false

  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
      timeout: 3000,
    }).trim()
    const status = execSync('git status --porcelain', {
      encoding: 'utf-8',
      timeout: 3000,
    }).trim()
    hasUncommitted = status.length > 0
  } catch {}

  return { gitBranch, hasUncommitted, cwd: process.cwd() }
}
