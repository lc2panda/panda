// Input:  DOM root element (#root)
// Output: mounted React application + IPC bridge wired
// Pos:    application entry — cc-haha 1:1 with Electron bridge bootstrap
//
// Source: cc-haha desktop/src/main.tsx L1-13；保留 panda 必要 IPC bridge bootstrap。
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { setupAllBridges } from './stores';
// 单一 CSS 入口：global.css 内部用 @import 串联 tailwindcss + fonts + tokens + highlight + matrix-theme。
// 不要在 main.tsx 重复 import 子 CSS — Tailwind 4 + Vite 双重 import 会破坏 utility class context，
// 导致 bg-[var(--pd-color-X)] 等任意值类无法被处理（cc-haha 1:1 复刻视觉失效根因）。
import './styles/global.css';

setupAllBridges();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
