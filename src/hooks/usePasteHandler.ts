// Input: terminal paste chunks (bracketed paste / large paste / image paths)
// Output: wrappedOnInput + paste aggregation + image-paste begin/end barrier hooks
// Pos: PromptInput/BaseTextInput paste path — S-001 image-paste Enter race guard

import { basename } from 'path'
import React from 'react'
import { logError } from 'src/utils/log.js'
import { useDebounceCallback } from 'usehooks-ts'
import type { InputEvent, Key } from '../ink.js'
import {
  getImageFromClipboard,
  isImageFilePath,
  PASTE_THRESHOLD,
  tryReadImageFromPath,
} from '../utils/imagePaste.js'
import type { ImageDimensions } from '../utils/imageResizer.js'
import { getPlatform } from '../utils/platform.js'

const CLIPBOARD_CHECK_DEBOUNCE_MS = 50
const PASTE_COMPLETION_TIMEOUT_MS = 100

/**
 * Split paste text the same way path-image detection does (space before abs
 * path, then newlines) and report whether any line looks like an image path.
 * Exported for unit tests (S-001 early-arm predicate).
 */
export function chunkLooksLikeImagePathPaste(input: string): boolean {
  return input
    .split(/ (?=\/|[A-Za-z]:\\)/)
    .flatMap(part => part.split('\n'))
    .some(line => isImageFilePath(line.trim()))
}

/**
 * Join paste chunks and extract image-looking paths (shared by timeout + tests).
 */
export function extractImagePathsFromPasteChunks(chunks: string[]): {
  pastedText: string
  lines: string[]
  imagePaths: string[]
} {
  const pastedText = chunks
    .join('')
    .replace(/\[I$/, '')
    .replace(/\[O$/, '')
  const lines = pastedText
    .split(/ (?=\/|[A-Za-z]:\\)/)
    .flatMap(part => part.split('\n'))
    .filter(line => line.trim())
  const imagePaths = lines.filter(line => isImageFilePath(line))
  return { pastedText, lines, imagePaths }
}

type PasteHandlerProps = {
  onPaste?: (text: string) => void
  onInput: (input: string, key: Key) => void
  onImagePaste?: (
    base64Image: string,
    mediaType?: string,
    filename?: string,
    dimensions?: ImageDimensions,
    sourcePath?: string,
  ) => void
  /** Arm PromptInput image-paste in-flight barrier (defer Enter). */
  onImagePasteBegin?: () => void
  /** Disarm barrier; may replay deferred Enter. Always pair with begin via finally. */
  onImagePasteEnd?: () => void
}

/** Platforms where getImageFromClipboard can read the system clipboard. */
function supportsClipboardImagePaste(): boolean {
  const p = getPlatform()
  return p === 'macos' || p === 'windows'
}

export function usePasteHandler({
  onPaste,
  onInput,
  onImagePaste,
  onImagePasteBegin,
  onImagePasteEnd,
}: PasteHandlerProps): {
  wrappedOnInput: (input: string, key: Key, event: InputEvent) => void
  pasteState: {
    chunks: string[]
    timeoutId: ReturnType<typeof setTimeout> | null
  }
  isPasting: boolean
} {
  const [pasteState, setPasteState] = React.useState<{
    chunks: string[]
    timeoutId: ReturnType<typeof setTimeout> | null
  }>({ chunks: [], timeoutId: null })
  const [isPasting, setIsPasting] = React.useState(false)
  const isMountedRef = React.useRef(true)
  // Mirrors pasteState.timeoutId but updated synchronously. When paste + a
  // keystroke arrive in the same stdin chunk, both wrappedOnInput calls run
  // in the same discreteUpdates batch before React commits — the second call
  // reads stale pasteState.timeoutId (null) and takes the onInput path. If
  // that key is Enter, it submits the old input and the paste is lost.
  const pastePendingRef = React.useRef(false)
  // Sync mirror of pasteState.chunks so the 100ms timeout can arm the image
  // barrier BEFORE clearing pastePending (S-001: no gap while waiting for
  // React to run setPasteState updaters).
  const pasteChunksRef = React.useRef<string[]>([])
  // True while this path-image paste session has already called begin.
  // Prevents double-begin when early-arm (first chunk) + timeout both fire.
  const imagePasteSessionArmedRef = React.useRef(false)

  const isMacOS = React.useMemo(() => getPlatform() === 'macos', [])
  // Empty-paste → clipboard-read must run on every platform that has imagePaste
  // support (darwin + win32). Previously only macOS was gated, so Windows
  // Cmd/Ctrl+V image pastes never entered the clipboard path.
  const canClipboardImage = React.useMemo(
    () => supportsClipboardImagePaste(),
    [],
  )

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // begin/end arm PromptInput's imagePasteInFlight barrier so paste-then-
  // immediate-Enter waits for the clipboard read. Cmd+V previously never
  // armed the barrier — only the chat:imagePaste keybinding path did.
  const checkClipboardForImageImpl = React.useCallback(() => {
    if (!onImagePaste || !isMountedRef.current) return

    onImagePasteBegin?.()
    void getImageFromClipboard()
      .then(imageData => {
        if (imageData && isMountedRef.current) {
          onImagePaste(
            imageData.base64,
            imageData.mediaType,
            undefined, // no filename for clipboard images
            imageData.dimensions,
          )
        }
      })
      .catch(error => {
        if (isMountedRef.current) {
          logError(error as Error)
        }
      })
      .finally(() => {
        onImagePasteEnd?.()
        if (isMountedRef.current) {
          setIsPasting(false)
        }
      })
  }, [onImagePaste, onImagePasteBegin, onImagePasteEnd])

  // Leading-only: fire immediately on first empty-paste so the in-flight
  // barrier is armed before the user can hit Enter. Trailing would re-fire
  // after 50ms (double begin/end); coalesced trailing is unnecessary for a
  // single clipboard read.
  const checkClipboardForImage = useDebounceCallback(
    checkClipboardForImageImpl,
    CLIPBOARD_CHECK_DEBOUNCE_MS,
    { leading: true, trailing: false },
  )

  const resetPasteTimeout = React.useCallback(
    (currentTimeoutId: ReturnType<typeof setTimeout> | null) => {
      if (currentTimeoutId) {
        clearTimeout(currentTimeoutId)
      }
      return setTimeout(
        (
          setPasteState,
          onImagePaste,
          onPaste,
          setIsPasting,
          checkClipboardForImage,
          isMacOS,
          canClipboardImage,
          onImagePasteBegin,
          onImagePasteEnd,
          pastePendingRef,
          pasteChunksRef,
          imagePasteSessionArmedRef,
        ) => {
          // S-001: decide + arm from sync chunk mirror BEFORE releasing
          // pastePending. Previously pastePending was cleared first and
          // beginImagePaste only ran inside a React setState updater (async),
          // so chat:submit could slip through imagePasteInFlightRef === 0.
          const { pastedText, lines, imagePaths } =
            extractImagePathsFromPasteChunks(pasteChunksRef.current)

          if (onImagePaste && imagePaths.length > 0) {
            if (!imagePasteSessionArmedRef.current) {
              imagePasteSessionArmedRef.current = true
              onImagePasteBegin?.()
            }
          }

          pastePendingRef.current = false

          setPasteState(() => {
            if (onImagePaste && imagePaths.length > 0) {
              const isTempScreenshot =
                /\/TemporaryItems\/.*screencaptureui.*\/Screenshot/i.test(
                  pastedText,
                )

              // Barrier already armed above (or on first chunk). Do not begin again.
              void Promise.all(
                imagePaths.map(imagePath => tryReadImageFromPath(imagePath)),
              )
                .then(results => {
                  const validImages = results.filter(
                    (r): r is NonNullable<typeof r> => r !== null,
                  )

                  if (validImages.length > 0) {
                    for (const imageData of validImages) {
                      const filename = basename(imageData.path)
                      onImagePaste(
                        imageData.base64,
                        imageData.mediaType,
                        filename,
                        imageData.dimensions,
                        imageData.path,
                      )
                    }
                    const nonImageLines = lines.filter(
                      line => !isImageFilePath(line),
                    )
                    if (nonImageLines.length > 0 && onPaste) {
                      onPaste(nonImageLines.join('\n'))
                    }
                    setIsPasting(false)
                  } else if (isTempScreenshot && isMacOS) {
                    // Clipboard path arms its own barrier (counter +1).
                    checkClipboardForImage()
                  } else {
                    if (onPaste) {
                      onPaste(pastedText)
                    }
                    setIsPasting(false)
                  }
                })
                .catch(error => {
                  if (isMountedRef.current) {
                    logError(error as Error)
                  }
                  setIsPasting(false)
                })
                .finally(() => {
                  imagePasteSessionArmedRef.current = false
                  onImagePasteEnd?.()
                })
              pasteChunksRef.current = []
              return { chunks: [], timeoutId: null }
            }

            // Early-armed but final text has no image paths — disarm.
            if (imagePasteSessionArmedRef.current) {
              imagePasteSessionArmedRef.current = false
              onImagePasteEnd?.()
            }

            // Empty paste → clipboard image (macOS + Windows).
            if (canClipboardImage && onImagePaste && pastedText.length === 0) {
              checkClipboardForImage()
              pasteChunksRef.current = []
              return { chunks: [], timeoutId: null }
            }

            if (onPaste) {
              onPaste(pastedText)
            }
            setIsPasting(false)
            pasteChunksRef.current = []
            return { chunks: [], timeoutId: null }
          })
        },
        PASTE_COMPLETION_TIMEOUT_MS,
        setPasteState,
        onImagePaste,
        onPaste,
        setIsPasting,
        checkClipboardForImage,
        isMacOS,
        canClipboardImage,
        onImagePasteBegin,
        onImagePasteEnd,
        pastePendingRef,
        pasteChunksRef,
        imagePasteSessionArmedRef,
      )
    },
    [
      checkClipboardForImage,
      isMacOS,
      canClipboardImage,
      onImagePaste,
      onImagePasteBegin,
      onImagePasteEnd,
      onPaste,
    ],
  )

  // Paste detection is now done via the InputEvent's keypress.isPasted flag,
  // which is set by the keypress parser when it detects bracketed paste mode.
  // This avoids the race condition caused by having multiple listeners on stdin.
  // Previously, we had a stdin.on('data') listener here which competed with
  // the 'readable' listener in App.tsx, causing dropped characters.

  const wrappedOnInput = (input: string, key: Key, event: InputEvent): void => {
    // Detect paste from the parsed keypress event.
    // The keypress parser sets isPasted=true for content within bracketed paste.
    const isFromPaste = event.keypress.isPasted

    // If this is pasted content, set isPasting state for UI feedback
    if (isFromPaste) {
      setIsPasting(true)
    }

    // Handle large pastes (>PASTE_THRESHOLD chars)
    // Usually we get one or two input characters at a time. If we
    // get more than the threshold, the user has probably pasted.
    // Unfortunately node batches long pastes, so it's possible
    // that we would see e.g. 1024 characters and then just a few
    // more in the next frame that belong with the original paste.
    // This batching number is not consistent.

    // Handle potential image filenames (even if they're shorter than paste threshold)
    // When dragging multiple images, they may come as newline-separated or
    // space-separated paths. Split on spaces preceding absolute paths:
    // - Unix: ` /` - Windows: ` C:\` etc.
    const hasImageFilePath = chunkLooksLikeImagePathPaste(input)

    // Handle empty paste (clipboard image on macOS / Windows)
    // When the user pastes an image with Cmd+V, the terminal sends an empty
    // bracketed paste sequence. The keypress parser emits this as isPasted=true
    // with empty input. checkClipboardForImageImpl arms the in-flight barrier.
    if (
      isFromPaste &&
      input.length === 0 &&
      canClipboardImage &&
      onImagePaste
    ) {
      checkClipboardForImage()
      // Reset isPasting since there's no text content to process
      setIsPasting(false)
      return
    }

    // Check if we should handle as paste (from bracketed paste, large input, or continuation)
    const shouldHandleAsPaste =
      onPaste &&
      (input.length > PASTE_THRESHOLD ||
        pastePendingRef.current ||
        hasImageFilePath ||
        isFromPaste)

    if (shouldHandleAsPaste) {
      pastePendingRef.current = true
      // S-001: arm image-paste barrier on first image-path chunk — do not wait
      // for the 100ms aggregation timeout. chat:submit only checks
      // imagePasteInFlightRef; pastePending only swallows Enter via onInput.
      if (hasImageFilePath && onImagePaste && !imagePasteSessionArmedRef.current) {
        imagePasteSessionArmedRef.current = true
        onImagePasteBegin?.()
      }
      setPasteState(({ chunks, timeoutId }) => {
        const nextChunks = [...chunks, input]
        pasteChunksRef.current = nextChunks
        return {
          chunks: nextChunks,
          timeoutId: resetPasteTimeout(timeoutId),
        }
      })
      return
    }
    onInput(input, key)
    if (input.length > 10) {
      // Ensure that setIsPasting is turned off on any other multicharacter
      // input, because the stdin buffer may chunk at arbitrary points and split
      // the closing escape sequence if the input length is too long for the
      // stdin buffer.
      setIsPasting(false)
    }
  }

  return {
    wrappedOnInput,
    pasteState,
    isPasting,
  }
}
