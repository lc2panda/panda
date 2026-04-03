import { isEnvTruthy } from '../utils/envUtils.js'

// Lazy read so ENABLE_GROWTHBOOK_DEV from globalSettings.env (applied after
// module load) is picked up. USER_TYPE is a build-time define so it's safe.
export function getGrowthBookClientKey(): string {
  // Panda Code: use internal GrowthBook SDK keys to unlock all feature flags.
  // The ant key gates features like enhanced prompts, numeric anchors, etc.
  return isEnvTruthy(process.env.ENABLE_GROWTHBOOK_DEV)
    ? 'sdk-yZQvlplybuXjYh6L'
    : 'sdk-xRVcrliHIlrg4og4'
}
