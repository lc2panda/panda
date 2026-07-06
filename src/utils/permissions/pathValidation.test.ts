/**
 * Basic import test for permissions.ts after Bun bundler compliance fix
 */
import { describe, test, expect } from 'bun:test'
import { hasPermissionsToUseTool, getAllowRules } from './permissions.js'

describe('Path Validation (Import Test)', () => {
  test('permissions module imports successfully', () => {
    expect(hasPermissionsToUseTool).toBeDefined()
    expect(typeof hasPermissionsToUseTool).toBe('function')
    expect(getAllowRules).toBeDefined()
    expect(typeof getAllowRules).toBe('function')
  })
})
