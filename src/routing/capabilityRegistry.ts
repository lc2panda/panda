// Input: Model configs from src/utils/model/configs.ts + modelStrings.ts for runtime resolution.
// Output: Capability registry with builtin profiles, third-party registration, and alias resolution.
// Pos: Core registry — consumed by taskRouter for model selection, by agents for preference matching.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import type {
  ModelCapabilities,
  ModelTier,
  ModelProvider,
  RegisteredModel,
  SemanticAlias,
  ThirdPartyModelConfig,
  RoutingSettings,
} from './types.js'

// ─────────────────────────────────────────────────────────────
// 1. Built-in Capability Profiles
// ─────────────────────────────────────────────────────────────

/**
 * Built-in model profiles for Anthropic's Claude family.
 *
 * Capability scores are relative 0–100 rankings within the Panda
 * ecosystem. They are updated when model launches change the landscape,
 * NOT when version numbers change — the `resolveModelId` function
 * defers to getModelStrings() for runtime version resolution.
 *
 * Design ref: monitor/multi-model-agent-routing-design.md §2.2
 * Code ref: src/utils/model/configs.ts (ALL_MODEL_CONFIGS)
 */
type BuiltinProfile = Omit<RegisteredModel, 'alias'>

function makeBuiltinProfiles(): Record<string, BuiltinProfile> {
  // Lazy import to avoid circular deps — getModelStrings reads bootstrap state
  // which may not be initialized at module load time.
  const getModelStrings = (): Record<string, string> => {
    try {
      // Dynamic import deferred to call time
      const { getModelStrings: gms } = require('../utils/model/modelStrings.js')
      return gms()
    } catch {
      // Fallback: return empty — caller should handle missing IDs
      return {}
    }
  }

  return {
    'opus-latest': {
      tier: 'opus' as ModelTier,
      provider: 'firstParty' as ModelProvider,
      resolveModelId: () => getModelStrings().opus46 ?? 'claude-opus-4-6',
      capabilities: {
        vision: true, toolUse: true, extendedContext: true, megaContext: true,
        streaming: true, thinking: true, structuredOutput: true, codeExecution: false,
        reasoning: 98, coding: 95, speed: 30, costEfficiency: 15,
        instruction: 95, creativity: 92, multilingual: 90,
      },
      isAvailable: async () => true,
      displayName: 'Claude Opus (latest)',
      maxContextTokens: 200_000,
      inputCostPer1M: 15.0,
      outputCostPer1M: 75.0,
    },
    'opus-4-8': {
      tier: 'opus' as ModelTier,
      provider: 'firstParty' as ModelProvider,
      resolveModelId: () => getModelStrings().opus47 ?? 'claude-opus-4-7',
      capabilities: {
        vision: true, toolUse: true, extendedContext: true, megaContext: true,
        streaming: true, thinking: true, structuredOutput: true, codeExecution: false,
        reasoning: 99, coding: 96, speed: 28, costEfficiency: 12,
        instruction: 96, creativity: 93, multilingual: 92,
      },
      isAvailable: async () => true,
      displayName: 'Claude Opus 4.8',
      maxContextTokens: 200_000,
      inputCostPer1M: 18.0,
      outputCostPer1M: 90.0,
    },
    'sonnet-latest': {
      tier: 'sonnet' as ModelTier,
      provider: 'firstParty' as ModelProvider,
      resolveModelId: () => getModelStrings().sonnet46 ?? 'claude-sonnet-4-6',
      capabilities: {
        vision: true, toolUse: true, extendedContext: true, megaContext: false,
        streaming: true, thinking: true, structuredOutput: true, codeExecution: false,
        reasoning: 82, coding: 88, speed: 70, costEfficiency: 60,
        instruction: 88, creativity: 80, multilingual: 85,
      },
      isAvailable: async () => true,
      displayName: 'Claude Sonnet (latest)',
      maxContextTokens: 200_000,
      inputCostPer1M: 3.0,
      outputCostPer1M: 15.0,
    },
    'sonnet-5': {
      tier: 'sonnet' as ModelTier,
      provider: 'firstParty' as ModelProvider,
      resolveModelId: () => getModelStrings().sonnet50 ?? 'claude-sonnet-5-20250514',
      capabilities: {
        vision: true, toolUse: true, extendedContext: true, megaContext: true,
        streaming: true, thinking: true, structuredOutput: true, codeExecution: false,
        reasoning: 90, coding: 94, speed: 65, costEfficiency: 55,
        instruction: 92, creativity: 88, multilingual: 90,
      },
      isAvailable: async () => true,
      displayName: 'Claude Sonnet 5',
      maxContextTokens: 200_000,
      inputCostPer1M: 4.5,
      outputCostPer1M: 22.0,
    },
    'haiku-latest': {
      tier: 'haiku' as ModelTier,
      provider: 'firstParty' as ModelProvider,
      resolveModelId: () => getModelStrings().haiku45 ?? 'claude-haiku-4-5',
      capabilities: {
        vision: true, toolUse: true, extendedContext: true, megaContext: false,
        streaming: true, thinking: false, structuredOutput: true, codeExecution: false,
        reasoning: 55, coding: 60, speed: 95, costEfficiency: 95,
        instruction: 72, creativity: 55, multilingual: 70,
      },
      isAvailable: async () => true,
      displayName: 'Claude Haiku (latest)',
      maxContextTokens: 200_000,
      inputCostPer1M: 0.80,
      outputCostPer1M: 4.0,
    },
    'haiku-4-5': {
      tier: 'haiku' as ModelTier,
      provider: 'firstParty' as ModelProvider,
      resolveModelId: () => getModelStrings().haiku45 ?? 'claude-haiku-4-5-20251001',
      capabilities: {
        vision: true, toolUse: true, extendedContext: true, megaContext: false,
        streaming: true, thinking: false, structuredOutput: true, codeExecution: false,
        reasoning: 55, coding: 60, speed: 95, costEfficiency: 95,
        instruction: 72, creativity: 55, multilingual: 70,
      },
      isAvailable: async () => true,
      displayName: 'Claude Haiku 4.5',
      maxContextTokens: 200_000,
      inputCostPer1M: 0.80,
      outputCostPer1M: 4.0,
    },
    'fable-5': {
      tier: 'opus' as ModelTier,
      provider: 'firstParty' as ModelProvider,
      resolveModelId: () => getModelStrings().fable5 ?? 'claude-fable-5',
      capabilities: {
        vision: true, toolUse: true, extendedContext: true, megaContext: true,
        streaming: true, thinking: true, structuredOutput: true, codeExecution: false,
        reasoning: 100, coding: 93, speed: 35, costEfficiency: 20,
        instruction: 97, creativity: 90, multilingual: 88,
      },
      isAvailable: async () => true,
      displayName: 'Claude Fable 5 (推理专用)',
      maxContextTokens: 200_000,
      inputCostPer1M: 20.0,
      outputCostPer1M: 100.0,
    },
  }
}

// ─────────────────────────────────────────────────────────────
// 2. Semantic Aliases — capability-based model references
// ─────────────────────────────────────────────────────────────

/**
 * Default semantic aliases mapping task-type labels to model aliases.
 * These are the fallback when no user customization exists.
 *
 * Design ref: monitor/multi-model-agent-routing-design.md §2.4
 */
const DEFAULT_SEMANTIC_ALIASES: Record<string, string> = {
  'best-reasoning': 'fable-5', // Fable-5 是最强推理模型
  'best-code': 'sonnet-5', // Sonnet-5 是最强编码模型
  'best-creative': 'opus-4-8',
  'best-multilingual': 'sonnet-5',
  'fast': 'haiku-latest',
  'cheap': 'haiku-latest',
  'balanced': 'sonnet-latest',
  'default': 'sonnet-latest',
  // Version-specific aliases
  'fable-latest': 'fable-5',
  'sonnet-5-latest': 'sonnet-5',
  'haiku-4-5-latest': 'haiku-4-5',
  'opus-4-8-latest': 'opus-4-8',
}

// ─────────────────────────────────────────────────────────────
// 3. Registry Class
// ─────────────────────────────────────────────────────────────

const MAX_ALIAS_DEPTH = 10

/**
 * The Capability Registry — central source of truth for all model
 * capabilities, aliases, and third-party registrations.
 *
 * Thread-safe: all state is module-scoped, mutations are synchronous.
 */
class CapabilityRegistry {
  private models: Map<string, RegisteredModel> = new Map()
  private aliases: Map<string, string> = new Map()
  private initialized = false

  /**
   * Initialize the registry with builtin profiles.
   * Safe to call multiple times — subsequent calls are no-ops.
   */
  initialize(): void {
    if (this.initialized) return
    this.initialized = true

    // Register builtin Anthropic models
    const builtins = makeBuiltinProfiles()
    for (const [alias, profile] of Object.entries(builtins)) {
      this.models.set(alias, { ...profile, alias })
    }

    // Register default semantic aliases
    for (const [name, target] of Object.entries(DEFAULT_SEMANTIC_ALIASES)) {
      this.aliases.set(name, target)
    }
  }

  /**
   * Register a third-party model from settings.json configuration.
   */
  registerThirdParty(alias: string, config: ThirdPartyModelConfig): void {
    this.models.set(alias, {
      alias,
      tier: 'custom',
      provider: 'thirdParty',
      resolveModelId: () => config.modelId,
      capabilities: config.capabilities,
      isAvailable: async () => {
        // Basic availability check: is the API key env var set?
        const key = process.env[config.endpoint.apiKeyEnv]
        return typeof key === 'string' && key.length > 0
      },
      displayName: config.displayName ?? alias,
      maxContextTokens: config.maxContextTokens,
      inputCostPer1M: config.inputCostPer1M,
      outputCostPer1M: config.outputCostPer1M,
    })
  }

  /**
   * Load third-party models and custom aliases from routing settings.
   */
  loadSettings(settings: RoutingSettings): void {
    // Register third-party models
    if (settings.modelRegistry) {
      for (const [alias, config] of Object.entries(settings.modelRegistry)) {
        this.registerThirdParty(alias, config)
      }
    }
    // Register custom aliases (override defaults)
    if (settings.customAliases) {
      for (const [name, target] of Object.entries(settings.customAliases)) {
        this.aliases.set(name, target)
      }
    }
  }

  /**
   * Get a registered model by alias.
   * Returns undefined if the alias is not registered.
   */
  getModel(alias: string): RegisteredModel | undefined {
    this.ensureInitialized()
    return this.models.get(alias)
  }

  /**
   * Get all registered models.
   */
  getAllModels(): RegisteredModel[] {
    this.ensureInitialized()
    return Array.from(this.models.values())
  }

  /**
   * Resolve an alias through the alias chain.
   *
   * Resolution order:
   * 1. Custom aliases (user-defined in settings.json)
   * 2. Preset aliases (from active routing preset)
   * 3. Semantic aliases (built-in task-type mappings)
   * 4. Direct model alias (registered in the model map)
   *
   * Circular reference detection: max depth = 10.
   *
   * @returns The resolved RegisteredModel, or undefined if resolution fails.
   */
  resolveAlias(alias: string, depth = 0): RegisteredModel | undefined {
    this.ensureInitialized()

    if (depth > MAX_ALIAS_DEPTH) {
      // Circular alias detected — bail out
      return undefined
    }

    // Direct model lookup
    const direct = this.models.get(alias)
    if (direct) return direct

    // Alias chain resolution
    const target = this.aliases.get(alias)
    if (target) return this.resolveAlias(target, depth + 1)

    return undefined
  }

  /**
   * Find the best model matching a set of minimum capabilities.
   * Scores models by weighted capability match and returns the best.
   *
   * @param minimums - Minimum capability requirements
   * @param weights - Capability dimension weights (default: equal)
   * @returns Best matching model, or undefined if none meet minimums
   */
  findBestMatch(
    minimums?: Partial<ModelCapabilities>,
    weights?: Partial<Record<keyof ModelCapabilities, number>>,
  ): RegisteredModel | undefined {
    this.ensureInitialized()

    const candidates = Array.from(this.models.values())
      .filter(m => this.meetsMinimums(m.capabilities, minimums))

    if (candidates.length === 0) return undefined
    if (candidates.length === 1) return candidates[0]

    // Score and sort by weighted capability match
    return candidates.sort((a, b) => {
      const scoreA = this.computeScore(a.capabilities, weights)
      const scoreB = this.computeScore(b.capabilities, weights)
      return scoreB - scoreA // descending
    })[0]
  }

  // ── Private helpers ──────────────────────────────────────

  private ensureInitialized(): void {
    if (!this.initialized) this.initialize()
  }

  private meetsMinimums(
    capabilities: ModelCapabilities,
    minimums?: Partial<ModelCapabilities>,
  ): boolean {
    if (!minimums) return true

    for (const [key, value] of Object.entries(minimums)) {
      const cap = capabilities[key as keyof ModelCapabilities]
      if (typeof value === 'boolean' && value === true && cap !== true) return false
      if (typeof value === 'number' && typeof cap === 'number' && cap < value) return false
    }
    return true
  }

  private computeScore(
    capabilities: ModelCapabilities,
    weights?: Partial<Record<keyof ModelCapabilities, number>>,
  ): number {
    const scored: (keyof ModelCapabilities)[] = [
      'reasoning', 'coding', 'speed', 'costEfficiency',
      'instruction', 'creativity', 'multilingual',
    ]

    let total = 0
    let weightSum = 0

    for (const dim of scored) {
      const w = weights?.[dim] ?? 1.0
      const v = capabilities[dim]
      if (typeof v === 'number') {
        total += v * w
        weightSum += w
      }
    }

    return weightSum > 0 ? total / weightSum : 0
  }
}

// ─────────────────────────────────────────────────────────────
// 4. Singleton Export
// ─────────────────────────────────────────────────────────────

/** Global capability registry singleton */
export const capabilityRegistry = new CapabilityRegistry()
