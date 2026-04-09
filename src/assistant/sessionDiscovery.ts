// Input: ~/.pandacc/assistant/ directory containing session JSON files
// Output: AssistantSession[] sorted by date descending, max 20
// Pos: assistant layer — consumed by session history UI and assistant hooks
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

export type AssistantSession = {
  id: string
  date: string
  summary: string
  filePath: string
  [key: string]: unknown
}

const SESSIONS_DIR = join(homedir(), '.pandacc', 'assistant')
const MAX_SESSIONS = 20
const SUMMARY_MAX_LENGTH = 50

export async function discoverAssistantSessions(): Promise<AssistantSession[]> {
  try {
    const files = readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'))
    const sessions: AssistantSession[] = []

    for (const file of files) {
      try {
        const filePath = join(SESSIONS_DIR, file)
        const stat = statSync(filePath)
        const raw = readFileSync(filePath, 'utf-8')
        const data = JSON.parse(raw)

        sessions.push({
          id: data.id ?? file.replace(/\.json$/, ''),
          date: data.date ?? stat.mtime.toISOString(),
          summary: typeof data.summary === 'string'
            ? data.summary.slice(0, SUMMARY_MAX_LENGTH)
            : typeof data.title === 'string'
              ? data.title.slice(0, SUMMARY_MAX_LENGTH)
              : '',
          filePath,
          ...data,
        })
      } catch {
        // Skip unreadable/invalid session files
      }
    }

    // Sort by date descending, return at most MAX_SESSIONS
    sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return sessions.slice(0, MAX_SESSIONS)
  } catch {
    // Directory doesn't exist or is unreadable
    return []
  }
}
