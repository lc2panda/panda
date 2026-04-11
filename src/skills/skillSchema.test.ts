// Input: none (bun unit test)
// Output: 断言 validateSkillEnvironment / checkSkillTrustLevel / getSkillTrustMetadata 行为
// Pos: Hermes Skill Schema 扩展 P1-4 单元测试
import { afterEach, expect, test } from 'bun:test'
import {
  checkSkillTrustLevel,
  clearSkillTrustRegistry,
  formatMissingEnvMessage,
  getSkillTrustMetadata,
  setSkillTrustMetadata,
  validateSkillEnvironment,
} from './skillSchema.js'

afterEach(() => {
  clearSkillTrustRegistry()
  delete process.env.PANDA_TEST_VAR_OK
  delete process.env.PANDA_TEST_VAR_EMPTY
})

// ── validateSkillEnvironment ────────────────────────────────────────────────

test('validateSkillEnvironment — 无要求时 valid', () => {
  const result = validateSkillEnvironment({})
  expect(result.valid).toBe(true)
  expect(result.missing).toEqual([])
})

test('validateSkillEnvironment — bundled skill 默认 valid（走兜底元数据）', () => {
  const result = validateSkillEnvironment({ name: 'write' })
  expect(result.valid).toBe(true)
})

test('validateSkillEnvironment — 显式 trustMetadata 无 requiredEnvironmentVariables', () => {
  const result = validateSkillEnvironment({
    trustMetadata: { trust: 'official' },
  })
  expect(result.valid).toBe(true)
})

test('validateSkillEnvironment — 缺失必需变量', () => {
  const result = validateSkillEnvironment({
    trustMetadata: {
      requiredEnvironmentVariables: ['NEVER_EXISTS_VAR_xyz123_panda'],
    },
  })
  expect(result.valid).toBe(false)
  expect(result.missing).toContain('NEVER_EXISTS_VAR_xyz123_panda')
})

test('validateSkillEnvironment — 已设置变量', () => {
  process.env.PANDA_TEST_VAR_OK = 'value'
  const result = validateSkillEnvironment({
    trustMetadata: { requiredEnvironmentVariables: ['PANDA_TEST_VAR_OK'] },
  })
  expect(result.valid).toBe(true)
  expect(result.missing).toEqual([])
})

test('validateSkillEnvironment — 空字符串视为缺失', () => {
  process.env.PANDA_TEST_VAR_EMPTY = ''
  const result = validateSkillEnvironment({
    trustMetadata: { requiredEnvironmentVariables: ['PANDA_TEST_VAR_EMPTY'] },
  })
  expect(result.valid).toBe(false)
  expect(result.missing).toContain('PANDA_TEST_VAR_EMPTY')
})

test('validateSkillEnvironment — 多变量部分缺失', () => {
  process.env.PANDA_TEST_VAR_OK = 'value'
  const result = validateSkillEnvironment({
    trustMetadata: {
      requiredEnvironmentVariables: [
        'PANDA_TEST_VAR_OK',
        'NEVER_EXISTS_VAR_abc456_panda',
      ],
    },
  })
  expect(result.valid).toBe(false)
  expect(result.missing).toEqual(['NEVER_EXISTS_VAR_abc456_panda'])
})

// ── checkSkillTrustLevel ────────────────────────────────────────────────────

test('checkSkillTrustLevel — 默认（未声明）允许', () => {
  const result = checkSkillTrustLevel({})
  expect(result.allowed).toBe(true)
  expect(result.reason).toBeUndefined()
})

test('checkSkillTrustLevel — builtin 允许', () => {
  const result = checkSkillTrustLevel({
    trustMetadata: { trust: 'builtin' },
  })
  expect(result.allowed).toBe(true)
  expect(result.reason).toBeUndefined()
})

test('checkSkillTrustLevel — official 允许', () => {
  const result = checkSkillTrustLevel({
    trustMetadata: { trust: 'official' },
  })
  expect(result.allowed).toBe(true)
})

test('checkSkillTrustLevel — trusted 允许', () => {
  const result = checkSkillTrustLevel({
    trustMetadata: { trust: 'trusted' },
  })
  expect(result.allowed).toBe(true)
})

test('checkSkillTrustLevel — community 允许但带 warning reason', () => {
  const result = checkSkillTrustLevel({
    name: 'some-community-skill',
    trustMetadata: { trust: 'community' },
  })
  expect(result.allowed).toBe(true)
  expect(result.reason).toBeDefined()
  expect(result.reason).toContain('community')
})

// ── registry 注入路径 ───────────────────────────────────────────────────────

test('setSkillTrustMetadata + getSkillTrustMetadata — 外部 registry 覆盖', () => {
  setSkillTrustMetadata('my-external-skill', {
    trust: 'community',
    requiredEnvironmentVariables: ['FOO_API_KEY'],
  })
  const meta = getSkillTrustMetadata({ name: 'my-external-skill' })
  expect(meta.trust).toBe('community')
  expect(meta.requiredEnvironmentVariables).toEqual(['FOO_API_KEY'])
})

test('getSkillTrustMetadata — 显式 trustMetadata 优先于 registry', () => {
  setSkillTrustMetadata('conflict-skill', { trust: 'community' })
  const meta = getSkillTrustMetadata({
    name: 'conflict-skill',
    trustMetadata: { trust: 'builtin' },
  })
  expect(meta.trust).toBe('builtin')
})

test('getSkillTrustMetadata — 未知 skill 兜底为 builtin', () => {
  const meta = getSkillTrustMetadata({ name: 'definitely-not-registered' })
  expect(meta.trust).toBe('builtin')
  expect(meta.requiredEnvironmentVariables).toBeUndefined()
})

test('validateSkillEnvironment — 通过 registry 注入的必需变量缺失被捕获', () => {
  setSkillTrustMetadata('env-gated-skill', {
    trust: 'trusted',
    requiredEnvironmentVariables: ['NEVER_EXISTS_VAR_reg_panda'],
  })
  const result = validateSkillEnvironment({ name: 'env-gated-skill' })
  expect(result.valid).toBe(false)
  expect(result.missing).toContain('NEVER_EXISTS_VAR_reg_panda')
})

// ── formatMissingEnvMessage ─────────────────────────────────────────────────

test('formatMissingEnvMessage — 包含 skill 名、变量名与指引', () => {
  const msg = formatMissingEnvMessage('foo', ['OPENAI_API_KEY', 'GITHUB_TOKEN'])
  expect(msg).toContain('foo')
  expect(msg).toContain('OPENAI_API_KEY')
  expect(msg).toContain('GITHUB_TOKEN')
  expect(msg).toContain('~/.pandacc/config')
})
