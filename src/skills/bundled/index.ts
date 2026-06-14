import { feature } from 'bun:bundle'
import { shouldAutoEnableClaudeInChrome } from 'src/utils/claudeInChrome/setup.js'
import { registerBatchSkill } from './batch.js'
import { registerCleanupSkill } from './cleanup.js'
import { registerClaudeInChromeSkill } from './claudeInChrome.js'
import { registerDebugSkill } from './debug.js'
import { registerHealthCheckSkill } from './healthCheck.js'
import { registerKeybindingsSkill } from './keybindings.js'
import { registerLoremIpsumSkill } from './loremIpsum.js'
import { registerMorningSkill } from './morning.js'
import { registerOrganizeSkill } from './organize.js'
import { registerRememberSkill } from './remember.js'
import { registerRemindSkill } from './remind.js'
import { registerCodeReviewSkill } from './code-review.js'
import { registerSkillifySkill } from './skillify.js'
import { registerStuckSkill } from './stuck.js'
import { registerUpdateConfigSkill } from './updateConfig.js'
import { registerCaptureSkill } from './capture.js'
import { registerLearnSkill } from './learn.js'
import { registerVerifySkill } from './verify.js'
import { registerWriteSkill } from './write.js'
import { registerWechatQuerySkill } from './wechatQuery.js'

/**
 * Initialize all bundled skills.
 * Called at startup to register skills that ship with the CLI.
 *
 * To add a new bundled skill:
 * 1. Create a new file in src/skills/bundled/ (e.g., myskill.ts)
 * 2. Export a register function that calls registerBundledSkill()
 * 3. Import and call that function here
 */
export function initBundledSkills(): void {
  registerUpdateConfigSkill()
  registerKeybindingsSkill()
  registerVerifySkill()
  registerDebugSkill()
  registerLoremIpsumSkill()
  registerSkillifySkill()
  registerRememberSkill()
  registerCodeReviewSkill()
  registerBatchSkill()
  registerStuckSkill()
  registerMorningSkill()
  registerOrganizeSkill()
  registerCleanupSkill()
  registerHealthCheckSkill()
  registerRemindSkill()
  registerWriteSkill()
  registerCaptureSkill()
  registerLearnSkill()
  registerWechatQuerySkill()
  // Panda: /dream skill available unconditionally — memory consolidation
  // should be accessible to all users, not just KAIROS mode.
  {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerDreamSkill } = require('./dream.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerDreamSkill()
  }
  if (feature('REVIEW_ARTIFACT')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerHunterSkill } = require('./hunter.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerHunterSkill()
  }
  if (feature('AGENT_TRIGGERS')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerLoopSkill } = require('./loop.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    // /loop's isEnabled delegates to isKairosCronEnabled() — same lazy
    // per-invocation pattern as the cron tools. Registered unconditionally;
    // the skill's own isEnabled callback decides visibility.
    registerLoopSkill()
  }
  if (feature('AGENT_TRIGGERS_REMOTE')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const {
      registerScheduleRemoteAgentsSkill,
    } = require('./scheduleRemoteAgents.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerScheduleRemoteAgentsSkill()
  }
  if (feature('BUILDING_CLAUDE_APPS')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerClaudeApiSkill } = require('./claudeApi.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerClaudeApiSkill()
  }
  if (shouldAutoEnableClaudeInChrome()) {
    registerClaudeInChromeSkill()
  }
  if (feature('RUN_SKILL_GENERATOR')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { registerRunSkillGeneratorSkill } = require('./runSkillGenerator.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    registerRunSkillGeneratorSkill()
  }
}
