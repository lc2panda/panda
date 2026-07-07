// Input: mocked Windows PATH/Git Bash environment
// Output: assertions for Git Bash resolution and PowerShell/cmd startup fallback
// Pos: Windows init shell compatibility guard; update when windowsPaths policy changes

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'

describe('windowsPaths Git Bash fallback', () => {
  let originalPlatform: PropertyDescriptor | undefined
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')
    originalEnv = { ...process.env }
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      writable: true,
      configurable: true,
    })
    process.env.PATH = ''
    process.env.Path = ''
    delete process.env.CLAUDE_CODE_GIT_BASH_PATH
    delete process.env.SHELL
    delete require.cache[require.resolve('./windowsPaths.js')]
  })

  afterEach(() => {
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform)
    }
    process.env = originalEnv
    mock.restore()
    delete require.cache[require.resolve('./windowsPaths.js')]
  })

  it('does not exit during Windows startup when Git Bash is missing', async () => {
    const exitSpy = mock((() => undefined) as typeof process.exit)
    process.exit = exitSpy

    const { resolveGitBashPath, setShellIfWindows } = await import(
      './windowsPaths.js'
    )

    expect(resolveGitBashPath()).toBeNull()
    setShellIfWindows()

    expect(exitSpy).not.toHaveBeenCalled()
    expect(process.env.SHELL).toBeUndefined()
  })

  it('still fails clearly when a bash-only path explicitly requires Git Bash', async () => {
    const exitSpy = mock((() => undefined) as typeof process.exit)
    const errorSpy = mock(() => undefined)
    process.exit = exitSpy
    console.error = errorSpy

    const { findGitBashPath } = await import('./windowsPaths.js')

    findGitBashPath()

    expect(exitSpy).toHaveBeenCalledWith(1)
    const errorCalls = errorSpy.mock.calls as unknown as Array<[unknown]>
    expect(String(errorCalls[0]?.[0])).toContain('PowerShell/cmd startup can continue')
    expect(String(errorCalls[0]?.[0])).toContain('CLAUDE_CODE_GIT_BASH_PATH')
  })
})
