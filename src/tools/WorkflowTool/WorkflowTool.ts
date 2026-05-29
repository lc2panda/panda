// Input:  tool_use call {workflow, args} from model + ToolUseContext (setAppState, AgentTool registry)
// Output: WorkflowRunResult (static) or runWorkflowSteps result (dynamic, multi-step)
// Pos:    src/tools/WorkflowTool/WorkflowTool.ts — main entry point for /Workflow tool calls;
//         delegates multi-step runs to WorkflowOrchestrator which is built on D7 coordinator/swarm.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { generateTaskId } from '../../Task.js'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { jsonStringify } from '../../utils/slowOperations.js'
import { z } from 'zod/v4'
import { WORKFLOW_TOOL_NAME } from './constants.js'
import { getWorkflow, listWorkflows } from './createWorkflowCommand.js'
import { runWorkflowSteps } from './WorkflowOrchestrator.js'

const inputSchema = lazySchema(() =>
  z.strictObject({
    workflow: z
      .string()
      .describe('Name of the workflow to execute.'),
    args: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Arguments to pass to the workflow.'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export type Output = {
  workflow: string
  status: string
  result?: unknown
  message: string
}

export const WorkflowTool = buildTool({
  name: WORKFLOW_TOOL_NAME,
  searchHint: 'run execute workflow script automation',
  maxResultSizeChars: 500_000,
  shouldDefer: true,

  get inputSchema(): InputSchema {
    return inputSchema()
  },

  toAutoClassifierInput(input) {
    return `workflow ${input.workflow}`
  },

  async description() {
    return 'Execute a registered workflow by name.'
  },

  async prompt() {
    return `Execute a named workflow. Workflows are predefined automation scripts that can perform multi-step operations.

Pass the workflow name and any required arguments. Use this for repeatable, structured operations that go beyond single tool calls.

Workflows with a \`steps\` array run as dynamic multi-agent orchestrations in the background — each step spawns a sub-agent via the swarm. Kill, skip, and retry individual steps via the background tasks UI.

Available workflows are registered at startup or discovered from ~/.pandacc/workflows/ and <project>/.pandacc/workflows/ (JSON files).`
  },

  mapToolResultToToolResultBlockParam(output, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result' as const,
      content: jsonStringify(output),
    }
  },

  renderToolUseMessage() {
    return null
  },

  async call(input, context) {
    const { workflow, args } = input

    const definition = getWorkflow(workflow)
    if (definition) {
      // --- Dynamic multi-step path (new: orchestrated via D7 swarm) ---
      if (definition.steps && definition.steps.length > 0) {
        const workflowId = generateTaskId('local_workflow')
        try {
          const result = await runWorkflowSteps(workflowId, definition, args ?? {}, context)
          return {
            data: {
              workflow,
              status: result.status,
              result,
              message: result.summary,
            },
          }
        } catch (err) {
          return {
            data: {
              workflow,
              status: 'error',
              message: `Workflow "${workflow}" orchestration failed: ${err instanceof Error ? err.message : String(err)}`,
            },
          }
        }
      }

      // --- Legacy / bundled single-function path ---
      if (typeof definition.execute === 'function') {
        try {
          const result = await definition.execute(args ?? {})
          return {
            data: {
              workflow,
              status: 'success',
              result,
              message: `Workflow "${workflow}" executed successfully.`,
            },
          }
        } catch (err) {
          return {
            data: {
              workflow,
              status: 'error',
              message: `Workflow "${workflow}" failed: ${err instanceof Error ? err.message : String(err)}`,
            },
          }
        }
      }

      // Definition has neither steps nor execute
      return {
        data: {
          workflow,
          status: 'error',
          message: `Workflow "${workflow}" has no steps or execute function defined.`,
        },
      }
    }

    const available = listWorkflows()
    const availableNames = available.map((w) => w.name).join(', ')
    return {
      data: {
        workflow,
        status: 'not_found',
        message: available.length > 0
          ? `Workflow "${workflow}" not found. Available workflows: ${availableNames}`
          : `Workflow "${workflow}" not found. No workflows are currently registered in this session.`,
      },
    }
  },
} satisfies ToolDef<InputSchema, Output>)
