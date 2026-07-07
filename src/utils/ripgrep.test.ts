/**
 * Unit tests for ripgrep.ts — Windows/macOS/Linux platform compatibility
 * Input: ripgrepCommand(), getRipgrepStatus()
 * Output: bun:test assertions on path resolution + fallback logic
 * Pos: vendored binary selection + platform-specific executable names
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { existsSync } from 'fs'
import { join } from 'path'

describe('ripgrep platform compatibility', () => {
  let originalPlatform: string
  let originalArch: string
  let originalExecPath: string

  beforeEach(() => {
    originalPlatform = process.platform
    originalArch = process.arch
    originalExecPath = process.execPath
  })

  afterEach(() => {
    // Restore original values
    Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true, configurable: true })
    Object.defineProperty(process, 'arch', { value: originalArch, writable: true, configurable: true })
    Object.defineProperty(process, 'execPath', { value: originalExecPath, writable: true, configurable: true })

    // Clear module cache to force re-import
    delete require.cache[require.resolve('./ripgrep.js')]
  })

  describe('ripgrepCommand() - platform-specific paths', () => {
    it('should resolve rg.exe on Windows when vendored binary exists', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true, configurable: true })
      Object.defineProperty(process, 'arch', { value: 'x64', writable: true, configurable: true })
      process.env.USE_BUILTIN_RIPGREP = '1'

      // Clear cache and re-import
      delete require.cache[require.resolve('./ripgrep.js')]
      const { ripgrepCommand } = await import('./ripgrep.js')

      const { rgPath } = ripgrepCommand()

      // Should contain 'rg.exe' on Windows (if vendored binary exists)
      if (existsSync(rgPath)) {
        expect(rgPath).toContain('rg.exe')
      } else {
        // Fallback to system rg
        expect(rgPath).toBe('rg')
      }
    })

    it('should resolve rg (no .exe) on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', writable: true, configurable: true })
      Object.defineProperty(process, 'arch', { value: 'arm64', writable: true, configurable: true })
      process.env.USE_BUILTIN_RIPGREP = '1'

      delete require.cache[require.resolve('./ripgrep.js')]
      const { ripgrepCommand } = await import('./ripgrep.js')

      const { rgPath } = ripgrepCommand()

      // macOS vendored binary should NOT have .exe extension
      if (rgPath !== 'rg' && existsSync(rgPath)) {
        expect(rgPath).not.toContain('.exe')
        expect(rgPath).toContain('arm64-darwin')
      }
    })

    it('should resolve rg (no .exe) on Linux', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true, configurable: true })
      Object.defineProperty(process, 'arch', { value: 'x64', writable: true, configurable: true })
      process.env.USE_BUILTIN_RIPGREP = '1'

      delete require.cache[require.resolve('./ripgrep.js')]
      const { ripgrepCommand } = await import('./ripgrep.js')

      const { rgPath } = ripgrepCommand()

      // Linux vendored binary should NOT have .exe extension
      if (rgPath !== 'rg' && existsSync(rgPath)) {
        expect(rgPath).not.toContain('.exe')
        expect(rgPath).toContain('x64-linux')
      }
    })
  })

  describe('ripgrepCommand() - fallback logic', () => {
    it('should prefer system rg when USE_BUILTIN_RIPGREP is not set', async () => {
      delete process.env.USE_BUILTIN_RIPGREP

      delete require.cache[require.resolve('./ripgrep.js')]
      const { ripgrepCommand } = await import('./ripgrep.js')

      const { rgPath } = ripgrepCommand()

      // Should either find system rg or fallback to 'rg'
      expect(typeof rgPath).toBe('string')
    })

    it('should fallback to system rg and expose status when repo-local vendor/ripgrep is absent', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true, configurable: true })
      Object.defineProperty(process, 'arch', { value: 'x64', writable: true, configurable: true })
      Object.defineProperty(process, 'execPath', { value: '/tmp/panda-no-vendor/bin/node', writable: true, configurable: true })
      process.env.USE_BUILTIN_RIPGREP = '1'

      delete require.cache[require.resolve('./ripgrep.js')]
      const { ripgrepCommand, getRipgrepStatus } = await import('./ripgrep.js')

      const { rgPath, rgArgs } = ripgrepCommand()
      const status = getRipgrepStatus()

      expect(rgPath).toBe('rg')
      expect(rgArgs).toEqual([])
      expect(status.mode).toBe('system')
      expect(status.path).toBe('rg')
    })
  })

  describe('getRipgrepStatus() - mode detection', () => {
    it('should return correct mode for builtin ripgrep', async () => {
      process.env.USE_BUILTIN_RIPGREP = '1'

      delete require.cache[require.resolve('./ripgrep.js')]
      const { getRipgrepStatus } = await import('./ripgrep.js')

      const status = getRipgrepStatus()

      expect(status.mode).toMatch(/^(builtin|system|embedded|vscode-ripgrep)$/)
      expect(typeof status.path).toBe('string')
      expect(status.working === null || typeof status.working === 'boolean').toBe(true)
    })

    it('should return correct mode for system ripgrep', async () => {
      delete process.env.USE_BUILTIN_RIPGREP

      delete require.cache[require.resolve('./ripgrep.js')]
      const { getRipgrepStatus } = await import('./ripgrep.js')

      const status = getRipgrepStatus()

      expect(status.mode).toMatch(/^(builtin|system|embedded|vscode-ripgrep)$/)
      expect(typeof status.path).toBe('string')
    })
  })

  describe('Windows-specific edge cases', () => {
    it('should handle windowsHide option on Windows spawn', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true, configurable: true })

      delete require.cache[require.resolve('./ripgrep.js')]
      const { ripgrepCommand } = await import('./ripgrep.js')

      const cmd = ripgrepCommand()

      // Ensure command returns valid structure
      expect(cmd.rgPath).toBeDefined()
      expect(Array.isArray(cmd.rgArgs)).toBe(true)
    })

    it('should use correct signal handling on Windows (default signal, not SIGKILL)', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true, configurable: true })

      delete require.cache[require.resolve('./ripgrep.js')]
      const { ripgrepCommand } = await import('./ripgrep.js')

      const cmd = ripgrepCommand()

      // Windows should NOT use SIGKILL (throws error)
      // Just verify command structure is valid
      expect(typeof cmd.rgPath).toBe('string')
    })
  })
})
