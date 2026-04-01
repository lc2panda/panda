export type SafetyLevel = 'read-only' | 'suggest' | 'auto'

export function getSafetyLevel(): SafetyLevel {
  return 'read-only'
}
