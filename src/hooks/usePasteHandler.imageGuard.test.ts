import { describe, expect, test } from 'bun:test'
import {
  chunkLooksLikeImagePathPaste,
  extractImagePathsFromPasteChunks,
} from './usePasteHandler.js'

describe('S-001 image paste early-arm predicates', () => {
  test('chunkLooksLikeImagePathPaste: unix image path', () => {
    expect(chunkLooksLikeImagePathPaste('/Users/me/pic.png')).toBe(true)
    expect(chunkLooksLikeImagePathPaste('/tmp/a.jpg')).toBe(true)
    expect(chunkLooksLikeImagePathPaste('/tmp/a.jpeg')).toBe(true)
    expect(chunkLooksLikeImagePathPaste('/tmp/a.gif')).toBe(true)
    expect(chunkLooksLikeImagePathPaste('/tmp/a.webp')).toBe(true)
  })

  test('chunkLooksLikeImagePathPaste: windows image path', () => {
    expect(chunkLooksLikeImagePathPaste('C:\\Users\\me\\pic.png')).toBe(true)
  })

  test('chunkLooksLikeImagePathPaste: plain text / chinese does not arm', () => {
    expect(chunkLooksLikeImagePathPaste('hello world')).toBe(false)
    expect(chunkLooksLikeImagePathPaste('中文输入法测试')).toBe(false)
    expect(chunkLooksLikeImagePathPaste('/Users/me/readme.txt')).toBe(false)
    expect(chunkLooksLikeImagePathPaste('')).toBe(false)
  })

  test('chunkLooksLikeImagePathPaste: multi-path paste', () => {
    expect(
      chunkLooksLikeImagePathPaste('/tmp/a.png /tmp/b.jpg'),
    ).toBe(true)
    expect(
      chunkLooksLikeImagePathPaste('/tmp/a.png\n/tmp/b.jpg'),
    ).toBe(true)
  })

  test('extractImagePathsFromPasteChunks: joins chunks then filters', () => {
    const { pastedText, imagePaths } = extractImagePathsFromPasteChunks([
      '/tmp/a',
      '.png',
    ])
    // Partial chunks only become a path after join — early arm may miss this
    // mid-stream, but timeout arm (sync before pastePending clear) catches it.
    expect(pastedText).toBe('/tmp/a.png')
    expect(imagePaths).toEqual(['/tmp/a.png'])
  })

  test('extractImagePathsFromPasteChunks: strips orphaned focus tails', () => {
    const { pastedText, imagePaths } = extractImagePathsFromPasteChunks([
      '/tmp/shot.png[I',
    ])
    expect(pastedText).toBe('/tmp/shot.png')
    expect(imagePaths).toEqual(['/tmp/shot.png'])
  })

  test('extractImagePathsFromPasteChunks: text-only yields empty imagePaths', () => {
    const { imagePaths } = extractImagePathsFromPasteChunks(['hello ', 'world'])
    expect(imagePaths).toEqual([])
  })
})
