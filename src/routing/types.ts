// Input: Design doc §2.1 Capability Taxonomy — version-agnostic model classification.
// Output: Core type definitions for the Multi-Model Agent Routing system.
// Pos: Foundation layer — consumed by capabilityRegistry, taskRouter, formatAdapter, and agent definitions.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import type { APIProvider } from '../utils/model/providers.js'

// ─────────────────────────────────────────────────────────────
// 1. Model Capabilities — version-agnostic classification
// ─────────────────────────────────────────────────────────────

/**
 * Capability dimensions for model classification.
 *
 * Binary flags indicate hard feature support (has or doesn't).
 * Scored dimensions are *relative* 0–100 rankings within the Panda Code
 * model ecosystem — they are NOT absolute benchmark scores.
 *
 * Updated when model configs change in src/utils/model/configs.ts —
 * NEVER in agent definitions. Agent definitions request capabilities;
 * the registry decides which model satisfies them.
 */
export interface ModelCapabilities {
  // ── Binary capabilities (feature gates) ──────────────
  /** Can process images in input */
  vision: boolean
  /** Supports tool/function calling protocol */
  toolUse: boolean
  /** Supports 200k+ token context window */
  extendedContext: boolean
  /** Supports 1M+ token context window */
  megaContext: boolean
  /** Supports streaming responses */
  streaming: boolean
  /** Supports extended thinking / chain-of-thought traces */
  thinking: boolean
  /** Supports JSON mode / structured output schemas */
  structuredOutput: boolean
  /** Can execute code in a sandboxed environment */
  codeExecution: boolean

  // ── Scored dimensions (relative 0–100) ───────────────
  /** Complex multi-step reasoning quality */
  reasoning: number
  /** Code generation, refactoring, and debugging quality */
  coding: number
  /** Response latency — 100 = fastest */
  speed: number
  /** Cost per token — 100 = cheapest */
  costEfficiency: number
  /** Instruction-following precision and reliability */
  instruction: number
  /** Creative writing, brainstorming, and exploration */
  creativity: number
  /** Non-English language quality (CJK, etc.) */
  multilingual: number
}

// ─────────────────────────────────────────────────────────────
// 2. Registered Model — a model entry in the capability registry
// ─────────────────────────────────────────────────────────────

/**
 * Model tier — the version-agnostic family.
 * Maps to existing MODEL_ALIASES in src/utils/model/aliases.ts.
 * Third-party models use 'custom' tier.
 */
export type ModelTier = 'opus' | 'sonnet' | 'haiku' | 'custom'

/**
 * Provider origin — where the model is served from.
 * Extends the existing APIProvider with 'thirdParty' for non-Anthropic models.
 */
export type ModelProvider = APIProvider | 'thirdParty'

/**
 * A registered model in the capability system.
 *
 * `alias` is the stable name used in agent configs — never includes
 * version numbers. `resolveModelId()` defers to getModelStrings() for
 * runtime version resolution, so model upgrades propagate automatically.
 */
export interface RegisteredModel {
  /** Stable alias used in agent configs — e.g., "opus-latest", "fast-code" */
  alias: string
  /** Model tier/family — version-agnostic */
  tier: ModelTier
  /** Provider that serves this model */
  provider: ModelProvider
  /** Resolve to the actual model ID string at runtime (via getModelStrings()) */
  resolveModelId: () => string
  /** Capability profile */
  capabilities: ModelCapabilities
  /** Check if the model is currently available (API reachable, key valid) */
  isAvailable: () => Promise<boolean>
  /** Optional: display name for UX (e.g., "Claude Opus (latest)") */
  displayName?: string
  /** Optional: maximum context window size in tokens */
  maxContextTokens?: number
  /** Optional: cost per 1M input tokens in USD (for cost tracking) */
  inputCostPer1M?: number
  /** Optional: cost per 1M output tokens in USD */
  outputCostPer1M?: number
}

// ─────────────────────────────────────────────────────────────
// 3. Semantic Aliases — version-agnostic model references
// ─────────────────────────────────────────────────────────────

/**
 * Semantic alias categories for task-based model selection.
 * Agent definitions reference these instead of model names.
 */
export type SemanticAlias =
  | 'best-reasoning'     // Strongest reasoning model available
  | 'best-code'          // Best at code generation
  | 'best-creative'      // Best at creative tasks
  | 'best-multilingual'  // Best at non-English languages
  | 'fast'               // Fastest available model
  | 'cheap'              // Most cost-efficient model
  | 'balanced'           // Best balance of quality and speed
  | 'default'            // The user's configured default model
  | string               // Custom user-defined aliases

// ─────────────────────────────────────────────────────────────
// 4. Agent Model Preferences — what agents request
// ─────────────────────────────────────────────────────────────

/**
 * Model preference declaration in an agent definition.
 * The router uses this to select the best model for the agent.
 *
 * Preferences are HINTS, not hard requirements — the router
 * will fallback gracefully if the preferred model is unavailable.
 */
export interface AgentModelPreferences {
  /**
   * Preferred model alias or semantic alias.
   * Examples: "opus-latest", "best-code", "fast", "gemini-pro"
   */
  preferred?: string
  /**
   * Fallback aliases in priority order.
   * Used when `preferred` is unavailable.
   */
  fallbacks?: string[]
  /**
   * Minimum capability requirements.
   * The router will not assign a model that doesn't meet these.
   * Only specify dimensions that matter — omitted = no requirement.
   */
  minimumCapabilities?: Partial<ModelCapabilities>
  /**
   * Capability weights for scoring — emphasize what matters.
   * Example: { coding: 2.0, speed: 0.5 } = prioritize coding, care less about speed.
   * Defaults to equal weight (1.0) for all dimensions.
   */
  capabilityWeights?: Partial<Record<keyof ModelCapabilities, number>>
}

// ─────────────────────────────────────────────────────────────
// 5. Routing Presets — named configurations
// ─────────────────────────────────────────────────────────────

/**
 * A routing preset provides a named configuration for model assignment.
 * Users switch presets via `/routing preset <name>` or settings.json.
 *
 * Presets can override the model for specific agents or change
 * the default model for all agents.
 */
export interface RoutingPreset {
  /** Unique preset name — e.g., "quality", "cost-saving", "balanced" */
  name: string
  /** Human-readable description */
  description: string
  /** Default model alias for agents without explicit preferences */
  defaultModel: string
  /** Per-agent model overrides: agentName → modelAlias */
  agentOverrides?: Record<string, string>
  /** Global capability weight overrides (applied to all agents in this preset) */
  globalWeights?: Partial<Record<keyof ModelCapabilities, number>>
}

// ─────────────────────────────────────────────────────────────
// 6. Routing Decision — output of the task router
// ─────────────────────────────────────────────────────────────

/**
 * The result of a routing decision — which model to use and why.
 * Includes audit trail for debugging and cost tracking.
 */
export interface RoutingDecision {
  /** The selected model */
  model: RegisteredModel
  /** Why this model was selected */
  reason: RoutingReason
  /** Confidence score (0–100) — how well the model fits the request */
  confidence: number
  /** Fallback chain that was considered */
  fallbacksConsidered: string[]
  /** Timestamp of the decision */
  decidedAt: number
}

/** Reason for model selection — for audit logs and debugging */
export type RoutingReason =
  | 'preferred-available'      // Agent's preferred model was available
  | 'fallback-used'            // Preferred unavailable, used fallback
  | 'capability-matched'       // Best capability match from registry
  | 'preset-override'          // Preset specified this model for the agent
  | 'default-model'            // No preference, used default
  | 'degraded'                 // All preferences failed, used best available

// ─────────────────────────────────────────────────────────────
// 7. Configuration — settings.json extensions
// ─────────────────────────────────────────────────────────────

/**
 * Third-party model registration in settings.json.
 * Users declare capabilities since we cannot introspect third-party models.
 */
export interface ThirdPartyModelConfig {
  /** Provider classification */
  provider: 'thirdParty'
  /** API endpoint configuration */
  endpoint: {
    /** Base URL for the API */
    baseURL: string
    /** Environment variable name holding the API key */
    apiKeyEnv: string
  }
  /** The actual model ID to send in API requests */
  modelId: string
  /** User-declared capabilities */
  capabilities: ModelCapabilities
  /** Optional display name */
  displayName?: string
  /** Optional context window size */
  maxContextTokens?: number
  /** Optional cost per 1M input tokens */
  inputCostPer1M?: number
  /** Optional cost per 1M output tokens */
  outputCostPer1M?: number
}

/**
 * The routing section of settings.json.
 * All fields are optional — routing works with zero configuration.
 */
export interface RoutingSettings {
  /** Master switch — when false, routing is completely disabled */
  enableModelRouting?: boolean
  /** Active preset name */
  activePreset?: string
  /** Custom presets defined by the user */
  presets?: Record<string, RoutingPreset>
  /** Third-party model registrations */
  modelRegistry?: Record<string, ThirdPartyModelConfig>
  /** Custom semantic aliases: aliasName → modelAlias */
  customAliases?: Record<string, string>
}
