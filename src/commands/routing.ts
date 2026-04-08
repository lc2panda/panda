// Input: User /routing command with subcommands (status, preset, test).
// Output: Display routing configuration, switch presets, dry-run test routing decisions.
// Pos: User-facing command for Multi-Model Agent Routing management.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import type { Command } from '../types/command.js'

const routing = {
  type: 'local' as const,
  name: 'routing',
  description: 'Manage Multi-Model Agent Routing · 管理多模型路由',
  argumentHint: '[status|preset <name>|test <agent> <prompt>]',
  supportsNonInteractive: false,
  isEnabled: () => true,
  load: () =>
    Promise.resolve({
      call: async (argsRaw: string) => {
        const args = (argsRaw ?? '').trim().split(/\s+/)
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
                `Multi-Model Routing: ${enabled ? '✅ Enabled' : '❌ Disabled'}`,
                `Registered Models: ${models.length}`,
              ]
              if (models.length > 0) {
                lines.push('')
                for (const m of models) {
                  lines.push(`  ${m.alias} (${m.tier}) → ${m.resolveModelId()}`)
                }
              }
              lines.push('')
              lines.push(
                enabled
                  ? 'Routing active. Agents with modelPreferences will be routed.'
                  : 'Enable: PANDA_MODEL_ROUTING=1 or enableModelRouting: true in settings.json',
              )

              // Show recent routing decisions
              try {
                const { getRoutingHistory } = await import('../routing/index.js')
                const history = getRoutingHistory()
                if (history.length > 0) {
                  lines.push('')
                  lines.push('Recent routing decisions:')
                  for (const d of history.slice(-5)) {
                    const time = new Date(d.timestamp).toLocaleTimeString()
                    lines.push(`  ${time} ${d.agentType}: ${d.parentModel} → ${d.targetModel} (${d.reason})`)
                  }
                }
              } catch {}

              return { type: 'text' as const, value: lines.join('\n') }
            }

            case 'preset': {
              const presetName = args[1]
              if (!presetName) {
                return {
                  type: 'text' as const,
                  value: 'Usage: /routing preset <name>\n\nAvailable: quality, cost-saving, balanced, multi-provider',
                }
              }
              const { setActivePreset } = await import('../routing/presets.js')
              const success = setActivePreset(presetName)
              return {
                type: 'text' as const,
                value: success
                  ? `Routing preset: ${presetName} (effective on next agent spawn)`
                  : `Unknown preset: ${presetName}. Available: quality, cost-saving, balanced, multi-provider`,
              }
            }

            case 'test': {
              const agentName = args[1] ?? 'general-purpose'
              const prompt = args.slice(2).join(' ') || 'Hello'
              const taskProfile = classifyTask(prompt, {
                agentType: agentName,
                name: agentName,
              })

              const target = resolveModelTarget(
                { name: agentName, agentType: agentName },
                taskProfile,
                null,
                'claude-sonnet-4-6',
              )

              const lines = [
                `Routing Dry-Run: ${agentName}`,
                `Prompt: "${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}"`,
                '',
                `Task: ${taskProfile.complexity} / ${taskProfile.domain}`,
                `Required: ${taskProfile.requiredCapabilities.join(', ') || 'none'}`,
                `Tokens: ${taskProfile.estimatedTokens}`,
                '',
                `→ Model: ${target.modelId}`,
                `  Provider: ${target.provider}`,
                `  Reason: ${target.reason}`,
                `  Fallbacks: ${target.fallbackChain.join(' → ') || 'none'}`,
              ]
              return { type: 'text' as const, value: lines.join('\n') }
            }

            default:
              return {
                type: 'text' as const,
                value:
                  'Usage: /routing [status|preset <name>|test <agent> <prompt>]\n\n' +
                  '  /routing status              — Show routing config\n' +
                  '  /routing preset quality       — Switch preset\n' +
                  '  /routing test triage "fix typo" — Dry-run test',
              }
          }
        } catch (e) {
          return {
            type: 'text' as const,
            value: `Routing error: ${(e as Error).message}`,
          }
        }
      },
    }),
} satisfies Command

export default routing
