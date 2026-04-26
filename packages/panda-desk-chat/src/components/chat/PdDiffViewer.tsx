// Input:  oldContent/newContent (strings) + fileName/filePath + optional language/hideHeader
// Output: cc-haha 1:1 DiffViewer card — header (path + +N/-N chips) + unified LCS diff body
// Pos:    Chat layer — used by FileRenderer / PdToolCallCard for Edit/Write file changes
//
// Source 1:1: cc-haha desktop/src/components/chat/DiffViewer.tsx (L1-157)
//
// Notes:
// - cc-haha 引入 react-diff-viewer-continued + prism-react-renderer 做行级高亮，
//   panda 没装这两个依赖。我们用 panda 自带的 LCS 计算（同一算法语义）+ 严格 cc-haha
//   className/border/chip/word-diff 占位，确保视觉对齐。语法高亮简化为单色文本，
//   待 react-diff-viewer-continued 装好后切换可见行级 token。
// - props 同时接受 `oldContent/newContent/fileName` (panda 现有 FileRenderer 调用)
//   与 cc-haha `oldString/newString/filePath`，对外暴露两套别名以无缝迁移。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import React, { useMemo } from 'react'
import { PdCopyButton } from './PdCopyButton'

export interface PdDiffViewerProps {
  /** New API (panda + cc-haha aligned) */
  oldContent?: string
  newContent?: string
  fileName?: string
  /** cc-haha original prop names — both accepted for back-compat */
  oldString?: string
  newString?: string
  filePath?: string
  /** Optional explicit language hint (otherwise inferred from path extension). */
  language?: string
  /** When true, hide top breadcrumb/copy bar (parent already provides one). */
  hideHeader?: boolean
  className?: string
}

type DiffLineKind = 'same' | 'add' | 'del'

interface DiffLine {
  kind: DiffLineKind
  text: string
  oldLineNo?: number
  newLineNo?: number
}

function inferLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
    py: 'python', rs: 'rust', go: 'go', rb: 'ruby',
    json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
    md: 'markdown', css: 'css', html: 'markup', xml: 'markup',
    sql: 'sql', sh: 'bash', bash: 'bash', zsh: 'bash',
  }
  return langMap[ext ?? ''] || 'text'
}

function computeUnifiedDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.length === 0 ? [] : oldText.split('\n')
  const newLines = newText.length === 0 ? [] : newText.split('\n')
  const m = oldLines.length
  const n = newLines.length

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        oldLines[i - 1] === newLines[j - 1]
          ? dp[i - 1]![j - 1]! + 1
          : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!)
    }
  }

  const result: DiffLine[] = []
  let i = m
  let j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({ kind: 'same', text: oldLines[i - 1]!, oldLineNo: i, newLineNo: j })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      result.push({ kind: 'add', text: newLines[j - 1]!, newLineNo: j })
      j--
    } else {
      result.push({ kind: 'del', text: oldLines[i - 1]!, oldLineNo: i })
      i--
    }
  }
  result.reverse()
  return result
}

export function PdDiffViewer({
  oldContent,
  newContent,
  fileName,
  oldString,
  newString,
  filePath,
  language,
  hideHeader = false,
  className,
}: PdDiffViewerProps) {
  const oldText = oldContent ?? oldString ?? ''
  const newText = newContent ?? newString ?? ''
  const path = fileName ?? filePath ?? ''
  const lang = language ?? inferLanguage(path)

  const diffLines = useMemo(() => computeUnifiedDiff(oldText, newText), [oldText, newText])

  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const additions = newLines.filter((l, i) => l !== (oldLines[i] ?? null)).length
  const deletions = oldLines.filter((l, i) => l !== (newLines[i] ?? null)).length

  return (
    <div
      className={`overflow-hidden rounded-[var(--pd-radius-lg)] border border-[var(--pd-color-outline-variant)]/50 bg-[var(--pd-color-surface-container-low)] ${className ?? ''}`}
    >
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-[var(--pd-color-outline-variant)]/40 bg-[var(--pd-color-surface-container)] px-3 py-1.5">
          <div className="min-w-0">
            <div className="truncate font-[var(--pd-font-mono)] text-[11px] text-[var(--pd-color-text-tertiary)]">
              {path}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em]">
              <span className="rounded-full bg-[var(--pd-color-diff-added-bg)] px-2 py-0.5 text-[var(--pd-color-diff-added-text)]">+{additions}</span>
              <span className="rounded-full bg-[var(--pd-color-diff-removed-bg)] px-2 py-0.5 text-[var(--pd-color-diff-removed-text)]">-{deletions}</span>
              <span className="ml-2 opacity-60">{lang}</span>
            </div>
          </div>
          <PdCopyButton
            text={`--- ${path}\n+++ ${path}`}
            label="Copy path"
            className="rounded-md border border-[var(--pd-color-outline-variant)]/40 bg-[var(--pd-color-surface-container-lowest)] px-2 py-1 text-[11px] text-[var(--pd-color-text-tertiary)] transition-colors hover:bg-[var(--pd-color-surface-container-high)] hover:text-[var(--pd-color-text-primary)]"
          />
        </div>
      )}

      {/* Diff body — unified, line-numbered, no syntax highlight (parity TODO) */}
      <div className="max-h-[400px] overflow-auto bg-[var(--pd-color-code-bg)]">
        <pre className="m-0 text-[12px] leading-[1.45] font-[var(--pd-font-mono)]">
          {diffLines.map((line, idx) => (
            <DiffLineRow key={idx} line={line} />
          ))}
          {diffLines.length === 0 && (
            <div className="px-3 py-2 text-[11px] text-[var(--pd-color-text-tertiary)]">
              No changes
            </div>
          )}
        </pre>
      </div>
    </div>
  )
}

function DiffLineRow({ line }: { line: DiffLine }) {
  let rowBg = ''
  let textColor = 'text-[var(--pd-color-code-fg)]'
  let prefix = ' '
  let prefixColor = 'text-[var(--pd-color-text-tertiary)] opacity-40'
  let gutterColor = 'text-[var(--pd-color-text-tertiary)] opacity-60'

  if (line.kind === 'add') {
    rowBg = 'bg-[var(--pd-color-diff-added-bg)]'
    textColor = 'text-[var(--pd-color-diff-added-text)]'
    prefix = '+'
    prefixColor = 'text-[var(--pd-color-diff-added-text)]'
    gutterColor = 'text-[var(--pd-color-diff-added-text)] opacity-80'
  } else if (line.kind === 'del') {
    rowBg = 'bg-[var(--pd-color-diff-removed-bg)]'
    textColor = 'text-[var(--pd-color-diff-removed-text)]'
    prefix = '-'
    prefixColor = 'text-[var(--pd-color-diff-removed-text)]'
    gutterColor = 'text-[var(--pd-color-diff-removed-text)] opacity-80'
  }

  return (
    <div className={`flex ${rowBg}`}>
      <span className={`inline-block w-[36px] pr-1.5 text-right select-none shrink-0 text-[10px] tabular-nums ${gutterColor}`}>
        {line.oldLineNo ?? ''}
      </span>
      <span className={`inline-block w-[36px] pr-1.5 text-right select-none shrink-0 text-[10px] tabular-nums border-r border-[var(--pd-color-outline-variant)]/30 ${gutterColor}`}>
        {line.newLineNo ?? ''}
      </span>
      <span className={`inline-block w-[18px] text-center select-none shrink-0 ${prefixColor}`}>
        {prefix}
      </span>
      <span className={`flex-1 whitespace-pre-wrap break-words pr-3 ${textColor}`}>
        {line.text || '\u00A0'}
      </span>
    </div>
  )
}

PdDiffViewer.displayName = 'PdDiffViewer'
