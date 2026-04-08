// Input: Agent definition + TaskProfile + active preset + capability registry + parent model.
// Output: ModelTarget — the resolved model ID, provider, reason, and fallback chain.
// Pos: Core routing decision engine — called by getAgentModel() when routing is enabled.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import type {
  RegisteredModel,
  AgentModelPreferences,
  RoutingPreset,
  ModelCapabilities,
} from './types.js'
import type { TaskProfile } from './taskClassifier.js'
import { capabilityRegistry } from './capabilityRegistry.js'
import { logForDebugging } from '../utils/debug.js'

// ─────────────────────────────────────────────────────────────
// Routing Decision History (in-memory, session-scoped)
// ─────────────────────────────────────────────────────────────

export interface RoutingDecisionRecord {
  timestamp: number
  agentType: string
  parentModel: string
  targetModel: string
  provider: string
  reason: string
}

const routingHistory: RoutingDecisionRecord[] = []
const MAX_HISTORY = 50

export function getRoutingHistory(): readonly RoutingDecisionRecord[] {
  return routingHistory
}

function recordDecision(decision: RoutingDecisionRecord) {
  routingHistory.push(decision)
  if (routingHistory.length > MAX_HISTORY) {
    routingHistory.shift()
  }
}

// ─────────────────────────────────────────────────────────────
// Fallback Chain Helper
// ─────────────────────────────────────────────────────────────

/**
 * Get the next model from a fallback chain.
 * Called when the primary/current model is unavailable (503/529).
 */
export function getNextFallback(
  currentModel: string,
  fallbackChain: string[],
): string | null {
  const idx = fallbackChain.indexOf(currentModel)
  if (idx >= 0 && idx < fallbackChain.length - 1) {
    return fallbackChain[idx + 1]
  }
  // currentModel not in chain (is primary), return first in chain
  if (idx === -1 && fallbackChain.length > 0) {
    return fallbackChain[0]
  }
  return null
}

// ─────────────────────────────────────────────────────────────
// Output types
// ─────────────────────────────────────────────────────────────

export interface ModelTarget {
  /** The resolved model ID to pass to the API */
  modelId: string
  /** Which provider backend to use */
  provider: string
  /** Why this model was selected (for debugging/logging) */
  reason: string
  /** Fallback models in priority order */
  fallbackChain: string[]
}

// ─────────────────────────────────────────────────────────────
// Agent definition subset — avoids importing full type
// ─────────────────────────────────────────────────────────────

interface AgentRoutingContext {
  /** Agent name for logging */
  name?: string
  /** Agent type (Explore, Plan, general-purpose, etc.) */
  agentType?: string
  /** Explicit model pin (full model ID) */
  model?: string
  /** Routing model preferences */
  modelPreferences?: AgentModelPreferences
  /** Named preset to use */
  modelPreset?: string
}

// ─────────────────────────────────────────────────────────────
// Route Resolver
// ─────────────────────────────────────────────────────────────

/**
 * Resolve the optimal model for an agent based on 8-priority decision chain.
 *
 * Resolution priority (highest wins):
 * 1. Explicit model pin in agent definition → direct passthrough
 * 2. (Handled externally by getAgentModel tool override)
 * 3. Agent modelPreferences.minimumCapabilities → capability filter
 * 4. Preset model mapping → per-agent or default
 * 5. Agent modelPreferences.preferred → preferred alias
 * 6. Agent model alias → alias chain resolution
 * 7. Task-based routing → match domain/complexity to capabilities
 * 8. Default → inherit parent model
 *
 * Design ref: monitor/multi-model-agent-routing-design.md §4.2
 * Code ref: src/utils/model/agent.ts:37-95 (existing getAgentModel)
 */
export function resolveModelTarget(
  agent: AgentRoutingContext,
  taskProfile: TaskProfile,
  activePreset: RoutingPreset | null,
  parentModel: string,
): ModelTarget {
  const agentLabel = agent.name ?? agent.agentType ?? 'unknown'

  // ── Priority 1: Explicit full model ID pin ────────────
  if (agent.model && isExplicitModelId(agent.model)) {
    logForDebugging(`[routing] ${agentLabel}: explicit pin → ${agent.model}`)
    const reason = `explicit-pin: ${agent.model}`
    recordDecision({ timestamp: Date.now(), agentType: agentLabel, parentModel, targetModel: agent.model, provider: 'firstParty', reason })
    return {
      modelId: agent.model,
      provider: 'firstParty',
      reason,
      fallbackChain: [parentModel],
    }
  }

  // ── Priority 3: Minimum capability requirements ───────
  if (agent.modelPreferences?.minimumCapabilities) {
    const match = capabilityRegistry.findBestMatch(
      agent.modelPreferences.minimumCapabilities,
      agent.modelPreferences.capabilityWeights,
    )
    if (match) {
      logForDebugging(`[routing] ${agentLabel}: capability-match → ${match.alias}`)
      const reason = `capability-match: ${match.alias} meets minimum requirements`
      recordDecision({ timestamp: Date.now(), agentType: agentLabel, parentModel, targetModel: match.resolveModelId(), provider: match.provider as string, reason })
      return {
        modelId: match.resolveModelId(),
        provider: match.provider as string,
        reason,
        fallbackChain: [parentModel],
      }
    }
    logForDebugging(`[routing] ${agentLabel}: no model meets minimum capabilities, falling through`)
  }

  // ── Priority 4: Preset model mapping ──────────────────
  const effectivePreset = agent.modelPreset
    ? findPresetByName(agent.modelPreset)
    : activePreset

  if (effectivePreset) {
    // Check per-agent override first, then preset default
    const mappedAlias = effectivePreset.agentOverrides?.[agentLabel]
      ?? effectivePreset.defaultModel

    if (mappedAlias) {
      const resolved = capabilityRegistry.resolveAlias(mappedAlias)
      if (resolved) {
        logForDebugging(`[routing] ${agentLabel}: preset "${effectivePreset.name}" → ${resolved.alias}`)
        const reason = `preset: ${effectivePreset.name} → ${mappedAlias}`
        recordDecision({ timestamp: Date.now(), agentType: agentLabel, parentModel, targetModel: resolved.resolveModelId(), provider: resolved.provider as string, reason })
        return {
          modelId: resolved.resolveModelId(),
          provider: resolved.provider as string,
          reason,
          fallbackChain: [parentModel],
        }
      }
    }
  }

  // ── Priority 5: Preferred model alias ─────────────────
  if (agent.modelPreferences?.preferred) {
    const resolved = capabilityRegistry.resolveAlias(agent.modelPreferences.preferred)
    if (resolved) {
      logForDebugging(`[routing] ${agentLabel}: preferred → ${resolved.alias}`)
      const reason = `preferred: ${agent.modelPreferences.preferred} → ${resolved.alias}`
      recordDecision({ timestamp: Date.now(), agentType: agentLabel, parentModel, targetModel: resolved.resolveModelId(), provider: resolved.provider as string, reason })
      return {
        modelId: resolved.resolveModelId(),
        provider: resolved.provider as string,
        reason,
        fallbackChain: agent.modelPreferences.fallbacks?.map(f => {
          const r = capabilityRegistry.resolveAlias(f)
          return r?.resolveModelId() ?? f
        }) ?? [parentModel],
      }
    }

    // Try fallbacks
    if (agent.modelPreferences.fallbacks) {
      for (const fallback of agent.modelPreferences.fallbacks) {
        const resolved = capabilityRegistry.resolveAlias(fallback)
        if (resolved) {
          logForDebugging(`[routing] ${agentLabel}: fallback → ${resolved.alias}`)
          const reason = `fallback: preferred "${agent.modelPreferences.preferred}" unavailable, using ${resolved.alias}`
          recordDecision({ timestamp: Date.now(), agentType: agentLabel, parentModel, targetModel: resolved.resolveModelId(), provider: resolved.provider as string, reason })
          return {
            modelId: resolved.resolveModelId(),
            provider: resolved.provider as string,
            reason,
            fallbackChain: [parentModel],
          }
        }
      }
    }
  }

  // ── Priority 6: Agent model as alias ──────────────────
  if (agent.model) {
    const resolved = capabilityRegistry.resolveAlias(agent.model)
    if (resolved) {
      logForDebugging(`[routing] ${agentLabel}: alias "${agent.model}" → ${resolved.alias}`)
      const reason = `alias: ${agent.model} → ${resolved.alias}`
      recordDecision({ timestamp: Date.now(), agentType: agentLabel, parentModel, targetModel: resolved.resolveModelId(), provider: resolved.provider as string, reason })
      return {
        modelId: resolved.resolveModelId(),
        provider: resolved.provider as string,
        reason,
        fallbackChain: [parentModel],
      }
    }
  }

  // ── Priority 7: Task-based routing ────────────────────
  const taskTarget = routeByTask(taskProfile)
  if (taskTarget) {
    logForDebugging(`[routing] ${agentLabel}: task-based → ${taskTarget.modelId}`)
    recordDecision({ timestamp: Date.now(), agentType: agentLabel, parentModel, targetModel: taskTarget.modelId, provider: taskTarget.provider, reason: taskTarget.reason })
    return taskTarget
  }

  // ── Priority 8: Default — inherit parent model ────────
  logForDebugging(`[routing] ${agentLabel}: default → inherit parent (${parentModel})`)
  const reason = 'default: inherit from parent'
  recordDecision({ timestamp: Date.now(), agentType: agentLabel, parentModel, targetModel: parentModel, provider: 'firstParty', reason })
  return {
    modelId: parentModel,
    provider: 'firstParty',
    reason,
    fallbackChain: [],
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: Detect explicit model ID (contains version/date pattern)
// ─────────────────────────────────────────────────────────────

/**
 * Check if a model string is an explicit model ID (not an alias).
 * Explicit IDs contain version patterns like "claude-opus-4-6" or "gpt-4o".
 */
function isExplicitModelId(model: string): boolean {
  // Contains date pattern (YYYYMMDD)
  if (/\d{8}/.test(model)) return true
  // Contains version-like pattern (digit-digit or digit.digit)
  if (/\d+[-_.]\d+/.test(model)) return true
  // Known provider prefixes
  if (model.startsWith('claude-') || model.startsWith('gpt-') ||
      model.startsWith('gemini-') || model.startsWith('deepseek-') ||
      model.startsWith('glm-') || model.startsWith('qwen-')) return true
  return false
}

// ─────────────────────────────────────────────────────────────
// Helper: Find preset by name from settings
// ─────────────────────────────────────────────────────────────

function findPresetByName(_name: string): RoutingPreset | null {
  // TODO: Read from settings.json routing config
  // For now, return null — presets are resolved by the caller
  return null
}

// ─────────────────────────────────────────────────────────────
// Helper: Route by task profile (complexity → model tier)
// ─────────────────────────────────────────────────────────────

/**
 * Select a model based on task complexity and domain.
 * Maps task profiles to semantic aliases.
 */
function routeByTask(profile: TaskProfile): ModelTarget | null {
  let targetAlias: string

  // Complexity-based routing
  switch (profile.complexity) {
    case 'expert':
      targetAlias = 'best-reasoning'
      break
    case 'complex':
      targetAlias = 'balanced'
      break
    case 'simple':
      targetAlias = 'fast'
      break
    default: // moderate
      targetAlias = 'balanced'
      break
  }

  // Domain overrides
  if (profile.domain === 'frontend') {
    // Frontend tasks benefit from models with high coding + creativity
    targetAlias = profile.complexity === 'expert' ? 'best-code' : 'balanced'
  }
  if (profile.domain === 'creative') {
    targetAlias = 'best-creative'
  }

  const resolved = capabilityRegistry.resolveAlias(targetAlias)
  if (!resolved) return null

  return {
    modelId: resolved.resolveModelId(),
    provider: resolved.provider as string,
    reason: `task-route: ${profile.complexity}/${profile.domain} → ${targetAlias} → ${resolved.alias}`,
    fallbackChain: [],
  }
}

// ─────────────────────────────────────────────────────────────
// Capability Preflight Check
// ─────────────────────────────────────────────────────────────

/**
 * Preflight check: verify that a target model meets capability requirements
 * and is registered. Called before agent spawn to surface mismatches early.
 *
 * Unregistered models pass by default (third-party custom models).
 */
export function preflightModelCheck(
  modelId: string,
  minimumCapabilities?: Partial<ModelCapabilities>,
): { ok: boolean; reason?: string } {
  const allModels = capabilityRegistry.getAllModels()
  const model = allModels.find(
    m => m.resolveModelId() === modelId || m.alias === modelId,
  )

  if (!model) {
    return { ok: true, reason: 'unregistered model — skipping capability check' }
  }

  if (minimumCapabilities) {
    for (const [key, minValue] of Object.entries(minimumCapabilities)) {
      const actual = (model.capabilities as Record<string, unknown>)[key]
      if (typeof actual === 'number' && typeof minValue === 'number' && actual < minValue) {
        return { ok: false, reason: `${key}: required ${minValue}, got ${actual}` }
      }
      if (typeof actual === 'boolean' && minValue === true && !actual) {
        return { ok: false, reason: `${key}: required true, got false` }
      }
    }
  }

  return { ok: true }
}
