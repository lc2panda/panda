import { feature } from 'bun:bundle'
import type { Command } from '../../commands.js'
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.js'

const FORK_PROMPT = (args: string) => `
You are being asked to fork a sub-agent to handle a task in the background.

The user wants to delegate the following task to a background sub-agent:
${args || '(no task specified — ask the user what they would like the forked agent to work on)'}

Use the Agent tool with run_in_background=true to fork a sub-agent for this task.
The sub-agent will work independently and report back when done.

Important:
- The forked agent runs in its own context with a separate token budget
- It can read/write files and run commands just like the main session
- Results will be delivered as a notification when complete
- You can continue working on other things while it runs
`

const fork: Command = {
  type: 'prompt',
  name: 'fork',
  description: 'Fork a background sub-agent to handle a task',
  progressMessage: 'forking sub-agent',
  contentLength: 0,
  argumentHint: '<task description>',
  source: 'builtin',
  isEnabled: () => feature('FORK_SUBAGENT'),
  get isHidden() {
    return !feature('FORK_SUBAGENT')
  },
  async getPromptForCommand(args): Promise<ContentBlockParam[]> {
    return [{ type: 'text', text: FORK_PROMPT(args) }]
  },
}

export default fork
