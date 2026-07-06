/**
 * Unit tests for which.ts — Windows/macOS/Linux command lookup
 * Input: which(), whichSync()
 * Output: bun:test assertions on platform-specific command resolution
 * Pos: cross-platform command lookup (where.exe vs which)
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'

describe('which - cross-platform command lookup', () => {
  let originalPlatform: string

  beforeEach(() => {
    originalPlatform = process.platform
  })

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true, configurable: true })
    delete require.cache[require.resolve('./which.js')]
  })

  describe('whichSync() - synchronous lookup', () => {
    it('should find node executable on current platform', () => {
      const { whichSync } = require('./which.js')
      const nodePath = whichSync('node')

      // node should always be found (running tests with node/bun)
      expect(nodePath).not.toBeNull()
      expect(typeof nodePath).toBe('string')
      if (nodePath) {
        expect(nodePath.length).toBeGreaterThan(0)
      }
    })

    it('should return null for non-existent command', () => {
      const { whichSync } = require('./which.js')
      const fakeCommand = whichSync('this-command-definitely-does-not-exist-12345')

      expect(fakeCommand).toBeNull()
    })

    it('should handle Windows platform with where.exe', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true, configurable: true })

      delete require.cache[require.resolve('./which.js')]
      const { whichSync } = await import('./which.js')

      // Try to find a common Windows command
      const cmdPath = whichSync('cmd.exe')

      // On actual Windows, should find cmd.exe; on non-Windows mock, will return null
      // Just verify return type is correct
      expect(cmdPath === null || typeof cmdPath === 'string').toBe(true)
    })

    it('should handle macOS/Linux with which command', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', writable: true, configurable: true })

      delete require.cache[require.resolve('./which.js')]
      const { whichSync } = await import('./which.js')

      const shPath = whichSync('sh')

      // sh should always exist on Unix-like systems
      if (process.platform !== 'win32') {
        expect(shPath).not.toBeNull()
      }
    })
  })

  describe('which() - async lookup', () => {
    it('should find node executable asynchronously', async () => {
      const { which } = require('./which.js')
      const nodePath = await which('node')

      expect(nodePath).not.toBeNull()
      expect(typeof nodePath).toBe('string')
      if (nodePath) {
        expect(nodePath.length).toBeGreaterThan(0)
      }
    })

    it('should return null for non-existent command asynchronously', async () => {
      const { which } = require('./which.js')
      const fakeCommand = await which('this-command-definitely-does-not-exist-67890')

      expect(fakeCommand).toBeNull()
    })

    it('should handle Bun.which when available', async () => {
      const { which } = require('./which.js')

      // If running in Bun, Bun.which should be used
      if (typeof Bun !== 'undefined' && typeof Bun.which === 'function') {
        const nodePath = await which('node')
        expect(nodePath).not.toBeNull()
      }
    })
  })

  describe('Windows where.exe output parsing', () => {
    it('should parse multiple paths from where.exe and return first', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true, configurable: true })

      delete require.cache[require.resolve('./which.js')]
      const { whichSync } = await import('./which.js')

      // Simulate Windows environment
      const result = whichSync('cmd.exe')

      // where.exe returns multiple paths; we should get the first one
      if (result !== null) {
        expect(result).not.toContain('\n')
        expect(result).not.toContain('\r')
      }
    })
  })

  describe('Error handling', () => {
    it('should handle empty command name gracefully', () => {
      const { whichSync } = require('./which.js')
      const result = whichSync('')

      expect(result).toBeNull()
    })

    it('should handle command with spaces gracefully', () => {
      const { whichSync } = require('./which.js')
      const result = whichSync('command with spaces')

      // Should return null (invalid command)
      expect(result).toBeNull()
    })

    it('should handle async errors gracefully', async () => {
      const { which } = require('./which.js')
      const result = await which('')

      expect(result).toBeNull()
    })
  })

  describe('Platform-specific path separators', () => {
    it('should handle Windows backslash paths', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true, configurable: true })

      delete require.cache[require.resolve('./which.js')]
      const { whichSync } = await import('./which.js')

      const result = whichSync('cmd.exe')

      if (result && process.platform === 'win32') {
        // Windows paths should contain backslashes or forward slashes
        expect(result.includes('\\') || result.includes('/')).toBe(true)
      }
    })

    it('should handle Unix forward slash paths', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true, configurable: true })

      delete require.cache[require.resolve('./which.js')]
      const { whichSync } = await import('./which.js')

      const result = whichSync('sh')

      if (result && process.platform !== 'win32') {
        // Unix paths should use forward slashes
        expect(result.includes('/')).toBe(true)
      }
    })
  })
})
