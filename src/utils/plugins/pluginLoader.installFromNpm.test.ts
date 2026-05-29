// Input:  installFromNpm(packageName, targetPath, options) — npm install arg vector
// Output: bun:test 断言 --ignore-scripts 在 args 中；注册表参数追加顺序正确；
//         execFileNoThrow 失败时 throw；needsInstall=false 时不调用 execFileNoThrow
// Pos:    WO-H6a 供应链 RCE 修补单元测试 — 守护 --ignore-scripts 不被意外移除

import { describe, expect, test, beforeEach, mock } from 'bun:test'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// ─── mock 状态 ──────────────────────────────────────────────────────────────

/** 捕获 execFileNoThrow 的最后一次调用参数 */
let capturedCmd = ''
let capturedArgs: string[] = []
/** 控制 execFileNoThrow 的返回值 */
let execResult: { code: number; stdout: string; stderr: string } = {
  code: 0,
  stdout: '',
  stderr: '',
}

// ─── 模块 mock（必须在 import 被测模块之前）──────────────────────────────────
//     只 mock execFileNoThrow，其他模块（file.ts / fsOperations.ts）走真实实现
//     通过控制实际 tmpdir 文件是否存在来模拟 needsInstall 路径

mock.module('../execFileNoThrow.js', () => ({
  execFileNoThrow: async (
    cmd: string,
    args: string[],
    _opts?: unknown,
  ) => {
    capturedCmd = cmd
    capturedArgs = args
    if (execResult.code === 0) {
      // 模拟 npm install 成功：创建 node_modules/<pkg> 目录（供后续 copyDir 使用）
      // 从 args 中解析 --prefix 值和包名
      const prefixIdx = args.indexOf('--prefix')
      const pkgSpec = args[1] ?? ''
      const pkgName = pkgSpec.includes('@') && !pkgSpec.startsWith('@')
        ? pkgSpec.split('@')[0]
        : pkgSpec.startsWith('@')
          ? '@' + pkgSpec.slice(1).split('@')[0]
          : pkgSpec
      if (prefixIdx >= 0) {
        const prefix = args[prefixIdx + 1]!
        mkdirSync(join(prefix, 'node_modules', pkgName), { recursive: true })
        writeFileSync(
          join(prefix, 'node_modules', pkgName, 'package.json'),
          JSON.stringify({ name: pkgName, version: '1.0.0' }),
        )
      }
    }
    return execResult
  },
  execFileNoThrowWithCwd: async () => ({ code: 0, stdout: '', stderr: '' }),
  // re-export stub — 防止依赖链中的 SyntaxError: Export named X not found
  execSyncWithDefaults_DEPRECATED: () => null,
}))

// ─── 需要 mock getPluginsDirectory 以使用 tmpdir 避免污染全局 ─────────────────

const TEST_PLUGINS_DIR = join(tmpdir(), 'panda-test-plugins-h6a')

mock.module('./pluginDirectories.js', () => ({
  getPluginsDirectory: () => TEST_PLUGINS_DIR,
  getPluginSeedDirs: () => [],
  pluginDataDirPath: (id: string) => join(TEST_PLUGINS_DIR, 'data', id),
  getPluginDataDir: (id: string) => join(TEST_PLUGINS_DIR, 'data', id),
  getPluginDataDirSize: async () => 0,
  deletePluginDataDir: async () => {},
}))

// ─── 延迟导入（mock 必须先建立）───────────────────────────────────────────────

const { installFromNpm } = await import('./pluginLoader.js')

// ─── 辅助：安装前确保 npm-cache 目录存在供 mkdir 幂等使用 ─────────────────────
function ensureTestDir() {
  if (!existsSync(TEST_PLUGINS_DIR)) {
    mkdirSync(TEST_PLUGINS_DIR, { recursive: true })
  }
}

// ─── 测试套件 ────────────────────────────────────────────────────────────────

describe('installFromNpm — --ignore-scripts 守护 (WO-H6a)', () => {
  beforeEach(() => {
    capturedCmd = ''
    capturedArgs = []
    execResult = { code: 0, stdout: '', stderr: '' }
    ensureTestDir()

    // 清理 npm-cache，确保 needsInstall=true（packagePath 不存在）
    const npmCache = join(TEST_PLUGINS_DIR, 'npm-cache')
    if (existsSync(npmCache)) {
      rmSync(npmCache, { recursive: true, force: true })
    }
  })

  test('T1: npm install args 必须包含 --ignore-scripts', async () => {
    await installFromNpm('some-plugin', join(TEST_PLUGINS_DIR, 'dest'))
    expect(capturedArgs).toContain('--ignore-scripts')
  })

  test('T2: --ignore-scripts 位于 --prefix <path> 之后', async () => {
    await installFromNpm('some-plugin', join(TEST_PLUGINS_DIR, 'dest'))
    const prefixIdx = capturedArgs.indexOf('--prefix')
    const ignoreIdx = capturedArgs.indexOf('--ignore-scripts')
    // --prefix <value> 占两个元素，--ignore-scripts 在其之后
    expect(prefixIdx).toBeGreaterThanOrEqual(0)
    expect(ignoreIdx).toBeGreaterThan(prefixIdx + 1)
  })

  test('T3: 无 registry 时 --registry 不出现', async () => {
    await installFromNpm('some-plugin', join(TEST_PLUGINS_DIR, 'dest'))
    expect(capturedArgs).not.toContain('--registry')
  })

  test('T4: 带 registry 选项时 --registry 在 --ignore-scripts 之后追加', async () => {
    await installFromNpm('some-plugin', join(TEST_PLUGINS_DIR, 'dest'), {
      registry: 'https://registry.example.com',
    })
    const ignoreIdx = capturedArgs.indexOf('--ignore-scripts')
    const registryIdx = capturedArgs.indexOf('--registry')
    expect(ignoreIdx).toBeGreaterThanOrEqual(0)
    expect(registryIdx).toBeGreaterThan(ignoreIdx)
    expect(capturedArgs[registryIdx + 1]).toBe('https://registry.example.com')
  })

  test('T5: 带 version 选项时 packageSpec = name@version 且 --ignore-scripts 存在', async () => {
    await installFromNpm('some-plugin', join(TEST_PLUGINS_DIR, 'dest'), {
      version: '1.2.3',
    })
    expect(capturedArgs[0]).toBe('install')
    expect(capturedArgs[1]).toBe('some-plugin@1.2.3')
    expect(capturedArgs).toContain('--ignore-scripts')
  })

  test('T6: execFileNoThrow 返回非零 code 时应 throw', async () => {
    execResult = { code: 1, stdout: '', stderr: 'ENOTFOUND registry' }
    await expect(
      installFromNpm('bad-plugin', join(TEST_PLUGINS_DIR, 'dest')),
    ).rejects.toThrow('Failed to install npm package')
  })

  test('T7: npm install 完整 args 数组结构快照（无 registry，无 version）', async () => {
    await installFromNpm('my-plugin', join(TEST_PLUGINS_DIR, 'dest'))
    // 精确向量：['install', 'my-plugin', '--prefix', '<npmCachePath>', '--ignore-scripts']
    expect(capturedArgs[0]).toBe('install')
    expect(capturedArgs[1]).toBe('my-plugin')
    expect(capturedArgs[2]).toBe('--prefix')
    expect(capturedArgs[3]).toContain('npm-cache')
    expect(capturedArgs[4]).toBe('--ignore-scripts')
    expect(capturedArgs).toHaveLength(5)
  })

  test('T8: packagePath 已存在（needsInstall=false）时 execFileNoThrow 不被调用', async () => {
    // 预先创建 npmCachePath/node_modules/<pkg> 模拟"已安装"
    const npmCache = join(TEST_PLUGINS_DIR, 'npm-cache')
    mkdirSync(join(npmCache, 'node_modules', 'cached-plugin'), {
      recursive: true,
    })
    // 写一个 package.json 让 pathExists 返回 true
    writeFileSync(
      join(npmCache, 'node_modules', 'cached-plugin', 'package.json'),
      JSON.stringify({ name: 'cached-plugin', version: '0.0.1' }),
    )
    await installFromNpm(
      'cached-plugin',
      join(TEST_PLUGINS_DIR, 'dest-cached'),
    )
    // 未触发安装
    expect(capturedArgs).toHaveLength(0)
  })
})
