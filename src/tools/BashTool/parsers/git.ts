// Input: git 命令 + stdout/stderr 输出
// Output: 结构化解析结果 (ParsedOutput)
// Pos: BashTool/parsers/ git 命令输出解析器
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import type { ParsedOutput } from './index.js'

// ---------------------------------------------------------------------------
// git status
// ---------------------------------------------------------------------------

function parseGitStatus(stdout: string): ParsedOutput | null {
  const lines = stdout.split('\n')
  let branch = ''
  const staged: string[] = []
  const modified: string[] = []
  const untracked: string[] = []
  const errors: string[] = []
  let section = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('On branch ')) {
      branch = trimmed.replace('On branch ', '')
    } else if (trimmed.startsWith('HEAD detached')) {
      branch = trimmed
    } else if (trimmed.startsWith('Changes to be committed:')) {
      section = 'staged'
    } else if (trimmed.startsWith('Changes not staged')) {
      section = 'modified'
    } else if (trimmed.startsWith('Untracked files:')) {
      section = 'untracked'
    } else if (trimmed.startsWith('Unmerged paths:')) {
      section = 'unmerged'
    } else if (/^\s+(modified|new file|deleted|renamed|copied|both modified):/.test(line)) {
      const entry = trimmed
      if (section === 'staged') staged.push(entry)
      else if (section === 'modified') modified.push(entry)
    } else if (/^\t\S/.test(line) && section === 'untracked') {
      untracked.push(trimmed)
    }
  }

  const stats: Record<string, number> = {
    staged: staged.length,
    modified: modified.length,
    untracked: untracked.length,
  }

  const details: string[] = []
  if (branch) details.push(`branch: ${branch}`)
  if (staged.length) details.push(...staged.slice(0, 10))
  if (modified.length) details.push(...modified.slice(0, 10))
  if (untracked.length > 5) {
    details.push(...untracked.slice(0, 5))
    details.push(`... (${untracked.length - 5} more untracked)`)
  } else {
    details.push(...untracked)
  }

  const summary = `branch: ${branch || 'unknown'}, ${staged.length} staged, ${modified.length} modified, ${untracked.length} untracked`

  return { summary, details, errors, warnings: [], stats }
}

// ---------------------------------------------------------------------------
// git diff --stat
// ---------------------------------------------------------------------------

function parseGitDiffStat(stdout: string): ParsedOutput | null {
  const lines = stdout.split('\n').filter(l => l.trim())
  if (lines.length === 0) return null

  const fileChanges: string[] = []
  let totalInsertions = 0
  let totalDeletions = 0

  for (const line of lines) {
    // Final summary line: "N files changed, N insertions(+), N deletions(-)"
    const summaryMatch = line.match(/(\d+)\s+files?\s+changed/)
    if (summaryMatch) {
      const insMatch = line.match(/(\d+)\s+insertions?/)
      const delMatch = line.match(/(\d+)\s+deletions?/)
      if (insMatch) totalInsertions = parseInt(insMatch[1], 10)
      if (delMatch) totalDeletions = parseInt(delMatch[1], 10)
      continue
    }
    // Per-file lines: " path | N +++---"
    const fileMatch = line.match(/^\s*(.+?)\s*\|\s*(\d+)/)
    if (fileMatch) {
      fileChanges.push(fileMatch[1].trim())
    }
  }

  return {
    summary: `${fileChanges.length} files changed, +${totalInsertions} -${totalDeletions}`,
    details: fileChanges.slice(0, 20),
    errors: [],
    warnings: [],
    stats: {
      filesChanged: fileChanges.length,
      insertions: totalInsertions,
      deletions: totalDeletions,
    },
  }
}

// ---------------------------------------------------------------------------
// git log --oneline
// ---------------------------------------------------------------------------

function parseGitLogOneline(stdout: string): ParsedOutput | null {
  const lines = stdout.split('\n').filter(l => l.trim())
  if (lines.length === 0) return null

  const commits = lines.map(l => {
    const match = l.match(/^([0-9a-f]+)\s+(.*)/)
    return match ? { hash: match[1], message: match[2] } : null
  }).filter(Boolean)

  return {
    summary: `${commits.length} commits`,
    details: lines.slice(0, 15),
    errors: [],
    warnings: [],
    stats: { commits: commits.length },
  }
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export function parseGitOutput(
  command: string,
  stdout: string,
  _stderr: string,
): ParsedOutput | null {
  if (/\bstatus\b/.test(command)) {
    return parseGitStatus(stdout)
  }
  if (/\bdiff\b/.test(command) && /--stat/.test(command)) {
    return parseGitDiffStat(stdout)
  }
  if (/\blog\b/.test(command) && /--oneline/.test(command)) {
    return parseGitLogOneline(stdout)
  }
  return null
}
