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

  test('settings.json 不存在 → 创建并写入全部 16 项', () => {
    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    expect(result.newlyAddedKeys.length).toBe(
      Object.keys(PANDA_DEFAULTS).length,
    )
    expect(result.newlyAddedKeys.length).toBe(16)

    const path = join(tmpRoot, 'settings.json')
    expect(existsSync(path)).toBe(true)
    const written = JSON.parse(readFileSync(path, 'utf-8'))
    for (const key of Object.keys(PANDA_DEFAULTS)) {
      expect(written.env[key]).toBe(
        PANDA_DEFAULTS[key as keyof typeof PANDA_DEFAULTS],
      )
    }
  })

  test('已有全部 key → 幂等（no write，newlyAddedKeys 为空）', () => {
    const path = join(tmpRoot, 'settings.json')
    const preset = {
      env: { ...PANDA_DEFAULTS, PANDA_FORCE_CACHE_STRATEGY: 'implicit' },
    }
    writeFileSync(path, JSON.stringify(preset, null, 2), 'utf-8')
    const mtimeBefore = readFileSync(path, 'utf-8')

    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    expect(result.newlyAddedKeys).toEqual([])

    const mtimeAfter = readFileSync(path, 'utf-8')
    expect(mtimeAfter).toBe(mtimeBefore)
    // 用户自定义的 implicit 不被强制改成 explicit
    const parsed = JSON.parse(mtimeAfter)
    expect(parsed.env.PANDA_FORCE_CACHE_STRATEGY).toBe('implicit')
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
    // 补了 16 - 2 = 14 项（PANDA_THEME / PANDA_FORCE_CACHE_STRATEGY 已存在）
    expect(result.newlyAddedKeys.length).toBe(14)
    expect(result.newlyAddedKeys).not.toContain('PANDA_THEME')
    expect(result.newlyAddedKeys).not.toContain('PANDA_FORCE_CACHE_STRATEGY')

    const written = JSON.parse(readFileSync(path, 'utf-8'))
    // 已有值保留
    expect(written.env.PANDA_THEME).toBe('dracula')
    expect(written.env.PANDA_FORCE_CACHE_STRATEGY).toBe('implicit')
    expect(written.env.ANTHROPIC_AUTH_TOKEN).toBe('user-secret')
    // 补齐值写入
    expect(written.env.PANDA_DEBUG).toBe('1')
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

  test('空 settings.json 文件 → 当作 {} 处理并补齐全部', () => {
    const path = join(tmpRoot, 'settings.json')
    writeFileSync(path, '', 'utf-8')

    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    expect(result.newlyAddedKeys.length).toBe(16)
    const written = JSON.parse(readFileSync(path, 'utf-8'))
    expect(written.env.PANDA_THEME).toBe('matrix')
  })

  test('跨平台路径 — PANDA_CONFIG_DIR 不存在时创建目录递归', () => {
    // 嵌套两层不存在的目录
    const deep = join(tmpRoot, 'nested', 'deeper')
    process.env.PANDA_CONFIG_DIR = deep
    const result = initDefaultPandaccSettings({ silent: true })
    expect(result.skipped).toBe(false)
    expect(existsSync(join(deep, 'settings.json'))).toBe(true)
  })
})
