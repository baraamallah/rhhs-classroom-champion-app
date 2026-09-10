"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { getSessionFromCookies } from "@/lib/auth/session"

async function requireAdmin(): Promise<{ error?: string }> {
  const session = await getSessionFromCookies()
  if (!session) {
    return { error: "Not authenticated" }
  }

  const supabase = await createAdminClient()
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("id", session.userId)
    .single()

  if (userError || !userData || !userData.is_active) {
    return { error: "Not authenticated" }
  }

  if (!["super_admin", "admin"].includes(userData.role)) {
    return { error: "Unauthorized: Admin access required" }
  }

  return {}
}

export async function createClassroomAction(
  name: string,
  grade: string,
  division: string,
  description: string,
  supervisorIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if (auth.error) {
    return { success: false, error: auth.error }
  }

  try {
    const supabase = await createAdminClient()

    const { data: newClassroom, error } = await supabase
      .from("classrooms")
      .insert({
        name,
        grade,
        division: division || null,
        description: description || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[classroom-actions] Error creating classroom:", error)
      return { success: false, error: error.message }
    }

    if (supervisorIds && supervisorIds.length > 0) {
      const assignments = supervisorIds.map((id) => ({
        classroom_id: newClassroom.id,
        supervisor_id: id,
      }))

      const { error: assignmentError } = await supabase
        .from("classroom_supervisors")
        .insert(assignments)

      if (assignmentError) {
        console.error("[classroom-actions] Error adding classroom supervisors:", assignmentError)
      }
    }

    revalidatePath("/admin")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("[classroom-actions] Exception creating classroom:", error)
    return { success: false, error: error?.message || "Failed to create classroom" }
  }
}

export async function updateClassroomAction(
  id: string,
  name: string,
  grade: string,
  division: string,
  description: string,
  supervisorIds?: string[],
  isActive?: boolean
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if (auth.error) {
    return { success: false, error: auth.error }
  }

  try {
    const supabase = await createAdminClient()
    const updateData: any = { name, grade }

    if (division) updateData.division = division
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.is_active = isActive

    const { error } = await supabase.from("classrooms").update(updateData).eq("id", id)

    if (error) {
      console.error("[classroom-actions] Error updating classroom:", error)
      return { success: false, error: error.message }
    }

    if (supervisorIds !== undefined) {
      await supabase.from("classroom_supervisors").delete().eq("classroom_id", id)

      if (supervisorIds.length > 0) {
        const assignments = supervisorIds.map((supId) => ({
          classroom_id: id,
          supervisor_id: supId,
        }))

        const { error: assignmentError } = await supabase
          .from("classroom_supervisors")
          .insert(assignments)

        if (assignmentError) {
          console.error("[classroom-actions] Error updating classroom supervisors:", assignmentError)
        }
      }
    }

    revalidatePath("/admin")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("[classroom-actions] Exception updating classroom:", error)
    return { success: false, error: error?.message || "Failed to update classroom" }
  }
}

export async function bulkUpdateClassroomDivisionsAction(
  classroomIds: string[],
  division: string
): Promise<{ success: boolean; error?: string; updatedCount?: number }> {
  const auth = await requireAdmin()
  if (auth.error) {
    return { success: false, error: auth.error }
  }

  try {
    if (!classroomIds || classroomIds.length === 0) {
      return { success: false, error: "No classrooms selected" }
    }

    const supabase = await createAdminClient()
    const updateData: any = {
      division: division || null,
    }

    const { data, error } = await supabase
      .from("classrooms")
      .update(updateData)
      .in("id", classroomIds)
      .select("id")

    if (error) {
      console.error("[classroom-actions] Error bulk updating divisions:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    revalidatePath("/")
    return { success: true, updatedCount: data?.length || 0 }
  } catch (error: any) {
    console.error("[classroom-actions] Exception bulk updating divisions:", error)
    return { success: false, error: error?.message || "Failed to update classroom divisions" }
  }
}

export async function deleteClassroomAction(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if (auth.error) {
    return { success: false, error: auth.error }
  }

  try {
    const supabase = await createAdminClient()
    const { error } = await supabase.from("classrooms").update({ is_active: false }).eq("id", id)

    if (error) {
      console.error("[classroom-actions] Error deleting classroom:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("[classroom-actions] Exception deleting classroom:", error)
    return { success: false, error: error?.message || "Failed to delete classroom" }
  }
}
