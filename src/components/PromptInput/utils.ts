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
 * Decide whether a keystroke should jump-to-bottom in the message viewport.
 *
 * v2.25.56 hotfix: REVERTED Enter / ArrowDown branch added in v2.25.54.
 * The Enter branch caused submit regressions (Comdr reported: "输入正常内容，
 * 按回车没反应") because the empty-prompt-only guard interacted poorly with
 * scrollRef.isSticky() state in real terminals. Restored to pure space-only
 * behaviour to unblock submit. Future re-attempt should land behind an env
 * opt-in until tested across all terminal/scroll states.
 *
 * Returns true ONLY when:
 *   - User has scrolled away from the bottom (`sticky === false`)
 *   - No modifier (ctrl/meta/shift) is held
 *   - The keystroke is exactly Space (`rawInput === ' '`)
 *
 * Pure / side-effect-free: caller is responsible for invoking
 * `scrollRef.current.scrollToBottom()` when this returns true.
 */
export function shouldJumpToBottom(
  rawInput: string,
  key: Pick<Key, 'ctrl' | 'meta' | 'shift'>,
  _promptLength: number,
  sticky: boolean,
): boolean {
  if (sticky) return false
  if (key.ctrl || key.meta || key.shift) return false
  if (rawInput === ' ') return true
  return false
}
