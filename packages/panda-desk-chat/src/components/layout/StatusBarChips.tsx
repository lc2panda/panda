// Input: Permission mode, model info from stores
// Output: Interactive status chips in the status bar
// Pos: Layout layer — quick-access controls for permission and model

import { useState, useRef, useEffect, type ComponentType } from 'react';
import { cn } from '@/lib/cn';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProviderStore } from '@/stores/providerStore';
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
// Permission chip data
// ---------------------------------------------------------------------------
const permissionMeta: Record<PermissionMode, { color: string; label: string; desc: string }> = {
  default:           { color: 'var(--pd-color-fg-muted)',  label: 'Default',  desc: 'Ask before each tool use' },
  plan:              { color: 'var(--pd-color-info)',       label: 'Plan',     desc: 'Read-only, no writes' },
  auto:              { color: 'var(--pd-color-success)',    label: 'Auto',     desc: 'Auto-approve safe tools' },
  bypassPermissions: { color: 'var(--pd-color-error)',      label: 'Bypass',   desc: 'Skip all permission checks' },
};

// ---------------------------------------------------------------------------
// Effort chip data
// ---------------------------------------------------------------------------
const effortMeta: Record<EffortLevel, string> = {
  auto:   'Auto',
  low:    'Low',
  medium: 'Medium',
  high:   'High',
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
  useClickOutside(ref, () => setOpen(false));

  const meta = permissionMeta[mode];

  return (
    <div ref={ref} className={chipBase} onClick={() => setOpen((v) => !v)}>
      <Shield size={12} className="shrink-0" />
      <span style={{ color: meta.color }}>{meta.label}</span>
      <ChevronDown size={10} className="shrink-0 opacity-50" />

      {open && (
        <div className={dropdownBase}>
          {(Object.keys(permissionMeta) as PermissionMode[]).map((key) => {
            const m = permissionMeta[key];
            const active = key === mode;
            return (
              <button
                key={key}
                type="button"
                className={cn(dropdownItem, active && 'bg-[var(--pd-color-bg-hover)] text-[var(--pd-color-fg)]')}
                onClick={(e) => { e.stopPropagation(); setMode(key); setOpen(false); }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.color }} />
                <span className="font-medium">{m.label}</span>
                <span className="ml-auto opacity-60">{m.desc}</span>
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

  const cycle = () => {
    const idx = effortCycle.indexOf(level);
    setLevel(effortCycle[(idx + 1) % effortCycle.length]);
  };

  return (
    <div className={chipBase} onClick={cycle} title={`Effort: ${effortMeta[level]} (click to cycle)`}>
      <Gauge size={12} className="shrink-0" />
      <span>{effortMeta[level]}</span>
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
