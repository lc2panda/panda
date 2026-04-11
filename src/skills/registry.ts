// Input: (none — static index) / skill name for lookup
// Output: BundledSkillMeta[] (level-1 index) / Command (level-2 full load)
// Pos: bundled skills Progressive Disclosure 两级加载索引层
//
// Hermes Progressive Disclosure — Two-Level Skill Loading
// =======================================================
// Level 1 (index):   `BUNDLED_SKILL_INDEX` — pure static `{name, description}`
//                    array. Zero I/O, zero skill-module imports, <1ms cold
//                    cost per entry. Consumers can list / route / describe
//                    skills without paying the full body cost.
// Level 2 (payload): `meta.load()` — dynamic-imports the skill module, runs
//                    its `registerXxxSkill()` which pushes into the
//                    `bundledSkills` registry, and returns the resulting
//                    `Command`. First-call cost pays for that skill only;
//                    subsequent calls reuse the already-registered Command.
//
// Design contract:
//   - This module MUST NOT statically import any file under `./bundled/`.
//     Doing so defeats the whole purpose — we would re-enter the all-up-front
//     load path that `initBundledSkills()` currently performs.
//   - Descriptions here are the *static fallback* used for routing/help.
//     A few skills (verify, debug, claude-api) compute their true description
//     at register time; after the skill is loaded via `load()`, downstream
//     code should prefer `Command.description` from `getBundledSkills()`.
//   - `initBundledSkills()` (src/skills/bundled/index.ts) is the legacy full
//     eager path. It remains untouched so every existing consumer that reads
//     `getBundledSkills()` keeps working. This index is an *additional*
//     level-1 entry point, not a replacement.
//
// Reference: Hermes Agent research — monitor/hermes-agent-research.md
//            (Skills Progressive Disclosure two-level loading).

import type { Command } from '../types/command.js'
import { getBundledSkills } from './bundledSkills.js'

/**
 * Level-1 metadata for a bundled skill.
 *
 * This is the lightweight index entry loaded at startup. It carries only
 * what's needed to route, list, and describe skills — the full skill body
 * (prompt generator, helper functions, reference files) is fetched on
 * demand via `load()`.
 */
export interface BundledSkillMeta {
  /** Stable skill identifier used in slash commands and routing. */
  name: string
  /** Short human-readable description (static fallback — see notes above). */
  description: string
  /**
   * Level-2 loader: dynamic-import the skill module and return the fully
   * registered `Command`. Idempotent — if the skill has already been loaded
   * (e.g. via the legacy `initBundledSkills()` path), returns the existing
   * registry entry without re-importing.
   *
   * Returns `null` only if the skill module loads but fails to register
   * itself (e.g. an env-gated skill whose `registerXxxSkill()` no-ops).
   */
  load: () => Promise<Command | null>
}

/**
 * Look up a skill in the runtime registry by name. Returns `null` if it
 * hasn't been registered yet (i.e. neither the legacy eager path nor any
 * prior `meta.load()` call has touched it).
 */
function findRegistered(name: string): Command | null {
  return getBundledSkills().find(c => c.name === name) ?? null
}

/**
 * Build a Level-2 loader that dynamic-imports the given module path and
 * calls the named register function. If the skill is already registered
 * we skip the import entirely.
 */
function makeLoader(
  name: string,
  modulePath: string,
  registerFnName: string,
): () => Promise<Command | null> {
  return async () => {
    const already = findRegistered(name)
    if (already) return already
    // Dynamic import keeps this module free of static skill deps.
    // The register function pushes into `bundledSkills` as a side effect.
    const mod = (await import(modulePath)) as Record<string, unknown>
    const fn = mod[registerFnName]
    if (typeof fn === 'function') {
      ;(fn as () => void)()
    }
    return findRegistered(name)
  }
}

/**
 * Level-1 static index of every bundled skill that ships with panda-code.
 *
 * Ordering mirrors `initBundledSkills()` in `bundled/index.ts` for
 * maintainability — when you add a skill there, add the matching entry here.
 *
 * IMPORTANT: keep this array **purely static**. No imports, no computed
 * descriptions, no `process.env` reads at module top-level. That's the whole
 * point of the index — it must be cheap enough to scale to 100+ skills.
 */
export const BUNDLED_SKILL_INDEX: readonly BundledSkillMeta[] = [
  {
    name: 'update-config',
    description:
      'Configure the Panda harness via settings.json — hooks, permissions, env vars · 配置 Panda harness (settings.json) — hooks/权限/环境变量',
    load: makeLoader(
      'update-config',
      './bundled/updateConfig.js',
      'registerUpdateConfigSkill',
    ),
  },
  {
    name: 'keybindings-help',
    description:
      'Customize keyboard shortcuts, rebind keys, add chord bindings, or modify ~/.pandacc/keybindings.json',
    load: makeLoader(
      'keybindings-help',
      './bundled/keybindings.js',
      'registerKeybindingsSkill',
    ),
  },
  {
    name: 'verify',
    description:
      'Verify a code change does what it should by running the app · 运行应用验证代码变更是否符合预期',
    load: makeLoader('verify', './bundled/verify.js', 'registerVerifySkill'),
  },
  {
    name: 'debug',
    description:
      'Enable debug logging for this session and help diagnose issues · 启用调试日志并帮助诊断问题',
    load: makeLoader('debug', './bundled/debug.js', 'registerDebugSkill'),
  },
  {
    name: 'lorem-ipsum',
    description:
      'Generate filler text for long context testing. Specify token count as argument (e.g., /lorem-ipsum 50000).',
    load: makeLoader(
      'lorem-ipsum',
      './bundled/loremIpsum.js',
      'registerLoremIpsumSkill',
    ),
  },
  {
    name: 'skillify',
    description:
      'Turn an ad-hoc workflow into a reusable bundled skill · 将临时工作流固化为可复用的 bundled skill',
    load: makeLoader(
      'skillify',
      './bundled/skillify.js',
      'registerSkillifySkill',
    ),
  },
  {
    name: 'remember',
    description:
      'Review auto-memory entries and propose promotions to CLAUDE.md · 审查自动记忆条目并提议升级到 CLAUDE.md',
    load: makeLoader(
      'remember',
      './bundled/remember.js',
      'registerRememberSkill',
    ),
  },
  {
    name: 'simplify',
    description:
      'Review changed code for reuse, quality, and efficiency, then fix any issues found · 审查变更代码的复用性、质量和效率，修复发现的问题',
    load: makeLoader(
      'simplify',
      './bundled/simplify.js',
      'registerSimplifySkill',
    ),
  },
  {
    name: 'batch',
    description:
      'Research and plan a large-scale change, then execute it in parallel across isolated worktree agents · 调研并规划大规模变更，在隔离的工作树 Agent 中并行执行',
    load: makeLoader('batch', './bundled/batch.js', 'registerBatchSkill'),
  },
  {
    name: 'stuck',
    description:
      'Investigate frozen/stuck/slow Panda sessions on this machine and post a diagnostic report.',
    load: makeLoader('stuck', './bundled/stuck.js', 'registerStuckSkill'),
  },
  {
    name: 'morning',
    description:
      'Generate a morning briefing — yesterday summary, open TODOs, today priorities, project status.',
    load: makeLoader('morning', './bundled/morning.js', 'registerMorningSkill'),
  },
  {
    name: 'organize',
    description:
      'Analyze a directory structure and suggest cleanup · 分析目录结构并建议整理',
    load: makeLoader(
      'organize',
      './bundled/organize.js',
      'registerOrganizeSkill',
    ),
  },
  {
    name: 'cleanup',
    description: 'Clean temporary files · 清理临时文件',
    load: makeLoader('cleanup', './bundled/cleanup.js', 'registerCleanupSkill'),
  },
  {
    name: 'health-check',
    description:
      'Quick project health diagnosis — git status, dependency freshness, security hints, lint status · 快速项目健康诊断',
    load: makeLoader(
      'health-check',
      './bundled/healthCheck.js',
      'registerHealthCheckSkill',
    ),
  },
  {
    name: 'remind',
    description:
      'Set a reminder using natural language time · 用自然语言设置提醒',
    load: makeLoader('remind', './bundled/remind.js', 'registerRemindSkill'),
  },
  {
    name: 'write',
    description:
      'Generate writing outlines or compile markdown projects · 生成写作大纲或编译 Markdown 写作项目',
    load: makeLoader('write', './bundled/write.js', 'registerWriteSkill'),
  },
  {
    name: 'capture',
    description:
      'Quick-capture an idea or note to working directory · 快速捕获想法到工作目录',
    load: makeLoader('capture', './bundled/capture.js', 'registerCaptureSkill'),
  },
  {
    name: 'learn',
    description:
      'Learning assistant — flashcards, spaced review, study plans · 学习助手 — 闪卡生成、间隔复习、学习路径规划',
    load: makeLoader('learn', './bundled/learn.js', 'registerLearnSkill'),
  },
  {
    name: 'wechat',
    description:
      'Query WeChat data — sessions, chat history, contacts, search · 微信数据查询',
    load: makeLoader(
      'wechat',
      './bundled/wechatQuery.js',
      'registerWechatQuerySkill',
    ),
  },
  {
    name: 'dream',
    description:
      'Run a memory consolidation pass — synthesize recent learnings into durable memories · 运行记忆整合',
    load: makeLoader('dream', './bundled/dream.js', 'registerDreamSkill'),
  },
  {
    name: 'hunter',
    description:
      'Hunt for real bugs in your code changes using parallel analysis agents · 使用并行分析 Agent 在代码变更中寻找真实 Bug',
    load: makeLoader('hunter', './bundled/hunter.js', 'registerHunterSkill'),
  },
  {
    name: 'loop',
    description:
      'Run a prompt or slash command on a recurring interval · 定时循环运行提示或命令',
    load: makeLoader('loop', './bundled/loop.js', 'registerLoopSkill'),
  },
  {
    name: 'schedule',
    description:
      'Create, update, list, or run scheduled remote agents (triggers) that execute on a cron schedule.',
    load: makeLoader(
      'schedule',
      './bundled/scheduleRemoteAgents.js',
      'registerScheduleRemoteAgentsSkill',
    ),
  },
  {
    name: 'claude-api',
    description:
      'Build apps with the Claude API or Anthropic SDK — prompt caching, tool use, batches, files, streaming, agents.',
    load: makeLoader(
      'claude-api',
      './bundled/claudeApi.js',
      'registerClaudeApiSkill',
    ),
  },
  {
    name: 'claude-in-chrome',
    description:
      'Automates your Chrome browser to interact with web pages · 自动化 Chrome 浏览器与网页交互',
    load: makeLoader(
      'claude-in-chrome',
      './bundled/claudeInChrome.js',
      'registerClaudeInChromeSkill',
    ),
  },
  {
    name: 'run-skill-generator',
    description:
      'Build and run a local skill generator project — scaffolds new bundled skills from templates.',
    load: makeLoader(
      'run-skill-generator',
      './bundled/runSkillGenerator.js',
      'registerRunSkillGeneratorSkill',
    ),
  },
]

/**
 * Level-1 helper: resolve a skill's description without paying the load cost.
 * Returns `null` if no such skill is indexed.
 *
 * Use this for routing, help text, autocomplete — anywhere you only need
 * the blurb, not the full prompt generator.
 */
export function getSkillDescription(name: string): string | null {
  const meta = BUNDLED_SKILL_INDEX.find(m => m.name === name)
  return meta?.description ?? null
}

/**
 * Level-1 helper: look up a skill's full index entry by name. Returns `null`
 * if the skill is not indexed. Callers that need the full `Command` should
 * `await meta.load()` on the returned entry.
 */
export function findSkillMeta(name: string): BundledSkillMeta | null {
  return BUNDLED_SKILL_INDEX.find(m => m.name === name) ?? null
}

/**
 * Level-1 helper: list every indexed skill's `{name, description}`. Zero
 * I/O, zero dynamic imports — safe to call from hot paths like typeahead.
 */
export function listSkillIndex(): ReadonlyArray<{
  name: string
  description: string
}> {
  return BUNDLED_SKILL_INDEX.map(m => ({
    name: m.name,
    description: m.description,
  }))
}
