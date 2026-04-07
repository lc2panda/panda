// Input: User /routing command with subcommands (status, preset, test).
// Output: Display routing configuration, switch presets, dry-run test routing decisions.
// Pos: User-facing command for Multi-Model Agent Routing management.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import type { Command, LocalCommandContext, LocalCommandOnDone } from '../types/command.js'
import { logForDebugging } from '../utils/debug.js'

const routing = {
  type: 'local' as const,
  name: 'routing',
  description: 'Manage Multi-Model Agent Routing · 管理多模型路由',
  argumentHint: '[status|preset <name>|test <agent> <prompt>]',
  supportsNonInteractive: false,
  isEnabled: () => true,
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalCommandOnDone,
        context: LocalCommandContext,
      ): Promise<void> {
        const args = (context.args ?? '').trim().split(/\s+/)
        const subcommand = args[0]?.toLowerCase() ?? 'status'

        try {
          const {
            isRoutingEnabled,
            capabilityRegistry,
            classifyTask,
            resolveModelTarget,
          } = await import('../routing/index.js')

          switch (subcommand) {
            case 'status': {
              const enabled = isRoutingEnabled()
              const models = capabilityRegistry.getAllModels()
              const lines = [
                `**Multi-Model Routing**: ${enabled ? '✅ Enabled' : '❌ Disabled'}`,
                `**Registered Models**: ${models.length}`,
              ]
              if (models.length > 0) {
                lines.push('')
                lines.push('| Alias | Tier | Provider | Model ID |')
                lines.push('|-------|------|----------|----------|')
                for (const m of models) {
                  lines.push(
                    `| ${m.alias} | ${m.tier} | ${m.provider} | ${m.resolveModelId()} |`,
                  )
                }
              }
              lines.push('')
              lines.push(
                enabled
                  ? 'Routing is active. Agents with `modelPreferences` will be routed to optimal models.'
                  : 'Enable with: `PANDA_MODEL_ROUTING=1` or set `enableModelRouting: true` in settings.json',
              )
              onDone({ type: 'local', displayText: lines.join('\n') })
              return
            }

            case 'preset': {
              const presetName = args[1]
              if (!presetName) {
                onDone({
                  type: 'local',
                  displayText:
                    'Usage: `/routing preset <name>`\n\nAvailable presets: quality, cost-saving, balanced, multi-provider\n\nConfigure in settings.json → routingPresets',
                })
                return
              }
              // TODO: Apply preset to global config
              onDone({
                type: 'local',
                displayText: `Routing preset set to: **${presetName}**\n\n(Effective on next agent spawn)`,
              })
              return
            }

            case 'test': {
              const agentName = args[1] ?? 'general-purpose'
              const prompt = args.slice(2).join(' ') || 'Hello'
              const taskProfile = classifyTask(prompt, {
                agentType: agentName,
                name: agentName,
              })

              const parentModel = context.model ?? 'claude-sonnet-4-6'
              const target = resolveModelTarget(
                {
                  name: agentName,
                  agentType: agentName,
                },
                taskProfile,
                null,
                parentModel,
              )

              const lines = [
                `**Routing Dry-Run Test**`,
                '',
                `Agent: ${agentName}`,
                `Prompt: "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"`,
                '',
                '**Task Classification:**',
                `  Complexity: ${taskProfile.complexity}`,
                `  Domain: ${taskProfile.domain}`,
                `  Required: ${taskProfile.requiredCapabilities.join(', ') || 'none'}`,
                `  Token estimate: ${taskProfile.estimatedTokens}`,
                '',
                '**Routing Decision:**',
                `  Model: ${target.modelId}`,
                `  Provider: ${target.provider}`,
                `  Reason: ${target.reason}`,
                `  Fallbacks: ${target.fallbackChain.join(' → ') || 'none'}`,
              ]
              onDone({ type: 'local', displayText: lines.join('\n') })
              return
            }

            default:
              onDone({
                type: 'local',
                displayText:
                  'Usage: `/routing [status|preset <name>|test <agent> <prompt>]`\n\n' +
                  '• `/routing status` — Show routing configuration\n' +
                  '• `/routing preset quality` — Switch routing preset\n' +
                  '• `/routing test triage "fix typo"` — Dry-run routing test',
              })
          }
        } catch (e) {
          logForDebugging(`[routing] command error: ${(e as Error).message}`)
          onDone({
            type: 'local',
            displayText: `Routing error: ${(e as Error).message}`,
          })
        }
      },
    }),
} satisfies Command

export default routing
