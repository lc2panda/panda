/**
 * Input:  /usage 命令调用 onDone + LocalJSXCommandContext + args（可选 `cost` `stats` `usage`）
 * Output: 一个内含 3 个 tab 的统一 Pane（Usage / Cost / Stats），默认 tab 由 args 决定
 * Pos:    src/commands/usage/usage.tsx — 上游 v2.1.118 三命令合并入口的实现，
 *         配合 src/commands/cost/cost.ts 与 src/commands/stats/stats.tsx 的 thin shim。
 *
 * 设计要点：
 * - 不复用 Settings 组件（那是 /status /config /usage 体系），独立实现 3-tab 容器
 * - cost tab 渲染 cost-tracker 的文本（formatTotalCost）保持与原 /cost 输出 100% 等价
 * - stats tab 嵌入 <Stats onClose=noop /> 组件
 * - usage tab 渲染 <Usage /> Settings 子组件（plan limits 进度条）
 * - args 通过 thin shim 传入：'cost' | 'stats' | 'usage'，大小写不敏感，未识别回退 usage
 */
import * as React from 'react';
import { useState } from 'react';
import { Box, Text } from '../../ink.js';
import { Pane } from '../../components/design-system/Pane.js';
import { Tabs, Tab } from '../../components/design-system/Tabs.js';
import { Usage } from '../../components/Settings/Usage.js';
import { Stats } from '../../components/Stats.js';
import { formatTotalCost } from '../../cost-tracker.js';
import { currentLimits } from '../../services/claudeAiLimits.js';
import { isClaudeAISubscriber } from '../../utils/auth.js';
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
import { useKeybinding } from '../../keybindings/useKeybinding.js';
import { isZh } from '../../utils/i18n.js';
import type { LocalJSXCommandCall } from '../../types/command.js';

type TabKey = 'Usage' | 'Cost' | 'Stats';

/**
 * 解析 args（thin shim 传入），返回 default tab。
 * - 大小写不敏感
 * - 未识别 → 默认 'Usage'
 */
export function parseDefaultTab(args: string | undefined): TabKey {
  if (!args) return 'Usage';
  const v = args.trim().toLowerCase();
  if (v === 'cost') return 'Cost';
  if (v === 'stats') return 'Stats';
  return 'Usage';
}

type CostPanelProps = { onClose: () => void };

/**
 * Cost tab 内容 — 等价于原 /cost 命令的纯文本输出（formatTotalCost）+ 订阅用户提示
 */
function CostPanel({ onClose: _onClose }: CostPanelProps): React.ReactNode {
  const isSubscriber = isClaudeAISubscriber();
  let body: string;
  if (isSubscriber) {
    if (currentLimits.isUsingOverage) {
      body = isZh()
        ? '您当前正在使用 overage 额度运行 Panda。配额重置时将自动切换回订阅速率限制。'
        : 'You are currently using your overages to power your Panda usage. We will automatically switch you back to your subscription rate limits when they reset';
    } else {
      body = isZh()
        ? '您当前正在使用订阅额度运行 Panda。'
        : 'You are currently using your subscription to power your Panda usage';
    }
    if (process.env.USER_TYPE === 'ant') {
      body += `\n\n[ANT-ONLY] Showing cost anyway:\n ${formatTotalCost()}`;
    }
  } else {
    body = formatTotalCost();
  }
  return (
    <Box flexDirection="column">
      <Text>{body}</Text>
    </Box>
  );
}

type Props = {
  onClose: () => void;
  defaultTab: TabKey;
};

/**
 * 内部 component — 3-tab 容器
 * 与 Settings.tsx 同型：Pane > Tabs > Tab
 */
export function UnifiedUsage({ onClose, defaultTab }: Props): React.ReactNode {
  const [selectedTab, setSelectedTab] = useState<TabKey>(defaultTab);
  useExitOnCtrlCDWithKeybindings();
  useKeybinding(
    'confirm:no',
    () => {
      onClose();
    },
    { context: 'Settings', isActive: true },
  );
  // Stats 子组件 onClose 接收 (result?, options?) — 我们不希望它独立关闭统一容器，
  // 仅当用户在 Stats tab 内主动关闭时关闭整个 /usage。
  const handleStatsClose = (): void => {
    onClose();
  };
  return (
    <Pane color="permission">
      <Tabs
        color="permission"
        selectedTab={selectedTab}
        onTabChange={tabId => setSelectedTab(tabId as TabKey)}
      >
        <Tab key="usage" title={isZh() ? '用量' : 'Usage'}>
          <Usage />
        </Tab>
        <Tab key="cost" title={isZh() ? '花费' : 'Cost'}>
          <CostPanel onClose={onClose} />
        </Tab>
        <Tab key="stats" title={isZh() ? '统计' : 'Stats'}>
          <Stats onClose={handleStatsClose} />
        </Tab>
      </Tabs>
    </Pane>
  );
}

/**
 * /usage 命令入口 — 接受可选 args（'cost' | 'stats' | 'usage'）切换默认 tab。
 * 配合 cost/stats 命令的 thin shim 实现 3 入口共享同一组件。
 */
export const call: LocalJSXCommandCall = async (onDone, _context, args) => {
  const defaultTab = parseDefaultTab(args);
  const handleClose = (): void => {
    onDone(undefined, { display: 'skip' });
  };
  return <UnifiedUsage onClose={handleClose} defaultTab={defaultTab} />;
};
