# src/tray — panda-on-desk 系统托盘

> Input: Electron app/nativeTheme + ctx (window 控制 / DND / quit)
> Output: 6 项 Tray 菜单（Show / Hide / DND / Settings / About / Quit）+ 主题感知图标
> Pos: W3 收尾交付（[NEW-FILE:#20260419-W3-01]）— 替代上游 menu.ts createTray 的多 agent 路径

## 文件清单

| 文件 | 职责 |
|------|------|
| `index.ts` | 托盘构造器 `initPandaTray(ctx)` → `{ tray, rebuild, destroy }` |

## 接入点

`src/main.ts` `app.whenReady` 内调用 `initPandaTray({...})`，并在 `before-quit` 内调 `destroy()`。

> 一旦本目录新增/删除文件，请同步更新本 README — 就像重新标记领地一样。
