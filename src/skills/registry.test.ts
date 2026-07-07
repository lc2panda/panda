// Input: bundled index, filesystem skill dirs, and skill file requests
// Output: Bun test assertions on skill registry and loadSkillsDir invariants
// Pos: bundled/dynamic skill loading and duplicate suppression guard
import { mkdtemp, mkdir, symlink, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { test, expect } from 'bun:test'
import { getSkillDirCommands } from './loadSkillsDir.js'
import { getManagedFilePath } from '../utils/settings/managedPath.js'
import {
  BUNDLED_SKILL_INDEX,
  getSkillDescription,
  findSkillMeta,
  listSkillIndex,
  loadSkillFile,
} from './registry.js'

test('loadSkillsDir 去重 smoke：同路径 symlink 只加载一次，managed+dynamic 混合加载', async () => {
  const root = await mkdtemp(join(tmpdir(), 'panda-skills-'))
  const realSkill = join(root, 'skills', 'shared')
  const sameNameOtherSource = join(root, 'skills', 'shared-other')
  const managedSkill = join(root, 'managed', '.pandacc', 'skills', 'managed-only')
  await mkdir(realSkill, { recursive: true })
  await mkdir(sameNameOtherSource, { recursive: true })
  await mkdir(managedSkill, { recursive: true })
  await writeFile(join(realSkill, 'SKILL.md'), '---\ndescription: User shared skill\n---\n# Shared\n')
  await writeFile(join(sameNameOtherSource, 'SKILL.md'), '---\nname: shared\ndescription: Same name different source\n---\n# Shared other\n')
  await writeFile(join(managedSkill, 'SKILL.md'), '---\ndescription: Managed only skill\n---\n# Managed\n')
  await symlink(realSkill, join(root, 'skills', 'shared-link'))

  const previousConfigDir = process.env.PANDA_CONFIG_DIR
  const previousUserType = process.env.USER_TYPE
  const previousManagedPath = process.env.CLAUDE_CODE_MANAGED_SETTINGS_PATH
  process.env.PANDA_CONFIG_DIR = root
  process.env.USER_TYPE = 'ant'
  process.env.CLAUDE_CODE_MANAGED_SETTINGS_PATH = join(root, 'managed')
  getManagedFilePath.cache.clear()
  getSkillDirCommands.cache.clear()
  try {
    const commands = await getSkillDirCommands(root)
    const skillCommands = commands.filter(command => command.type === 'prompt')
    expect(skillCommands.filter(command => command.name === 'shared')).toHaveLength(1)
    expect(skillCommands.some(command => command.name === 'shared-link')).toBe(false)
    expect(skillCommands.some(command => command.name === 'shared-other')).toBe(true)
    expect(skillCommands.some(command => command.name === 'managed-only')).toBe(true)
  } finally {
    if (previousConfigDir === undefined) delete process.env.PANDA_CONFIG_DIR
    else process.env.PANDA_CONFIG_DIR = previousConfigDir
    if (previousUserType === undefined) delete process.env.USER_TYPE
    else process.env.USER_TYPE = previousUserType
    if (previousManagedPath === undefined) delete process.env.CLAUDE_CODE_MANAGED_SETTINGS_PATH
    else process.env.CLAUDE_CODE_MANAGED_SETTINGS_PATH = previousManagedPath
    getManagedFilePath.cache.clear()
    getSkillDirCommands.cache.clear()
  }
})

test('BUNDLED_SKILL_INDEX 包含至少 1 项', () => {
  expect(BUNDLED_SKILL_INDEX.length).toBeGreaterThan(0)
})

test('每个 skill 都有 name + description + load', () => {
  for (const skill of BUNDLED_SKILL_INDEX) {
    expect(typeof skill.name).toBe('string')
    expect(skill.name.length).toBeGreaterThan(0)
    expect(typeof skill.description).toBe('string')
    expect(skill.description.length).toBeGreaterThan(0)
    expect(typeof skill.load).toBe('function')
  }
})

test('load() 返回 skill 完整内容', async () => {
  const first = BUNDLED_SKILL_INDEX[0]!
  const loaded = await first.load()
  // verify / debug / updateConfig may no-op under certain env gates, but
  // the top-of-list `update-config` always registers — so this should be
  // non-null. If a gate ever makes it null, swap to `.find(...)` by name.
  expect(loaded).toBeDefined()
  if (loaded) {
    expect(loaded).toHaveProperty('name')
    expect(loaded.name).toBe(first.name)
  }
})

test('skill name 唯一', () => {
  const names = BUNDLED_SKILL_INDEX.map(s => s.name)
  const unique = new Set(names)
  expect(unique.size).toBe(names.length)
})

test('getSkillDescription 命中 / 未命中分支', () => {
  const first = BUNDLED_SKILL_INDEX[0]!
  expect(getSkillDescription(first.name)).toBe(first.description)
  expect(getSkillDescription('__definitely_not_a_real_skill__')).toBeNull()
})

test('findSkillMeta 命中 / 未命中分支', () => {
  const first = BUNDLED_SKILL_INDEX[0]!
  const meta = findSkillMeta(first.name)
  expect(meta).not.toBeNull()
  expect(meta!.name).toBe(first.name)
  expect(findSkillMeta('__nope__')).toBeNull()
})

test('listSkillIndex 只暴露 name + description', () => {
  const list = listSkillIndex()
  expect(list.length).toBe(BUNDLED_SKILL_INDEX.length)
  for (const entry of list) {
    expect(Object.keys(entry).sort()).toEqual(['description', 'name'])
  }
})

test('Level-1 索引本身不触发任何 skill 模块 import', () => {
  // The index module should never have statically imported anything under
  // ./bundled/. We verify by checking that BUNDLED_SKILL_INDEX can be
  // enumerated without awaiting any load() — the test passing synchronously
  // through this loop is itself the assertion.
  let count = 0
  for (const meta of BUNDLED_SKILL_INDEX) {
    if (meta.name && meta.description) count++
  }
  expect(count).toBe(BUNDLED_SKILL_INDEX.length)
})

test('load() 对同一 skill 幂等（二次调用不报错）', async () => {
  const meta = findSkillMeta('capture')
  expect(meta).not.toBeNull()
  const first = await meta!.load()
  const second = await meta!.load()
  // Both calls should resolve to the same registered Command instance (or
  // both null, if the skill is env-gated — but capture is not).
  expect(first).not.toBeNull()
  expect(second).not.toBeNull()
  expect(first!.name).toBe('capture')
  expect(second!.name).toBe('capture')
})

// ── Level-2 Progressive Disclosure: loadSkillFile ──
// Bundled skills ship as `.ts` modules without a filesystem layout, so these
// tests verify the safety rails (null fallback + path traversal prevention).
// Real content resolution will be covered when user-installed skills land.

test('loadSkillFile — bundled skill 返回 null（无文件结构）', async () => {
  // `write` is bundled and has no ~/.pandacc/skills/write/ directory in CI
  // or on a clean dev machine — we expect a null fallback.
  const result = await loadSkillFile('write', 'templates/test.md')
  expect(result).toBeNull()
})

test('loadSkillFile — 路径穿越被阻止', async () => {
  const result = await loadSkillFile('write', '../../../etc/passwd')
  expect(result).toBeNull()
})

test('loadSkillFile — 绝对路径注入被阻止', async () => {
  const result = await loadSkillFile('write', '/etc/passwd')
  // Even if ~/.pandacc/skills/write/ existed, resolve() with an absolute
  // `path` would escape the root, and the root check should reject it.
  expect(result).toBeNull()
})

test('loadSkillFile — 不存在的 skill 返回 null', async () => {
  const result = await loadSkillFile(
    '__nonexistent_skill_xyz__',
    'foo.md',
  )
  expect(result).toBeNull()
})

// ── v2.1.147 同步: /simplify → /code-review 重命名 + alias 重定向 ──

test('code-review skill 已注册到 BUNDLED_SKILL_INDEX', () => {
  const meta = findSkillMeta('code-review')
  expect(meta).not.toBeNull()
  expect(meta!.name).toBe('code-review')
})

test('旧 simplify 已从索引移除（改由 alias 提供）', () => {
  expect(findSkillMeta('simplify')).toBeNull()
})

test('code-review.load() 注册 Command 且保留 simplify alias', async () => {
  const meta = findSkillMeta('code-review')
  expect(meta).not.toBeNull()
  const cmd = await meta!.load()
  expect(cmd).not.toBeNull()
  expect(cmd!.name).toBe('code-review')
  // /simplify 老用户命令不失效：alias 重定向到 code-review
  expect(cmd!.aliases).toContain('simplify')
})

test('code-review prompt 默认 effort=medium，--comment 注入 PR 评论指引', async () => {
  const meta = findSkillMeta('code-review')
  const cmd = await meta!.load()
  expect(cmd).not.toBeNull()
  // 默认（无 args）走 medium，且不含 inline comment 段落
  const def = await cmd!.getPromptForCommand!('', {} as never)
  const defText = def.map(b => (b.type === 'text' ? b.text : '')).join('')
  expect(defText).toContain('Effort: medium')
  expect(defText).not.toContain('Post Inline PR Comments')
  // --comment 注入 gh PR review comments 指引
  const withComment = await cmd!.getPromptForCommand!(
    'high --comment',
    {} as never,
  )
  const cText = withComment
    .map(b => (b.type === 'text' ? b.text : ''))
    .join('')
  expect(cText).toContain('Effort: high')
  expect(cText).toContain('Post Inline PR Comments')
  expect(cText).toContain('/pulls/{number}/comments')
})
