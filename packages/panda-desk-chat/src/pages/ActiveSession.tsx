// Input:  activeId（必填）+ session（PerSessionState 切片）— ChatPage 在 hasMessages || isStreaming 时挂载
// Output: cc-haha ActiveSession 1:1 — 顶部 status bar（member 模式，panda 永远不出）/ Hero（empty 分支）/ 显式 onSend 发送 /
//         session header（非 member）+ MessageList + SessionTaskBar + TeamStatusBar + Composer + ComputerUsePermissionModal
// Pos:    Page layer — ChatPage 路由分支：activeSession.messages.length > 0 || isStreaming 时挂载
//
// Source 1:1: cc-haha desktop/src/pages/ActiveSession.tsx (220 行)
//   - 容器 / status bar / hero / session header / Composer 全部 className 1:1（var(--color-*) → var(--pd-color-*)）
//   - cc-haha useTeamStore.getMemberBySessionId / activeTeam → panda 无 'team_member' tab type，isMemberSession 永远 false
//   - cc-haha useCLITaskStore.fetchSessionTasks/sessionId/hasIncompleteTasks → panda 已有 cliTaskStore stub（fetchSessionTasks
//     仅切 sessionId + 清空，不发 IPC），保留 1:1 调用面
//   - cc-haha session.workDirExists → panda SessionMeta 无该字段，永远 truthy（不渲染 warning）
//   - cc-haha session.title/modifiedAt/messageCount/workDir → panda SessionMeta 用 .name / .lastActive / .messageCount / .cwd
//   - cc-haha pendingComputerUsePermission → panda chatStore PerSessionState 无 ComputerUse 字段，永远 null（仍渲染组件 stub）
//   - cc-haha useTabStore.openTab(sessionId,'team-lead','session') 回主控 → panda 同字段
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import React, { useCallback, useEffect, useMemo } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useTabStore } from '../stores/tabStore';
import { useSessionStore } from '../stores/sessionStore';
import { useChatStore, type PerSessionState } from '../stores/chatStore';
import { useCLITaskStore } from '../stores/cliTaskStore';
import { useTeamStore } from '../stores/teamStore';
import { PdMessageList } from '../components/chat/PdMessageList';
import { PdComposer } from '../components/chat/PdComposer';
import { PdComputerUsePermissionModal } from '../components/chat/PdComputerUsePermissionModal';
import { PdTeamStatusBar } from '../components/teams/PdTeamStatusBar';
import { PdSessionTaskBar } from '../components/chat/PdSessionTaskBar';

// cc-haha L14: TASK_POLL_INTERVAL_MS
const TASK_POLL_INTERVAL_MS = 1000;

export interface ActiveSessionProps {
  /** 当前活跃会话 id（保证非空：上层只有在有 session 时才渲染）。 */
  activeId: string;
  /** 当前会话的完整状态切片。 */
  session: PerSessionState;
}

export const ActiveSession: React.FC<ActiveSessionProps> = ({ activeId, session: chatSession }) => {
  const { t } = useI18n();

  // cc-haha L17: activeTabId — panda 直接拿 prop activeId，避免 store 读两次
  const activeTabId = activeId;

  const handleSendMessage = useCallback(
    (text: string, attachments?: Array<{ mediaType: string; data: string }>) => {
      useChatStore.getState().sendMessage(activeTabId, text, attachments);
    },
    [activeTabId],
  );

  // cc-haha L18: sessions（list）
  const sessions = useSessionStore((s) => s.sessions);

  // cc-haha L19: connectToSession
  const connectToSession = useChatStore((s) => s.connectToSession);

  // cc-haha L20: sessionState — panda 已通过 prop 拿到 chatSession，仍保留 store 读取以驱动重渲
  const sessionState = useChatStore((s) => (activeTabId ? s.sessions.get(activeTabId) ?? null : null));

  // cc-haha L21: pendingComputerUsePermission — panda chatStore 无 ComputerUse 字段，永远 null
  const pendingComputerUsePermission = null as { request: null } | null;

  // cc-haha L22: fetchSessionTasks
  const fetchSessionTasks = useCLITaskStore((s) => s.fetchSessionTasks);
  // cc-haha L23: trackedTaskSessionId
  const trackedTaskSessionId = useCLITaskStore((s) => s.sessionId);
  // cc-haha L24: hasIncompleteTasks
  const hasIncompleteTasks = useCLITaskStore((s) => s.tasks.some((task) => task.status !== 'completed'));

  // cc-haha L25: chatState — 优先 prop（chatSession 是 ChatPage 已读到的切片），fallback store
  const chatState = sessionState?.chatState ?? chatSession.chatState ?? 'idle';
  // cc-haha L26: tokenUsage — panda 字段是 input/output（不是 cc-haha input_tokens/output_tokens）
  const tokenUsage = sessionState?.tokenUsage ?? chatSession.tokenUsage ?? { input: 0, output: 0 };

  // cc-haha L28: session（list 中找 SessionMeta）
  const session = sessions.find((s) => s.id === activeTabId);

  // cc-haha L29-L31: memberInfo / activeTeam / isMemberSession
  // panda 无 'team_member' tab type，getMemberBySessionId 总返回 null → isMemberSession 永远 false
  const memberInfo = useTeamStore((s) => (activeTabId ? s.getMemberBySessionId(activeTabId) : null));
  const activeTeam = useTeamStore((s) => s.activeTeam);
  const isMemberSession = !!memberInfo;

  // cc-haha L33-L37: connectToSession 副作用（非 member）
  useEffect(() => {
    if (activeTabId && !isMemberSession) {
      connectToSession(activeTabId);
    }
  }, [activeTabId, isMemberSession, connectToSession]);

  // cc-haha L39-L62: shouldPollTasks 副作用 — 只在 chatState !== 'idle' 或当前 tracked + 有进行中任务 时轮询
  useEffect(() => {
    if (!activeTabId || isMemberSession) return;

    const shouldPollTasks =
      chatState !== 'idle' || (trackedTaskSessionId === activeTabId && hasIncompleteTasks);

    if (!shouldPollTasks) return;

    void fetchSessionTasks(activeTabId);

    const timer = setInterval(() => {
      void fetchSessionTasks(activeTabId);
    }, TASK_POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [activeTabId, isMemberSession, chatState, trackedTaskSessionId, hasIncompleteTasks, fetchSessionTasks]);

  // cc-haha L65-L67: messages / streamingText / isEmpty
  const messages = sessionState?.messages ?? chatSession.messages ?? [];
  const streamingText = sessionState?.streamingText ?? chatSession.streamingText ?? '';
  const isEmpty = messages.length === 0 && !streamingText;

  // cc-haha L69-L70: isActive / totalTokens — panda 字段名 input/output
  const isActive = chatState !== 'idle';
  const totalTokens = tokenUsage.input + tokenUsage.output;

  // cc-haha L72-L79: lastUpdated — panda SessionMeta.lastActive 替代 cc-haha session.modifiedAt
  const lastUpdated = useMemo(() => {
    if (!session?.lastActive) return '';
    const diff = Date.now() - new Date(session.lastActive).getTime();
    if (diff < 60000) return t('session.timeJustNow');
    if (diff < 3600000) return t('session.timeMinutes', { n: Math.floor(diff / 60000) });
    if (diff < 86400000) return t('session.timeHours', { n: Math.floor(diff / 3600000) });
    return t('session.timeDays', { n: Math.floor(diff / 86400000) });
  }, [session?.lastActive, t]);

  // cc-haha L81: !activeTabId 短路（panda 上层 ChatPage 已保 activeId 非空）
  if (!activeTabId) return null;

  return (
    // cc-haha L83-L84: 外壳容器
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[var(--pd-color-bg)] text-[var(--pd-color-text-primary)]">
      {/* cc-haha L85-L128: isMemberSession 顶部 status bar（panda 永远不渲染） */}
      {isMemberSession && (
        <div className="shrink-0 border-b border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container)]">
          <div className="mx-auto max-w-[860px] flex items-center justify-between gap-4 px-8 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                {memberInfo?.status === 'running' && (
                  <span className="flex h-2 w-2 rounded-full bg-[var(--pd-color-warning)] animate-pulse-dot" />
                )}
                {memberInfo?.status === 'completed' && (
                  <span
                    className="material-symbols-outlined text-[14px] text-[var(--pd-color-success)]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                )}
                <span className="material-symbols-outlined text-[14px] text-[var(--pd-color-text-tertiary)]">smart_toy</span>
                <span className="text-sm font-semibold text-[var(--pd-color-text-primary)]">{memberInfo?.role}</span>
                {activeTeam && (
                  <span className="text-[10px] text-[var(--pd-color-text-tertiary)]">@ {activeTeam.name}</span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-[var(--pd-color-text-tertiary)]">{t('teams.memberSessionHint')}</p>
            </div>
            <button
              onClick={() => {
                if (activeTeam?.leadSessionId) {
                  useTabStore.getState().openTab(activeTeam.leadSessionId, t('teams.leader'), 'session');
                }
              }}
              disabled={!activeTeam?.leadSessionId}
              className="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--pd-color-text-secondary)] hover:text-[var(--pd-color-text-primary)] transition-colors disabled:opacity-50 disabled:hover:text-[var(--pd-color-text-secondary)]"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              {t('teams.backToLeader')}
            </button>
          </div>
        </div>
      )}

      {/* cc-haha L130-L203: 主体 — isEmpty hero 或 session header + MessageList */}
      {isEmpty ? (
        // cc-haha L131-L154: empty hero — 与 EmptySession 同款
        <div className="flex flex-1 flex-col items-center justify-center p-8 pb-32">
          <div className="flex max-w-md flex-col items-center text-center">
            {isMemberSession ? (
              <>
                {/* cc-haha L135-L141: member empty hero */}
                <span className="material-symbols-outlined text-[48px] mb-4 text-[var(--pd-color-text-tertiary)]">
                  smart_toy
                </span>
                <p className="text-[var(--pd-color-text-secondary)]">
                  {memberInfo?.status === 'running'
                    ? `${memberInfo.role} ${t('teams.working')}`
                    : t('teams.noMessages')}
                </p>
              </>
            ) : (
              <>
                {/* Comdr 指令: 去掉熊猫 emoji 图标，仅保留品牌文字 (cc-haha L143-L151 hero) */}
                <h1
                  className="mb-2 text-3xl font-extrabold tracking-tight text-[var(--pd-color-text-primary)]"
                  style={{ fontFamily: 'var(--pd-font-headline)' }}
                >
                  {t('empty.title')}
                </h1>
                <p
                  className="mx-auto max-w-xs text-[var(--pd-color-text-secondary)]"
                  style={{ fontFamily: 'var(--pd-font-body)' }}
                >
                  {t('empty.subtitle')}
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* cc-haha L157-L199: session header（仅非 member） */}
          {!isMemberSession && (
            <div className="mx-auto flex w-full max-w-[860px] items-center border-b border-[var(--pd-color-outline-variant)]/10 px-8 py-3">
              <div className="flex-1">
                {/* cc-haha L160-L162: title — panda SessionMeta.name 替代 cc-haha session.title */}
                <h1
                  className="text-lg font-bold leading-tight text-[var(--pd-color-text-primary)]"
                  style={{ fontFamily: 'var(--pd-font-headline)' }}
                >
                  {session?.name || t('session.untitled')}
                </h1>
                {/* cc-haha L163-L188: 元数据行 */}
                <div className="flex items-center gap-2 text-[10px] text-[var(--pd-color-outline)] font-medium mt-1">
                  {isActive && (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--pd-color-success)] animate-pulse-dot" />
                      {t('session.active')}
                    </span>
                  )}
                  {totalTokens > 0 && (
                    <>
                      <span className="text-[var(--pd-color-outline)]">·</span>
                      <span>{totalTokens.toLocaleString()} t</span>
                    </>
                  )}
                  {lastUpdated && (
                    <>
                      <span className="text-[var(--pd-color-outline)]">·</span>
                      <span>{t('session.lastUpdated', { time: lastUpdated })}</span>
                    </>
                  )}
                  {session?.messageCount !== undefined && session.messageCount > 0 && (
                    <>
                      <span className="text-[var(--pd-color-outline)]">·</span>
                      <span>{t('session.messages', { count: session.messageCount })}</span>
                    </>
                  )}
                </div>
                {/* cc-haha L189-L196: workDirExists=false 警告（panda SessionMeta 无该字段，永远不渲染） */}
                {/* panda-only: workDirExists 字段缺失 → 永远 truthy，warning 不出 */}
              </div>
            </div>
          )}

          {/* cc-haha L201: MessageList */}
          <PdMessageList
            messages={messages}
            isStreaming={isActive}
            streamingText={streamingText}
            sessionId={activeTabId}
          />
        </>
      )}

      {/* cc-haha L205: SessionTaskBar（仅非 member） */}
      {!isMemberSession && <PdSessionTaskBar />}

      {/* cc-haha L207: TeamStatusBar — panda 永不显示（无 team），保留组件占位 */}
      <PdTeamStatusBar />

      {/* cc-haha L209: ChatInput variant='hero' or 'default' */}
      <PdComposer
        sessionId={activeTabId}
        isStreaming={isActive}
        variant={isEmpty && !isMemberSession ? 'hero' : 'default'}
        onSend={handleSendMessage}
      />

      {/* cc-haha L211-L216: ComputerUsePermissionModal（仅非 member） */}
      {!isMemberSession && activeTabId ? (
        <PdComputerUsePermissionModal
          sessionId={activeTabId}
          request={pendingComputerUsePermission?.request ?? null}
        />
      ) : null}
    </div>
  );
};

export default ActiveSession;

// cc-haha L1-L220 — 220 行
