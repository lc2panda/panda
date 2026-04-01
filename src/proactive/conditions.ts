import { getEnvSense } from '../assistant/envSense.js'
import { isNightTime } from './nightMode.js'

export function isCpuIdle(): boolean {
  return getEnvSense().isIdle
}

export function isNight(): boolean {
  return isNightTime()
}

export function shouldRunNightTask(): boolean {
  return isNight() && isCpuIdle()
}
