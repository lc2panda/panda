#!/usr/bin/env node
// Input: 项目根目录（必须含 package.json + dist/ + packages/panda-on-desk/）
// Output: 验证 `npm pack --dry-run` tarball 含 panda-on-desk 关键文件，打印 tarball 大小报告
// Pos: W1-T3 dist 打包验证脚本 — CI / 本地发布前 smoke test
//
// [NEW-FILE:#20260419-W1-04]
// 触发原因：npm tarball 升级后必须确保 packages/panda-on-desk/ 关键文件全部进入；
//   人工 ls tarball 不可靠（files 字段 glob 匹配复杂），需自动化校验门槛。
// 无法仅修改现有文件达成：现有 scripts/ 无 npm pack 相关脚本（health-check.ts 仅查环境）。
// 证据：
//   - npm pack docs: https://docs.npmjs.com/cli/v10/commands/npm-pack
//   - npm pack --dry-run --json 输出 tarball entries 数组
// 影响：仅 dev/CI 调用，运行时不引入。
//
// 用法: node scripts/verify-npm-pack.cjs
// 退码: 0 = 通过；非 0 = 关键文件缺失或 npm pack 失败

'use strict'

const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const REQUIRED_PATTERNS = [
  // 桌面端入口
  /^packages\/panda-on-desk\/launch\.cjs$/,
  /^packages\/panda-on-desk\/package\.json$/,
  // 主进程编译产物
  /^packages\/panda-on-desk\/src\/main\.js$/,
  // 渲染层 HTML/CSS（至少一个 html + styles.css）
  /^packages\/panda-on-desk\/src\/renderer\/index\.html$/,
  /^packages\/panda-on-desk\/src\/renderer\/styles\.css$/,
  // 主题资产
  /^packages\/panda-on-desk\/themes\/panda\/theme\.json$/,
  // 图标
  /^packages\/panda-on-desk\/build\/icons\/panda\.ico$/,
  // 主 CLI 产物（确保未被破坏）
  /^dist\/cli\.js$/,
  /^dist\/launcher\.cjs$/,
  // postinstall 钩子
  /^scripts\/postinstall-init\.cjs$/,
  // README
  /^README\.md$/,
]

const FORBIDDEN_PATTERNS = [
  // node_modules 绝不允许进 tarball
  /\/node_modules\//,
  // 源 .ts 不进 tarball（仅 .js）
  /^packages\/panda-on-desk\/src\/.*\.ts$/,
]

function main() {
  const root = path.resolve(__dirname, '..')
  console.log('[verify-npm-pack] 工作目录:', root)
  console.log('[verify-npm-pack] 运行 npm pack --dry-run --json ...')

  const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: root,
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  })

  if (result.status !== 0) {
    console.error('[verify-npm-pack] npm pack 失败:')
    console.error(result.stderr || result.stdout)
    process.exit(1)
  }

  let parsed
  try {
    parsed = JSON.parse(result.stdout)
  } catch (e) {
    console.error('[verify-npm-pack] 解析 npm pack JSON 失败:', e.message)
    console.error('原始输出:\n', result.stdout)
    process.exit(1)
  }

  const pkg = Array.isArray(parsed) ? parsed[0] : parsed
  if (!pkg || !Array.isArray(pkg.files)) {
    console.error('[verify-npm-pack] npm pack 输出无 files 数组')
    process.exit(1)
  }

  const filePaths = pkg.files.map((f) => f.path.replace(/\\/g, '/'))
  console.log(
    '[verify-npm-pack] tarball 含 ' + filePaths.length + ' 个文件',
  )
  console.log(
    '[verify-npm-pack] tarball 解包大小: ' +
      (pkg.unpackedSize / 1024 / 1024).toFixed(2) +
      ' MB',
  )
  console.log(
    '[verify-npm-pack] tarball 压缩大小: ' +
      (pkg.size / 1024 / 1024).toFixed(2) +
      ' MB',
  )

  const missing = []
  for (const pattern of REQUIRED_PATTERNS) {
    const hit = filePaths.some((p) => pattern.test(p))
    if (!hit) {
      missing.push(pattern.source)
    }
  }

  const forbiddenHits = []
  for (const pattern of FORBIDDEN_PATTERNS) {
    for (const p of filePaths) {
      if (pattern.test(p)) {
        forbiddenHits.push({ pattern: pattern.source, path: p })
      }
    }
  }

  // 打印 panda-on-desk 子包文件清单
  const deskFiles = filePaths.filter((p) =>
    p.startsWith('packages/panda-on-desk/'),
  )
  console.log(
    '[verify-npm-pack] 桌面端文件数: ' + deskFiles.length,
  )
  for (const f of deskFiles.slice(0, 50)) {
    console.log('  - ' + f)
  }
  if (deskFiles.length > 50) {
    console.log('  ... (+' + (deskFiles.length - 50) + ' more)')
  }

  if (missing.length > 0) {
    console.error('')
    console.error('[verify-npm-pack] FAIL: 缺失关键文件 (' + missing.length + '):')
    for (const m of missing) {
      console.error('  - 模式: ' + m)
    }
    process.exit(2)
  }

  if (forbiddenHits.length > 0) {
    console.error('')
    console.error('[verify-npm-pack] FAIL: 禁止文件命中 (' + forbiddenHits.length + '):')
    for (const h of forbiddenHits.slice(0, 20)) {
      console.error('  - [' + h.pattern + '] ' + h.path)
    }
    if (forbiddenHits.length > 20) {
      console.error('  ... (+' + (forbiddenHits.length - 20) + ' more)')
    }
    process.exit(3)
  }

  console.log('')
  console.log('[verify-npm-pack] OK: 所有关键文件就位，无禁止文件')
  process.exit(0)
}

try {
  main()
} catch (e) {
  console.error('[verify-npm-pack] 异常:', e.message)
  process.exit(99)
}
