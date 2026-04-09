// Input: 天气API/节日数据/用户活跃状态 + 阈值配置
// Output: 3 个 SmartCronTask（天气提醒/节日提醒/深夜关怀），触发时推送通知
// Pos: proactive/tasks/ 个人生活场景层，由 taskRegistry 注册并由调度器执行

import type { ProactiveTask } from '../taskRegistry.js'
import { getUserIdleSeconds } from '../platform.js'
import { getProactiveConfig, isScenarioEnabled } from '../proactiveConfig.js'
import { pushNotification } from '../../assistant/sense.js'
import { logForDebugging } from '../../utils/debug.js'

interface SmartCronTask extends ProactiveTask {
  priority: 'critical' | 'normal' | 'low'
  skipIf?: () => boolean
}

// ─── H1 天气变化提醒 ───

interface WeatherCondition {
  tempC: number
  weatherDesc: string
}

async function fetchWeather(): Promise<{ current: WeatherCondition; forecast: WeatherCondition[] } | null> {
  try {
    const resp = await fetch('https://wttr.in/?format=j1')
    if (!resp.ok) return null
    const data = await resp.json() as any
    const current = data.current_condition?.[0]
    if (!current) return null

    const forecastHours: WeatherCondition[] = []
    for (const day of (data.weather || [])) {
      for (const hour of (day.hourly || [])) {
        forecastHours.push({
          tempC: parseInt(hour.tempC, 10),
          weatherDesc: (hour.weatherDesc?.[0]?.value || '').toLowerCase(),
        })
      }
    }

    return {
      current: {
        tempC: parseInt(current.temp_C, 10),
        weatherDesc: (current.weatherDesc?.[0]?.value || '').toLowerCase(),
      },
      forecast: forecastHours,
    }
  } catch {
    return null
  }
}

const weatherAlert: SmartCronTask = {
  id: 'weather-alert',
  description: '天气变化提醒 · Weather change alert',
  cron: '0 7,20 * * *',
  priority: 'normal',
  condition: () => isScenarioEnabled('weather-alert'),
  enabled: true,
  action: async () => {
    try {
      const weather = await fetchWeather()
      if (!weather) {
        logForDebugging('[personalLife] weather-alert: 无法获取天气数据')
        return
      }

      const alerts: string[] = []

      // 检查未来温差
      if (weather.forecast.length > 0) {
        const temps = weather.forecast.map(f => f.tempC)
        const maxTemp = Math.max(...temps)
        const minTemp = Math.min(...temps)
        if (maxTemp - minTemp > 10) {
          alerts.push(`温差大（${minTemp}°C ~ ${maxTemp}°C），注意增减衣物`)
        }
      }

      // 检查极端天气
      const severeKeywords = ['thunderstorm', 'heavy rain', 'heavy snow', 'blizzard', 'storm', '暴雨', '暴雪', 'tornado', 'hurricane']
      const allDescs = [weather.current.weatherDesc, ...weather.forecast.map(f => f.weatherDesc)]
      for (const desc of allDescs) {
        if (severeKeywords.some(kw => desc.includes(kw))) {
          alerts.push(`预警：${desc}`)
          break
        }
      }

      if (alerts.length > 0) {
        pushNotification({
          type: 'warning',
          title: '🌤️ 天气提醒',
          body: `当前 ${weather.current.tempC}°C｜${alerts.join('；')}`,
          channel: 'system',
        })
        logForDebugging(`[personalLife] weather-alert: 告警触发 — ${alerts.join(', ')}`)
      }
    } catch (e) {
      logForDebugging(`[personalLife] weather-alert failed: ${(e as Error).message}`)
    }
  },
}

// ─── H2 节日/纪念日提醒 ───

interface DateEntry {
  month: number
  day: number
  name: string
}

// 内置公共节日（中国 + 国际）
const BUILTIN_HOLIDAYS: DateEntry[] = [
  // 中国节日
  { month: 1, day: 1, name: '元旦' },
  { month: 2, day: 14, name: '情人节' },
  { month: 3, day: 8, name: '国际妇女节' },
  { month: 4, day: 5, name: '清明节（约）' },
  { month: 5, day: 1, name: '国际劳动节' },
  { month: 5, day: 4, name: '青年节' },
  { month: 6, day: 1, name: '儿童节' },
  { month: 7, day: 1, name: '建党节' },
  { month: 8, day: 1, name: '建军节' },
  { month: 9, day: 10, name: '教师节' },
  { month: 10, day: 1, name: '国庆节' },
  { month: 12, day: 25, name: '圣诞节' },
  // 国际节日
  { month: 1, day: 26, name: '国际海关日' },
  { month: 3, day: 14, name: '白色情人节' },
  { month: 4, day: 1, name: '愚人节' },
  { month: 4, day: 22, name: '地球日' },
  { month: 5, day: 12, name: '母亲节（约）' },
  { month: 6, day: 16, name: '父亲节（约）' },
  { month: 10, day: 31, name: '万圣节' },
  { month: 11, day: 11, name: '双十一/光棍节' },
  { month: 12, day: 12, name: '双十二' },
  { month: 12, day: 31, name: '除夕夜' },
]

function loadUserDates(): DateEntry[] {
  try {
    const { readFileSync } = require('fs')
    const { join } = require('path')
    const { homedir } = require('os')
    const configPath = join(homedir(), '.pandacc', 'config', 'dates.json')
    const data = JSON.parse(readFileSync(configPath, 'utf-8'))
    if (!Array.isArray(data)) return []
    return data.filter((d: any) => d.month && d.day && d.name)
  } catch {
    return []
  }
}

function getUpcomingHolidays(daysAhead: number = 3): string[] {
  const allDates = [...BUILTIN_HOLIDAYS, ...loadUserDates()]
  const now = new Date()
  const results: string[] = []

  for (let offset = 0; offset <= daysAhead; offset++) {
    const target = new Date(now)
    target.setDate(target.getDate() + offset)
    const m = target.getMonth() + 1
    const d = target.getDate()

    for (const entry of allDates) {
      if (entry.month === m && entry.day === d) {
        const label = offset === 0 ? '今天' : offset === 1 ? '明天' : `${offset}天后`
        results.push(`${label}：${entry.name}（${m}/${d}）`)
      }
    }
  }
  return results
}

const holidayReminder: SmartCronTask = {
  id: 'holiday-reminder',
  description: '节日/纪念日提醒 · Holiday & anniversary reminder',
  cron: '0 8 * * *',
  priority: 'normal',
  condition: () => isScenarioEnabled('holiday-reminder'),
  enabled: true,
  action: async () => {
    try {
      const upcoming = getUpcomingHolidays(3)
      if (upcoming.length === 0) return

      pushNotification({
        type: 'info',
        title: '🎉 节日提醒',
        body: upcoming.join('；'),
        channel: 'system',
      })
      logForDebugging(`[personalLife] holiday-reminder: ${upcoming.length} 个节日提醒`)
    } catch (e) {
      logForDebugging(`[personalLife] holiday-reminder failed: ${(e as Error).message}`)
    }
  },
}

// ─── F3 深夜工作关怀 ───

const CARE_MESSAGES = [
  '夜深了，注意休息 🌙 身体是革命的本钱',
  '已经很晚了，明天继续吧 💤',
  '深夜工作效率不高哦，早点休息明天更有状态',
  '眼睛累了吧？站起来活动一下 🧘',
  '凌晨了还在工作？记得喝杯热水暖暖身子',
]

const lateNightCare: SmartCronTask = {
  id: 'late-night-care',
  description: '深夜工作关怀 · Late night care',
  cron: '*/30 22-23,0-5 * * *',
  priority: 'low',
  condition: () => isScenarioEnabled('late-night-care'),
  enabled: true,
  action: async () => {
    try {
      const config = getProactiveConfig()
      const now = new Date()
      const hour = now.getHours()

      // 检查是否在深夜时段
      const startHour = config.lateNightStartHour  // 默认 23
      const endHour = config.lateNightEndHour       // 默认 5

      let isLateNight = false
      if (startHour > endHour) {
        // 跨午夜：23:00 ~ 05:00
        isLateNight = hour >= startHour || hour < endHour
      } else {
        isLateNight = hour >= startHour && hour < endHour
      }

      if (!isLateNight) return

      // 检查用户是否活跃
      const idleSeconds = getUserIdleSeconds()
      if (idleSeconds >= 300) {
        // 用户已空闲超过 5 分钟，不打扰
        return
      }

      const msg = CARE_MESSAGES[Math.floor(Math.random() * CARE_MESSAGES.length)]
      pushNotification({
        type: 'info',
        title: '🌙 深夜关怀',
        body: msg,
        channel: 'system',
      })
      logForDebugging(`[personalLife] late-night-care: 关怀推送 — ${hour}:${String(now.getMinutes()).padStart(2, '0')}`)
    } catch (e) {
      logForDebugging(`[personalLife] late-night-care failed: ${(e as Error).message}`)
    }
  },
}

// ─── 导出 ───

export function getPersonalLifeTasks(): SmartCronTask[] {
  return [weatherAlert, holidayReminder, lateNightCare]
}
