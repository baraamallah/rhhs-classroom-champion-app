"use server"

import { revalidatePath, updateTag } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { requireRoleAction } from "@/lib/auth/server"
import { getEvaluationsStatus } from "@/app/actions/evaluation-settings-actions"
import { getSchoolTermDates } from "@/app/actions/calendar-actions"
import { readEvaluationHistory } from "@/lib/evaluation-history"
import { matchesDivision } from "@/lib/checklist-division"
import { recordRecentMutationCookie } from "@/lib/db-router"
import { format, isWeekend, parseISO } from "date-fns"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MAX_NOTES_LENGTH = 1000
const EVALUATOR_ROLES: Array<"supervisor" | "admin" | "super_admin"> = [
  "supervisor",
  "admin",
  "super_admin",
]

function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const parsed = Date.parse(`${value}T12:00:00.000Z`)
  return Number.isFinite(parsed)
}

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
 * Restricted to authenticated evaluators (supervisors and admins).
 */
export async function checkClassroomDateEvaluation(
  classroomId: string,
  dateStr: string
): Promise<{
  success: boolean
  isEvaluated: boolean
  evaluation?: ExistingEvaluationInfo
  isWorkingDay: boolean
  holidayReason?: string
  error?: string
}> {
  try {
    const { currentUser, error: authError } = await requireRoleAction(EVALUATOR_ROLES, {
      deniedMessage: "Unauthorized: Evaluator access required",
    })
    if (authError || !currentUser) {
      return {
        success: false,
        isEvaluated: false,
        isWorkingDay: true,
        error: authError || "Not authenticated",
      }
    }

    const targetDate = typeof dateStr === "string" ? dateStr.trim() : ""
    if (!classroomId || !isValidDateString(targetDate)) {
      return {
        success: false,
        isEvaluated: false,
        isWorkingDay: true,
        error: "Valid classroom ID and date (YYYY-MM-DD) are required.",
      }
    }

    const supabase = await createAdminClient()
    const parsedDate = parseISO(targetDate)
    const isWeekendDay = isWeekend(parsedDate)

    const [{ data: holiday }, history] = await Promise.all([
      supabase
        .from("school_calendar_exceptions")
        .select("reason")
        .eq("exception_date", targetDate)
        .maybeSingle(),
      // Archived days stay locked: moving a record must not allow a second score.
      readEvaluationHistory(supabase, {
        classroomId,
        start: `${targetDate}T00:00:00.000Z`,
        end: `${targetDate}T23:59:59.999Z`,
        endInclusive: true,
        includeArchives: true,
      }),
    ])

    const [existing] = history
    const isWorkingDay = !isWeekendDay && !holiday

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
        supervisor: existing.supervisor,
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
 * Server Action for supervisors and admins to securely submit an evaluation.
 * Enforces:
 * 1. Active role authorization (supervisor, admin, or super_admin).
 * 2. Identity binding (supervisors cannot impersonate other supervisors) & classroom assignment check.
 * 3. Server-side score calculation from active checklist_items (prevents score tampering).
 * 4. Working day verification & 1 evaluation per classroom per day lock.
 */
export async function submitEvaluation(
  classroomId: string,
  supervisorId: string,
  checkedItemIds: string[],
  _clientTotalScore: number,
  _clientMaxScore: number,
  evaluationDate?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { currentUser, error: authError } = await requireRoleAction(EVALUATOR_ROLES, {
      clearOnInvalid: true,
      deniedMessage: "Unauthorized: Only active supervisors or administrators can submit evaluations.",
    })
    if (authError || !currentUser) {
      return { success: false, error: authError || "Not authenticated. Please log in again." }
    }

    if (!classroomId || typeof classroomId !== "string") {
      return { success: false, error: "Classroom ID is required." }
    }

    if (!Array.isArray(checkedItemIds)) {
      return { success: false, error: "Checked checklist items must be provided as a list." }
    }

    if (typeof notes === "string" && notes.length > MAX_NOTES_LENGTH) {
      return { success: false, error: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.` }
    }

    const todayStr = format(new Date(), "yyyy-MM-dd")
    const targetDateStr = evaluationDate?.trim() || todayStr

    if (!isValidDateString(targetDateStr)) {
      return { success: false, error: "Invalid evaluation date format." }
    }

    if (targetDateStr > todayStr) {
      return { success: false, error: "Cannot submit evaluations for future dates." }
    }

    const parsedTargetDate = parseISO(targetDateStr)
    if (isWeekend(parsedTargetDate)) {
      return {
        success: false,
        error: "Evaluations cannot be submitted for weekend dates (Saturday/Sunday).",
      }
    }

    const supabase = await createAdminClient()
    const isAdmin = currentUser.role === "admin" || currentUser.role === "super_admin"
    const effectiveSupervisorId = isAdmin && supervisorId ? supervisorId : currentUser.id

    // Parallel validation queries: status, term dates, holiday, classroom, checklist rubric, assignments, daily lock
    const [
      statusResult,
      termRes,
      { data: holiday },
      { data: classroom, error: classroomError },
      { data: checklistData, error: checklistError },
      supervisorAssignmentsResult,
      existingHistory,
    ] = await Promise.all([
      getEvaluationsStatus(),
      getSchoolTermDates(),
      supabase
        .from("school_calendar_exceptions")
        .select("reason")
        .eq("exception_date", targetDateStr)
        .maybeSingle(),
      supabase
        .from("classrooms")
        .select("id, division, is_active")
        .eq("id", classroomId)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("checklist_items")
        .select("id, points, category, checklist_item_assignments(supervisor_id)")
        .eq("is_active", true),
      !isAdmin
        ? supabase
            .from("classroom_supervisors")
            .select("classroom_id")
            .eq("supervisor_id", currentUser.id)
        : Promise.resolve({ data: null, error: null }),
      readEvaluationHistory(supabase, {
        classroomId,
        start: `${targetDateStr}T00:00:00.000Z`,
        end: `${targetDateStr}T23:59:59.999Z`,
        endInclusive: true,
        includeArchives: true,
        includeDetails: false,
      }),
    ])

    const enabled = statusResult.success ? statusResult.enabled !== false : true
    if (!enabled) {
      return { success: false, error: "System is closed and not accepting evaluations anymore." }
    }

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

    if (holiday) {
      return {
        success: false,
        error: `Cannot submit evaluations on dismissed school days (${holiday.reason}).`,
      }
    }

    if (classroomError || !classroom) {
      return { success: false, error: "Selected classroom was not found or is inactive." }
    }

    // Enforce supervisor classroom assignment when explicit assignments exist
    if (!isAdmin && supervisorAssignmentsResult.data && supervisorAssignmentsResult.data.length > 0) {
      const assignedIds = new Set(supervisorAssignmentsResult.data.map((row: any) => row.classroom_id))
      if (!assignedIds.has(classroomId)) {
        return {
          success: false,
          error: "Unauthorized: You are not assigned to evaluate this classroom.",
        }
      }
    }

    if (existingHistory.length > 0) {
      return {
        success: false,
        error: "This classroom already has an evaluation recorded for this date. The day is locked.",
      }
    }

    if (checklistError || !checklistData) {
      return { success: false, error: "Unable to load evaluation rubric. Please try again." }
    }

    // Filter active checklist criteria applicable to this classroom division & supervisor
    const applicableItems = (checklistData as any[]).filter((item) => {
      if (!matchesDivision(item, classroom.division)) return false
      const assignments = Array.isArray(item.checklist_item_assignments)
        ? item.checklist_item_assignments
        : []
      if (!isAdmin && assignments.length > 0) {
        return assignments.some((a: { supervisor_id: string }) => a.supervisor_id === effectiveSupervisorId)
      }
      return true
    })

    const applicableById = new Map(applicableItems.map((item) => [item.id as string, Number(item.points) || 0]))
    const uniqueCheckedIds = [...new Set(checkedItemIds.filter((id) => typeof id === "string"))]

    for (const itemId of uniqueCheckedIds) {
      if (!applicableById.has(itemId)) {
        return {
          success: false,
          error: "One or more checklist items are invalid or no longer active. Please reload and try again.",
        }
      }
    }

    // Compute authoritative total_score and max_score strictly on the server
    const checkedSet = new Set(uniqueCheckedIds)
    let computedTotalScore = 0
    let computedMaxScore = 0
    for (const [id, pts] of applicableById.entries()) {
      computedMaxScore += pts
      if (checkedSet.has(id)) {
        computedTotalScore += pts
      }
    }

    const itemsMap = uniqueCheckedIds.reduce((acc, id) => {
      acc[id] = true
      return acc
    }, {} as Record<string, boolean>)

    const isoEvaluationDate = `${targetDateStr}T12:00:00.000Z`

    const { error: insertError } = await supabase.from("evaluations").insert({
      classroom_id: classroomId,
      supervisor_id: effectiveSupervisorId,
      items: itemsMap,
      total_score: computedTotalScore,
      max_score: computedMaxScore,
      evaluation_date: isoEvaluationDate,
      notes: notes?.trim() || null,
    })

    if (insertError) {
      if (insertError.code === "23505") {
        return {
          success: false,
          error: "This classroom was just evaluated for this date by another submission. The day is locked.",
        }
      }
      console.error("[Server Action] Error submitting evaluation:", insertError)
      return { success: false, error: insertError.message }
    }

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
    const { currentUser: user, error: authError } = await requireRoleAction(EVALUATOR_ROLES, {
      clearOnInvalid: true,
      deniedMessage: "Unauthorized: Only evaluators can undo evaluations.",
    })
    if (authError || !user) {
      return { success: false, error: authError || "Not authenticated. Please log in again." }
    }

    const supabase = await createAdminClient()

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

    const isOwner = evalRecord.supervisor_id === user.id
    const isAdmin = user.role === "admin" || user.role === "super_admin"
    if (!isOwner && !isAdmin) {
      return { success: false, error: "Unauthorized: You can only undo evaluations you submitted." }
    }

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
      undone_by_id: user.id,
      undone_by_name: user.name || "User",
      reason: reason?.trim().slice(0, 500) || "Supervisor requested undo point",
    }

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

      await supabase.from("system_settings").upsert({
        key: "evaluation_undo_logs",
        value: updatedLogs,
        description: "Audit trail of undone evaluations and reverted points",
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
    }

    const { error: deleteError } = await supabase
      .from("evaluations")
      .delete()
      .eq("id", evaluationId)

    if (deleteError) {
      console.error("[undoEvaluation] Delete error:", deleteError)
      return { success: false, error: `Failed to remove evaluation: ${deleteError.message}` }
    }

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
 * Authenticated evaluators only; supervisors are scoped strictly to their own logs.
 */
export async function getEvaluationUndoLogs(
  supervisorId?: string
): Promise<{ success: boolean; data: EvaluationUndoLog[]; error?: string }> {
  try {
    const { currentUser, error: authError } = await requireRoleAction(EVALUATOR_ROLES, {
      deniedMessage: "Unauthorized: Evaluator access required",
    })
    if (authError || !currentUser) {
      return { success: false, data: [], error: authError || "Not authenticated" }
    }

    const isAdmin = currentUser.role === "admin" || currentUser.role === "super_admin"
    const scopedSupervisorId = isAdmin ? supervisorId : currentUser.id

    const supabase = await createAdminClient()

    try {
      let query = supabase
        .from("evaluation_undo_logs")
        .select("*")
        .order("undone_at", { ascending: false })

      if (scopedSupervisorId) {
        query = query.eq("supervisor_id", scopedSupervisorId)
      }

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return { success: true, data }
      }
    } catch {
      // Fall through to system_settings
    }

    const { data: setting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "evaluation_undo_logs")
      .maybeSingle()

    let logs: EvaluationUndoLog[] = Array.isArray(setting?.value) ? setting.value : []
    if (scopedSupervisorId) {
      logs = logs.filter(
        (l) => l.supervisor_id === scopedSupervisorId || l.undone_by_id === scopedSupervisorId
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
 * Enforces active role authorization and ownership (creator or admin).
 */
export async function restoreUndoneEvaluation(
  undoLogId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { currentUser, error: authError } = await requireRoleAction(EVALUATOR_ROLES, {
      clearOnInvalid: true,
      deniedMessage: "Unauthorized: Evaluator access required",
    })
    if (authError || !currentUser) {
      return { success: false, error: authError || "Not authenticated" }
    }

    const supabase = await createAdminClient()

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

    const isAdmin = currentUser.role === "admin" || currentUser.role === "super_admin"
    const isOwner =
      logEntry.supervisor_id === currentUser.id || logEntry.undone_by_id === currentUser.id

    if (!isAdmin && !isOwner) {
      return {
        success: false,
        error: "Unauthorized: You can only restore your own undone evaluations.",
      }
    }

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

    const { error: insertError } = await supabase.from("evaluations").insert({
      id: logEntry.evaluation_id || crypto.randomUUID(),
      classroom_id: logEntry.classroom_id,
      supervisor_id: logEntry.supervisor_id,
      items: logEntry.items || {},
      total_score: logEntry.reverted_points,
      max_score: logEntry.max_score,
      evaluation_date: logEntry.evaluation_date,
      notes: logEntry.notes
        ? `${logEntry.notes} (Restored from undo point)`
        : "Restored from undo point",
    })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

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
