// Input: SkillPatch records to append / read / clear
// Output: persisted JSON cache under ~/.pandacc/data/skill-patches.json
// Pos: src/skills/learning/patchCache.ts — stage 4 of Hermes four-stage loop

import { join } from 'path'
import { homedir } from 'os'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import type { SkillPatch } from './types.js'

const CACHE_DIR = join(homedir(), '.pandacc', 'data')
const CACHE_PATH = join(CACHE_DIR, 'skill-patches.json')
const MAX_PATCHES = 200

interface PatchCacheData {
  patches: SkillPatch[]
  updatedAt: number
}

function loadCache(): PatchCacheData {
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

export function appendPatch(patch: SkillPatch): void {
  const data = loadCache()
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
