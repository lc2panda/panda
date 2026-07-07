// Input: Glob and Grep tool validation inputs
// Output: assertions for filesystem and schema error boundaries
// Pos: protects search tools' exception paths after TypeScript compatibility edits

import { describe, expect, test } from 'bun:test'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GlobTool } from './GlobTool.js'
import { GrepTool } from '../GrepTool/GrepTool.js'

describe('GlobTool validation edge cases', () => {
  test('rejects existing files when a directory path is required', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'panda-glob-'))
    const file = join(dir, 'not-a-directory.txt')
    await writeFile(file, 'content')

    const result = await GlobTool.validateInput?.({
      pattern: '*.txt',
      path: file,
    })

    expect(result?.result).toBe(false)
    if (result?.result !== false) {
      throw new Error('expected GlobTool path validation to fail')
    }
    expect(result.message).toContain(`Path is not a directory: ${file}`)
    expect(result.errorCode).toBe(2)
  })
})

describe('GrepTool schema edge cases', () => {
  test('rejects invalid output mode before execution', () => {
    const parsed = GrepTool.inputSchema.safeParse({
      pattern: 'needle',
      output_mode: 'invalid-mode',
    })

    expect(parsed.success).toBe(false)
  })
})
