// Input: RoutingSettings from settings.json — may contain user errors.
// Output: Validation errors (circular aliases, unknown refs, invalid capabilities).
// Pos: Called at startup to warn about config issues — never blocks startup.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import type { RoutingSettings } from './types.js'
import { logForDebugging } from '../utils/debug.js'

// ─────────────────────────────────────────────────────────────
// Validation Error Types
// ─────────────────────────────────────────────────────────────

export type ValidationErrorCode =
  | 'CIRCULAR_ALIAS'
  | 'UNKNOWN_MODEL_REF'
  | 'UNKNOWN_PRESET_REF'
  | 'INVALID_CAPABILITY_SCORE'
  | 'MISSING_API_KEY_ENV'
  | 'EMPTY_FALLBACK_CHAIN'

export interface ValidationError {
  /** Error classification */
  code: ValidationErrorCode
  /** Human-readable error description */
  message: string
  /** Path to the offending config (e.g., "customModelAliases.my-alias") */
  path: string
  /** Suggested fix */
  suggestion: string
}

// ─────────────────────────────────────────────────────────────
// Validator
// ─────────────────────────────────────────────────────────────

const MAX_ALIAS_DEPTH = 10

/**
 * Validate routing configuration for common errors.
 *
 * This is a **warning-only** validator — it never throws or blocks startup.
 * Returns an array of validation errors that should be logged/displayed
 * but not prevent the CLI from running.
 *
 * Design ref: monitor/multi-model-agent-routing-design.md §9.5
 */
export function validateRoutingConfig(
  settings: RoutingSettings,
): ValidationError[] {
  const errors: ValidationError[] = []

  // Collect all known model aliases (builtin + registered)
  const knownModels = new Set<string>([
    'opus-latest', 'sonnet-latest', 'haiku-latest',
    'best-reasoning', 'best-code', 'best-creative', 'best-multilingual',
    'fast', 'cheap', 'balanced', 'default',
  ])

  // Add third-party registrations
  if (settings.modelRegistry) {
    for (const alias of Object.keys(settings.modelRegistry)) {
      knownModels.add(alias)
    }
  }

  // Add custom aliases (as sources, not targets yet)
  if (settings.customAliases) {
    for (const alias of Object.keys(settings.customAliases)) {
      knownModels.add(alias)
    }
  }

  // ── 1. Check for circular aliases ────────────────────────
  if (settings.customAliases) {
    for (const [alias, target] of Object.entries(settings.customAliases)) {
      const visited = new Set<string>([alias])
      let current = target
      let depth = 0

      while (depth < MAX_ALIAS_DEPTH) {
        if (visited.has(current)) {
          errors.push({
            code: 'CIRCULAR_ALIAS',
            message: `Circular alias detected: ${alias} → ${[...visited].join(' → ')} → ${current}`,
            path: `customModelAliases.${alias}`,
            suggestion: `Break the cycle by changing one of the aliases to point to a concrete model (e.g., "opus-latest", "sonnet-latest").`,
          })
          break
        }
        visited.add(current)

        // Follow the alias chain
        const next = settings.customAliases[current]
        if (!next) break
        current = next
        depth++
      }

      if (depth >= MAX_ALIAS_DEPTH) {
        errors.push({
          code: 'CIRCULAR_ALIAS',
          message: `Alias chain too deep (>${MAX_ALIAS_DEPTH}): ${alias}`,
          path: `customModelAliases.${alias}`,
          suggestion: `Simplify the alias chain — aliases should resolve within 3-4 hops.`,
        })
      }
    }
  }

  // ── 2. Check for unknown model references in presets ─────
  if (settings.presets) {
    for (const [presetName, preset] of Object.entries(settings.presets)) {
      if (preset.defaultModel && !knownModels.has(preset.defaultModel)) {
        errors.push({
          code: 'UNKNOWN_MODEL_REF',
          message: `Preset "${presetName}" references unknown model "${preset.defaultModel}"`,
          path: `routingPresets.${presetName}.defaultModel`,
          suggestion: `Use a registered model alias: ${[...knownModels].slice(0, 5).join(', ')}`,
        })
      }

      if (preset.agentOverrides) {
        for (const [agentName, modelAlias] of Object.entries(preset.agentOverrides)) {
          if (!knownModels.has(modelAlias)) {
            errors.push({
              code: 'UNKNOWN_MODEL_REF',
              message: `Preset "${presetName}" agent "${agentName}" references unknown model "${modelAlias}"`,
              path: `routingPresets.${presetName}.agentOverrides.${agentName}`,
              suggestion: `Use a registered model alias or register the model in modelRegistry.`,
            })
          }
        }
      }
    }
  }

  // ── 3. Check active preset exists ────────────────────────
  if (settings.activePreset && settings.presets && !settings.presets[settings.activePreset]) {
    errors.push({
      code: 'UNKNOWN_PRESET_REF',
      message: `Active preset "${settings.activePreset}" is not defined in routingPresets`,
      path: 'activeRoutingPreset',
      suggestion: `Define the preset in routingPresets or use one of: ${Object.keys(settings.presets).join(', ')}`,
    })
  }

  // ── 4. Validate capability scores in modelRegistry ───────
  if (settings.modelRegistry) {
    const scoredDims = [
      'reasoning', 'coding', 'speed', 'costEfficiency',
      'instruction', 'creativity', 'multilingual',
    ] as const

    for (const [alias, config] of Object.entries(settings.modelRegistry)) {
      for (const dim of scoredDims) {
        const val = config.capabilities[dim]
        if (typeof val === 'number' && (val < 0 || val > 100)) {
          errors.push({
            code: 'INVALID_CAPABILITY_SCORE',
            message: `Model "${alias}" capability "${dim}" = ${val} — must be 0-100`,
            path: `modelRegistry.${alias}.capabilities.${dim}`,
            suggestion: `Set to a value between 0 and 100 (relative ranking).`,
          })
        }
      }

      // Check API key env exists
      if (config.endpoint?.apiKeyEnv) {
        const key = process.env[config.endpoint.apiKeyEnv]
        if (!key || key.length === 0) {
          errors.push({
            code: 'MISSING_API_KEY_ENV',
            message: `Model "${alias}" requires env var ${config.endpoint.apiKeyEnv} but it is not set`,
            path: `modelRegistry.${alias}.endpoint.apiKeyEnv`,
            suggestion: `Set the environment variable: export ${config.endpoint.apiKeyEnv}=<your-api-key>`,
          })
        }
      }
    }
  }

  // ── 5. Log validation results ────────────────────────────
  if (errors.length > 0) {
    logForDebugging(
      `[routing] Config validation: ${errors.length} issue(s) found:\n` +
        errors.map(e => `  [${e.code}] ${e.path}: ${e.message}`).join('\n'),
    )
  } else {
    logForDebugging('[routing] Config validation: all checks passed')
  }

  return errors
}
