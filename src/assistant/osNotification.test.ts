// Input: none (direct unit test of isOsNotificationDegraded)
// Output: bun:test assertions on API shape
// Pos: guard OS notification degradation API surface

import { test, expect } from 'bun:test'
import { isOsNotificationDegraded } from './sense.js'

test('isOsNotificationDegraded — 返回结构', () => {
  const result = isOsNotificationDegraded()
  expect(typeof result).toBe('object')
  expect('degraded' in result).toBe(true)
  expect('isAuth' in result).toBe(true)
  expect('lastError' in result).toBe(true)
  expect(typeof result.degraded).toBe('boolean')
  expect(typeof result.isAuth).toBe('boolean')
})
