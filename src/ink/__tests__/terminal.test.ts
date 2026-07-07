// Input: mocked terminal environment variables
// Output: terminal color/detection assertions
// Pos: Windows/SSH/Termius rendering regression guard
/**
 * Unit tests for terminal environment detection (terminal.ts)
 * Covers SSH client detection, color downgrade logic, and ANSI parsing
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'

describe('Termius Environment Detection', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
    // Clear module cache to force re-import with new env
    delete require.cache[require.resolve('../terminal.js')]
  })

  describe('isTermius()', () => {
    it('should return true when TERMIUS_VERSION is set', async () => {
      process.env.TERMIUS_VERSION = '7.0.0'
      const { isTermius } = await import('../terminal.js')
      expect(isTermius()).toBe(true)
    })

    it('should return true when SSH_CLIENT and TERM=xterm-256color', async () => {
      delete process.env.TERMIUS_VERSION
      process.env.SSH_CLIENT = '192.168.1.100 54321 22'
      process.env.TERM = 'xterm-256color'
      const { isTermius } = await import('../terminal.js')
      expect(isTermius()).toBe(true)
    })

    it('should return false when no Termius indicators present', async () => {
      delete process.env.TERMIUS_VERSION
      delete process.env.SSH_CLIENT
      delete process.env.TERM
      const { isTermius } = await import('../terminal.js')
      expect(isTermius()).toBe(false)
    })

    it('should return false when SSH_CLIENT but no xterm TERM', async () => {
      delete process.env.TERMIUS_VERSION
      process.env.SSH_CLIENT = '192.168.1.100 54321 22'
      process.env.TERM = 'vt100'
      const { isTermius } = await import('../terminal.js')
      expect(isTermius()).toBe(false)
    })
  })

  describe('shouldUseDegradedColors()', () => {
    it('should not downgrade solely because TERMIUS_VERSION is set', async () => {
      process.env.TERMIUS_VERSION = '8.5.0'
      process.env.COLORTERM = 'truecolor'
      delete process.env.MOBAXTERM_VERSION
      delete process.env.SSH_CLIENT
      delete process.env.SSH_CONNECTION
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(false)
    })

    it('should allow PANDA_FORCE_TRUECOLOR to bypass weak TERM downgrade', async () => {
      process.env.PANDA_FORCE_TRUECOLOR = '1'
      process.env.TERM = 'vt100'
      process.env.TERMIUS_VERSION = '8.5.0'
      delete process.env.COLORTERM
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(false)
    })

    it('should allow PANDA_FORCE_ANSI256 to force downgrade', async () => {
      process.env.PANDA_FORCE_ANSI256 = '1'
      process.env.COLORTERM = 'truecolor'
      delete process.env.TERMIUS_VERSION
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(true)
    })

    it('should exclude MobaXterm (True Color support)', async () => {
      process.env.MOBAXTERM_VERSION = '23.2'
      process.env.SSH_CLIENT = '192.168.1.100 12345 22'
      process.env.TERM = 'xterm-256color'
      delete process.env.TERMIUS_VERSION
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(false)
    })

    it('should not downgrade SSH xterm-256color without COLORTERM', async () => {
      process.env.SSH_CLIENT = '10.0.0.5 54321 22'
      process.env.TERM = 'xterm-256color'
      delete process.env.COLORTERM
      delete process.env.TERMIUS_VERSION
      delete process.env.MOBAXTERM_VERSION
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(false)
    })

    it('should not downgrade SSH xterm-256color when COLORTERM=truecolor', async () => {
      process.env.SSH_CONNECTION = '10.0.0.5 54321 10.0.0.10 22'
      process.env.TERM = 'xterm-256color'
      process.env.COLORTERM = 'truecolor'
      delete process.env.SSH_CLIENT
      delete process.env.TERMIUS_VERSION
      delete process.env.MOBAXTERM_VERSION
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(false)
    })

    it('should not downgrade SSH/Termius when COLORTERM=truecolor', async () => {
      process.env.SSH_CONNECTION = '10.0.0.5 54321 10.0.0.10 22'
      process.env.TERMIUS_VERSION = '9.0.0'
      process.env.TERM = 'xterm-256color'
      process.env.COLORTERM = 'truecolor'
      delete process.env.SSH_CLIENT
      delete process.env.MOBAXTERM_VERSION
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(false)
    })

    it('should downgrade only for clearly weak TERM without truecolor or 256color', async () => {
      process.env.SSH_CONNECTION = '10.0.0.5 54321 10.0.0.10 22'
      process.env.TERM = 'vt100'
      delete process.env.COLORTERM
      delete process.env.SSH_CLIENT
      delete process.env.TERMIUS_VERSION
      delete process.env.MOBAXTERM_VERSION
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(true)
    })

    it('should return false for native terminals without SSH env', async () => {
      delete process.env.SSH_CLIENT
      delete process.env.SSH_CONNECTION
      delete process.env.TERMIUS_VERSION
      delete process.env.TERM
      delete process.env.MOBAXTERM_VERSION
      delete process.env.COLORTERM
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(false)
    })
  })

  describe('isWindowsTermius() [legacy alias]', () => {
    it('should return same result as shouldUseDegradedColors', async () => {
      if (process.platform !== 'win32') {
        return // Skip on non-Windows
      }
      process.env.TERMIUS_VERSION = '8.5.0'
      delete require.cache[require.resolve('../terminal.js')]
      const { isWindowsTermius, shouldUseDegradedColors } = await import(
        '../terminal.js'
      )
      expect(isWindowsTermius()).toBe(shouldUseDegradedColors())
      expect(isWindowsTermius()).toBe(true)
    })
  })
})

describe('Windows clipboard command selection', () => {
  it('should prefer PowerShell and avoid clip.exe for non-ASCII clipboard text', async () => {
    const { getWindowsClipboardCommands } = await import('../termio/osc.js')
    const commands = getWindowsClipboardCommands('中文👋\n第二行')

    expect(commands[0]?.command).toBe('pwsh')
    expect(commands[1]?.command).toBe('powershell.exe')
    expect(commands[0]?.args).toContain('-EncodedCommand')
    expect(commands.some(command => command.command === 'clip')).toBe(false)
  })

  it('should keep clip.exe as final ASCII fallback', async () => {
    const { getWindowsClipboardCommands } = await import('../termio/osc.js')
    const commands = getWindowsClipboardCommands('plain ascii\nsecond line')

    expect(commands[0]?.command).toBe('pwsh')
    expect(commands[1]?.command).toBe('powershell.exe')
    expect(commands[0]?.args).toContain('-EncodedCommand')
    expect(commands.at(-1)?.command).toBe('clip')
  })
})

describe('Windows Terminal local mode detection (WT_SESSION)', () => {
  const originalWtSession = process.env.WT_SESSION

  afterEach(() => {
    if (originalWtSession !== undefined) {
      process.env.WT_SESSION = originalWtSession
    } else {
      delete process.env.WT_SESSION
    }
    delete require.cache[require.resolve('../terminal.js')]
  })

  it('isProgressReportingAvailable should exclude Windows Terminal (WT_SESSION)', async () => {
    process.env.WT_SESSION = 'uuid-12345-abcde'

    delete require.cache[require.resolve('../terminal.js')]
    const { isProgressReportingAvailable } = await import('../terminal.js')

    // Windows Terminal interprets OSC 9;4 as notifications, not progress
    expect(isProgressReportingAvailable()).toBe(false)
  })

  it('isSynchronizedOutputSupported should support Windows Terminal (WT_SESSION)', async () => {
    process.env.WT_SESSION = 'uuid-67890-fghij'

    delete require.cache[require.resolve('../terminal.js')]
    const { isSynchronizedOutputSupported } = await import('../terminal.js')

    // Windows Terminal supports DEC mode 2026
    expect(isSynchronizedOutputSupported()).toBe(true)
  })

  it('shouldUseDegradedColors should return false for Windows Terminal', async () => {
    process.env.WT_SESSION = 'uuid-11111-kkkkk'

    delete require.cache[require.resolve('../terminal.js')]
    const { shouldUseDegradedColors } = await import('../terminal.js')

    // Windows Terminal supports True Color
    expect(shouldUseDegradedColors()).toBe(false)
  })
})
