/**
 * Input:  parseDefaultTab() 入参 args + /cost /stats /usage 三命令的 call() 调度断言
 * Output: 验证以下行为：
 *   1) parseDefaultTab 默认值 + 别名解析（cost/stats/usage 大小写不敏感）
 *   2) /cost 调用 → 委托 usage 命令并传入 args='cost'
 *   3) /stats 调用 → 委托 usage 命令并传入 args='stats'
 *   4) /usage 默认 args='' → 解析为 'Usage' tab
 * Pos:    src/commands/usage/usage.test.ts — 单元 + 集成测试，验证三命令合并后
 *         的 thin shim 逻辑、tab 解析、与命令注册元信息。
 *
 * 说明：本文件是测试文件，按 CLAUDE.md "白名单 b 条 — 缺失且必需的最小单元测试" 允许新建。
 */
import { test, expect, describe } from 'bun:test'
import { parseDefaultTab } from './usage.js'
import costCmd from '../cost/index.js'
import statsCmd from '../stats/index.js'
import usageCmd from './index.js'

describe('parseDefaultTab — args 解析', () => {
  test('undefined / 空字符串 → Usage', () => {
    expect(parseDefaultTab(undefined)).toBe('Usage')
    expect(parseDefaultTab('')).toBe('Usage')
    expect(parseDefaultTab('   ')).toBe('Usage')
  })

  test('cost 别名（大小写不敏感）→ Cost', () => {
    expect(parseDefaultTab('cost')).toBe('Cost')
    expect(parseDefaultTab('Cost')).toBe('Cost')
    expect(parseDefaultTab('COST')).toBe('Cost')
    expect(parseDefaultTab(' cost ')).toBe('Cost')
  })

  test('stats 别名（大小写不敏感）→ Stats', () => {
    expect(parseDefaultTab('stats')).toBe('Stats')
    expect(parseDefaultTab('Stats')).toBe('Stats')
    expect(parseDefaultTab('STATS')).toBe('Stats')
  })

  test('usage 显式 → Usage', () => {
    expect(parseDefaultTab('usage')).toBe('Usage')
    expect(parseDefaultTab('Usage')).toBe('Usage')
  })

  test('未识别值 → 兜底 Usage', () => {
    expect(parseDefaultTab('bogus')).toBe('Usage')
    expect(parseDefaultTab('foo')).toBe('Usage')
  })
})

describe('命令注册元信息', () => {
  test('cost 命令注册为 local-jsx 类型', () => {
    expect(costCmd.type).toBe('local-jsx')
    expect(costCmd.name).toBe('cost')
    expect(costCmd.description).toContain('cost')
  })

  test('stats 命令注册为 local-jsx 类型', () => {
    expect(statsCmd.type).toBe('local-jsx')
    expect(statsCmd.name).toBe('stats')
  })

  test('usage 命令注册为 local-jsx 类型', () => {
    expect(usageCmd.type).toBe('local-jsx')
    expect(usageCmd.name).toBe('usage')
    expect(usageCmd.availability).toContain('claude-ai')
  })
})

/**
 * 集成层：模拟 /cost /stats /usage 三个 thin shim 调度链
 * 由于 usage.tsx 的 call 返回 React 节点，且依赖 React 运行时，
 * 我们只验证 thin shim 是否正确委托到 usage.call —— 通过 mock 其 module。
 */
describe('thin shim 调度', () => {
  test('/cost call() 委托到 usage 命令并传 args="cost"', async () => {
    const { mock } = await import('bun:test')
    let receivedArgs: string | undefined
    let receivedOnDone: any
    let receivedContext: any
    mock.module('../usage/usage.js', () => ({
      // 我们要测 cost.ts 是否会调到 usage.call(onDone, ctx, 'cost')
      call: async (onDone: any, context: any, args: string) => {
        receivedArgs = args
        receivedOnDone = onDone
        receivedContext = context
        return null
      },
      // parseDefaultTab + UnifiedUsage 一并 stub（避免类型校验失败）
      parseDefaultTab: () => 'Cost',
      UnifiedUsage: () => null,
    }))
    const costMod = await import('./../cost/cost.js?cost-shim=1')
    const fakeOnDone = (() => {}) as any
    const fakeCtx = { foo: 'bar' } as any
    await costMod.call(fakeOnDone, fakeCtx, '')
    expect(receivedArgs).toBe('cost')
    expect(receivedOnDone).toBe(fakeOnDone)
    expect(receivedContext).toBe(fakeCtx)
    mock.restore()
  })

  test('/stats call() 委托到 usage 命令并传 args="stats"', async () => {
    const { mock } = await import('bun:test')
    let receivedArgs: string | undefined
    mock.module('../usage/usage.js', () => ({
      call: async (_onDone: any, _ctx: any, args: string) => {
        receivedArgs = args
        return null
      },
      parseDefaultTab: () => 'Stats',
      UnifiedUsage: () => null,
    }))
    const statsMod = await import('./../stats/stats.js?stats-shim=1')
    await statsMod.call((() => {}) as any, {} as any, '')
    expect(receivedArgs).toBe('stats')
    mock.restore()
  })
})
