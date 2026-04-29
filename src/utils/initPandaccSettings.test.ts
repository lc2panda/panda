// Input: initDefaultPandaccSettings() 各路径
// Output: 验证新用户补齐、幂等、部分补齐、坏 JSON、skip 开关
// Pos: src/utils/ 单元测试
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  initDefaultPandaccSettings,
  PANDA_DEFAULTS,
  SETTINGS_DEFAULTS,
} from './initPandaccSettings.js'

describe('initDefaultPandaccSettings', () => {
  let tmpRoot: string
  const SAVED_ENV = {
    PANDA_CONFIG_DIR: process.env.PANDA_CONFIG_DIR,
    CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR,
    PANDA_SKIP_AUTO_INIT: process.env.PANDA_SKIP_AUTO_INIT,
  }

  beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'pandacc-init-test-'))
    process.env.PANDA_CONFIG_DIR = tmpRoot
    delete process.env.CLAUDE_CONFIG_DIR
    delete process.env.PANDA_SKIP_AUTO_INIT
  })

  afterEach(() => {
    try {
      rmSync(tmpRoot, { recursive: true, force: true })
    } catch {}
    // 恢复 env
    for (const [k, v] of Object.entries(SAVED_ENV)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  })

  test('settings.json 不存在 → 创建并写入全部 17 项 env + 顶层 SETTINGS_DEFAULTS', () => {
    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    expect(result.newlyAddedKeys.length).toBe(
      Object.keys(PANDA_DEFAULTS).length,
    )
    // v2.25.53+: 17 项（v2.21.5 移除 PANDA_CONFIG_DIR；后续未增减）
    expect(result.newlyAddedKeys.length).toBe(17)
    expect(result.newlyAddedTopLevelKeys.length).toBe(
      Object.keys(SETTINGS_DEFAULTS).length,
    )

    const path = join(tmpRoot, 'settings.json')
    expect(existsSync(path)).toBe(true)
    const written = JSON.parse(readFileSync(path, 'utf-8'))
    for (const key of Object.keys(PANDA_DEFAULTS)) {
      expect(written.env[key]).toBe(
        PANDA_DEFAULTS[key as keyof typeof PANDA_DEFAULTS],
      )
    }
    // 顶层默认值 — 全部按 SETTINGS_DEFAULTS 写入
    for (const [key, val] of Object.entries(SETTINGS_DEFAULTS)) {
      expect(written[key]).toEqual(val)
    }
    // 关键保守默认显式断言
    expect(written.enableModelRouting).toBe(false)
    expect(written.autoMemoryEnabled).toBe(true)
    expect(written.outputCompression).toEqual({ enabled: true })
  })

  test('已有全部 key（含顶层）→ 幂等（no write，newlyAddedKeys 为空）', () => {
    const path = join(tmpRoot, 'settings.json')
    const preset = {
      env: { ...PANDA_DEFAULTS, PANDA_FORCE_CACHE_STRATEGY: 'implicit' },
      ...SETTINGS_DEFAULTS,
    }
    writeFileSync(path, JSON.stringify(preset, null, 2), 'utf-8')
    const mtimeBefore = readFileSync(path, 'utf-8')

    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    expect(result.newlyAddedKeys).toEqual([])
    expect(result.newlyAddedTopLevelKeys).toEqual([])

    const mtimeAfter = readFileSync(path, 'utf-8')
    expect(mtimeAfter).toBe(mtimeBefore)
    // 用户自定义的 implicit 不被强制改成 explicit
    const parsed = JSON.parse(mtimeAfter)
    expect(parsed.env.PANDA_FORCE_CACHE_STRATEGY).toBe('implicit')
  })

  test('用户已显式开启 enableModelRouting=true → 不被覆盖回 false', () => {
    const path = join(tmpRoot, 'settings.json')
    const preset = {
      env: { ...PANDA_DEFAULTS },
      enableModelRouting: true, // 用户显式开启
      autoMemoryEnabled: false, // 用户显式关闭
      outputCompression: { enabled: false, level: 'aggressive' },
    }
    writeFileSync(path, JSON.stringify(preset, null, 2), 'utf-8')

    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    expect(result.newlyAddedKeys).toEqual([])
    expect(result.newlyAddedTopLevelKeys).toEqual([])

    const written = JSON.parse(readFileSync(path, 'utf-8'))
    expect(written.enableModelRouting).toBe(true)
    expect(written.autoMemoryEnabled).toBe(false)
    expect(written.outputCompression).toEqual({
      enabled: false,
      level: 'aggressive',
    })
  })

  test('部分顶层缺失 → 只补缺失项，不动已有顶层字段', () => {
    const path = join(tmpRoot, 'settings.json')
    const preset = {
      env: { ...PANDA_DEFAULTS },
      autoMemoryEnabled: false, // 用户已设
      // enableModelRouting / outputCompression 缺失 → 应被补默认
    }
    writeFileSync(path, JSON.stringify(preset, null, 2), 'utf-8')

    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    expect(result.newlyAddedTopLevelKeys.sort()).toEqual(
      ['enableModelRouting', 'outputCompression'].sort(),
    )

    const written = JSON.parse(readFileSync(path, 'utf-8'))
    expect(written.autoMemoryEnabled).toBe(false) // 用户值保留
    expect(written.enableModelRouting).toBe(false) // 默认补齐
    expect(written.outputCompression).toEqual({ enabled: true })
  })

  test('部分缺失 → 只补缺失项，不动已有', () => {
    const path = join(tmpRoot, 'settings.json')
    const preset = {
      env: {
        PANDA_THEME: 'dracula', // 用户自定义
        PANDA_FORCE_CACHE_STRATEGY: 'implicit',
        ANTHROPIC_AUTH_TOKEN: 'user-secret',
      },
      permissions: { allow: ['Bash(ls:*)'] },
    }
    writeFileSync(path, JSON.stringify(preset, null, 2), 'utf-8')

    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    // v2.25.53+: 17 - 2 = 15 项（PANDA_THEME / PANDA_FORCE_CACHE_STRATEGY 已存在）
    expect(result.newlyAddedKeys.length).toBe(15)
    expect(result.newlyAddedKeys).not.toContain('PANDA_THEME')
    expect(result.newlyAddedKeys).not.toContain('PANDA_FORCE_CACHE_STRATEGY')

    const written = JSON.parse(readFileSync(path, 'utf-8'))
    // 已有值保留
    expect(written.env.PANDA_THEME).toBe('dracula')
    expect(written.env.PANDA_FORCE_CACHE_STRATEGY).toBe('implicit')
    expect(written.env.ANTHROPIC_AUTH_TOKEN).toBe('user-secret')
    // 补齐值写入 — v2.25.53+ PANDA_DEBUG 默认从 '1' 降到 '0'
    expect(written.env.PANDA_DEBUG).toBe('0')
    expect(written.env.PANDA_CACHE_TEXT_MIN_SIZE).toBe('1500')
    // 非 env 字段保留
    expect(written.permissions.allow).toEqual(['Bash(ls:*)'])
  })

  test('JSON 解析失败 → skipped=true，不 crash，不覆盖原文件', () => {
    const path = join(tmpRoot, 'settings.json')
    const broken = '{"env": { invalid json ]'
    writeFileSync(path, broken, 'utf-8')

    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(true)
    expect(result.newlyAddedKeys).toEqual([])
    // 原文件不变
    expect(readFileSync(path, 'utf-8')).toBe(broken)
  })

  test('PANDA_SKIP_AUTO_INIT=1 → 直接 skipped，不创建文件', () => {
    process.env.PANDA_SKIP_AUTO_INIT = '1'
    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(true)
    expect(result.newlyAddedKeys).toEqual([])
    expect(existsSync(join(tmpRoot, 'settings.json'))).toBe(false)
  })

  test('settings.json 根为数组（非对象）→ skipped，不破坏', () => {
    const path = join(tmpRoot, 'settings.json')
    const arr = '[1,2,3]'
    writeFileSync(path, arr, 'utf-8')

    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(true)
    expect(readFileSync(path, 'utf-8')).toBe(arr)
  })

  test('空 settings.json 文件 → 当作 {} 处理并补齐全部 env + 顶层', () => {
    const path = join(tmpRoot, 'settings.json')
    writeFileSync(path, '', 'utf-8')

    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    expect(result.newlyAddedKeys.length).toBe(17)
    expect(result.newlyAddedTopLevelKeys.length).toBe(
      Object.keys(SETTINGS_DEFAULTS).length,
    )
    const written = JSON.parse(readFileSync(path, 'utf-8'))
    expect(written.env.PANDA_THEME).toBe('matrix')
    expect(written.enableModelRouting).toBe(false)
  })

  test('跨平台路径 — PANDA_CONFIG_DIR 不存在时创建目录递归', () => {
    // 嵌套两层不存在的目录
    const deep = join(tmpRoot, 'nested', 'deeper')
    process.env.PANDA_CONFIG_DIR = deep
    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    expect(existsSync(join(deep, 'settings.json'))).toBe(true)
  })

  // ─── v2.25.53+ 长跑爆点修复 ──────────────────────────────────────────
  test('v2.25.53+ 默认值：PANDA_DEBUG=0 / TIMEOUT=600000 / FORK_TIMEOUT=600000', () => {
    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    const written = JSON.parse(
      readFileSync(join(tmpRoot, 'settings.json'), 'utf-8'),
    )
    // 这三项必须按新默认写入（首次安装的新用户拿到的应是降级后的安全默认）
    expect(written.env.PANDA_DEBUG).toBe('0')
    expect(written.env.PANDA_AGENT_TIMEOUT_MS).toBe('600000')
    expect(written.env.PANDA_FORK_TIMEOUT_MS).toBe('600000')
    // 其他保持的字段验证（防止误改）
    expect(written.env.PANDA_AGENT_MAX_TURNS).toBe('200')
    expect(written.env.PANDA_THEME).toBe('matrix')
  })

  test('v2.25.53+ migration：旧 PANDA_AGENT_TIMEOUT_MS=0 → 600000', () => {
    const path = join(tmpRoot, 'settings.json')
    writeFileSync(
      path,
      JSON.stringify(
        {
          env: { ...PANDA_DEFAULTS, PANDA_AGENT_TIMEOUT_MS: '0' },
        },
        null,
        2,
      ),
      'utf-8',
    )
    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    // newlyAddedKeys 不应含已存在的 PANDA_AGENT_TIMEOUT_MS（migration ≠ add）
    expect(result.newlyAddedKeys).not.toContain('PANDA_AGENT_TIMEOUT_MS')

    const written = JSON.parse(readFileSync(path, 'utf-8'))
    expect(written.env.PANDA_AGENT_TIMEOUT_MS).toBe('600000')
  })

  test('v2.25.53+ migration：旧 PANDA_FORK_TIMEOUT_MS=0 → 600000', () => {
    const path = join(tmpRoot, 'settings.json')
    writeFileSync(
      path,
      JSON.stringify(
        {
          env: { ...PANDA_DEFAULTS, PANDA_FORK_TIMEOUT_MS: '0' },
        },
        null,
        2,
      ),
      'utf-8',
    )
    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    const written = JSON.parse(readFileSync(path, 'utf-8'))
    expect(written.env.PANDA_FORK_TIMEOUT_MS).toBe('600000')
  })

  test('v2.25.53+ migration 不动 PANDA_DEBUG（用户可能故意开诊断模式）', () => {
    const path = join(tmpRoot, 'settings.json')
    writeFileSync(
      path,
      JSON.stringify(
        {
          env: { ...PANDA_DEFAULTS, PANDA_DEBUG: '1' },
        },
        null,
        2,
      ),
      'utf-8',
    )
    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    const written = JSON.parse(readFileSync(path, 'utf-8'))
    // 用户已显式 '1' 不被 migration 覆盖
    expect(written.env.PANDA_DEBUG).toBe('1')
  })

  test('v2.25.53+ 用户已显式设 TIMEOUT=300000 → 不被 migration 覆盖', () => {
    const path = join(tmpRoot, 'settings.json')
    writeFileSync(
      path,
      JSON.stringify(
        {
          env: {
            ...PANDA_DEFAULTS,
            PANDA_AGENT_TIMEOUT_MS: '300000',
            PANDA_FORK_TIMEOUT_MS: '900000',
          },
        },
        null,
        2,
      ),
      'utf-8',
    )
    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    const written = JSON.parse(readFileSync(path, 'utf-8'))
    // 非 '0' 的旧值不应被 migration 覆盖
    expect(written.env.PANDA_AGENT_TIMEOUT_MS).toBe('300000')
    expect(written.env.PANDA_FORK_TIMEOUT_MS).toBe('900000')
  })
})
