// Input:  raw usage 对象，顶层 cache_creation_input_tokens 为 0 但 nested breakdown 有值
// Output: updateUsage / extractUnifiedCacheUsage 从 nested 求和回填，不报 0
// Pos:    Wave2 项C — cache_creation_input_tokens nested breakdown 回填单元测试
//
// 覆盖：
// 1. updateUsage：顶层 cache_creation_input_tokens=0 + nested 1h+5m 有值 → 回填求和
// 2. updateUsage：顶层 cache_creation_input_tokens>0 → 不动（保持原值，正常上报路径）
// 3. extractUnifiedCacheUsage：顶层 0 + nested 有值 → 回填
// 4. extractUnifiedCacheUsage：顶层非 0 → 保持不变

import { describe, expect, test } from 'bun:test'
import { updateUsage } from './claude.js'
import { extractUnifiedCacheUsage } from './unifiedCacheUsage.js'
import { EMPTY_USAGE } from './emptyUsage.js'

// --------------------------------------------------------------------------
// updateUsage 用例
// --------------------------------------------------------------------------
describe('updateUsage — cache_creation_input_tokens nested breakdown 回填', () => {
  test('顶层 cache_creation_input_tokens=0，nested 1h+5m 有值 → 从 nested 求和回填', () => {
    // updateUsage(baseUsage, deltaUsage)：第二参数 deltaUsage 是本轮 API 返回的 raw usage
    const deltaUsage = {
      ...EMPTY_USAGE,
      input_tokens: 100,
      cache_creation_input_tokens: 0, // 顶层为 0
      cache_read_input_tokens: 0,
      output_tokens: 10,
      cache_creation: {
        ephemeral_1h_input_tokens: 17000, // nested 1h 有值
        ephemeral_5m_input_tokens: 500,   // nested 5m 有值
      },
    }
    const result = updateUsage(EMPTY_USAGE, deltaUsage as unknown as Parameters<typeof updateUsage>[1])
    // 期望：17000 + 500 = 17500（从 nested 回填）
    expect(result.cache_creation_input_tokens).toBe(17500)
  })

  test('顶层 cache_creation_input_tokens>0 → 保持原值，不被 nested 覆盖', () => {
    const deltaUsage = {
      ...EMPTY_USAGE,
      input_tokens: 100,
      cache_creation_input_tokens: 12345, // 顶层已有非 0 值
      cache_read_input_tokens: 0,
      output_tokens: 10,
      cache_creation: {
        ephemeral_1h_input_tokens: 99999, // nested 有不同值
        ephemeral_5m_input_tokens: 999,
      },
    }
    const result = updateUsage(EMPTY_USAGE, deltaUsage as unknown as Parameters<typeof updateUsage>[1])
    // 期望：顶层值优先，不被 nested 覆盖
    expect(result.cache_creation_input_tokens).toBe(12345)
  })
})

// --------------------------------------------------------------------------
// extractUnifiedCacheUsage 用例
// --------------------------------------------------------------------------
describe('extractUnifiedCacheUsage — cache_creation_input_tokens nested breakdown 回填', () => {
  test('顶层 cache_creation_input_tokens=0，nested 1h+5m 有值 → cacheWriteTokens 从 nested 求和回填', () => {
    const rawUsage = {
      input_tokens: 200,
      cache_creation_input_tokens: 0,  // 顶层为 0
      cache_read_input_tokens: 300,
      cache_creation: {
        ephemeral_1h_input_tokens: 8000,
        ephemeral_5m_input_tokens: 200,
      },
    }
    const result = extractUnifiedCacheUsage(rawUsage)
    // 期望：8000 + 200 = 8200
    expect(result.cacheWriteTokens).toBe(8200)
    // cacheReadTokens 应保持顶层值不受影响
    expect(result.cacheReadTokens).toBe(300)
    expect(result.freshInputTokens).toBe(200)
  })

  test('顶层 cache_creation_input_tokens>0 → cacheWriteTokens 保持顶层值，不被 nested 覆盖', () => {
    const rawUsage = {
      input_tokens: 200,
      cache_creation_input_tokens: 5000, // 顶层已有值
      cache_read_input_tokens: 300,
      cache_creation: {
        ephemeral_1h_input_tokens: 9000, // nested 不同值
        ephemeral_5m_input_tokens: 100,
      },
    }
    const result = extractUnifiedCacheUsage(rawUsage)
    // 期望：顶层值优先
    expect(result.cacheWriteTokens).toBe(5000)
    expect(result.cacheReadTokens).toBe(300)
  })
})
