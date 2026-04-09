// Input: Barrel export for the routing module.
// Output: Re-exports all public types and functions from the routing system.
// Pos: Entry point for consumers — import { ModelCapabilities, ... } from '../routing/index.js'
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

export type {
  ModelCapabilities,
  ModelTier,
  ModelProvider,
  RegisteredModel,
  SemanticAlias,
  AgentModelPreferences,
  RoutingPreset,
  RoutingDecision,
  RoutingReason,
  ThirdPartyModelConfig,
  RoutingSettings,
} from './types.js'

export { capabilityRegistry } from './capabilityRegistry.js'
export { validateRoutingConfig } from './configValidator.js'
export type { ValidationError, ValidationErrorCode } from './configValidator.js'
export { classifyTask } from './taskClassifier.js'
export type { TaskProfile, TaskComplexity, TaskDomain, TokenEstimate } from './taskClassifier.js'
export { resolveModelTarget, preflightModelCheck, getNextFallback, getRoutingHistory } from './routeResolver.js'
export type { ModelTarget, RoutingDecisionRecord } from './routeResolver.js'
export { getAdapter, registerAdapter, anthropicAdapter, openaiCompatAdapter } from './formatAlignment.js'
export type { FormatAdapter } from './formatAlignment.js'
export { getPreset, getAllPresets, getActivePreset, setActivePreset, loadPresetsFromSettings } from './presets.js'

// ─────────────────────────────────────────────────────────────
// Fallback Executor — retry across models on overload errors
// ─────────────────────────────────────────────────────────────

/**
 * Execute an API call with automatic fallback through a model chain.
 * Only retries on 503 (overloaded) and 529 (rate-limited) errors.
 * All other errors are thrown immediately.
 */
export async function executeWithFallback(
  primaryModel: string,
  fallbackChain: string[],
  execute: (model: string) => Promise<any>,
): Promise<any> {
  const models = [primaryModel, ...fallbackChain]
  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    try {
      return await execute(model)
    } catch (e: any) {
      const status = e?.status ?? e?.statusCode
      if ((status === 503 || status === 529) && i < models.length - 1) {
        // Overloaded or rate-limited — try next model in chain
        continue
      }
      throw e
    }
  }
  throw new Error('All models in fallback chain exhausted')
}

// ─────────────────────────────────────────────────────────────
// Feature Toggle — master switch for model routing
// ─────────────────────────────────────────────────────────────

/**
 * Check if Multi-Model Agent Routing is enabled.
 *
 * Resolution order:
 * 1. Environment variable PANDA_MODEL_ROUTING (highest priority, for CI/CD)
 * 2. settings.json enableModelRouting field
 * 3. Default: false (routing disabled)
 *
 * When false, all routing functions are no-ops and agents use the
 * session default model — identical to pre-routing behavior.
 */
export function isRoutingEnabled(): boolean {
  // Env var takes precedence (CI/CD override)
  const envVal = process.env.PANDA_MODEL_ROUTING
  if (envVal === '1' || envVal === 'true') return true
  if (envVal === '0' || envVal === 'false') return false

  // Settings check (lazy — avoid import cycle at module load)
  try {
    const { getGlobalConfig } = require('../utils/config.js')
    const config = getGlobalConfig()
    if (config.enableModelRouting === true) return true
  } catch {
    // Config not yet available (early startup) — default off
  }

  return false
}
