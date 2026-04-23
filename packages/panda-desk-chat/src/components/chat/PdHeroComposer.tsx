// Input: 空会话状态
// Output: 居中大号 Composer（Hero 变体）+ 建议 pill 标签
// Pos: ChatPage 空会话时显示

import { useState, useRef, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '../../lib/cn';
import { t } from '../../i18n';

export interface PdHeroComposerProps {
  onSend: (message: string) => void;
  onSlashCommand?: (cmd: string) => void;
}

/* -------------------------------------------------------------------------- */
/*  Suggestion pills                                                          */
/* -------------------------------------------------------------------------- */

const SUGGESTIONS = [
  { label: 'Write', prompt: 'Help me write ' },
  { label: 'Learn', prompt: 'Explain how ' },
  { label: 'Code', prompt: 'Write code to ' },
  { label: 'Life', prompt: 'Give me advice about ' },
  { label: "Panda's choice", prompt: 'Surprise me with something interesting' },
] as const;

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

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

  const handleSuggestion = useCallback((prompt: string) => {
    if (prompt.endsWith(' ')) {
      // Partial prompt — fill textarea and focus
      setValue(prompt);
      textareaRef.current?.focus();
    } else {
      // Complete prompt — send directly
      onSend(prompt);
    }
  }, [onSend]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 gap-8 select-none">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4">
        <img
          src="/panda-logo.svg"
          alt="Panda Code"
          className="w-24 h-24"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <h1 className="text-3xl font-bold text-[var(--pd-color-fg)]">
          {t('app.name')}
        </h1>
        <p className="text-[var(--pd-text-base)] text-[var(--pd-color-fg-muted)]">
          {t('composer.hero.subtitle')}
        </p>
      </div>

      {/* Composer area with glass effect */}
      <div
        className={cn(
          "pd-glass-panel",
          "w-full max-w-[var(--pd-layout-composer-max-width)]",
          "rounded-[var(--pd-radius-2xl)]",
          "transition-shadow duration-[var(--pd-duration-quick)]",
          "focus-within:shadow-[0_0_0_2px_rgba(193,95,60,0.2)]",
          "focus-within:border-[var(--pd-color-border-focus)]",
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.placeholder')}
          rows={3}
          className={cn(
            "w-full min-h-[80px] max-h-[200px]",
            "py-3 px-4",
            "bg-transparent text-[var(--pd-text-base)] text-[var(--pd-color-fg)]",
            "placeholder:text-[var(--pd-color-fg-muted)]",
            "border-none outline-none resize-none",
            "leading-[1.5]",
            "font-[family-name:var(--pd-font-sans)]",
          )}
        />

        {/* Bottom bar */}
        <div className="flex items-center px-3 pb-2">
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={cn(
              "shrink-0 w-8 h-8 flex items-center justify-center",
              "rounded-[var(--pd-radius-full)]",
              "transition-colors duration-[var(--pd-duration-quick)]",
              value.trim()
                ? "bg-[var(--pd-color-accent)] text-[var(--pd-color-fg-on-accent)] hover:bg-[var(--pd-color-accent-hover)]"
                : "bg-[var(--pd-color-bg-disabled)] text-[var(--pd-color-fg-disabled)] cursor-not-allowed",
            )}
            aria-label="Send"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>

      {/* Suggestion pills */}
      <div className="flex flex-wrap justify-center gap-2 max-w-[var(--pd-layout-composer-max-width)]">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => handleSuggestion(s.prompt)}
            className={cn(
              "px-4 py-2",
              "text-[var(--pd-text-sm)]",
              "text-[var(--pd-color-fg-muted)]",
              "border border-[var(--pd-color-border)]",
              "rounded-[var(--pd-radius-full)]",
              "hover:bg-[var(--pd-color-bg-hover)] hover:text-[var(--pd-color-fg)]",
              "transition-colors duration-[var(--pd-duration-fast)]",
              "cursor-pointer",
              "font-[family-name:var(--pd-font-sans)]",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
