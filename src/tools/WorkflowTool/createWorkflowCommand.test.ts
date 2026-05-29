// Input:  registerWorkflow / listWorkflows / getWorkflowCommands API surface
// Output: Bun test assertions — 验证子工单1（签名修复）+ 子工单2（WorkflowDefinition steps schema）
// Pos:    src/tools/WorkflowTool/createWorkflowCommand.test.ts — unit tests for registry + commands
import { afterEach, describe, expect, test } from 'bun:test'
import {
  getWorkflow,
  getWorkflowCommands,
  listWorkflows,
  registerWorkflow,
  type WorkflowDefinition,
  type WorkflowStep,
} from './createWorkflowCommand.js'

// Reset registry between tests
afterEach(() => {
  // Clear internal registry by re-importing would require module isolation;
  // instead we register under unique names per test.
})

// ---------------------------------------------------------------------------
// Sub-ticket 2: WorkflowDefinition with steps schema
// ---------------------------------------------------------------------------
describe('WorkflowDefinition steps schema', () => {
  test('registers a workflow with steps array', () => {
    const steps: WorkflowStep[] = [
      {
        id: 'step-a',
        label: 'Step A',
        prompt: 'Do task A for {{project}}',
        timeoutSeconds: 120,
        runCondition: { type: 'on_success' },
      },
      {
        id: 'step-b',
        label: 'Step B',
        prompt: 'Do task B after A',
        dependsOn: ['step-a'],
      },
    ]

    const def: WorkflowDefinition = {
      name: 'test-steps-workflow',
      description: 'A test workflow with two steps',
      steps,
    }

    registerWorkflow(def)

    const retrieved = getWorkflow('test-steps-workflow')
    expect(retrieved).toBeDefined()
    expect(retrieved!.steps).toHaveLength(2)
    expect(retrieved!.steps![0]!.id).toBe('step-a')
    expect(retrieved!.steps![0]!.prompt).toBe('Do task A for {{project}}')
    expect(retrieved!.steps![1]!.dependsOn).toEqual(['step-a'])
  })

  test('registers a workflow with execute only (legacy)', () => {
    const def: WorkflowDefinition = {
      name: 'legacy-exec-workflow',
      description: 'Legacy workflow',
      execute: async (args) => ({ done: true, args }),
    }

    registerWorkflow(def)
    const retrieved = getWorkflow('legacy-exec-workflow')
    expect(retrieved).toBeDefined()
    expect(retrieved!.steps).toBeUndefined()
    expect(typeof retrieved!.execute).toBe('function')
  })

  test('WorkflowStep.runCondition types are structurally sound', () => {
    const step: WorkflowStep = {
      id: 'check',
      label: 'Check output',
      prompt: 'verify something',
      runCondition: { type: 'on_output_contains', value: 'SUCCESS' },
    }
    expect(step.runCondition).toEqual({ type: 'on_output_contains', value: 'SUCCESS' })
  })

  test('WorkflowStep with always condition', () => {
    const step: WorkflowStep = {
      id: 'always-step',
      label: 'Always runs',
      prompt: 'cleanup',
      runCondition: { type: 'always' },
    }
    expect(step.runCondition?.type).toBe('always')
  })
})

// ---------------------------------------------------------------------------
// Sub-ticket 1: getWorkflowCommands signature — async (cwd: string) => Promise<Command[]>
// ---------------------------------------------------------------------------
describe('getWorkflowCommands signature', () => {
  test('returns a Promise (is async)', () => {
    const result = getWorkflowCommands('/tmp')
    expect(result instanceof Promise).toBe(true)
    return result // ensure it resolves
  })

  test('accepts cwd string argument and resolves to array', async () => {
    const commands = await getWorkflowCommands('/tmp')
    expect(Array.isArray(commands)).toBe(true)
  })

  test('includes registered workflows in returned Command[]', async () => {
    const def: WorkflowDefinition = {
      name: 'cmd-test-workflow',
      description: 'Workflow for command test',
      execute: async () => 'done',
    }
    registerWorkflow(def)

    const commands = await getWorkflowCommands('/tmp')
    const names = commands.map((c) => (c as { name: string }).name)
    expect(names).toContain('cmd-test-workflow')
  })

  test('Command from registry has name and description', async () => {
    registerWorkflow({
      name: 'metadata-check-wf',
      description: 'Check metadata is preserved',
      execute: async () => ({}),
    })

    const commands = await getWorkflowCommands('/tmp')
    const cmd = commands.find((c) => (c as { name: string }).name === 'metadata-check-wf')
    expect(cmd).toBeDefined()
    expect((cmd as { description: string }).description).toBe('Check metadata is preserved')
  })

  test('does not throw when workflows dir does not exist', async () => {
    // /tmp/nonexistent-cwd-xyz/.pandacc/workflows would not exist
    let commands: Awaited<ReturnType<typeof getWorkflowCommands>> | undefined
    let threw = false
    try {
      commands = await getWorkflowCommands('/tmp/nonexistent-cwd-xyz-8472')
    } catch {
      threw = true
    }
    expect(threw).toBe(false)
    expect(Array.isArray(commands)).toBe(true)
  })

  test('listWorkflows returns all registered definitions', () => {
    registerWorkflow({
      name: 'list-test-a',
      description: 'A',
      execute: async () => null,
    })
    registerWorkflow({
      name: 'list-test-b',
      description: 'B',
      execute: async () => null,
    })
    const all = listWorkflows()
    const names = all.map((w) => w.name)
    expect(names).toContain('list-test-a')
    expect(names).toContain('list-test-b')
  })
})
