// Input: args string from slash invocation
// Output: writes scrollSpeed to global config + process.env.CLAUDE_CODE_SCROLL_SPEED,
//         renders a confirmation row via onDone (system message)
// Pos: lazy-loaded by scroll-speed/index.ts. Wheel-multiplier read path is
//      readScrollSpeedBase() in src/components/ScrollKeybindingHandler.tsx.
import type { ToolUseContext } from '../../Tool.js'
import type {
  LocalJSXCommandContext,
  LocalJSXCommandOnDone,
} from '../../types/command.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'

// Preset map. Mirrors /color's three-tier UX so muscle memory carries over.
// Numbers chosen for visible-but-not-runaway deltas on a typical SGR
// terminal (ghostty discrete=3 pre-multiplies, so 'fast' there = 18 rows/notch).
const PRESETS = {
  slow: 1,
  normal: 3,
  fast: 6,
} as const

type PresetName = keyof typeof PRESETS

const PREVIEW_LINES = [
  '  ▲ panda scrolls up here',
  '  ░ sample line one',
  '  ░ sample line two',
  '  ░ sample line three',
  '  ▼ panda scrolls down here',
]

function isPreset(value: string): value is PresetName {
  return value === 'slow' || value === 'normal' || value === 'fast'
}

function resolveValue(input: string): number | null {
  const trimmed = input.trim().toLowerCase()
  if (isPreset(trimmed)) return PRESETS[trimmed]
  const n = Number.parseFloat(trimmed)
  if (Number.isFinite(n) && n >= 1 && n <= 10) return n
  return null
}

function renderPreview(speed: number): string {
  // Each notch ≈ `speed` rows. Show the preview block with an arrow that
  // points to the row a single wheel tick would land on — gives a real-time
  // "feel" without needing to actually grab the ScrollBox handle.
  const rows = Math.min(Math.floor(speed), PREVIEW_LINES.length - 1)
  return PREVIEW_LINES.map((line, idx) =>
    idx === rows ? line.replace(/^  /, '→ ') : line,
  ).join('\n')
}

export async function call(
  onDone: LocalJSXCommandOnDone,
  _context: ToolUseContext & LocalJSXCommandContext,
  args: string,
): Promise<null> {
  if (!args || args.trim() === '') {
    const current = getGlobalConfig().scrollSpeed
    const envOverride = process.env.CLAUDE_CODE_SCROLL_SPEED
    const effective = envOverride ?? current ?? 1
    onDone(
      `Current scroll speed: ${effective}${envOverride ? ' (from env)' : ''}\n` +
        `Presets: slow=${PRESETS.slow}, normal=${PRESETS.normal}, fast=${PRESETS.fast}\n` +
        `Usage: /scroll-speed <slow|normal|fast|1-10>`,
      { display: 'system' },
    )
    return null
  }

  const value = resolveValue(args)
  if (value === null) {
    onDone(
      `Invalid scroll speed "${args.trim()}". Use slow, normal, fast, or a number 1-10.`,
      { display: 'system' },
    )
    return null
  }

  // Persist to disk first — if save fails we surface it instead of silently
  // updating only the in-memory env. The env mutation matches the value we
  // committed so a follow-up readScrollSpeedBase() returns it without a
  // disk re-read.
  try {
    saveGlobalConfig(prev => ({ ...prev, scrollSpeed: value }))
  } catch (err) {
    onDone(`Failed to save scroll speed: ${(err as Error).message}`, {
      display: 'system',
    })
    return null
  }
  process.env.CLAUDE_CODE_SCROLL_SPEED = String(value)

  // Real-time preview: every invocation rolls a fresh sample so the user can
  // re-run with different values and see the arrow move. We can't directly
  // poke ScrollBox.scrollBy() from a local command (no scrollRef in
  // LocalJSXCommandContext) — the preview pattern stays in-message instead.
  const preview = renderPreview(value)
  onDone(`Scroll speed set to ${value}\n${preview}`, { display: 'system' })
  return null
}
