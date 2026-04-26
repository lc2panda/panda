// Input: settingsStore.permissionMode + setPermissionMode
// Output: 4 mode cards (default / acceptEdits / plan / bypassPermissions) with rounded-xl border + shadow
// Pos: Settings tab — second entry (icon: shield)
//
// Source 1:1: cc-haha desktop/src/pages/Settings.tsx L675-L720 (PermissionSettings)
//   className 严格 cc-haha；--color-* → --pd-color-*。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { t } from '../../i18n';
import { useSettingsStore } from '../../stores/settingsStore';
import type { PermissionMode } from '../../types/settings';

export function PdPermissionSettings() {
  const permissionMode = useSettingsStore((s) => s.permissionMode);
  const setPermissionMode = useSettingsStore((s) => s.setPermissionMode);

  const MODES: Array<{
    mode: PermissionMode;
    icon: string;
    label: string;
    desc: string;
  }> = [
    {
      mode: 'default',
      icon: 'verified_user',
      label: t('settings.permissions.default'),
      desc: t('settings.permissions.defaultDesc'),
    },
    {
      mode: 'acceptEdits',
      icon: 'edit_note',
      label: t('settings.permissions.acceptEdits'),
      desc: t('settings.permissions.acceptEditsDesc'),
    },
    {
      mode: 'plan',
      icon: 'architecture',
      label: t('settings.permissions.plan'),
      desc: t('settings.permissions.planDesc'),
    },
    {
      mode: 'bypassPermissions',
      icon: 'bolt',
      label: t('settings.permissions.bypass'),
      desc: t('settings.permissions.bypassDesc'),
    },
  ];

  return (
    <div className="max-w-xl">
      <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-1">
        {t('settings.permissions.title')}
      </h2>
      <p className="text-sm text-[var(--pd-color-text-tertiary)] mb-4">
        {t('settings.permissions.description')}
      </p>

      <div className="flex flex-col gap-2">
        {MODES.map(({ mode, icon, label, desc }) => {
          const isSelected = permissionMode === mode;
          return (
            <button
              key={mode}
              onClick={() => void setPermissionMode(mode)}
              data-mode={mode}
              aria-pressed={isSelected}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'border-[var(--pd-color-brand)] bg-[var(--pd-color-surface-container)] shadow-[var(--pd-shadow-focus-ring)]'
                  : 'border-[var(--pd-color-border)] hover:border-[var(--pd-color-border-focus)] hover:bg-[var(--pd-color-surface-hover)]'
              }`}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[var(--pd-color-text-secondary)]">
                {icon}
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-[var(--pd-color-text-primary)]">
                  {label}
                </div>
                <div className="text-xs text-[var(--pd-color-text-tertiary)]">
                  {desc}
                </div>
              </div>
              {isSelected && (
                <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[var(--pd-color-brand)]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
