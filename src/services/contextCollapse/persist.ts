// Input: Session storage entries (marble-origami-commit / marble-origami-snapshot).
// Output: Restored collapse state from entries.
// Pos: Persistence layer for contextCollapse — called during /resume.

import type { Message } from '../../types/message.js'
import {
  getCommittedCollapses,
  resetCollapseState,
  type CommittedCollapse,
} from './operations.js'

interface CommitEntry {
  collapseId: string
  summaryUuid: string
  summaryContent: string
  summary: string
  firstArchivedUuid: string
  lastArchivedUuid: string
}

interface SnapshotEntry {
  staged: Array<{
    startUuid: string
    endUuid: string
    summary: string
    risk: number
    stagedAt: number
  }>
  armed: boolean
  lastSpawnTokens: number
}

// 暂存快照（用于 getStats）
let lastSnapshot: SnapshotEntry | null = null

export function getLastSnapshot(): SnapshotEntry | null {
  return lastSnapshot
}

/**
 * 从 sessionStorage 的条目恢复折叠状态。
 * 在 /resume 时调用。
 */
export const restoreFromEntries: (
  commits: CommitEntry[] | unknown[],
  snapshot?: SnapshotEntry | unknown,
) => void = (commits, snapshot) => {
  // 先重置
  resetCollapseState()
  lastSnapshot = null

  // 恢复 committed collapses
  if (Array.isArray(commits)) {
    for (const entry of commits) {
      const e = entry as CommitEntry
      if (!e.collapseId || !e.firstArchivedUuid) continue

      // 重建 CommittedCollapse（简化版，archivedUuids 只保留首尾）
      const placeholder: Message = {
        type: 'assistant' as const,
        uuid: (e.summaryUuid || `collapse-${e.collapseId}`) as any,
        isMeta: true,
        message: {
          role: 'assistant',
          content: [
            {
              type: 'text' as const,
              text: e.summaryContent || `<collapsed id="${e.collapseId}">\n${e.summary}\n</collapsed>`,
            } as any,
          ],
        },
      }

      // 注入到 operations 的 committedCollapses 中
      const collapses = getCommittedCollapses() as CommittedCollapse[]
      collapses.push({
        collapseId: e.collapseId,
        span: {
          startIdx: 0,
          endIdx: 0,
          startUuid: e.firstArchivedUuid,
          endUuid: e.lastArchivedUuid,
          messageCount: 0,
          tokenEstimate: 0,
          risk: 0,
          summary: e.summary,
        },
        archivedUuids: [e.firstArchivedUuid, e.lastArchivedUuid],
        summaryPlaceholder: placeholder,
      })
    }
  }

  // 恢复快照
  if (snapshot && typeof snapshot === 'object') {
    lastSnapshot = snapshot as SnapshotEntry
  }
}
