import figures from 'figures';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import * as React from 'react';
import { Box, Text } from '../../ink.js';
import type { Step } from '../../projectOnboardingState.js';
import { t } from '../../utils/i18n.js';
import { formatCreditAmount, getCachedReferrerReward } from '../../services/api/referral.js';
import type { LogOption } from '../../types/logs.js';
import { getCwd } from '../../utils/cwd.js';
import { formatRelativeTimeAgo } from '../../utils/format.js';
import type { FeedConfig, FeedLine } from './Feed.js';
export function createRecentActivityFeed(activities: LogOption[]): FeedConfig {
  const lines: FeedLine[] = activities.map(log => {
    const time = formatRelativeTimeAgo(log.modified);
    const description = log.summary && log.summary !== 'No prompt' ? log.summary : log.firstPrompt;
    return {
      text: description || '',
      timestamp: time
    };
  });
  // 如果没有最近活动，尝试展示超级助手习惯记忆
  if (lines.length === 0) {
    try {
      const habitsPath = join(homedir(), '.pandacc', 'memory', 'procedural', 'habits.md')
      if (existsSync(habitsPath)) {
        const content = readFileSync(habitsPath, 'utf-8')
        const recentLines = content.split('\n')
          .filter(l => l.trim() && !l.startsWith('#'))
          .slice(-3)
          .map(l => ({ text: l.trim().slice(0, 50) }))
        if (recentLines.length > 0) lines.push(...recentLines)
      }
    } catch {}
  }
  return {
    title: t('Recent activity', '最近活动'),
    lines,
    footer: lines.length > 0 ? t('/resume for more', '/resume 查看更多') : undefined,
    emptyMessage: t('No recent activity', '暂无最近活动')
  };
}
export function createWhatsNewFeed(releaseNotes: string[]): FeedConfig {
  const lines: FeedLine[] = releaseNotes.map(note => {
    if (("external" as string) === 'ant') {
      const match = note.match(/^(\d+\s+\w+\s+ago)\s+(.+)$/);
      if (match) {
        return {
          timestamp: match[1],
          text: match[2] || ''
        };
      }
    }
    return {
      text: note
    };
  });
  // 如果没有 release notes，尝试展示超级助手画像摘要
  if (lines.length === 0) {
    try {
      const pandaccDir = join(homedir(), '.pandacc')
      const profilePaths = [
        join(pandaccDir, 'memory', 'semantic', 'profile.md'),
      ]
      for (const p of profilePaths) {
        if (existsSync(p)) {
          const content = readFileSync(p, 'utf-8')
          const profileLines = content.split('\n')
            .filter(l => l.trim() && !l.startsWith('---') && !l.startsWith('#'))
            .slice(0, 3)
            .map(l => ({ text: l.trim().slice(0, 60) }))
          if (profileLines.length > 0) {
            lines.push(...profileLines)
            break
          }
        }
      }
    } catch {}
  }
  const emptyMessage = ("external" as string) === 'ant' ? t('Unable to fetch latest commits', '无法获取最新提交') : t('Enable super assistant to show profile here', '启用超级助手后将在此展示个人画像');
  return {
    title: ("external" as string) === 'ant' ? t("What's new [Latest commits]", '最新动态 [最新提交]') : t("What's new", '最新动态'),
    lines,
    footer: lines.length > 0 ? t('/release-notes for more', '/release-notes 查看更多') : undefined,
    emptyMessage
  };
}
export function createProjectOnboardingFeed(steps: Step[]): FeedConfig {
  const enabledSteps = steps.filter(({
    isEnabled
  }) => isEnabled).sort((a, b) => Number(a.isComplete) - Number(b.isComplete));
  const lines: FeedLine[] = enabledSteps.map(({
    text,
    isComplete
  }) => {
    const checkmark = isComplete ? `${figures.tick} ` : '';
    return {
      text: `${checkmark}${text}`
    };
  });
  const warningText = getCwd() === homedir() ? 'Note: You have launched claude in your home directory. For the best experience, launch it in a project directory instead.' : undefined;
  if (warningText) {
    lines.push({
      text: warningText
    });
  }
  return {
    title: 'Tips for getting started',
    lines
  };
}
export function createGuestPassesFeed(): FeedConfig {
  const reward = getCachedReferrerReward();
  const subtitle = reward ? `Share Panda Code and earn ${formatCreditAmount(reward)} of extra usage` : 'Share Panda Code with friends';
  return {
    title: '3 guest passes',
    lines: [],
    customContent: {
      content: <>
          <Box marginY={1}>
            <Text color="claude">[✻] [✻] [✻]</Text>
          </Box>
          <Text dimColor>{subtitle}</Text>
        </>,
      width: 48
    },
    footer: '/passes'
  };
}
