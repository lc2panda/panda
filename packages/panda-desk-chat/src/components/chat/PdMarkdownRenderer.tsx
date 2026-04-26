// Input: raw markdown string from assistant (GFM + fenced code blocks + mermaid + tables)
// Output: cc-haha 1:1 prose tree — typography, syntax-highlighted code, mermaid diagrams, full-width tables
// Pos:    Chat layer — replaces raw text display in PdMessageBubble & related views
//
// Source 1:1: cc-haha desktop/src/components/markdown/MarkdownRenderer.tsx (L1-229)
//
// Notes:
// - cc-haha 用 marked + DOMPurify 走 string→html 路径；panda 已有 react-markdown +
//   remark-gfm + rehype-highlight 走 AST→ReactNode 路径，更安全（不需要 dangerouslySetInnerHTML）。
//   className/prose- token 严格按 cc-haha 的 BASE_PROSE_CLASSES + DOCUMENT_PROSE_CLASSES。
// - 代码块/Mermaid 通过 `pre` component override 转交给 PdCodeViewer / PdMermaidRenderer，
//   与 cc-haha 行为完全一致。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import React, { useCallback, useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { PdCodeViewer } from './PdCodeViewer'
import { PdMermaidRenderer } from './PdMermaidRenderer'

export interface PdMarkdownRendererProps {
  content: string
  /** Optional density — `document` lifts headings + spacing for long-form pages */
  variant?: 'default' | 'document'
  className?: string
}

const MERMAID_LANGUAGE = 'mermaid'
const PLAINTEXT_LANGUAGES = new Set(['', 'text', 'plaintext', 'plain'])
const MERMAID_DIAGRAM_START =
  /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|requirementDiagram|quadrantChart|xychart-beta|sankey-beta|block-beta|packet-beta|architecture|kanban)\b/i

function extractLanguage(className?: string): string | null {
  if (!className) return null
  const match = className.match(/language-(\w+)/)
  return match ? match[1] ?? null : null
}

function looksLikeMermaid(code: string): boolean {
  const firstMeaningfulLine = code
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)
  return firstMeaningfulLine ? MERMAID_DIAGRAM_START.test(firstMeaningfulLine) : false
}

function shouldRenderAsMermaid(language: string | null, code: string): boolean {
  const norm = language?.trim().toLowerCase() ?? ''
  if (norm === MERMAID_LANGUAGE) return true
  if (!PLAINTEXT_LANGUAGES.has(norm)) return false
  return looksLikeMermaid(code)
}

function extractTextContent(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (node == null || typeof node === 'boolean') return ''
  if (Array.isArray(node)) return node.map(extractTextContent).join('')
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode }
    return extractTextContent(props.children)
  }
  return ''
}

/* ── cc-haha BASE_PROSE_CLASSES (字面 1:1) ──────────────────────────────── */

const BASE_PROSE_CLASSES = `markdown-prose prose prose-sm max-w-none text-[var(--pd-color-text-primary)]
  prose-headings:text-[var(--pd-color-text-primary)] prose-headings:font-semibold
  prose-p:my-2 prose-p:leading-relaxed
  prose-p:break-words
  prose-code:text-[13px] prose-code:text-[var(--pd-color-code-fg)] prose-code:font-[var(--pd-font-mono)] prose-code:bg-[var(--pd-color-code-bg)] prose-code:border prose-code:border-[var(--pd-color-border)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:hidden prose-code:after:hidden
  prose-pre:!bg-transparent prose-pre:!p-0 prose-pre:!shadow-none
  prose-a:text-[var(--pd-color-text-accent)] prose-a:no-underline hover:prose-a:underline
  prose-strong:text-[var(--pd-color-text-primary)]
  prose-ul:my-2 prose-ol:my-2
  prose-li:my-0.5
  prose-table:my-0 prose-table:w-full prose-table:table-auto prose-table:text-sm
  prose-th:bg-[var(--pd-color-surface-info)] prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:whitespace-normal prose-th:break-words prose-th:align-top prose-th:border-b prose-th:border-[var(--pd-color-border)]
  prose-td:px-3 prose-td:py-2 prose-td:border-b prose-td:border-[var(--pd-color-border)] prose-td:whitespace-normal prose-td:break-words prose-td:align-top prose-td:bg-[var(--pd-color-surface)]
  [&_.md-table-wrap]:my-5 [&_.md-table-wrap]:overflow-x-auto [&_.md-table-wrap]:rounded-xl [&_.md-table-wrap]:border [&_.md-table-wrap]:border-[var(--pd-color-border)] [&_.md-table-wrap]:bg-[var(--pd-color-surface-container-lowest)]`

const DOCUMENT_PROSE_CLASSES = `
  prose-p:text-[15px] prose-p:leading-7
  prose-headings:scroll-mt-6 prose-headings:tracking-[-0.01em]
  prose-h1:mb-4 prose-h1:text-2xl prose-h1:font-semibold prose-h1:leading-tight
  prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-[var(--pd-color-border)] prose-h2:pb-2 prose-h2:text-xl prose-h2:font-semibold
  prose-h3:mt-6 prose-h3:mb-2 prose-h3:text-base prose-h3:font-semibold
  prose-h4:mt-5 prose-h4:mb-2 prose-h4:text-sm prose-h4:font-semibold
  prose-blockquote:my-4 prose-blockquote:rounded-r-lg prose-blockquote:border-l-4 prose-blockquote:border-[var(--pd-color-outline-variant)] prose-blockquote:bg-[var(--pd-color-surface-container-low)] prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:italic
  prose-hr:my-6 prose-hr:border-[var(--pd-color-border)]
  prose-img:rounded-lg prose-img:border prose-img:border-[var(--pd-color-border)]
  prose-kbd:rounded prose-kbd:border prose-kbd:border-[var(--pd-color-border)] prose-kbd:bg-[var(--pd-color-surface-container-lowest)] prose-kbd:px-1.5 prose-kbd:py-0.5 prose-kbd:font-[var(--pd-font-mono)] prose-kbd:text-[12px] prose-kbd:font-normal prose-kbd:text-[var(--pd-color-text-secondary)] prose-kbd:shadow-none
  prose-ul:pl-5 prose-ul:[&>li]:marker:text-[var(--pd-color-text-tertiary)]
  prose-ol:pl-5 prose-ol:[&>li]:marker:text-[var(--pd-color-text-tertiary)]
  prose-li:my-1.5
  prose-table:my-0`

function getProseClasses(variant: 'default' | 'document', className?: string) {
  return [BASE_PROSE_CLASSES, variant === 'document' ? DOCUMENT_PROSE_CLASSES : '', className ?? '']
    .filter(Boolean)
    .join(' ')
}

const remarkPlugins = [remarkGfm]
const rehypePlugins = [rehypeHighlight]

function useMarkdownComponents(): Components {
  return useMemo<Components>(
    () => ({
      pre({ children }) {
        let language: string | null = null
        let codeText = ''
        let codeChildren: React.ReactNode = null
        let codeClassName: string | undefined

        React.Children.forEach(children, (child) => {
          if (React.isValidElement(child) && child.type === 'code') {
            const codeProps = child.props as { className?: string; children?: React.ReactNode }
            language = extractLanguage(codeProps.className)
            codeText = extractTextContent(codeProps.children)
            codeChildren = codeProps.children
            codeClassName = codeProps.className
          }
        })

        if (shouldRenderAsMermaid(language, codeText)) {
          return <PdMermaidRenderer code={codeText} />
        }

        return (
          <div className="my-4">
            <PdCodeViewer
              code={codeText}
              language={language ?? undefined}
              codeClassName={codeClassName}
            >
              {codeChildren}
            </PdCodeViewer>
          </div>
        )
      },

      code({ className, children, ...props }) {
        const language = extractLanguage(className)
        if (language || className?.includes('hljs')) {
          // inside <pre>; keep raw <code> + highlight token classes
          return (
            <code className={className} {...props}>
              {children}
            </code>
          )
        }
        // inline code — cc-haha BASE_PROSE_CLASSES already styles via prose-code
        return (
          <code className={className} {...props}>
            {children}
          </code>
        )
      },

      // Wrap tables for cc-haha [&_.md-table-wrap] selectors
      table({ children, ...props }) {
        return (
          <div className="md-table-wrap">
            <table {...props}>{children}</table>
          </div>
        )
      },

      // External-link safety
      a({ href, children, ...props }) {
        return (
          <a href={href} target="_blank" rel="noreferrer noopener" {...props}>
            {children}
          </a>
        )
      },
    }),
    [],
  )
}

export function PdMarkdownRenderer({ content, variant = 'default', className }: PdMarkdownRendererProps) {
  const components = useMarkdownComponents()
  const proseClasses = useMemo(() => getProseClasses(variant, className), [variant, className])

  const handleClick = useCallback(async (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    const button = target?.closest<HTMLButtonElement>('[data-copy-code]')
    if (!button) return
    const text = button.getAttribute('data-copy-code')
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      const original = button.textContent
      button.textContent = 'Copied'
      window.setTimeout(() => {
        button.textContent = original
      }, 1500)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <div className={proseClasses} onClick={handleClick}>
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

PdMarkdownRenderer.displayName = 'PdMarkdownRenderer'
