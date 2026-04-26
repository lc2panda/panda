// Input: code string + optional language + optional pre-highlighted children + maxLines/showLineNumbers
// Output: cc-haha 1:1 CodeViewer card — header (LANG · N lines + Copy) + body + expand/collapse toggle
// Pos:    Chat layer — fenced code blocks (PdMarkdownRenderer) and tool input/output preview
//
// Source 1:1: cc-haha desktop/src/components/chat/CodeViewer.tsx (L1-183)
//
// Notes:
// - cc-haha CodeViewer 用 react-shiki 做语法高亮；panda 当前没装 react-shiki，
//   退而使用 panda 已有的 highlight.js 链路 + warm token CSS（参见 styles/highlight.css）
//   并保留 `children` prop 让 PdMarkdownRenderer 把已被 rehype-highlight 处理过的节点直接传入。
//   外观 chrome（header/border/expand toggle）与 cc-haha 字面 1:1。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import React, { useEffect, useMemo, useRef, useState } from 'react'
import hljs from 'highlight.js/lib/core'
import { PdCopyButton } from './PdCopyButton'

export interface PdCodeViewerProps {
  /** Raw code text (used for copy-to-clipboard + plain fallback render) */
  code: string
  /** Language label (e.g. 'ts', 'python') — undefined renders as 'text' */
  language?: string
  /** Pre-rendered (e.g. syntax-highlighted) children — when provided, used in place of plain code */
  children?: React.ReactNode
  /** className extracted from rehype-highlight (e.g. 'hljs language-ts') */
  codeClassName?: string
  /** Visible line threshold before showing expand/collapse toggle (cc-haha default 20) */
  maxLines?: number
  /** Whether to render gutter line numbers (currently unused — reserved for parity) */
  showLineNumbers?: boolean
  className?: string
}

const CODE_AREA_PADDING = '0.5rem 12px'
const CODE_LINE_HEIGHT = 1.3

/**
 * Fallback highlighter using highlight.js.  Renders a span tree we can drop
 * into the code body when the caller hasn't already provided pre-highlighted
 * children (e.g. CodeViewer used directly outside Markdown pipeline).
 */
function HighlightedCode({ code, language }: { code: string; language?: string }) {
  const [html, setHtml] = useState<string>(() => escapeHtml(code))

  useEffect(() => {
    let cancelled = false
    if (!language || language === 'text' || language === 'plaintext') {
      setHtml(escapeHtml(code))
      return
    }
    try {
      // highlight.js may not have the language loaded — fall back gracefully.
      const result = hljs.getLanguage(language)
        ? hljs.highlight(code, { language, ignoreIllegals: true })
        : hljs.highlightAuto(code)
      if (!cancelled) setHtml(result.value)
    } catch {
      if (!cancelled) setHtml(escapeHtml(code))
    }
    return () => {
      cancelled = true
    }
  }, [code, language])

  return (
    <code
      className={`hljs language-${language ?? 'text'}`}
      // SAFE: html is produced by highlight.js (token spans only) and we
      // escape the unmatched fallback path manually.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function CodeArea({
  code,
  children,
  language,
  codeClassName,
  showLineNumbers,
}: {
  code: string
  children?: React.ReactNode
  language?: string
  codeClassName?: string
  showLineNumbers: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      data-has-line-numbers={showLineNumbers ? 'true' : 'false'}
      className="code-viewer-area relative max-h-[420px] overflow-auto bg-[var(--pd-color-code-bg)]"
    >
      <pre
        style={{
          margin: 0,
          padding: CODE_AREA_PADDING,
          fontFamily: 'var(--pd-font-mono)',
          fontSize: '12px',
          lineHeight: String(CODE_LINE_HEIGHT),
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: 'var(--pd-color-code-fg)',
        }}
      >
        {children ? (
          <code className={codeClassName}>{children}</code>
        ) : (
          <HighlightedCode code={code} language={language} />
        )}
      </pre>
    </div>
  )
}

export function PdCodeViewer({
  code,
  language,
  children,
  codeClassName,
  maxLines = 20,
  showLineNumbers = false,
  className,
}: PdCodeViewerProps) {
  const [expanded, setExpanded] = useState(false)

  const allLines = useMemo(() => code.split('\n'), [code])
  const isTruncated = !expanded && allLines.length > maxLines
  const visibleCode = isTruncated ? allLines.slice(0, maxLines).join('\n') : code

  const effectiveShowLineNumbers = showLineNumbers && !!language && language !== 'text'
  const languageLabel = language || 'code'
  const lineCountLabel = `${allLines.length} ${allLines.length === 1 ? 'line' : 'lines'}`
  const showExpandToggle = allLines.length > maxLines

  return (
    <div
      className={`overflow-hidden rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-outline-variant)]/50 bg-[var(--pd-color-surface-container-low)] ${className ?? ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--pd-color-outline-variant)]/40 bg-[var(--pd-color-surface-container)] px-3 py-1.5 text-[11px] text-[var(--pd-color-text-tertiary)]">
        <div className="flex items-center gap-3">
          <span className="font-semibold uppercase tracking-[0.14em]">{languageLabel}</span>
          <span>{lineCountLabel}</span>
        </div>
        <PdCopyButton
          text={code}
          className="rounded-md border border-[var(--pd-color-outline-variant)]/40 bg-[var(--pd-color-surface-container-lowest)] px-2 py-1 text-[11px] text-[var(--pd-color-text-tertiary)] transition-colors hover:bg-[var(--pd-color-surface-container-high)] hover:text-[var(--pd-color-text-primary)]"
        />
      </div>

      {/* Code area — when truncated we render the sliced text plainly so the
          gutter line count matches; otherwise we forward pre-highlighted children. */}
      <CodeArea
        code={visibleCode}
        language={language}
        codeClassName={codeClassName}
        showLineNumbers={effectiveShowLineNumbers}
      >
        {!isTruncated ? children : null}
      </CodeArea>

      {/* Expand/collapse toggle */}
      {showExpandToggle && (
        <button
          onClick={() => setExpanded((value) => !value)}
          className="w-full border-t border-[var(--pd-color-outline-variant)]/40 bg-[var(--pd-color-surface-container)] py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pd-color-text-tertiary)] transition-colors hover:bg-[var(--pd-color-surface-container-high)] hover:text-[var(--pd-color-text-primary)]"
        >
          {expanded ? 'Collapse' : `Show ${allLines.length - maxLines} more lines`}
        </button>
      )}
    </div>
  )
}

PdCodeViewer.displayName = 'PdCodeViewer'
