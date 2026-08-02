// Input: Routing preset definitions — named model assignment configurations.
// Output: Built-in presets + preset loading from settings.json.
// Pos: Consumed by routeResolver for preset-based model selection.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import type { RoutingPreset } from './types.js'

// ─────────────────────────────────────────────────────────────
// Built-in Presets
// ─────────────────────────────────────────────────────────────

/**
 * Quality preset — use the strongest model for every agent.
 * Best results, highest cost. Recommended for architecture reviews
 * and critical code changes.
 */
const QUALITY_PRESET: RoutingPreset = {
  name: 'quality',
  description: '最高质量 · Use strongest models for all agents',
  defaultModel: 'opus-latest',
  agentOverrides: {
    'triage': 'sonnet-latest', // Triage doesn't need opus
  },
  globalWeights: {
    reasoning: 2.0,
    coding: 1.5,
    speed: 0.3,
    costEfficiency: 0.1,
  },
}

/**
 * Cost-saving preset — minimize token cost by using cheaper models.
 * Good for routine tasks, simple fixes, and exploration.
 */
const COST_SAVING_PRESET: RoutingPreset = {
  name: 'cost-saving',
  description: '成本优化 · Minimize cost with fast/cheap models',
  defaultModel: 'haiku-latest',
  agentOverrides: {
    'architecture-reviewer': 'sonnet-latest', // Architecture still needs quality
  },
  globalWeights: {
    costEfficiency: 3.0,
    speed: 2.0,
    reasoning: 0.5,
    coding: 1.0,
  },
}

/**
 * Balanced preset — good mix of quality and speed.
 * Default recommendation for most workflows.
 */
const BALANCED_PRESET: RoutingPreset = {
  name: 'balanced',
  description: '均衡模式 · Balance quality, speed, and cost',
  defaultModel: 'sonnet-latest',
  agentOverrides: {
    'architecture-reviewer': 'opus-latest',
    'triage': 'haiku-latest',
  },
  globalWeights: {
    reasoning: 1.0,
    coding: 1.5,
    speed: 1.0,
    costEfficiency: 1.0,
  },
}

/**
 * Multi-provider preset — distribute work across different providers.
 * Requires third-party models to be registered in modelRegistry.
 */
const MULTI_PROVIDER_PRESET: RoutingPreset = {
  name: 'multi-provider',
  description: '多模型协作 · Distribute agents across providers by specialty',
  defaultModel: 'sonnet-latest',
  agentOverrides: {
    // Users customize these in settings.json to point to their
    // registered third-party models (e.g., "gemini-pro", "deepseek-coder")
  },
  globalWeights: {
    coding: 1.5,
    reasoning: 1.0,
    speed: 1.0,
    costEfficiency: 1.0,
  },
}

// ─────────────────────────────────────────────────────────────
// Preset Registry
// ─────────────────────────────────────────────────────────────

const BUILTIN_PRESETS: Record<string, RoutingPreset> = {
  quality: QUALITY_PRESET,
  'cost-saving': COST_SAVING_PRESET,
  balanced: BALANCED_PRESET,
  'multi-provider': MULTI_PROVIDER_PRESET,
}

let _activePreset: RoutingPreset | null = null
let _customPresets: Record<string, RoutingPreset> = {}

/**
 * Get a preset by name — checks custom presets first, then builtins.
 */
export function getPreset(name: string): RoutingPreset | undefined {
  return _customPresets[name] ?? BUILTIN_PRESETS[name]
}

/**
 * Get all available presets (builtin + custom).
 */
export function getAllPresets(): RoutingPreset[] {
  const all = { ...BUILTIN_PRESETS, ..._customPresets }
  return Object.values(all)
}

/**
 * Get the currently active preset.
 */
export function getActivePreset(): RoutingPreset | null {
  return _activePreset
}

/**
 * Set the active preset by name.
 * Returns true if preset was found and activated, false otherwise.
 */
export function setActivePreset(name: string): boolean {
  const preset = getPreset(name)
  if (preset) {
    _activePreset = preset

    // Persist to settings
    try {
      const { updateSettingsForSource } = require('../utils/settings/settings.js')
      const result = updateSettingsForSource('userSettings', {
        activeRoutingPreset: name,
      })
      if (result.error) {
        console.warn(`[routing] Failed to persist active preset: ${result.error.message}`)
      }
    } catch (e) {
      // Don't fail if persistence errors — in-memory state is still updated
      const msg = e instanceof Error ? e.message : String(e)
      console.warn(`[routing] Failed to persist active preset: ${msg}`)
    }

    return true
  }
  return false
}

/**
 * Load custom presets from settings.
 */
export function loadPresetsFromSettings(
  presets: Record<string, Partial<RoutingPreset>>,
  activePresetName?: string,
): void {
  for (const [name, partial] of Object.entries(presets)) {
    _customPresets[name] = {
      name,
      description: partial.description ?? name,
      defaultModel: partial.defaultModel ?? 'sonnet-latest',
      agentOverrides: partial.agentOverrides,
      globalWeights: partial.globalWeights,
    }
  }
  if (activePresetName) {
    setActivePreset(activePresetName)
  }
}
