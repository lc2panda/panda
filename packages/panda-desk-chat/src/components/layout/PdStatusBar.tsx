// Input: model name, connection state
// Output: cc-haha 极简 StatusBar — 仅左侧空 / 右侧模型名
// Pos: 主区底部 36px 状态栏
//
// cc-haha 100% 对标重写：
//  - 删除：连接状态圆点+label / token count / 宠物点击
//  - 保留：model 名 + JetBrains Mono 11px / 36px height / border-top

import { cn } from '@/lib/cn';

export type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface PdStatusBarProps {
  model?: string;
  /** 保留 prop 供旧调用兼容，cc-haha 视觉中不显示 */
  tokenCount?: { input: number; output: number };
  connectionState?: ConnectionState;
}

export function PdStatusBar({ model }: PdStatusBarProps) {
  return (
    <div
      className={cn(
        'shrink-0 flex items-center justify-between',
        'h-[var(--pd-layout-statusbar-height)] px-4',
        'border-t border-[var(--pd-color-border)]',
        'bg-[var(--pd-color-bg-subtle)]',
        'text-[11px] text-[var(--pd-color-fg-muted)]',
        'font-[family-name:var(--pd-font-mono)] select-none',
      )}
    >
      <div />
      <div className="flex items-center">
        {model && <span className="text-[var(--pd-color-fg-tertiary)]">{model}</span>}
      </div>
    </div>
  );
}
