"use server"

import { revalidatePath, updateTag } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { getSessionFromCookies } from "@/lib/auth/session"
import { getEvaluationsStatus } from "@/app/actions/evaluation-settings-actions"
import { getSchoolTermDates } from "@/app/actions/calendar-actions"
import { recordRecentMutationCookie } from "@/lib/db-router"
import { format, isWeekend, parseISO } from "date-fns"

export interface ExistingEvaluationInfo {
  id: string
  classroom_id: string
  supervisor_id: string
  total_score: number
  max_score: number
  evaluation_date: string
  items: Record<string, boolean>
  notes?: string
  supervisor?: {
    name: string
    email: string
  }
}

/**
 * Check if a classroom already has an evaluation recorded on a specific date.
 */
export async function checkClassroomDateEvaluation(
  classroomId: string,
  dateStr: string
): Promise<{ success: boolean; isEvaluated: boolean; evaluation?: ExistingEvaluationInfo; isWorkingDay: boolean; holidayReason?: string; error?: string }> {
  try {
    const supabase = await createAdminClient()
    const targetDate = dateStr.trim()
    const parsedDate = parseISO(targetDate)

    // Check weekend
    const isWeekendDay = isWeekend(parsedDate)

    // Check holiday exception
    const { data: holiday } = await supabase
      .from("school_calendar_exceptions")
      .select("reason")
      .eq("exception_date", targetDate)
      .maybeSingle()

    const isWorkingDay = !isWeekendDay && !holiday

    // Check existing evaluation
    const { data: existing, error } = await supabase
      .from("evaluations")
      .select(`
        id,
        classroom_id,
        supervisor_id,
        total_score,
        max_score,
        evaluation_date,
        items,
        notes,
        users:supervisor_id (
          name,
          email
        )
      `)
      .eq("classroom_id", classroomId)
      .gte("evaluation_date", `${targetDate}T00:00:00.000Z`)
      .lte("evaluation_date", `${targetDate}T23:59:59.999Z`)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    let evaluation: ExistingEvaluationInfo | undefined
    if (existing) {
      evaluation = {
        id: existing.id,
        classroom_id: existing.classroom_id,
        supervisor_id: existing.supervisor_id,
        total_score: existing.total_score,
        max_score: existing.max_score,
        evaluation_date: existing.evaluation_date,
        items: existing.items || {},
        notes: existing.notes || undefined,
        supervisor: (existing as any).users ? {
          name: (existing as any).users.name,
          email: (existing as any).users.email || "",
        } : undefined,
      }
    }

    return {
      success: true,
      isEvaluated: !!existing,
      evaluation,
      isWorkingDay,
      holidayReason: holiday?.reason,
    }
  } catch (err: any) {
    console.error("[checkClassroomDateEvaluation] Error:", err)
    return {
      success: false,
      isEvaluated: false,
      isWorkingDay: true,
      error: err.message || "Failed to check classroom evaluation status",
    }
  }
}

/**
 * Server Action for supervisors to securely submit an evaluation.
 * Enforces:
 * 1. Working day verification (excludes weekends & school holidays).
 * 2. 1 evaluation per classroom per day lock.
 * 3. Atomic insertion with service role.
 */
export async function submitEvaluation(
  classroomId: string,
  supervisorId: string,
  checkedItemIds: string[],
  totalScore: number,
  maxScore: number,
  evaluationDate?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSessionFromCookies()
    if (!session) {
      return { success: false, error: "Not authenticated. Please log in again." }
    }

    // Check if evaluations system is globally open
    const statusResult = await getEvaluationsStatus()
    const enabled = statusResult.success ? statusResult.enabled !== false : true

    if (!enabled) {
      return { success: false, error: "System is closed and not accepting evaluations anymore." }
    }

    if (!classroomId) {
      return { success: false, error: "Classroom ID is required." }
    }

    const todayStr = format(new Date(), "yyyy-MM-dd")
    const targetDateStr = evaluationDate?.trim() || todayStr

    // Date validation
    if (targetDateStr > todayStr) {
      return { success: false, error: "Cannot submit evaluations for future dates." }
    }

    // School term boundaries validation
    const termRes = await getSchoolTermDates()
    if (termRes.success && termRes.data) {
      if (targetDateStr < termRes.data.startDate) {
        return {
          success: false,
          error: `Cannot submit evaluations before the school year start date (${termRes.data.startDate}).`,
        }
      }
      if (targetDateStr > termRes.data.endDate) {
        return {
          success: false,
          error: `Cannot submit evaluations after the school year end date (${termRes.data.endDate}).`,
        }
      }
    }

    const parsedTargetDate = parseISO(targetDateStr)

    // Working days validation: Mon-Fri only
    if (isWeekend(parsedTargetDate)) {
      return {
        success: false,
        error: "Evaluations cannot be submitted for weekend dates (Saturday/Sunday).",
      }
    }

    const supabase = await createAdminClient()

    // Holiday validation: check school_calendar_exceptions
    const { data: holiday } = await supabase
      .from("school_calendar_exceptions")
      .select("reason")
      .eq("exception_date", targetDateStr)
      .maybeSingle()

    if (holiday) {
      return {
        success: false,
        error: `Cannot submit evaluations on dismissed school days (${holiday.reason}).`,
      }
    }

    // Daily Lock Check: Ensure classroom does not already have an evaluation on target date
    const { data: existingEval } = await supabase
      .from("evaluations")
      .select("id")
      .eq("classroom_id", classroomId)
      .gte("evaluation_date", `${targetDateStr}T00:00:00.000Z`)
      .lte("evaluation_date", `${targetDateStr}T23:59:59.999Z`)
      .maybeSingle()

    if (existingEval) {
      return {
        success: false,
        error: "This classroom already has an evaluation recorded for this date. The day is locked.",
      }
    }

    const itemsMap = checkedItemIds.reduce((acc, id) => {
      acc[id] = true
      return acc
    }, {} as Record<string, boolean>)

    // Determine actual supervisor ID (from parameter or session)
    const effectiveSupervisorId = supervisorId || session.userId

    // ISO timestamp with noon UTC on target date to avoid timezone shift
    const isoEvaluationDate = `${targetDateStr}T12:00:00.000Z`

    const { error: insertError } = await supabase
      .from("evaluations")
      .insert({
        classroom_id: classroomId,
        supervisor_id: effectiveSupervisorId,
        items: itemsMap,
        total_score: totalScore,
        max_score: maxScore,
        evaluation_date: isoEvaluationDate,
        notes: notes?.trim() || null,
      })

    if (insertError) {
      // Catch unique index collision gracefully
      if (insertError.code === "23505") {
        return {
          success: false,
          error: "This classroom was just evaluated for this date by another submission. The day is locked.",
        }
      }
      console.error("[Server Action] Error submitting evaluation:", insertError)
      return { success: false, error: insertError.message }
    }

    // Revalidate tags and paths so leaderboards, history, and tracking reflect the submission immediately
    try {
      updateTag("leaderboard")
    } catch {
      // Graceful fallback if tag revalidation is unavailable
    }
    await recordRecentMutationCookie()

    revalidatePath("/", "layout")
    revalidatePath("/admin")
    revalidatePath("/admin/tracking")
    revalidatePath("/supervisor")
    revalidatePath("/supervisor/evaluate")
    revalidatePath("/winners")

    return { success: true }
  } catch (error: any) {
    console.error("[Server Action] Exception submitting evaluation:", error)
    return { success: false, error: error.message || "Failed to submit evaluation" }
  }
}
