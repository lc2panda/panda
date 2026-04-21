// Input: ShortcutActions callback map
// Output: registers/cleans global keydown listener
// Pos: Hook layer — consumed by App root for Cmd+B / Cmd+\ / Cmd+; / Cmd+N / Cmd+,

import { useEffect } from 'react';

export interface ShortcutActions {
  toggleSidebar: () => void;
  toggleInspector: () => void;
  toggleSideChat: () => void;
  newChat: () => void;
  openSettings: () => void;
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
          e.preventDefault();
          actions.newChat();
          break;
        case ',':
          e.preventDefault();
          actions.openSettings();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actions]);
}
