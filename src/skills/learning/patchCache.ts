// Input: SkillPatch records to append / read / clear / retrieve / prune
// Output: persisted JSON cache under ~/.pandacc/data/skill-patches.json
// Pos: src/skills/learning/patchCache.ts — stage 4 of Hermes four-stage loop

import { join } from 'path'
import { homedir } from 'os'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import type { SkillPatch } from './types.js'

const CACHE_DIR = join(homedir(), '.pandacc', 'data')
const CACHE_PATH = join(CACHE_DIR, 'skill-patches.json')
const MAX_PATCHES = 200
const DECAY_MS = 30 * 86400000 // 30 days
const PER_SKILL_SOFT_LIMIT = 20
const PER_SKILL_KEEP = 10

interface PatchCacheData {
  patches: SkillPatch[]
  updatedAt: number
}

function loadCache(): PatchCacheData {
  // 完整性校验：损坏 JSON 自动备份为 .broken-<ts>，回退到空 cache
  try {
    const { checkAndRecoverJSON } = require('../../memdir/sqliteIntegrity.js')
    checkAndRecoverJSON(CACHE_PATH)
  } catch {}
  try {
    if (!existsSync(CACHE_PATH)) return { patches: [], updatedAt: 0 }
    const raw = readFileSync(CACHE_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as PatchCacheData
    if (!parsed || !Array.isArray(parsed.patches)) {
      return { patches: [], updatedAt: 0 }
    }
    return parsed
  } catch {
    return { patches: [], updatedAt: 0 }
  }
}

function saveCache(data: PatchCacheData): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch {
    // best-effort; learning cache must never break main flow
  }
}

/**
 * Append a patch to the cache.
 * - Dedup: identical skillName + content is not re-added.
 * - Decay: patches older than 30 days are auto-pruned on every write.
 * - Hard cap: total patches capped at MAX_PATCHES (oldest trimmed).
 */
export function appendPatch(patch: SkillPatch): void {
  const data = loadCache()

  // Dedup: skip if an identical patch already exists for this skill
  const exists = data.patches.some(
    p => p.skillName === patch.skillName && p.content === patch.content,
  )
  if (exists) return

  // Decay: drop anything older than DECAY_MS
  const cutoff = Date.now() - DECAY_MS
  data.patches = data.patches.filter(p => p.appliedAt > cutoff)

  data.patches.push(patch)
  if (data.patches.length > MAX_PATCHES) {
    data.patches = data.patches.slice(-MAX_PATCHES)
  }
  data.updatedAt = Date.now()
  saveCache(data)
}

export function getPatchesForSkill(skillName: string): SkillPatch[] {
  const data = loadCache()
  return data.patches.filter(p => p.skillName === skillName)
}

export function clearPatches(): void {
  saveCache({ patches: [], updatedAt: Date.now() })
}

/**
 * Retrieve the most recent, deduplicated patches for a skill, formatted
 * for inline injection into a system prompt. Returns '' when no patches.
 */
export function retrievePatchesForPrompt(
  skillName: string,
  n: number = 5,
): string {
  const patches = getPatchesForSkill(skillName)
    .slice()
    .sort((a, b) => b.appliedAt - a.appliedAt)

  if (patches.length === 0) return ''

  const seen = new Set<string>()
  const unique: SkillPatch[] = []
  for (const p of patches) {
    if (seen.has(p.content)) continue
    seen.add(p.content)
    unique.push(p)
    if (unique.length >= n) break
  }

  if (unique.length === 0) return ''
  const lines = unique.map(p => `- ${p.content}`)
  return `\n## 历史改进信号（来自上次执行）\n${lines.join('\n')}\n`
}

/**
 * Prune cache by per-skill heat: skills with more than PER_SKILL_SOFT_LIMIT
 * patches are trimmed to PER_SKILL_KEEP most-recent entries.
 */
export function pruneCache(): { pruned: number } {
  const data = loadCache()
  const bySkill = new Map<string, SkillPatch[]>()
  for (const p of data.patches) {
    const arr = bySkill.get(p.skillName) || []
    arr.push(p)
    bySkill.set(p.skillName, arr)
  }

  let pruned = 0
  const kept: SkillPatch[] = []
  for (const [, patches] of bySkill) {
    if (patches.length > PER_SKILL_SOFT_LIMIT) {
      const sorted = patches
        .slice()
        .sort((a, b) => b.appliedAt - a.appliedAt)
        .slice(0, PER_SKILL_KEEP)
      pruned += patches.length - sorted.length
      kept.push(...sorted)
    } else {
      kept.push(...patches)
    }
  }

  data.patches = kept
  data.updatedAt = Date.now()
  saveCache(data)
  return { pruned }
}
