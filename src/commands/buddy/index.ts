// Input:  /buddy 子命令字符串（show/hide/mute/unmute/info/state/wake/sleep/theme/stats/milestones/desk/leaderboard）+ globalConfig + AppState
// Output: 单一 LocalJSXCommand — display:'system' 文案；落盘 globalConfig.companion* 字段
// Pos:    A+B 项目精华 — 13 子命令实装；旧 9 文案 byte-equal 守护见 buddy.test.ts
//         v2.21.30 方向 A：theme 接 18 物种全集 + 旧 panda/redPanda/kungFuPanda alias
//         Phase 0 P0-T5（agent-γ）：新增 stats / milestones 子命令；info 兼容追加 Level/XP/Unlocks
//         W16-T2（agent-β）：新增 desk 子命令（status/start/stop/restart/logs）— CLI 可见桌面端连接状态
//         W18-T4（agent-δ）：stats 升级（8 级精细进度条 + XP/min 速率 + 🔥 streak）
//             + 新增 stats history（30 天 bar chart）+ leaderboard 占位（本地不联网）
//         W19-T3（agent-γ）：desk logs 加 --follow/-f（tail -f 实时跟随）+ desk stop 触发 markUserQuit
//         一旦本文件被修改，请同步更新头注释 + src/commands/buddy/README.md
import { feature } from 'bun:bundle'
import type { Command, LocalJSXCommandContext, LocalJSXCommandOnDone } from '../../types/command.js'
import { logEvent } from '../../services/analytics/index.js'

// W16-T2：/buddy desk 运行时长格式化 — ms → "12m 34s" / "2h 14m 06s"
// why 纯函数：便于单测断言；0ms 显示 "0s"；<1 分钟只显示秒
export function formatUptime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0s'
  const totalSec = Math.floor(ms / 1_000)
  const h = Math.floor(totalSec / 3_600)
  const m = Math.floor((totalSec % 3_600) / 60)
  const s = totalSec % 60
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
  }
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`
  return `${s}s`
}

const buddy = {
  type: 'local-jsx',
  name: 'buddy',
  description: 'Toggle your coding companion buddy · 切换编程伙伴',
  isEnabled: () => { if (feature('BUDDY')) { return true } return false },
  get isHidden() {
    if (feature('BUDDY')) { return false }
    return true
  },
  argumentHint: '[show|hide|mute|unmute|info|state|wake|sleep|theme|stats|milestones|desk|leaderboard]',
  immediate: true,
  load: () =>
    Promise.resolve({
      async call(
        onDone: LocalJSXCommandOnDone,
        context: LocalJSXCommandContext,
        args: string,
      ): Promise<React.ReactNode> {
        const { getGlobalConfig, saveGlobalConfig } = await import(
          '../../utils/config.js'
        )
        const subcommand = args.trim().toLowerCase()
        const config = getGlobalConfig()
        // D4 P5-T1：拆分 head + tail 支持 'state <name>' / 'theme <species>' 带参子命令
        // why: 旧 5 子命令仅做精确字符串匹配，head 单独抽出后旧分支判断 byte-equal 不变
        const trimmed = args.trim()
        const firstSpace = trimmed.indexOf(' ')
        const head =
          firstSpace === -1
            ? trimmed.toLowerCase()
            : trimmed.slice(0, firstSpace).toLowerCase()
        const tail = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1).trim()

        if (subcommand === 'info') {
          let companion = config.companion
          if (!companion) {
            const { roll, companionUserId } = await import('../../buddy/companion.js')
            const { bones } = roll(companionUserId())
            const defaultCompanion = { name: bones.species ?? 'Panda', ...bones, hatchedAt: Date.now() }
            saveGlobalConfig(prev => ({ ...prev, companion: defaultCompanion }))
            companion = defaultCompanion
          }
          // why 旧 3 行 byte-equal：保留原来的 Species/Name/Rarity 三行格式，仅追加 Level/XP/Unlocks
          // grep 守护：buddy.test.ts 的 info 用例 toMatch /^Your companion:\n {2}Species: panda/
          //   + toContain('Name: Bamboo') + toContain('Rarity: rare')
          const lines: (string | null)[] = [
            `Species: ${companion.species ?? 'unknown'}`,
            `Name: ${companion.name ?? 'unnamed'}`,
            companion.rarity ? `Rarity: ${companion.rarity}` : null,
          ]
          // Phase 0 P0-T5：追加 Level/XP/Unlocks
          // why 不查 feature gate：getCurrentLevel/getCurrentXP/getEffectiveRarity 等是纯函数（无 React），
          //   bun test 也跑通；feature gate 仅守 React hook 与 saveStats 持久化路径，CLI 路径无需短路
          try {
            const { getCurrentLevel, getCurrentXP, getEffectiveRarity, getUnlockedStates } =
              await import('../../buddy/petXP.js')
            const { MAX_LEVEL, PETSTATE_UNLOCK_LEVEL } = await import(
              '../../buddy/types.js'
            )
            const lv = getCurrentLevel()
            const xp = getCurrentXP()
            const eff = getEffectiveRarity(companion.rarity ?? 'common')
            const states = getUnlockedStates()
            const totalStates = Object.keys(PETSTATE_UNLOCK_LEVEL).length
            lines.push(`Level: ${lv} / ${MAX_LEVEL}`)
            lines.push(
              `XP: ${xp.total} (today ${xp.today}, ${xp.pctToNext}% to next)`,
            )
            lines.push(`Effective rarity: ${eff}`)
            lines.push(`Unlocks: ${states.length} / ${totalStates} states`)
          } catch (e) {
            // why warn-not-throw: petXP 读盘失败也不应卡 /buddy info 旧路径
            const msg = e instanceof Error ? e.message : String(e)
            console.warn(`[panda] /buddy info progression read failed: ${msg}`)
          }
          const info = lines.filter(Boolean).join('\n  ')
          onDone(`Your companion:\n  ${info}`, { display: 'system' })
          return null
        }

        // Phase 0 P0-T5：/buddy stats — 全量养成进度面板
        // why 单独子命令：info 保 byte-equal 旧 3 行 + 4 新行；stats 是"展开"视图含进度条 + 里程碑摘要
        // why 不查 feature gate：仅调用 petXP 纯函数，无 React hook；与 info 同源策略
        // W18-T4：head=stats 支持带参（stats history）走 statsViz renderDailyBars
        if (head === 'stats') {
          const sub = tail.toLowerCase()
          const {
            getCurrentLevel,
            getCurrentXP,
            getEffectiveRarity,
            getUnlockedStates,
            getCompletedMilestones,
            getShinyEarned,
          } = await import('../../buddy/petXP.js')
          const { loadStats } = await import('../../buddy/petStats.js')
          const {
            MAX_LEVEL,
            MILESTONES,
            MILESTONE_XP,
            EPIC_MILESTONE_XP_THRESHOLD,
            PETSTATE_UNLOCK_LEVEL,
            LEVEL_RARITY_THRESHOLDS,
            SHINY_EPIC_MILESTONE_COUNT,
            xpRequiredForLevel,
          } = await import('../../buddy/types.js')
          const viz = await import('./statsViz.js')

          // ─── /buddy stats history — 30 天 bar chart + 升级点标记 ───────────
          if (sub === 'history') {
            const statsRaw = loadStats()
            const bars = viz.renderDailyBars(
              viz.aggregateDailyXp(statsRaw.history, 30),
            )
            // 提取升级事件 — 附在 bar chart 下方作为时间线
            const levelUps = statsRaw.history
              .filter(ev => ev.event === 'level_up')
              .slice(-5) // 最近 5 次升级
            const now = Date.now()
            const xpInfo = getCurrentXP()
            const lv = getCurrentLevel()
            const lines = [
              'Companion XP · 最近 30 天',
              `  ${bars}  (${statsRaw.xp.total} total XP)`,
              '',
            ]
            if (levelUps.length > 0) {
              lines.push('Recent level-ups:')
              for (const ev of levelUps) {
                const daysAgo = Math.max(
                  0,
                  Math.floor((now - ev.ts) / 86_400_000),
                )
                const when = daysAgo === 0 ? 'today' : `${daysAgo}d ago`
                lines.push(`  Lv ${ev.to}  ${when.padStart(8)}  ← upgrade`)
              }
              lines.push('')
            }
            lines.push(
              `Today:   Lv ${lv} → ${xpInfo.pctToNext}% to next (${xpInfo.today} XP today)`,
            )
            onDone(lines.join('\n'), { display: 'system' })
            return null
          }

          // ─── /buddy stats（默认）— 进度面板 ───────────────────────────────
          if (sub !== '' && sub !== 'stats') {
            // stats 下未知子命令 — 给 Usage 不阻塞
            onDone('Usage: /buddy stats [history]', { display: 'system' })
            return null
          }

          const lv = getCurrentLevel()
          const xpInfo = getCurrentXP()
          const companion = config.companion
          const bonesRarity = companion?.rarity ?? 'common'
          const eff = getEffectiveRarity(bonesRarity)
          const states = getUnlockedStates()
          const totalStates = Object.keys(PETSTATE_UNLOCK_LEVEL).length
          const completed = getCompletedMilestones()
          const shiny = getShinyEarned()
          const statsRaw = loadStats()

          // 进度条（W18-T4 升级：8 级精细 unicode block ▏▎▍▌▋▊▉█）
          const required = xpRequiredForLevel(lv)
          const intoLevel = required === Infinity ? 0 : required - xpInfo.toNextLevel
          const bar = viz.renderFineBar(xpInfo.pctToNext, 10)

          // W18-T4：XP/min 速率（最近 24h 平均）
          const xpPerMin = viz.computeXpPerMin(statsRaw)

          // W18-T4：streak 🔥 可视化
          const streakFire = viz.renderStreakFire(statsRaw.streak.current)

          // 下一档稀有度跃迁提示
          // why scan thresholds: LEVEL_RARITY_THRESHOLDS 已 frozen，按顺序找首个 lv < threshold
          let nextRarityHint = ''
          for (const t of LEVEL_RARITY_THRESHOLDS) {
            if (lv < t.level) {
              nextRarityHint = ` (auto-upgrade at Lv ${t.level} → ${t.rarity})`
              break
            }
          }

          // shiny 进度（epic 里程碑 = XP ≥ EPIC_MILESTONE_XP_THRESHOLD）
          const epicCount = completed.filter(
            id => (MILESTONE_XP[id] ?? 0) >= EPIC_MILESTONE_XP_THRESHOLD,
          ).length
          const shinyHint = shiny
            ? 'Yes'
            : `No (${epicCount}/${SHINY_EPIC_MILESTONE_COUNT} epic milestones to unlock)`

          // W22-T2：mini-pet 当前状态（idle 默认 face；desk 启动时提示已隐藏避免重复）
          // why import here：避免顶部模块 cycle（MiniPet 反向依赖 desk/bridge）；
          //   /buddy stats 是冷路径，dynamic import 无性能影响。
          const miniPetMod = await import('../../buddy/MiniPet.js')
          const miniPetFace = miniPetMod.pickAnimatedFace('idle', 0)
          const deskRunning = miniPetMod.isDeskRunning()
          const miniPetStatus = viz.renderMiniPetStatus(miniPetFace, deskRunning)

          // 里程碑摘要：完成数 + 前几条；详细列表交给 /buddy milestones
          const headerLines = [
            'Companion Progression',
            `  Level:    ${lv} / ${MAX_LEVEL}`,
            `  XP:       ${intoLevel} / ${required === Infinity ? '∞' : required}  (${xpInfo.pctToNext}%)`,
            `  [${bar}] ${xpInfo.pctToNext}%`,
            `  Total XP: ${xpInfo.total}`,
            `  Today:    ${xpInfo.today} XP  (~${xpPerMin} XP/min last 24h)`,
            `  Streak:   ${streakFire}`,
            `  Rarity:   ${eff}${nextRarityHint}`,
            `  Shiny:    ${shinyHint}`,
            `  Unlocked: ${states.join(', ')} (${states.length}/${totalStates} states)`,
            `  ${miniPetStatus}`,
            '',
            `Milestones (${completed.length}/${MILESTONES.length} completed)`,
          ]
          const completedSet = new Set(completed)
          const milestoneLines = MILESTONES.map(id => {
            if (completedSet.has(id)) {
              return `  ✓ ${id}`
            }
            return `  □ ${id}                    (pending)`
          })
          onDone([...headerLines, ...milestoneLines].join('\n'), {
            display: 'system',
          })
          return null
        }

        // Phase 0 P0-T5：/buddy milestones — 详细 13 行清单（每条带 hint）
        // why 不查 feature gate：仅调用 petXP 纯函数；与 stats / info 同源策略
        if (subcommand === 'milestones') {
          const { getCompletedMilestones } = await import('../../buddy/petXP.js')
          const { MILESTONES, MILESTONE_XP } = await import(
            '../../buddy/types.js'
          )
          const completed = new Set(getCompletedMilestones())
          // 每个 milestone 的解锁 hint（怎么得）
          // why 表内置：解锁条件是用户文档级别契约，应该集中维护；信号源由 agent-β 接入
          const HINTS: Record<typeof MILESTONES[number], string> = {
            first_1m_tokens: 'cumulative 1M tokens used',
            first_100_commits: '100 git commits authored',
            streak_7: 'use Panda 7 consecutive days',
            streak_30: 'use Panda 30 consecutive days',
            first_deepdream: 'first deepdream session',
            first_fix_bug: 'first /fix-bug invocation',
            first_pr_merged: 'first PR merged via Panda',
            first_skill_created: 'create your first skill',
            epic_marathon_4h: 'a single 4h coding marathon',
            midnight_owl: 'work past midnight (00:00-04:00)',
            lv_10: 'reach Lv 10',
            lv_25: 'reach Lv 25',
            lv_50: 'reach Lv 50',
          }
          const lines: string[] = [
            `Milestones (${completed.size}/${MILESTONES.length} completed)`,
          ]
          for (const id of MILESTONES) {
            const mark = completed.has(id) ? '✓' : '□'
            const xp = MILESTONE_XP[id] ?? 0
            const hint = HINTS[id]
            lines.push(`  ${mark} ${id}  [+${xp} XP]  — ${hint}`)
          }
          onDone(lines.join('\n'), { display: 'system' })
          return null
        }

        // W18-T4：/buddy leaderboard — 本地占位（绝不联网/上传）
        // why local-only：task 明确"不接网络 / 不上传"；展示"You vs 建议目标"定位是激励而非竞争
        if (subcommand === 'leaderboard') {
          const { getCurrentLevel, getCurrentXP } = await import(
            '../../buddy/petXP.js'
          )
          const { MAX_LEVEL, totalXpForLevel } = await import(
            '../../buddy/types.js'
          )
          const viz = await import('./statsViz.js')
          const lv = getCurrentLevel()
          const xp = getCurrentXP()
          const rows = viz.buildLocalLeaderboard(
            lv,
            xp.total,
            totalXpForLevel,
            MAX_LEVEL,
          )
          onDone(viz.renderLeaderboard(rows), { display: 'system' })
          return null
        }

        // W16-T2：/buddy desk — 桌面端连接状态 + 5 子命令（status / start / stop / restart / logs）
        // why: 让用户从 CLI 直接看到 panda-on-desk 是否运行、端口、运行时长、stats
        //      status 是默认（/buddy desk 不带参）；其余 4 子命令走 head=desk + tail 分发
        if (head === 'desk') {
          const sub = tail.toLowerCase()
          if (sub === '' || sub === 'status') {
            // W19-T1：新增 getConnectionStatus — 暴露 ready/connecting/disconnected 三态
            const { getRuntimeSnapshot, fetchDetailedHealth, getConnectionStatus } = await import(
              '../../desk/bridge.js'
            )
            const runtime = getRuntimeSnapshot()
            if (!runtime) {
              onDone(
                'panda-on-desk · 桌面宠物\n  Status: ❌ Not Running\n  Conn:   disconnected\n  Hint:   跑 `panda --install-desk` 启用桌面宠物',
                { display: 'system' },
              )
              return null
            }
            const health = await fetchDetailedHealth(1_500)
            if (!health) {
              // runtime.json 存在但 /health 不通 — 进程可能 stale
              onDone(
                `panda-on-desk · 桌面宠物\n  Status: ⚠️  Stale (runtime.json 存在但 /health 不通 — PID ${runtime.pid} 可能已退出)\n  Conn:   disconnected\n  Port:   ${runtime.port}\n  Hint:   /buddy desk restart 清理并重启`,
                { display: 'system' },
              )
              return null
            }
            // W19-T1：三态连接（ready/connecting/disconnected）— 自动重连期间会短暂 connecting → ready
            const conn = getConnectionStatus()
            const connIcon = conn === 'ready' ? '🟢' : conn === 'connecting' ? '🟡' : '🔴'
            const uptime = formatUptime(health.uptimeMs)
            const lines = [
              'panda-on-desk · 桌面宠物',
              `  Status:     ✅ Running (PID ${health.pid})`,
              `  Conn:       ${connIcon} ${conn}`,
              `  Port:       ${runtime.port}`,
              `  Uptime:     ${uptime}`,
              `  Version:    ${health.appVersion ?? 'unknown'}`,
              `  Electron:   ${health.electronVersion ?? 'unknown'}`,
              '  Logs:       ~/.pandacc/panda-on-desk.log',
              '  Stats:',
              `    Events processed: ${health.eventsProcessed ?? 0}`,
              `    Notifications:    ${health.notifications ?? 0}`,
              `    Errors:           ${health.errors ?? 0}`,
            ]
            onDone(lines.join('\n'), { display: 'system' })
            return null
          }

          if (sub === 'start') {
            const { getRuntimeSnapshot, fetchDetailedHealth } = await import(
              '../../desk/bridge.js'
            )
            // 已经在跑 — 避免重复 spawn
            if (getRuntimeSnapshot()) {
              const h = await fetchDetailedHealth(1_000)
              if (h) {
                onDone(
                  `panda-on-desk 已在运行 (PID ${h.pid}, port ${getRuntimeSnapshot()?.port}). 用 /buddy desk status 查看详情.`,
                  { display: 'system' },
                )
                return null
              }
            }
            // spawn（复用 maybeSpawnOnDesk 路径；重置幂等标志以便 CLI 强制拉起）
            const { maybeSpawnOnDesk, __resetSpawnedFlagForTesting } = await import(
              '../../desk/launcher.js'
            )
            __resetSpawnedFlagForTesting()
            maybeSpawnOnDesk({ defer: false })
            onDone(
              'panda-on-desk 已启动. 几秒后跑 /buddy desk status 确认运行状态.',
              { display: 'system' },
            )
            return null
          }

          if (sub === 'stop') {
            const { getRuntimeSnapshot, sendDeskQuit } = await import(
              '../../desk/bridge.js'
            )
            const runtime = getRuntimeSnapshot()
            if (!runtime) {
              onDone('panda-on-desk 未在运行.', { display: 'system' })
              return null
            }
            // W19-T3：标记用户主动 quit — launcher 的 child.on('exit') 监听器据此跳过自动重启
            try {
              const { markUserQuit } = await import('../../desk/launcher.js')
              markUserQuit()
            } catch {
              /* 测试夹具未 mock markUserQuit 时静默 — 非阻塞 */
            }
            const ok = await sendDeskQuit(1_500)
            onDone(
              ok
                ? `panda-on-desk 已停止 (PID ${runtime.pid}).`
                : `panda-on-desk 停止请求失败 — on-desk 可能已离线或鉴权失败 (PID ${runtime.pid}).`,
              { display: 'system' },
            )
            return null
          }

          if (sub === 'restart') {
            const { getRuntimeSnapshot, sendDeskQuit } = await import(
              '../../desk/bridge.js'
            )
            const runtime = getRuntimeSnapshot()
            if (runtime) {
              await sendDeskQuit(1_500)
              // 等待 bridge close unlink runtime.json — 给 on-desk 1s 走 before-quit
              await new Promise<void>(resolve => setTimeout(resolve, 1_000))
            }
            const { maybeSpawnOnDesk, __resetSpawnedFlagForTesting } = await import(
              '../../desk/launcher.js'
            )
            __resetSpawnedFlagForTesting()
            maybeSpawnOnDesk({ defer: false })
            onDone(
              'panda-on-desk 重启请求已发出. 几秒后跑 /buddy desk status 确认.',
              { display: 'system' },
            )
            return null
          }

          // W16-T2 logs（默认 tail 20）+ W19-T3 logs --follow / -f（实时 tail）
          if (sub === 'logs' || sub.startsWith('logs')) {
            // tail 解析：'logs' / 'logs --follow' / 'logs -f'
            const logsArgs = sub === 'logs' ? [] : sub.slice(4).trim().split(/\s+/).filter(Boolean)
            const follow = logsArgs.includes('--follow') || logsArgs.includes('-f')
            const { existsSync, readFileSync, statSync, watchFile, unwatchFile } = await import('node:fs')
            const { join } = await import('node:path')
            const { getClaudeConfigHomeDir } = await import(
              '../../utils/envUtils.js'
            )
            const logPath = join(getClaudeConfigHomeDir(), 'panda-on-desk.log')
            if (!existsSync(logPath)) {
              onDone(
                `panda-on-desk 日志不存在: ${logPath}\n  Hint: panda-on-desk 可能从未启动，或 PANDA_CONFIG_DIR 被 ENV 覆盖.`,
                { display: 'system' },
              )
              return null
            }

            // ── follow 模式：tail -f 风格实时输出 ────────────────────────────
            // why fs.watchFile 而非 fs.watch：rotatedAppend 走 appendFileSync 写入，
            //   watchFile 的 stat 轮询对追加最稳；watch (inotify) 在某些 fs（如 Docker）
            //   不可靠。采样 250ms 平衡 CPU 与延迟。
            if (follow) {
              try {
                let lastSize = 0
                try {
                  lastSize = statSync(logPath).size
                } catch {
                  lastSize = 0
                }
                // 先打印 header + 末尾 20 行作为上下文
                const initialRaw = readFileSync(logPath, 'utf-8')
                const initialLines = initialRaw.split(/\r?\n/).filter(l => l.length > 0)
                const initialTail = initialLines.slice(-20).join('\n')
                const followHeader = `panda-on-desk 日志（实时 tail · ${logPath}）:\n${initialTail}\n--- following (Ctrl+C 退出) ---`
                onDone(followHeader, { display: 'system' })

                // 注册 watcher — 每次 size 变大时读取增量并 process.stderr.write
                // why: 命令式终端 follow 无法走 onDone 多次回调（display:system 只渲染一次）；
                //   增量直写 stderr 是最稳的 tail -f 行为；用户 Ctrl+C 中断 panda 主进程时
                //   bun runtime 会清理 watcher，无需手动 unwatch。
                const onChange = (curr: { size: number }, _prev: { size: number }) => {
                  try {
                    if (curr.size > lastSize) {
                      const fs = require('node:fs') as typeof import('node:fs')
                      const fd = fs.openSync(logPath, 'r')
                      try {
                        const buf = Buffer.alloc(curr.size - lastSize)
                        fs.readSync(fd, buf, 0, buf.length, lastSize)
                        process.stderr.write(buf.toString('utf-8'))
                      } finally {
                        fs.closeSync(fd)
                      }
                      lastSize = curr.size
                    } else if (curr.size < lastSize) {
                      // log-rotate 触发文件被截断/轮换 — 重置 offset
                      lastSize = curr.size
                    }
                  } catch {
                    // 单次读取失败不停 watcher
                  }
                }
                watchFile(logPath, { interval: 250 }, onChange)
                // 注册 SIGINT 清理 — 防止 process 残留 watcher
                const cleanup = () => {
                  try { unwatchFile(logPath, onChange) } catch {}
                }
                process.once('SIGINT', cleanup)
                process.once('exit', cleanup)
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e)
                onDone(`panda-on-desk 日志 follow 失败: ${msg}`, { display: 'system' })
              }
              return null
            }

            // ── 非 follow 模式：tail -20（W16-T2 旧路径，byte-equal 守护） ──
            try {
              const raw = readFileSync(logPath, 'utf-8')
              // why -20: 日志按 rotatedAppend 追加，最后 20 行即最新事件
              const lines = raw.split(/\r?\n/).filter(l => l.length > 0)
              const tail20 = lines.slice(-20).join('\n')
              const header = `panda-on-desk 日志（最新 ${Math.min(
                20,
                lines.length,
              )} / 共 ${lines.length} 行 · ${logPath}）:`
              onDone(
                tail20.length > 0 ? `${header}\n${tail20}` : `${header}\n(空)`,
                { display: 'system' },
              )
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e)
              onDone(`panda-on-desk 日志读取失败: ${msg}`, { display: 'system' })
            }
            return null
          }

          // 未知子命令 — Usage（W19-T3 追加 logs --follow 用法）
          onDone(
            'Usage: /buddy desk [status|start|stop|restart|logs [--follow|-f]]',
            { display: 'system' },
          )
          return null
        }

        if (subcommand === 'mute') {
          saveGlobalConfig(prev => ({ ...prev, companionMuted: true }))
          logEvent('tengu_buddy_muted', {})
          onDone('Companion muted. They will still be visible but stay quiet.', {
            display: 'system',
          })
          return null
        }

        if (subcommand === 'unmute') {
          saveGlobalConfig(prev => ({ ...prev, companionMuted: false }))
          logEvent('tengu_buddy_unmuted', {})
          onDone('Companion unmuted.', { display: 'system' })
          return null
        }

        if (subcommand === 'hide') {
          context.setAppState(prev => ({
            ...prev,
            companionVisible: false,
          }))
          logEvent('tengu_buddy_toggled', { enabled: false })
          onDone('Companion hidden.', { display: 'system' })
          return null
        }

        if (subcommand === 'show') {
          context.setAppState(prev => ({
            ...prev,
            companionVisible: true,
          }))
          logEvent('tengu_buddy_toggled', { enabled: true })
          onDone('Companion visible!', { display: 'system' })
          return null
        }

        // D4 P5-T1：手动覆盖 PetState（带 TTL，默认 ~5s 即 10 tick）
        // why: 命令落盘 globalConfig；hook 每 tick 重读 → 下一帧渲染层即生效
        if (head === 'state') {
          const { PET_STATES } = await import('../../buddy/types.js')
          const target = tail.toLowerCase()
          if (!target) {
            onDone(
              `Usage: /buddy state <${PET_STATES.join('|')}>`,
              { display: 'system' },
            )
            return null
          }
          const matched = PET_STATES.find(s => s === target)
          if (!matched) {
            onDone(
              `Unknown state: ${target}. Valid: ${PET_STATES.join(', ')}`,
              { display: 'system' },
            )
            return null
          }
          // why 5s TTL：与 ONE_SHOT_TTL_MS (2.5s) 略长，便于人眼观察 + 不锁死
          const FORCED_STATE_TTL_MS = 5_000
          saveGlobalConfig(prev => ({
            ...prev,
            companionForcedState: matched,
            companionForcedStateExpiresAt: Date.now() + FORCED_STATE_TTL_MS,
          }))
          // W10-T3: state 是枚举字符串，按 analytics 协议 cast 到 verified 字符串。
          logEvent('tengu_buddy_state', { state: matched as unknown as number })
          onDone(`Companion state forced to ${matched} for 5s.`, {
            display: 'system',
          })
          return null
        }

        // D4 P5-T1：强制唤醒 → 清 sleeping/dozing；写 forced=idle 短 TTL 让 idleMs 阈值兜底
        // why: 写 idle + 长 TTL 也行，但短 TTL 让 hook 自然走 lastInputAtMs 推进路径
        if (head === 'wake') {
          saveGlobalConfig(prev => ({
            ...prev,
            companionForcedState: 'idle',
            // 1s TTL：让 hook 下一帧拿到 idle 后立即透传 derived（已经被 reaction 刷新过 lastInputAt）
            companionForcedStateExpiresAt: Date.now() + 1_000,
          }))
          logEvent('tengu_buddy_wake', {})
          onDone('Companion is awake.', { display: 'system' })
          return null
        }

        // D4 P5-T1：强制 sleeping，长 TTL 让用户能持续观察
        if (head === 'sleep') {
          saveGlobalConfig(prev => ({
            ...prev,
            companionForcedState: 'sleeping',
            // 60s TTL：明显长于 SLEEPING_THRESHOLD_MS=60s 提示意图，到期后 hook 走 idle 阈值兜底
            companionForcedStateExpiresAt: Date.now() + 60_000,
          }))
          logEvent('tengu_buddy_sleep', {})
          onDone('Companion is sleeping.', { display: 'system' })
          return null
        }

        // v2.21.30 方向 A：theme 接 18 物种全集 + 旧 panda 系 alias 向后兼容
        // why: v2.21.27-29 panda/redPanda/kungFuPanda 实装因 5×12 ASCII 画布太小退役；
        //   旧命令 alias → 替代物种（panda→chonk 圆胖治愈系 / redPanda→cat 小型灵巧 /
        //   kungFuPanda→robot 机械武术），输出系统消息说明替代关系，避免用户惊讶。
        if (head === 'theme') {
          const { SPECIES } = await import('../../buddy/types.js')
          // 旧 panda 系 alias 表（key 全小写匹配）→ 替代物种
          const PANDA_ALIASES: Record<string, { target: string; reason: string }> = {
            panda: { target: 'chonk', reason: '圆胖治愈系替代' },
            redpanda: { target: 'cat', reason: '小型灵巧替代' },
            kungfupanda: { target: 'robot', reason: '机械武术替代' },
          }
          const target = tail
          if (!target) {
            onDone(
              `Usage: /buddy theme <${SPECIES.join('|')}>`,
              { display: 'system' },
            )
            return null
          }
          const lowered = target.toLowerCase()
          // 1) 先匹配旧 panda 系 alias（v2.21.27-29 用户向后兼容）
          const alias = PANDA_ALIASES[lowered]
          if (alias) {
            const aliasMatched = (SPECIES as readonly string[]).find(
              s => s === alias.target,
            ) as (typeof SPECIES)[number] | undefined
            if (aliasMatched) {
              saveGlobalConfig(prev => ({
                ...prev,
                companionForcedSpecies: aliasMatched,
              }))
              // W10-T3: species/alias 都是枚举字符串，cast 到 number 跳过 analytics 协议守卫
              logEvent('tengu_buddy_theme', {
                species: aliasMatched as unknown as number,
                alias: lowered as unknown as number,
              })
              onDone(
                `${target} 系物种已退役，已切到 ${aliasMatched} 替代物种（${alias.reason}）。`,
                { display: 'system' },
              )
              return null
            }
          }
          // 2) 18 物种全集匹配（大小写不敏感）
          const matched = (SPECIES as readonly string[]).find(
            s => s.toLowerCase() === lowered,
          ) as (typeof SPECIES)[number] | undefined
          if (!matched) {
            const current = config.companionForcedSpecies ?? config.companion?.name ?? 'unset'
            onDone(
              `Unknown species: ${target}. Valid: ${SPECIES.join(', ')}. Current forced: ${current}`,
              { display: 'system' },
            )
            return null
          }
          saveGlobalConfig(prev => ({
            ...prev,
            companionForcedSpecies: matched,
          }))
          // W10-T3: species 是枚举字符串
          logEvent('tengu_buddy_theme', { species: matched as unknown as number })
          onDone(`Companion theme set to ${matched}.`, { display: 'system' })
          return null
        }

        const isVisible = context.getAppState().companionVisible ?? false
        const newState = !isVisible

        context.setAppState(prev => ({
          ...prev,
          companionVisible: newState,
        }))

        logEvent('tengu_buddy_toggled', { enabled: newState })

        onDone(
          newState
            ? 'Companion enabled! Your coding buddy is now visible.'
            : 'Companion hidden. Run /buddy show to bring them back.',
          { display: 'system' },
        )
        return null
      },
    }),
} satisfies Command

export default buddy
