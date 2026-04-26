// Input: title (command name or label), children (terminal body), optional toolbar/className
// Output: macOS-style terminal window decoration — traffic lights + title + dark monospace body
// Pos:    Chat layer — reusable wrapper for Bash commands, tool results and code viewers
//
// Source 1:1: cc-haha desktop/src/components/chat/TerminalChrome.tsx (L1-36)
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。
import type { ReactNode } from 'react'

export interface PdTerminalChromeProps {
  title?: string
  children: ReactNode
  /** Optional right-aligned toolbar slot (panda extension — Copy command, etc.). */
  toolbar?: ReactNode
  className?: string
}

/**
 * macOS-style terminal window decoration with traffic light buttons.
 * Reusable wrapper for Bash commands, tool results, and code viewers.
 */
export function PdTerminalChrome({ title, children, toolbar, className = '' }: PdTerminalChromeProps) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-[var(--pd-color-outline-variant)]/20 bg-[var(--pd-color-surface-dim)] ${className}`}>
      {/* Title bar with traffic lights */}
      <div className="flex items-center gap-2 border-b border-[var(--pd-color-terminal-border)] bg-[var(--pd-color-terminal-header)] px-3 py-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--pd-color-terminal-danger)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--pd-color-terminal-warning)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--pd-color-terminal-accent)]" />
        </div>
        {title && (
          <span className="ml-2 truncate font-[var(--pd-font-mono)] text-[10px] text-[var(--pd-color-terminal-muted)]">
            {title}
          </span>
        )}
        {toolbar && <div className="ml-auto shrink-0">{toolbar}</div>}
      </div>
      {/* Content */}
      <div className="bg-[var(--pd-color-terminal-bg)] text-[var(--pd-color-terminal-fg)]">
        {children}
      </div>
    </div>
  )
}

PdTerminalChrome.displayName = 'PdTerminalChrome'
