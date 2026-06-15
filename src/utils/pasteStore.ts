import { createHash } from 'crypto'
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'fs/promises'
import { join } from 'path'
import { logForDebugging } from './debug.js'
import { getClaudeConfigHomeDir } from './envUtils.js'
import { isENOENT } from './errors.js'

const PASTE_STORE_DIR = 'paste-cache'
// Distinct from imageStore.ts's 'image-cache/<sessionId>/' tree: this stores
// history-referenced pasted images (content-addressable, session-agnostic).
const IMAGE_STORE_DIR = 'paste-image-cache'

/**
 * Get the paste store directory (persistent across sessions).
 */
function getPasteStoreDir(): string {
  return join(getClaudeConfigHomeDir(), PASTE_STORE_DIR)
}

/**
 * Get the image store directory (persistent across sessions).
 */
function getImageStoreDir(): string {
  return join(getClaudeConfigHomeDir(), IMAGE_STORE_DIR)
}

/**
 * Generate a hash for paste content to use as filename.
 * Exported so callers can get the hash synchronously before async storage.
 */
export function hashPastedText(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

/**
 * Get the file path for a paste by its content hash.
 */
function getPastePath(hash: string): string {
  return join(getPasteStoreDir(), `${hash}.txt`)
}

/**
 * Generate a hash for pasted image base64 content to use as filename.
 * Exported so callers can get the hash synchronously before async storage.
 */
export function hashPastedImage(base64Content: string): string {
  return createHash('sha256').update(base64Content).digest('hex').slice(0, 16)
}

/**
 * Get the file path for a pasted image by its content hash.
 */
function getImagePath(hash: string): string {
  return join(getImageStoreDir(), `${hash}.b64`)
}

/**
 * Store pasted image base64 content to disk.
 * The hash should be pre-computed with hashPastedImage() so the caller
 * can use it immediately without waiting for the async disk write.
 * Images are kept out of history.jsonl (which would otherwise be bloated
 * by large base64 blobs) and referenced by contentHash instead.
 */
export async function storePastedImage(
  hash: string,
  base64Content: string,
): Promise<void> {
  try {
    const dir = getImageStoreDir()
    await mkdir(dir, { recursive: true })

    const imagePath = getImagePath(hash)

    // Content-addressable: same hash = same content, so overwriting is safe
    await writeFile(imagePath, base64Content, { encoding: 'utf8', mode: 0o600 })
    logForDebugging(`Stored image ${hash} to ${imagePath}`)
  } catch (error) {
    logForDebugging(`Failed to store image: ${error}`)
  }
}

/**
 * Retrieve pasted image base64 content by its hash.
 * Returns null if not found or on error.
 */
export async function retrievePastedImage(
  hash: string,
): Promise<string | null> {
  try {
    const imagePath = getImagePath(hash)
    return await readFile(imagePath, { encoding: 'utf8' })
  } catch (error) {
    // ENOENT is expected when image doesn't exist
    if (!isENOENT(error)) {
      logForDebugging(`Failed to retrieve image ${hash}: ${error}`)
    }
    return null
  }
}

/**
 * Store pasted text content to disk.
 * The hash should be pre-computed with hashPastedText() so the caller
 * can use it immediately without waiting for the async disk write.
 */
export async function storePastedText(
  hash: string,
  content: string,
): Promise<void> {
  try {
    const dir = getPasteStoreDir()
    await mkdir(dir, { recursive: true })

    const pastePath = getPastePath(hash)

    // Content-addressable: same hash = same content, so overwriting is safe
    await writeFile(pastePath, content, { encoding: 'utf8', mode: 0o600 })
    logForDebugging(`Stored paste ${hash} to ${pastePath}`)
  } catch (error) {
    logForDebugging(`Failed to store paste: ${error}`)
  }
}

/**
 * Retrieve pasted text content by its hash.
 * Returns null if not found or on error.
 */
export async function retrievePastedText(hash: string): Promise<string | null> {
  try {
    const pastePath = getPastePath(hash)
    return await readFile(pastePath, { encoding: 'utf8' })
  } catch (error) {
    // ENOENT is expected when paste doesn't exist
    if (!isENOENT(error)) {
      logForDebugging(`Failed to retrieve paste ${hash}: ${error}`)
    }
    return null
  }
}

/**
 * Clean up old paste files that are no longer referenced.
 * This is a simple time-based cleanup - removes files older than cutoffDate.
 */
export async function cleanupOldPastes(cutoffDate: Date): Promise<void> {
  const pasteDir = getPasteStoreDir()

  let files
  try {
    files = await readdir(pasteDir)
  } catch {
    // Directory doesn't exist or can't be read - nothing to clean up
    return
  }

  const cutoffTime = cutoffDate.getTime()
  for (const file of files) {
    if (!file.endsWith('.txt')) {
      continue
    }

    const filePath = join(pasteDir, file)
    try {
      const stats = await stat(filePath)
      if (stats.mtimeMs < cutoffTime) {
        await unlink(filePath)
        logForDebugging(`Cleaned up old paste: ${filePath}`)
      }
    } catch {
      // Ignore errors for individual files
    }
  }

  // Also clean up old cached images (same time-based policy).
  const imageDir = getImageStoreDir()
  let imageFiles
  try {
    imageFiles = await readdir(imageDir)
  } catch {
    // Directory doesn't exist or can't be read - nothing to clean up
    return
  }
  for (const file of imageFiles) {
    if (!file.endsWith('.b64')) {
      continue
    }
    const filePath = join(imageDir, file)
    try {
      const stats = await stat(filePath)
      if (stats.mtimeMs < cutoffTime) {
        await unlink(filePath)
        logForDebugging(`Cleaned up old image: ${filePath}`)
      }
    } catch {
      // Ignore errors for individual files
    }
  }
}
