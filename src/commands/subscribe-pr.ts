import { feature } from 'bun:bundle'
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages.js'
import type { Command } from '../commands.js'

const SUBSCRIBE_PR_PROMPT = (args: string) => `
You are helping the user subscribe to PR notifications via GitHub webhooks.

Follow these steps:
1. If no PR number is provided, run \`gh pr list\` to show open PRs and ask which one to subscribe to.
2. If a PR number is provided, verify the PR exists with \`gh pr view ${args}\`.
3. Set up a webhook subscription for the specified PR so the user gets notified of:
   - New comments and reviews
   - Status check updates
   - Merge/close events
   - Requested changes

The subscription will be monitored in the background and notifications will appear in this session.

PR number/URL: ${args}
`

const subscribePr: Command = {
  type: 'prompt',
  name: 'subscribe-pr',
  description: 'Subscribe to notifications for a pull request',
  progressMessage: 'setting up PR subscription',
  contentLength: 0,
  argumentHint: '<pr-number-or-url>',
  source: 'builtin',
  isEnabled: () => feature('KAIROS_GITHUB_WEBHOOKS'),
  async getPromptForCommand(args): Promise<ContentBlockParam[]> {
    return [{ type: 'text', text: SUBSCRIBE_PR_PROMPT(args) }]
  },
}

export default subscribePr
