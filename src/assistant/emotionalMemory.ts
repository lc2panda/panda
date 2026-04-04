// Auto-generated stub — replaced with persistent implementation (Phase 1.5)
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

interface EmotionalEvent {
  description: string
  emotion: string
  timestamp: number
}

const MAX_EVENTS = 100
const PERSIST_DIR = join(homedir(), '.pandacc', 'assistant')
const PERSIST_PATH = join(PERSIST_DIR, 'emotional-memory.json')

let _events: EmotionalEvent[] | null = null

function load(): EmotionalEvent[] {
  if (_events !== null) return _events
  try {
    const raw = readFileSync(PERSIST_PATH, 'utf-8')
    _events = JSON.parse(raw) as EmotionalEvent[]
    if (!Array.isArray(_events)) _events = []
  } catch {
    _events = []
  }
  return _events
}

function save(): void {
  try {
    mkdirSync(PERSIST_DIR, { recursive: true })
    writeFileSync(PERSIST_PATH, JSON.stringify(load(), null, 2))
  } catch {
    // silently ignore write errors (read-only fs, etc.)
  }
}

export function recordEmotionalEvent(description: string, emotion: string) {
  const events = load()
  events.push({ description, emotion, timestamp: Date.now() })
  while (events.length > MAX_EVENTS) events.shift()
  save()
}

export function getRecentEmotionalEvents(count = 10) {
  return load().slice(-count)
}
