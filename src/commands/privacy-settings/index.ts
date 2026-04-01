import type { Command } from '../../commands.js'
import { isConsumerSubscriber } from '../../utils/auth.js'

const privacySettings = {
  type: 'local-jsx',
  name: 'privacy-settings',
  description: 'View and update your privacy settings · 查看和更新隐私设置',
  isEnabled: () => {
    return isConsumerSubscriber()
  },
  load: () => import('./privacy-settings.js'),
} satisfies Command

export default privacySettings
