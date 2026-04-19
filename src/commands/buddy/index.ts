// Input:  /buddy 子命令字符串（show/hide/mute/unmute/info/state/wake/sleep/theme）+ globalConfig + AppState
// Output: 单一 LocalJSXCommand — display:'system' 文案；落盘 globalConfig.companion* 字段
// Pos:    A+B 项目精华 — 9 子命令实装；旧 5 文案 byte-equal 守护见 buddy.test.ts
//         v2.21.30 方向 A：theme 接 18 物种全集 + 旧 panda/redPanda/kungFuPanda alias
//         一旦本文件被修改，请同步更新头注释 + src/commands/buddy/README.md
import { feature } from 'bun:bundle'
import type { Command, LocalJSXCommandContext, LocalJSXCommandOnDone } from '../../types/command.js'
import { logEvent } from '../../services/analytics/index.js'

const buddy = {
  type: 'local-jsx',
  name: 'buddy',
  description: 'Toggle your coding companion buddy · 切换编程伙伴',
  isEnabled: () => { if (feature('BUDDY')) { return true } return false },
  get isHidden() {
    if (feature('BUDDY')) { return false }
    return true
  },
  argumentHint: '[show|hide|mute|unmute|info|state|wake|sleep|theme]',
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
          const info = [
            `Species: ${companion.species ?? 'unknown'}`,
            `Name: ${companion.name ?? 'unnamed'}`,
            companion.rarity ? `Rarity: ${companion.rarity}` : null,
          ]
            .filter(Boolean)
            .join('\n  ')
          onDone(`Your companion:\n  ${info}`, { display: 'system' })
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
          logEvent('tengu_buddy_state', { state: matched })
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
              logEvent('tengu_buddy_theme', {
                species: aliasMatched,
                alias: lowered,
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
          logEvent('tengu_buddy_theme', { species: matched })
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
