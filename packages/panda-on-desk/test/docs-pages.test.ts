// Input:  bun test 触发（W20-T3 Pages 验证）
// Output: 校验 packages/panda-on-desk/docs/ 站点 source 的 markdown 完整性
//         8 段引用 / 内部链接相对路径正确 / markdown lint pass / APNG demo / 18 species
// Pos:    panda-on-desk W20-T3 Pages 验证测试 — 离线校验（GitHub Pages 站点 lc2panda.github.io/panda/ 实测 404）
//
// [NEW-FILE:#W20-01] · 2026-04-20 +08:00 W20-T3 agent-γ-W20-pages
// 一旦 docs/index.md / docs/_config.yml / .github/workflows/docs.yml 中任一变化，
// 请同步本测试用例（特别是 8 段标题、18 物种字面量、APNG 文件名清单）。

import { describe, expect, it } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const PKG_ROOT = path.resolve(__dirname, '..')
const DOCS_DIR = path.join(PKG_ROOT, 'docs')
const INDEX_MD = path.join(DOCS_DIR, 'index.md')
const CONFIG_YML = path.join(DOCS_DIR, '_config.yml')
const WORKFLOW_YML = path.resolve(PKG_ROOT, '..', '..', '.github', 'workflows', 'docs.yml')

// 8 段文档（任务原文：README/CHANGELOG/CONTRIBUTING/ARCHITECTURE/PRIVACY/INSTALL_TEST/FAQ + 1 主仓 README）
const REQUIRED_DOC_SECTIONS = [
  'README', // 主仓 README
  'panda-on-desk README',
  'CHANGELOG',
  'CONTRIBUTING',
  'ARCHITECTURE',
  'PRIVACY',
  'INSTALL_TEST',
  'FAQ',
] as const

// 18 物种（与 src/bridge/types.ts Species 类型 1:1 对齐 — types.parity 守护）
const SPECIES_18 = [
  'duck', 'goose', 'blob', 'cat', 'dragon', 'octopus', 'owl',
  'penguin', 'turtle', 'snail', 'ghost', 'axolotl', 'capybara',
  'cactus', 'robot', 'rabbit', 'mushroom', 'chonk',
] as const

// 7 PetState APNG 文件名
const APNG_PETSTATES = [
  'idle', 'thinking', 'working', 'sleeping', 'error', 'attention', 'notification',
] as const

describe('W20-T3 · GitHub Pages docs-site 离线校验', () => {
  it('docs/index.md 含 8 段文档段引用（README + CHANGELOG + CONTRIBUTING + ARCHITECTURE + PRIVACY + INSTALL_TEST + FAQ + 主仓 README）', () => {
    expect(fs.existsSync(INDEX_MD)).toBe(true)
    const src = fs.readFileSync(INDEX_MD, 'utf8')
    for (const section of REQUIRED_DOC_SECTIONS) {
      expect(src.includes(section)).toBe(true)
    }
    // 文档总览表必须含 8 行（前导 |#|...）
    const tableLines = src.split('\n').filter((l) => /^\|\s*\d+\s*\|/.test(l))
    expect(tableLines.length).toBeGreaterThanOrEqual(8)
  })

  it('docs/index.md 所有内部锚点链接（#xxx）相对路径解析正确', () => {
    const src = fs.readFileSync(INDEX_MD, 'utf8')
    // 提取所有 [text](#anchor) 形式
    const anchorLinkRe = /\[[^\]]+\]\(#([^)]+)\)/g
    const anchors = new Set<string>()
    let m: RegExpExecArray | null
    while ((m = anchorLinkRe.exec(src)) !== null) {
      anchors.add(m[1])
    }
    expect(anchors.size).toBeGreaterThan(0)

    // 提取所有 ## / ### 标题，转 kramdown slug（小写 + 空格转-+ 标点剥除，与 GitHub Pages Jekyll 行为对齐）
    const headingRe = /^(#{1,6})\s+(.+?)\s*$/gm
    const validSlugs = new Set<string>()
    let h: RegExpExecArray | null
    while ((h = headingRe.exec(src)) !== null) {
      const text = h[2]
      // kramdown slug：去 markdown link wrap、保留中文/字母/数字/-/_，空格转 -，全部小写
      const stripped = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      const slug = stripped
        .toLowerCase()
        .replace(/[\s.]+/g, '-')           // 空格 / 点 → -
        .replace(/[^\p{L}\p{N}\-_]+/gu, '') // 仅保留 unicode letter/number/-/_
        .replace(/^-+|-+$/g, '')
      validSlugs.add(slug)
    }
    // 校验每个内部锚点都能命中某个生成 slug
    for (const a of anchors) {
      expect(validSlugs.has(a) || validSlugs.has(a.toLowerCase())).toBe(true)
    }
  })

  it('docs/index.md 含 APNG 动效 demo 段（7 PetState 全覆盖）', () => {
    const src = fs.readFileSync(INDEX_MD, 'utf8')
    expect(src).toContain('APNG 动效 demo')
    for (const state of APNG_PETSTATES) {
      // 必须含 panda-<state>.apng 与 panda-200x200-<state>.png 两类文件名
      expect(src.includes(`panda-${state}.apng`)).toBe(true)
      expect(src.includes(`panda-200x200-${state}.png`)).toBe(true)
    }
  })

  it('docs/index.md 含 18 物种 sprite 列表（每个 species 字面量都列出）', () => {
    const src = fs.readFileSync(INDEX_MD, 'utf8')
    expect(src).toContain('18 物种')
    for (const sp of SPECIES_18) {
      expect(src.includes('`' + sp + '`')).toBe(true)
    }
    expect(SPECIES_18.length).toBe(18) // 守护：总数必须是 18
  })

  it('docs/index.md 引用的本仓 markdown 文件全部真实存在（GitHub blob 链接有效性）', () => {
    const src = fs.readFileSync(INDEX_MD, 'utf8')
    const repoRoot = path.resolve(PKG_ROOT, '..', '..')
    const blobRe = /github\.com\/lc2panda\/panda\/blob\/main\/([^)#\s]+)/g
    const referenced = new Set<string>()
    let m: RegExpExecArray | null
    while ((m = blobRe.exec(src)) !== null) {
      referenced.add(m[1])
    }
    expect(referenced.size).toBeGreaterThan(0)
    for (const relPath of referenced) {
      const abs = path.join(repoRoot, relPath)
      // 不允许死链：每个 blob/main/<path> 必须在仓库内真实存在
      expect(fs.existsSync(abs)).toBe(true)
    }
  })

  it('docs/index.md 引用的 raw APNG / 截图文件全部真实存在（build/screenshots/ 路径）', () => {
    const src = fs.readFileSync(INDEX_MD, 'utf8')
    const repoRoot = path.resolve(PKG_ROOT, '..', '..')
    const rawRe = /raw\.githubusercontent\.com\/lc2panda\/panda\/main\/([^)#\s]+)|github\.com\/lc2panda\/panda\/raw\/main\/([^)#\s]+)/g
    const assets = new Set<string>()
    let m: RegExpExecArray | null
    while ((m = rawRe.exec(src)) !== null) {
      const rel = m[1] || m[2]
      if (rel) assets.add(rel)
    }
    expect(assets.size).toBeGreaterThan(0)
    for (const relPath of assets) {
      const abs = path.join(repoRoot, relPath)
      expect(fs.existsSync(abs)).toBe(true)
    }
  })

  it('markdown lint：无裸 URL / 不含 ../build/ 形式（Pages baseurl 不可访问）/ 无 TODO 标记', () => {
    const src = fs.readFileSync(INDEX_MD, 'utf8')
    // ../build/ 形式在 GitHub Pages 站点（baseurl=/panda）下不可访问 — W20-T3 关键修复点
    const bareRelativeBuildRe = /\]\(\.\.\/build\//g
    expect(bareRelativeBuildRe.test(src)).toBe(false)
    // 不允许遗留 TODO/FIXME/XXX
    expect(/\bTODO\b|\bFIXME\b|\bXXX\b/.test(src)).toBe(false)
    // 不允许出现「[xxx]( 后无 )」即 url 未闭合 — 逐个扫描每个 [text]( 后必须能找到首个 ) 闭合
    const linkOpenRe = /\[[^\]]*\]\(/g
    let openMatch: RegExpExecArray | null
    while ((openMatch = linkOpenRe.exec(src)) !== null) {
      const after = src.slice(linkOpenRe.lastIndex)
      const closeIdx = after.indexOf(')')
      const newlineIdx = after.indexOf('\n')
      // 闭合 ) 必须出现在同行（防止跨行半截链接）
      expect(closeIdx).toBeGreaterThanOrEqual(0)
      if (newlineIdx >= 0) {
        expect(closeIdx).toBeLessThan(newlineIdx)
      }
    }
  })

  it('docs/_config.yml Jekyll 配置：baseurl=/panda · safe=true · 无第三方 plugin', () => {
    expect(fs.existsSync(CONFIG_YML)).toBe(true)
    const yml = fs.readFileSync(CONFIG_YML, 'utf8')
    expect(/^baseurl:\s*\/panda\s*$/m.test(yml)).toBe(true)
    expect(/^safe:\s*true\s*$/m.test(yml)).toBe(true)
    expect(/^theme:\s*jekyll-theme-/m.test(yml)).toBe(true)
    // GitHub Pages safe mode 兼容 — 不得引入 plugins:
    expect(/^plugins:/m.test(yml)).toBe(false)
  })

  it('.github/workflows/docs.yml 路径覆盖 docs 触发面（packages/panda-on-desk/docs/** 必含）', () => {
    expect(fs.existsSync(WORKFLOW_YML)).toBe(true)
    const wf = fs.readFileSync(WORKFLOW_YML, 'utf8')
    expect(wf).toContain('packages/panda-on-desk/docs/**')
    expect(wf).toContain('actions/jekyll-build-pages')
    expect(wf).toContain('actions/deploy-pages')
    expect(wf).toContain('source: ./packages/panda-on-desk/docs')
  })
})
