// Input: ShortcutActions callback map
// Output: registers/cleans global keydown listener
// Pos: Hook layer — consumed by App root
//
// cc-haha 100% 对标重写（v3）：
//  - 删除：toggleInspector / toggleSideChat / toggleCommandPalette / toggleSessionSwitcher / newChat / newWindow
//  - 保留：toggleSidebar (Cmd+B) / openSettings (Cmd+,)

import { useEffect } from 'react';

export interface ShortcutActions {
  toggleSidebar: () => void;
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
