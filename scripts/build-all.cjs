#!/usr/bin/env node
// Input: 项目根目录（含 build.ts + packages/panda-on-desk/）
// Output: 顺序产出 dist/（CLI bundle）+ packages/panda-on-desk/src/main.js（Electron 主进程）
//         并清理子包 node_modules（避免巨大 deps 进 npm tarball）
// Pos: W1-T3 一站式 dist 打包入口 — 本地发布 / CI release-panda.yml 调用
//
// [NEW-FILE:#20260419-W1-04]
// 触发原因：build.ts 仅产 CLI dist；桌面端 main.js 需另外 cd packages/panda-on-desk && bun run build:dist；
//   再加 node_modules 清理 + verify-npm-pack 三步，需统一 wrapper 编排顺序与失败短路。
// 无法仅修改现有文件达成：build.ts 是 bun 脚本聚焦 CLI；新增编排逻辑会污染主构建职责。
// 证据：
//   - npm pack 不应含 node_modules: https://docs.npmjs.com/cli/v10/commands/npm-pack#files
//   - electron 体积 ~80MB（不能进 tarball）
//   - bun run build 已被 build.ts 内部覆盖 dist 清理
// 影响：仅 dev/CI 调用，运行时不引入。
//
// 用法: node scripts/build-all.cjs
// 退码: 0 = 全部通过；非 0 = 任一步骤失败

'use strict'

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const deskDir = path.join(root, 'packages', 'panda-on-desk')
const deskNodeModules = path.join(deskDir, 'node_modules')

function run(label, cmd, args, opts) {
  console.log('')
  console.log('[build-all] [' + label + '] ' + cmd + ' ' + args.join(' '))
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: opts && opts.cwd ? opts.cwd : root,
    shell: process.platform === 'win32',
    env: process.env,
  })
  if (result.status !== 0) {
    console.error('[build-all] [' + label + '] FAIL exit=' + result.status)
    process.exit(result.status || 1)
  }
}

function rmrf(target) {
  if (!fs.existsSync(target)) {
    return
  }
  try {
    fs.rmSync(target, { recursive: true, force: true })
    console.log('[build-all] 清理: ' + target)
  } catch (e) {
    console.warn('[build-all] 清理失败 (忽略): ' + target + ' — ' + e.message)
  }
}

console.log('[build-all] 开始 W1-T3 完整构建')
console.log('[build-all] root=' + root)

// 步骤 1: 跑根 bun run build (CLI 主 dist)
run('1/4 CLI dist', 'bun', ['run', 'build'])

// 步骤 2: 跑子包 build:dist (Electron 主进程 main.ts -> main.js)
if (!fs.existsSync(deskDir)) {
  console.error('[build-all] FATAL: ' + deskDir + ' 不存在')
  process.exit(1)
}
run('2/4 panda-on-desk dist', 'bun', ['run', 'build:dist'], { cwd: deskDir })

// 步骤 3: 清理子包 node_modules（避免 80MB+ electron 进 tarball）
console.log('')
console.log('[build-all] [3/4] 清理子包 node_modules')
rmrf(deskNodeModules)

// 步骤 4: 验证 npm pack tarball 内容
run('4/4 verify-npm-pack', 'node', [path.join('scripts', 'verify-npm-pack.cjs')])

console.log('')
console.log('[build-all] OK: 全部 4 步通过')
process.exit(0)
