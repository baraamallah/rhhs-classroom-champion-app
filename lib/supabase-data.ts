import { createClient } from "@/lib/supabase/client"
import { getEvaluationsStatus } from "@/app/actions/evaluation-settings-actions"
import { submitEvaluation as submitEvaluationAction } from "@/app/actions/evaluation-actions"
import {
  createClassroomAction,
  updateClassroomAction,
  deleteClassroomAction,
  bulkUpdateClassroomDivisionsAction
} from "@/app/actions/classroom-actions"
import {
  addChecklistItemAction,
  updateChecklistItemAction,
  deleteChecklistItemAction
} from "@/app/actions/checklist-actions"
import type { Classroom, ChecklistItem, Evaluation, User } from "./types"

// Client-side data functions
export async function getClassrooms(): Promise<Classroom[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("classrooms")
      .select(`
        *,
        classroom_supervisors(
          supervisor_id,
          users!classroom_supervisors_supervisor_id_fkey(id, name, email)
        )
      `)
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("[Database] Error fetching classrooms:", error)
      console.error("[Database] Error details:", JSON.stringify(error, null, 2))
      return []
    }

    // Transform data to flatten the nested structure
    return (data || []).map((classroom: any) => ({
      ...classroom,
      supervisors: classroom.classroom_supervisors?.map((s: any) => s.users).filter(Boolean) || []
    }))
  } catch (error) {
    console.error("[Database] Exception fetching classrooms:", error)
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
      console.error("[Database] Error fetching classrooms by supervisor:", error)
      return []
    }

    return (data || []).map((classroom: any) => ({
      ...classroom,
      supervisors: classroom.classroom_supervisors?.map((s: any) => s.users).filter(Boolean) || []
    }))
  } catch (error) {
    console.error("[Database] Exception fetching classrooms by supervisor:", error)
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
        checklist_item_assignments(
          supervisor_id,
          users!checklist_item_assignments_supervisor_id_fkey(id, name, email)
        )
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[Database] Error fetching checklist items:", error)
      return []
    }

    // Transform data to flatten the nested structure
    return (data || []).map((item: any) => ({
      ...item,
      assigned_supervisors: item.checklist_item_assignments?.map((s: any) => s.users).filter(Boolean) || []
    }))
  } catch (error) {
    console.error("[Database] Exception fetching checklist items:", error)
    return []
  }
}

export async function addChecklistItem(
  title: string,
  description: string,
  points: number,
  category?: string,
  displayOrder?: number,
  _createdBy?: string,
  assignedSupervisorIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  return addChecklistItemAction(title, description, points, category, displayOrder, assignedSupervisorIds)
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
  return updateChecklistItemAction(id, title, description, points, category, displayOrder, isActive, assignedSupervisorIds)
}

export async function deleteChecklistItem(id: string): Promise<{ success: boolean; error?: string }> {
  return deleteChecklistItemAction(id)
}

// Classroom management functions
export async function createClassroom(
  name: string,
  grade: string,
  division: string,
  description: string,
  supervisorIds: string[]
): Promise<{ success: boolean; error?: string }> {
  return createClassroomAction(name, grade, division, description, supervisorIds)
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
  return updateClassroomAction(id, name, grade, division, description, supervisorIds, isActive)
}

export async function bulkUpdateClassroomDivisions(
  classroomIds: string[],
  division: string
): Promise<{ success: boolean; error?: string; updatedCount?: number }> {
  return bulkUpdateClassroomDivisionsAction(classroomIds, division)
}

export async function deleteClassroom(id: string): Promise<{ success: boolean; error?: string }> {
  return deleteClassroomAction(id)
}

// Statistics and analytics functions
export async function submitEvaluation(
  classroomId: string,
  supervisorId: string,
  checkedItemIds: string[],
  totalScore: number,
  maxScore: number,
  evaluationDate?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  return await submitEvaluationAction(
    classroomId,
    supervisorId,
    checkedItemIds,
    totalScore,
    maxScore,
    evaluationDate,
    notes
  )
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
      console.error("[Database] Error fetching evaluations:", error)
      return []
    }

    if (!data) return []

    return data.map((row: any) => ({
      id: row.id,
      classroom_id: row.classroom_id,
      supervisor_id: row.supervisor_id,
      evaluation_date: row.evaluation_date,
      items: row.items || {},
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
    console.error("[Database] Exception fetching evaluations:", error)
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
      console.error("[Database] Error fetching evaluations by supervisor:", error)
      return []
    }

    if (!data) return []

    return data.map((row: any) => ({
      id: row.id,
      classroom_id: row.classroom_id,
      supervisor_id: row.supervisor_id,
      evaluation_date: row.evaluation_date,
      items: row.items || {},
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
    console.error("[Database] Exception fetching evaluations by supervisor:", error)
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
      console.error("[Database] Error fetching evaluations by date range:", error)
      return []
    }

    if (!data) return []

    return data.map((row: any) => ({
      id: row.id,
      classroom_id: row.classroom_id,
      supervisor_id: row.supervisor_id,
      evaluation_date: row.evaluation_date,
      items: row.items || {},
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
    console.error("[Database] Exception fetching evaluations by date range:", error)
    return []
  }
}

export async function getArchivedEvaluationsList(): Promise<Evaluation[]> {
  try {
    const supabase = createClient()
    const { data: archiveData, error } = await supabase
      .from("archive_evaluations")
      .select("id, classroom_id, classroom_name, classroom_grade, classroom_division, supervisor_id, supervisor_name, evaluation_date, total_score, max_score, created_at, archived_at")
      .order("archived_at", { ascending: false })

    if (error) {
      console.error("[Database] Error fetching archive evaluations:", error)
      return []
    }

    if (!archiveData || archiveData.length === 0) return []

    const [{ data: activeRooms }, { data: archiveRooms }, { data: users }] = await Promise.all([
      supabase.from("classrooms").select("id, name, grade, division"),
      supabase.from("archive_classrooms").select("id, name, grade"),
      supabase.from("users").select("id, name, email"),
    ])

    const allRooms = [
      ...(activeRooms || []),
      ...(archiveRooms || []).map((r: any) => ({
        ...r,
        division: r.division || undefined,
      })),
    ]
    const userMap = new Map<string, { id: string; name: string; email?: string }>((users || []).map((u: any) => [u.id, u]))
    const roomMap = new Map<string, { id: string; name: string; grade?: string; division?: any }>(allRooms.map((r: any) => [r.id, r]))

    return archiveData.map((row: any) => {
      const cls = roomMap.get(row.classroom_id)
      const usr = userMap.get(row.supervisor_id)

      const classroomName = row.classroom_name || cls?.name || "Unknown Classroom"
      const classroomGrade = row.classroom_grade || cls?.grade || ""
      const classroomDivision = row.classroom_division || cls?.division
      const supervisorName = row.supervisor_name || usr?.name || "Unknown Supervisor"

      return {
        id: row.id,
        classroom_id: row.classroom_id,
        supervisor_id: row.supervisor_id,
        classroom_name: classroomName,
        classroom_grade: classroomGrade,
        classroom_division: classroomDivision,
        supervisor_name: supervisorName,
        evaluation_date: row.evaluation_date,
        items: row.items || {},
        total_score: row.total_score,
        max_score: row.max_score,
        created_at: row.created_at,
        is_archived: true,
        classroom: {
          name: classroomName,
          grade: classroomGrade,
          division: classroomDivision,
        },
        supervisor: {
          name: supervisorName,
          email: usr?.email ?? "",
        },
      }
    })
  } catch (error) {
    console.error("[Database] Exception fetching archive evaluations:", error)
    return []
  }
}

// Ultra-fast direct query from server aggregation view
export async function getLeaderboardFromDatabaseView(): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("v_live_classroom_leaderboard")
      .select("*")
      .order("total_score", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    const formatted = (data || []).map((row: any) => ({
      classroom: {
        id: row.classroom_id,
        name: row.classroom_name,
        grade: row.classroom_grade,
        division: row.classroom_division,
      },
      totalScore: row.total_score,
      evaluationCount: row.total_evaluations,
      averageScore: row.average_score_pct,
      lastEvaluated: row.last_evaluated_at || "Never",
    }))

    return { success: true, data: formatted }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load view" }
  }
}


