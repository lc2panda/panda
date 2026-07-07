// Input: terminal keypress batches、cursor state、history callbacks
// Output: text input state transitions and submit/change callbacks
// Pos: Windows/SSH/tmux 首次发送竞态敏感点，修改后需同步 race 测试
import { useRef } from 'react'
import { isInputModeCharacter } from 'src/components/PromptInput/inputModes.js'
import { useNotifications } from 'src/context/notifications.js'
import stripAnsi from 'strip-ansi'
import { markBackslashReturnUsed } from '../commands/terminalSetup/terminalSetup.js'
import { addToHistory } from '../history.js'
import type { Key } from '../ink.js'
import { logForDebugging } from '../utils/debug.js'
import type {
  InlineGhostText,
  TextInputState,
} from '../types/textInputTypes.js'
import {
  Cursor,
  getLastKill,
  pushToKillRing,
  recordYank,
  resetKillAccumulation,
  resetYankState,
  updateYankLength,
  yankPop,
} from '../utils/Cursor.js'
import { env } from '../utils/env.js'
import { isFullscreenEnvEnabled } from '../utils/fullscreen.js'
import type { ImageDimensions } from '../utils/imageResizer.js'
import { isModifierPressed, prewarmModifiers } from '../utils/modifiers.js'
import { useDoublePress } from './useDoublePress.js'

type MaybeCursor = false | Cursor
type InputHandler = (input: string) => MaybeCursor | undefined
type InputMapper = (input: string) => MaybeCursor | undefined
const NOOP_HANDLER: InputHandler = () => false

export function getCoalescedEnterBody(input: string): string | null {
  const ending = input.endsWith('\r\n') ? '\r\n' : input.endsWith('\r') ? '\r' : input.endsWith('\n') ? '\n' : ''
  if (!ending || input.length <= ending.length) return null
  const body = input.slice(0, -ending.length)
  if (body.endsWith('\\')) return null
  if (/[\r\n]/.test(body)) return null
  return body
}

function mapInput(input_map: Array<[string, InputHandler]>): InputMapper {
  const map = new Map(input_map)
  return function (input: string): MaybeCursor {
    return (map.get(input) ?? NOOP_HANDLER)(input) || false
  }
}

export type UseTextInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  onExit?: () => void
  onExitMessage?: (show: boolean, key?: string) => void
  onHistoryUp?: () => void
  onHistoryDown?: () => void
  onHistoryReset?: () => void
  onClearInput?: () => void
  focus?: boolean
  mask?: string
  multiline?: boolean
  cursorChar: string
  highlightPastedText?: boolean
  invert: (text: string) => string
  themeText: (text: string) => string
  columns: number
  onImagePaste?: (
    base64Image: string,
    mediaType?: string,
    filename?: string,
    dimensions?: ImageDimensions,
    sourcePath?: string,
  ) => void
  disableCursorMovementForUpDownKeys?: boolean
  disableEscapeDoublePress?: boolean
  maxVisibleLines?: number
  externalOffset: number
  onOffsetChange: (offset: number) => void
  inputFilter?: (input: string, key: Key) => string
  inlineGhostText?: InlineGhostText
  dim?: (text: string) => string
}

export function useTextInput({
  value: originalValue,
  onChange,
  onSubmit,
  onExit,
  onExitMessage,
  onHistoryUp,
  onHistoryDown,
  onHistoryReset,
  onClearInput,
  mask = '',
  multiline = false,
  cursorChar,
  invert,
  columns,
  onImagePaste: _onImagePaste,
  disableCursorMovementForUpDownKeys = false,
  disableEscapeDoublePress = false,
  maxVisibleLines,
  externalOffset,
  onOffsetChange,
  inputFilter,
  inlineGhostText,
  dim,
}: UseTextInputProps): TextInputState {
  // Pre-warm the modifiers module for Apple Terminal (has internal guard, safe to call multiple times)
  if (env.terminal === 'Apple_Terminal') {
    prewarmModifiers()
  }

  const offset = externalOffset
  const setOffset = onOffsetChange
  // Worker Y P0 fix: track latest text + offset synchronously across keystrokes
  // within the same discreteUpdates batch. processKeysInBatch emits all keys in
  // a stdin chunk back-to-back via EventEmitter.emit (synchronous), and the
  // useEventCallback ref in useInput is updated via useEffect (async under Bun
  // where typeof window === undefined). So within the SAME batch:
  //   1. ref.current points at the prev-commit wrappedOnInput closure
  //   2. cursor inside that closure is Cursor.fromText(originalValue) — stale
  //   3. cursor.insert(char) returns nextCursor with just THIS char (e.g. 'h')
  //   4. onChange('h') schedules setState — next iteration sees same stale cursor
  //   5. Final Enter calls handleEnter(originalValue=='') — submit dropped at
  //      PromptInput.onSubmit L1074 (inputParam.trim() === '') early return.
  // Comdr report: 输入正常内容按 Enter 没反应，按 ↑ 后输入恢复.
  // Fix: maintain refs that progress through the batch in lockstep with onChange,
  // and rebind the `cursor` let-binding at onInput entry so all the inner
  // closures (mapKey, handleCtrl, handleMeta, handleEnter, etc.) see the live
  // value via JavaScript closure semantics on a `let` variable.
  const latestValueRef = useRef(originalValue)
  const latestOffsetRef = useRef(offset)
  const submittedValueRef = useRef<string | null>(null)
  if (submittedValueRef.current !== null && originalValue !== submittedValueRef.current) {
    submittedValueRef.current = null
  }
  latestValueRef.current = originalValue
  latestOffsetRef.current = offset
  // eslint-disable-next-line prefer-const — re-assigned at onInput entry to
  // resync from refs that progress through the batch.
  let cursor = Cursor.fromText(originalValue, columns, offset)
  const { addNotification, removeNotification } = useNotifications()

  const handleCtrlC = useDoublePress(
    show => {
      onExitMessage?.(show, 'Ctrl-C')
    },
    () => onExit?.(),
    () => {
      if (originalValue) {
        onChange('')
        setOffset(0)
        onHistoryReset?.()
      }
    },
  )

  // NOTE(keybindings): This escape handler is intentionally NOT migrated to the keybindings system.
  // It's a text-level double-press escape for clearing input, not an action-level keybinding.
  // Double-press Esc clears the input and saves to history - this is text editing behavior,
  // not dialog dismissal, and needs the double-press safety mechanism.
  const handleEscape = useDoublePress(
    (show: boolean) => {
      if (!originalValue || !show) {
        return
      }
      addNotification({
        key: 'escape-again-to-clear',
        text: 'Esc again to clear',
        priority: 'immediate',
        timeoutMs: 1000,
      })
    },
    () => {
      // Remove the "Esc again to clear" notification immediately
      removeNotification('escape-again-to-clear')
      onClearInput?.()
      if (originalValue) {
        // Track double-escape usage for feature discovery
        // Save to history before clearing
        if (originalValue.trim() !== '') {
          addToHistory(originalValue)
        }
        onChange('')
        setOffset(0)
        onHistoryReset?.()
      }
    },
  )

  const handleEmptyCtrlD = useDoublePress(
    show => {
      if (originalValue !== '') {
        return
      }
      onExitMessage?.(show, 'Ctrl-D')
    },
    () => {
      if (originalValue !== '') {
        return
      }
      onExit?.()
    },
  )

  function handleCtrlD(): MaybeCursor {
    if (cursor.text === '') {
      // When input is empty, handle double-press
      handleEmptyCtrlD()
      return cursor
    }
    // When input is not empty, delete forward like iPython
    return cursor.del()
  }

  function killToLineEnd(): Cursor {
    const { cursor: newCursor, killed } = cursor.deleteToLineEnd()
    pushToKillRing(killed, 'append')
    return newCursor
  }

  function killToLineStart(): Cursor {
    const { cursor: newCursor, killed } = cursor.deleteToLineStart()
    pushToKillRing(killed, 'prepend')
    return newCursor
  }

  function killWordBefore(): Cursor {
    const { cursor: newCursor, killed } = cursor.deleteWordBefore()
    pushToKillRing(killed, 'prepend')
    return newCursor
  }

  function yank(): Cursor {
    const text = getLastKill()
    if (text.length > 0) {
      const startOffset = cursor.offset
      const newCursor = cursor.insert(text)
      recordYank(startOffset, text.length)
      return newCursor
    }
    return cursor
  }

  function handleYankPop(): Cursor {
    const popResult = yankPop()
    if (!popResult) {
      return cursor
    }
    const { text, start, length } = popResult
    // Replace the previously yanked text with the new one
    const before = cursor.text.slice(0, start)
    const after = cursor.text.slice(start + length)
    const newText = before + text + after
    const newOffset = start + text.length
    updateYankLength(text.length)
    return Cursor.fromText(newText, columns, newOffset)
  }

  const handleCtrl = mapInput([
    ['a', () => cursor.startOfLine()],
    ['b', () => cursor.left()],
    ['c', () => {
      handleCtrlC()
      return false
    }],
    ['d', handleCtrlD],
    ['e', () => cursor.endOfLine()],
    ['f', () => cursor.right()],
    ['h', () => cursor.deleteTokenBefore() ?? cursor.backspace()],
    ['k', killToLineEnd],
    ['n', () => downOrHistoryDown()],
    ['p', () => upOrHistoryUp()],
    ['u', killToLineStart],
    ['w', killWordBefore],
    ['y', yank],
  ])

  const handleMeta = mapInput([
    ['b', () => cursor.prevWord()],
    ['f', () => cursor.nextWord()],
    ['d', () => cursor.deleteWordAfter()],
    ['y', handleYankPop],
  ])

  function submitOnce(value: string) {
    if (submittedValueRef.current === value) return
    submittedValueRef.current = value
    onSubmit?.(value)
  }

  function handleEnter(key: Key) {
    if (
      multiline &&
      cursor.offset > 0 &&
      cursor.text[cursor.offset - 1] === '\\'
    ) {
      // Track that the user has used backslash+return
      markBackslashReturnUsed()
      return cursor.backspace().insert('\n')
    }
    // Meta+Enter or Shift+Enter inserts a newline
    if (key.meta || key.shift) {
      return cursor.insert('\n')
    }
    // Apple Terminal doesn't support custom Shift+Enter keybindings,
    // so we use native macOS modifier detection to check if Shift is held
    if (env.terminal === 'Apple_Terminal' && isModifierPressed('shift')) {
      return cursor.insert('\n')
    }
    // Worker Y P0 fix: use cursor.text (live) instead of originalValue (stale
    // React closure). The `cursor` let-binding is rebound at onInput entry from
    // latestValueRef.current, so by the time handleEnter runs it reflects every
    // prior key in this discreteUpdates batch. originalValue captured at hook
    // execution is empty when keys are coalesced ("hello\r" arriving in a single
    // stdin chunk), causing PromptInput.onSubmit's L1074 empty-input guard to
    // silently drop the message — the Comdr P0 bug.
    if (cursor.text !== originalValue) {
      logForDebugging(
        `[useTextInput.handleEnter] stale closure caught: originalValue.len=${originalValue.length} cursor.text.len=${cursor.text.length} — submitting live cursor.text`,
      )
    }
    submitOnce(cursor.text)
  }

  function upOrHistoryUp() {
    if (disableCursorMovementForUpDownKeys) {
      onHistoryUp?.()
      return cursor
    }
    // Try to move by wrapped lines first
    const cursorUp = cursor.up()
    if (!cursorUp.equals(cursor)) {
      return cursorUp
    }

    // If we can't move by wrapped lines and this is multiline input,
    // try to move by logical lines (to handle paragraph boundaries)
    if (multiline) {
      const cursorUpLogical = cursor.upLogicalLine()
      if (!cursorUpLogical.equals(cursor)) {
        return cursorUpLogical
      }
    }

    // Can't move up at all - trigger history navigation
    onHistoryUp?.()
    return cursor
  }
  function downOrHistoryDown() {
    if (disableCursorMovementForUpDownKeys) {
      onHistoryDown?.()
      return cursor
    }
    // Try to move by wrapped lines first
    const cursorDown = cursor.down()
    if (!cursorDown.equals(cursor)) {
      return cursorDown
    }

    // If we can't move by wrapped lines and this is multiline input,
    // try to move by logical lines (to handle paragraph boundaries)
    if (multiline) {
      const cursorDownLogical = cursor.downLogicalLine()
      if (!cursorDownLogical.equals(cursor)) {
        return cursorDownLogical
      }
    }

    // Can't move down at all - trigger history navigation
    onHistoryDown?.()
    return cursor
  }

  function mapKey(key: Key): InputMapper {
    switch (true) {
      case key.escape:
        return () => {
          // Skip when a keybinding context (e.g. Autocomplete) owns escape.
          // useKeybindings can't shield us via stopImmediatePropagation —
          // BaseTextInput's useInput registers first (child effects fire
          // before parent effects), so this handler has already run by the
          // time the keybinding's handler stops propagation.
          if (disableEscapeDoublePress) return cursor
          handleEscape()
          // Return the current cursor unchanged - handleEscape manages state internally
          return cursor
        }
      case key.leftArrow && (key.ctrl || key.meta || key.fn):
        return () => cursor.prevWord()
      case key.rightArrow && (key.ctrl || key.meta || key.fn):
        return () => cursor.nextWord()
      case key.backspace:
        return key.meta || key.ctrl
          ? killWordBefore
          : () => cursor.deleteTokenBefore() ?? cursor.backspace()
      case key.delete:
        return key.meta ? killToLineEnd : () => cursor.del()
      case key.ctrl:
        return handleCtrl
      case key.home:
        return () => cursor.startOfLine()
      case key.end:
        return () => cursor.endOfLine()
      case key.pageDown:
        // In fullscreen mode, PgUp/PgDn scroll the message viewport instead
        // of moving the cursor — no-op here, ScrollKeybindingHandler handles it.
        if (isFullscreenEnvEnabled()) {
          return NOOP_HANDLER
        }
        return () => cursor.endOfLine()
      case key.pageUp:
        if (isFullscreenEnvEnabled()) {
          return NOOP_HANDLER
        }
        return () => cursor.startOfLine()
      case key.wheelUp:
      case key.wheelDown:
        // Mouse wheel events only exist when fullscreen mouse tracking is on.
        // ScrollKeybindingHandler handles them; no-op here to avoid inserting
        // the raw SGR sequence as text.
        return NOOP_HANDLER
      case key.return:
        // Must come before key.meta so Option+Return inserts newline
        return () => handleEnter(key)
      case key.meta:
        return handleMeta
      case key.tab:
        return () => cursor
      case key.upArrow && !key.shift:
        return upOrHistoryUp
      case key.downArrow && !key.shift:
        return downOrHistoryDown
      case key.leftArrow:
        return () => cursor.left()
      case key.rightArrow:
        return () => cursor.right()
      default: {
        return function (input: string) {
          switch (true) {
            // Home key
            case input === '\x1b[H' || input === '\x1b[1~':
              return cursor.startOfLine()
            // End key
            case input === '\x1b[F' || input === '\x1b[4~':
              return cursor.endOfLine()
            default: {
              // Trailing Enter after text can arrive in the same SSH/tmux batch
              // ("o\r", "o\n", "o\r\n"). Strip only the final Enter for
              // that single-line batch so it can be submitted below instead of
              // inserted as content. Embedded CR/LF remains multi-line paste.
              // Backslash+Enter keeps the multi-line semantic.
              const coalescedEnterBody = getCoalescedEnterBody(input)
              const text = stripAnsi(coalescedEnterBody ?? input).replace(/\r\n|\r/g, '\n')
              if (cursor.isAtStart() && isInputModeCharacter(input)) {
                return cursor.insert(text).left()
              }
              return cursor.insert(text)
            }
          }
        }
      }
    }
  }

  // Check if this is a kill command (Ctrl+K, Ctrl+U, Ctrl+W, or Meta+Backspace/Delete)
  function isKillKey(key: Key, input: string): boolean {
    if (key.ctrl && (input === 'k' || input === 'u' || input === 'w')) {
      return true
    }
    if (key.meta && (key.backspace || key.delete)) {
      return true
    }
    return false
  }

  // Check if this is a yank command (Ctrl+Y or Alt+Y)
  function isYankKey(key: Key, input: string): boolean {
    return (key.ctrl || key.meta) && input === 'y'
  }

  function onInput(input: string, key: Key): void {
    // Note: Image paste shortcut (chat:imagePaste) is handled via useKeybindings in PromptInput

    // Worker Y P0 fix: rebind cursor from refs at entry so prior keys in this
    // batch are visible. This is the critical line — without it, mapKey and
    // all the inner closures (handleCtrl/handleMeta/handleEnter) operate on
    // the render-time cursor (Cursor.fromText(originalValue)), losing every
    // keystroke earlier in the same discreteUpdates batch.
    if (
      latestValueRef.current !== cursor.text ||
      latestOffsetRef.current !== cursor.offset
    ) {
      cursor = Cursor.fromText(
        latestValueRef.current,
        columns,
        latestOffsetRef.current,
      )
    }

    // Apply filter if provided
    const filteredInput = inputFilter ? inputFilter(input, key) : input

    // If the input was filtered out, do nothing.
    // v2.25.56 hotfix: REVERTED Enter/ArrowDown drop extension from v2.25.54
    // — it broke normal submit (Comdr reported: 按回车没反应). Restored
    // original `input !== ''` guard to preserve submit path.
    if (filteredInput === '' && input !== '') {
      return
    }

    // Fix Issue #1853: Filter DEL characters that interfere with backspace in SSH/tmux
    // In SSH/tmux environments, backspace generates both key events and raw DEL chars
    if (!key.backspace && !key.delete && input.includes('\x7f')) {
      const delCount = (input.match(/\x7f/g) || []).length

      // Apply all DEL characters as backspace operations synchronously
      // Try to delete tokens first, fall back to character backspace
      let currentCursor = cursor
      for (let i = 0; i < delCount; i++) {
        currentCursor =
          currentCursor.deleteTokenBefore() ?? currentCursor.backspace()
      }

      // Update state once with the final result
      if (!cursor.equals(currentCursor)) {
        if (cursor.text !== currentCursor.text) {
          onChange(currentCursor.text)
          // Worker Y P0 fix: sync latestValueRef so handleEnter in same batch
          // (e.g. SSH-coalesced "\x7f...hello\r") sees the latest text.
          latestValueRef.current = currentCursor.text
          latestOffsetRef.current = currentCursor.offset
        }
        setOffset(currentCursor.offset)
      }
      resetKillAccumulation()
      resetYankState()
      return
    }

    // Reset kill accumulation for non-kill keys
    if (!isKillKey(key, filteredInput)) {
      resetKillAccumulation()
    }

    // Reset yank state for non-yank keys (breaks yank-pop chain)
    if (!isYankKey(key, filteredInput)) {
      resetYankState()
    }

    const nextCursor = mapKey(key)(filteredInput)
    if (nextCursor) {
      if (!cursor.equals(nextCursor)) {
        if (cursor.text !== nextCursor.text) {
          onChange(nextCursor.text)
          // Worker Y P0 fix: sync latestValueRef so handleEnter in same batch
          // sees the latest text. This handles SSH/tmux coalesce, fast typing,
          // and paste-with-newline cases where prior keystrokes' setState has
          // not yet been committed when Enter is processed.
          latestValueRef.current = nextCursor.text
          latestOffsetRef.current = nextCursor.offset
        }
        setOffset(nextCursor.offset)
      }
      // SSH/tmux coalesced Enter: on slow links, text + Enter can arrive as one
      // chunk ("o\r", "o\n", or "o\r\n"). parseKeypress only matches lone
      // return, so those batches hit the default handler above. Submit only
      // single-line batches; embedded newlines remain paste, and backslash+Enter
      // keeps multi-line semantics.
      if (getCoalescedEnterBody(filteredInput) !== null) {
        submitOnce(nextCursor.text)
      }
    }
  }

  // Prepare ghost text for rendering - validate insertPosition matches current
  // cursor offset to prevent stale ghost text from a previous keystroke causing
  // a one-frame jitter (ghost text state is updated via useEffect after render)
  const ghostTextForRender =
    inlineGhostText && dim && inlineGhostText.insertPosition === offset
      ? { text: inlineGhostText.text, dim }
      : undefined

  const cursorPos = cursor.getPosition()

  return {
    onInput,
    renderedValue: cursor.render(
      cursorChar,
      mask,
      invert,
      ghostTextForRender,
      maxVisibleLines,
    ),
    offset,
    setOffset,
    cursorLine: cursorPos.line - cursor.getViewportStartLine(maxVisibleLines),
    cursorColumn: cursorPos.column,
    viewportCharOffset: cursor.getViewportCharOffset(maxVisibleLines),
    viewportCharEnd: cursor.getViewportCharEnd(maxVisibleLines),
  }
}
