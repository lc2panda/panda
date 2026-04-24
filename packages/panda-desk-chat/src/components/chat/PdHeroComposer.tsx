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
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6 select-none">
      {/* Logomark — 白底浮起方块 + brand 色 P + 装饰点 */}
      <div
        className="relative grid place-items-center"
        style={{
          width: 88,
          height: 88,
          background: 'var(--pd-color-bg-elevated, #FCFCF9)',
          borderRadius: 20,
          border: '1px solid rgba(0,0,0,0.04)',
          boxShadow:
            '0 10px 32px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        }}
        aria-hidden="true"
      >
        <span
          style={{
            fontFamily: 'var(--pd-font-headline)',
            fontSize: 52,
            fontWeight: 800,
            color: 'var(--pd-color-accent)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            transform: 'translateY(-1px)',
          }}
        >
          P
        </span>
        <span
          className="absolute"
          style={{
            right: 16,
            bottom: 16,
            width: 10,
            height: 10,
            borderRadius: 999,
            background: 'var(--pd-color-accent)',
            boxShadow: '0 2px 6px rgba(193,95,60,0.28)',
          }}
        />
      </div>

      {/* Title — cc-haha headline: Manrope bold 40px */}
      <h1
        style={{
          fontFamily: 'var(--pd-font-headline)',
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          color: 'var(--pd-color-fg)',
          margin: 0,
        }}
      >
        {t('composer.hero.title')}
      </h1>

      {/* Subtitle — 16px muted，max-w 460 三行自然换行 */}
      <p
        className="text-center"
        style={{
          fontSize: 16,
          lineHeight: 1.6,
          color: 'var(--pd-color-fg-muted)',
          maxWidth: 460,
          margin: 0,
        }}
      >
        {t('composer.hero.subtitle')}
      </p>
    </div>
  );
}
