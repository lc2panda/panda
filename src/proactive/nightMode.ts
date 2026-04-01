// Input: System clock + GlobalConfig nightMode settings.
// Output: Night-time detection and night mode configuration.
// Pos: Consumed by night-mode command and proactive engine for time-aware behavior.
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { getGlobalConfig } from '../utils/config.js'

export interface NightModeConfig {
  enabled: boolean
  dreamTime?: string
  cleanupTime?: string
  briefingTime?: string
}

const DEFAULT_NIGHT_MODE: NightModeConfig = {
  enabled: false,
  dreamTime: '0 22 * * *',
  briefingTime: '0 6 * * *',
}

export function isNightTime(): boolean {
  const hour = new Date().getHours()
  return hour >= 22 || hour < 6
}

export function getNightModeConfig(): NightModeConfig {
  const config = getGlobalConfig()
  return config.nightMode ?? DEFAULT_NIGHT_MODE
}

export function isNightModeEnabled(): boolean {
  return getNightModeConfig().enabled
}

export function isNightModeActive(): boolean {
  return isNightModeEnabled() && isNightTime()
}
