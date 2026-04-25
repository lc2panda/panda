// Input: useI18n (t)
// Output: Keyboard shortcuts reference panel — grouped by category
// Pos: settings/ShortcutsTab — Shortcuts tab in SettingsPage
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { cn } from '../../lib/cn';

interface Shortcut {
  keys: string[];
  label: string;
  desc?: string;
}

interface ShortcutGroup {
  title: string;
  items: Shortcut[];
}

const isMac = typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform);
const Cmd = isMac ? '⌘' : 'Ctrl';
const Shift = isMac ? '⇧' : 'Shift';

export const ShortcutsTab: React.FC = () => {
  const { t: _t } = useI18n();

  const groups: ShortcutGroup[] = [
    {
      title: '全局',
      items: [
        { keys: [Cmd, 'K'], label: '命令面板', desc: '搜索并执行任何命令' },
        { keys: [Cmd, 'P'], label: '会话切换器', desc: '快速跳转到任意会话' },
        { keys: [Cmd, ','], label: '打开设置' },
      ],
    },
    {
      title: '会话',
      items: [
        { keys: [Cmd, 'N'], label: '新建对话' },
        { keys: [Cmd, Shift, 'N'], label: '新建窗口' },
        { keys: ['Enter'], label: '发送消息', desc: '在输入框中按 Enter 发送' },
        { keys: [Shift, 'Enter'], label: '换行', desc: '在消息中插入换行' },
      ],
    },
    {
      title: '视图',
      items: [
        { keys: [Cmd, 'B'], label: '切换侧边栏' },
        { keys: [Cmd, '\\'], label: '切换检查器' },
        { keys: [Cmd, ';'], label: '切换侧聊' },
      ],
    },
    {
      title: '编辑器',
      items: [
        { keys: ['/'], label: '斜杠命令', desc: '在输入框开头键入 / 触发' },
        { keys: ['@'], label: '提及文件', desc: '在输入框中键入 @ 选择文件' },
        { keys: ['Esc'], label: '关闭弹窗', desc: '关闭打开的弹窗或菜单' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[18px] font-[var(--pd-font-semibold)] text-[var(--pd-color-fg)]">键盘快捷键</h1>
        <p className="mt-1 text-[13px] text-[var(--pd-color-fg-muted)]">
          {isMac ? '在 Mac 上使用 ⌘（Command）；其他系统对应 Ctrl。' : '使用 Ctrl 作为修饰键。'}
        </p>
      </div>

      {groups.map((g) => (
        <section key={g.title} className="rounded-[12px] border border-[var(--pd-color-border)] overflow-hidden">
          <h2 className={cn(
            'px-4 py-2.5 text-[12px] font-[var(--pd-font-semibold)]',
            'text-[var(--pd-color-fg-muted)] bg-[var(--pd-color-bg-subtle)]',
            'border-b border-[var(--pd-color-border)]',
          )}>
            {g.title}
          </h2>
          <ul className="divide-y divide-[var(--pd-color-border-subtle)] list-none m-0 p-0">
            {g.items.map((s, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-[var(--pd-color-fg)]">{s.label}</div>
                  {s.desc && (
                    <div className="text-[11px] text-[var(--pd-color-fg-muted)] mt-0.5">{s.desc}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {s.keys.map((k, ki) => (
                    <React.Fragment key={ki}>
                      {ki > 0 && <span className="text-[10px] text-[var(--pd-color-fg-subtle)]">+</span>}
                      <kbd
                        className={cn(
                          'inline-flex items-center justify-center min-w-[24px] h-6 px-1.5',
                          'rounded-[4px] text-[11px] font-[var(--pd-font-medium)] font-[family-name:var(--pd-font-mono)]',
                          'bg-[var(--pd-color-bg-elevated)] text-[var(--pd-color-fg)]',
                          'border border-[var(--pd-color-border)] shadow-[0_1px_0_rgba(31,31,30,0.06)]',
                        )}
                      >
                        {k}
                      </kbd>
                    </React.Fragment>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
