"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
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
    // Delete all evaluations for this classroom first
    const { error: deleteEvalsError } = await supabase.from("evaluations").delete().eq("classroom_id", classroomId)

    if (deleteEvalsError) {
      console.error("[data-management-actions] deleteClassroom evaluations error", deleteEvalsError)
      return { success: false, error: "Failed to delete classroom evaluations" }
    }

    // Then delete the classroom
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
