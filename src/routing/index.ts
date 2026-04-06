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
