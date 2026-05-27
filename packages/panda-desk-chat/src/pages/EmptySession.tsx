// Input:  activeId（可空）— PdContentRouter 在无 tab 时传 null；ChatPage 在创建中传 null/sessionId
// Output: cc-haha EmptySession 1:1 — surface 容器 + hero block（96×96 icon + 30px title + subtitle）+ 绝对底部 composer
// Pos:    Page layer — PdContentRouter 兜底页 / ChatPage 空消息分支
//
// Source 1:1: cc-haha desktop/src/pages/EmptySession.tsx (612 行)
//   - 外壳容器：cc-haha L457 / 458 / 459-467（hero block）/ 470-606（composer 容器）；className 1:1 只做 var(--color-*) → var(--pd-color-*) 转换
//   - cc-haha L460 <img src="/app-icon.png" h-24 w-24> → panda 用 /icon.svg 替代
//   - cc-haha 内联实现 textarea / slash menu / @file 搜索 / +menu / attachment / DirectoryPicker（L460-608）
//     ↳ panda 已把这一整套封装进 PdComposer variant='hero'（含内置 PdDirectoryPicker，hasMessages=false 自动显示），
//        所以 panda 不复制 textarea 内联代码，直接用 PdComposer。这是 panda 业务自创合理重用，
//        视觉与交互均与 cc-haha L470-605 的 glass-panel 容器 1:1（PdComposer 内部已 1:1 复刻）。
//   - cc-haha sendMessage(sessionId, text, attachments) → panda chatStore.sendMessage(sid, content) 在 PdComposer 内序列化 attachment
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import React, { useCallback, useRef } from 'react';
import { PdComposer } from '../components/chat/PdComposer';
import type { PdComposerHandle } from '../components/chat/PdComposer';
import { useI18n } from '../hooks/useI18n';
import { useChatStore } from '../stores/chatStore';
import { useSessionStore } from '../stores/sessionStore';
import { useUIStore } from '../stores/uiStore';
import { useTabStore } from '../stores/tabStore';

export interface EmptySessionProps {
  /** 当前活跃会话 id；若已存在则首条消息直接发送，否则先创建。 */
  activeId: string | null;
}

export const EmptySession: React.FC<EmptySessionProps> = ({ activeId }) => {
  const { t } = useI18n();
  const composerRef = useRef<PdComposerHandle>(null);

  const createSession = useSessionStore((s) => s.createSession);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const connectToSession = useChatStore((s) => s.connectToSession);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const addToast = useUIStore((s) => s.addToast);

  // cc-haha L183-254: handleSubmit — 已有会话直发；无会话先创建再发
  const handleSendExisting = useCallback(
    (content: string, attachments?: Array<{ mediaType: string; data: string }>) => {
      if (!content.trim() || !activeId) return;
      sendMessage(activeId, content, attachments);
    },
    [sendMessage, activeId],
  );

  const handleSendNew = useCallback(
    async (content: string, attachments?: Array<{ mediaType: string; data: string }>) => {
      if (!content.trim()) return;
      try {
        // cc-haha L230: createSession(workDir || undefined)
        const session = await createSession();
        // cc-haha L231: setActiveView('code') — panda 等价 'chat'
        setActiveView('chat');
        // cc-haha L232: openTab(sessionId, 'New Session')
        useTabStore.getState().openTab(session.id, t('session.defaultName'), 'session');
        // cc-haha L233: connectToSession(sessionId)
        connectToSession(session.id);
        // cc-haha L243: sendMessage(sessionId, text, attachmentPayload)
        sendMessage(session.id, content, attachments);
      } catch (error) {
        // cc-haha L246-250: addToast on failure
        addToast({
          type: 'error',
          message: error instanceof Error ? error.message : t('empty.failedToCreate'),
        });
      }
    },
    [createSession, connectToSession, sendMessage, setActiveView, addToast, t],
  );

  return (
    // cc-haha L457: 容器
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[var(--pd-color-surface)]">
      {/* cc-haha L458: hero 区 */}
      <div className="flex flex-1 flex-col items-center justify-center p-8 pb-32">
        {/* cc-haha L459: 内层 */}
        <div className="flex max-w-md flex-col items-center text-center">
          {/* Comdr 指令: 去掉熊猫 emoji 图标，仅保留品牌文字 */}
          {/* cc-haha L461-463: title */}
          <h1
            className="mb-2 text-3xl font-extrabold tracking-tight text-[var(--pd-color-text-primary)]"
            style={{ fontFamily: 'var(--pd-font-headline)' }}
          >
            {t('empty.title')}
          </h1>
          {/* cc-haha L464-466: subtitle */}
          <p
            className="mx-auto max-w-xs text-[var(--pd-color-text-secondary)]"
            style={{ fontFamily: 'var(--pd-font-body)' }}
          >
            {t('empty.subtitle')}
          </p>
        </div>
      </div>

      {/* cc-haha L470: composer 绝对底部容器 */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center px-8">
        {/* cc-haha L471: 内层 max-w-3xl */}
        <div className="flex w-full max-w-3xl flex-col gap-2">
          {/* cc-haha L472-600: glass-panel + textarea + slash + plus + attachment + run button
             panda PdComposer variant='hero' 已 1:1 封装该整块（含 +menu / slash / @file / attachment / mode + model + run）。
             cc-haha L602-604 的 DirectoryPicker 在 PdComposer 内部按 hasMessages=false 自动显示。 */}
          <PdComposer
            ref={composerRef}
            sessionId={activeId ?? ''}
            onSend={activeId ? handleSendExisting : handleSendNew}
            onStop={() => {
              /* no streaming in empty state */
            }}
            isStreaming={false}
            placeholder={t('empty.placeholder')}
            variant="hero"
          />
        </div>
      </div>
    </div>
  );
};

export default EmptySession;

// cc-haha L1-L612 — 612 行（panda 复刻 outer shell + 委托 PdComposer 实现 textarea/menu 内胆）
