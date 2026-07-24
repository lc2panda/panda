/**
 * H-001: maxVersion kill-switch must not be bypassed by preferTarball / GH tarball.
 * H-011: GH release fetch aligns with channel (stable vs latest).
 * H-012: tarball asset pick tightened + integrity helpers.
 *
 * Scenario: GH latest > maxVersion > current
 * Assert: resolveInstallTarget strips tarball; isTarballAllowedForInstall rejects over-cap URL.
 */
import { describe, expect, test } from 'bun:test'
import {
  GH_PACKAGE_TARBALL_PREFIX,
  isAcceptablePackageTarballName,
  isStableChannelRelease,
  isTarballAllowedForInstall,
  type GitHubRelease,
  type LatestVersionInfo,
  MAX_TARBALL_BYTES,
  parseGitHubAssetDigest,
  pickTarballAsset,
  resolveInstallTarget,
  selectGitHubReleaseForChannel,
  versionFromTarballUrl,
} from './autoUpdater.js'

const OVER_CAP_TARBALL =
  'https://github.com/lc2panda/panda/releases/download/v2.40.0/lc2panda-panda-code-2.40.0.tgz'
const AT_CAP_TARBALL =
  'https://github.com/lc2panda/panda/releases/download/v2.32.3/lc2panda-panda-code-2.32.3.tgz'
const SAMPLE_SHA =
  'f2a3409713ee9af5b106629c2179fd4e047684f7493298475e080f2173a12af7'

function ghAheadInfo(version = '2.40.0'): LatestVersionInfo {
  return {
    version,
    source: 'github-release',
    npmAvailable: false,
    tarballUrl: `https://github.com/lc2panda/panda/releases/download/v${version}/lc2panda-panda-code-${version}.tgz`,
    tarballSha256: SAMPLE_SHA,
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
    const info = ghAheadInfo('2.40.0')
    const target = resolveInstallTarget(info, '2.32.3', '2.30.0')

    expect(target.skipUpdate).toBe(false)
    expect(target.cappedByMaxVersion).toBe(true)
    expect(target.version).toBe('2.32.3')
    expect(target.preferTarball).toBe(false)
    expect(target.tarballUrl).toBeUndefined()
    // H-012: integrity stripped together with over-cap tarball (H-001 honor)
    expect(target.tarballSha256).toBeUndefined()
  })

  test('current >= maxVersion while remote higher: skipUpdate, no tarball', () => {
    const info = ghAheadInfo('2.40.0')
    const target = resolveInstallTarget(info, '2.32.3', '2.32.3')

    expect(target.skipUpdate).toBe(true)
    expect(target.preferTarball).toBe(false)
    expect(target.tarballUrl).toBeUndefined()
    expect(target.tarballSha256).toBeUndefined()
  })

  test('no maxVersion: GH ahead keeps preferTarball + integrity', () => {
    const info = ghAheadInfo('2.40.0')
    const target = resolveInstallTarget(info, undefined, '2.30.0')

    expect(target.cappedByMaxVersion).toBe(false)
    expect(target.version).toBe('2.40.0')
    expect(target.preferTarball).toBe(true)
    expect(target.tarballUrl).toBe(info.tarballUrl)
    expect(target.tarballSha256).toBe(SAMPLE_SHA)
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
      tarballSha256: SAMPLE_SHA,
    }
    const target = resolveInstallTarget(info, undefined, '2.30.0')
    expect(target.preferTarball).toBe(false)
    // tarball still available as npm-failure fallback
    expect(target.tarballUrl).toBe(AT_CAP_TARBALL)
    expect(target.tarballSha256).toBe(SAMPLE_SHA)
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

describe('H-011 selectGitHubReleaseForChannel', () => {
  const releases: GitHubRelease[] = [
    {
      tag_name: 'v2.33.0-beta.1',
      prerelease: false,
      draft: false,
      assets: [],
    },
    {
      tag_name: 'v2.32.3',
      prerelease: false,
      draft: false,
      assets: [],
    },
    {
      tag_name: 'v2.32.0-beta.7',
      prerelease: true,
      draft: false,
      assets: [],
    },
    {
      tag_name: 'v2.31.0',
      prerelease: false,
      draft: true,
      assets: [],
    },
  ]

  test('latest channel picks newest non-draft (includes semver pre / beta)', () => {
    const picked = selectGitHubReleaseForChannel(releases, 'latest')
    expect(picked?.tag_name).toBe('v2.33.0-beta.1')
  })

  test('stable channel skips semver prerelease even when GH prerelease=false', () => {
    const picked = selectGitHubReleaseForChannel(releases, 'stable')
    expect(picked?.tag_name).toBe('v2.32.3')
  })

  test('stable channel skips GH prerelease flags', () => {
    expect(
      isStableChannelRelease({
        tag_name: 'v2.32.0-beta.7',
        prerelease: true,
        draft: false,
      }),
    ).toBe(false)
    expect(
      isStableChannelRelease({
        tag_name: 'v2.32.3',
        prerelease: false,
        draft: false,
      }),
    ).toBe(true)
  })

  test('draft releases never selected', () => {
    const onlyDraft: GitHubRelease[] = [
      { tag_name: 'v9.0.0', draft: true, prerelease: false },
    ]
    expect(selectGitHubReleaseForChannel(onlyDraft, 'latest')).toBeUndefined()
    expect(selectGitHubReleaseForChannel(onlyDraft, 'stable')).toBeUndefined()
  })
})

describe('H-012 pickTarballAsset + integrity helpers', () => {
  test('MAX_TARBALL_BYTES is 20MB hard cap', () => {
    expect(MAX_TARBALL_BYTES).toBe(20 * 1024 * 1024)
  })

  test('parseGitHubAssetDigest accepts sha256:hex and bare hex', () => {
    expect(parseGitHubAssetDigest(`sha256:${SAMPLE_SHA}`)).toBe(SAMPLE_SHA)
    expect(parseGitHubAssetDigest(`SHA256:${SAMPLE_SHA.toUpperCase()}`)).toBe(
      SAMPLE_SHA,
    )
    expect(parseGitHubAssetDigest(SAMPLE_SHA)).toBe(SAMPLE_SHA)
    expect(parseGitHubAssetDigest('not-a-digest')).toBeUndefined()
    expect(parseGitHubAssetDigest(undefined)).toBeUndefined()
  })

  test('exact package tarball preferred with digest', () => {
    const version = '2.32.3'
    const picked = pickTarballAsset(
      [
        {
          name: 'random-payload.tgz',
          browser_download_url: 'https://example.com/random.tgz',
        },
        {
          name: `${GH_PACKAGE_TARBALL_PREFIX}-${version}.tgz`,
          browser_download_url: AT_CAP_TARBALL,
          size: 9_000_000,
          content_type: 'application/x-gtar',
          digest: `sha256:${SAMPLE_SHA}`,
        },
      ],
      version,
    )
    expect(picked).not.toBeNull()
    expect(picked!.exactMatch).toBe(true)
    expect(picked!.url).toBe(AT_CAP_TARBALL)
    expect(picked!.sha256).toBe(SAMPLE_SHA)
  })

  test('rejects arbitrary .tgz without package marker (no silent accept)', () => {
    const picked = pickTarballAsset(
      [
        {
          name: 'malware.tgz',
          browser_download_url: 'https://example.com/malware.tgz',
        },
        {
          name: 'notes.tar.gz',
          browser_download_url: 'https://example.com/notes.tar.gz',
        },
        {
          name: 'panda-darwin-arm64.tgz',
          browser_download_url: 'https://example.com/native.tgz',
        },
      ],
      '2.32.3',
    )
    expect(picked).toBeNull()
  })

  test('tightened fallback requires package name + version', () => {
    const version = '2.32.3'
    const altUrl =
      'https://github.com/lc2panda/panda/releases/download/v2.32.3/lc2panda.panda-code-2.32.3.tgz'
    const picked = pickTarballAsset(
      [
        {
          name: 'lc2panda.panda-code-2.32.3.tgz',
          browser_download_url: altUrl,
          digest: `sha256:${SAMPLE_SHA}`,
        },
      ],
      version,
    )
    expect(picked).not.toBeNull()
    expect(picked!.exactMatch).toBe(false)
    expect(picked!.url).toBe(altUrl)
    expect(picked!.sha256).toBe(SAMPLE_SHA)
  })

  test('fallback rejects package tarball for wrong version', () => {
    const picked = pickTarballAsset(
      [
        {
          name: 'lc2panda-panda-code-2.31.0.tgz',
          browser_download_url:
            'https://github.com/lc2panda/panda/releases/download/v2.31.0/lc2panda-panda-code-2.31.0.tgz',
        },
      ],
      '2.32.3',
    )
    expect(picked).toBeNull()
  })

  test('isAcceptablePackageTarballName gates markers', () => {
    expect(
      isAcceptablePackageTarballName('lc2panda-panda-code-2.32.3.tgz', '2.32.3'),
    ).toBe(true)
    expect(isAcceptablePackageTarballName('malware.tgz', '2.32.3')).toBe(false)
    expect(
      isAcceptablePackageTarballName(
        'lc2panda-panda-code-2.32.3.tgz.sha256',
        '2.32.3',
      ),
    ).toBe(false)
    expect(
      isAcceptablePackageTarballName(
        'panda-darwin-arm64-2.32.3.tgz',
        '2.32.3',
      ),
    ).toBe(false)
  })
})
