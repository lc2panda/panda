// Input: Permission mode, model info from stores
// Output: Interactive status chips in the status bar
// Pos: Layout layer — quick-access controls for permission and model

import { useState, useRef, useEffect, type ComponentType } from 'react';
import { cn } from '@/lib/cn';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProviderStore } from '@/stores/providerStore';
import { useI18n } from '@/hooks/useI18n';
import type { PermissionMode, EffortLevel } from '@/stores/settingsStore';
import type { ModelInfo } from '@/stores/providerStore';
import {
  Shield as _Shield,
  Cpu as _Cpu,
  Gauge as _Gauge,
  ChevronDown as _ChevronDown,
} from 'lucide-react';

type IconFC = ComponentType<{ className?: string; size?: number }>;
const Shield = _Shield as IconFC;
const Cpu = _Cpu as IconFC;
const Gauge = _Gauge as IconFC;
const ChevronDown = _ChevronDown as IconFC;

// ---------------------------------------------------------------------------
// Shared chip + dropdown styles
// ---------------------------------------------------------------------------
const chipBase = cn(
  'relative flex items-center gap-1 cursor-pointer select-none',
  'h-[22px] px-2 rounded-[var(--pd-radius-full)]',
  'text-[11px] font-[family-name:var(--pd-font-mono)]',
  'border border-[var(--pd-color-border)]',
  'transition-colors hover:bg-[var(--pd-color-bg-hover)]',
);

const dropdownBase = cn(
  'absolute left-0 bottom-full mb-1 z-50 min-w-[180px]',
  'rounded-[var(--pd-radius-md)] border border-[var(--pd-color-border)]',
  'bg-[var(--pd-color-bg)] shadow-lg overflow-hidden',
);

const dropdownItem = cn(
  'flex items-center gap-2 w-full px-3 py-1.5 text-left text-[11px]',
  'transition-colors hover:bg-[var(--pd-color-bg-hover)]',
  'text-[var(--pd-color-fg-muted)]',
);

// ---------------------------------------------------------------------------
// Permission chip — color mapping (labels via i18n)
// ---------------------------------------------------------------------------
const permissionColors: Record<PermissionMode, string> = {
  default:           'var(--pd-color-fg-muted)',
  plan:              'var(--pd-color-info)',
  auto:              'var(--pd-color-success)',
  bypassPermissions: 'var(--pd-color-error)',
};

const permissionI18nKeys: Record<PermissionMode, { label: string; desc: string }> = {
  default:           { label: 'statusbar.permission.default',  desc: 'statusbar.permission.default.desc' },
  plan:              { label: 'statusbar.permission.plan',     desc: 'statusbar.permission.plan.desc' },
  auto:              { label: 'statusbar.permission.auto',     desc: 'statusbar.permission.auto.desc' },
  bypassPermissions: { label: 'statusbar.permission.bypass',   desc: 'statusbar.permission.bypass.desc' },
};

// ---------------------------------------------------------------------------
// Effort chip — i18n keys
// ---------------------------------------------------------------------------
const effortI18nKeys: Record<EffortLevel, { label: string; desc: string }> = {
  auto:   { label: 'statusbar.effort.medium', desc: 'statusbar.effort.medium.desc' },
  low:    { label: 'statusbar.effort.low',    desc: 'statusbar.effort.low.desc' },
  medium: { label: 'statusbar.effort.medium', desc: 'statusbar.effort.medium.desc' },
  high:   { label: 'statusbar.effort.high',   desc: 'statusbar.effort.high.desc' },
};
const effortCycle: EffortLevel[] = ['auto', 'low', 'medium', 'high'];

// ---------------------------------------------------------------------------
// Hook: close dropdown on outside click
// ---------------------------------------------------------------------------
function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

// ---------------------------------------------------------------------------
// PermissionChip
// ---------------------------------------------------------------------------
function PermissionChip() {
  const mode = useSettingsStore((s) => s.permissionMode);
  const setMode = useSettingsStore((s) => s.setPermissionMode);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  useClickOutside(ref, () => setOpen(false));

  const color = permissionColors[mode];
  const keys = permissionI18nKeys[mode];

  return (
    <div ref={ref} className={chipBase} onClick={() => setOpen((v) => !v)}>
      <Shield size={12} className="shrink-0" />
      <span style={{ color }}>{t(keys.label as any)}</span>
      <ChevronDown size={10} className="shrink-0 opacity-50" />

      {open && (
        <div className={dropdownBase}>
          {(Object.keys(permissionColors) as PermissionMode[]).map((key) => {
            const c = permissionColors[key];
            const k = permissionI18nKeys[key];
            const active = key === mode;
            return (
              <button
                key={key}
                type="button"
                className={cn(dropdownItem, active && 'bg-[var(--pd-color-bg-hover)] text-[var(--pd-color-fg)]')}
                onClick={(e) => { e.stopPropagation(); setMode(key); setOpen(false); }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
                <span className="font-medium">{t(k.label as any)}</span>
                <span className="ml-auto opacity-60">{t(k.desc as any)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ModelChip
// ---------------------------------------------------------------------------
function ModelChip() {
  const modelId = useSettingsStore((s) => s.model);
  const setModel = useSettingsStore((s) => s.setModel);
  const getAvailableModels = useProviderStore((s) => s.getAvailableModels);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const models = getAvailableModels();
  const current = models.find((m) => m.id === modelId);
  const shortName = current?.name.replace(/^Claude\s+/, '') ?? modelId.split('-').slice(0, 2).join(' ');

  return (
    <div ref={ref} className={chipBase} onClick={() => setOpen((v) => !v)}>
      <Cpu size={12} className="shrink-0" />
      <span>{shortName}</span>
      <ChevronDown size={10} className="shrink-0 opacity-50" />

      {open && (
        <div className={dropdownBase}>
          {models.map((m: ModelInfo) => {
            const active = m.id === modelId;
            return (
              <button
                key={m.id}
                type="button"
                className={cn(dropdownItem, active && 'bg-[var(--pd-color-bg-hover)] text-[var(--pd-color-fg)]')}
                onClick={(e) => { e.stopPropagation(); setModel(m.id); setOpen(false); }}
              >
                <span className="font-medium">{m.name}</span>
                {m.tags && m.tags.length > 0 && (
                  <span className="ml-auto flex gap-1">
                    {m.tags.map((t) => (
                      <span
                        key={t}
                        className={cn(
                          'rounded-[var(--pd-radius-full)] px-1.5 py-px',
                          'text-[9px] border border-[var(--pd-color-border-subtle)]',
                          'text-[var(--pd-color-fg-muted)]',
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EffortChip
// ---------------------------------------------------------------------------
function EffortChip() {
  const level = useSettingsStore((s) => s.effortLevel);
  const setLevel = useSettingsStore((s) => s.setEffortLevel);
  const { t } = useI18n();

  const cycle = () => {
    const idx = effortCycle.indexOf(level);
    setLevel(effortCycle[(idx + 1) % effortCycle.length]);
  };

  const keys = effortI18nKeys[level];

  return (
    <div className={chipBase} onClick={cycle} title={`${t('statusbar.effort' as any)}: ${t(keys.label as any)} (${t(keys.desc as any)})`}>
      <Gauge size={12} className="shrink-0" />
      <span>{t(keys.label as any)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composite export
// ---------------------------------------------------------------------------
export function StatusBarChips() {
  return (
    <div className="flex items-center gap-1.5">
      <PermissionChip />
      <ModelChip />
      <EffortChip />
    </div>
  );
}
