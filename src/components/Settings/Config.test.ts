// Input: Settings Config source text
// Output: regression assertions for source-specific save payloads
// Pos: guards Settings UI persistence semantics after TypeScript compatibility edits

import { describe, expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

describe('Settings Config source persistence', () => {
  test('workflowSize update only writes userSettings workflowSize key', async () => {
    const source = await readFile(
      join(import.meta.dir, 'Config.tsx'),
      'utf8',
    )

    expect(source).toContain("id: 'workflowSize'")
    expect(source).toContain("updateSettingsForSource('userSettings', {\n        workflowSize\n      });")
    expect(source).not.toContain("updateSettingsForSource('userSettings', {\n        ...settingsData,\n        workflowSize")
  })
})
