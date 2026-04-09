// Auto-generated stub — replaced with persistent implementation (Phase 1.5)
import { mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'fs'
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
const DATA_DIR = join(homedir(), '.pandacc', 'data')
const ARCHIVE_PATH = join(DATA_DIR, 'emotional-archive.jsonl')

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

/**
 * 归档溢出的情感事件到 JSONL 文件（追加模式），防止静默丢弃。
 */
function archiveOverflowEvents(events: EmotionalEvent[]): void {
  if (events.length === 0) return
  try {
    mkdirSync(DATA_DIR, { recursive: true })
    const lines = events.map(e => JSON.stringify(e)).join('\n') + '\n'
    appendFileSync(ARCHIVE_PATH, lines, 'utf-8')
  } catch {
    // silently ignore archive errors (read-only fs, etc.)
  }
}

export function recordEmotionalEvent(description: string, emotion: string) {
  const events = load()
  events.push({ description, emotion, timestamp: Date.now() })
  // 归档溢出事件，而非静默丢弃
  const overflow: EmotionalEvent[] = []
  while (events.length > MAX_EVENTS) {
    const evicted = events.shift()
    if (evicted) overflow.push(evicted)
  }
  if (overflow.length > 0) archiveOverflowEvents(overflow)
  save()
}

export function getRecentEmotionalEvents(count = 10) {
  return load().slice(-count)
}
