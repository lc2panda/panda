interface EmotionalEvent {
  description: string
  emotion: string
  timestamp: number
}

const _events: EmotionalEvent[] = []

export function recordEmotionalEvent(description: string, emotion: string) {
  _events.push({ description, emotion, timestamp: Date.now() })
  if (_events.length > 100) _events.shift()
}

export function getRecentEmotionalEvents(count = 10) {
  return _events.slice(-count)
}
