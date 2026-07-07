// Input: bun test runner
// Output: smoke tests for /assistant-status command definition + loader
// Pos: assistantStatus command regression guard

import { test, expect } from 'bun:test'

test('assistantStatus command metadata', async () => {
  const mod = await import('./index.js')
  const cmd = mod.default
  expect(cmd).toBeDefined()
  expect(cmd.name).toBe('assistant-status')
  expect(cmd.type).toBe('local-jsx')
  expect(typeof cmd.description).toBe('string')
  expect(cmd.description.length).toBeGreaterThan(0)
})

test('assistantStatus isEnabled gated on KAIROS flag (dev mode: true)', async () => {
  const mod = await import('./index.js')
  const cmd = mod.default
  // In dev mode all feature flags are true, so this returns true.
  // In build mode with KAIROS disabled it returns false.
  expect(typeof cmd.isEnabled).toBe('function')
  const enabled = cmd.isEnabled!()
  expect(typeof enabled).toBe('boolean')
})

test('assistantStatus load() returns a call function that fires onDone', async () => {
  const mod = await import('./index.js')
  const cmd = mod.default
  if (cmd.type !== 'local-jsx') {
    throw new Error('expected local-jsx command')
  }
  const loaded = await cmd.load()
  expect(typeof loaded.call).toBe('function')

  let doneArg: string | undefined
  let doneOpts: Parameters<typeof loaded.call>[0] extends (
    result?: string,
    opts?: infer Opts,
  ) => unknown
    ? Opts
    : never
  const onDone: Parameters<typeof loaded.call>[0] = (result, opts) => {
    doneArg = result
    doneOpts = opts
  }
  // Minimal context stub — the call() path does not actually touch it.
  const context = {} as Parameters<typeof loaded.call>[1]
  const result = await loaded.call(onDone, context)
  expect(result).toBeNull()
  expect(typeof doneArg).toBe('string')
  expect(doneArg).toContain('超级助手')
  expect(doneOpts?.display).toBe('system')
})
