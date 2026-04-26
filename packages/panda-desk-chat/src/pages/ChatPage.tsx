// Input: tabStore.activeTabId（cc-haha 真理源）+ chatStore (per-session state) + sessionStore (sessions list)
// Output: 路由入口 — 根据 activeTabId/hasMessages/isStreaming 切换 EmptySession / ActiveSession
// Pos: App 主内容路由
//
// cc-haha 1:1 对标重写（v5 — 修 activeId 来源 bug）:
//  - cc-haha ContentRouter 用 tabStore.activeTabId 决定渲染哪个 page
//  - 之前 panda ChatPage 用 sessionStore.activeId（PdSidebar 点击不设此字段）→ 永远 EmptySession bug
//  - 现改：activeTabId = useTabStore.activeTabId（PdSidebar.openTab 已设此字段）
//  - hasActiveSession 改为：tabStore 存在该 tab 即可（不依赖 sessionStore.sessions 包含）
//  - hasMessages: 0 也仍渲染 ActiveSession（cc-haha 行为：哪怕历史还在拉，先显示 header + skeleton）
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import React from 'react';
import { useChatStore } from '../stores/chatStore';
import { useSessionStore } from '../stores/sessionStore';
import { useTabStore } from '../stores/tabStore';
import { EmptySession } from './EmptySession';
import { ActiveSession } from './ActiveSession';

export interface ChatPageProps {
  className?: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({ className }) => {
  // cc-haha L8-9: ContentRouter 用 tabStore.activeTabId 作真理源
  const activeTabId = useTabStore((s) => s.activeTabId);
  const sessions = useSessionStore((s) => s.sessions);

  const activeSession = useChatStore((s) =>
    activeTabId ? s.sessions.get(activeTabId) ?? null : null,
  );

  // 优先从 sessionStore 取 meta；如还未加载则用最小 stub（id 即可）
  const activeMeta =
    (activeTabId ? sessions.find((s: any) => s.id === activeTabId) : null) ??
    (activeTabId ? { id: activeTabId, name: '', cwd: '', createdAt: '', lastActive: '', messageCount: 0 } : null);

  // cc-haha 行为：tab 一旦 active 就渲染 ActiveSession（即使消息还在拉），
  // ActiveSession 内部 isEmpty 分支再决定显示 hero 还是消息流。
  const showConversation = !!activeTabId && !!activeMeta;

  return (
    <div
      className={`relative flex flex-1 flex-col overflow-hidden ${className ?? ''}`}
      style={{
        background: 'var(--pd-color-bg)',
        height: '100%',
        minHeight: 0,
      }}
    >
      {showConversation && activeTabId && activeSession ? (
        <ActiveSession activeId={activeTabId} session={activeSession} />
      ) : (
        <EmptySession activeId={null} />
      )}
    </div>
  );
};

export default ChatPage;
