import { createClient } from "@/lib/supabase/client"
import type { Classroom, ChecklistItem, Evaluation, User, AuditLog, SystemSetting } from "./types"

// Client-side data functions
export async function getClassrooms(): Promise<Classroom[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("classrooms")
      .select(`
        *,
        classroom_supervisors!classroom_id(
          supervisor_id,
          users!classroom_supervisors_supervisor_id_fkey(id, name, email)
        )
      `)
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("[v0] Error fetching classrooms:", error)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      return []
    }

    // Transform data to flatten the nested structure
    return (data || []).map((classroom: any) => ({
      ...classroom,
      supervisors: classroom.classroom_supervisors?.map((s: any) => s.users) || []
    }))
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
      .select(`
        *,
        classroom_supervisors!inner(
          supervisor_id,
          users!classroom_supervisors_supervisor_id_fkey(id, name, email)
        )
      `)
      .eq("classroom_supervisors.supervisor_id", supervisorId)
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("[v0] Error fetching classrooms by supervisor:", error)
      return []
    }

    return (data || []).map((classroom: any) => ({
      ...classroom,
      supervisors: classroom.classroom_supervisors?.map((s: any) => s.users) || []
    }))
  } catch (error) {
    console.error("[v0] Exception fetching classrooms by supervisor:", error)
    return []
  }
}

// Checklist items functions
export async function getChecklistItems(): Promise<ChecklistItem[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("checklist_items")
      .select(`
        *,
        checklist_item_assignments!checklist_item_id(
          supervisor_id,
          users!checklist_item_assignments_supervisor_id_fkey(id, name, email)
        )
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching checklist items:", error)
      return []
    }

    // Transform data to flatten the nested structure
    return (data || []).map((item: any) => ({
      ...item,
      assigned_supervisors: item.checklist_item_assignments?.map((s: any) => s.users) || []
    }))
  } catch (error) {
    console.error("[v0] Exception fetching checklist items:", error)
    return []
  }
}

export async function addChecklistItem(
  title: string,
  description: string,
  points: number,
  category?: string,
  displayOrder?: number,
  createdBy?: string,
  assignedSupervisorIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { data: newItem, error } = await supabase.from("checklist_items").insert({
      title,
      description,
      points,
      category: category || null,
      display_order: displayOrder || 0,
    }).select().single()

    if (error) {
      console.error("[v0] Error adding checklist item:", error)
      return { success: false, error: error.message }
    }

    // Insert assignments if any
    if (assignedSupervisorIds && assignedSupervisorIds.length > 0) {
      const assignments = assignedSupervisorIds.map(id => ({
        checklist_item_id: newItem.id,
        supervisor_id: id
      }))

      const { error: assignmentError } = await supabase
        .from("checklist_item_assignments")
        .insert(assignments)

      if (assignmentError) {
        console.error("[v0] Error adding checklist assignments:", assignmentError)
      }
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
  assignedSupervisorIds?: string[]
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

    // Update assignments if provided
    if (assignedSupervisorIds !== undefined) {
      // First delete existing assignments
      await supabase
        .from("checklist_item_assignments")
        .delete()
        .eq("checklist_item_id", id)

      // Then insert new ones
      if (assignedSupervisorIds.length > 0) {
        const assignments = assignedSupervisorIds.map(supId => ({
          checklist_item_id: id,
          supervisor_id: supId
        }))

        const { error: assignmentError } = await supabase
          .from("checklist_item_assignments")
          .insert(assignments)

        if (assignmentError) {
          console.error("[v0] Error updating checklist assignments:", assignmentError)
        }
      }
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
  division: string,
  description: string,
  supervisorIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { data: newClassroom, error } = await supabase.from("classrooms").insert({
      name,
      grade,
      division: division || null,
      description: description || null,
    }).select().single()

    if (error) {
      console.error("[v0] Error creating classroom:", error)
      return { success: false, error: error.message }
    }

    // Insert assignments if any
    if (supervisorIds && supervisorIds.length > 0) {
      const assignments = supervisorIds.map(id => ({
        classroom_id: newClassroom.id,
        supervisor_id: id
      }))

      const { error: assignmentError } = await supabase
        .from("classroom_supervisors")
        .insert(assignments)

      if (assignmentError) {
        console.error("[v0] Error adding classroom supervisors:", assignmentError)
      }
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
  division: string,
  description: string,
  supervisorIds?: string[],
  isActive?: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const updateData: any = { name, grade }

    // Only include division if it's not empty to avoid violating the constraint
    if (division) updateData.division = division

    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.is_active = isActive

    const { error } = await supabase.from("classrooms").update(updateData).eq("id", id)

    if (error) {
      console.error("[v0] Error updating classroom:", error)
      return { success: false, error: error.message }
    }

    // Update assignments if provided
    if (supervisorIds !== undefined) {
      // First delete existing assignments
      await supabase
        .from("classroom_supervisors")
        .delete()
        .eq("classroom_id", id)

      // Then insert new ones
      if (supervisorIds.length > 0) {
        const assignments = supervisorIds.map(supId => ({
          classroom_id: id,
          supervisor_id: supId
        }))

        const { error: assignmentError } = await supabase
          .from("classroom_supervisors")
          .insert(assignments)

        if (assignmentError) {
          console.error("[v0] Error updating classroom supervisors:", assignmentError)
          console.error("[v0] Assignment error details:", JSON.stringify(assignmentError, null, 2))
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Exception updating classroom:", error)
    return { success: false, error: "Failed to update classroom" }
  }
}

export async function bulkUpdateClassroomDivisions(
  classroomIds: string[],
  division: string
): Promise<{ success: boolean; error?: string; updatedCount?: number }> {
  try {
    if (!classroomIds || classroomIds.length === 0) {
      return { success: false, error: "No classrooms selected" }
    }

    const supabase = createClient()
    const updateData: any = {}

    // Only include division if it's not empty to avoid violating the constraint
    if (division) {
      updateData.division = division
    } else {
      updateData.division = null
    }

    const { data, error } = await supabase
      .from("classrooms")
      .update(updateData)
      .in("id", classroomIds)
      .select("id")

    if (error) {
      console.error("[v0] Error bulk updating classroom divisions:", error)
      return { success: false, error: error.message }
    }

    return { success: true, updatedCount: data?.length || 0 }
  } catch (error) {
    console.error("[v0] Exception bulk updating classroom divisions:", error)
    return { success: false, error: "Failed to update classroom divisions" }
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
export async function submitEvaluation(
  classroomId: string,
  supervisorId: string,
  checkedItemIds: string[],
  totalScore: number,
  maxScore: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const itemsMap = checkedItemIds.reduce((acc, id) => {
      acc[id] = true
      return acc
    }, {} as Record<string, boolean>)

    const { error } = await supabase.from("evaluations").insert({
      classroom_id: classroomId,
      supervisor_id: supervisorId,
      items: itemsMap,
      total_score: totalScore,
      max_score: maxScore,
      evaluation_date: new Date().toISOString().split("T")[0],
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
          grade,
          division
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
          division: row.classrooms.division,
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
          grade,
          division
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
          division: row.classrooms.division,
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
          grade,
          division
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
          division: row.classrooms.division,
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
