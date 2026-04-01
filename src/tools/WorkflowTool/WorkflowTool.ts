import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { jsonStringify } from '../../utils/slowOperations.js'
import { WORKFLOW_TOOL_NAME } from './constants.js'

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

Available workflows are registered at startup. If no workflows are registered, this tool will report an empty list.`
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

  async call(input) {
    const { workflow, args } = input

    return {
      data: {
        workflow,
        status: 'not_found',
        message: `Workflow "${workflow}" not found. No workflows are currently registered in this session.`,
      },
    }
  },
} satisfies ToolDef<InputSchema, Output>)
