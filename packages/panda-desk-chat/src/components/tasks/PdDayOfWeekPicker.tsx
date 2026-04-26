// Input: 已选 weekday 数组（0=Sun..6=Sat）+ onChange
// Output: Mon→Sun 7 个圆形 toggle pill（at-least-1 不能空选）
// Pos: components/tasks/ — PdNewTaskModal frequency=specificDays 子控件
//
// Source 1:1: cc-haha desktop/src/components/tasks/DayOfWeekPicker.tsx L1-57 (57 行)
//   panda 适配：var(--color-*) → var(--pd-color-*); useTranslation → t()
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { t } from '../../i18n';

type Props = {
  selected: number[];
  onChange: (days: number[]) => void;
};

// Display order: Mon(1) → Sun(0), matching Chinese convention
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const DAY_KEYS = [
  'newTask.daySun',
  'newTask.dayMon',
  'newTask.dayTue',
  'newTask.dayWed',
  'newTask.dayThu',
  'newTask.dayFri',
  'newTask.daySat',
] as const;

export function PdDayOfWeekPicker({ selected, onChange }: Props) {
  const toggle = (day: number) => {
    if (selected.includes(day)) {
      // Don't allow deselecting the last day
      if (selected.length <= 1) return;
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day]);
    }
  };

  return (
    <div className="flex gap-1.5">
      {DAY_ORDER.map((day) => {
        const isActive = selected.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            className={`
              w-8 h-8 rounded-full text-xs font-medium transition-colors
              ${isActive
                ? 'bg-[var(--pd-color-surface-selected)] text-[var(--pd-color-text-primary)] border border-[var(--pd-color-border-focus)]'
                : 'bg-[var(--pd-color-surface)] text-[var(--pd-color-text-tertiary)] border border-[var(--pd-color-border)] hover:bg-[var(--pd-color-surface-hover)]'
              }
            `}
          >
            {t(DAY_KEYS[day]!)}
          </button>
        );
      })}
    </div>
  );
}
