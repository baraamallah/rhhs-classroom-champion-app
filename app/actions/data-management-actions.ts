"use server"

import { revalidatePath } from "next/cache"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getSessionFromCookies, clearSessionCookie } from "@/lib/auth/session"

type UserRole = "super_admin" | "admin" | "supervisor" | "viewer"

interface CurrentUser {
  id: string
  role: UserRole
}

async function requireSuperAdmin(): Promise<{ currentUser?: CurrentUser; error?: string }> {
  const session = await getSessionFromCookies()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Use admin client to bypass RLS for authentication check
  // This is safe because we're only checking the user's own data based on their session
  const supabase = await createAdminClient()
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("id", session.userId)
    .single()

  if (userError || !userData) {
    console.error("[requireSuperAdmin] User lookup failed:", userError)
    await clearSessionCookie()
    return { error: "Not authenticated" }
  }

  if (!userData.is_active) {
    await clearSessionCookie()
    return { error: "Not authenticated" }
  }

  // Allow both admin and super_admin roles (matches admin page access and RLS policies)
  if (userData.role !== "super_admin" && userData.role !== "admin") {
    return { error: "Unauthorized: Admin access required" }
  }

  return { currentUser: { id: userData.id, role: userData.role } }
}

export async function archiveAndReset() {
  console.log("[archiveAndReset] Starting archive and reset operation")
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    console.error("[archiveAndReset] Auth failed:", error)
    return { success: false, error }
  }

  // Use admin client to bypass RLS for system-wide archive operations
  const supabase = await createAdminClient()

  try {
    // Archive evaluations
    console.log("[archiveAndReset] Fetching evaluations to archive...")
    const { data: evaluations, error: evalFetchError } = await supabase.from("evaluations").select("*")

    if (evalFetchError) {
      console.error("[archiveAndReset] Failed to fetch evaluations:", evalFetchError)
      return { success: false, error: `Failed to fetch evaluations for archiving: ${evalFetchError.message}` }
    }

    console.log(`[archiveAndReset] Found ${evaluations?.length || 0} evaluations to archive`)

    if (evaluations && evaluations.length > 0) {
      // Use upsert to handle cases where data might already exist in archive (e.g. from a failed previous run)
      const { error: archiveEvalError } = await supabase.from("archive_evaluations").upsert(evaluations, { onConflict: "id" })

      if (archiveEvalError) {
        console.error("Archive evaluations error:", archiveEvalError)
        return { success: false, error: `Failed to archive evaluations: ${archiveEvalError.message}` }
      }

      console.log("[archiveAndReset] Evaluations archived, now deleting from main table...")
      const { error: deleteEvalError } = await supabase.from("evaluations").delete().neq("id", "") // Delete all

      if (deleteEvalError) {
        console.error("[archiveAndReset] Failed to delete evaluations:", deleteEvalError)
        return { success: false, error: `Failed to delete evaluations: ${deleteEvalError.message}` }
      }
    }

    // Note: We do NOT archive/delete classrooms because:
    // 1. Monthly winners reference classrooms
    // 2. Classrooms are persistent entities that should remain
    // 3. Only evaluations are archived/reset monthly
    console.log("[archiveAndReset] Skipping classroom archiving - classrooms are preserved for monthly winners")

    console.log("[archiveAndReset] Archive and reset completed successfully")
    revalidatePath("/admin")
    return {
      success: true,
      message: `Successfully archived ${evaluations?.length || 0} evaluations. Classrooms preserved for monthly winners tracking.`,
    }
  } catch (dbError: any) {
    console.error("[data-management-actions] archiveAndReset error", dbError)
    return { success: false, error: `Failed to archive and reset data: ${dbError.message || "Unknown error"}` }
  }
}

export async function deleteEvaluation(evaluationId: string) {
  console.log("[deleteEvaluation] Starting deletion for ID:", evaluationId)
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    console.error("[deleteEvaluation] Auth failed:", error)
    return { success: false, error }
  }

  const supabase = await createAdminClient()

  try {
    const { error: deleteError } = await supabase.from("evaluations").delete().eq("id", evaluationId)

    if (deleteError) {
      console.error("[data-management-actions] deleteEvaluation error", deleteError)
      return { success: false, error: `Failed to delete evaluation: ${deleteError.message}` }
    }

    console.log("[deleteEvaluation] Successfully deleted evaluation:", evaluationId)
    revalidatePath("/admin")
    return { success: true, message: "Evaluation deleted successfully" }
  } catch (dbError: any) {
    console.error("[data-management-actions] deleteEvaluation error", dbError)
    return { success: false, error: `Failed to delete evaluation: ${dbError.message || "Unknown error"}` }
  }
}

export async function deleteClassroom(classroomId: string) {
  console.log("[deleteClassroom] Starting deletion for ID:", classroomId)
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    console.error("[deleteClassroom] Auth failed:", error)
    return { success: false, error }
  }

  const supabase = await createAdminClient()

  try {
    // First delete all evaluations for this classroom
    const { error: deleteEvalsError } = await supabase.from("evaluations").delete().eq("classroom_id", classroomId)

    if (deleteEvalsError) {
      console.error("[data-management-actions] deleteClassroom evaluations error", deleteEvalsError)
      return { success: false, error: `Failed to delete classroom evaluations: ${deleteEvalsError.message}` }
    }

    // Then delete the classroom
    const { error: deleteClassError } = await supabase.from("classrooms").delete().eq("id", classroomId)

    if (deleteClassError) {
      console.error("[data-management-actions] deleteClassroom error", deleteClassError)
      return { success: false, error: `Failed to delete classroom: ${deleteClassError.message}` }
    }

    console.log("[deleteClassroom] Successfully deleted classroom:", classroomId)
    revalidatePath("/admin")
    return { success: true, message: "Classroom and all related evaluations deleted successfully" }
  } catch (dbError: any) {
    console.error("[data-management-actions] deleteClassroom error", dbError)
    return { success: false, error: `Failed to delete classroom: ${dbError.message || "Unknown error"}` }
  }
}

export async function archiveEvaluation(evaluationId: string) {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  if (!evaluationId || evaluationId.trim() === "") {
    return { success: false, error: "Invalid evaluation ID" }
  }

  const supabase = await createAdminClient()

  try {
    console.log("[archiveEvaluation] Starting archive process for ID:", evaluationId)

    const { data: evaluation, error: fetchError } = await supabase
      .from("evaluations")
      .select("*")
      .eq("id", evaluationId)
      .single()

    if (fetchError) {
      console.error("[archiveEvaluation] Fetch error:", fetchError)
      return { success: false, error: `Failed to fetch evaluation: ${fetchError.message}` }
    }

    if (!evaluation) {
      console.error("[archiveEvaluation] No evaluation found with ID:", evaluationId)
      return { success: false, error: "Evaluation not found" }
    }

    console.log("[archiveEvaluation] Evaluation fetched:", evaluation.id)

    const { data: archiveData, error: archiveError } = await supabase
      .from("archive_evaluations")
      .upsert(evaluation, { onConflict: "id" })
      .select()

    if (archiveError) {
      console.error("[archiveEvaluation] Archive insert error:", archiveError)
      return { success: false, error: `Failed to archive evaluation: ${archiveError.message}` }
    }

    console.log("[archiveEvaluation] Archived successfully:", archiveData)

    const { data: deleteData, error: deleteError, count } = await supabase
      .from("evaluations")
      .delete()
      .eq("id", evaluationId)
      .select()

    if (deleteError) {
      console.error("[archiveEvaluation] Delete error:", deleteError)
      return {
        success: false,
        error: `Evaluation was archived but failed to delete from main table: ${deleteError.message}`,
      }
    }

    console.log("[archiveEvaluation] Deleted from main table:", deleteData, "Count:", count)

    if (!deleteData || deleteData.length === 0) {
      console.error("[archiveEvaluation] No rows deleted for ID:", evaluationId)
      return {
        success: false,
        error: "Evaluation was archived but no rows were deleted from main table. Check RLS policies.",
      }
    }

    revalidatePath("/admin")
    console.log("[archiveEvaluation] Process completed successfully for ID:", evaluationId)
    return { success: true, message: `Evaluation archived and removed successfully (ID: ${evaluationId})` }
  } catch (dbError: any) {
    console.error("[archiveEvaluation] Unexpected error:", dbError)
    return { success: false, error: `Failed to archive evaluation: ${dbError.message || "Unknown error"}` }
  }
}

export async function getAllEvaluationsForManagement() {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error, data: [] }
  }

  // Use admin client to bypass RLS since we already verified super admin access
  const supabase = await createAdminClient()

  try {
    console.log("[getAllEvaluationsForManagement] Fetching evaluations...")

    const { data, error: fetchError } = await supabase
      .from("evaluations")
      .select(`
        id,
        evaluation_date,
        total_score,
        max_score,
        created_at,
        classrooms:classroom_id (
          name,
          grade
        ),
        users:supervisor_id (
          name
        )
      `)
      .order("evaluation_date", { ascending: false })

    if (fetchError) {
      console.error("[data-management-actions] getAllEvaluationsForManagement error", fetchError)
      return { success: false, error: `Failed to fetch evaluations: ${fetchError.message}`, data: [] }
    }

    console.log(`[getAllEvaluationsForManagement] Successfully fetched ${data?.length || 0} evaluations`)
    return { success: true, data: data || [] }
  } catch (dbError: any) {
    console.error("[data-management-actions] getAllEvaluationsForManagement error", dbError)
    return { success: false, error: `Failed to fetch evaluations: ${dbError.message || "Unknown error"}`, data: [] }
  }
}

export async function archiveEvaluations(evaluationIds: string[]) {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  if (!evaluationIds || evaluationIds.length === 0) {
    return { success: false, error: "No evaluations selected" }
  }

  const supabase = await createAdminClient()

  try {
    console.log(`[archiveEvaluations] Starting bulk archive for ${evaluationIds.length} evaluations`)

    // 1. Fetch the evaluations to be archived
    const { data: evaluations, error: fetchError } = await supabase
      .from("evaluations")
      .select("*")
      .in("id", evaluationIds)

    if (fetchError) {
      console.error("[archiveEvaluations] Fetch error:", fetchError)
      return { success: false, error: `Failed to fetch evaluations: ${fetchError.message}` }
    }

    if (!evaluations || evaluations.length === 0) {
      return { success: false, error: "No evaluations found to archive" }
    }

    // 2. Prepare data with archived_at timestamp
    const evaluationsToArchive = evaluations.map((ev) => ({
      ...ev,
      archived_at: new Date().toISOString(),
    }))

    // 3. Insert into archive table (upsert to be safe)
    const { error: archiveError } = await supabase
      .from("archive_evaluations")
      .upsert(evaluationsToArchive, { onConflict: "id" })

    if (archiveError) {
      console.error("[archiveEvaluations] Archive insert error:", archiveError)
      return { success: false, error: `Failed to archive evaluations: ${archiveError.message}` }
    }

    // 4. Delete from main table
    const { error: deleteError } = await supabase
      .from("evaluations")
      .delete()
      .in("id", evaluationIds)

    if (deleteError) {
      console.error("[archiveEvaluations] Delete error:", deleteError)
      return {
        success: false,
        error: `Evaluations archived but failed to delete from main table: ${deleteError.message}`,
      }
    }

    revalidatePath("/admin")
    return { success: true, message: `Successfully archived ${evaluations.length} evaluations` }
  } catch (dbError: any) {
    console.error("[archiveEvaluations] Unexpected error:", dbError)
    return { success: false, error: `Failed to archive evaluations: ${dbError.message || "Unknown error"}` }
  }
}

export async function getArchivedEvaluations() {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error, data: [] }
  }

  const supabase = await createAdminClient()

  try {
    const { data: evaluations, error: fetchError } = await supabase
      .from("archive_evaluations")
      .select("*")
      .order("archived_at", { ascending: false })

    if (fetchError) {
      console.error("[data-management-actions] getArchivedEvaluations error", fetchError)
      return { success: false, error: `Failed to fetch archived evaluations: ${fetchError.message}`, data: [] }
    }

    // Fetch BOTH active and archived classrooms to ensure we find the name
    const { data: activeClassrooms } = await supabase
      .from("classrooms")
      .select("id, name, grade")

    const { data: archivedClassrooms } = await supabase
      .from("archive_classrooms")
      .select("id, name, grade")

    // Fetch supervisors
    const { data: users } = await supabase
      .from("users")
      .select("id, name")

    // Combine classroom lists
    const allClassrooms = [
      ...(activeClassrooms || []),
      ...(archivedClassrooms || [])
    ]

    const evaluationsWithDetails = evaluations?.map((ev) => {
      const classroom = allClassrooms.find((c) => c.id === ev.classroom_id)
      const supervisor = users?.find((u) => u.id === ev.supervisor_id)

      return {
        ...ev,
        classrooms: classroom ? { name: classroom.name, grade: classroom.grade } : null,
        users: supervisor ? { name: supervisor.name } : null,
      }
    })

    return { success: true, data: evaluationsWithDetails || [] }
  } catch (dbError: any) {
    console.error("[data-management-actions] getArchivedEvaluations error", dbError)
    return { success: false, error: "Failed to fetch archived evaluations", data: [] }
  }
}

export async function restoreEvaluation(evaluationId: string) {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  if (!evaluationId || evaluationId.trim() === "") {
    return { success: false, error: "Invalid evaluation ID" }
  }

  const supabase = await createAdminClient()

  try {
    console.log("[restoreEvaluation] Starting restore process for ID:", evaluationId)

    const { data: evaluation, error: fetchError } = await supabase
      .from("archive_evaluations")
      .select("*")
      .eq("id", evaluationId)
      .single()

    if (fetchError) {
      console.error("[restoreEvaluation] Fetch error:", fetchError)
      return { success: false, error: `Failed to fetch archived evaluation: ${fetchError.message}` }
    }

    if (!evaluation) {
      console.error("[restoreEvaluation] No archived evaluation found with ID:", evaluationId)
      return { success: false, error: "Archived evaluation not found" }
    }

    console.log("[restoreEvaluation] Archived evaluation fetched:", evaluation.id)

    // Remove archived_at field before restoring to main table
    const { archived_at, ...evaluationToRestore } = evaluation

    const { data: restoreData, error: restoreError } = await supabase
      .from("evaluations")
      .upsert(evaluationToRestore, { onConflict: "id" })
      .select()

    if (restoreError) {
      console.error("[restoreEvaluation] Restore insert error:", restoreError)
      return { success: false, error: `Failed to restore evaluation: ${restoreError.message}` }
    }

    console.log("[restoreEvaluation] Restored successfully:", restoreData)

    const { data: deleteData, error: deleteError, count } = await supabase
      .from("archive_evaluations")
      .delete()
      .eq("id", evaluationId)
      .select()

    if (deleteError) {
      console.error("[restoreEvaluation] Delete from archive error:", deleteError)
      return {
        success: false,
        error: `Evaluation was restored but failed to delete from archive: ${deleteError.message}`,
      }
    }

    console.log("[restoreEvaluation] Deleted from archive:", deleteData, "Count:", count)

    if (!deleteData || deleteData.length === 0) {
      console.error("[restoreEvaluation] No rows deleted from archive for ID:", evaluationId)
      return {
        success: false,
        error: "Evaluation was restored but no rows were deleted from archive. Check RLS policies.",
      }
    }

    revalidatePath("/admin")
    console.log("[restoreEvaluation] Process completed successfully for ID:", evaluationId)
    return { success: true, message: `Evaluation restored and removed from archive successfully (ID: ${evaluationId})` }
  } catch (dbError: any) {
    console.error("[restoreEvaluation] Unexpected error:", dbError)
    return { success: false, error: `Failed to restore evaluation: ${dbError.message || "Unknown error"}` }
  }
}

export async function restoreEvaluations(evaluationIds: string[]) {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  if (!evaluationIds || evaluationIds.length === 0) {
    return { success: false, error: "No evaluations selected" }
  }

  const supabase = await createAdminClient()

  try {
    console.log(`[restoreEvaluations] Starting bulk restore for ${evaluationIds.length} evaluations`)

    // 1. Fetch the evaluations to be restored
    const { data: evaluations, error: fetchError } = await supabase
      .from("archive_evaluations")
      .select("*")
      .in("id", evaluationIds)

    if (fetchError) {
      console.error("[restoreEvaluations] Fetch error:", fetchError)
      return { success: false, error: `Failed to fetch archived evaluations: ${fetchError.message}` }
    }

    if (!evaluations || evaluations.length === 0) {
      return { success: false, error: "No archived evaluations found to restore" }
    }

    // 2. Prepare data without archived_at timestamp for main table
    const evaluationsToRestore = evaluations.map(({ archived_at, ...rest }) => rest)

    // 3. Insert into main table (upsert to be safe)
    const { error: restoreError } = await supabase
      .from("evaluations")
      .upsert(evaluationsToRestore, { onConflict: "id" })

    if (restoreError) {
      console.error("[restoreEvaluations] Restore insert error:", restoreError)
      return { success: false, error: `Failed to restore evaluations: ${restoreError.message}` }
    }

    // 4. Delete from archive table
    const { error: deleteError } = await supabase
      .from("archive_evaluations")
      .delete()
      .in("id", evaluationIds)

    if (deleteError) {
      console.error("[restoreEvaluations] Delete from archive error:", deleteError)
      return {
        success: false,
        error: `Evaluations restored but failed to delete from archive: ${deleteError.message}`,
      }
    }

    revalidatePath("/admin")
    return { success: true, message: `Successfully restored ${evaluations.length} evaluations` }
  } catch (dbError: any) {
    console.error("[restoreEvaluations] Unexpected error:", dbError)
    return { success: false, error: `Failed to restore evaluations: ${dbError.message || "Unknown error"}` }
  }
}
