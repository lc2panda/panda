import { getAutoMemPath } from '../../memdir/paths.js'
import { getOriginalCwd } from '../../bootstrap/state.js'
import { getProjectDir } from '../../utils/sessionStorage.js'
import { registerBundledSkill } from '../bundledSkills.js'
import { getMemorySummary } from '../../assistant/memoryManager.js'

const MEMORY_INDEX_FILENAME = 'MEMORY.md'
const INDEX_MAX_LINES = 200

const MEMORY_DIR_GUIDANCE = `This directory uses a flat structure. Each topic gets one file. The index (${MEMORY_INDEX_FILENAME}) is the entry point — keep it under ${INDEX_MAX_LINES} lines.`

function buildDreamPrompt(
  memoryDir: string,
  transcriptDir: string,
  additionalContext?: string,
): string {
  return `# Dream: Memory Consolidation

You are performing a dream — a reflective pass over your memory files. Synthesize what you've learned recently into durable, well-organized memories so that future sessions can orient quickly.

Memory directory: \`${memoryDir}\`
${MEMORY_DIR_GUIDANCE}

Session transcripts: \`${transcriptDir}\` (large JSONL files — grep narrowly, don't read whole files)

---

## Phase 1 — Orient

- \`ls\` the memory directory to see what already exists
- Read \`${MEMORY_INDEX_FILENAME}\` to understand the current index
- Skim existing topic files so you improve them rather than creating duplicates
- If \`logs/\` or \`sessions/\` subdirectories exist (assistant-mode layout), review recent entries there

## Phase 2 — Gather recent signal

Look for new information worth persisting. Sources in rough priority order:

1. **Daily logs** (\`logs/YYYY/MM/YYYY-MM-DD.md\`) if present — these are the append-only stream
2. **Existing memories that drifted** — facts that contradict something you see in the codebase now
3. **Transcript search** — if you need specific context (e.g., "what was the error message from yesterday's build failure?"), grep the JSONL transcripts for narrow terms:
   \`grep -rn "<narrow term>" ${transcriptDir}/ --include="*.jsonl" | tail -50\`

Don't exhaustively read transcripts. Look only for things you already suspect matter.

## Phase 3 — Consolidate

For each thing worth remembering, write or update a memory file at the top level of the memory directory. Use the memory file format and type conventions from your system prompt's auto-memory section — it's the source of truth for what to save, how to structure it, and what NOT to save.

Focus on:
- Merging new signal into existing topic files rather than creating near-duplicates
- Converting relative dates ("yesterday", "last week") to absolute dates so they remain interpretable after time passes
- Deleting contradicted facts — if today's investigation disproves an old memory, fix it at the source

## Phase 3.5 — Emotional memory

Scan for emotionally salient moments: frustration spikes, breakthroughs, repeated user corrections, or praise. These signals reveal what matters most to the user beyond raw facts. Persist a brief emotional-context note alongside the relevant topic file (e.g., "user was frustrated by X — avoid suggesting Y in future").

## Phase 4 — Prune and index

Update \`${MEMORY_INDEX_FILENAME}\` so it stays under ${INDEX_MAX_LINES} lines AND under ~25KB. It's an **index**, not a dump — each entry should be one line under ~150 characters: \`- [Title](file.md) — one-line hook\`. Never write memory content directly into it.

- Remove pointers to memories that are now stale, wrong, or superseded
- Demote verbose entries: if an index line is over ~200 chars, it's carrying content that belongs in the topic file — shorten the line, move the detail
- Add pointers to newly important memories
- Resolve contradictions — if two files disagree, fix the wrong one

---

Return a brief summary of what you consolidated, updated, or pruned. If nothing changed (memories are already tight), say so.${additionalContext ? `\n\n## Additional context\n\n${additionalContext}` : ''}`
}

export function registerDreamSkill(): void {
  registerBundledSkill({
    name: 'dream',
    description:
      'Run a memory consolidation pass — synthesize recent learnings into durable, well-organized memories.',
    userInvocable: true,
    async getPromptForCommand(args) {
      const memoryDir = getAutoMemPath()
      const transcriptDir = getProjectDir(getOriginalCwd())
      // Panda Code: inject working/emotional memory summary for dream consolidation
      let extraContext = args.trim() || undefined
      try {
        const summary = getMemorySummary()
        const parts: string[] = []
        if (summary.emotional.length > 0) {
          parts.push(`Recent emotional events (${summary.emotional.length}):\n${summary.emotional.map(e => `- [${e.emotion}] ${e.description}`).join('\n')}`)
        }
        const workingEntries = Object.entries(summary.working)
        if (workingEntries.length > 0) {
          parts.push(`Working memory (${workingEntries.length} keys):\n${workingEntries.map(([k, v]) => `- ${k}: ${JSON.stringify(v.value)}`).join('\n')}`)
        }
        if (parts.length > 0) {
          extraContext = [extraContext, '## Session memory state\n', ...parts].filter(Boolean).join('\n\n')
        }
      } catch {}
      const prompt = buildDreamPrompt(
        memoryDir,
        transcriptDir,
        extraContext,
      )
      return [{ type: 'text', text: prompt }]
    },
  })
}
