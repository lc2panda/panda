import { getTimeSense } from './timeSense.js'
import { getMoodSense } from './moodSense.js'

export function detectPersona(): string {
  // Mood-based overrides take priority over time-based detection
  const { mood } = getMoodSense()
  if (mood === 'frustrated' || mood === 'urgent') return 'companion'
  if (mood === 'focused') return 'work'
  if (mood === 'curious') return 'study'

  // Fall back to time-based detection
  const { isWorkHours, period } = getTimeSense()

  if (isWorkHours) return 'work'
  if (period === 'evening' || period === 'night') return 'companion'
  if (period === 'morning') return 'butler'

  return 'companion'
}
