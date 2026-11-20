"use server"

import { revalidatePath } from "next/cache"
import { readEvaluationHistory } from "@/lib/evaluation-history"
import { createAdminClient } from "@/lib/supabase/server"
import { requireRoleAction } from "@/lib/auth/server"
import {
  format,
  isWeekend,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isPast,
  isFuture,
  subDays,
  max,
  min,
  isSameMonth,
} from "date-fns"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const STAFF_ROLES: Array<"super_admin" | "admin" | "supervisor" | "stats"> = [
  "super_admin",
  "admin",
  "supervisor",
  "stats",
]

function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  return Number.isFinite(Date.parse(`${value}T12:00:00.000Z`))
}

export interface CalendarException {
  id: string
  exception_date: string
  reason: string
  created_at?: string
}

export interface SchoolTermDates {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
}

export interface DailyClassroomStatus {
  id: string
  name: string
  grade: string
  division: string
  isEvaluatedToday: boolean
  todayScore?: number
  todayMaxScore?: number
  todayEvaluationId?: string
}

export interface MissedDayRecord {
  date: string
  missingClassroomIds: string[]
  missingClassrooms: Array<{ id: string; name: string; grade: string; division: string }>
}

export interface DayCalendarStatus {
  date: string
  dayNumber: number
  isCurrentMonth: boolean
  isWeekend: boolean
  isHoliday: boolean
  holidayReason?: string
  isToday: boolean
  isPast: boolean
  isFuture: boolean
  status: "completed" | "partial" | "missing" | "holiday" | "weekend" | "future" | "outside_term"
  evaluatedCount: number
  totalAssigned: number
}

export interface SupervisorDailyOverview {
  isTodayWorkingDay: boolean
  todayReason?: string
  todayPendingCount: number
  todayCompletedCount: number
  totalAssignedCount: number
  classrooms: DailyClassroomStatus[]
  missedDays: MissedDayRecord[]
  calendarDays: DayCalendarStatus[]
  monthLabel: string
  schoolStartDate: string
  schoolEndDate: string
}

async function requireAdminUser() {
  return requireRoleAction(["admin", "super_admin"], {
    deniedMessage: "Unauthorized: Admin access required",
  })
}

function getDefaultSchoolTermDates(): SchoolTermDates {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const startYear = currentMonth >= 8 ? currentYear : currentYear - 1
  const endYear = startYear + 1

  return {
    startDate: `${startYear}-09-01`,
    endDate: `${endYear}-06-30`,
  }
}

export async function getSchoolTermDates(): Promise<{ success: boolean; data: SchoolTermDates; error?: string }> {
  try {
    const supabase = await createAdminClient()
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["school_year_start_date", "school_year_end_date"])

    const defaults = getDefaultSchoolTermDates()
    let startDate = defaults.startDate
    let endDate = defaults.endDate

    if (settings) {
      settings.forEach((s: any) => {
        if (s.key === "school_year_start_date" && s.value) {
          startDate = typeof s.value === "string" ? s.value.replace(/"/g, "") : String(s.value)
        }
        if (s.key === "school_year_end_date" && s.value) {
          endDate = typeof s.value === "string" ? s.value.replace(/"/g, "") : String(s.value)
        }
      })
    }

    return { success: true, data: { startDate, endDate } }
  } catch {
    return { success: true, data: getDefaultSchoolTermDates() }
  }
}

export async function updateSchoolTermDates(
  startDate: string,
  endDate: string
): Promise<{ success: boolean; error?: string }> {
  const { error: authError, currentUser } = await requireAdminUser()
  if (authError || !currentUser) {
    return { success: false, error: authError }
  }

  try {
    if (!startDate || !endDate || !isValidDateString(startDate) || !isValidDateString(endDate)) {
      return { success: false, error: "Valid start date and end date (YYYY-MM-DD) are required." }
    }

    if (startDate >= endDate) {
      return { success: false, error: "School start date must be earlier than the school end date." }
    }

    const supabase = await createAdminClient()
    const nowIso = new Date().toISOString()

    const upsertRows = [
      {
        key: "school_year_start_date",
        value: startDate,
        description: "Academic year opening date for classroom evaluations",
        updated_at: nowIso,
        updated_by: currentUser.id,
      },
      {
        key: "school_year_end_date",
        value: endDate,
        description: "Academic year closing date for classroom evaluations",
        updated_at: nowIso,
        updated_by: currentUser.id,
      },
    ]

    const { error: upsertError } = await supabase
      .from("system_settings")
      .upsert(upsertRows, { onConflict: "key" })

    if (upsertError) throw upsertError

    revalidatePath("/admin")
    revalidatePath("/admin/calendar")
    revalidatePath("/supervisor")
    revalidatePath("/supervisor/evaluate")

    return { success: true }
  } catch (err: any) {
    console.error("[updateSchoolTermDates] Error:", err)
    return { success: false, error: err.message || "Failed to update school term dates" }
  }
}

export async function getCalendarExceptions(): Promise<{ success: boolean; data: CalendarException[]; error?: string }> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("school_calendar_exceptions")
      .select("id, exception_date, reason, created_at")
      .order("exception_date", { ascending: true })

    if (error) {
      if (error.code === "42P01") {
        return { success: true, data: [] }
      }
      return { success: false, data: [], error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (err: any) {
    return { success: false, data: [], error: err.message || "Failed to fetch calendar exceptions" }
  }
}

export async function toggleCalendarException(
  dateStr: string,
  reason = "School Off / Holiday"
): Promise<{ success: boolean; action?: "added" | "removed"; error?: string }> {
  const { error: authError, currentUser } = await requireAdminUser()
  if (authError || !currentUser) {
    return { success: false, error: authError }
  }

  const trimmedDate = typeof dateStr === "string" ? dateStr.trim() : ""
  if (!isValidDateString(trimmedDate)) {
    return { success: false, error: "Invalid date format (expected YYYY-MM-DD)." }
  }

  try {
    const supabase = await createAdminClient()

    const { data: existing } = await supabase
      .from("school_calendar_exceptions")
      .select("id")
      .eq("exception_date", trimmedDate)
      .maybeSingle()

    if (existing) {
      const { error: deleteError } = await supabase
        .from("school_calendar_exceptions")
        .delete()
        .eq("id", existing.id)

      if (deleteError) throw deleteError

      revalidatePath("/admin")
      revalidatePath("/admin/calendar")
      revalidatePath("/supervisor")
      return { success: true, action: "removed" }
    } else {
      const { error: insertError } = await supabase
        .from("school_calendar_exceptions")
        .insert({
          exception_date: trimmedDate,
          reason: reason.trim().slice(0, 200) || "Holiday / School Off",
          created_by: currentUser.id,
        })

      if (insertError) throw insertError

      revalidatePath("/admin")
      revalidatePath("/admin/calendar")
      revalidatePath("/supervisor")
      return { success: true, action: "added" }
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update calendar exception" }
  }
}

/**
 * Compute daily inspection status, missed working days, and monthly calendar for a supervisor.
 * Restricted to authenticated staff; supervisors are strictly scoped to their own ID.
 */
export async function getSupervisorDailyStatus(
  supervisorId: string,
  referenceDateStr?: string
): Promise<{ success: boolean; data?: SupervisorDailyOverview; error?: string }> {
  try {
    const { currentUser, error: authError } = await requireRoleAction(STAFF_ROLES, {
      deniedMessage: "Unauthorized: Staff access required",
    })
    if (authError || !currentUser) {
      return { success: false, error: authError || "Not authenticated" }
    }

    const effectiveSupervisorId =
      currentUser.role === "supervisor" ? currentUser.id : supervisorId || currentUser.id

    const supabase = await createAdminClient()
    const now = new Date()
    const todayStr = format(now, "yyyy-MM-dd")
    const refDate =
      referenceDateStr && isValidDateString(referenceDateStr.trim())
        ? parseISO(referenceDateStr.trim())
        : now

    // Fetch school term dates, assigned classrooms, and calendar exceptions in parallel
    const [termRes, { data: assignments, error: assignError }, { data: exceptions }] = await Promise.all([
      getSchoolTermDates(),
      supabase
        .from("classroom_supervisors")
        .select(`
          classroom_id,
          classrooms:classroom_id (
            id,
            name,
            grade,
            division,
            is_active
          )
        `)
        .eq("supervisor_id", effectiveSupervisorId),
      supabase.from("school_calendar_exceptions").select("exception_date, reason"),
    ])

    if (assignError) throw assignError

    const schoolStartDate = termRes.data.startDate
    const schoolEndDate = termRes.data.endDate
    const assignedClassrooms = (assignments || [])
      .map((a: any) => a.classrooms)
      .filter((c: any) => c && c.is_active)

    const exceptionMap = new Map((exceptions || []).map((e: any) => [e.exception_date, e.reason]))

    // Bound evaluation fetch strictly to the union of the visible calendar month, today, and 90-day scan window
    const parsedStart = parseISO(schoolStartDate)
    const parsedEnd = parseISO(schoolEndDate)
    const yesterday = subDays(now, 1)
    const scanLowerBound = max([parsedStart, subDays(now, 90)])
    const scanUpperBound = min([parsedEnd, yesterday])

    const monthStart = startOfMonth(refDate)
    const monthEnd = endOfMonth(refDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const fetchStart = format(max([parsedStart, min([scanLowerBound, calendarStart, now])]), "yyyy-MM-dd")
    const fetchEnd = format(min([parsedEnd, max([scanUpperBound, calendarEnd, now])]), "yyyy-MM-dd")

    const classroomIds = assignedClassrooms.map((c: any) => c.id)
    let evaluations: any[] = []

    if (classroomIds.length > 0 && fetchStart <= fetchEnd) {
      evaluations = await readEvaluationHistory(supabase, {
        classroomIds,
        start: `${fetchStart}T00:00:00.000Z`,
        end: `${fetchEnd}T23:59:59.999Z`,
        endInclusive: true,
        includeArchives: true,
        includeDetails: false,
        parallelTables: true,
      })
    }

    const evalMap = new Map<string, any>()
    evaluations.forEach((ev: any) => {
      const dateKey = format(parseISO(ev.evaluation_date), "yyyy-MM-dd")
      evalMap.set(`${ev.classroom_id}_${dateKey}`, ev)
    })

    const isTodayAWeekend = isWeekend(now)
    const todayHolidayReason = exceptionMap.get(todayStr)
    const isTodayBeforeStart = todayStr < schoolStartDate
    const isTodayAfterEnd = todayStr > schoolEndDate

    let todayReason: string | undefined = todayHolidayReason
    if (isTodayBeforeStart) {
      todayReason = "School Year Has Not Started Yet"
    } else if (isTodayAfterEnd) {
      todayReason = "School Year Ended (Summer Break)"
    }

    const isTodayWorkingDay =
      !isTodayAWeekend && !todayHolidayReason && !isTodayBeforeStart && !isTodayAfterEnd

    const classroomStatusList: DailyClassroomStatus[] = assignedClassrooms.map((room: any) => {
      const todayEval = evalMap.get(`${room.id}_${todayStr}`)
      return {
        id: room.id,
        name: room.name,
        grade: room.grade,
        division: room.division || "",
        isEvaluatedToday: !!todayEval,
        todayScore: todayEval?.total_score,
        todayMaxScore: todayEval?.max_score,
        todayEvaluationId: todayEval?.id,
      }
    })

    const todayCompletedCount = classroomStatusList.filter((c) => c.isEvaluatedToday).length
    const todayPendingCount = isTodayWorkingDay ? classroomStatusList.length - todayCompletedCount : 0

    const missedDays: MissedDayRecord[] = []

    if (assignedClassrooms.length > 0 && scanLowerBound <= scanUpperBound) {
      const intervalDays = eachDayOfInterval({ start: scanLowerBound, end: scanUpperBound })

      for (const pastDay of intervalDays) {
        const dateKey = format(pastDay, "yyyy-MM-dd")
        if (isWeekend(pastDay)) continue
        if (exceptionMap.has(dateKey)) continue

        const missingRooms = assignedClassrooms.filter((room: any) => !evalMap.has(`${room.id}_${dateKey}`))

        if (missingRooms.length > 0) {
          missedDays.push({
            date: dateKey,
            missingClassroomIds: missingRooms.map((r: any) => r.id),
            missingClassrooms: missingRooms.map((r: any) => ({
              id: r.id,
              name: r.name,
              grade: r.grade,
              division: r.division || "",
            })),
          })
        }
      }
    }

    missedDays.sort((a, b) => b.date.localeCompare(a.date))

    const daysInGrid = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const calendarDays: DayCalendarStatus[] = daysInGrid.map((day) => {
      const dateKey = format(day, "yyyy-MM-dd")
      const isCurrentMonth = isSameMonth(day, refDate)
      const dayIsWeekend = isWeekend(day)
      const holidayReason = exceptionMap.get(dateKey)
      const dayIsHoliday = !!holidayReason
      const dayIsToday = dateKey === todayStr
      const dayIsPast = isPast(day) && !dayIsToday
      const dayIsFuture = isFuture(day) && !dayIsToday

      const isBeforeTerm = dateKey < schoolStartDate
      const isAfterTerm = dateKey > schoolEndDate
      const isOutsideTerm = isBeforeTerm || isAfterTerm

      let evaluatedCount = 0
      if (assignedClassrooms.length > 0) {
        assignedClassrooms.forEach((room: any) => {
          if (evalMap.has(`${room.id}_${dateKey}`)) {
            evaluatedCount++
          }
        })
      }

      let status: DayCalendarStatus["status"] = "future"

      if (isOutsideTerm) {
        status = "outside_term"
      } else if (dayIsWeekend) {
        status = "weekend"
      } else if (dayIsHoliday) {
        status = "holiday"
      } else if (dayIsFuture) {
        status = "future"
      } else if (evaluatedCount === assignedClassrooms.length && assignedClassrooms.length > 0) {
        status = "completed"
      } else if (evaluatedCount > 0) {
        status = "partial"
      } else {
        status = dayIsToday ? (assignedClassrooms.length === 0 ? "completed" : "partial") : "missing"
      }

      return {
        date: dateKey,
        dayNumber: day.getDate(),
        isCurrentMonth,
        isWeekend: dayIsWeekend,
        isHoliday: dayIsHoliday,
        holidayReason: isBeforeTerm
          ? "Before School Year"
          : isAfterTerm
            ? "Summer Break"
            : holidayReason,
        isToday: dayIsToday,
        isPast: dayIsPast,
        isFuture: dayIsFuture,
        status,
        evaluatedCount,
        totalAssigned: assignedClassrooms.length,
      }
    })

    return {
      success: true,
      data: {
        isTodayWorkingDay,
        todayReason,
        todayPendingCount,
        todayCompletedCount,
        totalAssignedCount: assignedClassrooms.length,
        classrooms: classroomStatusList,
        missedDays,
        calendarDays,
        monthLabel: format(refDate, "MMMM yyyy"),
        schoolStartDate,
        schoolEndDate,
      },
    }
  } catch (err: any) {
    console.error("[getSupervisorDailyStatus] Error:", err)
    return { success: false, error: err.message || "Failed to calculate daily inspection status" }
  }
}

export interface DateClassroomStatus {
  id: string
  name: string
  grade: string
  division: string
  isEvaluated: boolean
  score?: number
  maxScore?: number
  evaluationId?: string
  supervisorName?: string
  evaluatedAt?: string
}

export interface DateEvaluationOverview {
  date: string
  isWorkingDay: boolean
  isToday: boolean
  isPast: boolean
  isFuture: boolean
  isWeekend: boolean
  isHoliday: boolean
  holidayReason?: string
  isBeforeTerm: boolean
  isAfterTerm: boolean
  totalAssigned: number
  completedCount: number
  pendingCount: number
  classrooms: DateClassroomStatus[]
  missedDays: MissedDayRecord[]
  schoolStartDate: string
  schoolEndDate: string
}

/**
 * Fetch evaluation overview for a specific date (today or a backfill date).
 * Restricted to authenticated staff; supervisors are strictly scoped to their own ID.
 */
export async function getDateClassroomEvaluationOverview(
  dateStr: string,
  supervisorId?: string
): Promise<{ success: boolean; data?: DateEvaluationOverview; error?: string }> {
  try {
    const { currentUser, error: authError } = await requireRoleAction(STAFF_ROLES, {
      deniedMessage: "Unauthorized: Staff access required",
    })
    if (authError || !currentUser) {
      return { success: false, error: authError || "Not authenticated" }
    }

    const targetDate = typeof dateStr === "string" ? dateStr.trim() : ""
    if (!isValidDateString(targetDate)) {
      return { success: false, error: "Invalid date format (expected YYYY-MM-DD)." }
    }

    const effectiveSupervisorId =
      currentUser.role === "supervisor" ? currentUser.id : supervisorId

    const supabase = await createAdminClient()
    const now = new Date()
    const todayStr = format(now, "yyyy-MM-dd")
    const parsedTarget = parseISO(targetDate)

    // Parallel initial reads: term dates, calendar exceptions, and supervisor assignments
    const [termRes, { data: exceptions }, assignmentsResult] = await Promise.all([
      getSchoolTermDates(),
      supabase.from("school_calendar_exceptions").select("exception_date, reason"),
      effectiveSupervisorId
        ? supabase
            .from("classroom_supervisors")
            .select(`
              classroom_id,
              classrooms:classroom_id (
                id,
                name,
                grade,
                division,
                is_active
              )
            `)
            .eq("supervisor_id", effectiveSupervisorId)
        : Promise.resolve({ data: null, error: null }),
    ])

    if (assignmentsResult.error) throw assignmentsResult.error

    const schoolStartDate = termRes.data.startDate
    const schoolEndDate = termRes.data.endDate
    const exceptionMap = new Map((exceptions || []).map((e: any) => [e.exception_date, e.reason]))

    let assignedClassrooms: any[] = (assignmentsResult.data || [])
      .map((a: any) => a.classrooms)
      .filter((c: any) => c && c.is_active)

    if (assignedClassrooms.length === 0) {
      const { data: allRooms, error: roomError } = await supabase
        .from("classrooms")
        .select("id, name, grade, division, is_active")
        .eq("is_active", true)
        .order("name")

      if (roomError) throw roomError
      assignedClassrooms = allRooms || []
    }

    const dayIsWeekend = isWeekend(parsedTarget)
    const holidayReason = exceptionMap.get(targetDate)
    const dayIsHoliday = !!holidayReason
    const dayIsToday = targetDate === todayStr
    const dayIsPast = targetDate < todayStr
    const dayIsFuture = targetDate > todayStr
    const isBeforeTerm = targetDate < schoolStartDate
    const isAfterTerm = targetDate > schoolEndDate

    let effectiveReason = holidayReason
    if (isBeforeTerm) effectiveReason = "Before Academic School Year"
    else if (isAfterTerm) effectiveReason = "School Year Ended (Break)"

    const isWorkingDay = !dayIsWeekend && !holidayReason && !isBeforeTerm && !isAfterTerm

    // Single unified history query covering both targetDate and the 60-day missed-days scan window
    const parsedStart = parseISO(schoolStartDate)
    const parsedEnd = parseISO(schoolEndDate)
    const yesterday = subDays(now, 1)
    const scanLowerBound = max([parsedStart, subDays(now, 60)])
    const scanUpperBound = min([parsedEnd, yesterday])

    const classroomIds = assignedClassrooms.map((c: any) => c.id)
    const evalMap = new Map<string, any>()
    const intervalEvalMap = new Set<string>()

    if (classroomIds.length > 0) {
      const rangeStart = format(min([parsedTarget, scanLowerBound]), "yyyy-MM-dd")
      const rangeEnd = format(max([parsedTarget, scanUpperBound]), "yyyy-MM-dd")

      const allRangeEvals = await readEvaluationHistory(supabase, {
        classroomIds,
        start: `${rangeStart}T00:00:00.000Z`,
        end: `${rangeEnd}T23:59:59.999Z`,
        endInclusive: true,
        includeArchives: true,
        parallelTables: true,
      })

      for (const ev of allRangeEvals) {
        const dStr = format(parseISO(ev.evaluation_date), "yyyy-MM-dd")
        intervalEvalMap.add(`${ev.classroom_id}_${dStr}`)
        if (dStr === targetDate && !evalMap.has(ev.classroom_id)) {
          evalMap.set(ev.classroom_id, ev)
        }
      }
    }

    const classroomStatusList: DateClassroomStatus[] = assignedClassrooms.map((room: any) => {
      const existing = evalMap.get(room.id)
      return {
        id: room.id,
        name: room.name,
        grade: room.grade,
        division: room.division || "",
        isEvaluated: !!existing,
        score: existing?.total_score,
        maxScore: existing?.max_score,
        evaluationId: existing?.id,
        supervisorName: existing?.supervisor?.name,
        evaluatedAt: existing?.evaluation_date,
      }
    })

    const completedCount = classroomStatusList.filter((c) => c.isEvaluated).length
    const pendingCount = isWorkingDay ? classroomStatusList.length - completedCount : 0

    const missedDays: MissedDayRecord[] = []
    if (classroomIds.length > 0 && scanLowerBound <= scanUpperBound) {
      const intervalDays = eachDayOfInterval({ start: scanLowerBound, end: scanUpperBound })
      for (const pastDay of intervalDays) {
        const dKey = format(pastDay, "yyyy-MM-dd")
        if (isWeekend(pastDay)) continue
        if (exceptionMap.has(dKey)) continue

        const missing = assignedClassrooms.filter(
          (room: any) => !intervalEvalMap.has(`${room.id}_${dKey}`)
        )

        if (missing.length > 0) {
          missedDays.push({
            date: dKey,
            missingClassroomIds: missing.map((r: any) => r.id),
            missingClassrooms: missing.map((r: any) => ({
              id: r.id,
              name: r.name,
              grade: r.grade,
              division: r.division || "",
            })),
          })
        }
      }
    }

    missedDays.sort((a, b) => b.date.localeCompare(a.date))

    return {
      success: true,
      data: {
        date: targetDate,
        isWorkingDay,
        isToday: dayIsToday,
        isPast: dayIsPast,
        isFuture: dayIsFuture,
        isWeekend: dayIsWeekend,
        isHoliday: dayIsHoliday,
        holidayReason: effectiveReason,
        isBeforeTerm,
        isAfterTerm,
        totalAssigned: assignedClassrooms.length,
        completedCount,
        pendingCount,
        classrooms: classroomStatusList,
        missedDays,
        schoolStartDate,
        schoolEndDate,
      },
    }
  } catch (err: any) {
    console.error("[getDateClassroomEvaluationOverview] Error:", err)
    return { success: false, error: err.message || "Failed to load date evaluation overview" }
  }
}
