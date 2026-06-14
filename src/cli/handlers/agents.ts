/**
 * Agents subcommand handler — prints the list of configured agents.
 * Dynamically imported only when `claude agents` runs.
 */

import {
  AGENT_SOURCE_GROUPS,
  compareAgentsByName,
  getOverrideSourceLabel,
  type ResolvedAgent,
  resolveAgentModelDisplay,
  resolveAgentOverrides,
} from '../../tools/AgentTool/agentDisplay.js'
import {
  getActiveAgentsFromList,
  getAgentDefinitionsWithOverrides,
} from '../../tools/AgentTool/loadAgentsDir.js'
import { getCwd } from '../../utils/cwd.js'
import { enumerateSessions } from '../../components/AgentView/sessionEnumerator.js'
import type { SessionEntry } from '../../components/AgentView/types.js'

/**
 * JSON shape emitted by `claude agents --json`.
 * Mirrors upstream "active session" semantics: only live (process-backed)
 * sessions are reported, with stable script-consumable fields.
 */
type ActiveAgentSessionJson = {
  id: string
  name: string
  sessionId: string | null
  pid: number | null
  status: SessionEntry['status']
  cwd: string
  startedAt: number
  pinned: boolean
  prStatus: SessionEntry['prStatus']
  waitingFor?: string
}

function toActiveSessionJson(entry: SessionEntry): ActiveAgentSessionJson {
  const json: ActiveAgentSessionJson = {
    id: entry.id,
    name: entry.displayName,
    sessionId: entry.sessionId,
    pid: entry.pid,
    status: entry.status,
    cwd: entry.cwd,
    startedAt: entry.startedAt,
    pinned: entry.pinned,
    prStatus: entry.prStatus,
  }
  if (entry.waitingFor !== undefined) {
    json.waitingFor = entry.waitingFor
  }
  return json
}

/**
 * Pure transform: filter merged session entries down to active (alive)
 * sessions and map them to the stable JSON shape. Exported for tests.
 */
export function buildActiveSessionsJson(
  entries: SessionEntry[],
): ActiveAgentSessionJson[] {
  return entries.filter(e => e.shape === 'alive').map(toActiveSessionJson)
}

/**
 * `claude agents --json` — emit active sessions as JSON to stdout.
 * "Active" = live PID-file-backed sessions (shape === 'alive'); roster-only
 * (exited) entries are excluded. Always prints a valid JSON array; an empty
 * list serializes to `[]`.
 */
export async function agentsJsonHandler(): Promise<void> {
  const entries = await enumerateSessions()
  const active = buildActiveSessionsJson(entries)
  console.log(JSON.stringify(active, null, 2))
}

function formatAgent(agent: ResolvedAgent): string {
  const model = resolveAgentModelDisplay(agent)
  const parts = [agent.agentType]
  if (model) {
    parts.push(model)
  }
  if (agent.memory) {
    parts.push(`${agent.memory} memory`)
  }
  return parts.join(' · ')
}

export async function agentsHandler(): Promise<void> {
  const cwd = getCwd()
  const { allAgents } = await getAgentDefinitionsWithOverrides(cwd)
  const activeAgents = getActiveAgentsFromList(allAgents)
  const resolvedAgents = resolveAgentOverrides(allAgents, activeAgents)

  const lines: string[] = []
  let totalActive = 0

  for (const { label, source } of AGENT_SOURCE_GROUPS) {
    const groupAgents = resolvedAgents
      .filter(a => a.source === source)
      .sort(compareAgentsByName)

    if (groupAgents.length === 0) continue

    lines.push(`${label}:`)
    for (const agent of groupAgents) {
      if (agent.overriddenBy) {
        const winnerSource = getOverrideSourceLabel(agent.overriddenBy)
        lines.push(`  (shadowed by ${winnerSource}) ${formatAgent(agent)}`)
      } else {
        lines.push(`  ${formatAgent(agent)}`)
        totalActive++
      }
    }
    lines.push('')
  }

  if (lines.length === 0) {
    console.log('No agents found.')
  } else {
    console.log(`${totalActive} active agents\n`)
    console.log(lines.join('\n').trimEnd())
  }
}
