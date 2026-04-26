// Input: nothing
// Output: <AppShell /> — cc-haha 1:1 single-component shell + locale key 兜底
// Pos: 应用根组件，对标 cc-haha desktop/src/App.tsx L1-5
//
// Source: cc-haha desktop/src/App.tsx L1-5（5 行）
import { useEffect, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { getLocale } from './i18n';

export function App() {
  // Comdr 指令 (任务 3): 双保险兜底 — i18n.setLocale 已触发 window.location.reload()。
  //   万一 Electron HMR / 缓存导致 reload 不真正生效，订阅 'panda-locale-change'
  //   事件时切 key → React 整树 unmount + remount，所有 t() 直调组件（sidebar/composer/...
  //   消息流）都会重新调用 t() 拿到新值，等价于"全刷"效果。
  const [localeKey, setLocaleKey] = useState<string>(getLocale());
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === 'string') setLocaleKey(detail);
    };
    window.addEventListener('panda-locale-change', handler);
    return () => window.removeEventListener('panda-locale-change', handler);
  }, []);

  return <AppShell key={localeKey} />;
}
