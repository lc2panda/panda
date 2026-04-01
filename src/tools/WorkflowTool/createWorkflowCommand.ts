import type { Command } from '../../commands.js'

export type WorkflowDefinition = {
  name: string
  description: string
  execute: (args: Record<string, unknown>) => Promise<unknown>
}

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

export function getWorkflowCommands(): Command[] {
  return listWorkflows().map((wf) => ({
    name: wf.name,
    description: wf.description,
    isEnabled: true,
    isHidden: false,
    handler: async () => {
      return wf.execute({})
    },
    userFacingName: () => wf.name,
  })) as unknown as Command[]
}
