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

export interface EvaluationUndoLog {
  id: string
  evaluation_id: string
  classroom_id: string
  classroom_name: string
  grade: string
  division?: string
  supervisor_id: string
  supervisor_name: string
  reverted_points: number
  max_score: number
  items?: Record<string, boolean>
  notes?: string
  evaluation_date: string
  undone_at: string
  undone_by_id: string
  undone_by_name: string
  reason?: string
  restored_at?: string
}

/**
 * Undo an evaluation:
 * 1. Reverts/deletes the evaluation from the live evaluations table.
 * 2. Unlocks the classroom for re-inspection on that date.
 * 3. Records an undo point in the audit log (evaluation_undo_logs / system_settings).
 * 4. Refreshes leaderboards, cache, and supervisor dashboard.
 */
export async function undoEvaluation(
  evaluationId: string,
  reason?: string
): Promise<{ success: boolean; message?: string; undoEntry?: EvaluationUndoLog; error?: string }> {
  try {
    const session = await getSessionFromCookies()
    if (!session) {
      return { success: false, error: "Not authenticated. Please log in again." }
    }

    const supabase = await createAdminClient()

    // 1. Verify user identity
    const { data: user } = await supabase
      .from("users")
      .select("id, name, email, role, is_active")
      .eq("id", session.userId)
      .single()

    if (!user || !user.is_active) {
      return { success: false, error: "User session invalid or inactive." }
    }

    // 2. Fetch the evaluation to be undone
    const { data: evalRecord, error: fetchErr } = await supabase
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
        classroom:classrooms (
          id,
          name,
          grade,
          division
        ),
        supervisor:users!supervisor_id (
          id,
          name,
          email
        )
      `)
      .eq("id", evaluationId)
      .single()

    if (fetchErr || !evalRecord) {
      return { success: false, error: "Evaluation record not found or already removed." }
    }

    // 3. Check authorization: must be creator or admin
    const isOwner = evalRecord.supervisor_id === session.userId
    const isAdmin = user.role === "admin" || user.role === "super_admin"
    if (!isOwner && !isAdmin) {
      return { success: false, error: "Unauthorized: You can only undo evaluations you submitted." }
    }

    // 4. Create snapshot for the undo point
    const classroomName = (evalRecord.classroom as any)?.name || "Classroom"
    const grade = (evalRecord.classroom as any)?.grade || ""
    const division = (evalRecord.classroom as any)?.division || ""
    const supervisorName = (evalRecord.supervisor as any)?.name || user.name || "Supervisor"

    const undoLogEntry: EvaluationUndoLog = {
      id: crypto.randomUUID(),
      evaluation_id: evalRecord.id,
      classroom_id: evalRecord.classroom_id,
      classroom_name: classroomName,
      grade,
      division,
      supervisor_id: evalRecord.supervisor_id,
      supervisor_name: supervisorName,
      reverted_points: evalRecord.total_score,
      max_score: evalRecord.max_score,
      items: evalRecord.items || {},
      notes: evalRecord.notes || undefined,
      evaluation_date: evalRecord.evaluation_date,
      undone_at: new Date().toISOString(),
      undone_by_id: session.userId,
      undone_by_name: user.name || "User",
      reason: reason?.trim() || "Supervisor requested undo point",
    }

    // 5. Store undo point in evaluation_undo_logs table, with fallback to system_settings
    let savedInTable = false
    try {
      const { error: insertLogError } = await supabase
        .from("evaluation_undo_logs")
        .insert(undoLogEntry)

      if (!insertLogError) {
        savedInTable = true
      }
    } catch {
      // Table may not exist yet; will fall back to system_settings
    }

    if (!savedInTable) {
      const { data: existingSetting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "evaluation_undo_logs")
        .maybeSingle()

      const currentLogs: EvaluationUndoLog[] = Array.isArray(existingSetting?.value)
        ? existingSetting.value
        : []

      const updatedLogs = [undoLogEntry, ...currentLogs].slice(0, 500)

      await supabase
        .from("system_settings")
        .upsert({
          key: "evaluation_undo_logs",
          value: updatedLogs,
          description: "Audit trail of undone evaluations and reverted points",
          updated_by: session.userId,
          updated_at: new Date().toISOString(),
        })
    }

    // 6. Delete evaluation from live table
    const { error: deleteError } = await supabase
      .from("evaluations")
      .delete()
      .eq("id", evaluationId)

    if (deleteError) {
      console.error("[undoEvaluation] Delete error:", deleteError)
      return { success: false, error: `Failed to remove evaluation: ${deleteError.message}` }
    }

    // 7. Revalidate leaderboard caches and paths
    try {
      updateTag("leaderboard")
    } catch {}
    await recordRecentMutationCookie()

    revalidatePath("/", "layout")
    revalidatePath("/admin")
    revalidatePath("/admin/tracking")
    revalidatePath("/supervisor")
    revalidatePath("/supervisor/evaluate")
    revalidatePath("/winners")

    const formattedDate = format(parseISO(evalRecord.evaluation_date), "MMM d, yyyy")
    return {
      success: true,
      message: `Undid evaluation for ${classroomName} (${formattedDate}). ${evalRecord.total_score} points reverted.`,
      undoEntry: undoLogEntry,
    }
  } catch (err: any) {
    console.error("[undoEvaluation] Exception:", err)
    return { success: false, error: err.message || "Failed to undo evaluation." }
  }
}

/**
 * Fetch the audit log of undone evaluations (undo points).
 */
export async function getEvaluationUndoLogs(
  supervisorId?: string
): Promise<{ success: boolean; data: EvaluationUndoLog[]; error?: string }> {
  try {
    const supabase = await createAdminClient()

    // 1. Try fetching from dedicated evaluation_undo_logs table
    try {
      let query = supabase
        .from("evaluation_undo_logs")
        .select("*")
        .order("undone_at", { ascending: false })

      if (supervisorId) {
        query = query.eq("supervisor_id", supervisorId)
      }

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return { success: true, data }
      }
    } catch {
      // Fall through to system_settings
    }

    // 2. Fallback to system_settings
    const { data: setting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "evaluation_undo_logs")
      .maybeSingle()

    let logs: EvaluationUndoLog[] = Array.isArray(setting?.value) ? setting.value : []
    if (supervisorId) {
      logs = logs.filter(
        (l) => l.supervisor_id === supervisorId || l.undone_by_id === supervisorId
      )
    }

    logs.sort((a, b) => b.undone_at.localeCompare(a.undone_at))

    return { success: true, data: logs }
  } catch (err: any) {
    console.error("[getEvaluationUndoLogs] Error:", err)
    return { success: false, data: [], error: err.message || "Failed to load undo logs" }
  }
}

/**
 * Restore an undone evaluation point back to live status.
 */
export async function restoreUndoneEvaluation(
  undoLogId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await getSessionFromCookies()
    if (!session) {
      return { success: false, error: "Not authenticated" }
    }

    const supabase = await createAdminClient()

    // 1. Retrieve the undo log entry
    let logEntry: EvaluationUndoLog | null = null

    try {
      const { data } = await supabase
        .from("evaluation_undo_logs")
        .select("*")
        .eq("id", undoLogId)
        .maybeSingle()

      if (data) logEntry = data
    } catch {}

    if (!logEntry) {
      const { data: setting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "evaluation_undo_logs")
        .maybeSingle()

      const logs: EvaluationUndoLog[] = Array.isArray(setting?.value) ? setting.value : []
      logEntry = logs.find((l) => l.id === undoLogId) || null
    }

    if (!logEntry) {
      return { success: false, error: "Undo log record not found" }
    }

    // 2. Check if classroom is already evaluated for this date
    const targetDateStr = format(parseISO(logEntry.evaluation_date), "yyyy-MM-dd")
    const { data: existing } = await supabase
      .from("evaluations")
      .select("id")
      .eq("classroom_id", logEntry.classroom_id)
      .gte("evaluation_date", `${targetDateStr}T00:00:00.000Z`)
      .lte("evaluation_date", `${targetDateStr}T23:59:59.999Z`)
      .maybeSingle()

    if (existing) {
      return {
        success: false,
        error: "Cannot restore: A new evaluation has already been submitted for this classroom on this date.",
      }
    }

    // 3. Re-insert the evaluation
    const { error: insertError } = await supabase
      .from("evaluations")
      .insert({
        id: logEntry.evaluation_id || crypto.randomUUID(),
        classroom_id: logEntry.classroom_id,
        supervisor_id: logEntry.supervisor_id,
        items: logEntry.items || {},
        total_score: logEntry.reverted_points,
        max_score: logEntry.max_score,
        evaluation_date: logEntry.evaluation_date,
        notes: logEntry.notes ? `${logEntry.notes} (Restored from undo point)` : "Restored from undo point",
      })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    // 4. Mark undo log as restored
    const nowIso = new Date().toISOString()
    try {
      await supabase
        .from("evaluation_undo_logs")
        .update({ restored_at: nowIso })
        .eq("id", undoLogId)
    } catch {}

    try {
      const { data: setting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "evaluation_undo_logs")
        .maybeSingle()

      if (setting && Array.isArray(setting.value)) {
        const updated = setting.value.map((l: EvaluationUndoLog) =>
          l.id === undoLogId ? { ...l, restored_at: nowIso } : l
        )
        await supabase
          .from("system_settings")
          .update({ value: updated })
          .eq("key", "evaluation_undo_logs")
      }
    } catch {}

    // 5. Revalidate
    try {
      updateTag("leaderboard")
    } catch {}
    await recordRecentMutationCookie()

    revalidatePath("/", "layout")
    revalidatePath("/admin")
    revalidatePath("/admin/tracking")
    revalidatePath("/supervisor")
    revalidatePath("/supervisor/evaluate")
    revalidatePath("/winners")

    return {
      success: true,
      message: `Successfully restored ${logEntry.reverted_points} points for ${logEntry.classroom_name}.`,
    }
  } catch (err: any) {
    console.error("[restoreUndoneEvaluation] Error:", err)
    return { success: false, error: err.message || "Failed to restore evaluation point" }
  }
}

