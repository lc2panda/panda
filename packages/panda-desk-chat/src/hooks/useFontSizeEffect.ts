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
    // cc-haha 1:1：root 用浏览器默认 16px，不主动覆写。
    // 仅暴露 --pd-font-size-base 变量供 panda 自定义组件可选读取（cc-haha 不用）。
    // 关键：不再 root.style.fontSize = …，避免 px-3/py-2 等 Tailwind utility (rem 单位) 偏移。
    const size = Math.max(10, Math.min(22, fontSize || 16));
    document.documentElement.style.setProperty('--pd-font-size-base', `${size}px`);
    document.documentElement.style.removeProperty('font-size');
  }, [fontSize]);
}
