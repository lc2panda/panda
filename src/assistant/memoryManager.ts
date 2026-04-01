import { getAllWorkingMemory } from './workingMemory.js'
import { getRecentEmotionalEvents } from './emotionalMemory.js'

export function getMemorySummary() {
  return {
    working: getAllWorkingMemory(),
    emotional: getRecentEmotionalEvents(5),
  }
}
