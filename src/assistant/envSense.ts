import { freemem, totalmem, cpus, loadavg } from 'os'

export function getEnvSense() {
  const memFree = freemem()
  const memTotal = totalmem()
  const memUsedPct = Math.round((1 - memFree / memTotal) * 100)
  const cpuCount = cpus().length
  const load = loadavg()[0]
  const isIdle = load < cpuCount * 0.2

  return { memUsedPct, cpuCount, loadAvg: load, isIdle }
}
