import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { jsonStringify } from '../../utils/slowOperations.js'

const REVIEW_ARTIFACT_TOOL_NAME = 'ReviewArtifact'

const inputSchema = lazySchema(() =>
  z.strictObject({
    artifact: z
      .string()
      .describe('The code artifact to review (diff, file content, or code snippet).'),
    context: z
      .string()
      .optional()
      .describe('Additional context about the artifact (e.g. purpose, related files, PR description).'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Output = {
  status: string
  summary: string
  issues: ReviewIssue[]
  suggestions: string[]
}

type ReviewIssue = {
  severity: 'error' | 'warning' | 'info'
  description: string
  location?: string
}

function analyzeArtifact(artifact: string, context?: string): Output {
  const lines = artifact.split('\n')
  const issues: ReviewIssue[] = []
  const suggestions: string[] = []

  // Detect common code issues
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const lineNum = i + 1

    // Detect TODO/FIXME/HACK comments
    if (/\b(TODO|FIXME|HACK|XXX)\b/i.test(line)) {
      issues.push({
        severity: 'warning',
        description: `Unresolved marker comment found`,
        location: `line ${lineNum}`,
      })
    }

    // Detect console.log / debugger statements
    if (/\bconsole\.(log|debug|warn|error)\b/.test(line) || /\bdebugger\b/.test(line)) {
      issues.push({
        severity: 'warning',
        description: `Debug statement detected — consider removing before merge`,
        location: `line ${lineNum}`,
      })
    }

    // Detect hardcoded secrets patterns
    if (/(?:password|secret|api_key|token)\s*[:=]\s*['"][^'"]+['"]/i.test(line)) {
      issues.push({
        severity: 'error',
        description: `Possible hardcoded secret or credential`,
        location: `line ${lineNum}`,
      })
    }

    // Detect very long lines
    if (line.length > 200) {
      issues.push({
        severity: 'info',
        description: `Line exceeds 200 characters (${line.length} chars)`,
        location: `line ${lineNum}`,
      })
    }
  }

  // Diff-specific analysis
  const isDiff = lines.some((l) => l.startsWith('+++') || l.startsWith('---') || l.startsWith('@@'))
  if (isDiff) {
    const addedLines = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++')).length
    const removedLines = lines.filter((l) => l.startsWith('-') && !l.startsWith('---')).length
    if (addedLines > 300) {
      suggestions.push(`Large changeset (${addedLines} additions, ${removedLines} deletions) — consider splitting into smaller PRs.`)
    }
    if (removedLines === 0 && addedLines > 50) {
      suggestions.push(`Addition-only diff with ${addedLines} lines — verify no dead code is being left behind.`)
    }
  }

  // General suggestions
  if (lines.length > 500) {
    suggestions.push(`Artifact is ${lines.length} lines — consider reviewing in smaller sections for thoroughness.`)
  }

  if (issues.length === 0) {
    suggestions.push('No obvious issues detected. Manual review for logic correctness and edge cases is still recommended.')
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length

  return {
    status: errorCount > 0 ? 'issues_found' : warningCount > 0 ? 'warnings' : 'clean',
    summary: `Review complete: ${errorCount} error(s), ${warningCount} warning(s), ${issues.length - errorCount - warningCount} info(s) across ${lines.length} lines.${context ? ` Context: ${context}` : ''}`,
    issues,
    suggestions,
  }
}

export const ReviewArtifactTool = buildTool({
  name: REVIEW_ARTIFACT_TOOL_NAME,
  searchHint: 'review code diff artifact audit check quality',
  maxResultSizeChars: 200_000,
  shouldDefer: true,

  get inputSchema(): InputSchema {
    return inputSchema()
  },

  toAutoClassifierInput(input) {
    return `review artifact ${input.artifact.slice(0, 200)}`
  },

  async description() {
    return 'Review a code artifact (diff, file, or snippet) and generate a structured review report.'
  },

  async prompt() {
    return `Review a code artifact and produce a structured report with issues and suggestions.

Pass the artifact content (a diff, file content, or code snippet) and optional context.
The tool performs static analysis for common issues including:
- Unresolved TODO/FIXME/HACK markers
- Debug statements (console.log, debugger)
- Possible hardcoded secrets
- Overly long lines
- Large changeset warnings

Returns a structured report with severity-tagged issues and actionable suggestions.`
  },

  mapToolResultToToolResultBlockParam(output, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content: jsonStringify(output),
    }
  },

  renderToolUseMessage() {
    return null
  },

  async call(input) {
    const { artifact, context } = input
    const result = analyzeArtifact(artifact, context)
    return {
      data: result,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
