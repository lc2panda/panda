import type { StructuredPatchHunk } from 'diff'
import { resolve } from 'path'
import React, { useEffect, useMemo, useState } from 'react'
import { useSettings } from '../../hooks/useSettings.js'
import { useTerminalSize } from '../../hooks/useTerminalSize.js'
import { Box, RawAnsi, Text, useInput, useTheme } from '../../ink.js'
import { getCwd } from '../../utils/cwd.js'
import { readFileSafe } from '../../utils/file.js'
import { Divider } from '../design-system/Divider.js'
import { renderHunkLines } from '../StructuredDiff.js'

type Props = {
  filePath: string
  hunks: StructuredPatchHunk[]
  isLargeFile?: boolean
  isBinary?: boolean
  isTruncated?: boolean
  isUntracked?: boolean
}

// Rows reserved for the DiffDialog title bar / border chrome plus this view's
// own filePath header and scroll-position footer. Keeps the rendered viewport
// from overflowing the terminal and pushing scrollback.
const RESERVED_ROWS = 8
const MIN_VIEWPORT = 3

/**
 * Displays the diff content for a single file with keyboard line-level
 * scrolling (↑/↓, j/k, PgUp/PgDn, Space, Home/End). All hunks are flattened
 * into a single list of rendered ANSI lines; only the lines inside the current
 * viewport window are rendered so long diffs never overflow the terminal.
 */
export function DiffDetailView({
  filePath,
  hunks,
  isLargeFile,
  isBinary,
  isTruncated,
  isUntracked,
}: Props) {
  const { columns, rows } = useTerminalSize()
  const [theme] = useTheme()
  const settings = useSettings()
  const syntaxHighlightingDisabled = settings.syntaxHighlightingDisabled ?? false

  const { firstLine, fileContent } = useMemo(() => {
    if (!filePath) return { firstLine: null as string | null, fileContent: undefined as string | undefined }
    const fullPath = resolve(getCwd(), filePath)
    const content = readFileSafe(fullPath)
    return {
      firstLine: content?.split('\n')[0] ?? null,
      fileContent: content ?? undefined,
    }
  }, [filePath])

  // Flatten every hunk into a single array of fully-styled ANSI lines so the
  // viewport can slice across hunk boundaries. Cheap: renderHunkLines is cached
  // per hunk inside StructuredDiff.
  const allLines = useMemo(() => {
    const width = Math.max(1, columns - 2 - 2)
    const out: string[] = []
    for (const hunk of hunks) {
      const lines = renderHunkLines(
        hunk,
        firstLine,
        filePath,
        fileContent ?? null,
        theme,
        width,
        false,
        syntaxHighlightingDisabled,
      )
      out.push(...lines)
    }
    return out
  }, [hunks, firstLine, filePath, fileContent, theme, columns, syntaxHighlightingDisabled])

  const viewportHeight = Math.max(MIN_VIEWPORT, rows - RESERVED_ROWS)
  const totalLines = allLines.length
  const maxOffset = Math.max(0, totalLines - viewportHeight)

  const [scrollOffset, setScrollOffset] = useState(0)

  // Clamp when the diff/viewport changes (e.g. switching files, terminal
  // resize) so the offset never points past the end.
  useEffect(() => {
    setScrollOffset(prev => clampOffset(prev, maxOffset))
  }, [maxOffset])

  const renderable = !isUntracked && !isBinary && !isLargeFile && totalLines > 0
  const canScroll = renderable && totalLines > viewportHeight

  useInput(
    (input, key) => {
      if (input === 'j' || key.downArrow) {
        setScrollOffset(prev => clampOffset(prev + 1, maxOffset))
        return
      }
      if (input === 'k' || key.upArrow) {
        setScrollOffset(prev => clampOffset(prev - 1, maxOffset))
        return
      }
      if (key.pageDown || input === ' ') {
        setScrollOffset(prev => clampOffset(prev + viewportHeight, maxOffset))
        return
      }
      if (key.pageUp) {
        setScrollOffset(prev => clampOffset(prev - viewportHeight, maxOffset))
        return
      }
      if (key.home || input === 'g') {
        setScrollOffset(0)
        return
      }
      if (key.end || input === 'G') {
        setScrollOffset(maxOffset)
        return
      }
      // Intentionally do NOT handle left/escape here — those are owned by
      // DiffDialog's keybindings (back / dismiss) so detail-view exit keeps
      // working.
    },
    { isActive: renderable },
  )

  if (isUntracked) {
    return (
      <Box flexDirection="column" width="100%">
        <Box>
          <Text bold>{filePath}</Text>
          <Text dimColor> (untracked)</Text>
        </Box>
        <Divider padding={4} />
        <Box flexDirection="column">
          <Text dimColor italic>
            New file not yet staged.
          </Text>
          <Text dimColor italic>
            Run `git add {filePath}` to see line counts.
          </Text>
        </Box>
      </Box>
    )
  }

  if (isBinary) {
    return (
      <Box flexDirection="column" width="100%">
        <Box>
          <Text bold>{filePath}</Text>
        </Box>
        <Divider padding={4} />
        <Box flexDirection="column">
          <Text dimColor italic>
            Binary file - cannot display diff
          </Text>
        </Box>
      </Box>
    )
  }

  if (isLargeFile) {
    return (
      <Box flexDirection="column" width="100%">
        <Box>
          <Text bold>{filePath}</Text>
        </Box>
        <Divider padding={4} />
        <Box flexDirection="column">
          <Text dimColor italic>
            Large file - diff exceeds 1 MB limit
          </Text>
        </Box>
      </Box>
    )
  }

  const visibleLines = allLines.slice(scrollOffset, scrollOffset + viewportHeight)
  const firstVisible = totalLines === 0 ? 0 : scrollOffset + 1
  const lastVisible = Math.min(scrollOffset + viewportHeight, totalLines)

  return (
    <Box flexDirection="column" width="100%">
      <Box>
        <Text bold>{filePath}</Text>
      </Box>
      <Box flexDirection="column">
        {totalLines === 0 ? (
          <Text dimColor>No diff content</Text>
        ) : (
          <RawAnsi lines={visibleLines} width={Math.max(1, columns - 2 - 2)} />
        )}
      </Box>
      {isTruncated && (
        <Text dimColor italic>
          … diff truncated (exceeded 400 line limit)
        </Text>
      )}
      {totalLines > 0 && (
        <Text dimColor>
          {canScroll
            ? `[行 ${firstVisible}-${lastVisible} / 共 ${totalLines}]  ↑↓/jk 滚动 · PgUp/PgDn/Space 翻页 · Home/End 首尾 · ← 返回`
            : `[共 ${totalLines} 行]  ← 返回`}
        </Text>
      )}
    </Box>
  )
}

export function clampOffset(value: number, maxOffset: number): number {
  if (value < 0) return 0
  if (value > maxOffset) return maxOffset
  return value
}
