interface WorkingMemoryEntry {
  key: string
  value: string
  updatedAt: number
}

const _entries = new Map<string, WorkingMemoryEntry>()

export function setWorkingMemory(key: string, value: string) {
  _entries.set(key, { key, value, updatedAt: Date.now() })
}

export function getWorkingMemory(key: string) {
  return _entries.get(key)?.value
}

export function getAllWorkingMemory() {
  return Array.from(_entries.values())
}

export function clearWorkingMemory() {
  _entries.clear()
}
