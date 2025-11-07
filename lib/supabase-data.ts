import { createClient } from "@/lib/supabase/client"
import type { Classroom, ChecklistItem, Evaluation, User, AuditLog, SystemSetting } from "./types"

// Client-side data functions
export async function getClassrooms(): Promise<Classroom[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("classrooms")
      .select("*")
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("[v0] Error fetching classrooms:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("[v0] Exception fetching classrooms:", error)
    return []
  }
}

export async function getClassroomsBySupervisor(supervisorId: string): Promise<Classroom[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("classrooms")
      .select("*")
      .eq("supervisor_id", supervisorId)
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("[v0] Error fetching classrooms by supervisor:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("[v0] Exception fetching classrooms by supervisor:", error)
    return []
  }
}

export async function getChecklistItems(): Promise<ChecklistItem[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("checklist_items")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching checklist items:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("[v0] Exception fetching checklist items:", error)
    return []
  }
}

export async function getEvaluations(): Promise<Evaluation[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("evaluations")
      .select(`
        id,
        classroom_id,
        supervisor_id,
        evaluation_date,
        items,
        total_score,
        max_score,
        created_at,
        classrooms:classroom_id (
          name,
          grade
        ),
        users:supervisor_id (
          name,
          email
        )
      `)
      .order("evaluation_date", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching evaluations:", error)
      return []
    }

    if (!data) return []

    return data.map((row: any) => ({
      id: row.id,
      classroom_id: row.classroom_id,
      supervisor_id: row.supervisor_id,
      evaluation_date: row.evaluation_date,
      items: row.items,
      total_score: row.total_score,
      max_score: row.max_score,
      created_at: row.created_at,
      classroom: row.classrooms
        ? {
            name: row.classrooms.name,
            grade: row.classrooms.grade ?? "",
          }
        : undefined,
      supervisor: row.users
        ? {
            name: row.users.name,
            email: row.users.email ?? "",
          }
        : undefined,
    }))
  } catch (error) {
    console.error("[v0] Exception fetching evaluations:", error)
    return []
  }
}

export async function submitEvaluation(
  classroomId: string,
  supervisorId: string,
  checkedItems: Record<string, boolean>,
  totalScore: number,
  maxScore: number,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from("evaluations").insert({
      classroom_id: classroomId,
      supervisor_id: supervisorId,
      items: checkedItems,
      total_score: totalScore,
      max_score: maxScore,
      notes: notes || null,
    })

    if (error) {
      console.error("[v0] Error submitting evaluation:", error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    console.error("[v0] Exception submitting evaluation:", error)
    return { success: false, error: "Failed to submit evaluation" }
  }
}

export async function addChecklistItem(
  title: string,
  description: string,
  points: number,
  category?: string,
  displayOrder?: number,
  createdBy?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("checklist_items").insert({
      title,
      description,
      points,
      category: category || null,
      display_order: displayOrder || 0,
    })

    if (error) {
      console.error("[v0] Error adding checklist item:", error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    console.error("[v0] Exception adding checklist item:", error)
    return { success: false, error: "Failed to add checklist item" }
  }
}

export async function updateChecklistItem(
  id: string,
  title: string,
  description: string,
  points: number,
  category?: string,
  displayOrder?: number,
  isActive?: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const updateData: any = { title, description, points }
    
    if (category !== undefined) updateData.category = category
    if (displayOrder !== undefined) updateData.display_order = displayOrder
    if (isActive !== undefined) updateData.is_active = isActive

    const { error } = await supabase.from("checklist_items").update(updateData).eq("id", id)

    if (error) {
      console.error("[v0] Error updating checklist item:", error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    console.error("[v0] Exception updating checklist item:", error)
    return { success: false, error: "Failed to update checklist item" }
  }
}

export async function deleteChecklistItem(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    // Soft delete by setting is_active to false
    const { error } = await supabase.from("checklist_items").update({ is_active: false }).eq("id", id)

    if (error) {
      console.error("[v0] Error deleting checklist item:", error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    console.error("[v0] Exception deleting checklist item:", error)
    return { success: false, error: "Failed to delete checklist item" }
  }
}

// User management functions
export async function getUsersByCreator(creatorId: string): Promise<User[]> {
  try {
    const supabase = createClient()
    // Simplified query without the foreign key relationship
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("created_by", creatorId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching users by creator:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("[v0] Exception fetching users by creator:", error)
    return []
  }
}

export async function getAllUsers(): Promise<{ success: boolean; data: User[]; error?: string }> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching all users:", error)
      return { success: false, data: [], error: error.message || "Failed to fetch users" }
    }
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Exception fetching all users:", error)
    return { success: false, data: [], error: error?.message || "Failed to fetch users" }
  }
}

// Classroom management functions
export async function createClassroom(
  name: string,
  grade: string,
  description?: string,
  supervisorId?: string,
  createdBy?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("classrooms").insert({
      name,
      grade,
      description: description || null,
      supervisor_id: supervisorId || null,
    })

    if (error) {
      console.error("[v0] Error creating classroom:", error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    console.error("[v0] Exception creating classroom:", error)
    return { success: false, error: "Failed to create classroom" }
  }
}

export async function updateClassroom(
  id: string,
  name: string,
  grade: string,
  description?: string,
  supervisorId?: string,
  isActive?: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const updateData: any = { name, grade }
    
    if (description !== undefined) updateData.description = description
    if (supervisorId !== undefined) updateData.supervisor_id = supervisorId
    if (isActive !== undefined) updateData.is_active = isActive

    const { error } = await supabase.from("classrooms").update(updateData).eq("id", id)

    if (error) {
      console.error("[v0] Error updating classroom:", error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    console.error("[v0] Exception updating classroom:", error)
    return { success: false, error: "Failed to update classroom" }
  }
}

export async function deleteClassroom(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    // Soft delete by setting is_active to false
    const { error } = await supabase.from("classrooms").update({ is_active: false }).eq("id", id)

    if (error) {
      console.error("[v0] Error deleting classroom:", error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    console.error("[v0] Exception deleting classroom:", error)
    return { success: false, error: "Failed to delete classroom" }
  }
}

// Audit and system settings
export async function getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[v0] Error fetching audit logs:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("[v0] Exception fetching audit logs:", error)
    return []
  }
}

export async function getSystemSettings(): Promise<SystemSetting[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching system settings:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("[v0] Exception fetching system settings:", error)
    return []
  }
}

// Statistics and analytics functions
export async function getEvaluationsBySupervisor(supervisorId: string): Promise<Evaluation[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("evaluations")
      .select(`
        id,
        classroom_id,
        supervisor_id,
        evaluation_date,
        items,
        total_score,
        max_score,
        created_at,
        classrooms:classroom_id (
          name,
          grade
        ),
        users:supervisor_id (
          name,
          email
        )
      `)
      .eq("supervisor_id", supervisorId)
      .order("evaluation_date", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching evaluations by supervisor:", error)
      return []
    }

    if (!data) return []

    return data.map((row: any) => ({
      id: row.id,
      classroom_id: row.classroom_id,
      supervisor_id: row.supervisor_id,
      evaluation_date: row.evaluation_date,
      items: row.items,
      total_score: row.total_score,
      max_score: row.max_score,
      created_at: row.created_at,
      classroom: row.classrooms
        ? {
            name: row.classrooms.name,
            grade: row.classrooms.grade ?? "",
          }
        : undefined,
      supervisor: row.users
        ? {
            name: row.users.name,
            email: row.users.email ?? "",
          }
        : undefined,
    }))
  } catch (error) {
    console.error("[v0] Exception fetching evaluations by supervisor:", error)
    return []
  }
}

export async function getEvaluationsByDateRange(startDate: string, endDate: string): Promise<Evaluation[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("evaluations")
      .select(`
        id,
        classroom_id,
        supervisor_id,
        evaluation_date,
        items,
        total_score,
        max_score,
        created_at,
        classrooms:classroom_id (
          name,
          grade
        ),
        users:supervisor_id (
          name,
          email
        )
      `)
      .gte("evaluation_date", startDate)
      .lte("evaluation_date", endDate)
      .order("evaluation_date", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching evaluations by date range:", error)
      return []
    }

    if (!data) return []

    return data.map((row: any) => ({
      id: row.id,
      classroom_id: row.classroom_id,
      supervisor_id: row.supervisor_id,
      evaluation_date: row.evaluation_date,
      items: row.items,
      total_score: row.total_score,
      max_score: row.max_score,
      created_at: row.created_at,
      classroom: row.classrooms
        ? {
            name: row.classrooms.name,
            grade: row.classrooms.grade ?? "",
          }
        : undefined,
      supervisor: row.users
        ? {
            name: row.users.name,
            email: row.users.email ?? "",
          }
        : undefined,
    }))
  } catch (error) {
    console.error("[v0] Exception fetching evaluations by date range:", error)
    return []
  }
}
