// Input: tabStore.activeTabId + tab.type
// Output: 内容路由 — EmptySession / ChatPage / ScheduledPage / SettingsPage
// Pos: Layout layer — main 区下半，对标 cc-haha desktop/src/components/layout/ContentRouter.tsx
//
// Source: cc-haha desktop/src/components/layout/ContentRouter.tsx L1-27（27 行）
//   panda 适配：
//     - cc-haha 4 个 page 文件 → panda 已有 ChatPage / ScheduledPage / SettingsPage / EmptySession
//     - cc-haha ActiveSession 处理 session tab；panda ChatPage 已含 ActiveSession + EmptySession 内部分支
//     - import 路径替换 ../../pages/X → ../../pages/X（同名）
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { lazy, Suspense } from 'react';
import { useTabStore } from '../../stores/tabStore';
import { EmptySession } from '../../pages/EmptySession';
import { ChatPage } from '../../pages/ChatPage';

// S8: Settings 11-tab 全套 1:1 复刻 cc-haha → 切到新 PdSettings；
//     旧 SettingsPage 保留为兼容入口（不再使用），等冗余治理统一删除。
const SettingsPage = lazy(() =>
  import('../../pages/settings/PdSettings').then((m) => ({ default: m.PdSettings })),
);
const ScheduledPage = lazy(() => import('../../pages/ScheduledPage').then((m) => ({ default: m.ScheduledPage })));
// Comdr 指令: 超级助手页面（懒加载，与 settings/scheduled 同模式）
const PdSuperAssistant = lazy(() =>
  import('../../pages/PdSuperAssistant').then((m) => ({ default: m.PdSuperAssistant })),
);
// Comdr 指令: panda 独有能力补齐 — Group 1（4 个新 page 懒加载）
const PdConnectors = lazy(() =>
  import('../../pages/PdConnectors').then((m) => ({ default: m.PdConnectors })),
);
const PdPatternsScars = lazy(() =>
  import('../../pages/PdPatternsScars').then((m) => ({ default: m.PdPatternsScars })),
);
const PdMemoryBank = lazy(() =>
  import('../../pages/PdMemoryBank').then((m) => ({ default: m.PdMemoryBank })),
);
const PdAgentTeams = lazy(() =>
  import('../../pages/PdAgentTeams').then((m) => ({ default: m.PdAgentTeams })),
);
// Comdr 指令: 学习助手 + Output Styles 重组 — 学习助手页面懒加载
const PdLearningAssistant = lazy(() =>
  import('../../pages/PdLearningAssistant').then((m) => ({ default: m.PdLearningAssistant })),
);
// Comdr 指令 cc-haha 路线 A 调整：
//   - 会话控制（'session-controls' tab type）已下线 — Composer 底部按钮组承载
//   - 工具调试（'tool-inspection' tab type）已迁入 Settings sub-tab
//   保留 PdSessionControls / PdToolInspection 文件本身（前者作完整面板备用，后者
//   被 PdSettings 直接 import 复用）。本文件不再 lazy import 它们；下方 type 校验
//   会把已打开的历史 tab 自动失效并 closeTab。

const HISTORICAL_DEAD_TAB_TYPES = new Set(['session-controls', 'tool-inspection']);

export function PdContentRouter() {
  const activeTabId = useTabStore((s) => s.activeTabId);
  const activeTabType = useTabStore((s) => s.tabs.find((t) => t.sessionId === s.activeTabId)?.type);

  // Comdr 指令 cc-haha 路线 A 调整：历史已打开的 'session-controls' / 'tool-inspection' tab
  // 在本次升级后已不再支持，主动 closeTab 让用户回到 EmptySession（不报错、不黑屏）。
  if (activeTabType && HISTORICAL_DEAD_TAB_TYPES.has(activeTabType) && activeTabId) {
    useTabStore.getState().closeTab(activeTabId);
    return <EmptySession activeId={null} />;
  }

  // No tabs open — show empty session
  if (!activeTabId || !activeTabType) {
    return <EmptySession activeId={null} />;
  }

  // Special tabs
  if (activeTabType === 'settings') {
    return (
      <Suspense fallback={<div style={{ padding: 16, opacity: 0.5 }}>Loading...</div>}>
        <SettingsPage />
      </Suspense>
    );
  }

  if (activeTabType === 'scheduled') {
    return (
      <Suspense fallback={<div style={{ padding: 16, opacity: 0.5 }}>Loading...</div>}>
        <ScheduledPage />
      </Suspense>
    );
  }

  // Comdr 指令: 超级助手 tab 路由
  if (activeTabType === 'super-assistant') {
    return (
      <Suspense fallback={<div style={{ padding: 16, opacity: 0.5 }}>Loading...</div>}>
        <PdSuperAssistant />
      </Suspense>
    );
  }

  // Comdr 指令: panda 独有能力补齐 — Group 1（4 个新 page 路由）
  if (activeTabType === 'connectors') {
    return (
      <Suspense fallback={<div style={{ padding: 16, opacity: 0.5 }}>Loading...</div>}>
        <PdConnectors />
      </Suspense>
    );
  }

  if (activeTabType === 'patterns') {
    return (
      <Suspense fallback={<div style={{ padding: 16, opacity: 0.5 }}>Loading...</div>}>
        <PdPatternsScars />
      </Suspense>
    );
  }

  if (activeTabType === 'memory-bank') {
    return (
      <Suspense fallback={<div style={{ padding: 16, opacity: 0.5 }}>Loading...</div>}>
        <PdMemoryBank />
      </Suspense>
    );
  }

  if (activeTabType === 'agent-teams') {
    return (
      <Suspense fallback={<div style={{ padding: 16, opacity: 0.5 }}>Loading...</div>}>
        <PdAgentTeams />
      </Suspense>
    );
  }

  // Comdr 指令: 学习助手 + Output Styles 重组 — 学习助手 tab 路由
  if (activeTabType === 'learning') {
    return (
      <Suspense fallback={<div style={{ padding: 16, opacity: 0.5 }}>Loading...</div>}>
        <PdLearningAssistant />
      </Suspense>
    );
  }

  // Comdr 指令 cc-haha 路线 A 调整：'session-controls' / 'tool-inspection' 路由已删除
  //   Composer 底部按钮组承载 fork/branch/resume/stop；工具调试纳入 Settings sub-tab。

  // Session tab — ChatPage handles both regular and member sessions
  return <ChatPage />;
}

// cc-haha L1-27 — 27 行。
