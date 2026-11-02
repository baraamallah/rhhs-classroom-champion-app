export const SCHOOL_TIME_ZONE = "Asia/Beirut"

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SCHOOL_TIME_ZONE, year: "numeric", month: "numeric",
})
const offsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SCHOOL_TIME_ZONE, timeZoneName: "longOffset",
})

export function getSchoolMonth(now = new Date()) {
  const parts = monthFormatter.formatToParts(now)
  return {
    year: Number(parts.find((part) => part.type === "year")!.value),
    month: Number(parts.find((part) => part.type === "month")!.value),
  }
}

export function getSchoolMonthKey(now = new Date()) {
  const { year, month } = getSchoolMonth(now)
  return `${year}-${String(month).padStart(2, "0")}`
}

function schoolMidnight(year: number, month: number) {
  const midnight = Date.UTC(year, month - 1, 1)
  let instant = midnight
  // Resolve the offset at the target date, including daylight saving changes.
  for (let i = 0; i < 3; i++) {
    const offset = offsetFormatter.formatToParts(new Date(instant)).find((part) => part.type === "timeZoneName")!.value
    const match = offset.match(/GMT([+-])(\d{2}):(\d{2})/)
    const minutes = match ? (Number(match[2]) * 60 + Number(match[3])) * (match[1] === "+" ? 1 : -1) : 0
    instant = midnight - minutes * 60_000
  }
  return new Date(instant).toISOString()
}

export function getMonthPeriod(year: number, month: number) {
  if (!Number.isInteger(year) || year < 1000 || year > 9998 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid calendar month")
  }
  return {
    key: `${year}-${String(month).padStart(2, "0")}`,
    start: schoolMidnight(year, month),
    end: schoolMidnight(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1),
  }
}

export function getCurrentMonthPeriod(now = new Date()) {
  const { year, month } = getSchoolMonth(now)
  return { year, month, ...getMonthPeriod(year, month) }
}
