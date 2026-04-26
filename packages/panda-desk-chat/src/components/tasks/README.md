# tasks/

Scheduled-task UI subcomponents — split from `pages/ScheduledPage.tsx`.

| File | Role |
|---|---|
| `PdTaskList.tsx` | `<table>` shell with thead + tbody; maps to PdTaskRow |
| `PdTaskRow.tsx` | Single `<tr>` — name/schedule pill/last/next/actions + expanded log row |
| `PdTaskEmptyState.tsx` | Centered circle-icon empty view + CTA |
| `PdNewTaskModal.tsx` | Modal: name/desc/frequency/prompt/cwd form |
| `PdPromptEditor.tsx` | Bordered textarea (mono) + bottom toolbar with cwd input |
| `PdDayOfWeekPicker.tsx` | 7 round pills Mon→Sun for `specificDays` cron |

Once this folder's structure changes, please update me — like remarking territory.
