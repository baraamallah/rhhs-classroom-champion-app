import { getMonthPeriod, getSchoolMonth } from "./month-period"

export interface DisplayMonth { year: number; month: number }

export function validDisplayMonth(value: unknown): DisplayMonth | null {
  if (!value || typeof value !== "object") return null
  const { year, month } = value as DisplayMonth
  return Number.isInteger(year) && year >= 1000 && year <= 9998 && Number.isInteger(month) && month >= 1 && month <= 12
    ? { year, month } : null
}

/** Admin declarations and the public winners page use the same initial period. */
export function resolveCompetitionMonth(winnersMonth: unknown, leaderboardMonth: unknown, now = new Date()): DisplayMonth {
  return validDisplayMonth(winnersMonth) || validDisplayMonth(leaderboardMonth) || getSchoolMonth(now)
}

export function resolveLeaderboardScope(showMonthly: boolean, frozenMonth: unknown, currentMonth = getSchoolMonth()) {
  if (!showMonthly) return { includeArchives: true as const }
  const { year, month } = validDisplayMonth(frozenMonth) || currentMonth
  return { ...getMonthPeriod(year, month), includeArchives: true as const }
}
