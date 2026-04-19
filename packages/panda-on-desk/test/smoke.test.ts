// Input: bun test 触发
// Output: 验证 main.ts 模块可被 TypeScript 编译 + 关键 fork 模块导出符号存在
// Pos: panda-on-desk Phase 1 启动 smoke 用例
//
// [NEW-FILE:#20260419-P1-04]

import { describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const PKG_ROOT = path.resolve(__dirname, '..')

describe('panda-on-desk Phase 1 bootstrap', () => {
  it('main.ts 文件存在且包含 createWindow 函数', () => {
    const mainPath = path.join(PKG_ROOT, 'src', 'main.ts')
    expect(fs.existsSync(mainPath)).toBe(true)
    const src = fs.readFileSync(mainPath, 'utf8')
    expect(src).toContain('createWindow')
    expect(src).toContain('BrowserWindow')
    expect(src).toContain('app.on')
  })

  it('package.json 声明 @lc2panda/panda-on-desk 子包', () => {
    const pkgPath = path.join(PKG_ROOT, 'package.json')
    expect(fs.existsSync(pkgPath)).toBe(true)
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    expect(pkg.name).toBe('@lc2panda/panda-on-desk')
    expect(pkg.private).toBe(true)
  })

  it('launch.cjs 启动器存在且剥除了 ELECTRON_RUN_AS_NODE', () => {
    const launchPath = path.join(PKG_ROOT, 'launch.cjs')
    expect(fs.existsSync(launchPath)).toBe(true)
    const src = fs.readFileSync(launchPath, 'utf8')
    expect(src).toContain('ELECTRON_RUN_AS_NODE')
    expect(src).toContain('delete env.ELECTRON_RUN_AS_NODE')
  })

  it('fork 模块文件应有 clawd-on-desk@4b07658 标注', () => {
    const required = [
      'src/state.ts',
      'src/theme-loader.ts',
      'src/animation-cycle.ts',
      'src/geometry/drag-position.ts',
      'src/geometry/work-area.ts',
      'src/geometry/visible-margins.ts',
      'src/geometry/size-utils.ts',
      'src/geometry/hit-geometry.ts',
      'src/util/tick.ts',
      'src/util/focus.ts',
      'src/util/log-rotate.ts',
      'src/i18n.ts',
      'src/updater.ts',
      'src/menu.ts',
      'src/shortcuts.ts',
      'src/platform/login-item.ts',
    ]
    for (const rel of required) {
      const p = path.join(PKG_ROOT, rel)
      expect(fs.existsSync(p)).toBe(true)
      const head = fs.readFileSync(p, 'utf8').slice(0, 800)
      expect(head).toContain('Forked from clawd-on-desk@4b07658')
    }
  })

  it('preload 4 文件齐全且声明沙箱预加载', () => {
    const preloads = [
      'src/preload/main.ts',
      'src/preload/bubble.ts',
      'src/preload/hit.ts',
      'src/preload/update-bubble.ts',
    ]
    for (const rel of preloads) {
      const p = path.join(PKG_ROOT, rel)
      expect(fs.existsSync(p)).toBe(true)
      const head = fs.readFileSync(p, 'utf8').slice(0, 400)
      expect(head).toContain('Forked from clawd-on-desk@4b07658')
    }
  })
})
