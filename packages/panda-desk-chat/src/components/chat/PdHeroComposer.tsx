// Input:  无
// Output: cc-haha hero 形态欢迎块 — 96×96 logomark + 30px Manrope title + 14px subtitle
// Pos:    EmptySession 顶部欢迎区（独立块，与 PdComposer variant='hero' 解耦）
//
// Source: cc-haha 没有独立的 hero welcome block —— hero 状态由 ChatInput variant='hero' 直接呈现；
// panda 业务把 hero 拆为「上方欢迎块 + 下方 PdComposer」两栈，此组件保留为 panda 自创欢迎块。
// 与 cc-haha 复刻原则不冲突（不破坏 cc-haha className，不在 ChatInput 之上添装饰）。
import { t } from '../../i18n';

export type PdHeroComposerProps = {
  onSend?: (message: string) => void;
  onSlashCommand?: (cmd: string) => void;
};

export function PdHeroComposer(_props: PdHeroComposerProps = {}) {
  return (
    <div className="flex max-w-md flex-col items-center text-center select-none">
      {/* Logomark — 96×96 渐变 Squircle + clay 主色 P */}
      <div
        className="mb-6 relative"
        style={{
          width: 96,
          height: 96,
          borderRadius: 22,
          background:
            'linear-gradient(135deg, var(--pd-palette-terra-300, #F4AE95), var(--pd-color-accent, #D97757))',
          boxShadow: '0 8px 24px rgba(217, 119, 87, 0.22), 0 2px 6px rgba(27,28,26,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden="true"
      >
        <svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            d="M18 14 H36 Q48 14 48 26 Q48 38 36 38 H26 V52 H18 Z M26 22 V30 H36 Q40 30 40 26 Q40 22 36 22 Z"
            fill="#FFFFFF"
          />
          <circle cx="46" cy="50" r="3.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Title — Manrope 30px font-extrabold */}
      <h1
        className="mb-2"
        style={{
          fontFamily: 'var(--pd-font-headline)',
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          color: 'var(--pd-color-fg)',
          margin: 0,
        }}
      >
        {t('composer.hero.title')}
      </h1>

      {/* Subtitle — 14px max-w-xs */}
      <p
        className="mx-auto"
        style={{
          fontFamily: 'var(--pd-font-sans)',
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--pd-color-fg-muted)',
          maxWidth: 320,
          margin: 0,
        }}
      >
        {t('composer.hero.subtitle')}
      </p>
    </div>
  );
}
