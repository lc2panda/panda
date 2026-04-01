import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { getClaudeConfigHomeDir } from '../utils/envUtils.js'

export function loadRecentSessionMemory(): string | null {
  const dir = join(getClaudeConfigHomeDir(), 'sessions')
  const today = new Date().toISOString().slice(0, 10)
  const file = join(dir, `${today}.md`)

  if (!existsSync(file)) return null

  try {
    return readFileSync(file, 'utf-8')
  } catch {
    return null
  }
}
