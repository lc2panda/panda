/**
 * H-001: maxVersion kill-switch must not be bypassed by preferTarball / GH tarball.
 *
 * Scenario: GH latest > maxVersion > current
 * Assert: resolveInstallTarget strips tarball; isTarballAllowedForInstall rejects over-cap URL.
 */
import { describe, expect, test } from 'bun:test'
import {
  isTarballAllowedForInstall,
  type LatestVersionInfo,
  resolveInstallTarget,
  versionFromTarballUrl,
} from './autoUpdater.js'

const OVER_CAP_TARBALL =
  'https://github.com/lc2panda/panda/releases/download/v2.40.0/lc2panda-panda-code-2.40.0.tgz'
const AT_CAP_TARBALL =
  'https://github.com/lc2panda/panda/releases/download/v2.32.3/lc2panda-panda-code-2.32.3.tgz'

function ghAheadInfo(version = '2.40.0'): LatestVersionInfo {
  return {
    version,
    source: 'github-release',
    npmAvailable: false,
    tarballUrl: `https://github.com/lc2panda/panda/releases/download/v${version}/lc2panda-panda-code-${version}.tgz`,
  }
}

describe('versionFromTarballUrl', () => {
  test('parses lc2panda-panda-code-X.Y.Z.tgz asset names', () => {
    expect(versionFromTarballUrl(OVER_CAP_TARBALL)).toBe('2.40.0')
    expect(versionFromTarballUrl(AT_CAP_TARBALL)).toBe('2.32.3')
  })

  test('strips query string', () => {
    expect(
      versionFromTarballUrl(
        'https://objects.githubusercontent.com/foo/lc2panda-panda-code-2.31.0.tgz?X-Amz-Signature=abc',
      ),
    ).toBe('2.31.0')
  })

  test('returns null for unparseable URL', () => {
    expect(versionFromTarballUrl('https://example.com/package.tgz')).toBeNull()
  })
})

describe('resolveInstallTarget — maxVersion kill-switch', () => {
  test('GH latest > maxVersion > current: caps version and drops tarball/preferTarball', () => {
    // Scenario H-001: remote GH 2.40.0, max 2.32.3, current 2.30.0
    const target = resolveInstallTarget(ghAheadInfo('2.40.0'), '2.32.3', '2.30.0')

    expect(target.skipUpdate).toBe(false)
    expect(target.cappedByMaxVersion).toBe(true)
    expect(target.version).toBe('2.32.3')
    // Must NOT prefer or expose the over-cap GH tarball
    expect(target.preferTarball).toBe(false)
    expect(target.tarballUrl).toBeUndefined()
  })

  test('current >= maxVersion while remote higher: skipUpdate', () => {
    const target = resolveInstallTarget(ghAheadInfo('2.40.0'), '2.32.3', '2.32.3')
    expect(target.skipUpdate).toBe(true)
    expect(target.preferTarball).toBe(false)
    expect(target.tarballUrl).toBeUndefined()
  })

  test('current already above maxVersion: skipUpdate', () => {
    const target = resolveInstallTarget(ghAheadInfo('2.40.0'), '2.32.3', '2.33.0')
    expect(target.skipUpdate).toBe(true)
    expect(target.preferTarball).toBe(false)
  })

  test('no maxVersion: prefer tarball when GH is sole source', () => {
    const info = ghAheadInfo('2.40.0')
    const target = resolveInstallTarget(info, undefined, '2.30.0')

    expect(target.skipUpdate).toBe(false)
    expect(target.cappedByMaxVersion).toBe(false)
    expect(target.version).toBe('2.40.0')
    expect(target.preferTarball).toBe(true)
    expect(target.tarballUrl).toBe(info.tarballUrl)
  })

  test('remote <= maxVersion: keeps tarball preference', () => {
    const info = ghAheadInfo('2.32.0')
    const target = resolveInstallTarget(info, '2.32.3', '2.30.0')

    expect(target.cappedByMaxVersion).toBe(false)
    expect(target.version).toBe('2.32.0')
    expect(target.preferTarball).toBe(true)
    expect(target.tarballUrl).toBe(info.tarballUrl)
  })

  test('source=both with equal versions: does not prefer tarball (npm available)', () => {
    const info: LatestVersionInfo = {
      version: '2.32.3',
      source: 'both',
      npmAvailable: true,
      tarballUrl: AT_CAP_TARBALL,
    }
    const target = resolveInstallTarget(info, undefined, '2.30.0')
    expect(target.preferTarball).toBe(false)
    // tarball still available as npm-failure fallback
    expect(target.tarballUrl).toBe(AT_CAP_TARBALL)
  })

  test('source=npm only: no preferTarball even with tarball present', () => {
    const info: LatestVersionInfo = {
      version: '2.32.3',
      source: 'npm',
      npmAvailable: true,
      tarballUrl: AT_CAP_TARBALL,
    }
    const target = resolveInstallTarget(info, undefined, '2.30.0')
    expect(target.preferTarball).toBe(false)
  })
})

describe('isTarballAllowedForInstall — defense in depth', () => {
  test('rejects tarball version above maxVersion', () => {
    expect(isTarballAllowedForInstall(OVER_CAP_TARBALL, '2.32.3', '2.32.3')).toBe(
      false,
    )
    expect(isTarballAllowedForInstall(OVER_CAP_TARBALL, null, '2.32.3')).toBe(
      false,
    )
    expect(isTarballAllowedForInstall(OVER_CAP_TARBALL, '2.32.3', null)).toBe(
      false,
    )
  })

  test('allows tarball at or below cap', () => {
    expect(isTarballAllowedForInstall(AT_CAP_TARBALL, '2.32.3', '2.32.3')).toBe(
      true,
    )
    expect(isTarballAllowedForInstall(AT_CAP_TARBALL, '2.40.0', '2.40.0')).toBe(
      true,
    )
  })

  test('unparseable URL refused when any cap is active (fail closed)', () => {
    expect(
      isTarballAllowedForInstall('https://example.com/pkg.tgz', '2.32.3', null),
    ).toBe(false)
    expect(
      isTarballAllowedForInstall('https://example.com/pkg.tgz', null, '2.32.3'),
    ).toBe(false)
  })

  test('unparseable URL allowed when no cap', () => {
    expect(
      isTarballAllowedForInstall('https://example.com/pkg.tgz', null, null),
    ).toBe(true)
  })
})
