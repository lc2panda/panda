// Input:  mock AppState with LocalWorkflowTaskState
// Output: Bun test assertions — 验证子工单3 per-agent kill/skip/retry 控制
// Pos:    src/tasks/LocalWorkflowTask/LocalWorkflowTask.test.ts — unit tests
import { describe, expect, test } from 'bun:test'
import type { AppState } from '../../state/AppStateStore.js'
import type { TaskState } from '../../tasks/types.js'
import {
  killWorkflowTask,
  retryWorkflowAgent,
  skipWorkflowAgent,
  type LocalWorkflowTaskState,
  type WorkflowAgentState,
} from './LocalWorkflowTask.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeAgents(overrides?: Partial<WorkflowAgentState>[]): WorkflowAgentState[] {
  const defaults: WorkflowAgentState[] = [
    { stepId: 'step-1', agentTaskId: 'agent-a1', status: 'running' },
    { stepId: 'step-2', agentTaskId: 'agent-a2', status: 'pending' },
    { stepId: 'step-3', agentTaskId: 'agent-a3', status: 'completed' },
  ]
  if (!overrides) return defaults
  return defaults.map((d, i) => ({ ...d, ...(overrides[i] ?? {}) }))
}

function makeWorkflowTask(
  id: string,
  agentOverrides?: Partial<WorkflowAgentState>[],
): LocalWorkflowTaskState {
  return {
    id,
    type: 'local_workflow',
    workflowName: 'test-workflow',
    description: 'Test workflow',
    status: 'running',
    agents: makeAgents(agentOverrides),
    startTime: Date.now(),
    outputFile: `/tmp/${id}.out`,
    outputOffset: 0,
    notified: false,
  }
}

function makeAppState(task: LocalWorkflowTaskState): AppState {
  return {
    tasks: { [task.id]: task as unknown as TaskState },
  } as unknown as AppState
}

type Updater = (prev: AppState) => AppState

function applySetAppState(state: AppState, updater: Updater): AppState {
  return updater(state)
}

// ---------------------------------------------------------------------------
// killWorkflowTask
// ---------------------------------------------------------------------------
describe('killWorkflowTask', () => {
  test('sets workflow status to killed and kills pending/running agents', () => {
    const task = makeWorkflowTask('wf-1')
    let state = makeAppState(task)

    killWorkflowTask('wf-1', (updater) => {
      state = applySetAppState(state, updater)
    })

    const updated = state.tasks['wf-1'] as LocalWorkflowTaskState
    expect(updated.status).toBe('killed')
    expect(updated.killPending).toBe(true)
    // running → killed
    expect(updated.agents.find((a) => a.stepId === 'step-1')?.status).toBe('killed')
    // pending → killed
    expect(updated.agents.find((a) => a.stepId === 'step-2')?.status).toBe('killed')
    // completed → unchanged
    expect(updated.agents.find((a) => a.stepId === 'step-3')?.status).toBe('completed')
  })

  test('no-ops when task is already in terminal state', () => {
    const task = makeWorkflowTask('wf-2')
    const terminalTask = { ...task, status: 'completed' as const }
    let state = makeAppState(terminalTask as unknown as LocalWorkflowTaskState)
    const before = state

    killWorkflowTask('wf-2', (updater) => {
      state = applySetAppState(state, updater)
    })

    expect(state).toBe(before) // reference equality — no mutation
  })

  test('no-ops when task not found', () => {
    const task = makeWorkflowTask('wf-3')
    let state = makeAppState(task)

    killWorkflowTask('NONEXISTENT', (updater) => {
      state = applySetAppState(state, updater)
    })

    // state unchanged for wf-3
    expect((state.tasks['wf-3'] as LocalWorkflowTaskState).status).toBe('running')
  })
})

// ---------------------------------------------------------------------------
// skipWorkflowAgent
// ---------------------------------------------------------------------------
describe('skipWorkflowAgent', () => {
  test('sets running agent to skipped', () => {
    const task = makeWorkflowTask('wf-4')
    let state = makeAppState(task)

    skipWorkflowAgent('wf-4', 'agent-a1', (updater) => {
      state = applySetAppState(state, updater)
    })

    const updated = state.tasks['wf-4'] as LocalWorkflowTaskState
    expect(updated.agents.find((a) => a.agentTaskId === 'agent-a1')?.status).toBe('skipped')
    // other agents unaffected
    expect(updated.agents.find((a) => a.agentTaskId === 'agent-a2')?.status).toBe('pending')
  })

  test('sets pending agent to skipped', () => {
    const task = makeWorkflowTask('wf-5')
    let state = makeAppState(task)

    skipWorkflowAgent('wf-5', 'agent-a2', (updater) => {
      state = applySetAppState(state, updater)
    })

    const updated = state.tasks['wf-5'] as LocalWorkflowTaskState
    expect(updated.agents.find((a) => a.agentTaskId === 'agent-a2')?.status).toBe('skipped')
  })

  test('does not skip a completed agent', () => {
    const task = makeWorkflowTask('wf-6')
    let state = makeAppState(task)

    skipWorkflowAgent('wf-6', 'agent-a3', (updater) => {
      state = applySetAppState(state, updater)
    })

    const updated = state.tasks['wf-6'] as LocalWorkflowTaskState
    // completed agents cannot be skipped
    expect(updated.agents.find((a) => a.agentTaskId === 'agent-a3')?.status).toBe('completed')
  })
})

// ---------------------------------------------------------------------------
// retryWorkflowAgent
// ---------------------------------------------------------------------------
describe('retryWorkflowAgent', () => {
  test('resets a failed agent back to pending', () => {
    const task = makeWorkflowTask('wf-7', [
      { status: 'failed', summary: 'timed out' },
    ])
    let state = makeAppState(task)

    retryWorkflowAgent('wf-7', 'agent-a1', (updater) => {
      state = applySetAppState(state, updater)
    })

    const updated = state.tasks['wf-7'] as LocalWorkflowTaskState
    expect(updated.agents.find((a) => a.agentTaskId === 'agent-a1')?.status).toBe('pending')
  })

  test('resets a skipped agent back to pending', () => {
    const task = makeWorkflowTask('wf-8', [
      { status: 'skipped' },
    ])
    let state = makeAppState(task)

    retryWorkflowAgent('wf-8', 'agent-a1', (updater) => {
      state = applySetAppState(state, updater)
    })

    const updated = state.tasks['wf-8'] as LocalWorkflowTaskState
    expect(updated.agents.find((a) => a.agentTaskId === 'agent-a1')?.status).toBe('pending')
  })

  test('does not retry a completed agent', () => {
    const task = makeWorkflowTask('wf-9', [
      { status: 'completed' },
    ])
    let state = makeAppState(task)

    retryWorkflowAgent('wf-9', 'agent-a1', (updater) => {
      state = applySetAppState(state, updater)
    })

    const updated = state.tasks['wf-9'] as LocalWorkflowTaskState
    expect(updated.agents.find((a) => a.agentTaskId === 'agent-a1')?.status).toBe('completed')
  })

  test('does not retry a running agent', () => {
    const task = makeWorkflowTask('wf-10')
    let state = makeAppState(task)

    retryWorkflowAgent('wf-10', 'agent-a1', (updater) => {
      state = applySetAppState(state, updater)
    })

    const updated = state.tasks['wf-10'] as LocalWorkflowTaskState
    expect(updated.agents.find((a) => a.agentTaskId === 'agent-a1')?.status).toBe('running')
  })
})
