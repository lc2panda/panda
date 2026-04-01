import { getTimeSense } from './timeSense.js'
import { getActivitySense } from './activitySense.js'
import { getMoodSense } from './moodSense.js'
import { getEnvSense } from './envSense.js'

export interface SenseContext {
  time: ReturnType<typeof getTimeSense>
  activity: ReturnType<typeof getActivitySense>
  mood: ReturnType<typeof getMoodSense>
  env: ReturnType<typeof getEnvSense>
}

export function getSenseContext(): SenseContext {
  return {
    time: getTimeSense(),
    activity: getActivitySense(),
    mood: getMoodSense(),
    env: getEnvSense(),
  }
}
