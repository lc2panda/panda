// Input: bridge.listSkillsPandacc() — 真实 ~/.pandacc/skills/ 目录扫描
// Output: Skills 列表（卡片网格）+ 每项 name/description/version
// Pos: Settings tab — eighth entry (icon: auto_awesome)
//
// Comdr 指令: cc-haha 占位 → 真实 ~/.pandacc/skills/ 数据。
//   每个 skill 是个目录，可能含 SKILL.md（frontmatter: name/description/version）。
//   panda 默认 10 个 skill：browser-mcp / feishu-* / multi-search-engine / wechat-article / wps-*。
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useState } from 'react';
import { t } from '../../i18n';
import { listSkillsPandacc } from '../../ipc/bridge';
import type { PandaccSkillItem } from '../../ipc/types';

export function PdSkillSettings() {
  const [skills, setSkills] = useState<PandaccSkillItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await listSkillsPandacc();
      setSkills(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return (
    <div className="w-full min-w-0">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--pd-color-text-primary)] mb-1">
            {t('settings.skills.title')}
          </h2>
          <p className="text-sm text-[var(--pd-color-text-tertiary)]">
            {t('settings.skills.description')}
          </p>
        </div>
        <button
          onClick={() => void reload()}
          className="flex-shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-[var(--pd-color-text-secondary)] border border-[var(--pd-color-border)] hover:bg-[var(--pd-color-surface-hover)] transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[14px]">refresh</span>
          {t('settings.skills.refresh')}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-5 h-5 border-2 border-[var(--pd-color-brand)] border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="text-sm text-[var(--pd-color-error)] py-4">{error}</div>
      ) : skills.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-6">
          <span aria-hidden="true" className="material-symbols-outlined text-[40px] text-[var(--pd-color-text-tertiary)] mb-2 block">
            auto_awesome
          </span>
          <p className="text-sm text-[var(--pd-color-text-tertiary)]">
            {t('settings.skills.empty')}
          </p>
          <p className="text-xs text-[var(--pd-color-text-tertiary)] mt-1">
            {t('settings.skills.emptyHint')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-[var(--pd-color-text-tertiary)]">
            {t('settings.skills.loadedCount', { count: String(skills.length) })}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {skills.map((skill) => (
              <div
                key={skill.path}
                data-skill={skill.name}
                className="rounded-xl border border-[var(--pd-color-border)] bg-[var(--pd-color-surface)] px-4 py-3 transition-colors hover:bg-[var(--pd-color-surface-hover)]"
              >
                <div className="flex items-start gap-2">
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[var(--pd-color-brand)] mt-0.5 flex-shrink-0">
                    auto_awesome
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[var(--pd-color-text-primary)] break-all">
                        {skill.displayName ?? skill.name}
                      </span>
                      {skill.version && (
                        <span className="rounded-full border border-[var(--pd-color-border)] bg-[var(--pd-color-surface-container-low)] px-2 py-0.5 text-[10px] font-mono text-[var(--pd-color-text-tertiary)]">
                          {skill.version}
                        </span>
                      )}
                      {!skill.hasSkillMd && (
                        <span className="rounded-full bg-[var(--pd-color-warning-container)] px-2 py-0.5 text-[10px] text-[var(--pd-color-warning)]">
                          {t('settings.skills.noSkillMd')}
                        </span>
                      )}
                    </div>
                    {skill.description && (
                      <div className="mt-1 text-xs leading-5 text-[var(--pd-color-text-secondary)] break-words line-clamp-3">
                        {skill.description}
                      </div>
                    )}
                    <div className="mt-2 text-[11px] font-mono text-[var(--pd-color-text-tertiary)] truncate">
                      {skill.path}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
