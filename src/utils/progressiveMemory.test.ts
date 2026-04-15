// B5 渐进式记忆检索 — 单元测试
// Input: progressiveMemory 模块的 estimateTokens / buildProgressiveIndex
// Output: 验证 token 估算和索引构建逻辑

import { test, expect, describe } from 'bun:test'
import { estimateTokens, buildProgressiveIndex } from './progressiveMemory.js'
import type { MemoryFileInfo } from './claudemd.js'

describe('B5 progressiveMemory', () => {
  // --- estimateTokens ---

  test('estimateTokens — 英文短句返回合理值', () => {
    // "hello world" = 11 chars → ceil(11 * 0.4) = 5
    expect(estimateTokens('hello world')).toBe(5)
  })

  test('estimateTokens — 空字符串返回 0', () => {
    expect(estimateTokens('')).toBe(0)
  })

  test('estimateTokens — 中文文本返回合理值', () => {
    const text = '这是一段中文测试文本' // 10 chars → ceil(10 * 0.4) = 4
    expect(estimateTokens(text)).toBe(4)
  })

  test('estimateTokens — 长文本比例正确', () => {
    const text = 'a'.repeat(1000) // 1000 chars → ceil(1000 * 0.4) = 400
    expect(estimateTokens(text)).toBe(400)
  })

  // --- buildProgressiveIndex ---

  test('buildProgressiveIndex — 空输入返回空结构', () => {
    const result = buildProgressiveIndex([])
    expect(result.fullInjectionFiles).toEqual([])
    expect(result.indexedFiles).toEqual([])
    expect(result.indexContent).toBe('')
    expect(result.stats.totalSavedTokens).toBe(0)
    expect(result.stats.indexOnlyTokens).toBe(0)
  })

  test('buildProgressiveIndex — MEMORY.md 归入全量注入', () => {
    const files: MemoryFileInfo[] = [
      {
        path: '/project/memory/MEMORY.md',
        type: 'autoMemory' as any,
        content: '# Memory Index\n\nSome content here',
      },
    ]
    const result = buildProgressiveIndex(files)
    expect(result.fullInjectionFiles.length).toBe(1)
    expect(result.indexedFiles.length).toBe(0)
    expect(result.indexContent).toBe('')
  })

  test('buildProgressiveIndex — 非 MEMORY.md 文件归入索引', () => {
    // 构造足够长的内容（>500 字符），使得全量注入 token > 索引 token，产生正向节省
    const longContent = '# Scar: config crash\n\n' + 'This is a detailed description of the config crash issue. '.repeat(30)
    const files: MemoryFileInfo[] = [
      {
        path: '/project/memory/scars/some-scar.md',
        type: 'autoMemory' as any,
        content: longContent,
      },
      {
        path: '/project/memory/semantic/arch.md',
        type: 'autoMemory' as any,
        content: '# Architecture Overview\n\n' + 'Core architecture details with many specifics. '.repeat(30),
      },
    ]
    const result = buildProgressiveIndex(files)
    expect(result.fullInjectionFiles.length).toBe(0)
    expect(result.indexedFiles.length).toBe(2)
    expect(result.indexContent).toContain('项目记忆详情索引')
    expect(result.indexContent).toContain('scars')
    expect(result.indexContent).toContain('semantic')
    expect(result.stats.totalSavedTokens).toBeGreaterThan(0)
  })

  test('buildProgressiveIndex — 混合 MEMORY.md 和详情文件', () => {
    const files: MemoryFileInfo[] = [
      {
        path: '/project/memory/MEMORY.md',
        type: 'autoMemory' as any,
        content: '# Memory Index\n\nIndex content',
      },
      {
        path: '/project/memory/scars/crash.md',
        type: 'autoMemory' as any,
        content: '# Scar: startup crash\n\nThis is a scar about crashes',
      },
      {
        path: '/project/memory/patterns/deploy.md',
        type: 'autoMemory' as any,
        content: '# Pattern: wave deployment\n\nDeployment pattern details',
      },
    ]
    const result = buildProgressiveIndex(files)
    expect(result.fullInjectionFiles.length).toBe(1)
    expect(result.fullInjectionFiles[0].path).toContain('MEMORY.md')
    expect(result.indexedFiles.length).toBe(2)
    expect(result.indexContent).toContain('索引 2 个文件')
    expect(result.stats.fullInjectionTokens).toBeGreaterThan(0)
    expect(result.stats.indexOnlyTokens).toBeGreaterThan(0)
  })
})
