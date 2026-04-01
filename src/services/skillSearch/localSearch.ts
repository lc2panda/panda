import memoize from 'lodash-es/memoize.js'
import type { Command } from '../../types/command.js'
import { logForDebugging } from '../../utils/debug.js'

export type SkillIndexEntry = {
  name: string
  description: string
  command: Command
  keywords: string[]
}

export type SkillIndex = {
  entries: SkillIndexEntry[]
  lookup: Map<string, SkillIndexEntry>
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, '')
    .split(/[\s\-_]+/)
    .filter(t => t.length > 1)
}

function buildIndex(commands: Command[]): SkillIndex {
  const entries: SkillIndexEntry[] = []
  const lookup = new Map<string, SkillIndexEntry>()

  for (const cmd of commands) {
    if (cmd.type !== 'prompt') continue

    const keywords = [
      ...tokenize(cmd.name),
      ...tokenize(cmd.description),
      ...(cmd.whenToUse ? tokenize(cmd.whenToUse) : []),
    ]
    const uniqueKeywords = [...new Set(keywords)]

    const entry: SkillIndexEntry = {
      name: cmd.name,
      description: cmd.description,
      command: cmd,
      keywords: uniqueKeywords,
    }

    entries.push(entry)
    lookup.set(cmd.name, entry)
    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        lookup.set(alias, entry)
      }
    }
  }

  return { entries, lookup }
}

export const getSkillIndex = memoize(
  async (cwd: string): Promise<SkillIndex> => {
    try {
      const { getSkillToolCommands } = await import('../../commands.js')
      const commands = await getSkillToolCommands(cwd)
      return buildIndex(commands)
    } catch (err) {
      logForDebugging('Failed to build skill index', err)
      return { entries: [], lookup: new Map() }
    }
  },
)

export function searchSkills(
  index: SkillIndex,
  query: string,
  maxResults = 10,
): SkillIndexEntry[] {
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return []

  const scored = index.entries.map(entry => {
    let score = 0
    for (const qt of queryTokens) {
      if (entry.name.toLowerCase().includes(qt)) {
        score += 3
      }
      for (const kw of entry.keywords) {
        if (kw === qt) {
          score += 2
        } else if (kw.startsWith(qt) || qt.startsWith(kw)) {
          score += 1
        }
      }
    }
    return { entry, score }
  })

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.entry)
}

export function clearSkillIndexCache(): void {
  getSkillIndex.cache?.clear?.()
}
