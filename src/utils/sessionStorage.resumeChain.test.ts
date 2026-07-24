/**
 * Regression: --resume history truncated to a short tail when main-chain
 * parentUuid is dangling (missing intermediate) or mid-stream null
 * (channel/wechat resume root). walkChainBeforeParse + relinkDanglingMainchainParents
 * must stitch the post-boundary chain so buildConversationChain returns full history.
 *
 * Input: synthetic JSONL with deliberate chain holes
 * Output: loadTranscriptFile → chain length includes post-boundary turns
 * Pos: session resume correctness (loadTranscriptFile survivor map)
 */
import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  buildConversationChain,
  loadTranscriptFile,
} from './sessionStorage.js'

let tempDir: string | null = null

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true })
    tempDir = null
  }
})

function uuid(n: number): string {
  // Valid UUID v4 shape; n seeds the last segment for uniqueness.
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

function ts(i: number): string {
  // Monotonic ISO timestamps so findLatestMessage leaf selection is stable.
  return `2026-07-20T12:${String(i).padStart(2, '0')}:00.000Z`
}

function userLine(
  id: number,
  parent: number | null,
  text: string,
  i: number,
): string {
  return JSON.stringify({
    parentUuid: parent === null ? null : uuid(parent),
    isSidechain: false,
    type: 'user',
    message: { role: 'user', content: text },
    uuid: uuid(id),
    timestamp: ts(i),
    userType: 'external',
    cwd: '/tmp',
    sessionId: uuid(9999),
    version: '0.0.0',
  })
}

function assistantLine(
  id: number,
  parent: number,
  text: string,
  i: number,
): string {
  return JSON.stringify({
    parentUuid: uuid(parent),
    isSidechain: false,
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [{ type: 'text', text }],
      id: `msg_${id}`,
      model: 'test',
    },
    uuid: uuid(id),
    timestamp: ts(i),
    userType: 'external',
    cwd: '/tmp',
    sessionId: uuid(9999),
    version: '0.0.0',
  })
}

function boundaryLine(id: number, i: number): string {
  return JSON.stringify({
    parentUuid: null,
    isSidechain: false,
    type: 'system',
    subtype: 'compact_boundary',
    uuid: uuid(id),
    timestamp: ts(i),
    content: 'Conversation compacted',
    isMeta: true,
    level: 'info',
    compactMetadata: { trigger: 'auto', preTokens: 1000 },
    userType: 'external',
    cwd: '/tmp',
    sessionId: uuid(9999),
    version: '0.0.0',
  })
}

function writeSession(lines: string[]): string {
  tempDir = mkdtempSync(join(tmpdir(), 'resume-chain-'))
  const path = join(tempDir, 'session.jsonl')
  writeFileSync(path, lines.join('\n') + '\n', 'utf8')
  return path
}

async function loadChain(path: string) {
  const { messages, leafUuids } = await loadTranscriptFile(path)
  let latest: { timestamp: string; uuid: string } | undefined
  for (const m of messages.values()) {
    if (
      !leafUuids.has(m.uuid) ||
      (m.type !== 'user' && m.type !== 'assistant') ||
      m.isSidechain
    ) {
      continue
    }
    if (
      !latest ||
      Date.parse(m.timestamp) > Date.parse(latest.timestamp)
    ) {
      latest = m
    }
  }
  expect(latest).toBeDefined()
  const leaf = messages.get(latest!.uuid)!
  return {
    messages,
    chain: buildConversationChain(messages, leaf),
  }
}

describe('loadTranscriptFile dangling parent stitch', () => {
  test('dangling parentUuid (missing intermediate) recovers full post-boundary chain', async () => {
    // physical: root → a → b → BOUNDARY → c → d → e(parent points at MISSING m) → f
    // Without stitch, leaf walk stops at e → chain is tiny (~2). With stitch,
    // e→d rewrite yields full post-boundary chain including boundary.
    const lines = [
      userLine(1, null, 'pre-root', 1),
      assistantLine(2, 1, 'pre-reply', 2),
      boundaryLine(10, 3),
      userLine(11, 10, 'post-1', 4),
      assistantLine(12, 11, 'post-1-reply', 5),
      userLine(13, 12, 'post-2', 6),
      // 14 is never written — dangling gap
      userLine(15, 14, 'post-3-dangling-parent', 7),
      assistantLine(16, 15, 'post-3-reply', 8),
    ]
    const { chain } = await loadChain(writeSession(lines))
    const texts = chain
      .filter(m => m.type === 'user' || m.type === 'assistant')
      .map(m => {
        const c = (m as { message?: { content?: unknown } }).message?.content
        if (typeof c === 'string') return c
        if (Array.isArray(c)) {
          const t = c.find(
            (x: { type?: string; text?: string }) => x?.type === 'text',
          )
          return t?.text ?? ''
        }
        return ''
      })
    expect(chain.some(m => m.subtype === 'compact_boundary')).toBe(true)
    expect(texts).toContain('post-1')
    expect(texts).toContain('post-2')
    expect(texts).toContain('post-3-dangling-parent')
    expect(texts).toContain('post-3-reply')
    // Must NOT stop at the dangling hole with only the tip.
    expect(texts.length).toBeGreaterThanOrEqual(4)
  })

  test('mid-stream parentUuid:null (channel resume root) is bridged', async () => {
    // channel/wechat often starts a fresh root mid-file without forking.
    const lines = [
      userLine(1, null, 'early', 1),
      assistantLine(2, 1, 'early-reply', 2),
      boundaryLine(10, 3),
      userLine(11, 10, 'after-boundary', 4),
      assistantLine(12, 11, 'after-boundary-reply', 5),
      // fresh root mid-stream (parentUuid:null) — must bridge past, not truncate
      userLine(20, null, 'channel-root', 6),
      assistantLine(21, 20, 'channel-reply', 7),
    ]
    const { chain } = await loadChain(writeSession(lines))
    const texts = chain
      .filter(m => m.type === 'user' || m.type === 'assistant')
      .map(m => {
        const c = (m as { message?: { content?: unknown } }).message?.content
        if (typeof c === 'string') return c
        if (Array.isArray(c)) {
          const t = c.find(
            (x: { type?: string; text?: string }) => x?.type === 'text',
          )
          return t?.text ?? ''
        }
        return ''
      })
    expect(chain.some(m => m.subtype === 'compact_boundary')).toBe(true)
    expect(texts).toContain('after-boundary')
    expect(texts).toContain('channel-root')
    expect(texts).toContain('channel-reply')
  })

  test('sidechain branches are not grafted onto mainchain by the stitch', async () => {
    const sidechainUser = JSON.stringify({
      parentUuid: uuid(11),
      isSidechain: true,
      type: 'user',
      message: { role: 'user', content: 'sidechain-only' },
      uuid: uuid(50),
      timestamp: ts(6),
      userType: 'external',
      cwd: '/tmp',
      sessionId: uuid(9999),
      version: '0.0.0',
    })
    const lines = [
      userLine(1, null, 'root', 1),
      boundaryLine(10, 2),
      userLine(11, 10, 'main-1', 3),
      assistantLine(12, 11, 'main-1-reply', 4),
      sidechainUser,
      // dangling on main tip
      userLine(13, 99, 'main-tip-dangling', 7),
    ]
    const { chain, messages } = await loadChain(writeSession(lines))
    const side = messages.get(uuid(50))
    expect(side?.isSidechain).toBe(true)
    // parent of sidechain should still be 11 (not rewritten via main stitch)
    expect(side?.parentUuid).toBe(uuid(11))
    const texts = chain
      .filter(m => m.type === 'user' || m.type === 'assistant')
      .map(m => {
        const c = (m as { message?: { content?: unknown } }).message?.content
        if (typeof c === 'string') return c
        return ''
      })
    expect(texts).toContain('main-1')
    expect(texts).toContain('main-tip-dangling')
    expect(texts).not.toContain('sidechain-only')
  })
})
