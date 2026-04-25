// Input: 无
// Output: 空会话 Hero 视觉块 — 大号 app icon (rounded-22 ≈ Anthropic Squircle) + Manrope bold 标题 + body 副标题
// Pos: ChatPage 空会话时渲染，仅内容层
// Reference: cc-haha desktop EmptySession (design spec only, not source) —
// cc-haha 数值: app-icon 80px rounded-[22px] + h1 30px font-extrabold Manrope +
//                subtitle 15px text-secondary leading-relaxed.

import { t } from '../../i18n';

export interface PdHeroComposerProps {
  /** Legacy prop — kept for type compat; Composer 不再由此组件渲染 */
  onSend?: (message: string) => void;
  onSlashCommand?: (cmd: string) => void;
}

export function PdHeroComposer(_props: PdHeroComposerProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6 select-none">
      {/* Logomark — 80px app-icon Squircle (rounded-[22px] cc-haha spec) */}
      <div
        className="relative"
        style={{
          width: 80,
          height: 80,
          borderRadius: 22,
          background: 'var(--pd-color-bg-elevated, #FFFFFF)',
          border: '1px solid var(--pd-color-border, #DAC1BA)',
          boxShadow:
            '0 1px 2px rgba(27,28,26,0.04), 0 8px 24px rgba(27,28,26,0.08), 0 16px 40px rgba(27,28,26,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden="true"
      >
        <svg width="48" height="48" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M18 12 H36 Q47 12 47 24 Q47 36 36 36 H26 V50 H18 Z M26 20 V28 H36 Q39 28 39 24 Q39 20 36 20 Z"
            fill="var(--pd-color-accent, #D97757)"
          />
          <circle cx="46" cy="48" r="3.5" fill="var(--pd-color-accent, #D97757)" />
        </svg>
      </div>

      {/* Title — Manrope extrabold 30px */}
      <h1
        style={{
          fontFamily: 'var(--pd-font-headline)',
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          color: 'var(--pd-color-fg)',
          margin: 0,
          textAlign: 'center',
        }}
      >
        {t('composer.hero.title')}
      </h1>

      {/* Subtitle — Inter 15px text-secondary */}
      <p
        className="text-center"
        style={{
          fontFamily: 'var(--pd-font-sans)',
          fontSize: 15,
          lineHeight: 1.6,
          color: 'var(--pd-color-fg-muted)',
          maxWidth: 480,
          margin: 0,
        }}
      >
        {t('composer.hero.subtitle')}
      </p>
    </div>
  );
}
