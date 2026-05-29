// Input:  cwd string + in-memory workflow registry + ~/.pandacc/workflows/ YAML/JSON files
// Output: Command[] for slash-command palette, one per registered/discovered workflow
// Pos:    src/tools/WorkflowTool/createWorkflowCommand.ts — workflow registry + Command factory
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { existsSync, readdirSync, readFileSync } from 'fs'
import { extname, join } from 'path'
import type { Command } from '../../commands.js'
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'

// ---------------------------------------------------------------------------
// WorkflowStep — one step in a multi-step workflow definition
// ---------------------------------------------------------------------------
export type WorkflowStepCondition =
  | { type: 'on_success' }
  | { type: 'on_failure' }
  | { type: 'always' }
  | { type: 'on_output_contains'; value: string }

export type WorkflowStep = {
  /** Unique id within this workflow (used for kill/skip/retry targeting) */
  id: string
  /** Human-readable label shown in UI and task-notification */
  label: string
  /**
   * The natural-language prompt sent to the sub-agent spawned for this step.
   * May reference workflow args as `{{arg_name}}`.
   */
  prompt: string
  /** Max wall-clock seconds before the step is considered failed (default 300) */
  timeoutSeconds?: number
  /** When to run this step relative to its predecessor (default: on_success) */
  runCondition?: WorkflowStepCondition
  /**
   * IDs of steps that must complete before this step starts.
   * If omitted the step runs after the immediately preceding step.
   */
  dependsOn?: string[]
}

// ---------------------------------------------------------------------------
// WorkflowDefinition — full workflow including optional steps array
// ---------------------------------------------------------------------------
export type WorkflowDefinition = {
  name: string
  description: string
  /**
   * Structured steps for the dynamic orchestration engine.
   * When present, WorkflowTool.call() hands off to runWorkflowSteps().
   * When absent, execute() is called directly (legacy / bundled workflows).
   */
  steps?: WorkflowStep[]
  /**
   * Legacy / bundled single-function executor.
   * Required when `steps` is absent, optional otherwise.
   */
  execute?: (args: Record<string, unknown>) => Promise<unknown>
}

// ---------------------------------------------------------------------------
// In-memory registry
// ---------------------------------------------------------------------------
const workflowRegistry = new Map<string, WorkflowDefinition>()

export function registerWorkflow(definition: WorkflowDefinition): void {
  workflowRegistry.set(definition.name, definition)
}

export function getWorkflow(name: string): WorkflowDefinition | undefined {
  return workflowRegistry.get(name)
}

export function listWorkflows(): WorkflowDefinition[] {
  return Array.from(workflowRegistry.values())
}

// ---------------------------------------------------------------------------
// Disk discovery: ~/.pandacc/workflows/ and <cwd>/.pandacc/workflows/
// ---------------------------------------------------------------------------

/**
 * Attempt to parse a workflow definition from a JSON/YAML-like object.
 * We support simple JSON files; YAML support can be added later.
 */
function parseWorkflowFile(filePath: string): WorkflowDefinition | null {
  try {
    const ext = extname(filePath).toLowerCase()
    if (ext !== '.json') return null
    const raw = readFileSync(filePath, 'utf8')
    const obj = JSON.parse(raw)
    if (typeof obj.name !== 'string' || typeof obj.description !== 'string') return null
    const def: WorkflowDefinition = {
      name: obj.name,
      description: obj.description,
    }
    if (Array.isArray(obj.steps)) {
      def.steps = (obj.steps as unknown[]).map((s: unknown) => {
        const step = s as Record<string, unknown>
        return {
          id: String(step.id ?? step.name ?? ''),
          label: String(step.label ?? step.id ?? ''),
          prompt: String(step.prompt ?? ''),
          timeoutSeconds:
            typeof step.timeoutSeconds === 'number' ? step.timeoutSeconds : undefined,
          runCondition:
            step.runCondition != null
              ? (step.runCondition as WorkflowStepCondition)
              : { type: 'on_success' },
          dependsOn:
            Array.isArray(step.dependsOn)
              ? (step.dependsOn as string[])
              : undefined,
        } satisfies WorkflowStep
      })
    }
    return def
  } catch {
    return null
  }
}

function loadWorkflowsFromDir(dir: string): WorkflowDefinition[] {
  if (!existsSync(dir)) return []
  try {
    const files = readdirSync(dir)
    const result: WorkflowDefinition[] = []
    for (const file of files) {
      const def = parseWorkflowFile(join(dir, file))
      if (def) result.push(def)
    }
    return result
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// getWorkflowCommands — async, accepts cwd, returns Command[]
// Signature matches callers in commands.ts:483 and commands/workflows/index.ts:24
// ---------------------------------------------------------------------------

export async function getWorkflowCommands(cwd: string): Promise<Command[]> {
  // 1. Load disk workflows (user-global + project-local)
  const userWorkflowsDir = join(getClaudeConfigHomeDir(), 'workflows')
  const projectWorkflowsDir = join(cwd, '.pandacc', 'workflows')

  const diskWorkflows = [
    ...loadWorkflowsFromDir(userWorkflowsDir),
    ...loadWorkflowsFromDir(projectWorkflowsDir),
  ]

  // Register discovered disk workflows (idempotent: re-register on each call
  // so that hot-reload works during a session)
  for (const wf of diskWorkflows) {
    workflowRegistry.set(wf.name, wf)
  }

  // 2. Build Command[] from registry (in-memory + just-loaded)
  return listWorkflows().map(
    (wf): Command =>
      ({
        name: wf.name,
        description: wf.description,
        isEnabled: true,
        isHidden: false,
        handler: async () => {
          if (typeof wf.execute === 'function') {
            return wf.execute({})
          }
          return { workflow: wf.name, status: 'registered' }
        },
        userFacingName: () => wf.name,
      }) as unknown as Command,
  )
}
