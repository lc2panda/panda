import type { LocalCommandCall } from '../../types/command.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
import { BUILTIN_PERSONAS } from '../../context.js'

export const call: LocalCommandCall = async (args) => {
  const config = getGlobalConfig()
  const arg = args.trim().toLowerCase()

  if (!arg) {
    const active = config.persona?.active
    if (!active) {
      return {
        type: 'text',
        value: `当前未设置 persona。可选：${Object.keys(BUILTIN_PERSONAS).join(', ')}`,
      }
    }
    const builtin = BUILTIN_PERSONAS[active]
    const custom = config.persona?.custom?.[active]
    const persona = custom || builtin
    return {
      type: 'text',
      value: `当前 persona：${active}（${persona?.name ?? active}）— ${persona?.style ?? '自定义'}`,
    }
  }

  if (arg === 'off' || arg === 'none') {
    saveGlobalConfig(current => ({
      ...current,
      persona: undefined,
    }))
    return { type: 'text', value: 'Persona 已关闭' }
  }

  const allKeys = [
    ...Object.keys(BUILTIN_PERSONAS),
    ...Object.keys(config.persona?.custom ?? {}),
  ]

  if (!allKeys.includes(arg)) {
    return {
      type: 'text',
      value: `未知 persona "${arg}"。可选：${allKeys.join(', ')}，或 off 关闭`,
    }
  }

  saveGlobalConfig(current => ({
    ...current,
    persona: {
      ...current.persona,
      active: arg,
    },
  }))

  const builtin = BUILTIN_PERSONAS[arg]
  const custom = config.persona?.custom?.[arg]
  const persona = custom || builtin
  return {
    type: 'text',
    value: `已切换到 ${persona?.name ?? arg}：${persona?.style ?? '自定义'}`,
  }
}
