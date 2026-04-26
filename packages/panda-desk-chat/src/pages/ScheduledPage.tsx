// Input: nothing (consumes taskStore + uiStore directly via PdScheduledTasks)
// Output: thin wrapper exporting { ScheduledPage } that delegates to PdScheduledTasks
// Pos: Pages — uiStore.activeView === 'scheduled' 时 PdContentRouter 加载
//
// 历史：S9 之前 ScheduledPage 自带 header + 旧 onCreate/onRunNow 接口；
// S9 重写后采用 cc-haha 1:1 容器形态，所有渲染逻辑下沉到 PdScheduledTasks，
// 旧 PdTask* signature（onCreate/onRunNow/onToggle/onDelete + ScheduledTask[]）
// 升级为 cc-haha CronTask + taskStore actions。
//
// Source: cc-haha desktop/src/pages/ScheduledTasks.tsx 容器形态
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import type { FC } from 'react';
import { PdScheduledTasks } from './PdScheduledTasks';

export interface ScheduledPageProps {
  className?: string;
}

export const ScheduledPage: FC<ScheduledPageProps> = (_props) => {
  return <PdScheduledTasks />;
};

export default ScheduledPage;
