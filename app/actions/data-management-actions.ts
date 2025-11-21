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

  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("id", session.userId)
    .single()

  if (userError || !userData) {
    await clearSessionCookie()
    return { error: "Not authenticated" }
  }

  if (!userData.is_active) {
    await clearSessionCookie()
    return { error: "Not authenticated" }
  }

  if (userData.role !== "super_admin") {
    return { error: "Unauthorized: Super admin access required" }
  }

  return { currentUser: { id: userData.id, role: userData.role } }
}

export async function archiveAndReset() {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const supabase = await createClient()

  try {
    // Archive evaluations
    const { data: evaluations, error: evalFetchError } = await supabase.from("evaluations").select("*")

    if (evalFetchError) {
      return { success: false, error: "Failed to fetch evaluations for archiving" }
    }

    if (evaluations && evaluations.length > 0) {
      const { error: archiveEvalError } = await supabase.from("archive_evaluations").insert(evaluations)

      if (archiveEvalError) {
        return { success: false, error: "Failed to archive evaluations" }
      }

      const { error: deleteEvalError } = await supabase.from("evaluations").delete().neq("id", "") // Delete all

      if (deleteEvalError) {
        return { success: false, error: "Failed to delete evaluations" }
      }
    }

    // Archive classrooms
    const { data: classrooms, error: classFetchError } = await supabase.from("classrooms").select("*")

    if (classFetchError) {
      return { success: false, error: "Failed to fetch classrooms for archiving" }
    }

    if (classrooms && classrooms.length > 0) {
      const { error: archiveClassError } = await supabase.from("archive_classrooms").insert(classrooms)

      if (archiveClassError) {
        return { success: false, error: "Failed to archive classrooms" }
      }

      const { error: deleteClassError } = await supabase.from("classrooms").delete().neq("id", "") // Delete all

      if (deleteClassError) {
        return { success: false, error: "Failed to delete classrooms" }
      }
    }

    revalidatePath("/admin")
    return {
      success: true,
      message: `Successfully archived ${evaluations?.length || 0} evaluations and ${classrooms?.length || 0} classrooms. All data has been reset.`,
    }
  } catch (dbError: any) {
    console.error("[data-management-actions] archiveAndReset error", dbError)
    return { success: false, error: "Failed to archive and reset data" }
  }
}

export async function deleteEvaluation(evaluationId: string) {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const supabase = await createClient()

  try {
    const { error: deleteError } = await supabase.from("evaluations").delete().eq("id", evaluationId)

    if (deleteError) {
      console.error("[data-management-actions] deleteEvaluation error", deleteError)
      return { success: false, error: "Failed to delete evaluation" }
    }

    revalidatePath("/admin")
    return { success: true, message: "Evaluation deleted successfully" }
  } catch (dbError: any) {
    console.error("[data-management-actions] deleteEvaluation error", dbError)
    return { success: false, error: "Failed to delete evaluation" }
  }
}

export async function deleteClassroom(classroomId: string) {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error }
  }

  const supabase = await createClient()

  try {
    const { error: deleteEvalsError } = await supabase.from("evaluations").delete().eq("classroom_id", classroomId)

    if (deleteEvalsError) {
      console.error("[data-management-actions] deleteClassroom evaluations error", deleteEvalsError)
      return { success: false, error: "Failed to delete classroom evaluations" }
    }

    const { error: deleteClassError } = await supabase.from("classrooms").delete().eq("id", classroomId)

    if (deleteClassError) {
      console.error("[data-management-actions] deleteClassroom error", deleteClassError)
      return { success: false, error: "Failed to delete classroom" }
    }

    revalidatePath("/admin")
    return { success: true, message: "Classroom and all related evaluations deleted successfully" }
  } catch (dbError: any) {
    console.error("[data-management-actions] deleteClassroom error", dbError)
    return { success: false, error: "Failed to delete classroom" }
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
      .insert(evaluation)
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

  const supabase = await createClient()

  try {
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
      return { success: false, error: "Failed to fetch evaluations", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (dbError: any) {
    console.error("[data-management-actions] getAllEvaluationsForManagement error", dbError)
    return { success: false, error: "Failed to fetch evaluations", data: [] }
  }
}

export async function getArchivedEvaluations() {
  const { currentUser, error } = await requireSuperAdmin()
  if (error || !currentUser) {
    return { success: false, error, data: [] }
  }

  const supabase = await createClient()

  try {
    const { data, error: fetchError } = await supabase
      .from("archive_evaluations")
      .select("*")
      .order("archived_at", { ascending: false })

    if (fetchError) {
      console.error("[data-management-actions] getArchivedEvaluations error", fetchError)
      return { success: false, error: "Failed to fetch archived evaluations", data: [] }
    }

    // Since archive tables don't have relations set up in the same way, we might need to fetch classroom names manually
    // or just return the raw data. For now, let's return raw data.
    // Ideally, we would join with archive_classrooms if we had that data there too.

    return { success: true, data: data || [] }
  } catch (dbError: any) {
    console.error("[data-management-actions] getArchivedEvaluations error", dbError)
    return { success: false, error: "Failed to fetch archived evaluations", data: [] }
  }
}
