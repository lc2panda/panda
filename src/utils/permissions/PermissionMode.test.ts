// Input: permission mode strings from CLI/settings/UI boundaries
// Output: normalized Panda CLI permission mode semantics matching Claude Code manual/default behavior
// Pos: Permission mode compatibility guard for third-party API and CLI settings

import { describe, expect, test } from 'bun:test'
import {
  EXTERNAL_PERMISSION_MODES,
  permissionModeTitle,
  normalizeExternalPermissionMode,
  permissionModeFromString,
} from './PermissionMode.js'

describe('permission mode manual compatibility', () => {
  test('accepts manual as an external permission mode', () => {
    expect(EXTERNAL_PERMISSION_MODES).toContain('manual')
  })

  test('normalizes manual to canonical default semantics', () => {
    expect(normalizeExternalPermissionMode('manual')).toBe('default')
    expect(permissionModeFromString('manual')).toBe('default')
  })

  test('keeps existing modes unchanged', () => {
    expect(normalizeExternalPermissionMode('default')).toBe('default')
    expect(normalizeExternalPermissionMode('plan')).toBe('plan')
    expect(normalizeExternalPermissionMode('acceptEdits')).toBe('acceptEdits')
    expect(normalizeExternalPermissionMode('bypassPermissions')).toBe(
      'bypassPermissions',
    )
    expect(normalizeExternalPermissionMode('dontAsk')).toBe('dontAsk')
  })

  test('shows upstream visible manual label for default mode', () => {
    expect(permissionModeTitle('default')).toBe('Manual')
  })
})
