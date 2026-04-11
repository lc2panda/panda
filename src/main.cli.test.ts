// Input: 构建产物 dist/cli.js
// Output: 对 4 个数据连接器子命令注册存在性的 bun:test 断言
// Pos: Wave 3 Agent L 交付——验证 commander 注册层暴露 history/calendar/notes/memory

import { test, expect } from 'bun:test'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const DIST_CLI = join(process.cwd(), 'dist/cli.js')
const HAS_BUILD = existsSync(DIST_CLI)

function runHelp(args: string[]): string {
  const res = spawnSync('bun', [DIST_CLI, ...args, '--help'], {
    encoding: 'utf-8',
    timeout: 30000,
    env: { ...process.env, PANDA_NO_AUTO_UPDATE: '1' },
  })
  return `${res.stdout || ''}\n${res.stderr || ''}`
}

test.if(HAS_BUILD)('panda history digest 已注册', () => {
  const out = runHelp(['history'])
  expect(out).toContain('digest')
  expect(out).toMatch(/Chrome|浏览器/)
})

test.if(HAS_BUILD)('panda calendar today / week 已注册', () => {
  const out = runHelp(['calendar'])
  expect(out).toContain('today')
  expect(out).toContain('week')
})

test.if(HAS_BUILD)('panda notes search / list 已注册', () => {
  const out = runHelp(['notes'])
  expect(out).toContain('search')
  expect(out).toContain('list')
})

test.if(HAS_BUILD)('panda memory list / forget 已注册', () => {
  const out = runHelp(['memory'])
  expect(out).toContain('list')
  expect(out).toContain('forget')
})

test.if(!HAS_BUILD)('dist/cli.js 不存在——跳过 CLI 注册检查', () => {
  expect(HAS_BUILD).toBe(false)
})
