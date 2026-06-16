// Input:  TaskCreateTool.inputSchema.safeParse(各类合法/畸形输入)
// Output: Bun test assertions — 验证畸形输入自修复 + 合法输入不受影响 + 不可修复仍报错
// Pos:    src/tools/TaskCreateTool/TaskCreateTool.test.ts — unit tests for S4 畸形输入自修复
import { describe, expect, test } from 'bun:test'
import { TaskCreateTool } from './TaskCreateTool.js'

const schema = TaskCreateTool.inputSchema

describe('TaskCreateTool 畸形输入自修复 (S4)', () => {
  // -------------------------------------------------------------------------
  // 合法输入：行为不变
  // -------------------------------------------------------------------------
  test('合法完整输入原样通过', () => {
    const r = schema.safeParse({
      subject: 'Run tests',
      description: 'Run the full test suite',
      activeForm: 'Running tests',
      metadata: { priority: 'high' },
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.subject).toBe('Run tests')
      expect(r.data.description).toBe('Run the full test suite')
      expect(r.data.activeForm).toBe('Running tests')
      expect(r.data.metadata).toEqual({ priority: 'high' })
    }
  })

  test('合法最小输入（仅 subject + description）原样通过', () => {
    const r = schema.safeParse({
      subject: 'Fix bug',
      description: 'Fix the null pointer',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.subject).toBe('Fix bug')
      expect(r.data.description).toBe('Fix the null pointer')
      expect(r.data.activeForm).toBeUndefined()
      expect(r.data.metadata).toBeUndefined()
    }
  })

  // -------------------------------------------------------------------------
  // 畸形输入：被修复后成功
  // -------------------------------------------------------------------------
  test('别名 title → subject 被归一', () => {
    const r = schema.safeParse({
      title: 'Deploy',
      description: 'Deploy to prod',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.subject).toBe('Deploy')
  })

  test('别名 details → description 被归一', () => {
    const r = schema.safeParse({
      subject: 'Deploy',
      details: 'Deploy to prod',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.description).toBe('Deploy to prod')
  })

  test('subject 为数字标量被宽松化为字符串', () => {
    const r = schema.safeParse({
      subject: 42,
      description: 'numeric subject',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.subject).toBe('42')
  })

  test('description 缺失时用 subject 兜底', () => {
    const r = schema.safeParse({ subject: 'Standalone task' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.subject).toBe('Standalone task')
      expect(r.data.description).toBe('Standalone task')
    }
  })

  test('metadata 为 JSON 字符串被解析为对象', () => {
    const r = schema.safeParse({
      subject: 'Task',
      description: 'desc',
      metadata: '{"k":"v","n":1}',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.metadata).toEqual({ k: 'v', n: 1 })
  })

  test('未知顶层键被剥离（避免 strictObject 直接抛错）', () => {
    const r = schema.safeParse({
      subject: 'Task',
      description: 'desc',
      bogusField: 'should be dropped',
      anotherUnknown: 123,
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.subject).toBe('Task')
      expect((r.data as Record<string, unknown>).bogusField).toBeUndefined()
    }
  })

  test('组合畸形：title + boolean subject 值 + 未知键 + 缺 description', () => {
    const r = schema.safeParse({
      name: true,
      garbage: { nested: 1 },
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.subject).toBe('true')
      expect(r.data.description).toBe('true')
    }
  })

  // -------------------------------------------------------------------------
  // 不可修复：仍报清晰错误
  // -------------------------------------------------------------------------
  test('完全空对象（无 subject 无 description）仍报错', () => {
    const r = schema.safeParse({})
    expect(r.success).toBe(false)
  })

  test('subject 为对象（无法标量化）仍报错', () => {
    const r = schema.safeParse({
      subject: { nested: 'obj' },
      description: 'desc',
    })
    expect(r.success).toBe(false)
  })

  test('非对象输入（字符串）仍报错', () => {
    const r = schema.safeParse('not an object')
    expect(r.success).toBe(false)
  })

  test('null 输入仍报错', () => {
    const r = schema.safeParse(null)
    expect(r.success).toBe(false)
  })
})
