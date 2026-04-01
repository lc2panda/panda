export function getTimeSense() {
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isWorkHours = hour >= 9 && hour < 18 && !isWeekend
  const period =
    hour < 6
      ? 'late-night'
      : hour < 9
        ? 'morning'
        : hour < 12
          ? 'forenoon'
          : hour < 14
            ? 'afternoon-early'
            : hour < 18
              ? 'afternoon'
              : hour < 22
                ? 'evening'
                : 'night'

  return { hour, dayOfWeek, isWeekend, isWorkHours, period, timestamp: now.toISOString() }
}
