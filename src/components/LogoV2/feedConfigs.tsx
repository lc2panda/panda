import figures from 'figures';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Scan ~/.pandacc/projects/*/memory/ and return the most recently modified project path
function findLatestProjectMemoryFile(...segments: string[]): string | null {
  try {
    const projectsDir = join(homedir(), '.pandacc', 'projects')
    if (!existsSync(projectsDir)) return null
    const slugs = readdirSync(projectsDir).filter(d =>
      existsSync(join(projectsDir, d, 'memory', ...segments))
    )
    if (slugs.length === 0) return null
    // 选最近修改的项目
    let best = slugs[0]!
    let bestMtime = 0
    for (const s of slugs) {
      try {
        const st = require('fs').statSync(join(projectsDir, s, 'memory', ...segments))
        if (st.mtimeMs > bestMtime) { bestMtime = st.mtimeMs; best = s }
      } catch {}
    }
    return join(projectsDir, best, 'memory', ...segments)
  } catch { return null }
}
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
  // Newest first so welcome "Recent activity" shows latest session on top
  const ordered = [...activities].sort(
    (a, b) => b.modified.getTime() - a.modified.getTime(),
  )
  const lines: FeedLine[] = ordered.map(log => {
    const time = formatRelativeTimeAgo(log.modified);
    const description = log.summary && log.summary !== 'No prompt' ? log.summary : log.firstPrompt;
    return {
      text: description || '',
      timestamp: time
    };
  });
  // Empty activities → empty feed (emptyMessage). Do NOT fall back to
  // cross-project habits.md — that surfaces unrelated ISO tool_use lines
  // (e.g. 2026-04-11) as "Recent activity".
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
      const profilePath = findLatestProjectMemoryFile('semantic', 'profile.md')
      if (profilePath && existsSync(profilePath)) {
        const content = readFileSync(profilePath, 'utf-8')
        const profileLines = content.split('\n')
          .filter(l => l.trim() && !l.startsWith('---') && !l.startsWith('#') && !l.startsWith('name:') && !l.startsWith('description:') && !l.startsWith('type:'))
          .slice(0, 3)
          .map(l => ({ text: l.trim().slice(0, 60) }))
        if (profileLines.length > 0) lines.push(...profileLines)
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
  const subtitle = reward ? `Share Panda and earn ${formatCreditAmount(reward)} of extra usage` : 'Share Panda with friends';
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
