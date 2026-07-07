// Wave1-项1：无空格 cd 变体 + 盘符跳转绕过修复 — 单元测试
// Input: hasDirectoryChange (parser.ts) + isCwdChangingCmdlet (readOnlyValidation.ts)
// Output: 验证 cd.. / cd\ / cd~ / X: 均被识别为 cwd-changing，正常 cd/Set-Location 不受影响
// Pos: PowerShellTool 安全守卫层，modeValidation.ts 依赖 hasDirectoryChange 触发 cwd-change 守卫

import { test, expect, describe } from 'bun:test'
import {
  hasDirectoryChange,
  type ParsedPowerShellCommand,
} from '../../utils/powershell/parser.js'
import { isCwdChangingCmdlet } from './readOnlyValidation.js'

// ── 辅助：构造最小 ParsedPowerShellCommand，仅含命令名列表 ────────────────────
function makeParsed(cmdNames: string[]): ParsedPowerShellCommand {
  return {
    valid: true,
    errors: [],
    variables: [],
    hasStopParsing: false,
    originalCommand: cmdNames.join('; '),
    statements: cmdNames.map((name) => ({
      statementType: 'Pipeline' as const,
      text: name,
      redirections: [],
      commands: [
        {
          name,
          nameType: 'application' as const,
          elementType: 'Command' as const,
          args: [],
          text: name,
        },
      ],
    })),
  } as unknown as ParsedPowerShellCommand
}

// ── 1. isCwdChangingCmdlet：无空格 cd 变体识别 ─────────────────────────────────
describe('isCwdChangingCmdlet — 无空格 cd 变体', () => {
  test('cd.. 被识别为 cwd-changing', () => {
    expect(isCwdChangingCmdlet('cd..')).toBe(true)
  })

  test('cd\\ 被识别为 cwd-changing', () => {
    expect(isCwdChangingCmdlet('cd\\')).toBe(true)
  })

  test('cd~ 被识别为 cwd-changing', () => {
    expect(isCwdChangingCmdlet('cd~')).toBe(true)
  })

  test('cd/ 被识别为 cwd-changing', () => {
    expect(isCwdChangingCmdlet('cd/')).toBe(true)
  })

  test('大写 CD.. 同样被识别（大小写不敏感）', () => {
    expect(isCwdChangingCmdlet('CD..')).toBe(true)
  })
})

// ── 2. isCwdChangingCmdlet：盘符跳转识别 ────────────────────────────────────────
describe('isCwdChangingCmdlet — 盘符跳转', () => {
  test('C: 被识别为 cwd-changing', () => {
    expect(isCwdChangingCmdlet('C:')).toBe(true)
  })

  test('X: 被识别为 cwd-changing', () => {
    expect(isCwdChangingCmdlet('X:')).toBe(true)
  })

  test('小写 c: 同样被识别', () => {
    expect(isCwdChangingCmdlet('c:')).toBe(true)
  })

  test('z: 被识别为 cwd-changing', () => {
    expect(isCwdChangingCmdlet('z:')).toBe(true)
  })
})

// ── 3. isCwdChangingCmdlet：不误判非 cwd-changing 命令 ────────────────────────
describe('isCwdChangingCmdlet — 不影响正常命令', () => {
  test('cd（有空格场景的基础 alias）被识别为 cwd-changing', () => {
    // 正常 `cd path` 中命令名是 `cd`，仍然识别
    expect(isCwdChangingCmdlet('cd')).toBe(true)
  })

  test('Set-Location 被识别为 cwd-changing', () => {
    expect(isCwdChangingCmdlet('Set-Location')).toBe(true)
  })

  test('Get-Content 不是 cwd-changing', () => {
    expect(isCwdChangingCmdlet('Get-Content')).toBe(false)
  })

  test('Set-Content 不是 cwd-changing', () => {
    expect(isCwdChangingCmdlet('Set-Content')).toBe(false)
  })

  test('C:\\foo\\bar（路径参数，不是盘符跳转）不被识别', () => {
    // 包含 \\ 的路径是参数，不是命令名，但即使作为命令名也不匹配 /^[a-z]:$/
    expect(isCwdChangingCmdlet('C:\\foo\\bar')).toBe(false)
  })

  test('C:\\（盘符+路径分隔符，不是纯盘符跳转）不被识别', () => {
    expect(isCwdChangingCmdlet('C:\\')).toBe(false)
  })

  test('echo 不是 cwd-changing', () => {
    expect(isCwdChangingCmdlet('echo')).toBe(false)
  })
})

// ── 4. hasDirectoryChange：compound 命令中的 cd.. 触发守卫 ───────────────────────
describe('hasDirectoryChange — compound 命令守卫', () => {
  test('cd.. 单独出现 — 识别为 cwd-changing', () => {
    const parsed = makeParsed(['cd..'])
    expect(hasDirectoryChange(parsed)).toBe(true)
  })

  test('compound: cd.. ; Set-Content — 整体被识别为含 cwd-change', () => {
    // 模拟 `cd..; Set-Content secret.txt payload` 中的两条语句
    const parsed = makeParsed(['cd..', 'Set-Content'])
    expect(hasDirectoryChange(parsed)).toBe(true)
  })

  test('X: 盘符跳转单独出现 — 识别为 cwd-changing', () => {
    const parsed = makeParsed(['X:'])
    expect(hasDirectoryChange(parsed)).toBe(true)
  })

  test('compound: C: ; Set-Content — 整体被识别为含 cwd-change', () => {
    const parsed = makeParsed(['C:', 'Set-Content'])
    expect(hasDirectoryChange(parsed)).toBe(true)
  })

  test('正常 cd（带空格路径场景命令名）仍被识别', () => {
    const parsed = makeParsed(['cd'])
    expect(hasDirectoryChange(parsed)).toBe(true)
  })

  test('Set-Location 仍被识别', () => {
    const parsed = makeParsed(['Set-Location'])
    expect(hasDirectoryChange(parsed)).toBe(true)
  })

  test('纯只读命令 Get-Content 不被误识别为 cwd-changing', () => {
    const parsed = makeParsed(['Get-Content'])
    expect(hasDirectoryChange(parsed)).toBe(false)
  })

  test('纯写命令 Set-Content 不被误识别为 cwd-changing', () => {
    // Set-Content 本身不改 cwd，只是写文件
    const parsed = makeParsed(['Set-Content'])
    expect(hasDirectoryChange(parsed)).toBe(false)
  })
})
