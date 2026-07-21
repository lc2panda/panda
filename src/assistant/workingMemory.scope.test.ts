// Input: workingMemory 分层 scope 行为（session 隔离 / v1 迁移 / 路由 / 注入）
// Output: bun:test 断言
// Pos: assistant/ 最小单测白名单
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'fs'
import { asSessionId } from '../types/ids.js'
import {
  switchSession,
  getSessionId,
  getProjectRoot,
  getOriginalCwd,
} from '../bootstrap/state.js'
import {
  setWorkingMemory,
  getWorkingMemory,
  getAllWorkingMemory,
  getInjectedWorkingMemoryEntries,
  clearWorkingMemory,
  resolveWorkingMemoryScope,
  __resetWorkingMemoryCacheForTests,
  __getWorkingMemoryPathsForTests,
} from './workingMemory.js'

const paths = __getWorkingMemoryPathsForTests()
const BACKUP = paths.file + '.scope-test-bak'
const V1_BAK_BACKUP = paths.v1Bak + '.scope-test-bak'
let originalSessionId: string

function backupIfExists(src: string, dest: string): void {
  if (existsSync(src)) {
    copyFileSync(src, dest)
  }
}

function writeRaw(content: string): void {
  if (!existsSync(paths.dir)) {
    mkdirSync(paths.dir, { recursive: true })
  }
  writeFileSync(paths.file, content, 'utf-8')
  __resetWorkingMemoryCacheForTests()
}

function removeFile(p: string): void {
  if (existsSync(p)) unlinkSync(p)
}

beforeEach(() => {
  originalSessionId = getSessionId()
  // 备份真实 WM / v1-bak，测试期间用隔离文件
  backupIfExists(paths.file, BACKUP)
  backupIfExists(paths.v1Bak, V1_BAK_BACKUP)
  removeFile(paths.file)
  removeFile(paths.v1Bak)
  __resetWorkingMemoryCacheForTests()
})

afterEach(() => {
  // 恢复 session
  try {
    switchSession(asSessionId(originalSessionId))
  } catch {
    // ignore
  }
  // 先清测试产物，再还原备份
  removeFile(paths.file)
  removeFile(paths.v1Bak)
  if (existsSync(BACKUP)) {
    if (!existsSync(paths.dir)) mkdirSync(paths.dir, { recursive: true })
    copyFileSync(BACKUP, paths.file)
    unlinkSync(BACKUP)
  }
  if (existsSync(V1_BAK_BACKUP)) {
    if (!existsSync(paths.dir)) mkdirSync(paths.dir, { recursive: true })
    copyFileSync(V1_BAK_BACKUP, paths.v1Bak)
    unlinkSync(V1_BAK_BACKUP)
  }
  __resetWorkingMemoryCacheForTests()
})

describe('resolveWorkingMemoryScope 路由表', () => {
  test('session / project / global 精确 key', () => {
    expect(resolveWorkingMemoryScope('lastPrompt')).toBe('session')
    expect(resolveWorkingMemoryScope('lastPromptTime')).toBe('session')
    expect(resolveWorkingMemoryScope('sessionStartTime')).toBe('session')
    expect(resolveWorkingMemoryScope('last-skill-execution')).toBe('session')
    expect(resolveWorkingMemoryScope('clipboard-recent')).toBe('session')

    expect(resolveWorkingMemoryScope('currentProject')).toBe('project')
    expect(resolveWorkingMemoryScope('code-health-failed')).toBe('project')

    expect(resolveWorkingMemoryScope('os-notification-degraded')).toBe('global')
    expect(resolveWorkingMemoryScope('im-unread-digest')).toBe('global')
    // 注意：im-reverse-push-queue = global（不是 session）
    expect(resolveWorkingMemoryScope('im-reverse-push-queue')).toBe('global')
    expect(resolveWorkingMemoryScope('notification-urgent')).toBe('global')
  })

  test('前缀 → global；未知 key → project', () => {
    expect(resolveWorkingMemoryScope('wechat-situational-foo')).toBe('global')
    expect(resolveWorkingMemoryScope('wechat-custom-key')).toBe('global')
    expect(resolveWorkingMemoryScope('calendar-upcoming-today')).toBe('global')
    expect(resolveWorkingMemoryScope('totally-unknown-key-xyz')).toBe('project')
  })
})

describe('session 隔离', () => {
  test('两 session 不同 sessionId：A 写 lastPrompt，B get 不到', () => {
    const sessionA = asSessionId('00000000-0000-4000-8000-0000000000aa')
    const sessionB = asSessionId('00000000-0000-4000-8000-0000000000bb')

    switchSession(sessionA)
    setWorkingMemory('lastPrompt', 'prompt-from-A')
    expect(getWorkingMemory('lastPrompt')).toBe('prompt-from-A')

    switchSession(sessionB)
    __resetWorkingMemoryCacheForTests() // 模拟读路径重新解析 session
    expect(getWorkingMemory('lastPrompt')).toBeUndefined()

    // B 写入自己的
    setWorkingMemory('lastPrompt', 'prompt-from-B')
    expect(getWorkingMemory('lastPrompt')).toBe('prompt-from-B')

    // 切回 A 仍可读到 A
    switchSession(sessionA)
    __resetWorkingMemoryCacheForTests()
    expect(getWorkingMemory('lastPrompt')).toBe('prompt-from-A')
  })

  test('getInjected 不含他 session 的 lastPrompt', () => {
    const sessionA = asSessionId('00000000-0000-4000-8000-0000000000a1')
    const sessionB = asSessionId('00000000-0000-4000-8000-0000000000b1')

    switchSession(sessionA)
    setWorkingMemory('lastPrompt', 'secret-A')
    setWorkingMemory('im-unread-digest', 'global-digest')

    switchSession(sessionB)
    setWorkingMemory('lastPrompt', 'visible-B')

    const injected = getInjectedWorkingMemoryEntries()
    const keys = injected.map(e => e.key)
    const lastPromptEntries = injected.filter(e => e.key === 'lastPrompt')

    expect(lastPromptEntries).toHaveLength(1)
    expect(lastPromptEntries[0]!.value).toBe('visible-B')
    // 不应出现 A 的 lastPrompt 值
    expect(injected.some(e => e.value === 'secret-A')).toBe(false)
    // global 可见
    expect(keys).toContain('im-unread-digest')
  })
})

describe('v1 → v2 迁移', () => {
  test('迁移 v1 数组 → v2，并生成 .v1-bak', () => {
    const sessionA = asSessionId('00000000-0000-4000-8000-0000000000c1')
    switchSession(sessionA)

    const now = Date.now()
    const v1 = [
      { key: 'lastPrompt', value: 'legacy-prompt', updatedAt: now },
      { key: 'currentProject', value: 'legacy-proj', updatedAt: now },
      { key: 'im-reverse-push-queue', value: '[]', updatedAt: now },
      { key: 'unknown-legacy-key', value: 'u', updatedAt: now },
    ]
    writeRaw(JSON.stringify(v1, null, 2))

    // 触发 load/migrate
    expect(getWorkingMemory('lastPrompt')).toBe('legacy-prompt')
    expect(getWorkingMemory('currentProject')).toBe('legacy-proj')
    expect(getWorkingMemory('im-reverse-push-queue')).toBe('[]')
    expect(getWorkingMemory('unknown-legacy-key')).toBe('u')

    // 磁盘应为 v2
    __resetWorkingMemoryCacheForTests()
    const onDisk = JSON.parse(readFileSync(paths.file, 'utf-8')) as {
      version: number
      global: Record<string, unknown>
      projects: Record<string, unknown>
    }
    expect(onDisk.version).toBe(2)
    expect(onDisk.global['im-reverse-push-queue']).toBeTruthy()

    // v1 bak 存在
    expect(existsSync(paths.v1Bak)).toBe(true)
    const bak = JSON.parse(readFileSync(paths.v1Bak, 'utf-8'))
    expect(Array.isArray(bak)).toBe(true)
  })
})

describe('scope 路由落盘', () => {
  test('im-reverse-push-queue 在 global', () => {
    setWorkingMemory('im-reverse-push-queue', 'queue-payload')
    __resetWorkingMemoryCacheForTests()
    const onDisk = JSON.parse(readFileSync(paths.file, 'utf-8')) as {
      global: Record<string, { value: string }>
      projects: Record<string, { entries: Record<string, unknown>; sessions: Record<string, unknown> }>
    }
    expect(onDisk.global['im-reverse-push-queue']?.value).toBe('queue-payload')

    // 不应出现在当前 session 桶
    const projectSlug = Object.keys(onDisk.projects)[0]
    if (projectSlug) {
      const sessions = onDisk.projects[projectSlug]!.sessions as Record<
        string,
        { entries: Record<string, unknown> }
      >
      for (const sid of Object.keys(sessions)) {
        expect(sessions[sid]!.entries['im-reverse-push-queue']).toBeUndefined()
      }
    }
  })

  test('未知 key → project', () => {
    setWorkingMemory('brand-new-feature-flag', 'on')
    __resetWorkingMemoryCacheForTests()
    const onDisk = JSON.parse(readFileSync(paths.file, 'utf-8')) as {
      global: Record<string, unknown>
      projects: Record<
        string,
        { entries: Record<string, { value: string }> }
      >
    }
    expect(onDisk.global['brand-new-feature-flag']).toBeUndefined()
    const found = Object.values(onDisk.projects).some(
      p => p.entries['brand-new-feature-flag']?.value === 'on',
    )
    expect(found).toBe(true)
  })
})

describe('clearWorkingMemory 默认仅 session', () => {
  test('默认 clear 不清 global', () => {
    const sessionA = asSessionId('00000000-0000-4000-8000-0000000000d1')
    switchSession(sessionA)
    setWorkingMemory('lastPrompt', 'to-clear')
    setWorkingMemory('im-unread-digest', 'keep-global')

    clearWorkingMemory() // 默认 session
    expect(getWorkingMemory('lastPrompt')).toBeUndefined()
    expect(getWorkingMemory('im-unread-digest')).toBe('keep-global')
  })
})

describe('API 签名兼容', () => {
  test('set/get 两参形式仍可用；显式 scope 覆盖路由', () => {
    setWorkingMemory('lastPrompt', 'via-default-route')
    expect(getWorkingMemory('lastPrompt')).toBe('via-default-route')

    // 显式写入 global（覆盖默认 session 路由）
    setWorkingMemory('lastPrompt', 'forced-global', 'global')
    expect(getWorkingMemory('lastPrompt', 'global')).toBe('forced-global')

    // 默认 get 路由优先 session；session 仍有旧值
    expect(getWorkingMemory('lastPrompt')).toBe('via-default-route')
  })

  test('getAllWorkingMemory 与 getInjected 为同一安全集合', () => {
    const sessionA = asSessionId('00000000-0000-4000-8000-0000000000e1')
    const sessionB = asSessionId('00000000-0000-4000-8000-0000000000e2')
    switchSession(sessionA)
    setWorkingMemory('lastPrompt', 'A')
    switchSession(sessionB)
    setWorkingMemory('lastPrompt', 'B')
    setWorkingMemory('os-notification-degraded', '1')

    const all = getAllWorkingMemory()
    const injected = getInjectedWorkingMemoryEntries()
    expect(all.map(e => `${e.key}=${e.value}`).sort()).toEqual(
      injected.map(e => `${e.key}=${e.value}`).sort(),
    )
    expect(all.some(e => e.value === 'A')).toBe(false)
    expect(all.some(e => e.value === 'B')).toBe(true)
  })

  test('current project identity 不依赖 process.cwd 误伤（可读 projectRoot）', () => {
    // 烟雾：只要 getProjectRoot/getOriginalCwd 可用即可写入 project 层
    const root = getProjectRoot() || getOriginalCwd()
    expect(typeof root).toBe('string')
    setWorkingMemory('currentProject', root)
    expect(getWorkingMemory('currentProject')).toBe(root)
  })
})
