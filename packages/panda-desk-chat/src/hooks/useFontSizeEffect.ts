// Input: settingsStore.fontSize
// Output: applies `--pd-font-size-base` CSS variable to <html> reactively
// Pos: Hook layer — called once in App root; downstream utility classes can reference var(--pd-font-size-base)
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export function useFontSizeEffect(): void {
  const fontSize = useSettingsStore((s) => s.fontSize);

  useEffect(() => {
    const size = Math.max(10, Math.min(22, fontSize || 14));
    const root = document.documentElement;
    root.style.setProperty('--pd-font-size-base', `${size}px`);
    root.style.fontSize = `${size}px`;
  }, [fontSize]);
}
