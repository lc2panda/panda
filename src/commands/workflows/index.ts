import { feature } from 'bun:bundle'
import type { Command } from '../../commands.js'

const workflows = {
  type: 'local-jsx',
  name: 'workflows',
  description: 'List and manage workflow scripts',
  isEnabled: () => { if (feature('WORKFLOW_SCRIPTS')) { return true } return false },
  get isHidden() {
    if (feature('WORKFLOW_SCRIPTS')) { return false }
    return true
  },
  load: () =>
    Promise.resolve({
      async call(
        onDone: import('../../types/command.js').LocalJSXCommandOnDone,
        context: import('../../types/command.js').LocalJSXCommandContext,
        args: string,
      ): Promise<React.ReactNode> {
        const { getWorkflowCommands } = require('../../tools/WorkflowTool/createWorkflowCommand.js') as typeof import('../../tools/WorkflowTool/createWorkflowCommand.js')
        const cwd = context.getAppState().cwd ?? process.cwd()

        try {
          const commands = await getWorkflowCommands(cwd)

          if (!commands || (Array.isArray(commands) && commands.length === 0)) {
            onDone(
              'No workflow scripts found.\n\nWorkflows are executable scripts in .claude/workflows/ that can be invoked as slash commands.\nCreate a script in .claude/workflows/ to get started.',
              { display: 'system' },
            )
            return null
          }

          const subcommand = args.trim()

          if (!subcommand) {
            const list = (commands as Array<{ name: string; description?: string }>)
              .map((w) => `  /${w.name} — ${w.description || '(no description)'}`)
              .join('\n')

            onDone(`Available workflows:\n${list}`, { display: 'system' })
            return null
          }

          const matched = (commands as Array<{ name: string }>).find(
            (w) => w.name === subcommand,
          )
          if (!matched) {
            onDone(
              `Workflow "${subcommand}" not found. Run /workflows to see available workflows.`,
              { display: 'system' },
            )
            return null
          }

          onDone(`Running workflow: ${subcommand}`, {
            display: 'system',
            nextInput: `/${subcommand}`,
            submitNextInput: true,
          })
        } catch (err) {
          onDone(
            `Failed to load workflows: ${err instanceof Error ? err.message : String(err)}`,
            { display: 'system' },
          )
        }

        return null
      },
    }),
} satisfies Command

export default workflows
