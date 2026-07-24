/**
 * Input:  planLocalInstall(channel, version, dual-source opts, maxVersion)
 * Output: preferTarballFirst / installVersion / allowTarballFallback
 * Pos:    H-006 pure dual-source decision for npm-local path
 */

import { describe, expect, test } from 'bun:test'
import { planLocalInstall } from './localInstaller.js'

// Must match production asset naming so versionFromTarballUrl can parse
const GH_TARBALL_2305 =
  'https://github.com/lc2panda/panda/releases/download/v2.30.5/lc2panda-panda-code-2.30.5.tgz'
const GH_TARBALL_2300 =
  'https://github.com/lc2panda/panda/releases/download/v2.30.0/lc2panda-panda-code-2.30.0.tgz'

describe('planLocalInstall dual-source (H-006)', () => {
  test('preferTarball=true keeps tarball-first when no maxVersion', () => {
    const plan = planLocalInstall(
      'latest',
      '2.30.5',
      { tarballUrl: GH_TARBALL_2305, preferTarball: true },
      undefined,
    )
    expect(plan.preferTarballFirst).toBe(true)
    expect(plan.tarballUrl).toBe(GH_TARBALL_2305)
    expect(plan.installVersion).toBe('2.30.5')
    expect(plan.allowTarballFallback).toBe(true)
  })

  test('maxVersion strips tarball above cap and caps installVersion', () => {
    const plan = planLocalInstall(
      'latest',
      '2.30.5',
      { tarballUrl: GH_TARBALL_2305, preferTarball: true },
      '2.30.0',
    )
    expect(plan.preferTarballFirst).toBe(false)
    expect(plan.tarballUrl).toBeUndefined()
    expect(plan.installVersion).toBe('2.30.0')
    expect(plan.allowTarballFallback).toBe(false)
  })

  test('tarball at exactly maxVersion remains allowed', () => {
    const plan = planLocalInstall(
      'latest',
      '2.30.0',
      { tarballUrl: GH_TARBALL_2300, preferTarball: true },
      '2.30.0',
    )
    expect(plan.preferTarballFirst).toBe(true)
    expect(plan.tarballUrl).toBe(GH_TARBALL_2300)
    expect(plan.installVersion).toBe('2.30.0')
    expect(plan.allowTarballFallback).toBe(true)
  })

  test('preferTarball=false still allows tarball fallback after registry miss', () => {
    const plan = planLocalInstall(
      'latest',
      '2.30.5',
      { tarballUrl: GH_TARBALL_2305, preferTarball: false },
      undefined,
    )
    expect(plan.preferTarballFirst).toBe(false)
    expect(plan.tarballUrl).toBe(GH_TARBALL_2305)
    expect(plan.allowTarballFallback).toBe(true)
    expect(plan.installVersion).toBe('2.30.5')
  })

  test('no dual-source options → registry-only plan', () => {
    const plan = planLocalInstall('latest', '2.30.1', undefined, undefined)
    expect(plan.preferTarballFirst).toBe(false)
    expect(plan.tarballUrl).toBeUndefined()
    expect(plan.allowTarballFallback).toBe(false)
    expect(plan.installVersion).toBe('2.30.1')
  })

  test('channel tag without specificVersion is capped to maxVersion', () => {
    const plan = planLocalInstall(
      'latest',
      null,
      { tarballUrl: GH_TARBALL_2305, preferTarball: true },
      '2.29.0',
    )
    // No specificVersion → isTarballAllowedForInstall cannot extract match
    // against max from version arg; URL still carries 2.30.5 which is > cap
    expect(plan.tarballUrl).toBeUndefined()
    expect(plan.preferTarballFirst).toBe(false)
    expect(plan.installVersion).toBe('2.29.0')
    expect(plan.allowTarballFallback).toBe(false)
  })

  test('stable channel without version uses stable tag when uncapped', () => {
    const plan = planLocalInstall('stable', null, undefined, undefined)
    expect(plan.installVersion).toBe('stable')
    expect(plan.preferTarballFirst).toBe(false)
  })
})
