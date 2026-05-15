/**
 * Input: 本地 .zip 路径或远程 https:// .zip URL
 * Output: 解压到 os.tmpdir() 的临时目录路径（可供 loadSessionOnlyPlugins 当成插件根目录使用）
 * Pos: --plugin-dir <path.zip> / --plugin-url <https-url> 的支撑模块（上游 v2.1.128 / v2.1.129）
 *
 * 安全约束（与官方对齐 + 加固）：
 *   • URL 协议必须 https://
 *   • URL/路径后缀必须 .zip
 *   • 下载大小硬上限 100 MB（防 DoS）
 *   • 临时目录基于 os.tmpdir()，每次新建 8 字节随机后缀
 *   • 解压由 utils/dxt/zip.ts unzipFile 把关：路径遍历 / zip-bomb / 文件数硬限
 *   • proper-lockfile 串行化同一 URL/path 的下载/解压
 *   • 进程退出时清理（cleanupSessionArchiveCache 由 main.tsx exit hook 调用）
 *
 * NEW-FILE:#20260515-PLUGIN-J — 上游 v2.1.128/129 全新能力，无法塞进既有 pluginLoader.ts
 *   而保持职责单一；下载/锁/解压/清理是一组高耦合操作，单独成文件便于审计。
 */

import { createHash, randomBytes } from 'crypto'
import { mkdir, readdir, rm, stat, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { basename, join } from 'path'
import { logForDebugging } from '../debug.js'
import { extractZipToDirectory } from './zipCache.js'

// ── 安全限制 ──
const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024 // 100 MB
const MAX_DOWNLOAD_MS = 60_000 // 单次 fetch 60s 超时（防慢速吊死）
const ARCHIVE_TMP_PREFIX = 'panda-plugin-archive-'

// 会话级缓存：URL/path → 解压后的临时目录。同一会话同一来源只解压一次。
const archiveCache = new Map<string, string>()
// 同步原语：同一 key 并发请求时共享同一个 Promise。
const inflight = new Map<string, Promise<string>>()
// 用于退出时清理。
const createdTempDirs = new Set<string>()

/**
 * 是否是 .zip 路径（大小写不敏感，仅看后缀）。
 * 路径解析后必须以 .zip 结尾才认为是归档文件。
 */
export function isZipArchivePath(p: string): boolean {
  return /\.zip$/i.test(p.trim())
}

/**
 * 是否是 https 协议（HTTP 明文禁止；本地路径不算 URL）。
 */
function isHttpsUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * 验证 plugin URL 合法性 — 严格 allowlist。
 * 这里把规则集中：调用方只要拿到 true/false 决定是否进入下载流程。
 */
export function validatePluginUrl(url: string): {
  ok: true
} | {
  ok: false
  reason: string
} {
  const trimmed = url.trim()
  if (!trimmed) {
    return { ok: false, reason: '--plugin-url is empty' }
  }
  if (!isHttpsUrl(trimmed)) {
    return {
      ok: false,
      reason: `--plugin-url must use https:// (got: ${trimmed})`,
    }
  }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, reason: `--plugin-url is not a valid URL: ${trimmed}` }
  }
  // 只看 pathname 的后缀；query string 不参与判断。
  if (!isZipArchivePath(parsed.pathname)) {
    return {
      ok: false,
      reason: `--plugin-url must point to a .zip file (got: ${parsed.pathname})`,
    }
  }
  return { ok: true }
}

/**
 * 把缓存 key 限定为 short hash，避免直接把 URL/path 拿来当目录名（路径过长 / 字符非法）。
 */
function cacheKey(source: string): string {
  return createHash('sha256').update(source).digest('hex').slice(0, 16)
}

/**
 * 取一个唯一的临时解压目录。
 *
 * 注意：调用方负责把这个目录注册到 cleanupSessionArchiveCache 的清理范围内。
 */
async function makeTempExtractDir(): Promise<string> {
  const suffix = randomBytes(8).toString('hex')
  const dir = join(tmpdir(), `${ARCHIVE_TMP_PREFIX}${suffix}`)
  await mkdir(dir, { recursive: true })
  createdTempDirs.add(dir)
  return dir
}

/**
 * 把远程 https://*.zip 下载到 tmp 文件。
 * 使用 ReadableStream 累积大小，到顶就中断（不是先下完再判断，防 OOM）。
 */
async function downloadToTempFile(url: string): Promise<{
  filePath: string
  sha256: string
  bytes: number
}> {
  // 临时下载文件名也用随机后缀，避免和并发会话撞车。
  const suffix = randomBytes(8).toString('hex')
  const tmpFile = join(tmpdir(), `${ARCHIVE_TMP_PREFIX}${suffix}.zip`)

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), MAX_DOWNLOAD_MS)

  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' })
    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status} ${res.statusText} fetching ${url}`,
      )
    }
    // Content-Length 不可信（服务器可能不发或撒谎），仍要在 stream 中累计校验。
    const declared = Number(res.headers.get('content-length'))
    if (Number.isFinite(declared) && declared > MAX_DOWNLOAD_BYTES) {
      throw new Error(
        `Refusing to download: Content-Length ${declared} exceeds limit ${MAX_DOWNLOAD_BYTES}`,
      )
    }
    if (!res.body) {
      throw new Error(`Empty response body for ${url}`)
    }
    const hash = createHash('sha256')
    let total = 0
    const chunks: Uint8Array[] = []
    const reader = res.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      total += value.byteLength
      if (total > MAX_DOWNLOAD_BYTES) {
        // 主动 abort，断开连接，避免继续浪费带宽。
        ctrl.abort()
        throw new Error(
          `Download exceeded ${MAX_DOWNLOAD_BYTES} bytes (DoS guard)`,
        )
      }
      hash.update(value)
      chunks.push(value)
    }
    // 一次性写入（已知总大小且已经在内存里）。
    const buf = Buffer.concat(chunks.map(c => Buffer.from(c)))
    await writeFile(tmpFile, buf)
    return { filePath: tmpFile, sha256: hash.digest('hex'), bytes: total }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 解压 .zip 到临时目录。
 * 路径遍历 / zip bomb 检测由 utils/dxt/zip.ts unzipFile 在解压时把关。
 */
async function extractArchive(zipPath: string): Promise<string> {
  const dir = await makeTempExtractDir()
  try {
    await extractZipToDirectory(zipPath, dir)
  } catch (err) {
    // 解压失败时立即清理目录，避免半成品残留。
    await rm(dir, { recursive: true, force: true }).catch(() => {})
    createdTempDirs.delete(dir)
    throw err
  }
  return dir
}

/**
 * 解压后的目录可能是 wrapper（顶层就一个 dir，内部才是真正 plugin 根）；
 * 自动下沉一层，避免用户必须保证 zip 没 wrapper。
 *
 * 启发式：若 root 下只有 1 个 entry 且是目录，且 root 下没有 plugin.json /
 * .claude-plugin/plugin.json，则把那个 entry 当作真正的 plugin 根。
 */
async function unwrapSingleDirRoot(rootDir: string): Promise<string> {
  try {
    const entries = await readdir(rootDir, { withFileTypes: true })
    // 过滤掉 macOS 解压常见的 __MACOSX 元数据目录
    const meaningful = entries.filter(e => e.name !== '__MACOSX')
    if (meaningful.length !== 1 || !meaningful[0]!.isDirectory()) {
      return rootDir
    }
    // 检查 rootDir 本身是不是已经是 plugin root（有 manifest）
    const hasRootManifest =
      (await statSafe(join(rootDir, 'plugin.json'))) ||
      (await statSafe(join(rootDir, '.claude-plugin', 'plugin.json')))
    if (hasRootManifest) {
      return rootDir
    }
    return join(rootDir, meaningful[0]!.name)
  } catch {
    return rootDir
  }
}

async function statSafe(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

/**
 * 进程级锁：同一 source（URL 或本地 zip 绝对路径）的下载/解压串行化。
 *
 * 用 proper-lockfile 在 tmpdir 下挂一个 sidecar 文件作锁——避免两个并发 panda
 * 实例同时下载/解压同一 URL 撕坏对方的文件。
 */
async function withLock<T>(
  source: string,
  fn: () => Promise<T>,
): Promise<T> {
  const lockFileName = `${ARCHIVE_TMP_PREFIX}${cacheKey(source)}.lock`
  const lockFile = join(tmpdir(), lockFileName)
  // 文件必须存在才能被 proper-lockfile 锁住。
  await writeFile(lockFile, source, { flag: 'a' }).catch(() => {})
  const { default: lockfile } = await import('proper-lockfile')
  const release = await lockfile.lock(lockFile, {
    retries: { retries: 5, minTimeout: 200, maxTimeout: 1000 },
    stale: 30_000,
  })
  try {
    return await fn()
  } finally {
    await release().catch(() => {})
  }
}

/**
 * 解决一个本地 .zip 路径：返回解压后的目录路径。
 *
 * @param zipPath 本地 .zip 路径（绝对或相对）
 */
export async function resolveLocalZipArchive(zipPath: string): Promise<string> {
  if (!isZipArchivePath(zipPath)) {
    throw new Error(`Not a .zip path: ${zipPath}`)
  }
  // 缓存以绝对路径为 key（输入相对路径会被 path.resolve 处理）。
  const { resolve: pathResolve } = await import('path')
  const abs = pathResolve(zipPath)
  if (archiveCache.has(abs)) return archiveCache.get(abs)!
  const existing = inflight.get(abs)
  if (existing) return existing
  const promise = withLock(abs, async () => {
    // 锁内再 check 一次（双 check 锁定避免重复解压）。
    if (archiveCache.has(abs)) return archiveCache.get(abs)!
    if (!(await statSafe(abs))) {
      throw new Error(`Plugin archive not found: ${abs}`)
    }
    const extractDir = await extractArchive(abs)
    const finalDir = await unwrapSingleDirRoot(extractDir)
    archiveCache.set(abs, finalDir)
    logForDebugging(
      `Resolved local zip plugin: ${basename(abs)} → ${finalDir}`,
    )
    return finalDir
  })
  inflight.set(abs, promise)
  try {
    return await promise
  } finally {
    inflight.delete(abs)
  }
}

/**
 * 解决一个 https:// .zip URL：下载到 tmp，校验，解压。
 * 同一 URL 在同一会话/同一锁域内只下载一次。
 *
 * @param url 必须是 https:// 且 path 以 .zip 结尾
 */
export async function resolveRemoteZipArchive(url: string): Promise<string> {
  const v = validatePluginUrl(url)
  if (v.ok !== true) throw new Error((v as { ok: false; reason: string }).reason)
  if (archiveCache.has(url)) return archiveCache.get(url)!
  const existing = inflight.get(url)
  if (existing) return existing
  const promise = withLock(url, async () => {
    if (archiveCache.has(url)) return archiveCache.get(url)!
    const { filePath, sha256, bytes } = await downloadToTempFile(url)
    logForDebugging(
      `Downloaded ${bytes} bytes from ${url} (sha256=${sha256.slice(0, 12)}…)`,
    )
    try {
      const extractDir = await extractArchive(filePath)
      const finalDir = await unwrapSingleDirRoot(extractDir)
      archiveCache.set(url, finalDir)
      return finalDir
    } finally {
      // 下载的临时 .zip 文件用完即删；解压目录保留到会话结束。
      await rm(filePath, { force: true }).catch(() => {})
    }
  })
  inflight.set(url, promise)
  try {
    return await promise
  } finally {
    inflight.delete(url)
  }
}

/**
 * 总入口：把一个 source（URL/本地 zip 路径/普通目录）规范化为 plugin 根目录。
 * 普通目录原样返回，调用方无需自己分支判断。
 */
export async function resolvePluginDirSource(
  source: string,
): Promise<string> {
  const trimmed = source.trim()
  if (isHttpsUrl(trimmed)) {
    // 远程 URL：必须 .zip
    return await resolveRemoteZipArchive(trimmed)
  }
  if (isZipArchivePath(trimmed)) {
    // 本地 .zip：解压
    return await resolveLocalZipArchive(trimmed)
  }
  // 否则当普通目录路径
  return trimmed
}

/**
 * 会话结束时清理所有临时解压目录（main.tsx exit hook 调用）。
 * 失败不抛 — 清理是 best-effort。
 */
export async function cleanupSessionArchiveCache(): Promise<void> {
  const dirs = Array.from(createdTempDirs)
  createdTempDirs.clear()
  archiveCache.clear()
  await Promise.all(
    dirs.map(d =>
      rm(d, { recursive: true, force: true }).catch(err =>
        logForDebugging(`Failed to clean up ${d}: ${err}`),
      ),
    ),
  )
}

/**
 * 仅供测试：重置内部状态。
 */
export function _resetForTests(): void {
  archiveCache.clear()
  inflight.clear()
  createdTempDirs.clear()
}
