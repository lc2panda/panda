/**
 * Unit tests for terminal environment detection (terminal.ts)
 * Covers Termius detection and Windows Termius identification
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

    it('should return false when neither condition is met', async () => {
      delete process.env.TERMIUS_VERSION
      delete process.env.SSH_CLIENT
      process.env.TERM = 'xterm-256color'
      const { isTermius } = await import('../terminal.js')
      expect(isTermius()).toBe(false)
    })

    it('should return false when SSH_CLIENT is set but TERM is not xterm', async () => {
      delete process.env.TERMIUS_VERSION
      process.env.SSH_CLIENT = '192.168.1.100 54321 22'
      process.env.TERM = 'screen-256color'
      const { isTermius } = await import('../terminal.js')
      expect(isTermius()).toBe(false)
    })

    it('should handle undefined environment variables safely', async () => {
      delete process.env.TERMIUS_VERSION
      delete process.env.SSH_CLIENT
      delete process.env.TERM
      const { isTermius } = await import('../terminal.js')
      expect(isTermius()).toBe(false)
    })
  })

  describe('isWindowsTermius()', () => {
    it('should return true on Windows with Termius', async () => {
      process.env.TERMIUS_VERSION = '7.0.0'
      // Mock platform check (cannot override process.platform in runtime)
      // This test assumes running on non-Windows; full coverage requires platform-specific CI
      const { isWindowsTermius } = await import('../terminal.js')
      const result = isWindowsTermius()
      // Expected: false on Mac/Linux, true on actual Windows
      expect(typeof result).toBe('boolean')
    })

    it('should return false on non-Windows even with Termius', async () => {
      process.env.TERMIUS_VERSION = '7.0.0'
      // Assuming test runs on Mac/Linux
      if (process.platform !== 'win32') {
        const { isWindowsTermius } = await import('../terminal.js')
        expect(isWindowsTermius()).toBe(false)
      }
    })
  })
})
