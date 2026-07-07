import type { Message } from 'src/types/message'
import type { CacheSafeParams } from '../../utils/forkedAgent.js'
import { isPromptTooLongMessage } from '../api/errors.js'
import {
  compactConversation,
  type CompactionResult,
} from './compact.js'

export const isReactiveOnlyMode: () => boolean = () => false

export const isReactiveCompactEnabled: () => boolean = () => true

export const isWithheldPromptTooLong: (message: Message) => boolean = message =>
  message.type === 'assistant' && isPromptTooLongMessage(message)

export const isWithheldMediaSizeError: (message: Message) => boolean = () => false

export const reactiveCompactOnPromptTooLong: (
  messages: Message[],
  cacheSafeParams: CacheSafeParams,
  options: { customInstructions?: string; trigger?: string },
) => Promise<{ ok: boolean; reason?: string; result?: CompactionResult }> = async (
  messages,
  cacheSafeParams,
  options,
) => {
  try {
    const result = await compactConversation(
      messages,
      cacheSafeParams.toolUseContext,
      cacheSafeParams,
      true,
      options.customInstructions,
      true,
    )
    return { ok: true, result }
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}

export const tryReactiveCompact: (params: {
  hasAttempted: boolean
  querySource: string
  aborted: boolean
  messages: Message[]
  cacheSafeParams: CacheSafeParams
}) => Promise<CompactionResult | null> = async ({
  hasAttempted,
  aborted,
  messages,
  cacheSafeParams,
}) => {
  if (hasAttempted || aborted || !isReactiveCompactEnabled()) {
    return null
  }

  const response = await reactiveCompactOnPromptTooLong(messages, cacheSafeParams, {
    trigger: 'prompt_too_long',
  })
  return response.ok ? (response.result ?? null) : null
}
