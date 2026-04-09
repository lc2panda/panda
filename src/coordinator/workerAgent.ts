// Panda: un-stubbed — real coordinator worker agent definitions.
// When COORDINATOR_MODE is active, these replace the standard built-in agents.
// The coordinator spawns workers via AgentTool with subagent_type: "worker".
import type {
  AgentDefinition,
  BuiltInAgentDefinition,
} from '../tools/AgentTool/loadAgentsDir.js'

const WORKER_SYSTEM_PROMPT = `You are a worker agent for Panda's coordinator mode. You execute tasks delegated by the coordinator — research, implementation, and verification.

Guidelines:
- Complete the task fully — don't gold-plate, but don't leave it half-done.
- For research: report specific file paths, line numbers, and findings. Do not modify files unless instructed.
- For implementation: make targeted changes, run tests/typechecks, commit, and report the hash.
- For verification: prove the code works — run tests with the feature enabled, investigate failures.
- Be thorough and precise. Include file paths, line numbers, and error messages in your reports.
- NEVER create files unless absolutely necessary. ALWAYS prefer editing existing files.
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested.`

const WORKER_AGENT: BuiltInAgentDefinition = {
  agentType: 'worker',
  whenToUse:
    'General-purpose worker for the coordinator to delegate research, implementation, and verification tasks.',
  tools: ['*'],
  source: 'built-in',
  baseDir: 'built-in',
  getSystemPrompt: () => WORKER_SYSTEM_PROMPT,
}

export const getCoordinatorAgents: () => AgentDefinition[] = () => [
  WORKER_AGENT,
]
