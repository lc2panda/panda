// Input: subagent 调用入口的 input 参数 / parent 工具池 / 可选磁盘配置
// Output: 经过过滤的 subagent 工具白名单 / model 覆盖建议 / 合并配置
// Pos: Hermes 子 agent 委派协议 P1-3 — 禁用工具集 + model override + 配置加载
//
// 设计目标：
// 1. 防递归：subagent 禁止再 spawn subagent（Agent/Task 工具强制剥离）
// 2. 省 token：默认 model 降级到 haiku（而非继承 Opus）
// 3. 可配置：~/.pandacc/config/subagent.json 可覆盖默认值（fail-safe）
//
// 纯函数优先 —— 所有策略逻辑可独立 unit test，AgentTool.tsx 仅负责接线。

import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import type { ModelAlias } from '../../utils/model/aliases.js'

/**
 * 始终被剥离的工具名集合（硬编码基线，防递归）。
 * 覆盖 AGENT_TOOL_NAME='Agent' 与 LEGACY_AGENT_TOOL_NAME='Task' 两个名称变体。
 */
export const SUBAGENT_BLOCKED_TOOLS_BASE: ReadonlySet<string> = new Set([
  'Agent',
  'AgentTool',
  'Task',
])

/**
 * 默认 subagent 模型 —— 硬编码 fallback，Hermes 协议建议"便宜快"。
 * 优先级：input.model > config.defaultModel > DEFAULT_SUBAGENT_MODEL
 */
export const DEFAULT_SUBAGENT_MODEL: ModelAlias = 'haiku'

/**
 * 磁盘配置 schema —— 所有字段可选，fail-safe。
 * 路径：~/.pandacc/config/subagent.json
 */
export interface SubagentConfig {
  defaultModel?: ModelAlias
  blockedTools?: string[]
  /** 预留字段，当前 panda 单线程 CLI 并发不强相关 */
  maxConcurrent?: number
}

const CONFIG_REL_PATH = ['.pandacc', 'config', 'subagent.json'] as const

/**
 * 加载 ~/.pandacc/config/subagent.json。
 * 任何异常（文件缺失/JSON 解析失败/权限拒绝）静默返回空对象。
 */
export function loadSubagentConfig(baseDir: string = homedir()): SubagentConfig {
  try {
    const path = join(baseDir, ...CONFIG_REL_PATH)
    if (!existsSync(path)) return {}
    const raw = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(raw) as SubagentConfig
    // 轻量校验：非对象直接丢弃
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

/**
 * 组装最终的禁用工具集 = 硬编码基线 ∪ config.blockedTools。
 * 保证即使 config 为空，基线防递归也生效。
 */
export function computeBlockedTools(config: SubagentConfig): ReadonlySet<string> {
  const merged = new Set<string>(SUBAGENT_BLOCKED_TOOLS_BASE)
  if (Array.isArray(config.blockedTools)) {
    for (const name of config.blockedTools) {
      if (typeof name === 'string' && name.length > 0) merged.add(name)
    }
  }
  return merged
}

/**
 * 从父工具池过滤出 subagent 可用的子集。
 * 用于 AgentTool.call() 组装 workerTools 后的二次剪枝。
 */
export function filterSubagentTools<T extends { name: string }>(
  parentTools: readonly T[] | undefined,
  blocked: ReadonlySet<string>,
): T[] {
  if (!parentTools || parentTools.length === 0) return []
  return parentTools.filter(t => !blocked.has(t.name))
}

/**
 * 解析 subagent 应使用的 model 别名。
 * 优先级：input.model > config.defaultModel > DEFAULT_SUBAGENT_MODEL
 *
 * 注意：返回的是 ModelAlias（'haiku'/'sonnet'/'opus'），下游 getAgentModel()
 * 会负责转成实际 model ID 并处理 Bedrock region prefix。
 */
export function resolveSubagentModel(
  inputModel: ModelAlias | undefined,
  config: SubagentConfig,
): ModelAlias {
  if (inputModel) return inputModel
  if (config.defaultModel) return config.defaultModel
  return DEFAULT_SUBAGENT_MODEL
}

/**
 * 一次性计算所有策略决策 —— AgentTool.call() 的单一入口。
 * 返回：{ model, blockedTools, config } 供上游分发。
 */
export interface SubagentPolicyDecision {
  model: ModelAlias
  blockedTools: ReadonlySet<string>
  config: SubagentConfig
}

export function resolveSubagentPolicy(
  inputModel: ModelAlias | undefined,
  configLoader: () => SubagentConfig = loadSubagentConfig,
): SubagentPolicyDecision {
  const config = configLoader()
  return {
    model: resolveSubagentModel(inputModel, config),
    blockedTools: computeBlockedTools(config),
    config,
  }
}
