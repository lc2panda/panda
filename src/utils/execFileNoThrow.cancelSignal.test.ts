/**
 * Input:  execFileNoThrowWithCwd with abortSignal
 * Output: resolves (never hangs); options use execa v9 cancelSignal
 * Pos:    guards panda update freeze after npm view (execa signal rename)
 */

import { describe, expect, test } from 'bun:test'
import { execFileNoThrowWithCwd } from './execFileNoThrow.js'

describe('execFileNoThrowWithCwd cancelSignal (execa v9)', () => {
  test('aborts long-running child within ~2s via cancelSignal path', async () => {
    // Live integration: pre-fix used `signal:` which made execa throw sync,
    // leaving the outer Promise pending forever. cancelSignal must terminate.
    const t0 = Date.now()
    const result = await execFileNoThrowWithCwd('sleep', ['30'], {
      abortSignal: AbortSignal.timeout(1000),
    })
    const ms = Date.now() - t0
    expect(ms).toBeLessThan(5000)
    expect(result.code).not.toBe(0)
  })

  test(
    'npm view returns (success or fail) without hanging the outer Promise',
    async () => {
      const t0 = Date.now()
      const result = await execFileNoThrowWithCwd(
        'npm',
        ['view', '@lc2panda/panda-code@latest', 'version', '--prefer-online'],
        {
          abortSignal: AbortSignal.timeout(12_000),
          cwd: process.env.HOME,
        },
      )
      const ms = Date.now() - t0
      expect(ms).toBeLessThan(20_000)
      expect(typeof result.code).toBe('number')
      expect(typeof result.stdout).toBe('string')
      if (result.code === 0) {
        expect(result.stdout.trim().length).toBeGreaterThan(0)
      }
    },
    25_000,
  )

  test('missing abortSignal still runs with default timeout (no throw)', async () => {
    const t0 = Date.now()
    const result = await execFileNoThrowWithCwd('printf', ['ok'], {
      timeout: 5_000,
    })
    expect(Date.now() - t0).toBeLessThan(5_000)
    expect(result.code).toBe(0)
    expect(result.stdout).toBe('ok')
  })
})
