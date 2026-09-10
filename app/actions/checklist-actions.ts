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

export async function addChecklistItemAction(
  title: string,
  description: string,
  points: number,
  category?: string,
  displayOrder?: number,
  assignedSupervisorIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if (auth.error) {
    return { success: false, error: auth.error }
  }

  try {
    const supabase = await createAdminClient()

    const { data: newItem, error } = await supabase
      .from("checklist_items")
      .insert({
        title,
        description,
        points,
        category: category || "general",
        display_order: displayOrder || 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[checklist-actions] Error adding checklist item:", error)
      return { success: false, error: error.message }
    }

    if (assignedSupervisorIds && assignedSupervisorIds.length > 0) {
      const assignments = assignedSupervisorIds.map((id) => ({
        checklist_item_id: newItem.id,
        supervisor_id: id,
      }))

      const { error: assignmentError } = await supabase
        .from("checklist_item_assignments")
        .insert(assignments)

      if (assignmentError) {
        console.error("[checklist-actions] Error adding checklist assignments:", assignmentError)
      }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("[checklist-actions] Exception adding checklist item:", error)
    return { success: false, error: error?.message || "Failed to add checklist item" }
  }
}

export async function updateChecklistItemAction(
  id: string,
  title: string,
  description: string,
  points: number,
  category?: string,
  displayOrder?: number,
  isActive?: boolean,
  assignedSupervisorIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if (auth.error) {
    return { success: false, error: auth.error }
  }

  try {
    const supabase = await createAdminClient()
    const updateData: any = { title, description, points }

    if (category !== undefined) updateData.category = category
    if (displayOrder !== undefined) updateData.display_order = displayOrder
    if (isActive !== undefined) updateData.is_active = isActive

    const { error } = await supabase.from("checklist_items").update(updateData).eq("id", id)

    if (error) {
      console.error("[checklist-actions] Error updating checklist item:", error)
      return { success: false, error: error.message }
    }

    if (assignedSupervisorIds !== undefined) {
      await supabase.from("checklist_item_assignments").delete().eq("checklist_item_id", id)

      if (assignedSupervisorIds.length > 0) {
        const assignments = assignedSupervisorIds.map((supId) => ({
          checklist_item_id: id,
          supervisor_id: supId,
        }))

        const { error: assignmentError } = await supabase
          .from("checklist_item_assignments")
          .insert(assignments)

        if (assignmentError) {
          console.error("[checklist-actions] Error updating checklist assignments:", assignmentError)
        }
      }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("[checklist-actions] Exception updating checklist item:", error)
    return { success: false, error: error?.message || "Failed to update checklist item" }
  }
}

export async function deleteChecklistItemAction(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin()
  if (auth.error) {
    return { success: false, error: auth.error }
  }

  try {
    const supabase = await createAdminClient()
    const { error } = await supabase.from("checklist_items").update({ is_active: false }).eq("id", id)

    if (error) {
      console.error("[checklist-actions] Error deleting checklist item:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("[checklist-actions] Exception deleting checklist item:", error)
    return { success: false, error: error?.message || "Failed to delete checklist item" }
  }
}
