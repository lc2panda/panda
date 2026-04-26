// Input: tool_result content (string | Anthropic content blocks), isError flag, optional toolName/standalone
// Output: cc-haha 1:1 ToolResultBlock — status header (uppercase tracking-wider) + ERROR/OK pill + 200-char preview + expand
// Pos:    Chat layer — renders standalone tool_result entries that are not folded into a tool_use card
//
// Source 1:1: cc-haha desktop/src/components/chat/ToolResultBlock.tsx (L1-108)
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import { useState } from 'react'
import { PdCodeViewer } from './PdCodeViewer'
import { PdInlineImageGallery } from './PdInlineImageGallery'
import { t } from '../../i18n'

export interface PdToolResultBlockProps {
  content: unknown
  isError: boolean
  toolName?: string
  /** When false this block suppresses itself (caller already rendered inline). cc-haha defaults true. */
  standalone?: boolean
  className?: string
}

/**
 * Standalone tool result block — only shown when not already rendered
 * inline within ToolCallBlock (i.e., when the tool_use and tool_result
 * are NOT grouped together by MessageList).
 */
export function PdToolResultBlock({ content, isError, toolName, standalone = true }: PdToolResultBlockProps) {
  const [expanded, setExpanded] = useState(false)

  // Don't render standalone if this result is already rendered inline
  if (!standalone) return null

  const text = extractText(content)
  const preview = text.slice(0, 200)
  const hasMore = text.length > 200

  return (
    <div className={`mb-2 overflow-hidden rounded-xl border ${
      isError
        ? 'border-[var(--pd-color-error)]/20'
        : 'border-[var(--pd-color-outline-variant)]/20'
    }`}>
      {/* Status header */}
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className={`flex w-full items-center justify-between px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider ${
          isError
            ? 'bg-[var(--pd-color-error-container)] text-[var(--pd-color-error)]'
            : 'bg-[var(--pd-color-surface-container-high)] text-[var(--pd-color-outline)]'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[12px]">
            {isError ? 'error' : 'check_circle'}
          </span>
          {toolName ? (t('tool.result', { toolName }) || `${toolName} result`) : (t('tool.resultGeneric') || 'Tool result')}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[9px] ${
          isError
            ? 'bg-[var(--pd-color-error)]/10'
            : 'bg-[var(--pd-color-diff-added-bg)] text-[var(--pd-color-diff-added-text)]'
        }`}>
          {isError ? (t('tool.error') || 'Error') : (t('tool.success') || 'Success')}
        </span>
      </button>

      {/* Inline image gallery from detected paths */}
      <PdInlineImageGallery text={text} />

      {/* Content */}
      {expanded ? (
        isError ? (
          <div className="bg-[var(--pd-color-error-container)]/50 px-3 py-2.5 font-[var(--pd-font-mono)] text-[11px] leading-[1.5] whitespace-pre-wrap break-words text-[var(--pd-color-error)]">
            {text}
          </div>
        ) : (
          <PdCodeViewer code={text} language="plaintext" maxLines={12} />
        )
      ) : (
        <div className="bg-[var(--pd-color-surface-container-lowest)] px-3 py-2 font-[var(--pd-font-mono)] text-[10px] leading-[1.35] text-[var(--pd-color-text-tertiary)]">
          {preview}
          {hasMore ? '…' : ''}
        </div>
      )}

      {hasMore && (
        <button
          onClick={() => setExpanded((value) => !value)}
          className="w-full py-1 text-[10px] font-medium text-[var(--pd-color-text-accent)] hover:underline bg-[var(--pd-color-surface-container-low)] border-t border-[var(--pd-color-outline-variant)]/10"
        >
          {expanded
            ? (t('tool.showLess') || 'Show less')
            : (t('tool.showMore', { count: text.length - 200 }) || `Show ${text.length - 200} more chars`)}
        </button>
      )}
    </div>
  )
}

function extractText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((c: unknown) => {
        if (typeof c === 'string') return c
        if (c && typeof c === 'object' && 'text' in c) {
          const block = c as { text?: unknown }
          return typeof block.text === 'string' ? block.text : ''
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }
  if (content && typeof content === 'object') {
    return JSON.stringify(content, null, 2)
  }
  return String(content ?? '')
}

PdToolResultBlock.displayName = 'PdToolResultBlock'
