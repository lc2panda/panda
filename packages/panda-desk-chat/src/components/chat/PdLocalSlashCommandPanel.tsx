// Input:  command（'mcp' | 'skills'）+ cwd + onClose
// Output: 浮在 composer 上方的本地 slash 面板（mcp / skills）— 标题 + 跳转 Settings 按钮
// Pos:    Chat layer — composer 输入 /mcp 或 /skills 后展开的本地面板
//
// Source 1:1: cc-haha desktop/src/components/chat/LocalSlashCommandPanel.tsx (L1-L290)
//   - className 转换：var(--color-*) → var(--pd-color-*)
//   - cc-haha mcpApi.list/status / skillsApi.list / mcpStore / skillStore → panda 暂无 IPC + stores；
//     本组件保持 PanelShell + Empty 提示（不模拟假数据），点击「Open Settings」按钮跳到对应 SettingsTab。
//   - cc-haha useTranslation hook → panda t() 函数（同义）。
import { useUIStore } from '../../stores/uiStore';
import { useTabStore, SETTINGS_TAB_ID } from '../../stores/tabStore';
import { t, getLocale } from '../../i18n';

// 「Open Settings」按钮文案 — 多语言内联，避免修改 i18n locales。
const OPEN_SETTINGS_LABEL: Record<string, string> = {
  zh: '打开设置',
  en: 'Open Settings',
  ja: '設定を開く',
  ko: '설정 열기',
};

export type LocalSlashCommandName = 'mcp' | 'skills';

type Props = {
  command: LocalSlashCommandName;
  cwd?: string;
  onClose: () => void;
};

function PanelShell({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-full left-0 right-0 z-50 mb-3 overflow-hidden rounded-2xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-lowest)] shadow-[var(--pd-shadow-dropdown)]">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--pd-color-border)] px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--pd-color-text-primary)]">{title}</h3>
          <p className="mt-1 text-sm text-[var(--pd-color-text-tertiary)]">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--pd-color-text-secondary)] transition-colors hover:bg-[var(--pd-color-surface-hover)] hover:text-[var(--pd-color-text-primary)]"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
      <div className="max-h-[420px] overflow-y-auto px-5 py-4">{children}</div>
    </div>
  );
}

function EmptyState({ title, body, ctaLabel, onCta }: { title: string; body: string; ctaLabel: string; onCta: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-5 py-10 text-center">
      <div className="text-sm font-semibold text-[var(--pd-color-text-primary)]">{title}</div>
      <div className="mt-2 text-xs leading-6 text-[var(--pd-color-text-tertiary)]">{body}</div>
      <button
        type="button"
        onClick={onCta}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[image:var(--pd-gradient-btn-primary)] px-4 py-2 text-xs font-semibold text-[var(--pd-color-btn-primary-fg)] shadow-[var(--pd-shadow-button-primary-cc)] transition-all hover:brightness-105"
      >
        <span className="material-symbols-outlined text-[14px]">settings</span>
        {ctaLabel}
      </button>
    </div>
  );
}

function McpPanel({ cwd, onClose }: { cwd?: string; onClose: () => void }) {
  const setPendingSettingsTab = useUIStore((s) => s.setPendingSettingsTab);
  const openTab = useTabStore((s) => s.openTab);
  return (
    <PanelShell
      title={t('slash.mcp.title')}
      subtitle={cwd ? t('slash.mcp.subtitleWithProject', { path: cwd }) : t('slash.mcp.subtitle')}
      onClose={onClose}
    >
      <EmptyState
        title={t('slash.mcp.emptyTitle')}
        body={t('slash.mcp.emptyBody')}
        ctaLabel={OPEN_SETTINGS_LABEL[getLocale()] ?? OPEN_SETTINGS_LABEL.en!}
        onCta={() => {
          setPendingSettingsTab('mcp');
          openTab(SETTINGS_TAB_ID, 'Settings', 'settings');
          onClose();
        }}
      />
    </PanelShell>
  );
}

function SkillsPanel({ cwd, onClose }: { cwd?: string; onClose: () => void }) {
  const setPendingSettingsTab = useUIStore((s) => s.setPendingSettingsTab);
  const openTab = useTabStore((s) => s.openTab);
  return (
    <PanelShell
      title={t('slash.skills.title')}
      subtitle={cwd ? t('slash.skills.subtitleWithProject', { path: cwd }) : t('slash.skills.subtitle')}
      onClose={onClose}
    >
      <EmptyState
        title={t('slash.skills.emptyTitle')}
        body={t('slash.skills.emptyBody')}
        ctaLabel={OPEN_SETTINGS_LABEL[getLocale()] ?? OPEN_SETTINGS_LABEL.en!}
        onCta={() => {
          setPendingSettingsTab('skills');
          openTab(SETTINGS_TAB_ID, 'Settings', 'settings');
          onClose();
        }}
      />
    </PanelShell>
  );
}

export function PdLocalSlashCommandPanel({ command, cwd, onClose }: Props) {
  if (command === 'mcp') return <McpPanel cwd={cwd} onClose={onClose} />;
  return <SkillsPanel cwd={cwd} onClose={onClose} />;
}
