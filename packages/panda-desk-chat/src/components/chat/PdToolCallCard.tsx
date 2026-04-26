// Input: toolName + input + result (panda flat: result/isError/status, OR cc-haha {content,isError}|null)
// Output: cc-haha 1:1 ToolCallBlock — collapsible card; header (icon + 11px label + mono filename + status); body (preview + details)
// Pos:    Chat layer — invoked by PdMessageList for every assistant tool_use turn
//
// Source 1:1: cc-haha desktop/src/components/chat/ToolCallBlock.tsx (L1-281)
//
// Notes:
// - Props 兼容 panda 现有 PdMessageList 调用（result: string + isError + status + defaultExpanded + forceCollapsed）
//   以及 cc-haha 原生接口（result: { content, isError } | null + compact）。
// - 当 forceCollapsed 为 true（panda summary 模式），呈现 cc-haha compact 视图（mb-0）。
// - 11 项 TOOL_ICONS 1:1（cc-haha L19-31）。
// - summary/preview/details 函数 1:1 cc-haha L228-280 + L111-187。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import { useMemo, useState } from 'react'
import { PdCodeViewer } from './PdCodeViewer'
import { PdDiffViewer } from './PdDiffViewer'
import { PdTerminalChrome } from './PdTerminalChrome'
import { PdCopyButton } from './PdCopyButton'
import { PdInlineImageGallery } from './PdInlineImageGallery'
import { t } from '../../i18n'

export type ToolCallStatus = 'pending' | 'running' | 'success' | 'error'

/** Panda flat-result shape (current PdMessageList caller). */
type FlatResultProps = {
  toolName: string
  input: unknown
  /** Plain-text result (already extracted). When non-null, treated as a successful result by default. */
  result?: string
  isError?: boolean
  /** Optional explicit status — when set, drives the leading icon. */
  status?: ToolCallStatus
  /** Default expand on render (panda transcriptMode === 'verbose'). */
  defaultExpanded?: boolean
  /** Force compact chip-style layout (panda transcriptMode === 'summary'). */
  forceCollapsed?: boolean
  agentTaskNotification?: unknown
  compact?: boolean
}

/** cc-haha original shape — kept for forward compat callers. */
type StructuredResultProps = {
  toolName: string
  input: unknown
  result?: { content: unknown; isError: boolean } | null
  defaultExpanded?: boolean
  forceCollapsed?: boolean
  agentTaskNotification?: unknown
  compact?: boolean
  /** When provided as object, the wrapper bridges into cc-haha behaviour. */
  status?: ToolCallStatus
  isError?: never
}

export type PdToolCallCardProps = FlatResultProps | StructuredResultProps

const TOOL_ICONS: Record<string, string> = {
  Bash: 'terminal',
  Read: 'description',
  Write: 'edit_document',
  Edit: 'edit_note',
  Glob: 'search',
  Grep: 'find_in_page',
  Agent: 'smart_toy',
  WebSearch: 'travel_explore',
  WebFetch: 'cloud_download',
  NotebookEdit: 'note',
  Skill: 'auto_awesome',
}

function normalizeResult(props: PdToolCallCardProps): { content: unknown; isError: boolean } | null {
  // Structured form (cc-haha): result is { content, isError } | null
  if ('result' in props && props.result !== undefined) {
    const r = props.result
    if (r && typeof r === 'object' && 'content' in r && 'isError' in r) {
      return r as { content: unknown; isError: boolean }
    }
    // Flat form: result is a plain string and isError lives on the props
    if (typeof r === 'string') {
      return { content: r, isError: !!(props as FlatResultProps).isError }
    }
  }
  return null
}

export function PdToolCallCard(props: PdToolCallCardProps) {
  const { toolName, input } = props
  const compact = ('compact' in props && props.compact) || ('forceCollapsed' in props && !!props.forceCollapsed)
  const initialExpanded = 'defaultExpanded' in props ? !!props.defaultExpanded : false

  const [expanded, setExpanded] = useState(initialExpanded)
  const obj = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const icon = TOOL_ICONS[toolName] || 'build'
  const filePath = typeof obj.file_path === 'string' ? obj.file_path : ''
  const summary = getToolSummary(toolName, obj)
  const result = normalizeResult(props)
  const outputSummary = getToolResultSummary(toolName, result?.content, result?.isError ?? false)

  const preview = useMemo(() => renderPreview(toolName, obj, result), [obj, result, toolName])
  const details = useMemo(() => renderDetails(toolName, obj), [obj, toolName])
  const hasResultDetails = Boolean(result && extractTextContent(result.content))
  const expandable = toolName === 'Edit' || toolName === 'Write' || hasResultDetails

  return (
    <div
      className={`overflow-hidden rounded-lg border border-[var(--pd-color-border)]/50 bg-[var(--pd-color-surface-container-lowest)] ${
        compact ? 'mb-0' : 'mb-2'
      }`}
    >
      <button
        type="button"
        onClick={() => {
          if (expandable) {
            setExpanded((value) => !value)
          }
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--pd-color-surface-hover)]/50"
      >
        <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-outline)]">{icon}</span>
        <span className="text-[11px] font-semibold text-[var(--pd-color-text-secondary)]">{toolName}</span>
        {filePath ? (
          <span className="min-w-0 flex-1 truncate font-[var(--pd-font-mono)] text-[11px] text-[var(--pd-color-text-tertiary)]">
            {filePath.split('/').pop()}
          </span>
        ) : summary ? (
          <span className="min-w-0 flex-1 truncate font-[var(--pd-font-mono)] text-[11px] text-[var(--pd-color-text-tertiary)]">
            {summary}
          </span>
        ) : (
          <span className="flex-1" />
        )}
        {result && outputSummary && (
          <span
            className={`shrink-0 text-[10px] ${
              result.isError ? 'text-[var(--pd-color-error)]' : 'text-[var(--pd-color-outline)]'
            }`}
          >
            {outputSummary}
          </span>
        )}
        {result?.isError && (
          <span className="material-symbols-outlined shrink-0 text-[14px] text-[var(--pd-color-error)]">error</span>
        )}
        {expandable && (
          <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-outline)]">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        )}
      </button>

      {expandable && expanded && (
        <div className="space-y-2.5 border-t border-[var(--pd-color-border)]/60 px-3 py-3">
          {preview}
          {details}
        </div>
      )}
    </div>
  )
}

function renderPreview(
  toolName: string,
  obj: Record<string, unknown>,
  result?: { content: unknown; isError: boolean } | null,
) {
  const filePath = typeof obj.file_path === 'string' ? obj.file_path : 'file'

  if (toolName === 'Edit' && typeof obj.old_string === 'string' && typeof obj.new_string === 'string') {
    return <PdDiffViewer filePath={filePath} oldString={obj.old_string} newString={obj.new_string} />
  }

  if (toolName === 'Write' && typeof obj.content === 'string') {
    return <PdDiffViewer filePath={filePath} oldString="" newString={obj.content} />
  }

  if (toolName === 'Bash' && typeof obj.command === 'string') {
    return (
      <PdTerminalChrome title={typeof obj.description === 'string' ? obj.description : filePath}>
        <div className="px-3 py-2.5 font-[var(--pd-font-mono)] text-[11px] leading-[1.3] text-[var(--pd-color-terminal-fg)]">
          <span className="text-[var(--pd-color-terminal-accent)]">$</span> {obj.command as string}
        </div>
      </PdTerminalChrome>
    )
  }

  if (toolName === 'Read') {
    return null
  }

  if (result) {
    const text = extractTextContent(result.content)
    if (text) {
      return (
        <>
          <PdInlineImageGallery text={text} />
          <div
            className={`overflow-hidden rounded-lg border ${
              result.isError
                ? 'border-[var(--pd-color-error)]/20 bg-[var(--pd-color-error-container)]/60'
                : 'border-[var(--pd-color-border)] bg-[var(--pd-color-surface)]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-[var(--pd-color-border)]/60 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[var(--pd-color-outline)]">
              <span>{result.isError ? (t('tool.errorOutput') || 'Error Output') : (t('tool.toolOutput') || 'Tool Output')}</span>
              <PdCopyButton
                text={text}
                className="rounded-md border border-[var(--pd-color-border)] px-2 py-1 text-[10px] normal-case tracking-normal text-[var(--pd-color-text-tertiary)] transition-colors hover:text-[var(--pd-color-text-primary)]"
              />
            </div>
            <PdCodeViewer code={text} language="plaintext" maxLines={18} />
          </div>
        </>
      )
    }
  }

  return null
}

function renderDetails(toolName: string, obj: Record<string, unknown>) {
  if (toolName === 'Edit' || toolName === 'Write') {
    return null
  }
  const text = JSON.stringify(obj, null, 2)
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--pd-color-border)] px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[var(--pd-color-outline)]">
        <span>{t('tool.toolInput') || 'Tool Input'}</span>
        <PdCopyButton
          text={text}
          className="rounded-md border border-[var(--pd-color-border)] px-2 py-1 text-[10px] normal-case tracking-normal text-[var(--pd-color-text-tertiary)] transition-colors hover:text-[var(--pd-color-text-primary)]"
        />
      </div>
      <PdCodeViewer code={text} language="json" maxLines={18} />
    </div>
  )
}

function getToolResultSummary(toolName: string, content: unknown, isError: boolean): string {
  const text = extractTextContent(content)
  if (!text) return ''

  if (isError) {
    const firstLine = text
      .split('\n')
      .map((line) => stripAnsi(line).replace(/\s+/g, ' ').trim())
      .find(Boolean)

    if (!firstLine) return t('tool.error') || 'Error'
    return firstLine.length <= 72 ? firstLine : `${firstLine.slice(0, 72)}…`
  }

  if (toolName === 'Bash') return ''

  const lineCount = text.split('\n').length
  if (lineCount > 1) {
    return t('tool.linesOutput', { count: lineCount }) || `${lineCount} lines output`
  }

  const compact = text.replace(/\s+/g, ' ').trim()
  if (!compact) return ''
  if (compact.length <= 36) return compact
  return `${compact.slice(0, 36)}…`
}

function stripAnsi(value: string): string {
  return value.replace(/\x1B\[[0-9;]*m/g, '')
}

function getToolSummary(toolName: string, obj: Record<string, unknown>): string {
  switch (toolName) {
    case 'Bash':
      return typeof obj.command === 'string' ? obj.command : ''
    case 'Read':
      return t('tool.readFileContents') || 'Read file contents'
    case 'Write':
      return typeof obj.content === 'string'
        ? (t('tool.linesCreated', { count: (obj.content as string).split('\n').length }) ||
            `${(obj.content as string).split('\n').length} lines created`)
        : (t('tool.createFile') || 'Create file')
    case 'Edit':
      return typeof obj.old_string === 'string' && typeof obj.new_string === 'string'
        ? changedLineSummary(obj.old_string, obj.new_string)
        : (t('tool.updateFileContents') || 'Update file contents')
    case 'Glob':
      return typeof obj.pattern === 'string' ? obj.pattern : ''
    case 'Grep':
      return typeof obj.pattern === 'string' ? obj.pattern : ''
    case 'Agent':
      return typeof obj.description === 'string' ? obj.description : ''
    default:
      return ''
  }
}

function extractTextContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((chunk: unknown) => {
        if (typeof chunk === 'string') return chunk
        if (chunk && typeof chunk === 'object' && 'text' in chunk) {
          return typeof (chunk as { text?: unknown }).text === 'string'
            ? ((chunk as { text: string }).text)
            : ''
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }
  if (content && typeof content === 'object') {
    return JSON.stringify(content, null, 2)
  }
  return ''
}

function changedLineSummary(oldString: string, newString: string): string {
  const oldLines = oldString.split('\n')
  const newLines = newString.split('\n')
  let changed = 0
  const max = Math.max(oldLines.length, newLines.length)

  for (let index = 0; index < max; index += 1) {
    if ((oldLines[index] ?? '') !== (newLines[index] ?? '')) {
      changed += 1
    }
  }

  return t('tool.linesChanged', { count: changed }) || `${changed} lines changed`
}

PdToolCallCard.displayName = 'PdToolCallCard'
