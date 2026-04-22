// Input: ShortcutActions callback map
// Output: registers/cleans global keydown listener
// Pos: Hook layer — consumed by App root for Cmd+B / Cmd+\ / Cmd+; / Cmd+N / Cmd+Shift+N / Cmd+, / Cmd+K / Cmd+P

import { useEffect } from 'react';

export interface ShortcutActions {
  toggleSidebar: () => void;
  toggleInspector: () => void;
  toggleSideChat: () => void;
  newChat: () => void;
  newWindow: () => void;
  openSettings: () => void;
  toggleCommandPalette: () => void;
  toggleSessionSwitcher: () => void;
}

export function useGlobalShortcuts(actions: ShortcutActions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      switch (e.key) {
        case 'b':
          e.preventDefault();
          actions.toggleSidebar();
          break;
        case '\\':
          e.preventDefault();
          actions.toggleInspector();
          break;
        case ';':
          e.preventDefault();
          actions.toggleSideChat();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          if (e.shiftKey) {
            actions.newWindow();
          } else {
            actions.newChat();
          }
          break;
        case ',':
          e.preventDefault();
          actions.openSettings();
          break;
        case 'k':
          e.preventDefault();
          actions.toggleCommandPalette();
          break;
        case 'p':
          e.preventDefault();
          actions.toggleSessionSwitcher();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actions]);
}
