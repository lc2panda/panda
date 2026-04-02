import { isThirdPartyProvider } from './model/providers.js'
import { getGlobalConfig } from './config.js'

export function isPrivacyEnhancedMode(): boolean {
  if (isThirdPartyProvider()) return true
  try {
    return getGlobalConfig().privacyEnhanced === true
  } catch {
    return false
  }
}
