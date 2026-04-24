// Input: 无
// Output: 空会话 Hero 视觉块 — 白底浮起 logomark + 粗 sans-serif 大标题 + subtitle
// Pos: ChatPage 空会话时渲染，仅内容层；Composer 由 ChatPage 统一在底部渲染（非本组件职责）
// Reference: cc-haha desktop_ui/01_full_ui.png Hero 块 (design spec only, not source)

import { t } from '../../i18n';

export interface PdHeroComposerProps {
  /** Legacy prop — kept for type compat; Composer 不再由此组件渲染 */
  onSend?: (message: string) => void;
  onSlashCommand?: (cmd: string) => void;
}

export function PdHeroComposer(_props: PdHeroComposerProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 px-6 select-none">
      {/* Logomark — pure SVG (no font dependency)，64px app-icon 比例 */}
      <div
        className="relative"
        style={{
          width: 64,
          height: 64,
          filter:
            'drop-shadow(0 8px 24px rgba(27,28,26,0.06)) drop-shadow(0 2px 6px rgba(27,28,26,0.04))',
        }}
        aria-hidden="true"
      >
        <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          {/* Rounded-square base */}
          <rect
            x="0"
            y="0"
            width="64"
            height="64"
            rx="14"
            fill="var(--pd-color-bg-elevated, #FFFFFF)"
            stroke="rgba(218,193,186,0.5)"
            strokeWidth="0.8"
          />
          {/* Stylized "P" mark — brand terracotta */}
          <path
            d="M18 12 H36 Q47 12 47 24 Q47 36 36 36 H26 V50 H18 Z M26 20 V28 H36 Q39 28 39 24 Q39 20 36 20 Z"
            fill="var(--pd-color-accent, #8F482F)"
          />
          {/* Decorative dot (bottom-right) */}
          <circle cx="46" cy="48" r="3.5" fill="var(--pd-color-accent, #8F482F)" />
        </svg>
      </div>

      {/* Title — Manrope bold 36px，tighter letter-spacing */}
      <h1
        style={{
          fontFamily: 'var(--pd-font-headline)',
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          color: 'var(--pd-color-fg)',
          margin: 0,
        }}
      >
        {t('composer.hero.title')}
      </h1>

      {/* Subtitle — 15px muted，max-w 440 */}
      <p
        className="text-center"
        style={{
          fontFamily: 'var(--pd-font-sans)',
          fontSize: 15,
          lineHeight: 1.55,
          color: 'var(--pd-color-fg-muted)',
          maxWidth: 440,
          margin: 0,
        }}
      >
        {t('composer.hero.subtitle')}
      </p>
    </div>
  );
}
