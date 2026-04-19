// Input: 定时触发的知识/学习场景检查请求
// Output: 浏览器高频页面、书签、阅读列表、闪卡复习、RSS、知识回顾、学习统计、笔记汇总的主动推送通知
// Pos: proactive/tasks/ 知识学习场景层，由 taskRegistry 注册调度

import { pushNotification } from '../../assistant/sense.js'
// P3-T4-β: panda-on-desk 联动桥接（feature('BUDDY') 内 gate；on-desk 离线静默）
import {
  pushNotification as pushDeskNotification,
  bumpBadge as bumpDeskBadge,
  isOnDeskEnabled as isDeskOnDeskEnabled,
} from '../../desk/bridge.js'
import { getProactiveConfig, isScenarioEnabled } from '../proactiveConfig.js'
import { logForDebugging } from '../../utils/debug.js'
import { IS_MAC, IS_WIN, HOME } from '../platform.js'

interface SmartCronTask {
  id: string
  description: string
  cron: string
  priority: 'critical' | 'normal' | 'low'
  enabled: boolean
  condition?: () => boolean
  skipIf?: () => boolean
  action: () => Promise<void>
}

// ─── E1: 浏览器高频页面知识卡片 ───

const browserKnowledgeCards: SmartCronTask = {
  id: 'browser-knowledge-cards',
  description: '浏览器高频页面知识卡片 · Browser knowledge cards from frequent pages',
  cron: '0 20 * * 5',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('browser-knowledge-cards'),
  action: async () => {
    logForDebugging('[knowledgeScenarios] browser-knowledge-cards: scanning browser history')
    try {
      const { readBrowserHistory } = await import('../../memdir/memdir.js')
      const entries = await readBrowserHistory(7)

      if (!entries || entries.length === 0) {
        logForDebugging('[knowledgeScenarios] browser-knowledge-cards: 无浏览历史')
        return
      }

      // 按 URL 域名分组统计访问次数
      const urlCounts = new Map<string, { url: string; title: string; count: number }>()
      for (const entry of entries) {
        const visitCount = (entry as any).visit_count || 1
        if (visitCount <= 5) continue
        try {
          const domain = new URL(entry.url).hostname
          const existing = urlCounts.get(domain)
          if (existing) {
            existing.count += visitCount
          } else {
            urlCounts.set(domain, { url: entry.url, title: entry.title || domain, count: visitCount })
          }
        } catch {}
      }

      if (urlCounts.size === 0) {
        logForDebugging('[knowledgeScenarios] browser-knowledge-cards: 无高频页面（visit_count > 5）')
        return
      }

      const top5 = Array.from(urlCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      const detail = top5
        .map((p, i) => `  ${i + 1}. ${p.title}（${p.count} 次访问）`)
        .join('\n')

      pushNotification({
        type: 'info',
        title: '📚 高频页面知识卡片建议',
        body: `本周 Top 5 高频访问页面：\n${detail}\n\n建议为这些页面生成知识卡片，加深理解与记忆。`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 高频页面知识卡片 badge + overlay
      try {
        if (isDeskOnDeskEnabled()) {
          bumpDeskBadge('knowledge-browser-cards', 1)
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'knowledge-browser-cards',
            title: 'Panda · 知识卡片建议',
            body: `本周 Top ${top5.length} 高频访问页面`,
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[knowledgeScenarios] browser-knowledge-cards: ${top5.length} top pages found`)
    } catch (e) {
      logForDebugging(`[knowledgeScenarios] browser-knowledge-cards failed: ${(e as Error).message}`)
    }
  },
}

// ─── E2: 书签整理建议 ───

const bookmarkCleanup: SmartCronTask = {
  id: 'bookmark-cleanup',
  description: '书签整理建议 · Bookmark cleanup suggestion',
  cron: '0 10 * * 0',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('bookmark-cleanup'),
  action: async () => {
    logForDebugging('[knowledgeScenarios] bookmark-cleanup: checking Chrome bookmarks')
    try {
      const { readFileSync, existsSync } = require('fs')
      const { join } = require('path')

      let bookmarkPath: string
      if (IS_MAC) {
        bookmarkPath = join(HOME, 'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'Bookmarks')
      } else if (IS_WIN) {
        const localAppData = process.env.LOCALAPPDATA || join(HOME, 'AppData', 'Local')
        bookmarkPath = join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Bookmarks')
      } else {
        bookmarkPath = join(HOME, '.config', 'google-chrome', 'Default', 'Bookmarks')
      }

      if (!existsSync(bookmarkPath)) {
        logForDebugging('[knowledgeScenarios] bookmark-cleanup: Chrome Bookmarks 文件不存在')
        return
      }

      const raw = readFileSync(bookmarkPath, 'utf-8')
      const data = JSON.parse(raw)

      // 递归统计书签数量
      let totalCount = 0
      let folderCount = 0
      function countBookmarks(node: any): void {
        if (!node) return
        if (node.type === 'url') { totalCount++; return }
        if (node.type === 'folder') {
          folderCount++
          if (Array.isArray(node.children)) {
            for (const child of node.children) countBookmarks(child)
          }
        }
      }

      const roots = data.roots
      if (roots) {
        for (const key of Object.keys(roots)) {
          countBookmarks(roots[key])
        }
      }

      if (totalCount < 50) {
        logForDebugging(`[knowledgeScenarios] bookmark-cleanup: 书签数 ${totalCount}，无需整理`)
        return
      }

      pushNotification({
        type: 'info',
        title: '🔖 书签整理建议',
        body: `Chrome 书签共 ${totalCount} 条（${folderCount} 个文件夹）。\n建议定期清理失效链接、归类分组，保持书签库整洁。`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 书签整理 badge + overlay
      try {
        if (isDeskOnDeskEnabled()) {
          bumpDeskBadge('knowledge-bookmark-cleanup', 1)
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'knowledge-bookmark-cleanup',
            title: 'Panda · 书签整理',
            body: `Chrome 书签共 ${totalCount} 条`,
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[knowledgeScenarios] bookmark-cleanup: ${totalCount} bookmarks, ${folderCount} folders`)
    } catch (e) {
      logForDebugging(`[knowledgeScenarios] bookmark-cleanup failed: ${(e as Error).message}`)
    }
  },
}

// ─── E3: 阅读列表过长 ───

const readingListOverflow: SmartCronTask = {
  id: 'reading-list-overflow',
  description: '阅读列表过长提醒 · Reading list overflow alert',
  cron: '0 9 * * 1',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('reading-list-overflow'),
  action: async () => {
    logForDebugging('[knowledgeScenarios] reading-list-overflow: checking reading list')
    try {
      const { existsSync } = require('fs')
      const { execSync } = require('child_process')
      const { join } = require('path')

      let readingListCount = 0
      let source = ''

      // macOS Safari: 解析 Bookmarks.plist
      if (IS_MAC) {
        const plistPath = join(HOME, 'Library', 'Safari', 'Bookmarks.plist')
        if (existsSync(plistPath)) {
          try {
            // plutil 转 JSON 解析
            const json = execSync(`plutil -convert json -o - "${plistPath}" 2>/dev/null`, {
              encoding: 'utf-8',
              timeout: 10000,
            })
            const data = JSON.parse(json)

            function countReadingList(node: any): number {
              let count = 0
              if (node?.Title === 'com.apple.ReadingList' && Array.isArray(node.Children)) {
                return node.Children.length
              }
              if (Array.isArray(node?.Children)) {
                for (const child of node.Children) {
                  count += countReadingList(child)
                }
              }
              return count
            }

            readingListCount = countReadingList(data)
            source = 'Safari'
          } catch {
            logForDebugging('[knowledgeScenarios] reading-list-overflow: Safari plist 解析失败')
          }
        }
      }

      // Chrome ReadingList（各平台均可尝试）
      if (readingListCount === 0) {
        const chromeReadingListPath = IS_MAC
          ? join(HOME, 'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'ReadingList')
          : IS_WIN
            ? join(process.env.LOCALAPPDATA || join(HOME, 'AppData', 'Local'), 'Google', 'Chrome', 'User Data', 'Default', 'ReadingList')
            : join(HOME, '.config', 'google-chrome', 'Default', 'ReadingList')

        if (existsSync(chromeReadingListPath)) {
          try {
            const { readFileSync } = require('fs')
            const raw = readFileSync(chromeReadingListPath, 'utf-8')
            const data = JSON.parse(raw)
            // Chrome ReadingList JSON 格式: { entries: [...] } 或 { reading_list: {...} }
            if (data.entries && Array.isArray(data.entries)) {
              readingListCount = data.entries.length
            } else if (data.reading_list) {
              readingListCount = Object.keys(data.reading_list).length
            }
            source = 'Chrome'
          } catch {}
        }
      }

      if (readingListCount <= 30) {
        logForDebugging(`[knowledgeScenarios] reading-list-overflow: ${readingListCount} 项（${source || '未找到'}），未超阈值`)
        return
      }

      pushNotification({
        type: 'info',
        title: '📖 阅读列表过长',
        body: `${source} 阅读列表已有 ${readingListCount} 项，建议抽时间清理或安排阅读计划。`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 阅读列表过长 badge + overlay
      try {
        if (isDeskOnDeskEnabled()) {
          bumpDeskBadge('knowledge-reading-list', 1)
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'knowledge-reading-list',
            title: 'Panda · 阅读列表过长',
            body: `${source} 已有 ${readingListCount} 项`,
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[knowledgeScenarios] reading-list-overflow: ${readingListCount} items from ${source}`)
    } catch (e) {
      logForDebugging(`[knowledgeScenarios] reading-list-overflow failed: ${(e as Error).message}`)
    }
  },
}

// ─── E4: 闪卡复习提醒 ───

const flashcardReview: SmartCronTask = {
  id: 'flashcard-review',
  description: '闪卡复习提醒 · Flashcard review reminder',
  cron: '0 8 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('flashcard-review'),
  action: async () => {
    logForDebugging('[knowledgeScenarios] flashcard-review: checking due flashcards')
    try {
      const { existsSync, readFileSync, readdirSync } = require('fs')
      const { join } = require('path')

      const flashcardsDir = join(process.cwd(), 'working', 'flashcards')
      if (!existsSync(flashcardsDir)) {
        logForDebugging('[knowledgeScenarios] flashcard-review: working/flashcards/ 不存在')
        return
      }

      const reviewLogPath = join(flashcardsDir, '.review-log.json')
      let reviewLog: Record<string, { nextReview: string }> = {}
      if (existsSync(reviewLogPath)) {
        try {
          reviewLog = JSON.parse(readFileSync(reviewLogPath, 'utf-8'))
        } catch {}
      }

      // 扫描闪卡文件
      const files = readdirSync(flashcardsDir).filter((f: string) => f.endsWith('.md') || f.endsWith('.json'))
      const now = new Date()
      let dueCount = 0
      const dueCards: string[] = []

      for (const file of files) {
        const logEntry = reviewLog[file]
        if (logEntry?.nextReview) {
          const nextDate = new Date(logEntry.nextReview)
          if (nextDate <= now) {
            dueCount++
            if (dueCards.length < 5) dueCards.push(file)
          }
        } else {
          // 没有复习记录的卡片视为到期
          dueCount++
          if (dueCards.length < 5) dueCards.push(file)
        }
      }

      if (dueCount === 0) {
        logForDebugging('[knowledgeScenarios] flashcard-review: 无到期卡片')
        return
      }

      const detail = dueCards.map(c => `  • ${c}`).join('\n')
      const moreText = dueCount > 5 ? `\n  ... 及另外 ${dueCount - 5} 张` : ''

      pushNotification({
        type: 'info',
        title: '🃏 闪卡复习提醒',
        body: `有 ${dueCount} 张闪卡到期待复习：\n${detail}${moreText}\n\n运行 /learn review 开始复习。`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 闪卡复习 badge (按到期数) + overlay
      try {
        if (isDeskOnDeskEnabled()) {
          bumpDeskBadge('knowledge-flashcard-review', dueCount)
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'knowledge-flashcard-review',
            title: 'Panda · 闪卡复习',
            body: `${dueCount} 张闪卡到期待复习`,
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[knowledgeScenarios] flashcard-review: ${dueCount} due cards`)
    } catch (e) {
      logForDebugging(`[knowledgeScenarios] flashcard-review failed: ${(e as Error).message}`)
    }
  },
}

// ─── E5: RSS 摘要（占位） ───

const rssDigest: SmartCronTask = {
  id: 'rss-digest',
  description: 'RSS 订阅摘要 · RSS feed digest (placeholder)',
  cron: '0 7 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('rss-digest'),
  action: async () => {
    logForDebugging('[knowledgeScenarios] rss-digest: checking RSS config')
    try {
      const { existsSync, readFileSync } = require('fs')
      const { join } = require('path')

      const configPath = join(HOME, '.pandacc', 'config', 'rss-feeds.json')
      if (!existsSync(configPath)) {
        // 无配置 → 静默跳过
        logForDebugging('[knowledgeScenarios] rss-digest: rss-feeds.json 不存在，跳过')
        return
      }

      const config = JSON.parse(readFileSync(configPath, 'utf-8'))
      const feeds: Array<{ name: string; url: string }> = Array.isArray(config) ? config : config.feeds || []

      if (feeds.length === 0) {
        logForDebugging('[knowledgeScenarios] rss-digest: 无 feed 配置')
        return
      }

      // 尝试 fetch 各 feed，统计未读数
      let totalNew = 0
      const feedSummary: string[] = []

      for (const feed of feeds.slice(0, 10)) {
        try {
          const resp = await fetch(feed.url, { signal: AbortSignal.timeout(8000) })
          if (!resp.ok) continue
          const text = await resp.text()
          // 简单统计 <item> 或 <entry> 数量作为近似未读数
          const itemCount = (text.match(/<item[\s>]/gi) || text.match(/<entry[\s>]/gi) || []).length
          totalNew += itemCount
          feedSummary.push(`  • ${feed.name || feed.url}：${itemCount} 条`)
        } catch {}
      }

      if (totalNew === 0) {
        logForDebugging('[knowledgeScenarios] rss-digest: 无新条目')
        return
      }

      pushNotification({
        type: 'info',
        title: '📰 RSS 订阅摘要',
        body: `${feeds.length} 个订阅源共 ${totalNew} 条内容：\n${feedSummary.slice(0, 5).join('\n')}`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — RSS 摘要 badge + overlay
      try {
        if (isDeskOnDeskEnabled()) {
          bumpDeskBadge('knowledge-rss-digest', totalNew)
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'knowledge-rss-digest',
            title: 'Panda · RSS 摘要',
            body: `${feeds.length} 个订阅源共 ${totalNew} 条`,
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[knowledgeScenarios] rss-digest: ${totalNew} items from ${feeds.length} feeds`)
    } catch (e) {
      logForDebugging(`[knowledgeScenarios] rss-digest failed: ${(e as Error).message}`)
    }
  },
}

// ─── 知识回顾提醒 ───

const knowledgeReview: SmartCronTask = {
  id: 'knowledge-review',
  description: '知识卡片回顾提醒 · Knowledge card review reminder',
  cron: '0 10 * * *',
  priority: 'normal',
  enabled: true,
  condition: () => isScenarioEnabled('knowledge-review'),
  action: async () => {
    logForDebugging('[knowledgeScenarios] knowledge-review: scanning knowledge cards')
    try {
      const { existsSync, readdirSync, readFileSync } = require('fs')
      const { join } = require('path')

      const knowledgeDir = join(process.cwd(), 'memory', 'semantic', 'knowledge')
      if (!existsSync(knowledgeDir)) {
        logForDebugging('[knowledgeScenarios] knowledge-review: knowledge/ 目录不存在')
        return
      }

      const files = readdirSync(knowledgeDir).filter((f: string) => f.endsWith('.md'))
      const now = Date.now()
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
      const staleCards: string[] = []

      for (const file of files) {
        try {
          const content = readFileSync(join(knowledgeDir, file), 'utf-8')
          // 检查 frontmatter 中 lastAccessed 字段
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
          if (!frontmatterMatch) continue
          const lastAccessedMatch = frontmatterMatch[1].match(/lastAccessed:\s*(.+)/)
          if (!lastAccessedMatch) continue
          const lastAccessed = new Date(lastAccessedMatch[1].trim()).getTime()
          if (isNaN(lastAccessed)) continue
          if (now - lastAccessed > sevenDaysMs) {
            staleCards.push(file.replace(/\.md$/, ''))
          }
        } catch {}
      }

      if (staleCards.length === 0) {
        logForDebugging('[knowledgeScenarios] knowledge-review: 无需回顾的卡片')
        return
      }

      const detail = staleCards.slice(0, 8).map(c => `  • ${c}`).join('\n')
      const moreText = staleCards.length > 8 ? `\n  ... 另有 ${staleCards.length - 8} 张` : ''

      pushNotification({
        type: 'info',
        title: '🧠 知识回顾提醒',
        body: `${staleCards.length} 张知识卡片超过 7 天未回顾：\n${detail}${moreText}\n\n定期回顾有助于长期记忆巩固。`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 知识卡片回顾 badge + overlay
      try {
        if (isDeskOnDeskEnabled()) {
          bumpDeskBadge('knowledge-card-review', staleCards.length)
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'knowledge-card-review',
            title: 'Panda · 知识回顾',
            body: `${staleCards.length} 张卡片超 7 天未回顾`,
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[knowledgeScenarios] knowledge-review: ${staleCards.length} stale cards`)
    } catch (e) {
      logForDebugging(`[knowledgeScenarios] knowledge-review failed: ${(e as Error).message}`)
    }
  },
}

// ─── 学习时间统计 ───

const learningTimeStats: SmartCronTask = {
  id: 'learning-time-stats',
  description: '学习时间周统计 · Weekly learning time statistics',
  cron: '0 18 * * 5',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('learning-time-stats'),
  action: async () => {
    logForDebugging('[knowledgeScenarios] learning-time-stats: analyzing weekly learning')
    try {
      const { existsSync, readFileSync } = require('fs')
      const { join } = require('path')

      const habitsPath = join(process.cwd(), 'memory', 'habits.md')
      if (!existsSync(habitsPath)) {
        logForDebugging('[knowledgeScenarios] learning-time-stats: habits.md 不存在')
        return
      }

      const content = readFileSync(habitsPath, 'utf-8')
      const lines = content.split('\n')

      // 提取本周学习相关行为记录
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const learningKeywords = ['learn', 'study', 'read', 'review', '学习', '阅读', '复习', '研究', 'flashcard']

      let learningEntries = 0
      let totalMinutes = 0

      for (const line of lines) {
        // 匹配日期格式 YYYY-MM-DD
        const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/)
        if (!dateMatch) continue
        const lineDate = new Date(dateMatch[1])
        if (lineDate < weekAgo || lineDate > now) continue

        const isLearning = learningKeywords.some(kw => line.toLowerCase().includes(kw))
        if (!isLearning) continue

        learningEntries++
        // 尝试提取时长（如 "30min" "1h" "45分钟"）
        const minMatch = line.match(/(\d+)\s*(?:min|分钟)/)
        const hourMatch = line.match(/(\d+)\s*(?:h|小时|hour)/)
        if (minMatch) totalMinutes += parseInt(minMatch[1], 10)
        if (hourMatch) totalMinutes += parseInt(hourMatch[1], 10) * 60
      }

      if (learningEntries === 0) {
        logForDebugging('[knowledgeScenarios] learning-time-stats: 本周无学习记录')
        return
      }

      const hours = Math.floor(totalMinutes / 60)
      const mins = totalMinutes % 60
      const timeStr = totalMinutes > 0
        ? `约 ${hours > 0 ? hours + ' 小时 ' : ''}${mins > 0 ? mins + ' 分钟' : ''}`
        : `${learningEntries} 条记录（未提取到具体时长）`

      pushNotification({
        type: 'info',
        title: '📊 本周学习统计',
        body: `本周学习活动 ${learningEntries} 次，总时长 ${timeStr}。\n\n持续学习，保持成长！`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 学习时间统计 badge + overlay
      try {
        if (isDeskOnDeskEnabled()) {
          bumpDeskBadge('knowledge-learning-stats', 1)
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'knowledge-learning-stats',
            title: 'Panda · 本周学习统计',
            body: `${learningEntries} 次活动 / ${timeStr}`,
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[knowledgeScenarios] learning-time-stats: ${learningEntries} entries, ${totalMinutes} min`)
    } catch (e) {
      logForDebugging(`[knowledgeScenarios] learning-time-stats failed: ${(e as Error).message}`)
    }
  },
}

// ─── 笔记跨应用汇总 ───

const notesDigest: SmartCronTask = {
  id: 'notes-digest',
  description: '笔记跨应用汇总 · Cross-app notes digest',
  cron: '0 21 * * *',
  priority: 'low',
  enabled: true,
  condition: () => isScenarioEnabled('notes-digest'),
  action: async () => {
    logForDebugging('[knowledgeScenarios] notes-digest: fetching recent Apple Notes')
    try {
      const { readAppleNotes } = await import('../../memdir/memdir.js')
      const notes = await readAppleNotes(10)

      if (!notes || notes.length === 0) {
        logForDebugging('[knowledgeScenarios] notes-digest: 无新笔记')
        return
      }

      const detail = notes
        .slice(0, 5)
        .map((n: any, i: number) => `  ${i + 1}. ${n.title || '无标题'}`)
        .join('\n')

      const moreText = notes.length > 5 ? `\n  ... 共 ${notes.length} 条` : ''

      pushNotification({
        type: 'info',
        title: '📝 笔记汇总',
        body: `最近笔记：\n${detail}${moreText}\n\n建议整理到工作记忆中，便于后续检索。`,
        channel: 'system',
      })
      // why: P3-T4-β panda-on-desk 联动 — 笔记跨应用汇总 badge + overlay
      try {
        if (isDeskOnDeskEnabled()) {
          bumpDeskBadge('knowledge-notes-digest', notes.length)
          pushDeskNotification({
            kind: 'overlay',
            level: 'info',
            scenarioId: 'knowledge-notes-digest',
            title: 'Panda · 笔记汇总',
            body: `最近 ${notes.length} 条笔记`,
          })
        }
      } catch {
        // 桥接失败不阻塞 proactive 主路径
      }

      logForDebugging(`[knowledgeScenarios] notes-digest: ${notes.length} notes found`)
    } catch (e) {
      logForDebugging(`[knowledgeScenarios] notes-digest failed: ${(e as Error).message}`)
    }
  },
}

// ─── 导出 ───

export function getKnowledgeTasks(): SmartCronTask[] {
  return [
    browserKnowledgeCards,
    bookmarkCleanup,
    readingListOverflow,
    flashcardReview,
    rssDigest,
    knowledgeReview,
    learningTimeStats,
    notesDigest,
  ]
}
