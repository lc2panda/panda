import { isThirdPartyProvider } from './model/providers.js'
import { getGlobalConfig } from './config.js'

export function isPrivacyEnhancedMode(): boolean {
  return isThirdPartyProvider() || getGlobalConfig().privacyEnhanced === true
}
