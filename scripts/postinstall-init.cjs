#!/usr/bin/env node
// Input: 无
// Output: 向 ~/.pandacc/settings.json 补齐 17 项 PANDA_* 默认 env（幂等，不覆盖）
// Pos: npm postinstall 钩子，用户 npm/pnpm/yarn 安装 @lc2panda/panda-code 时自动执行
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"
//
// 跨平台约束:
//   - 纯 Node.js 标准库 (fs / path / os)，不依赖 Bun / 第三方
//   - 不 chmod，不 symlink，不 shell
//   - os.homedir() 自动映射到 Mac/Linux HOME 或 Windows %USERPROFILE%
//   - path.join 自动使用平台分隔符

'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')

// 与 src/utils/initPandaccSettings.ts 的 PANDA_DEFAULTS 保持一致。
// 任何修改同步两边（rg "PANDA_DEFAULTS" 审查）。
const PANDA_DEFAULTS = {
  PANDA_SECURITY_RESEARCH: '1',
  PANDA_HIDE_CONTEXT_WARNING: '1',
  PANDA_NO_AUTO_COLLAPSE: '1',
  PANDA_SHOW_DEVBAR: '1',
  PANDA_DEBUG: '1',
  PANDA_THEME: 'matrix',
  PANDA_CONFIG_DIR: '~/.pandacc',
  PANDA_MODEL_ROUTING: '1',
  PANDA_CONTEXT_COLLAPSE: '1',
  PANDA_AGENT_MAX_TURNS: '10',
  PANDA_AGENT_PER_TURN_LIMIT: '2',
  PANDA_AGENT_TIMEOUT_MS: '0',
  PANDA_FORK_TIMEOUT_MS: '0',
  PANDA_CACHE_TEXT_KEEP_LAST: '5',
  PANDA_CACHE_TEXT_MIN_SIZE: '1500',
  PANDA_FORCE_CACHE_STRATEGY: 'explicit',
  PANDA_SKILL_LEARNING_TEST: '1',
}

function resolveConfigDir() {
  const raw =
    process.env.PANDA_CONFIG_DIR ||
    process.env.CLAUDE_CONFIG_DIR ||
    path.join(os.homedir(), '.pandacc')
  if (raw.charAt(0) === '~') {
    const rest = raw.slice(1).replace(/^[\\/]/, '')
    return path.join(os.homedir(), rest)
  }
  return raw
}

function main() {
  if (process.env.PANDA_SKIP_AUTO_INIT === '1') {
    return
  }

  const configDir = resolveConfigDir()
  const settingsPath = path.join(configDir, 'settings.json')

  let settings = {}
  if (fs.existsSync(settingsPath)) {
    try {
      const raw = fs.readFileSync(settingsPath, { encoding: 'utf-8' })
      const trimmed = raw.trim()
      if (trimmed.length > 0) {
        const parsed = JSON.parse(trimmed)
        if (
          parsed !== null &&
          typeof parsed === 'object' &&
          !Array.isArray(parsed)
        ) {
          settings = parsed
        } else {
          // 合法 JSON 但不是 object，不破坏用户文件，直接退出
          return
        }
      }
    } catch (_e) {
      // 解析失败不 crash 安装
      return
    }
  }

  const existingEnv =
    settings.env &&
    typeof settings.env === 'object' &&
    !Array.isArray(settings.env)
      ? settings.env
      : {}

  const mergedEnv = Object.assign({}, existingEnv)
  const newlyAddedKeys = []
  for (const key of Object.keys(PANDA_DEFAULTS)) {
    if (!Object.hasOwn(mergedEnv, key)) {
      mergedEnv[key] = PANDA_DEFAULTS[key]
      newlyAddedKeys.push(key)
    }
  }

  if (newlyAddedKeys.length === 0) {
    return
  }

  const nextSettings = Object.assign({}, settings, { env: mergedEnv })

  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(nextSettings, null, 2) + '\n',
      { encoding: 'utf-8' },
    )
    // 仅打印数量，不打印 value
    // eslint-disable-next-line no-console
    console.log(
      '[Panda] 初始化 ' +
        newlyAddedKeys.length +
        ' 项默认 env 到 settings.json (postinstall)',
    )
  } catch (_e) {
    // 权限不足等 — 静默 skip，不阻塞 npm install
    return
  }
}

try {
  main()
} catch (_e) {
  // 绝不让 postinstall 失败阻塞 npm install
}
