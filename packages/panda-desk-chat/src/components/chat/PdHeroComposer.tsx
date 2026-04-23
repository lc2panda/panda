// Input: 空会话状态
// Output: 居中大号 Composer（Hero 变体）
// Pos: ChatPage 空会话时显示

import { useState, useRef, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', flex: 1, padding: '40px 20px',
      maxWidth: 'var(--pd-composer-max-width)', margin: '0 auto', width: '100%',
    }}>
      {/* Brand panda icon */}
      <div style={{
        width: 64, height: 64,
        marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.10))',
      }}>
        <svg viewBox="0 0 64 64" width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ears */}
          <circle cx="14" cy="14" r="10" fill="var(--pd-color-fg)" />
          <circle cx="50" cy="14" r="10" fill="var(--pd-color-fg)" />
          <circle cx="14" cy="14" r="5" fill="var(--pd-color-bg-secondary, var(--pd-color-bg))" />
          <circle cx="50" cy="14" r="5" fill="var(--pd-color-bg-secondary, var(--pd-color-bg))" />
          {/* Head */}
          <ellipse cx="32" cy="34" rx="22" ry="20" fill="var(--pd-color-bg)" stroke="var(--pd-color-fg)" strokeWidth="2" />
          {/* Eye patches */}
          <ellipse cx="22" cy="30" rx="7" ry="6" fill="var(--pd-color-fg)" transform="rotate(-10 22 30)" />
          <ellipse cx="42" cy="30" rx="7" ry="6" fill="var(--pd-color-fg)" transform="rotate(10 42 30)" />
          {/* Eyes */}
          <circle cx="23" cy="30" r="2.5" fill="var(--pd-color-bg)" />
          <circle cx="41" cy="30" r="2.5" fill="var(--pd-color-bg)" />
          <circle cx="24" cy="29.5" r="1" fill="var(--pd-color-fg)" />
          <circle cx="42" cy="29.5" r="1" fill="var(--pd-color-fg)" />
          {/* Nose + mouth */}
          <ellipse cx="32" cy="38" rx="3" ry="2" fill="var(--pd-color-fg)" />
          <path d="M32 40 Q29 44 26 42" stroke="var(--pd-color-fg)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M32 40 Q35 44 38 42" stroke="var(--pd-color-fg)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: '32px', fontWeight: 700, fontFamily: 'var(--pd-font-serif)',
        color: 'var(--pd-color-fg)', marginBottom: '8px', lineHeight: 1.2,
      }}>
        {t('composer.hero.title')}
      </h1>
      <p style={{
        fontSize: 'var(--pd-text-base)', color: 'var(--pd-color-fg-muted)',
        marginBottom: '32px',
      }}>
        {t('composer.hero.subtitle')}
      </p>

      {/* Input area — glassmorphism card */}
      <div className="pd-hero-glass" style={{
        width: '100%', position: 'relative',
        transition: 'border-color var(--pd-duration-fast) var(--pd-ease-standard), box-shadow var(--pd-duration-fast) var(--pd-ease-standard)',
      }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.placeholder')}
          rows={4}
          style={{
            width: '100%', padding: '16px 56px 16px 16px',
            border: 'none', outline: 'none', resize: 'none',
            background: 'transparent', fontSize: '16px',
            fontFamily: 'var(--pd-font-sans)',
            color: 'var(--pd-color-fg)', lineHeight: 1.6,
          }}
        />
        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          style={{
            position: 'absolute', right: '12px', bottom: '12px',
            width: '36px', height: '36px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--pd-radius-full)',
            background: value.trim() ? 'var(--pd-color-accent)' : 'var(--pd-color-bg-subtle)',
            color: value.trim() ? 'var(--pd-color-fg-on-accent)' : 'var(--pd-color-fg-muted)',
            border: 'none', cursor: value.trim() ? 'pointer' : 'default',
            transition: 'all var(--pd-duration-fast) var(--pd-ease-standard)',
          }}
          aria-label={t('chat.send')}
        >
          <ArrowUp size={18} />
        </button>
      </div>

      {/* Quick actions */}
      <div style={{
        display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {['/help', '/init', '/model', '/config'].map(cmd => (
          <button key={cmd} onClick={() => onSlashCommand?.(cmd)} style={{
            padding: '4px 12px', fontSize: '12px',
            background: 'var(--pd-color-bg-subtle)',
            color: 'var(--pd-color-fg-muted)',
            border: '1px solid var(--pd-color-border)',
            borderRadius: 'var(--pd-radius-full)',
            cursor: 'pointer', fontFamily: 'var(--pd-font-mono)',
          }}>
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
