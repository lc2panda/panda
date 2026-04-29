import {
  hasUsedBackslashReturn,
  isShiftEnterKeyBindingInstalled,
} from '../../commands/terminalSetup/terminalSetup.js'
import type { Key } from '../../ink.js'
import { getGlobalConfig } from '../../utils/config.js'
import { env } from '../../utils/env.js'
/**
 * Helper function to check if vim mode is currently enabled
 * @returns boolean indicating if vim mode is active
 */
export function isVimModeEnabled(): boolean {
  const config = getGlobalConfig()
  return config.editorMode === 'vim'
}

export function getNewlineInstructions(): string {
  // Apple Terminal on macOS uses native modifier key detection for Shift+Enter
  if (env.terminal === 'Apple_Terminal' && process.platform === 'darwin') {
    return 'shift + ⏎ for newline'
  }

  // For iTerm2 and VSCode, show Shift+Enter instructions if installed
  if (isShiftEnterKeyBindingInstalled()) {
    return 'shift + ⏎ for newline'
  }

  // Otherwise show backslash+return instructions
  return hasUsedBackslashReturn()
    ? '\\⏎ for newline'
    : 'backslash (\\) + return (⏎) for newline'
}

/**
 * True when the keystroke is a printable character that does not begin
 * with whitespace — i.e., a normal letter/digit/symbol the user typed.
 * Used to gate the lazy space inserted after an image pill.
 */
export function isNonSpacePrintable(input: string, key: Key): boolean {
  if (
    key.ctrl ||
    key.meta ||
    key.escape ||
    key.return ||
    key.tab ||
    key.backspace ||
    key.delete ||
    key.upArrow ||
    key.downArrow ||
    key.leftArrow ||
    key.rightArrow ||
    key.pageUp ||
    key.pageDown ||
    key.home ||
    key.end
  ) {
    return false
  }
  return input.length > 0 && !/^\s/.test(input) && !input.startsWith('\x1b')
}

/**
 * Decide whether a keystroke should jump-to-bottom in the message viewport
 * (Comdr fix 2026-04-26: extends prior space-only behavior to also cover
 * Enter and ArrowDown when the prompt is empty).
 *
 * Returns true when:
 *   - User has scrolled away from the bottom (`sticky === false`)
 *   - No modifier (ctrl/meta/shift) is held
 *   - One of:
 *       a) Space (`rawInput === ' '`)               — any prompt content
 *       b) Enter / ArrowDown                         — ONLY when prompt empty
 *
 * Pure / side-effect-free: caller is responsible for invoking
 * `scrollRef.current.scrollToBottom()` when this returns true.
 */
export function shouldJumpToBottom(
  rawInput: string,
  key: Pick<
    Key,
    'ctrl' | 'meta' | 'shift' | 'return' | 'downArrow'
  >,
  promptLength: number,
  sticky: boolean,
): boolean {
  if (sticky) return false
  if (key.ctrl || key.meta || key.shift) return false
  // Space: drop the character, jump (preserves prior behaviour).
  if (rawInput === ' ') return true
  // Enter / ArrowDown: only when prompt is empty (avoid silently dropping
  // submit / history-down while the user is composing).
  if ((key.return || key.downArrow) && promptLength === 0) return true
  return false
}
