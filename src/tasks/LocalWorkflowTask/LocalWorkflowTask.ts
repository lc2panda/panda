// Input:  per-step agent state events (register/skip/retry/kill) + AppState.tasks for workflow entry
// Output: AppState task mutations — status transitions, agent-level skip/retry flags, kill propagation
// Pos:    src/tasks/LocalWorkflowTask/LocalWorkflowTask.ts — owner of local_workflow task state
//         and per-agent kill/skip/retry control surface used by BackgroundTasksDialog
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { type SetAppState, type TaskStateBase, isTerminalTaskStatus } from '../../Task.js'

// ---------------------------------------------------------------------------
// Per-step (agent) state within a workflow run
// ---------------------------------------------------------------------------
export type WorkflowAgentStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'killed'

export type WorkflowAgentState = {
  /** Matches WorkflowStep.id from the definition */
  stepId: string
  /** The spawned background-agent task-id (e.g. "a4f2…") */
  agentTaskId: string
  status: WorkflowAgentStatus
  /** Short result/error message produced when step terminates */
  summary?: string
}

// ---------------------------------------------------------------------------
// LocalWorkflowTaskState — stored under AppState.tasks[workflowId]
// ---------------------------------------------------------------------------
export type LocalWorkflowTaskState = TaskStateBase & {
  type: 'local_workflow'
  description: string
  summary?: string
  /** Definition name (for display) */
  workflowName: string
  /** Per-step agent tracking */
  agents: WorkflowAgentState[]
  /** Set when the entire workflow is killed mid-run */
  killPending?: boolean
}

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

/** Mark the entire workflow (and all pending/running agents) as killed. */
export function killWorkflowTask(
  id: string,
  setAppState: SetAppState,
): void {
  setAppState((prev) => {
    const task = prev.tasks[id]
    if (!task || task.type !== 'local_workflow') return prev
    if (isTerminalTaskStatus(task.status)) return prev

    const updated: LocalWorkflowTaskState = {
      ...(task as LocalWorkflowTaskState),
      status: 'killed',
      killPending: true,
      agents: (task as LocalWorkflowTaskState).agents.map((a) =>
        a.status === 'pending' || a.status === 'running'
          ? { ...a, status: 'killed' as WorkflowAgentStatus }
          : a,
      ),
    }
    return { ...prev, tasks: { ...prev.tasks, [id]: updated } }
  })
}

/**
 * Skip a single step's agent.
 * The orchestrator loop polls `agents[].status === 'skipped'` to decide
 * whether to abort the running agent task and advance to the next step.
 */
export function skipWorkflowAgent(
  id: string,
  agentId: string,
  setAppState: SetAppState,
): void {
  setAppState((prev) => {
    const task = prev.tasks[id]
    if (!task || task.type !== 'local_workflow') return prev

    const agents = (task as LocalWorkflowTaskState).agents.map((a) =>
      a.agentTaskId === agentId && (a.status === 'pending' || a.status === 'running')
        ? { ...a, status: 'skipped' as WorkflowAgentStatus }
        : a,
    )
    return {
      ...prev,
      tasks: { ...prev.tasks, [id]: { ...(task as LocalWorkflowTaskState), agents } },
    }
  })
}

/**
 * Retry a failed/skipped step.
 * Resets the agent status back to 'pending' so the orchestrator loop
 * re-queues it on the next poll cycle.
 */
export function retryWorkflowAgent(
  id: string,
  agentId: string,
  setAppState: SetAppState,
): void {
  setAppState((prev) => {
    const task = prev.tasks[id]
    if (!task || task.type !== 'local_workflow') return prev

    const agents = (task as LocalWorkflowTaskState).agents.map((a) =>
      a.agentTaskId === agentId && (a.status === 'failed' || a.status === 'skipped')
        ? { ...a, status: 'pending' as WorkflowAgentStatus }
        : a,
    )
    return {
      ...prev,
      tasks: { ...prev.tasks, [id]: { ...(task as LocalWorkflowTaskState), agents } },
    }
  })
}
