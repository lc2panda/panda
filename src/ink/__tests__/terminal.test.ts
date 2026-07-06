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
    // Note: These tests run on the current platform. Windows-specific behavior
    // is tested conditionally to avoid false positives on macOS/Linux CI.

    it('should detect Termius via TERMIUS_VERSION on Windows', async () => {
      if (process.platform !== 'win32') {
        return // Skip on non-Windows
      }
      process.env.TERMIUS_VERSION = '8.5.0'
      delete process.env.MOBAXTERM_VERSION
      delete process.env.SSH_CLIENT
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(true)
    })

    it('should exclude MobaXterm (True Color support)', async () => {
      if (process.platform !== 'win32') {
        return // Skip on non-Windows
      }
      process.env.MOBAXTERM_VERSION = '23.2'
      process.env.SSH_CLIENT = '192.168.1.100 12345 22'
      delete process.env.TERMIUS_VERSION
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(false)
    })

    it('should detect generic SSH via SSH_CLIENT on Windows', async () => {
      if (process.platform !== 'win32') {
        return // Skip on non-Windows
      }
      process.env.SSH_CLIENT = '10.0.0.5 54321 22'
      delete process.env.TERMIUS_VERSION
      delete process.env.MOBAXTERM_VERSION
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(true)
    })

    it('should detect generic SSH via SSH_CONNECTION on Windows', async () => {
      if (process.platform !== 'win32') {
        return // Skip on non-Windows
      }
      process.env.SSH_CONNECTION = '10.0.0.5 54321 10.0.0.10 22'
      delete process.env.SSH_CLIENT
      delete process.env.TERMIUS_VERSION
      delete process.env.MOBAXTERM_VERSION
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(true)
    })

    it('should detect PuTTY via TERM heuristic (256-color without COLORTERM) on Windows', async () => {
      if (process.platform !== 'win32') {
        return // Skip on non-Windows
      }
      process.env.TERM = 'xterm-256color'
      delete process.env.COLORTERM
      delete process.env.SSH_CLIENT
      delete process.env.SSH_CONNECTION
      delete process.env.TERMIUS_VERSION
      delete process.env.MOBAXTERM_VERSION
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(true)
    })

    it('should exclude True Color terminals with COLORTERM=truecolor on Windows', async () => {
      if (process.platform !== 'win32') {
        return // Skip on non-Windows
      }
      process.env.TERM = 'xterm-256color'
      process.env.COLORTERM = 'truecolor'
      delete process.env.SSH_CLIENT
      delete process.env.SSH_CONNECTION
      delete process.env.TERMIUS_VERSION
      delete process.env.MOBAXTERM_VERSION
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(false)
    })

    it('should return false on macOS/Linux even with TERMIUS_VERSION', async () => {
      if (process.platform === 'win32') {
        return // Skip on Windows
      }
      process.env.TERMIUS_VERSION = '8.5.0'
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(false)
    })

    it('should return false for native Windows terminals (no SSH env)', async () => {
      if (process.platform !== 'win32') {
        return // Skip on non-Windows
      }
      delete process.env.SSH_CLIENT
      delete process.env.SSH_CONNECTION
      delete process.env.TERMIUS_VERSION
      delete process.env.TERM
      delete process.env.MOBAXTERM_VERSION
      delete require.cache[require.resolve('../terminal.js')]
      const { shouldUseDegradedColors } = await import('../terminal.js')
      expect(shouldUseDegradedColors()).toBe(false)
    })

    it('should prioritize MOBAXTERM_VERSION exclusion over SSH_CLIENT', async () => {
      if (process.platform !== 'win32') {
        return // Skip on non-Windows
      }
      process.env.MOBAXTERM_VERSION = '23.2'
      process.env.SSH_CLIENT = '192.168.1.100 12345 22'
      process.env.TERM = 'xterm-256color'
      delete process.env.TERMIUS_VERSION
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

describe('ConEmu support (ConEmuANSI)', () => {
  const originalConEmuANSI = process.env.ConEmuANSI
  const originalWtSession = process.env.WT_SESSION

  afterEach(() => {
    if (originalConEmuANSI !== undefined) {
      process.env.ConEmuANSI = originalConEmuANSI
    } else {
      delete process.env.ConEmuANSI
    }
    if (originalWtSession !== undefined) {
      process.env.WT_SESSION = originalWtSession
    } else {
      delete process.env.WT_SESSION
    }
    delete require.cache[require.resolve('../terminal.js')]
  })

  it('isProgressReportingAvailable should support ConEmu (ConEmuANSI)', async () => {
    process.env.ConEmuANSI = 'ON'
    delete process.env.WT_SESSION

    delete require.cache[require.resolve('../terminal.js')]
    const { isProgressReportingAvailable } = await import('../terminal.js')

    // ConEmu supports OSC 9;4 for progress
    expect(isProgressReportingAvailable()).toBe(true)
  })

  it('isSynchronizedOutputSupported should support ConEmu', async () => {
    process.env.ConEmuANSI = 'ON'
    delete process.env.WT_SESSION

    delete require.cache[require.resolve('../terminal.js')]
    const { isSynchronizedOutputSupported } = await import('../terminal.js')

    // ConEmu supports DEC mode 2026
    expect(isSynchronizedOutputSupported()).toBe(true)
  })
})
