// Input: 空会话状态
// Output: cc-haha 风格居中 Hero — serif 标题 + 说明文字；composer 本身由 ChatPage 控制
// Pos: ChatPage 空会话时显示

import { useState, useRef, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '../../lib/cn';
import { t } from '../../i18n';

export interface PdHeroComposerProps {
  onSend: (message: string) => void;
  onSlashCommand?: (cmd: string) => void;
}

export function PdHeroComposer({ onSend, onSlashCommand }: PdHeroComposerProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('/') && onSlashCommand) {
      onSlashCommand(trimmed);
    } else {
      onSend(trimmed);
    }
    setValue('');
  }, [value, onSend, onSlashCommand]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 gap-6 select-none">
      {/* Hero logomark — Reference: cc-haha/src/components/chat hero (design spec only, not source). 80x80 rounded-2xl */}
      <div
        className="flex items-center justify-center rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.06),0_4px_12px_rgba(193,95,60,0.14)]"
        style={{
          width: 80,
          height: 80,
          background: 'var(--pd-color-accent)',
          color: 'var(--pd-color-fg-on-accent)',
        }}
        aria-hidden="true"
      >
        <span
          style={{
            fontFamily: 'var(--pd-font-serif, Georgia, serif)',
            fontSize: 44,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          P
        </span>
      </div>

      {/* Title block — serif 32px per cc-haha Hero spec */}
      <div className="flex flex-col items-center gap-3 max-w-[480px] text-center">
        <h1
          className="text-[32px] leading-[1.15] font-semibold text-[var(--pd-color-fg)]"
          style={{ fontFamily: 'var(--pd-font-serif, Georgia, serif)' }}
        >
          {t('composer.hero.title')}
        </h1>
        <p className="text-[15px] leading-[1.6] text-[var(--pd-color-fg-muted)]">
          {t('composer.hero.subtitle')}
        </p>
      </div>

      {/* Composer — single clean card, no chip row below */}
      <div
        className={cn(
          "w-full max-w-[680px]",
          "rounded-[16px] bg-[var(--pd-color-bg-elevated)]",
          "border border-[var(--pd-color-border)]",
          "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
          "transition-shadow duration-150",
          "focus-within:border-[var(--pd-color-border-focus)]",
          "focus-within:shadow-[0_0_0_2px_rgba(193,95,60,0.18)]",
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.placeholder')}
          rows={2}
          className={cn(
            "w-full min-h-[56px] max-h-[200px]",
            "pt-3 pb-2 px-4",
            "bg-transparent text-[15px] text-[var(--pd-color-fg)]",
            "placeholder:text-[var(--pd-color-fg-muted)]",
            "border-none outline-none resize-none",
            "leading-[1.5]",
          )}
        />
        <div className="flex items-center px-3 pb-2">
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={cn(
              "shrink-0 w-7 h-7 flex items-center justify-center rounded-full",
              "transition-colors duration-150",
              value.trim()
                ? "bg-[var(--pd-color-accent)] text-[var(--pd-color-fg-on-accent)] hover:bg-[var(--pd-color-accent-hover)]"
                : "bg-[var(--pd-color-bg-subtle)] text-[var(--pd-color-fg-muted)] cursor-not-allowed",
            )}
            aria-label="Send"
          >
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
