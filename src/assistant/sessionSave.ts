import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { getClaudeConfigHomeDir } from '../utils/envUtils.js'

export function saveSessionMemory(summary: string) {
  const dir = join(getClaudeConfigHomeDir(), 'sessions')
  mkdirSync(dir, { recursive: true })
  const file = join(dir, `${new Date().toISOString().slice(0, 10)}.md`)
  writeFileSync(file, `## ${new Date().toLocaleTimeString()}\n${summary}\n\n`, { flag: 'a' })
}
