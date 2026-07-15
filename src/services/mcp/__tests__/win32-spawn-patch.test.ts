// Input: concurrent acquire/release operations of acquireWin32SpawnPatch
// Output: bun:test assertions that refcount maintains singleton correctly
// Pos: guard against spawn patch race condition that breaks Windows MCP stdio connects

import { describe, expect, test, beforeEach } from 'bun:test'
import {
  acquireWin32SpawnPatch,
  __resetWin32SpawnPatchForTests,
} from '../client.js'

describe('Win32 spawn patch refcount singleton', () => {
  beforeEach(() => {
    __resetWin32SpawnPatchForTests()
  })

  test('non-win32 returns no-op release', () => {
    if (process.platform === 'win32') {
      console.log('Skip: test is for non-win32 only')
      return
    }
    const release1 = acquireWin32SpawnPatch('test')
    const release2 = acquireWin32SpawnPatch('test')
    // No-op releases do not throw
    release1()
    release2()
    release1() // Double-release is safe
  })

  test('win32: first acquire installs patch, last release restores', () => {
    if (process.platform !== 'win32') {
      console.log('Skip: test is for win32 only')
      return
    }
    const crossSpawn = require('cross-spawn')
    const originalSpawn = crossSpawn.spawn

    const release1 = acquireWin32SpawnPatch('server1')
    const patchedSpawn1 = crossSpawn.spawn
    expect(patchedSpawn1).not.toBe(originalSpawn)

    const release2 = acquireWin32SpawnPatch('server2')
    const patchedSpawn2 = crossSpawn.spawn
    expect(patchedSpawn2).toBe(patchedSpawn1) // Same patched function

    // First release: patch still active
    release1()
    expect(crossSpawn.spawn).toBe(patchedSpawn1)

    // Second release: patch restored
    release2()
    expect(crossSpawn.spawn).toBe(originalSpawn)
  })

  test('win32: concurrent acquires share single patch', () => {
    if (process.platform !== 'win32') {
      console.log('Skip: test is for win32 only')
      return
    }
    const crossSpawn = require('cross-spawn')
    const originalSpawn = crossSpawn.spawn

    const release1 = acquireWin32SpawnPatch('server1')
    const release2 = acquireWin32SpawnPatch('server2')
    const release3 = acquireWin32SpawnPatch('server3')

    const patchedSpawn = crossSpawn.spawn
    expect(patchedSpawn).not.toBe(originalSpawn)

    // Release out-of-order: patch remains active until last
    release2()
    expect(crossSpawn.spawn).toBe(patchedSpawn)

    release1()
    expect(crossSpawn.spawn).toBe(patchedSpawn)

    release3()
    expect(crossSpawn.spawn).toBe(originalSpawn)
  })

  test('win32: double-release is safe', () => {
    if (process.platform !== 'win32') {
      console.log('Skip: test is for win32 only')
      return
    }
    const release = acquireWin32SpawnPatch('test')
    release()
    release() // Should not throw or cause negative refcount
    // No assertions — test passes if no exception
  })

  test('win32: interleaved acquire/release', () => {
    if (process.platform !== 'win32') {
      console.log('Skip: test is for win32 only')
      return
    }
    const crossSpawn = require('cross-spawn')
    const originalSpawn = crossSpawn.spawn

    const r1 = acquireWin32SpawnPatch('s1')
    const r2 = acquireWin32SpawnPatch('s2')

    r1()
    expect(crossSpawn.spawn).not.toBe(originalSpawn) // r2 still holds

    const r3 = acquireWin32SpawnPatch('s3')
    expect(crossSpawn.spawn).not.toBe(originalSpawn) // r2, r3 hold

    r2()
    expect(crossSpawn.spawn).not.toBe(originalSpawn) // r3 holds

    r3()
    expect(crossSpawn.spawn).toBe(originalSpawn) // All released
  })
})
