// Input: chatStore actions, uiStore inspector state
// Output: 水平按钮栏渲染，触发对应 action
// Pos: Composer 上方，ChatPage 布局中
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import React, { useState, useCallback } from 'react';
import { cn } from '../../lib/cn';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface PdSuperAssistBarProps {
  /** Send a slash command or prefixed message */
  onSendCommand: (cmd: string) => void;
  /** Toggle "think hard" mode — prepends directive to next message */
  onToggleThinking: (active: boolean) => void;
  /** Open the Composer slash-command menu (insert "/" into textarea) */
  onOpenSlashMenu: () => void;
  /** Open Inspector's Buddy Log tab */
  onOpenBuddyLog: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Button definitions                                                        */
/* -------------------------------------------------------------------------- */

interface AssistButton {
  id: string;
  label: string;
  emoji: string;
  type: 'toggle' | 'action';
}

const BUTTONS: AssistButton[] = [
  { id: 'think',      label: '深度思考', emoji: '🧠', type: 'toggle' },
  { id: 'review',     label: '代码审查', emoji: '🔍', type: 'action' },
  { id: 'plan',       label: '任务分解', emoji: '📋', type: 'action' },
  { id: 'slash',      label: '快捷指令', emoji: '⚡', type: 'action' },
  { id: 'buddy',      label: 'Buddy',   emoji: '🐼', type: 'action' },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const PdSuperAssistBar: React.FC<PdSuperAssistBarProps> = ({
  onSendCommand,
  onToggleThinking,
  onOpenSlashMenu,
  onOpenBuddyLog,
}) => {
  const [isThinkingActive, setIsThinkingActive] = useState(false);

  const handleClick = useCallback(
    (id: string) => {
      switch (id) {
        case 'think': {
          const next = !isThinkingActive;
          setIsThinkingActive(next);
          onToggleThinking(next);
          break;
        }
        case 'review':
          onSendCommand('/review');
          break;
        case 'plan':
          onSendCommand('/plan');
          break;
        case 'slash':
          onOpenSlashMenu();
          break;
        case 'buddy':
          onOpenBuddyLog();
          break;
      }
    },
    [isThinkingActive, onSendCommand, onToggleThinking, onOpenSlashMenu, onOpenBuddyLog],
  );

  return (
    <div
      className="pd-super-assist-bar w-full"
      style={{
        height: 36,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 16px',
        overflowX: 'auto',
        scrollbarWidth: 'none',       /* Firefox */
      }}
    >
      {/* WebKit scrollbar hide via inline <style> — scoped to this component */}
      <style>{`.pd-super-assist-bar::-webkit-scrollbar { display: none; }`}</style>

      {BUTTONS.map((btn) => {
        const isActive = btn.id === 'think' && isThinkingActive;

        return (
          <button
            key={btn.id}
            type="button"
            onClick={() => handleClick(btn.id)}
            className={cn(
              // Shape & spacing
              'shrink-0 inline-flex items-center gap-[5px]',
              'rounded-[18px] px-[14px] py-[6px]',
              'text-[13px] leading-none whitespace-nowrap',
              'cursor-pointer select-none',
              'transition-colors duration-[var(--pd-duration-quick,150ms)]',
              // Default state
              !isActive && [
                'bg-transparent',
                'border border-[var(--pd-color-border)]',
                'text-[var(--pd-color-fg-muted)]',
                'hover:bg-[var(--pd-color-bg-subtle)]',
                'hover:border-[var(--pd-color-accent)]',
              ],
              // Active state (thinking toggle ON)
              isActive && [
                'bg-[var(--pd-color-accent)]',
                'border border-[var(--pd-color-accent)]',
                'text-white',
              ],
            )}
          >
            <span className="text-[14px] leading-none">{btn.emoji}</span>
            <span>{btn.label}</span>
          </button>
        );
      })}
    </div>
  );
};

PdSuperAssistBar.displayName = 'PdSuperAssistBar';
