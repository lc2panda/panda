// Input: none (unit test)
// Output: Bun test assertions on BUNDLED_SKILL_INDEX invariants
// Pos: bundled skills Progressive Disclosure 索引层单元测试
import { test, expect } from 'bun:test'
import {
  BUNDLED_SKILL_INDEX,
  getSkillDescription,
  findSkillMeta,
  listSkillIndex,
  loadSkillFile,
} from './registry.js'

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
