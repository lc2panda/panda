// Panda Code: assistant install wizard stub.
// The original upstream install wizard sets up the Anthropic KAIROS daemon
// (`~/.config/claude/daemon.json`) via a multi-step Ink wizard. Panda Code
// does not ship that wizard — `/assistant` in Panda Code only toggles the
// in-process assistant mode via `src/commands/assistant/index.ts`.
//
// This file remains as the import target for `dialogLaunchers.tsx`
// `launchAssistantInstallWizard()`, which is called from `main.tsx` when the
// CLI is invoked with `claude assistant` and zero bridge sessions are found.
// Rather than rendering an empty Ink component (the previous stub behavior,
// which caused the CLI to silently exit), we throw a clear error that
// `main.tsx` surfaces via `exitWithError`.
import type React from 'react'

export const NewInstallWizard: React.FC<{
  defaultDir: string
  onInstalled: (dir: string) => void
  onCancel: () => void
  onError: (message: string) => void
}> = (() => null)

export const computeDefaultInstallDir: () => Promise<string> = () => {
  throw new Error(
    'Panda Code does not ship the KAIROS install wizard. Use `/assistant` ' +
      'inside the REPL to toggle assistant mode instead.',
  )
}
