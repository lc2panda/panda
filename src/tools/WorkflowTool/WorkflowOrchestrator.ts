// Input:  WorkflowDefinition (with steps[]) + ToolUseContext from WorkflowTool.call()
// Output: per-step agent spawns via AgentTool.call(), AppState task mutations,
//         final WorkflowRunResult indicating success/partial/failed
// Pos:    src/tools/WorkflowTool/WorkflowOrchestrator.ts — dynamic workflow orchestration
//         engine, built on top of D7 coordinator/swarm (AgentTool + coordinatorMode).
//         Referenced by WorkflowTool.ts. Never modifies coordinatorMode.ts.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import {
  createTaskStateBase,
  generateTaskId,
  isTerminalTaskStatus,
} from '../../Task.js'
import {
  findToolByName,
  type ToolUseContext,
} from '../../Tool.js'
import { AGENT_TOOL_NAME } from '../AgentTool/constants.js'
import {
  logEvent,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
} from '../../services/analytics/index.js'
import { getInitialSettings } from '../../utils/settings/settings.js'
import type { WorkflowDefinition, WorkflowStep } from './createWorkflowCommand.js'
import type {
  WorkflowAgentState,
  WorkflowAgentStatus,
  LocalWorkflowTaskState,
} from '../../tasks/LocalWorkflowTask/LocalWorkflowTask.js'

// ---------------------------------------------------------------------------
// Public result type
// ---------------------------------------------------------------------------
export type WorkflowRunResult = {
  workflowId: string
  workflowName: string
  status: 'completed' | 'partial' | 'failed' | 'killed'
  stepsTotal: number
  stepsCompleted: number
  stepsFailed: number
  stepsSkipped: number
  summary: string
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Interpolate {{arg_name}} placeholders in step prompts */
function interpolatePrompt(prompt: string, args: Record<string, unknown>): string {
  return prompt.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const val = args[key]
    return val != null ? String(val) : `{{${key}}}`
  })
}

function getWorkflowSizeInstruction(): string {
  const workflowSize = getInitialSettings().workflowSize ?? 'medium'
  return `\n\nDynamic workflow size guideline: ${workflowSize}. Treat this as an advisory planning signal for task scope, batching, and coordination overhead; do not enforce it as a hard cap.`
}

/** Resolve explicit or implicit dependency set for a step */
function getDependencies(step: WorkflowStep, index: number, steps: WorkflowStep[]): string[] {
  if (step.dependsOn && step.dependsOn.length > 0) return step.dependsOn
  if (index === 0) return []
  return [steps[index - 1]!.id]
}

/** Check whether a step's run condition is satisfied given the current agent states */
function conditionSatisfied(
  step: WorkflowStep,
  deps: string[],
  agentsByStepId: Map<string, WorkflowAgentState>,
): boolean {
  if (deps.length === 0) return true
  const cond = step.runCondition ?? { type: 'on_success' }
  for (const depId of deps) {
    const depAgent = agentsByStepId.get(depId)
    if (!depAgent) return false // dependency not even started
    const s = depAgent.status
    if (cond.type === 'on_success' && s !== 'completed') return false
    if (cond.type === 'on_failure' && s !== 'failed') return false
    if (cond.type === 'always' && !['completed', 'failed', 'skipped'].includes(s)) return false
    if (
      cond.type === 'on_output_contains' &&
      (s !== 'completed' ||
        !depAgent.summary?.includes(cond.value))
    )
      return false
  }
  return true
}

/** Build a synthetic parentMessage stub required by ToolUseContext tool calls */
function makeSyntheticParentMessage(workflowId: string, stepId: string) {
  return {
    role: 'assistant' as const,
    content: [
      {
        type: 'tool_use' as const,
        id: `wf_${workflowId}_${stepId}`,
        name: AGENT_TOOL_NAME,
        input: {},
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// Poll interval for orchestrator loop (ms)
// ---------------------------------------------------------------------------
const POLL_INTERVAL_MS = 200
const MAX_EMPTY_POLLS = 5 * 60 * 1000 / POLL_INTERVAL_MS // 5 min total max

// ---------------------------------------------------------------------------
// runWorkflowSteps — core orchestrator
// Reads kill/skip/retry signals from AppState via polling. Spawns steps via
// AgentTool.call() (which internally uses registerAsyncAgent + runAgent —
// the same swarm path used by coordinatorMode).
// ---------------------------------------------------------------------------
export async function runWorkflowSteps(
  workflowId: string,
  definition: WorkflowDefinition,
  args: Record<string, unknown>,
  context: ToolUseContext,
): Promise<WorkflowRunResult> {
  const { setAppState, getAppState, setAppStateForTasks } = context
  const effectiveSetAppState = setAppStateForTasks ?? setAppState
  const steps = definition.steps ?? []

  // Find AgentTool from the tool registry available in context
  const agentTool = findToolByName(context.options.tools, AGENT_TOOL_NAME)

  // Bootstrap the workflow task entry in AppState
  const taskBase = createTaskStateBase(workflowId, 'local_workflow', definition.description)
  const initialAgents: WorkflowAgentState[] = steps.map((step) => ({
    stepId: step.id,
    agentTaskId: `wf-${workflowId}-${step.id}`, // placeholder until spawned
    status: 'pending',
  }))

  const initialTaskState: LocalWorkflowTaskState = {
    ...taskBase,
    id: workflowId,
    type: 'local_workflow',
    workflowName: definition.name,
    description: definition.description,
    agents: initialAgents,
    status: 'running',
  }

  effectiveSetAppState((prev) => ({
    ...prev,
    tasks: { ...prev.tasks, [workflowId]: initialTaskState },
  }))

  // Track spawned agent promises keyed by stepId
  const agentPromises = new Map<string, Promise<{ status: WorkflowAgentStatus; summary: string }>>()
  // Real agentTaskId assigned after spawn, used for skip/retry matching
  const spawnedAgentIds = new Map<string, string>() // stepId → real agentTaskId

  let pollCount = 0

  // Helper: read current workflow state from AppState
  function getWorkflowState(): LocalWorkflowTaskState | undefined {
    const state = getAppState()
    const task = state.tasks[workflowId]
    if (task?.type === 'local_workflow') return task as LocalWorkflowTaskState
    return undefined
  }

  // Helper: update a single agent's status in AppState
  function updateAgentStatus(
    stepId: string,
    status: WorkflowAgentStatus,
    summary?: string,
  ): void {
    effectiveSetAppState((prev) => {
      const task = prev.tasks[workflowId]
      if (!task || task.type !== 'local_workflow') return prev
      const agents = (task as LocalWorkflowTaskState).agents.map((a) =>
        a.stepId === stepId ? { ...a, status, ...(summary != null ? { summary } : {}) } : a,
      )
      return {
        ...prev,
        tasks: { ...prev.tasks, [workflowId]: { ...(task as LocalWorkflowTaskState), agents } },
      }
    })
  }

  // Helper: spawn one step as a background agent via AgentTool
  function spawnStep(step: WorkflowStep): Promise<{ status: WorkflowAgentStatus; summary: string }> {
    const prompt = interpolatePrompt(step.prompt, args) + getWorkflowSizeInstruction()
    const agentTaskId = generateTaskId('local_agent')
    spawnedAgentIds.set(step.id, agentTaskId)

    logEvent('tengu_workflow_agent_spawned', {
      'workflow.run_id':
        workflowId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      'workflow.name':
        definition.name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })

    // Update placeholder agentTaskId in state
    effectiveSetAppState((prev) => {
      const task = prev.tasks[workflowId]
      if (!task || task.type !== 'local_workflow') return prev
      const agents = (task as LocalWorkflowTaskState).agents.map((a) =>
        a.stepId === step.id ? { ...a, agentTaskId, status: 'running' as WorkflowAgentStatus } : a,
      )
      return {
        ...prev,
        tasks: { ...prev.tasks, [workflowId]: { ...(task as LocalWorkflowTaskState), agents } },
      }
    })

    const parentMessage = makeSyntheticParentMessage(workflowId, step.id)

    // If AgentTool is available, use it (real swarm path).
    // Otherwise fall back to a simple Promise that reports completed immediately
    // (allows tests to run without the full tool registry).
    if (!agentTool) {
      return Promise.resolve({
        status: 'completed' as WorkflowAgentStatus,
        summary: `[no-agent-tool] step ${step.id} simulated`,
      })
    }

    return agentTool
      .call(
        {
          description: step.label || step.id,
          prompt,
          run_in_background: true,
        },
        context,
        // canUseTool: always allow (workflow already has permission)
        () => Promise.resolve(true),
        parentMessage as never,
      )
      .then((result) => {
        const data = result.data as Record<string, unknown> | undefined
        const summary =
          typeof data?.result === 'string'
            ? data.result
            : typeof data?.message === 'string'
              ? data.message
              : String(data ?? '')
        return {
          status: 'completed' as WorkflowAgentStatus,
          summary,
        }
      })
      .catch((err: unknown) => ({
        status: 'failed' as WorkflowAgentStatus,
        summary: err instanceof Error ? err.message : String(err),
      }))
  }

  // -------------------------------------------------------------------------
  // Main orchestration loop
  // -------------------------------------------------------------------------
  const stepMap = new Map(steps.map((s) => [s.id, s]))
  const agentsByStepId = (): Map<string, WorkflowAgentState> => {
    const wfState = getWorkflowState()
    return new Map((wfState?.agents ?? []).map((a) => [a.stepId, a]))
  }

  while (pollCount < MAX_EMPTY_POLLS) {
    const wfState = getWorkflowState()
    if (!wfState) break

    // Check kill signal
    if (wfState.killPending || wfState.status === 'killed') {
      // Abort all in-flight promises (best-effort — they will eventually settle)
      break
    }

    const currentAgents = agentsByStepId()
    let anyProgress = false

    // Scan steps in order
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]!
      const agent = currentAgents.get(step.id)
      if (!agent) continue

      // ---- Handle skip signal from UI (skipWorkflowAgent set status=skipped) ----
      if (agent.status === 'skipped' && !agentPromises.has(step.id)) {
        // Already skipped before spawn — just count it
        updateAgentStatus(step.id, 'skipped', 'Skipped by user')
        anyProgress = true
        continue
      }

      // ---- Handle retry signal from UI (retryWorkflowAgent reset to pending) ----
      if (agent.status === 'pending' && agentPromises.has(step.id)) {
        // Retry: remove the old promise and re-spawn
        agentPromises.delete(step.id)
      }

      // ---- Ready to spawn? ----
      if (agent.status === 'pending' && !agentPromises.has(step.id)) {
        const deps = getDependencies(step, i, steps)
        if (!conditionSatisfied(step, deps, currentAgents)) continue

        // Check run condition — if deps failed and condition is on_success, skip this step
        const condition = step.runCondition ?? { type: 'on_success' }
        if (!conditionSatisfied(step, deps, currentAgents)) {
          if (condition.type === 'on_success') {
            updateAgentStatus(step.id, 'skipped', 'Dependency failed — step skipped')
          }
          continue
        }

        updateAgentStatus(step.id, 'running')
        const promise = spawnStep(step)
        agentPromises.set(step.id, promise)

        // Attach settlement handler
        promise.then(({ status, summary }) => {
          // Check if this agent was externally skipped while running
          const latest = agentsByStepId().get(step.id)
          if (latest?.status === 'skipped' || latest?.status === 'killed') return
          updateAgentStatus(step.id, status, summary)
        })

        anyProgress = true
        continue
      }

      // ---- Poll settled promise (check if resolved) ----
      if (agent.status === 'running' && agentPromises.has(step.id)) {
      }
    }

    // Check if all steps are in terminal states
    const fresh = agentsByStepId()
    const allTerminal = steps.every((s) => {
      const a = fresh.get(s.id)
      return a && ['completed', 'failed', 'skipped', 'killed'].includes(a.status)
    })

    if (allTerminal) break

    if (!anyProgress) {
      await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    }
    pollCount++
  }

  // -------------------------------------------------------------------------
  // Finalize: compute result + update AppState
  // -------------------------------------------------------------------------
  const finalAgents = agentsByStepId()
  let stepsCompleted = 0
  let stepsFailed = 0
  let stepsSkipped = 0

  for (const step of steps) {
    const a = finalAgents.get(step.id)
    if (!a) continue
    if (a.status === 'completed') stepsCompleted++
    else if (a.status === 'failed') stepsFailed++
    else if (a.status === 'skipped' || a.status === 'killed') stepsSkipped++
  }

  const wfState = getWorkflowState()
  const wasKilled = wfState?.killPending || wfState?.status === 'killed'

  const finalStatus: WorkflowRunResult['status'] = wasKilled
    ? 'killed'
    : stepsFailed > 0 && stepsCompleted === 0
      ? 'failed'
      : stepsFailed > 0
        ? 'partial'
        : 'completed'

  const summary = `Workflow "${definition.name}" ${finalStatus}: ${stepsCompleted} completed, ${stepsFailed} failed, ${stepsSkipped} skipped (${steps.length} total)`

  effectiveSetAppState((prev) => {
    const task = prev.tasks[workflowId]
    if (!task || task.type !== 'local_workflow') return prev
    return {
      ...prev,
      tasks: {
        ...prev.tasks,
        [workflowId]: {
          ...(task as LocalWorkflowTaskState),
          status: finalStatus === 'completed' ? 'completed' : finalStatus === 'killed' ? 'killed' : 'failed',
          summary,
          killPending: false,
        },
      },
    }
  })

  return {
    workflowId,
    workflowName: definition.name,
    status: finalStatus,
    stepsTotal: steps.length,
    stepsCompleted,
    stepsFailed,
    stepsSkipped,
    summary,
  }
}
