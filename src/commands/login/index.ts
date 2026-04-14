import type { Command } from '../../commands.js'
import { hasAnthropicApiKeyAuth } from '../../utils/auth.js'
import { isEnvTruthy } from '../../utils/envUtils.js'

export default () =>
  ({
    type: 'local-jsx',
    name: 'login',
    description: hasAnthropicApiKeyAuth()
      ? 'Switch accounts · 切换账户'
      : 'Sign in to your account · 登录账户',
    isEnabled: () => !isEnvTruthy(process.env.DISABLE_LOGIN_COMMAND),
    load: () => import('./login.js'),
  }) satisfies Command
