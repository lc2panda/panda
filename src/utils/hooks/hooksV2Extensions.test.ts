// Input: 6 字段（updatedToolOutput / effort / args[] / continueOnBlock / terminalSequence / 配置错误）的 schema/类型校验
// Output: Bun test assertions 覆盖 v2.1.121 / 133 / 139 / 141 / 142 五个上游基线
// Pos: Hooks v2 扩展字段单元测试 — task #164 + #161 合并
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import {
  HookCommandSchema,
} from '../../schemas/hooks.js'
import {
  hookJSONOutputSchema,
  syncHookResponseSchema,
} from '../../types/hooks.js'
import { resolveHookEffortField } from '../effort.js'

// Effort resolver consults CLAUDE_CODE_EFFORT_LEVEL → unset it for the duration
// of these tests so `appStateEffortValue` arguments are honored verbatim.
let savedEffortEnv: string | undefined
beforeAll(() => {
  savedEffortEnv = process.env.CLAUDE_CODE_EFFORT_LEVEL
  delete process.env.CLAUDE_CODE_EFFORT_LEVEL
})
afterAll(() => {
  if (savedEffortEnv !== undefined) {
    process.env.CLAUDE_CODE_EFFORT_LEVEL = savedEffortEnv
  }
})

describe('v2.1.121: hookSpecificOutput.updatedToolOutput', () => {
  test('PostToolUse 接受 updatedToolOutput 字段（任意工具）', () => {
    const parsed = syncHookResponseSchema().safeParse({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        updatedToolOutput: 'sanitized stdout',
      },
    })
    expect(parsed.success).toBe(true)
  })

  test('updatedToolOutput 与 updatedMCPToolOutput 可共存（MCP 后向兼容）', () => {
    const parsed = syncHookResponseSchema().safeParse({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        updatedMCPToolOutput: { content: [{ type: 'text', text: 'mcp' }] },
        updatedToolOutput: 'fallback',
      },
    })
    expect(parsed.success).toBe(true)
  })
})

describe('v2.1.133: effort field 注入', () => {
  test('显式 effortValue 时 enabled=true 且 level 在 0-3', () => {
    const f = resolveHookEffortField('medium')
    expect(f.enabled).toBe(true)
    expect(f.level).toBe(1)
  })

  test('无 effortValue 时 enabled=false 默认 high level', () => {
    const f = resolveHookEffortField(undefined)
    expect(f.enabled).toBe(false)
    expect(f.level).toBe(2)
  })

  test('low/medium/high/max 映射 0/1/2/3', () => {
    expect(resolveHookEffortField('low').level).toBe(0)
    expect(resolveHookEffortField('medium').level).toBe(1)
    expect(resolveHookEffortField('high').level).toBe(2)
    expect(resolveHookEffortField('max').level).toBe(3)
  })
})

describe('v2.1.139: args[] exec form', () => {
  test('args[] 配置通过校验', () => {
    const parsed = HookCommandSchema().safeParse({
      type: 'command',
      args: ['/bin/echo', '$tool_name', '/path with space/file'],
    })
    expect(parsed.success).toBe(true)
  })

  test('command 字符串单独配置通过校验（向后兼容）', () => {
    const parsed = HookCommandSchema().safeParse({
      type: 'command',
      command: 'echo hello',
    })
    expect(parsed.success).toBe(true)
  })

  test('同时配置 command 和 args 应被拒绝', () => {
    const parsed = HookCommandSchema().safeParse({
      type: 'command',
      command: 'echo hello',
      args: ['/bin/echo', 'hello'],
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join('\n')
      expect(msg).toContain('EITHER')
    }
  })

  test('command 和 args 都没配置应被拒绝', () => {
    const parsed = HookCommandSchema().safeParse({
      type: 'command',
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join('\n')
      expect(msg).toContain('either')
    }
  })

  test('args 为空数组应被拒绝（min(1)）', () => {
    const parsed = HookCommandSchema().safeParse({
      type: 'command',
      args: [],
    })
    expect(parsed.success).toBe(false)
  })
})

describe('v2.1.139: PostToolUse continueOnBlock', () => {
  test('decision=block + continueOnBlock=true 通过 schema', () => {
    const parsed = syncHookResponseSchema().safeParse({
      decision: 'block',
      reason: '请清理这个 console.log 再继续',
      continueOnBlock: true,
    })
    expect(parsed.success).toBe(true)
  })

  test('continueOnBlock 默认缺省（向后兼容）', () => {
    const parsed = syncHookResponseSchema().safeParse({
      decision: 'block',
      reason: 'blocked',
    })
    expect(parsed.success).toBe(true)
  })

  test('continueOnBlock 非 boolean 应被拒绝', () => {
    const parsed = syncHookResponseSchema().safeParse({
      decision: 'block',
      continueOnBlock: 'yes',
    })
    expect(parsed.success).toBe(false)
  })
})

describe('v2.1.141: terminalSequence', () => {
  test('terminalSequence 为字符串时通过', () => {
    const parsed = syncHookResponseSchema().safeParse({
      terminalSequence: '\u001b]0;Build done\u0007',
    })
    expect(parsed.success).toBe(true)
  })

  test('terminalSequence 为数字时拒绝', () => {
    const parsed = syncHookResponseSchema().safeParse({
      terminalSequence: 7,
    })
    expect(parsed.success).toBe(false)
  })

  test('hookJSONOutputSchema 也支持 terminalSequence（unionsync 路径）', () => {
    const parsed = hookJSONOutputSchema().safeParse({
      terminalSequence: '\u0007',
    })
    expect(parsed.success).toBe(true)
  })
})

describe('v2.1.142: 配置错误提示明确化', () => {
  test('Prompt hook 缺少 prompt 字段时错误信息提到 "prompt"', () => {
    const parsed = HookCommandSchema().safeParse({
      type: 'prompt',
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join('\n')
      // 必须显式包含 hook type / "prompt" 字段名
      expect(msg.toLowerCase()).toContain('prompt')
    }
  })

  test('Prompt hook prompt 为空字符串时错误信息明确（不能为空）', () => {
    const parsed = HookCommandSchema().safeParse({
      type: 'prompt',
      prompt: '',
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join('\n')
      expect(msg).toContain('empty')
    }
  })

  test('Agent hook 缺少 prompt 字段时错误信息提到 "agent" 和 "prompt"', () => {
    const parsed = HookCommandSchema().safeParse({
      type: 'agent',
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join('\n')
      expect(msg.toLowerCase()).toContain('agent')
      expect(msg.toLowerCase()).toContain('prompt')
    }
  })

  test('Agent hook prompt 为空字符串时错误信息明确（不能为空）', () => {
    const parsed = HookCommandSchema().safeParse({
      type: 'agent',
      prompt: '',
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join('\n')
      expect(msg).toContain('empty')
    }
  })
})

// -----------------------------------------------------------------------
// Wave3-E3 块 A — SessionStart sessionTitle
// -----------------------------------------------------------------------
describe('Wave3-E3 块 A: SessionStart sessionTitle schema', () => {
  test('SessionStart output schema 接受 sessionTitle 字段', () => {
    const parsed = syncHookResponseSchema().safeParse({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        sessionTitle: 'My project session',
      },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.hookSpecificOutput?.hookEventName).toBe('SessionStart')
      expect((parsed.data.hookSpecificOutput as {sessionTitle?: string}).sessionTitle).toBe('My project session')
    }
  })

  test('SessionStart output schema sessionTitle 缺省时不影响解析（可选字段）', () => {
    const parsed = syncHookResponseSchema().safeParse({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: 'some context',
      },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect((parsed.data.hookSpecificOutput as {sessionTitle?: string}).sessionTitle).toBeUndefined()
    }
  })

  test('SessionStart sessionTitle 为数字时 schema 拒绝', () => {
    const parsed = syncHookResponseSchema().safeParse({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        sessionTitle: 42,
      },
    })
    expect(parsed.success).toBe(false)
  })
})

// -----------------------------------------------------------------------
// Wave3-E3 块 B — MessageDisplay hook schema
// -----------------------------------------------------------------------
describe('Wave3-E3 块 B: MessageDisplay hook schema', () => {
  test('MessageDisplay output schema 接受 suppress=true', () => {
    const parsed = syncHookResponseSchema().safeParse({
      hookSpecificOutput: {
        hookEventName: 'MessageDisplay',
        suppress: true,
      },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      const out = parsed.data.hookSpecificOutput as {hookEventName: string; suppress?: boolean}
      expect(out.hookEventName).toBe('MessageDisplay')
      expect(out.suppress).toBe(true)
    }
  })

  test('MessageDisplay output schema 接受 replacementContent 字符串', () => {
    const parsed = syncHookResponseSchema().safeParse({
      hookSpecificOutput: {
        hookEventName: 'MessageDisplay',
        replacementContent: '**替换后的内容**',
      },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      const out = parsed.data.hookSpecificOutput as {hookEventName: string; replacementContent?: string}
      expect(out.replacementContent).toBe('**替换后的内容**')
    }
  })

  test('MessageDisplay 字段全部缺省时解析成功（所有字段均可选）', () => {
    const parsed = syncHookResponseSchema().safeParse({
      hookSpecificOutput: {
        hookEventName: 'MessageDisplay',
      },
    })
    expect(parsed.success).toBe(true)
  })

  test('MessageDisplay suppress 为字符串时 schema 拒绝', () => {
    const parsed = syncHookResponseSchema().safeParse({
      hookSpecificOutput: {
        hookEventName: 'MessageDisplay',
        suppress: 'yes',
      },
    })
    expect(parsed.success).toBe(false)
  })

  test('HOOK_EVENTS 包含 MessageDisplay', () => {
    const { HOOK_EVENTS } = require('../../entrypoints/sdk/coreTypes.js')
    expect(HOOK_EVENTS).toContain('MessageDisplay')
  })
})
