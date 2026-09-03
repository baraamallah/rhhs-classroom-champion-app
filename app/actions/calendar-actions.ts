"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { getSessionFromCookies } from "@/lib/auth/session"
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
  isToday,
  isFuture,
  subDays,
  max,
  min,
  isSameMonth,
} from "date-fns"

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
  const session = await getSessionFromCookies()
  if (!session) return { error: "Not authenticated" }

  const supabase = await createAdminClient()
  const { data: userData } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("id", session.userId)
    .single()

  if (!userData || !userData.is_active || (userData.role !== "admin" && userData.role !== "super_admin")) {
    return { error: "Unauthorized: Admin access required" }
  }

  return { currentUser: userData }
}

/**
 * Helper to compute default school year start/end dates if not yet configured in DB
 */
function getDefaultSchoolTermDates(): SchoolTermDates {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed (8 = Sep)

  // If before September, the school year began previous year's September
  const startYear = currentMonth >= 8 ? currentYear : currentYear - 1
  const endYear = startYear + 1

  return {
    startDate: `${startYear}-09-01`,
    endDate: `${endYear}-06-30`,
  }
}

/**
 * Fetch configured Academic School Year Start and End dates
 */
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
  } catch (err: any) {
    return { success: true, data: getDefaultSchoolTermDates() }
  }
}

/**
 * Admin Action: Update Academic School Year Start and End dates
 */
export async function updateSchoolTermDates(
  startDate: string,
  endDate: string
): Promise<{ success: boolean; error?: string }> {
  const { error: authError, currentUser } = await requireAdminUser()
  if (authError || !currentUser) {
    return { success: false, error: authError }
  }

  try {
    if (!startDate || !endDate) {
      return { success: false, error: "Both start date and end date are required." }
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

/**
 * Fetch all school calendar dismissed days/holidays
 */
export async function getCalendarExceptions(): Promise<{ success: boolean; data: CalendarException[]; error?: string }> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("school_calendar_exceptions")
      .select("id, exception_date, reason, created_at")
      .order("exception_date", { ascending: true })

    if (error) {
      // Table might not exist yet if migration hasn't run
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

/**
 * Admin action: Toggle a date as dismissed / school off or remove exception
 */
export async function toggleCalendarException(
  dateStr: string,
  reason = "School Off / Holiday"
): Promise<{ success: boolean; action?: "added" | "removed"; error?: string }> {
  const { error: authError, currentUser } = await requireAdminUser()
  if (authError || !currentUser) {
    return { success: false, error: authError }
  }

  try {
    const supabase = await createAdminClient()

    // Check if exception already exists
    const { data: existing } = await supabase
      .from("school_calendar_exceptions")
      .select("id")
      .eq("exception_date", dateStr)
      .maybeSingle()

    if (existing) {
      // Remove exception (restore as working day)
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
      // Add exception (dismiss day)
      const { error: insertError } = await supabase
        .from("school_calendar_exceptions")
        .insert({
          exception_date: dateStr,
          reason: reason.trim() || "Holiday / School Off",
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
 * Respects school_year_start_date and school_year_end_date!
 */
export async function getSupervisorDailyStatus(
  supervisorId: string,
  referenceDateStr?: string
): Promise<{ success: boolean; data?: SupervisorDailyOverview; error?: string }> {
  try {
    const supabase = await createAdminClient()
    const now = new Date()
    const todayStr = format(now, "yyyy-MM-dd")
    const refDate = referenceDateStr ? parseISO(referenceDateStr) : now

    // 0. Fetch school term start & end dates
    const termRes = await getSchoolTermDates()
    const schoolStartDate = termRes.data.startDate
    const schoolEndDate = termRes.data.endDate

    // 1. Get classrooms assigned to this supervisor
    const { data: assignments, error: assignError } = await supabase
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
      .eq("supervisor_id", supervisorId)

    if (assignError) throw assignError

    const assignedClassrooms = (assignments || [])
      .map((a: any) => a.classrooms)
      .filter((c: any) => c && c.is_active)

    // 2. Fetch all calendar exceptions
    const { data: exceptions } = await supabase
      .from("school_calendar_exceptions")
      .select("exception_date, reason")

    const exceptionMap = new Map((exceptions || []).map((e: any) => [e.exception_date, e.reason]))

    // 3. Fetch evaluations for these classrooms
    const classroomIds = assignedClassrooms.map((c: any) => c.id)
    let evaluations: any[] = []

    if (classroomIds.length > 0) {
      const { data: evals, error: evalError } = await supabase
        .from("evaluations")
        .select("id, classroom_id, evaluation_date, total_score, max_score")
        .in("classroom_id", classroomIds)

      if (evalError) throw evalError
      evaluations = evals || []
    }

    // Map: `classroomId_YYYY-MM-DD` -> evaluation
    const evalMap = new Map<string, any>()
    evaluations.forEach((ev: any) => {
      const dateKey = format(parseISO(ev.evaluation_date), "yyyy-MM-dd")
      evalMap.set(`${ev.classroom_id}_${dateKey}`, ev)
    })

    // 4. Check Today's Status
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

    // 5. Calculate Missed Past Working Days strictly bounded within the School Term
    // Only dates from schoolStartDate to min(yesterday, schoolEndDate)
    const parsedStart = parseISO(schoolStartDate)
    const parsedEnd = parseISO(schoolEndDate)
    const yesterday = subDays(now, 1)

    // Scan up to 90 days ago, but never earlier than schoolStartDate
    const scanLowerBound = max([parsedStart, subDays(now, 90)])
    const scanUpperBound = min([parsedEnd, yesterday])

    const missedDays: MissedDayRecord[] = []

    if (assignedClassrooms.length > 0 && scanLowerBound <= scanUpperBound) {
      const intervalDays = eachDayOfInterval({ start: scanLowerBound, end: scanUpperBound })

      for (const pastDay of intervalDays) {
        const dateKey = format(pastDay, "yyyy-MM-dd")
        if (isWeekend(pastDay)) continue
        if (exceptionMap.has(dateKey)) continue

        // Check which classrooms were not evaluated on this date
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

    // Sort missed days descending (most recent first)
    missedDays.sort((a, b) => b.date.localeCompare(a.date))

    // 6. Build Calendar Month Grid for the supervisor calendar widget (Full week-aligned desk grid)
    const monthStart = startOfMonth(refDate)
    const monthEnd = endOfMonth(refDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
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

      // Count evaluations on this date for assigned rooms
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
