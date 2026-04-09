import { createHash } from 'crypto'
import type { AssistantMessage, UserMessage } from '../types/message.js'

/**
 * Hardcoded salt from backend validation.
 * Must match exactly for fingerprint validation to pass.
 */
export const FINGERPRINT_SALT = '59cf53e54c78'

/**
 * Returns true if a text string is a system-reminder injection (e.g. hooks,
 * skills, deferred-tools, MCP instructions). These blocks are volatile across
 * resume and must be excluded from fingerprint computation to keep the
 * server-side cache key stable.
 */
function isSystemReminderText(text: string): boolean {
  const trimmed = text.trimStart()
  return (
    trimmed.startsWith('<system-reminder>') ||
    trimmed.startsWith('<system-reminder\n')
  )
}

/**
 * Extracts text content from the first user message, skipping
 * system-reminder blocks that can drift on resume and destabilise
 * the fingerprint (→ cache bust).
 *
 * @param messages - Array of internal message types
 * @returns First real user text content, or empty string if not found
 */
export function extractFirstMessageText(
  messages: (UserMessage | AssistantMessage)[],
): string {
  const firstUserMessage = messages.find(msg => msg.type === 'user')
  if (!firstUserMessage) {
    return ''
  }

  const content = firstUserMessage.message.content

  if (typeof content === 'string') {
    return isSystemReminderText(content) ? '' : content
  }

  if (Array.isArray(content)) {
    // Find the first real text block (skip system-reminder injections)
    const textBlock = content.find(
      block =>
        block.type === 'text' &&
        'text' in block &&
        !isSystemReminderText(block.text),
    )
    if (textBlock && textBlock.type === 'text') {
      return textBlock.text
    }
  }

  return ''
}

/**
 * Computes 3-character fingerprint for Panda attribution.
 * Algorithm: SHA256(SALT + msg[4] + msg[7] + msg[20] + version)[:3]
 * IMPORTANT: Do not change this method without careful coordination with
 * 1P and 3P (Bedrock, Vertex, Azure) APIs.
 *
 * @param messageText - First user message text content
 * @param version - Version string (from MACRO.VERSION)
 * @returns 3-character hex fingerprint
 */
export function computeFingerprint(
  messageText: string,
  version: string,
): string {
  // Extract chars at indices [4, 7, 20], use "0" if index not found
  const indices = [4, 7, 20]
  const chars = indices.map(i => messageText[i] || '0').join('')

  const fingerprintInput = `${FINGERPRINT_SALT}${chars}${version}`

  // SHA256 hash, return first 3 hex chars
  const hash = createHash('sha256').update(fingerprintInput).digest('hex')
  return hash.slice(0, 3)
}

/**
 * Computes fingerprint from the first user message.
 *
 * @param messages - Array of normalized messages
 * @returns 3-character hex fingerprint
 */
export function computeFingerprintFromMessages(
  messages: (UserMessage | AssistantMessage)[],
): string {
  const firstMessageText = extractFirstMessageText(messages)
  return computeFingerprint(firstMessageText, MACRO.VERSION)
}
