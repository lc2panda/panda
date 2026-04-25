// Input: 路由 — useTabStore.activeTabId === LEARNING_TAB_ID 时挂载
// Output: 学习助手主页 — panda CLI /learn 真实落盘数据（learning-plans + flashcards）+ 详情视图
// Pos: Page layer — PdContentRouter 'learning' 分支唯一目标
//
// Comdr 指令: 学习助手对接 panda CLI /learn 真实落盘数据，禁绝任何 stub。
//   数据来源（panda CLI bundled skill src/skills/bundled/learn.ts）：
//     /learn plan <topic>  →  <project_cwd>/working/learning-plans/<slug>.md
//     /learn from <file>   →  <project_cwd>/working/flashcards/<topic>.json
//     复习日志              →  <project_cwd>/working/flashcards/.review-log.json
//   panda CLI 数据是项目级 — 扫描 ~/.pandacc/projects/<slug>/ 后反 sanitize 取原 cwd
//   再读 working/ 下两类文件。完全空时显示空态，不 fallback。
//
// 关联策略：plan.slug ↔ flashcards.topic 同名（同一项目）即视为同主题。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { useEffect, useMemo, useState } from 'react';
import { t } from '../i18n';
import { useTabStore, SETTINGS_TAB_ID } from '../stores/tabStore';
import { useUIStore } from '../stores/uiStore';
import {
  listLearningPlans,
  listLearningFlashcards,
  readLearningPlan,
  readLearningFlashcards,
} from '../ipc/bridge';
import type {
  LearningPlanMeta,
  LearningFlashcardSet,
  LearningPlanDetail,
  ReviewLogEntry,
  LearningMaterialRef,
  FlashcardEntry,
} from '../ipc/types';
import { PdMarkdownRenderer } from '../components/chat/PdMarkdownRenderer';

// ─── 旧 stub 残余 localStorage 清理 ─────────────────────────────────────────
//
// 旧版本曾把杜撰的 "学习 Rust" / "TypeScript 进阶" / "ML 论文" seed 写入
// localStorage['panda-desk:learning.plans']。本次切换到真实 IPC 数据，
// 必须主动 evict 旧 key，避免下次访问时被旧数据干扰。
const LEGACY_STUB_KEY = 'panda-desk:learning.plans';

function clearLegacyStub(): void {
  try {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(LEGACY_STUB_KEY) !== null) {
      window.localStorage.removeItem(LEGACY_STUB_KEY);
    }
  } catch {
    /* ignore — quota / disabled storage */
  }
}

// ─── 合并模型：plan + 同名 flashcards → CombinedPlan ─────────────────────────

interface CombinedPlan {
  /** 复合 id：`plan:<projectSlug>:<slug>` 或 `cards:<projectSlug>:<topic>`（仅 flashcards 无 plan 时）。 */
  id: string;
  /** 'plan' = 有 markdown 计划; 'cards-only' = 只有 flashcards（用户跑了 /learn from 但没 plan）。 */
  source: 'plan' | 'cards-only';
  projectSlug: string;
  projectCwd: string;
  title: string;
  /** plan 路由用：projectSlug + slug。 */
  planSlug?: string;
  /** flashcards 路由用：topic。 */
  flashTopic?: string;
  /** 关联的闪卡集（可空 — 未运行 /learn from 时）。 */
  cards: LearningFlashcardSet | null;
  /** 摘要（plan.excerpt 或 flashcards.source）。 */
  excerpt: string;
  materialCount: number;
  stageCount: number;
  /** 推断状态：有到期 due 即 active；否则若全部已熟练则 paused；其他默认 active。 */
  status: 'active' | 'paused' | 'completed';
  updatedAt: string;
}

function combinePlansAndFlashcards(
  plans: LearningPlanMeta[],
  flashcards: LearningFlashcardSet[],
): CombinedPlan[] {
  // Index flashcards by `<projectSlug>:<topic>` 与 `<projectSlug>:<topicLower>` 双向。
  const flashByKey = new Map<string, LearningFlashcardSet>();
  for (const fs of flashcards) {
    flashByKey.set(`${fs.projectSlug}:${fs.topic}`, fs);
    flashByKey.set(`${fs.projectSlug}:${fs.topic.toLowerCase()}`, fs);
  }

  const consumed = new Set<string>();
  const out: CombinedPlan[] = [];

  // 1) plan 优先 — 关联同 projectSlug 同 slug 的 flashcards
  for (const plan of plans) {
    const directKey = `${plan.projectSlug}:${plan.slug}`;
    const lowerKey = `${plan.projectSlug}:${plan.slug.toLowerCase()}`;
    const linked =
      flashByKey.get(directKey) ?? flashByKey.get(lowerKey) ?? null;
    if (linked) {
      consumed.add(`${linked.projectSlug}:${linked.topic}`);
    }

    const hasDue = !!linked && linked.dueCount > 0;
    const allLearned =
      !!linked && linked.totalCount > 0 && linked.learningCount === linked.totalCount;
    const status: CombinedPlan['status'] = hasDue
      ? 'active'
      : allLearned
      ? 'completed'
      : 'active';

    out.push({
      id: `plan:${plan.projectSlug}:${plan.slug}`,
      source: 'plan',
      projectSlug: plan.projectSlug,
      projectCwd: plan.projectCwd,
      title: plan.title,
      planSlug: plan.slug,
      flashTopic: linked?.topic,
      cards: linked,
      excerpt: plan.excerpt,
      materialCount: plan.materialCount,
      stageCount: plan.stageCount,
      status,
      updatedAt:
        linked && linked.updatedAt > plan.updatedAt ? linked.updatedAt : plan.updatedAt,
    });
  }

  // 2) 孤儿 flashcards — 没有对应 plan
  for (const fs of flashcards) {
    const key = `${fs.projectSlug}:${fs.topic}`;
    if (consumed.has(key)) continue;
    const hasDue = fs.dueCount > 0;
    const allLearned = fs.totalCount > 0 && fs.learningCount === fs.totalCount;
    const status: CombinedPlan['status'] = hasDue
      ? 'active'
      : allLearned
      ? 'completed'
      : 'active';

    out.push({
      id: `cards:${fs.projectSlug}:${fs.topic}`,
      source: 'cards-only',
      projectSlug: fs.projectSlug,
      projectCwd: fs.projectCwd,
      title: fs.topic,
      flashTopic: fs.topic,
      cards: fs,
      excerpt: fs.source ? `来源：${fs.source}` : '',
      materialCount: fs.source ? 1 : 0,
      stageCount: 0,
      status,
      updatedAt: fs.updatedAt,
    });
  }

  out.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  return out;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return '—';
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d`;
  return `${Math.floor(day / 30)}mo`;
}

function progressPercent(plan: CombinedPlan): number {
  if (!plan.cards || plan.cards.totalCount === 0) return 0;
  return Math.round((plan.cards.learningCount / plan.cards.totalCount) * 100);
}

function formatCwdShort(cwd: string): string {
  if (!cwd) return '';
  // 替换 home dir → ~
  const home = (typeof navigator !== 'undefined' && /mac|linux/i.test(navigator.platform))
    ? cwd.replace(/^\/Users\/[^/]+/, '~').replace(/^\/home\/[^/]+/, '~')
    : cwd;
  const parts = home.split('/').filter(Boolean);
  if (parts.length <= 2) return home;
  return `…/${parts.slice(-2).join('/')}`;
}

// ─── 顶级组件 ───────────────────────────────────────────────────────────────

export function PdLearningAssistant() {
  const [plans, setPlans] = useState<LearningPlanMeta[]>([]);
  const [flashcards, setFlashcards] = useState<LearningFlashcardSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const setPendingSettingsTab = useUIStore((s) => s.setPendingSettingsTab);

  // 清旧 stub localStorage
  useEffect(() => {
    clearLegacyStub();
  }, []);

  // 拉真实数据
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([listLearningPlans(), listLearningFlashcards()])
      .then(([p, f]) => {
        if (cancelled) return;
        setPlans(p);
        setFlashcards(f);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[PdLearningAssistant] load failed:', msg);
        setError(msg);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const combined = useMemo(
    () => combinePlansAndFlashcards(plans, flashcards),
    [plans, flashcards],
  );

  const selected = useMemo(
    () => combined.find((p) => p.id === selectedId) ?? null,
    [combined, selectedId],
  );

  const goToSettings = () => {
    setPendingSettingsTab('learning');
    useTabStore.getState().openTab(SETTINGS_TAB_ID, t('sidebar.settings'), 'settings');
  };

  if (selected) {
    return <PlanDetail plan={selected} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--pd-color-surface)]">
      <div className="mx-auto flex w-full max-w-[860px] items-center justify-between px-8 py-6 border-b border-[var(--pd-color-outline-variant)]/10">
        <div>
          <h1
            className="text-2xl font-bold text-[var(--pd-color-text-primary)] leading-tight"
            style={{ fontFamily: 'var(--pd-font-headline)' }}
          >
            学习助手
          </h1>
          <p className="mt-1 text-sm text-[var(--pd-color-text-secondary)]">
            读论文、做笔记、间隔复习 — 来自 panda CLI <code className="font-mono text-[12px] px-1 rounded bg-[var(--pd-color-surface-container-low)]">/learn</code> 的真实落盘
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshTick((n) => n + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pd-color-border)]/70 bg-[var(--pd-color-surface-container-low)] px-3 py-1.5 text-xs font-medium text-[var(--pd-color-text-secondary)] transition-colors hover:bg-[var(--pd-color-surface-hover)] hover:text-[var(--pd-color-text-primary)] disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[14px] ${loading ? 'animate-spin' : ''}`} aria-hidden="true">refresh</span>
            刷新
          </button>
          <button
            type="button"
            onClick={goToSettings}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pd-color-border)]/70 bg-[var(--pd-color-surface-container-low)] px-3 py-1.5 text-xs font-medium text-[var(--pd-color-text-secondary)] transition-colors hover:bg-[var(--pd-color-surface-hover)] hover:text-[var(--pd-color-text-primary)]"
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">tune</span>
            设置
          </button>
          <button
            type="button"
            disabled
            title='在当前会话中输入 /learn plan "主题"'
            className="inline-flex items-center gap-1.5 rounded-lg bg-[image:var(--pd-gradient-btn-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--pd-color-btn-primary-fg)] shadow-[var(--pd-shadow-button-primary-cc)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">add</span>
            新建计划
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[860px] px-8 py-6">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={() => setRefreshTick((n) => n + 1)} />
          ) : combined.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-3">
              {combined.map((plan) => (
                <PlanRow key={plan.id} plan={plan} onClick={() => setSelectedId(plan.id)} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 列表行 ────────────────────────────────────────────────────────────────

function PlanRow({ plan, onClick }: { plan: CombinedPlan; onClick: () => void }) {
  const pct = progressPercent(plan);
  const cards = plan.cards;

  const statusLabel =
    plan.status === 'active'
      ? '进行中'
      : plan.status === 'paused'
      ? '已暂停'
      : '已完成';
  const badgeBgClass =
    plan.status === 'active'
      ? 'bg-[var(--pd-color-success)]/15 text-[var(--pd-color-success)]'
      : plan.status === 'paused'
      ? 'bg-[var(--pd-color-warning)]/15 text-[var(--pd-color-warning)]'
      : 'bg-[var(--pd-color-text-tertiary)]/15 text-[var(--pd-color-text-tertiary)]';

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] px-5 py-4 shadow-sm transition-all hover:border-[var(--pd-color-brand)]/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pd-color-brand)]/35"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[var(--pd-color-text-primary)] truncate" style={{ fontFamily: 'var(--pd-font-headline)' }}>
                {plan.title}
              </h3>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeBgClass}`}>
                {statusLabel}
              </span>
              {plan.source === 'cards-only' && (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--pd-color-brand)]/15 text-[var(--pd-color-brand)]">
                  仅闪卡
                </span>
              )}
            </div>
            {plan.excerpt && (
              <p className="mt-1 text-xs text-[var(--pd-color-text-tertiary)] line-clamp-2">{plan.excerpt}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--pd-color-text-tertiary)]">
              <span
                className="inline-flex items-center gap-1 font-mono truncate max-w-[260px]"
                title={plan.projectCwd}
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">folder</span>
                {formatCwdShort(plan.projectCwd)}
              </span>
              {plan.materialCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">menu_book</span>
                  {plan.materialCount} 份材料
                </span>
              )}
              {plan.stageCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">stairs</span>
                  {plan.stageCount} 阶段
                </span>
              )}
              {cards && cards.totalCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">style</span>
                  {cards.totalCount} 张卡片
                </span>
              )}
              {cards && cards.dueCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[var(--pd-color-warning)]">
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">schedule</span>
                  {cards.dueCount} 待复习
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">history</span>
                {formatRelativeTime(plan.updatedAt)}
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[var(--pd-color-text-tertiary)]" aria-hidden="true">chevron_right</span>
        </div>

        {cards && cards.totalCount > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-[var(--pd-color-surface-container-high)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--pd-color-brand)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-[var(--pd-color-text-tertiary)] tabular-nums">{pct}%</span>
          </div>
        )}
      </button>
    </li>
  );
}

// ─── 空态 / 加载 / 错误 ─────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="text-center py-16 text-[var(--pd-color-text-tertiary)]">
      <span className="material-symbols-outlined text-[40px] animate-spin" aria-hidden="true">progress_activity</span>
      <p className="mt-2 text-sm">扫描 panda CLI 项目…</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-[var(--pd-color-text-tertiary)]">
      <span className="material-symbols-outlined text-[48px]" aria-hidden="true">school</span>
      <p className="mt-3 text-base font-semibold text-[var(--pd-color-text-secondary)]">还没有学习计划</p>
      <p className="mt-2 text-xs">
        在任意项目会话中输入{' '}
        <code className="px-1.5 py-0.5 rounded bg-[var(--pd-color-surface-container-low)] font-mono">/learn plan "主题"</code>{' '}
        创建
      </p>
      <p className="mt-1 text-xs">
        或{' '}
        <code className="px-1.5 py-0.5 rounded bg-[var(--pd-color-surface-container-low)] font-mono">/learn from &lt;file&gt;</code>{' '}
        从文件提取闪卡
      </p>
      <p className="mt-4 text-[10px] text-[var(--pd-color-text-tertiary)]/70 font-mono">
        扫描路径 ~/.pandacc/projects/&lt;slug&gt;/ → working/learning-plans/ + working/flashcards/
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-16 text-[var(--pd-color-text-tertiary)]">
      <span className="material-symbols-outlined text-[40px] text-[var(--pd-color-error)]" aria-hidden="true">error</span>
      <p className="mt-2 text-sm font-semibold text-[var(--pd-color-text-secondary)]">扫描失败</p>
      <p className="mt-1 text-xs font-mono text-[var(--pd-color-text-tertiary)]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[var(--pd-color-border)]/70 bg-[var(--pd-color-surface-container-low)] px-3 py-1.5 text-xs font-medium text-[var(--pd-color-text-secondary)] hover:bg-[var(--pd-color-surface-hover)] hover:text-[var(--pd-color-text-primary)]"
      >
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">refresh</span>
        重试
      </button>
    </div>
  );
}

// ─── 详情视图 ───────────────────────────────────────────────────────────────

function PlanDetail({ plan, onBack }: { plan: CombinedPlan; onBack: () => void }) {
  const [detail, setDetail] = useState<LearningPlanDetail | null>(null);
  const [cardSet, setCardSet] = useState<LearningFlashcardSet | null>(plan.cards);
  const [detailLoading, setDetailLoading] = useState<boolean>(plan.source === 'plan');

  // 加载 markdown 全文（仅 plan source）+ 刷一次最新闪卡（拉 reviewLog 完整版）
  useEffect(() => {
    let cancelled = false;
    setDetailLoading(plan.source === 'plan');

    const planPromise: Promise<LearningPlanDetail | null> =
      plan.source === 'plan' && plan.planSlug
        ? readLearningPlan(plan.projectSlug, plan.planSlug)
        : Promise.resolve(null);

    const flashPromise: Promise<LearningFlashcardSet | null> = plan.flashTopic
      ? readLearningFlashcards(plan.projectSlug, plan.flashTopic)
      : Promise.resolve(plan.cards);

    Promise.all([planPromise, flashPromise])
      .then(([d, fs]) => {
        if (cancelled) return;
        setDetail(d);
        setCardSet(fs);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[PdLearningAssistant] detail load failed:', err);
      })
      .finally(() => {
        if (cancelled) return;
        setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [plan.id, plan.planSlug, plan.flashTopic, plan.projectSlug, plan.source, plan.cards]);

  const totalCount = cardSet?.totalCount ?? 0;
  const dueCount = cardSet?.dueCount ?? 0;
  const learningCount = cardSet?.learningCount ?? 0;
  const newCount = Math.max(0, totalCount - learningCount);
  const pct = totalCount > 0 ? Math.round((learningCount / totalCount) * 100) : 0;
  const reviewLog = cardSet?.reviewLog ?? [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--pd-color-surface)]">
      <div className="mx-auto w-full max-w-[860px] px-8 py-5 border-b border-[var(--pd-color-outline-variant)]/10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--pd-color-text-secondary)] hover:text-[var(--pd-color-text-primary)] transition-colors mb-3"
        >
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_back</span>
          返回学习计划
        </button>
        <h1
          className="text-2xl font-bold text-[var(--pd-color-text-primary)] leading-tight"
          style={{ fontFamily: 'var(--pd-font-headline)' }}
        >
          {plan.title}
        </h1>
        <p className="mt-1 text-xs font-mono text-[var(--pd-color-text-tertiary)] truncate" title={plan.projectCwd}>
          {plan.projectCwd}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[860px] px-8 py-6 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-[var(--pd-color-text-secondary)] mb-3">
              进度概览
            </h2>
            <div className="grid grid-cols-4 gap-3">
              <StatCard icon="trending_up" label="完成度" value={`${pct}%`} />
              <StatCard icon="style" label="总卡片" value={totalCount} />
              <StatCard icon="schedule" label="待复习" value={dueCount} accent="warning" />
              <StatCard icon="add_circle" label="新卡片" value={newCount} accent="brand" />
            </div>
          </section>

          {plan.source === 'plan' && (
            <PlanContentSection detail={detail} loading={detailLoading} />
          )}

          {detail && detail.materials.length > 0 && (
            <MaterialsSection materials={detail.materials} />
          )}

          <FlashcardsSection cardSet={cardSet} />

          <ReviewLogSection reviewLog={reviewLog} />

          <CardStateSection
            total={totalCount}
            learning={learningCount}
            dueCount={dueCount}
          />

          <section className="pt-4 flex gap-2">
            <button
              type="button"
              disabled
              title="在当前会话中输入 /learn review"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[image:var(--pd-gradient-btn-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--pd-color-btn-primary-fg)] shadow-[var(--pd-shadow-button-primary-cc)] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">play_arrow</span>
              开始复习（{dueCount}）
            </button>
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--pd-color-border)]/70 bg-[var(--pd-color-surface-container-low)] px-4 py-2.5 text-sm font-medium text-[var(--pd-color-text-secondary)] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">settings</span>
              计划设置
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── 详情子区块 ────────────────────────────────────────────────────────────

function PlanContentSection({
  detail,
  loading,
}: {
  detail: LearningPlanDetail | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-[var(--pd-color-text-secondary)] mb-3">学习计划</h2>
        <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-6 text-center text-[var(--pd-color-text-tertiary)]">
          <span className="material-symbols-outlined text-[24px] animate-spin" aria-hidden="true">progress_activity</span>
          <p className="mt-1 text-xs">读取 markdown 全文…</p>
        </div>
      </section>
    );
  }
  if (!detail) {
    return null;
  }
  return (
    <section>
      <h2 className="text-sm font-semibold text-[var(--pd-color-text-secondary)] mb-3">
        学习计划
      </h2>
      <div className="rounded-2xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] px-5 py-4 shadow-sm">
        <PdMarkdownRenderer content={detail.content} variant="document" />
      </div>
    </section>
  );
}

function MaterialsSection({ materials }: { materials: LearningMaterialRef[] }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-[var(--pd-color-text-secondary)] mb-3">
        学习材料 · {materials.length}
      </h2>
      <div className="space-y-2">
        {materials.map((m, i) => (
          <div
            key={`${m.source}-${i}`}
            className="rounded-xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] px-4 py-3 flex items-start gap-3"
          >
            <span
              className="material-symbols-outlined text-[var(--pd-color-text-tertiary)] mt-0.5"
              aria-hidden="true"
            >
              {m.kind === 'pdf' ? 'picture_as_pdf' : m.kind === 'url' ? 'link' : 'edit_note'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--pd-color-text-primary)] truncate">{m.title}</p>
              <p className="mt-0.5 text-[11px] font-mono text-[var(--pd-color-text-tertiary)] truncate">{m.source}</p>
            </div>
            {m.kind === 'url' && (
              <a
                href={m.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[var(--pd-color-brand)] hover:underline shrink-0 mt-1"
              >
                打开
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function FlashcardsSection({ cardSet }: { cardSet: LearningFlashcardSet | null }) {
  if (!cardSet || cardSet.cards.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-[var(--pd-color-text-secondary)] mb-3">
          闪卡
        </h2>
        <div className="rounded-xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] px-4 py-6 text-center text-[var(--pd-color-text-tertiary)] text-xs">
          还没生成闪卡。在该项目会话中输入{' '}
          <code className="px-1.5 py-0.5 rounded bg-[var(--pd-color-surface-container-low)] font-mono">/learn from &lt;file&gt;</code>{' '}
          从文件提取。
        </div>
      </section>
    );
  }
  return (
    <section>
      <h2 className="text-sm font-semibold text-[var(--pd-color-text-secondary)] mb-3">
        闪卡 · {cardSet.cards.length}
      </h2>
      <ul className="space-y-2">
        {cardSet.cards.map((c) => (
          <FlashcardRow key={c.id} card={c} />
        ))}
      </ul>
    </section>
  );
}

function FlashcardRow({ card }: { card: FlashcardEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[var(--pd-color-surface-hover)] transition-colors"
      >
        <span className="material-symbols-outlined text-[var(--pd-color-text-tertiary)] mt-0.5 text-[18px]" aria-hidden="true">
          {open ? 'expand_more' : 'chevron_right'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--pd-color-text-primary)] line-clamp-2">{card.q}</p>
          <p className="mt-1 flex items-center gap-3 text-[10px] text-[var(--pd-color-text-tertiary)]">
            <span className="font-mono">#{card.id}</span>
            {card.nextReview && (
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]" aria-hidden="true">schedule</span>
                {card.nextReview}
              </span>
            )}
            {typeof card.difficulty === 'number' && (
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]" aria-hidden="true">speed</span>
                {card.difficulty.toFixed(2)}
              </span>
            )}
          </p>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 pt-0 border-t border-[var(--pd-color-outline-variant)]/15 bg-[var(--pd-color-surface-container-low)]/40">
          <p className="text-xs text-[var(--pd-color-text-secondary)] whitespace-pre-wrap leading-relaxed mt-3">
            {card.a || '(无答案)'}
          </p>
        </div>
      )}
    </li>
  );
}

function ReviewLogSection({ reviewLog }: { reviewLog: ReviewLogEntry[] }) {
  if (reviewLog.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-[var(--pd-color-text-secondary)] mb-3">
          复习记录
        </h2>
        <div className="rounded-xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] px-4 py-6 text-center text-[var(--pd-color-text-tertiary)] text-xs">
          还没有复习记录。在该项目会话中输入{' '}
          <code className="px-1.5 py-0.5 rounded bg-[var(--pd-color-surface-container-low)] font-mono">/learn review</code>{' '}
          开始第一次复习。
        </div>
      </section>
    );
  }

  // 按日期归组（最近 14 天）
  const buckets: Record<string, number> = {};
  for (const r of reviewLog) {
    const d = (r.at ?? '').slice(0, 10);
    if (!d) continue;
    buckets[d] = (buckets[d] ?? 0) + 1;
  }
  const sortedDays = Object.keys(buckets).sort().slice(-14);
  const maxCount = Math.max(1, ...Object.values(buckets));

  return (
    <section>
      <h2 className="text-sm font-semibold text-[var(--pd-color-text-secondary)] mb-3">
        最近复习记录 · {reviewLog.length} 次
      </h2>
      <div className="rounded-xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] p-4">
        {sortedDays.length === 0 ? (
          <p className="text-xs text-[var(--pd-color-text-tertiary)] text-center py-4">没有有效日期</p>
        ) : (
          <>
            <div className="flex items-end gap-1 h-16">
              {sortedDays.map((day) => {
                const count = buckets[day] ?? 0;
                const heightPct = 30 + (count / maxCount) * 70;
                return (
                  <div
                    key={day}
                    title={`${day} · ${count} 次`}
                    className="flex-1 rounded-t bg-[var(--pd-color-brand)]/40 hover:bg-[var(--pd-color-brand)] transition-colors min-w-[6px]"
                    style={{ height: `${heightPct}%` }}
                  />
                );
              })}
            </div>
            <p className="mt-2 text-[10px] text-[var(--pd-color-text-tertiary)] text-center">
              最近 {sortedDays.length} 天复习强度
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function CardStateSection({
  total,
  learning,
  dueCount,
}: {
  total: number;
  learning: number;
  dueCount: number;
}) {
  if (total === 0) return null;
  const newCount = Math.max(0, total - learning);
  // 已熟练 = 已 reviewed 且当前不到期
  const masteredCount = Math.max(0, learning - dueCount);
  return (
    <section>
      <h2 className="text-sm font-semibold text-[var(--pd-color-text-secondary)] mb-3">
        卡片状态分布
      </h2>
      <div className="grid grid-cols-3 gap-3">
        <StateChip label="新卡片" count={newCount} total={total} accent="brand" />
        <StateChip label="复习中" count={dueCount} total={total} accent="warning" />
        <StateChip label="已熟练" count={masteredCount} total={total} accent="success" />
      </div>
    </section>
  );
}

// ─── 子原子组件 ─────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string | number; accent?: 'warning' | 'brand' }) {
  const accentClass = accent === 'warning'
    ? 'text-[var(--pd-color-warning)]'
    : accent === 'brand'
    ? 'text-[var(--pd-color-brand)]'
    : 'text-[var(--pd-color-text-primary)]';
  return (
    <div className="rounded-xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] px-3 py-3">
      <span className={`material-symbols-outlined text-[18px] ${accentClass}`} aria-hidden="true">{icon}</span>
      <p className={`mt-1 text-xl font-bold tabular-nums ${accentClass}`} style={{ fontFamily: 'var(--pd-font-headline)' }}>
        {value}
      </p>
      <p className="text-[10px] text-[var(--pd-color-text-tertiary)] uppercase tracking-wider">{label}</p>
    </div>
  );
}

function StateChip({ label, count, total, accent }: { label: string; count: number; total: number; accent: 'brand' | 'warning' | 'success' }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const accentText =
    accent === 'brand'
      ? 'text-[var(--pd-color-brand)]'
      : accent === 'warning'
      ? 'text-[var(--pd-color-warning)]'
      : 'text-[var(--pd-color-success)]';
  const accentBg =
    accent === 'brand'
      ? 'bg-[var(--pd-color-brand)]'
      : accent === 'warning'
      ? 'bg-[var(--pd-color-warning)]'
      : 'bg-[var(--pd-color-success)]';
  return (
    <div className="rounded-xl border border-[var(--pd-color-border)]/60 bg-[var(--pd-color-surface)] px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-[var(--pd-color-text-secondary)]">{label}</span>
        <span className={`text-[10px] font-mono ${accentText}`}>{pct}%</span>
      </div>
      <p className={`mt-1 text-xl font-bold tabular-nums ${accentText}`} style={{ fontFamily: 'var(--pd-font-headline)' }}>
        {count}
      </p>
      <div className="mt-2 h-1 rounded-full bg-[var(--pd-color-surface-container-high)] overflow-hidden">
        <div className={`h-full rounded-full ${accentBg}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default PdLearningAssistant;
