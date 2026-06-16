// Input:  含只读附加目录（readOnly:true）的 ToolPermissionContext + 真实临时目录中的文件
// Output: 只读目录内 Write 被拒、Read 放行；普通读写附加目录 Write 放行；未配置时行为不变
// Pos:    波次2 项4（上游 161）— additionalDirectoriesReadOnly 只读附加目录单元测试

import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  checkReadPermissionForTool,
  checkWritePermissionForTool,
} from './filesystem.js'
import { getEmptyToolPermissionContext } from '../../Tool.js'
import type { ToolPermissionContext } from '../../Tool.js'

let roDir: string
let rwDir: string
let roFile: string
let rwFile: string

beforeAll(() => {
  roDir = mkdtempSync(join(tmpdir(), 'panda-ro-'))
  rwDir = mkdtempSync(join(tmpdir(), 'panda-rw-'))
  roFile = join(roDir, 'note.txt')
  rwFile = join(rwDir, 'note.txt')
  mkdirSync(roDir, { recursive: true })
  mkdirSync(rwDir, { recursive: true })
  writeFileSync(roFile, 'hello')
  writeFileSync(rwFile, 'hello')
})

afterAll(() => {
  rmSync(roDir, { recursive: true, force: true })
  rmSync(rwDir, { recursive: true, force: true })
})

function ctxWith(opts: {
  readOnly?: string
  readWrite?: string
}): ToolPermissionContext {
  const base = getEmptyToolPermissionContext()
  const map = new Map(base.additionalWorkingDirectories)
  if (opts.readOnly) {
    map.set(opts.readOnly, {
      path: opts.readOnly,
      source: 'cliArg',
      readOnly: true,
    })
  }
  if (opts.readWrite) {
    map.set(opts.readWrite, {
      path: opts.readWrite,
      source: 'cliArg',
    })
  }
  return {
    ...base,
    mode: 'acceptEdits',
    additionalWorkingDirectories: map,
  } as ToolPermissionContext
}

// 最小工具桩：暴露 getPath 即可走 filesystem 校验
const writeTool = {
  name: 'Write',
  getPath: (input: { file_path: string }) => input.file_path,
} as unknown as Parameters<typeof checkWritePermissionForTool>[0]

const readTool = {
  name: 'Read',
  getPath: (input: { file_path: string }) => input.file_path,
} as unknown as Parameters<typeof checkReadPermissionForTool>[0]

describe('只读附加目录 additionalDirectoriesReadOnly（上游 161）', () => {
  test('只读目录内 Write 被拒（deny）', () => {
    const ctx = ctxWith({ readOnly: roDir })
    const result = checkWritePermissionForTool(
      writeTool,
      { file_path: roFile },
      ctx,
    )
    expect(result.behavior).toBe('deny')
  })

  test('只读目录内 Read 放行（allow）', () => {
    const ctx = ctxWith({ readOnly: roDir })
    const result = checkReadPermissionForTool(
      readTool,
      { file_path: roFile },
      ctx,
    )
    expect(result.behavior).toBe('allow')
  })

  test('普通读写附加目录 Write 放行（acceptEdits 自动放行，旧行为不变）', () => {
    const ctx = ctxWith({ readWrite: rwDir })
    const result = checkWritePermissionForTool(
      writeTool,
      { file_path: rwFile },
      ctx,
    )
    expect(result.behavior).toBe('allow')
  })

  test('只读目录与读写目录并存：只拦截只读侧写，不影响读写侧', () => {
    const ctx = ctxWith({ readOnly: roDir, readWrite: rwDir })
    const denied = checkWritePermissionForTool(
      writeTool,
      { file_path: roFile },
      ctx,
    )
    expect(denied.behavior).toBe('deny')
    const allowed = checkWritePermissionForTool(
      writeTool,
      { file_path: rwFile },
      ctx,
    )
    expect(allowed.behavior).toBe('allow')
  })

  test('未配置只读目录时写不受影响（pathInReadOnlyWorkingPath 恒 false）', () => {
    const ctx = ctxWith({ readWrite: rwDir })
    const result = checkWritePermissionForTool(
      writeTool,
      { file_path: rwFile },
      ctx,
    )
    // 不应因只读逻辑被 deny
    expect(result.behavior).not.toBe('deny')
  })
})
