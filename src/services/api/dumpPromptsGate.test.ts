// Input: 静态读取 src/query.ts 源码 + 模拟 isEnvTruthy 表达式
// Output: 守护 v2.25.53+ dump-prompts 默认关闭 — query.ts 必须双 gate（isAnt &&
//          PANDA_DUMP_PROMPTS）才创建 dumpPromptsFetch；PANDA_DUMP_PROMPTS 未设
//          → undefined（不走 dump 路径）；显式设为 '1' → 走 dump
// Pos: src/services/api/ 单元测试 — 与 dumpPrompts.test.ts 同级
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'fs'
import { join } from 'path'
import { isEnvTruthy } from '../../utils/envUtils.js'

describe('v2.25.53+ dumpPromptsFetch gate — 双 gate（isAnt && PANDA_DUMP_PROMPTS）', () => {
  test('query.ts 源码包含 isEnvTruthy(process.env.PANDA_DUMP_PROMPTS) 的 gate', () => {
    // 静态守护：避免回归把 gate 退回单条件 isAnt
    const src = readFileSync(
      join(import.meta.dir, '..', '..', 'query.ts'),
      'utf-8',
    )
    expect(src).toContain('isEnvTruthy(process.env.PANDA_DUMP_PROMPTS)')
    // 同时确保 createDumpPromptsFetch 的 gate 仍受 isAnt 双重约束
    expect(src).toMatch(
      /config\.gates\.isAnt\s*&&\s*isEnvTruthy\(process\.env\.PANDA_DUMP_PROMPTS\)/,
    )
  })

  test('PANDA_DUMP_PROMPTS 未设 → isEnvTruthy 返回 false', () => {
    const orig = process.env.PANDA_DUMP_PROMPTS
    try {
      delete process.env.PANDA_DUMP_PROMPTS
      expect(isEnvTruthy(process.env.PANDA_DUMP_PROMPTS)).toBe(false)
    } finally {
      if (orig === undefined) delete process.env.PANDA_DUMP_PROMPTS
      else process.env.PANDA_DUMP_PROMPTS = orig
    }
  })

  test('PANDA_DUMP_PROMPTS=1 → isEnvTruthy 返回 true', () => {
    const orig = process.env.PANDA_DUMP_PROMPTS
    try {
      process.env.PANDA_DUMP_PROMPTS = '1'
      expect(isEnvTruthy(process.env.PANDA_DUMP_PROMPTS)).toBe(true)
    } finally {
      if (orig === undefined) delete process.env.PANDA_DUMP_PROMPTS
      else process.env.PANDA_DUMP_PROMPTS = orig
    }
  })

  test('PANDA_DUMP_PROMPTS=true / yes / on 都被识别为开启', () => {
    const orig = process.env.PANDA_DUMP_PROMPTS
    try {
      for (const v of ['true', 'yes', 'on', 'TRUE', '  1  ', 'On']) {
        process.env.PANDA_DUMP_PROMPTS = v
        expect(isEnvTruthy(process.env.PANDA_DUMP_PROMPTS)).toBe(true)
      }
    } finally {
      if (orig === undefined) delete process.env.PANDA_DUMP_PROMPTS
      else process.env.PANDA_DUMP_PROMPTS = orig
    }
  })

  test('PANDA_DUMP_PROMPTS=0 / false / 空串 → 不开启', () => {
    const orig = process.env.PANDA_DUMP_PROMPTS
    try {
      for (const v of ['0', 'false', 'no', 'off', '']) {
        process.env.PANDA_DUMP_PROMPTS = v
        expect(isEnvTruthy(process.env.PANDA_DUMP_PROMPTS)).toBe(false)
      }
    } finally {
      if (orig === undefined) delete process.env.PANDA_DUMP_PROMPTS
      else process.env.PANDA_DUMP_PROMPTS = orig
    }
  })
})
