import { getTimeSense } from './timeSense.js'

export function detectPersona(): string {
  const { isWorkHours, period } = getTimeSense()

  if (isWorkHours) return 'work'
  if (period === 'evening' || period === 'night') return 'companion'
  if (period === 'morning') return 'butler'

  return 'companion'
}
