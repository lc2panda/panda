import chalk from 'chalk'
import { isZh } from '../../utils/i18n.js'
import { logForDebugging } from 'src/utils/debug.js'
import { fileHistoryEnabled } from 'src/utils/fileHistory.js'
import {
  getInitialSettings,
  getSettings_DEPRECATED,
  getSettingsForSource,
} from 'src/utils/settings/settings.js'
import { shouldOfferTerminalSetup } from '../../commands/terminalSetup/terminalSetup.js'
import { getDesktopUpsellConfig } from '../../components/DesktopUpsell/DesktopUpsellStartup.js'
import { color } from '../../components/design-system/color.js'
import { shouldShowOverageCreditUpsell } from '../../components/LogoV2/OverageCreditUpsell.js'
import { getShortcutDisplay } from '../../keybindings/shortcutFormat.js'
import { isKairosCronEnabled } from '../../tools/ScheduleCronTool/prompt.js'
import { is1PApiCustomer } from '../../utils/auth.js'
import { countConcurrentSessions } from '../../utils/concurrentSessions.js'
import { getGlobalConfig } from '../../utils/config.js'
import {
  getEffortEnvOverride,
  modelSupportsEffort,
} from '../../utils/effort.js'
import { env } from '../../utils/env.js'
import { cacheKeys } from '../../utils/fileStateCache.js'
import { getWorktreeCount } from '../../utils/git.js'
import {
  detectRunningIDEsCached,
  getSortedIdeLockfiles,
  isCursorInstalled,
  isSupportedTerminal,
  isSupportedVSCodeTerminal,
  isVSCodeInstalled,
  isWindsurfInstalled,
} from '../../utils/ide.js'
import {
  getMainLoopModel,
  getUserSpecifiedModelSetting,
} from '../../utils/model/model.js'
import { getPlatform } from '../../utils/platform.js'
import { isPluginInstalled } from '../../utils/plugins/installedPluginsManager.js'
import { loadKnownMarketplacesConfigSafe } from '../../utils/plugins/marketplaceManager.js'
import { OFFICIAL_MARKETPLACE_NAME } from '../../utils/plugins/officialMarketplace.js'
import {
  getCurrentSessionAgentColor,
  isCustomTitleEnabled,
} from '../../utils/sessionStorage.js'
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../analytics/growthbook.js'
import {
  formatGrantAmount,
  getCachedOverageCreditGrant,
} from '../api/overageCreditGrant.js'
import {
  checkCachedPassesEligibility,
  formatCreditAmount,
  getCachedReferrerReward,
} from '../api/referral.js'
import { getSessionsSinceLastShown } from './tipHistory.js'
import type { Tip, TipContext } from './types.js'

let _isOfficialMarketplaceInstalledCache: boolean | undefined
async function isOfficialMarketplaceInstalled(): Promise<boolean> {
  if (_isOfficialMarketplaceInstalledCache !== undefined) {
    return _isOfficialMarketplaceInstalledCache
  }
  const config = await loadKnownMarketplacesConfigSafe()
  _isOfficialMarketplaceInstalledCache = OFFICIAL_MARKETPLACE_NAME in config
  return _isOfficialMarketplaceInstalledCache
}

async function isMarketplacePluginRelevant(
  pluginName: string,
  context: TipContext | undefined,
  signals: { filePath?: RegExp; cli?: string[] },
): Promise<boolean> {
  if (!(await isOfficialMarketplaceInstalled())) {
    return false
  }
  if (isPluginInstalled(`${pluginName}@${OFFICIAL_MARKETPLACE_NAME}`)) {
    return false
  }
  const { bashTools } = context ?? {}
  if (signals.cli && bashTools?.size) {
    if (signals.cli.some(cmd => bashTools.has(cmd))) {
      return true
    }
  }
  if (signals.filePath && context?.readFileState) {
    const readFiles = cacheKeys(context.readFileState)
    if (readFiles.some(fp => signals.filePath!.test(fp))) {
      return true
    }
  }
  return false
}

const externalTips: Tip[] = [
  {
    id: 'new-user-warmup',
    content: async () => isZh()
      ? '从小功能或 Bug 修复开始，让 Claude 先提出方案，再验证修改'
      : `Start with small features or bug fixes, tell Claude to propose a plan, and verify its suggested edits`,
    cooldownSessions: 3,
    async isRelevant() {
      const config = getGlobalConfig()
      return config.numStartups < 10
    },
  },
  {
    id: 'plan-mode-for-complex-tasks',
    content: async () => isZh()
      ? `使用计划模式为复杂请求做准备。按 ${getShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab')} 两次启用。`
      : `Use Plan Mode to prepare for a complex request before making changes. Press ${getShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab')} twice to enable.`,
    cooldownSessions: 5,
    isRelevant: async () => {
      if (process.env.USER_TYPE === 'ant') return false
      const config = getGlobalConfig()
      // Show to users who haven't used plan mode recently (7+ days)
      const daysSinceLastUse = config.lastPlanModeUse
        ? (Date.now() - config.lastPlanModeUse) / (1000 * 60 * 60 * 24)
        : Infinity
      return daysSinceLastUse > 7
    },
  },
  {
    id: 'default-permission-mode-config',
    content: async () => isZh()
      ? '使用 /config 更改默认权限模式（包括计划模式）'
      : `Use /config to change your default permission mode (including Plan Mode)`,
    cooldownSessions: 10,
    isRelevant: async () => {
      try {
        const config = getGlobalConfig()
        const settings = getSettings_DEPRECATED()
        // Show if they've used plan mode but haven't set a default
        const hasUsedPlanMode = Boolean(config.lastPlanModeUse)
        const hasDefaultMode = Boolean(settings?.permissions?.defaultMode)
        return hasUsedPlanMode && !hasDefaultMode
      } catch (error) {
        logForDebugging(
          `Failed to check default-permission-mode-config tip relevance: ${error}`,
          { level: 'warn' },
        )
        return false
      }
    },
  },
  {
    id: 'git-worktrees',
    content: async () => isZh()
      ? '使用 git worktree 可并行运行多个 Panda 会话'
      : 'Use git worktrees to run multiple Claude sessions in parallel.',
    cooldownSessions: 10,
    isRelevant: async () => {
      try {
        const config = getGlobalConfig()
        const worktreeCount = await getWorktreeCount()
        return worktreeCount <= 1 && config.numStartups > 50
      } catch (_) {
        return false
      }
    },
  },
  {
    id: 'color-when-multi-clauding',
    content: async () => isZh()
      ? '运行多个会话？使用 /color 和 /rename 一眼区分'
      : 'Running multiple Claude sessions? Use /color and /rename to tell them apart at a glance.',
    cooldownSessions: 10,
    isRelevant: async () => {
      if (getCurrentSessionAgentColor()) return false
      const count = await countConcurrentSessions()
      return count >= 2
    },
  },
  {
    id: 'terminal-setup',
    content: async () =>
      env.terminal === 'Apple_Terminal'
        ? isZh()
          ? '运行 /terminal-setup 启用 Option+Enter 换行等终端集成'
          : 'Run /terminal-setup to enable convenient terminal integration like Option + Enter for new line and more'
        : isZh()
          ? '运行 /terminal-setup 启用 Shift+Enter 换行等终端集成'
          : 'Run /terminal-setup to enable convenient terminal integration like Shift + Enter for new line and more',
    cooldownSessions: 10,
    async isRelevant() {
      const config = getGlobalConfig()
      if (env.terminal === 'Apple_Terminal') {
        return !config.optionAsMetaKeyInstalled
      }
      return !config.shiftEnterKeyBindingInstalled
    },
  },
  {
    id: 'shift-enter',
    content: async () =>
      env.terminal === 'Apple_Terminal'
        ? isZh()
          ? '按 Option+Enter 发送多行消息'
          : 'Press Option+Enter to send a multi-line message'
        : isZh()
          ? '按 Shift+Enter 发送多行消息'
          : 'Press Shift+Enter to send a multi-line message',
    cooldownSessions: 10,
    async isRelevant() {
      const config = getGlobalConfig()
      return Boolean(
        (env.terminal === 'Apple_Terminal'
          ? config.optionAsMetaKeyInstalled
          : config.shiftEnterKeyBindingInstalled) && config.numStartups > 3,
      )
    },
  },
  {
    id: 'shift-enter-setup',
    content: async () =>
      env.terminal === 'Apple_Terminal'
        ? isZh()
          ? '运行 /terminal-setup 启用 Option+Enter 换行'
          : 'Run /terminal-setup to enable Option+Enter for new lines'
        : isZh()
          ? '运行 /terminal-setup 启用 Shift+Enter 换行'
          : 'Run /terminal-setup to enable Shift+Enter for new lines',
    cooldownSessions: 10,
    async isRelevant() {
      if (!shouldOfferTerminalSetup()) {
        return false
      }
      const config = getGlobalConfig()
      return !(env.terminal === 'Apple_Terminal'
        ? config.optionAsMetaKeyInstalled
        : config.shiftEnterKeyBindingInstalled)
    },
  },
  {
    id: 'memory-command',
    content: async () => isZh()
      ? '使用 /memory 查看和管理记忆'
      : 'Use /memory to view and manage Claude memory',
    cooldownSessions: 15,
    async isRelevant() {
      const config = getGlobalConfig()
      return config.memoryUsageCount <= 0
    },
  },
  {
    id: 'theme-command',
    content: async () => isZh()
      ? '使用 /theme 更换主题配色'
      : 'Use /theme to change the color theme',
    cooldownSessions: 20,
    isRelevant: async () => true,
  },
  {
    id: 'colorterm-truecolor',
    content: async () => isZh()
      ? '试试设置环境变量 COLORTERM=truecolor 获得更丰富的色彩'
      : 'Try setting environment variable COLORTERM=truecolor for richer colors',
    cooldownSessions: 30,
    isRelevant: async () => !process.env.COLORTERM && chalk.level < 3,
  },
  {
    id: 'powershell-tool-env',
    content: async () => isZh()
      ? '设置 CLAUDE_CODE_USE_POWERSHELL_TOOL=1 启用 PowerShell 工具（预览）'
      : 'Set CLAUDE_CODE_USE_POWERSHELL_TOOL=1 to enable the PowerShell tool (preview)',
    cooldownSessions: 10,
    isRelevant: async () =>
      getPlatform() === 'windows' &&
      process.env.CLAUDE_CODE_USE_POWERSHELL_TOOL === undefined,
  },
  {
    id: 'status-line',
    content: async () => isZh()
      ? '使用 /statusline 设置自定义状态栏，显示在输入框下方'
      : 'Use /statusline to set up a custom status line that will display beneath the input box',
    cooldownSessions: 25,
    isRelevant: async () => getSettings_DEPRECATED().statusLine === undefined,
  },
  {
    id: 'prompt-queue',
    content: async () => isZh()
      ? '在工作中按 Enter 排队发送更多消息'
      : 'Hit Enter to queue up additional messages while Claude is working.',
    cooldownSessions: 5,
    async isRelevant() {
      const config = getGlobalConfig()
      return config.promptQueueUseCount <= 3
    },
  },
  {
    id: 'enter-to-steer-in-relatime',
    content: async () => isZh()
      ? '工作时发送消息可实时引导 Panda 的方向'
      : 'Send messages to Claude while it works to steer Claude in real-time',
    cooldownSessions: 20,
    isRelevant: async () => true,
  },
  {
    id: 'todo-list',
    content: async () => isZh()
      ? '处理复杂任务时让 Panda 创建待办列表，跟踪进度不跑偏'
      : 'Ask Claude to create a todo list when working on complex tasks to track progress and remain on track',
    cooldownSessions: 20,
    isRelevant: async () => true,
  },
  {
    id: 'vscode-command-install',
    content: async () => isZh()
      ? `打开命令面板 (Cmd+Shift+P) 运行 "Shell Command: Install '${env.terminal === 'vscode' ? 'code' : env.terminal}' command in PATH" 启用 IDE 集成`
      : `Open the Command Palette (Cmd+Shift+P) and run "Shell Command: Install '${env.terminal === 'vscode' ? 'code' : env.terminal}' command in PATH" to enable IDE integration`,
    cooldownSessions: 0,
    async isRelevant() {
      // Only show this tip if we're in a VS Code-style terminal
      if (!isSupportedVSCodeTerminal()) {
        return false
      }
      if (getPlatform() !== 'macos') {
        return false
      }

      // Check if the relevant command is available
      switch (env.terminal) {
        case 'vscode':
          return !(await isVSCodeInstalled())
        case 'cursor':
          return !(await isCursorInstalled())
        case 'windsurf':
          return !(await isWindsurfInstalled())
        default:
          return false
      }
    },
  },
  {
    id: 'ide-upsell-external-terminal',
    content: async () => isZh()
      ? '将 Panda 连接到你的 IDE · /ide'
      : 'Connect Claude to your IDE · /ide',
    cooldownSessions: 4,
    async isRelevant() {
      if (isSupportedTerminal()) {
        return false
      }

      // Use lockfiles as a (quicker) signal for running IDEs
      const lockfiles = await getSortedIdeLockfiles()
      if (lockfiles.length !== 0) {
        return false
      }

      const runningIDEs = await detectRunningIDEsCached()
      return runningIDEs.length > 0
    },
  },
  {
    id: 'install-github-app',
    content: async () => isZh()
      ? '运行 /install-github-app 直接在 GitHub Issues 和 PR 中 @claude'
      : 'Run /install-github-app to tag @claude right from your Github issues and PRs',
    cooldownSessions: 10,
    isRelevant: async () => !getGlobalConfig().githubActionSetupCount,
  },
  {
    id: 'install-slack-app',
    content: async () => isZh()
      ? '运行 /install-slack-app 在 Slack 中使用 Panda'
      : 'Run /install-slack-app to use Claude in Slack',
    cooldownSessions: 10,
    isRelevant: async () => !getGlobalConfig().slackAppInstallCount,
  },
  {
    id: 'permissions',
    content: async () => isZh()
      ? '使用 /permissions 预先批准或拒绝 bash、编辑和 MCP 工具'
      : 'Use /permissions to pre-approve and pre-deny bash, edit, and MCP tools',
    cooldownSessions: 10,
    async isRelevant() {
      const config = getGlobalConfig()
      return config.numStartups > 10
    },
  },
  {
    id: 'drag-and-drop-images',
    content: async () => isZh()
      ? '你知道可以直接拖拽图片文件到终端吗？'
      : 'Did you know you can drag and drop image files into your terminal?',
    cooldownSessions: 10,
    isRelevant: async () => !env.isSSH(),
  },
  {
    id: 'paste-images-mac',
    content: async () => isZh()
      ? '使用 control+v 粘贴图片到 Panda（不是 cmd+v！）'
      : 'Paste images into Panda using control+v (not cmd+v!)',
    cooldownSessions: 10,
    isRelevant: async () => getPlatform() === 'macos',
  },
  {
    id: 'double-esc',
    content: async () => isZh()
      ? '双击 Esc 回退对话到之前的节点'
      : 'Double-tap esc to rewind the conversation to a previous point in time',
    cooldownSessions: 10,
    isRelevant: async () => !fileHistoryEnabled(),
  },
  {
    id: 'double-esc-code-restore',
    content: async () => isZh()
      ? '双击 Esc 回退代码和/或对话到之前的节点'
      : 'Double-tap esc to rewind the code and/or conversation to a previous point in time',
    cooldownSessions: 10,
    isRelevant: async () => fileHistoryEnabled(),
  },
  {
    id: 'continue',
    content: async () => isZh()
      ? '运行 panda --continue 或 panda --resume 恢复对话'
      : 'Run panda --continue or panda --resume to resume a conversation',
    cooldownSessions: 10,
    isRelevant: async () => true,
  },
  {
    id: 'rename-conversation',
    content: async () => isZh()
      ? '使用 /rename 命名对话，方便在 /resume 中查找'
      : 'Name your conversations with /rename to find them easily in /resume later',
    cooldownSessions: 15,
    isRelevant: async () =>
      isCustomTitleEnabled() && getGlobalConfig().numStartups > 10,
  },
  {
    id: 'custom-commands',
    content: async () => isZh()
      ? '在 .pandacc/skills/ 添加 .md 文件创建自定义技能，全局技能放 ~/.pandacc/skills/'
      : 'Create skills by adding .md files to .pandacc/skills/ in your project or ~/.pandacc/skills/ for skills that work in any project',
    cooldownSessions: 15,
    async isRelevant() {
      const config = getGlobalConfig()
      return config.numStartups > 10
    },
  },
  {
    id: 'shift-tab',
    content: async () =>
      process.env.USER_TYPE === 'ant'
        ? isZh()
          ? `按 ${getShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab')} 在默认和自动模式间切换`
          : `Hit ${getShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab')} to cycle between default mode and auto mode`
        : isZh()
          ? `按 ${getShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab')} 在默认、自动接受编辑和计划模式间切换`
          : `Hit ${getShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab')} to cycle between default mode, auto-accept edit mode, and plan mode`,
    cooldownSessions: 10,
    isRelevant: async () => true,
  },
  {
    id: 'image-paste',
    content: async () => isZh()
      ? `使用 ${getShortcutDisplay('chat:imagePaste', 'Chat', 'ctrl+v')} 从剪贴板粘贴图片`
      : `Use ${getShortcutDisplay('chat:imagePaste', 'Chat', 'ctrl+v')} to paste images from your clipboard`,
    cooldownSessions: 20,
    isRelevant: async () => true,
  },
  {
    id: 'custom-agents',
    content: async () => isZh()
      ? '使用 /agents 优化特定任务。例如：软件架构师、代码编写、代码审查'
      : 'Use /agents to optimize specific tasks. Eg. Software Architect, Code Writer, Code Reviewer',
    cooldownSessions: 15,
    async isRelevant() {
      const config = getGlobalConfig()
      return config.numStartups > 5
    },
  },
  {
    id: 'agent-flag',
    content: async () => isZh()
      ? '使用 --agent <agent_name> 直接与子代理开始对话'
      : 'Use --agent <agent_name> to directly start a conversation with a subagent',
    cooldownSessions: 15,
    async isRelevant() {
      const config = getGlobalConfig()
      return config.numStartups > 5
    },
  },
  {
    id: 'desktop-app',
    content: async () => isZh()
      ? '使用桌面应用本地或远程运行 Panda：clau.de/desktop'
      : 'Run Panda locally or remotely using the Claude desktop app: clau.de/desktop',
    cooldownSessions: 15,
    isRelevant: async () => getPlatform() !== 'linux',
  },
  {
    id: 'desktop-shortcut',
    content: async ctx => {
      const blue = color('suggestion', ctx.theme)
      return isZh()
        ? `使用 ${blue('/desktop')} 在 Panda 桌面端继续会话`
        : `Continue your session in Panda Desktop with ${blue('/desktop')}`
    },
    cooldownSessions: 15,
    isRelevant: async () => {
      if (!getDesktopUpsellConfig().enable_shortcut_tip) return false
      return (
        process.platform === 'darwin' ||
        (process.platform === 'win32' && process.arch === 'x64')
      )
    },
  },
  {
    id: 'web-app',
    content: async () => isZh()
      ? '在云端运行任务，本地继续写代码 · clau.de/web'
      : 'Run tasks in the cloud while you keep coding locally · clau.de/web',
    cooldownSessions: 15,
    isRelevant: async () => true,
  },
  {
    id: 'mobile-app',
    content: async () => isZh()
      ? '/mobile 在手机端使用 Panda'
      : '/mobile to use Panda from the Claude app on your phone',
    cooldownSessions: 15,
    isRelevant: async () => true,
  },
  {
    id: 'opusplan-mode-reminder',
    content: async () => isZh()
      ? `你的默认模型是 Opus 计划模式。按 ${getShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab')} 两次激活计划模式，使用 Claude Opus 规划。`
      : `Your default model setting is Opus Plan Mode. Press ${getShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab')} twice to activate Plan Mode and plan with Claude Opus.`,
    cooldownSessions: 2,
    async isRelevant() {
      if (process.env.USER_TYPE === 'ant') return false
      const config = getGlobalConfig()
      const modelSetting = getUserSpecifiedModelSetting()
      const hasOpusPlanMode = modelSetting === 'opusplan'
      // Show reminder if they have Opus Plan Mode and haven't used plan mode recently (3+ days)
      const daysSinceLastUse = config.lastPlanModeUse
        ? (Date.now() - config.lastPlanModeUse) / (1000 * 60 * 60 * 24)
        : Infinity
      return hasOpusPlanMode && daysSinceLastUse > 3
    },
  },
  {
    id: 'frontend-design-plugin',
    content: async ctx => {
      const blue = color('suggestion', ctx.theme)
      return isZh()
        ? `正在写 HTML/CSS？安装 frontend-design 插件：\n${blue(`/plugin install frontend-design@${OFFICIAL_MARKETPLACE_NAME}`)}`
        : `Working with HTML/CSS? Install the frontend-design plugin:\n${blue(`/plugin install frontend-design@${OFFICIAL_MARKETPLACE_NAME}`)}`
    },
    cooldownSessions: 3,
    isRelevant: async context =>
      isMarketplacePluginRelevant('frontend-design', context, {
        filePath: /\.(html|css|htm)$/i,
      }),
  },
  {
    id: 'vercel-plugin',
    content: async ctx => {
      const blue = color('suggestion', ctx.theme)
      return isZh()
        ? `在用 Vercel？安装 vercel 插件：\n${blue(`/plugin install vercel@${OFFICIAL_MARKETPLACE_NAME}`)}`
        : `Working with Vercel? Install the vercel plugin:\n${blue(`/plugin install vercel@${OFFICIAL_MARKETPLACE_NAME}`)}`
    },
    cooldownSessions: 3,
    isRelevant: async context =>
      isMarketplacePluginRelevant('vercel', context, {
        filePath: /(?:^|[/\\])vercel\.json$/i,
        cli: ['vercel'],
      }),
  },
  {
    id: 'effort-high-nudge',
    content: async ctx => {
      const blue = color('suggestion', ctx.theme)
      const cmd = blue('/effort high')
      const variant = getFeatureValue_CACHED_MAY_BE_STALE<
        'off' | 'copy_a' | 'copy_b'
      >('tengu_tide_elm', 'off')
      return variant === 'copy_b'
        ? isZh()
          ? `使用 ${cmd} 获得更好的一次性回答。Panda 会先深思熟虑。`
          : `Use ${cmd} for better one-shot answers. Claude thinks it through first.`
        : isZh()
          ? `遇到棘手问题？${cmd} 让首次回答更靠谱`
          : `Working on something tricky? ${cmd} gives better first answers`
    },
    cooldownSessions: 3,
    isRelevant: async () => {
      if (!is1PApiCustomer()) return false
      if (!modelSupportsEffort(getMainLoopModel())) return false
      if (getSettingsForSource('policySettings')?.effortLevel !== undefined) {
        return false
      }
      if (getEffortEnvOverride() !== undefined) return false
      const persisted = getInitialSettings().effortLevel
      if (persisted === 'high' || persisted === 'max') return false
      return (
        getFeatureValue_CACHED_MAY_BE_STALE<'off' | 'copy_a' | 'copy_b'>(
          'tengu_tide_elm',
          'off',
        ) !== 'off'
      )
    },
  },
  {
    id: 'subagent-fanout-nudge',
    content: async ctx => {
      const blue = color('suggestion', ctx.theme)
      const variant = getFeatureValue_CACHED_MAY_BE_STALE<
        'off' | 'copy_a' | 'copy_b'
      >('tengu_tern_alloy', 'off')
      return variant === 'copy_b'
        ? isZh()
          ? `大型任务可以让 Panda ${blue('使用子代理')}。它们并行工作，保持主线程整洁。`
          : `For big tasks, tell Claude to ${blue('use subagents')}. They work in parallel and keep your main thread clean.`
        : isZh()
          ? `说 ${blue('"分发子代理"')}，Panda 会派出一个团队。各自深挖，确保不遗漏。`
          : `Say ${blue('"fan out subagents"')} and Claude sends a team. Each one digs deep so nothing gets missed.`
    },
    cooldownSessions: 3,
    isRelevant: async () => {
      if (!is1PApiCustomer()) return false
      return (
        getFeatureValue_CACHED_MAY_BE_STALE<'off' | 'copy_a' | 'copy_b'>(
          'tengu_tern_alloy',
          'off',
        ) !== 'off'
      )
    },
  },
  {
    id: 'loop-command-nudge',
    content: async ctx => {
      const blue = color('suggestion', ctx.theme)
      const variant = getFeatureValue_CACHED_MAY_BE_STALE<
        'off' | 'copy_a' | 'copy_b'
      >('tengu_timber_lark', 'off')
      return variant === 'copy_b'
        ? isZh()
          ? `使用 ${blue('/loop 5m check the deploy')} 定时运行任何提示。设好就不用管了。`
          : `Use ${blue('/loop 5m check the deploy')} to run any prompt on a schedule. Set it and forget it.`
        : isZh()
          ? `${blue('/loop')} 可定时循环运行任何提示。适合监控部署、盯 PR 或轮询状态。`
          : `${blue('/loop')} runs any prompt on a recurring schedule. Great for monitoring deploys, babysitting PRs, or polling status.`
    },
    cooldownSessions: 3,
    isRelevant: async () => {
      if (!is1PApiCustomer()) return false
      if (!isKairosCronEnabled()) return false
      return (
        getFeatureValue_CACHED_MAY_BE_STALE<'off' | 'copy_a' | 'copy_b'>(
          'tengu_timber_lark',
          'off',
        ) !== 'off'
      )
    },
  },
  {
    id: 'guest-passes',
    content: async ctx => {
      const claude = color('claude', ctx.theme)
      const reward = getCachedReferrerReward()
      return reward
        ? isZh()
          ? `分享 Panda 赚取 ${claude(formatCreditAmount(reward))} 额外用量 · ${claude('/passes')}`
          : `Share Panda and earn ${claude(formatCreditAmount(reward))} of extra usage · ${claude('/passes')}`
        : isZh()
          ? `你有免费体验券可以分享 · ${claude('/passes')}`
          : `You have free guest passes to share · ${claude('/passes')}`
    },
    cooldownSessions: 3,
    isRelevant: async () => {
      const config = getGlobalConfig()
      if (config.hasVisitedPasses) {
        return false
      }
      const { eligible } = checkCachedPassesEligibility()
      return eligible
    },
  },
  {
    id: 'overage-credit',
    content: async ctx => {
      const claude = color('claude', ctx.theme)
      const info = getCachedOverageCreditGrant()
      const amount = info ? formatGrantAmount(info) : null
      if (!amount) return ''
      // Copy from "OC & Bulk Overages copy" doc (#5 — CLI Rotating tip)
      return isZh()
        ? `${claude(`${amount} 额外用量，免费赠送`)} · 第三方应用 · ${claude('/extra-usage')}`
        : `${claude(`${amount} in extra usage, on us`)} · third-party apps · ${claude('/extra-usage')}`
    },
    cooldownSessions: 3,
    isRelevant: async () => shouldShowOverageCreditUpsell(),
  },
  {
    id: 'feedback-command',
    content: async () => isZh()
      ? '使用 /feedback 帮助我们改进！'
      : 'Use /feedback to help us improve!',
    cooldownSessions: 15,
    async isRelevant() {
      if (process.env.USER_TYPE === 'ant') {
        return false
      }
      const config = getGlobalConfig()
      return config.numStartups > 5
    },
  },
]
const internalOnlyTips: Tip[] =
  process.env.USER_TYPE === 'ant'
    ? [
        {
          id: 'important-claudemd',
          content: async () => isZh()
            ? '[内部] 在 CLAUDE.md 中用 "IMPORTANT:" 前缀标记必须遵循的规则'
            : '[ANT-ONLY] Use "IMPORTANT:" prefix for must-follow CLAUDE.md rules',
          cooldownSessions: 30,
          isRelevant: async () => true,
        },
        {
          id: 'skillify',
          content: async () => isZh()
            ? '[内部] 在工作流结束时使用 /skillify 将其转化为可复用技能'
            : '[ANT-ONLY] Use /skillify at the end of a workflow to turn it into a reusable skill',
          cooldownSessions: 15,
          isRelevant: async () => true,
        },
      ]
    : []

function getCustomTips(): Tip[] {
  const settings = getInitialSettings()
  const override = settings.spinnerTipsOverride
  if (!override?.tips?.length) return []

  return override.tips.map((content, i) => ({
    id: `custom-tip-${i}`,
    content: async () => content,
    cooldownSessions: 0,
    isRelevant: async () => true,
  }))
}

export async function getRelevantTips(context?: TipContext): Promise<Tip[]> {
  const settings = getInitialSettings()
  const override = settings.spinnerTipsOverride
  const customTips = getCustomTips()

  // If excludeDefault is true and there are custom tips, skip built-in tips entirely
  if (override?.excludeDefault && customTips.length > 0) {
    return customTips
  }

  // Otherwise, filter built-in tips as before and combine with custom
  const tips = [...externalTips, ...internalOnlyTips]
  const isRelevant = await Promise.all(tips.map(_ => _.isRelevant(context)))
  const filtered = tips
    .filter((_, index) => isRelevant[index])
    .filter(_ => getSessionsSinceLastShown(_.id) >= _.cooldownSessions)

  return [...filtered, ...customTips]
}
