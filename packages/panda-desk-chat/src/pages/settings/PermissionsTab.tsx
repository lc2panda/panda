// Input: settingsStore (permissionMode, setPermissionMode), useI18n (t)
// Output: Tool permission mode selector — 4 radio cards (Default / Plan / Auto / Bypass)
// Pos: settings/PermissionsTab — Permissions tab inside SettingsPage

import React, { type ComponentType } from 'react';
import {
  // @ts-ignore lucide-react bundled .d.ts omits top-level exports
  ShieldCheck as _ShieldCheck,
  // @ts-ignore
  Lightbulb as _Lightbulb,
  // @ts-ignore
  Zap as _Zap,
  // @ts-ignore
  ShieldOff as _ShieldOff,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useI18n } from '../../hooks/useI18n';
import { useSettingsStore, type PermissionMode } from '../../stores/settingsStore';

type IconFC = ComponentType<{ className?: string; size?: number }>;
const ShieldCheck = _ShieldCheck as IconFC;
const Lightbulb = _Lightbulb as IconFC;
const Zap = _Zap as IconFC;
const ShieldOff = _ShieldOff as IconFC;

interface ModeOption {
  mode: PermissionMode;
  labelKey: string;
  descKey: string;
  Icon: IconFC;
}

const MODE_OPTIONS: ModeOption[] = [
  { mode: 'default', labelKey: 'statusbar.permission.default', descKey: 'statusbar.permission.default.desc', Icon: ShieldCheck },
  { mode: 'plan', labelKey: 'statusbar.permission.plan', descKey: 'statusbar.permission.plan.desc', Icon: Lightbulb },
  { mode: 'auto', labelKey: 'statusbar.permission.auto', descKey: 'statusbar.permission.auto.desc', Icon: Zap },
  { mode: 'bypassPermissions', labelKey: 'statusbar.permission.bypass', descKey: 'statusbar.permission.bypass.desc', Icon: ShieldOff },
];

export const PermissionsTab: React.FC = () => {
  const { t } = useI18n();
  const permissionMode = useSettingsStore((s) => s.permissionMode);
  const setPermissionMode = useSettingsStore((s) => s.setPermissionMode);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-[var(--pd-font-semibold)] text-[var(--pd-color-fg)]">
          {t('settings.permissions.title')}
        </h2>
        <p className="mt-1 text-[13px] text-[var(--pd-color-fg-muted)]">
          {t('settings.permissions.subtitle' as any) || '选择 AI 工具调用的批准策略'}
        </p>
      </div>

      <div className="space-y-3">
        {MODE_OPTIONS.map((opt) => {
          const isActive = permissionMode === opt.mode;
          const Icon = opt.Icon;
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setPermissionMode(opt.mode)}
              className={cn(
                'group w-full text-left rounded-[12px] border-[1.5px] px-4 py-3.5 cursor-pointer',
                'flex items-start gap-3',
                'transition-all duration-200 ease-out',
                isActive
                  ? 'border-[var(--pd-color-accent)] bg-[var(--pd-color-bg-elevated)] shadow-[0_0_0_3px_rgba(217,119,87,0.12),0_2px_6px_rgba(27,28,26,0.06)]'
                  : 'border-[var(--pd-color-border)] bg-[var(--pd-color-bg-elevated)] shadow-[0_1px_2px_rgba(27,28,26,0.04)] hover:border-[var(--pd-color-border-strong)] hover:shadow-[0_2px_8px_rgba(27,28,26,0.08)] hover:-translate-y-px',
              )}
              aria-pressed={isActive}
            >
              <span
                className={cn(
                  'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]',
                  'transition-colors duration-200',
                  isActive
                    ? 'bg-[var(--pd-color-accent)] text-[var(--pd-color-fg-on-accent,#fff)]'
                    : 'bg-[var(--pd-color-bg-subtle)] text-[var(--pd-color-fg-muted)] group-hover:text-[var(--pd-color-accent)]',
                )}
              >
                <Icon size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-[var(--pd-font-semibold)] text-[var(--pd-color-fg)]">
                  {t(opt.labelKey)}
                </div>
                <div className="mt-1 text-[13px] leading-relaxed text-[var(--pd-color-fg-muted)]">
                  {t(opt.descKey)}
                </div>
              </div>
              {/* Active indicator dot */}
              {isActive && (
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: 'var(--pd-color-accent)' }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
